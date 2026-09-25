/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。 */
import { describe, expectTypeOf } from 'vitest';
import type { CoverPlacement, ImageProps, ImageStatus } from '../interface';

describe('Image · 类型', () => {
  it('status 是 3 值联合', () => {
    expectTypeOf<ImageStatus>().toEqualTypeOf<'normal' | 'loading' | 'error'>();
  });

  it('cover placement 是 3 值联合', () => {
    expectTypeOf<CoverPlacement>().toEqualTypeOf<'center' | 'top' | 'bottom'>();
  });

  it('正例：合法 prop 组合', () => {
    const sample: Pick<ImageProps, 'src' | 'width' | 'preview' | 'placeholder'> = {
      src: 'x.png',
      width: 200,
      preview: { cover: { placement: 'top' }, maskClosable: false },
      placeholder: { progress: { percent: 50 } },
    };
    expectTypeOf(sample).not.toBeNever();
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      const props: ImageProps = {
        // @ts-expect-error width 不接受布尔
        width: true,
        // @ts-expect-error preview 不接受字符串
        preview: 'yes',
      };
      return props;
    };
    void negative;
  });
});
