/**
 * Sider —— 侧边栏（Layout.Sider）。
 *
 * 契约来源：antd 6.6.4 的 `es/layout/Sider.js`（判据逐条对齐，G1 分析 §2）。
 * 为什么是渲染函数：根 `aside` 同时承担 expose ref 与响应式注册，且
 * trigger / zero-width-trigger 是带**多重判据**的子结构。
 *
 * ── 七条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 * 1. **collapsed 是受控/非受控二选一**：`collapsed === undefined` ⇒ 非受控（默认
 *    defaultCollapsed）。受控时 click 只发事件，由父级决定。
 * 2. **siderWidth**：`isNumeric(width) ? `${w}px` : String(w)` —— `50%` 保持 `50%`。
 * 3. **zero-width-trigger 是 `<span>`**（普通 trigger 是 `<div>`），且只有
 *    `collapsedWidth` 解析为 0 时才存在。
 * 4. **trigger 渲染条件**：`trigger !== null` 才有 triggerDom；但**是否挂到树上**
 *    取决于 `collapsible || (below && zeroWidthTrigger)`。
 * 5. **`-has-trigger`** = `collapsible && trigger !== null && !zeroWidthTrigger`。
 * 6. **响应式**：挂载时**立即**以 `mql.matches` 调一次 `onBreakpoint`，并在
 *    `collapsed !== mql.matches` 时以 `'responsive'` 触发折叠。
 * 7. **style 顺序**：`{...mergedStyles.root, ...divStyle}` —— divStyle 覆盖语义 root。
 */

