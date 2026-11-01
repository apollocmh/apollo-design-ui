import { baseStylePart } from './source';

/** Compact copies in Select/Menu; base.css supplies the same neutral icon baseline. */
export const ICON_RESET =
  baseStylePart(`.apollo-icon{display:inline-flex;align-items:center;color:inherit;font-style:normal;line-height:0;text-align:center;text-transform:none;vertical-align:-0.125em;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
.apollo-icon >*{line-height:1;}
.apollo-icon svg{display:inline-block;vertical-align:inherit;}
.apollo-icon::before{display:none;}
.apollo-icon[tabindex]{cursor:pointer;}
.apollo-icon .apollo-icon-icon{display:block;}`);

export const ICON_SPIN = baseStylePart(
  '.apollo-icon-spin{animation-name:loadingCircle;animation-duration:1s;animation-iteration-count:infinite;animation-timing-function:linear;}',
);
export const ICON_SPIN_EARLY = baseStylePart(
  '.apollo-icon-spin{animation-name:apollo-icon-loading-circle;animation-duration:1s;animation-iteration-count:infinite;animation-timing-function:linear;}',
);
