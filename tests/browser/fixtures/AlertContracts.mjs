import { createSSRApp } from 'vue';
import AlertContracts from './AlertContracts.vue';

if (__ALERT_SOURCE__) await import('./AlertContractsSourceStyles.mjs');
else {
  await import('@apollo-design/theme/tokens.css');
  await import('@apollo-design/ui/style.css');
  const { genComponentCss } = await import('@apollo-design/ui');
  const custom = document.createElement('style');
  custom.dataset.alertCustomCss = '';
  custom.textContent = genComponentCss('alert', 'audit');
  document.head.append(custom);
}
window.alertSSRRoot = document.querySelector('#alert-main');
window.alertSSRDraft = document.querySelector('#alert-draft');
createSSRApp(AlertContracts).mount('#app');
