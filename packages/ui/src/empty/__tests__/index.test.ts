/**
 * L1 · 单元测试 + L2 的适用性说明
 *
 * ── 为什么没有 L2（交互）────────────────────────────────────────────────────
 *
 * Empty 是**纯展示组件**：没有事件、没有状态、没有受控/非受控语义、没有键盘交互。
 * `TESTING.md` 的 L2 要求覆盖「鼠标 / 键盘 / 焦点 / 受控 / 禁用」六类 —— 这里一类都不适用。
 * 所以 L2 判 `n/a`（依据写进 `registry/components.json` 的 `layerNotes`），
 * 而不是「写几个 `expect(exists()).toBe(true)` 把格子填上」（反模式 A1）。
 *
 * 本文件仍然承担 L1 的全部职责：把每条分支判据**逐条**钉住。
 *
 * ── 这个文件里最重要的一组用例 ───────────────────────────────────────────────
 *
 * 「不传 description / image 时的行为」看似是 happy path，其实是本组件踩过的坑：
 * Vue 的 Boolean prop 转换会把 `VNodeChild` 类型（含 `boolean`）的未传 prop 变成 `false`。
 * 详见 `Empty.vue` 的 `withDefaults` 注释与 `COMPATIBILITY.md` 的 D9。
 * 下面的 `不传 description` / `不传 image` 两条用例就是这个坑的回归防护。
 */

import { mountTest, resetWarned } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { configContextKey, DEFAULT_CONFIG_CONTEXT } from '../../config-provider/context';
import { EmptyImage, SimpleEmptyImage } from '../components/Images';
import { Empty, PRESENTED_IMAGE_DEFAULT, PRESENTED_IMAGE_SIMPLE } from '../index';

const P = 'apollo';
const mountEmpty = (props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>) =>
  mount(Empty, {
    props: { prefixCls: P, ...props },
    ...(slots ? { slots } : {}),
  });

mountTest('Empty', { render: () => h(Empty) });

describe('Empty · 基本结构', () => {
  it('默认渲染：根 + image 容器 + description 容器，没有 footer', () => {
    const w = mountEmpty();
    expect(w.classes()).toEqual([P]);
    expect(w.find(`.${P}-image`).exists()).toBe(true);
    expect(w.find(`.${P}-description`).text()).toBe('No data');
    expect(w.find(`.${P}-footer`).exists()).toBe(false);
  });

  it('★ 不传 description 时取 locale 文案（Boolean prop 转换的回归防护）', () => {
    // 若 `withDefaults` 里的 `description: undefined` 被删掉，这里会变成 `false`：
    // 描述块整块消失，而测试若只断言「能渲染」就抓不到。
    expect(mountEmpty().find(`.${P}-description`).text()).toBe('No data');
  });

  it('★ 不传 image 时渲染默认插画（同上）', () => {
    const image = mountEmpty().find(`.${P}-image`);
    expect(image.find('svg').exists()).toBe(true);
    expect(image.find('svg').attributes('viewBox')).toBe('0 0 184 152');
  });

  it('prefixCls 贯穿根与全部子结构类名（T12）', () => {
    const w = mountEmpty({ prefixCls: 'my-prefix' });
    expect(w.classes()).toContain('my-prefix');
    expect(w.find('.my-prefix-image').exists()).toBe(true);
    expect(w.find('.my-prefix-description').exists()).toBe(true);
  });

  it('不传 prefixCls 时兜底为 `apollo-empty`（无 ConfigProvider）', () => {
    // ⚠️ 兜底值带组件后缀：`getPrefixCls('empty')` → `${defaultPrefixCls}-empty`。
    // 与 antd 的 `ant-empty` 同构 —— 早期把默认值写成裸 `apollo` 是错的。
    const w = mount(Empty);
    expect(w.classes()).toContain('apollo-empty');
    expect(w.find('.apollo-empty-image').exists()).toBe(true);
  });
});

describe('Empty · description 的两条判据', () => {
  it('传字符串：用传入值，并渲染', () => {
    const w = mountEmpty({ description: 'Nothing' });
    expect(w.find(`.${P}-description`).text()).toBe('Nothing');
  });

  it('传 false：不渲染描述块', () => {
    expect(mountEmpty({ description: false }).find(`.${P}-description`).exists()).toBe(false);
  });

  it('传空字符串：**不渲染**（isRenderable 判假），但取值确实用了传入值', () => {
    const w = mountEmpty({ description: '' });
    expect(w.find(`.${P}-description`).exists()).toBe(false);
    // 取值确实走了传入值这条分支：`alt` 用的是 `des`，字符串 `''` → `alt` 为 `''`
    // （若回退到 locale，`alt` 会是 'No data'）。见下一条的断言。
  });

  it('★ 传 0：渲染出 `0`（isRenderable(0) 为真，与 `v-if="des"` 的差别就在这里）', () => {
    const w = mountEmpty({ description: 0 });
    expect(w.find(`.${P}-description`).text()).toBe('0');
  });

  it('传节点：原样渲染', () => {
    const w = mountEmpty({ description: h('span', { class: 'd' }, 'node') });
    expect(w.find(`.${P}-description .d`).text()).toBe('node');
  });
});

