/**
 * L5 · 无障碍 —— Tour
 *
 * 可达性契约（源自实现与 antd 逐字判据）：
 *   - 关闭按钮是原生 `<button type="button">`，`aria-label` 来自
 *     `locale.global.close`（默认 'Close'），`closable` 上的 `aria-*` 透传；
 *   - prev / next 是原生 `<button>`，文本即可访问名（locale 或用户覆盖）；
 *   - 键盘：Esc 关闭（Portal 层栈）、←/→ 切步骤、输入类元素不抢键
 *     （keyboard.test.ts 已覆盖，这里只断言按钮可达性）。
 *
 * ⚠️ axe 扫全部 9 个 demo（0 violation）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { Tour } from '../index';

a11yDemoTest('Tour', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 9,
});

const closeBtn = () => document.querySelector<HTMLButtonElement>('.apollo-tour-close');
const nextBtn = () => document.querySelector<HTMLButtonElement>('.apollo-tour-next-btn');
const prevBtn = () => document.querySelector<HTMLButtonElement>('.apollo-tour-prev-btn');

function mountTour(props: Record<string, unknown> = {}) {
  return mount(Tour, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: { open: true, steps: [{ title: 'a', description: 'b' }], ...props },
  });
}

async function waitOpen(): Promise<void> {
  await nextTick();
  await nextTick();
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Tour · ARIA 契约', () => {
  it('关闭按钮：原生 button + aria-label=Close（locale.global.close）', async () => {
    mountTour();
    await waitOpen();
    const btn = closeBtn();
    expect(btn).not.toBeNull();
    expect(btn?.tagName).toBe('BUTTON');
    expect(btn?.getAttribute('type')).toBe('button');
    expect(btn).toHaveAttribute('aria-label', 'Close');
  });

  it('closable 的 aria-* 透传到关闭按钮', async () => {
    mountTour({ steps: [{ title: 'a', closable: { 'aria-label': 'Custom Close Button' } }] });
    await waitOpen();
    expect(closeBtn()).toHaveAttribute('aria-label', 'Custom Close Button');
  });

  it('closable=false：不渲染关闭按钮', async () => {
    mountTour({ closable: false });
    await waitOpen();
    expect(closeBtn()).toBeNull();
  });

  it('prev / next 是原生 button 且有可访问文本（locale 文案）', async () => {
    const target = document.createElement('button');
    document.body.appendChild(target);
    mountTour({
      steps: [
        { title: 's0', target: () => target },
        { title: 's1', target: () => target },
      ],
    });
    await waitOpen();
    expect(nextBtn()?.tagName).toBe('BUTTON');
    expect(nextBtn()?.textContent?.trim().length).toBeGreaterThan(0);
    // 切到第二步，prev 出现且可达
    nextBtn()?.click();
    await waitOpen();
    expect(prevBtn()?.tagName).toBe('BUTTON');
    expect(prevBtn()?.textContent?.trim().length).toBeGreaterThan(0);
    target.remove();
  });

  it('关闭按钮可聚焦（原生 button，未被 tabindex 剥离）', async () => {
    mountTour();
    await waitOpen();
    const btn = closeBtn();
    btn?.focus();
    expect(document.activeElement).toBe(btn);
  });
});
