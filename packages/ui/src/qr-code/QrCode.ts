/** Native Vue status content and current configuration over the licensed QR engine. */
import { ReloadOutlined } from '@apollo-design/icons';
import { useLocaleReactive } from '@apollo-design/locale';
import { getDesignToken } from '@apollo-design/theme';
import { devUseWarning, mergeDomAttrs } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  normalizeStyle,
  type PropType,
  ref,
  type SlotsType,
  type VNodeChild,
  watch,
  watchEffect,
} from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { Button } from '../button';
import { type ComponentStyleConfig, useComponentConfig } from '../config-provider/context';
import { Spin } from '../spin';
import {
  computeQr,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_FRONT_COLOR,
  DEFAULT_MINVERSION,
  excavateModules,
  generatePath,
  type ImageSettings,
  isSupportPath2d,
} from './engine/utils';
import type {
  QRCodeProps,
  QRCodeSlots,
  QrCodeSemanticClassNames,
  QrCodeSemanticStyles,
  QrcodeLocale,
  QrcodeStatusType,
} from './interface';
import { useQRCodeTheme } from './use-qrcode-theme';

interface QrCodeComponentConfig extends ComponentStyleConfig {
  classNames?: QrCodeSemanticClassNames;
  styles?: QrCodeSemanticStyles;
}