describe('Empty · alt 的计算（用 des 而不是 description）', () => {
  it('不传 description：alt 是 locale 文案，不是 `empty`', () => {
    const w = mountEmpty({ image: 'https://example.com/a.png' });
    expect(w.find('img').attributes('alt')).toBe('No data');
  });

  it('传字符串 description：alt 就是它', () => {
    const w = mountEmpty({
      description: 'Nothing',
      image: 'https://example.com/a.png',
    });
    expect(w.find('img').attributes('alt')).toBe('Nothing');
  });

  it('传节点 description：alt 回退为 `empty`', () => {
    const w = mountEmpty({
      description: h('span', null, 'x'),
      image: 'https://example.com/a.png',
    });
    expect(w.find('img').attributes('alt')).toBe('empty');
  });

  it('传空字符串 description：alt 是空串（取值走传入值分支）', () => {
    const w = mountEmpty({
      description: '',
      image: 'https://example.com/a.png',
    });
    expect(w.find('img').attributes('alt')).toBe('');
  });
});

describe('Empty · image 的三种形态', () => {
  it('字符串 → <img draggable="false" alt src>', () => {
    const img = mountEmpty({ image: 'https://example.com/a.png' }).find('img');
    expect(img.attributes('src')).toBe('https://example.com/a.png');
    expect(img.attributes('draggable')).toBe('false');
  });

  it('组件 → 渲染该组件', () => {
    const w = mountEmpty({ image: h('div', { class: 'mine' }, 'x') });
    expect(w.find(`.${P}-image .mine`).exists()).toBe(true);
  });

  it('PRESENTED_IMAGE_SIMPLE → 简洁插画 + 根上加 -normal', () => {
    const w = mountEmpty({ image: PRESENTED_IMAGE_SIMPLE });
    expect(w.classes()).toContain(`${P}-normal`);
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 64 41');
  });

  it('PRESENTED_IMAGE_DEFAULT 显式传入 → 不加 -normal', () => {
    const w = mountEmpty({ image: PRESENTED_IMAGE_DEFAULT });
    expect(w.classes()).not.toContain(`${P}-normal`);
  });

  it('★ 判据是引用相等：形状相同的另一个组件不会触发 -normal', () => {
    // 若把判据写成「宽度是 64」，这条会红 —— 这正是它存在的意义。
    const lookalike = {
      name: 'ALookalike',
      template: '<svg width="64" height="41"></svg>',
    };
    const w = mountEmpty({ image: lookalike });
    expect(w.classes()).not.toContain(`${P}-normal`);
  });

  it('常量与具名导出、静态属性三处是同一个对象', () => {
    expect(PRESENTED_IMAGE_SIMPLE).toBe(SimpleEmptyImage);
    expect(PRESENTED_IMAGE_DEFAULT).toBe(EmptyImage);
    expect((Empty as unknown as { PRESENTED_IMAGE_SIMPLE: unknown }).PRESENTED_IMAGE_SIMPLE).toBe(
      SimpleEmptyImage,
    );
    expect((Empty as unknown as { PRESENTED_IMAGE_DEFAULT: unknown }).PRESENTED_IMAGE_DEFAULT).toBe(
      EmptyImage,
    );
  });
});

describe('Empty · class / style / 属性透传', () => {
  it('className 与 rootClassName 都落在根元素', () => {
    const w = mountEmpty({ className: 'a', rootClassName: 'b' });
    expect(w.classes()).toContain('a');
    expect(w.classes()).toContain('b');
  });

  it('未声明的属性透传到根元素', () => {
    const w = mountEmpty({ 'data-testid': 'x', title: 'tip' });
    expect(w.attributes('data-testid')).toBe('x');
    expect(w.attributes('title')).toBe('tip');
  });

  it('imageStyle 与 styles.image 合并，后者覆盖前者', () => {
    const w = mountEmpty({
      imageStyle: { margin: '3px', color: 'red' },
      styles: { image: { color: 'blue' } },
    });
    const style = w.find(`.${P}-image`).attributes('style') ?? '';
    expect(style).toContain('margin: 3px');
    expect(style).toContain('color: blue');
    expect(style).not.toContain('red');
  });

  it('★ 没有样式时**不输出** `style` 属性（antd 也不输出）', () => {
    // 这条差异 L4 **测不出来**：投影会把「没有 style 属性」与 `style=""` 都归一化成空串。
    // 所以必须在这里钉住。反例：直接绑 `:style="mergedStyles.root"`（恒是对象）会输出 `style=""`。
    const w = mountEmpty();
    expect(w.attributes('style')).toBeUndefined();
    expect(w.find(`.${P}-image`).attributes('style')).toBeUndefined();
    expect(w.find(`.${P}-description`).attributes('style')).toBeUndefined();
  });

  it('★ `style` 覆盖 `styles.root`（合并顺序里最反直觉的一条）', () => {
    const w = mountEmpty({
      style: { color: 'green' },
      styles: { root: { color: 'red' } },
    });
    const style = w.attributes('style') ?? '';
    expect(style).toContain('color: green');
    expect(style).not.toContain('red');
  });
});

