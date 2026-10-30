import { defineComponent, h, normalizeStyle, ref } from 'vue';
import { MentionsUnstableProvider } from './engine/context';
import type { MentionsSemanticContext, MentionsSemanticStyles } from './interface';
import Mentions, { mentionsProps } from './Mentions';

/** Static preview owns the popup container; the ordinary component has no open prop. */
export const PurePanel = defineComponent({
  name: 'AMentionsPurePanel',
  inheritAttrs: false,
  props: mentionsProps,
  setup(props, { slots, attrs }) {
    const host = ref<HTMLElement | null>(null);
    return () =>
      h(
        'div',
        { ref: host, style: { position: 'relative' } },
        h(
          MentionsUnstableProvider,
          { value: { open: true } },
          {
            default: () =>
              h(
                Mentions,
                {
                  ...props,
                  ...attrs,
                  style: [normalizeStyle(attrs.style), { margin: 0 }],
                  styles: (info: MentionsSemanticContext): MentionsSemanticStyles => {
                    const styles =
                      typeof props.styles === 'function' ? props.styles(info) : props.styles;
                    return {
                      ...styles,
                      popup: {
                        ...styles?.popup,
                        position: 'relative',
                        top: 0,
                        left: 0,
                        right: 'auto',
                        bottom: 'auto',
                      },
                    };
                  },
                  getPopupContainer: () => host.value,
                },
                slots,
              ),
          },
        ),
      );
  },
});

export default PurePanel;
