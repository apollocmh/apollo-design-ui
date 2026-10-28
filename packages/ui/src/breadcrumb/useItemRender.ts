import { isRenderable, pickAttrs } from '@apollo-design/utils';
import { Comment, Fragment, h, isVNode, Text, type VNodeChild } from 'vue';
import type { BreadcrumbItemInput, BreadcrumbParams } from './interface';

/** Replace literal complete parameter names; absent/null values keep their placeholder. */
export function substituteParams(text: string, params: BreadcrumbParams): string {
  const names = Object.keys(params)
    .filter((name) => name.length > 0)
    .sort((a, b) => b.length - a.length)
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (names.length === 0) return text;
  return text.replace(new RegExp(`:(${names.join('|')})(?![\\w])`, 'g'), (match, key: string) => {
    const value = params[key];
    return value === undefined || value === null ? match : String(value);
  });
}

/** VNode/array content is never stringified or traversed to replace text. */
export function getBreadcrumbName(item: BreadcrumbItemInput, params: BreadcrumbParams): VNodeChild {
  return typeof item.title === 'string' ? substituteParams(item.title, params) : item.title;
}

/** A missing/empty decorative separator should not create a list item. */
export function hasBreadcrumbContent(content: VNodeChild): boolean {
  if (Array.isArray(content)) return content.some(hasBreadcrumbContent);
  if (isVNode(content)) {
    if (content.type === Comment) return false;
    if (content.type === Text) return content.children !== '';
    if (content.type === Fragment) {
      return Array.isArray(content.children)
        ? content.children.some((child) => hasBreadcrumbContent(child))
        : content.children !== null;
    }
    return true;
  }
  return isRenderable(content);
}

/** Data attrs belong to default content; custom itemRender slots own their own content attrs. */
export function renderItem(
  prefixCls: string,
  item: BreadcrumbItemInput,
  content: VNodeChild,
  href?: string,
): VNodeChild {
  if (!isRenderable(content)) return null;
  const attributes = {
    ...pickAttrs(item, { data: true, aria: true }),
    class: [`${prefixCls}-link`, item.className],
    style: item.style,
    onClick: item.onClick,
  };
  return href === undefined
    ? item.onClick
      ? h('button', { ...attributes, type: 'button' }, [content])
      : h('span', attributes, [content])
    : h('a', { ...attributes, href }, [content]);
}
