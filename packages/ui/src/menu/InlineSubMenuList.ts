import { CSSMotion, type CSSMotionSlotProps, initCollapseMotion } from '@apollo-design/motion';
import { computed, defineComponent, h, type PropType, provide, ref, watch } from 'vue';

import { inheritMenuContext, menuContextKey, useMenuContext } from './context';
import type { MenuMode } from './interface';

/** 保留离场中的 inline 子树，模式退出完成后再销毁。 */
export default defineComponent({
  name: 'AMenuInlineSubMenuList',
  props: {
    id: { type: String, required: true },
    open: { type: Boolean, required: true },
    mode: { type: String as PropType<MenuMode>, required: true },
    depth: { type: Number, required: true },
  },
  setup(props, { slots }) {
    const ctx = useMenuContext();
    // 父级切为 popup 模式时，离场中的后代仍按 inline 布局测量高度。
    provide(
      menuContextKey,
      inheritMenuContext(ctx, {
        mode: computed(() => 'inline'),
        inlineCollapsed: false,
      }),
    );
    const destroyed = ref(props.mode !== 'inline');
    let motionRunning = false;
    watch(
      () => [props.mode, props.open] as const,
      ([mode], [previousMode, previousOpen]) => {
        if (mode === 'inline') destroyed.value = false;
        else if (previousMode === 'inline' && !previousOpen && !motionRunning) {
          // 已经 hidden 的列表不会再发 visibleChanged(false)，直接释放。
          destroyed.value = true;
        }
      },
      { flush: 'sync' },
    );
    const { motionName, motionDeadline, ...hooks } = initCollapseMotion(ctx.rootPrefixCls);

    return () =>
      destroyed.value
        ? null
        : h(
            CSSMotion,
            {
              visible: props.mode === 'inline' && props.open,
              motionName,
              motionDeadline,
              hooks,
              motionAppear: ctx.mounted.value && props.depth === 1,
              forceRender: ctx.forceSubMenuRender ?? false,
              removeOnLeave: false,
              leavedClassName: `${ctx.prefixCls}-hidden`,
              onVisibleChanged: (visible: boolean) => {
                if (!visible && props.mode !== 'inline') destroyed.value = true;
              },
            },
            {
              default: ({ className, style, status }: CSSMotionSlotProps) => {
                motionRunning = status !== 'none';
                return h(
                  'ul',
                  {
                    id: props.id,
                    class: [
                      ctx.prefixCls,
                      `${ctx.prefixCls}-sub`,
                      `${ctx.prefixCls}-inline`,
                      className,
                    ],
                    style,
                    role: 'menu',
                    'data-menu-list': true,
                  },
                  slots.default?.(),
                );
              },
            },
          );
  },
});
