<script setup lang="ts">
/**
 * Avatar —— 头像。对应 antd 6.6.4 的 `es/avatar/Avatar.tsx`（242 行）。
 *
 * 契约全文见 `docs/analysis/avatar.md`（G1 产物）；下面只留**实现期最容易写错的判据**。
 *
 * ── 渲染骨架（上游 `Avatar.tsx:225-233`）──────────────────────────────────────
 *
 * ```html
 * <span style={...sizeStyle, ...responsiveSizeStyle, ...contextStyle, ...style} class={classString}>
 *   {childrenToRender}
 * </span>
 * ```
 *
 * ⚠️ **style 的合并顺序即契约**：内联 size → 响应式 size → **context style** → **自己的 style**。
 *
 * ── 七条必须复刻的判据 ───────────────────────────────────────────────────────
 *
 * 1. **`childrenToRender` 是五路互斥分支**（`:186-223`）：字符串 `src`+`isImgExist` → `<img>`；
 *    `src` 是 vnode → **原样渲染**；`icon` → `icon`；`mounted || scale !== 1` → `-string` span
 *    （带 transform）；其余（首帧）→ **同一个** `-string` span（`opacity:0`）。
 *    🚨 第 4/5 支是**同一个元素**（只差 style 与 ref）⇒ **不能拆成两个分支渲染**
 *    （会重建节点、丢 ref，测量永远拿不到宽度）。
 * 2. **`scale` 的测量**（`:83-95`）：两个 `offsetWidth` **任一为 0 就整体跳过**；
 *    缩放判据是 `gap * 2 < nodeWidth`，目标宽 `nodeWidth - gap*2`。
 * 3. **三个 effect 的依赖不同**（`:97-106`）：`mounted` 只跑一次；`isImgExist`/`scale` 随 `src` 重置；
 *    **`setScaleParam` 只在 `gap` 变时跑**（⚠️ 不是 `[]`）。React 的 `useEffect` 挂载后也会跑一次
 *    ⇒ 本仓在 `onMounted` 里**手动补跑一次测量**（见 `onMounted` 的注释）。
 * 4. **`handleImgLoadError` 的判据是 `!== false`**（不是真值）⇒ `onError` 返回 `undefined` / `0` / `''`
 *    **都会**走内置回退。
 * 5. **size 的解析链**：`props.size ?? avatarCtx?.size ?? ctxSize ?? 'medium'`。
 * 6. **响应式尺寸与数字尺寸的 `fontSize` 判据不同**：响应式是 `(icon || children) ? size/2 : 18`，
 *    数字是 `icon ? size/2 : 18`。**别合并**。
 * 7. **`-image` 的判据**：`hasImageElement || (src && isImgExist)` —— `src` 用的是**真值**。
 *
 * ── 三条平台差异（PLATFORM）──────────────────────────────────────────────────
 *
 * - **`<ResizeObserver onResize>` 包装组件 ⇒ `useResizeObserver` hook**：上游的
 *   `SingleObserver` 是 `cloneElement(children, {ref})`、**不产 DOM**，所以本仓把 observer
 *   挂在**同一个** `-string` span 上，DOM 完全相同。
 * - **数字进 `style` 必须 `toCssSize()`**（PITFALLS 170）：Vue 的 `patchStyle` **不补 px**，
 *   裸数字被静默丢弃 ⇒ 数字尺寸 / 响应式尺寸会**整个失效**（`width:32` 被丢 ⇒ 头像塌成 0）。
 *   这是本组件最容易踩的一条（上游 React 自动补 px）。
 * - **`ref` 暴露 `{ nativeElement }`**（上游 `forwardRef` 的 ref 就是 DOM 本身）。
 */

import {
  isNumber,
  isPlainObject,
  isVNode,
  useDevWarning,
  useResizeObserver,
} from '@apollo-design/utils';
import {
  computed,
  inject,
  mergeProps,
  onMounted,
  ref,
  useAttrs,
  useSlots,
  type VNodeChild,
  watch,
} from 'vue';
// ⚠️ 平台原语：`.vue` 模板没有「渲染一个 VNode 变量」的语法（见 empty/components/NodeRenderer.ts）
import { NodeRenderer } from '../_internal/node-renderer';
import { type Breakpoint, responsiveArray } from '../_internal/responsive-observer';
import { toCssSize } from '../_internal/to-css-size';
import { useComponentConfig } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import { useBreakpoint } from '../grid/hooks/use-breakpoint';
import { avatarContextKey } from './context';
import type { AvatarConfig, AvatarProps, ScreenSizeMap } from './interface';

