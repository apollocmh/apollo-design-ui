/**
 * 独立图标目录（2026-10-21 审计 A13）。
 *
 * 钉住三件事：848 个真实图标可枚举、筛选/搜索是纯逻辑且大小写不敏感、
 * 复制片段是可直接运行的 Vue 3 用法；以及 `/components/icon` 不被
 * `/components/:name` 抢走、且不进入 72 个 UI 组件的 Registry 口径。
 */
import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import manifest from '../.generated/manifest.json';
import { filterIcons, iconSnippet } from '../src/composables/icon-catalog';
import { routes } from '../src/router';
import type { IconMeta } from '../src/types/manifest';

const icons = manifest.icons.items as IconMeta[];

describe('图标目录清单', () => {
  it('848 个图标、三种风格计数正确', () => {
    expect(icons.length).toBe(848);
    expect(manifest.icons.byStyle).toEqual({ outlined: 447, filled: 251, twoTone: 150 });
  });

  it('名称全局唯一（复制/搜索主键）', () => {
    expect(new Set(icons.map((i) => i.name)).size).toBe(icons.length);
  });
});

describe('filterIcons', () => {
  it('大小写不敏感的子串搜索', () => {
    expect(filterIcons(icons, 'search', 'all').some((i) => i.name === 'SearchOutlined')).toBe(true);
    expect(filterIcons(icons, 'SEARCHOUTLINED', 'all').map((i) => i.name)).toContain(
      'SearchOutlined',
    );
  });

  it('风格筛选与搜索叠加', () => {
    const filled = filterIcons(icons, 'star', 'filled');
    expect(filled.length).toBeGreaterThan(0);
    expect(filled.every((i) => i.style === 'filled' && /star/i.test(i.name))).toBe(true);
    expect(filled.map((i) => i.name)).toContain('StarFilled');
  });

  it('空查询返回所选风格全集；无匹配返回空数组', () => {
    expect(filterIcons(icons, '', 'twoTone').length).toBe(150);
    expect(filterIcons(icons, 'zzz-no-such-icon', 'all')).toEqual([]);
  });
});

describe('iconSnippet', () => {
  it('三种复制模式都是可直接使用的 Vue 3 文本', () => {
    expect(iconSnippet('SearchOutlined', 'name')).toBe('SearchOutlined');
    expect(iconSnippet('SearchOutlined', 'tag')).toBe('<SearchOutlined />');
    expect(iconSnippet('SearchOutlined', 'import')).toBe(
      "import { SearchOutlined } from '@apollo-design/icons';",
    );
  });
});

describe('/components/icon 路由', () => {
  const router = createRouter({ history: createMemoryHistory(), routes });

  it('命中独立图标页，而不是名为 icon 的组件页', () => {
    expect(router.resolve('/components/icon').name).toBe('icon');
    expect(router.resolve('/components/button').name).toBe('component');
  });
});
