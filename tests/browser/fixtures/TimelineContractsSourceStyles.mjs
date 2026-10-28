/** Included only by the explicit source browser mode. */
import { getCSSVarDeclarations, getDesignToken } from '@apollo-design/theme';
import { genStepsStyle } from '../../../packages/ui/src/steps/style/index.ts';
import { genTimelineStyle } from '../../../packages/ui/src/timeline/style/index.ts';

const style = document.createElement('style');
style.dataset.timelineSourceCss = '';
style.textContent = `${getCSSVarDeclarations(getDesignToken())}\n${genStepsStyle()}\n${genTimelineStyle('apollo')}`;
document.head.append(style);
