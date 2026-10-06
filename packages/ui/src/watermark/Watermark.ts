/**
 * Watermark —— 水印。
 *
 * 契约来源：antd 6.6.4 的 `es/watermark/index.js`（判据逐条对齐，G1 分析 §2）。
 * 为什么是渲染函数：根 div 同时承担 expose ref 与 MutationObserver 观察目标，
 * 且 MutationObserver 的挂载点集合是运行时计算的（badge/Tag 同范式）。
 *
 * ── 七条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 * 1. **水印 div 是运行时 append 的**：无 class、无 hidden（防浏览器隐藏）、
 *    style 每次全量重写、`visibility: visible !important`。
 * 2. **zIndex 默认 = zIndexPopupBase - 1**（嵌套用例钉 999）。
 * 3. **offset 修正**：positionLeft/Top = offset - gap/2；>0 才写 left/top/width/
 *    height 并归零，最后写 backgroundPosition（交错平铺的锚点）。
 * 4. **contentLines 为空 ⇒ 0×0**：不调用 drawImage（零尺寸画布保护）。
 * 5. **防篡改**：MutationObserver 盯「水印元素被删/属性被改 ⇒ 重绘」与
 *    「container style 被改 ⇒ 回写 fixedStyle」两件事。
 * 6. **onRemove**：水印换父时触发；组件卸载不触发（disposeAll 直接清 Map）。
 * 7. **inherit=false 不 provide context**（嵌套面板拿不到 add/remove）。
 */

import { type AliasToken, getDesignToken, useToken } from '@apollo-design/theme';
import { observeMutation } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  onScopeDispose,
  type PropType,
  provide,
  ref,
  shallowRef,
  type VNodeChild,
  watch,
} from 'vue';
import { useComponentConfig } from '../config-provider/context';
import { type WatermarkContextValue, watermarkContextKey } from './context';
import type { WatermarkFont, WatermarkProps } from './interface';
import { FontGap, getClips } from './use-clips';
import { useRafDebounce } from './use-raf-debounce';
import { useSingletonCache } from './use-singleton-cache';
import { useWatermark } from './use-watermark';
import { getCanvasFont, getContentLines, getPixelRatio, reRendering } from './utils';

const DEFAULT_GAP_X = 100;
const DEFAULT_GAP_Y = 100;
const WATERMARK_Z_INDEX_OFFSET = 1;

/** 强制不可改的容器样式（防篡改回写的键也来自它）。 */
const fixedStyle: Record<string, string | number> = {
  position: 'relative',
  overflow: 'hidden',
};