defineOptions({ name: 'AAvatar', inheritAttrs: false });

/**
 * ⚠️ `gap` 的默认值**必须**在这里给（上游是解构默认 `gap = 4`）：它同时是缩放的阈值参数
 * （`gap * 2 < nodeWidth`），漏了它会让默认头像的缩放目标宽度变成 `nodeWidth`（永不缩放）。
 */
const props = withDefaults(defineProps<AvatarProps>(), {
  prefixCls: undefined,
  shape: undefined,
  size: undefined,
  gap: 4,
  src: undefined,
  srcSet: undefined,
  draggable: undefined,
  icon: undefined,
  alt: undefined,
  crossOrigin: undefined,
  onClick: undefined,
  onError: undefined,
});

/** 默认插槽 = 上游的 `children`（规则 C19）。 */
defineSlots<{ default?: () => VNodeChild }>();

const attrs = useAttrs();
const slots = useSlots();

const {
  getPrefixCls,
  className: contextClassName,
  style: contextStyle,
} = useComponentConfig<AvatarConfig>('avatar');

/** `Avatar.Group` 注入的 `size` / `shape`（身份稳定的 `reactive` 对象，见 `context.ts`）。 */
const avatarCtx = inject(avatarContextKey, undefined);

// ---------------------------------------------------------------------------
// 三个状态（上游 useState × 3）
// ---------------------------------------------------------------------------

/** 字符缩放的**缩放比**（恒 ≥ 0；测量拿不到宽度时保持 `1`）。 */
const scale = ref(1);
/** 是否已挂载 —— 决定 `-string` span 走「带 transform」还是「`opacity:0`」那一支。 */
const mounted = ref(false);
/** 图片是否还「存在」（加载失败且 `onError` 没阻止回退时置 false）。 */
const isImgExist = ref(true);

const rootRef = ref<HTMLSpanElement | null>(null);
const childrenRef = ref<HTMLSpanElement | null>(null);

// ---------------------------------------------------------------------------
// 测量（上游 `setScaleParam`）
// ---------------------------------------------------------------------------

/**
 * 按实测宽度决定 `scale`。
 *
 * ⚠️ 用的是 `offsetWidth`（**取整**）而不是 `getBoundingClientRect()` —— 上游注释写明
 *    「offsetWidth avoid affecting be transform scale」：`-string` span 带着 `transform:scale(n)`，
 *    `getBoundingClientRect()` 会**把缩放算进去**（越缩越小，死循环）。
 */
function setScaleParam(): void {
  const childrenEl = childrenRef.value;
  const nodeEl = rootRef.value;
  if (!childrenEl || !nodeEl) return;

  const childrenWidth = childrenEl.offsetWidth;
  const nodeWidth = nodeEl.offsetWidth;
  // 分母为 0 没有意义（jsdom 里恒 0 ⇒ 这一整支永远不跑，`scale` 恒 1）
  if (childrenWidth !== 0 && nodeWidth !== 0) {
    if (props.gap * 2 < nodeWidth) {
      const available = nodeWidth - props.gap * 2;
      scale.value = available < childrenWidth ? available / childrenWidth : 1;
    }
  }
}

/**
 * 上游 `useEffect(setMounted, [])` + `useEffect(setScaleParam, [gap])` 的**挂载态**合并。
 *
 * 🚨 React 的 `useEffect` 在**挂载后**也会跑一次 ⇒ 上游挂载时会：① `mounted = true`；
 *    ② 重置 `isImgExist` / `scale`（幂等，本仓省略）；③ **跑一次 `setScaleParam`**。
 *    本仓用 `watch(() => props.gap, …)` 只能覆盖「`gap` 变化」，所以**必须**在这里手动补跑，
 *    否则「首帧就带自定义 `gap` 的字符头像」永远不缩放（L6 会差一片）。
 *
 * ⚠️ 顺序也是契约：先置 `mounted`（Vue 里只是**调度**一次重渲染），**再**测量 ——
 *    这样测的是挂载时的 DOM（与 React 的 effect 顺序一致）。
 */
