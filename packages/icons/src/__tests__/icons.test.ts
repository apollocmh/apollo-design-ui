import { resetWarned } from '@apollo-design/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick, ref, type VNode } from 'vue';
import baseline from '../../../../tests/compat/baselines/icons.dom.json';
import { classNames } from '../class-names';
import * as Icons from '../icons';
import {
  createFromIconfontCN,
  createIcon,
  DEFAULT_ICON_PREFIX_CLS,
  DEFAULT_TWOTONE_COLOR,
  getIconStyle,
  getSecondaryColor,
  getTwoToneColor,
  getTwoToneColors,
  Icon,
  IconProvider,
  isIconDefinition,
  setTwoToneColor,
  setTwoToneColors,
} from '../index';
import { normalizeAttrs, svgBaseProps } from '../render';
import type { TwoToneColor } from '../two-tone-color';
import type { IconDefinition } from '../types';

/**
 * L1（单元）+ L2（交互）。
 *
 * L4（DOM 契约）在 `semantic.test.ts`，L5（可达性）在 `a11y.test.ts`，L3（类型）在
 * `api.test-d.ts`。这里只放「不需要与 React 基线比对」的那部分：
 * 纯函数、模块级状态、以及 props 驱动的事件行为。
 */

/**
 * 图标一律用具名访问（`Icons.HomeOutlined`），不要转成 `Record<string, Component>` ——
 * namespace import 的具名成员保留具体组件类型，而记录类型在
 * `noUncheckedIndexedAccess` 下索引出来是 `Component | undefined`，会让 `h()` 解析失败。
 */

/** 故意传入非法定义，用于验证告警分支。 */
const INVALID_DEFINITION = null as unknown as IconDefinition;

/** 挂载一个 vnode，返回宿主与卸载函数。 */
function mountVNode(vnode: VNode) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const app = createApp({ render: () => vnode });
  app.mount(host);
  return {
    host,
    html: () => host.innerHTML,
    element: () => host.firstElementChild as HTMLElement | null,
    unmount: () => {
      app.unmount();
      host.remove();
    },
  };
}

describe('L1 · classNames（clsx 的等价物）', () => {
  it('字符串与数字', () => {
    expect(classNames('a', 'b')).toBe('a b');
    expect(classNames('a', 1)).toBe('a 1');
  });

  it('对象按值取键', () => {
    expect(classNames({ a: true, b: false, c: 1, d: 0 })).toBe('a c');
  });

  it('嵌套数组展开', () => {
    expect(classNames(['a', ['b', ['c']]])).toBe('a b c');
  });

  it('假值跳过', () => {
    expect(classNames(null, undefined, false, '', 0)).toBe('');
  });

  it('嵌套数组为空时整段跳过（不产生多余空格）', () => {
    // 展开后为空串是常见输入：`classNames({ 'a': false })` 之类的条件类名在
    // 参数位置上拼出来的数组，运行时经常是空的。
    expect(classNames([])).toBe('');
    expect(classNames(['a', [], 'b'])).toBe('a b');
  });

  it('保持传入顺序（类名顺序是对外契约，rootClassName 必须在前）', () => {
    expect(classNames('root', 'cls', { 'cls-home': true })).toBe('root cls cls-home');
  });
});

