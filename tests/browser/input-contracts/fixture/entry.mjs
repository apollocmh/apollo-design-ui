import { compactAlgorithm, getCSSVarDeclarations, getDesignToken } from '@apollo-design/theme';
import { ConfigProvider } from '@input-source/config-provider/index.ts';
import { formItemInputContextKey } from '@input-source/form/context.ts';
import {
  Input,
  InputGroup,
  InputOTP,
  InputPassword,
  InputSearch,
  TextArea,
} from '@input-source/input/index.ts';
import { Mentions } from '@input-source/mentions/index.ts';
import { SpaceCompact } from '@input-source/space/index.ts';
import { genAllStyles } from '@input-source/style/index.ts';
import { Transfer } from '@input-source/transfer/index.ts';
import {
  computed,
  createApp,
  createSSRApp,
  defineComponent,
  h,
  markRaw,
  mergeProps,
  nextTick,
  provide,
  reactive,
} from 'vue';
import AssociatedForm from './AssociatedForm.vue';
import MigrationScenario from './MigrationScenario.vue';
import NativeScenario from './NativeScenario.vue';
import ScopedAncestor from './ScopedAncestor.vue';
import ScopedInput from './ScopedInput.vue';
import SlotsScenario from './SlotsScenario.vue';

const style = document.createElement('style');
style.textContent =
  getCSSVarDeclarations(getDesignToken()) +
  genAllStyles() +
  '\n*,*::before,*::after{transition:none!important;animation:none!important}body{margin:12px;font-family:var(--apollo-font-family);color:var(--apollo-color-text);background:var(--apollo-color-bg-container)}.audit-pane{width:600px;max-width:100%;padding:8px}.audit-instance{margin-bottom:24px}';
document.head.append(style);
const families = { Input, TextArea, InputPassword, InputSearch, InputOTP, InputGroup };
let app,
  state,
  records = [],
  callbacks = [],
  held = [],
  refs = [],
  currentCase = '';
const errors = [];
const safe = (fn) => {
  try {
    return fn();
  } catch (error) {
    return { error: error.message };
  }
};
const nativeFor = (index = 0) =>
  document.querySelector(`[data-instance="${index}"] input,[data-instance="${index}"] textarea`);
