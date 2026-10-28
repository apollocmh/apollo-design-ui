/** Shared native link defaults, moved from the former Select reset.
 * Colors, decoration and keyboard focus consume the existing theme aliases.
 * Source: the existing Ant Design 6.6.4-derived static Select rules.
 */
export function genLinkReset(): string {
  return `a{color:var(--apollo-color-link);text-decoration:var(--apollo-link-decoration);background-color:transparent;outline:none;cursor:pointer;transition:color var(--apollo-motion-duration-slow);-webkit-text-decoration-skip:objects;}
a:hover{color:var(--apollo-color-link-hover);}
a:active{color:var(--apollo-color-link-active);}
a:active,a:hover{text-decoration:var(--apollo-link-hover-decoration);outline:0;}
a:focus{text-decoration:var(--apollo-link-focus-decoration);outline:0;}
a:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
a[disabled]{color:var(--apollo-color-text-disabled);cursor:not-allowed;}`;
}
