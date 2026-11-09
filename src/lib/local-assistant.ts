export type ImportFormat = 'json' | 'csv' | 'text';
export interface ImportedPost {
    id: string;
    url: string | null;
    author: string | null;
    text: string;
    timestamp: string | null;
    metrics: {
        likes: number | null;
        replies: number | null;
        reposts: number | null;
        views: number | null;
    };
}
export interface BrandVoice {
    name: string;
    audience: string;
    tone: string;
    expertise: string;
    avoid: string;
}
export interface TemplateDraft {
    id: string;
    kind: 'post' | 'thread' | 'reply';
    label: string;
    parts: string[];
    sourceIds: string[];
    warnings: string[];
}
export interface TopicSignal {
    keyword: string;
    postCount: number;
    authorCount: number;
    score: number;
    knownEngagement: number;
    sourceIds: string[];
    explanation: string;
}
export interface ImportResult {
    posts: ImportedPost[];
    added: number;
    updated: number;
    duplicates: number;
    errors: string[];
}
export const defaultBrandVoice: BrandVoice = { name: '', audience: '', tone: 'Спокойный, конкретный', expertise: '', avoid: '' };
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const MAX_BACKUP_BYTES = 4 * 1024 * 1024;
export const MAX_POSTS = 1000;
export const characterCount = (text: string) => Array.from(text).length;
const clip = (text: string, max: number) => Array.from(text).slice(0, max).join('');
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const hash = (value: string) => { let result = 2166136261; for (const ch of value)
    result = Math.imul(result ^ ch.codePointAt(0)!, 16777619); return (result >>> 0).toString(36); };
const checkSize = (input: string, limit = MAX_IMPORT_BYTES) => { if (new TextEncoder().encode(input).length > limit)
    throw new Error(`Файл превышает ${limit / 1024 / 1024} МБ.`); };
