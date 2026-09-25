/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。 */
import { describe, expectTypeOf } from 'vitest';
import type { AppComponentType, AppProps } from '../interface';

describe('App · 类型', () => {
  it('component 是 5 值联合（4 元素 + false）', () => {
    expectTypeOf<AppComponentType>().toEqualTypeOf<'div' | 'section' | 'main' | 'span' | false>();
  });

  it('正例：合法 prop 组合', () => {
    const sample: Pick<AppProps, 'component' | 'message' | 'notification'> = {
      component: 'section',
      message: { maxCount: 1 },
      notification: { placement: 'topLeft' },
    };
    expectTypeOf(sample).not.toBeNever();
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      const props: AppProps = {
        // @ts-expect-error component 不接受 'article'
        component: 'article',
      };
      return props;
    };
    void negative;
  });
});