describe('L1 · isIconDefinition', () => {
  const valid = { name: 'home', theme: 'outlined', icon: { tag: 'svg', attrs: {} } };

  it('对象形态的定义合法', () => {
    expect(isIconDefinition(valid)).toBe(true);
  });

  it('函数形态的定义合法（TwoTone）', () => {
    expect(isIconDefinition({ ...valid, icon: () => ({ tag: 'svg', attrs: {} }) })).toBe(true);
  });

  it('非对象一律非法', () => {
    for (const bad of [null, undefined, 'x', 42, true]) {
      expect(isIconDefinition(bad)).toBe(false);
    }
  });

  it('缺字段非法', () => {
    expect(isIconDefinition({ name: 'home' })).toBe(false);
    expect(isIconDefinition({ name: 'home', theme: 'outlined' })).toBe(false);
    expect(isIconDefinition({ theme: 'outlined', icon: {} })).toBe(false);
  });

  it('⚠️ `icon: null` 被判为**合法** —— 与 antd 逐字一致，不要"修"', () => {
    // `typeof null === 'object'`，所以 antd 的表达式放它过去。
    // 这不是疏忽：isIconDefinition 判的是「结构够不够渲染」，不是「数据对不对」。
    // 把它"修正"成 `candidate.icon !== null` 会让某些历史定义从"渲染为空 + 告警"
    // 变成"静默渲染为空"，行为差异没有收益。
    expect(isIconDefinition({ ...valid, icon: null })).toBe(true);
  });
});

describe('L1 · createIcon 的组件名派生', () => {
  /**
   * 类型正确的合法定义。
   *
   * 注意与上面 `isIconDefinition` 里的 `valid` 的区别：那个是喂给 `unknown` 参数的
   * 结构样本，这个要真的传给 `createIcon(definition: IconDefinition, ...)`，
   * 所以 `theme` 必须是 `ThemeType` 字面量而不是被推宽成 `string`。
   */
  const definition: IconDefinition = {
    name: 'home',
    theme: 'outlined',
    icon: { tag: 'svg', attrs: {} },
  };

  it('不传 displayName 时组件名从定义取', () => {
    // 生成代码总是显式传名字（`createIcon(HomeOutlinedSvg, 'HomeOutlined')`），
    // 所以这条「省略名字」的公开路径只有手写调用方会走 —— 正是要单独钉住的原因。
    const Derived = createIcon(definition);
    expect(Derived.name).toBe('home');

    const wrapper = mountVNode(h(Derived));
    expect(wrapper.element()?.className).toBe(
      `${DEFAULT_ICON_PREFIX_CLS} ${DEFAULT_ICON_PREFIX_CLS}-home`,
    );
    wrapper.unmount();
  });

  it('传 displayName 时组件名以显式名字为准，类名仍取定义的 name', () => {
    // 两个名字用途不同：displayName 只决定组件名（devtools / 递归自引用），
    // 类名与 aria-label 始终来自 `definition.name`。混用会让 DOM 契约漂移。
    const Named = createIcon(definition, 'RenamedIcon');
    expect(Named.name).toBe('RenamedIcon');

    const wrapper = mountVNode(h(Named));
    expect(wrapper.element()?.className).toBe(
      `${DEFAULT_ICON_PREFIX_CLS} ${DEFAULT_ICON_PREFIX_CLS}-home`,
    );
    wrapper.unmount();
  });
});

describe('L1 · normalizeAttrs（与 antd 有意不同）', () => {
  it('⚠️ `fill-rule` 必须原样保留，**不能**转成 fillRule', () => {
    // 这是本项目最容易抄错的一处：antd 的 normalizeAttrs 为 React 做 camelCase，
    // 而 Vue 的 h() 拿到的键就是最终写进 DOM 的属性名。转成 fillRule 会让
    // SVG 写出一个浏览器不认识的属性，图标画错（能构建、能过类型检查）。
    expect(normalizeAttrs({ 'fill-rule': 'evenodd' })).toEqual({ 'fill-rule': 'evenodd' });
    expect(normalizeAttrs({ 'fill-opacity': '.88' })).toEqual({ 'fill-opacity': '.88' });
  });

  it('SVG 规范属性名原样保留', () => {
    expect(normalizeAttrs({ viewBox: '0 0 1024 1024', focusable: 'false' })).toEqual({
      viewBox: '0 0 1024 1024',
      focusable: 'false',
    });
  });

  it('React 侧的 className 折回 class', () => {
    expect(normalizeAttrs({ className: 'x' })).toEqual({ class: 'x' });
    expect(normalizeAttrs({ class: 'x' })).toEqual({ class: 'x' });
  });

  it('空入参返回空对象', () => {
    expect(normalizeAttrs()).toEqual({});
    expect(normalizeAttrs({})).toEqual({});
  });
});

