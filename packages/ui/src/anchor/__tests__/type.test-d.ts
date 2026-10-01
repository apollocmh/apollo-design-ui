/**
 * L3 · 类型测试（含负例）
 *
 * ⚠️ `*.test-d.ts` 会被 vitest **真的执行**：负例必须包在**永不调用的闭包**里，
 *    否则运行时崩溃（TESTING.md / PITFALLS）。
 *
 * ── 本文件钉的五类判据 ───────────────────────────────────────────────────────
 *
 * 1. **本组件「没有」的东西**：`ref`/`expose`（上游是 `React.FC`，无 forwardRef）、
 *    `children` prop（Vue 侧是默认插槽，规则 C19）、`click` 事件（`onClick` 是
 *    **自定义签名**的 prop —— 声明成 `emits:['click']` 会让组件上的 `@click` 不再挂到根元素）。
 * 2. **`onClick` 的签名**：`(e: MouseEvent, link: AnchorLinkInfo) => void`（原生事件，不是合成事件）。
 * 3. **`items` 的递归形状**：`AnchorLinkItemProps.children` 是**自身数组**。
 * 4. **`affix` 的三态**：`boolean | AnchorAffixConfig`，而 `AnchorAffixConfig` 已 `Omit` 掉
 *    `offsetTop` / `target`（它们由 `Anchor` 自己传）。
 * 5. **可安装**：`withInstall` 的产物（`splitter` 曾漏掉这条断言 —— 见 PITFALLS）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { VNodeChild } from 'vue';
import type { AffixProps } from '../../affix/interface';
import { Anchor, AnchorLink } from '../index';
import type {
  AnchorAffixConfig,
  AnchorContainer,
  AnchorDirection,
  AnchorEmits,
  AnchorKey,
  AnchorLinkBaseProps,
  AnchorLinkInfo,
  AnchorLinkItemProps,
  AnchorLinkProps,
  AnchorProps,
  AnchorSemanticClassNames,
  AnchorSemanticStyles,
} from '../interface';

describe('Anchor · Props 类型', () => {
  it('核心 props 的形态', () => {
    expectTypeOf<AnchorProps['direction']>().toEqualTypeOf<AnchorDirection | undefined>();
    expectTypeOf<AnchorProps['items']>().toEqualTypeOf<AnchorLinkItemProps[] | undefined>();
    expectTypeOf<AnchorProps['offsetTop']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<AnchorProps['bounds']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<AnchorProps['targetOffset']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<AnchorProps['showInkInFixed']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<AnchorProps['replace']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<AnchorProps['getContainer']>().toEqualTypeOf<
      (() => AnchorContainer) | undefined
    >();
    expectTypeOf<AnchorProps['getCurrentAnchor']>().toEqualTypeOf<
      ((activeLink: string) => string) | undefined
    >();
  });

  it('🚨 `onClick` 是**自定义签名**的 prop（原生 `MouseEvent`，不是 React 合成事件）', () => {
    expectTypeOf<NonNullable<AnchorProps['onClick']>>().toEqualTypeOf<
      (e: MouseEvent, link: AnchorLinkInfo) => void
    >();
    expectTypeOf<AnchorLinkInfo['href']>().toEqualTypeOf<string>();
    // ⚠️ `title` 是 **`VNodeChild`**（联合，不是 `unknown`）⇒ 直接断言它。
    //    ⚠️ 别用 `toBeUnknown`：`expect-type@1.4.0` 里它是**属性断言**（`Scolder` 在断言失败时
    //    退化成「不可调用」的类型）⇒ 对联合类型会报 `has no call signatures`。
    expectTypeOf<AnchorLinkInfo['title']>().toEqualTypeOf<VNodeChild>();
  });

  it('`onChange` 的载荷是当前锚点字符串', () => {
    expectTypeOf<NonNullable<AnchorProps['onChange']>>().parameters.toEqualTypeOf<
      [currentActiveLink: string]
    >();
  });

  it('`AnchorContainer` / `AnchorKey` 与上游一致', () => {
    expectTypeOf<AnchorContainer>().toEqualTypeOf<HTMLElement | Window>();
    expectTypeOf<AnchorKey>().toEqualTypeOf<string | number>();
  });

  it('`affix` 的三态 + `AnchorAffixConfig` 已 `Omit` 掉 `offsetTop` / `target`', () => {
    expectTypeOf<AnchorProps['affix']>().toEqualTypeOf<boolean | AnchorAffixConfig | undefined>();
    expectTypeOf<AnchorAffixConfig>().not.toHaveProperty('offsetTop');
    expectTypeOf<AnchorAffixConfig>().not.toHaveProperty('target');
    // 其余 Affix 配置仍在
    expectTypeOf<AnchorAffixConfig>().toMatchTypeOf<Omit<AffixProps, 'offsetTop' | 'target'>>();
  });

  it('语义化槽是**四个**（root / item / itemTitle / indicator）', () => {
    expectTypeOf<keyof AnchorSemanticClassNames>().toEqualTypeOf<
      'root' | 'item' | 'itemTitle' | 'indicator'
    >();
    expectTypeOf<keyof AnchorSemanticStyles>().toEqualTypeOf<
      'root' | 'item' | 'itemTitle' | 'indicator'
    >();
  });
});

describe('Anchor · 本组件「没有」的东西', () => {
  it('🚨 没有 `children` prop（Vue 侧是默认插槽，规则 C19）', () => {
    expectTypeOf<AnchorProps>().not.toHaveProperty('children');
  });

  it('🚨 没有 `value` / `onChange` 之外的受控对（本组件不是 v-model 组件）', () => {
    expectTypeOf<AnchorProps>().not.toHaveProperty('value');
    expectTypeOf<AnchorProps>().not.toHaveProperty('modelValue');
  });

  it('🚨 `AnchorEmits` 只有 `change` —— **没有 `click`**（那会让 `@click` 不再挂到根元素）', () => {
    expectTypeOf<keyof AnchorEmits>().toEqualTypeOf<'change'>();
  });

  it('🚨 `Anchor` 没有 `expose` 的 `nativeElement`（上游 `React.FC` 无 forwardRef）', () => {
    // 组件实例的公开属性里没有 `nativeElement`
    expectTypeOf<InstanceType<typeof Anchor>>().not.toHaveProperty('nativeElement');
  });

  it('★ `Anchor` / `AnchorLink` 都是可安装的组件（`withInstall` 的产物）', () => {
    expectTypeOf(Anchor).toHaveProperty('install');
    expectTypeOf(AnchorLink).toHaveProperty('install');
  });
});

describe('Anchor · 链接类型', () => {
  it('`AnchorLinkBaseProps` 的必填与可选', () => {
    expectTypeOf<AnchorLinkBaseProps['href']>().toEqualTypeOf<string>();
    expectTypeOf<AnchorLinkBaseProps['title']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<AnchorLinkBaseProps['target']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<AnchorLinkBaseProps['replace']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<AnchorLinkBaseProps['targetOffset']>().toEqualTypeOf<number | undefined>();
  });

  it('🚨 `AnchorLinkItemProps.children` 是**自身数组**（递归）', () => {
    expectTypeOf<NonNullable<AnchorLinkItemProps['children']>>().toEqualTypeOf<
      AnchorLinkItemProps[]
    >();
    expectTypeOf<AnchorLinkItemProps['key']>().toEqualTypeOf<AnchorKey>();
  });

  it('`AnchorLinkProps.children` 是 `VNodeChild`（`Anchor.Link` 的插槽对应物）', () => {
    expectTypeOf<AnchorLinkProps>().toMatchTypeOf<AnchorLinkBaseProps>();
    expectTypeOf<AnchorLinkProps>().toHaveProperty('children');
  });
});

describe('Anchor · 负例（永不调用的闭包内）', () => {
  it('非法 direction / affix / items 必须被拒绝', () => {
    const _never = () => {
      // @ts-expect-error `direction` 只接受 vertical | horizontal
      const badDirection: AnchorProps = { direction: 'diagonal' };
      // @ts-expect-error `affix` 不接受字符串
      const badAffix: AnchorProps = { affix: 'yes' };
      // @ts-expect-error `items` 必须是数组
      const badItems: AnchorProps = { items: 'nope' };
      // @ts-expect-error `offsetTop` 是数字
      const badOffset: AnchorProps = { offsetTop: '10' };
      return [badDirection, badAffix, badItems, badOffset];
    };
    void _never;
  });

  it('链接的 `href` 是必填', () => {
    const _never = () => {
      // @ts-expect-error 缺 `href`
      const badLink: AnchorLinkItemProps = { key: 'a', title: 'A' };
      return badLink;
    };
    void _never;
  });

  it('`getCurrentAnchor` 的返回必须是字符串', () => {
    const _never = () => {
      // @ts-expect-error 返回值不能是数字
      const bad: AnchorProps = { getCurrentAnchor: () => 1 };
      return bad;
    };
    void _never;
  });
});
