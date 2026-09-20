/**
 * Skeleton 的公共导出。
 *
 * 与 antd 的 `es/skeleton/index.js` 对齐的对外面：
 *   - 默认导出 `Skeleton`（含 `Avatar` / `Button` / `Input` / `Image` / `Node` 五个静态子组件）
 *   - 五个子组件同时提供**具名导出**（`SkeletonAvatar` / `SkeletonButton` / …）
 *   - 全部类型 + 样式生成函数 + Component Token
 *
 * ── 两处与 antd 的**形态**差异（PLATFORM，不是行为差异）────────────────────────
 *
 * 1. antd 用 `Skeleton.Button = SkeletonButton` 这种「函数组件挂属性」做复合组件；
 *    Vue 里对应 `Object.assign(组件, { Button, … })`。两者可观测行为一致：
 *    `<Skeleton.Button>`（JSX）与 `<SkeletonButton>` / `<ASkeletonButton>` 渲染同一棵 DOM。
 *    ⚠️ `Object.assign` 而不是「先声明再赋值」—— `Object.assign` 的返回值是交叉类型，
 *    `Skeleton.Button` 在**类型层**才可见（裸赋值不更新类型，下游用 `Skeleton.Button`
 *    会报 TS2339）。与 `Space` / `Typography` 同一条。
 * 2. 具名导出**加了 `Skeleton` 前缀**（`SkeletonAvatar` 而不是 `Avatar`）。
 *    理由：`packages/ui/src/index.ts` 是单一 barrel，`Avatar` / `Button` / `Input` /
 *    `Image` / `Node` 这些名字与**已落地或将要落地**的独立组件重名
 *    （`avatar` 就在 registry 的组件列表里）。`SpaceCompact` / `SpaceAddon` 是同一条。
 *
 * ── 为什么不导出 `Title` / `Paragraph` / `Element` ─────────────────────────────
 *
 * 它们是**内部实现**（antd 也不从 `skeleton/index` 导出，只是模块内部文件）。
 * `Element` 的 props 是「写死形状的 `<span>`」，直接暴露出去等于把
 * 「谁负责解析 prefixCls / 谁负责合并语义化样式」这个约定交给用户。
 * 需要自定义内容时用 `Skeleton.Node`（它接受默认插槽）。
 */

import { withInstall } from '../_internal/with-install';
import AvatarComponent from './Avatar.vue';
import ButtonComponent from './Button.vue';
import ImageComponent from './Image.vue';
import InputComponent from './Input.vue';
import NodeComponent from './Node.vue';
import SkeletonComponent from './Skeleton.vue';

/** `Skeleton.Avatar`。注册名 `ASkeletonAvatar`。 */
export const SkeletonAvatar = withInstall(AvatarComponent);

/** `Skeleton.Button`。注册名 `ASkeletonButton`。 */
export const SkeletonButton = withInstall(ButtonComponent);

/** `Skeleton.Input`。注册名 `ASkeletonInput`。 */
export const SkeletonInput = withInstall(InputComponent);

/** `Skeleton.Image`。注册名 `ASkeletonImage`。 */
export const SkeletonImage = withInstall(ImageComponent);

/** `Skeleton.Node`。注册名 `ASkeletonNode`。 */
export const SkeletonNode = withInstall(NodeComponent);

/**
 * Skeleton 复合组件。注册名 `ASkeleton`。
 *
 * ⚠️ 静态子组件与具名导出指向**同一批对象**（见文件头第 1 条）。
 */
export const Skeleton = withInstall(
  Object.assign(SkeletonComponent, {
    Avatar: SkeletonAvatar,
    Button: SkeletonButton,
    Input: SkeletonInput,
    Image: SkeletonImage,
    Node: SkeletonNode,
  }),
);

export default Skeleton;

export type {
  SkeletonAvatarOwnProps,
  SkeletonAvatarProps,
  SkeletonButtonProps,
  SkeletonConfig,
  SkeletonElementProps,
  SkeletonElementSemanticClassNames,
  SkeletonElementSemanticStyles,
  SkeletonElementSemanticType,
  SkeletonElementSize,
  SkeletonImageProps,
  SkeletonInputProps,
  SkeletonNodeProps,
  SkeletonNodeSlot,
  SkeletonParagraphProps,
  SkeletonProps,
  SkeletonRef,
  SkeletonSemanticAllType,
  SkeletonSemanticClassNames,
  SkeletonSemanticStyles,
  SkeletonSemanticType,
  SkeletonSemanticValue,
  SkeletonShape,
  SkeletonSlot,
  SkeletonTitleProps,
  SkeletonWidthUnit,
} from './interface';
// ---------------------------------------------------------------------------
// 样式
// ---------------------------------------------------------------------------
export { genSkeletonStyle } from './style';
export type { ComponentToken as SkeletonComponentToken } from './style/token';
export { prepareComponentToken as prepareSkeletonComponentToken } from './style/token';
