<script setup lang="ts">
/**
 * Spin —— 加载中。
 *
 * 契约来源：antd 6.6.4 的 `es/spin/index.js`。DOM 结构、类名、分支判据逐条对齐，
 * 有意差异登记在 `packages/ui/src/spin/README.md` 与 `COMPATIBILITY.md` §9。
 *
 * ── 六条最容易写错、且都已被 compat / 交互用例钉住的判据 ─────────────────────────
 *
 *   1. **`spinning` 有内部状态**。`spinning` prop 是**目标值**，真正驱动渲染的是
 *      「延迟之后的内部态」：`useState(() => customSpinning && !shouldDelay(...))`
 *      给出首帧，之后由 `useEffect` 里的 `debounce(delay, ...)` 推进。
 *      ⇒ 「受控」的含义是「由 prop 决定最终值」，**不是**「prop 变了 DOM 同步变」——
 *      传 `delay` 时二者之间必然有一个时间窗。
 *   2. **关比开快**：`customSpinning` 变假时 effect 直接 `setSpinning(false)`，
 *      **不走 debounce**（`should close immediately`，antd 的 delay.test 有这条）。
 *   3. **`isNested = hasChildren || fullscreen`** —— 它决定 `-section` 类名落在
 *      根元素上还是落在内层 div 上，同时决定 `styles.section` / `styles.mask`
 *      的合并方式。判据错了会让整块的定位与配色全错。
 *   4. **`description ?? tip`，且 `tip` 已废弃**。`mergedProps` 里两者都被填成
 *      合并后的值（语义化的函数式 `info.props` 因此看不到「哪个是原始的」）。
 *   5. **`styles.section` 的落点分叉**：非嵌套时它合并进**根元素**的 style；
 *      嵌套时它落在内层 `-section` div 上（根元素**不**吃它）。
 *   6. **`aria-live` / `aria-busy` 在 `{...restProps}` 之前** ⇒ 用户传的同名属性
 *      **会**覆盖它们（与 antd 的展开顺序一致，不是笔误）。
 *
 * ── 与 antd 的平台 / 架构差异 ────────────────────────────────────────────────
 *
 *   - 无 CSS-in-JS 的 hash 类名（D5）。
 *   - `size` 目前只读 prop，不读 ConfigProvider 的 `componentSize`
 *     —— `config-provider/hooks/useSize` 这个叶子模块尚未落地，
 *     缺口登记在 `README.md` §7（与 divider 的 `size` 同一条）。
 */

import { debounce, isEmptyVNode, useDevWarning } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  ref,
  useAttrs,
  useSlots,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { Indicator } from './components/Indicator';
import { NodeRenderer } from './components/NodeRenderer';
import { getDefaultIndicator } from './defaultIndicator';
import type {
  SpinConfig,
  SpinProps,
  SpinSemanticClassNames,
  SpinSemanticStyles,
  SpinSize,
} from './interface';
import { usePercent } from './usePercent';

defineOptions({ name: 'ASpin', inheritAttrs: false });

/**
 * ⚠️⚠️ `tip` / `description` 的 `undefined` 默认值**不是冗余的**（PITFALLS 第 46 条）。
 *
 * `VNodeChild` 含 `boolean`，SFC 编译器会把它解析成含 `Boolean` 的运行时类型数组；
 * Vue 对「调用方没传 **且** 没有 `default`」的 Boolean prop 会赋成 `false`。
 * 于是 `description ?? tip` 会拿到 `false` 而不是 `undefined` ——
 * 文案块直接消失（`false` 是 falsy，`mergedDescription &&` 判假），
 * 而不报错、不告警、`vue-tsc` 也过。
 *
 * 声明 `default`（哪怕值是 `undefined`）会让 Vue 走 `hasDefault` 分支、跳过转换。
 */
const props = withDefaults(defineProps<SpinProps>(), {
  prefixCls: undefined,
  className: undefined,
  rootClassName: undefined,
  spinning: true,
  style: undefined,
  size: undefined,
  tip: undefined,
  description: undefined,
  delay: 0,
  wrapperClassName: undefined,
  percent: undefined,
  fullscreen: false,
  classNames: undefined,
  styles: undefined,
});

const slots = useSlots();
const attrs = useAttrs();
defineSlots<{ default?: () => VNodeChild; indicator?: () => VNodeChild }>();

const {
  getPrefixCls,
  direction,
  indicator: contextIndicator,
  className: contextClassName,
  style: contextStyle,
  classNames: contextClassNames,
  styles: contextStyles,
} = useComponentConfig<SpinConfig>('spin');

