import Button from './Button.vue';
import type { ComponentToken, PresetShadowColorToken } from './style/token';

export { Button };
export default Button;
export type {
  ButtonColorType,
  ButtonConfig,
  ButtonHTMLType,
  ButtonIcon,
  ButtonIconPlacement,
  ButtonLoading,
  ButtonProps,
  ButtonRef,
  ButtonSemanticClassNames,
  ButtonSemanticStyles,
  ButtonSemanticType,
  ButtonShape,
  ButtonSize,
  ButtonSlot,
  ButtonSlots,
  ButtonType,
  ButtonVariantType,
} from './interface';
export { genButtonStyle } from './style';
export type { ButtonTokenInput } from './style/token';
export { prepareComponentToken as prepareButtonComponentToken } from './style/token';
export type ButtonComponentToken = ComponentToken & PresetShadowColorToken;
