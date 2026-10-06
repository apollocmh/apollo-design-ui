/**
 * Layout —— 布局容器（复合组件：Layout.Header / Footer / Content / Sider）。
 *
 * 契约来源：antd 6.6.4 的 `es/layout/layout.js`（判据逐条对齐，G1 分析 §2）。
 *
 * ── 五条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 * 1. **class 顺序**：`prefixCls → -has-sider → -rtl → contextClassName →
 *    className → rootClassName`（Header/Footer/Content 走 Basic，**没有**
 *    rootClassName / contextClassName）。
 * 2. **Basic 的前缀**：`customizePrefixCls || prefixWithSuffixCls` —— 传了
 *    `prefixCls` 就**直接用它**（不再拼 suffix）。
 * 3. **style 顺序**：`{...contextStyle, ...style}`（用户 style 覆盖 context）。
 * 4. **hasSider 三源**：显式 boolean > 已注册 sider 数 > children 里有没有 Sider
 *    —— 第三条必须**首帧**成立（SSR 契约，`addSider` 是 mount 后才有的）。
 * 5. **tagName**：Layout=div / Header=header / Footer=footer / Content=main。
 */

import { type CSSProperties, computed, defineComponent, h, shallowRef, type VNodeChild } from 'vue';
import { useComponentConfig } from '../config-provider/context';
import { provideLayoutContext } from './context';
import { useHasSider } from './hooks/use-has-sider';
import type { LayoutConfig } from './interface';

const layoutProps = {
  prefixCls: { type: String, default: undefined },
  hasSider: { type: Boolean, default: undefined },
};

/** 内部注入参数（antd 的 `generator({ suffixCls, tagName, displayName })`）。 */
interface GeneratorConfig {
  suffixCls?: string;
  tagName: 'header' | 'footer' | 'main' | 'div';
  displayName: string;
}

/**
 * `Basic` —— Header / Footer / Content 的实现。
 *
 * ⚠️ 与 BasicLayout 的差异（逐字对齐 antd）：
 *    - 类名用 `customizePrefixCls || prefixWithSuffixCls`（**不**加 `-rtl`、
 *      **不**读 contextClassName、**没有** rootClassName）
 *    - style 就是用户 style（无 contextStyle）
 */
function createBasic(config: GeneratorConfig) {
  const { suffixCls, tagName, displayName } = config;
  return defineComponent({
    name: displayName,
    inheritAttrs: false,
    props: layoutProps,
    setup(props, { attrs, expose, slots }) {
      const context = useComponentConfig<LayoutConfig>('layout');
      const { getPrefixCls } = context;
      const rootRef = shallowRef<HTMLElement | null>(null);

      expose({
        get nativeElement() {
          return rootRef.value;
        },
      });

      return () => {
        const base = getPrefixCls('layout', props.prefixCls);
        const prefixWithSuffixCls = suffixCls ? `${base}-${suffixCls}` : base;
        return h(
          tagName,
          {
            ...attrs,
            ref: rootRef,
            // 根 `class` / `style` 是 Vue 原生 attrs（`style` 直接由 `...attrs` 带入）。
            class: [props.prefixCls || prefixWithSuffixCls, attrs.class],
          },
          [slots.default?.() as VNodeChild],
        );
      };
    },
  });
}

/** `BasicLayout` —— Layout 本体。 */
const BasicLayout = defineComponent({
  name: 'ALayout',
  inheritAttrs: false,
  props: layoutProps,
  setup(props, { attrs, expose, slots }) {
    const context = useComponentConfig<LayoutConfig>('layout');
    const { getPrefixCls, direction } = context;
    const rootRef = shallowRef<HTMLElement | null>(null);

    // ======================== Sider registration =========================
    const siders = shallowRef<string[]>([]);
    const siderHook = {
      addSider: (id: string) => {
        siders.value = [...siders.value, id];
      },
      removeSider: (id: string) => {
        siders.value = siders.value.filter((currentId) => currentId !== id);
      },
    };
    provideLayoutContext({ siderHook });

    expose({
      get nativeElement() {
        return rootRef.value;
      },
    });

    return () => {
      const prefixCls = getPrefixCls('layout', props.prefixCls);
      const children = slots.default?.() as VNodeChild | VNodeChild[] | undefined;
      const mergedHasSider = useHasSider(siders.value, children, props.hasSider);

      const classString = [
        prefixCls,
        {
          [`${prefixCls}-has-sider`]: mergedHasSider,
          [`${prefixCls}-rtl`]: direction === 'rtl',
        },
        context.className,
        // 调用方原生 `class`（位置与原先的 props.className/rootClassName 一致，都在最后）
        attrs.class,
      ];

      return h(
        'div',
        {
          ...attrs,
          ref: rootRef,
          class: classString,
          // 根 `style` 是原生 attr：位置与原先的 `props.style` 一致（覆盖 context.style）
          style: { ...context.style, ...((attrs.style as CSSProperties | undefined) ?? {}) },
        },
        [children as VNodeChild],
      );
    };
  },
});

/** Layout 本体（注册名 `ALayout`）。 */
export const LayoutComponent = BasicLayout;

/** Header（`ALayoutHeader`）。 */
export const Header = createBasic({
  suffixCls: 'header',
  tagName: 'header',
  displayName: 'ALayoutHeader',
});

/** Footer（`ALayoutFooter`）。 */
export const Footer = createBasic({
  suffixCls: 'footer',
  tagName: 'footer',
  displayName: 'ALayoutFooter',
});

/** Content（`ALayoutContent`）。 */
export const Content = createBasic({
  suffixCls: 'content',
  tagName: 'main',
  displayName: 'ALayoutContent',
});

/** Layout 的 props 类型导出（供 interface 层复用）。 */
export const layoutPropTypes = layoutProps;

/** 供 useHasSider 之外的场景判断（例如 dev 提示）。 */
export const isLayoutComponent = computed(() => true);

export default LayoutComponent;
