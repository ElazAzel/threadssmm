import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Window } from 'happy-dom';
import { readFileSync, readdirSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

const source = readFileSync('extensions/threads-capture/collector.js', 'utf8');
const collect = new Function(`${source.replace('export function', 'function')}; return collectVisiblePosts();`);
let window: Window;
const fixture = (id: string, extra = '') => `<article ${extra}><a href="/@alice/post/${id}?x=1"><time datetime="2026-11-09T12:00:00Z">1 ч</time></a><a href="/@alice">alice</a><div dir="auto">Текст ${id}</div><button>Нравится 27</button></article>`;

beforeEach(() => {
  window = new Window({ url: 'https://www.threads.com/' });
  vi.stubGlobal('document', window.document);
  vi.stubGlobal('location', window.location);
  vi.stubGlobal('NodeFilter', window.NodeFilter);
  vi.stubGlobal('getComputedStyle', window.getComputedStyle.bind(window));
  vi.stubGlobal('innerHeight', 900);
  vi.stubGlobal('innerWidth', 1200);
  vi.spyOn(window.HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const offscreen = Boolean(this.closest('[data-offscreen]'));
    return { x: 0, y: offscreen ? 1000 : 10, top: offscreen ? 1000 : 10, bottom: offscreen ? 1100 : 100, left: 0, right: 400, width: 400, height: 90, toJSON: () => ({}) };
  });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); window.happyDOM.abort(); });

describe('manual visible Threads capture', () => {
  it('extracts canonical links, explicit date and text, without inventing metrics', () => {
    window.document.body.innerHTML = fixture('abc');
    expect(collect()).toEqual({ schemaVersion: 1, posts: [{ id: 'abc', url: 'https://www.threads.com/@alice/post/abc', author: '@alice', text: 'Текст abc', publishedAt: '2026-11-09T12:00:00.000Z', likes: null, replies: null, reposts: null }] });
  });
  it('deduplicates and excludes hidden and offscreen posts and text', () => {
    window.document.body.innerHTML = fixture('a') + fixture('a') + fixture('b', 'hidden') + fixture('c', 'data-offscreen') + fixture('d', 'style="display:none"');
    window.document.querySelector('article div')!.innerHTML += '<span aria-hidden="true">secret</span>';
    expect(collect().posts.map((post: { id: string }) => post.id)).toEqual(['a']);
    expect(collect().posts[0].text).toBe('Текст a');
  });
  it('skips ambiguous nested posts, unrelated links and invalid dates', () => {
    window.document.body.innerHTML = `<article><a href="/@alice/post/a">a</a><a href="/@bob/post/b">b</a><div dir="auto">ambiguous</div></article>` + fixture('good').replace('2026-11-09T12:00:00Z', 'invalid') + fixture('evil').replace('/@alice/post/evil?x=1', 'https://evil.example/@alice/post/evil');
    expect(collect().posts).toHaveLength(1);
    expect(collect().posts[0].publishedAt).toBeNull();
  });
  it('limits the selection to 200 posts', () => {
    window.document.body.innerHTML = Array.from({ length: 205 }, (_, i) => fixture(`p${i}`)).join('');
    expect(collect().posts).toHaveLength(200);
  });
  it.each(['threads.com', 'www.threads.com', 'threads.net', 'www.threads.net'])('accepts the explicit origin %s', (hostname) => {
    vi.stubGlobal('location', { hostname, protocol: 'https:', href: `https://${hostname}/` });
    window.document.body.innerHTML = fixture('origin');
    expect(collect().posts).toHaveLength(1);
  });
  it('rejects non-Threads origins', () => {
    vi.stubGlobal('location', { hostname: 'evil.example', protocol: 'https:' });
    expect(collect).toThrow('Откройте вкладку');
  });
  it('uses only temporary active-tab permissions and no background process', () => {
    const manifest = JSON.parse(readFileSync('extensions/threads-capture/manifest.json', 'utf8'));
    expect(manifest.permissions).toEqual(['activeTab', 'scripting']);
    expect(manifest.host_permissions).toBeUndefined();
    expect(manifest.background).toBeUndefined();
    expect(manifest.content_scripts).toBeUndefined();
  });
});

describe('downloadable collector package', () => {
  it('ships exactly the current extension files without stale or extra content', () => {
    const zip = readFileSync('public/downloads/threads-capture.zip');
    const entries = new Map<string, Buffer>();
    let end = zip.length - 22;
    while (end >= Math.max(0, zip.length - 65557) && zip.readUInt32LE(end) !== 0x06054b50) end--;
    expect(end).toBeGreaterThanOrEqual(0);
    let offset = zip.readUInt32LE(end + 16);
    const count = zip.readUInt16LE(end + 10);
    for (let i = 0; i < count; i++) {
      expect(zip.readUInt32LE(offset)).toBe(0x02014b50);
      const method = zip.readUInt16LE(offset + 10);
      const size = zip.readUInt32LE(offset + 20);
      const nameLength = zip.readUInt16LE(offset + 28);
      const extraLength = zip.readUInt16LE(offset + 30);
      const commentLength = zip.readUInt16LE(offset + 32);
      const local = zip.readUInt32LE(offset + 42);
      const name = zip.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
      expect(zip.readUInt32LE(local)).toBe(0x04034b50);
      expect([0, 8]).toContain(method);
      const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
      const content = zip.subarray(start, start + size);
      expect(entries.has(name)).toBe(false);
      if (!name.endsWith('/')) entries.set(name, method === 8 ? inflateRawSync(content) : content);
      offset += 46 + nameLength + extraLength + commentLength;
    }
    const filenames = readdirSync('extensions/threads-capture').sort();
    expect([...entries.keys()].sort()).toEqual(filenames.map(name => `threads-capture/${name}`));
    for (const name of filenames) {
      expect(entries.get(`threads-capture/${name}`)?.equals(readFileSync(`extensions/threads-capture/${name}`)), name).toBe(true);
    }
  });
});
