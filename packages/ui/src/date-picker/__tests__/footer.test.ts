/**
 * L2 / L4 · 浮层页脚（`-footer`）—— DatePicker
 *
 * 契约来源（**读源码得到**）：`@rc-component/picker@1.12.2` 的
 * `es/PickerInput/Popup/Footer.js`（78 行）+ `es/PickerInput/hooks/useShowNow.js`（14 行）
 * + `es/PickerInput/Popup/index.js:98-163`。
 *
 * ── 页脚出现的条件是**三个独立开关**的组合（最容易漏的是第 1、2 条）──────────
 *
 * | 节点 | 条件 |
 * |---|---|
 * | 整个 `-footer` | `renderExtraFooter` 可渲染 **或** `-ranges` 可渲染；否则**返回 `null`** |
 * | `-ranges > -now` | `useShowNow(picker, **mergedMode**, showNow, showToday)` **且** `!multiple` |
 * | `-ranges > -ok` | `needConfirm` |
 *
 * 🚨 **`useShowNow` 的第二参是面板当前粒度 `mergedMode`**，所以：
 *   - `picker: 'month' / 'year'` ⇒ `mode` 非 date/time ⇒ **没有页脚**；
 *   - `multiple: true` ⇒ 上游 `Popup/index.js:130` 的 `showNow={multiple ? false : …}` ⇒ **没有页脚**。
 * L6 的 antd 基线正是靠这个区分：`basic` 容器高 **348**、`month` / `year` / `multiple` 是 **309**。
 *
 * 🚨 **文案判据是 `internalMode`（组件粒度），不是 `mode`（面板粒度）**：
 * `date + showTime` 的 `internalMode` 是 `'datetime'` ⇒ 显示 **`Now`** 而不是 `Today`。
 */

import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import DatePicker from '../DatePicker.vue';

const P = 'apollo-picker';
const D = (s: string) => dayjs(s);

/** 浮层只有 `open: true` 时才渲染。 */
const mountOpen = (props: Record<string, unknown> = {}) =>
  mount(DatePicker, { props: { open: true, ...props } });

const footer = (w: ReturnType<typeof mount>) => w.find(`.${P}-footer`);
const nowBtn = (w: ReturnType<typeof mount>) => w.find(`.${P}-now-btn`);
const okButton = (w: ReturnType<typeof mount>) => w.find(`.${P}-ok button`);

describe('DatePicker · 浮层页脚 —— 出现条件', () => {
  it('`picker: date` ⇒ 有页脚，`Today` 居中在 `-ranges` 里', () => {
    const w = mountOpen();
    expect(footer(w).exists()).toBe(true);
    expect(w.find(`.${P}-ranges`).exists()).toBe(true);
    expect(nowBtn(w).text()).toBe('Today');
    // 单值选择器没有 `-ok`（`needConfirm` 为假）
    expect(w.find(`.${P}-ok`).exists()).toBe(false);
    w.unmount();
  });

  it('🚨 `picker: month` / `year` ⇒ **没有页脚**（`useShowNow` 的 `mode` 分支）', () => {
    for (const picker of ['month', 'year'] as const) {
      const w = mountOpen({ picker });
      expect(footer(w).exists()).toBe(false);
      w.unmount();
    }
  });

  it('🚨 `multiple` ⇒ **没有页脚**（上游 `Popup` 的 `multiple ? false : showNow`）', () => {
    const w = mountOpen({ multiple: true, defaultValue: [D('2026-09-30')] });
    expect(footer(w).exists()).toBe(false);
    w.unmount();
  });

  it('`showToday: false` ⇒ 没有页脚（显式关闭要生效）', () => {
    const w = mountOpen({ showToday: false });
    expect(footer(w).exists()).toBe(false);
    w.unmount();
  });

  it('`showNow` 优先于 `showToday`（`!== undefined` 判据，不是 truthy）', () => {
    // `showToday: false` + `showNow: true` ⇒ 以 `showNow` 为准
    const w = mountOpen({ showToday: false, showNow: true });
    expect(footer(w).exists()).toBe(true);
    w.unmount();
  });
});

