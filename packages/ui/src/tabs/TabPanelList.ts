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
 *   1. `removeOnLeave` 取 **`destroyOnHidden ?? item.destroyOnHidden`** —— 组件级优先，
 *      回落到 **item 级**（antd 壳在归一 items 时已把 item 的 `destroyInactiveTabPane`
 *      映射成 `destroyOnHidden`）；
 *   2. `-animated` 类与 `tabPaneMotion` 都看 `animated.tabPane`（**默认 false**）；
 *   3. 面板的 `content` 类名与 `-active` 类是**同一个 div**（不是嵌套）；
 *      `style` 的优先级是 `contentStyle → item.style → motionStyle`（后者覆盖前者）。
 */

import { CSSMotion } from '@apollo-design/motion';
import { defineComponent, h, type PropType } from 'vue';
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
    id: { type: String, default: undefined },
    tabs: { type: Array as PropType<TabsItem[]>, required: true },
    activeKey: { type: String, default: undefined },
    animated: {
      type: Object as PropType<{ tabPane?: boolean; tabPaneMotion?: TabPaneMotionConfig }>,
      default: () => ({}),
    },
    tabPosition: { type: String as PropType<TabPosition>, default: 'top' },
    destroyOnHidden: { type: Boolean, default: undefined },
    bodyStyle: {
      type: Object as PropType<Record<string, unknown> | undefined>,
      default: undefined,
    },
    bodyClassName: { type: String, default: undefined },
    contentStyle: {
      type: Object as PropType<Record<string, unknown> | undefined>,
      default: undefined,
    },
    contentClassName: { type: String, default: undefined },
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
          tabs.map((item, index) => {
            const { key, forceRender, style: paneStyle, className: paneClassName } = item;
            const active = key === activeKey;
            const removeOnLeave = !!(props.destroyOnHidden ?? item.destroyOnHidden);

            const motionConfig = animated.tabPaneMotion ?? {};

            return h(
              CSSMotion as never,
              {
                key: `${key}-${index}`,
                visible: active,
                forceRender,
                removeOnLeave,
                leavedClassName: `${contentPrefixCls}-hidden`,
                ...(motionConfig as Record<string, unknown>),
              } as never,
              {
                default: (slotProps: { className?: string; style?: Record<string, unknown> }) =>
                  h(
                    TabPane as never,
                    {
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
                    } as never,
                  ),
              },
            );
          }),
        ),
      ]);
    };
  },
});