function eventInfo(event, testMethods = false) {
  if (!(event instanceof Event)) return event;
  return {
    constructor: safe(() => event.constructor.name),
    type: safe(() => event.type),
    targetTag: safe(() => event.target?.tagName),
    value: safe(() => event.target?.value),
    targetOwned: safe(() =>
      [...document.querySelectorAll('#app input,#app textarea')].includes(event.target),
    ),
    targetConnected: safe(() => event.target?.isConnected),
    currentTargetTag: safe(() => event.currentTarget?.tagName),
    bubbles: safe(() => event.bubbles),
    cancelable: safe(() => event.cancelable),
    timeStamp: safe(() => typeof event.timeStamp),
    isComposing: safe(() => event.isComposing),
    ...(testMethods
      ? {
          preventDefault: safe(() => {
            event.preventDefault();
            return 'ok';
          }),
          stopPropagation: safe(() => {
            event.stopPropagation();
            return 'ok';
          }),
        }
      : {}),
  };
}
function record(name, value, index = 0) {
  records.push({
    name,
    index,
    value: eventInfo(value, name === 'change' && state.flags.eventMethods),
  });
}
function content(kind, name) {
  if (kind === 'zero') return 0;
  if (kind === 'empty') return [];
  if (kind === 'false') return false;
  if (kind === 'fragment') return [0, h('strong', { 'data-content': name }, name + ' text')];
  if (kind === 'node') return h('strong', { 'data-content': name }, name + ' text');
  return kind;
}
function propsFor(index) {
  let props = {
    ...state.props,
    ...(state.perInstance[index] ?? {}),
    ref: (el) => {
      refs[index] = el;
    },
    'aria-label': state.props['aria-label'] ?? `Audit ${state.family} ${index}`,
  };
  if (state.control !== 'uncontrolled') props.value = state.models[index];
  props['onUpdate:value'] = (value) => {
    record('update', value, index);
    if (state.control === 'model') state.models[index] = value;
  };
  const events = {
    onChange: (value) => record('change', value, index),
    onInput: (value) => record('input', value, index),
    onFocus: (event) => record('focus', event, index),
    onBlur: (event) => record('blur', event, index),
    onPressEnter: (event) => record('pressEnter', event, index),
    onKeyDown: (event) => record('keyDown', event, index),
    onKeyUp: (event) => record('keyUp', event, index),
    onCompositionStart: (event) => record('compositionStart', event, index),
    onCompositionEnd: (event) => record('compositionEnd', event, index),
    onClear: () => record('clear', null, index),
    onResize: (size) => record('resize', size, index),
  };
  if (state.family === 'InputSearch')
    events.onSearch = (value, event, info) =>
      records.push({ name: 'search', index, value, event: eventInfo(event), info });
  if (state.family === 'InputGroup') for (const key of Object.keys(events)) delete events[key];
  props = { ...props, ...events };
  if (state.flags.once)
    for (const name of state.flags.once) {
      delete props[name];
      props[name + 'Once'] = (value) => record(name + 'Once', value, index);
    }
  if (state.flags.arrays)
    for (const name of state.flags.arrays)
      props = mergeProps(props, { [name]: (value) => record(name + 'Second', value, index) });
  if (state.flags.nativeMethodsThrow)
    props.onChange = (event) => {
      event.preventDefault();
      record('nativeMethods', event, index);
    };
  if (state.flags.semanticSpy) {
    props.classNames = (context) => {
      callbacks.push({ kind: 'classes', props: { ...context.props } });
      return {
        root: 'semantic-root',
        input: 'semantic-input',
        textarea: 'semantic-textarea',
        prefix: 'semantic-prefix',
        suffix: 'semantic-suffix',
        clear: 'semantic-clear',
        count: 'semantic-count',
        separator: 'semantic-separator',
      };
    };
    props.styles = (context) => {
      callbacks.push({ kind: 'styles', props: { ...context.props } });
      return {
        root: { marginTop: context.props.readOnly ? '9px' : '3px' },
        input: { letterSpacing: context.props.placeholder ? '2px' : '0px' },
        textarea: { letterSpacing: context.props.placeholder ? '2px' : '0px' },
        prefix: { color: 'rgb(1, 2, 3)' },
        count: { fontWeight: '700' },
        separator: { marginInline: '5px' },
      };
    };
  }
  if (state.flags.countMode) {
    const mode = state.flags.countMode;
    props.count = {
      max: mode === 'zero' ? 0 : 3,
      strategy: (value) => [...value].length,
      exceedFormatter: (value, { max }) => [...value].slice(0, max).join(''),
      show:
        mode === 'node'
          ? (info) => h('strong', { 'data-count-node': true }, String(info.count))
          : true,
    };
  }
  if (state.flags.showFormatter)
    props.showCount = {
      formatter: (info) =>
        state.flags.showFormatter === 'zero'
          ? 0
          : h('strong', { 'data-count-node': true }, String(info.count)),
    };
  if (state.flags.formatter)
    props.formatter = (value) =>
      state.flags.formatter === 'upper'
        ? value.toUpperCase()
        : state.flags.formatter === 'expand'
          ? value.toUpperCase() + 'X'
          : value.replace(/\D/g, '');

  if (state.flags.visibility !== undefined) {
    props.visibilityToggle =
      state.flags.visibility === false
        ? false
        : {
            ...state.flags.visibility,
            onVisibleChange: (value) => {
              record('visible', value, index);
              if (state.flags.acceptVisibility) state.flags.visibility.visible = value;
            },
          };
  }
  if (state.flags.customButton) {
    const buttonProps = {
      type: 'button',
      onClick: (event) => record('customButton', event, index),
    };
    props.enterButton =
      state.flags.customButton === 'native'
        ? h('button', buttonProps, 'Custom')
        : state.flags.customButton === 'component'
          ? markRaw(
              defineComponent({
                name: 'AuditSearchButton',
                inheritAttrs: true,
                setup: () => () => h('button', { type: 'button' }, 'Custom component'),
              }),
            )
          : h('button', { ...buttonProps, disabled: true }, 'Disabled custom');
  }
  for (const [name, kind] of Object.entries(state.content)) props[name] = content(kind, name);
  return props;
}
function slotsFor() {
  const slots = {};
  if (state.flags.separatorFunction)
    slots.separator = ({ index }) => h('strong', { 'data-separator-index': index }, String(index));
  if (state.flags.iconRender)
    slots.icon = ({ visible }) =>
      h('strong', { 'data-icon-visible': String(visible) }, visible ? 'open' : 'closed');
  for (const [name, kind] of Object.entries(state.slots)) slots[name] = () => content(kind, name);
  return slots;
}
const FormBridge = defineComponent({
  setup(_props, { slots }) {
    provide(
      formItemInputContextKey,
      computed(() => ({
        ...state.form,
        feedbackIcon: state.form.hasFeedback
          ? h('span', { 'data-feedback': true }, 'feedback')
          : null,
      })),
    );
    return () => slots.default?.();
  },
});
function createOwner() {
  return defineComponent({
    name: 'AuditOwner',
    setup() {
      return () =>
        h(ConfigProvider, state.provider, {
          default: () =>
            h(FormBridge, null, {
              default: () =>
                h('div', { class: 'audit-pane' }, [
                  ...Array.from({ length: state.instances }, (_, index) =>
                    h('section', { 'data-instance': index, class: 'audit-instance' }, [
                      state.flags.sfcSlots
                        ? h(SlotsScenario, {
                            enabled: state.flags.slotEnabled,
                            label: state.flags.slotLabel ?? 'template',
                            counter: state.flags.counter ?? 0,
                          })
                        : state.flags.sfcNative
                          ? h(NativeScenario, {
                              family: state.family,
                              options: state.props,
                              report: (name, event) => record('template.' + name, event, index),
                            })
                          : state.flags.sfcMigration
                            ? h(MigrationScenario, { family: state.family })
                            : state.family === 'InputGroup'
                              ? h(InputGroup, propsFor(index), {
                                  default: () =>
                                    state.flags.emptyGroup
                                      ? []
                                      : [
                                          h(Input, {
                                            defaultValue: 'group one',
                                            'aria-label': 'Group first',
                                          }),
                                          h(Input, {
                                            defaultValue: 'group two',
                                            'aria-label': 'Group second',
                                          }),
                                        ],
                                })
                              : state.flags.compact
                                ? h(SpaceCompact, state.compact, {
                                    default: () => [
                                      h(families[state.family], propsFor(index), slotsFor()),
                                    ],
                                  })
                                : h(families[state.family], propsFor(index), slotsFor()),
                    ]),
                  ),
                  h('button', { id: 'outside', type: 'button' }, 'Outside focus target'),
                ]),
            }),
        });
    },
  });
}
window.audit = {
  async mount(family, options = {}) {
    app?.unmount();
    document.querySelector('#app').replaceChildren();
    records = [];
    callbacks = [];
    refs = [];
    held = [];
    state = reactive({
      family,
      props: { ...options.props },
      provider: { ...options.provider },
      form: { ...options.form },
      control: options.control ?? 'uncontrolled',
      models: [options.value ?? '', options.secondValue ?? ''],
      perInstance: options.perInstance ?? [],
      instances: options.instances ?? 1,
      flags: { ...options.flags },
      content: { ...options.content },
      slots: { ...options.slots },
      compact: { ...options.compact },
    });
    app = createApp(createOwner());
    app.config.errorHandler = (error) => errors.push({ case: currentCase, error: error.message });
    app.mount('#app');
    await this.settle();
    return this.snapshot();
  },
  async patch(patch) {
    for (const [key, value] of Object.entries(patch)) {
      if (['props', 'provider', 'form', 'flags', 'content', 'slots', 'compact'].includes(key))
        Object.assign(state[key], value);
      else state[key] = value;
    }
    await this.settle();
    return this.snapshot();
  },
  async removeProps(names) {
    for (const name of names) delete state.props[name];
    await this.settle();
    return this.snapshot();
  },
  async removeSlot(name) {
    delete state.slots[name];
    await this.settle();
    return this.snapshot();
  },
  async settle() {
    await nextTick();
    await new Promise(requestAnimationFrame);
    await nextTick();
  },
  tag(id) {
    currentCase = id;
  },
  clearRecords() {
    records = [];
    callbacks = [];
  },
  marker(label) {
    records.push({ name: 'marker', label });
  },
  recordSnapshot() {
    return {
      records: records.map((record) => ({ ...record })),
      callbacks: callbacks.map((item) => ({
        kind: item.kind,
        props: Object.fromEntries(
          Object.entries(item.props).filter(
            ([, value]) => typeof value !== 'function' && typeof value !== 'object',
          ),
        ),
      })),
      errors: [...errors],
    };
  },
  hold(index = 0) {
    held[index] = nativeFor(index);
    return !!held[index];
  },
  identity(index = 0) {
    const node = nativeFor(index);
    return {
      same: node === held[index],
      focused: node === document.activeElement,
      value: node?.value,
      selectionStart: node?.selectionStart,
      selectionEnd: node?.selectionEnd,
    };
  },
  ref(index = 0) {
    return refs[index];
  },
  state() {
    return state;
  },
  snapshot() {
    return {
      family: state?.family,
      models: [...(state?.models ?? [])],
      text: document.querySelector('#app').textContent,
      html: document.querySelector('#app').innerHTML,
      controls: [...document.querySelectorAll('#app input,#app textarea')].map((node) => {
        const style = getComputedStyle(node);
        return {
          tag: node.tagName,
          type: node.type,
          id: node.id,
          name: node.name,
          value: node.value,
          placeholder: node.placeholder,
          disabled: node.disabled,
          readOnly: node.readOnly,
          autoComplete: node.autocomplete,
          inputMode: node.inputMode,
          autoFocus: node.autofocus,
          size: node.size,
          maxLength: node.maxLength,
          rows: node.rows,
          tabIndex: node.tabIndex,
          ariaLabel: node.getAttribute('aria-label'),
          classes: [...node.classList],
          inline: node.getAttribute('style'),
          letterSpacing: style.letterSpacing,
          resize: style.resize,
          display: style.display,
          hidden: node.hidden,
          selectionStart: node.selectionStart,
          selectionEnd: node.selectionEnd,
        };
      }),
      ...this.recordSnapshot(),
    };
  },
  async unmount() {
    app?.unmount();
    app = null;
    await nextTick();
    return {
      controls: document.querySelectorAll('#app input,#app textarea').length,
      refs: refs.map((value) => value === null),
    };
  },
  async hydrateDirect(family, props, html) {
    app?.unmount();
    const root = document.querySelector('#app');
    root.innerHTML = html;
    const before = [...root.querySelectorAll('input,textarea')];
    const data = reactive({ ...props });
    const direct = createSSRApp({
      render: () =>
        h(
          families[family],
          data,
          family === 'InputGroup'
            ? { default: () => h(Input, { 'aria-label': 'SSR child' }) }
            : undefined,
        ),
    });
    direct.config.errorHandler = (error) =>
      errors.push({ case: currentCase, error: error.message });
    app = direct;
    direct.mount(root);
    await nextTick();
    const after = [...root.querySelectorAll('input,textarea')];
    const initial = {
      retained:
        before.length === after.length && before.every((node, index) => node === after[index]),
      values: after.map((node) => node.value),
    };
    if (family !== 'InputGroup' && family !== 'InputOTP') data.value = 'hydrated-update';
    if (family === 'InputOTP') data.value = '5678';
    await nextTick();
    return {
      ...initial,
      updated: [...root.querySelectorAll('input,textarea')].map((node) => node.value),
      errors: [...errors],
    };
  },
};

