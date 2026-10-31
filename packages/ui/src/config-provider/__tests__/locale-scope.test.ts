import {
  changeConfirmLocale,
  en_US,
  getConfirmLocale,
  type Locale,
  resetConfirmLocale,
} from '@apollo-design/locale';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, shallowRef, type VNode } from 'vue';
import { ConfirmContent } from '../../modal/ConfirmDialog';
import Modal from '../../modal/Modal';
import { ConfigProvider } from '../ConfigProvider';

const wrappers: Array<{ unmount(): void }> = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  resetConfirmLocale();
  document.body.replaceChildren();
});

function render(content: () => VNode) {
  const wrapper = mount(defineComponent({ setup: () => content }), {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  wrappers.push(wrapper);
  return wrapper;
}

async function settle() {
  await nextTick();
  await nextTick();
  await nextTick();
}

function namedLocale(name: string): Locale {
  return {
    locale: name,
    Modal: { okText: name, cancelText: `${name} cancel`, justOkText: `${name} only` },
  };
}

function modal() {
  return h(Modal, { open: true, getContainer: false, mask: false, title: 'Locale consumer' }, () =>
    h('input', { 'aria-label': 'Draft', defaultValue: 'seed' }),
  );
}

function buttonTexts(wrapper: VueWrapper) {
  return wrapper.findAll('.apollo-modal-footer button').map((button) => button.text());
}

describe('ConfigProvider and Modal locale ownership', () => {
  it('retains inner static priority and the actual Modal while outer sources change', async () => {
    const outer = shallowRef<Locale>();
    const inner = shallowRef<Locale | undefined>(namedLocale('Inner'));
    const wrapper = render(() =>
      h(ConfigProvider, { locale: outer.value }, () =>
        h(ConfigProvider, { locale: inner.value }, modal),
      ),
    );
    await settle();
    const editor = wrapper.get('input').element;
    editor.value = 'Kept draft';
    expect(buttonTexts(wrapper)).toEqual(['Inner cancel', 'Inner']);
    expect(getConfirmLocale().okText).toBe('Inner');

    for (const current of [namedLocale('Outer'), undefined, namedLocale('Outer updated')]) {
      outer.value = current;
      await settle();
      expect(buttonTexts(wrapper)).toEqual(['Inner cancel', 'Inner']);
      expect(getConfirmLocale().okText).toBe('Inner');
      expect(wrapper.get('input').element).toBe(editor);
      expect(editor.value).toBe('Kept draft');
    }

    inner.value = undefined;
    await settle();
    expect(buttonTexts(wrapper)).toEqual(['Outer updated cancel', 'Outer updated']);
    expect(getConfirmLocale().okText).toBe('Outer updated');
    inner.value = namedLocale('Inner restored');
    await settle();
    expect(buttonTexts(wrapper)).toEqual(['Inner restored cancel', 'Inner restored']);
    expect(getConfirmLocale().okText).toBe('Inner restored');
    wrapper.unmount();
    expect(getConfirmLocale()).toEqual(en_US.Modal);
  });

  it('consumes current controlled slot values when the locale changes', async () => {
    const locale = shallowRef(namedLocale('First'));
    const value = shallowRef('Initial controlled value');
    const wrapper = render(() =>
      h(ConfigProvider, { locale: locale.value }, () =>
        h(Modal, { open: true, getContainer: false, mask: false, title: 'Controlled slot' }, () =>
          h('input', { 'aria-label': 'Controlled draft', value: value.value }),
        ),
      ),
    );
    await settle();
    const input = wrapper.get<HTMLInputElement>('input').element;
    expect(input.value).toBe('Initial controlled value');
    value.value = 'Parent update';
    locale.value = namedLocale('Updated');
    await settle();
    expect(wrapper.get('input').element).toBe(input);
    expect(input.value).toBe('Parent update');
    expect(buttonTexts(wrapper)).toEqual(['Updated cancel', 'Updated']);
  });

  it('isolates actual Modal defaults between apps and restores the remaining static source', async () => {
    const firstLocale = shallowRef(namedLocale('First'));
    const secondLocale = shallowRef<Locale>({ locale: 'second' });
    const first = render(() => h(ConfigProvider, { locale: firstLocale.value }, modal));
    const second = render(() => h(ConfigProvider, { locale: secondLocale.value }, modal));
    const plain = render(modal);
    await settle();
    expect(buttonTexts(first)).toEqual(['First cancel', 'First']);
    expect(buttonTexts(second)).toEqual(['Cancel', 'OK']);
    expect(buttonTexts(plain)).toEqual(['Cancel', 'OK']);
    expect(getConfirmLocale().okText).toBe('First');

    secondLocale.value = namedLocale('Second');
    await settle();
    firstLocale.value = namedLocale('First updated');
    await settle();
    expect(buttonTexts(first)).toEqual(['First updated cancel', 'First updated']);
    expect(buttonTexts(second)).toEqual(['Second cancel', 'Second']);
    expect(buttonTexts(plain)).toEqual(['Cancel', 'OK']);
    expect(getConfirmLocale().okText).toBe('Second');
    second.unmount();
    expect(getConfirmLocale().okText).toBe('First updated');
    plain.unmount();
    expect(getConfirmLocale().okText).toBe('First updated');
    first.unmount();
    expect(getConfirmLocale()).toEqual(en_US.Modal);
  });

  it('retains explicit locale and text overrides in the static confirm content path', async () => {
    const clear = changeConfirmLocale({
      okText: 'Service OK',
      cancelText: 'Service cancel',
      justOkText: 'Service only',
    });
    const wrapper = mount(ConfirmContent, {
      props: {
        prefixCls: 'apollo-modal',
        confirmPrefixCls: 'apollo-modal-confirm',
        type: 'confirm',
        locale: getConfirmLocale(),
      },
    });
    wrappers.push(wrapper);
    expect(wrapper.findAll('button').map((button) => button.text())).toEqual([
      'Service cancel',
      'Service OK',
    ]);
    await wrapper.setProps({ okText: 'Explicit OK' });
    expect(wrapper.findAll('button').map((button) => button.text())).toEqual([
      'Service cancel',
      'Explicit OK',
    ]);
    wrapper.unmount();
    clear?.();
    expect(getConfirmLocale()).toEqual(en_US.Modal);
  });
});
