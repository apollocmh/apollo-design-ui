import { contractOf, type DomContractOptions, domContractTest } from '@apollo-design/test-utils';
import { expect } from 'vitest';
import { mountCase, resolveRenderable } from '../../../../test-utils/src/render';

interface InputReference {
  html: string;
  diff: readonly string[];
}

/** Keep the original oracle and compare every node behind the intentional host additions. */
export function inputContractReference(
  name: string,
  options: DomContractOptions,
  references: Readonly<Record<string, InputReference>>,
): void {
  const allow = { ...options.allow };
  for (const [id, reference] of Object.entries(references)) {
    if (!options.baseline.cases?.some((item) => item.id === id))
      throw new Error(`Unknown Input reference ${id}`);
    allow[id] = {
      reason: `${options.allow?.[id]?.reason ?? ''} ADR0007: stable Vue hosts preserve the editor; native buttons retain accessible names and disabled state. The original oracle is unchanged, exact differences are listed, and a second full physical tree assertion covers every descendant. See docs/migrations/input-contracts.md.`,
      diff: reference.diff,
    };
  }
  domContractTest(name, {
    ...options,
    allow,
    render: (id) => {
      const result = options.render(id);
      const mounted =
        typeof result === 'string'
          ? null
          : mountCase(() => resolveRenderable(result, `Input reference ${id}`));
      let html: string;
      try {
        html = typeof result === 'string' ? result : (mounted?.html() ?? '');
      } finally {
        mounted?.destroy();
      }
      const reference = references[id];
      if (reference) {
        const projection = {
          profile: options.profile ?? 'contract',
          keepStyle: options.keepStyle,
          ignoreAttrs: options.ignoreAttrs,
          dropCssInJsClasses: options.dropCssInJsClasses,
        };
        expect(contractOf(html, projection), `${id}: full Apollo physical DOM`).toEqual(
          contractOf(reference.html, projection),
        );
      }
      return html;
    },
  });
}
