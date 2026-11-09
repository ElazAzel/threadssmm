import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Check,
  Download,
  FileText,
  MessageSquare,
  Radar,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import {
  analyzeTopics,
  canonicalThreadsUrl,
  characterCount,
  generateDrafts,
  importPosts,
  validateDraft,
  type BrandVoice,
  type TemplateDraft,
} from '../lib/local-assistant'
import {
  buildLocalPrompt,
  buildThreadsIntent,
  deserializeWorkspace,
  emptyWorkspace,
  loadWorkspace,
  LOCAL_STORAGE_KEY,
  parseLocalDraft,
  serializeWorkspace,
  type LocalWorkspace,
  type SavedDraft,
} from '../lib/local-workspace'
import './local-assistant.css'

const download = (filename: string, text: string) => {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json;charset=utf-8' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const LocalDialog = ({
  titleId,
  onClose,
  children,
}: {
  titleId: string
  onClose: () => void
  children: ReactNode
}) => {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="local-modal"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose()
        }
      }}
    >
      {children}
    </dialog>
  )
}
const labels = {
  draft: 'Черновик',
  reviewed: 'Проверен',
  published: 'Опубликован вручную',
}
const readLocalWorkspace = () => {
  try {
    return loadWorkspace(localStorage)
  } catch {
    return {
      raw: null,
      workspace: emptyWorkspace(),
      error:
        'Браузер запретил локальное хранилище. Разрешите сохранение данных для этого сайта.',
    }
  }
}

