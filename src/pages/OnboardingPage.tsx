import { useEffect, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '../components/ui'
import { useWorkspace } from '../contexts/WorkspaceContext'

const steps = ['Workspace', 'Аккаунт', 'Бренд', 'AI', 'Результат']

export function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [workspaceName, setWorkspaceName] = useState('Моё рабочее пространство')
  const [region, setRegion] = useState('СНГ')
  const [handle, setHandle] = useState('')
  const [brandName, setBrandName] = useState('Мой бренд')
  const [niche, setNiche] = useState('')
  const [audience, setAudience] = useState('')
  const [goal, setGoal] = useState('Экспертность и лиды')
  const [firstResult, setFirstResult] = useState('30-дневный контент-план')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { workspace, createWorkspace } = useWorkspace()
  const navigate = useNavigate()

  useEffect(() => {
    if (workspace?.onboarding_completed) navigate('/app/dashboard', { replace: true })
  }, [navigate, workspace])

  const next = async () => {
    if (step < steps.length - 1) {
      setStep((value) => value + 1)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await createWorkspace({
        workspaceName,
        region,
        locale: 'ru',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        brandName,
        niche,
        audience,
        goal,
        firstResult,
        manualThreadsHandle: handle,
      })
      navigate('/app/dashboard', { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось создать рабочее пространство')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="onboarding-page">
      <header><span><Sparkles /> Threads SMM</span><b>Мастер настройки</b></header>
      <main>
        <Card className="mobile-onboarding-progress">
          <span className="mono-label">Прогресс настройки</span>
          {steps.map((label, index) => <div key={label} className={index <= step ? 'active' : ''}><i>{index < step ? <Check size={15} /> : ''}</i><span><b>{label}</b>{index === step ? <small>Текущий этап настройки рабочего пространства.</small> : null}</span></div>)}
        </Card>
        <div className="stepper">
          {steps.map((label, index) => <div key={label} className={index <= step ? 'step-active' : ''}><i>{index < step ? <Check size={17} /> : index + 1}</i><span>{label}</span></div>)}
        </div>

        <Card className="onboarding-card">
          {step === 0 ? <>
            <h1>Настройте рабочее пространство</h1><p>Здесь будут храниться бренды, аккаунты, контент и согласования команды.</p>
            <div className="form-grid"><label className="full">Название<input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} /></label><label>Регион<select value={region} onChange={(event) => setRegion(event.target.value)}><option>СНГ</option><option>Европа</option><option>Глобально</option></select></label><label>Язык<select disabled><option>Русский</option></select></label></div>
          </> : null}
          {step === 1 ? <>
            <h1>Добавьте Threads-аккаунт</h1><p>Пока можно сохранить имя профиля. Публикация станет доступна после подключения официального Meta OAuth.</p>
            <div className="form-grid"><label className="full">Threads username<input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@brand_name" /></label></div>
            <div className="connection-choice"><span>{handle || '@brand_name'}</span><BadgeCheck /><strong>{handle ? 'Профиль будет сохранён для ручной публикации' : 'Этот шаг можно пропустить'}</strong></div>
          </> : null}
          {step === 2 ? <>
            <h1>Расскажите о бренде</h1><p>Эти данные используются как контекст для стратегии и AI-генераций.</p>
            <div className="form-grid"><label>Название бренда<input value={brandName} onChange={(event) => setBrandName(event.target.value)} /></label><label>Ниша<input value={niche} onChange={(event) => setNiche(event.target.value)} placeholder="B2B SaaS / DevTools" /></label><label className="full">Целевая аудитория<textarea rows={3} value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="Кому и какую задачу решает продукт" /></label><label className="full">Главная цель<select value={goal} onChange={(event) => setGoal(event.target.value)}><option>Экспертность и лиды</option><option>Охваты</option><option>Продажи</option><option>Комьюнити</option></select></label></div>
          </> : null}
          {step === 3 ? <>
            <h1>AI на бесплатном тарифе</h1><p>Для генерации используется Gemini через серверный API. Ключ хранится только в Vercel и никогда не попадает в браузер.</p>
            <div className="form-grid"><label>Провайдер<select disabled><option>Google Gemini</option></select></label><label>Модель<select disabled><option>Gemini Flash</option></select></label><label className="full">Публикация<select disabled><option>Только после согласования</option></select></label></div>
          </> : null}
          {step === 4 ? <>
            <h1>Что создать первым?</h1><p>Выбор сохранится как стартовый сценарий после настройки.</p>
            <div className="result-options">{['Стратегия', '30-дневный контент-план', '10 готовых постов', 'Тред', 'Реакции на новости'].map((item) => <button type="button" key={item} className={item === firstResult ? 'selected' : ''} onClick={() => setFirstResult(item)}>{item}</button>)}</div>
          </> : null}

          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="onboarding-actions">
            <Button variant="ghost" disabled={step === 0 || submitting} onClick={() => setStep((value) => Math.max(0, value - 1))}><ChevronLeft size={17} /> Назад</Button>
            <Button onClick={() => void next()} disabled={submitting || !workspaceName.trim() || !brandName.trim()}>{submitting ? 'Создаём...' : step === steps.length - 1 ? 'Открыть workspace' : 'Продолжить'} <ChevronRight size={17} /></Button>
          </div>
        </Card>
      </main>
    </div>
  )
}

function BadgeCheck() {
  return <span className="connection-check"><Check size={18} /></span>
}