describe('L1 · TwoTone 调色板', () => {
  beforeEach(() => setTwoToneColor(DEFAULT_TWOTONE_COLOR));

  it('默认主色是 blue.primary（#1677ff）', () => {
    expect(DEFAULT_TWOTONE_COLOR).toBe('#1677ff');
  });

  it('副色由主色派生，取值与 oracle 基线一致', () => {
    // 从基线里**刮**出副色，而不是在测试里再写一遍 #e6f4ff ——
    // 后者会把「我们与 antd 一致」退化成「我们的常量等于我们写的常量」。
    const secondary = fillsOf(baseline.all.AccountBookTwoTone).find(
      (c) => c !== DEFAULT_TWOTONE_COLOR,
    );
    expect(secondary).toBeDefined();
    expect(getSecondaryColor(DEFAULT_TWOTONE_COLOR)).toBe(secondary);
  });

  it('setTwoToneColor 单值：副色派生，getTwoToneColor 返回单值', () => {
    setTwoToneColor('#eb2f96');
    expect(getTwoToneColor()).toBe('#eb2f96');
    expect(getTwoToneColors().secondaryColor).toBe(getSecondaryColor('#eb2f96'));
    expect(getTwoToneColors().calculated).toBe(false);
  });

  it('setTwoToneColor 二元组：副色显式，getTwoToneColor 返回二元组', () => {
    setTwoToneColor(['#eb2f96', '#fff1f0']);
    expect(getTwoToneColor()).toEqual(['#eb2f96', '#fff1f0']);
    expect(getTwoToneColors().calculated).toBe(true);
  });

  it('与 oracle 的 twoToneProbe 逐项一致', () => {
    const probe = baseline.twoToneProbe;
    setTwoToneColor(probe.initial);
    expect(getTwoToneColor()).toBe(probe.initial);

    setTwoToneColor(probe.afterSetSingle);
    expect(getTwoToneColor()).toBe(probe.afterSetSingle);

    setTwoToneColor(probe.afterSetPair as [string, string]);
    expect(getTwoToneColor()).toEqual(probe.afterSetPair);
  });

  it('getTwoToneColors 返回拷贝，外部改写不影响模块状态', () => {
    const snapshot = getTwoToneColors();
    snapshot.primaryColor = '#000000';
    expect(getTwoToneColors().primaryColor).toBe(DEFAULT_TWOTONE_COLOR);
  });

  it('setTwoToneColors 的副色省略时按主色派生', () => {
    setTwoToneColors({ primaryColor: '#f5222d' });
    expect(getTwoToneColors().secondaryColor).toBe(getSecondaryColor('#f5222d'));
    expect(getTwoToneColors().calculated).toBe(false);
  });

  it('JS 调用方传空值时是 no-op（不抛错，也不改已有状态）', () => {
    setTwoToneColor(['#eb2f96', '#fff1f0']);
    const before = getTwoToneColors();

    // 模拟没有类型检查的调用方。`normalizeTwoToneColors` 对空值返回 `[]`，
    // 于是 `colors[0]` 是 undefined —— 这是 `setTwoToneColor` 里那个收窄分支的**唯一**入口。
    // 之所以值得测：TypeScript 挡住了这条路，但 JS 消费方（以及 `setTwoToneColor(undefined)`
    // 这种「变量可能是 undefined」的写法）挡不住，而旧行为是直接崩在 `getSecondaryColor` 里。
    setTwoToneColor(undefined as unknown as TwoToneColor);

    expect(getTwoToneColors()).toEqual(before);
  });
});