let associatedApp,
  associatedState,
  associatedRef,
  associatedRecords = [],
  associatedHydration;
window.inputAssociated = {
  async mount(kind, options = {}) {
    await window.audit.unmount();
    await this.unmount();
    associatedRecords = [];
    associatedState = reactive({
      kind,
      props: { ...options.props },
      provider: {
        ...options.provider,
        ...(options.compact ? { theme: { algorithm: compactAlgorithm } } : {}),
      },
    });
    if (options.html) document.querySelector('#app').innerHTML = options.html;
    const serverEditors = [...document.querySelectorAll('#app input,#app textarea')];
    const serverRoot = document.querySelector('[data-associated] .owned-scoped-input');
    const serverScopeIds =
      serverRoot?.getAttributeNames().filter((name) => name.startsWith('data-v-')) ?? [];
    const serverSentinel = serverRoot
      ? getComputedStyle(serverRoot).getPropertyValue('--scope-sentinel').trim()
      : '';
    const serverLeak = serverRoot
      ? getComputedStyle(serverRoot).getPropertyValue('--scope-leak').trim()
      : '';
    associatedApp = (options.html ? createSSRApp : createApp)({
      render: () =>
        h(ConfigProvider, associatedState.provider, {
          default: () =>
            h('section', { 'data-associated': kind }, [
              kind === 'scoped' || kind === 'nested'
                ? h(kind === 'scoped' ? ScopedInput : ScopedAncestor, {
                    ...associatedState.props,
                    ref: (value) => {
                      associatedRef = value;
                    },
                  })
                : kind === 'form'
                  ? h(AssociatedForm, {
                      ref: (value) => {
                        associatedRef = value;
                      },
                    })
                  : kind === 'mentions'
                    ? h(Mentions, {
                        'aria-label': 'Associated mentions',
                        defaultValue: 'draft',
                        ...associatedState.props,
                        ref: (value) => {
                          associatedRef = value;
                        },
                        onChange: (value) => associatedRecords.push({ name: 'change', value }),
                        onClear: () => associatedRecords.push({ name: 'clear' }),
                        onFocus: (event) =>
                          associatedRecords.push({ name: 'focus', value: eventInfo(event) }),
                      })
                    : h(Transfer, {
                        dataSource: [
                          { key: 'a', title: 'Alpha' },
                          { key: 'b', title: 'Beta' },
                        ],
                        targetKeys: [],
                        showSearch: true,
                        ...associatedState.props,
                        onSearch: (direction, value) =>
                          associatedRecords.push({ name: 'search', direction, value }),
                        ref: (value) => {
                          associatedRef = value;
                        },
                      }),
              kind === 'scoped' || kind === 'nested'
                ? h(Input, {
                    class: 'owned-scoped-input',
                    'data-unscoped-peer': '',
                    'aria-label': 'Unscoped peer',
                  })
                : null,
              h('button', { type: 'button', 'data-associated-outside': '' }, 'Outside'),
            ]),
        }),
    });
    associatedApp.config.errorHandler = (error) =>
      errors.push({ case: currentCase, error: error.message });
    associatedApp.mount('#app');
    await window.audit.settle();
    const clientEditors = [...document.querySelectorAll('#app input,#app textarea')];
    associatedHydration = {
      serverScopeIds,
      serverSentinel,
      serverLeak,
      retained:
        !!options.html &&
        serverEditors.length === clientEditors.length &&
        serverEditors.every((editor, index) => editor === clientEditors[index]),
    };
    document
      .querySelector('[data-associated]')
      .addEventListener('input', (event) =>
        associatedRecords.push({ name: 'nativeInput', value: eventInfo(event) }),
      );
    return this.snapshot();
  },
  async patch(patch) {
    for (const [key, value] of Object.entries(patch)) Object.assign(associatedState[key], value);
    await window.audit.settle();
    return this.snapshot();
  },
  ref() {
    return associatedRef;
  },
  hydration() {
    return associatedHydration;
  },
  records() {
    return associatedRecords.map((record) => ({ ...record }));
  },
  snapshot() {
    const editor = document.querySelector('[data-associated] input,[data-associated] textarea');
    const root = associatedRef?.nativeElement;
    return {
      editorValue: editor?.value,
      rootClass: root?.className,
      rootStyle: root?.getAttribute('style'),
      records: this.records(),
      html: document.querySelector('#app').innerHTML,
    };
  },
  async unmount() {
    associatedApp?.unmount();
    associatedApp = undefined;
    associatedRef = undefined;
    await nextTick();
  },
};
window.auditReady = true;
