export interface Plan {
  id: string
  name: string
  price: number
  priceAnnual: number
  tokensPerMonth: number
  maxBrands: number
  maxAccounts: number
  trialTokens: number
  features: string[]
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 15,
    priceAnnual: 144,
    tokensPerMonth: 150,
    maxBrands: 1,
    maxAccounts: 1,
    trialTokens: 50,
    features: [
      '150 токенов в месяц', '1 бренд', '1 аккаунт Threads',
      'Все бюджетные AI-модели', 'Планирование постов', 'Календарь',
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    price: 29,
    priceAnnual: 278,
    tokensPerMonth: 400,
    maxBrands: 3,
    maxAccounts: 5,
    trialTokens: 100,
    features: [
      '400 токенов в месяц', '3 бренда', '5 аккаунтов Threads',
      'Все AI-модели (кроме Opus)', 'Engagement & Аналитика',
      'Генерация изображений (до 10/мес)', 'Приоритетная поддержка',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 59,
    priceAnnual: 566,
    tokensPerMonth: 1000,
    maxBrands: 10,
    maxAccounts: 30,
    trialTokens: 200,
    features: [
      '1000 токенов в месяц', '10 брендов', '30 аккаунтов',
      'Все AI-модели включая Claude Opus 4', 'Engagement + Reply Assistant',
      'Генерация изображений (до 30/мес)', 'API-доступ', 'Аудитория и сегменты',
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 149,
    priceAnnual: 1428,
    tokensPerMonth: 3000,
    maxBrands: 50,
    maxAccounts: 100,
    trialTokens: 500,
    features: [
      '3000 токенов в месяц', 'До 50 брендов', 'До 100 аккаунтов',
      'Все AI-модели без ограничений', 'Все функции платформы',
      'Выделенный менеджер', 'Самые дешёвые токены ($0.05/шт)',
      'White-label отчётность',
    ],
  },
]

export const TOKEN_PACKS = [
  { id: 'tokens-200', tokens: 200, price: 19 },
  { id: 'tokens-600', tokens: 600, price: 50 },
  { id: 'tokens-2000', tokens: 2000, price: 145 },
]

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id)
}

/** Чистая прибыль плана в % (без учёта персонала) */
export function calculateMargin(planId: string): number {
  const plan = getPlanById(planId)
  if (!plan) return 0
  const aiApiCost = plan.tokensPerMonth * 0.001
  const infraCost = 0.10
  const paymentFee = plan.price * 0.029 + 0.30
  const tax = plan.price * 0.05
  const totalCost = aiApiCost + infraCost + paymentFee + tax
  return Math.round((1 - totalCost / plan.price) * 100)
}

/** Цена в $ за 1 токен внутри плана */
export function tokenPriceInPlan(planId: string): number {
  const plan = getPlanById(planId)
  if (!plan) return 0
  return plan.price / plan.tokensPerMonth
}
