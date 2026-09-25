/**
 * `NoticeListContent` —— rc `NotificationList/Content.js` 的 Vue 版。
 *
 * 列表内容的容器：高度由测量结果给定，并把**最新一条**的实测尺寸写进
 * `--top-notificiation-height` / `--top-notificiation-width`（堆叠折叠的占位条靠它算宽度）。
 *
 * ⚠️ 变量名的 `notificiation` **少一个 `t`** —— 上游就这么拼，逐字保留
 * （改对了会让 CSS 与 antd 分叉，且会掉进 B7 的变量存在性检查）。
 * ⚠️ `-increase` / `-decrease` 类按「本次高度 vs 上次高度」判定（渲染期比较，
 * 用 ref 记住上一次）。
 */
import { type CSSProperties, defineComponent, h, type PropType, ref } from 'vue';

export default defineComponent({
  name: 'ANotificationListContent',
  props: {
    listPrefixCls: { type: String, required: true },
    height: { type: Number, default: 0 },
    topNoticeHeight: { type: Number, default: 0 },
    topNoticeWidth: { type: Number, default: 0 },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
  },
  setup(props, { slots, attrs }) {
    const prevHeight = ref(props.height);

    return () => {
      const contentPrefixCls = `${props.listPrefixCls}-content`;
      const heightStatus = props.height < prevHeight.value ? 'decrease' : 'increase';
      prevHeight.value = props.height;

      return h(
        'div',
        {
          ...attrs,
          class: [contentPrefixCls, `${contentPrefixCls}-${heightStatus}`, props.className],
          style: {
            ...(props.style ?? {}),
            height: `${props.height}px`,
            '--top-notificiation-height': `${props.topNoticeHeight}px`,
            '--top-notificiation-width': `${props.topNoticeWidth}px`,
          },
        },
        slots.default?.(),
      );
    };
  },
});
