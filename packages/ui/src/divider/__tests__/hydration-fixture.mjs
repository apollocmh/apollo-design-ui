import { ConfigProvider } from '@apollo-design/ui';
import { Divider } from '@apollo-design/ui/divider';
import { defineComponent, Fragment, h, nextTick, onMounted, reactive, ref } from 'vue';

export default defineComponent({
  setup() {
    const state = reactive({ phase: false });
    const owner = ref(null);
    onMounted(() => {
      window.dividerHydration = {
        ready: true,
        async next() {
          state.phase = true;
          await nextTick();
        },
        snapshot() {
          return owner.value?.nativeElement === document.querySelector('[data-hydrated-divider]');
        },
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          direction: state.phase ? 'rtl' : 'ltr',
          componentSize: state.phase ? 'large' : 'small',
          divider: { className: state.phase ? 'hydrated-second' : 'hydrated-first' },
          theme: {
            components: {
              Divider: {
                textPaddingInline: state.phase ? 21 : 12,
                orientationMargin: 0.2,
                verticalMarginInline: 16,
              },
            },
          },
        },
        () =>
          h(
            'main',
            { id: 'stage', style: { maxWidth: '720px', padding: '16px', boxSizing: 'border-box' } },
            [
              h('h1', 'Divider hydration'),
              h(
                Divider,
                {
                  ref: owner,
                  'data-hydrated-divider': '',
                  titlePlacement: 'left',
                  plain: state.phase,
                  styles: { content: { minWidth: 0, whiteSpace: 'normal' } },
                },
                () => [
                  h('strong', 'Hydrated title'),
                  ' ',
                  0,
                  h(Fragment, [
                    h('em', ' fragment'),
                    h('input', {
                      'data-hydrated-draft': '',
                      'aria-label': 'Hydrated Divider draft',
                      style: { width: '90px' },
                    }),
                  ]),
                ],
              ),
            ],
          ),
      );
  },
});
