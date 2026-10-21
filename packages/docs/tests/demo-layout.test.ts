/**
 * V3 Demo 档位：默认值由组件类别推断，frontmatter 可显式覆盖。
 *
 * 这里钉住的是「画布档位不是组件内部样式」这条边界：组件源码不感知文档站，
 * 同一个组件在不同 demo 里可以通过 preview.size / preview.span 调整展示。
 */
import { describe, expect, it } from 'vitest';
import { defaultDemoSize, resolveDemoLayout } from '../src/composables/demo-layout';
import type { DemoMeta } from '../src/types/manifest';

const demoOf = (component: string, preview: DemoMeta['preview'] = { mode: 'inline' }) =>
  ({ component, preview }) as DemoMeta;

describe('defaultDemoSize', () => {
  it('小控件 ⇒ compact；宽内容 ⇒ full；其余 ⇒ interactive', () => {
    expect(defaultDemoSize('button')).toBe('compact');
    expect(defaultDemoSize('tag')).toBe('compact');
    expect(defaultDemoSize('table')).toBe('full');
    expect(defaultDemoSize('form')).toBe('full');
    expect(defaultDemoSize('select')).toBe('interactive');
    expect(defaultDemoSize('date-picker')).toBe('interactive');
  });
});

describe('resolveDemoLayout', () => {
  it('未声明时 full 档占满一行，其余单列', () => {
    expect(resolveDemoLayout(demoOf('table'))).toEqual({ size: 'full', span: 'full' });
    expect(resolveDemoLayout(demoOf('button'))).toEqual({ size: 'compact', span: 1 });
    expect(resolveDemoLayout(demoOf('select'))).toEqual({ size: 'interactive', span: 1 });
  });

  it('frontmatter 显式 size / span 覆盖默认', () => {
    expect(resolveDemoLayout(demoOf('button', { mode: 'inline', size: 'full' }))).toEqual({
      size: 'full',
      span: 'full',
    });
    expect(
      resolveDemoLayout(demoOf('select', { mode: 'inline', size: 'compact', span: 2 })),
    ).toEqual({ size: 'compact', span: 2 });
    expect(resolveDemoLayout(demoOf('table', { mode: 'inline', span: 1 }))).toEqual({
      size: 'full',
      span: 1,
    });
  });

  it('viewport 模式不改变档位推断（窗口尺寸由 viewportHeight 控制）', () => {
    expect(
      resolveDemoLayout(demoOf('float-button', { mode: 'viewport', viewportHeight: 320 })),
    ).toEqual({ size: 'interactive', span: 1 });
  });
});
