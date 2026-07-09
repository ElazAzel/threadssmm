import type { Draft } from './domain'

interface ReportData {
  title: string
  period: string
  generatedAt: string
  workspaceName: string
  totalDrafts: number
  published: number
  scheduled: number
  failed: number
  pendingApproval: number
  posts: Array<{
    title: string
    status: string
    format: string
    createdAt: string
    views?: number
    likes?: number
  }>
}

export function generateHtmlReport(data: ReportData): string {
  const rows = data.posts.map((p) =>
    `<tr><td>${escapeHtml(p.title)}</td><td>${p.status}</td><td>${p.format}</td><td>${p.createdAt}</td><td>${p.views ?? '—'}</td><td>${p.likes ?? '—'}</td></tr>`
  ).join('\n')

  return `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"><title>${escapeHtml(data.title)}</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; color: #222; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  .meta { color: #666; font-size: 0.85rem; margin-bottom: 1.5rem; }
  .stats { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
  .stat { background: #f5f5f5; padding: 0.75rem 1rem; border-radius: 8px; flex: 1; text-align: center; }
  .stat strong { display: block; font-size: 1.25rem; }
  .stat span { font-size: 0.8rem; color: #666; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
  th { font-weight: 600; color: #444; }
  .footer { margin-top: 2rem; font-size: 0.75rem; color: #999; text-align: center; }
</style></head><body>
  <h1>${escapeHtml(data.title)}</h1>
  <div class="meta">${data.workspaceName} · ${data.period} · Сформирован ${data.generatedAt}</div>
  <div class="stats">
    <div class="stat"><strong>${data.published}</strong><span>Опубликовано</span></div>
    <div class="stat"><strong>${data.scheduled}</strong><span>Запланировано</span></div>
    <div class="stat"><strong>${data.pendingApproval}</strong><span>На согласовании</span></div>
    <div class="stat"><strong>${data.failed}</strong><span>Ошибок</span></div>
  </div>
  <table><thead><tr><th>Название</th><th>Статус</th><th>Формат</th><th>Дата</th><th>Просмотры</th><th>Лайки</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <div class="footer">Threads SMM Agent — AI-first платформа для системного роста в Threads</div>
</body></html>`
}

export function downloadPdfReport(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${filename}.html`
  anchor.click()
  URL.revokeObjectURL(url)
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function buildReportData(drafts: Draft[], workspaceName: string, period: string): ReportData {
  return {
    title: `Отчёт Threads SMM — ${workspaceName}`,
    period,
    generatedAt: new Date().toLocaleString('ru-RU'),
    workspaceName,
    totalDrafts: drafts.length,
    published: drafts.filter((d) => d.status === 'published').length,
    scheduled: drafts.filter((d) => d.status === 'scheduled').length,
    failed: drafts.filter((d) => d.status === 'failed').length,
    pendingApproval: drafts.filter((d) => d.status === 'pending_approval').length,
    posts: drafts.map((d) => ({
      title: d.title || 'Без названия',
      status: d.status,
      format: d.format,
      createdAt: new Date(d.created_at).toLocaleDateString('ru-RU'),
      views: (d as { views?: number }).views,
      likes: (d as { likes?: number }).likes,
    })),
  }
}
