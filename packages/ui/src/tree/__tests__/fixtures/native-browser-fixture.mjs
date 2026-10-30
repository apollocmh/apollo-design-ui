import DirectoryTree from '__APOLLO_TREE_REPO__/packages/ui/src/tree/DirectoryTree.ts';
import DropIndicator from '__APOLLO_TREE_REPO__/packages/ui/src/tree/DropIndicator.ts';
import TokenDemo from '__APOLLO_TREE_REPO__/packages/ui/src/tree/demo/component-token.vue';
import DragDemo from '__APOLLO_TREE_REPO__/packages/ui/src/tree/demo/draggable.vue';
import ScrollDemo from '__APOLLO_TREE_REPO__/packages/ui/src/tree/demo/scroll-to.vue';
import { genTreeStyle } from '__APOLLO_TREE_REPO__/packages/ui/src/tree/style/index.ts';
import { prepareComponentToken } from '__APOLLO_TREE_REPO__/packages/ui/src/tree/style/token.ts';
import Tree from '__APOLLO_TREE_REPO__/packages/ui/src/tree/Tree.ts';
import {
  compactAlgorithm,
  darkAlgorithm,
  getCSSVarDeclarations,
  getDesignToken,
  ThemeProvider,
} from '@apollo-design/theme';
import { createSSRApp, defineComponent, h, nextTick, ref, shallowRef } from 'vue';

const algorithms = {
  default: undefined,
  dark: darkAlgorithm,
  compact: compactAlgorithm,
  'dark-compact': [darkAlgorithm, compactAlgorithm],
};
// Geometry/color probes use the existing reduced-motion token; do not sample transition interpolation.
export const css = (mode) =>
  getCSSVarDeclarations(getDesignToken({ algorithm: algorithms[mode], token: { motion: false } })) +
  genTreeStyle();
export const defaults = (mode) =>
  prepareComponentToken(getDesignToken({ algorithm: algorithms[mode] }));
export const names = Object.keys(defaults('default'));
export const variable = (name) =>
  `--apollo-tree-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
const data = [
  { key: 'a', title: 'A', children: [{ key: 'a1', title: 'A1' }] },
  { key: 'b', title: 'B' },
];
export function createFixture() {
  const mode = ref('default'),
    components = ref({}),
    source = ref(false),
    refs = {},
    warnings = [],
    errors = [],
    drops = [];
  const dragData = [
    {
      key: 'p',
      title: 'P',
      children: [
        { key: 'a', title: 'A' },
        { key: 'folder', title: 'Folder', children: [{ key: 'child', title: 'Child' }] },
      ],
    },
    { key: 'other', title: 'Other' },
    { key: 'disabled', title: 'Disabled', disabled: true },
  ];
  const measuredKeys = ref([]);
  const editorValue = ref('draft');
  const measuredData = shallowRef(
    Array.from({ length: 12 }, (_, i) => ({ key: `m${i}`, title: `Measured ${i}` })),
  );
  const theme = () => ({
    token: { motion: false },
    algorithm: algorithms[mode.value],
    components: { Tree: components.value },
  });
  const Content = defineComponent({
    render: () =>
      h('main', [
        h('section', { id: 'scroll-demo' }, [h(ScrollDemo)]),
        h('section', { id: 'drag-demo' }, [h(DragDemo)]),
        h('section', { id: 'token-demo' }, [h(TokenDemo)]),
        h('section', { id: 'measured' }, [
          h(
            Tree,
            {
              ref: (value) => {
                refs.measured = value;
              },
              treeData: measuredData.value,
              selectedKeys: measuredKeys.value,
              height: 100,
              itemHeight: 28,
            },
            {
              title: ({ node, data }) =>
                node.key === 'm0'
                  ? h('div', { style: { height: '70px' } }, [
                      h('input', {
                        'data-measured-editor': '',
                        value: editorValue.value,
                        onInput: (event) => {
                          editorValue.value = event.target.value;
                        },
                      }),
                    ])
                  : data.title,
            },
          ),
        ]),
        h('section', { id: 'regular' }, [
          h(Tree, {
            ref: (v) => {
              refs.regular = v;
            },
            treeData: data,
            defaultExpandAll: true,
            selectedKeys: ['a1'],
          }),
        ]),
        h('section', { id: 'directory' }, [
          h(DirectoryTree, { treeData: data, defaultExpandAll: true, selectedKeys: ['a1'] }),
        ]),
        h('section', { id: 'virtual' }, [
          h(Tree, {
            ref: (v) => {
              refs.virtual = v;
            },
            treeData: Array.from({ length: 80 }, (_, i) => ({ key: String(i), title: String(i) })),
            height: 100,
            itemHeight: 28,
          }),
        ]),
        h('section', { id: 'drag' }, [
          h(Tree, {
            treeData: dragData,
            defaultExpandAll: true,
            draggable: true,
            onDrop: (event, info) =>
              drops.push({
                tree: 'ltr',
                native: event instanceof DragEvent,
                key: info.node.key,
                gap: info.dropToGap,
                position: info.dropPosition,
              }),
          }),
        ]),
        h('section', { id: 'drag-rtl' }, [
          h(Tree, {
            dir: 'rtl',
            treeData: dragData,
            defaultExpandAll: true,
            draggable: true,
            onDrop: (event, info) =>
              drops.push({
                tree: 'rtl',
                native: event instanceof DragEvent,
                key: info.node.key,
                gap: info.dropToGap,
                position: info.dropPosition,
              }),
          }),
        ]),
        h('section', { id: 'motion' }, [h(Tree, { treeData: data })]),
        h('section', { id: 'drop-indicator', class: 'apollo-tree' }, [
          h(
            'div',
            {
              class: 'apollo-tree-node-content-wrapper',
              style: { width: '200px', height: '30px', position: 'relative' },
            },
            [
              h(DropIndicator, {
                prefixCls: 'apollo-tree',
                dropPosition: 0,
                dropLevelOffset: 0,
                indent: 24,
                direction: 'rtl',
              }),
            ],
          ),
        ]),
      ]),
  });
  const app = createSSRApp({
    render: () =>
      source.value ? h(ThemeProvider, { theme: theme() }, () => h(Content)) : h(Content),
  });
  app.config.warnHandler = (m) => warnings.push(m);
  app.config.errorHandler = (e) => errors.push(String(e));
  return {
    app,
    refs,
    warnings,
    errors,
    drops,
    names,
    variable,
    defaults,
    async set(patch) {
      if ('mode' in patch) mode.value = patch.mode;
      if ('components' in patch) components.value = patch.components;
      if ('source' in patch) source.value = patch.source;
      await nextTick();
      await nextTick();
    },
    rowEstimate() {
      const vnode = refs.regular?.$?.subTree?.children?.find(
        (v) => v.type?.name === 'ATreeNodeList',
      );
      return vnode?.props?.itemHeight;
    },
    async updateMeasured(reorder = false) {
      if (reorder)
        measuredData.value = [
          measuredData.value[1],
          measuredData.value[0],
          ...measuredData.value.slice(2),
        ];
      else measuredKeys.value = ['m0'];
      await nextTick();
      await nextTick();
    },
    async scroll(direct) {
      if (direct) {
        const vnode = refs.virtual?.$?.subTree?.children?.find(
          (v) => v.type?.name === 'ATreeNodeList',
        );
        vnode.component.exposed.scrollTo(560);
      } else refs.virtual.scrollTo(560);
      await nextTick();
      await nextTick();
    },
  };
}
