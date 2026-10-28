import { getCSSVarDeclarations, getDesignToken } from '@apollo-design/theme';
import { genBreadcrumbStyle, genDropdownStyle, genMenuStyle } from '@apollo-design/ui';
import { createApp, createSSRApp } from 'vue';
import Audit from './BreadcrumbContracts.vue';

export { Audit };

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = [
    getCSSVarDeclarations(getDesignToken()),
    genBreadcrumbStyle('apollo'),
    genDropdownStyle('apollo'),
    genMenuStyle('apollo'),
    'body{margin:0}main{min-height:100vh;padding:24px;box-sizing:border-box}nav{margin-bottom:24px!important}input{width:80px}',
  ].join('\n');
  document.head.appendChild(style);
  const hydrate = new URLSearchParams(location.search).has('hydrate');
  (hydrate ? createSSRApp(Audit) : createApp(Audit)).mount('#app');
}