describe('DatePicker · 浮层页脚 —— 文案与 OK', () => {
  it('🚨 `showTime` ⇒ 文案是 `Now`（判据是 `internalMode` = `datetime`）', () => {
    const w = mountOpen({ showTime: true });
    expect(nowBtn(w).text()).toBe('Now');
    // `showTime` 让 `needConfirm` 默认为真 ⇒ 出现 OK
    expect(okButton(w).exists()).toBe(true);
    expect(okButton(w).text()).toBe('OK');
    w.unmount();
  });

  it('`OK` 的禁用态：无值 ⇒ 禁用；有值 ⇒ 可用（上游 `disableSubmit`）', () => {
    const empty = mountOpen({ showTime: true });
    expect(okButton(empty).attributes('disabled')).toBeDefined();
    empty.unmount();

    const filled = mountOpen({ showTime: true, defaultValue: D('2026-09-30') });
    expect(okButton(filled).attributes('disabled')).toBeUndefined();
    filled.unmount();
  });

  it('`needConfirm: false` + `showTime` ⇒ 没有 OK（但仍有时刻按钮）', () => {
    const w = mountOpen({ showTime: true, needConfirm: false });
    expect(okButton(w).exists()).toBe(false);
    expect(footer(w).exists()).toBe(true);
    w.unmount();
  });
});

describe('DatePicker · 浮层页脚 —— 交互与扩展', () => {
  it('点「此刻 / 今天」⇒ 提交该值并发 `change` / `update:value`', async () => {
    const w = mountOpen();
    await nowBtn(w).trigger('click');
    await nextTick();

    const emitted = w.emitted('update:value');
    expect(emitted).toBeTruthy();
    const next = emitted?.at(-1)?.[0] as { isValid?: () => boolean } | undefined;
    expect(next).toBeTruthy();
    expect(next?.isValid?.()).toBe(true);
    // 上游 `onPresetSubmit` 在 `!multiple` 时**关浮层**
    expect(w.emitted('update:open')?.at(-1)).toEqual([false]);
    w.unmount();
  });

  it('`renderExtraFooter` ⇒ 渲染 `-footer-extra`（在 `-ranges` 之前）', () => {
    const w = mountOpen({ renderExtraFooter: () => 'EXTRA' });
    const extra = w.find(`.${P}-footer-extra`);
    expect(extra.exists()).toBe(true);
    expect(extra.text()).toBe('EXTRA');
    // 顺序：extra 在前，ranges 在后
    const html = footer(w).html();
    expect(html.indexOf(`${P}-footer-extra`)).toBeLessThan(html.indexOf(`${P}-ranges`));
    w.unmount();
  });

  it('🚨 `renderExtraFooter` 返回空串 ⇒ **整个页脚不渲染**（`isRenderable` 判据）', () => {
    // 上游 `isReactRenderable('')` 是 **false**（`@rc-component/util` 的 `es/is.js`）。
    // 若误按 truthy / 「空串算可渲染」实现，这里会渲染出一个空的 `-footer`，
    // 把页脚凭空撑出来（L6 会立刻红）。
    const w = mountOpen({ showToday: false, renderExtraFooter: () => '' });
    expect(footer(w).exists()).toBe(false);
    w.unmount();
  });

  it('语义槽 `classNames.popup.footer` / `styles.popup.footer` 落到页脚上', () => {
    const w = mountOpen({
      classNames: { popup: { footer: 'c-footer' } },
      styles: { popup: { footer: { backgroundColor: 'red' } } },
    });
    const el = footer(w);
    expect(el.classes()).toContain('c-footer');
    expect(el.attributes('style')).toContain('background-color: red');
    w.unmount();
  });
});
