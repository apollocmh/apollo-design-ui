import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Component, defineComponent, h, nextTick, ref, shallowRef } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Tooltip } from '../../tooltip';
import { Link, Paragraph, Text, Title, Typography, type TypographyRef } from '../index';

const wrappers: { unmount(): void }[] = [];
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
const originalExec = Object.getOwnPropertyDescriptor(document, 'execCommand');
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  vi.restoreAllMocks();
  for (const [object, key, descriptor] of [
    [navigator, 'clipboard', originalClipboard],
    [document, 'execCommand', originalExec],
  ] as const) {
    if (descriptor) Object.defineProperty(object, key, descriptor);
    else Reflect.deleteProperty(object, key);
  }
  document.body.replaceChildren();
});
function mounted(component: Component) {
  const wrapper = mount(component, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  wrappers.push(wrapper);
  return wrapper;
}
function rootElement(): HTMLElement {
  const root = document.querySelector('[data-audit-root]');
  if (!(root instanceof HTMLElement)) throw Error('Missing actual typography root');
  return root;
}
function clipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  Object.defineProperty(document, 'execCommand', { configurable: true, value: () => false });
}
const entries: { name: string; component: Component }[] = [
  { name: 'Typography', component: Typography },
  { name: 'Text', component: Text },
  { name: 'Title', component: Title },
  { name: 'Paragraph', component: Paragraph },
  { name: 'Link', component: Link },
];
describe.each(entries)('$name native attrs and business identity', ({ component }) => {
  for (const field of ['id', 'class', 'style', 'onClick'] as const) {
    it(`updates and removes only ${field} without replacing its business editor`, async () => {
      const first = vi.fn(),
        current = vi.fn();
      const config = shallowRef<Record<string, unknown>>({
        id: 'first-id',
        class: 'first-class',
        style: 'margin-top: 7px',
        onClick: first,
      });
      mounted(
        defineComponent(
          () => () =>
            h(
              component,
              {
                ...config.value,
                'data-audit-root': '',
              },
              { default: () => h('input', { key: 'business', 'aria-label': 'Business draft' }) },
            ),
        ),
      );
      const root = rootElement();
      const editor = root.querySelector('input');
      if (!editor) throw Error('Missing native business editor');
      editor.value = 'Keep my draft';
      editor.focus();
      const replacement =
        field === 'id'
          ? 'current-id'
          : field === 'class'
            ? 'current-class'
            : field === 'style'
              ? ['margin-top: 11px', { paddingLeft: '9px' }]
              : current;
      config.value = { ...config.value, [field]: replacement };
      await nextTick();
      expect(rootElement()).toBe(root);
      expect(root.querySelector('input')).toBe(editor);
      expect(editor.value).toBe('Keep my draft');
      expect(document.activeElement).toBe(editor);
      if (field === 'id') expect(root.id).toBe('current-id');
      if (field === 'class') {
        expect(root.classList.contains('current-class')).toBe(true);
        expect(root.classList.contains('first-class')).toBe(false);
      }
      if (field === 'style') {
        expect(root.style.marginTop).toBe('11px');
        expect(root.style.paddingLeft).toBe('9px');
      }
      if (field === 'onClick') {
        (component === Link ? (root.querySelector('a') ?? root) : root).click();
        expect(current).toHaveBeenCalledOnce();
        expect(first).not.toHaveBeenCalled();
      }
      config.value = { ...config.value, [field]: undefined };
      await nextTick();
      if (field === 'id') expect(root.hasAttribute('id')).toBe(false);
      if (field === 'class') expect(root.classList.contains('current-class')).toBe(false);
      if (field === 'style') expect(root.style.marginTop).toBe('');
      if (field === 'onClick') {
        (component === Link ? (root.querySelector('a') ?? root) : root).click();
        expect(current).toHaveBeenCalledOnce();
      }
    });
  }
});
it('Text edit-by-text composes native click with its internal edit request once', async () => {
  const onStart = vi.fn(),
    onClick = vi.fn();
  const wrapper = mounted(
    defineComponent(
      () => () =>
        h(
          Text,
          {
            editable: { triggerType: ['text'], onStart },
            onClick,
          },
          () => 'Edit this body',
        ),
    ),
  );
  await wrapper.get('.apollo-typography').trigger('click');
  expect(onClick).toHaveBeenCalledOnce();
  expect(onStart).toHaveBeenCalledOnce();
  expect(wrapper.find('textarea').exists()).toBe(true);
});
it('exposes the actual edit root and keeps native root identity attributes', async () => {
  const instance = ref<TypographyRef | null>(null);
  mounted(
    defineComponent(
      () => () =>
        h(
          Text,
          {
            ref: instance,
            id: 'editing-identity',
            'data-audit-root': '',
            editable: { editing: true },
            'aria-label': 'Native edit name',
          },
          () => 'Initial editor text',
        ),
    ),
  );
  await nextTick();
  const root = document.querySelector('.apollo-typography-edit-content');
  expect(root).not.toBeNull();
  expect(instance.value?.nativeElement).toBe(root);
  expect(root?.id).toBe('editing-identity');
  expect(root?.hasAttribute('data-audit-root')).toBe(true);
  expect(root?.querySelector('textarea')?.getAttribute('aria-label')).toBe('Native edit name');
});
it('reads current Text locale when the Provider locale is replaced or removed', async () => {
  const locale = shallowRef({
    locale: 'first',
    Text: {
      edit: 'Edit first',
      copy: 'Copy first',
      copied: 'Copied first',
      expand: 'Expand first',
      collapse: 'Collapse first',
    },
  });
  const wrapper = mounted(
    defineComponent(
      () => () =>
        h(
          ConfigProvider,
          { locale: locale.value },
          {
            default: () => h(Text, { copyable: true, editable: true }, () => 'Locale body'),
          },
        ),
    ),
  );
  expect(wrapper.get('.apollo-typography-copy').attributes('aria-label')).toBe('Copy first');
  locale.value = {
    ...locale.value,
    Text: { ...locale.value.Text, copy: 'Copy current', edit: 'Edit current' },
  };
  await nextTick();
  expect(wrapper.get('.apollo-typography-copy').attributes('aria-label')).toBe('Copy current');
  expect(wrapper.get('.apollo-typography-edit').attributes('aria-label')).toBe('Edit current');
});
it('reports copy success only when the clipboard operation succeeds', async () => {
  clipboard(async () => {
    throw Error('Clipboard denied');
  });
  const onCopy = vi.fn();
  const wrapper = mounted(
    defineComponent(() => () => h(Text, { copyable: { onCopy } }, () => 'Copy body')),
  );
  await wrapper.get('.apollo-typography-copy').trigger('click');
  await flushPromises();
  expect(onCopy).not.toHaveBeenCalled();
  expect(wrapper.get('.apollo-typography-copy').classes()).not.toContain(
    'apollo-typography-copy-success',
  );
});
it('copies an explicitly empty string without falling back to the visible body', async () => {
  const write = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
  clipboard(write);
  const wrapper = mounted(
    defineComponent(() => () => h(Text, { copyable: { text: '' } }, () => 'Visible body')),
  );
  await wrapper.get('.apollo-typography-copy').trigger('click');
  await flushPromises();
  expect(write).toHaveBeenCalledWith('');
});
it('copies plain native rich content without serialising VNode objects', async () => {
  const write = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
  clipboard(write);
  const wrapper = mounted(
    defineComponent(
      () => () =>
        h(
          Text,
          { copyable: true },
          {
            default: () => [h('strong', 'Rich'), ' tail', 0],
          },
        ),
    ),
  );
  await wrapper.get('.apollo-typography-copy').trigger('click');
  await flushPromises();
  expect(write).toHaveBeenCalledWith('Rich tail0');
});
it('keeps one pending copy operation and retains its focused native button', async () => {
  let finish: ((text: string) => void) | undefined;
  const pending = new Promise<string>((resolve) => {
    finish = resolve;
  });
  const text = vi.fn(() => pending);
  clipboard(async () => {});
  const wrapper = mounted(
    defineComponent(() => () => h(Text, { copyable: { text } }, () => 'Copy body')),
  );
  const button = wrapper.get<HTMLButtonElement>('.apollo-typography-copy');
  button.element.focus();
  try {
    await button.trigger('click');
    await button.trigger('click');
    expect(text).toHaveBeenCalledOnce();
    expect(button.attributes('aria-busy')).toBe('true');
    expect(document.activeElement).toBe(button.element);
  } finally {
    finish?.('Completed body');
    await flushPromises();
  }
});

