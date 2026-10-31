import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { type CSSProperties, defineComponent, h, shallowRef } from 'vue';
import useMessage from '../../message/useMessage';
import useNotification from '../../notification/useNotification';
import Tooltip from '../../tooltip/Tooltip';
import ConfigProvider from '../ConfigProvider';
import type { ConfigProviderThemeConfig } from '../hooks/use-theme';

const wrappers: VueWrapper[] = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  document.body.replaceChildren();
});

it.each(['message', 'notification'])(
  '%s supplies its current numeric layer to an actual descendant Tooltip',
  async (kind) => {
    const explicit = shallowRef<CSSProperties['zIndex']>();
    const theme = shallowRef<ConfigProviderThemeConfig>({
      components: { Message: { zIndexPopup: 3000 }, Notification: { zIndexPopup: 3000 } },
    });
    const Reader = defineComponent({
      setup() {
        const content = h(
          Tooltip,
          { open: true, title: 'Notice child tooltip' },
          { default: () => h('button', 'Notice child') },
        );
        const config = () => ({ styles: { list: { zIndex: explicit.value } } });
        if (kind === 'message') {
          const [api, holder] = useMessage(config);
          api.open({ content, duration: 0 });
          return holder;
        }
        const [api, holder] = useNotification(config);
        api.open({ title: 'Notice', description: content, duration: 0 });
        return holder;
      },
    });
    wrappers.push(
      mount(
        defineComponent({
          setup: () => () => h(ConfigProvider, { theme: theme.value }, () => h(Reader)),
        }),
        { attachTo: document.body, global: { stubs: { teleport: false } } },
      ),
    );
    const layer = async (expected: number) => {
      await vi.waitFor(() => {
        expect(document.querySelector<HTMLElement>('.apollo-tooltip')?.style.zIndex).toBe(
          String(expected),
        );
      });
    };
    await layer(3100);
    explicit.value = 0;
    await layer(100);
    explicit.value = '2100';
    await layer(2200);
    explicit.value = undefined;
    await layer(3100);
    theme.value = {
      components: { Message: { zIndexPopup: 4000 }, Notification: { zIndexPopup: 4000 } },
    };
    await layer(4100);
  },
);
