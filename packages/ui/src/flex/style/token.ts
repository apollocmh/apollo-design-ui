import type { AliasToken } from '@apollo-design/theme';

/** Flex has no component tokens. Preset gaps consume paddingXS/padding/paddingLG. */
export type ComponentToken = Record<string, never>;
export const prepareComponentToken = (_token?: AliasToken): Partial<ComponentToken> => ({});
