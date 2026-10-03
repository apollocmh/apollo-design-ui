/**
 * React 侧（antd 6.6.4）的 Mentions 视觉用例。与 vue/mentions.js 逐条对应。
 *
 * ⚠️ `panel` 变体需要「敲 `@`」这个交互才能展开候选 —— 用 `useEffect` 在挂载后
 *    直接派发 `input` + `keyup`（两侧同款做法），并把浮层 `getPopupContainer`
 *    指向自己的 wrapper，否则 portal 到 body 的面板**不在 `#stage` 的截图范围里**。
 */

import { Mentions } from 'antd';
import { useEffect, useRef } from 'react';

const OPTIONS = [
  { value: 'afc163', label: 'afc163' },
  { value: 'zombieJ', label: 'zombieJ' },
  { value: 'yesmeck', label: 'yesmeck' },
];

const box = (children, minHeight = 200) => (
  <div style={{ minHeight, padding: 16, width: 420 }}>{children}</div>
);

const column = (...children) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
);

/** 挂载后敲 `@`，把候选面板钉在静态帧里。 */
function OpenPanel() {
  const holder = useRef(null);

  useEffect(() => {
    const ta = holder.current?.querySelector('textarea');
    if (!ta) return;
    ta.value = '@';
    ta.setSelectionRange(1, 1);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: '@' }));
  }, []);

  return (
    <div ref={holder} style={{ position: 'relative', minHeight: 220, padding: 16, width: 420 }}>
      <Mentions
        options={OPTIONS}
        value="@"
        style={{ width: 320 }}
        getPopupContainer={() => holder.current}
      />
    </div>
  );
}

export default {
  basic: () =>
    box(
      column(
        <Mentions options={OPTIONS} defaultValue="@afc163" style={{ width: 320 }} />,
        <Mentions options={OPTIONS} defaultValue="@zombieJ" disabled style={{ width: 320 }} />,
      ),
    ),

  sizes: () =>
    box(
      column(
        <Mentions size="large" placeholder="large size" style={{ width: 320 }} />,
        <Mentions placeholder="default size" style={{ width: 320 }} />,
        <Mentions size="small" placeholder="small size" style={{ width: 320 }} />,
      ),
    ),

  variants: () =>
    box(
      column(
        <Mentions placeholder="Outlined" style={{ width: 320 }} />,
        <Mentions placeholder="Filled" variant="filled" style={{ width: 320 }} />,
        <Mentions placeholder="Borderless" variant="borderless" style={{ width: 320 }} />,
        <Mentions placeholder="Underlined" variant="underlined" style={{ width: 320 }} />,
      ),
      320,
    ),

  status: () =>
    box(
      column(
        <Mentions defaultValue="@afc163" status="error" style={{ width: 320 }} />,
        <Mentions defaultValue="@afc163" status="warning" style={{ width: 320 }} />,
      ),
    ),

  allowClear: () =>
    box(
      column(
        <Mentions defaultValue="hello world" allowClear style={{ width: 320 }} />,
        <Mentions defaultValue="hello world" allowClear rows={3} style={{ width: 320 }} />,
      ),
    ),

  readOnly: () =>
    box(
      column(
        <Mentions placeholder="this is disabled Mentions" disabled style={{ width: 320 }} />,
        <Mentions placeholder="this is readOnly Mentions" readOnly style={{ width: 320 }} />,
      ),
    ),

  semantic: () =>
    box(
      column(
        <Mentions
          defaultValue="@afc163"
          allowClear
          classNames={{ root: 'mentions-visual-root', textarea: 'mentions-visual-textarea' }}
          styles={{
            root: { border: '1px solid #722ed1' },
            textarea: { color: '#1677ff' },
            suffix: { color: '#eb2f96' },
          }}
          style={{ width: 320 }}
        />,
      ),
    ),

  panel: () => <OpenPanel />,
};
