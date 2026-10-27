import { darkAlgorithm } from '@apollo-design/theme';
import { CheckableTag, CheckableTagGroup, ConfigProvider, Tag } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref, shallowRef } from 'vue';
import { en_US, zh_CN } from '../../../packages/locale/dist/index.mjs';

export const tagNames = ['main', 'link', 'choice', 'single', 'multiple', 'adjacent'];
export default defineComponent({
  setup() {
    const stage = ref(0),
      shown = ref(true),
      icon = ref(false),
      checked = ref(false),
      single = ref(0),
      multiple = ref([0]);
    const instances = Object.fromEntries(tagNames.map((name) => [name, shallowRef(null)]));
    onMounted(() => {
      window.tagHydration = {
        async stage(value) {
          stage.value = value;
          await nextTick();
        },
        async icon(value) {
          icon.value = value;
          await nextTick();
        },
        async show(value) {
          shown.value = value;
          await nextTick();
        },
        snapshot: () => ({
          checked: checked.value,
          single: single.value,
          multiple: multiple.value,
          roots: tagNames.map((name) => instances[name].value?.nativeElement?.id ?? null),
        }),
      };
    });
    const root = (name) => ({ id: `hydrated-${name}`, ref: instances[name] });
    return () =>
      h(
        ConfigProvider,
        {
          locale: stage.value === 1 ? zh_CN : en_US,
          direction: stage.value === 1 ? 'rtl' : 'ltr',
          prefixCls: stage.value === 1 ? 'audit' : 'apollo',
          theme:
            stage.value === 1
              ? {
                  algorithm: darkAlgorithm,
                  components: { Tag: { defaultBg: '#243850', defaultColor: '#ffffff' } },
                }
              : undefined,
          components:
            stage.value === 2
              ? undefined
              : {
                  tag: {
                    className: stage.value === 0 ? 'provider-first' : 'provider-next',
                    variant: stage.value === 1 ? 'outlined' : 'filled',
                    style: { paddingInline: stage.value === 1 ? '13px' : '9px' },
                  },
                },
        },
        () =>
          h('main', [
            h('h1', 'Tag hydration'),
            ...(shown.value
              ? [
                  h(
                    Tag,
                    { ...root('main'), closable: true },
                    {
                      icon: () =>
                        icon.value ? [h('b', 'First icon'), h('strong', 'Icon tail')] : [],
                      default: () => [
                        h('label', { for: 'hydrated-draft' }, 'Tag draft'),
                        h('input', { id: 'hydrated-draft' }),
                        h('strong', 'Content tail'),
                      ],
                    },
                  ),
                  h(
                    Tag,
                    {
                      ...root('link'),
                      closable: true,
                      href: '#target',
                      rel: 'noopener',
                      'aria-label': 'Linked label',
                    },
                    () => 'Link label',
                  ),
                  h(
                    CheckableTag,
                    {
                      ...root('choice'),
                      checked: checked.value,
                      'onUpdate:checked': (value) => (checked.value = value),
                    },
                    () => 'Hydrated choice',
                  ),
                  h(CheckableTagGroup, {
                    ...root('single'),
                    options: [0, 1],
                    value: single.value,
                    'onUpdate:value': (value) => (single.value = value),
                    'aria-label': 'Hydrated single',
                  }),
                  h(CheckableTagGroup, {
                    ...root('multiple'),
                    options: [0, 1],
                    value: multiple.value,
                    multiple: true,
                    'onUpdate:value': (value) => (multiple.value = value),
                    'aria-label': 'Hydrated multiple',
                  }),
                  h(
                    ConfigProvider,
                    {
                      components: { tag: { className: 'nearest-config' } },
                      prefixCls: 'apollo',
                      direction: 'ltr',
                    },
                    () => h(Tag, root('adjacent'), () => 'Adjacent'),
                  ),
                ]
              : []),
          ]),
      );
  },
});