// A neutral foreground and white default host preserve code contrast in dark UIs.
const DEFAULT_FG_COLOR = getDesignToken().colorText;
const DEFAULT_QR_SIZE = 160;
const positive = (value: number | undefined, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;

/** Normalize all native Vue style forms, retaining existing numeric width/height support. */
function rootStyle(value: unknown) {
  const style = normalizeStyle([value]);
  if (!style || typeof style === 'string') return {};
  return {
    ...style,
    ...(typeof style.width === 'number' ? { width: `${style.width}px` } : {}),
    ...(typeof style.height === 'number' ? { height: `${style.height}px` } : {}),
  };
}

function defaultStatus(
  prefix: string,
  status: QrcodeStatusType,
  locale: QrcodeLocale,
  refresh: () => void,
): VNodeChild {
  if (status === 'loading') return h(Spin);
  if (status === 'scanned') return h('p', { class: `${prefix}-scanned` }, locale.scanned);
  if (status === 'expired')
    return [
      h('p', { class: `${prefix}-expired` }, locale.expired),
      h(Button, { type: 'text', icon: h(ReloadOutlined), onClick: refresh }, () => locale.refresh),
    ];
  return null;
}

export const QrCode = defineComponent({
  name: 'AQrCode',
  inheritAttrs: false,
  props: {
    value: { type: [String, Array] as PropType<QRCodeProps['value']>, default: undefined },
    type: { type: String as PropType<'canvas' | 'svg'>, default: 'canvas' },
    icon: { type: String, default: '' },
    size: { type: Number, default: DEFAULT_QR_SIZE },
    iconSize: { type: [Number, Object] as PropType<QRCodeProps['iconSize']>, default: undefined },
    color: { type: String, default: undefined },
    errorLevel: { type: String as PropType<QRCodeProps['errorLevel']>, default: 'M' },
    status: { type: String as PropType<QrcodeStatusType>, default: 'active' },
    bordered: { type: Boolean, default: true },
    prefixCls: { type: String, default: undefined },
    bgColor: { type: String, default: undefined },
    marginSize: { type: Number, default: undefined },
    boostLevel: { type: Boolean, default: undefined },
    title: { type: String, default: undefined },
    classNames: { type: Object as PropType<QrCodeSemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<QrCodeSemanticStyles>, default: undefined },
  },
  emits: { refresh: () => true },
  slots: Object as SlotsType<QRCodeSlots>,
  setup(props, { expose, emit, attrs, slots }) {
    const context = useComponentConfig<QrCodeComponentConfig>('qrcode');
    const [locale] = useLocaleReactive('QRCode');
    const prefixCls = computed(() => context.getPrefixCls('qrcode', props.prefixCls));
    const theme = useQRCodeTheme(() => prefixCls.value);
    const { classNames, styles } = useMergeSemantic<
      QRCodeProps,
      QrCodeSemanticClassNames,
      QrCodeSemanticStyles
    >(
      [() => context.classNames, () => props.classNames],
      [() => context.styles, () => semanticRootStyle(context.style), () => props.styles],
      props,
    );
    watch(
      () => [props.value, props.icon, props.errorLevel] as const,
      ([value, icon, errorLevel]) => {
        const warning = devUseWarning('QRCode');
        warning(!!value, 'need to receive `value` props');
        warning(
          !(icon && errorLevel === 'L'),
          'ErrorLevel `L` is not recommended to be used with `icon`, for scanning result would be affected by low level.',
        );
      },
      { immediate: true },
    );

    const size = computed(() => positive(props.size, DEFAULT_QR_SIZE));
    const color = computed(() => props.color ?? DEFAULT_FG_COLOR);
    const background = computed(() => props.bgColor ?? 'transparent');
    const imageSettings = computed<ImageSettings | undefined>(() =>
      props.icon
        ? {
            src: props.icon,
            height: positive(
              typeof props.iconSize === 'number' ? props.iconSize : props.iconSize?.height,
              40,
            ),
            width: positive(
              typeof props.iconSize === 'number' ? props.iconSize : props.iconSize?.width,
              40,
            ),
            excavate: true,
            crossOrigin: 'anonymous',
          }
        : undefined,
    );
    const qr = computed(() =>
      computeQr({
        value: props.value ?? '',
        level: props.errorLevel ?? 'M',
        minVersion: DEFAULT_MINVERSION,
        includeMargin: false,
        marginSize: Number.isFinite(props.marginSize) ? props.marginSize : undefined,
        imageSettings: imageSettings.value,
        size: size.value,
        boostLevel: props.boostLevel,
      }),
    );
    const imageLoaded = ref(false);
    const imageEl = ref<HTMLImageElement | null>(null);
    watch(
      () => imageSettings.value?.src,
      () => {
        imageLoaded.value = false;
      },
    );
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const drawCanvas = (): void => {
      const canvas = canvasRef.value;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      const current = qr.value;
      const image = imageEl.value;
      const cis = current.calculatedImageSettings;
      const haveImage = !!(cis && image?.complete && image.naturalHeight && image.naturalWidth);
      const cells =
        haveImage && cis?.excavation
          ? excavateModules(current.cells, cis.excavation)
          : current.cells;
      const ownerRatio = canvas.ownerDocument.defaultView?.devicePixelRatio ?? 1;
      const ratio = Number.isFinite(ownerRatio) && ownerRatio > 0 ? ownerRatio : 1;
      canvas.height = canvas.width = size.value * ratio;
      ctx.scale((size.value / current.numCells) * ratio, (size.value / current.numCells) * ratio);
      ctx.fillStyle = background.value || DEFAULT_BACKGROUND_COLOR;
      ctx.fillRect(0, 0, current.numCells, current.numCells);
      ctx.fillStyle = color.value || DEFAULT_FRONT_COLOR;
      if (isSupportPath2d) ctx.fill(new Path2D(generatePath(cells, current.margin)));
      else
        cells.forEach((row, y) => {
          row.forEach((cell, x) => {
            if (cell) ctx.fillRect(x + current.margin, y + current.margin, 1, 1);
          });
        });
      if (haveImage && cis && image) {
        ctx.globalAlpha = cis.opacity;
        ctx.drawImage(image, cis.x + current.margin, cis.y + current.margin, cis.w, cis.h);
      }
    };
    watchEffect(
      () => {
        void imageLoaded.value;
        drawCanvas();
      },
      { flush: 'post' },
    );
    const rootRef = ref<HTMLDivElement | null>(null);
    expose({ nativeElement: rootRef });
    const refresh = () => emit('refresh');

    return () => {
      if (!props.value) return null;
      const cls = prefixCls.value;
      const name = props.title?.trim() ? props.title : 'QR code';
      const nodes: VNodeChild[] = [];
      if (props.status !== 'active') {
        const scope = {
          status: props.status,
          locale: locale.value,
          refresh,
        };
        const content = slots.status
          ? slots.status(scope)
          : defaultStatus(cls, scope.status, scope.locale, scope.refresh);
        nodes.push(
          h(
            'div',
            {
              key: 'cover',
              class: [`${cls}-cover`, classNames.value.cover],
              ...styleAttrs(styles.value.cover),
            },
            [h(NodeRenderer, { node: content })],
          ),
        );
      }
      if (props.type === 'canvas') {
        nodes.push(
          h('canvas', {
            key: 'graphic',
            height: size.value,
            width: size.value,
            ref: canvasRef,
            role: 'img',
            'aria-label': name,
          }),
        );
        if (props.icon)
          nodes.push(
            h('img', {
              key: `icon:${props.icon}`,
              alt: 'QR-Code',
              src: props.icon,
              style: { display: 'none' },
              ref: imageEl,
              crossOrigin: qr.value.calculatedImageSettings?.crossOrigin,
              onLoad: (event: Event) => {
                if (event.target === imageEl.value) imageLoaded.value = true;
              },
              onError: (event: Event) => {
                if (event.target === imageEl.value) imageLoaded.value = false;
              },
            }),
          );
      } else {
        const current = qr.value;
        const cis = current.calculatedImageSettings;
        const image =
          imageSettings.value && cis
            ? h('image', {
                href: imageSettings.value.src,
                height: cis.h,
                width: cis.w,
                x: cis.x + current.margin,
                y: cis.y + current.margin,
                preserveAspectRatio: 'none',
                opacity: cis.opacity,
                crossorigin: cis.crossOrigin,
              })
            : null;
        const cells =
          image && cis?.excavation ? excavateModules(current.cells, cis.excavation) : current.cells;
        nodes.push(
          h(
            'svg',
            {
              key: 'graphic',
              height: size.value,
              width: size.value,
              viewBox: `0 0 ${current.numCells} ${current.numCells}`,
              role: 'img',
              'aria-label': name,
            },
            [
              props.title ? h('title', props.title) : null,
              h('path', {
                fill: background.value || DEFAULT_BACKGROUND_COLOR,
                d: `M0,0 h${current.numCells}v${current.numCells}H0z`,
                'shape-rendering': 'crispEdges',
              }),
              h('path', {
                fill: color.value || DEFAULT_FRONT_COLOR,
                d: generatePath(cells, current.margin),
                'shape-rendering': 'crispEdges',
              }),
              image,
            ],
          ),
        );
      }
      return h(
        'div',
        {
          ...mergeDomAttrs(
            {
              class: [
                cls,
                context.className,
                classNames.value.root,
                { [`${cls}-borderless`]: !props.bordered },
              ],
              style: {
                ...theme.styles.value,
                width: `${size.value}px`,
                height: `${size.value}px`,
                ...(props.bgColor === undefined ? {} : { backgroundColor: props.bgColor }),
                ...rootStyle(styles.value.root),
              },
            },
            { ...attrs, style: rootStyle(attrs.style) },
          ),
          ref: rootRef,
        },
        nodes,
      );
    };
  },
});
export default QrCode;