export default defineComponent({
  name: 'AWatermark',
  inheritAttrs: false,
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
    gap: { type: Array as unknown as PropType<WatermarkProps['gap']>, default: undefined },
    offset: { type: Array as unknown as PropType<WatermarkProps['offset']>, default: undefined },
    inherit: { type: Boolean, default: true },
    onRemove: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props, { attrs, expose, slots }) {
    const context = useComponentConfig('watermark');
    const contextClassName = context.className;
    const contextStyle = context.style as Record<string, string | number> | undefined;

    const token = useToken();

    // ============================ Style ================================
    // 根 `style` 是 Vue 原生 attrs（不再是 prop），在 render 里排在最后 ⇒ 仍覆盖一切。
    const mergedStyle = computed<Record<string, string | number>>(() => ({
      ...fixedStyle,
      ...contextStyle,
    }));

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
    const rootRef = shallowRef<HTMLDivElement | null>(null);
    const container = shallowRef<HTMLDivElement | null>(null);
    function setContainerRef(el: unknown) {
      rootRef.value = el as HTMLDivElement | null;
      container.value = el as HTMLDivElement | null;
    }
    expose({
      get nativeElement() {
        return rootRef.value;
      },
    });

    // ======================= Nest（inherit）============================
    const subElements = shallowRef<Set<HTMLElement>>(new Set());
    const targetElements = computed<HTMLElement[]>(() => {
      const list = container.value ? [container.value] : [];
      return [...list, ...Array.from(subElements.value)];
    });

    const provideContext = computed<WatermarkContextValue>(() => ({
      add: (ele) => {
        const clone = new Set(subElements.value);
        clone.add(ele);
        subElements.value = getSizeDiff(subElements.value, clone);
      },
      remove: (ele) => {
        removeWatermark(ele);
        const clone = new Set(subElements.value);
        if (ele) {
          clone.delete(ele);
        }
        subElements.value = getSizeDiff(subElements.value, clone);
      },
    }));

    if (props.inherit) {
      provide(watermarkContextKey, provideContext.value);
    }

    // ============================ Content ==============================
    const getMarkSize = (ctx: CanvasRenderingContext2D): [number, number] => {
      let defaultWidth = 120;
      let defaultHeight = 64;
      if (!props.image && ctx.measureText) {
        if (contentLines.value.length) {
          const sizes = contentLines.value.map(({ text, font: lineFont }) => {
            ctx.font = getCanvasFont(lineFont);
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

    const renderWatermark = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const ratio = getPixelRatio();
        const [markWidth, markHeight] = getMarkSize(ctx);
        const drawCanvas = (drawContent: HTMLImageElement | typeof contentLines.value) => {
          const params = [
            drawContent || [],
            props.rotate,
            ratio,
            markWidth,
            markHeight,
            gapX.value,
            gapY.value,
          ];
          const [nextClips, clipWidth] = getClipsCache(params, () =>
            getClips(
              drawContent as HTMLImageElement | typeof contentLines.value,
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
          const img = new Image();
          img.onload = () => {
            drawCanvas(img);
          };
          img.onerror = () => {
            drawCanvas(contentLines.value);
          };
          img.crossOrigin = 'anonymous';
          img.referrerPolicy = 'no-referrer';
          img.src = props.image;
        } else {
          drawCanvas(contentLines.value);
        }
      }
    };
    const syncWatermark = useRafDebounce(renderWatermark);

    // ============================ Effect ===============================
    const { appendWatermark, removeWatermark, isWatermarkEle, disposeAll } = useWatermark(
      () => markStyle.value,
      props.onRemove ?? undefined,
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
    const observers = new Map<Element, () => void>();

    const onMutate = (mutations: MutationRecord[]) => {
      mutations.forEach((mutation) => {
        if (reRendering(mutation, isWatermarkEle)) {
          syncWatermark();
        } else if (mutation.target === container.value && mutation.attributeName === 'style') {
          // We've only force container not modify.
          // Not consider nest case.
          const containerStyle = (container.value as HTMLElement).style as unknown as Record<
            string,
            string | number | undefined
          >;
          for (const key of Object.keys(fixedStyle)) {
            const oriValue = mergedStyle.value[key];
            const currentValue = containerStyle[key];
            if (oriValue && oriValue !== currentValue) {
              containerStyle[key] = oriValue;
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
          if (!els.includes(el as HTMLElement)) {
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
      { immediate: true, deep: true },
    );

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
        syncWatermark();
      },
      { immediate: true, deep: true },
    );

    onScopeDispose(() => {
      for (const dispose of observers.values()) dispose();
      observers.clear();
      disposeAll();
    });

    // ============================= Render ==============================
    const childNode = (): VNodeChild => {
      const children = slots.default?.();
      return props.inherit
        ? // ⚠️ provide 已在 setup 期完成（Vue 的 provide 必须在 setup 同步调用），
          //    这里直接返回 children —— 与 antd 的 Provider 包裹等价（注入键相同）。
          children
        : children;
    };

    return () =>
      h(
        'div',
        {
          ref: setContainerRef,
          // 根 `class` / `style` 是 Vue 原生 attrs（位置与原先的
          // props.className/rootClassName/style 一致）。
          class: [attrs.class, contextClassName],
          style: {
            ...mergedStyle.value,
            ...((attrs.style as Record<string, string | number>) ?? {}),
          },
        },
        [childNode()],
      );
  },
});

/** 只有尺寸真的变了才换集合（antd 的 getSizeDiff —— 引用稳定性护栏）。 */
function getSizeDiff(prev: Set<HTMLElement>, next: Set<HTMLElement>): Set<HTMLElement> {
  return prev.size === next.size ? prev : next;
}
