/**
 * ConfigProvider —— L1 单元 + L2 交互。
 *
 * 断言的判据全部来自 `docs/analysis/config-provider.md` §4（逐条标注了 antd 的行号），
 * 三条最容易写错的判据在文件头注释里各有一条专属用例。
 */

import type { ValidateMessages } from '@apollo-design/form-core';
import { formContextKey } from '@apollo-design/form-core';
import { defaultLocale, zh_CN } from '@apollo-design/locale';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, inject, nextTick, ref, shallowRef } from 'vue';
import { ConfigProvider } from '../ConfigProvider';
import { defaultGetPrefixCls, defaultIconPrefixCls, defaultPrefixCls } from '../context';
import { DefaultRenderEmpty } from '../default-render-empty';
import { globalConfig, resetGlobalConfig, setGlobalConfig } from '../global-config';
import { useTheme } from '../hooks/use-theme';
import { type SizeType, useSize } from '../size-context';
import { useConfig } from '../use-config';
import { createProbe } from './probe';

afterEach(() => {
  resetGlobalConfig();
});

/** 挂载 `ConfigProvider` + 探针，返回捕获对象。 */
function mountWithProbe(props: Record<string, unknown> = {}, probeOptions = {}) {
  const { Probe, captured } = createProbe(probeOptions);
  const wrapper = mount(ConfigProvider, {
    props,
    slots: { default: () => h(Probe) },
    attachTo: document.body,
  });
  return { wrapper, captured };
}

describe('ConfigProvider · prefixCls', () => {
  it('没有 prefixCls 时用默认前缀 apollo（裁决 prefix-cls-default = A）', () => {
    const { captured } = mountWithProbe();
    expect(captured.config.getPrefixCls('empty')).toBe('apollo-empty');
    expect(captured.config.getPrefixCls()).toBe('apollo');
    expect(captured.config.iconPrefixCls).toBe(defaultIconPrefixCls);
  });

  it('prefixCls 会传给下游，且 suffixCls 为空时返回根前缀', () => {
    const { captured } = mountWithProbe({ prefixCls: 'bamboo' });
    expect(captured.config.getPrefixCls('btn')).toBe('bamboo-btn');
    expect(captured.config.getPrefixCls('')).toBe('bamboo');
  });

  it('customizePrefixCls 优先级最高（组件自己的 prefixCls prop 胜）', () => {
    const { captured } = mountWithProbe({ prefixCls: 'bamboo' });
    expect(captured.config.getPrefixCls('btn', 'custom')).toBe('custom');
  });

  it('⚠️ 判据是真值而不是 !== undefined：传空字符串会退回父级（antd index.tsx:376）', () => {
    const { captured } = mountWithProbe({ prefixCls: '' });
    expect(captured.config.getPrefixCls('btn')).toBe(`${defaultPrefixCls}-btn`);
  });

  it('嵌套：内层没给 prefixCls 时继承外层（antd 的 nest prefixCls 用例）', () => {
    const { Probe, captured } = createProbe();
    mount({
      render: () =>
        h(ConfigProvider, { prefixCls: 'bamboo' }, () => h(ConfigProvider, null, () => h(Probe))),
    });
    expect(captured.config.getPrefixCls('btn')).toBe('bamboo-btn');
  });

  it('嵌套：内层给了 prefixCls 就覆盖外层', () => {
    const { Probe, captured } = createProbe();
    mount({
      render: () =>
        h(ConfigProvider, { prefixCls: 'bamboo' }, () =>
          h(ConfigProvider, { prefixCls: 'light' }, () => h(Probe)),
        ),
    });
    expect(captured.config.getPrefixCls('btn')).toBe('light-btn');
  });

  it('L2 · 动态 prefixCls：改 prop 后下游立刻拿到新前缀（getPrefixCls 是稳定闭包）', async () => {
    const prefixCls = ref('bamboo');
    const { Probe, captured } = createProbe();

    mount({
      render: () => h(ConfigProvider, { prefixCls: prefixCls.value }, () => h(Probe)),
    });
    expect(captured.config.getPrefixCls('btn')).toBe('bamboo-btn');

    prefixCls.value = 'light';
    await nextTick();
    expect(captured.config.getPrefixCls('btn')).toBe('light-btn');
  });
});

