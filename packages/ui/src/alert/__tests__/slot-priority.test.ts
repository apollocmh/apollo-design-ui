/** F07: content slots take precedence by presence, including intentionally empty slots. */
import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import Collapse from '../../collapse/Collapse';
import { CollapsePanel } from '../../collapse/Panel';
import Alert from '../Alert';

it('F07: Alert title/description slots override simultaneously supplied props', () => {
  const w = mount(Alert, {
    props: { title: 'Prop title', description: 'Prop description' },
    slots: {
      title: () => h('strong', 'Slot title'),
      description: () => h('em', 'Slot description'),
    },
  });
  expect(w.get('.apollo-alert-title').text()).toBe('Slot title');
  expect(w.get('.apollo-alert-description').text()).toBe('Slot description');
  w.unmount();
});

it('F07: empty Alert slots suppress props and description styling', () => {
  const w = mount(Alert, {
    props: { title: 'Prop title', description: 'Prop description' },
    slots: { title: () => [], description: () => [] },
  });
  expect(w.text()).not.toContain('Prop');
  expect(w.get('.apollo-alert').classes()).not.toContain('apollo-alert-with-description');
  w.unmount();
});

it('F07: conditional Alert slots update and restore prop-only content without remount', async () => {
  const show = ref(false);
  const label = ref('First');
  const w = mount(
    defineComponent({
      components: { Alert },
      setup: () => ({ show, label }),
      template: `<Alert title="Prop title" description="Prop description"><template v-if="show" #title>{{ label }}</template><template v-if="show" #description>{{ label }}</template></Alert>`,
    }),
  );
  const root = w.get('.apollo-alert').element;
  expect(w.get('.apollo-alert-title').text()).toBe('Prop title');
  show.value = true;
  await nextTick();
  expect(w.get('.apollo-alert-title').text()).toBe('First');
  label.value = 'Second';
  await nextTick();
  expect(w.get('.apollo-alert-description').text()).toBe('Second');
  show.value = false;
  await nextTick();
  expect(w.get('.apollo-alert-title').text()).toBe('Prop title');
  expect(w.get('.apollo-alert').element).toBe(root);
  w.unmount();
});

it('F07: Collapse panel header slots override props, including an empty header', () => {
  const w = mount(Collapse, {
    slots: {
      default: () => [
        h(
          CollapsePanel,
          { key: 'a', header: 'Prop a' },
          { header: () => h('strong', 'Slot a'), default: () => 'Body a' },
        ),
        h(
          CollapsePanel,
          { key: 'b', header: 'Prop b' },
          { header: () => [], default: () => 'Body b' },
        ),
      ],
    },
  });
  expect(w.findAll('.apollo-collapse-title').map((n) => n.text())).toEqual(['Slot a', '']);
  w.unmount();
});

it('F07: conditionally added panel/header slots recover and remain current', async () => {
  const show = ref(false);
  const header = ref('First');
  const w = mount(
    defineComponent({
      components: { Collapse, CollapsePanel },
      setup: () => ({ show, header }),
      template: `<Collapse :default-active-key="['a']"><template v-if="show" #default><CollapsePanel key="a" header="Prop"><template #header>{{ header }}</template>Body</CollapsePanel></template></Collapse>`,
    }),
  );
  expect(w.findAll('.apollo-collapse-item')).toHaveLength(0);
  show.value = true;
  await nextTick();
  expect(w.get('.apollo-collapse-title').text()).toBe('First');
  header.value = 'Second';
  await nextTick();
  expect(w.get('.apollo-collapse-title').text()).toBe('Second');
  show.value = false;
  await nextTick();
  expect(w.findAll('.apollo-collapse-item')).toHaveLength(0);
  show.value = true;
  await nextTick();
  expect(w.get('.apollo-collapse-title').text()).toBe('Second');
  w.unmount();
});

it('F07: Collapse reads a single panel tree for header and body in the current render', () => {
  const children = vi.fn(() =>
    ['a', 'b'].map((key) => h(CollapsePanel, { key, header: key }, () => `Body ${key}`)),
  );
  const w = mount(Collapse, {
    props: { defaultActiveKey: ['a', 'b'] },
    slots: { default: children },
  });
  expect(w.text()).toContain('Body a');
  expect(w.text()).toContain('Body b');
  expect(children).toHaveBeenCalledTimes(1);
  w.unmount();
});
