import { ConfigProvider, Result } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref, shallowRef } from 'vue';
export const resultNames = ['main', 'adjacent', 'illustration'];
export default defineComponent({
  setup() {
    const stage = ref(0),
      shown = ref(true),
      extra = ref(false),
      status = ref(404),
      native = ref(false);
    const instance = shallowRef(null);
    onMounted(() => {
      window.resultHydration = {
        async cycleTheme() {
          stage.value = (stage.value + 1) % 3;
          await nextTick();
        },
        async toggleExtra() {
          extra.value = !extra.value;
          await nextTick();
        },
        async status(value) {
          status.value = value;
          await nextTick();
        },
        async native(value) {
          native.value = value;
          await nextTick();
        },
        async show(value) {
          shown.value = value;
          await nextTick();
        },
        snapshot: () => ({ nativeId: instance.value?.nativeElement?.id ?? null }),
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          theme:
            stage.value === 1
              ? undefined
              : {
                  components: {
                    Result: {
                      titleFontSize: stage.value === 0 ? 27 : 31,
                      subtitleFontSize: 18,
                      iconFontSize: 84,
                      extraMargin: '20px 0 0',
                    },
                  },
                },
        },
        () =>
          h('main', [
            h('h1', 'Result hydration'),
            ...(shown.value
              ? [
                  h(
                    Result,
                    {
                      id: 'hydrated-main',
                      ref: instance,
                      status: status.value,
                      icon: false,
                      title: 'Fallback',
                      style: native.value
                        ? { '--apollo-result-title-font-size': '43px' }
                        : undefined,
                    },
                    {
                      title: () => [h('h2', 'Native result'), h('span', 'Title tail')],
                      subTitle: () => [
                        h('span', 'Current description'),
                        h('strong', 'Description tail'),
                      ],
                      icon: () => [
                        h('label', { for: 'hydrated-icon-draft' }, 'Icon draft'),
                        h('input', { id: 'hydrated-icon-draft' }),
                        extra.value ? h('b', 'Adjacent native content') : null,
                      ],
                      extra: () => h('button', { type: 'button' }, 'Native action'),
                      default: () => [
                        h('label', { for: 'hydrated-body-draft' }, 'Body draft'),
                        h('input', { id: 'hydrated-body-draft' }),
                        h('strong', 'Body tail'),
                      ],
                    },
                  ),
                  h(Result, {
                    id: 'hydrated-adjacent',
                    status: 'success',
                    title: 'Adjacent result',
                  }),
                  h(Result, { id: 'hydrated-illustration', status: 403, title: '403' }),
                ]
              : []),
          ]),
      );
  },
});