describe('Empty · 语义化 classNames / styles', () => {
  it('对象式：四个槽位各自落位', () => {
    const w = mountEmpty(
      {
        classNames: {
          root: 'cn-root',
          image: 'cn-image',
          description: 'cn-description',
          footer: 'cn-footer',
        },
      },
      { default: () => h('button', null, 'Create') },
    );
    expect(w.classes()).toContain('cn-root');
    expect(w.find(`.${P}-image`).classes()).toContain('cn-image');
    expect(w.find(`.${P}-description`).classes()).toContain('cn-description');
    expect(w.find(`.${P}-footer`).classes()).toContain('cn-footer');
  });

  it('★ 函数式：被调用且收到 `{ props }`（裁决 empty-semantic-fn = B）', () => {
    const fn = vi.fn((info: { props: { description?: unknown } }) => ({
      root: `from-${String(info.props.description)}`,
    }));
    const w = mountEmpty({ classNames: fn, description: 'D' });
    expect(fn).toHaveBeenCalled();
    expect(w.classes()).toContain('from-D');
    // 收到的 info 形状与 antd 的 `{ props }` 一致
    expect(Object.keys(fn.mock.calls[0]?.[0] ?? {})).toEqual(['props']);
  });

  it('函数式 styles 同样生效', () => {
    const w = mountEmpty({ styles: () => ({ root: { color: 'blue' } }) });
    expect(w.attributes('style') ?? '').toContain('color: blue');
  });

  it('classNames 是**拼接**而非覆盖（与 styles 的语义不同）', () => {
    const w = mountEmpty({
      className: 'user-class',
      classNames: { root: 'semantic-class' },
    });
    expect(w.classes()).toContain('user-class');
    expect(w.classes()).toContain('semantic-class');
  });
});

describe('Empty · footer（children）', () => {
  it('有默认插槽时渲染 footer', () => {
    const w = mountEmpty({}, { default: () => h('button', null, 'Create') });
    expect(w.find(`.${P}-footer button`).text()).toBe('Create');
  });

  it('没有默认插槽时不渲染 footer', () => {
    expect(mountEmpty().find(`.${P}-footer`).exists()).toBe(false);
  });
});

describe('Empty · RTL', () => {
  it('无 provider 时不加 -rtl', () => {
    expect(mountEmpty().classes()).not.toContain(`${P}-rtl`);
  });

  it('context 的 direction 为 rtl 时根元素加 -rtl', () => {
    const w = mount(Empty, {
      props: { prefixCls: P },
      global: {
        provide: {
          [configContextKey as unknown as string]: {
            ...DEFAULT_CONFIG_CONTEXT,
            direction: 'rtl',
          },
        },
      },
    });
    expect(w.classes()).toContain(`${P}-rtl`);
  });
});

describe('Empty · 废弃告警', () => {
  // `@apollo-design/utils` 的 `warning()` 走 `console.error`（`note()` 才走 `console.warn`），
  // 所以这里 spy 的是 error —— 与 antd 的输出通道一致。
  it('传 imageStyle 时输出 deprecated 告警', async () => {
    resetWarned();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      mountEmpty({ imageStyle: { margin: '1px' } });
      await nextTick();
      expect(spy.mock.calls.some((args) => String(args[0]).includes('imageStyle'))).toBe(true);
    } finally {
      spy.mockRestore();
      resetWarned();
    }
  });

  it('不传 imageStyle 时不告警', async () => {
    resetWarned();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      mountEmpty();
      await nextTick();
      expect(spy.mock.calls.some((args) => String(args[0]).includes('imageStyle'))).toBe(false);
    } finally {
      spy.mockRestore();
      resetWarned();
    }
  });
});

describe('Empty · expose', () => {
  it('nativeElement 指向根 div', () => {
    const w = mountEmpty();
    const exposed = w.vm as unknown as { nativeElement: HTMLDivElement | null };
    expect(exposed.nativeElement).toBe(w.element);
  });
});

describe('Empty · D24 locale 响应式（2026-10-04 修复回归）', () => {
  it('LocaleProvider 的 locale prop 变化后 description 自动重渲染（此前是快照不更新）', async () => {
    const { ANT_MARK, LocaleProvider } = await import('@apollo-design/locale');
    const zhEmpty = {
      locale: 'zh-CN',
      Empty: { description: '暂无数据', build: '构建中' },
    } as never;
    const usEmpty = {
      locale: 'en-US',
      Empty: { description: 'No data', build: 'Building' },
    } as never;

    const host = mount(LocaleProvider, {
      props: { locale: zhEmpty, _ANT_MARK__: ANT_MARK },
      slots: { default: () => h(Empty, { prefixCls: P }) },
    });
    await nextTick();
    expect(host.text()).toContain('暂无数据');

    await host.setProps({ locale: usEmpty });
    await nextTick();
    // ⚠️ 用 Empty 自己的 description 容器断言（host 里可能有 Provider 级的渲染残留文本）
    const desc = host.find('.apollo-description');
    expect(desc.text()).toBe('No data');
    expect(desc.text()).not.toContain('暂无数据');
  });
});