export function canonicalThreadsUrl(value: string): string | null { try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !['threads.net', 'www.threads.net', 'threads.com', 'www.threads.com'].includes(url.hostname))
        return null;
    const match = url.pathname.match(/^\/@([a-zA-Z0-9._]+)\/post\/([a-zA-Z0-9_-]+)\/?$/);
    return match ? `https://www.threads.com/@${match[1].toLowerCase()}/post/${match[2]}` : null;
}
catch {
    return null;
} }
function normalizePost(row: unknown): ImportedPost {
    if (!record(row))
        throw new Error('Ожидается объект публикации.');
    if (typeof row.text !== 'string' || !row.text.trim() || characterCount(row.text) > 10000)
        throw new Error('Текст должен содержать от 1 до 10000 символов.');
    const rawUrl = row.url;
    const url = rawUrl == null || rawUrl === '' ? null : typeof rawUrl === 'string' ? canonicalThreadsUrl(rawUrl) : null;
    if (rawUrl != null && rawUrl !== '' && !url)
        throw new Error('Нужна HTTPS-ссылка на публикацию Threads.');
    let author: string | null = null;
    if (row.author != null && row.author !== '') {
        if (typeof row.author !== 'string' || row.author.length > 150)
            throw new Error('Некорректный автор.');
        author = row.author.trim().replace(/^@/, '') || null;
    }
    if (!author && url)
        author = new URL(url).pathname.split('/')[1].slice(1);
    const rawDate = row.timestamp ?? row.publishedAt;
    let timestamp: string | null = null;
    if (rawDate != null && rawDate !== '') {
        if (typeof rawDate !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(rawDate) || !Number.isFinite(Date.parse(rawDate)))
            throw new Error('Некорректная дата; используйте ISO 8601.');
        const day = rawDate.slice(0, 10);
        if (new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day)
            throw new Error('Некорректная календарная дата.');
        timestamp = new Date(rawDate).toISOString();
    }
    const metrics: ImportedPost['metrics'] = { likes: null, replies: null, reposts: null, views: null };
    for (const key of Object.keys(metrics) as (keyof typeof metrics)[]) {
        const value = record(row.metrics) ? row.metrics[key] : row[key];
        if (value == null || value === '')
            continue;
        const number = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value) : NaN;
        if (!Number.isSafeInteger(number) || number < 0)
            throw new Error(`Некорректная метрика: ${key}.`);
        metrics[key] = number;
    }
    const text = row.text.trim();
    return { id: `post-${hash(url ?? `${author ?? ''}\n${text}\n${timestamp ?? ''}`)}`, url, author, text, timestamp, metrics };
}
function parseCsv(input: string): Record<string, string>[] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (ch === '"') {
            if (quoted && input[i + 1] === '"') {
                field += '"';
                i++;
            }
            else if (quoted || field === '')
                quoted = !quoted;
            else
                throw new Error('Некорректные кавычки CSV.');
        }
        else if (ch === ',' && !quoted) {
            row.push(field);
            field = '';
        }
        else if ((ch === '\n' || ch === '\r') && !quoted) {
            if (ch === '\r' && input[i + 1] === '\n')
                i++;
            row.push(field);
            if (row.some(Boolean))
                rows.push(row);
            row = [];
            field = '';
        }
        else
            field += ch;
    }
    if (quoted)
        throw new Error('Незакрытая кавычка CSV.');
    row.push(field);
    if (row.some(Boolean))
        rows.push(row);
    const headers = rows.shift()?.map(s => s.trim()) ?? [];
    if (!headers.includes('text') || new Set(headers).size !== headers.length)
        throw new Error('CSV должен содержать уникальные заголовки и колонку text.');
    return rows.map(cells => { if (cells.length !== headers.length)
        throw new Error('Число колонок CSV не совпадает с заголовком.'); return Object.fromEntries(headers.map((key, i) => [key, cells[i]])); });
}
const postKey = (post: ImportedPost) => post.url ?? `${post.author ?? ''}\n${post.text}\n${post.timestamp ?? ''}`;
export function importPosts(input: string, format: ImportFormat, existing: ImportedPost[] = []): ImportResult {
    const result: ImportResult = { posts: [...existing], added: 0, updated: 0, duplicates: 0, errors: [] };
    try {
        checkSize(input);
        let rows: unknown;
        if (format === 'json') {
            const data: unknown = JSON.parse(input);
            rows = record(data) ? data.posts : data;
        }
        else if (format === 'csv')
            rows = parseCsv(input.replace(/^\uFEFF/, ''));
        else
            rows = input.split(/\r?\n\s*\r?\n/).filter(s => s.trim()).map(text => ({ text }));
        if (!Array.isArray(rows))
            throw new Error('Нужен массив публикаций или объект с массивом posts.');
        if (rows.length > MAX_POSTS || existing.length > MAX_POSTS)
            throw new Error('За один импорт допускается не более 1000 публикаций.');
        const seen = new Map(existing.map((post, i) => [postKey(post), i]));
        rows.forEach((row, index) => {
            try {
                const post = normalizePost(row);
                const key = postKey(post);
                const oldIndex = seen.get(key);
                if (oldIndex !== undefined) {
                    const old = result.posts[oldIndex];
                    const refreshed = { ...post, id: old.id };
                    if (post.url && JSON.stringify(old) !== JSON.stringify(refreshed)) {
                        result.posts[oldIndex] = refreshed;
                        result.updated++;
                    }
                    else
                        result.duplicates++;
                    return;
                }
                if (result.posts.length >= MAX_POSTS)
                    throw new Error('Хранилище ограничено 1000 публикациями.');
                seen.set(key, result.posts.length);
                result.posts.push(post);
                result.added++;
            }
            catch (error) {
                result.errors.push(`Строка ${index + 1}: ${(error as Error).message}`);
            }
        });
    }
    catch (error) {
        result.errors.push((error as Error).message);
    }
    return result;
}
const stopwords = new Set('about after again also because been before being could from have into just more most only other over some such than that their them then there these they this those through very what when where which while will with would your есть были было быть если даже когда куда можно надо наши наша наше нужно очень после потому просто свой свои себя того тоже только этом этот этой чтобы всех как или для при это что мне вам вас уже ещё еще так его она они мы вы под без над has had are and the for not but you our was were'.split(' '));
const sourceKeywords = (text: string) => [...new Set((text.toLowerCase().replace(/https?:\/\/\S+/g, '').match(/[\p{L}][\p{L}\p{N}]{3,}/gu) ?? []).filter(word => !stopwords.has(word)))].slice(0, 100);
export function analyzeTopics(posts: ImportedPost[], now: Date = new Date()): TopicSignal[] { const groups = new Map<string, ImportedPost[]>(); const unique = [...new Map(posts.slice(0, MAX_POSTS).map(post => [post.url ?? post.id, post])).values()]; for (const post of unique)
    for (const word of sourceKeywords(post.text))
        groups.set(word, [...(groups.get(word) ?? []), post]); return [...groups].filter(([, sources]) => sources.length >= 2).map(([keyword, sources]) => { const authorCount = new Set(sources.map(p => p.author?.toLowerCase()).filter(Boolean)).size; const knownEngagement = sources.reduce((sum, p) => sum + (p.metrics.likes ?? 0) + (p.metrics.replies ?? 0) + (p.metrics.reposts ?? 0), 0); const freshness = sources.reduce((sum, p) => sum + (p.timestamp ? 1 / (1 + Math.max(0, (now.getTime() - Date.parse(p.timestamp)) / 86400000)) : 0), 0); const score = Math.round((sources.length * 2 + authorCount + Math.log1p(knownEngagement) + freshness) * 100) / 100; return { keyword, postCount: sources.length, authorCount, score, knownEngagement, sourceIds: sources.map(p => p.id), explanation: 'Только импортированная выборка. Балл = 2 × публикации + известные авторы + ln(1 + известные лайки, ответы и репосты) + сумма 1/(1 + возраст в днях). Неизвестные метрики и даты не добавляют баллы. Это частота слова, не глобальный тренд.' }; }).sort((a, b) => b.score - a.score || a.keyword.localeCompare(b.keyword)).slice(0, 20); }