onMounted(() => {
  mounted.value = true;
  setScaleParam();
});

/** 上游 `useEffect(fn, [src])`：`src` 一变就重置「图片失败」与缩放。 */
watch(
  () => props.src,
  () => {
    isImgExist.value = true;
    scale.value = 1;
  },
);

/** 上游 `useEffect(setScaleParam, [gap])`。 */
watch(
  () => props.gap,
  () => {
    setScaleParam();
  },
);

/**
 * 上游 `<ResizeObserver onResize={setScaleParam}>` —— 只在**第 4 支**（`mounted || scale !== 1`）
 * 渲染，所以本仓用 `disabled` 对齐：挂载前不订阅（与上游「挂载前没有那个包装组件」同效）。
 */
useResizeObserver({
  target: childrenRef,
  onResize: setScaleParam,
  disabled: () => !(mounted.value || scale.value !== 1),
});

// ---------------------------------------------------------------------------
// 图片失败
// ---------------------------------------------------------------------------

/** 上游 `handleImgLoadError`：⚠️ 判据是 `!== false`（不是真值）。 */
function handleImgLoadError(): void {
  const errorFlag = props.onError?.();
  if (errorFlag !== false) {
    isImgExist.value = false;
  }
}

/** `onClick` 是**声明的 prop**（上游就是 prop）⇒ 显式转接（不靠 attrs）。 */
function handleClick(e: MouseEvent): void {
  props.onClick?.(e);
}

// ---------------------------------------------------------------------------
// size
// ---------------------------------------------------------------------------

/**
 * 尺寸解析链（上游 `useSize((ctxSize) => customSize ?? avatarCtx?.size ?? ctxSize ?? 'medium')`）。
 *
 * ⚠️ 必须用**函数形态**：`useSize(props.size)` 只在 setup 期读一次（PITFALLS 163）。
 */
const mergedSize = useSize((ctxSize) => props.size ?? avatarCtx?.size ?? ctxSize ?? 'medium');

/** 是否需要订阅断点（上游 `needResponsive`）。 */
const needResponsive = computed(() =>
  Object.keys(isPlainObject(props.size) ? props.size || {} : {}).some((key) =>
    responsiveArray.includes(key as Breakpoint),
  ),
);

const screens = useBreakpoint(needResponsive.value);

/**
 * 响应式尺寸的内联样式（上游 `responsiveSizeStyle`）。
 *
 * ⚠️ 与数字尺寸分支的 `fontSize` **判据不同**：这里是 `(icon || children) ? size/2 : 18`。
 * ⚠️ 数字必须 `toCssSize()`（Vue 不补 px，PITFALLS 170）。
 */
function responsiveSizeStyle(): Record<string, string> {
  if (!isPlainObject(props.size)) return {};

  const currentBreakpoint = responsiveArray.find((screen) => screens.value?.[screen]);
  const currentSize = currentBreakpoint
    ? (props.size as ScreenSizeMap)[currentBreakpoint]
    : undefined;

  if (!currentSize) return {};
  return {
    width: toCssSize(currentSize) as string,
    height: toCssSize(currentSize) as string,
    // ⚠️ 判据是 `(icon || children)` —— 与数字尺寸分支的 `icon` **不同**（§2.9）。
    //    Vue 侧 `children` 的对应物是**默认插槽是否被传入**（读函数引用、**不调用**）。
    fontSize: toCssSize(props.icon || slots.default ? currentSize / 2 : 18) as string,
  };
}

/**
 * 数字尺寸的内联样式（上游 `sizeStyle`）。
 *
 * ⚠️ `fontSize` 只在**有 `icon`** 时给（与响应式分支的判据不同，见 §2.9）。
 */
