import { ConfigProvider } from '@apollo-design/ui/config-provider';
import { defineComponent, h } from 'vue';

export const draft = () =>
  h('input', {
    'aria-label': 'Business draft',
    style: { fontSize: 'var(--apollo-font-size,16px)' },
  });

export function serverRoot(kind) {
  const body =
    kind === 'table'
      ? h('table', [
          h('tbody', [
            h(ConfigProvider, { theme: { token: { fontSize: 21 } } }, () =>
              h('tr', [h('td', [draft()])]),
            ),
          ]),
        ])
      : kind === 'list'
        ? h('ul', [
            h(ConfigProvider, { theme: { token: { fontSize: 21 } } }, () => h('li', [draft()])),
          ])
        : kind === 'select'
          ? h('select', { 'aria-label': 'Choices' }, [
              h(ConfigProvider, { theme: { token: { fontSize: 21 } } }, () =>
                h('option', { value: 'a' }, 'Alpha'),
              ),
            ])
          : kind === 'svg'
            ? h('svg', [
                h(ConfigProvider, { theme: { token: { fontSize: 21 } } }, () =>
                  h('g', [h('text', { 'data-svg-text': '', y: 24 }, 'SVG text')]),
                ),
              ])
            : h(ConfigProvider, { scopeTag: 'section', theme: { token: { fontSize: 21 } } }, () =>
                h(Opaque),
              );
  return body;
}
export const Opaque = defineComponent({
  inheritAttrs: false,
  setup: () => () => h('article', { 'data-opaque': '' }, [draft()]),
});
