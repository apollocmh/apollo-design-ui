import { UserOutlined } from '@apollo-design/icons';
import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { Avatar, AvatarGroup, ConfigProvider } from '@apollo-design/ui';
import { h } from 'vue';
import { AVATAR_SRC } from '../shared.mjs';
import reference from '../vue/avatar.js';

const av = (text, props = {}, slots = {}) => h(Avatar, props, { default: () => text, ...slots });
const row = (children) =>
  h(
    'div',
    {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '16px',
        marginBlock: '16px',
      },
    },
    children,
  );
const group = (props = {}) => h(AvatarGroup, props, () => [av('A'), av('B'), av('C'), av('D')]);
const frame = (name, children) =>
  h(
    'main',
    {
      'data-avatar-visual': name,
      style: {
        width: '100%',
        boxSizing: 'border-box',
        minHeight: '300px',
        padding: '16px',
        background: 'var(--apollo-color-bg-container)',
        color: 'var(--apollo-color-text)',
        fontFamily: 'var(--apollo-font-family)',
        fontSize: 'var(--apollo-font-size)',
      },
    },
    [h('h1', { style: { fontSize: '20px', margin: '0 0 16px' } }, `Avatar ${name}`), ...children],
  );
const theme = (name) =>
  h(
    ConfigProvider,
    {
      theme: {
        algorithm:
          name === 'theme-dark'
            ? darkAlgorithm
            : name === 'theme-compact'
              ? compactAlgorithm
              : [darkAlgorithm, compactAlgorithm],
      },
    },
    () =>
      frame(name, [
        row([
          av('U'),
          av('Olivia', { size: 'large' }),
          av('Small', { size: 'small' }),
          av('Numeric', { size: 56 }),
          av(undefined, { src: AVATAR_SRC, alt: 'Olivia' }),
          av(undefined, {}, { icon: () => h(UserOutlined) }),
        ]),
        row([group({ size: 44, max: { count: 2 } }), group({ size: 'small', shape: 'square' })]),
        row([
          av(
            undefined,
            { size: 64 },
            {
              image: () => [
                h('svg', { width: 20, height: 20, 'aria-hidden': 'true' }, [
                  h('circle', { cx: 10, cy: 10, r: 9, fill: 'currentColor' }),
                ]),
                h('b', 'Tail'),
                0,
              ],
            },
          ),
          av(
            undefined,
            { size: 64, style: { fontSize: '14px' } },
            { icon: () => [h(UserOutlined), h('small', 'Tail'), 0] },
          ),
        ]),
      ]),
  );
export default {
  ...reference,
  'group-max': () =>
    frame('group overflow', [
      row([
        group({ max: { count: 2 } }),
        group({ max: { count: 1, style: { background: '#fde3cf', color: '#873800' } } }),
      ]),
    ]),
  'theme-dark': () => theme('theme-dark'),
  'theme-compact': () => theme('theme-compact'),
  'theme-dark-compact': () => theme('theme-dark-compact'),
  'native-focus': () =>
    frame('native-focus', [
      h('button', { id: 'avatar-before', type: 'button' }, 'Before avatars'),
      row([
        group({
          max: {
            count: 2,
            popover: {
              placement: 'bottom',
              mouseEnterDelay: 0,
              mouseLeaveDelay: 0,
              getPopupContainer: (trigger) => trigger.closest('[data-avatar-visual]'),
            },
          },
        }),
      ]),
    ]),
};