export function validateDraft(text: string): string[] { const errors: string[] = []; if (!text.trim())
    errors.push('Пустой текст.'); if (characterCount(text) > 500)
    errors.push('Превышен лимит 500 символов.'); if (/\[[^\]]+\]/u.test(text))
    errors.push('Заполните поля в квадратных скобках.'); if (/\b(?:javascript|vbscript|data|file|blob):/iu.test(text) || /\b(?!https?:)[a-z][a-z0-9+.-]*:\/\//iu.test(text))
    errors.push('Удалите ссылку с небезопасным протоколом.'); const links = text.match(/https?:\/\/[^\s<>]*/giu) ?? []; if (links.some(link => { try {
    const url = new URL(link);
    return !url.hostname || !!url.username || !!url.password;
}
catch {
    return true;
} }))
    errors.push('Исправьте некорректную ссылку.'); return errors; }
export function generateDrafts(posts: ImportedPost[], profile: BrandVoice, topic?: string): TemplateDraft[] { if (!posts.length)
    return []; const keyword = clip((topic || analyzeTopics(posts)[0]?.keyword || sourceKeywords(posts[0].text)[0] || '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim(), 50); if (!keyword)
    return topic ? [] : [{ id: `template-${hash('reply' + posts[0].id + JSON.stringify(profile))}`, kind: 'reply', label: 'Шаблон ответа для редактирования', parts: ['[Укажите конкретную мысль автора, на которую отвечаете.]\n\n[Задайте уточняющий вопрос или добавьте собственный проверяемый пример.]'], sourceIds: [posts[0].id], warnings: ['Сначала прочитайте исходную публикацию. Шаблон не подтверждает утверждения автора.'] }]; const sources = posts.filter(p => p.text.toLowerCase().includes(keyword.toLowerCase())).slice(0, 5); if (!sources.length)
    return []; const audience = clip(profile.audience.trim(), 60) || '[ваша аудитория]'; const context = `Тема: ${keyword}. Для ${audience}.`; const make = (kind: TemplateDraft['kind'], parts: string[]): TemplateDraft => ({ id: `template-${hash(kind + keyword + JSON.stringify(profile) + sources.map(p => p.id).join())}`, kind, label: 'Шаблон для редактирования, не готовый ИИ-текст', parts: parts.map(p => clip(p, 500)), sourceIds: sources.map(p => p.id), warnings: [`Стиль: ${clip(profile.tone, 120) || 'не задан'}.`, ...(profile.avoid ? [`Избегать: ${clip(profile.avoid, 120)}.`] : []), 'Добавьте собственный опыт и проверьте факты. Источники задают тему, но их утверждения не подтверждены.'] }); return [make('post', [`${context}\n\n[Опишите одну конкретную проблему из своей практики.]\n\n[Какое действие помогло и как вы проверили результат?]\n\nЧто вы пробовали в похожей ситуации?`]), make('thread', [`${context}\n\n[Сформулируйте собственный тезис и укажите, на каком опыте он основан.]`, '[Опишите исходную ситуацию и одно действие. Добавьте проверяемый пример, без вымышленных цифр.]', '[Укажите ограничения подхода и следующий небольшой шаг для читателя.]']), make('reply', [`По теме «${keyword}» хочу уточнить: [задайте конкретный вопрос к аргументу автора].\n\n[Добавьте собственный пример, если он действительно был.]`])]; }
export function exportBackup(posts: ImportedPost[], profile: BrandVoice, drafts: TemplateDraft[]): string { return JSON.stringify({ schemaVersion: 1, posts, profile, drafts }, null, 2); }
export function parseBackup(input: string): {
    posts: ImportedPost[];
    profile: BrandVoice;
    drafts: TemplateDraft[];
} { checkSize(input, MAX_BACKUP_BYTES); const data: unknown = JSON.parse(input); if (!record(data) || data.schemaVersion !== 1 || !Array.isArray(data.posts) || !record(data.profile) || !Array.isArray(data.drafts))
    throw new Error('Некорректный формат резервной копии версии 1.'); if (data.posts.length > MAX_POSTS)
    throw new Error('Слишком много публикаций.'); const postIds = new Set<string>(); const posts = data.posts.map(row => { const post = normalizePost(row); if (record(row) && row.id !== undefined) {
    if (typeof row.id !== 'string' || !row.id.trim() || row.id.length > 200)
        throw new Error('Некорректный ID публикации.');
    post.id = row.id;
} if (postIds.has(post.id))
    throw new Error('Повторяющийся ID публикации.'); postIds.add(post.id); return post; }); const profile = { ...defaultBrandVoice }; for (const key of Object.keys(profile) as (keyof BrandVoice)[]) {
    const value = data.profile[key];
    if (typeof value !== 'string' || value.length > 2000)
        throw new Error('Некорректный профиль бренда.');
    profile[key] = value;
} if (data.drafts.length > 1000)
    throw new Error('Слишком много черновиков.'); const draftIds = new Set<string>(); const drafts = data.drafts.map((draft): TemplateDraft => { if (!record(draft) || typeof draft.id !== 'string' || !draft.id.trim() || draft.id.length > 200 || !['post', 'thread', 'reply'].includes(String(draft.kind)) || typeof draft.label !== 'string' || draft.label.length > 500 || !Array.isArray(draft.parts) || draft.parts.length < 1 || draft.parts.length > 20 || !draft.parts.every(p => typeof p === 'string' && characterCount(p) <= 10000) || !Array.isArray(draft.sourceIds) || draft.sourceIds.length > MAX_POSTS || !draft.sourceIds.every(id => typeof id === 'string' && !!id.trim() && id.length <= 200) || !Array.isArray(draft.warnings) || draft.warnings.length > 20 || !draft.warnings.every(w => typeof w === 'string' && w.length <= 2000))
    throw new Error('Некорректный черновик в резервной копии.'); if (draftIds.has(draft.id))
    throw new Error('Повторяющийся ID черновика.'); draftIds.add(draft.id); return { id: draft.id, kind: draft.kind as TemplateDraft['kind'], label: draft.label, parts: draft.parts as string[], sourceIds: draft.sourceIds as string[], warnings: draft.warnings as string[] }; }); return { posts, profile, drafts }; }
