/**
 * Skeleton · L1 单元测试（+ 部分 L4 DOM 契约）。
 *
 * 断言的来源**全部**是 `docs/analysis/skeleton.md` 里逐条记录的上游行号，
 * 不是「看实现反推的期望值」。
 *
 * ── 这份测试真正要钉住的三件事 ──────────────────────────────────────────────
 *
 *   1. `loading` 的**三态**（`Skeleton.js:105`）—— 尤其是「未传」要渲染骨架。
 *      ⚠️ 上游判据 `!('loading' in props)` 在 Vue 里无法照抄，实现改写成
 *      `loading !== false`；这里用三态表把**语义**钉住，而不是钉实现细节。
 *   2. avatar / title / paragraph 的**互锁推导**（`:23-62`）—— 8 种存在性组合。
 *   3. DOM 结构：`-header` 与 `-section` 是**并列**（`:157-161`），
 *      Title 是 `<h3>`、Paragraph 是 `<ul>` + `<li>`。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import Skeleton from '../Skeleton.vue';

const P = 'apollo-skeleton';

const mountSkeleton = (props: Record<string, unknown> = {}, slot?: () => unknown) =>
  mount(Skeleton, { props, slots: slot ? { default: slot } : {} });

// ---------------------------------------------------------------------------
// 1. loading 三态
// ---------------------------------------------------------------------------

describe('Skeleton · loading 三态（Skeleton.js:105）', () => {
  it('未传 loading ⇒ 渲染骨架（不是 children）', () => {
    const w = mountSkeleton();
    expect(w.find(`.${P}`).exists()).toBe(true);
  });

  it('loading=true ⇒ 渲染骨架', () => {
    const w = mountSkeleton({ loading: true });
    expect(w.find(`.${P}`).exists()).toBe(true);
  });

  it('loading=false ⇒ 渲染 children，且**不套任何容器**', () => {
    const w = mountSkeleton({ loading: false }, () => h('span', { class: 'real' }, 'content'));
    expect(w.find(`.${P}`).exists()).toBe(false);
    expect(w.find('.real').exists()).toBe(true);
  });

  /**
   * 上游 `children ?? null` ⇒ 渲染 `null`，DOM 里什么都不该有。
   *
   * ⚠️ 不断言 `w.html() === ''`：Vue 在 dev 构建下**保留模板里的 HTML 注释**，
   *    这里的模板开头有一段解释性注释 ⇒ `html()` 会带出 `<!-- … -->`。
   *    （生产构建 `comments: false` 会被剥掉，所以这不是 DOM 契约问题。）
   *    ⇒ 断言「没有元素节点」才是真正要钉的语义。
   */
  it('loading=false 且无 children ⇒ 没有任何元素（上游 `children ?? null`）', () => {
    const w = mountSkeleton({ loading: false });
    expect(w.find(`.${P}`).exists()).toBe(false);
    expect(w.element.children.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 2. 互锁推导（avatar / title / paragraph 的 8 种存在性组合）
// ---------------------------------------------------------------------------

describe('Skeleton · 三块互锁推导（Skeleton.js:23-62）', () => {
  /**
   * 期望值逐条来自上游：
   *   avatar   : size 恒 `large`；shape = `hasTitle && !hasParagraph` ? square : circle
   *   title    : `!hasAvatar && hasParagraph` ⇒ '38%'；`hasAvatar && hasParagraph` ⇒ '50%'；否则无
   *   paragraph: `!hasAvatar || !hasTitle` ⇒ width '61%'（否则无）；rows = `!hasAvatar && hasTitle` ? 3 : 2
   */
  const cases = [
    {
      name: '默认（avatar=false, title=true, paragraph=true）',
      props: {},
      hasAvatar: false,
      titleWidth: '38%',
      paraWidth: '61%',
      rows: 3,
    },
    {
      name: 'avatar=true（title/paragraph 仍默认 true）',
      props: { avatar: true },
      hasAvatar: true,
      avatarShape: 'circle',
      titleWidth: '50%',
      paraWidth: undefined,
      rows: 2,
    },
    {
      name: '只有 title（avatar=false, paragraph=false）',
      props: { paragraph: false },
      hasAvatar: false,
      titleWidth: undefined,
    },
    {
      name: '只有 paragraph（avatar=false, title=false）',
      props: { title: false },
      hasAvatar: false,
      paraWidth: '61%',
      rows: 2,
    },
    {
      name: 'avatar + title（无 paragraph）⇒ avatar 是**方形**',
      props: { avatar: true, paragraph: false },
      hasAvatar: true,
      avatarShape: 'square',
      titleWidth: undefined,
    },
    {
      name: 'avatar + paragraph（无 title）',
      props: { avatar: true, title: false },
      hasAvatar: true,
      avatarShape: 'circle',
      paraWidth: '61%',
      rows: 2,
    },
    {
      name: '三块都没有 ⇒ 没有 header、也没有 section',
      props: { avatar: false, title: false, paragraph: false },
      hasAvatar: false,
      noSection: true,
    },
  ] as const;

  for (const c of cases) {
    it(c.name, () => {
      const w = mountSkeleton({ ...c.props });
      const root = w.find(`.${P}`);

      // header 只在有 avatar 时出现
      expect(root.find(`.${P}-header`).exists()).toBe(c.hasAvatar);

      // avatar 的 size 恒为 large；shape 按组合
      if (c.hasAvatar) {
        const avatar = root.find(`.${P}-avatar`);
        expect(avatar.exists()).toBe(true);
        // ⚠️ size / shape 的后缀挂在 **`${prefixCls}-avatar`** 上（`Element.vue` 用
        //    `props.prefixCls` 当基准），不是 `-element-*`。探针实测确认：
        //    ["apollo-skeleton-avatar","apollo-skeleton-avatar-lg","apollo-skeleton-avatar-square"]
        expect(avatar.classes()).toContain(`${P}-avatar-lg`);
        expect(avatar.classes()).toContain(
          `${P}-avatar-${'avatarShape' in c ? c.avatarShape : 'circle'}`,
        );
      }

      // title
      const title = root.find(`h3.${P}-title`);
      if ('titleWidth' in c) {
        expect(title.exists()).toBe(true);
        expect(title.attributes('style') ?? '').toContain(
          c.titleWidth ? `width: ${c.titleWidth}` : '',
        );
        if (!c.titleWidth) expect(title.attributes('style') ?? '').not.toContain('width');
      }

      // paragraph
      if ('paraWidth' in c) {
        const items = root.findAll(`ul.${P}-paragraph > li`);
        expect(items.length).toBe((c as { rows?: number }).rows ?? 0);
        const last = items[items.length - 1];
        if (c.paraWidth) expect(last?.attributes('style') ?? '').toContain(`width: ${c.paraWidth}`);
        else expect(last?.attributes('style') ?? '').not.toContain('width');
      }

      if ('noSection' in c && c.noSection) {
        expect(root.find(`.${P}-section`).exists()).toBe(false);
        expect(root.find(`.${P}-header`).exists()).toBe(false);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// 3. DOM 结构
// ---------------------------------------------------------------------------

describe('Skeleton · DOM 契约', () => {
  it('`-header` 与 `-section` 是**并列**的一级子容器，不是嵌套', () => {
    const w = mountSkeleton({ avatar: true });
    const root = w.find(`.${P}`);
    const header = root.find(`.${P}-header`);
    const section = root.find(`.${P}-section`);
    expect(header.exists()).toBe(true);
    expect(section.exists()).toBe(true);
    // 关键：section 不在 header 里面
    expect(header.find(`.${P}-section`).exists()).toBe(false);
    // 两者都是根元素的直接子元素
    expect(header.element.parentElement).toBe(root.element);
    expect(section.element.parentElement).toBe(root.element);
  });

  it('Title 是 <h3>、Paragraph 是 <ul> + rows 个 <li>', () => {
    const w = mountSkeleton({ paragraph: { rows: 4 } });
    expect(w.find(`h3.${P}-title`).exists()).toBe(true);
    const ul = w.find(`ul.${P}-paragraph`);
    expect(ul.exists()).toBe(true);
    expect(ul.findAll('li').length).toBe(4);
  });

  it('paragraph.width 是数组时逐行取；否则**只有最后一行**用 width', () => {
    // 数组
    const arr = mountSkeleton({ paragraph: { rows: 3, width: ['10%', '20%', '30%'] } });
    const liArr = arr.findAll(`ul.${P}-paragraph > li`);
    expect(liArr.map((l) => l.attributes('style'))).toEqual([
      'width: 10%;',
      'width: 20%;',
      'width: 30%;',
    ]);

    // 单值：只有最后一行有 width
    const one = mountSkeleton({ title: false, paragraph: { rows: 3, width: '42%' } });
    const liOne = one.findAll(`ul.${P}-paragraph > li`);
    expect(liOne[0]?.attributes('style') ?? '').not.toContain('width');
    expect(liOne[1]?.attributes('style') ?? '').not.toContain('width');
    expect(liOne[2]?.attributes('style') ?? '').toContain('width: 42%');
  });
});

// ---------------------------------------------------------------------------
// 4. 类名
// ---------------------------------------------------------------------------

describe('Skeleton · 类名（Skeleton.js:162-167）', () => {
  it.each([
    ['with-avatar', { avatar: true }],
    ['active', { active: true }],
    ['round', { round: true }],
  ])('-%s', (suffix, props) => {
    const w = mountSkeleton(props);
    expect(w.find(`.${P}`).classes()).toContain(`${P}-${suffix}`);
  });

  it('默认没有 -with-avatar / -active / -round', () => {
    const w = mountSkeleton();
    const cls = w.find(`.${P}`).classes();
    expect(cls).not.toContain(`${P}-with-avatar`);
    expect(cls).not.toContain(`${P}-active`);
    expect(cls).not.toContain(`${P}-round`);
  });

  it('⚠️ loading 不产生任何类名（`-loading` 不存在）', () => {
    const w = mountSkeleton({ loading: true });
    expect(w.find(`.${P}`).classes()).not.toContain(`${P}-loading`);
  });
});

// ---------------------------------------------------------------------------
// 5. 用户对象覆盖基础推导
// ---------------------------------------------------------------------------

describe('Skeleton · 用户对象覆盖（Skeleton.js:17-22）', () => {
  it('avatar 传对象时覆盖推导出的 shape', () => {
    const w = mountSkeleton({ avatar: { shape: 'square' }, paragraph: true });
    expect(w.find(`.${P}-avatar`).classes()).toContain(`${P}-avatar-square`);
  });

  it('avatar 传 true 时用推导值（hasTitle && !hasParagraph ⇒ square）', () => {
    const w = mountSkeleton({ avatar: true, paragraph: false });
    expect(w.find(`.${P}-avatar`).classes()).toContain(`${P}-avatar-square`);
  });

  it('avatar 传 true 且有 paragraph ⇒ circle', () => {
    const w = mountSkeleton({ avatar: true, paragraph: true });
    expect(w.find(`.${P}-avatar`).classes()).toContain(`${P}-avatar-circle`);
  });

  it('title 传对象时覆盖推导出的 width', () => {
    const w = mountSkeleton({ title: { width: '77%' } });
    expect(w.find(`h3.${P}-title`).attributes('style')).toContain('width: 77%');
  });
});
