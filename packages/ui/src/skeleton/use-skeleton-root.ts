import { mergeDomAttrs } from '@apollo-design/utils';
import { computed, useAttrs } from 'vue';
import { useConfigContext, useDirection } from '../config-provider/context';
import type { SkeletonElementProps } from './interface';
import { useSkeletonTheme } from './use-skeleton-theme';

type RootProps = Pick<SkeletonElementProps, 'prefixCls' | 'active' | 'classNames' | 'styles'> & {
  block?: boolean;
};

/** Native attributes belong to the standalone root; content has its own semantic target. */
export function useSkeletonRoot(props: RootProps) {
  const config = useConfigContext();
  const attrs = useAttrs();
  const direction = useDirection();
  const prefixCls = computed(() => config.getPrefixCls('skeleton', props.prefixCls));
  const theme = useSkeletonTheme(() => prefixCls.value);
  const rootAttrs = () =>
    mergeDomAttrs(
      {
        class: [
          prefixCls.value,
          `${prefixCls.value}-element`,
          {
            [`${prefixCls.value}-active`]: props.active,
            [`${prefixCls.value}-block`]: props.block,
            [`${prefixCls.value}-rtl`]: direction.value === 'rtl',
          },
          props.classNames?.root,
        ],
        style: [theme.styles.value, props.styles?.root],
      },
      attrs,
    );
  return { prefixCls, rootAttrs };
}
