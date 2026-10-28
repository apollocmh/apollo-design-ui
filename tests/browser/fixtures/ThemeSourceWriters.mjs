import {
  compactAlgorithm,
  getDesignToken,
  ThemeContextKey,
  ThemeProvider,
  useTheme,
} from '@apollo-design/theme';
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  ConfigProvider,
  DatePicker,
  Descriptions,
  Dropdown,
  Flex,
  Image,
  ImagePreviewGroup,
  List,
  Mentions,
  Menu,
  Popconfirm,
  Popover,
  QrCode as QRCode,
  RangePicker,
  Result,
  Select,
  Skeleton,
  Space,
  SpaceAddon,
  SpaceCompact,
  Spin,
  Statistic,
  Table,
  Tag,
  Timeline,
  Title,
  Tooltip,
  Tour,
} from '@apollo-design/ui';
import { computed, defineComponent, h, nextTick, onMounted, provide, ref, shallowRef } from 'vue';

const image =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#1677ff"/></svg>',
  );
const text = () =>
  h(
    'span',
    {
      style: {
        fontSize: 'var(--apollo-font-size)',
        lineHeight: 'var(--apollo-line-height)',
        color: 'var(--apollo-color-text)',
      },
    },
    'Source content',
  );
const pair = () => [
  h('span', { style: { display: 'block', width: '20px', height: '20px' } }, 'A'),
  h('span', { style: { display: 'block', width: '20px', height: '20px' } }, 'B'),
];
const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    filters: [{ text: 'Alpha', value: 'Alpha' }],
    onFilter: (value, row) => row.name === value,
  },
];
const families = [
  ['Avatar', () => h(Avatar, {}, () => 'AB'), '.apollo-avatar', 'root'],
  [
    'Badge',
    () => h(Badge, { count: 2 }, () => h('span', 'Badge content')),
    '.apollo-badge-count',
    'root',
  ],
  [
    'Breadcrumb',
    () => h(Breadcrumb, { items: [{ title: 'Project' }, { title: 'Source' }] }),
    '.apollo-breadcrumb',
    'root',
  ],
  ['Button', () => h(Button, {}, () => 'Source action'), '.apollo-btn', 'root'],
  [
    'Descriptions',
    () =>
      h(Descriptions, { column: 1, items: [{ key: 'one', label: 'Label', children: 'Content' }] }),
    '.apollo-descriptions-item-content',
    'root',
  ],
  [
    'Image',
    () => h(Image, { src: image, alt: 'Source image', width: 32, height: 32, preview: false }),
    '.apollo-image',
    'image',
  ],
  ['List', () => h(List, {}, { default: text }), '.apollo-list', 'root'],
  [
    'QRCode',
    () => h(QRCode, { value: 'source-writer', status: 'loading' }),
    '.apollo-qrcode-cover',
    'root',
  ],
  [
    'Skeleton',
    () => h(Skeleton, { loading: true, title: true, paragraph: false }),
    '.apollo-skeleton-title',
    'skeleton',
  ],
  ['Spin', () => h(Spin, { spinning: true }), '.apollo-spin-indicator', 'spin'],
  [
    'Statistic',
    () => h(Statistic, { title: 'Revenue', value: 12560 }),
    '.apollo-statistic-content',
    'root',
  ],
  [
    'Table',
    () => h(Table, { columns, dataSource: [{ key: 'one', name: 'Alpha' }], pagination: false }),
    '.apollo-table-cell',
    'root',
  ],
  ['Tag', () => h(Tag, {}, () => 'Source tag'), '.apollo-tag', 'root'],
  [
    'Timeline',
    () => h(Timeline, { items: [{ key: 'one', title: 'Stage', content: 'Source content' }] }),
    '.apollo-timeline-item-content',
    'root',
  ],
  [
    'Typography',
    () => h(Title, { level: 4 }, () => 'Source heading'),
    '.apollo-typography',
    'root',
  ],
  ['Result', () => h(Result, { title: 'Source result' }), '.apollo-result-title', 'root'],
  ['Space', () => h(Space, { size: 'small' }, { default: pair }), '.apollo-space', 'gap'],
  ['Addon', () => h(SpaceAddon, {}, { default: text }), '.apollo-space-addon', 'root'],
  ['Compact', () => h(SpaceCompact, {}, { default: text }), '.apollo-space-compact span', 'root'],
  ['Flex', () => h(Flex, { gap: 'small' }, { default: pair }), '.apollo-flex', 'gap'],
];
const FallbackController = defineComponent({
  setup() {
    const source = useTheme();
    onMounted(() => {
      window.writerFallback = {
        async set(value) {
          source.config.value = value;
          await nextTick();
        },
      };
    });
    return () => null;
  },
});
const Specimens = defineComponent({
  props: { scene: String },
  setup(props) {
    return () =>
      h(
        'section',
        {
          'data-writer-scene': props.scene,
          style: {
            width: '460px',
            padding: '12px',
            fontFamily: 'var(--apollo-font-family)',
            fontSize: 'var(--apollo-font-size)',
            lineHeight: 'var(--apollo-line-height)',
            color: 'var(--apollo-color-text)',
          },
        },
        [
          h('h2', props.scene),
          ...families.map(([name, render, selector, kind]) =>
            h(
              'div',
              {
                'data-writer-family': name,
                'data-metric-selector': selector,
                'data-metric-kind': kind,
                style: { marginBlockEnd: '16px', width: '420px' },
              },
              [render()],
            ),
          ),
        ],
      );
  },
});
const CustomEmpty = defineComponent({
  setup(_, { slots }) {
    const config = shallowRef({});
    provide(ThemeContextKey, { config, token: computed(() => getDesignToken(config.value)) });
    return () => slots.default?.();
  },
});
const scene = (name) => h(Specimens, { scene: name });
const empty = (content) => h(ThemeProvider, { theme: {}, injectCssVar: false }, () => content);
const css = (content) => h('div', { class: 'writer-css-only' }, [content]);
const compact = (content) =>
  h(ConfigProvider, { theme: { algorithm: compactAlgorithm } }, () => content);
