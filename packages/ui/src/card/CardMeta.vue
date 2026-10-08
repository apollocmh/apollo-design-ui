<script setup lang="ts">
/**
 * Card.Meta —— 卡片的「头像 + 标题 + 描述」信息区。对应 antd 6.6.4 的
 * `es/card/CardMeta.js`（136 行）。
 *
 * ── 五条必须复刻的判据 ───────────────────────────────────────────────────────
 *
 * 1. **前缀是 `{cardPrefixCls}-meta`**，而 `cardPrefixCls` 来自
 *    `getPrefixCls('card', prefixCls)` —— 即 `<Card.Meta prefix-cls="x">` 得到
 *    `x-card-meta`（`prefixCls` 是 **card** 的前缀，不是 meta 的）。
 * 2. **根类名的顺序**是 `metaPrefixCls` → `className` → `contextClassName` →
 *    `mergedClassNames.root`（注意 `className` 在 `contextClassName` **之前** ——
 *    与 `Card` 的 `contextClassName` 在前**相反**）。
 * 3. **`avatar` 在 `section` 外面**（与 `section` 并列），`title` / `description`
 *    在 `section` **里面**。三者的真值判据都是 `isRenderable`。
 * 4. **`section` 只在 `title` 或 `description` 可渲染时存在**（`titleDom || descriptionDom`）。
 * 5. **根上没有任何 `-rtl`** —— `Card.Meta` 不读 `direction`（`Card` 读）。
 *
 * ── 🚨 第二个 ConfigProvider 配置键 ──────────────────────────────────────────
 *
 * 本组件读的是 `components.cardMeta`（不是 `components.card`）—— 上游同样如此
 * （`useComponentConfig('cardMeta')`）。同一组件族两个键，是本组件最容易漏的一条。
 */

import { isRenderable } from '@apollo-design/utils';
import { computed, mergeProps, ref, useAttrs, useSlots, type VNodeChild, watchEffect } from 'vue';
// ⚠️ `NodeRenderer` 是**平台原语**（`.vue` 模板没有「渲染一个 VNode 变量」的语法），
// 目前住在 `empty/components/`。`button` / `result` 也这样 import —— 详见 README §5 的
// 「应上移到 `_internal/`」债务登记。
import { NodeRenderer } from '../_internal/node-renderer';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import type {
  CardMetaConfig,
  CardMetaProps,
  CardMetaSemanticClassNames,
  CardMetaSemanticStyles,
} from './interface';

defineOptions({ name: 'ACardMeta', inheritAttrs: false });

const props = withDefaults(defineProps<CardMetaProps>(), {
  prefixCls: undefined,
  style: undefined,
  className: undefined,
  avatar: undefined,
  title: undefined,
  description: undefined,
  classNames: undefined,
  styles: undefined,
});

const attrs = useAttrs();

/** 默认插槽 = 上游的 `children`（规则 C19）。 */
defineSlots<{ default?: () => VNodeChild }>();

const {
  getPrefixCls,
  className: contextClassName,
  style: contextStyle,
  classNames: contextClassNames,
  styles: contextStyles,
} = useComponentConfig<CardMetaConfig>('cardMeta');

const prefixCls = computed(() => getPrefixCls('card', props.prefixCls));
const metaPrefixCls = computed(() => `${prefixCls.value}-meta`);

// ---------------------------------------------------------------------------
// 语义化
// ---------------------------------------------------------------------------

/**
 * 函数式 `classNames` / `styles` 拿到的 `info.props`。
 * 与 `Skeleton` / `Breadcrumb` 同法：身份稳定、内容随 props 同步的普通对象。
 */
const semanticProps: CardMetaProps = { ...props };
watchEffect(() => {
  Object.assign(semanticProps, props);
});

const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
  CardMetaProps,
  CardMetaSemanticClassNames,
  CardMetaSemanticStyles
>(
  [() => contextClassNames, () => props.classNames],
  [() => contextStyles, () => semanticRootStyle(contextStyle), () => props.styles],
  semanticProps,
);

// ---------------------------------------------------------------------------
// 类名（顺序即契约）
// ---------------------------------------------------------------------------

const rootClassNames = computed(() => [
  metaPrefixCls.value,
  contextClassName,
  mergedClassNames.value.root,
]);

const avatarClassNames = computed(() => [
  `${metaPrefixCls.value}-avatar`,
  mergedClassNames.value.avatar,
]);

const titleClassNames = computed(() => [
  `${metaPrefixCls.value}-title`,
  mergedClassNames.value.title,
]);

const descriptionClassNames = computed(() => [
  `${metaPrefixCls.value}-description`,
  mergedClassNames.value.description,
]);

const sectionClassNames = computed(() => [
  `${metaPrefixCls.value}-section`,
  mergedClassNames.value.section,
]);

// ---------------------------------------------------------------------------
// 三个真值判据
// ---------------------------------------------------------------------------

const slots = useSlots();
const hasAvatar = computed(() => isRenderable(props.avatar) || !!slots.avatar);
const hasTitle = computed(() => isRenderable(props.title) || !!slots.title);
const hasDescription = computed(() => isRenderable(props.description) || !!slots.description);
/** `titleDom || descriptionDom` ⇒ 有 section。 */
const hasSection = computed(() => hasTitle.value || hasDescription.value);

/** 根属性：语义化 `styles.root` + `{...restProps}`（调用方原生 attrs 优先）。 */
const rootAttrs = computed(() => mergeProps(styleAttrs(mergedStyles.value.root), attrs));

const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>

<template>
  <div ref="rootRef" :class="rootClassNames" v-bind="rootAttrs">
    <div v-if="hasAvatar" :class="avatarClassNames" v-bind="styleAttrs(mergedStyles.avatar)">
      <slot name="avatar"><NodeRenderer :node="props.avatar" /></slot>
    </div>
    <div v-if="hasSection" :class="sectionClassNames" v-bind="styleAttrs(mergedStyles.section)">
      <div
        v-if="hasTitle"
        :class="titleClassNames"
        v-bind="styleAttrs(mergedStyles.title)"
      >
        <slot name="title"><NodeRenderer :node="props.title" /></slot>
      </div>
      <div
        v-if="hasDescription"
        :class="descriptionClassNames"
        v-bind="styleAttrs(mergedStyles.description)"
      >
        <slot name="description"><NodeRenderer :node="props.description" /></slot>
      </div>
    </div>
  </div>
</template>
