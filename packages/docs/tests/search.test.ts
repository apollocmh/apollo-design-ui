/**
 * 站内搜索：匹配打分、分组、键盘操作与无障碍语义。
 *
 * 分两个层次：
 *   - composable 层（useSearch）：纯逻辑，可确定性断言；
 *   - 组件层（SearchModal）：键盘 ↑↓ / Enter / Esc 与 listbox ARIA —— 这是
 *     「搜索能用」和「搜索只能靠鼠标点」的分界线。
 */
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { beforeEach, describe, expect, it } from 'vitest';
import SearchModal from '../src/components/site/SearchModal.vue';
import { safeText, useSearch } from '../src/composables/search';

const GROUP_ORDER: string[] = ['component', 'demo', 'guide'];

describe('useSearch —— 打分与分组', () => {
  beforeEach(() => {
    useSearch().query.value = '';
  });

  it('组件名精确前缀命中排在最前', async () => {
    const { query, results, ensureIndex } = useSearch();
    await ensureIndex();
    query.value = 'table';
    await nextTick();
    expect(results.value.length).toBeGreaterThan(0);
    expect(results.value[0]!.id).toBe('table');
  });

  it('分组顺序恒为 组件 → 示例 → 指南（与命中多少无关）', async () => {
    const { query, grouped, ensureIndex } = useSearch();
    await ensureIndex();
    for (const q of ['table', 'form', 'tree', '主题', 'button']) {
      query.value = q;
      await nextTick();
      const types: string[] = grouped.value.map((g) => g.type);
      expect(types, `query=${q}`).toEqual(GROUP_ORDER.filter((t) => types.includes(t)));
    }
  });

  it('每个分组的条目数加起来等于结果总数（没有漏项）', async () => {
    const { query, grouped, results } = useSearch();
    query.value = 'table';
    await nextTick();
    const total = grouped.value.reduce((n, g) => n + g.items.length, 0);
    expect(total).toBe(results.value.length);
  });

  it('空查询不出结果；无结果时分组为空（渲染走空态）', async () => {
    const { query, results, grouped } = useSearch();
    query.value = '';
    await nextTick();
    expect(results.value).toEqual([]);
    expect(grouped.value).toEqual([]);
  });

  it('大小写不敏感', async () => {
    const { query, results } = useSearch();
    query.value = 'TABLE';
    await nextTick();
    expect(results.value.length).toBeGreaterThan(0);
  });

  it('中文查询命中中文标题', async () => {
    const { query, results } = useSearch();
    query.value = '表格';
    await nextTick();
    expect(results.value.map((r) => r.id)).toContain('table');
  });
});

describe('搜索索引里的脏数据不会让搜索崩溃', () => {
  // 🚨 真缺陷回归：result 组件的 403/404/500 示例 title 是 YAML **数字**，
  // 打分时 .toLowerCase 抛错 ⇒ 整个 SearchModal 渲染失败（白屏）。
  it('非字符串被当成空串而不是抛错', () => {
    expect(safeText(403)).toBe('');
    expect(safeText(undefined)).toBe('');
    expect(safeText(null)).toBe('');
    expect(safeText({ zh: 'x' })).toBe('');
    expect(safeText('Button')).toBe('Button');
  });
});

// ⚠️ SearchModal 用 <Teleport to="body"> —— teleport 出去的内容**不在 wrapper 里**，
//    必须查 document.body（用 stub 把 teleport 拍平会掩盖真实渲染位置）。
const $$ = (sel: string) => Array.from(document.body.querySelectorAll(sel));
const $ = (sel: string) => document.body.querySelector(sel);

/** 直接派发真实 KeyboardEvent（组件监听的是 keydown，不是 Vue 的 @keydown 合成事件）。 */
function press(el: Element, key: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

describe('SearchModal —— 键盘与 ARIA', () => {
  it('↑↓ 移动高亮，Enter 打开当前项', async () => {
    useSearch().query.value = 'table';
    await nextTick();
    const wrapper = mount(SearchModal, { attachTo: document.body });
    await nextTick();

    const items = $$('.site-search-item');
    expect(items.length).toBeGreaterThan(1);

    const input = $('.site-search-input')!;
    press(input, 'ArrowDown');
    await nextTick();
    expect($$('.site-search-item').findIndex((i) => i.classList.contains('active'))).toBe(1);

    press(input, 'ArrowUp');
    await nextTick();
    expect($$('.site-search-item').findIndex((i) => i.classList.contains('active'))).toBe(0);

    press(input, 'Enter');
    await nextTick();
    const nav = wrapper.emitted('navigate');
    expect(nav?.[0]?.[0]).toMatch(/^\/components\//);
    wrapper.unmount();
  });

  it('Esc 关闭', async () => {
    const wrapper = mount(SearchModal, { attachTo: document.body });
    await nextTick();
    press($('.site-search-input')!, 'Escape');
    expect(wrapper.emitted('close')).toBeTruthy();
    wrapper.unmount();
  });

  it('combobox / listbox 语义齐全，aria-activedescendant 指向真实 option id', async () => {
    useSearch().query.value = 'table';
    await nextTick();
    const wrapper = mount(SearchModal, { attachTo: document.body });
    await nextTick();
    const input = $('.site-search-input')!;
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-controls')).toBe('site-search-listbox');
    expect(input.getAttribute('aria-activedescendant')).toBe('search-opt-0');
    expect($('#site-search-listbox')?.getAttribute('role')).toBe('listbox');
    expect($('.site-search-item')?.getAttribute('role')).toBe('option');
    expect($('#search-opt-0')).toBeTruthy();
    wrapper.unmount();
  });

  it('无结果时给出空态，而不是空白面板', async () => {
    useSearch().query.value = 'zzz-不存在的关键字';
    await nextTick();
    const wrapper = mount(SearchModal, { attachTo: document.body });
    await nextTick();
    expect($('.site-search-empty')).toBeTruthy();
    expect($('.site-search-list')).toBeNull();
    wrapper.unmount();
  });
});
