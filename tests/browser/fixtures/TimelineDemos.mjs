import { createApp } from 'vue';
import TimelineDemos from './TimelineDemos.vue';

if (__TIMELINE_SOURCE__) {
  await import('./TimelineDemosSourceStyles.mjs');
} else {
  await import('@apollo-design/theme/tokens.css');
  await import('@apollo-design/ui/style.css');
}
createApp(TimelineDemos).mount('#app');
