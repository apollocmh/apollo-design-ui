import { createSSRApp } from 'vue';
import TimelineContracts from './TimelineContracts.vue';

if (__TIMELINE_SOURCE__) {
  await import('./TimelineContractsSourceStyles.mjs');
} else {
  await import('@apollo-design/theme/tokens.css');
  await import('@apollo-design/ui/style.css');
}
window.timelineSSRRoot = document.querySelector('#timeline-audit');
createSSRApp(TimelineContracts).mount('#app');