describe('L1 · getIconStyle（样式契约）', () => {
  it('getIconStyle("anticon") 与 @ant-design/icons 注入的 CSS 逐字一致', () => {
    expect(getIconStyle('anticon')).toBe(baseline.style.iconStyles);
  });

  it('默认前缀是 apollo-icon（D14）', () => {
    expect(DEFAULT_ICON_PREFIX_CLS).toBe('apollo-icon');
    expect(getIconStyle()).toContain('.apollo-icon {');
    expect(getIconStyle()).not.toContain('anticon');
  });

  it('替换是全局的：派生选择器与 -spin 都要跟着换', () => {
    const css = getIconStyle('zz');
    for (const selector of [
      '.zz {',
      '.zz > *',
      '.zz svg',
      '.zz::before',
      '.zz .zz-icon',
      '.zz[tabindex]',
      '.zz-spin',
    ]) {
      expect(css).toContain(selector);
    }
    expect(css).not.toContain('anticon');
    // loadingCircle 是关键帧名，**不**应被前缀替换（antd 也是全局替换，但名字里没有 anticon）
    expect(css).toContain('@keyframes loadingCircle');
  });

  it('保留 baseline 里那份 CSS 的关键声明（防止被"整理"掉）', () => {
    const css = getIconStyle('anticon');
    expect(css).toContain('vertical-align: -0.125em');
    expect(css).toContain('line-height: 0');
    expect(css).toContain('-webkit-font-smoothing: antialiased');
    expect(css).toContain('-webkit-animation: loadingCircle 1s infinite linear');
  });

  it('svgBaseProps 与 oracle 记录的一致', () => {
    expect(svgBaseProps).toEqual(baseline.style.svgBaseProps);
  });
});

describe('L1 · warning', () => {
  let spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetWarned();
    spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => spy.mockRestore());

  it('条件成立时不输出', () => {
    createIcon(INVALID_DEFINITION);
    expect(spy).not.toHaveBeenCalled();
  });

  it('非法定义输出带包名前缀的告警，且同一条只输出一次', () => {
    const Bad = createIcon(INVALID_DEFINITION);
    mountVNode(h(Bad)).unmount();
    mountVNode(h(Bad)).unmount();
    // 消息正文照抄 antd 的拼写错误（definiton），见 create-icon.ts 的说明
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0]).toContain('[@apollo-design/icons]');
    expect(spy.mock.calls[0]?.[0]).toContain('icon should be icon definiton');
  });
});

