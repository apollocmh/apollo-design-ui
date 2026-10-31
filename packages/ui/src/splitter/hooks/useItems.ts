import type { VNode } from 'vue';
import type { ShowCollapsibleIconMode, SplitterPanelProps } from '../interface';

export interface NormalizedCollapsible {
  start: boolean;
  end: boolean;
  showCollapsibleIcon: ShowCollapsibleIconMode;
}

export type PanelKey = NonNullable<VNode['key']>;

export interface SplitterItem
  extends Pick<
    SplitterPanelProps,
    'min' | 'max' | 'size' | 'defaultSize' | 'resizable' | 'destroyOnHidden'
  > {
  key: PanelKey;
  node: VNode;
  collapsible: NormalizedCollapsible;
}

export function getCollapsible(collapsible: unknown): NormalizedCollapsible {
  if (typeof collapsible === 'object' && collapsible !== null && !Array.isArray(collapsible)) {
    const mode = 'showCollapsibleIcon' in collapsible ? collapsible.showCollapsibleIcon : undefined;
    return {
      start: 'start' in collapsible && collapsible.start === true,
      end: 'end' in collapsible && collapsible.end === true,
      showCollapsibleIcon: typeof mode === 'boolean' || mode === 'auto' ? mode : 'auto',
    };
  }
  const enabled = collapsible === true || collapsible === '' || collapsible === 'collapsible';
  return { start: enabled, end: enabled, showCollapsibleIcon: 'auto' };
}

const booleanProp = (value: unknown, name: string): boolean | undefined =>
  value === undefined ? undefined : value === true || value === '' || value === name;

const sizeProp = (value: unknown): number | string | undefined =>
  typeof value === 'number' || typeof value === 'string' ? value : undefined;

/** Only called during Splitter render, with the current complete Panel VNodes. */
export function getItems(children: VNode[], unkeyed: symbol[]): SplitterItem[] {
  return children.map((node, index) => {
    const props: Record<string, unknown> = node.props ?? {};
    let key = node.key ?? unkeyed[index];
    if (key === undefined) {
      key = Symbol(`panel-${index}`);
      unkeyed[index] = key;
    }
    return {
      min: sizeProp(props.min),
      max: sizeProp(props.max),
      size: sizeProp(props.size),
      defaultSize: sizeProp(props.defaultSize ?? props['default-size']),
      destroyOnHidden: booleanProp(
        props.destroyOnHidden ?? props['destroy-on-hidden'],
        'destroy-on-hidden',
      ),
      resizable: booleanProp(props.resizable, 'resizable'),
      node,
      key,
      collapsible: getCollapsible(props.collapsible),
    };
  });
}