describe('ConfigProvider · components（判据 1：逐组件名合并）', () => {
  it('本层没给任何组件配置时，继承父级的全部组件配置', () => {
    const { Probe, captured } = createProbe({ componentName: 'empty' });
    mount({
      render: () =>
        h(ConfigProvider, { empty: { className: 'outer-empty' } }, () =>
          h(ConfigProvider, { spin: { className: 'inner-spin' } }, () => h(Probe)),
        ),
    });

    const emptyProbe = createProbe({ componentName: 'empty' });
    mount({
      render: () =>
        h(ConfigProvider, { empty: { className: 'outer-empty' } }, () =>
          h(ConfigProvider, { spin: { className: 'inner-spin' } }, () => h(emptyProbe.Probe)),
        ),
    });

    expect(emptyProbe.captured.componentConfig.className).toBe('outer-empty');
    expect(captured.config.components).toBeTruthy();
  });

  it('⭐ nested provider 只给一部分配置时，父级的其它组件配置不能丢', () => {
    const { Probe, captured } = createProbe({ componentName: 'empty' });
    mount({
      render: () =>
        h(
          ConfigProvider,
          { empty: { className: 'outer-empty' }, divider: { className: 'outer-divider' } },
          () => h(ConfigProvider, { spin: { className: 'inner-spin' } }, () => h(Probe)),
        ),
    });

    const components = captured.config.components as Record<string, { className?: string }>;
    expect(components.empty?.className).toBe('outer-empty');
    expect(components.divider?.className).toBe('outer-divider');
    expect(components.spin?.className).toBe('inner-spin');
  });

  it('同名组件配置：内层整体替换（antd 是逐键覆盖，不是深合并）', () => {
    const { Probe, captured } = createProbe({ componentName: 'empty' });
    mount({
      render: () =>
        h(ConfigProvider, { empty: { className: 'outer', style: { color: 'red' } } }, () =>
          h(ConfigProvider, { empty: { className: 'inner' } }, () => h(Probe)),
        ),
    });

    expect(captured.componentConfig.className).toBe('inner');
    // ⚠️ 不是深合并 ⇒ 外层的 style 被整块丢掉
    expect(captured.componentConfig.style).toBeUndefined();
  });

  it('显式 prop 覆盖 components 逃生口里的同名键', () => {
    const { Probe, captured } = createProbe({ componentName: 'empty' });
    mount(ConfigProvider, {
      props: {
        components: { empty: { className: 'from-map' } },
        empty: { className: 'from-prop' },
      },
      slots: { default: () => h(Probe) },
    });
    expect(captured.componentConfig.className).toBe('from-prop');
  });

  it('未落地组件走 components 逃生口', () => {
    const { Probe, captured } = createProbe({ componentName: 'button' });
    mount(ConfigProvider, {
      props: { components: { button: { className: 'btn-cls' } } },
      slots: { default: () => h(Probe) },
    });
    expect(captured.componentConfig.className).toBe('btn-cls');
  });

  it('useComponentConfig 恒提供 getPrefixCls / direction / getPopupContainer / renderEmpty', () => {
    const { Probe, captured } = createProbe();
    const renderEmpty = () => null;
    const getPopupContainer = () => document.body;
    mount(ConfigProvider, {
      props: { renderEmpty, getPopupContainer },
      slots: { default: () => h(Probe) },
    });
    expect(captured.componentConfig.getPrefixCls).toBeTypeOf('function');
    expect(captured.componentConfig.renderEmpty).toBe(renderEmpty);
    expect(captured.componentConfig.getPopupContainer).toBe(getPopupContainer);
  });
});

