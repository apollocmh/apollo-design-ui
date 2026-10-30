/** Reactive BackTop visibility/progress with resources owned by the current target. */
import { getScroll, isDocument, isWindow, throttleByAnimationFrame } from '@apollo-design/utils';
import {
  type MaybeRefOrGetter,
  onMounted,
  onScopeDispose,
  type Ref,
  ref,
  shallowRef,
  toValue,
  watch,
} from 'vue';

type ScrollTarget = HTMLElement | Window | Document;
interface ScrollOptions {
  getTarget: () => ScrollTarget | null;
  showProgress: MaybeRefOrGetter<boolean>;
  visibilityHeight: MaybeRefOrGetter<number>;
  onTargetChange?: () => void;
}

function progress(target: ScrollTarget | null): number {
  if (!target) return 0;
  const element = isWindow(target)
    ? target.document.documentElement
    : isDocument(target)
      ? target.documentElement
      : target;
  const maximum = Math.max(element.scrollHeight - element.clientHeight, 0);
  return maximum > 0 ? Math.min(Math.max((getScroll(target) ?? 0) / maximum, 0), 1) : 0;
}

export function useScroll(options: ScrollOptions): {
  scrollProgress: Ref<number>;
  visible: Ref<boolean>;
  currentTarget: Readonly<Ref<ScrollTarget | null>>;
} {
  const visible = ref(toValue(options.visibilityHeight) === 0);
  const scrollProgress = ref(0);
  const currentTarget = shallowRef<ScrollTarget | null>(null);
  let view: Window | null = null;
  const sync = () => {
    visible.value = (getScroll(currentTarget.value) ?? 0) >= toValue(options.visibilityHeight);
    scrollProgress.value = toValue(options.showProgress) ? progress(currentTarget.value) : 0;
  };
  const onScroll = throttleByAnimationFrame(sync);
  const onResize = throttleByAnimationFrame(sync);
  const unbind = () => {
    onScroll.cancel();
    onResize.cancel();
    currentTarget.value?.removeEventListener('scroll', onScroll);
    view?.removeEventListener('resize', onResize);
    options.onTargetChange?.();
    currentTarget.value = null;
    view = null;
  };
  onMounted(() =>
    watch(
      options.getTarget,
      (target) => {
        unbind();
        currentTarget.value = target;
        view = target
          ? isWindow(target)
            ? target
            : isDocument(target)
              ? target.defaultView
              : target.ownerDocument.defaultView
          : null;
        sync();
        currentTarget.value?.addEventListener('scroll', onScroll);
        view?.addEventListener('resize', onResize);
      },
      { immediate: true, flush: 'post' },
    ),
  );
  watch([() => toValue(options.showProgress), () => toValue(options.visibilityHeight)], sync);
  onScopeDispose(unbind);
  return { scrollProgress, visible, currentTarget };
}
export default useScroll;
