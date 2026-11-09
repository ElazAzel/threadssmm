import { collectVisiblePosts } from './collector.js';
const capture = document.querySelector('#capture');
const copy = document.querySelector('#copy');
const download = document.querySelector('#download');
const status = document.querySelector('#status');
const preview = document.querySelector('#preview');
let payload = '';
capture.addEventListener('click', async () => {
  capture.disabled = true;
  copy.disabled = true;
  download.disabled = true;
  payload = '';
  preview.value = '';
  status.textContent = 'Собираем видимые посты…';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab?.url || 'about:blank');
    if (url.protocol !== 'https:' || !['threads.com', 'www.threads.com', 'threads.net', 'www.threads.net'].includes(url.hostname)) {
      throw new Error('Откройте вкладку Threads (threads.com или threads.net).');
    }
    const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: collectVisiblePosts });
    if (!result?.result || result.result.schemaVersion !== 1) throw new Error('Не удалось прочитать видимую часть страницы.');
    payload = JSON.stringify(result.result, null, 2);
    preview.value = payload;
    const count = result.result.posts.length;
    status.textContent = count ? `Собрано: ${count}. Проверьте выборку перед импортом.` : 'Посты не найдены. Откройте ленту и попробуйте снова. Структура страницы могла измениться.';
    copy.disabled = !count;
    download.disabled = !count;
  } catch (error) {
    status.textContent = `Ошибка: ${error.message || 'Не удалось собрать посты.'}`;
  } finally { capture.disabled = false; }
});
copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(payload);
    status.textContent = 'JSON скопирован. Вставьте его в импорт локального помощника.';
  } catch {
    preview.focus();
    preview.select();
    status.textContent = 'Автокопирование недоступно. Нажмите Ctrl+C / Cmd+C или скачайте JSON.';
  }
});
download.addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `threads-visible-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = 'JSON подготовлен к скачиванию. Импортируйте файл в локальном помощнике.';
});