const PortalSources = defineComponent({
  setup() {
    const config = shallowRef({}),
      active = ref(true),
      open = ref(true),
      kind = ref('tooltip'),
      nativeOverride = ref(false),
      destination = ref('body');
    provide(ThemeContextKey, {
      config,
      token: computed(() => getDesignToken(config.value)),
      sourceActive: computed(() => active.value),
    });
    onMounted(() => {
      window.writerPortals = {
        async set(patch) {
          if ('active' in patch) active.value = patch.active;
          if ('config' in patch) config.value = patch.config;
          if ('open' in patch) open.value = patch.open;
          if ('kind' in patch) kind.value = patch.kind;
          if ('nativeOverride' in patch) nativeOverride.value = patch.nativeOverride;
          if ('destination' in patch) destination.value = patch.destination;
          await nextTick();
        },
      };
    });
    const button = () => h('button', { type: 'button' }, 'Open source popup');
    const widget = () => {
      const popupStyle = nativeOverride.value ? { '--apollo-font-size': '21px' } : undefined;
      switch (kind.value) {
        case 'tooltip':
          return h(
            Tooltip,
            {
              open: open.value,
              title: 'Source popup',
              styles: { root: popupStyle },
              getPopupContainer: () =>
                destination.value === 'second'
                  ? document.querySelector('#writer-portal-second')
                  : document.body,
            },
            { default: button },
          );
        case 'popover':
          return h(
            Popover,
            { open: open.value, title: 'Source popup', content: 'Source content' },
            { default: button },
          );
        case 'popconfirm':
          return h(
            Popconfirm,
            { open: open.value, title: 'Source popup', description: 'Source content' },
            { default: button },
          );
        case 'dropdown':
          return h(
            Dropdown,
            { open: open.value, menu: { items: [{ key: 'a', label: 'Source item' }] } },
            { default: button },
          );
        case 'menu':
          return h(Menu, {
            mode: 'horizontal',
            openKeys: open.value ? ['group'] : [],
            items: [
              { key: 'group', label: 'Group', children: [{ key: 'item', label: 'Source item' }] },
            ],
          });
        case 'date-picker':
          return h(DatePicker, { open: open.value });
        case 'range-picker':
          return h(RangePicker, { open: open.value });
        case 'select':
          return h(Select, {
            open: open.value,
            options: [{ value: 'a', label: 'Source option' }],
            'aria-label': 'Source select',
          });
        case 'mentions':
          return h(Mentions, {
            options: [{ value: 'source', label: 'Source option' }],
            'aria-label': 'Source mentions',
          });
        case 'image':
          return h(Image, { src: image, alt: 'Source preview', open: open.value });
        case 'image-group':
          return h(ImagePreviewGroup, { open: open.value }, () =>
            h(Image, { src: image, alt: 'Source group preview' }),
          );
        case 'table-filter':
          return h(Table, {
            columns,
            dataSource: [{ key: 'one', name: 'Alpha' }],
            pagination: false,
          });
        default:
          return h(Tour, {
            open: open.value,
            current: 0,
            steps: [{ title: 'Source tour', description: 'Source content', target: null }],
          });
      }
    };
    return () =>
      h(
        'section',
        {
          'data-source-portals': '',
          style: { padding: '48px', width: '500px', minHeight: '500px' },
        },
        [h('h2', 'Actual source portals'), h('div', { key: kind.value }, [widget()])],
      );
  },
});
export default defineComponent({
  setup() {
    onMounted(() => {
      window.themeWriterAudit = { ready: true };
    });
    return () =>
      h('main', [
        h(FallbackController),
        scene('default'),
        empty(scene('explicit-default')),
        css(scene('css-only')),
        css(h(ConfigProvider, {}, () => scene('css-no-theme-cp'))),
        css(empty(scene('css-empty-tp'))),
        compact(scene('compact')),
        compact(empty(scene('compact-empty-tp'))),
        compact(empty(h(ConfigProvider, {}, () => scene('compact-empty-tp-cp')))),
        compact(h(ConfigProvider, { theme: {} }, () => scene('compact-empty-cp-theme'))),
        compact(
          h(ConfigProvider, { theme: { inherit: false } }, () => scene('compact-inherit-false')),
        ),
        css(h(CustomEmpty, {}, () => scene('css-custom-no-metadata'))),
        h(PortalSources),
      ]);
  },
});
