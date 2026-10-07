/**
 * 测试夹具。
 *
 * ── 与「组件测试」的区别（本包的边界，见 `README.md`）──────────────────────────
 * `README.md` 的「明确不做」写着：**不包含任何具体组件的测试用例**。
 * 本文件不是那个东西。它是**夹具**：为了验证「共享契约函数本身是否正确」而造的
 * 最小被测对象。它们没有 API、没有文档、不会出现在 `registry/components.json` 里，
 * 也永远不会成为交付物。
 *
 * 判断标准很简单：`packages/ui/src/<component>/__tests__/` 里的东西测的是**组件**；
 * 这里的 `FixtureXxx` 测的是 `mountTest` / `demoTest` / `a11yDemoTest` …**能不能正确判定**。
 *
 * 每个夹具都刻意做得**极小**，只保留被验证的那一条性质。
 */

import { observeMutation, observeResize } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  type InjectionKey,
  inject,
  onMounted,
  onScopeDispose,
  provide,
  type Ref,
  ref,
} from 'vue';
import type { DemoModules } from '../types';

// ---------------------------------------------------------------------------
// 通用
// ---------------------------------------------------------------------------

/** 最简单的可渲染组件：一个带类名的 div。 */
export const PlainBox = defineComponent({
  name: 'FixturePlainBox',
  props: { label: { type: String, default: 'box' } },
  setup(props) {
    return () => h('div', { class: 'fixture-box' }, props.label);
  },
});

/** 挂载时往 console 写两条输出（error + warn），用于验证告警采集。 */
export const NoisyBox = defineComponent({
  name: 'FixtureNoisyBox',
  setup() {
    onMounted(() => {
      console.error('Warning: fixture error');
      console.warn('Note: fixture note');
    });
    return () => h('div', { class: 'fixture-noisy' }, 'noisy');
  },
});

// ---------------------------------------------------------------------------
// mountTest：观察者泄漏
// ---------------------------------------------------------------------------

/** 建立监听但**从不释放** —— 卸载后应当被判定为泄漏。 */
export const LeakyBox = defineComponent({
  name: 'FixtureLeakyBox',
  setup() {
    const el = ref<HTMLElement | null>(null);
    onMounted(() => {
      if (el.value !== null) {
        observeResize(el.value, () => {});
        observeMutation(el.value, () => {});
      }
    });
    return () => h('div', { ref: el, class: 'fixture-leaky' });
  },
});

/** 建立监听并在作用域销毁时释放 —— 卸载后不应有泄漏。 */
export const CleanBox = defineComponent({
  name: 'FixtureCleanBox',
  setup() {
    const el = ref<HTMLElement | null>(null);
    let releases: (() => void)[] = [];

    onMounted(() => {
      if (el.value !== null) {
        releases = [observeResize(el.value, () => {}), observeMutation(el.value, () => {})];
      }
    });
    onScopeDispose(() => {
      for (const release of releases) release();
      releases = [];
    });

    return () => h('div', { ref: el, class: 'fixture-clean' });
  },
});

// ---------------------------------------------------------------------------
// rootPropsTest
//
// ⚠️ 2026-10-07：契约从「`rootClassName` / `rootStyle` 两个 prop」改为
//    **原生 `class` / `style` attrs**（Phase 2 + `COMPATIBILITY.md` §7）。
//    夹具同步改写：只声明 `prefixCls`，`class` / `style` 走 attrs 并显式并入根。
// ---------------------------------------------------------------------------

/** 正确实现了「根 class / style 落根且不下渗」的契约。 */
export const RootPropsBox = defineComponent({
  name: 'FixtureRootPropsBox',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: 'fixture' },
  },
  setup(props, { attrs }) {
    return () =>
      h(
        'div',
        {
          class: [`${props.prefixCls}-box`, attrs.class],
          style: attrs.style,
        },
        [h('span', { class: 'fixture-root-inner' }, 'inner')],
      );
  },
});

/** 把根 class 同时写到子元素上（下渗）—— 应当被「不下渗」断言抓到。 */
export const RootPropsLeakBox = defineComponent({
  name: 'FixtureRootPropsLeakBox',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: 'fixture' },
  },
  setup(props, { attrs }) {
    return () =>
      h('div', { class: [`${props.prefixCls}-box`, attrs.class] }, [
        // ⚠️ 故意下渗：同一个类名出现在子孙元素上
        h('span', { class: attrs.class }, 'inner'),
      ]);
  },
});

// ---------------------------------------------------------------------------
// focusTest
// ---------------------------------------------------------------------------

