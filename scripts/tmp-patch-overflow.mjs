/** 一次性补丁：Overflow 加 renderRawRest 支持。 */
import fs from 'node:fs';

const p = '/Users/nanren/Code/apollo-design-ui/packages/ui/src/_internal/overflow.ts';
let s = fs.readFileSync(p, 'utf8');

if (!s.includes('renderRawRest')) {
  // 1. prop
  s = s.replace(
    `    renderRest: {
      type: [Function, String] as PropType<((omitted: unknown[]) => VNodeChild) | string>,
      default: undefined,
    },`,
    `    renderRest: {
      type: [Function, String] as PropType<((omitted: unknown[]) => VNodeChild) | string>,
      default: undefined,
    },
    /** raw rest：rest 节点本体（li）由调用方渲染 —— clone 注入 overflow 样式。 */
    renderRawRest: {
      type: Function as PropType<(omitted: unknown[]) => VNodeChild>,
      default: undefined,
    },`,
  );

  // 2. rest 渲染段
  const old = `        nodes.push(
          h(
            'div',
            {
              class: \`${itemPrefixCls}-rest\`,
              style: {
                opacity: shouldResponsive.value && !displayRest.value ? 0 : 1,
                height: shouldResponsive.value && !displayRest.value ? 0 : undefined,
                overflowY:
                  shouldResponsive.value && !displayRest.value ? 'hidden' : undefined,
                pointerEvents:
                  shouldResponsive.value && !displayRest.value ? 'none' : undefined,
                position:
                  shouldResponsive.value && !displayRest.value ? 'absolute' : undefined,
              },
              'aria-hidden':
                shouldResponsive.value && !displayRest.value ? true : undefined,
              ref: (el) => {
                if (el && canObserve) {
                  restWidth.value = (el as HTMLElement).offsetWidth || restWidth.value;
                }
              },
            },
            [restContent].filter((c) => c !== null && c !== undefined),
          ),
        );`;

  const replacement = `        const restStyle = {
          opacity: shouldResponsive.value && !displayRest.value ? 0 : 1,
          height: shouldResponsive.value && !displayRest.value ? 0 : undefined,
          overflowY: shouldResponsive.value && !displayRest.value ? 'hidden' : undefined,
          pointerEvents: shouldResponsive.value && !displayRest.value ? 'none' : undefined,
          position: shouldResponsive.value && !displayRest.value ? 'absolute' : undefined,
          order: shouldResponsive.value
            ? displayRest.value
              ? mergedDisplayCount.value
              : Number.MAX_SAFE_INTEGER
            : undefined,
        };
        const restRef = (el: Element | ComponentPublicInstance | null): void => {
          if (el && canObserve) {
            restWidth.value = (el as HTMLElement).offsetWidth || restWidth.value;
          }
        };
        if (props.renderRawRest) {
          const raw = props.renderRawRest(omittedItems.value) as VNode;
          nodes.push(
            cloneVNode(raw, {
              style: {
                ...(raw.props?.style as Record<string, unknown> | undefined),
                ...restStyle,
              },
              class: [
                \`\${itemPrefixCls}-rest\`,
                ...(Array.isArray(raw.props?.class)
                  ? (raw.props?.class as string[])
                  : raw.props?.class
                    ? [raw.props?.class as string]
                    : []),
              ],
              'aria-hidden':
                shouldResponsive.value && !displayRest.value ? true : undefined,
              ref: restRef,
            } as never),
          );
        } else {
          nodes.push(
            h(
              'div',
              {
                class: \`\${itemPrefixCls}-rest\`,
                style: restStyle,
                'aria-hidden':
                  shouldResponsive.value && !displayRest.value ? true : undefined,
                ref: restRef,
              },
              [restContent].filter((c) => c !== null && c !== undefined),
            ),
          );
        }`;

  if (!s.includes(old)) {
    console.error('REST BLOCK MISS');
    process.exit(1);
  }
  s = s.replace(old, replacement);
  fs.writeFileSync(p, s);
  console.log('patched');
} else console.log('has');
