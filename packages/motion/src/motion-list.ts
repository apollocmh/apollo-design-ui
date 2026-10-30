import {
  type Component,
  defineComponent,
  h,
  type PropType,
  type SetupContext,
  type SlotsType,
  shallowRef,
  type VNode,
  type VNodeChild,
  watch,
} from 'vue';
import { CSSMotion, type CSSMotionProps, type CSSMotionSlotProps, motionProps } from './css-motion';
import {
  diffKeys,
  type KeyEntityOf,
  type KeyObject,
  type KeyObjectOf,
  parseKeys,
  STATUS_ADD,
  STATUS_REMOVE,
  STATUS_REMOVED,
  wrapKeyToObject,
} from './diff';

export interface MotionListProps<T = unknown> extends Omit<CSSMotionProps, 'visible'> {
  keys?: readonly T[];
  component?: string | Component | false | null;
  onAllRemoved?: () => void;
}
export type MotionListSlotProps<T = unknown> = KeyObject &
  CSSMotionSlotProps & {
    itemKey: string;
    index: number;
  } & (T extends { key: unknown }
    ? Omit<T, keyof CSSMotionSlotProps | 'key' | 'itemKey' | 'index'>
    : object);
export interface MotionListSlots<T = unknown> {
  default?: (scope: MotionListSlotProps<T>) => VNodeChild;
}

const emits = { allRemoved: () => true, visibleChanged: (_visible: boolean) => true };

/** Match the real normalization/spread order, including reserved motion fields. */
function itemScope<T>(
  source: KeyObjectOf<T>,
  motion: CSSMotionSlotProps,
  key: string,
  index: number,
): MotionListSlotProps<T>;
function itemScope(
  source: KeyObject,
  motion: CSSMotionSlotProps,
  key: string,
  index: number,
): MotionListSlotProps {
  return { ...source, ...motion, key, itemKey: key, index };
}

const runtimeProps = {
  keys: { type: Array, default: () => [] },
  component: {
    type: [String, Object, Function, Boolean] as PropType<string | Component | false | null>,
    default: 'div',
  },
  ...motionProps,
};

const MotionListCore = Object.assign(
  defineComponent(
    <T>(
      props: MotionListProps<T>,
      { slots, emit, attrs }: SetupContext<typeof emits, SlotsType<MotionListSlots<T>>>,
    ) => {
      // Store the typed shallow snapshot alongside its normalized key. Retiring keys
      // keep this snapshot; never recover their data from the current key list.
      type Source = { key: string; source: KeyObjectOf<T> };
      type Retained = KeyEntityOf<Source>;
      const sources = (): Source[] =>
        (props.keys ?? []).map((input) => {
          const source = wrapKeyToObject(input);
          return { key: source.key, source };
        });
      const entities = shallowRef<Retained[]>(
        parseKeys(sources()).map((item) => ({ ...item, status: STATUS_ADD })),
      );
      watch(
        () => props.keys,
        () => {
          const previous = entities.value;
          entities.value = diffKeys<Source>(previous, sources()).filter(
            (entity) =>
              !(
                entity.status === STATUS_REMOVE &&
                previous.some((item) => item.key === entity.key && item.status === STATUS_REMOVED)
              ),
          );
        },
        { deep: true },
      );
      const markRemoved = (key: string): void => {
        const entity = entities.value.find((item) => item.key === key);
        if (!entity || entity.status !== STATUS_REMOVE) return;
        entities.value = entities.value.map((item) =>
          item.key === key ? { ...item, status: STATUS_REMOVED } : item,
        );
        if (entities.value.every((item) => item.status === STATUS_REMOVED)) emit('allRemoved');
      };
      return () => {
        const children = entities.value.map((entity, index) => {
          if (entity.status === STATUS_REMOVED) return null;
          return h(
            CSSMotion,
            {
              key: entity.key,
              visible: entity.status !== STATUS_REMOVE,
              motionName: props.motionName,
              motionAppear: props.motionAppear,
              motionEnter: props.motionEnter,
              motionLeave: props.motionLeave,
              motionLeaveImmediately: props.motionLeaveImmediately,
              motionDeadline: props.motionDeadline,
              removeOnLeave: props.removeOnLeave,
              forceRender: props.forceRender,
              leavedClassName: props.leavedClassName,
              supportMotion: props.supportMotion,
              hooks: props.hooks,
              onVisibleChanged: (visible) => {
                emit('visibleChanged', visible);
                if (!visible) markRemoved(entity.key);
              },
            },
            {
              default: (scope: CSSMotionSlotProps) =>
                slots.default?.(itemScope<T>(entity.source, scope, entity.key, index)),
            },
          );
        });
        // A fragment has no native attr target. Bind per-item attrs in its slot.
        if (!props.component) return children;
        return typeof props.component === 'string'
          ? h(props.component, attrs, children)
          : h(props.component, attrs, { default: () => children });
      };
    },
    { name: 'MotionListCore', inheritAttrs: false, emits },
  ),
  { props: Object.keys(runtimeProps) },
);

type MotionListContext<T> = Pick<
  SetupContext<typeof emits, SlotsType<MotionListSlots<T>>>,
  'attrs' | 'slots' | 'emit'
>;
type MotionListVNode<T> = VNode & {
  /** Vue language-core's native generic-component context projection. */
  __ctx?: {
    props: MotionListProps<T>;
    slots: MotionListContext<T>['slots'];
    emit: MotionListContext<T>['emit'];
    attrs: MotionListContext<T>['attrs'];
  };
};

function renderMotionList<T>(
  props: MotionListProps<T>,
  { attrs, slots, emit }: MotionListContext<T>,
): MotionListVNode<T> {
  return h(
    MotionListCore<T>,
    {
      ...attrs,
      ...props,
      onAllRemoved: () => emit('allRemoved'),
      onVisibleChanged: (visible: boolean) => emit('visibleChanged', visible),
    },
    slots,
  );
}

// Keep the true callable public contract; attach the one runtime schema to the
// actual function without letting its defaulted fields redefine public Props.
export const MotionList: typeof renderMotionList = Object.assign(renderMotionList, {
  props: runtimeProps,
  emits,
  inheritAttrs: false,
  displayName: 'MotionList',
});
