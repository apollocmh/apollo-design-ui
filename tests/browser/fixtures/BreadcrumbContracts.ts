import { createApp, createSSRApp } from 'vue';
import Audit from './BreadcrumbContracts.vue';

export { Audit };

if (typeof document !== 'undefined') {
  const hydrate = new URLSearchParams(location.search).has('hydrate');
  (hydrate ? createSSRApp(Audit) : createApp(Audit)).mount('#app');
}