describe('complete configuration VNode content', () => {
  it('keeps a three-node copy icon as one content value', () => {
    const wrapper = mounted(
      defineComponent(
        () => () =>
          h(
            Text,
            {
              copyable: { icon: [h('span', 'First'), h('span', 'Tail'), 0] },
            },
            () => 'Body',
          ),
      ),
    );
    expect(wrapper.get('.apollo-typography-copy').text()).toBe('FirstTail0');
  });
  it('keeps numeric zero as a visible copy icon', () => {
    const wrapper = mounted(
      defineComponent(() => () => h(Text, { copyable: { icon: 0 } }, () => 'Body')),
    );
    expect(wrapper.get('.apollo-typography-copy').text()).toBe('0');
  });
  it('forwards a complete edit tooltip instead of only its first node', () => {
    const wrapper = mounted(
      defineComponent(
        () => () =>
          h(
            Text,
            {
              editable: { tooltip: [h('span', 'First'), h('span', 'Tail'), 0] },
            },
            () => 'Body',
          ),
      ),
    );
    expect(wrapper.findComponent(Tooltip).props('title')).toHaveLength(3);
  });
  it('forwards a complete three-node copy tooltip as one content value', () => {
    const wrapper = mounted(
      defineComponent(
        () => () =>
          h(
            Text,
            {
              copyable: { tooltips: [h('span', 'First'), h('span', 'Tail'), 0] },
            },
            () => 'Body',
          ),
      ),
    );
    expect(wrapper.findComponent(Tooltip).props('title')).toHaveLength(3);
  });
});

