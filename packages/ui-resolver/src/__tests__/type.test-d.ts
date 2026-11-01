import type { ComponentResolverObject } from 'unplugin-vue-components';
import { expectTypeOf } from 'vitest';
import { ApolloResolver, type ApolloResolverOptions } from '../index';

expectTypeOf(ApolloResolver()).toEqualTypeOf<ComponentResolverObject>();
const options: ApolloResolverOptions = { importStyle: false };
ApolloResolver(options);
// @ts-expect-error Automatic styles use a boolean, not a theme name.
ApolloResolver({ importStyle: 'mono' });
// @ts-expect-error Theme selection belongs to the application, never the resolver.
ApolloResolver({ theme: 'default' });
// @ts-expect-error Resolver naming is explicit; an arbitrary prefix is not supported.
ApolloResolver({ prefix: 'X' });