describe('ConfigProvider · 非组件配置键的继承（判据 2：undefined 不覆盖）', () => {
  it('本层未定义 ⇒ 继承父级', () => {
    const { Probe, captured } = createProbe();
    mount({
      render: () =>
        h(ConfigProvider, { direction: 'rtl', variant: 'filled' }, () =>
          h(ConfigProvider, null, () => h(Probe)),
        ),
    });
    expect(captured.config.direction).toBe('rtl');
    expect(captured.config.variant).toBe('filled');
  });

  it('本层定义 ⇒ 覆盖父级', () => {
    const { Probe, captured } = createProbe();
    mount({
      render: () =>
        h(ConfigProvider, { direction: 'rtl' }, () =>
          h(ConfigProvider, { direction: 'ltr' }, () => h(Probe)),
        ),
    });
    expect(captured.config.direction).toBe('ltr');
  });

  it('L2 · 本层先给后又收回 undefined ⇒ 回落到父级值（不是残留旧值）', async () => {
    const direction = ref<'ltr' | 'rtl' | undefined>('ltr');
    const { Probe, captured } = createProbe();

    mount({
      render: () =>
        h(ConfigProvider, { direction: 'rtl' }, () =>
          h(ConfigProvider, { direction: direction.value }, () => h(Probe)),
        ),
    });
    expect(captured.config.direction).toBe('ltr');

    direction.value = undefined;
    await nextTick();
    expect(captured.config.direction).toBe('rtl');
  });

  // ⭐ 这条用例是**变异验证 M4 逼出来的**：删掉 `ConfigProvider.ts` 里
  //   「先删掉不在 `next` 里的键」那段清理循环，上面三条嵌套用例**全部照过**——
  //   因为它们的外层 provider 本身就带着 `direction`，`next` 里恒有这个键。
  //   只有在**根级** provider 上把 prop 从有值改回 `undefined` 时，`next`
  //   （= `{...DEFAULT_CONFIG_CONTEXT}`，只有 2 个键）才真的缺这个键，
  //   缺了清理循环就会残留 `'rtl'`。判据同上：每次都要「从父级重算全量」。
  it('L2 · 根级 provider 把 prop 改回 undefined ⇒ context 上这个键要消失（不是残留）', async () => {
    const variant = ref<'filled' | undefined>('filled');
    const { Probe, captured } = createProbe();

    mount({
      render: () => h(ConfigProvider, { variant: variant.value }, () => h(Probe)),
    });
    expect(captured.config.variant).toBe('filled');
    expect('variant' in captured.config).toBe(true);

    variant.value = undefined;
    await nextTick();
    // 键必须真的消失：下游 `?? 默认值` 的回落依赖「键不存在」而不是「值是 undefined」
    expect('variant' in captured.config).toBe(false);
    expect(captured.config.variant).toBeUndefined();
  });

  it('virtual 默认 true，可被显式 false 覆盖', () => {
    const { captured } = mountWithProbe();
    expect(captured.config.virtual).toBe(true);

    const second = mountWithProbe({ virtual: false });
    expect(second.captured.config.virtual).toBe(false);
  });

  it('popupMatchSelectWidth 优先，回落到已废弃的 dropdownMatchSelectWidth', () => {
    const fallback = mountWithProbe({ dropdownMatchSelectWidth: true });
    expect(fallback.captured.config.popupMatchSelectWidth).toBe(true);

    const explicit = mountWithProbe({
      dropdownMatchSelectWidth: true,
      popupMatchSelectWidth: false,
    });
    expect(explicit.captured.config.popupMatchSelectWidth).toBe(false);
  });
});

