/**
 * L7 主题 —— Masonry **没有 Component Token**（registry `tokenCount = 0`）。
 *
 * 上游 `es/masonry/style/index.js` 的 `ComponentToken` 是**空接口**、且 `genStyleHooks`
 * 没传 `prepareComponentToken` ⇒ 走默认实现（返回空对象）。本仓同构。
 *
 * ⚠️ 与 Flex 的关键差别：Flex 至少还有三个 `mergeToken` 派生值，**Masonry 连派生值都没有**
 * —— `genMasonryStyle` 只消费**全局 alias**。
 *
 * 这个文件证明：① 本组件**确实**没有 Component Token（不是「忘了写」）；
 * ② 规则里**不出现** `--apollo-masonry-*` 自有变量（一旦有人加了 token 却忘了声明，会红）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { themeTest } from '@apollo-design/test-utils';
import { getDesignToken } from '@apollo-design/theme';
import { describe, expect, it } from 'vitest';
import { genMasonryStyle } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Masonry', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 6,
});

const PREFIX = 'apollo';
const css = genMasonryStyle(PREFIX);

describe('Masonry · 无 Component Token', () => {
  it('`prepareComponentToken` 返回**空对象**（与上游的默认实现逐字对应）', () => {
    expect(prepareComponentToken(getDesignToken())).toEqual({});
  });

  it('`ComponentToken` 是空类型 —— 不引入无意义的占位字段', () => {
    // 类型层面：`Record<string, never>` ⇒ 任何字段赋值都会编译失败（见 type.test-d.ts）
    expect(Object.keys(prepareComponentToken(getDesignToken()))).toHaveLength(0);
  });

  it('🚨 样式里**没有** `--apollo-masonry-*` 自有变量（有 token 就必须有声明块）', () => {
    expect(css.match(/--apollo-masonry-/)).toBeNull();
  });

  it('`style/token.ts` 是**真实实现**（不是 `TODO(G3)` 占位）', () => {
    const src = fs.readFileSync(path.resolve(import.meta.dirname, '../style/token.ts'), 'utf8');
    expect(src).not.toContain('TODO(G3)');
    expect(src).toContain('prepareComponentToken');
  });
});
