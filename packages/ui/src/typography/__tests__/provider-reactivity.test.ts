import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type Component,
  defineComponent,
  h,
  nextTick,
  ref,
  type StyleValue,
  shallowRef,
} from 'vue';
import { renderToString } from 'vue/server-renderer';
import {
  type BaseTypographyProps,
  ConfigProvider,
  Link,
  Paragraph,
  Text,
  Title,
  Typography,
  type TypographyConfig,
  type TypographySemanticStyles,
} from '../../index';

const entries: { name: string; component: Component }[] = [
  { name: 'Text', component: Text },
  { name: 'Title', component: Title },
  { name: 'Paragraph', component: Paragraph },
  { name: 'Link', component: Link },
  { name: 'Typography', component: Typography },
];
type Field = 'className' | 'style' | 'classNames' | 'styles';
const fields: Field[] = ['className', 'style', 'classNames', 'styles'];
const localStyles = { root: { maxWidth: '270px', minHeight: '42px' } };
const nativeStyle = { maxWidth: '330px', paddingLeft: '11px' };

function configAt(field: Field, current: boolean): TypographyConfig {
  switch (field) {
    case 'className':
      return { className: current ? 'provider-current' : 'provider-first' };
    case 'style':
      return { style: { marginTop: current ? '12px' : '6px', maxWidth: '210px' } };
    case 'classNames':
      return { classNames: { root: current ? 'semantic-current' : 'semantic-first' } };
    case 'styles':
      return { styles: { root: { paddingBottom: current ? '9px' : '5px', maxWidth: '210px' } } };
  }
}
function assertField(root: HTMLElement, field: Field, current: boolean) {
  if (field === 'className')
    expect(root.classList.contains(current ? 'provider-current' : 'provider-first')).toBe(true);
  if (field === 'style') expect(root.style.marginTop).toBe(current ? '12px' : '6px');
  if (field === 'classNames')
    expect(root.classList.contains(current ? 'semantic-current' : 'semantic-first')).toBe(true);
  if (field === 'styles') expect(root.style.paddingBottom).toBe(current ? '9px' : '5px');
}
function assertLocal(root: HTMLElement) {
  expect(root.classList.contains('native-root')).toBe(true);
  expect(root.classList.contains('local-root')).toBe(true);
  expect(root.style.maxWidth).toBe('330px');
  expect(root.style.minHeight).toBe('42px');
  expect(root.style.paddingLeft).toBe('11px');
}
function rootOf(wrapper: ReturnType<typeof mount>) {
  const root = wrapper.get('.apollo-typography').element;
  if (!(root instanceof HTMLElement)) throw new Error('Expected a typography root');
  return root;
}
async function flushRender() {
  await nextTick();
  await nextTick();
}
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('F11 Typography current ConfigProvider semantics', () => {
  for (const { name, component } of entries) {
    for (const field of fields) {
      it(`${name}: replacing the whole typography config refreshes ${field} and removal restores local attrs`, async () => {
        const configuration = ref<TypographyConfig | undefined>(configAt(field, false));
        const Host = defineComponent(
          () => () =>
            h(
              ConfigProvider,
              {
                components: configuration.value ? { typography: { ...configuration.value } } : {},
              },
              {
                default: () =>
                  h(
                    component,
                    {
                      class: 'native-root',
                      style: nativeStyle,
                      classNames: { root: 'local-root' },
                      styles: localStyles,
                    },
                    { default: () => 'Provider body' },
                  ),
              },
            ),
        );
        const wrapper = mount(Host, {
          attachTo: document.body,
          global: { stubs: { teleport: false } },
        });
        const root = rootOf(wrapper);
        assertField(root, field, false);
        assertLocal(root);
        configuration.value = configAt(field, true);
        await flushRender();
        expect(rootOf(wrapper)).toBe(root);
        assertField(root, field, true);
        assertLocal(root);
        expect(root.classList.contains('provider-first')).toBe(false);
        expect(root.classList.contains('semantic-first')).toBe(false);
        configuration.value = undefined;
        await flushRender();
        expect(rootOf(wrapper)).toBe(root);
        assertLocal(root);
        for (const old of [
          'provider-first',
          'provider-current',
          'semantic-first',
          'semantic-current',
        ])
          expect(root.classList.contains(old)).toBe(false);
        expect(root.style.marginTop).toBe('');
        expect(root.style.paddingBottom).toBe('');
        wrapper.unmount();
      });
    }

    it(`${name}: initial CSR and SSR provider configuration remain a passing control`, async () => {
      const Host = defineComponent(
        () => () =>
          h(
            ConfigProvider,
            {
              components: {
                typography: {
                  className: 'provider-first',
                  classNames: { root: 'semantic-first' },
                  style: { marginTop: '6px', paddingTop: '2px' },
                  styles: { root: { paddingTop: '1px', paddingBottom: '5px' } },
                },
              },
            },
            {
              default: () =>
                h(
                  component,
                  {
                    class: 'native-root',
                    style: nativeStyle,
                    classNames: { root: 'local-root' },
                    styles: localStyles,
                  },
                  { default: () => 'Initial provider body' },
                ),
            },
          ),
      );
      const wrapper = mount(Host, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      for (const field of fields) assertField(rootOf(wrapper), field, false);
      expect(rootOf(wrapper).style.paddingTop).toBe('2px');
      assertLocal(rootOf(wrapper));
      const html = await renderToString(h(Host));
      const server = document.createElement('div');
      server.innerHTML = html;
      const root = server.querySelector('.apollo-typography');
      if (!(root instanceof HTMLElement)) throw new Error('Expected an SSR typography root');
      for (const field of fields) assertField(root, field, false);
      expect(root.style.paddingTop).toBe('2px');
      assertLocal(root);
      wrapper.unmount();
    });
  }

  for (const field of ['classNames', 'styles']) {
    it(`replacing provider ${field} functions uses the current callback with public semantic props`, async () => {
      const checkPublicProps = (props: BaseTypographyProps) => {
        expect(props.prefixCls).toBe('apollo-typography');
        expect(Object.hasOwn(props, 'contentProps')).toBe(false);
        expect(Object.hasOwn(props, 'contentNodes')).toBe(false);
      };
      const firstClassNames = vi.fn(({ props }: { props: BaseTypographyProps }) => {
        checkPublicProps(props);
        return { root: 'function-first' };
      });
      const firstStyles = vi.fn(({ props }: { props: BaseTypographyProps }) => {
        checkPublicProps(props);
        return { root: { marginTop: '6px' } };
      });
      const first = field === 'classNames' ? firstClassNames : firstStyles;
      const currentClassNames = vi.fn(({ props }: { props: BaseTypographyProps }) => ({
        root: `function-current-${props.prefixCls}`,
      }));
      const currentStyles = vi.fn(({ props }: { props: BaseTypographyProps }) => ({
        root: { marginTop: props.prefixCls === 'apollo-typography' ? '12px' : '0px' },
      }));
      const configuration = ref<TypographyConfig>(
        field === 'classNames' ? { classNames: firstClassNames } : { styles: firstStyles },
      );
      const Host = defineComponent(
        () => () =>
          h(
            ConfigProvider,
            {
              components: { typography: configuration.value },
            },
            { default: () => h(Text, {}, { default: () => 'Function provider body' }) },
          ),
      );
      const wrapper = mount(Host, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      const root = rootOf(wrapper);
      expect(first).toHaveBeenCalled();
      if (field === 'classNames') {
        configuration.value = { classNames: currentClassNames };
        await flushRender();
        expect(root.classList.contains('function-current-apollo-typography')).toBe(true);
        expect(root.classList.contains('function-first')).toBe(false);
        expect(currentClassNames).toHaveBeenCalled();
      } else {
        configuration.value = { styles: currentStyles };
        await flushRender();
        expect(root.style.marginTop).toBe('12px');
        expect(currentStyles).toHaveBeenCalled();
      }
      wrapper.unmount();
    });
  }

  it('in-place mutations of already captured reactive config objects remain a passing control', async () => {
    const configuration = ref({
      style: { marginTop: '6px' },
      classNames: { root: 'in-place-first' },
      styles: { root: { paddingBottom: '5px' } },
    });
    const Host = defineComponent(
      () => () =>
        h(
          ConfigProvider,
          { components: { typography: configuration.value } },
          {
            default: () => h(Text, {}, { default: () => 'In-place provider body' }),
          },
        ),
    );
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    configuration.value.style.marginTop = '12px';
    configuration.value.classNames.root = 'in-place-current';
    configuration.value.styles.root.paddingBottom = '9px';
    await flushRender();
    expect(rootOf(wrapper).style.marginTop).toBe('12px');
    expect(rootOf(wrapper).classList.contains('in-place-current')).toBe(true);
    expect(rootOf(wrapper).classList.contains('in-place-first')).toBe(false);
    expect(rootOf(wrapper).style.paddingBottom).toBe('9px');
    wrapper.unmount();
  });

  it('provider functions reading a reactive ref remain a passing control', async () => {
    const current = ref(false);
    const Host = defineComponent(
      () => () =>
        h(
          ConfigProvider,
          {
            components: {
              typography: {
                classNames: () => ({ root: current.value ? 'reactive-current' : 'reactive-first' }),
                styles: () => ({ root: { marginTop: current.value ? '12px' : '6px' } }),
              },
            },
          },
          { default: () => h(Text, {}, { default: () => 'Reactive function body' }) },
        ),
    );
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    current.value = true;
    await flushRender();
    expect(rootOf(wrapper).classList.contains('reactive-current')).toBe(true);
    expect(rootOf(wrapper).classList.contains('reactive-first')).toBe(false);
    expect(rootOf(wrapper).style.marginTop).toBe('12px');
    wrapper.unmount();
  });

  it('current flat provider style, semantic style, local style and native attrs keep their precedence', async () => {
    const configuration = ref<TypographyConfig>({
      style: { maxWidth: '150px' },
      styles: { root: { maxWidth: '100px' } },
    });
    const local = ref<TypographySemanticStyles | undefined>({ root: { maxWidth: '300px' } });
    const native = shallowRef<StyleValue>({ maxWidth: '400px' });
    const Host = defineComponent(
      () => () =>
        h(
          ConfigProvider,
          { components: { typography: { ...configuration.value } } },
          {
            default: () =>
              h(
                Text,
                { styles: local.value, style: native.value },
                { default: () => 'Priority provider body' },
              ),
          },
        ),
    );
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    expect(rootOf(wrapper).style.maxWidth).toBe('400px');
    configuration.value = { style: { maxWidth: '250px' }, styles: { root: { maxWidth: '200px' } } };
    await flushRender();
    expect(rootOf(wrapper).style.maxWidth).toBe('400px');
    native.value = undefined;
    await flushRender();
    expect(rootOf(wrapper).style.maxWidth).toBe('300px');
    local.value = undefined;
    await flushRender();
    expect(rootOf(wrapper).style.maxWidth).toBe('250px');
    configuration.value = { styles: { root: { maxWidth: '200px' } } };
    await flushRender();
    expect(rootOf(wrapper).style.maxWidth).toBe('200px');
    configuration.value = {};
    await flushRender();
    expect(rootOf(wrapper).style.maxWidth).toBe('');
    wrapper.unmount();
  });

  it('configuration can be added after mount instead of remaining at the empty defaults', async () => {
    const configuration = ref<TypographyConfig>();
    const Host = defineComponent(
      () => () =>
        h(
          ConfigProvider,
          { components: configuration.value ? { typography: { ...configuration.value } } : {} },
          {
            default: () => h(Text, {}, { default: () => 'Late provider body' }),
          },
        ),
    );
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    configuration.value = { className: 'late-class', style: { marginTop: '12px' } };
    await flushRender();
    expect(rootOf(wrapper).classList.contains('late-class')).toBe(true);
    expect(rootOf(wrapper).style.marginTop).toBe('12px');
    wrapper.unmount();
  });

  it('provider replacement preserves a rich native input, its draft and focus', async () => {
    const configuration = ref<TypographyConfig>({
      className: 'provider-first',
      style: { marginTop: '6px' },
    });
    const Host = defineComponent(
      () => () =>
        h(
          ConfigProvider,
          { components: { typography: { ...configuration.value } } },
          {
            default: () =>
              h(
                Paragraph,
                {},
                {
                  default: () => [
                    h('span', { key: 'label' }, 'Stable provider content'),
                    h('input', { key: 'draft', 'aria-label': 'Typography provider draft' }),
                  ],
                },
              ),
          },
        ),
    );
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    const root = rootOf(wrapper);
    const input = wrapper.get('input').element;
    if (!(input instanceof HTMLInputElement)) throw new Error('Expected a native input');
    input.value = 'Kept provider draft';
    input.focus();
    configuration.value = { className: 'provider-current', style: { marginTop: '12px' } };
    await flushRender();
    expect(rootOf(wrapper)).toBe(root);
    expect(wrapper.get('input').element).toBe(input);
    expect(input.value).toBe('Kept provider draft');
    expect(document.activeElement).toBe(input);
    expect(root.classList.contains('provider-current')).toBe(true);
    expect(root.style.marginTop).toBe('12px');
    wrapper.unmount();
  });
});
