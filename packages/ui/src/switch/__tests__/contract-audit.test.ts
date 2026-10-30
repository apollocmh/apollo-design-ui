import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, shallowRef, type VNodeChild } from 'vue';
import { ConfigProvider } from '../../config-provider';
import type { ComponentConfigLike } from '../../config-provider/interface';
import { Switch } from '../index';
import type { SwitchRef, SwitchSemanticContext } from '../interface';

it('merges current Provider styles and semantic regions, then removes withdrawn defaults', async () => {
  const components = ref<Record<string, ComponentConfigLike>>({
    switch: {
      className: 'provider-root',
      style: { paddingTop: '3px', color: 'red' },
      classNames: { root: 'provider-semantic-root', content: 'provider-content' },
      styles: {
        root: { marginTop: '2px', color: 'green' },
        content: { fontStyle: 'italic' },
        indicator: { top: '1px' },
      },
    },
  });
  const wrapper = mount({
    render: () =>
      h(ConfigProvider, { components: components.value }, () =>
        h(Switch, {
          class: 'native-root',
          style: ['color: purple', { paddingBottom: '4px' }],
          classNames: { root: 'local-root', content: 'local-content' },
          styles: { root: { color: 'blue' }, content: { fontWeight: 'bold' } },
        }),
      ),
  });
  const button = wrapper.get('button');
  const nativeElement = button.element;
  expect(button.classes()).toEqual(
    expect.arrayContaining([
      'provider-root',
      'provider-semantic-root',
      'local-root',
      'native-root',
    ]),
  );
  expect(button.attributes('style')).toContain('margin-top: 2px');
  expect(button.attributes('style')).toContain('padding-top: 3px');
  expect(button.attributes('style')).toContain('color: purple');
  expect(button.attributes('style')).toContain('padding-bottom: 4px');
  const content = wrapper.get('.apollo-switch-inner-checked');
  expect(content.classes()).toEqual(expect.arrayContaining(['provider-content', 'local-content']));
  expect(content.attributes('style')).toContain('font-style: italic');
  expect(content.attributes('style')).toContain('font-weight: bold');
  expect(wrapper.get('.apollo-switch-handle').attributes('style')).toContain('top: 1px');

  components.value = { switch: { className: 'replacement', style: { marginLeft: '5px' } } };
  await nextTick();
  expect(button.element).toBe(nativeElement);
  expect(button.classes()).toContain('replacement');
  expect(button.classes()).not.toContain('provider-semantic-root');
  expect(button.attributes('style')).toContain('margin-left: 5px');
  expect(button.attributes('style')).not.toContain('margin-top');
  expect(content.classes()).not.toContain('provider-content');
  expect(content.attributes('style')).not.toContain('font-style');

  components.value = {};
  await nextTick();
  expect(button.classes()).not.toContain('replacement');
  expect(button.attributes('style')).not.toContain('margin-left');
  wrapper.unmount();
});

it('Provider semantic functions read the current merged size and disabled state', async () => {
  const size = ref<'small' | 'medium' | 'large'>('small');
  const loading = ref(false);
  const styles = vi.fn(({ props }: SwitchSemanticContext) => ({
    root: { opacity: props.disabled ? 0.5 : 1 },
    content: { fontSize: props.size === 'small' ? '10px' : '12px' },
  }));
  const wrapper = mount({
    render: () =>
      h(ConfigProvider, { componentSize: size.value, components: { switch: { styles } } }, () =>
        h(Switch, { loading: loading.value }),
      ),
  });
  expect(wrapper.get('button').attributes('style')).toContain('opacity: 1');
  expect(wrapper.get('.apollo-switch-inner-checked').attributes('style')).toContain(
    'font-size: 10px',
  );
  size.value = 'medium';
  loading.value = true;
  await nextTick();
  expect(wrapper.get('button').attributes('style')).toContain('opacity: 0.5');
  expect(wrapper.get('.apollo-switch-inner-checked').attributes('style')).toContain(
    'font-size: 12px',
  );
  size.value = 'large';
  await nextTick();
  expect(styles.mock.lastCall?.[0].props.size).toBe('medium');
  wrapper.unmount();
});