const prefixCls = computed(() => getPrefixCls('spin', props.prefixCls));
const sectionCls = computed(() => `${prefixCls.value}-section`);
const containerCls = computed(() => `${prefixCls.value}-container`);
const descriptionCls = computed(() => `${prefixCls.value}-description`);

// ---------------------------------------------------------------------------
// children（默认插槽）
//
// antd 的判据是 `typeof children !== 'undefined'`。Vue 侧的对应物是
// 「默认插槽是否存在」：没有插槽 → `undefined` → false。
// ---------------------------------------------------------------------------
const hasChildren = computed(() => slots.default !== undefined);

// ---------------------------------------------------------------------------
// 尺寸
//
// ⚠️ antd 走 `useSize((ctx) => size ?? ctx)`：先读 SizeContext（ConfigProvider 的
//    `componentSize`），再由 `size` prop 覆盖。`config-provider/hooks/useSize`
//    这个叶子模块尚未落地，所以这里 `mergedSize` 恒等于 `size` prop。
//    缺口登记在 README.md §7 —— 不是「忘了」，是依赖未就绪（同 divider）。
// ---------------------------------------------------------------------------
const mergedSize = computed<SpinSize | undefined>(() => props.size);

// ---------------------------------------------------------------------------
// spinning：prop 是目标值，内部态才是渲染依据
// ---------------------------------------------------------------------------

/**
 * 是否需要延迟显示。与 antd 的 `shouldDelay` 逐字对应 ——
 * 三个判据缺一不可：`!!spinning && !!delay && !Number.isNaN(Number(delay))`。
 *
 * `!!delay` 保证 `delay={0}` 不被当成「要延迟」；`!Number.isNaN(Number(delay))`
 * 保证 `delay={NaN}` / `delay={'abc'}` 走**立即显示**而不是永久不显示。
 */
const shouldDelay = (spinning: boolean | undefined, delay: number): boolean =>
  !!spinning && !!delay && !Number.isNaN(Number(delay));

/**
 * 真实的加载态（延迟之后）。
 *
 * 初值逐字来自 antd：`customSpinning && !shouldDelay(customSpinning, delay)`。
 * ⚠️ 这里是 `ref(...)` 的**一次性求值**，不是 computed —— 与 React 的
 *    `useState(() => ...)` 同语义；写成 computed 会让「延迟期间 prop 变化」
 *    这条路径的行为与上游不同。
 */
const spinning = ref<boolean>(props.spinning && !shouldDelay(props.spinning, props.delay));

/**
 * 推进内部态。与 antd 的 `useEffect(..., [delay, customSpinning])` 同构。
 *
 * 三条逐字对应：
 *   1. `customSpinning` 为真 → 用 `debounce(delay, ...)` 推进（`delay=0` 时是
 *      下一个宏任务，所以「受控切换」需要一个 tick —— 交互测试里显式等它）。
 *   2. `customSpinning` 为假 → **立即**置假，不走 debounce。
 *   3. 清理函数 `cancel()` —— 卸载 / 依赖变化时取消待执行的那一次
 *      （antd 的 `delay.test.tsx` 有专门的用例断言卸载会调用 `cancel`）。
 */
watchEffect((onCleanup) => {
  const customSpinning = props.spinning;
  const delay = props.delay;

  if (customSpinning) {
    const showSpinning = debounce(delay, () => {
      spinning.value = true;
    });
    showSpinning();
    onCleanup(() => {
      showSpinning.cancel();
    });
    return;
  }

  spinning.value = false;
});

// ---------------------------------------------------------------------------
// 进度
// ---------------------------------------------------------------------------

const mergedPercent = usePercent(spinning, () => props.percent);

// ---------------------------------------------------------------------------
// 文案
// ---------------------------------------------------------------------------

/**
 * 合并后的文案。判据逐字来自 antd：`description ?? tip`。
 *
 * ⚠️ 依赖 `withDefaults` 里 `description` / `tip` 的 `undefined` 默认值
 *    （见文件顶部的 PITFALLS 46 说明）。
 */
const mergedDescription = computed<VNodeChild>(() => props.description ?? props.tip);

/**
 * 是否渲染文案块。antd 的判据是 `mergedDescription && (...)`（**真值**判断）。
 *
 * ⚠️ 因此 `description={0}` 在 React 侧会渲染出裸文本 `0`（`0 && <div/>` → `0`），
 *    而我们渲染空 —— 这是上游的一个 quirk，登记在 README §7，**不**复刻。
 */
const hasDescription = computed(() => !!mergedDescription.value);

// ---------------------------------------------------------------------------
// 指示器：indicator > ConfigProvider > setDefaultIndicator
// ---------------------------------------------------------------------------

