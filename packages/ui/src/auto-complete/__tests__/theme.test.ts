/**
 * L7 主题 —— AutoComplete **没有 Component Token**，也**没有自有样式模块**。
 *
 * 🚨 上游 `components/auto-complete/` **根本没有 `style/` 目录** ——
 * AutoComplete 渲染的是 `<Select>`，样式（含 `.{p}-select-*` 全套）来自 **select 包**。
 * 本仓同判：`style/index.ts` 已删除（原先的生成器占位是错的形态），只留 `style/token.ts`。
 *
 * 这个文件证明：① 本组件没有 Component Token；② **确实没有** `style/index.ts`
 * （一旦有人加回占位文件、或加了 token 却忘了声明，会红）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { themeTest } from '@apollo-design/test-utils';
import { getDesignToken } from '@apollo-design/theme';
import { describe, expect, it } from 'vitest';
import { prepareComponentToken } from '../style/token';

themeTest('AutoComplete', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 10,
});

describe('AutoComplete · 无 Component Token', () => {
  it('`prepareComponentToken` 返回**空对象**', () => {
    expect(prepareComponentToken(getDesignToken())).toEqual({});
  });

  it('`style/token.ts` 是**真实实现**（不是 `TODO(G3)` 占位）', () => {
    const src = fs.readFileSync(path.resolve(import.meta.dirname, '../style/token.ts'), 'utf8');
    expect(src).not.toContain('TODO(G3)');
  });
});

describe('AutoComplete · 无自有样式模块', () => {
  it('🚨 **没有** `style/index.ts`（上游也没有 `style/` 目录 —— 样式来自 select）', () => {
    expect(fs.existsSync(path.resolve(import.meta.dirname, '../style/index.ts'))).toBe(false);
  });

  it('`ui/src/index.ts` 也**没有**导出本组件的样式生成器', () => {
    const root = path.resolve(import.meta.dirname, '../../index.ts');
    const src = fs.readFileSync(root, 'utf8');
    expect(src).not.toMatch(/genAutoCompleteStyle|AutoCompleteTokenDecls/);
  });
});