describe('L2 · 图标组件交互', () => {
  it('onClick 被触发，且 tabIndex 兜底为 -1（与 antd 一致）', () => {
    const onClick = vi.fn();
    const wrapper = mountVNode(h(Icons.HomeOutlined, { onClick }));
    const el = wrapper.element();

    expect(el?.getAttribute('tabindex')).toBe('-1');
    el?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('显式 tabIndex 优先于兜底的 -1', () => {
    const wrapper = mountVNode(h(Icons.HomeOutlined, { onClick: () => {}, tabIndex: 0 }));
    expect(wrapper.element()?.getAttribute('tabindex')).toBe('0');
    wrapper.unmount();
  });

  it('无 onClick 时不产生 tabindex', () => {
    const wrapper = mountVNode(h(Icons.HomeOutlined));
    expect(wrapper.element()?.hasAttribute('tabindex')).toBe(false);
    wrapper.unmount();
  });

  it('twoToneColor 不会泄漏到 DOM（非 TwoTone 图标）', () => {
    const wrapper = mountVNode(h(Icons.HomeOutlined, { twoToneColor: '#f5222d' }));
    expect(wrapper.element()?.hasAttribute('twotonecolor')).toBe(false);
    expect(wrapper.html()).not.toContain('#f5222d');
    wrapper.unmount();
  });

  it('TwoTone 图标的 twoToneColor 落到 path 的 fill 上', () => {
    const wrapper = mountVNode(
      h(Icons.AccountBookTwoTone, { twoToneColor: ['#eb2f96', '#fff1f0'] }),
    );
    const html = wrapper.html();
    expect(html).toContain('fill="#eb2f96"');
    expect(html).toContain('fill="#fff1f0"');
    wrapper.unmount();
  });

  it('rotate 产生 transform，rotate: 0 不产生 style（antd 用真值判断）', () => {
    const rotated = mountVNode(h(Icons.HomeOutlined, { rotate: 90 }));
    expect(rotated.element()?.querySelector('svg')?.getAttribute('style')).toContain(
      'rotate(90deg)',
    );
    rotated.unmount();

    const zero = mountVNode(h(Icons.HomeOutlined, { rotate: 0 }));
    expect(zero.element()?.querySelector('svg')?.hasAttribute('style')).toBe(false);
    zero.unmount();
  });

  it('className 透传到根 span 且排在 prefixCls 之后', () => {
    const wrapper = mountVNode(h(Icons.HomeOutlined, { class: 'mine' }));
    expect(wrapper.element()?.className).toBe(
      `${DEFAULT_ICON_PREFIX_CLS} ${DEFAULT_ICON_PREFIX_CLS}-home mine`,
    );
    wrapper.unmount();
  });
});

describe('L2 · IconProvider 的响应性', () => {
  it('prefixCls 变化时图标重新渲染（注入的是取值函数，不是快照）', async () => {
    // 这条覆盖 context.ts 的核心设计决策：antd 注入普通对象、靠 React 重渲染；
    // 我们注入取值函数 + 消费侧 computed。如果这里注入的是对象快照，
    // 改 prefixCls 不会触发图标更新，这个用例就会失败。
    const prefix = ref('p1');
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            IconProvider,
            { value: { prefixCls: prefix.value } },
            { default: () => h(Icons.HomeOutlined) },
          );
      },
    });

    const host = document.createElement('div');
    document.body.appendChild(host);
    const app = createApp(Host);
    app.mount(host);

    expect(host.innerHTML).toContain('p1-home');

    prefix.value = 'p2';
    await nextTick();
    expect(host.innerHTML).toContain('p2-home');
    expect(host.innerHTML).not.toContain('p1-home');

    app.unmount();
    host.remove();
  });

  it('嵌套 Provider 时内层生效', () => {
    const wrapper = mountVNode(
      h(
        IconProvider,
        { value: { prefixCls: 'outer' } },
        {
          default: () =>
            h(
              IconProvider,
              { value: { prefixCls: 'inner' } },
              { default: () => h(Icons.HomeOutlined) },
            ),
        },
      ),
    );
    expect(wrapper.element()?.className).toBe('inner inner-home');
    wrapper.unmount();
  });

  it('不传 value 时落到 prop 默认值 {}，图标用默认前缀而不是崩掉', () => {
    // 覆盖 `value: { type: Object, default: () => ({}) }` 的默认工厂。
    // 不传 value 是合法用法（`<IconProvider>` 只用来包一层），此时 context 是空对象，
    // 图标应当退回 DEFAULT_ICON_PREFIX_CLS —— 而不是把 `undefined` 当成 prefixCls
    // 渲染出 `undefined-home` 这类类名。
    const wrapper = mountVNode(h(IconProvider, {}, { default: () => h(Icons.HomeOutlined) }));
    expect(wrapper.element()?.className).toBe(
      `${DEFAULT_ICON_PREFIX_CLS} ${DEFAULT_ICON_PREFIX_CLS}-home`,
    );
    expect(wrapper.html()).not.toContain('undefined');
    wrapper.unmount();
  });

  it('不传默认插槽时渲染为空（`slots.default?.() ?? null` 的兜底分支）', () => {
    // Provider 是纯透传组件，本身不产出 DOM。没有插槽时若直接 `slots.default()` 会抛
    // 「Cannot read properties of undefined」—— 这条用例钉住它退化成空渲染。
    const wrapper = mountVNode(h(IconProvider, { value: { prefixCls: 'apollo-icon' } }));
    // Vue 对「渲染 null」的产出是一个注释占位符而不是空串，所以不能断言 `toBe('')`。
    // 两层都断言：**没有元素产出**（对外契约），且占位符就是那个注释（若它变成真实节点，
    // 说明兜底分支被改坏了 —— 这正是本用例要防的回归）。
    expect(wrapper.element()).toBeNull();
    expect(wrapper.html()).toBe('<!---->');
    wrapper.unmount();
  });
});

