import { en_US, zh_CN } from '@apollo-design/locale';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createApp,
  createCommentVNode,
  defineComponent,
  h,
  nextTick,
  ref,
  shallowRef,
  type VNodeChild,
} from 'vue';
import { ConfigProvider } from '../../config-provider';
import { CheckableTag, CheckableTagGroup, Tag } from '../index';

const wrappers: VueWrapper[] = [];
afterEach(() => {
  for (const w of wrappers.splice(0)) w.unmount();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});
const host = (render: () => VNodeChild, attach = false) => {
  const w = mount(defineComponent({ setup: () => render }), {
    attachTo: attach ? document.body : undefined,
    global: { stubs: { teleport: false } },
  });
  wrappers.push(w);
  return w;
};

describe('Tag complete native contents and owned close action', () => {
  it.each(['Enter', ' '])(
    'owns native activation %j inside another keyboard control',
    async (key) => {
      const outerKeydown = vi.fn(),
        close = vi.fn();
      const w = host(() =>
        h('div', { onKeydown: outerKeydown }, [
          h(Tag, { closable: true, onClose: close }, () => 'Nested label'),
        ]),
      );
      const action = w.get<HTMLButtonElement>('button.apollo-tag-close-icon');
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      action.element.dispatchEvent(event);
      expect(outerKeydown).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
      expect(close).not.toHaveBeenCalled();
      action.element.click();
      await nextTick();
      expect(close).toHaveBeenCalledTimes(1);
      expect(w.get('.apollo-tag').classes()).toContain('apollo-tag-hidden');
    },
  );
  it('renders the complete icon slot without replacing caller attributes', () => {
    const icon = h('svg', { class: 'business-graphic', 'data-owner': 'caller' });
    const w = host(() =>
      h(
        Tag,
        { classNames: { icon: 'semantic-icon' } },
        {
          default: () => 'Label',
          icon: () => [createCommentVNode('lead'), icon, h('strong', 'Icon tail'), 0],
        },
      ),
    );
    expect(w.get('.apollo-tag-icon').text()).toContain('Icon tail0');
    expect(w.get('.business-graphic').attributes()).toEqual({
      class: 'business-graphic',
      'data-owner': 'caller',
    });
    expect(w.get('.semantic-icon').element).not.toBe(w.get('.business-graphic').element);
    expect(icon.props).toEqual({ class: 'business-graphic', 'data-owner': 'caller' });
  });

  it('keeps the business subtree, draft and focus while icon content appears and disappears', async () => {
    const show = ref(false),
      label = ref('First');
    const Probe = defineComponent({
      setup() {
        const draft = ref('Initial');
        return () =>
          h('label', [
            'Draft',
            h('input', {
              value: draft.value,
              onInput: (e: Event) => {
                if (e.target instanceof HTMLInputElement) draft.value = e.target.value;
              },
            }),
          ]);
      },
    });
    const w = host(
      () =>
        h(
          Tag,
          { color: label.value === 'First' ? 'blue' : 'green' },
          {
            icon: () => (show.value ? [h('svg'), h('strong', 'Icon tail')] : []),
            default: () => [h(Probe), h('span', label.value), 0],
          },
        ),
      true,
    );
    const input = w.get('input');
    await input.setValue('Saved business draft');
    input.element.focus();
    const original = input.element,
      root = w.element;
    for (const value of [true, false, true]) {
      show.value = value;
      label.value = 'Next';
      await nextTick();
      expect(w.get('input').element).toBe(original);
      expect(w.get('input').element.value).toBe('Saved business draft');
      expect(document.activeElement).toBe(original);
      expect(w.element).toBe(root);
      expect(w.get('.apollo-tag-content').text()).toContain('Next0');
    }
  });

  it('applies content semantics even without an icon', () => {
    const w = host(() =>
      h(
        Tag,
        { classNames: { content: 'business-label' }, styles: { content: { fontWeight: 600 } } },
        () => [h('span', 'First'), h('strong', 'Tail'), 0],
      ),
    );
    expect(w.get('.business-label').text()).toBe('FirstTail0');
    expect(w.get<HTMLElement>('.business-label').element.style.fontWeight).toBe('600');
  });

  it('preserves the entire close icon while owning the actual close control', async () => {
    const node = h('svg', {
      class: 'business-close',
      'aria-hidden': 'true',
      'data-owner': 'caller',
    });
    const closed = vi.fn();
    const w = host(() =>
      h(
        Tag,
        { closable: true, onClose: closed },
        {
          default: () => 'Label',
          closeIcon: () => [createCommentVNode('lead'), node, h('strong', 'Close tail'), 0],
        },
      ),
    );
    expect(w.get('.apollo-tag-close-icon').text()).toContain('Close tail0');
    expect(w.get('.apollo-tag-close-icon').element).not.toBe(w.get('.business-close').element);
    expect(node.props).toEqual({
      class: 'business-close',
      'aria-hidden': 'true',
      'data-owner': 'caller',
    });
    await w.get('.apollo-tag-close-icon').trigger('click');
    expect(closed).toHaveBeenCalledTimes(1);
    expect(w.get('.apollo-tag').classes()).toContain('apollo-tag-hidden');
  });

  it('current empty/removed close slots suppress and restore the fallback without cached VNodes', async () => {
    const stage = ref(0);
    const w = host(() =>
      h(
        Tag,
        { closable: true },
        {
          default: () => 'Label',
          ...(stage.value === 2
            ? {}
            : { closeIcon: () => (stage.value === 0 ? [h('strong', 'Custom close'), 0] : []) }),
        },
      ),
    );
    expect(w.get('.apollo-tag-close-icon').text()).toContain('Custom close0');
    stage.value = 1;
    await nextTick();
    expect(w.find('.apollo-tag-close-icon').exists()).toBe(false);
    stage.value = 2;
    await nextTick();
    expect(w.find('.apollo-tag-close-icon svg').exists()).toBe(true);
    stage.value = 0;
    await nextTick();
    expect(w.get('.apollo-tag-close-icon').text()).toContain('Custom close0');
  });

  it('honors closable.disabled independently of the tag link', async () => {
    const blocked = ref(true),
      close = vi.fn();
    const w = host(() =>
      h(
        Tag,
        { href: '#target', closable: { disabled: blocked.value }, onClose: close },
        () => 'Linked label',
      ),
    );
    await w.get('.apollo-tag-close-icon').trigger('click');
    expect(close).not.toHaveBeenCalled();
    expect(w.get('.apollo-tag').classes()).not.toContain('apollo-tag-hidden');
    expect(w.get('a').attributes('href')).toBe('#target');
    blocked.value = false;
    await nextTick();
    await w.get('.apollo-tag-close-icon').trigger('click');
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('dispatches cancelable close through Vue once listeners', async () => {
    const close = vi.fn((e: MouseEvent) => e.preventDefault());
    const listeners: Record<string, unknown> = { onCloseOnce: close };
    const w = host(() => h(Tag, { closable: true, ...listeners }, () => 'Label'));
    await w.get('.apollo-tag-close-icon').trigger('click');
    expect(close).toHaveBeenCalledTimes(1);
    expect(w.get('.apollo-tag').classes()).not.toContain('apollo-tag-hidden');
    await w.get('.apollo-tag-close-icon').trigger('click');
    expect(close).toHaveBeenCalledTimes(1);
    expect(w.get('.apollo-tag').classes()).toContain('apollo-tag-hidden');
  });

  it('dispatches close listener arrays once each and respects cancellation', async () => {
    const first = vi.fn((e: MouseEvent) => e.preventDefault()),
      second = vi.fn();
    const listeners: Record<string, unknown> = { onClose: [first, second] };
    const w = host(() => h(Tag, { closable: true, ...listeners }, () => 'Label'));
    await w.get('.apollo-tag-close-icon').trigger('click');
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(w.get('.apollo-tag').classes()).not.toContain('apollo-tag-hidden');
  });

  it.each([
    { name: 'Tag default', component: Tag, slot: 'default' },
    { name: 'Tag icon', component: Tag, slot: 'icon' },
    { name: 'Tag close', component: Tag, slot: 'closeIcon' },
    { name: 'Checkable default', component: CheckableTag, slot: 'default' },
    { name: 'Checkable icon', component: CheckableTag, slot: 'icon' },
  ])('evaluates $name once and retains complete nodes', ({ component, slot }) => {
    const content = vi.fn(() => [h('span', 'First'), h('strong', 'Tail'), 0]);
    const w = host(() => h(component, {}, { [slot]: content }));
    expect(w.text()).toContain('FirstTail0');
    expect(content).toHaveBeenCalledTimes(1);
  });
});

describe('Tag current Provider and locale', () => {
  it.each([
    {
      key: 'className',
      first: { className: 'first' },
      second: { className: 'second' },
      read: (w: VueWrapper) =>
        w
          .get('.apollo-tag')
          .classes()
          .filter((c) => c === 'first' || c === 'second'),
      initial: ['first'],
      next: ['second'],
      removed: [],
    },
    {
      key: 'style',
      first: { style: { color: 'red' } },
      second: { style: { color: 'blue' } },
      read: (w: VueWrapper) => w.get<HTMLElement>('.apollo-tag').element.style.color,
      initial: 'red',
      next: 'blue',
      removed: '',
    },
    {
      key: 'variant',
      first: { variant: 'outlined' },
      second: { variant: 'solid' },
      read: (w: VueWrapper) =>
        w
          .get('.apollo-tag')
          .classes()
          .find((c) => /-(filled|solid|outlined)$/.test(c)),
      initial: 'apollo-tag-outlined',
      next: 'apollo-tag-solid',
      removed: 'apollo-tag-filled',
    },
    {
      key: 'classNames',
      first: { classNames: { root: 'first' } },
      second: { classNames: { root: 'second' } },
      read: (w: VueWrapper) =>
        w.find('.second').exists() ? 'second' : w.find('.first').exists() ? 'first' : '',
      initial: 'first',
      next: 'second',
      removed: '',
    },
    {
      key: 'styles',
      first: { styles: { root: { paddingInline: '3px' } } },
      second: { styles: { root: { paddingInline: '7px' } } },
      read: (w: VueWrapper) => w.get<HTMLElement>('.apollo-tag').element.style.paddingInline,
      initial: '3px',
      next: '7px',
      removed: '',
    },
    {
      key: 'closable',
      first: { closable: true },
      second: { closable: false },
      read: (w: VueWrapper) => w.find('.apollo-tag-close-icon').exists(),
      initial: true,
      next: false,
      removed: false,
    },
    {
      key: 'closeIcon',
      first: { closeIcon: h('strong', 'First close') },
      second: { closeIcon: h('strong', 'Next close') },
      read: (w: VueWrapper) =>
        w.find('.apollo-tag-close-icon').exists() ? w.get('.apollo-tag-close-icon').text() : '',
      initial: 'First close',
      next: 'Next close',
      removed: '',
    },
  ])(
    'consumes current $key, replacement and removal on the same root',
    async ({ first, second, read, initial, next, removed }) => {
      const config = shallowRef<Record<string, unknown> | undefined>(first);
      const w = host(() =>
        h(ConfigProvider, { components: config.value ? { tag: config.value } : undefined }, () =>
          h(Tag, {}, () => 'Label'),
        ),
      );
      const root = w.get('.apollo-tag').element;
      expect(read(w)).toEqual(initial);
      config.value = second;
      await nextTick();
      expect(read(w)).toEqual(next);
      config.value = undefined;
      await nextTick();
      expect(read(w)).toEqual(removed);
      expect(w.get('.apollo-tag').element).toBe(root);
    },
  );

  it('uses current Close language after changing the actual Provider', async () => {
    const chinese = ref(false);
    const w = host(() =>
      h(ConfigProvider, { locale: chinese.value ? zh_CN : en_US }, () =>
        h(Tag, { closable: true }, () => 'Label'),
      ),
    );
    const root = w.get('.apollo-tag').element;
    expect(w.get('.apollo-tag-close-icon').attributes('aria-label')).toBe('Close');
    chinese.value = true;
    await nextTick();
    expect(w.get('.apollo-tag-close-icon').attributes('aria-label')).toBe('关闭');
    expect(w.get('.apollo-tag').element).toBe(root);
  });

  it('updates direction for all three widgets and honors native overrides', async () => {
    const rtl = ref(false),
      dir = ref<string | undefined>();
    const w = host(() =>
      h(ConfigProvider, { direction: rtl.value ? 'rtl' : 'ltr' }, () =>
        h('main', [
          h(Tag, { dir: dir.value }, () => 'Label'),
          h(CheckableTag, { dir: dir.value }, () => 'Choice'),
          h(CheckableTagGroup, { dir: dir.value, options: ['a'] }),
        ]),
      ),
    );
    rtl.value = true;
    await nextTick();
    expect(w.get('.apollo-tag').attributes('dir')).toBe('rtl');
    expect(w.get('.apollo-tag-checkable').attributes('dir')).toBe('rtl');
    expect(w.get('.apollo-tag-checkable-group').attributes('dir')).toBe('rtl');
    dir.value = 'ltr';
    await nextTick();
    expect(w.get('.apollo-tag').attributes('dir')).toBe('ltr');
    expect(w.get('.apollo-tag-checkable-group').attributes('dir')).toBe('ltr');
  });
});

describe('Tag family native attrs and models', () => {
  it('installs all three public names and retains precise static identities', () => {
    const app = createApp({ render: () => null });
    app.use(Tag).use(CheckableTag).use(CheckableTagGroup);
    expect(app.component('ATag')).toBe(Tag);
    expect(app.component('ACheckableTag')).toBe(CheckableTag);
    expect(app.component('ACheckableTagGroup')).toBe(CheckableTagGroup);
    expect(Tag.CheckableTag).toBe(CheckableTag);
    expect(Tag.CheckableTagGroup).toBe(CheckableTagGroup);
  });
  it.each([
    {
      name: 'Tag',
      render: (attrs: Record<string, unknown>) => h(Tag, attrs, () => 'Label'),
      selector: '.apollo-tag',
    },
    {
      name: 'CheckableTag',
      render: (attrs: Record<string, unknown>) => h(CheckableTag, attrs, () => 'Label'),
      selector: '.apollo-tag-checkable',
    },
    {
      name: 'Group',
      render: (attrs: Record<string, unknown>) => h(CheckableTagGroup, attrs),
      selector: '.apollo-tag-checkable-group',
    },
  ])(
    '$name accepts all native style shapes, replacement, removal and listeners',
    async ({ render, selector }) => {
      const click = vi.fn(),
        style = shallowRef<unknown>('padding-inline:11px');
      const w = host(() => render({ title: 'Native title', style: style.value, onClick: click }));
      const root = w.get<HTMLElement>(selector).element;
      expect(root.title).toBe('Native title');
      expect(root.style.paddingInline).toBe('11px');
      style.value = [{ paddingInline: '17px' }];
      await nextTick();
      expect(root.style.paddingInline).toBe('17px');
      style.value = { paddingInline: '19px' };
      await nextTick();
      expect(root.style.paddingInline).toBe('19px');
      style.value = undefined;
      await nextTick();
      expect(root.style.paddingInline).toBe('');
      await w.get(selector).trigger('click');
      expect(click).toHaveBeenCalledTimes(1);
      expect(w.get(selector).element).toBe(root);
    },
  );

  it('gives native Group style priority over semantic root style without losing either property', () => {
    const w = host(() =>
      h(CheckableTagGroup, {
        styles: { root: { color: 'red', paddingInline: '3px' } },
        style: 'color:blue',
      }),
    );
    const root = w.get<HTMLElement>('.apollo-tag-checkable-group').element;
    expect(root.style.color).toBe('blue');
    expect(root.style.paddingInline).toBe('3px');
  });

  it('supports uncontrolled CheckableTag and emits update/changed state exactly once', async () => {
    const model = vi.fn(),
      changed = vi.fn();
    const listeners: Record<string, unknown> = { 'onUpdate:checked': model, onChange: changed };
    const w = host(() => h(CheckableTag, listeners, () => 'Choice'));
    await w.get('.apollo-tag-checkable').trigger('click');
    expect(w.get('.apollo-tag-checkable').attributes('aria-checked')).toBe('true');
    expect(model).toHaveBeenCalledTimes(1);
    expect(model).toHaveBeenCalledWith(true);
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('supports a controlled CheckableTag model and current canonical native keydown cancellation', async () => {
    const checked = ref(false),
      block = ref(true),
      key = vi.fn((e: KeyboardEvent) => {
        if (block.value) e.preventDefault();
      });
    const listeners: Record<string, unknown> = {
      'onUpdate:checked': (value: boolean) => {
        checked.value = value;
      },
      onKeydown: key,
    };
    const w = host(() => h(CheckableTag, { checked: checked.value, ...listeners }, () => 'Choice'));
    await w.get('.apollo-tag-checkable').trigger('keydown', { key: ' ' });
    expect(key).toHaveBeenCalledTimes(1);
    expect(checked.value).toBe(false);
    block.value = false;
    await nextTick();
    await w.get('.apollo-tag-checkable').trigger('keydown', { key: ' ' });
    expect(checked.value).toBe(true);
    expect(w.get('.apollo-tag-checkable').attributes('aria-checked')).toBe('true');
  });

  it('supports a controlled Group model with zero and current native event listeners', async () => {
    const value = ref<string | number | (string | number)[] | null>(null),
      changed = vi.fn();
    const listeners: Record<string, unknown> = {
      'onUpdate:value': (next: string | number | (string | number)[] | null) => {
        value.value = next;
      },
      onChange: changed,
    };
    const w = host(() =>
      h(CheckableTagGroup, { value: value.value, options: [0, ''], ...listeners }),
    );
    await w.get('.apollo-tag-checkable-group-item').trigger('click');
    expect(value.value).toBe(0);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(w.get('.apollo-tag-checkable-group-item').attributes('aria-checked')).toBe('true');
  });

  it('normalizes scalar values when switching into multiple mode instead of string substring matching', async () => {
    const multiple = ref(false);
    const w = host(() =>
      h(CheckableTagGroup, { value: 'ab', multiple: multiple.value, options: ['a', 'b', 'ab'] }),
    );
    multiple.value = true;
    await nextTick();
    expect(
      w.findAll('.apollo-tag-checkable-group-item').map((n) => n.attributes('aria-checked')),
    ).toEqual(['false', 'false', 'true']);
  });

  it('handles numeric scalar zero in multiple mode without an array assertion crash', () => {
    const w = host(() => h(CheckableTagGroup, { value: 0, multiple: true, options: [0, 1] }));
    expect(
      w.findAll('.apollo-tag-checkable-group-item').map((n) => n.attributes('aria-checked')),
    ).toEqual(['true', 'false']);
  });

  it('uses an option value as its label when the optional label is absent', () => {
    const w = host(() => h(CheckableTagGroup, { options: [{ value: 0 }, { value: 'Choice' }] }));
    expect(w.findAll('.apollo-tag-checkable-group-item').map((n) => n.text())).toEqual([
      '0',
      'Choice',
    ]);
  });
});
