/**
 * `.html` 深链接守卫（`stripHtmlGuard`）——
 * SSG `dirStyle: 'flat'` 产出 `.html` 物理路径（sitemap / GitHub Pages 直链），
 * 客户端路由只认无后缀路径；不剥的话水合后会被 catch-all 换成 404 页
 * （用户报告「没渲染 popconfirm」的根因之一，2026-10-17）。
 */
import { describe, expect, it } from 'vitest';
import { stripHtmlGuard } from '../src/router';

describe('stripHtmlGuard · 剥掉 .html 后缀', () => {
  it('组件页 .html ⇒ 重定向到无后缀路径', () => {
    expect(stripHtmlGuard({ path: '/components/popconfirm.html', query: {}, hash: '' })).toEqual({
      path: '/components/popconfirm',
      query: {},
      hash: '',
    });
  });

  it('保留 query 与 hash（锚点直链不能丢）', () => {
    expect(
      stripHtmlGuard({
        path: '/guide/getting-started.html',
        query: { lang: 'en' },
        hash: '#api',
      }),
    ).toEqual({ path: '/guide/getting-started', query: { lang: 'en' }, hash: '#api' });
  });

  it('根路径 .html ⇒ 回落 /', () => {
    expect(stripHtmlGuard({ path: '/index.html', query: {}, hash: '' })).toEqual({
      path: '/',
      query: {},
      hash: '',
    });
  });

  it('无后缀路径 ⇒ 不干预（undefined = 放行）', () => {
    expect(stripHtmlGuard({ path: '/components/popconfirm', query: {}, hash: '' })).toBeUndefined();
    expect(stripHtmlGuard({ path: '/', query: {}, hash: '' })).toBeUndefined();
  });
});
