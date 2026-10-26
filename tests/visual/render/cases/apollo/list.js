/** Apollo List states exercise current content, ownership and source themes. */
import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider, List, ListItem, ListItemMeta } from '@apollo-design/ui';
import { h } from 'vue';

const records = ['Alpha', 'Beta', 'Gamma'];
const moreRecords = [...records, 'Delta', 'Epsilon', 'Zeta'];
const action = (name) => h('button', { type: 'button', key: name }, name);
const avatar = () =>
  h('span', {
    'aria-hidden': 'true',
    style: {
      display: 'inline-block',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: 'var(--apollo-color-primary-bg)',
    },
  });
const meta = (name) =>
  h(ListItemMeta, { title: name, description: 'Review the current task.' }, { avatar });
const row = ({ item }) => h(ListItem, { key: item }, () => item);
const richRow = ({ item }) =>
  h(
    ListItem,
    { key: item },
    {
      default: () => meta(item),
      actions: () => [action('Edit'), action('More')],
    },
  );
const list = (props = {}, item = row) =>
  h(
    List,
    {
      id: 'list-main',
      dataSource: records,
      ...props,
    },
    { item },
  );
const frame = (name, content) =>
  h(
    'main',
    {
      'data-list-visual-case': name,
      style: {
        boxSizing: 'border-box',
        width: '100%',
        minHeight: name === 'loading-fullscreen' ? 'calc(100vh - 32px)' : '240px',
        padding: '12px',
        color: 'var(--apollo-color-text)',
        background: 'var(--apollo-color-bg-container)',
        fontFamily: 'var(--apollo-font-family)',
        fontSize: 'var(--apollo-font-size)',
      },
    },
    [
      h('h1', { style: { margin: '0 0 8px', fontSize: '20px' } }, 'Workspace'),
      h('h2', { style: { margin: '0 0 8px', fontSize: '16px' } }, 'Review queue'),
      h('h3', { style: { margin: '0 0 12px', fontSize: '14px' } }, 'Records'),
      ...content,
    ],
  );
const summary = () =>
  h('aside', { 'aria-label': 'Queue summary' }, [h('strong', '3 pending'), h('p', 'Today')]);
const extraContent = () =>
  h(
    List,
    {
      id: 'list-main',
      dataSource: records,
      bordered: true,
      header: 'Current work',
      footer: 'End of queue',
    },
    { item: richRow, extra: summary },
  );
const themed = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () => frame(name, [extraContent()]));

export default {
  basic: () => frame('basic', [list()]),
  meta: () => frame('meta', [list({}, ({ item }) => h(ListItem, { key: item }, () => meta(item)))]),
  actions: () => frame('actions', [list({}, richRow)]),
  bordered: () =>
    frame('bordered', [list({ bordered: true, header: 'Current work', footer: 'End of queue' })]),
  vertical: () =>
    frame('vertical', [
      list({ itemLayout: 'vertical' }, ({ item }) =>
        h(
          ListItem,
          { key: item },
          {
            default: () => meta(item),
            extra: () => h('span', 'Due today'),
            actions: () => [action('Edit'), action('More')],
          },
        ),
      ),
    ]),
  grid: () =>
    frame('grid', [
      list({ dataSource: moreRecords, grid: { gutter: 16, column: 2, xs: 1, md: 3 } }, ({ item }) =>
        h(ListItem, { key: item }, () => meta(item)),
      ),
    ]),
  pagination: () =>
    frame('pagination', [
      list({
        dataSource: moreRecords,
        pagination: { pageSize: 2, position: 'both', align: 'center' },
      }),
    ]),
  loading: () => frame('loading', [list({ loading: { description: 'Updating queue' } })]),
  'loading-fullscreen': () =>
    frame('loading-fullscreen', [
      list({ loading: { fullscreen: true, description: 'Updating queue' } }),
    ]),
  empty: () => frame('empty', [list({ dataSource: [] })]),
  size: () =>
    frame('size', [
      list({ size: 'large', bordered: true, header: 'Large' }),
      list({
        id: 'list-small',
        size: 'small',
        bordered: true,
        header: 'Small',
        style: { marginTop: '16px' },
      }),
    ]),
  rtl: () => h(ConfigProvider, { direction: 'rtl' }, () => frame('rtl', [extraContent()])),
  extra: () =>
    frame('extra', [
      extraContent(),
      list({ id: 'list-item-extra', style: { marginTop: '16px' } }, ({ item }) =>
        h(
          ListItem,
          { key: item },
          {
            default: () => item,
            extra: () => h('span', 'Due today'),
          },
        ),
      ),
    ]),
  nested: () =>
    frame('nested', [
      h(
        List,
        {
          id: 'list-main',
          size: 'small',
          bordered: true,
          itemLayout: 'vertical',
          dataSource: ['Group'],
        },
        {
          item: () =>
            h(ListItem, {}, () =>
              h(
                List,
                { id: 'list-nested', size: 'large', split: false, dataSource: records },
                {
                  item: ({ item }) => h(ListItem, { key: item }, () => meta(item)),
                },
              ),
            ),
        },
      ),
    ]),
  tokens: () =>
    h(
      ConfigProvider,
      {
        theme: {
          components: {
            List: {
              contentWidth: 180,
              itemPadding: '21px 23px',
              itemPaddingSM: '7px 11px',
              itemPaddingLG: '25px 27px',
              headerBg: '#ddeeff',
              footerBg: '#eeddff',
              emptyTextPadding: 31,
              metaMarginBottom: 17,
              avatarMarginRight: 19,
              titleMarginBottom: 13,
              descriptionFontSize: 18,
            },
          },
        },
      },
      () =>
        frame('tokens', [
          list(
            {
              bordered: true,
              itemLayout: 'vertical',
              header: 'Token header',
              footer: 'Token footer',
            },
            ({ item }) =>
              h(
                ListItem,
                { key: item },
                {
                  default: () => meta(item),
                  extra: () => h('span', 'Extra'),
                },
              ),
          ),
          list({ id: 'list-token-empty', dataSource: [], style: { marginTop: '16px' } }),
        ]),
    ),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
  'native-focus': () =>
    frame('native-focus', [
      h('button', { type: 'button', id: 'list-focus-before' }, 'Before list'),
      h(
        List,
        { id: 'list-main', dataSource: ['Draft'] },
        {
          item: () =>
            h(
              ListItem,
              {},
              {
                default: () =>
                  h('input', {
                    id: 'list-draft',
                    'aria-label': 'Queue draft',
                    value: 'Review draft',
                    style: { width: '150px', maxWidth: '100%' },
                  }),
                actions: () => [action('Save')],
              },
            ),
        },
      ),
    ]),
};
