/** Native watermark drawing, panel inheritance and tamper recovery. */

import { type AliasToken, getDesignToken, useToken } from '@apollo-design/theme';
import { observeMutation } from '@apollo-design/utils';
import {
  type ComponentObjectPropsOptions,
  type CSSProperties,
  computed,
  defineComponent,
  h,
  mergeProps,
  normalizeStyle,
  onMounted,
  onScopeDispose,
  type PropType,
  provide,
  ref,
  type SlotsType,
  shallowRef,
  watch,
} from 'vue';
import { type ComponentStyleConfig, useComponentConfig } from '../config-provider/context';
import { useWatermarkContext, type WatermarkContextValue, watermarkContextKey } from './context';
import type { WatermarkFont, WatermarkProps, WatermarkSlots } from './interface';
import { FontGap, getClips } from './use-clips';
import { useRafDebounce } from './use-raf-debounce';
import { useSingletonCache } from './use-singleton-cache';
import { useWatermark } from './use-watermark';
import { getContentLines, getPixelRatio, reRendering, setCanvasFont } from './utils';

const DEFAULT_GAP_X = 100;
const DEFAULT_GAP_Y = 100;
const WATERMARK_Z_INDEX_OFFSET = 1;

/** 容器默认样式；合法的 Provider 与原生 style 覆盖同样用于防篡改回写。 */
const fixedStyle = {
  position: 'relative',
  overflow: 'hidden',
} satisfies CSSProperties;

type PairMetadata = Pick<
  Exclude<
    ComponentObjectPropsOptions<{ value: [number, number] }>['value'],
    PropType<[number, number]> | null | undefined
  >,
  'type' | 'default' | 'validator'
>;

const pairProp: PairMetadata = {
  type: null,
  default: undefined,
  validator: (value: unknown) =>
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((item: unknown) => typeof item === 'number'),
};