describe('ConfigProvider · componentSize / componentDisabled（判据 3：两条判据不同）', () => {
  it('componentSize 走独立 context，useSize() 能读到', () => {
    const { captured } = mountWithProbe({ componentSize: 'large' });
    expect(captured.size).toBe('large');
  });

  it('组件自己的 size prop 胜（useSize(props.size)）', () => {
    const { captured } = mountWithProbe({ componentSize: 'large' }, { ownSize: 'small' });
    expect(captured.size).toBe('small');
  });

  it('useSize 支持函数形态', () => {
    const { captured } = createProbe();
    const ProbeFn = defineComponent({
      name: 'AProbeFn',
      setup() {
        const size = useSize<string>((ctxSize) => `${ctxSize ?? 'none'}-fn`);
        return () => {
          captured.size = size.value as never;
          return h('div');
        };
      },
    });
    mount(ConfigProvider, {
      props: { componentSize: 'small' },
      slots: { default: () => h(ProbeFn) },
    });
    expect(captured.size).toBe('small-fn');
  });

  // ⭐ 变异验证 M5 逼出来的用例：把 `componentSize` 的判据从 `||` 改成 `??`，
  //   上面三条用例**全过**（`SizeType` 的四个字面量都是真值字符串，`||` 与 `??`
  //   在类型域内等价）。只有 falsy 的越界值（`''`）能把两者分开：
  //   antd `SizeContext.tsx:17` 用的是 `||` ⇒ 空串要**回落父级**，不能被当成
  //   「显式设了空尺寸」传下去。库会被 JS 消费方直接调用，这条要钉住。
  it('componentSize 用 || 判据：falsy 的越界值（空串）回落到父级', () => {
    const { Probe, captured } = createProbe();
    mount({
      render: () =>
        h(ConfigProvider, { componentSize: 'large' }, () =>
          // @ts-expect-error 故意传越界的 `''`：验证运行时判据不是 `??`
          h(ConfigProvider, { componentSize: '' }, () => h(Probe)),
        ),
    });
    expect(captured.size).toBe('large');
  });

  // 变异验证 M13 逼出来的用例：antd `useSize` 的第一条是 **真值判据** `!customSize`
  // （`hooks/useSize.ts`），不是 `customSize === undefined`。`SizeType` 的字面量
  // 都是真值字符串 ⇒ 单靠类型域内的输入分不开这两者，必须用一个 falsy 输入钉住：
  // 组件自己的 `size` 为空串时要**回落 context**，而不是把空串当尺寸传下去。
  it('useSize 第一条是真值判据：自己的 size 为空串时回落 context', () => {
    const { Probe, captured } = createProbe({ ownSize: '' as SizeType });
    mount(ConfigProvider, {
      props: { componentSize: 'large' },
      slots: { default: () => h(Probe) },
    });
    expect(captured.size).toBe('large');
  });

  it('⭐ componentDisabled 用 ?? 判据：false 能显式关闭父级的 true', () => {
    const { Probe, captured } = createProbe();
    mount({
      render: () =>
        h(ConfigProvider, { componentDisabled: true }, () =>
          h(ConfigProvider, { componentDisabled: false }, () => h(Probe)),
        ),
    });
    expect(captured.disabled).toBe(false);
  });

  it('内层未给 componentDisabled ⇒ 继承父级（undefined 不覆盖）', () => {
    const { Probe, captured } = createProbe();
    mount({
      render: () =>
        h(ConfigProvider, { componentDisabled: true }, () =>
          h(ConfigProvider, null, () => h(Probe)),
        ),
    });
    expect(captured.disabled).toBe(true);
  });

  it('组件自己的 disabled prop 为 false 时也不被全局禁用覆盖', () => {
    const { captured } = mountWithProbe({ componentDisabled: true }, { ownDisabled: false });
    expect(captured.disabled).toBe(false);
  });

  it('useConfig() 同时给出两个开关', () => {
    let seen: { size?: string; disabled?: boolean } = {};
    const ProbeConfig = defineComponent({
      name: 'AProbeUseConfig',
      setup() {
        const { componentSize, componentDisabled } = useConfig();
        return () => {
          seen = { size: componentSize.value, disabled: componentDisabled.value };
          return h('div');
        };
      },
    });
    mount(ConfigProvider, {
      props: { componentSize: 'middle', componentDisabled: true },
      slots: { default: () => h(ProbeConfig) },
    });
    expect(seen).toEqual({ size: 'middle', disabled: true });
  });
});