/** 带一个 input，`defineExpose` 了 focus / blur，支持 autoFocus。 */
export const FocusBox = defineComponent({
  name: 'FixtureFocusBox',
  props: { autoFocus: { type: Boolean, default: false } },
  emits: ['focus', 'blur'],
  setup(props, { emit, expose }) {
    const input = ref<HTMLInputElement | null>(null);

    onMounted(() => {
      if (props.autoFocus) input.value?.focus();
    });

    expose({
      focus: () => input.value?.focus(),
      blur: () => input.value?.blur(),
    });

    return () =>
      h('div', { class: 'fixture-focus' }, [
        h('input', {
          ref: input,
          onFocus: () => emit('focus'),
          onBlur: () => emit('blur'),
        }),
      ]);
  },
});

// ---------------------------------------------------------------------------
// rtlTest
// ---------------------------------------------------------------------------

/** 夹具用的 direction 注入键。**刻意不是**任何真实 Provider 的键（F5）。 */
export const FIXTURE_DIRECTION_KEY: InjectionKey<Ref<string>> = Symbol('fixture-direction');

/** 夹具用的 direction Provider。真实项目里这个角色由 `ConfigProvider` 承担。 */
export const FixtureDirectionProvider = defineComponent({
  name: 'FixtureDirectionProvider',
  props: { direction: { type: String, default: 'ltr' } },
  setup(props, { slots }) {
    provide(
      FIXTURE_DIRECTION_KEY,
      computed(() => props.direction),
    );
    return () => slots.default?.();
  },
});

/**
 * 按 direction 打 `-rtl` 标记类（与 antd 的 55 个组件同构）。
 *
 * ⚠️ 静态类名刻意**不以 `-rtl` 结尾**（`fixture-dir`，不是 `fixture-rtl`）——
 *    否则默认断言「存在任一以 `-rtl` 结尾的类名」在 ltr 下也恒真，
 *    这条夹具就完全丧失了分辨力。这个坑是靠 `rtl-test.test.ts` 钉住的。
 */
export const RtlBox = defineComponent({
  name: 'FixtureRtlBox',
  setup() {
    const direction = inject(
      FIXTURE_DIRECTION_KEY,
      computed(() => 'ltr'),
    );
    return () =>
      h('div', {
        class: ['fixture-dir', direction.value === 'rtl' ? 'fixture-dir-rtl' : undefined],
      });
  },
});

/** 不产出任何 `-rtl` 标记类 —— 用于验证 `allowMissingRtlClass`。 */
export const RtlBoxNoMark = defineComponent({
  name: 'FixtureRtlBoxNoMark',
  setup() {
    return () => h('div', { class: 'fixture-dir-none' });
  },
});

// ---------------------------------------------------------------------------
// themeTest
// ---------------------------------------------------------------------------

/** 渲染一个 `data-theme-probe` 标记，不依赖 token 的具体值。 */
export const ThemeProbeBox = defineComponent({
  name: 'FixtureThemeProbeBox',
  setup() {
    return () => h('div', { class: 'fixture-theme', 'data-theme-probe': 'yes' });
  },
});

// ---------------------------------------------------------------------------
// a11yDemoTest
// ---------------------------------------------------------------------------

/** 无障碍干净：原生 button + 文本。 */
export const A11yCleanBox = defineComponent({
  name: 'FixtureA11yCleanBox',
  setup() {
    return () => h('div', [h('button', { type: 'button' }, '确定')]);
  },
});

/** 有一处 `image-alt` 违规：`<img>` 缺 `alt`。 */
export const A11yBadBox = defineComponent({
  name: 'FixtureA11yBadBox',
  setup() {
    return () => h('div', [h('img', { src: '/x.png' })]);
  },
});

/** 渲染指定数量的节点，用于验证 `maxNodes` 的判定。 */
export function makeNodeCountBox(count: number) {
  return defineComponent({
    name: 'FixtureNodeCountBox',
    setup() {
      return () =>
        h(
          'div',
          Array.from({ length: count }, (_, index) => h('span', { key: index }, String(index))),
        );
    },
  });
}

// ---------------------------------------------------------------------------
// demo 模块表
// ---------------------------------------------------------------------------

/**
 * 构造 `import.meta.glob('*.vue', { eager: true })` 形状的模块表。
 *
 * 形状是 `{ [相对路径]: { default: Component } }` —— 与真实 glob 一致，
 * 这样夹具走的是与生产同一条解析路径（`resolveRenderable`），
 * 而不是一条「测试专用」的捷径。
 */
export function demoModules(entries: Record<string, unknown>): DemoModules {
  return Object.fromEntries(
    Object.entries(entries).map(([key, value]) => [key, { default: value }]),
  );
}

/** 一个 demo 的路径键（模拟 glob 的相对路径）。 */
export const demoKey = (name: string): string => `../demo/${name}.vue`;
