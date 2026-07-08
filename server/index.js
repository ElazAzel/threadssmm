import express from 'express'
import cors from 'cors'
import pg from 'pg'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'

const { Pool } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const JWT_SECRET = 'v4QD3IRkJ0CnZOUMbgwiNuzx5pfraKET8hyqsYG2Hdmj1WBS'
const PORT = 54321

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  database: 'supabase_local_dev',
})

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))

function getJwtUser(token) {
  try { return jwt.verify(token.replace('Bearer ', ''), JWT_SECRET) } catch { return null }
}

async function execQuery(sql, params = []) {
  const client = await pool.connect()
  try {
    const result = await client.query(sql, params)
    return { data: result.rows, error: null }
  } catch (err) {
    return { data: null, error: err.message }
  } finally { client.release() }
}

async function execRPC(fnName, args) {
  const keys = Object.keys(args)
  const params = Object.values(args)
  const placeholders = keys.map((k, i) => `$${i + 1}`).join(', ')
  const sql = `SELECT * FROM public.${fnName}(${placeholders})`
  return execQuery(sql, params)
}

// ===== Auth endpoints =====
app.post('/auth/v1/token', async (req, res) => {
  const { grant_type, email, password } = req.body
  if (grant_type !== 'password') return res.status(400).json({ error: 'unsupported_grant_type' })
  const { data: users } = await execQuery("SELECT * FROM auth.users WHERE email = $1 AND deleted_at IS NULL", [email])
  const user = users?.[0]
  if (!user) return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid email or password' })
  const valid = await bcrypt.compare(password, user.encrypted_password)
  if (!valid) return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid email or password' })
  const claims = { sub: user.id, email: user.email, aud: 'authenticated', role: 'authenticated', user_metadata: user.raw_user_meta_data }
  const access_token = jwt.sign(claims, JWT_SECRET, { expiresIn: '360h' })
  res.json({ access_token, token_type: 'bearer', expires_in: 1296000, user: { id: user.id, aud: 'authenticated', email: user.email, created_at: user.created_at, user_metadata: user.raw_user_meta_data } })
})

app.post('/auth/v1/signup', async (req, res) => {
  const { email, password, options } = req.body
  const existing = await execQuery("SELECT id FROM auth.users WHERE email = $1", [email])
  if (existing.data?.length) return res.status(400).json({ error: 'user_exists', error_description: 'User already exists' })
  const hash = await bcrypt.hash(password, 10)
  const id = randomUUID()
  const meta = options?.data ? JSON.stringify(options.data) : '{}'
  await execQuery("INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, created_at, updated_at) VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW())", [id, email, hash, meta])
  const claims = { sub: id, email, aud: 'authenticated', role: 'authenticated', user_metadata: options?.data || {} }
  const access_token = jwt.sign(claims, JWT_SECRET, { expiresIn: '360h' })
  res.json({ access_token, token_type: 'bearer', expires_in: 1296000, user: { id, aud: 'authenticated', email, created_at: new Date().toISOString(), user_metadata: options?.data || {} } })
})

app.get('/auth/v1/user', async (req, res) => {
  const user = getJwtUser(req.headers.authorization)
  if (!user) return res.status(401).json({ error: 'unauthorized' })
  const { data: users } = await execQuery("SELECT * FROM auth.users WHERE id = $1", [user.sub])
  if (!users?.length) return res.status(401).json({ error: 'user_not_found' })
  const u = users[0]
  res.json({ id: u.id, aud: 'authenticated', email: u.email, created_at: u.created_at, user_metadata: u.raw_user_meta_data })
})

app.post('/auth/v1/logout', (_req, res) => res.json({}))

// ===== RPC endpoints (must be before generic :table routes) =====
app.post('/rest/v1/rpc/:fn', async (req, res) => {
  const { fn } = req.params
  let result
  const rpcs = {
    create_workspace_with_defaults: () => execRPC(fn, {
      p_name: req.body.p_name, p_slug: req.body.p_slug, p_region: req.body.p_region,
      p_locale: req.body.p_locale, p_timezone: req.body.p_timezone, p_brand_name: req.body.p_brand_name,
      p_niche: req.body.p_niche, p_audience: req.body.p_audience, p_goal: req.body.p_goal,
      p_threads_username: req.body.p_threads_username || null,
    }),
    request_draft_approval: () => execRPC(fn, { p_draft_id: req.body.p_draft_id, p_reason: req.body.p_reason || '' }),
    review_draft_approval: () => execRPC(fn, { p_approval_id: req.body.p_approval_id, p_status: req.body.p_status, p_note: req.body.p_note || '' }),
    store_threads_token: () => execRPC(fn, { p_account_id: req.body.p_account_id, p_access_token: req.body.p_access_token, p_expires_at: req.body.p_expires_at }),
    get_threads_token: () => execRPC(fn, { p_account_id: req.body.p_account_id }),
  }
  result = rpcs[fn] ? await rpcs[fn]() : await execRPC(fn, req.body)
  if (result.error) return res.status(400).json(result)
  res.json(result.data)
})