/**
 * 与 antd 的 `indicator ?? contextIndicator ?? defaultIndicator` 逐字对应。
 *
 * `getDefaultIndicator()` 是**非响应式**的模块单例读取 —— 与上游一致
 * （见 `defaultIndicator.ts` 的说明）。
 */
// C8-R2：`#indicator` 插槽 → ConfigProvider（程序化）→ 默认四点 Looper
const mergedIndicator = computed<VNodeChild>(() => {
  const fromSlot = slots.indicator?.();
  if (fromSlot !== undefined && !isEmptyVNode(fromSlot)) {
    const first = Array.isArray(fromSlot) ? fromSlot[0] : fromSlot;
    return first as VNodeChild;
  }
  return contextIndicator ?? getDefaultIndicator();
});

// ---------------------------------------------------------------------------
// 嵌套判定
// ---------------------------------------------------------------------------

/** `hasChildren || fullscreen`。它决定了 `-section` 类名与 `styles.section` 的落点。 */
const isNested = computed(() => hasChildren.value || props.fullscreen);

// ---------------------------------------------------------------------------
// 语义化合并
//
// 合并顺序即契约（见 `_internal/use-merge-semantic.ts`）：
//   classNames: [contextClassNames, classNames]              —— 拼接
//   styles:     [contextStyles, {root: contextStyle}, styles] —— 后者胜
// `style` prop **不在**这个列表里 —— 它由下面的根样式对象在**最后**合并
// （覆盖 styles.root / styles.section / styles.mask 三者）。
// ---------------------------------------------------------------------------

/**
 * 传给函数式 `classNames` / `styles` 的 `info.props`。
 *
 * antd 传的是 `{...props, size, spinning, tip, description, fullscreen, children, percent}`。
 * 与 divider 同样的处理：传一个「身份稳定、内容随 props 同步」的对象，
 * 否则函数式只能看到挂载那一刻的快照。
 *
 * ⚠️ 与 antd 的一处**有意**差异：没有 `children`。它在 Vue 侧是默认插槽而不是 prop
 *    （规则 C19），塞进 `SpinProps` 等于声明一个永远为 `undefined` 的键。
 *    登记在 README §7。
 */
// ⚠️ 这里是**普通对象**而不是 `reactive(...)`：Spin 的 props 里有 `VNodeChild` /
//    `VNode`（`tip` / `description` / `indicator`），`reactive()` 会对它们做深度
//    代理类型推导，实测触发 TS2589「Type instantiation is excessively deep」。
//    而这里需要的只是「一个身份稳定、内容会变的对象」（`useMergeSemantic` 在 setup
//    期捕获它），响应式由外层的 `computed` 提供 —— 不需要深度代理。
const semanticProps: SpinProps = { ...props };
watchEffect(() => {
  Object.assign(semanticProps, props, {
    size: mergedSize.value,
    spinning: spinning.value,
    tip: mergedDescription.value,
    description: mergedDescription.value,
    fullscreen: props.fullscreen,
    percent: mergedPercent.value,
  });
});

const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
  SpinProps,
  SpinSemanticClassNames,
  SpinSemanticStyles
>(
  [() => contextClassNames, () => props.classNames],
  [() => contextStyles, () => semanticRootStyle(contextStyle), () => props.styles],
  semanticProps,
);

// ---------------------------------------------------------------------------
// 类名
// ---------------------------------------------------------------------------

const rootClass = computed(() => [
  prefixCls.value,
  {
    [`${prefixCls.value}-sm`]: mergedSize.value === 'small',
    [`${prefixCls.value}-lg`]: mergedSize.value === 'large',
    [`${prefixCls.value}-spinning`]: spinning.value,
    [`${prefixCls.value}-rtl`]: direction === 'rtl',
    [`${prefixCls.value}-fullscreen`]: props.fullscreen,
  },
  props.rootClassName,
  mergedClassNames.value.root,
  props.fullscreen && mergedClassNames.value.mask,
  // ⚠️ 非嵌套时根元素自己就是 section（同时吃 section 的语义类名）；
  //    嵌套时根元素改吃（已废弃的）`wrapperClassName`，`-section` 下移到内层 div。
  isNested.value ? props.wrapperClassName : [sectionCls.value, mergedClassNames.value.section],
  contextClassName,
  props.className,
]);

const innerSectionClass = computed(() => [sectionCls.value, mergedClassNames.value.section]);

const containerClass = computed(() => [containerCls.value, mergedClassNames.value.container]);

const descriptionClass = computed(() => [
  descriptionCls.value,
  mergedClassNames.value.tip,
  mergedClassNames.value.description,
]);