describe('L2 · createFromIconfontCN', () => {
  const created: HTMLElement[] = [];

  beforeEach(() => {
    created.length = 0;
    for (const s of Array.from(document.querySelectorAll('script[data-namespace]'))) {
      created.push(s as HTMLElement);
    }
  });

  afterEach(() => {
    for (const s of Array.from(document.querySelectorAll('script[data-namespace]'))) s.remove();
  });

  const newScripts = () =>
    Array.from(document.querySelectorAll('script[data-namespace]')).filter(
      (s) => !created.includes(s as HTMLElement),
    );

  it('插入 script，带 src 与 data-namespace', () => {
    createFromIconfontCN({ scriptUrl: '//at.alicdn.com/t/font_a.js' });
    const scripts = newScripts();
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.getAttribute('src')).toBe('//at.alicdn.com/t/font_a.js');
    expect(scripts[0]?.getAttribute('data-namespace')).toBe('//at.alicdn.com/t/font_a.js');
  });

  it('同一地址只插入一次（customCache 去重）', () => {
    createFromIconfontCN({ scriptUrl: '//at.alicdn.com/t/font_b.js' });
    createFromIconfontCN({ scriptUrl: '//at.alicdn.com/t/font_b.js' });
    expect(newScripts()).toHaveLength(1);
  });

  it('数组**倒序**插入（iconfont 的 symbol 会插到已有内容之前）', () => {
    // antd 的注释原文：因为 iconfont 资源会把 svg 插入 before，所以前加载相同 type 会
    // 覆盖后加载，为了数组覆盖顺序，倒叙插入。这条很容易被"顺手改成正序"。
    createFromIconfontCN({
      scriptUrl: ['//at.alicdn.com/t/font_c1.js', '//at.alicdn.com/t/font_c2.js'],
    });
    const scripts = newScripts();
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.getAttribute('src')).toBe('//at.alicdn.com/t/font_c2.js');
  });

  it('数组是**串行**加载的：前一个 load 之后才插入下一个', () => {
    // 覆盖 `loadNext`（createScriptUrlElements 里挂到 onload/onerror 上的闭包）。
    // 这条是「倒序插入」的另一半语义：倒序只保证**插入顺序**，真正的加载是链式的 ——
    // 一次只插一个 <script>，等它 load（或 error）再插下一个。
    // 若哪天有人改成「一次性全部插入」，倒序就失去意义了（浏览器会并发加载、完成顺序不定）。
    createFromIconfontCN({
      scriptUrl: ['//at.alicdn.com/t/font_d1.js', '//at.alicdn.com/t/font_d2.js'],
    });

    // 倒序 → 先插数组里最后那个
    const first = newScripts();
    expect(first).toHaveLength(1);
    expect(first[0]?.getAttribute('src')).toBe('//at.alicdn.com/t/font_d2.js');

    // 第一个还没 load，第二个不该出现
    expect(document.querySelector('script[src="//at.alicdn.com/t/font_d1.js"]')).toBeNull();

    // 触发 load → loadNext → 插入下一个
    first[0]?.dispatchEvent(new Event('load'));
    const second = newScripts();
    expect(second).toHaveLength(2);
    expect(second[1]?.getAttribute('src')).toBe('//at.alicdn.com/t/font_d1.js');

    // 最后一个不再挂 onload（`scriptUrls.length > index + 1` 为假），链到此为止
    expect((second[1] as HTMLScriptElement).onload).toBeNull();
  });

  it('error 与 load 走同一条链（一个地址加载失败不应卡住后面的）', () => {
    createFromIconfontCN({
      scriptUrl: ['//at.alicdn.com/t/font_e1.js', '//at.alicdn.com/t/font_e2.js'],
    });
    const first = newScripts();
    first[0]?.dispatchEvent(new Event('error'));
    expect(newScripts()).toHaveLength(2);
  });

  it('渲染 <use xlink:href="#type">', () => {
    const IconFont = createFromIconfontCN();
    const wrapper = mountVNode(h(IconFont, { type: 'icon-javascript' }));
    const use = wrapper.element()?.querySelector('use');
    expect(use).not.toBeNull();
    // 命名空间属性：Vue 要求写成带前缀的字面量键
    expect(use?.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe('#icon-javascript');
    wrapper.unmount();
  });

  it('extraCommonProps 透传，且插槽内容优先于 type', () => {
    const IconFont = createFromIconfontCN({ extraCommonProps: { class: 'from-extra' } });
    const wrapper = mountVNode(
      h(IconFont, { type: 'icon-a' }, { default: () => h('path', { d: 'M0 0h1v1H0z' }) }),
    );
    expect(wrapper.element()?.className).toContain('from-extra');
    expect(wrapper.html()).toContain('M0 0h1v1H0z');
    expect(wrapper.element()?.querySelector('use')).toBeNull();
    wrapper.unmount();
  });

  it('type 是声明过的 prop，不会作为属性泄漏到 DOM', () => {
    const IconFont = createFromIconfontCN();
    const wrapper = mountVNode(h(IconFont, { type: 'icon-b' }));
    expect(wrapper.element()?.hasAttribute('type')).toBe(false);
    wrapper.unmount();
  });

  it('无内容时渲染空 span（不产生空 <svg>）', () => {
    const IconFont = createFromIconfontCN();
    const wrapper = mountVNode(h(IconFont));
    expect(wrapper.html()).toBe(`<span role="img" class="${DEFAULT_ICON_PREFIX_CLS}"></span>`);
    wrapper.unmount();
  });
});

