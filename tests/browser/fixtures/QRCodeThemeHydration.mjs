import { computed, createCommentVNode, defineComponent, h, ref } from 'vue';
import { ConfigProvider, QrCode } from '../../../packages/ui/dist/index.mjs';

export default defineComponent({
  setup() {
    const phase = ref(0),
      mode = ref('svg'),
      state = ref('expired'),
      refreshes = ref(0);
    const theme = computed(() =>
      phase.value === 1
        ? undefined
        : {
            components: {
              QRCode: { QRCodeCoverBackgroundColor: phase.value === 2 ? '#ddeeff' : '#e8f4ec' },
            },
          },
    );
    const button = (text, action) =>
      h(
        'button',
        { type: 'button', onMousedown: (event) => event.preventDefault(), onClick: action },
        text,
      );
    return () =>
      h('main', [
        h('h1', 'Hydrated QR workspace'),
        button('Cycle hydrated theme', () => {
          phase.value = (phase.value + 1) % 3;
        }),
        button('Toggle hydrated mode', () => {
          mode.value = mode.value === 'svg' ? 'canvas' : 'svg';
        }),
        button('Cycle hydrated status', () => {
          state.value =
            state.value === 'expired'
              ? 'loading'
              : state.value === 'loading'
                ? 'scanned'
                : 'expired';
        }),
        h(
          ConfigProvider,
          {
            theme: theme.value,
            locale:
              phase.value === 2
                ? { locale: 'custom', QRCode: { refresh: 'Current refresh' } }
                : { locale: 'en', QRCode: {} },
          },
          () => [
            h(
              QrCode,
              {
                id: 'hydrated-qr',
                value: 'Production hydration',
                type: mode.value,
                status: state.value,
                title: 'Hydrated access',
                onRefresh: () => {
                  refreshes.value++;
                },
              },
              {
                status: ({ status, locale, refresh }) => [
                  createCommentVNode('conditional first child'),
                  h('input', { id: 'hydrated-qr-draft', 'aria-label': 'Hydrated QR draft' }),
                  h('output', { 'aria-label': 'Hydrated QR status' }, status),
                  h('button', { type: 'button', onClick: refresh }, locale.refresh),
                ],
              },
            ),
            h(QrCode, {
              id: 'hydrated-qr-canvas',
              value: 'Server canvas',
              title: 'Hydrated canvas',
            }),
          ],
        ),
        h('output', { 'aria-label': 'Hydrated refresh count' }, String(refreshes.value)),
      ]);
  },
});