/** `classNames.indicator`：antd 传的是 `clsx(...)` 的结果（已是字符串）。 */
const indicatorClass = computed(() => mergedClassNames.value.indicator);

// ---------------------------------------------------------------------------
// 样式
//
// 三条合并顺序逐字来自 antd：
//   根     = {...styles.root, ...(!isNested ? styles.section : {}), ...(fullscreen ? styles.mask : {}), ...style}
//   内层 section = styles.section
//   description  = {...styles.tip, ...styles.description}
// ---------------------------------------------------------------------------

const rootStyle = computed<CSSProperties>(() => ({
  ...mergedStyles.value.root,
  ...(isNested.value ? {} : mergedStyles.value.section),
  ...(props.fullscreen ? mergedStyles.value.mask : {}),
  ...props.style,
}));

const innerSectionStyleAttrs = computed(() => styleAttrs(mergedStyles.value.section));

const containerStyleAttrs = computed(() => styleAttrs(mergedStyles.value.container));

const descriptionStyleAttrs = computed(() =>
  styleAttrs({ ...mergedStyles.value.tip, ...mergedStyles.value.description }),
);

const rootStyleAttrs = computed(() => styleAttrs(rootStyle.value));

/**
 * 根元素的属性对象。
 *
 * ⚠️ 不能写成两个裸 `v-bind`（`v-bind="x" v-bind="$attrs"`）—— Vue 会报
 *    「Duplicate attribute」。所以把 `$attrs` 并进同一个对象。
 * ⚠️ `$attrs` **在最后**：antd 的 `{...restProps}` 排在 `aria-live` / `aria-busy`
 *    之后，所以用户传的同名属性会覆盖它们 —— 这是上游行为，逐字保留。
 */
const rootAttrs = computed(() => ({
  ...rootStyleAttrs.value,
  'aria-live': 'polite' as const,
  'aria-busy': spinning.value,
  ...attrs,
}));

// ---------------------------------------------------------------------------
// 开发期告警
//
// antd 把告警写在**渲染体**里 —— 每次渲染都求值一次，所以「挂载时合法、之后更新成
// 非法」也会告警（`warning()` 自己按消息去重）。
// 所以这里用 `watchEffect` 而不是在 setup 期求值一次。
// ---------------------------------------------------------------------------
const warning = useDevWarning('Spin');
watchEffect(() => {
  warning.deprecated(props.size !== 'default', 'size="default"', 'size="medium"');
  warning.deprecated(!props.tip, 'tip', 'description');
  warning.deprecated(!props.wrapperClassName, 'wrapperClassName', 'classNames.root');
  // ⚠️ 这两条看的是**合并后**的语义化值（含 ConfigProvider 的 classNames/styles），
  //    与 antd 的 `mergedClassNames?.tip || mergedStyles?.tip` 逐字对应 ——
  //    只看 props 会让「配置来自 ConfigProvider」的用法漏掉告警。
  warning.deprecated(
    !(mergedClassNames.value.tip || mergedStyles.value.tip),
    'classNames.tip and styles.tip',
    'classNames.description and styles.description',
  );
  warning.deprecated(
    !(mergedClassNames.value.mask || mergedStyles.value.mask),
    'classNames.mask and styles.mask',
    'classNames.root and styles.root',
  );
});

// ---------------------------------------------------------------------------
// 暴露
// ---------------------------------------------------------------------------

const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>

<template>
  <div ref="rootRef" :class="rootClass" v-bind="rootAttrs">
    <template v-if="spinning">
      <div v-if="isNested" :class="innerSectionClass" v-bind="innerSectionStyleAttrs">
        <Indicator
          :prefix-cls="prefixCls"
          :indicator="mergedIndicator"
          :percent="mergedPercent"
          :class-name="indicatorClass"
          :style="mergedStyles.indicator"
        />
        <div v-if="hasDescription" :class="descriptionClass" v-bind="descriptionStyleAttrs">
          <NodeRenderer :node="mergedDescription" />
        </div>
      </div>
      <template v-else>
        <Indicator
          :prefix-cls="prefixCls"
          :indicator="mergedIndicator"
          :percent="mergedPercent"
          :class-name="indicatorClass"
          :style="mergedStyles.indicator"
        />
        <div v-if="hasDescription" :class="descriptionClass" v-bind="descriptionStyleAttrs">
          <NodeRenderer :node="mergedDescription" />
        </div>
      </template>
    </template>
    <div v-if="hasChildren" :class="containerClass" v-bind="containerStyleAttrs">
      <slot />
    </div>
  </div>
</template>
