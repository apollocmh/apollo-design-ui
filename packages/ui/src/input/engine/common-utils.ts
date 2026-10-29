import { Comment, isVNode, mergeProps, Text } from 'vue';

/** Rendering presence is independent of truthiness: numeric zero is content. */
export function hasContent(value: unknown): boolean {
  if (value === undefined || value === null || typeof value === 'boolean' || value === '')
    return false;
  if (Array.isArray(value)) return value.some(hasContent);
  if (isVNode(value))
    return value.type !== Comment && (value.type !== Text || hasContent(value.children));
  return true;
}

export function hasAddon(props: { addonBefore?: unknown; addonAfter?: unknown }): boolean {
  return hasContent(props.addonBefore) || hasContent(props.addonAfter);
}

export function hasPrefixSuffix(props: {
  prefix?: unknown;
  suffix?: unknown;
  allowClear?: unknown;
  showCount?: unknown;
}): boolean {
  return (
    hasContent(props.prefix) || hasContent(props.suffix) || !!props.allowClear || !!props.showCount
  );
}

/** Normalize documented DOM listener names; mergeProps preserves arrays and modifiers. */
export function nativeInputAttrs(attrs: Record<string, unknown>): Record<string, unknown> {
  let result: Record<string, unknown> = {};
  const names: Record<string, string> = {
    onKeyDown: 'onKeydown',
    onKeyUp: 'onKeyup',
    onCompositionStart: 'onCompositionstart',
    onCompositionEnd: 'onCompositionend',
    onMouseDown: 'onMousedown',
    onMouseUp: 'onMouseup',
  };
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class' || key === 'style') continue;
    const source = Object.keys(names).find(
      (name) =>
        key === name ||
        (key.startsWith(name) && /^(Once|Capture|Passive)+$/.test(key.slice(name.length))),
    );
    const name = source ? names[source] + key.slice(source.length) : key;
    result = mergeProps(result, { [name]: value });
  }
  return result;
}
