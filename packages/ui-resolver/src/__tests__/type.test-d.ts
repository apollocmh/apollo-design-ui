import type { ComponentResolverObject } from 'unplugin-vue-components';
import { describe, expectTypeOf, it } from 'vitest';
import { ApolloResolver, type ApolloResolverOptions } from '../index';

describe('ApolloResolver public types', () => {
  it('returns the native component resolver contract', () => {
    expectTypeOf(ApolloResolver()).toEqualTypeOf<ComponentResolverObject>();
  });

  it('accepts the documented style option', () => {
    const options: ApolloResolverOptions = { importStyle: false };
    expectTypeOf(ApolloResolver(options)).toEqualTypeOf<ComponentResolverObject>();
  });

  it('rejects theme selection and unsupported naming options', () => {
    const invalidOptions = () => {
      // @ts-expect-error Automatic styles use a boolean, not a theme name.
      ApolloResolver({ importStyle: 'mono' });
      // @ts-expect-error Theme selection belongs to the application, never the resolver.
      ApolloResolver({ theme: 'default' });
      // @ts-expect-error Resolver naming is explicit; an arbitrary prefix is not supported.
      ApolloResolver({ prefix: 'X' });
    };
    expectTypeOf(invalidOptions).toEqualTypeOf<() => void>();
  });
});
