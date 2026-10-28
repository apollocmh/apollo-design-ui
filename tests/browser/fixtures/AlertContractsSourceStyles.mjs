/** Source CSS is isolated from the published branch. */
import {
  compactAlgorithm,
  darkAlgorithm,
  getCSSVarDeclarations,
  getDesignToken,
} from '@apollo-design/theme';
import { genAlertStyle } from '../../../packages/ui/src/alert/style/index.ts';
import { genAllStyles } from '../../../packages/ui/src/style/index.ts';

const style = document.createElement('style');
style.dataset.alertSourceCss = '';
style.textContent = [
  getCSSVarDeclarations(getDesignToken()),
  ...[
    ['dark', darkAlgorithm],
    ['compact', compactAlgorithm],
    ['dark-compact', [darkAlgorithm, compactAlgorithm]],
  ].map(([name, algorithm]) =>
    getCSSVarDeclarations(getDesignToken({ algorithm }), {
      selector: `[data-apollo-theme="${name}"]`,
    }),
  ),
  genAllStyles(),
  genAlertStyle('audit'),
].join('\n');
document.head.append(style);
