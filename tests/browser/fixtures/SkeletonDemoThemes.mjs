import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';
import Demo3 from '../../../packages/ui/src/skeleton/demo/active.vue';
import Demo1 from '../../../packages/ui/src/skeleton/demo/avatar.vue';
import Demo0 from '../../../packages/ui/src/skeleton/demo/basic.vue';
import Demo5 from '../../../packages/ui/src/skeleton/demo/children.vue';
import Demo6 from '../../../packages/ui/src/skeleton/demo/complex.vue';
import Demo8 from '../../../packages/ui/src/skeleton/demo/component-token.vue';
import Demo7 from '../../../packages/ui/src/skeleton/demo/element.vue';
import Demo2 from '../../../packages/ui/src/skeleton/demo/loading.vue';
import Demo4 from '../../../packages/ui/src/skeleton/demo/semantic.vue';

const demos = {
  basic: Demo0,
  avatar: Demo1,
  loading: Demo2,
  active: Demo3,
  semantic: Demo4,
  children: Demo5,
  complex: Demo6,
  element: Demo7,
  'component-token': Demo8,
};
export default defineComponent({
  setup() {
    const name = ref('basic'),
      mode = ref('default');
    onMounted(() => {
      window.setSkeletonDemo = async (next, theme) => {
        name.value = next;
        mode.value = theme;
        await nextTick();
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          theme:
            mode.value === 'default'
              ? undefined
              : {
                  algorithm:
                    mode.value === 'dark'
                      ? darkAlgorithm
                      : mode.value === 'compact'
                        ? compactAlgorithm
                        : [darkAlgorithm, compactAlgorithm],
                },
        },
        () =>
          h(
            'main',
            {
              'data-skeleton-demos': name.value,
              style: {
                padding: '24px',
                minHeight: '300px',
                backgroundColor: 'var(--apollo-color-bg-container)',
                color: 'var(--apollo-color-text)',
                fontFamily: 'var(--apollo-font-family)',
              },
            },
            [h('h1', `${name.value} ${mode.value}`), h(demos[name.value], { key: name.value })],
          ),
      );
  },
});