describe('L2 · 基础 Icon 的 component / children', () => {
  it('children 形态：无 viewBox 也渲染 svg', () => {
    const wrapper = mountVNode(
      h(Icon, { viewBox: '0 0 1024 1024' }, () => h('path', { d: 'M0 0h1v1H0z' })),
    );
    const svg = wrapper.element()?.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 1024 1024');
    expect(svg?.getAttribute('width')).toBe('1em');
    wrapper.unmount();
  });

  it('component 形态：自定义组件收到 innerSvgProps', () => {
    const received: Record<string, unknown>[] = [];
    const Custom = defineComponent({
      name: 'Custom',
      inheritAttrs: false,
      setup(_p, { attrs }) {
        received.push({ ...attrs });
        return () => h('svg', { ...attrs });
      },
    });
    const wrapper = mountVNode(h(Icon, { component: Custom, viewBox: '0 0 8 8', color: 'red' }));
    expect(received[0]).toMatchObject({
      width: '1em',
      height: '1em',
      fill: 'currentColor',
      'aria-hidden': 'true',
      focusable: 'false',
      color: 'red',
      viewBox: '0 0 8 8',
    });
    wrapper.unmount();
  });

  it('component + children 同时存在：内容经**默认插槽**送达自定义组件', () => {
    // 覆盖 `hasChildren ? h(component, innerSvgProps, () => children) : h(component, innerSvgProps)`
    // 的**第一支**。只测 `component`（无 children）会漏掉它 —— 而这一支正是
    // 「Vue 用插槽、React 用 props.children」这条平台差异的落点：
    // antd 是 `createElement(Component, innerSvgProps, children)`，Vue 对应「传不传默认插槽」。
    // 恒传插槽会让空内容的自定义组件收到一个空插槽，恒不传则 children 永远送不到。
    const received: (readonly unknown[] | undefined)[] = [];
    const Custom = defineComponent({
      name: 'CustomEcho',
      inheritAttrs: false,
      setup(_p, { attrs, slots }) {
        return () => {
          const content = slots.default?.();
          received.push(content);
          return h('svg', { ...attrs }, content);
        };
      },
    });

    const wrapper = mountVNode(
      h(Icon, { component: Custom, viewBox: '0 0 8 8' }, () => [
        h('circle', { cx: 4, cy: 4, r: 3 }),
      ]),
    );

    expect(received[0]).toHaveLength(1);
    expect(wrapper.html()).toContain('<circle cx="4" cy="4" r="3">');
    wrapper.unmount();
  });

  it('component 无 children 时不传插槽（自定义组件拿到 undefined 而不是空数组）', () => {
    // 第二支。与上一条配对：两者必须分开测，因为「有没有 children」是分支条件本身。
    const received: (readonly unknown[] | undefined)[] = [];
    const Custom = defineComponent({
      name: 'CustomEcho',
      inheritAttrs: false,
      setup(_p, { attrs, slots }) {
        return () => {
          received.push(slots.default?.());
          return h('svg', { ...attrs }, slots.default?.());
        };
      },
    });

    const wrapper = mountVNode(h(Icon, { component: Custom, viewBox: '0 0 8 8' }));
    expect(received[0]).toBeUndefined();
    wrapper.unmount();
  });

  it('基础 Icon：onClick 兜底 tabIndex=-1（与 createIcon 产出的图标同一条规则）', () => {
    // ⚠️ 这条规则在 `icon.ts` 与 `create-icon.ts` 里**各写了一份** —— 这不是重复代码，
    //    而是与 antd 一致的分工（上游 `IconBase` 与 `AntdIcon` 同样各有一份）。
    //    因此「L2 · 图标组件交互」里那三条测的是 createIcon 那一份，**走不到本组件**；
    //    而 `createFromIconfontCN` 与「自定义 SVG」都建立在本组件之上，必须单独钉住。
    const onClick = vi.fn();
    const wrapper = mountVNode(
      h(Icon, { viewBox: '0 0 8 8', onClick }, () => [h('circle', { cx: 4, cy: 4, r: 3 })]),
    );
    const el = wrapper.element();
    expect(el?.getAttribute('tabindex')).toBe('-1');

    el?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('基础 Icon：显式 tabIndex 优先于兜底的 -1', () => {
    const wrapper = mountVNode(
      h(Icon, { viewBox: '0 0 8 8', tabIndex: 0, onClick: () => {} }, () => [
        h('circle', { cx: 4, cy: 4, r: 3 }),
      ]),
    );
    expect(wrapper.element()?.getAttribute('tabindex')).toBe('0');
    wrapper.unmount();
  });

  it('基础 Icon：无 onClick 时不产生 tabindex（不打断 Tab 顺序）', () => {
    const wrapper = mountVNode(
      h(Icon, { viewBox: '0 0 8 8' }, () => [h('circle', { cx: 4, cy: 4, r: 3 })]),
    );
    expect(wrapper.element()?.hasAttribute('tabindex')).toBe(false);
    wrapper.unmount();
  });

  it('ariaLabel 映射到 aria-label（D17，antd 会漏成 ariaLabel）', () => {
    const wrapper = mountVNode(h(Icon, { ariaLabel: 'My icon' }));
    const el = wrapper.element();
    expect(el?.getAttribute('aria-label')).toBe('My icon');
    expect(el?.hasAttribute('arialabel')).toBe(false);
    wrapper.unmount();
  });
});

/** 从一段 HTML 里取出全部十六进制 fill 值（去重）。 */
function fillsOf(html: string): string[] {
  const found: string[] = [];
  for (const match of html.matchAll(/fill="(#[0-9a-fA-F]{3,8})"/g)) {
    const value = match[1];
    if (value !== undefined && !found.includes(value)) found.push(value);
  }
  return found;
}
