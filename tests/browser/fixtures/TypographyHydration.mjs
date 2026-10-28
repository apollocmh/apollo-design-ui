import { darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider, Link, Paragraph, Text, Title, Typography } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, onUnmounted, ref, shallowRef } from 'vue';
export const typographyNames = ['container', 'title', 'text', 'paragraph', 'link'];
export default defineComponent({
  setup() {
    const stage = ref(0),
      show = ref(true);
    let mounts = 0,
      unmounts = 0;
    const roots = Object.fromEntries(typographyNames.map((name) => [name, shallowRef(null)]));
    const props = (name) => ({ id: `hydrated-${name}`, ref: roots[name] });
    const Business = defineComponent({
      setup() {
        onMounted(() => {
          mounts++;
        });
        onUnmounted(() => {
          unmounts++;
        });
        return () =>
          h('input', {
            id: 'typography-hydrated-draft',
            'aria-label': 'Hydrated draft',
            style: { width: '80px' },
          });
      },
    });
    onMounted(() => {
      window.typographyHydration = {
        async set(patch) {
          if ('stage' in patch) stage.value = patch.stage;
          if ('show' in patch) show.value = patch.show;
          await nextTick();
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
        },
        snapshot() {
          return {
            mounts,
            unmounts,
            roots: typographyNames.map(
              (name) =>
                roots[name].value?.nativeElement === document.getElementById(`hydrated-${name}`),
            ),
          };
        },
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          theme: {
            algorithm: stage.value === 0 ? darkAlgorithm : undefined,
            components: { Typography: { titleMarginBottom: stage.value === 0 ? 9 : 12 } },
          },
          components: { typography: { classNames: { root: `hydrated-stage-${stage.value}` } } },
        },
        () =>
          show.value
            ? h(
                'main',
                {
                  style: {
                    background: 'var(--apollo-color-bg-container)',
                    color: 'var(--apollo-color-text)',
                    padding: '24px',
                  },
                },
                [
                  h(Typography, props('container'), () => 'Container'),
                  h(Title, { ...props('title'), level: 2 }, () => 'Hydrated title'),
                  h(Text, props('text'), () => 'Hydrated text'),
                  h(
                    Paragraph,
                    {
                      ...props('paragraph'),
                      style: { width: '320px' },
                      ellipsis: { rows: 2, expandable: 'collapsible' },
                      copyable: true,
                    },
                    () => [
                      h(Business, { key: 'business' }),
                      ' More content for native measurement. '.repeat(20),
                    ],
                  ),
                  h(
                    Link,
                    { ...props('link'), href: '#hydrated-target', copyable: true },
                    () => 'Hydrated link',
                  ),
                  h('span', { id: 'hydrated-target' }, 'Destination'),
                ],
              )
            : null,
      );
  },
});
