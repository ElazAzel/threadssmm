import { useEffect, useRef, useState, useCallback } from 'react'
import { BarChart3, Bot, Check, Copy, Download, Eye, FileText, Image as ImageIcon, Sparkles, Trash2, Upload } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge, Button, Card, Progress, SectionTitle, Spinner } from '../components/ui'
import { mediaAssets } from '../data'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { authenticatedJson } from '../lib/api'
import { generateHtmlReport, downloadPdfReport, buildReportData } from '../lib/pdf-export'
import { calculateBestTime, getDefaultBestTime, formatBestTimeSuggestion, type BestTimeResult } from '../lib/best-time'
import { PLANS, TOKEN_PACKS } from '../lib/pricing'
import { AI_MODELS } from '../lib/ai-models'

export function AnalyticsPage() {
  const { getAccessToken } = useAuth()
  const { demo } = useAuth()
  const { workspace, drafts } = useWorkspace()
  const [period, setPeriod] = useState('7d')
  const [notice, setNotice] = useState('')
  const [analyticsData, setAnalyticsData] = useState<{
    totalViews: number; totalLikes: number; totalReplies: number; totalReposts: number; totalQuotes: number;
    engagementRate: number; postsCount: number; avgViews: number; avgLikes: number;
    daily: Array<{ views: number; likes: number; periodStart: string }>;
    topPost: { title: string; views: number } | null;
  } | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [reportFormat, setReportFormat] = useState<'csv' | 'pdf'>('csv')

  const fetchAnalytics = useCallback(async () => {
    if (demo || !workspace) return
    setLoadingAnalytics(true)
    try {
      const data = await authenticatedJson(getAccessToken, '/api/analytics/threads', { workspaceId: workspace.id, period })
      setAnalyticsData(data as typeof analyticsData)
    } catch {
      setNotice('РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ Р°РЅР°Р»РёС‚РёРєСѓ вЂ” РёСЃРїРѕР»СЊР·СѓРµРј РґРµРјРѕ-РґР°РЅРЅС‹Рµ')
    } finally {
      setLoadingAnalytics(false)
    }
  }, [getAccessToken, workspace, period, demo])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  const published = drafts.filter((draft) => draft.status === 'published')
  const failed = drafts.filter((draft) => draft.status === 'failed')
  const pendingApproval = drafts.filter((draft) => draft.status === 'pending_approval')
  const scheduled = drafts.filter((draft) => draft.status === 'scheduled')
  const retrying = drafts.filter((d) => d.status === 'failed' && d.error_message?.includes('РџРѕРІС‚РѕСЂ'))

  const totalViews = analyticsData?.totalViews ?? (demo ? 1200000 : published.length * 50)
  const totalLikes = analyticsData?.totalLikes ?? (demo ? 45000 : 0)
  const engagementRate = analyticsData?.engagementRate ?? (demo ? 4.8 : 0)
  const daily = analyticsData?.daily ?? (demo ? [{ views: 38000, likes: 1450, periodStart: '2026-07-03' }, { views: 52000, likes: 2100, periodStart: '2026-07-04' }, { views: 34000, likes: 980, periodStart: '2026-07-05' }, { views: 65000, likes: 3100, periodStart: '2026-07-06' }, { views: 47000, likes: 1800, periodStart: '2026-07-07' }, { views: 61000, likes: 2400, periodStart: '2026-07-08' }, { views: 86000, likes: 4200, periodStart: '2026-07-09' }] : [])

  const maxViews = Math.max(...daily.map((d) => d.views), 1)

  const bestTime: BestTimeResult = demo ? getDefaultBestTime() : calculateBestTime(published.map((d) => ({
    hour: new Date(d.published_at ?? Date.now()).getHours(),
    dayOfWeek: new Date(d.published_at ?? Date.now()).getDay(),
  })))

  const exportReport = (format: 'csv' | 'pdf' = 'csv') => {
    if (format === 'pdf') {
      const data = buildReportData(drafts, workspace?.name ?? 'Workspace', period === '7d' ? '7 РґРЅРµР№' : period === '30d' ? '30 РґРЅРµР№' : '90 РґРЅРµР№')
      const html = generateHtmlReport(data)
      downloadPdfReport(html, `threads-report-${new Date().toISOString().slice(0, 10)}`)
      setNotice('HTML-РѕС‚С‡С‘С‚ СЃРєР°С‡Р°РЅ (РѕС‚РєСЂРѕР№С‚Рµ РІ Р±СЂР°СѓР·РµСЂРµ в†’ РџРµС‡Р°С‚СЊ в†’ РЎРѕС…СЂР°РЅРёС‚СЊ РєР°Рє PDF)')
    } else {
      const rows = [['РќР°Р·РІР°РЅРёРµ', 'РЎС‚Р°С‚СѓСЃ', 'Р—Р°РїР»Р°РЅРёСЂРѕРІР°РЅРѕ', 'РћРїСѓР±Р»РёРєРѕРІР°РЅРѕ'], ...drafts.map((draft) => [draft.title, draft.status, draft.scheduled_at ?? '', draft.published_at ?? ''])]
      const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
      const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'threads-smm-report.csv'
      anchor.click()
      URL.revokeObjectURL(url)
      setNotice('CSV-РѕС‚С‡С‘С‚ СЃРєР°С‡Р°РЅ')
    }
    window.setTimeout(() => setNotice(''), 2400)
  }

  if (loadingAnalytics && !demo && !analyticsData) return (
    <AppShell title="РћР±Р·РѕСЂ Р°РЅР°Р»РёС‚РёРєРё">
      <div className="page-content"><Spinner /></div>
    </AppShell>
  )

  return (
    <AppShell title="РћР±Р·РѕСЂ Р°РЅР°Р»РёС‚РёРєРё">
      {loadingAnalytics && <div className="toast" style={{ position: 'static', marginBottom: '0.5rem' }}>Р—Р°РіСЂСѓР·РєР° РґР°РЅРЅС‹С… Р°РЅР°Р»РёС‚РёРєРё...</div>}
      <div className="analytics-toolbar">
        <div className="segmented">
          {[['7d', '7Р”'], ['30d', '30Р”'], ['90d', '90Р”']].map(([value, label]) => (
            <button key={value} className={period === value ? 'active' : ''} onClick={() => setPeriod(value)}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="segmented" style={{ margin: 0 }}>
            <button className={reportFormat === 'csv' ? 'active' : ''} onClick={() => setReportFormat('csv')}>CSV</button>
            <button className={reportFormat === 'pdf' ? 'active' : ''} onClick={() => setReportFormat('pdf')}>PDF</button>
          </div>
          <Button variant="secondary" onClick={() => exportReport(reportFormat)}><Download size={17} /> Р­РєСЃРїРѕСЂС‚</Button>
          {!demo && <Button variant="secondary" onClick={fetchAnalytics} disabled={loadingAnalytics}>РћР±РЅРѕРІРёС‚СЊ</Button>}
        </div>
      </div>

      <div className="metric-grid analytics-metrics">
        <Card className="metric-card"><span>Р’СЃРµРіРѕ С‡РµСЂРЅРѕРІРёРєРѕРІ <FileText /></span><strong>{demo ? 342 : drafts.length}</strong></Card>
        <Card className="metric-card"><span>РћРїСѓР±Р»РёРєРѕРІР°РЅРѕ <BarChart3 /></span><strong>{demo ? '4.8%' : published.length}</strong></Card>
        <Card className="metric-card"><span>РџСЂРѕСЃРјРѕС‚СЂС‹ <Eye /></span><strong>{totalViews.toLocaleString('ru-RU')}</strong></Card>
        <Card className="metric-card"><span>Р’РѕРІР»РµС‡С‘РЅРЅРѕСЃС‚СЊ <Sparkles /></span><strong>{engagementRate}%</strong></Card>
        <Card className="metric-card"><span>AI-РєСЂРµРґРёС‚С‹ <Sparkles /></span><strong>{workspace?.ai_credits ?? 0} <small>/200</small></strong><Progress value={Math.min(100, ((workspace?.ai_credits ?? 0) / 200) * 100)} /></Card>
        <Card className="metric-card" style={{ gridColumn: 'span 2' }}>
          <span>вЏ° Р›СѓС‡С€РµРµ РІСЂРµРјСЏ РїСѓР±Р»РёРєР°С†РёРё</span>
          <strong style={{ fontSize: '0.95rem' }}>{formatBestTimeSuggestion(bestTime)}</strong>
          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.3rem' }}>
            {bestTime.slots.slice(0, 5).map((slot, i) => (
              <span key={i} style={{
                flex: 1, height: `${Math.max(4, (slot.score / Math.max(...bestTime.slots.map(s => s.score), 1)) * 24)}px`,
                background: i === 0 ? 'var(--accent)' : '#333', borderRadius: 3, minWidth: 16,
                position: 'relative',
              }} title={`Р”РµРЅСЊ ${slot.dayOfWeek}, ${slot.hour}:00 вЂ” score: ${Math.round(slot.score)}`} />
            ))}
          </div>
        </Card>
      </div>

      <div className="analytics-layout">
        <div>
          <Card className="chart-card">
            <SectionTitle title="РђРєС‚РёРІРЅРѕСЃС‚СЊ РїСѓР±Р»РёРєР°С†РёР№" />
            <div className="bar-chart">
              {daily.map((d, i) => (
                <span key={d.periodStart} className={i === daily.length - 1 ? 'active' : ''} style={{ height: `${Math.max(3, (d.views / maxViews) * 100)}%` }} title={`${d.periodStart}: ${d.views.toLocaleString('ru-RU')} РїСЂРѕСЃРјРѕС‚СЂРѕРІ`} />
              ))}
            </div>
          </Card>
          <div className="analytics-lower">
            <Card>
              <SectionTitle title="РЎС‚Р°С‚СѓСЃС‹" />
              {[
                ['Р§РµСЂРЅРѕРІРёРєРё', drafts.filter((d) => d.status === 'draft').length, 'var(--accent)'],
                ['РќР° СЃРѕРіР»Р°СЃРѕРІР°РЅРёРё', pendingApproval.length, '#f59e0b'],
                ['Р—Р°РїР»Р°РЅРёСЂРѕРІР°РЅРѕ', scheduled.length, '#3b82f6'],
                ['РћРїСѓР±Р»РёРєРѕРІР°РЅРѕ', published.length, '#22c55e'],
                ['РћС€РёР±РєР°', failed.length, '#ef4444'],
              ].map(([label, value, color]) => (
                <div className="topic-progress" key={label as string}>
                  <span>{label}<b>{value as number}</b></span>
                  <Progress value={drafts.length ? ((value as number) / drafts.length) * 100 : 0} tone={(color as string) === '#22c55e' ? 'green' : (color as string) === '#ef4444' ? 'orange' : 'blue'} />
                </div>
              ))}
            </Card>
            <Card>
              <SectionTitle title="Р”Р°РЅРЅС‹Рµ Meta" />
              <p>{demo ? 'Р’ РґРµРјРѕ РїРѕРєР°Р·Р°РЅС‹ РїСЂРёРјРµСЂРЅС‹Рµ РіСЂР°С„РёРєРё.' : (analyticsData ? `Р—Р°РіСЂСѓР·РєР° РґР°РЅРЅС‹С… Р·Р° ${period} РёР· Threads Insights API` : 'РџСЂРѕСЃРјРѕС‚СЂС‹ Рё РІРѕРІР»РµС‡С‘РЅРЅРѕСЃС‚СЊ РїРѕСЏРІСЏС‚СЃСЏ РїРѕСЃР»Рµ РїРѕРґРєР»СЋС‡РµРЅРёСЏ Threads Insights Рё РїРµСЂРІРѕР№ РїСѓР±Р»РёРєР°С†РёРё.')}</p>
            </Card>
          </div>
        </div>
        <Card className="ai-insights">
          <SectionTitle icon={<Bot />} title="РЎРѕСЃС‚РѕСЏРЅРёРµ РєРѕРЅС‚РµРЅС‚Р°" />
          {published.length > 0 && <div className="insight-note success"><b>Р“РѕС‚РѕРІРѕ</b><p>{published.length} РїСѓР±Р»РёРєР°С†РёР№ РѕС‚РїСЂР°РІР»РµРЅРѕ РІ Threads. {totalLikes > 0 ? `Р’СЃРµРіРѕ Р»Р°Р№РєРѕРІ: ${totalLikes.toLocaleString('ru-RU')}` : ''}</p></div>}
          {failed.length > 0 && (
            <div className="insight-note danger">
              <b>РўСЂРµР±СѓРµС‚ РІРЅРёРјР°РЅРёСЏ</b>
              <p>{failed.length} РїСѓР±Р»РёРєР°С†РёР№ СЃ РѕС€РёР±РєРѕР№. {retrying.length > 0 ? `${retrying.length} РІ РѕС‡РµСЂРµРґРё РЅР° РїРѕРІС‚РѕСЂ.` : ''}</p>
            </div>
          )}
          {retrying.length > 0 && <div className="insight-note warn"><b>РџРѕРІС‚РѕСЂС‹</b><p>{retrying.length} РїСѓР±Р»РёРєР°С†РёР№ РѕР¶РёРґР°СЋС‚ РїРѕРІС‚РѕСЂРЅРѕР№ РѕС‚РїСЂР°РІРєРё (С‡РµСЂРµР· 1вЂ“15 РјРёРЅ.)</p></div>}
          <div className="insight-note next"><b>РЎР»РµРґСѓСЋС‰РёР№ С€Р°Рі</b><p>{drafts.length ? `РџСЂРѕРІРµСЂСЊС‚Рµ РѕС‡РµСЂРµРґСЊ СЃРѕРіР»Р°СЃРѕРІР°РЅРёР№ (${pendingApproval.length}) Рё СЂР°СЃРїРёСЃР°РЅРёРµ (${scheduled.length}).` : 'РЎРѕР·РґР°Р№С‚Рµ РїРµСЂРІС‹Р№ С‡РµСЂРЅРѕРІРёРє РІ AI Studio.'}</p></div>
        </Card>
      </div>

      <Card className="table-wrap">
        <SectionTitle title="РџСѓР±Р»РёРєР°С†РёРё" />
        {drafts.length ? (
          <table>
            <thead><tr><th>РџСѓР±Р»РёРєР°С†РёСЏ</th><th>Р¤РѕСЂРјР°С‚</th><th>Р”Р°С‚Р°</th><th>Threads ID</th><th>РЎС‚Р°С‚СѓСЃ</th></tr></thead>
            <tbody>
              {drafts.slice(0, 20).map((draft) => (
                <tr key={draft.id}>
                  <td><b>{draft.title || 'Р‘РµР· РЅР°Р·РІР°РЅРёСЏ'}</b></td>
                  <td>{draft.format}</td>
                  <td>{new Date(draft.published_at || draft.scheduled_at || draft.created_at).toLocaleString('ru-RU')}</td>
                  <td>{draft.threads_post_id || 'вЂ”'}</td>
                  <td>
                    <Badge tone={draft.status === 'published' ? 'green' : draft.status === 'failed' ? 'red' : draft.status === 'scheduled' ? 'blue' : draft.status === 'draft' ? 'neutral' : 'orange'}>
                      {draft.error_message?.includes('РџРѕРІС‚РѕСЂ') ? 'РїРѕРІС‚РѕСЂ...' : draft.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty-state"><h2>Р”Р°РЅРЅС‹С… РїРѕРєР° РЅРµС‚</h2><p>РђРЅР°Р»РёС‚РёРєР° РЅР°С‡РЅС‘С‚ Р·Р°РїРѕР»РЅСЏС‚СЊСЃСЏ РїРѕСЃР»Рµ СЃРѕР·РґР°РЅРёСЏ Рё РїСѓР±Р»РёРєР°С†РёРё РєРѕРЅС‚РµРЅС‚Р°.</p></div>}
      </Card>
      {notice ? <div className="toast">{notice}</div> : null}
    </AppShell>
  )
}

export function MediaPage() {
  const { demo } = useAuth()
  const { mediaAssets: storedAssets, brands, uploadMedia, deleteMedia } = useWorkspace()
  const assets = demo ? mediaAssets.map((item) => ({ id: String(item.id), title: item.title, url: item.image, prompt: item.prompt, created_at: new Date().toISOString(), mime_type: 'image/png', size_bytes: 0, storage_path: '', workspace_id: '', brand_id: null, created_by: '', width: 1024, height: 1024, source: 'demo', metadata: {} })) : storedAssets
  const [selectedId, setSelectedId] = useState<string | null>(assets[0]?.id ?? null)
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState('')
  const [brandId] = useState(brands[0]?.id ?? '')
  const fileInput = useRef<HTMLInputElement>(null)
  const selected = assets.find((item) => item.id === selectedId)
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const asset = await uploadMedia(file, undefined, brandId || null)
      setSelectedId(asset.id)
      setNotice('Р¤Р°Р№Р» Р·Р°РіСЂСѓР¶РµРЅ')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё')
    } finally {
      setUploading(false); window.setTimeout(() => setNotice(''), 2800)
    }
  }
  const handleDelete = async () => {
    if (!selected) return
    try {
      await deleteMedia(selected)
      setSelectedId(assets.find((item) => item.id !== selected.id)?.id ?? null)
      setNotice('Р¤Р°Р№Р» СѓРґР°Р»С‘РЅ')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'РћС€РёР±РєР° СѓРґР°Р»РµРЅРёСЏ')
    }
    window.setTimeout(() => setNotice(''), 2800)
  }
  return (
    <AppShell title="РњРµРґРёР°С‚РµРєР°">
      <div className="media-layout">
        <div className="media-grid">
          <Card className="media-upload" onClick={() => fileInput.current?.click()} role="button" tabIndex={0}>
            <Upload size={28} /><p>Р—Р°РіСЂСѓР·РёС‚СЊ</p><small>PNG, JPG, GIF, MP4</small>
            <input ref={fileInput} type="file" hidden accept="image/png,image/jpeg,image/gif,video/mp4" onChange={handleUpload} disabled={uploading} />
          </Card>
          {assets.map((item) => (
            <div key={item.id} className={`media-thumb ${selectedId === item.id ? 'selected' : ''}`} onClick={() => setSelectedId(item.id)} role="button" tabIndex={0}>
              {item.mime_type.startsWith('video/') ? <span className="media-play-icon">в–¶</span> : null}
              <img src={item.url} alt={item.title} loading="lazy" />
            </div>
          ))}
        </div>
        <Card className="media-detail">
          {selected ? <>
            {selected.mime_type.startsWith('video/') ? <div className="detail-video"><span>в–¶</span><p>{selected.mime_type}</p></div> : <img src={selected.url} alt={selected.title} />}
            <h2>{selected.title}</h2>
            <div className="media-meta">
              <span>РўРёРї: {selected.mime_type}</span>
              <span>Р Р°Р·РјРµСЂ: {selected.size_bytes > 1048576 ? `${(selected.size_bytes / 1048576).toFixed(1)} РњР‘` : `${(selected.size_bytes / 1024).toFixed(0)} РљР‘`}</span>
              {selected.width ? <span>{selected.width}Г—{selected.height}</span> : null}
              <span>{new Date(selected.created_at).toLocaleString('ru-RU')}</span>
            </div>
            {selected.prompt ? <p className="media-prompt"><small>РСЃС‚РѕС‡РЅРёРє: {selected.source} вЂ” {selected.prompt}</small></p> : null}
            <div className="media-actions">
              <Button variant="secondary" onClick={() => { void navigator.clipboard.writeText(selected.url); setCopied(true); window.setTimeout(() => setCopied(false), 1800) }}><Copy size={16} />{copied ? 'РЎРєРѕРїРёСЂРѕРІР°РЅРѕ' : 'URL'}</Button>
              <Button variant="secondary" disabled><Download size={16} /> РЎРєР°С‡Р°С‚СЊ</Button>
              <Button variant="secondary" onClick={handleDelete}><Trash2 size={16} /> РЈРґР°Р»РёС‚СЊ</Button>
            </div>
          </> : <div className="empty-state"><ImageIcon size={48} /><h2>Р’С‹Р±РµСЂРёС‚Рµ С„Р°Р№Р»</h2></div>}
        </Card>
      </div>
      {notice ? <div className="toast">{notice}</div> : null}
    </AppShell>
  )
}

export function BillingPage() {
  const { workspace } = useWorkspace()
  const { getAccessToken, demo } = useAuth()
  const [loading, setLoading] = useState('')
  const [notice, setNotice] = useState('')

  const subscribe = async (planId: string) => {
    if (!workspace) return
    if (demo) { setNotice('Р”РµРјРѕ-СЂРµР¶РёРј: РїР»Р°С‚РµР¶Рё РѕС‚РєР»СЋС‡РµРЅС‹'); window.setTimeout(() => setNotice(''), 3500); return }
    setLoading(planId)
    try {
      const payload = await authenticatedJson<{ url: string }>(getAccessToken, '/api/billing/create-checkout', {
        workspaceId: workspace.id, planId,
      })
      window.location.assign(payload.url)
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'РћС€РёР±РєР° РїРѕРґРєР»СЋС‡РµРЅРёСЏ РїР»Р°С‚РµР¶РµР№')
    } finally {
      setLoading('')
      window.setTimeout(() => setNotice(''), 3500)
    }
  }

  return (
    <AppShell title="РўР°СЂРёС„С‹ Рё Р±РёР»Р»РёРЅРі">
      <div className="page-head"><div><h1>РўР°СЂРёС„С‹</h1><p>Р§РёСЃС‚Р°СЏ РїСЂРёР±С‹Р»СЊ СЃ РєР°Р¶РґРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ вЂ” Р±РѕР»РµРµ 85%. РћСЃС‚Р°Р»СЊРЅРѕРµ вЂ” С‚РѕРєРµРЅС‹ AI, РёРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂР°, СЌРєРІР°Р№СЂРёРЅРі Рё РЅР°Р»РѕРіРё.</p></div></div>

      <div className="pricing-grid">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={`pricing-card${plan.id === 'pro' ? ' featured' : ''}`}>
            {plan.id === 'pro' && <Badge tone="violet">Р РµРєРѕРјРµРЅРґСѓРµРј</Badge>}
            <h2>{plan.name}</h2>
            <div className="price">
              <span className="amount">${plan.price}</span>
              <span className="period">/РјРµСЃ</span>
            </div>
            <p className="tokens-included">{plan.tokensPerMonth} С‚РѕРєРµРЅРѕРІ РІ РјРµСЃСЏС†</p>
            <ul className="plan-features">
              {plan.features.map((f) => <li key={f}><Check size={16} /> {f}</li>)}
            </ul>
            <Button
              className="full-button"
              onClick={() => void subscribe(plan.id)}
              disabled={loading === plan.id}
            >
              {loading === plan.id ? 'РћС‚РєСЂС‹РІР°РµРј Stripe...' : 'Р’С‹Р±СЂР°С‚СЊ'}
            </Button>
          </Card>
        ))}
      </div>

      <h2 className="standalone-title">РљСѓРїРёС‚СЊ С‚РѕРєРµРЅС‹ РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ</h2>
      <div className="token-packs">
        {TOKEN_PACKS.map((pack) => (
          <Card key={pack.id} className="token-pack-card">
            <span className="token-count">{pack.tokens}</span>
            <span className="token-label">С‚РѕРєРµРЅРѕРІ</span>
            <span className="token-price">${pack.price}</span>
            <span className="token-per">{`(${(pack.price / pack.tokens).toFixed(2)} $/С‚РѕРєРµРЅ)`}</span>
            <Button
              variant="secondary"
              onClick={() => void subscribe(pack.id)}
              disabled={loading === pack.id}
            >
              {loading === pack.id ? '...' : 'РљСѓРїРёС‚СЊ'}
            </Button>
          </Card>
        ))}
      </div>

      <Card className="margin-card">
        <h3>РљР°Рє СЂР°СЃС…РѕРґСѓСЋС‚СЃСЏ РІР°С€Рё СЃСЂРµРґСЃС‚РІР° вЂ” РґРѕ 89% С‡РёСЃС‚РѕР№ РїСЂРёР±С‹Р»Рё</h3>
        <div className="margin-breakdown">
          <div className="margin-bar">
            <div className="margin-fill" style={{ width: '13%' }} />
          </div>
          <div className="margin-legend">
            <span><span className="dot green" /> Р’С‹ РїРѕР»СѓС‡Р°РµС‚Рµ (87вЂ“89%)</span>
            <span><span className="dot accent" /> API РїСЂРѕРІР°Р№РґРµСЂРѕРІ (~0.1вЂ“1%)</span>
            <span><span className="dot blue" /> РРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂР° (&lt;1%)</span>
            <span><span className="dot orange" /> Р­РєРІР°Р№СЂРёРЅРі (3вЂ“5%)</span>
            <span><span className="dot gray" /> РќР°Р»РѕРіРё (~5%)</span>
          </div>
        </div>
      </Card>

      <Card className="margin-detail-card">
        <h3>РўРѕРї-15 AI-РјРѕРґРµР»РµР№ РёСЋР»СЏ 2026</h3>
        <div className="model-table-wrap">
          <table className="model-table">
            <thead>
              <tr>
                <th>РњРѕРґРµР»СЊ</th><th>РџСЂРѕРІР°Р№РґРµСЂ</th><th>РўРёСЂ</th><th>РўРѕРєРµРЅРѕРІ</th><th>$/РіРµРЅРµСЂР°С†РёСЏ</th>
              </tr>
            </thead>
            <tbody>
              {AI_MODELS.map((m) => (
                <tr key={m.id}>
                  <td><b>{m.label}</b></td>
                  <td><span className="provider-tag">{m.provider}</span></td>
                  <td><TierLabel tier={m.tier} /></td>
                  <td>{m.tokenCost}</td>
                  <td>${(m.tokenCost * 0.10).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {notice ? <div className="toast">{notice}</div> : null}
    </AppShell>
  )
}

function TierLabel({ tier }: { tier: string }) {
  const style: Record<string, React.CSSProperties> = {
    budget: { color: '#6b7280' },
    mid: { color: '#60a5fa' },
    flagship: { color: '#c084fc' },
  }
  const labels: Record<string, string> = { budget: 'Budget', mid: 'РЎСЂРµРґРЅРёР№', flagship: 'Р¤Р»Р°РіРјР°РЅ' }
  return <span style={{ ...(style[tier] ?? style.budget), fontSize: 11, fontWeight: 600 }}>{labels[tier] ?? tier}</span>
}



