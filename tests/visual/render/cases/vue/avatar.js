/**
 * Vue 侧（@apollo-design/ui）的 Avatar 视觉用例。与 `react/avatar.jsx` 逐条对应。
 *
 * ⚠️ 本文件**不需要 `getPopupContainer`** —— Avatar 没有浮层
 * （`group-max` 的溢出 Popover 在静态帧里不展开）。
 *
 * ⚠️ 两条必须与 React 侧逐字相同的约定（理由见 `react/avatar.jsx` 的文件头）：
 * **容器宽度 320px** + **字体在用例内钉住**（字符头像的 `fontSize` 与 `scale` 都由测量决定）。
 *
 * ⚠️ 所有 vnode **在用例函数内新建**（vnode 是一次性的）。
 * ⚠️ `Avatar.Group` 用**具名导出** `AvatarGroup`（与 `Avatar.Group` 指向同一对象）。
 */

import { Avatar, AvatarGroup, Badge, ConfigProvider } from '@apollo-design/ui';
import { h } from 'vue';
import {
  AVATAR_BOX_STYLE,
  AVATAR_RESPONSIVE_SIZE,
  AVATAR_ROW_STYLE,
  AVATAR_SRC,
  AVATAR_TEXT_LONG,
  AVATAR_TEXT_OVERFLOW,
  AVATAR_TEXT_SHORT,
} from '../shared.mjs';

const box = (children) => h('div', { style: AVATAR_BOX_STYLE }, [children]);
const row = (children) => h('div', { style: AVATAR_ROW_STYLE }, children);

/** 图标替身：两侧同一份纯色方块。 */
const icon = (size = '1em') =>
  h('span', { style: { display: 'inline-block', width: size, height: size, background: '#999' } });

const SIZES = [64, 'large', 'medium', 'small', 14];

/** 造一个子头像（`slots` 是默认插槽）。 */
const av = (props, content) =>
  h(Avatar, props, content === undefined ? undefined : { default: () => content });

export default {
  /** 五种尺寸 × circle + icon。 */
  basic: () => box(row(SIZES.map((s) => av({ key: String(s), size: s, icon: icon() })))),

  /** 五种尺寸 × square（圆角走 `-square` 分支）。 */
  square: () =>
    box(row(SIZES.map((s) => av({ key: String(s), size: s, shape: 'square', icon: icon() })))),

  /** 字符头像：单字符 / 多字符 / 长文本（都走 `-string` span）。 */
  text: () =>
    box(
      row([
        av({ key: 'a' }, AVATAR_TEXT_SHORT),
        av({ key: 'b' }, AVATAR_TEXT_LONG),
        av({ key: 'c', size: 40 }, AVATAR_TEXT_LONG),
        av({ key: 'd', size: 'large' }, AVATAR_TEXT_LONG),
      ]),
    ),

  /** 长文本 + 默认 `gap=4` ⇒ 触发**字符缩放**（内联 transform）。 */
  overflow: () =>
    box(
      row([
        av({ key: 'a', size: 'large' }, AVATAR_TEXT_OVERFLOW),
        av({ key: 'b' }, AVATAR_TEXT_OVERFLOW),
        av({ key: 'c', size: 'small' }, AVATAR_TEXT_OVERFLOW),
      ]),
    ),

  /** 只有 icon（`-icon` 的字号分支）。 */
  icon: () =>
    box(
      row([
        av({ key: 'a', icon: icon() }),
        av({ key: 'b', size: 'large', icon: icon() }),
        av({ key: 'c', size: 'small', icon: icon() }),
      ]),
    ),

  /** 图片头像：字符串 `src`（data URI）与 `src` 是 vnode 两种形态。 */
  src: () =>
    box(
      row([
        av({ key: 'a', src: AVATAR_SRC, alt: 'a' }),
        av({ key: 'b', size: 'large', src: AVATAR_SRC, alt: 'b' }),
        av({ key: 'c', src: h('img', { draggable: false, src: AVATAR_SRC, alt: 'c' }) }),
        av({ key: 'd', shape: 'square', size: 40, src: AVATAR_SRC, alt: 'd' }),
      ]),
    ),

  /** 数字尺寸 ⇒ 内联 width/height/fontSize。 */
  numeric: () =>
    box(
      row([
        av({ key: 'a', size: 14, icon: icon() }),
        av({ key: 'b', size: 40, icon: icon() }),
        av({ key: 'c', size: 64, icon: icon() }),
        av({ key: 'd', size: 40 }, AVATAR_TEXT_LONG),
      ]),
    ),

  /** 带徽标。 */
  badge: () =>
    box(
      row([
        h(Badge, { key: 'a', count: 1 }, { default: () => av({ shape: 'square', icon: icon() }) }),
        h(Badge, { key: 'b', dot: true }, { default: () => av({ shape: 'square', icon: icon() }) }),
      ]),
    ),

  /** Avatar.Group：四个子头像（重叠 + 边框色）。 */
  group: () =>
    box(
      h(AvatarGroup, null, {
        default: () => [
          av({ icon: icon() }),
          av({ style: { backgroundColor: '#f56a00' } }, AVATAR_TEXT_SHORT),
          av({ style: { backgroundColor: '#87d068' }, icon: icon() }),
          av({ style: { backgroundColor: '#1677ff' } }, AVATAR_TEXT_SHORT),
        ],
      }),
    ),

  /** `max.count` 截断 + `+N` 溢出项。 */
  'group-max': () =>
    box([
      h(
        AvatarGroup,
        { key: 'a', max: { count: 2 } },
        {
          default: () => [
            av({ icon: icon() }),
            av({ style: { backgroundColor: '#f56a00' } }, AVATAR_TEXT_SHORT),
            av({ style: { backgroundColor: '#87d068' }, icon: icon() }),
            av({ style: { backgroundColor: '#1677ff' } }, AVATAR_TEXT_SHORT),
          ],
        },
      ),
      h(
        AvatarGroup,
        { key: 'b', max: { count: 2, style: { color: '#f56a00', backgroundColor: '#fde3cf' } } },
        {
          default: () => [
            av({ icon: icon() }),
            av({ style: { backgroundColor: '#f56a00' } }, AVATAR_TEXT_SHORT),
            av({ style: { backgroundColor: '#87d068' }, icon: icon() }),
          ],
        },
      ),
    ]),

  /** 响应式尺寸 ⇒ **三个视口下尺寸不同**。 */
  responsive: () =>
    box(
      row([
        av({ key: 'a', size: AVATAR_RESPONSIVE_SIZE, icon: icon() }),
        av({ key: 'b', size: AVATAR_RESPONSIVE_SIZE }, AVATAR_TEXT_SHORT),
      ]),
    ),

  /** RTL：`-group-rtl` 落在 group 根上（`Avatar` 自己**没有** `-rtl`）。 */
  rtl: () =>
    h(
      ConfigProvider,
      { direction: 'rtl' },
      {
        default: () =>
          box(
            h(AvatarGroup, null, {
              default: () => [
                av({ icon: icon() }),
                av({ style: { backgroundColor: '#f56a00' } }, AVATAR_TEXT_SHORT),
                av({ style: { backgroundColor: '#87d068' }, icon: icon() }),
              ],
            }),
          ),
      },
    ),
};
