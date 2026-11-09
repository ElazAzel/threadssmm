export function collectVisiblePosts() {
  const allowed = ['threads.com', 'www.threads.com', 'threads.net', 'www.threads.net'];
  if (!allowed.includes(location.hostname) || location.protocol !== 'https:') {
    throw new Error('Откройте вкладку https://www.threads.com или https://www.threads.net.');
  }
  const canonical = (href) => {
    try {
      const url = new URL(href, location.href);
      const match = url.pathname.match(/^\/@([A-Za-z0-9._]+)\/post\/([A-Za-z0-9_-]+)\/?$/);
      if (url.protocol !== 'https:' || !allowed.includes(url.hostname) || !match) return null;
      return { id: match[2], author: `@${match[1]}`, url: `https://www.threads.com/@${match[1]}/post/${match[2]}` };
    } catch { return null; }
  };
  const visible = (element) => {
    if (!element || element.closest('[hidden], [aria-hidden="true"], [inert]')) return false;
    for (let current = element; current; current = current.parentElement) {
      const style = getComputedStyle(current);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' || parseFloat(style.opacity) === 0) return false;
    }
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth;
  };
  const linksIn = (element) => new Set(Array.from(element.querySelectorAll('a[href]')).map((a) => canonical(a.getAttribute('href'))?.url).filter(Boolean));
  const posts = [];
  const seen = new Set();
  for (const anchor of document.querySelectorAll('a[href]')) {
    if (posts.length >= 200) break;
    const post = canonical(anchor.getAttribute('href'));
    if (!post || seen.has(post.url) || !visible(anchor)) continue;
    let container = anchor.parentElement;
    let chosen = null;
    for (let depth = 0; container && depth < 8; depth++, container = container.parentElement) {
      if (['BODY', 'MAIN', 'HTML'].includes(container.tagName) || container.getAttribute('role') === 'feed') break;
      if (linksIn(container).size !== 1) break;
      if (container.matches('article, [role="article"]') || container.querySelector('[dir="auto"]')) chosen = container;
      if (container.matches('article, [role="article"]')) break;
    }
    if (!chosen) continue;
    const parts = [];
    const walker = document.createTreeWalker(chosen, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const element = node.parentElement;
      if (!visible(element) || element.closest('button, [role="button"], time, script, style, input, textarea, select, nav')) continue;
      const link = element.closest('a');
      if (link && (canonical(link.getAttribute('href')) || /^\/@[^/]+\/?$/.test(new URL(link.href, location.href).pathname))) continue;
      const text = node.textContent.trim();
      if (text && text !== post.author && text !== post.author.slice(1)) parts.push(text);
    }
    const text = parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, 10000);
    if (!text) continue;
    const time = Array.from(chosen.querySelectorAll('time[datetime]')).find(visible);
    const datetime = time?.getAttribute('datetime') || '';
    const date = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(datetime) ? new Date(datetime) : null;
    posts.push({ ...post, text, publishedAt: date && !Number.isNaN(date.getTime()) ? date.toISOString() : null, likes: null, replies: null, reposts: null });
    seen.add(post.url);
  }
  return { schemaVersion: 1, posts };
}
