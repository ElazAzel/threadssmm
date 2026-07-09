export interface Plan {
  id: string
  name: string
  price: number
  tokensPerMonth: number
  maxBrands: number
  maxAccounts: number
  features: string[]
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 15,
    tokensPerMonth: 100,
    maxBrands: 1,
    maxAccounts: 1,
    features: ['100 токенов в месяц', '1 бренд', '1 аккаунт Threads', 'Базовые AI-модели', 'Планирование постов'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 39,
    tokensPerMonth: 400,
    maxBrands: 3,
    maxAccounts: 5,
    features: ['400 токенов в месяц', '3 бренда', '5 аккаунтов Threads', 'Все AI-модели', 'Engagement Factory', 'Аналитика'],
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    tokensPerMonth: 1200,
    maxBrands: 10,
    maxAccounts: 20,
    features: ['1200 токенов в месяц', '10 брендов', '20 аккаунтов Threads', 'Все AI-модели + Vision', 'Engagement + Reply Assistant', 'API-доступ', 'Приоритетная поддержка'],
  },
]

export const TOKEN_PACKS = [
  { id: 'tokens-100', tokens: 100, price: 10 },
  { id: 'tokens-500', tokens: 500, price: 40 },
  { id: 'tokens-2000', tokens: 2000, price: 140 },
]

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id)
}

export function calculateMargin(planId: string, aiApiCostPerUser: number): number {
  const plan = getPlanById(planId)
  if (!plan) return 0
  const infraCost = 0.10
  const paymentFee = plan.price * 0.029 + 0.30
  const tax = plan.price * 0.05
  const totalCost = aiApiCostPerUser + infraCost + paymentFee + tax
  return Math.round((1 - totalCost / plan.price) * 100)
}
