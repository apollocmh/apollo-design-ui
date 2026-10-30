/**
 * 面板区（rc `TabPanelList/index.js` 的等价物）。
 *
 * ```
 * div.{p}-body-holder
 * └─ div.{p}-body[-{tabPosition}][-animated][classNames.body][style=styles.body]
 *    └─ 每个 tab 一个 CSSMotion（visible=active, forceRender, removeOnLeave=destroyOnHidden,
 *         leavedClassName={p}-content-hidden, …animated.tabPaneMotion）
 *       └─ TabPane → div.{p}-content[-active][classNames.content][style=content+item.style+motion]
 * ```
 *
 * ⚠️ 三条判据：
 *
 *   1. `removeOnLeave` 取 **`item.destroyOnHidden ?? destroyOnHidden`** —— item 级优先，
 *      回落到 **item 级**（antd 壳在归一 items 时已把 item 的 `destroyInactiveTabPane`
 *      映射成 `destroyOnHidden`）；
 *   2. `-animated` 类与 `tabPaneMotion` 都看 `animated.tabPane`（**默认 false**）；
 *   3. 面板的 `content` 类名与 `-active` 类是**同一个 div**（不是嵌套）；
 *      `style` 的优先级是 `contentStyle → item.style → motionStyle`（后者覆盖前者）。
 */

import { CSSMotion, type CSSMotionSlotProps } from '@apollo-design/motion';
import { type CSSProperties, defineComponent, h, type PropType } from 'vue';
import type { TabPosition, TabsItem } from './interface';
import TabPane from './TabPane';

/** `animated.tabPaneMotion` 的形状（`useAnimateConfig` 产出）。 */
export interface TabPaneMotionConfig extends Record<string, unknown> {
  motionName: string;
  motionAppear: boolean;
  motionEnter: boolean;
  motionLeave: boolean;
}

export default defineComponent({
  name: 'ATabPanelList',
  props: {
    prefixCls: { type: String, required: true },
    id: { type: String as PropType<string | undefined>, default: undefined },
    tabs: { type: Array as PropType<TabsItem[]>, required: true },
    activeKey: { type: String as PropType<string | undefined>, default: undefined },
    animated: {
      type: Object as PropType<{ tabPane?: boolean; tabPaneMotion?: TabPaneMotionConfig }>,
      default: () => ({}),
    },
    tabPosition: { type: String as PropType<TabPosition>, default: 'top' },
    destroyOnHidden: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    bodyStyle: {
      type: Object as PropType<CSSProperties | undefined>,
      default: undefined,
    },
    bodyClassName: { type: String as PropType<string | undefined>, default: undefined },
    contentStyle: {
      type: Object as PropType<CSSProperties | undefined>,
      default: undefined,
    },
    contentClassName: { type: String as PropType<string | undefined>, default: undefined },
  },
  setup(props) {
    return () => {
      const { prefixCls, id, tabs, activeKey, animated, tabPosition } = props;
      const tabPaneAnimated = !!animated.tabPane;
      const bodyPrefixCls = `${prefixCls}-body`;
      const contentPrefixCls = `${prefixCls}-content`;

      return h('div', { class: `${bodyPrefixCls}-holder` }, [
        h(
          'div',
          {
            class: [
              bodyPrefixCls,
              `${bodyPrefixCls}-${tabPosition}`,
              tabPaneAnimated ? `${bodyPrefixCls}-animated` : undefined,
              props.bodyClassName,
            ]
              .filter(Boolean)
              .join(' '),
            style: props.bodyStyle,
          },
          tabs.map((item) => {
            const { key, forceRender, style: paneStyle, className: paneClassName } = item;
            const active = key === activeKey;
            const removeOnLeave = !!(item.destroyOnHidden ?? props.destroyOnHidden);

            const motionConfig = animated.tabPaneMotion ?? {};

            return h(
              CSSMotion,
              {
                key,
                visible: active,
                forceRender: forceRender ?? false,
                removeOnLeave,
                leavedClassName: `${contentPrefixCls}-hidden`,
                ...motionConfig,
              },
              {
                default: (slotProps: CSSMotionSlotProps) =>
                  h(TabPane, {
                    prefixCls: contentPrefixCls,
                    id,
                    tabKey: key,
                    active,
                    children: item.children,
                    className: [props.contentClassName, paneClassName, slotProps.className]
                      .filter(Boolean)
                      .join(' '),
                    style: {
                      ...props.contentStyle,
                      ...paneStyle,
                      ...slotProps.style,
                    },
                  }),
              },
            );
          }),
        ),
      ]);
    };
  },
});
