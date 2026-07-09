import type { PromptPreset } from './types'

export const PRESETS: PromptPreset[] = [
  {
    id: 'news_reaction',
    label: 'Пост из новости',
    description: 'Берёт новость, делает вывод, пишет пост',
    icon: '⚡',
    systemPrompt: 'Сделай пост-реакцию на свежую новость: кратко перескажи суть, покажи свою позицию/вывод, пригласи к обсуждению.',
    slotDefaults: { format: 'post', goal: 'вовлечение аудитории' },
  },
  {
    id: 'sales_post',
    label: 'Продающий пост',
    description: 'Пост с фокусом на продукт и конверсию',
    icon: '🚀',
    systemPrompt: 'Сделай продающий пост: покажи боль клиента, предложи решение (продукт), подведи к мягкому CTA. Без агрессивных продаж.',
    slotDefaults: { format: 'post', goal: 'получить заявки' },
  },
  {
    id: 'expert_opinion',
    label: 'Экспертное мнение',
    description: 'Авторитетная позиция по теме',
    icon: '💡',
    systemPrompt: 'Сделай экспертный пост: покажи глубокое понимание темы, предложи уникальный угол, поделись инсайтом.',
    slotDefaults: { format: 'post', tone: 'экспертный, авторитетный', goal: 'укрепить экспертность' },
  },
  {
    id: 'personal_story',
    label: 'Личный пост',
    description: 'История, ценности, бэкстейдж',
    icon: '👤',
    systemPrompt: 'Сделай личный пост: расскажи историю из опыта, покажи человеческую сторону, сделай вывод с ценностью.',
    slotDefaults: { format: 'post', tone: 'тёплый, человечный' },
  },
  {
    id: 'short_thread',
    label: 'Короткий тред',
    description: 'Серия из 3-5 постов на одну тему',
    icon: '🧵',
    systemPrompt: 'Сделай тред из 3-5 коротких постов. Первый — хук, последний — CTA. Каждый пост самодостаточен.',
    slotDefaults: { format: 'thread' },
  },
  {
    id: 'trend_reaction',
    label: 'Реакция на тренд',
    description: 'Пост про актуальную тему / мем / тренд',
    icon: '🔥',
    systemPrompt: 'Сделай пост-реакцию на тренд: покажи, что ты в контексте, добавь своё уникальное видение.',
    slotDefaults: { format: 'post', tone: 'живой, разговорный', goal: 'вовлечение аудитории' },
  },
  {
    id: 'rebrand_to_style',
    label: 'В стиле бренда',
    description: 'Переписать существующий текст в голосе бренда',
    icon: '🎨',
    systemPrompt: 'Перепиши текст в соответствии с голосом бренда. Сохрани смысл, измени подачу.',
    slotDefaults: { format: 'post' },
  },
  {
    id: 'no_ai_vibe',
    label: 'Без ИИ-вайба',
    description: 'Убрать шаблонность, сделать человечнее',
    icon: '🤖→🧑',
    systemPrompt: 'Убери все признаки AI-текста: шаблонные фразы, идеальные структуры, канцелярит. Сделай так, чтобы текст звучал как от живого человека.',
    slotDefaults: { format: 'post', tone: 'живой, разговорный' },
  },
  {
    id: 'content_plan',
    label: 'Контент-план',
    description: 'План публикаций на неделю/месяц',
    icon: '📅',
    systemPrompt: 'Составь контент-план. Для каждого дня укажи: тему, формат, цель, CTA. Учитывай контент-пиллары бренда.',
    slotDefaults: { format: 'post', goal: 'системная публикация' },
  },
  {
    id: 'hook_fix',
    label: 'Усилить хук',
    description: 'Сделать начало цепляющим',
    icon: '🎣',
    systemPrompt: 'Перепиши начало поста так, чтобы оно цепляло с первой строки. Используй: вопрос, неожиданный факт, противоречие, боль аудитории.',
    slotDefaults: { format: 'post' },
  },
]

export function getPresetById(id: string): PromptPreset | undefined {
  return PRESETS.find((p) => p.id === id)
}
