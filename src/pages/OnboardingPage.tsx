import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '../components/ui'

const steps = ['Workspace', 'Аккаунт', 'Бренд', 'AI', 'Результат']

export function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [workspace, setWorkspace] = useState('TechNova Growth')
  const [brand, setBrand] = useState('TechNova')
  const [goal, setGoal] = useState('Экспертность и лиды')
  const [firstResult, setFirstResult] = useState('30-дневный контент-план')
  const navigate = useNavigate()

  const next = () => {
    if (step === steps.length - 1) navigate('/app/dashboard')
    else setStep((value) => value + 1)
  }

  return (
    <div className="onboarding-page">
      <header><span><Sparkles /> Threads SMM</span><b>Мастер настройки</b></header>
      <main>
        <Card className="mobile-onboarding-progress">
          <span className="mono-label">Прогресс настройки</span>
          {steps.map((label, index) => <div key={label} className={index <= step ? 'active' : ''}><i>{index < step ? <Check size={15} /> : ''}</i><span><b>{label}</b>{index === step ? <small>{index === 0 ? 'Основные параметры рабочего пространства.' : 'Текущий этап настройки.'}</small> : null}</span></div>)}
        </Card>
        <div className="stepper">
          {steps.map((label, index) => (
            <div key={label} className={index <= step ? 'step-active' : ''}>
              <i>{index < step ? <Check size={17} /> : index + 1}</i><span>{label}</span>
            </div>
          ))}
        </div>

        <Card className="onboarding-card">
          {step === 0 ? <>
            <h1>Настройте рабочее пространство</h1><p>Создайте основную среду для управления контентом.</p>
            <div className="form-grid"><label className="full">Название<input value={workspace} onChange={(e) => setWorkspace(e.target.value)} /></label><label>Регион<select><option>СНГ</option><option>Европа</option><option>Глобально</option></select></label><label>Язык<select><option>Русский</option><option>English</option></select></label></div>
          </> : null}
          {step === 1 ? <>
            <h1>Подключите Threads</h1><p>Используем только официальный OAuth. Пароли и cookies не хранятся.</p>
            <div className="connection-choice"><span>@technova_team</span><BadgeCheck /><strong>Тестовый аккаунт готов</strong></div>
          </> : null}
          {step === 2 ? <>
            <h1>Расскажите о бренде</h1><p>Эти данные станут контекстом для стратегии и всех генераций.</p>
            <div className="form-grid"><label>Название бренда<input value={brand} onChange={(e) => setBrand(e.target.value)} /></label><label>Ниша<input defaultValue="B2B SaaS / DevTools" /></label><label className="full">Целевая аудитория<textarea rows={3} defaultValue="CTO, engineering leads и продуктовые команды технологических компаний" /></label><label className="full">Главная цель<select value={goal} onChange={(e) => setGoal(e.target.value)}><option>Экспертность и лиды</option><option>Охваты</option><option>Продажи</option><option>Комьюнити</option></select></label></div>
          </> : null}
          {step === 3 ? <>
            <h1>Настройте AI</h1><p>Выберите модель и уровень осторожности. Публикации всё равно потребуют подтверждения.</p>
            <div className="form-grid"><label>Провайдер<select><option>OpenAI</option><option>Anthropic</option><option>Gemini</option><option>OpenRouter</option></select></label><label>Модель<select><option>GPT-4.1</option><option>Claude Sonnet</option><option>Gemini Pro</option></select></label><label className="full">Допустимый риск<input type="range" min="0" max="100" defaultValue="45" /></label></div>
          </> : null}
          {step === 4 ? <>
            <h1>Что создать первым?</h1><p>Первый результат появится в AI Studio и будет доступен для редактирования.</p>
            <div className="result-options">{['Стратегия', '30-дневный контент-план', '10 готовых постов', 'Тред', 'Реакции на новости'].map((item) => <button type="button" key={item} className={item === firstResult ? 'selected' : ''} onClick={() => setFirstResult(item)}>{item}</button>)}</div>
          </> : null}

          <div className="onboarding-actions">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}><ChevronLeft size={17} /> Назад</Button>
            <Button onClick={next}>{step === steps.length - 1 ? 'Открыть workspace' : 'Продолжить'} <ChevronRight size={17} /></Button>
          </div>
        </Card>
      </main>
    </div>
  )
}

function BadgeCheck() {
  return <span className="connection-check"><Check size={18} /></span>
}
