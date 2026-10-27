import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';
import ListTokens from '../../../packages/ui/src/list/demo/component-token.vue';
import ListExtra from '../../../packages/ui/src/list/demo/item-extra.vue';
import ListyRich from '../../../packages/ui/src/listy/demo/rich.vue';
import UploadAvatar from '../../../packages/ui/src/upload/demo/avatar.vue';

const demos = { ListExtra, ListTokens, ListyRich, UploadAvatar };
export default defineComponent({
  setup() {
    const name = ref('ListExtra'),
      mode = ref('default');
    onMounted(() => {
      window.setAvatarConsumer = async (next, theme) => {
        name.value = next;
        mode.value = theme;
        await nextTick();
        await new Promise(requestAnimationFrame);
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
              style: {
                background: 'var(--apollo-color-bg-container)',
                color: 'var(--apollo-color-text)',
                padding: '24px',
              },
            },
            [
              h('h1', `${name.value} ${mode.value}`),
              h(demos[name.value], { key: `${name.value}-${mode.value}` }),
            ],
          ),
      );
  },
});