describe('ConfigProvider · locale', () => {
  it('locale 会传导到下游（useLocale 读到语言包文案）', () => {
    const { captured } = mountWithProbe({ locale: zh_CN });
    expect(captured.emptyDescription).toBe(zh_CN.Empty?.description);
    expect(captured.emptyDescription).not.toBe('No data');
  });

  it('L2 · 切换 locale prop 后，context 里的值跟着变', async () => {
    // ⚠️ `shallowRef` 不是可选的：`ref<Locale>` 的 UnwrapRef 深展开会触发 TS2589（PITFALLS 86）
    const localeRef = shallowRef<typeof zh_CN | undefined>(undefined);
    const { Probe, captured } = createProbe();

    mount({
      render: () => h(ConfigProvider, { locale: localeRef.value }, () => h(Probe)),
    });
    expect(captured.localeContextDescription).toBeUndefined();

    localeRef.value = zh_CN;
    await nextTick();
    expect(captured.localeContextDescription).toBe(zh_CN.Empty?.description);
  });

  it('ESM interop：传 { default: 语言包 } 也能识别（antd index.tsx:352-363）', () => {
    const { captured } = mountWithProbe({
      locale: { default: zh_CN } as unknown as typeof zh_CN,
    });
    expect(captured.emptyDescription).toBe(zh_CN.Empty?.description);
  });

  it('没有 locale 时不包 LocaleProvider（context 里读不到任何东西）', () => {
    const { captured } = mountWithProbe();
    expect(captured.localeContextDescription).toBeUndefined();
    expect(captured.localeCode).toBeUndefined();
  });
});

