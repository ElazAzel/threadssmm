export interface ContentType {
  id: string
  label: string
  description: string
  goal: string
  expectedEffect: string
  ctaStyle: string
  structure: string[]
  promptTemplate: string
  riskFactors: string[]
}

export const CONTENT_TYPES: ContentType[] = [
  {
    id: 'expert_post',
    label: 'Экспертный пост',
    description: 'Разбор ошибки, инсайт, экспертный взгляд на проблему',
    goal: 'trust',
    expectedEffect: 'Доверие, подписки, репосты',
    ctaStyle: 'soft',
    structure: ['Проблема', 'Почему это важно', 'Конкретный пример', 'Вывод'],
    promptTemplate: 'Напиши экспертный пост-разбор для Threads. Начни с проблемы или ошибки, объясни почему это важно, приведи конкретный пример, сделай вывод. Тон: уверенный, без самолюбования. Длина: 2-4 абзаца.',
    riskFactors: ['Звучит слишком высокомерно', 'Слишком длинный'],
  },
  {
    id: 'personal_observation',
    label: 'Личное наблюдение',
    description: 'Заметка о закономерности или тренде',
    goal: 'engagement',
    expectedEffect: 'Комментарии, обсуждение',
    ctaStyle: 'question',
    structure: ['Наблюдение', 'Контекст', 'Вопрос аудитории'],
    promptTemplate: 'Напиши короткое личное наблюдение для Threads. Поделись интересной закономерностью, которую заметил. Закончи вопросом к аудитории. Тон: искренний, без назидания.',
    riskFactors: ['Слишком очевидно', 'Без конкретики'],
  },
  {
    id: 'provocative_post',
    label: 'Провокационный пост',
    description: 'Нестандартный взгляд, который вызывает дискуссию',
    goal: 'reach',
    expectedEffect: 'Охват, комментарии, дискуссия',
    ctaStyle: 'question',
    structure: ['Смелый тезис', 'Аргументация', 'Приглашение к дискуссии'],
    promptTemplate: 'Напиши провокационный пост для Threads. Выскажи нестандартную точку зрения на тему. Аргументируй. Пригласи аудиторию к дискуссии. Тон: уверенный, уважительный, без токсичности.',
    riskFactors: ['Может быть воспринят агрессивно', 'Риск токсичных комментариев'],
  },
  {
    id: 'educational_post',
    label: 'Образовательный пост',
    description: 'Пошаговое руководство или инструкция',
    goal: 'saves',
    expectedEffect: 'Сохранения, доверие',
    ctaStyle: 'save',
    structure: ['Проблема', 'Пошаговое решение', 'Результат'],
    promptTemplate: 'Напиши образовательный пост-инструкцию для Threads. Объясни как сделать X за N шагов. Каждый шаг — 1-2 предложения. Тон: дружелюбный эксперт. Длина: 3-5 шагов.',
    riskFactors: ['Слишком сложно', 'Слишком базово'],
  },
  {
    id: 'short_insight',
    label: 'Короткий инсайт',
    description: '2-3 предложения с сильной мыслью',
    goal: 'frequency',
    expectedEffect: 'Репосты, цитирование',
    ctaStyle: 'none',
    structure: ['Сильная мысль', 'Контекст'],
    promptTemplate: 'Напиши короткий инсайт для Threads — 2-3 предложения. Сильная, законченная мысль. Без CTA. Тон: как случайная, но глубокая мысль.',
    riskFactors: ['Слишком общий', 'Без ценности'],
  },
  {
    id: 'mini_case',
    label: 'Мини-кейс',
    description: 'История клиента или проекта с результатами',
    goal: 'leads',
    expectedEffect: 'Заявки, доверие',
    ctaStyle: 'soft',
    structure: ['Исходная ситуация', 'Что сделали', 'Результат', 'CTA'],
    promptTemplate: 'Напиши мини-кейс для Threads. Опиши ситуацию клиента: что было, что сделали, что получили. Цифры обязательны. Мягкий CTA в конце. Тон: без хвастовства, с фокусом на пользу.',
    riskFactors: ['Слишком рекламно', 'Мало конкретики'],
  },
  {
    id: 'mistake_analysis',
    label: 'Разбор ошибки',
    description: 'Анализ ошибки и уроки из неё',
    goal: 'trust',
    expectedEffect: 'Доверие, сохранения',
    ctaStyle: 'soft',
    structure: ['Ошибка', 'Почему произошла', 'Что узнали', 'Совет'],
    promptTemplate: 'Напиши пост-разбор ошибки для Threads. Честно расскажи об ошибке, её последствиях и уроках. Закончи советом. Тон: искренний, самоирония допустима.',
    riskFactors: ['Слишком негативно', 'Подрывает экспертизу'],
  },
  {
    id: 'myth_vs_reality',
    label: 'Миф vs Реальность',
    description: 'Развенчание распространённого заблуждения',
    goal: 'engagement',
    expectedEffect: 'Комментарии, дискуссия',
    ctaStyle: 'question',
    structure: ['Миф', 'Почему это миф', 'Реальность', 'Вопрос'],
    promptTemplate: 'Напиши пост "Миф vs Реальность" для Threads. Возьми распространённый миф, объясни почему это не так и покажи реальность. Закончи вопросом. Тон: уверенный, но не менторский.',
    riskFactors: ['Слишком агрессивно к чужому мнению'],
  },
  {
    id: 'list_post',
    label: 'Список',
    description: 'Подборка инструментов, советов, ошибок',
    goal: 'saves',
    expectedEffect: 'Сохранения, виральность',
    ctaStyle: 'save',
    structure: ['Заголовок-список', 'N пунктов с пояснениями'],
    promptTemplate: 'Напиши пост-список для Threads. Перечисли N пунктов с краткими пояснениями. Формат: цифра + короткое пояснение. Тон: полезный, без воды.',
    riskFactors: ['Клише "5 способов"', 'Слишком длинный'],
  },
  {
    id: 'thread_post',
    label: 'Тред',
    description: 'Серия связанных постов (3-5 частей)',
    goal: 'deep_engagement',
    expectedEffect: 'Глубинная вовлечённость, подписки',
    ctaStyle: 'follow',
    structure: ['Хук (1/5)', 'Основная часть (2-4/5)', 'Вывод (5/5)'],
    promptTemplate: 'Напиши тред из 3-5 частей для Threads. Часть 1 — хук. Части 2-4 — основное содержание. Часть 5 — вывод и CTA. Каждая часть 2-3 предложения. Тон: вовлекающий.',
    riskFactors: ['Слишком длинный', 'Теряет нить'],
  },
  {
    id: 'news_reaction',
    label: 'Реакция на новость',
    description: 'Быстрый разбор актуальной новости',
    goal: 'trend',
    expectedEffect: 'Охват, тренд',
    ctaStyle: 'question',
    structure: ['Новость', 'Почему это важно', 'Мой взгляд', 'Что дальше'],
    promptTemplate: 'Напиши реакцию на новость для Threads. Кратко опиши новость, объясни почему это важно, дай свою оценку. Тон: актуальный, без паники.',
    riskFactors: ['Опоздал с реакцией', 'Поверхностно'],
  },
  {
    id: 'sales_post',
    label: 'Продающий пост',
    description: 'Пост с прямым или мягким предложением',
    goal: 'sales',
    expectedEffect: 'Продажи, заявки',
    ctaStyle: 'direct',
    structure: ['Боль', 'Решение', 'Предложение', 'CTA'],
    promptTemplate: 'Напиши продающий пост для Threads. Опиши боль аудитории, покажи решение, сделай предложение. CTA в конце. Тон: полезный, без навязчивости.',
    riskFactors: ['Слишком агрессивно', 'Мало ценности'],
  },
  {
    id: 'soft_cta_post',
    label: 'Пост с мягким CTA',
    description: 'Пост, который мягко подводит к действию',
    goal: 'leads',
    expectedEffect: 'Лиды, сообщения',
    ctaStyle: 'soft',
    structure: ['Ценность', 'Контекст', 'Мягкое предложение'],
    promptTemplate: 'Напиши пост с мягким CTA для Threads. Дай ценность, покажи контекст. CTA: "Напишите, покажу как". Тон: дружелюбный, без давления.',
    riskFactors: ['CTA теряется', 'Слишком общий'],
  },
  {
    id: 'engagement_post',
    label: 'Пост для комментариев',
    description: 'Пост, провоцирующий аудиторию на ответ',
    goal: 'engagement',
    expectedEffect: 'Комментарии, алгоритм',
    ctaStyle: 'question',
    structure: ['Тема', 'Свой ответ', 'Вопрос'],
    promptTemplate: 'Напиши пост для комментариев Threads. Подними тему, дай свой короткий ответ, задай вопрос аудитории. Формат: "А как у вас?"',
    riskFactors: ['Вопрос не вовлекает'],
  },
  {
    id: 'save_post',
    label: 'Пост для сохранений',
    description: 'Чек-лист или шаблон, который сохраняют',
    goal: 'saves',
    expectedEffect: 'Сохранения, долгий охват',
    ctaStyle: 'save',
    structure: ['Проблема', 'Чек-лист/шаблон', 'Призыв сохранить'],
    promptTemplate: 'Напиши практичный пост-шаблон для Threads, который люди захотят сохранить. Чек-лист, таблица или структура. Тон: полезный, конкретный.',
    riskFactors: ['Слишком сложный шаблон'],
  },
  {
    id: 'local_post',
    label: 'Пост для локальной аудитории',
    description: 'Пост с привязкой к городу/региону',
    goal: 'local_presence',
    expectedEffect: 'Локальное присутствие',
    ctaStyle: 'soft',
    structure: ['Локальный контекст', 'Основная мысль', 'Локальный CTA'],
    promptTemplate: 'Напиши пост для локальной аудитории Threads. Используй локальный контекст, примеры и CTA. Тон: "свой среди своих".',
    riskFactors: ['Слишком узко', 'Неинтересно не-локальным'],
  },
  {
    id: 'repurpose_post',
    label: 'Пост из успешного контента',
    description: 'Новая версия лучшего поста в другом формате',
    goal: 'efficiency',
    expectedEffect: 'Охват без создания с нуля',
    ctaStyle: 'save',
    structure: ['Новый угол', 'Суть', 'Вывод'],
    promptTemplate: 'Переработай существующий контент в новый формат для Threads. Смени угол подачи, обнови примеры, добавь свежий контекст.',
    riskFactors: ['Слишком похоже на оригинал'],
  },
]

export function getContentTypesByGoal(goal: string): ContentType[] {
  return CONTENT_TYPES.filter(ct => ct.goal === goal)
}

export function getContentTypeById(id: string): ContentType | undefined {
  return CONTENT_TYPES.find(ct => ct.id === id)
}

export function getContentTypeLabel(id: string): string {
  return CONTENT_TYPES.find(ct => ct.id === id)?.label ?? id
}

export function getPromptForContentType(
  typeId: string,
  customParams: Record<string, string> = {}
): string {
  const ct = getContentTypeById(typeId)
  if (!ct) return ''

  let prompt = ct.promptTemplate
  for (const [key, value] of Object.entries(customParams)) {
    prompt = prompt.replace(`{${key}}`, value)
  }

  return prompt
}
