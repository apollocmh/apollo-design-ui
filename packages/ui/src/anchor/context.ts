import type { InjectionKey } from 'vue';
import type {
  AnchorDirection,
  AnchorLinkInfo,
  AnchorSemanticClassNames,
  AnchorSemanticStyles,
} from './interface';

/** 上游 `AntAnchor` 的 Vue 对应物。 */
export interface AnchorContextValue {
  /** Each mounted link owns its registration, including duplicate hrefs. */
  registerLink: (
    link: string,
    targetOffset: number | undefined,
    element: () => HTMLElement | null,
  ) => () => void;
  /** 当前高亮（`getCurrentAnchor` **改写后**的值）。 */
  activeLink: string | null;
  /** 滚动到某个锚点（`targetOffset` 为该链接的覆盖值）。 */
  scrollTo: (link: string, targetOffset?: number) => void;
  /** Forward the Link's original event to Anchor's owned click notification. */
  onClick?: ((e: MouseEvent, link: AnchorLinkInfo) => void) | undefined;
  prefixCls: string;
  replace: boolean | undefined;
  direction: AnchorDirection;
  classNames?: AnchorSemanticClassNames | undefined;
  styles?: AnchorSemanticStyles | undefined;
}

/** 注入键。用 Symbol 避免与用户自己的 provide 键冲突。 */
export const anchorContextKey: InjectionKey<AnchorContextValue> = Symbol('apolloAnchor');
