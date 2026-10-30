import { useZIndex, ZINDEX_KEY, type ZIndexConsumer } from '@apollo-design/portal';
import { inject } from 'vue';

function numericZIndex(value: number | string | undefined): number | undefined {
  if (value === undefined || (typeof value === 'string' && !value.trim())) return undefined;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

/** A consumer's numeric context starts at its own CSS base only at the top level. */
export function useConsumerZIndex(
  componentType: ZIndexConsumer,
  customZIndex: () => number | string | undefined,
  cssZIndex: () => number | string,
) {
  const parent = inject(ZINDEX_KEY, null);
  return useZIndex(componentType, () => {
    const custom = customZIndex();
    // CSS expressions keep their style value and the existing numeric path.
    if (custom !== undefined) return numericZIndex(custom);
    return parent?.value === undefined ? numericZIndex(cssZIndex()) : undefined;
  });
}
