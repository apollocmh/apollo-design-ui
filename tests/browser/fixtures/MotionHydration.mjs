import { defineComponent, h, ref } from 'vue';
import { CSSMotion } from '../../../packages/motion/dist/index.mjs';

export default defineComponent({
  setup() {
    const visible = ref(true);
    const phases = ref([]);
    const changed = ref([]);
    const hooks = {
      onAppearStart: () => {
        phases.value.push('appear');
      },
      onLeaveStart: () => {
        phases.value.push('leave');
      },
      onEnterStart: () => {
        phases.value.push('enter');
      },
    };
    return () =>
      h('div', [
        h(
          'button',
          {
            onClick: () => {
              visible.value = !visible.value;
            },
          },
          'Toggle motion',
        ),
        h(
          CSSMotion,
          {
            visible: visible.value,
            supportMotion: true,
            motionName: 'ssr-motion',
            motionDeadline: 500,
            hooks,
            onVisibleChanged: (value) => {
              changed.value.push(value);
            },
          },
          {
            default: ({ className, style }) =>
              h('input', {
                class: className,
                style,
                'data-ssr-motion': '',
                'aria-label': 'Hydrated input',
              }),
          },
        ),
        h('output', JSON.stringify({ phases: phases.value, changed: changed.value })),
      ]);
  },
});
