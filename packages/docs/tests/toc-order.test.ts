/**
 * 组件页「本页目录」的顺序（2026-10-20 修）。
 *
 * 症状：用户报「表格文档页目录没更新」—— 右侧 TOC 里「代码演示」排在**最后**，
 * 而正文里它在「引入」之后、API 之前。
 *
 * 根因：生成器 `splitDocBody()` 拿 `## 代码演示` 当切分点，把标题**连同那一行**
 * 一起吃掉（`rest = src.slice(restStart + m[0].length)`），所以 `doc.toc` 里
 * 天然没有这一项；ComponentPage 旧实现直接 `[...toc, demo]` 追加 ⇒ 顺序错位。
 *
 * 这里钉的是纯函数 `withDemoAnchor()` 的插入位置，不依赖 DOM / 路由。
 */
import { describe, expect, it } from 'vitest';
import { withDemoAnchor } from '../src/composables/toc';
import type { TocItem } from '../src/types/manifest';

const item = (level: 2 | 3, text: string, id: string): TocItem => ({ level, text, id });

describe('组件页 TOC：代码演示锚点的插入位置', () => {
  it('⭐ 插到「API」之前（与正文 intro → 代码演示 → rest 的顺序一致）', () => {
    const toc = [
      item(2, '何时使用', '何时使用'),
      item(2, '引入', '引入'),
      item(2, 'API', 'api'),
      item(3, 'Table', 'table'),
      item(2, '语义化与可访问性', '语义化与可访问性'),
    ];
    expect(withDemoAnchor(toc, '代码演示').map((t) => t.id)).toEqual([
      '何时使用',
      '引入',
      'demos',
      'api',
      'table',
      '语义化与可访问性',
    ]);
  });

  it('锚点 id 恒为 `demos`、层级恒为 2（对应本页渲染的 <section id="demos">）', () => {
    const out = withDemoAnchor([item(2, 'API', 'api')], 'Code Demo');
    expect(out[0]).toEqual({ level: 2, text: 'Code Demo', id: 'demos' });
  });

  it('「API」大小写不敏感（英文文档 / 自定义写法都能命中）', () => {
    const out = withDemoAnchor([item(2, 'Intro', 'intro'), item(2, 'Api', 'API')], '代码演示');
    expect(out.map((t) => t.id)).toEqual(['intro', 'demos', 'API']);
  });

  it('没有 API 章节时退化为追加 —— 宁可顺序差一点，也不能丢掉入口', () => {
    const out = withDemoAnchor([item(2, '何时使用', '何时使用')], '代码演示');
    expect(out.map((t) => t.id)).toEqual(['何时使用', 'demos']);
  });

  it('只认 level 2 的 API（三级标题同名不算）', () => {
    const out = withDemoAnchor(
      [item(3, 'API', 'api'), item(2, '语义化与可访问性', 'a11y')],
      '代码演示',
    );
    expect(out.map((t) => t.id)).toEqual(['api', 'a11y', 'demos']);
  });

  it('不修改入参数组（computed 里复用同一份 doc.toc）', () => {
    const toc = [item(2, 'API', 'api')];
    const snapshot = [...toc];
    withDemoAnchor(toc, '代码演示');
    expect(toc).toEqual(snapshot);
  });
});