describe('ConfigProvider · theme', () => {
  it('没有 theme 时 context.theme 是 undefined', () => {
    const { captured } = mountWithProbe();
    expect(captured.theme).toBeUndefined();
  });

  it('给了 theme 就进 context', () => {
    const { captured } = mountWithProbe({ theme: { token: { colorPrimary: '#f00' } } });
    expect(captured.theme?.token?.colorPrimary).toBe('#f00');
  });

  it('嵌套：内层 theme 继承外层的 token（逐键浅合并）', () => {
    const { Probe, captured } = createProbe();
    mount({
      render: () =>
        h(ConfigProvider, { theme: { token: { colorPrimary: '#f00', colorError: '#0f0' } } }, () =>
          h(ConfigProvider, { theme: { token: { colorError: '#00f' } } }, () => h(Probe)),
        ),
    });
    expect(captured.theme?.token).toEqual({ colorPrimary: '#f00', colorError: '#00f' });
  });

  it('inherit: false 时不继承外层的 token', () => {
    const { Probe, captured } = createProbe();
    mount({
      render: () =>
        h(ConfigProvider, { theme: { token: { colorPrimary: '#f00' } } }, () =>
          h(ConfigProvider, { theme: { inherit: false } }, () => h(Probe)),
        ),
    });
    expect(captured.theme?.token?.colorPrimary).toBeUndefined();
  });

  it('theme.components 逐组件名合并，不是整体替换', () => {
    const { Probe, captured } = createProbe();
    mount({
      render: () =>
        h(ConfigProvider, { theme: { components: { Button: { colorPrimary: '#f00' } } } }, () =>
          h(ConfigProvider, { theme: { components: { Spin: { dotSize: 20 } } } }, () => h(Probe)),
        ),
    });
    expect(captured.theme?.components).toEqual({
      Button: { colorPrimary: '#f00' },
      Spin: { dotSize: 20 },
    });
  });

  // 变异验证 M14 逼出来的用例：上面那条只合了**不同**组件名（Button / Spin），
  //   `{ ...merged[name], ...componentToken }` 与 `{ ...componentToken }` 结果一样
  //   ⇒ 同名组件的**逐键**浅合并根本没被验到。这里让两层改同一个组件的不同键。
  it('同名组件的 component token 逐键浅合并（不是整体替换）', () => {
    const { Probe, captured } = createProbe();
    mount({
      render: () =>
        h(
          ConfigProvider,
          { theme: { components: { Button: { colorPrimary: '#f00', colorError: '#0f0' } } } },
          () =>
            h(ConfigProvider, { theme: { components: { Button: { colorError: '#00f' } } } }, () =>
              h(Probe),
            ),
        ),
    });
    expect(captured.theme?.components?.Button).toEqual({
      colorPrimary: '#f00',
      colorError: '#00f',
    });
  });

  it('L2 · 给了 theme 才渲染作用域元素；没给则不产任何包裹 DOM', () => {
    const plain = mount(ConfigProvider, {
      slots: { default: () => h('span', { class: 'text-probe' }, 'probe') },
    });
    expect(plain.html()).toBe('<span class="text-probe">probe</span>');

    const themed = mount(ConfigProvider, {
      props: { theme: { token: { colorPrimary: '#f00' } } },
      slots: { default: () => h('span', { class: 'text-probe' }, 'probe') },
    });
    // 多了一层 display:contents 的作用域元素（D26），文本探针仍在里面
    expect(themed.html()).toContain('display: contents');
    expect(themed.html()).toContain('<span class="text-probe">probe</span>');
  });

  it('L2 · theme 会把 CSS 变量写到作用域元素上（零运行时的落地点）', async () => {
    const wrapper = mount(ConfigProvider, {
      props: { theme: { token: { colorPrimary: 'rgb(255, 0, 0)' } } },
      slots: { default: () => h('span', { class: 'text-probe' }, 'probe') },
      attachTo: document.body,
    });
    await nextTick();

    const scope = wrapper.element as HTMLElement;
    // token 经过 seed → map → alias 派生后是归一化的 hex，不是原样字符串
    expect(scope.style.getPropertyValue('--apollo-color-primary')).toBe('#ff0000');
    wrapper.unmount();
  });

  it('L2 · 卸载后 CSS 变量被移除（不泄漏）', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const wrapper = mount(ConfigProvider, {
      props: { theme: { token: { colorPrimary: '#ff0000' } } },
      slots: { default: () => h('span', null, 'probe') },
      attachTo: host,
    });
    await nextTick();

    const scope = wrapper.element as HTMLElement;
    expect(scope.style.getPropertyValue('--apollo-color-primary')).toBe('#ff0000');

    wrapper.unmount();
    expect(scope.style.getPropertyValue('--apollo-color-primary')).toBe('');
    host.remove();
  });

  it('useTheme 是纯函数：本层没 theme 时返回父层引用本身', () => {
    const parent = { token: { colorPrimary: '#f00' } };
    expect(useTheme(undefined, parent)).toBe(parent);
  });
});

describe('ConfigProvider · 废弃属性', () => {
  it('autoInsertSpaceInButton 合并进 components.button，且显式的 button.autoInsertSpace 胜', () => {
    const { Probe, captured } = createProbe({ componentName: 'button' });
    mount(ConfigProvider, {
      props: {
        autoInsertSpaceInButton: false,
        components: { button: { autoInsertSpace: true } },
      },
      slots: { default: () => h(Probe) },
    });
    // 展开顺序 `{ autoInsertSpace: deprecatedProp, ...config.button }` ⇒ 后者胜
    expect((captured.componentConfig as { autoInsertSpace?: boolean }).autoInsertSpace).toBe(true);
  });

  it('没有显式 button.autoInsertSpace 时，废弃 prop 生效', () => {
    const { Probe, captured } = createProbe({ componentName: 'button' });
    mount(ConfigProvider, {
      props: { autoInsertSpaceInButton: false },
      slots: { default: () => h(Probe) },
    });
    expect((captured.componentConfig as { autoInsertSpace?: boolean }).autoInsertSpace).toBe(false);
  });
});

