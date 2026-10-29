import type { AliasToken } from '@apollo-design/theme';
export const tokenEntries = [
  ['headerPadding', 'header-padding'],
  ['headerPaddingSM', 'header-padding-sm'],
  ['headerPaddingLG', 'header-padding-lg'],
  ['headerBg', 'header-bg'],
  ['contentPadding', 'content-padding'],
  ['contentPaddingSM', 'content-padding-sm'],
  ['contentPaddingLG', 'content-padding-lg'],
  ['contentBg', 'content-bg'],
  ['borderlessContentPadding', 'borderless-content-padding'],
  ['borderlessContentBg', 'borderless-content-bg'],
  ['collapsePanelBorderRadius', 'panel-border-radius'],
] as const;
export type ComponentToken = { [Key in (typeof tokenEntries)[number][0]]: string };
type Source = Pick<
  AliasToken,
  | 'padding'
  | 'paddingSM'
  | 'paddingXS'
  | 'paddingLG'
  | 'paddingXXS'
  | 'colorFillAlter'
  | 'colorBgContainer'
  | 'borderRadiusLG'
>;
export function prepareComponentToken(token: Source): ComponentToken {
  return {
    headerPadding: `${token.paddingSM}px ${token.padding}px`,
    headerPaddingSM: `${token.paddingXS}px ${token.paddingSM}px ${token.paddingXS}px ${token.paddingXS}px`,
    headerPaddingLG: `${token.padding}px ${token.paddingLG}px ${token.padding}px ${token.padding}px`,
    headerBg: token.colorFillAlter,
    contentPadding: `${token.padding}px 16px`,
    contentPaddingSM: `${token.paddingSM}px`,
    contentPaddingLG: `${token.paddingLG}px`,
    contentBg: token.colorBgContainer,
    borderlessContentPadding: `${token.paddingXXS}px 16px ${token.padding}px`,
    borderlessContentBg: 'transparent',
    collapsePanelBorderRadius: `${token.borderRadiusLG}px`,
  };
}
