import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import {
  announce,
  announceValues,
  createLiveRegion,
  formatLiveRegionText,
  LIVE_REGION_MAX_COUNT,
  resetAnnounceRegion,
  useLiveRegion,
  VISUALLY_HIDDEN_STYLE,
} from '../index';

afterEach(() => {
  // live region 是往 body 上挂真实节点的，测试之间必须收干净
  resetAnnounceRegion();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('VISUALLY_HIDDEN_STYLE（components/image/Progress.tsx:7-17）', () => {
  it('⭐ 与上游逐条一致 —— 上游写数字（React 补 px），这里写字符串', () => {
    expect(VISUALLY_HIDDEN_STYLE).toEqual({
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    });
  });

  it('是冻结的 —— 防止被某个消费者顺手改掉后影响全局', () => {
    expect(Object.isFrozen(VISUALLY_HIDDEN_STYLE)).toBe(true);
  });
});

describe('formatLiveRegionText（rc-select Polite.js）', () => {
  it('label 是 string / number 时播 label', () => {
    expect(formatLiveRegionText([{ label: 'Light' }, { label: 42 }])).toBe('Light, 42');
  });

  it('⭐ label 不是原始值时退回 value', () => {
    expect(formatLiveRegionText([{ label: { zh: '亮' }, value: 'light' }])).toBe('light');
  });

  it('两者都缺时该项为空 —— 与 Array.join 对 undefined 的处理一致', () => {
    expect(formatLiveRegionText([{ label: 'A' }, {}, { label: 'C' }])).toBe('A, , C');
  });

  it('分隔符是半角逗号加空格', () => {
    expect(formatLiveRegionText([{ label: 'a' }, { label: 'b' }, { label: 'c' }])).toBe('a, b, c');
  });

  it(`⭐ 超过 ${LIVE_REGION_MAX_COUNT} 条时截断并追加 ', ...'`, () => {
    const values = Array.from({ length: LIVE_REGION_MAX_COUNT + 1 }, (_, i) => ({
      label: `v${i}`,
    }));
    const text = formatLiveRegionText(values);
    expect(text.endsWith(', ...')).toBe(true);
    // 50 条 + ', ...'
    expect(text.split(', ')).toHaveLength(LIVE_REGION_MAX_COUNT + 1);
    expect(text).toContain('v0');
    expect(text).not.toContain(`v${LIVE_REGION_MAX_COUNT}`);
  });

  it(`刚好 ${LIVE_REGION_MAX_COUNT} 条时不追加省略号`, () => {
    const values = Array.from({ length: LIVE_REGION_MAX_COUNT }, (_, i) => ({ label: `v${i}` }));
    expect(formatLiveRegionText(values).endsWith(', ...')).toBe(false);
  });

  it('可以自定义 maxCount', () => {
    expect(formatLiveRegionText([{ label: 'a' }, { label: 'b' }], 1)).toBe('a, ...');
  });

  it('空数组得到空串（不是 ", ..."）', () => {
    expect(formatLiveRegionText([])).toBe('');
  });
});

describe('createLiveRegion（DOM 产物）', () => {
  it('⭐ 挂到 body 上，且带 role 与 aria-live', () => {
    const region = createLiveRegion();
    expect(region.element.parentElement).toBe(document.body);
    expect(region.element.getAttribute('role')).toBe('status');
    expect(region.element.getAttribute('aria-live')).toBe('polite');
  });

  it('隐藏样式真的落到了 style 上（不是只写在常量里）', () => {
    const region = createLiveRegion();
    const { style } = region.element;
    expect(style.position).toBe('absolute');
    expect(style.width).toBe('1px');
    expect(style.height).toBe('1px');
    expect(style.overflow).toBe('hidden');
    expect(style.whiteSpace).toBe('nowrap');
    expect(style.margin).toBe('-1px');
    // clip 会被 jsdom 规范化单位（rect(0,0,0,0) → rect(0px, 0px, 0px, 0px)），只判前缀
    expect(style.clip.startsWith('rect(')).toBe(true);
  });

  it('setText 改的是 textContent', () => {
    const region = createLiveRegion();
    region.setText('已选中 3 项');
    expect(region.element.textContent).toBe('已选中 3 项');
    region.setText('');
    expect(region.element.textContent).toBe('');
  });

  it('destroy 把节点摘掉', () => {
    const region = createLiveRegion();
    expect(document.body.contains(region.element)).toBe(true);
    region.destroy();
    expect(document.body.contains(region.element)).toBe(false);
  });

  it('可以覆盖 role / live / className', () => {
    const region = createLiveRegion({ role: 'alert', live: 'assertive', className: 'my-live' });
    expect(region.element.getAttribute('role')).toBe('alert');
    expect(region.element.getAttribute('aria-live')).toBe('assertive');
    expect(region.element.className).toBe('my-live');
  });

  it('显式传 doc 时用那个文档', () => {
    const other = document.implementation.createHTMLDocument('other');
    const region = createLiveRegion({ doc: other });
    expect(region.element.ownerDocument).toBe(other);
    expect(region.element.parentElement).toBe(other.body);
  });

  it('⭐ 没有 DOM 时抛错 —— 静默返回空壳会让「播报没生效」无法察觉', () => {
    vi.stubGlobal('window', {});
    expect(() => createLiveRegion()).toThrow(/需要 DOM/);
  });
});

describe('useLiveRegion（Vue 接线）', () => {
  function mountHost() {
    let api: ReturnType<typeof useLiveRegion> | undefined;
    const Host = defineComponent({
      setup() {
        api = useLiveRegion();
        return () => null;
      },
    });
    const wrapper = mount(Host);
    return { wrapper, api: api as ReturnType<typeof useLiveRegion> };
  }

  it('⭐ 挂载后才建节点 —— setup 阶段 body 上还没有 live region', () => {
    let regionCountDuringSetup = -1;
    const Host = defineComponent({
      setup() {
        useLiveRegion();
        regionCountDuringSetup = document.body.querySelectorAll('[aria-live]').length;
        return () => null;
      },
    });
    const wrapper = mount(Host);
    expect(regionCountDuringSetup).toBe(0);
    expect(document.body.querySelectorAll('[aria-live]')).toHaveLength(1);
    wrapper.unmount();
  });

  it('announce 写入文本', () => {
    const { wrapper, api } = mountHost();
    api.announce('已选中 3 项');
    const region = document.body.querySelector('[aria-live]');
    expect(region?.textContent).toBe('已选中 3 项');
    wrapper.unmount();
  });

  it('announceValues 走截断规则', () => {
    const { wrapper, api } = mountHost();
    api.announceValues([{ label: 'a' }, { label: 'b' }, { label: 'c' }], 2);
    const region = document.body.querySelector('[aria-live]');
    expect(region?.textContent).toBe('a, b, ...');
    wrapper.unmount();
  });

  it('⭐ 卸载即销毁 —— 不留残骸', () => {
    const { wrapper } = mountHost();
    expect(document.body.querySelectorAll('[aria-live]')).toHaveLength(1);
    wrapper.unmount();
    expect(document.body.querySelectorAll('[aria-live]')).toHaveLength(0);
  });

  it('未挂载（setup 阶段）就调用 announce 不抛错', () => {
    let api: ReturnType<typeof useLiveRegion> | undefined;
    const Host = defineComponent({
      setup() {
        api = useLiveRegion();
        // 模拟「组件还没挂载就有人播报」
        expect(() => api?.announce('太早了')).not.toThrow();
        return () => null;
      },
    });
    mount(Host).unmount();
  });
});

describe('announce / announceValues（模块级单例）', () => {
  it('不需要组件上下文就能播报', () => {
    announce('已保存');
    const regions = document.body.querySelectorAll('[aria-live]');
    expect(regions).toHaveLength(1);
    expect(regions[0]?.textContent).toBe('已保存');
  });

  it('⭐ 连续播报复用同一个节点 —— 换节点会让读屏当成新元素而丢掉前一条', () => {
    announce('第一条');
    const first = document.body.querySelector('[aria-live]');
    announce('第二条');
    const second = document.body.querySelector('[aria-live]');
    expect(second).toBe(first);
    expect(second?.textContent).toBe('第二条');
    expect(document.body.querySelectorAll('[aria-live]')).toHaveLength(1);
  });

  it('announceValues 走截断规则', () => {
    announceValues([{ label: 'a' }, { label: 'b' }, { label: 'c' }], 2);
    expect(document.body.querySelector('[aria-live]')?.textContent).toBe('a, b, ...');
  });

  it('resetAnnounceRegion 把节点摘掉，下一次播报会重建', () => {
    announce('x');
    const first = document.body.querySelector('[aria-live]');
    resetAnnounceRegion();
    expect(document.body.querySelectorAll('[aria-live]')).toHaveLength(0);

    announce('y');
    const second = document.body.querySelector('[aria-live]');
    expect(second).not.toBe(first);
    expect(second?.textContent).toBe('y');
  });

  it('resetAnnounceRegion 在从未播报过时也不抛错', () => {
    expect(() => resetAnnounceRegion()).not.toThrow();
  });
});
