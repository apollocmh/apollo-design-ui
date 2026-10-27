import { token2CSSVar } from '@apollo-design/theme';
import { PRESET_COLORS } from '../../_internal/preset-color';

const v = (name: string) => `var(${token2CSSVar(name)})`;
const statuses: Record<string, string> = {
  success: 'Success',
  processing: 'Info',
  error: 'Error',
  warning: 'Warning',
};
/** Static rules consume current aliases; explicit component/native styles retain priority. */
export function genTagStyle(rootPrefixCls: string): string {
  const name = `${rootPrefixCls}-tag`,
    c = `.${name}`;
  const own = (key: string, fallback?: string) =>
    `var(--${name}-${key}${fallback ? `,${fallback}` : ''})`;
  const tone = (color: string) =>
    `light-dark(oklch(from ${color} min(l,0.39) c h / 1),oklch(from ${color} max(l,0.82) c h / 1))`;
  // Keep native colour functions inside a feature condition: consumer CSS
  // optimisers can otherwise lower light-dark() into helpers that cannot follow
  // the current variable colour-scheme on each component root.
  const adaptive = [
    `${c}-checkable:not(${c}-checkable-disabled):not(${c}-checkable-checked):hover{--${name}-text-color:${tone(v('colorPrimary'))};}`,
  ];
  const rules = [
    `${c}{`,
    `--${name}-default-bg:${v('colorFillTertiary')};`,
    `--${name}-default-color:${v('colorText')};`,
    `--${name}-custom-color:currentColor;`,
    `--${name}-custom-bg:${own('default-bg')};`,
    `--${name}-auto-solid-color:${v('colorTextLightSolid')};`,
    `--${name}-solid-text-color:${own('auto-solid-color')};`,
    `--${name}-color-scheme:light;`,
    `--${name}-bg-color:${own('default-bg')};`,
    `--${name}-text-color:${own('default-color')};`,
    `--${name}-border-color:${v('colorBorder')};`,
    `margin:0;padding:0;padding-inline:calc(8px - ${v('lineWidth')});`,
    `font-size:${v('fontSizeSM')};line-height:calc(${v('lineHeightSM')} * ${v('fontSizeSM')});font-family:${v('fontFamily')};`,
    `list-style:none;display:inline-block;height:auto;white-space:nowrap;text-align:start;position:relative;opacity:1;`,
    `background-color:${own('bg-color')};color:${own('text-color')};color-scheme:${own('color-scheme')};`,
    `border:${v('lineWidth')} ${v('lineType')} ${own('border-color')};border-radius:${v('borderRadiusSM')};`,
    `transition:color ${v('motionDurationMid')},background-color ${v('motionDurationMid')},border-color ${v('motionDurationMid')};`,
    `}`,
    `${c}-rtl{direction:rtl;}`,
    `${c}-filled{--${name}-border-color:transparent;}`,
    `${c}-solid{--${name}-bg-color:${v('colorBgSolid')};--${name}-border-color:${own('bg-color')};--${name}-text-color:${own('solid-text-color')};}`,
    `${c} a,${c} a:hover{color:inherit;}`,
    `${c}-icon{display:inline-flex;align-items:center;vertical-align:middle;}`,
    `${c}-has-icon>${c}-content{margin-inline-start:calc(8px - ${v('lineWidth')});}`,
    `${c} ${c}-close-icon{`,
    `display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;`,
    `padding:0;border:0;background:transparent;color:inherit;cursor:pointer;font-family:inherit;line-height:1;`,
    `margin-inline-start:calc(${v('paddingXXS')} - ${v('lineWidth')});font-size:calc(${v('fontSizeIcon')} - ${v('lineWidth')} * 2);`,
    `}`,
    `${c}:focus-visible,${c} a:focus-visible,${c} ${c}-close-icon:focus-visible{outline:${v('controlOutlineWidth')} solid ${v('colorPrimary')};outline-offset:calc(${v('lineWidth')} * 2);}`,
    `${c} ${c}-close-icon:disabled{cursor:not-allowed;color:${v('colorTextDisabled')};}`,
    `${c}-checkable{--${name}-bg-color:transparent;--${name}-border-color:transparent;cursor:pointer;}`,
    `${c}-checkable:not(${c}-checkable-disabled):not(${c}-checkable-checked):hover{--${name}-bg-color:${v('colorFillSecondary')};}`,
    `${c}-checkable-checked{--${name}-bg-color:${v('colorPrimary')};--${name}-text-color:${own('auto-solid-color')};}`,
    `${c}-checkable-checked:not(${c}-checkable-disabled):hover{--${name}-bg-color:${v('colorPrimaryHover')};}`,
    `${c}-checkable:not(${c}-checkable-disabled):active{--${name}-bg-color:${v('colorPrimaryActive')};--${name}-text-color:${own('auto-solid-color')};}`,
    `${c}-checkable-group{display:flex;flex-wrap:wrap;gap:${v('paddingXS')};}`,
    `${c}-hidden{display:none;}`,
    `${c}-disabled,${c}-checkable-disabled{--${name}-text-color:${v('colorTextDisabled')};--${name}-bg-color:${v('colorBgContainerDisabled')};cursor:not-allowed;}`,
    `${c}-disabled${c}-outlined{--${name}-border-color:${v('colorBorderDisabled')};}`,
    `${c}-disabled a{pointer-events:none;cursor:not-allowed;color:inherit;}`,
    `${c}-checkable-disabled:not(${c}-checkable-checked){--${name}-bg-color:transparent;}`,
  ];
  for (const [status, cap] of Object.entries(statuses)) {
    const s = `${c}${c}-${status}:not(${c}-disabled)`;
    for (const variant of ['filled', 'outlined']) {
      rules.push(
        `${s}${c}-${variant}{--${name}-bg-color:${v(`color${cap}Bg`)};${variant === 'outlined' ? `--${name}-border-color:${v(`color${cap}Border`)};` : ''}}`,
      );
      adaptive.push(`${s}${c}-${variant}{--${name}-text-color:${tone(v(`color${cap}`))};}`);
    }
    rules.push(
      `${s}${c}-solid{--${name}-bg-color:${v(`color${cap}`)};--${name}-border-color:${v(`color${cap}`)};}`,
    );
  }
  for (const key of PRESET_COLORS) {
    const s = `${c}${c}-${key}:not(${c}-disabled)`;
    for (const variant of ['filled', 'outlined']) {
      rules.push(
        `${s}${c}-${variant}{--${name}-bg-color:${v(`${key}-1`)};${variant === 'outlined' ? `--${name}-border-color:${v(`${key}-3`)};` : ''}}`,
      );
      adaptive.push(`${s}${c}-${variant}{--${name}-text-color:${tone(v(`${key}-7`))};}`);
    }
    rules.push(
      `${s}${c}-solid{--${name}-bg-color:${v(`${key}-6`)};--${name}-border-color:${v(`${key}-6`)};}`,
    );
  }
  const custom = own('custom-color'),
    customBg = own('custom-bg');
  for (const variant of ['filled', 'outlined']) {
    rules.push(
      `${c}-custom${c}-${variant}:not(${c}-disabled){--${name}-bg-color:${customBg};${variant === 'outlined' ? `--${name}-border-color:${custom};` : ''}}`,
    );
    adaptive.push(
      `${c}-custom${c}-${variant}:not(${c}-disabled){--${name}-bg-color:light-dark(${customBg},oklch(from ${custom} min(l,0.25) c h / 1));--${name}-text-color:${tone(custom)};}`,
    );
  }
  rules.push(`@supports (color:light-dark(black,white)){${adaptive.join('\n')}}`);
  rules.push(
    `${c}-custom${c}-solid:not(${c}-disabled){--${name}-bg-color:${custom};--${name}-border-color:${custom};}`,
  );
  rules.push(
    `@supports (color:contrast-color(white)){${c}{--${name}-auto-solid-color:contrast-color(${own('bg-color')});}}`,
  );
  return rules.join('\n');
}