// ===== REST endpoints =====
app.get('/rest/v1/:table', async (req, res) => {
  const { table } = req.params
  const select = req.query.select || '*'
  const order = req.query.order || 'created_at'
  const limit = req.query.limit ? parseInt(req.query.limit) : null
  const conditions = []; const params = []; let idx = 1
  for (const [key, val] of Object.entries(req.query)) {
    if (['select', 'order', 'limit', 'offset'].includes(key)) continue
    conditions.push(`${key} = $${idx}`); params.push(val); idx++
  }
  let sql = `SELECT ${select} FROM public.${table}`
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ')
  if (order) sql += ` ORDER BY ${order}`
  if (limit) sql += ` LIMIT ${limit}`
  const r = await execQuery(sql, params)
  if (r.error) return res.status(400).json(r)
  res.json(r.data)
})

app.post('/rest/v1/:table', async (req, res) => {
  const { table } = req.params
  const body = req.body
  const keys = Object.keys(body).filter(k => k !== 'id')
  const vals = keys.map(k => body[k])
  const sql = `INSERT INTO public.${table} (${keys.join(', ')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`
  const r = await execQuery(sql, vals)
  if (r.error) return res.status(400).json(r)
  res.status(201).json(Array.isArray(r.data) ? r.data : [r.data])
})

app.patch('/rest/v1/:table', async (req, res) => {
  const { table } = req.params
  const body = req.body
  const keys = Object.keys(body)
  const vals = keys.map(k => body[k])
  const idVal = req.query.id
  const sql = idVal
    ? `UPDATE public.${table} SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(', ')} WHERE id = '${idVal}' RETURNING *`
    : `UPDATE public.${table} SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(', ')} RETURNING *`
  const r = await execQuery(sql, vals)
  if (r.error) return res.status(400).json(r)
  res.json(r.data)
})

app.delete('/rest/v1/:table', async (req, res) => {
  const { table } = req.params
  const idVal = req.query.id
  const sql = idVal ? `DELETE FROM public.${table} WHERE id = '${idVal}' RETURNING *` : `DELETE FROM public.${table} RETURNING *`
  const r = await execQuery(sql)
  if (r.error) return res.status(400).json(r)
  res.json(r.data)
})

// ===== Storage =====
const storageDir = path.join(__dirname, '..', 'storage')
if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true })
const upload = multer({ dest: storageDir, limits: { fileSize: 50 * 1024 * 1024 } })

function parseStoragePath(req, _res, next) {
  const fullUrl = req.path
  const match = fullUrl.match(/\/storage\/v1\/(object|sign)\/([^/]+)\/?(.*)/)
  if (match) {
    req.storageBucket = match[2]
    req.storagePath = match[3] || ''
  }
  next()
}

app.use('/storage/v1', parseStoragePath)

app.post('/storage/v1/object/upload', upload.single('file'), async (req, res) => {
  const file = req.file
  if (!file) return res.status(400).json({ error: 'No file uploaded' })
  const bucket = req.body.bucket || 'media-assets'
  const filePath = req.body.path || file.originalname
  const destPath = path.join(storageDir, bucket, filePath)
  fs.mkdirSync(path.dirname(destPath), { recursive: true })
  fs.renameSync(file.path, destPath)
  res.json({ Key: filePath })
})

// GET /storage/v1/object/:bucket/:path
app.get(/^\/storage\/v1\/object\/([^/]+)\/(.+)/, async (req, res) => {
  const bucket = req.params[0]
  const filePath = req.params[1]
  const fullPath = path.join(storageDir, bucket, filePath)
  if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'Not found' })
  res.sendFile(fullPath)
})

// POST /storage/v1/object/:bucket/:path (upload)
app.post(/^\/storage\/v1\/object\/([^/]+)\/(.+)/, upload.single('file'), async (req, res) => {
  const bucket = req.params[0]
  const filePath = req.params[1]
  const file = req.file || (!req.is('multipart/form-data') ? null : null)
  if (file) {
    const destPath = path.join(storageDir, bucket, filePath)
    fs.mkdirSync(path.dirname(destPath), { recursive: true })
    fs.renameSync(file.path, destPath)
  }
  res.json({ Key: filePath })
})

// POST /storage/v1/object/sign/:bucket/:path
app.post(/^\/storage\/v1\/object\/sign\/([^/]+)\/(.+)/, async (req, res) => {
  const bucket = req.params[0]
  const filePath = req.params[1]
  res.json({ signedURL: `/storage/v1/object/${bucket}/${filePath}` })
})

// POST /storage/v1/object/:bucket (create signed URL)
app.post('/storage/v1/object/:bucket', async (req, res) => {
  const { path: filePath } = req.body
  res.json({ signedURL: `/storage/v1/object/${req.params.bucket}/${filePath}` })
})

// GET /storage/v1/object/:bucket (list)
app.get('/storage/v1/object/:bucket', async (req, res) => {
  const dir = path.join(storageDir, req.params.bucket)
  if (!fs.existsSync(dir)) return res.json([])
  const items = fs.readdirSync(dir, { recursive: true }).map(name => ({ name }))
  res.json(items)
})

// ===== Start =====
app.listen(PORT, async () => {
  console.log(`Supabase-compatible server running on http://127.0.0.1:${PORT}`)
  try {
    await pool.query(`create or replace function auth.uid() returns uuid language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid; $$;`)
  } catch {}
  console.log('Database connected')
})
