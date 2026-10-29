import { ConfigProvider } from '@input-source/config-provider/index.ts';
import {
  Input,
  InputGroup,
  InputOTP,
  InputPassword,
  InputSearch,
  TextArea,
} from '@input-source/input/index.ts';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import ScopedAncestor from './ScopedAncestor.vue';
import ScopedInput from './ScopedInput.vue';

const families = { Input, TextArea, InputPassword, InputSearch, InputOTP, InputGroup };
export function render(family, props) {
  return renderToString(
    createSSRApp({
      render: () =>
        h(
          families[family],
          props,
          family === 'InputGroup'
            ? { default: () => h(Input, { 'aria-label': 'SSR child' }) }
            : undefined,
        ),
    }),
  );
}
export function renderAssociated(kind, props, provider = {}) {
  return renderToString(
    createSSRApp({
      render: () =>
        h(ConfigProvider, provider, {
          default: () =>
            h('section', { 'data-associated': kind }, [
              h(kind === 'scoped' ? ScopedInput : ScopedAncestor, props),
              h(Input, {
                class: 'owned-scoped-input',
                'data-unscoped-peer': '',
                'aria-label': 'Unscoped peer',
              }),
              h('button', { type: 'button', 'data-associated-outside': '' }, 'Outside'),
            ]),
        }),
    }),
  );
}
