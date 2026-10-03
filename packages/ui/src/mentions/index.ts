/**
 * Mentions 的公共导出。
 *
 * 与 antd `es/mentions/index.js` 对齐的对外面：
 *   - 默认导出 `Mentions`，带三个静态成员：
 *       · `Mentions.Option`（@deprecated，用 `options`）
 *       · `Mentions.getMentions`（**纯函数**，解析文本里的提及实体）
 *       · `Mentions._InternalPanelDoNotUseOrYouWillBeFired`（静态面板，demo 用）
 *   - `Option` 同时提供**具名导出**（Vue 生态惯例）
 *   - 全部类型
 *
 * ⚠️ 静态成员与具名导出必须指向**同一个对象** —— 否则 `withInstall` 会注册两份。
 *    （`typography/index.ts` 的文件头记录了同一条约定。）
 */

import { withInstall } from '../_internal/with-install';
import { MentionsOption } from './engine/Mentions';
import MentionsComponent from './Mentions';
import PurePanel from './PurePanel';

/** `Mentions.Option` —— @deprecated，用 `options`。 */
export const Option = withInstall(MentionsOption);

export type {
  MentionPlacement,
  MentionProps,
  MentionsConfig,
  MentionsEntity,
  MentionsOptionProps,
  MentionsProps,
  MentionsRef,
  MentionsSemanticClassNames,
  MentionsSemanticClassNamesFn,
  MentionsSemanticContext,
  MentionsSemanticStyles,
  MentionsSemanticStylesFn,
  OptionProps,
} from './interface';

export { MentionsOption };

/**
 * 解析一段文本里出现的提及实体。
 *
 * 契约来源：antd `es/mentions/index.js` 的 `Mentions.getMentions`（逐字对齐）。
 *
 * ```ts
 * getMentions('@light #bamboo cat', { prefix: ['@', '#'] })
 * // [{ prefix: '@', value: 'light' }, { prefix: '#', value: 'bamboo' }]
 * ```
 *
 * 判据：
 *  1. 先按 `split`（默认 `' '`）切词；
 *  2. 每个词对 `prefix` 列表**逐个**判「是否以它开头」，**第一个命中的赢**（`some` 短路）；
 *  3. 命中后 `value = 词去掉前缀`；**`value` 为空串的项不收集**（`if (entity.value)`）。
 */
export function getMentions(
  value = '',
  config: { prefix?: string | string[]; split?: string } = {},
): { prefix: string; value: string }[] {
  const { prefix = '@', split = ' ' } = config;
  const prefixList: string[] = Array.isArray(prefix) ? prefix : [prefix];

  return value.split(split).reduce<{ prefix: string; value: string }[]>((list, str = '') => {
    let hitPrefix: string | null = null;

    prefixList.some((prefixStr) => {
      const startStr = str.slice(0, prefixStr.length);
      if (startStr === prefixStr) {
        hitPrefix = prefixStr;
        return true;
      }
      return false;
    });

    if (hitPrefix !== null) {
      const entity = {
        prefix: hitPrefix,
        value: str.slice((hitPrefix as string).length),
      };
      if (entity.value) {
        list.push(entity);
      }
    }
    return list;
  }, []);
}

/** Mentions 复合组件（`Mentions.Option` / `getMentions` / 静态面板）。 */
export const Mentions = withInstall(
  Object.assign(MentionsComponent, {
    Option,
    getMentions,
    _InternalPanelDoNotUseOrYouWillBeFired: PurePanel,
  }),
);

export default Mentions;
