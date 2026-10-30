/** Native back-to-top control with a reactive scroll target and owned resources. */
import { VerticalAlignTopOutlined } from '@apollo-design/icons';
import { CSSMotion } from '@apollo-design/motion';
import {
  getScroll,
  isEmptyVNode,
  throttleByAnimationFrame,
  useDevWarning,
} from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  mergeProps,
  onMounted,
  onScopeDispose,
  type PropType,
  ref,
  type SlotsType,
  shallowRef,
  watch,
} from 'vue';
import { scrollTo } from '../_internal/scroll-to';
import { useComponentConfig } from '../config-provider/context';
import type { BackTopConfig, BackTopSlots, BackTopTarget } from './interface';
import { useBackTopTheme } from './use-back-top-theme';

export default defineComponent({
  name: 'ABackTop',
  inheritAttrs: false,
  expose: ['nativeElement'],
  slots: Object as SlotsType<BackTopSlots>,
  props: {
    prefixCls: { type: String, default: undefined },
    visibilityHeight: { type: Number, default: 400 },
    duration: { type: Number, default: 450 },
    target: { type: Function as PropType<BackTopTarget>, default: undefined },
  },
  emits: { click: (_event: MouseEvent) => true },
  setup(props, { slots, attrs, emit }) {
    const config = useComponentConfig<BackTopConfig>('back-top');
    const prefixCls = computed(() => config.getPrefixCls('back-top', props.prefixCls));
    const rootPrefixCls = computed(() => config.getPrefixCls());
    const theme = useBackTopTheme(() => prefixCls.value);
    const warning = useDevWarning('BackTop');
    warning.deprecated(true, 'BackTop', 'FloatButton.BackTop');

    const visible = ref(props.visibilityHeight === 0);
    const rootRef = shallowRef<HTMLButtonElement | null>(null);

    const getTarget = () =>
      props.target ? props.target() : (rootRef.value?.ownerDocument ?? document);
    let currentContainer: ReturnType<BackTopTarget> = null;
    let cancelScroll: (() => void) | undefined;
    const stopScroll = () => {
      cancelScroll?.();
      cancelScroll = undefined;
    };
    const syncVisible = () => {
      visible.value = (getScroll(currentContainer) ?? 0) >= props.visibilityHeight;
    };
    const handleScroll = throttleByAnimationFrame(syncVisible);
    const unbindScroll = () => {
      handleScroll.cancel();
      stopScroll();
      currentContainer?.removeEventListener('scroll', handleScroll);
      currentContainer = null;
    };

    // Resolve inside a watcher so stable getters follow reactive/template refs.
    // Initial binding and threshold changes calibrate synchronously (Issue #55).
    onMounted(() => {
      watch(
        getTarget,
        (container) => {
          unbindScroll();
          currentContainer = container;
          syncVisible();
          currentContainer?.addEventListener('scroll', handleScroll);
        },
        { immediate: true, flush: 'post' },
      );
    });
    watch(() => props.visibilityHeight, syncVisible);
    onScopeDispose(unbindScroll);

    const scrollToTop = (event: MouseEvent) => {
      stopScroll();
      const reducedMotion = rootRef.value?.ownerDocument.defaultView?.matchMedia?.(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      cancelScroll = scrollTo(0, {
        getContainer: () => currentContainer,
        duration: reducedMotion || !theme.motion.value ? 0 : props.duration,
      });
      emit('click', event);
    };

    const renderBackTop = () => {
      const custom = slots.default?.();
      const hasContent = !slots.default || !isEmptyVNode(custom);
      const rootProps = mergeProps(
        {
          ref: rootRef,
          class: [
            prefixCls.value,
            config.className,
            { [`${prefixCls.value}-rtl`]: config.direction === 'rtl' },
          ],
          style: [theme.styles.value, config.style],
          'aria-label': slots.default ? undefined : 'Back to top',
        },
        attrs,
        { type: 'button', hidden: !visible.value || !hasContent, onClick: scrollToTop },
      );

      return h('button', rootProps, [
        h(
          CSSMotion,
          { visible: visible.value, motionName: `${rootPrefixCls.value}-fade` },
          {
            default: ({ className }: { className: string }) =>
              slots.default
                ? h(
                    'span',
                    { class: [className, `${prefixCls.value}-custom`] },
                    Array.isArray(custom) ? custom : [custom],
                  )
                : h('span', { class: [className, `${prefixCls.value}-content`] }, [
                    h('span', { class: `${prefixCls.value}-icon`, 'aria-hidden': 'true' }, [
                      h(VerticalAlignTopOutlined),
                    ]),
                  ]),
          },
        ),
      ]);
    };
    return {
      get nativeElement() {
        return rootRef.value;
      },
      renderBackTop,
    };
  },
  render() {
    return this.renderBackTop();
  },
});
