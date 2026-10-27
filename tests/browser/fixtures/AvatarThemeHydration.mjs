import { darkAlgorithm } from '@apollo-design/theme';
import { Avatar, AvatarGroup, ConfigProvider } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref, shallowRef } from 'vue';
export const avatarNames = ['main', 'group', 'overflow', 'adjacent'];
export default defineComponent({
  setup() {
    const stage = ref(0),
      show = ref(true),
      image = ref(true),
      order = ref(['A', 'B']);
    const controlled = ref(false),
      accept = ref(false),
      changes = [];
    const instances = Object.fromEntries(avatarNames.map((n) => [n, shallowRef(null)]));
    const root = (name) => ({ id: `hydrated-${name}`, ref: instances[name] });
    const Member = defineComponent({
      props: { name: { type: String, required: true } },
      setup(p) {
        return () =>
          h(Avatar, { size: 80 }, () => [
            h('label', { for: `member-${p.name}` }, p.name),
            h('input', { id: `member-${p.name}`, style: { width: '30px' } }),
          ]);
      },
    });
    onMounted(() => {
      window.avatarHydration = {
        async stage(value) {
          stage.value = value;
          await nextTick();
        },
        async show(value) {
          show.value = value;
          await nextTick();
        },
        async image(value) {
          image.value = value;
          await nextTick();
        },
        async reverse() {
          order.value.reverse();
          await nextTick();
        },
        async control(value) {
          accept.value = value;
          controlled.value = false;
          changes.length = 0;
          await nextTick();
        },
        snapshot: () => ({
          roots: avatarNames.map((n) => instances[n].value?.nativeElement?.id ?? null),
          changes: [...changes],
          controlled: controlled.value,
        }),
      };
    });
    return () =>
      h('main', [
        h('h1', 'Avatar hydration'),
        h(
          ConfigProvider,
          {
            prefixCls: stage.value === 1 ? 'audit' : 'apollo',
            direction: stage.value === 1 ? 'rtl' : 'ltr',
            theme:
              stage.value === 0
                ? undefined
                : {
                    algorithm: stage.value === 1 ? darkAlgorithm : undefined,
                    components: {
                      Avatar: {
                        containerSize: stage.value === 1 ? 50 : 42,
                        groupOverlapping: stage.value === 1 ? -12 : -6,
                        groupSpace: stage.value === 1 ? 9 : 7,
                      },
                    },
                  },
            components: {
              avatar: {
                className: `stage-${stage.value}`,
                style: { marginBlock: stage.value === 1 ? '7px' : '3px' },
              },
            },
          },
          () =>
            show.value
              ? h(
                  'section',
                  { style: { background: 'var(--apollo-color-bg-container)', padding: '20px' } },
                  [
                    h(
                      Avatar,
                      { ...root('main'), size: 180 },
                      {
                        image: image.value
                          ? () => [
                              h('label', { for: 'hydrated-draft' }, 'Avatar draft'),
                              h('input', { id: 'hydrated-draft', style: { width: '60px' } }),
                              h('b', 'Image tail'),
                              0,
                            ]
                          : undefined,
                        default: () => 'Visible fallback',
                      },
                    ),
                    h(AvatarGroup, { ...root('group'), size: 80 }, () =>
                      order.value.map((name) => h(Member, { key: name, name })),
                    ),
                    h(
                      AvatarGroup,
                      {
                        ...root('overflow'),
                        max: {
                          count: 1,
                          popover: {
                            trigger: 'click',
                            mouseEnterDelay: 0,
                            mouseLeaveDelay: 0,
                            destroyOnHidden: false,
                          },
                        },
                      },
                      () => [
                        h(Avatar, null, () => 'A'),
                        h(Avatar, { size: 120 }, () => [
                          h('label', { for: 'hidden-draft' }, 'Hidden draft'),
                          h('input', { id: 'hidden-draft', style: { width: '40px' } }),
                        ]),
                        h(Avatar, null, () => 'C'),
                      ],
                    ),
                    h(
                      AvatarGroup,
                      {
                        id: 'controlled-group',
                        max: {
                          count: 1,
                          popover: {
                            open: controlled.value,
                            trigger: 'click',
                            onOpenChange(value) {
                              changes.push(value);
                              if (accept.value) controlled.value = value;
                            },
                          },
                        },
                      },
                      () => [h(Avatar, null, () => 'A'), h(Avatar, null, () => 'B')],
                    ),
                  ],
                )
              : null,
        ),
        h(Avatar, { ...root('adjacent') }, () => 'Adjacent'),
      ]);
  },
});
