import { compactAlgorithm, darkAlgorithm, ThemeProvider } from '@apollo-design/theme';
import {
  ConfigProvider,
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
  LayoutSider,
} from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, reactive } from 'vue';

export default defineComponent({
  setup() {
    const state = reactive({
      scene: 'layout',
      mode: 'light',
      rtl: false,
      themeFields: {},
      nativeStyle: {},
      rootStyle: {},
      controlled: false,
      accept: true,
      collapsed: false,
      width: 180,
      collapsedWidth: 72,
      breakpoint: undefined,
      trigger: undefined,
      slot: 'absent',
      theme: 'dark',
      present: true,
      reverseArrow: false,
    });
    const events = [],
      media = [];
    let submits = 0;
    const theme = () => ({
      algorithm:
        state.mode === 'dark'
          ? darkAlgorithm
          : state.mode === 'compact'
            ? compactAlgorithm
            : state.mode === 'both'
              ? [darkAlgorithm, compactAlgorithm]
              : undefined,
      components: { Layout: state.themeFields },
    });
    const editor = () =>
      h('input', {
        'aria-label': 'Persistent sidebar draft',
        defaultValue: 'Original draft',
        style: {
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          font: 'inherit',
          color: 'var(--apollo-color-text)',
          background: 'var(--apollo-color-bg-container)',
        },
      });
    const sider = () =>
      h(
        LayoutSider,
        {
          id: 'contract-sider',
          collapsible: true,
          collapsed: state.controlled ? state.collapsed : undefined,
          width: state.width,
          collapsedWidth: state.collapsedWidth,
          reverseArrow: state.reverseArrow,
          breakpoint: state.breakpoint,
          trigger: state.trigger,
          theme: state.theme,
          style: state.nativeStyle,
          'onUpdate:collapsed': (value) => {
            if (state.controlled && state.accept) state.collapsed = value;
          },
          onCollapse: (value, type) => events.push([value, type]),
          onBreakpoint: (broken) => media.push(broken),
        },
        {
          default: () => [h('p', 'Sidebar content'), editor()],
          ...(state.slot === 'absent'
            ? {}
            : { trigger: () => (state.slot === 'empty' ? [] : [h('strong', 'Current slot'), 0]) }),
        },
      );
    onMounted(() => {
      window.layoutAudit = {
        async set(patch) {
          Object.assign(state, patch);
          await nextTick();
          await nextTick();
        },
        snapshot() {
          return { events: [...events], media: [...media], submits };
        },
      };
    });
    return () => {
      if (state.scene === 'css-only-provider')
        return h(
          'div',
          { style: { '--apollo-font-size': '18px', '--apollo-layout-header-height': '73px' } },
          [
            h(ConfigProvider, null, () =>
              h(Layout, { id: 'css-only-layout' }, () => [
                h(LayoutHeader, null, () => 'CSS-only header'),
                sider(),
                h(LayoutContent, null, () => 'CSS-only content'),
              ]),
            ),
          ],
        );
      if (state.scene === 'empty-theme-provider')
        return h(
          ThemeProvider,
          {
            theme: {
              algorithm: [darkAlgorithm, compactAlgorithm],
              components: { Layout: { headerHeight: 77, headerBg: 'rgb(20, 30, 40)' } },
            },
          },
          () =>
            h(Layout, { id: 'far-theme-layout' }, () =>
              h(ThemeProvider, { theme: {} }, () =>
                h(ConfigProvider, null, () =>
                  h(LayoutHeader, { id: 'empty-theme-header' }, () => 'Current empty theme'),
                ),
              ),
            ),
        );
      return h(ThemeProvider, { theme: theme() }, () =>
        h(ConfigProvider, { direction: state.rtl ? 'rtl' : 'ltr' }, () => {
          if (state.scene === 'header')
            return h(
              LayoutHeader,
              { id: 'independent-header', style: state.nativeStyle },
              () => 'Independent header',
            );
          if (state.scene === 'footer')
            return h(
              LayoutFooter,
              { id: 'independent-footer', style: state.nativeStyle },
              () => 'Independent footer',
            );
          if (state.scene === 'content')
            return h(
              LayoutContent,
              { id: 'independent-content', style: state.nativeStyle },
              () => 'Independent content',
            );
          if (state.scene === 'sider') return sider();
          if (state.scene === 'nested')
            return h(
              Layout,
              { id: 'outer-layout', style: { '--apollo-layout-sider-bg': 'rgb(80, 0, 80)' } },
              () =>
                h(Layout, null, () => [sider(), h(LayoutContent, null, () => 'Nested content')]),
            );
          if (state.scene === 'nested-theme')
            return h(Layout, { id: 'outer-layout' }, () =>
              h(ThemeProvider, { theme: {} }, () =>
                h(LayoutHeader, { id: 'inner-header' }, () => 'Inner light header'),
              ),
            );
          return h(
            'form',
            {
              onSubmit: (event) => {
                event.preventDefault();
                submits++;
              },
            },
            [
              h(
                Layout,
                {
                  id: 'contract-layout',
                  style: [{ minHeight: '400px', width: '100%' }, state.rootStyle],
                },
                () => [
                  state.present ? sider() : null,
                  h(Layout, null, () => [
                    h(LayoutHeader, null, () => 'Current header'),
                    h(LayoutContent, { style: { padding: '16px' } }, () => [
                      h('h1', 'Layout contract'),
                      h('p', 'Main content'),
                    ]),
                    h(LayoutFooter, null, () => 'Current footer'),
                  ]),
                ],
              ),
            ],
          );
        }),
      );
    };
  },
});