const sizeStyle = computed((): Record<string, string> => {
  if (!isNumber(props.size)) return {};
  return {
    width: toCssSize(props.size) as string,
    height: toCssSize(props.size) as string,
    fontSize: toCssSize(props.icon ? props.size / 2 : 18) as string,
  };
});

// ---------------------------------------------------------------------------
// 类名
// ---------------------------------------------------------------------------

const prefixCls = computed(() => getPrefixCls('avatar', props.prefixCls));

const hasImageElement = computed(() => isVNode(props.src));

const mergedShape = computed(() => props.shape || avatarCtx?.shape || 'circle');

/** 上游 `classString` 的**顺序即契约**。 */
const classString = computed(() => [
  prefixCls.value,
  {
    [`${prefixCls.value}-lg`]: mergedSize.value === 'large',
    [`${prefixCls.value}-sm`]: mergedSize.value === 'small',
  },
  contextClassName,
  `${prefixCls.value}-${mergedShape.value}`,
  {
    [`${prefixCls.value}-image`]: hasImageElement.value || !!(props.src && isImgExist.value),
    [`${prefixCls.value}-icon`]: !!props.icon,
  },
  `${prefixCls.value}-css-var`,
]);

// ---------------------------------------------------------------------------
// 五路互斥分支
// ---------------------------------------------------------------------------

/** 是否渲染「字符串 src 的 `<img>`」。 */
const isStringSrc = computed(() => typeof props.src === 'string' && isImgExist.value);

/** 第 4 支的判据（`mounted || scale !== 1`）。 */
const isMeasuredBranch = computed(() => mounted.value || scale.value !== 1);

/**
 * `-string` span 的 transform。
 *
 * ⚠️ 三个键都写（与上游一致）：`msTransform` 在 Chrome 里是**无效属性**（CSSOM 会丢弃），
 *    所以两侧的产物里都只有 `-webkit-transform` + `transform` ⇒ L4 不会因为前缀不同而红。
 */
const childrenStyle = computed((): Record<string, string> => {
  if (!isMeasuredBranch.value) return { opacity: '0' };
  const t = `scale(${scale.value})`;
  return { msTransform: t, WebkitTransform: t, transform: t };
});

// ---------------------------------------------------------------------------
// 告警（上游 `:139-147`）
// ---------------------------------------------------------------------------

const devWarning = useDevWarning('Avatar');
/**
 * ⚠️ 上游是**三参** `warning(valid, 'breaking', msg)`，本仓 `devUseWarning` 是**两参**
 * ⇒ 把 `'breaking'` 并进消息（`slider` 已踩过同一条）。
 */
devWarning(
  !(typeof props.icon === 'string' && props.icon.length > 2),
  `\`icon\` is using ReactNode instead of string naming in v4. Please check \`${String(props.icon)}\` at https://ant.design/components/icon`,
);

// ---------------------------------------------------------------------------
// 根属性 / 暴露
// ---------------------------------------------------------------------------

/**
 * `{...others}` + 四层 style 合并（顺序即契约，见文件头）。
 *
 * ⚠️ 根 `class` / `style` 是 Vue 原生 attrs：调用方 `style` 经 `$attrs` 进来，
 *    排在四层内部样式**之后** ⇒ 同名键优先（与原先 `props.style` 的位置一致）。
 */
function rootAttrs(): Record<string, unknown> {
  return mergeProps(
    {
      style: {
        ...sizeStyle.value,
        ...responsiveSizeStyle(),
        ...contextStyle,
      },
    },
    attrs,
  );
}

defineExpose({ nativeElement: rootRef });
</script>

<template>
  <span
    ref="rootRef"
    :class="classString"
    v-bind="rootAttrs()"
    @click="handleClick"
  >
    <img
      v-if="isStringSrc"
      :src="props.src as string"
      :draggable="props.draggable"
      :srcset="props.srcSet"
      :alt="props.alt"
      :crossorigin="props.crossOrigin"
      @error="handleImgLoadError"
    />
    <NodeRenderer v-else-if="hasImageElement" :node="props.src" />
    <NodeRenderer v-else-if="props.icon" :node="props.icon" />
    <span v-else ref="childrenRef" :class="`${prefixCls}-string`" :style="childrenStyle">
      <slot />
    </span>
  </span>
</template>