describe('ConfigProvider · 全局配置', () => {
  it('config({prefixCls}) 影响没有 Provider 的默认 getPrefixCls', () => {
    expect(defaultGetPrefixCls('empty')).toBe('apollo-empty');
    setGlobalConfig({ prefixCls: 'bamboo' });
    expect(defaultGetPrefixCls('empty')).toBe('bamboo-empty');
    expect(defaultGetPrefixCls()).toBe('bamboo');
  });

  it('globalConfig() 的四个读取器', () => {
    setGlobalConfig({ prefixCls: 'bamboo', iconPrefixCls: 'bi', theme: { token: {} } });
    const g = globalConfig();
    expect(g.getPrefixCls('btn')).toBe('bamboo-btn');
    expect(g.getIconPrefixCls()).toBe('bi');
    expect(g.getRootPrefixCls()).toBe('bamboo');
    expect(g.getTheme()).toEqual({ token: {} });
  });

  it('resetGlobalConfig 恢复出厂', () => {
    setGlobalConfig({ prefixCls: 'bamboo' });
    resetGlobalConfig();
    expect(defaultGetPrefixCls('empty')).toBe('apollo-empty');
  });

  it('config({prefixCls: undefined}) 不是「清空」（antd: `!== undefined` 才写）', () => {
    setGlobalConfig({ prefixCls: 'bamboo' });
    setGlobalConfig({ prefixCls: undefined });
    expect(defaultGetPrefixCls('empty')).toBe('bamboo-empty');
  });
});

describe('ConfigProvider · direction（D27：解构即快照）', () => {
  it('useDirection() 是响应式的：改 prop 后拿到新值', async () => {
    const direction = ref<'ltr' | 'rtl'>('ltr');
    const { Probe, captured } = createProbe();

    mount({
      render: () => h(ConfigProvider, { direction: direction.value }, () => h(Probe)),
    });
    expect(captured.direction).toBe('ltr');

    direction.value = 'rtl';
    await nextTick();
    expect(captured.direction).toBe('rtl');
    expect(captured.config.direction).toBe('rtl');
  });

  it('嵌套：内层 direction 为 undefined 时继承外层', () => {
    const { Probe, captured } = createProbe();
    mount({
      render: () =>
        h(ConfigProvider, { direction: 'rtl' }, () => h(ConfigProvider, null, () => h(Probe))),
    });
    expect(captured.direction).toBe('rtl');
  });
});

describe('ConfigProvider · form.validateMessages', () => {
  it('给了 form.validateMessages 才包 FormProvider（context 里读得到）', () => {
    const { Probe, captured: _unused } = createProbe();
    void _unused;

    let seenValidateMessages: ValidateMessages | undefined;
    const FormProbe = defineComponent({
      name: 'AFormCtxProbe',
      setup() {
        const ctx = inject(formContextKey, undefined);
        return () => {
          seenValidateMessages = ctx?.validateMessages;
          return h('div');
        };
      },
    });
    void Probe;

    mount(ConfigProvider, {
      props: { form: { validateMessages: { required: '必填' } } },
      slots: { default: () => h(FormProbe) },
    });
    expect(seenValidateMessages?.required).toBe('必填');
    // 兜底消息来自 `defaultLocale.Form.defaultValidateMessages`，也被合并进来
    expect(Object.keys(seenValidateMessages ?? {}).length).toBeGreaterThan(1);
  });

  it('⚠️ 没给 form 时**仍然**会包：兜底消息来自 defaultLocale，长度恒 > 0', () => {
    let seen: ValidateMessages | undefined;
    const FormProbe = defineComponent({
      name: 'AFormCtxProbe',
      setup() {
        const ctx = inject(formContextKey, undefined);
        return () => {
          seen = ctx?.validateMessages;
          return h('div');
        };
      },
    });
    mount(ConfigProvider, { slots: { default: () => h(FormProbe) } });

    // 与 antd 逐字一致：判据是 `Object.keys(validateMessages).length > 0`，
    // 而 `defaultLocale.Form.defaultValidateMessages` 恒非空 ⇒ Provider 恒存在。
    expect(seen).toEqual(defaultLocale.Form?.defaultValidateMessages);
  });

  it('locale.Form.defaultValidateMessages 会参与合并，且 form.validateMessages 胜', () => {
    let seen: ValidateMessages | undefined;
    const FormProbe = defineComponent({
      name: 'AFormCtxProbe',
      setup() {
        const ctx = inject(formContextKey, undefined);
        return () => {
          seen = ctx?.validateMessages;
          return h('div');
        };
      },
    });
    mount(ConfigProvider, {
      props: {
        locale: { ...zh_CN, Form: { defaultValidateMessages: { required: '来自 locale' } } },
        form: { validateMessages: { required: '来自 form' } },
      },
      slots: { default: () => h(FormProbe) },
    });
    expect(seen?.required).toBe('来自 form');
  });
});

