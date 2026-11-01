import { getDesignToken, useTheme } from '@apollo-design/theme';
import { defaultPreset } from '@apollo-design/theme/presets/default';
import { material3Preset } from '@apollo-design/theme/presets/material3';
import { monoPreset } from '@apollo-design/theme/presets/mono';
import { createApp, defineComponent, h, nextTick, shallowRef } from 'vue';
import Button from '../../button/Button.vue';
import { InputComponent as Input } from '../../input/Input';
import useMessage from '../../message/useMessage';
import useNotification from '../../notification/useNotification';
import Select from '../../select/Select';
import Tooltip from '../../tooltip/Tooltip';
import ConfigProvider from '../ConfigProvider';

const custom = {
  name: 'customer',
  token: { colorPrimary: '#006b60', borderRadius: 6, fontSize: 15 },
  light: { token: { colorBgBase: '#f8fffc' } },
  dark: { token: { colorPrimary: '#1a786d', colorBgBase: '#0b1715' } },
};
const presets = { default: defaultPreset, mono: monoPreset, material3: material3Preset, custom };
const tick = async () => {
  await nextTick();
  await nextTick();
};
const appearance = shallowRef('light');
const selected = shallowRef('mono');
const tooltipOpen = shallowRef(false);
const notices = [];
const roots = new Map();
const tokens = new Map();

const Controls = defineComponent({
  props: { name: { type: String, required: true } },
  setup(props) {
    const theme = useTheme();
    const [message, messageHolder] = useMessage();
    const [notification, notificationHolder] = useNotification();
    const value = shallowRef('a');
    notices.push({
      name: props.name,
      open() {
        message.open({
          key: props.name,
          content: h('input', { 'aria-label': `${props.name} message draft` }),
          duration: 0,
        });
        notification.open({
          key: props.name,
          title: `${props.name} notification`,
          description: h('input', { 'aria-label': `${props.name} notification draft` }),
          duration: 0,
        });
      },
      close() {
        message.destroy();
        notification.destroy();
      },
    });
    return () => {
      tokens.set(props.name, theme.token.value);
      return h(
        'section',
        {
          ref: (value) => (value ? roots.set(props.name, value) : roots.delete(props.name)),
          'data-theme-scope': props.name,
          style: {
            background: 'var(--apollo-color-bg-container)',
            color: 'var(--apollo-color-text)',
            padding: '20px',
            borderRadius: 'var(--apollo-border-radius-lg)',
            border: '1px solid var(--apollo-color-border)',
            boxShadow: 'var(--apollo-box-shadow-secondary)',
            fontFamily: 'var(--apollo-font-family)',
            fontSize: 'var(--apollo-font-size)',
          },
        },
        [
          h(
            'h2',
            { style: { margin: '0 0 12px', fontSize: 'var(--apollo-font-size-heading-3)' } },
            props.name,
          ),
          h(
            'p',
            { style: { margin: '0 0 14px' } },
            'Seed palettes, typography, shape and surfaces',
          ),
          h(
            'div',
            { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' } },
            [
              h(Button, { type: 'primary' }, () => 'Primary action'),
              h(Button, {}, () => 'Default'),
              h(Button, { danger: true }, () => 'Danger'),
              h(Button, { type: 'primary', disabled: true }, () => 'Disabled'),
            ],
          ),
          h(Input, {
            'aria-label': `${props.name} draft`,
            placeholder: 'Theme changes preserve this draft',
          }),
          h(Select, {
            value: value.value,
            'onUpdate:value': (next) => {
              value.value = next;
            },
            options: [
              { value: 'a', label: 'Alpha' },
              { value: 'b', label: 'Beta' },
            ],
            style: { width: '100%', marginTop: '12px' },
          }),
          h(
            'div',
            { style: { display: 'flex', gap: '12px', marginTop: '14px' } },
            ['Success', 'Warning', 'Error'].map((name) =>
              h(
                'span',
                {
                  'data-status': name,
                  style: { color: theme.token.value[`color${name}`] },
                },
                name,
              ),
            ),
          ),
          h(
            Tooltip,
            {
              open: tooltipOpen.value && selected.value === props.name,
              title: `${props.name} portaled tooltip`,
            },
            () => h('button', { style: { marginTop: '12px' } }, 'Portal target'),
          ),
          messageHolder(),
          notificationHolder(),
        ],
      );
    };
  },
});

const app = createApp({
  render: () =>
    h(
      'div',
      {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
          gap: '20px',
          padding: '24px',
        },
      },
      Object.entries(presets).map(([name, preset]) =>
        h(
          ConfigProvider,
          {
            key: name,
            theme: { preset, mode: appearance.value },
          },
          () => h(Controls, { name }),
        ),
      ),
    ),
});
app.mount(document.getElementById('app'));
await tick();

export async function setAppearance(value) {
  appearance.value = value;
  await tick();
}
export async function openPortal(name) {
  selected.value = name;
  tooltipOpen.value = true;
  await tick();
}
export async function openNotices(name) {
  for (const notice of notices) notice.close();
  notices.find((notice) => notice.name === name).open();
  await tick();
}
export async function closeOverlays() {
  tooltipOpen.value = false;
  for (const notice of notices) notice.close();
  await tick();
}
export function expected(name) {
  const token = tokens.get(name);
  return {
    primary: token.colorPrimary,
    primaryHover: token.colorPrimaryHover,
    font: `${token.fontSize}px`,
    radius: `${token.borderRadius}px`,
    family: token.fontFamily,
    background: token.colorBgContainer,
    elevated: token.colorBgElevated,
    shadow: token.boxShadowSecondary,
    noticeFont: `${token.fontSize}px`,
  };
}
export function tokenFor(name, mode) {
  return getDesignToken({ preset: presets[name], mode });
}
export async function clear() {
  app.unmount();
  await tick();
}
