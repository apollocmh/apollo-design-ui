/**
 * QRCode 主组件。
 *
 * 契约来源：antd 6.6.4 `es/qr-code/index.js`（134 行薄壳，逐行对拍）+ rc 包的
 * `QRCodeCanvas.js` / `QRCodeSVG.js` / `QrcodeStatus.js`。
 *
 * ── 引擎复用（registry strategy=reuse 的落定）───────────────────────────────
 *
 * `@rc-component/qrcode` 绑定 React（H5 禁用）。其核心是 vendored 的
 * `qrcodegen.js`（Project Nayuki，MIT）—— 二维码编码是**标准化纯算法**，矩阵由
 * 规范唯一决定。本仓把**同一个** qrcodegen vendor 到 `engine/`（与 antd 链路
 * 同源 ⇒ 矩阵与 SVG path 逐字节一致），上层 utils（ISC，qrcode.react）与
 * useQRCode/composable 逐行移植。不选 `qrcode` / `qr-code-styling` 库：它们的
 * path 序列化格式与 antd 不同，会破坏 L4 byte 级 oracle。
 *
 * ── 与 antd 的有意差异 ────────────────────────────────────────────────────────
 *
 * 1. `onRefresh` ⇒ `refresh` emit（C19）。
 * 2. `ref` ⇒ `expose({ nativeElement })`。
 * 3. canvas 绘制走 onMounted + watch（React 是每次 render 后 useEffect）。
 * 4. `color` 默认值 = 默认主题的 `colorText`（构建期解析值，D50 同判）。
 */