export const LocalAssistantPage = () => {
  const [initial] = useState(readLocalWorkspace)
  const [workspace, setWorkspace] = useState<LocalWorkspace>(initial.workspace)
  const workspaceRef = useRef(workspace)
  const lastStored = useRef<string | null>(initial.raw)
  const [storageBlocked, setStorageBlocked] = useState(Boolean(initial.error))
  const blockedRef = useRef(Boolean(initial.error))
  const epoch = useRef(0)
  const modelRequest = useRef<AbortController | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState(initial.error)
  const [tab, setTab] = useState<'sources' | 'trends' | 'drafts' | 'profile'>(
    'sources',
  )
  const [input, setInput] = useState('')
  const [format, setFormat] = useState<'json' | 'csv' | 'text'>('text')
  const [search, setSearch] = useState('')
  const [topic, setTopic] = useState('')
  const [model, setModel] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const generating = useRef(false)
  const [kind, setKind] = useState<TemplateDraft['kind']>('post')
  const [replySource, setReplySource] = useState('')
  const [publishId, setPublishId] = useState<string | null>(null)
  const [publishedUrl, setPublishedUrl] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const [pendingRestore, setPendingRestore] = useState<LocalWorkspace | null>(
    null,
  )
  const topics = useMemo(
    () => analyzeTopics(workspace.posts),
    [workspace.posts],
  )
  const selectedPosts =
    kind === 'reply'
      ? workspace.posts.filter((post) => post.id === replySource)
      : workspace.posts
          .filter(
            (post) =>
              !topic.trim() ||
              post.text.toLocaleLowerCase().includes(topic.toLocaleLowerCase()),
          )
          .slice(0, 8)
  const visiblePosts = workspace.posts.filter((post) =>
    `${post.text} ${post.author ?? ''}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  )

  const cancelAsync = useCallback(() => {
    epoch.current++
    modelRequest.current?.abort()
  }, [])
  const invalidateAsync = useCallback(() => {
    cancelAsync()
    modelRequest.current = null
    generating.current = false
    setBusy(false)
  }, [cancelAsync])
  useEffect(() => {
    const sync = () => {
      const result = readLocalWorkspace()
      if (
        result.raw === lastStored.current &&
        Boolean(result.error) === blockedRef.current
      )
        return
      invalidateAsync()
      workspaceRef.current = result.workspace
      setWorkspace(result.workspace)
      blockedRef.current = Boolean(result.error)
      setStorageBlocked(blockedRef.current)
      setError(result.error)
      lastStored.current = result.raw
      setPublishId(null)
      setPendingRestore(null)
      setResetOpen(false)
      setNotice('Данные обновлены в другой вкладке.')
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_KEY || event.key === null) sync()
    }
    window.addEventListener('storage', onStorage)
    sync()
    return () => {
      window.removeEventListener('storage', onStorage)
      cancelAsync()
    }
  }, [invalidateAsync, cancelAsync])
  const save = (next: LocalWorkspace) => {
    if (blockedRef.current) {
      setError(
        'Сначала скачайте исходную копию и восстановите данные или очистите хранилище.',
      )
      return false
    }
    try {
      if (localStorage.getItem(LOCAL_STORAGE_KEY) !== lastStored.current) {
        setError(
          'Данные изменились в другой вкладке. Обновите страницу перед редактированием.',
        )
        return false
      }
      const raw = serializeWorkspace(next)
      localStorage.setItem(LOCAL_STORAGE_KEY, raw)
      lastStored.current = raw
      workspaceRef.current = next
      setWorkspace(next)
      setError('')
      return true
    } catch (caught) {
      setError(
        `Не удалось сохранить: ${caught instanceof Error ? caught.message : 'хранилище недоступно'}. Новые изменения не применены. Экспортируйте копию.`,
      )
      return false
    }
  }
  const importInput = (raw = input, selectedFormat = format) => {
    setNotice('')
    try {
      const current = workspaceRef.current
      const result = importPosts(raw, selectedFormat, current.posts)
      if (save({ ...current, posts: result.posts })) {
        setNotice(
          `Добавлено: ${result.added}. Повторов: ${result.duplicates}. Всего: ${result.posts.length}. Обновлено: ${result.updated}.`,
        )
        setError(result.errors.join(' · '))
        if (!result.errors.length) setInput('')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Ошибка импорта')
    }
  }
  const readFile = async (
    event: ChangeEvent<HTMLInputElement>,
    restore = false,
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      setError('Файл больше 4 МБ')
      return
    }
    const requestEpoch = epoch.current
    try {
      const raw = await file.text()
      if (requestEpoch !== epoch.current) return
      if (restore) {
        setPendingRestore(deserializeWorkspace(raw))
        return
      }
      const selectedFormat = file.name.toLowerCase().endsWith('.csv')
        ? 'csv'
        : file.name.toLowerCase().endsWith('.json')
          ? 'json'
          : 'text'
      importInput(raw, selectedFormat)
    } catch (caught) {
      if (requestEpoch === epoch.current)
        setError(
          caught instanceof Error
            ? caught.message
            : 'Не удалось прочитать файл',
        )
    }
  }
  const addDrafts = (drafts: TemplateDraft[]) => {
    const current = workspaceRef.current
    const existing = new Set(
      current.drafts.map((draft) => JSON.stringify(draft.parts)),
    )
    const next = drafts
      .filter((draft) => !existing.has(JSON.stringify(draft.parts)))
      .map(
        (draft): SavedDraft => ({
          ...draft,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          status: 'draft',
        }),
      )
    if (current.drafts.length + next.length > 200) {
      setError('Лимит 200 черновиков. Экспортируйте копию и удалите лишние.')
      return
    }
    if (save({ ...current, drafts: [...next, ...current.drafts] })) {
      setTab('drafts')
      setNotice(
        next.length
          ? `Сохранено черновиков: ${next.length}. Проверьте и дополните текст.`
          : 'Такие черновики уже есть, дубликаты не добавлены.',
      )
    }
  }
  const makeTemplates = () => {
    try {
      if (!selectedPosts.length)
        throw new Error(
          kind === 'reply'
            ? 'Выберите публикацию для ответа.'
            : 'Добавьте публикации по этой теме или выберите тему из анализа.',
        )
      const drafts = generateDrafts(
        selectedPosts,
        workspace.profile,
        topic || undefined,
      ).filter((draft) => draft.kind === kind)
      if (!drafts.length)
        throw new Error(
          'Не удалось выделить тему. Укажите конкретное слово из выбранных публикаций.',
        )
      addDrafts(drafts)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Не удалось подготовить черновик',
      )
    }
  }
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setNotice('Скопировано. Отправку выполняете вы в Threads.')
      setError('')
    } catch {
      setError(
        'Копирование недоступно. Выделите текст в поле и скопируйте вручную.',
      )
    }
  }
  const checkModel = async () => {
    const requestEpoch = epoch.current
    setBusy(true)
    try {
      const response = await fetch('/local/health', {
        signal: AbortSignal.timeout(10_000),
      })
      if (
        !response.ok ||
        !response.headers.get('content-type')?.includes('application/json')
      )
        throw new Error(
          'Локальный сервер недоступен. Запустите npm run local на своём компьютере.',
        )
      const data = (await response.json()) as {
        available: boolean
        models: string[]
        error?: string
      }
      if (requestEpoch !== epoch.current) return
      if (!data.available || !Array.isArray(data.models) || !data.models.length)
        throw new Error(
          data.error ||
            'Ollama не запущена или модели не установлены. См. инструкцию ниже.',
        )
      setError('')
      setModels(data.models)
      setModel(data.models[0])
      setNotice(
        'Ollama доступна. Тексты будут отправлены только локальной модели на этом компьютере.',
      )
    } catch (caught) {
      if (requestEpoch === epoch.current)
        setError(
          caught instanceof Error
            ? caught.message
            : 'Локальная модель недоступна',
        )
    } finally {
      if (requestEpoch === epoch.current) setBusy(false)
    }
  }
  const makeModelDraft = async () => {
    if (generating.current || !model) return
    if (!selectedPosts.length) {
      setError('Выберите источник или тему с публикациями.')
      return
    }
    const requestEpoch = epoch.current
    const controller = new AbortController()
    modelRequest.current = controller
    generating.current = true
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/local/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: buildLocalPrompt(
            selectedPosts,
            workspace.profile,
            topic,
            kind,
          ),
        }),
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(95_000),
        ]),
      })
      const data = (await response.json()) as { text?: string; error?: string }
      if (requestEpoch !== epoch.current) return
      if (!response.ok || typeof data.text !== 'string')
        throw new Error(data.error || 'Локальная модель не ответила')
      addDrafts([
        parseLocalDraft(
          data.text,
          kind,
          selectedPosts.map((post) => post.id),
        ),
      ])
    } catch (caught) {
      if (requestEpoch === epoch.current)
        setError(
          caught instanceof Error
            ? caught.message
            : 'Ошибка локальной генерации',
        )
    } finally {
      if (requestEpoch === epoch.current) {
        generating.current = false
        modelRequest.current = null
        setBusy(false)
      }
    }
  }
  const editDraft = (id: string, parts: string[]) =>
    save({
      ...workspaceRef.current,
      drafts: workspaceRef.current.drafts.map((draft) =>
        draft.id === id
          ? { ...draft, parts, status: 'draft', publishedUrl: undefined }
          : draft,
      ),
    })
  const confirmPublished = () => {
    const url = canonicalThreadsUrl(publishedUrl)
    const current = workspaceRef.current
    const target = current.drafts.find((draft) => draft.id === publishId)
    if (
      !target ||
      target.status !== 'reviewed' ||
      target.parts.some((part) => validateDraft(part).length > 0)
    ) {
      setError('Черновик изменился. Проверьте текст заново.')
      setPublishId(null)
      return
    }
    if (
      url &&
      save({
        ...current,
        drafts: current.drafts.map((draft) =>
          draft.id === publishId
            ? { ...draft, status: 'published', publishedUrl: url }
            : draft,
        ),
      })
    )
      setPublishId(null)
  }

  return (
    <div className="local-app">
      <header className="local-header">
        <Link to="/" className="local-logo">
          Threads SMM<span>Локальный ассистент</span>
        </Link>
        <div>
          <span className="local-pill">
            <ShieldCheck size={16} /> Без API-ключей
          </span>
          <Link to="/setup">
            Облачные настройки <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>
      <main className="local-main">
        <section className="local-intro">
          <div>
            <p className="local-kicker">
              Собрать → понять → написать → проверить
            </p>
            <h1>Ваш редактор Threads</h1>
            <p>
              Анализируйте реальные посты, находите повторяющиеся темы и
              готовьте свои ветки. Данные остаются в этом браузере, пока вы сами
              их не экспортируете или не откроете редактор Threads.
            </p>
          </div>
          <div className="local-stats">
            <div>
              <strong>{workspace.posts.length}</strong>
              <span>публикаций в выборке</span>
            </div>
            <div>
              <strong>{workspace.drafts.length}</strong>
              <span>сохранённых черновиков</span>
            </div>
          </div>
        </section>
        <div className="local-notice">
          Это не обзор всего Threads. Сборщик читает загруженные посты по вашему
          нажатию; анализ относится только к вашей выборке. Отправка и
          публикация остаются под вашим контролем.
        </div>
        {error && (
          <div role="alert" className="local-error">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="local-success">
            {notice}
          </div>
        )}
        {storageBlocked && (
          <div className="local-actions">
            <button
              onClick={() => {
                try {
                  download(
                    'threads-unreadable-backup.json',
                    localStorage.getItem(LOCAL_STORAGE_KEY) || '{}',
                  )
                } catch {
                  setError('Нет доступа к хранилищу')
                }
              }}
            >
              Скачать исходную копию
            </button>
            <button onClick={() => setResetOpen(true)}>
              Очистить повреждённое хранилище
            </button>
          </div>
        )}
        <nav aria-label="Разделы локального ассистента" className="local-tabs">
          {(
            [
              ['sources', 'Источники', Upload],
              ['trends', 'Темы и редактор', Radar],
              ['drafts', 'Черновики', FileText],
              ['profile', 'Голос и данные', ShieldCheck],
            ] as const
          ).map(([id, title, Icon]) => (
            <button
              key={id}
              aria-current={tab === id ? 'page' : undefined}
              onClick={() => {
                setTab(id)
                setNotice('')
              }}
            >
              <Icon size={18} />
              {title}
            </button>
          ))}
        </nav>
        {tab === 'sources' && (
          <div className="local-grid">
            <section className="local-card">
              <h2>Добавить реальные публикации</h2>
              <p>
                Вставьте тексты с пустой строкой между постами или импортируйте
                JSON / CSV. Ссылки и известные метрики помогут проверить выводы.
              </p>
              <label>
                Формат
                <select
                  value={format}
                  onChange={(event) =>
                    setFormat(event.target.value as typeof format)
                  }
                >
                  <option value="text">Текст: посты через пустую строку</option>
                  <option value="json">
                    JSON: экспорт сборщика / массив posts
                  </option>
                  <option value="csv">
                    CSV: text, url, author, likes, replies
                  </option>
                </select>
              </label>
              <label>
                Публикации для анализа
                <textarea
                  rows={9}
                  value={input}
                  maxLength={1_000_000}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Вставьте реальные тексты Threads…"
                />
              </label>
              <div className="local-actions">
                <button
                  className="local-primary"
                  disabled={!input.trim() || storageBlocked}
                  onClick={() => importInput()}
                >
                  Добавить публикации
                </button>
                <label className="local-file">
                  <Upload size={16} /> Импорт файла
                  <input
                    type="file"
                    accept=".json,.csv,.txt"
                    onChange={(event) => void readFile(event)}
                  />
                </label>
              </div>
              <details>
                <summary>Как собрать посты из Threads без API</summary>
                <ol>
                  <li>
                    Скачайте{' '}
                    <a href="/downloads/threads-capture.zip" download>
                      расширение Threads Capture
                    </a>
                    , распакуйте и загрузите папку через chrome://extensions →
                    режим разработчика → «Загрузить распакованное».
                  </li>
                  <li>
                    Откройте Threads в своём браузере, войдите самостоятельно и
                    просмотрите нужную ленту или поиск.
                  </li>
                  <li>
                    Нажмите «Собрать видимые посты» в расширении, скачайте JSON
                    и импортируйте сюда.
                  </li>
                </ol>
                <p>
                  Не запрашивает пароль или cookies. Сбор не работает в фоне.
                  Разметка Threads меняется, поэтому проверьте извлечённые
                  тексты. Уважайте правила платформы и авторов.
                </p>
              </details>
            </section>
            <section className="local-card">
              <h2>Ваша выборка</h2>
              <label>
                Поиск по публикациям
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Тема или автор"
                />
              </label>
              {!visiblePosts.length ? (
                <div className="local-empty">
                  <Radar size={32} />
                  <h3>
                    {workspace.posts.length
                      ? 'Нет совпадений'
                      : 'Пока нет источников'}
                  </h3>
                  <p>
                    Никаких демо-данных и выдуманных метрик. Добавьте свою
                    выборку слева.
                  </p>
                </div>
              ) : (
                <div className="local-source-list">
                  {visiblePosts.slice(0, 60).map((post) => (
                    <article key={post.id}>
                      <div className="local-row">
                        <b>
                          {post.author
                            ? `@${post.author.replace(/^@/, '')}`
                            : 'Автор не указан'}
                        </b>
                        {post.url && (
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Источник <ArrowUpRight size={14} />
                          </a>
                        )}
                      </div>
                      <p>{post.text}</p>
                      <small>
                        {post.timestamp
                          ? new Date(post.timestamp).toLocaleDateString('ru')
                          : 'Дата неизвестна'}{' '}
                        · Лайки: {post.metrics.likes ?? '—'} · Ответы:{' '}
                        {post.metrics.replies ?? '—'}
                      </small>
                      <div className="local-actions">
                        <button
                          onClick={() => {
                            setReplySource(post.id)
                            setKind('reply')
                            setTopic('')
                            setTab('trends')
                          }}
                        >
                          <MessageSquare size={14} /> Подготовить ответ
                        </button>
                        <button
                          onClick={() =>
                            save({
                              ...workspace,
                              posts: workspace.posts.filter(
                                (item) => item.id !== post.id,
                              ),
                            })
                          }
                        >
                          Убрать из выборки
                        </button>
                      </div>
                    </article>
                  ))}
                  {visiblePosts.length > 60 && (
                    <p>Показано 60 из {visiblePosts.length}. Уточните поиск.</p>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
        {tab === 'trends' && (
          <div className="local-grid">
            <section className="local-card">
              <h2>Повторяющиеся темы</h2>
              <p>
                Частота, разнообразие авторов, известные реакции и давность.
                Балл помогает сравнить темы внутри этой выборки, а не
                прогнозирует охваты.
              </p>
              {!topics.length ? (
                <div className="local-empty">
                  <Radar size={32} />
                  <h3>Пока недостаточно повторений</h3>
                  <p>
                    Добавьте несколько публикаций по вашей нише от разных
                    авторов.
                  </p>
                </div>
              ) : (
                topics.slice(0, 12).map((signal) => (
                  <button
                    className="local-topic"
                    key={signal.keyword}
                    onClick={() => {
                      setTopic(signal.keyword)
                      setKind('post')
                    }}
                  >
                    <span>
                      <b>{signal.keyword}</b>
                      <small>
                        {signal.postCount} постов · {signal.authorCount}{' '}
                        известных авторов
                      </small>
                      <small>{signal.explanation}</small>
                    </span>
                    <strong>{signal.score.toFixed(1)}</strong>
                  </button>
                ))
              )}
            </section>
            <section className="local-card">
              <h2>Редактор идей</h2>
              <label>
                Тема из вашей выборки
                <input
                  value={topic}
                  maxLength={300}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="Выберите тему слева или оставьте пустой"
                />
              </label>
              <label>
                Формат черновика
                <select
                  value={kind}
                  onChange={(event) =>
                    setKind(event.target.value as typeof kind)
                  }
                >
                  <option value="post">Пост</option>
                  <option value="thread">Ветка из нескольких частей</option>
                  <option value="reply">Комментарий к конкретному посту</option>
                </select>
              </label>
              {kind === 'reply' && (
                <label>
                  Публикация для ответа
                  <select
                    value={replySource}
                    onChange={(event) => setReplySource(event.target.value)}
                  >
                    <option value="">Выберите публикацию</option>
                    {workspace.posts.map((post) => (
                      <option key={post.id} value={post.id}>
                        {post.author || 'Автор'}: {post.text.slice(0, 75)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <p>
                Выбрано источников: {selectedPosts.length}.{' '}
                <button
                  className="local-inline"
                  onClick={() => setTab('profile')}
                >
                  Настроить голос автора
                </button>
              </p>
              <button
                className="local-primary"
                disabled={!selectedPosts.length || storageBlocked || busy}
                onClick={makeTemplates}
              >
                Подготовить шаблон
              </button>
              <p className="local-muted">
                Шаблон работает офлайн: структура и вопросы на основе темы, не
                AI-генерация. Дополните своими выводами и проверьте факты.
              </p>
              <details>
                <summary>Генерация своей локальной моделью</summary>
                <p>
                  Для полноценного текста без внешних ключей запустите Ollama с
                  отключёнными облачными функциями и установите локальную модель
                  на своём компьютере. Затем запустите проект командой npm run
                  local.{' '}
                  <a
                    href="https://github.com/ElazAzel/threadssmm/blob/main/docs/local-model.md"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Инструкция
                  </a>
                  .
                </p>
                <button disabled={busy} onClick={() => void checkModel()}>
                  Проверить Ollama
                </button>
                {models.length > 0 && (
                  <>
                    <label>
                      Локальная модель
                      <select
                        value={model}
                        onChange={(event) => setModel(event.target.value)}
                      >
                        {models.map((name) => (
                          <option key={name}>{name}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      disabled={busy || !selectedPosts.length || storageBlocked}
                      onClick={() => void makeModelDraft()}
                    >
                      {busy ? 'Модель пишет…' : 'Написать локальной моделью'}
                    </button>
                  </>
                )}
                <p>
                  Источники и профиль передаются Ollama на 127.0.0.1 после
                  проверки локальности модели. Результат всегда сохраняется как
                  черновик.
                </p>
              </details>
              <button
                disabled={!selectedPosts.length}
                onClick={() =>
                  void copy(
                    buildLocalPrompt(
                      selectedPosts,
                      workspace.profile,
                      topic,
                      kind,
                    ),
                  )
                }
              >
                Скопировать промпт для своей модели
              </button>
            </section>
          </div>
        )}
        {tab === 'drafts' && (
          <section className="local-card">
            <div className="local-row">
              <h2>Черновики и ответы</h2>
              <button
                onClick={() =>
                  addDrafts([
                    {
                      id: crypto.randomUUID(),
                      kind: 'post',
                      label: 'Свой пост',
                      parts: [''],
                      sourceIds: [],
                      warnings: [],
                    },
                  ])
                }
              >
                Новый пустой черновик
              </button>
            </div>
            <p>
              Проверьте текст, затем откройте редактор Threads. Открытие
              редактора не означает публикацию. Для ветки добавляйте части
              вручную; кнопка каждой части создаёт отдельный пост.
            </p>
            {!workspace.drafts.length && (
              <div className="local-empty">
                <FileText size={32} />
                <h3>Черновиков пока нет</h3>
                <button onClick={() => setTab('trends')}>
                  Перейти к темам
                </button>
              </div>
            )}
            <div className="local-drafts">
              {workspace.drafts.map((draft) => {
                const errors = draft.parts.flatMap(validateDraft)
                const source = workspace.posts.find((post) =>
                  draft.sourceIds.includes(post.id),
                )
                const canOpen =
                  draft.status === 'reviewed' &&
                  !errors.length &&
                  (draft.kind !== 'reply' || Boolean(source?.url))
                return (
                  <article className="local-draft" key={draft.id}>
                    <div className="local-row">
                      <h3>{draft.label}</h3>
                      <span className="local-pill">{labels[draft.status]}</span>
                    </div>
                    {draft.warnings.map((warning) => (
                      <p className="local-muted" key={warning}>
                        {warning}
                      </p>
                    ))}
                    {source?.url && (
                      <p>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Контекст и источник
                        </a>
                      </p>
                    )}
                    {draft.parts.map((part, index) => (
                      <div key={index}>
                        <label>
                          Текст{' '}
                          {draft.parts.length > 1
                            ? `части ${index + 1}`
                            : 'черновика'}
                          <textarea
                            rows={5}
                            maxLength={10000}
                            value={part}
                            onChange={(event) =>
                              editDraft(
                                draft.id,
                                draft.parts.map((text, i) =>
                                  i === index ? event.target.value : text,
                                ),
                              )
                            }
                          />
                        </label>
                        <div className="local-row">
                          <small
                            className={
                              characterCount(part) > 500 ? 'local-invalid' : ''
                            }
                          >
                            {characterCount(part)} / 500 символов
                          </small>
                          <div className="local-actions">
                            <button onClick={() => void copy(part)}>
                              Копировать
                            </button>
                            {canOpen && (
                              <a
                                className="local-link-button"
                                href={buildThreadsIntent(
                                  part,
                                  draft.kind === 'reply'
                                    ? (source?.url ?? undefined)
                                    : undefined,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {draft.kind === 'reply'
                                  ? 'Открыть ответ в Threads'
                                  : `Открыть ${draft.parts.length > 1 ? 'часть' : 'пост'} в Threads`}{' '}
                                <ArrowUpRight size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {errors.length > 0 && (
                      <p className="local-invalid">
                        {[...new Set(errors)].join(' · ')}
                      </p>
                    )}
                    {draft.kind === 'reply' && !source?.url && (
                      <p className="local-muted">
                        Без ссылки на исходный пост ответ можно только
                        скопировать.
                      </p>
                    )}
                    <div className="local-actions">
                      <button
                        disabled={
                          errors.length > 0 || draft.status === 'published'
                        }
                        onClick={() =>
                          save({
                            ...workspace,
                            drafts: workspace.drafts.map((item) =>
                              item.id === draft.id
                                ? {
                                    ...item,
                                    status:
                                      item.status === 'reviewed'
                                        ? 'draft'
                                        : 'reviewed',
                                  }
                                : item,
                            ),
                          })
                        }
                      >
                        <Check size={15} />
                        {draft.status === 'reviewed'
                          ? 'Вернуть на проверку'
                          : 'Текст проверен'}
                      </button>
                      <button
                        disabled={
                          draft.status !== 'reviewed' || Boolean(errors.length)
                        }
                        onClick={() => {
                          setPublishId(draft.id)
                          setPublishedUrl('')
                        }}
                      >
                        Указать ссылку после публикации
                      </button>
                      <button
                        onClick={() =>
                          save({
                            ...workspace,
                            drafts: workspace.drafts.filter(
                              (item) => item.id !== draft.id,
                            ),
                          })
                        }
                      >
                        Удалить черновик
                      </button>
                    </div>
                    {draft.publishedUrl && (
                      <a
                        href={draft.publishedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Публикация (ссылка указана вами)
                      </a>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        )}
        {tab === 'profile' && (
          <div className="local-grid">
            <section className="local-card">
              <h2>Ваш голос</h2>
              <p>
                Используется в локальных шаблонах и промптах. Поля сохраняются в
                этом браузере.
              </p>
              {(
                [
                  ['name', 'Имя / бренд'],
                  ['audience', 'Для кого пишете'],
                  ['tone', 'Тон и стиль'],
                  ['expertise', 'Ваша экспертиза и подтверждённые факты'],
                  ['avoid', 'Что исключить'],
                ] as [keyof BrandVoice, string][]
              ).map(([key, label]) => (
                <label key={key}>
                  {label}
                  <textarea
                    rows={key === 'expertise' ? 4 : 2}
                    maxLength={2000}
                    value={workspace.profile[key]}
                    onChange={(event) =>
                      save({
                        ...workspace,
                        profile: {
                          ...workspace.profile,
                          [key]: event.target.value,
                        },
                      })
                    }
                  />
                </label>
              ))}
            </section>
            <section className="local-card">
              <h2>Данные под вашим контролем</h2>
              <p>
                Хранилище привязано к браузеру и адресу сайта. Оно не
                синхронизируется между устройствами. Очистка данных сайта удалит
                источники и черновики, поэтому регулярно скачивайте резервную
                копию. На общем компьютере другие пользователи этого профиля
                браузера смогут их прочитать.
              </p>
              <div className="local-actions">
                <button
                  onClick={() => {
                    try {
                      download(
                        `threads-backup-${new Date().toISOString().slice(0, 10)}.json`,
                        serializeWorkspace(workspace),
                      )
                    } catch (caught) {
                      setError(
                        caught instanceof Error
                          ? caught.message
                          : 'Ошибка экспорта',
                      )
                    }
                  }}
                >
                  <Download size={16} /> Скачать резервную копию
                </button>
                <label className="local-file">
                  Восстановить копию
                  <input
                    type="file"
                    accept=".json"
                    onChange={(event) => void readFile(event, true)}
                  />
                </label>
                <button onClick={() => setResetOpen(true)}>
                  Удалить локальные данные
                </button>
              </div>
              <h3>Что происходит автоматически</h3>
              <ul>
                <li>Импорт проверяется, повторы исключаются.</li>
                <li>Темы пересчитываются по сохранённой выборке.</li>
                <li>Черновики и изменения сохраняются в браузере.</li>
              </ul>
              <h3>Что требует вашего действия</h3>
              <ul>
                <li>Сбор загруженных постов в расширении.</li>
                <li>Проверка текста и реальная отправка в Threads.</li>
                <li>Для генерации моделью: запущенная локальная Ollama.</li>
              </ul>
              <p>
                Никаких фоновых комментариев, массовых рассылок и скрытого
                доступа к аккаунту.
              </p>
            </section>
          </div>
        )}
        <footer className="local-footer">
          Локальный режим независим от Supabase, Gemini и Meta API.{' '}
          <Link to="/setup">Облачные интеграции</Link> доступны отдельно.
        </footer>
      </main>
      {publishId && (
        <LocalDialog titleId="publish-title" onClose={() => setPublishId(null)}>
          <h2 id="publish-title">Подтверждение ручной публикации</h2>
          <p>
            Вставьте ссылку на уже опубликованный вами пост. Ассистент не
            проверяет факт публикации через API.
          </p>
          <label>
            Ссылка на ваш пост
            <input
              autoFocus
              value={publishedUrl}
              onChange={(event) => setPublishedUrl(event.target.value)}
              placeholder="https://www.threads.com/@name/post/…"
            />
          </label>
          <div className="local-actions">
            <button onClick={() => setPublishId(null)}>Отмена</button>
            <button
              className="local-primary"
              disabled={!canonicalThreadsUrl(publishedUrl)}
              onClick={confirmPublished}
            >
              Я опубликовал, сохранить ссылку
            </button>
          </div>
        </LocalDialog>
      )}
      {pendingRestore && (
        <LocalDialog
          titleId="restore-title"
          onClose={() => setPendingRestore(null)}
        >
          <h2 id="restore-title">Заменить данные копией?</h2>
          <p>
            Будет восстановлено {pendingRestore.posts.length} публикаций и{' '}
            {pendingRestore.drafts.length} черновиков. Текущая выборка и профиль
            будут заменены.
          </p>
          <div className="local-actions">
            <button onClick={() => setPendingRestore(null)}>Отмена</button>
            <button
              onClick={() => {
                try {
                  const raw = serializeWorkspace(pendingRestore)
                  localStorage.setItem(LOCAL_STORAGE_KEY, raw)
                  invalidateAsync()
                  lastStored.current = raw
                  workspaceRef.current = pendingRestore
                  setWorkspace(pendingRestore)
                  blockedRef.current = false
                  setStorageBlocked(false)
                  setPendingRestore(null)
                  setError('')
                  setNotice('Копия восстановлена.')
                } catch {
                  setError(
                    'Не удалось сохранить восстановленную копию. Текущие данные не изменены.',
                  )
                }
              }}
            >
              Заменить данные
            </button>
          </div>
        </LocalDialog>
      )}
      {resetOpen && (
        <LocalDialog titleId="reset-title" onClose={() => setResetOpen(false)}>
          <h2 id="reset-title">Удалить данные этого браузера?</h2>
          <p>
            Источники, профиль и черновики будут удалены. Без резервной копии
            восстановить их нельзя.
          </p>
          <div className="local-actions">
            <button onClick={() => setResetOpen(false)}>Отмена</button>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem(LOCAL_STORAGE_KEY)
                  invalidateAsync()
                  lastStored.current = null
                  workspaceRef.current = emptyWorkspace()
                  setWorkspace(workspaceRef.current)
                  blockedRef.current = false
                  setStorageBlocked(false)
                  setError('')
                  setResetOpen(false)
                  setNotice('Локальные данные удалены.')
                } catch {
                  setError('Не удалось очистить хранилище.')
                }
              }}
            >
              Удалить все локальные данные
            </button>
          </div>
        </LocalDialog>
      )}
    </div>
  )
}
