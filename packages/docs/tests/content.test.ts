/**
 * 内容解析层测试：frontmatter / 双语 / 文本归一化 / 锚点 ID。
 *
 * 这一层是「文档站可信度」的地基：BOM、CRLF、YAML 数字标量、缺失译文
 * 任何一种没处理好，症状都不会出现在解析处，而是下游某个显示崩掉
 * （例：搜索把 number 当 string 用 → 整个搜索面板渲染抛错）。
 */
import { describe, expect, it } from 'vitest';
import { CATEGORY_ORDER, compareCategories } from '../tooling/content/categories.mjs';
import {
  bilingualOf,
  localeOf,
  normalizeText,
  parseFrontmatter,
} from '../tooling/content/frontmatter.mjs';

/** frontmatter 的值是动态结构，断言时按「双语对象」读取。 */
const titleOf = (meta: Record<string, unknown>): Record<string, string> =>
  meta.title as Record<string, string>;

describe('normalizeText', () => {
  it('去掉 UTF-8 BOM', () => {
    expect(normalizeText('\uFEFF# Title')).toBe('# Title');
  });

  it('CRLF 与 CR 统一为 LF', () => {
    expect(normalizeText('a\r\nb\rc')).toBe('a\nb\nc');
  });
});

describe('parseFrontmatter', () => {
  it('解析标量 + 双语嵌套', () => {
    const raw =
      '---\norder: 3\ncategory: 通用\ntitle:\n  zh-CN: 按钮\n  en-US: Button\n---\n\n# 正文';
    const { meta, body } = parseFrontmatter(raw);
    expect(meta.order).toBe(3);
    expect(meta.category).toBe('通用');
    expect(titleOf(meta)['zh-CN']).toBe('按钮');
    expect(titleOf(meta)['en-US']).toBe('Button');
    expect(body.trim()).toBe('# 正文');
  });

  it('解析顶层点号双语（title.zh-CN 形态）', () => {
    const { meta } = parseFrontmatter('---\ntitle.zh-CN: 按钮\ntitle.en-US: Button\n---\n正文');
    expect(titleOf(meta)['zh-CN']).toBe('按钮');
    expect(titleOf(meta)['en-US']).toBe('Button');
  });

  it('无 frontmatter 时原样返回正文', () => {
    const { meta, body } = parseFrontmatter('# 只有正文');
    expect(meta).toEqual({});
    expect(body).toBe('# 只有正文');
  });

  it('CRLF + BOM 的 frontmatter 仍可解析', () => {
    const { meta } = parseFrontmatter('\uFEFF---\r\norder: 1\r\ntitle: 按钮\r\n---\r\n正文');
    expect(meta.order).toBe(1);
    expect(meta.title).toBe('按钮');
  });

  it('YAML 语法错误要抛出可读信息（不是静默空对象）', () => {
    expect(() => parseFrontmatter('---\ntitle: "未闭合\n---\n正文')).toThrow(
      /frontmatter YAML 解析失败/,
    );
  });
});

describe('localeOf / bilingualOf —— 标量类型归一化', () => {
  it('字符串形态', () => {
    expect(localeOf({ title: '按钮' }, 'title')).toBe('按钮');
  });

  // 🚨 真缺陷回归：result 组件的 demo 写的是 `title: 403`，YAML 解析成 **number**。
  // 下游把 title 当字符串用（搜索打分 .toLowerCase()），拿到 number 会直接抛错。
  it('数字标量转成字符串（不是 undefined / 不是 number）', () => {
    expect(localeOf({ title: 403 }, 'title')).toBe('403');
    expect(bilingualOf({ title: 403 }, 'title').zh).toBe('403');
    expect(typeof bilingualOf({ title: 403 }, 'title').zh).toBe('string');
  });

  it('布尔标量同样转字符串', () => {
    expect(bilingualOf({ title: true }, 'title').zh).toBe('true');
  });

  it('缺失字段回落 fallback', () => {
    expect(localeOf({}, 'title', '默认')).toBe('默认');
    expect(bilingualOf({}, 'title', '默认zh', '默认en')).toMatchObject({
      zh: '默认zh',
      en: '默认en',
    });
  });
});

describe('bilingualOf —— 译文缺失的显式回退', () => {
  it('只有中文时英文侧回退到中文，并标记 enFallback', () => {
    const r = bilingualOf({ title: { 'zh-CN': '按钮' } }, 'title');
    expect(r).toEqual({ zh: '按钮', en: '按钮', enFallback: true });
  });

  it('双语齐全时不标记回退', () => {
    const r = bilingualOf({ title: { 'zh-CN': '按钮', 'en-US': 'Button' } }, 'title');
    expect(r).toEqual({ zh: '按钮', en: 'Button', enFallback: false });
  });
});

describe('分类顺序', () => {
  it('按固定序排列', () => {
    const sorted = ['其他', '布局', '通用'].sort(compareCategories);
    expect(sorted).toEqual(['通用', '布局', '其他']);
  });

  it('未知分类排在最后且按名称稳定排序', () => {
    const sorted = ['未知B', '通用', '未知A'].sort(compareCategories);
    expect(sorted[0]).toBe('通用');
    expect(sorted.slice(1)).toEqual(['未知A', '未知B']);
  });

  it('固定序覆盖 antd 的七大类', () => {
    expect(CATEGORY_ORDER).toEqual([
      '通用',
      '布局',
      '导航',
      '数据录入',
      '数据展示',
      '反馈',
      '其他',
    ]);
  });
});