export default defineComponent({
  name: 'AWatermark',
  inheritAttrs: false,
  slots: Object as SlotsType<WatermarkSlots>,
  emits: { remove: () => true },
  props: {
    zIndex: { type: Number, default: undefined },
    rotate: { type: Number, default: -22 },
    width: { type: Number, default: undefined },
    height: { type: Number, default: undefined },
    image: { type: String, default: undefined },
    content: {
      type: [String, Object, Array] as PropType<WatermarkProps['content']>,
      default: undefined,
    },
    font: { type: Object as PropType<WatermarkFont>, default: () => ({}) },
    gap: pairProp,
    offset: pairProp,
    inherit: { type: Boolean, default: true },
  },
  setup(props, { attrs, expose, slots, emit }) {
    const context = useComponentConfig<ComponentStyleConfig>('watermark');

    const token = useToken();

    // Native attrs are read during render and mutation recovery, so replacement/removal stays current.
    const rootStyle = () => normalizeStyle([fixedStyle, context.style, attrs.style]);

    // 运行时 token：canvas 需要**实值**（CSS 变量进不了 canvas）。
    // 无 ThemeProvider 时回退默认 token（getDesignToken() 纯函数）。
    const resolvedToken = computed<AliasToken>(() => token.value ?? getDesignToken());

    const mergedZIndex = computed(
      () => props.zIndex ?? resolvedToken.value.zIndexPopupBase - WATERMARK_Z_INDEX_OFFSET,
    );

    const mergedFont = computed<Required<WatermarkFont>>(() => {
      const font = props.font ?? {};
      return {
        color: font.color ?? resolvedToken.value.colorFill,
        fontSize: font.fontSize ?? resolvedToken.value.fontSizeLG,
        fontWeight: font.fontWeight ?? 'normal',
        fontStyle: font.fontStyle ?? 'normal',
        fontFamily: font.fontFamily ?? 'sans-serif',
        textAlign: font.textAlign ?? 'center',
      };
    });

    const contentLines = computed(() => getContentLines(props.content, mergedFont.value));

    const gapX = computed(() => props.gap?.[0] ?? DEFAULT_GAP_X);
    const gapY = computed(() => props.gap?.[1] ?? DEFAULT_GAP_Y);
    const gapXCenter = computed(() => gapX.value / 2);
    const gapYCenter = computed(() => gapY.value / 2);
    const offsetLeft = computed(() => props.offset?.[0] ?? gapXCenter.value);
    const offsetTop = computed(() => props.offset?.[1] ?? gapYCenter.value);

    const markStyle = computed<Record<string, string | number>>(() => {
      const mergedMarkStyle: Record<string, string | number> = {
        zIndex: mergedZIndex.value,
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        backgroundRepeat: 'repeat',
      };
      /** Calculate the style of the offset */
      let positionLeft = offsetLeft.value - gapXCenter.value;
      let positionTop = offsetTop.value - gapYCenter.value;
      if (positionLeft > 0) {
        mergedMarkStyle.left = `${positionLeft}px`;
        mergedMarkStyle.width = `calc(100% - ${positionLeft}px)`;
        positionLeft = 0;
      }
      if (positionTop > 0) {
        mergedMarkStyle.top = `${positionTop}px`;
        mergedMarkStyle.height = `calc(100% - ${positionTop}px)`;
        positionTop = 0;
      }
      mergedMarkStyle.backgroundPosition = `${positionLeft}px ${positionTop}px`;
      return mergedMarkStyle;
    });

    // ========================== Container ==============================
    const container = shallowRef<HTMLDivElement | null>(null);
    expose({
      get nativeElement() {
        return container.value;
      },
    });

    // Keep the injected service stable while moving registered panels between current owners.
    const parentWatermark = useWatermarkContext();
    const subElements = shallowRef<Set<HTMLElement>>(new Set());
    /** `inherit=false` 期间交给父级托管的那批（翻转时用于精确搬运）。 */
    const delegatedElements = new Set<HTMLElement>();

    const ownAdd = (ele: HTMLElement): void => {
      const clone = new Set(subElements.value);
      clone.add(ele);
      subElements.value = getSizeDiff(subElements.value, clone);
    };
    const ownRemove = (ele: HTMLElement | null): void => {
      removeWatermark(ele);
      const clone = new Set(subElements.value);
      if (ele) {
        clone.delete(ele);
      }
      subElements.value = getSizeDiff(subElements.value, clone);
    };

    const targetElements = computed<HTMLElement[]>(() => {
      const list = container.value ? [container.value] : [];
      return [...list, ...Array.from(subElements.value)];
    });

    const watermarkContext: WatermarkContextValue = {
      add: (ele: HTMLElement) => {
        if (!props.inherit) {
          // 本层不暴露给子孙 ⇒ 登记交给父级（无父级时是默认空实现，即「谁都不管」）
          parentWatermark.add(ele);
          delegatedElements.add(ele);
          return;
        }
        ownAdd(ele);
      },
      remove: (ele: HTMLElement | null) => {
        ownRemove(ele);
        if (ele && delegatedElements.delete(ele)) {
          parentWatermark.remove(ele);
        }
      },
    };
    provide(watermarkContextKey, watermarkContext);

    watch(
      () => props.inherit,
      (inherit) => {
        if (inherit) {
          for (const ele of Array.from(delegatedElements)) {
            delegatedElements.delete(ele);
            parentWatermark.remove(ele);
            ownAdd(ele);
          }
        } else {
          for (const ele of Array.from(subElements.value)) {
            ownRemove(ele);
            parentWatermark.add(ele);
            delegatedElements.add(ele);
          }
        }
      },
    );

    // ============================ Content ==============================
    const getMarkSize = (ctx: CanvasRenderingContext2D): [number, number] => {
      let defaultWidth = 120;
      let defaultHeight = 64;
      if (!props.image && ctx.measureText) {
        if (contentLines.value.length) {
          const sizes = contentLines.value.map(({ text, font: lineFont }) => {
            setCanvasFont(ctx, lineFont);
            const metrics = ctx.measureText(text);
            return [
              metrics.width,
              metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent,
            ] as const;
          });
          defaultWidth = Math.ceil(Math.max(...sizes.map((size) => size[0])));
          defaultHeight =
            Math.ceil(sizes.reduce((total, size) => total + size[1], 0)) +
            (contentLines.value.length - 1) * FontGap;
        } else {
          defaultWidth = 0;
          defaultHeight = 0;
        }
      }
      return [props.width ?? defaultWidth, props.height ?? defaultHeight];
    };

    const getClipsCache = useSingletonCache<unknown, [string, number, number]>();
    const watermarkInfo = ref<[string, number] | null>(null);

    /**
     * 竞态守卫（Issue #42）：`img.onload` / `img.onerror` 是**异步**的 ——
     * 换图 A→B 时 A 可能晚于 B 完成，而 A 的 `drawCanvas` 会把已经画好的 B
     * 顶回 A（几何参数也变了的时候缓存不命中，就会真的重绘 ⇒ 可见）。
     *
     * 每次 `renderWatermark` 领一个 id，**只有最新一次**能提交结果；
     * 卸载时把 id 作废 ⇒ 在途回调不再写 `watermarkInfo` / 不再碰 DOM。
     */
    let renderId = 0;
    let disposed = false;
    let pendingImage: HTMLImageElement | undefined;
    const releaseImage = () => {
      if (pendingImage) {
        pendingImage.onload = null;
        pendingImage.onerror = null;
        pendingImage = undefined;
      }
    };
    const invalidate = () => {
      renderId += 1;
      releaseImage();
    };
    onScopeDispose(() => {
      disposed = true;
      invalidate();
    });

    const renderWatermark = () => {
      renderId += 1;
      const id = renderId;
      const ownerDocument = container.value?.ownerDocument;
      if (!ownerDocument || disposed) return;
      const canvas = ownerDocument.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const ratio = getPixelRatio();
        const imageSource = props.image;
        const lines = contentLines.value;
        const [markWidth, markHeight] = getMarkSize(ctx);
        const drawCanvas = (drawContent: HTMLImageElement | typeof contentLines.value) => {
          // 旧版本 / 已卸载 ⇒ 丢弃这次结果
          if (disposed || id !== renderId) {
            return;
          }
          const params = [
            Array.isArray(drawContent) ? drawContent : imageSource,
            props.rotate,
            ratio,
            markWidth,
            markHeight,
            gapX.value,
            gapY.value,
          ];
          const [nextClips, clipWidth] = getClipsCache(params, () =>
            getClips(
              drawContent,
              props.rotate ?? -22,
              ratio,
              markWidth,
              markHeight,
              gapX.value,
              gapY.value,
            ),
          );
          watermarkInfo.value = [nextClips, clipWidth];
        };
        if (props.image) {
          const img = ownerDocument.createElement('img');
          pendingImage = img;
          img.onload = () => {
            if (pendingImage === img) releaseImage();
            drawCanvas(img);
          };
          img.onerror = () => {
            if (pendingImage === img) releaseImage();
            drawCanvas(lines);
          };
          img.crossOrigin = 'anonymous';
          img.referrerPolicy = 'no-referrer';
          img.src = imageSource ?? '';
        } else {
          drawCanvas(contentLines.value);
        }
      }
    };
    const syncWatermark = useRafDebounce(renderWatermark);

    // ============================ Effect ===============================
    const { appendWatermark, removeWatermark, isWatermarkEle, disposeAll } = useWatermark(
      () => markStyle.value,
      () => emit('remove'),
    );

    watch([watermarkInfo, targetElements], () => {
      const info = watermarkInfo.value;
      if (info) {
        const [base64Url, markWidth] = info;
        targetElements.value.forEach((holder) => {
          appendWatermark(base64Url, markWidth, holder);
        });
      }
    });

    // ============================ Observe ==============================
    // ⚠️ 用 `@apollo-design/utils` 的 `observeMutation`（元素→回调集合的全局单例）
    //    而不是裸 `new MutationObserver`：与 image / masonry 同契约，也让 L1 能用
    //    `MockMutationObserver.instances` 确定性驱动（vitest.setup.ts 主动替换了
    //    jsdom 原生实现 —— 见 TESTING.md T5/T6）。options 与 antd 逐字一致。
    const observers = new Map<HTMLElement, () => void>();

    const onMutate = (mutations: MutationRecord[]) => {
      mutations.forEach((mutation) => {
        if (reRendering(mutation, isWatermarkEle)) {
          syncWatermark();
        } else if (mutation.target === container.value && mutation.attributeName === 'style') {
          // We've only force container not modify.
          // Not consider nest case.
          const containerStyle = container.value?.style;
          const style = rootStyle();
          if (!containerStyle || !style || typeof style === 'string') return;
          for (const key of ['position', 'overflow'] as const) {
            const expected = String(style[key] ?? '');
            const important = /\s*!important$/.test(expected);
            const value = expected.replace(/\s*!important$/, '');
            const priority = important ? 'important' : '';
            if (
              containerStyle.getPropertyValue(key) !== value ||
              containerStyle.getPropertyPriority(key) !== priority
            ) {
              containerStyle.setProperty(key, value, priority);
            }
          }
        }
      });
    };

    watch(
      targetElements,
      (els) => {
        // 重挂观察点：先摘掉已不在集合里的，再补新的（与 rc mutate-observer 同语义）
        for (const [el, dispose] of observers) {
          if (!els.includes(el)) {
            dispose();
            observers.delete(el);
          }
        }
        for (const el of els) {
          if (!observers.has(el)) {
            const dispose = observeMutation(el, onMutate, {
              childList: true,
              subtree: true,
              attributes: true,
            });
            observers.set(el, dispose);
          }
        }
      },
      { immediate: true },
    );

    onMounted(syncWatermark);

    // Effect：参数变化 ⇒ 重绘（antd 的 useEffect(syncWatermark, […deps…)]）
    watch(
      [
        () => props.rotate,
        mergedZIndex,
        () => props.width,
        () => props.height,
        () => props.image,
        contentLines,
        gapX,
        gapY,
        offsetLeft,
        offsetTop,
      ],
      () => {
        invalidate();
        syncWatermark();
      },
      { deep: true },
    );

    onScopeDispose(() => {
      for (const dispose of observers.values()) dispose();
      observers.clear();
      disposeAll();
      for (const element of delegatedElements) parentWatermark.remove(element);
      delegatedElements.clear();
    });

    return () =>
      h(
        'div',
        mergeProps(
          { ref: container, class: context.className, style: [fixedStyle, context.style] },
          attrs,
        ),
        [slots.default?.()],
      );
  },
});

/** 只有尺寸真的变了才换集合（antd 的 getSizeDiff —— 引用稳定性护栏）。 */
function getSizeDiff(prev: Set<HTMLElement>, next: Set<HTMLElement>): Set<HTMLElement> {
  return prev.size === next.size ? prev : next;
}
