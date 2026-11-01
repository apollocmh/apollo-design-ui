import type { ComponentResolverObject } from 'unplugin-vue-components';
import { componentImports } from './component-imports';
import { componentStyles } from './style-manifest';

export interface ApolloResolverOptions {
  /** Import structural component CSS. Applications load their theme explicitly. @default true */
  importStyle?: boolean;
}

/** Resolve Apollo's explicit A-prefixed public component names at build time. */
export function ApolloResolver(options: ApolloResolverOptions = {}): ComponentResolverObject {
  return {
    type: 'component',
    resolve(name) {
      const component = componentImports.get(name);
      if (!component) return;
      return {
        name: component.name,
        from: `@apollo-design/ui/${component.path}`,
        sideEffects:
          options.importStyle === false || !component.style
            ? undefined
            : componentStyles(component.style),
      };
    },
  };
}