describe('defaultRenderEmpty', () => {
  it('默认（undefined）渲染一个不带 -small 的 Empty', () => {
    const wrapper = mount(DefaultRenderEmpty);
    expect(wrapper.find('.apollo-empty').exists()).toBe(true);
    expect(wrapper.find('.apollo-empty-small').exists()).toBe(false);
  });

  it('Table / List 用简洁插画（-normal 类名）', () => {
    for (const name of ['Table', 'List'] as const) {
      const wrapper = mount(DefaultRenderEmpty, { props: { componentName: name } });
      expect(wrapper.find('.apollo-empty-normal').exists()).toBe(true);
      expect(wrapper.find('.apollo-empty-small').exists()).toBe(false);
    }
  });

  it('Select / TreeSelect / Cascader / Transfer / Mentions 多一个 -small', () => {
    for (const name of ['Select', 'TreeSelect', 'Cascader', 'Transfer', 'Mentions'] as const) {
      const wrapper = mount(DefaultRenderEmpty, { props: { componentName: name } });
      expect(wrapper.find('.apollo-empty-small').exists()).toBe(true);
    }
  });

  it('Table.filter 返回 null（上游的显式选择）', () => {
    const wrapper = mount(DefaultRenderEmpty, { props: { componentName: 'Table.filter' } });
    expect(wrapper.html()).toBe('');
  });

  it('prefixCls 会跟着 ConfigProvider 走', () => {
    const wrapper = mount(ConfigProvider, {
      props: {
        prefixCls: 'bamboo',
        renderEmpty: () => h(DefaultRenderEmpty, { componentName: 'Select' }),
      },
      slots: { default: () => h('div') },
    });
    void wrapper;

    const inner = mount(ConfigProvider, {
      props: { prefixCls: 'bamboo' },
      slots: { default: () => h(DefaultRenderEmpty, { componentName: 'Select' }) },
    });
    expect(inner.find('.bamboo-empty-small').exists()).toBe(true);
  });
});

describe('ConfigProvider · renderEmpty', () => {
  it('renderEmpty 进 context，下游能取到同一个函数引用', () => {
    const { Probe, captured } = createProbe();
    const renderEmpty = () => 'EMPTY';
    mount(ConfigProvider, {
      props: { renderEmpty },
      slots: { default: () => h(Probe) },
    });
    expect(captured.config.renderEmpty).toBe(renderEmpty);
    expect(captured.componentConfig.renderEmpty).toBe(renderEmpty);
  });
});

describe('ConfigProvider · DOM 包裹', () => {
  it('本体不产 DOM：只有一个 slot', () => {
    const wrapper = mount(ConfigProvider, {
      slots: { default: () => h('span', { class: 'only' }, 'x') },
    });
    expect(wrapper.html()).toBe('<span class="only">x</span>');
  });

  it('inheritAttrs:false ⇒ 多余的 attrs 不会挂到 children 上', () => {
    const wrapper = mount(ConfigProvider, {
      attrs: { 'data-extra': '1' },
      slots: { default: () => h('span', { class: 'only' }, 'x') },
    });
    expect(wrapper.html()).not.toContain('data-extra');
  });
});