import { BarsOutlined, LeftOutlined, RightOutlined } from '@apollo-design/icons';
import { useControlledValue } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  onScopeDispose,
  type PropType,
  shallowRef,
  type VNodeChild,
  watch,
} from 'vue';
import { mergeClassNames, mergeStyles, resolveSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { provideSiderContext, useLayoutContext } from './context';
import type {
  Breakpoint,
  CollapseType,
  LayoutConfig,
  SiderProps,
  SiderSemanticClassNames,
  SiderSemanticStyles,
  SiderTheme,
} from './interface';

/** 断点 → `matchMedia` 的 max-width（antd 的 dimensionMaxMap 逐字）。 */
const dimensionMaxMap: Record<Breakpoint, string> = {
  xs: '479.98px',
  sm: '575.98px',
  md: '767.98px',
  lg: '991.98px',
  xl: '1199.98px',
  xxl: '1599.98px',
  xxxl: '1839.98px',
};

/** antd 的 `isNumeric`。 */
function isNumeric(val: unknown): boolean {
  return !Number.isNaN(Number.parseFloat(String(val))) && Number.isFinite(Number(val));
}

let siderIdSeed = 0;
const generateId = (prefix = ''): string => {
  siderIdSeed += 1;
  return `${prefix}${siderIdSeed}`;
};

export const SiderComponent = defineComponent({
  name: 'ALayoutSider',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    collapsible: { type: Boolean, default: false },
    collapsed: { type: Boolean, default: undefined },
    defaultCollapsed: { type: Boolean, default: false },
    reverseArrow: { type: Boolean, default: false },
    zeroWidthTriggerStyle: {
      type: Object as PropType<SiderProps['zeroWidthTriggerStyle']>,
      default: undefined,
    },
    trigger: { type: null as unknown as PropType<SiderProps['trigger']>, default: undefined },
    width: { type: [Number, String] as PropType<SiderProps['width']>, default: 200 },
    collapsedWidth: {
      type: [Number, String] as PropType<SiderProps['collapsedWidth']>,
      default: 80,
    },
    breakpoint: { type: String as PropType<Breakpoint>, default: undefined },
    theme: { type: String as PropType<SiderTheme>, default: 'dark' },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<SiderProps['style']>, default: () => ({}) },
    classNames: {
      type: [Object, Function] as PropType<SiderProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<SiderProps['styles']>, default: undefined },
  },
  // ⚠️ onCollapse / onBreakpoint 走 attrs（antd 是 props，不是 DOM 事件）；
  //    声明 emits 会让 Vue 把它们从 attrs 里摘掉 —— 这里刻意不声明。
  setup(props, { attrs, expose, slots }) {
    const { onCollapse, onBreakpoint } = attrs as unknown as {
      onCollapse?: (collapsed: boolean, type: CollapseType) => void;
      onBreakpoint?: (broken: boolean) => void;
    };

    const rootRef = shallowRef<HTMLElement | null>(null);
    const context = useComponentConfig<LayoutConfig>('layout');
    const { getPrefixCls, direction } = context;
    const prefixCls = computed(() => getPrefixCls('layout-sider', props.prefixCls));
    const layoutContext = useLayoutContext();

    // ============================= Collapsed =============================
    const [mergedCollapsed, setCollapsed] = useControlledValue<boolean>({
      defaultValue: () => props.defaultCollapsed,
      getValue: () => props.collapsed,
    });

    const handleSetCollapsed = (value: boolean, type: CollapseType) => {
      setCollapsed(value);
      onCollapse?.(value, type);
    };

    // ============================= Responsive ============================
    const below = shallowRef(false);
    let mql: MediaQueryList | null = null;
    const responsiveHandler = (event: MediaQueryList | MediaQueryListEvent) => {
      const matched = event.matches;
      below.value = matched;
      onBreakpoint?.(matched);
      if (mergedCollapsed.value !== matched) {
        handleSetCollapsed(matched, 'responsive');
      }
    };

    const detachResponsive = () => {
      if (typeof mql?.removeEventListener === 'function') {
        mql.removeEventListener('change', responsiveHandler);
      }
      mql = null;
    };

    const attachResponsive = () => {
      detachResponsive();
      const bp = props.breakpoint;
      if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return;
      if (!bp || !(bp in dimensionMaxMap)) return;
      const next = window.matchMedia(`screen and (max-width: ${dimensionMaxMap[bp]})`);
      mql = next;
      if (typeof next.addEventListener === 'function') {
        next.addEventListener('change', responsiveHandler);
      }
      // ⚠️ 挂载时立即跑一次（上游 `onBreakpoint` 用例靠它）
      responsiveHandler(next);
    };

    attachResponsive();
    watch(() => props.breakpoint, attachResponsive);
    onScopeDispose(detachResponsive);

    // ======================== Register to Layout =========================
    const uniqueId = generateId('apollo-sider-');
    layoutContext.siderHook.addSider(uniqueId);
    onScopeDispose(() => layoutContext.siderHook.removeSider(uniqueId));

    // ============================= Semantic ==============================
    // antd 把「解构后的 props + collapsed」整体喂给语义化函数 —— 逐字对齐。
    const semanticProps = computed<SiderProps>(() => ({
      ...props,
      collapsed: mergedCollapsed.value,
    }));

    // ⚠️ 不用 `useMergeSemantic` 的返回值快照：它的第三个参数是**值**（不是 getter），
    //    传 `semanticProps.value` 会让函数式语义化永远拿到首帧的 collapsed。
    //    这里直接用它的两个原语（mergeClassNames / mergeStyles + resolveSemantic）
    //    包一层 computed —— 语义与 antd 完全一致，且是响应式的。
    const info = computed(() => ({ props: semanticProps.value }));
    const mergedClassNames = computed(() =>
      mergeClassNames<SiderSemanticClassNames>(
        resolveSemantic<SiderSemanticClassNames, SiderProps>(props.classNames as never, info.value),
      ),
    );
    const mergedStyles = computed(() =>
      mergeStyles<SiderSemanticStyles>(
        resolveSemantic<SiderSemanticStyles, SiderProps>(props.styles as never, info.value),
      ),
    );

    // ============================== Width ================================
    const rawWidth = computed(() => (mergedCollapsed.value ? props.collapsedWidth : props.width));
    const siderWidth = computed(() =>
      isNumeric(rawWidth.value) ? `${rawWidth.value}px` : String(rawWidth.value),
    );

    // ============================== Trigger ==============================
    const isZeroWidthTrigger = computed(
      () => Number.parseFloat(String(props.collapsedWidth ?? 0)) === 0,
    );

    // ReactNode prop 的 Vue 双通道：**prop 优先，插槽兜底**（button/Alert 同约定）。
    const triggerValue = computed<VNodeChild | undefined>(() => {
      if (props.trigger !== undefined) return props.trigger as VNodeChild;
      return slots.trigger?.() as VNodeChild | undefined;
    });
    // ⚠️ antd 判的是 `trigger !== null`：既没 prop 也没插槽时视为 null
    const triggerIsNull = computed(() => props.trigger === null && !slots.trigger);
    const triggerContent = computed<VNodeChild>(
      () => (triggerValue.value !== undefined ? triggerValue.value : null) as VNodeChild,
    );

    const zeroWidthTriggerNode = computed(() => {
      if (!isZeroWidthTrigger.value) return null;
      return h(
        'span',
        {
          class: [
            `${prefixCls.value}-zero-width-trigger`,
            `${prefixCls.value}-zero-width-trigger-${props.reverseArrow ? 'right' : 'left'}`,
          ],
          style: props.zeroWidthTriggerStyle,
          onClick: () => handleSetCollapsed(!mergedCollapsed.value, 'clickTrigger'),
        },
        [triggerContent.value ?? h(BarsOutlined)],
      );
    });

    const reverseIcon = computed(() => (direction === 'rtl') === !props.reverseArrow);
    const iconObj = computed(() => ({
      expanded: reverseIcon.value ? h(RightOutlined) : h(LeftOutlined),
      collapsed: reverseIcon.value ? h(LeftOutlined) : h(RightOutlined),
    }));
    const defaultTrigger = computed(() =>
      mergedCollapsed.value ? iconObj.value.collapsed : iconObj.value.expanded,
    );

    const triggerDom = computed(() => {
      if (triggerIsNull.value) return null;
      const zw = zeroWidthTriggerNode.value;
      if (zw) return zw;
      return h(
        'div',
        {
          class: `${prefixCls.value}-trigger`,
          style: { width: siderWidth.value },
          onClick: () => handleSetCollapsed(!mergedCollapsed.value, 'clickTrigger'),
        },
        [triggerContent.value ?? defaultTrigger.value],
      );
    });

    // ============================== Render ===============================
    const divStyle = computed(() => ({
      ...props.style,
      flex: `0 0 ${siderWidth.value}`,
      maxWidth: siderWidth.value,
      minWidth: siderWidth.value,
      width: siderWidth.value,
    }));

    provideSiderContext({ siderCollapsed: mergedCollapsed.value });

    expose({
      nativeElement: rootRef,
    });

    return () => {
      const cls = prefixCls.value;
      const siderCls = [
        cls,
        `${cls}-${props.theme}`,
        {
          [`${cls}-collapsed`]: !!mergedCollapsed.value,
          [`${cls}-has-trigger`]:
            props.collapsible && !triggerIsNull.value && !isZeroWidthTrigger.value,
          [`${cls}-below`]: !!below.value,
          [`${cls}-zero-width`]: Number.parseFloat(siderWidth.value) === 0,
        },
        props.className,
        context.className,
        mergedClassNames.value.root,
      ];

      return h(
        'aside',
        {
          ...attrs,
          ref: rootRef,
          class: siderCls,
          style: { ...mergedStyles.value.root, ...divStyle.value },
        },
        [
          h(
            'div',
            {
              class: [`${cls}-children`, mergedClassNames.value.body],
              style: mergedStyles.value.body,
            },
            [slots.default?.() as VNodeChild],
          ),
          props.collapsible || (below.value && isZeroWidthTrigger.value) ? triggerDom.value : null,
        ],
      );
    };
  },
});

export const Sider = SiderComponent;
export default Sider;
