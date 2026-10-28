/** Source-only browser evidence. Published runs import the actual CSS exports instead. */
import { getCSSVarDeclarations, getDesignToken } from '@apollo-design/theme';
import { genBreadcrumbStyle, genDropdownStyle, genMenuStyle } from '@apollo-design/ui';

const style = document.createElement('style');
style.dataset.breadcrumbSourceStyles = '';
style.textContent = [
  getCSSVarDeclarations(getDesignToken()),
  genBreadcrumbStyle('apollo'),
  genDropdownStyle('apollo'),
  genMenuStyle('apollo'),
].join('\n');
document.head.appendChild(style);
