import { Tag } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';

export default defineComponent({
  setup() {
    const kind = ref('svg'),
      seed = ref(0),
      disabled = ref(false),
      canceled = ref(false),
      closed = ref(0);
    onMounted(() => {
      window.tagLink = {
        async reset(next, blocked = false, cancel = false) {
          kind.value = next;
          disabled.value = blocked;
          canceled.value = cancel;
          closed.value = 0;
          seed.value++;
          await nextTick();
        },
        snapshot: () => ({ closed: closed.value }),
      };
    });
    return () =>
      h(
        'main',
        {
          style: {
            padding: '24px',
            background: 'var(--apollo-color-bg-container)',
            color: 'var(--apollo-color-text)',
          },
        },
        [
          h('h1', 'Tag native linked close action'),
          h(
            Tag,
            {
              key: seed.value,
              id: 'linked-tag',
              href: '#target',
              closable: { disabled: disabled.value },
              onClose: (event) => {
                closed.value++;
                if (canceled.value) event.preventDefault();
              },
            },
            {
              default: () => 'Tagged link',
              ...(kind.value === 'svg'
                ? {
                    closeIcon: () =>
                      h(
                        'svg',
                        {
                          role: 'img',
                          'aria-label': 'Business glyph',
                          'data-caller-icon': 'yes',
                          width: 14,
                          height: 14,
                        },
                        [h('path', { d: 'M2 2l10 10M2 12L12 2', stroke: 'currentColor' })],
                      ),
                  }
                : {}),
            },
          ),
        ],
      );
  },
});
