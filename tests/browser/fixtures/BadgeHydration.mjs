import { darkAlgorithm } from '@apollo-design/theme';
import { Badge, ConfigProvider, Ribbon } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, onUnmounted, ref, shallowRef } from 'vue';

export default defineComponent({
  setup() {
    const stage = ref(0),
      show = ref(true);
    const badge = shallowRef(null),
      ribbon = shallowRef(null);
    let mounts = 0,
      unmounts = 0;
    const Business = defineComponent({
      props: { name: String },
      setup(props) {
        onMounted(() => {
          mounts++;
        });
        onUnmounted(() => {
          unmounts++;
        });
        return () =>
          h('input', {
            id: `badge-hydrated-${props.name}`,
            'aria-label': `${props.name} hydrated draft`,
          });
      },
    });
    onMounted(() => {
      window.badgeHydration = {
        async set(patch) {
          if ('stage' in patch) stage.value = patch.stage;
          if ('show' in patch) show.value = patch.show;
          await nextTick();
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
        },
        snapshot: () => ({
          mounts,
          unmounts,
          roots: [
            badge.value?.nativeElement === document.getElementById('hydrated-badge'),
            ribbon.value?.nativeElement === document.getElementById('hydrated-ribbon'),
          ],
        }),
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          direction: stage.value ? 'rtl' : 'ltr',
          theme: {
            algorithm: stage.value ? undefined : darkAlgorithm,
            components: { Badge: { indicatorHeight: stage.value ? 29 : 26 } },
          },
          components: {
            badge: { classNames: () => ({ root: `stage-${stage.value}` }) },
            ribbon: { classNames: () => ({ root: `stage-${stage.value}` }) },
          },
        },
        () =>
          show.value
            ? h('main', { style: { padding: '32px' } }, [
                h('h1', 'Badge hydration'),
                h(
                  Badge,
                  { id: 'hydrated-badge', ref: badge, count: -12, style: [{ padding: '8px' }] },
                  {
                    default: () => h(Business, { name: 'badge' }),
                    text: () => [h('b', 'First'), h('i', 'Last'), 0],
                  },
                ),
                h(
                  Ribbon,
                  { id: 'hydrated-ribbon', ref: ribbon, text: 'Fallback', style: 'padding: 12px' },
                  {
                    default: () => h(Business, { name: 'ribbon' }),
                    text: () => [h('b', 'Complete'), h('i', 'Content'), 0],
                  },
                ),
              ])
            : null,
      );
  },
});