it('a parent ref receives the current button and forwards focus and blur', () => {
  const instance = shallowRef<SwitchRef | null>(null);
  const Parent = defineComponent({ setup: () => () => h(Switch, { ref: instance }) });
  const wrapper = mount(Parent, { attachTo: document.body });
  const button = instance.value?.nativeElement;
  expect(button).toBe(wrapper.get('button').element);
  instance.value?.focus({ preventScroll: true });
  expect(document.activeElement).toBe(button);
  instance.value?.blur();
  expect(document.activeElement).not.toBe(button);
  wrapper.unmount();
  expect(instance.value).toBeNull();
});

it('native tabindex and autofocus attrs reach the button and yield to explicit props', async () => {
  const nativeAttrs = shallowRef<{ tabindex?: number; autofocus?: boolean }>({
    tabindex: 4,
    autofocus: true,
  });
  const tabIndex = ref<number>();
  const autoFocus = ref<boolean>();
  const Parent = defineComponent({
    setup: () => () =>
      h(Switch, { ...nativeAttrs.value, tabIndex: tabIndex.value, autoFocus: autoFocus.value }),
  });
  const wrapper = mount(Parent);
  expect(wrapper.attributes('tabindex')).toBe('4');
  expect(wrapper.attributes('autofocus')).toBeDefined();
  tabIndex.value = -1;
  autoFocus.value = false;
  await nextTick();
  expect(wrapper.attributes('tabindex')).toBe('-1');
  expect(wrapper.attributes('autofocus')).toBeUndefined();
  tabIndex.value = undefined;
  autoFocus.value = undefined;
  await nextTick();
  expect(wrapper.attributes('tabindex')).toBe('4');
  expect(wrapper.attributes('autofocus')).toBeDefined();
  nativeAttrs.value = {};
  await nextTick();
  expect(wrapper.attributes('tabindex')).toBeUndefined();
  expect(wrapper.attributes('autofocus')).toBeUndefined();
  wrapper.unmount();
});

it('withdrawing both controlled aliases leaves a boolean state and allows later interaction', async () => {
  const wrapper = mount(Switch, { props: { checked: false, value: true } });
  expect(wrapper.attributes('aria-checked')).toBe('false');
  await wrapper.setProps({ checked: undefined });
  expect(wrapper.attributes('aria-checked')).toBe('true');
  // A request rejected by the controlled parent must not become the released state.
  await wrapper.get('button').trigger('click');
  expect(wrapper.attributes('aria-checked')).toBe('true');
  await wrapper.setProps({ value: undefined });
  expect(wrapper.attributes('aria-checked')).toBe('true');
  await wrapper.get('button').trigger('click');
  expect(wrapper.attributes('aria-checked')).toBe('false');
  expect(wrapper.emitted('update:checked')).toEqual([[false], [false]]);
  expect(wrapper.emitted('update:value')).toEqual([[false], [false]]);
  wrapper.unmount();
});

it('content slots stay current, take precedence when empty and restore props when withdrawn', async () => {
  const showSlots = ref(true);
  const content = shallowRef<VNodeChild>(0);
  const wrapper = mount({
    render: () =>
      h(
        Switch,
        { checkedChildren: 'on-prop', unCheckedChildren: 'off-prop' },
        showSlots.value
          ? { checkedChildren: () => content.value, unCheckedChildren: () => [] }
          : {},
      ),
  });
  const button = wrapper.get('button').element;
  expect(wrapper.get('.apollo-switch-inner-checked').text()).toBe('0');
  expect(wrapper.get('.apollo-switch-inner-unchecked').text()).toBe('');
  content.value = ['latest', h('strong', 'content')];
  await nextTick();
  expect(wrapper.get('.apollo-switch-inner-checked').text()).toBe('latestcontent');
  content.value = null;
  await nextTick();
  expect(wrapper.get('.apollo-switch-inner-checked').text()).toBe('');
  showSlots.value = false;
  await nextTick();
  expect(wrapper.get('.apollo-switch-inner-checked').text()).toBe('on-prop');
  expect(wrapper.get('.apollo-switch-inner-unchecked').text()).toBe('off-prop');
  expect(wrapper.get('button').element).toBe(button);
  wrapper.unmount();
});
