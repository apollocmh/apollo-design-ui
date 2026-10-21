/**
 * 搜索索引的失败重试（2026-10-21 审计 A10）。
 *
 * 旧实现把失败后的 Promise 永久缓存在 `loadPromise` 里，且 TopBar 在发起请求前
 * 就把 `searchIndexReady` 置 true ⇒ 一次网络抖动之后搜索再也打不开。
 * 这里钉住：失败必须清空缓存，第二次调用要重新请求。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ loadSearchIndex: vi.fn() }));

vi.mock('../src/composables/manifest', () => ({
  loadSearchIndex: mocks.loadSearchIndex,
}));

const DOC = {
  type: 'component',
  id: 'button',
  component: 'button',
  title: { zh: 'Button', en: 'Button' },
  subtitle: { zh: '按钮', en: 'Button' },
  text: { zh: '通用', en: 'General' },
  route: { zh: '/components/button', en: '/components/button' },
};

describe('搜索索引失败重试', () => {
  beforeEach(() => {
    mocks.loadSearchIndex.mockReset();
    vi.resetModules();
  });

  it('第一次失败后 error 为真；第二次调用会重新加载并成功', async () => {
    mocks.loadSearchIndex
      .mockRejectedValueOnce(new Error('chunk load failed'))
      .mockResolvedValueOnce([DOC]);

    const { useSearch } = await import('../src/composables/search');
    const search = useSearch();

    await expect(search.ensureIndex()).rejects.toThrow('chunk load failed');
    expect(search.error.value).toBe(true);

    await search.ensureIndex();
    expect(search.error.value).toBe(false);
    expect(mocks.loadSearchIndex).toHaveBeenCalledTimes(2);

    search.query.value = 'button';
    expect(search.results.value.map((r) => r.id)).toEqual(['button']);
  });

  it('并发调用复用同一个请求，不会重复下载', async () => {
    let resolve!: (docs: unknown[]) => void;
    mocks.loadSearchIndex.mockReturnValueOnce(
      new Promise<unknown[]>((r) => {
        resolve = r;
      }),
    );

    const { useSearch } = await import('../src/composables/search');
    const search = useSearch();
    const a = search.ensureIndex();
    const b = search.ensureIndex();
    resolve([DOC]);
    await Promise.all([a, b]);

    expect(mocks.loadSearchIndex).toHaveBeenCalledTimes(1);
  });
});
