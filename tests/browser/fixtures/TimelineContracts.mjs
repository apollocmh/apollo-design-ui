import { getCSSVarDeclarations, getDesignToken } from '@apollo-design/theme';
import { createSSRApp } from 'vue';
import { genStepsStyle } from '../../../packages/ui/src/steps/style/index.ts';
import { genTimelineStyle } from '../../../packages/ui/src/timeline/style/index.ts';
import TimelineContracts from './TimelineContracts.vue';

if (__TIMELINE_SOURCE__) {
  const style = document.createElement('style');
  style.textContent = `${getCSSVarDeclarations(getDesignToken())}\n${genStepsStyle()}\n${genTimelineStyle('apollo')}`;
  document.head.append(style);
} else {
  await import('@apollo-design/theme/tokens.css');
  await import('@apollo-design/ui/style.css');
}
window.timelineSSRRoot = document.querySelector('#timeline-audit');
createSSRApp(TimelineContracts).mount('#app');