import { ReloadOutlined } from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import { getDesignToken } from '@apollo-design/theme';
import { devUseWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  onMounted,
  type PropType,
  ref,
  type VNodeChild,
  watch,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { Button } from '../button';
import { useComponentConfig } from '../config-provider/context';
import { Spin } from '../spin';
import {
  type CalculatedImageSettings,
  computeQr,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_FRONT_COLOR,
  DEFAULT_MINVERSION,
  DEFAULT_SIZE,
  excavateModules,
  generatePath,
  type ImageSettings,
  isSupportPath2d,
  type QrComputeResult,
} from './engine/utils';
import type {
  QRCodeProps,
  QrCodeSemanticClassNames,
  QrCodeSemanticStyles,
  QrcodeStatusType,
} from './interface';

/** antd 薄壳从 `useComponentConfig('qrcode')` 读取的组件级配置。 */
interface QrCodeComponentConfig {
  className?: string;
  style?: Record<string, string | number>;
  classNames?: QrCodeSemanticClassNames;
  styles?: QrCodeSemanticStyles;
}

/** 默认前景色 = token.colorText（构建期解析值）。 */
const DEFAULT_FG_COLOR = getDesignToken().colorText;

/** 状态覆盖层（QrcodeStatus.js）。 */
const renderStatus = (
  prefixCls: string,
  status: QrcodeStatusType,
  locale: { expired?: string; refresh?: string; scanned?: string },
  onRefresh?: () => void,
  statusRender?: QRCodeProps['statusRender'],
): VNodeChild => {
  const defaultExpiredNode = [
    h('p', { class: `${prefixCls}-expired` }, [locale.expired]),
    onRefresh
      ? h(
          Button,
          { type: 'link', icon: h(ReloadOutlined), onClick: onRefresh },
          { default: () => locale.refresh },
        )
      : null,
  ];
  const defaultNodes: Record<QrcodeStatusType, VNodeChild> = {
    expired: defaultExpiredNode,
    loading: h(Spin),
    scanned: h('p', { class: `${prefixCls}-scanned` }, [locale.scanned]),
    active: null,
  };
  const mergedStatusRender =
    statusRender ?? ((info: { status: QrcodeStatusType }) => defaultNodes[info.status]);
  return mergedStatusRender({ status, locale, onRefresh });
};

export const QrCode = defineComponent({
  name: 'AQrCode',
  inheritAttrs: false,
  props: {
    value: { type: [String, Array] as PropType<QRCodeProps['value']>, default: undefined },
    type: {
      type: String as PropType<'canvas' | 'svg'>,
      default: 'canvas',
    },
    icon: { type: String, default: '' },
    size: { type: Number, default: 160 },
    iconSize: {
      type: [Number, Object] as PropType<number | { width?: number; height?: number }>,
      default: undefined,
    },
    color: { type: String, default: undefined },
    errorLevel: {
      type: String as PropType<'L' | 'M' | 'Q' | 'H'>,
      default: 'M',
    },
    status: {
      type: String as PropType<QrcodeStatusType>,
      default: 'active',
    },
    bordered: { type: Boolean, default: true },
    prefixCls: { type: String, default: undefined },
    bgColor: { type: String, default: 'transparent' },
    marginSize: { type: Number, default: undefined },
    statusRender: {
      type: Function as PropType<
        (info: {
          status: QrcodeStatusType;
          locale: { expired?: string; refresh?: string; scanned?: string };
          onRefresh?: () => void;
        }) => VNodeChild
      >,
      default: undefined,
    },
    boostLevel: { type: Boolean, default: undefined },
    title: { type: String, default: undefined },
    classNames: { type: Object as PropType<QrCodeSemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<QrCodeSemanticStyles>, default: undefined },
  },
  emits: ['refresh'],
  setup(props, { expose, emit, attrs }) {
    const context = useComponentConfig<QrCodeComponentConfig>('qrcode');
    const [locale] = useLocale('QRCode');

    // ======================== Semantic ========================
    const mergedClassNames = computed<QrCodeSemanticClassNames>(() => {
      const { classNames } = useMergeSemantic<
        QRCodeProps,
        QrCodeSemanticClassNames,
        QrCodeSemanticStyles
      >(
        [() => context.classNames, () => props.classNames],
        [() => context.styles, () => semanticRootStyle(context.style as never), () => props.styles],
        props,
      );
      return classNames.value;
    });
    const mergedStyles = computed<QrCodeSemanticStyles>(() => {
      const { styles } = useMergeSemantic<
        QRCodeProps,
        QrCodeSemanticClassNames,
        QrCodeSemanticStyles
      >(
        [() => context.classNames, () => props.classNames],
        [() => context.styles, () => semanticRootStyle(context.style as never), () => props.styles],
        props,
      );
      return styles.value;
    });

    const prefixCls = computed(() => context.getPrefixCls('qrcode', props.prefixCls));

    // ======================== Warning ========================
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

    // ======================== QR 计算 ========================
    const color = computed(() => props.color ?? DEFAULT_FG_COLOR);

    const imageSettings = computed<ImageSettings | undefined>(() => {
      if (!props.icon) {
        return undefined;
      }
      return {
        src: props.icon,
        x: undefined,
        y: undefined,
        height:
          typeof props.iconSize === 'number' ? props.iconSize : (props.iconSize?.height ?? 40),
        width: typeof props.iconSize === 'number' ? props.iconSize : (props.iconSize?.width ?? 40),
        excavate: true,
        crossOrigin: 'anonymous',
      };
    });

    const qr = computed<QrComputeResult>(() =>
      computeQr({
        value: props.value as string,
        level: props.errorLevel ?? 'M',
        minVersion: DEFAULT_MINVERSION,
        includeMargin: false,
        marginSize: props.marginSize,
        imageSettings: imageSettings.value,
        size: props.size ?? DEFAULT_SIZE,
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

    // ======================== Canvas 绘制 ========================
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const drawCanvas = (): void => {
      const canvas = canvasRef.value;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      let cellsToDraw = qr.value.cells;
      const image = imageEl.value;
      const cis: CalculatedImageSettings | null = qr.value.calculatedImageSettings;
      const haveImageToRender =
        cis != null &&
        image !== null &&
        image.complete &&
        image.naturalHeight !== 0 &&
        image.naturalWidth !== 0;
      if (haveImageToRender && cis?.excavation != null) {
        cellsToDraw = excavateModules(qr.value.cells, cis.excavation);
      }
      const size = props.size ?? DEFAULT_SIZE;
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.height = canvas.width = size * pixelRatio;
      const scale = (size / qr.value.numCells) * pixelRatio;
      ctx.scale(scale, scale);
      ctx.fillStyle = props.bgColor || DEFAULT_BACKGROUND_COLOR;
      ctx.fillRect(0, 0, qr.value.numCells, qr.value.numCells);
      ctx.fillStyle = color.value || DEFAULT_FRONT_COLOR;
      if (isSupportPath2d) {
        ctx.fill(new Path2D(generatePath(cellsToDraw, qr.value.margin)));
      } else {
        cellsToDraw.forEach((row, rdx) => {
          row.forEach((cell, cdx) => {
            if (cell) {
              ctx.fillRect(cdx + qr.value.margin, rdx + qr.value.margin, 1, 1);
            }
          });
        });
      }
      if (cis) {
        ctx.globalAlpha = cis.opacity;
      }
      if (haveImageToRender && cis) {
        ctx.drawImage(image, cis.x + qr.value.margin, cis.y + qr.value.margin, cis.w, cis.h);
      }
    };
    onMounted(drawCanvas);
    watch([qr, imageLoaded], () => drawCanvas(), { flush: 'post' });

    // ======================== Ref ========================
    const rootRef = ref<HTMLDivElement | null>(null);
    expose({ nativeElement: rootRef });

    const handleRefresh = (): void => {
      emit('refresh');
    };

    // ⚠️ emits 声明会把 onRefresh 从 props 剥离（Vue 行为）；渲染层的『是否给了
    //    刷新回调』要从 vnode 原始 props 探测（CHECKLIST #68）
    const instance = getCurrentInstance();
    const hasRefreshListener = computed(
      () => !!instance?.vnode.props?.onRefresh || !!props.onRefresh,
    );

    return () => {
      const cls = prefixCls.value;
      const value = props.value;
      if (!value) {
        return null;
      }

      const rootClassNames = [
        cls,
        context.className,
        mergedClassNames.value.root,
        attrs.class,
        { [`${cls}-borderless`]: !props.bordered },
      ];
      // ⚠️ 数字必须补 px（Vue CSSOM 不自动加单位，CHECKLIST #66）
      const px = (n: number | string | undefined): string | number | undefined =>
        typeof n === 'number' ? `${n}px` : n;
      const rootStyle = {
        backgroundColor: props.bgColor,
        ...(mergedStyles.value.root ?? {}),
        // 根 style 是 Vue 原生 attrs：宽度/高度仍按 antd 语义优先取调用方 style
        width: px(
          (attrs.style as Record<string, string | number> | undefined)?.width ?? props.size,
        ),
        height: px(
          (attrs.style as Record<string, string | number> | undefined)?.height ?? props.size,
        ),
      };

      const nodes: VNodeChild[] = [];

      // 状态覆盖层
      if (props.status !== 'active') {
        nodes.push(
          h(
            'div',
            {
              class: [`${cls}-cover`, mergedClassNames.value.cover],
              style: mergedStyles.value.cover,
            },
            [
              renderStatus(
                cls,
                props.status ?? 'active',
                locale,
                hasRefreshListener.value ? handleRefresh : undefined,
                props.statusRender,
              ),
            ],
          ),
        );
      }

      const size = props.size ?? DEFAULT_SIZE;
      if (props.type === 'canvas') {
        nodes.push(
          h('canvas', {
            style: { height: size, width: size },
            height: size,
            width: size,
            ref: canvasRef,
            role: 'img',
          }),
          props.icon
            ? h('img', {
                alt: 'QR-Code',
                src: props.icon,
                key: props.icon,
                style: { display: 'none' },
                onLoad: () => {
                  imageLoaded.value = true;
                },
                ref: imageEl,
                crossOrigin: qr.value.calculatedImageSettings?.crossOrigin,
              })
            : null,
        );
      } else {
        // SVG 分支（QRCodeSVG.js 逐行对拍）
        let cellsToDraw = qr.value.cells;
        const cis = qr.value.calculatedImageSettings;
        let image: VNodeChild = null;
        if (imageSettings.value != null && cis != null) {
          if (cis.excavation != null) {
            cellsToDraw = excavateModules(qr.value.cells, cis.excavation);
          }
          image = h('image', {
            href: imageSettings.value.src,
            height: cis.h,
            width: cis.w,
            x: cis.x + qr.value.margin,
            y: cis.y + qr.value.margin,
            preserveAspectRatio: 'none',
            opacity: cis.opacity,
            crossOrigin: cis.crossOrigin,
          });
        }
        const fgPath = generatePath(cellsToDraw, qr.value.margin);
        nodes.push(
          h(
            'svg',
            {
              height: size,
              width: size,
              viewBox: `0 0 ${qr.value.numCells} ${qr.value.numCells}`,
              role: 'img',
            },
            [
              props.title ? h('title', null, [props.title]) : null,
              h('path', {
                fill: props.bgColor || DEFAULT_BACKGROUND_COLOR,
                d: `M0,0 h${qr.value.numCells}v${qr.value.numCells}H0z`,
                shapeRendering: 'crispEdges',
              }),
              h('path', {
                fill: color.value || DEFAULT_FRONT_COLOR,
                d: fgPath,
                shapeRendering: 'crispEdges',
              }),
              image,
            ],
          ),
        );
      }

      return h(
        'div',
        {
          ...attrs,
          ref: rootRef,
          class: rootClassNames,
          style: [rootStyle, attrs.style],
        },
        nodes,
      );
    };
  },
});

export default QrCode;
