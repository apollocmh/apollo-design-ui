/** Real demos need the same reset and related component styles as the library. */
import { getCSSVarDeclarations, getDesignToken } from '@apollo-design/theme';
import { genAllStyles } from '../../../packages/ui/src/style/index.ts';

const style = document.createElement('style');
style.dataset.timelineSourceCss = '';
style.textContent = `${getCSSVarDeclarations(getDesignToken())}\n${genAllStyles()}`;
document.head.append(style);
