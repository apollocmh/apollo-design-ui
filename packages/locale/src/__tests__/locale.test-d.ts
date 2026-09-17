/**
 * L3 —— 类型契约。
 *
 * 除了正向断言，每条容易写错的都配了 `@ts-expect-error` 负例。
 *
 * ⚠️ 本文件会被 vitest **真的执行**，含运行时后果的负例必须包在 `neverCalled` 里。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { ComputedRef, VNodeChild } from 'vue';

import type {
  CarouselLocale,
  ColorPickerLocale,
  EmptyLocale,
  FormLocale,
  GlobalLocale,
  Locale,
  LocaleComponentName,
  LocaleContextValue,
  ModalLocale,
  PaginationLocale,
  PickerLangLocale,
  PickerLocale,
  PopconfirmLocale,
  QRCodeLocale,
  TableLocale,
  TextLocale,
  TimePickerLocale,
  TourLocale,
  TransferLocale,
  UploadLocale,
  ValidateMessages,
} from '../index';
import {
  type ANT_MARK,
  changeConfirmLocale,
  en_US,
  getConfirmLocale,
  LocaleProvider,
  localeContextKey,
  resetConfirmLocale,
  resetLocaleWarned,
  useLocale,
  zh_CN,
} from '../index';

function neverCalled(fn: () => void): void {
  void fn;
}

describe('Locale 类型', () => {
  it('⭐ `locale` 是唯一必填字段', () => {
    const minimal: Locale = { locale: 'zh-cn' };
    expectTypeOf(minimal).toEqualTypeOf<Locale>();
    neverCalled(() => {
      // @ts-expect-error 缺 locale
      const bad: Locale = {};
      void bad;
    });
  });

  it('17 个分片键都存在且可选（含 Select）', () => {
    expectTypeOf<Locale['Select']>().toEqualTypeOf<Record<string, unknown> | undefined>();
    expectTypeOf<Locale['Pagination']>().toEqualTypeOf<PaginationLocale | undefined>();
    expectTypeOf<Locale['DatePicker']>().toEqualTypeOf<PickerLocale | undefined>();
    expectTypeOf<Locale['Form']>().toEqualTypeOf<FormLocale | undefined>();
    expectTypeOf<Locale['ColorPicker']>().toEqualTypeOf<ColorPickerLocale | undefined>();
  });

  it('⭐ LocaleComponentName 是「除 locale 之外的全部键」', () => {
    expectTypeOf<LocaleComponentName>().not.toEqualTypeOf<'locale'>();
    neverCalled(() => {
      // @ts-expect-error 'locale' 不是分片名
      const bad: LocaleComponentName = 'locale';
      void bad;
    });
  });

  it('Carousel / ColorPicker 的子字段是**必填**（与其它分片不同）', () => {
    const carousel: CarouselLocale = { prevSlide: 'a', nextSlide: 'b' };
    expectTypeOf(carousel).toEqualTypeOf<CarouselLocale>();
    neverCalled(() => {
      // @ts-expect-error 缺 nextSlide
      const bad: CarouselLocale = { prevSlide: 'a' };
      void bad;
    });
  });

  it('TableLocale 的字段是 camelCase', () => {
    expectTypeOf<TableLocale['filterTitle']>().toEqualTypeOf<string | undefined>();
    neverCalled(() => {
      // @ts-expect-error 不是 snake_case
      const bad: TableLocale = { filter_title: 'x' };
      void bad;
    });
  });

  it('⭐ PaginationLocale 的字段是 snake_case（rc-pagination 的既有形状）', () => {
    expectTypeOf<PaginationLocale['items_per_page']>().toEqualTypeOf<string>();
    neverCalled(() => {
      // @ts-expect-error 不是 camelCase
      const bad: PaginationLocale = { itemsPerPage: 'x' };
      void bad;
    });
  });

  it('⭐ PaginationLocale 的 jump_to_confirm / page_size 是可选的', () => {
    expectTypeOf<PaginationLocale['jump_to_confirm']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<PaginationLocale['page_size']>().toEqualTypeOf<string | undefined>();
  });

  it('⭐ TourLocale 的键是**大写开头**', () => {
    const tour: TourLocale = { Next: 'a', Previous: 'b', Finish: 'c' };
    expectTypeOf(tour).toEqualTypeOf<TourLocale>();
    neverCalled(() => {
      // @ts-expect-error 不是小写
      const bad: TourLocale = { next: 'a', previous: 'b', finish: 'c' };
      void bad;
    });
  });

  it('TransferLocale 与 EmptyLocale 同名不同义', () => {
    expectTypeOf<TransferLocale['itemUnit']>().toEqualTypeOf<string>();
    expectTypeOf<EmptyLocale>().toEqualTypeOf<{ description: string }>();
  });

  it('VNode 类字段用 VNodeChild（上游是 ReactNode）', () => {
    expectTypeOf<TableLocale['filterConfirm']>().toEqualTypeOf<VNodeChild | undefined>();
    expectTypeOf<TextLocale['copy']>().toEqualTypeOf<VNodeChild | undefined>();
  });

  it('ValidateMessages 的字段全是可选的', () => {
    const partial: ValidateMessages = { required: '必填' };
    expectTypeOf(partial).toEqualTypeOf<ValidateMessages>();
  });
});

describe('PickerLangLocale', () => {
  it('⭐ 26 个 rc 侧字段 + placeholder / rangePlaceholder 是必填', () => {
    expectTypeOf<PickerLangLocale['yearFormat']>().toEqualTypeOf<string>();
    expectTypeOf<PickerLangLocale['locale']>().toEqualTypeOf<string>();
    expectTypeOf<PickerLangLocale['placeholder']>().toEqualTypeOf<string>();
    expectTypeOf<PickerLangLocale['rangePlaceholder']>().toEqualTypeOf<[string, string]>();
  });

  it('⭐ 部分语言才有的字段是可选的（照抄 .d.ts 会让 73 个包里的绝大多数报错）', () => {
    expectTypeOf<PickerLangLocale['dayFormat']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<PickerLangLocale['weekSelect']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<PickerLangLocale['shortWeekDays']>().toEqualTypeOf<string[] | undefined>();
    expectTypeOf<PickerLangLocale['fieldWeekFormat']>().toEqualTypeOf<string | undefined>();
  });

  it('PickerLocale 的四个 deprecated 字段可选', () => {
    expectTypeOf<PickerLocale['monthFormat']>().toEqualTypeOf<string | undefined>();
  });
});

describe('useLocale 的签名', () => {
  it('返回 [locale, localeCode] 的只读元组', () => {
    // ⚠️ useLocale 内部 inject，在组件外调用会告警 ⇒ 包进 neverCalled。
    //    类型断言仍然被 vue-tsc 检查（这正是本文件的目的）。
    neverCalled(() => {
      const result = useLocale('Modal');
      expectTypeOf(result[0]).toEqualTypeOf<ModalLocale>();
      // ⭐ localeCode 是 string | undefined —— 上游声明成 string，但实际可能是 undefined
      expectTypeOf(result[1]).toEqualTypeOf<string | undefined>();
    });
  });

  it('分片名收窄到 LocaleComponentName', () => {
    neverCalled(() => {
      // @ts-expect-error 'NotAComponent' 不是分片名
      useLocale('NotAComponent');
    });
  });

  it('defaultLocale 接受该分片的类型或返回它的函数', () => {
    neverCalled(() => {
      useLocale('Modal', en_US.Modal);
      useLocale('Modal', () => en_US.Modal);
      // @ts-expect-error 不能传别的分片
      useLocale('Modal', en_US.Table);
    });
  });
});

describe('其余导出', () => {
  it('ANT_MARK 是字面量', () => {
    expectTypeOf<typeof ANT_MARK>().toEqualTypeOf<'internalMark'>();
  });

  it('changeConfirmLocale 收可选的 ModalLocale，返回可选的反注册函数', () => {
    // ⚠️ 真调用会改模块级状态 ⇒ 只做类型断言
    expectTypeOf(changeConfirmLocale).toEqualTypeOf<
      (newLocale?: ModalLocale) => (() => void) | undefined
    >();
  });

  it('getConfirmLocale 返回 ModalLocale', () => {
    expectTypeOf(getConfirmLocale).toEqualTypeOf<() => ModalLocale>();
  });

  it('localeContextKey 是个 symbol 键', () => {
    expectTypeOf(localeContextKey).toBeSymbol();
  });

  it('LocaleContextValue 是 Locale 加上可选的 exist', () => {
    const value: LocaleContextValue = { locale: 'zh-cn', exist: true };
    expectTypeOf(value).toEqualTypeOf<LocaleContextValue>();
  });

  it('测试辅助的两个重置函数', () => {
    expectTypeOf(resetConfirmLocale).toEqualTypeOf<() => void>();
    expectTypeOf(resetLocaleWarned).toEqualTypeOf<() => void>();
  });

  it('LocaleProvider 是个组件', () => {
    expectTypeOf(LocaleProvider).not.toBeAny();
  });
});

describe('语言包的导出形态', () => {
  it('⭐ 导出名保留下划线原名（不是 PascalCase）', () => {
    expectTypeOf(zh_CN).toEqualTypeOf<Locale>();
    neverCalled(() => {
      // @ts-expect-error 没有 zhCN 这个名字
      const bad = zhCN;
      void bad;
    });
  });

  it('每个语言包都是 Locale', () => {
    expectTypeOf(en_US).toEqualTypeOf<Locale>();
  });
});

describe('分片类型的可用性', () => {
  it('GlobalLocale / QRCodeLocale / UploadLocale / PopconfirmLocale 都是对象类型', () => {
    expectTypeOf<GlobalLocale['placeholder']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<QRCodeLocale['expired']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<UploadLocale['uploading']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<PopconfirmLocale['okText']>().toEqualTypeOf<string>();
  });

  it('TimePickerLocale 的 rangePlaceholder 是二元组', () => {
    expectTypeOf<TimePickerLocale['rangePlaceholder']>().toEqualTypeOf<
      [string, string] | undefined
    >();
  });

  it('ComputedRef 之类的 Vue 类型可用（本包 peer 依赖 vue）', () => {
    expectTypeOf<ComputedRef<string>>().not.toBeAny();
  });
});