describe('editor focus ownership', () => {
  it('keeps the external destination focused after saving on blur', async () => {
    mounted(
      defineComponent(
        () => () =>
          h('section', [
            h(Text, { editable: true }, { default: () => 'Draft' }),
            h('button', { id: 'outside-editor' }, 'Continue'),
          ]),
      ),
    );
    const edit = document.querySelector('button.apollo-typography-edit');
    if (!(edit instanceof HTMLButtonElement)) throw Error('Missing edit button');
    edit.click();
    await nextTick();
    const input = document.querySelector('.apollo-typography-edit-content textarea');
    const outside = document.querySelector('#outside-editor');
    if (!(input instanceof HTMLTextAreaElement) || !(outside instanceof HTMLButtonElement))
      throw Error('Missing focus fixture');
    expect(document.activeElement).toBe(input);
    outside.focus();
    await nextTick();
    expect(document.querySelector('.apollo-typography-edit-content textarea')).toBeNull();
    expect(document.activeElement).toBe(outside);
  });
  it('returns keyboard focus after an accepted Enter save', async () => {
    mounted(defineComponent(() => () => h(Text, { editable: true }, { default: () => 'Draft' })));
    const edit = document.querySelector('button.apollo-typography-edit');
    if (!(edit instanceof HTMLButtonElement)) throw Error('Missing edit button');
    edit.click();
    await nextTick();
    const input = document.querySelector('.apollo-typography-edit-content textarea');
    if (!(input instanceof HTMLTextAreaElement)) throw Error('Missing editor');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    await nextTick();
    expect(document.querySelector('.apollo-typography-edit-content textarea')).toBeNull();
    expect(document.activeElement).toBe(document.querySelector('button.apollo-typography-edit'));
  });
});

it('passes a complete ellipsis tooltip node array to the actual Tooltip', () => {
  const content = [h('b', 'First'), h('i', 'Middle'), h('span', 'Last')];
  const wrapper = mounted(
    defineComponent(
      () => () => h(Paragraph, { ellipsis: { tooltip: content } }, () => 'Fallback body'),
    ),
  );
  const tooltips = wrapper.findAllComponents(Tooltip);
  expect(tooltips).toHaveLength(1);
  expect(tooltips[0]?.props('title')).toEqual(content);
});

it('retains numeric zero as ellipsis tooltip content', () => {
  const wrapper = mounted(
    defineComponent(() => () => h(Paragraph, { ellipsis: { tooltip: 0 } }, () => 'Body')),
  );
  const tooltips = wrapper.findAllComponents(Tooltip);
  expect(tooltips).toHaveLength(1);
  expect(tooltips[0]?.props('title')).toBe(0);
});

it('does not publish a late copy result after unmount', async () => {
  let finish: (text: string) => void = () => {
    throw Error('Missing pending copy');
  };
  const request = new Promise<string>((resolve) => {
    finish = resolve;
  });
  const copied = vi.fn();
  const write = vi.fn(async (_text: string) => {});
  clipboard(write);
  const wrapper = mounted(
    defineComponent(
      () => () => h(Text, { copyable: { text: () => request, onCopy: copied } }, () => 'Draft'),
    ),
  );
  const copy = document.querySelector('button.apollo-typography-copy');
  if (!(copy instanceof HTMLButtonElement)) throw Error('Missing copy action');
  copy.click();
  wrappers.splice(wrappers.indexOf(wrapper), 1);
  wrapper.unmount();
  finish('Resolved after unmount');
  await flushPromises();
  expect(copied).not.toHaveBeenCalled();
  expect(document.querySelector('.apollo-typography-copy-success')).toBeNull();
});
it('isolates pending copy requests across instances', async () => {
  let finish: (text: string) => void = () => {
    throw Error('Missing pending copy');
  };
  const request = new Promise<string>((resolve) => {
    finish = resolve;
  });
  const write = vi.fn(async (_text: string) => {});
  clipboard(write);
  mounted(
    defineComponent(
      () => () =>
        h('section', [
          h(Text, { id: 'pending-first', copyable: { text: () => request } }, () => 'First'),
          h(Text, { id: 'pending-second', copyable: { text: 'Second' } }, () => 'Second'),
        ]),
    ),
  );
  const first = document.querySelector('#pending-first button');
  const second = document.querySelector('#pending-second button');
  if (!(first instanceof HTMLButtonElement) || !(second instanceof HTMLButtonElement))
    throw Error('Missing copy instances');
  first.click();
  second.click();
  await flushPromises();
  expect(first.getAttribute('aria-busy')).toBe('true');
  expect(second.classList.contains('apollo-typography-copy-success')).toBe(true);
  expect(write).toHaveBeenCalledExactlyOnceWith('Second');
  finish('First');
  await flushPromises();
  expect(write.mock.calls.map(([text]) => text)).toEqual(['Second', 'First']);
  expect(first.classList.contains('apollo-typography-copy-success')).toBe(true);
});

describe.each(entries.filter((entry) => entry.name !== 'Typography'))(
  '$name editing native ownership',
  ({ name, component }) => {
    it('keeps its actual editor root and names while respecting anchor-only listeners', async () => {
      const instance = ref<TypographyRef | null>(null),
        clicked = vi.fn();
      mounted(
        defineComponent(
          () => () =>
            h(
              component,
              {
                ref: instance,
                id: 'editing-owner',
                'aria-label': 'Owned editor',
                'aria-describedby': 'editor-help',
                editable: { editing: true, text: 'Draft' },
                onClick: clicked,
              },
              () => 'Body',
            ),
        ),
      );
      await nextTick();
      const root = document.getElementById('editing-owner');
      const input = root?.querySelector('textarea');
      if (!(input instanceof HTMLTextAreaElement)) throw Error('Missing actual editor');
      expect(instance.value?.nativeElement).toBe(root);
      expect(input.getAttribute('aria-label')).toBe('Owned editor');
      expect(input.getAttribute('aria-describedby')).toBe('editor-help');
      input.click();
      expect(clicked).toHaveBeenCalledTimes(name === 'Link' ? 0 : 1);
    });
  },
);
