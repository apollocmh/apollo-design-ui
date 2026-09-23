/**
 * L1/L2 · 单元与交互 —— QrCode
 *
 * 判据：antd 6.6.4 `es/qr-code/`（薄壳 + QrcodeStatus）+ rc `@rc-component/qrcode`
 * 的 utils（generatePath/excavateModules/getImageSettings/getMarginSize）与
 * QRCodeCanvas 的绘制语义。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { excavateModules, generatePath, getMarginSize } from '../engine/utils';
import { QrCode } from '../index';

// ============================== engine utils ==============================

describe('QrCode · engine utils', () => {
  const cells3 = [
    [true, false, true],
    [false, false, true],
    [true, true, false],
  ];

  it('generatePath：连续模块合并、行末分支', () => {
    const d = generatePath(cells3, 0);
    // row0: M0 0h1v1H0z（x=0 单格）+ M2 0h1v1H2z（行末单格）
    // row1: M2 1h1v1H2z
    // row2: M0 2h2v1H0z（连续两格）
    // ⚠️ 上游模板两种格式：行中 'M{x} {y}h…'、行末 'M{x},{y} h…'（逐字移植）
    expect(d).toBe('M0 0h1v1H0zM2,0 h1v1H2zM2,1 h1v1H2zM0 2h2v1H0z');
  });

  it('generatePath：margin 偏移', () => {
    const d = generatePath([[true]], 4);
    expect(d).toBe('M4,4 h1v1H4z');
  });

  it('excavateModules：挖空矩形区域', () => {
    const out = excavateModules(cells3, { x: 1, y: 1, w: 2, h: 1 });
    expect(out[1]).toEqual([false, false, false]);
    expect(out[0]).toEqual(cells3[0]); // 行外不受影响
    expect(out[2]).toEqual(cells3[2]);
  });

  it('getMarginSize：marginSize 优先（floor + 非负）', () => {
    expect(getMarginSize(false, 2.9)).toBe(2);
    expect(getMarginSize(false, -3)).toBe(0);
    expect(getMarginSize(false)).toBe(0); // DEFAULT_MARGIN_SIZE
    expect(getMarginSize(true)).toBe(4); // SPEC_MARGIN_SIZE
  });
});

// ============================== 组件行为 ==============================

describe('QrCode · 组件', () => {
  it('无 value ⇒ 渲染 null + dev 告警', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const w = mount(h(QrCode, { value: undefined } as never));
    expect(w.find('.apollo-qrcode').exists()).toBe(false);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('canvas 形态：根 + canvas[role=img]，默认 160', () => {
    const w = mount(h(QrCode, { value: 'https://apollo.design' }));
    expect(w.find('.apollo-qrcode').exists()).toBe(true);
    const canvas = w.find('canvas');
    expect(canvas.exists()).toBe(true);
    expect(canvas.attributes('role')).toBe('img');
    expect(canvas.attributes('width')).toBe('160');
    // jsdom 的 getContext 未实现 ⇒ 绘制在浏览器端进行（L6 像素验证）
  });

  it('svg 形态：viewBox = numCells²，path 两条（bg + fg）', () => {
    const w = mount(h(QrCode, { value: 'https://apollo.design', type: 'svg' }));
    const svg = w.find('svg');
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('viewBox')).toBe('0 0 25 25'); // value 长度 ⇒ v3 21+4margin
    const paths = svg.findAll('path');
    expect(paths).toHaveLength(2);
    expect(paths[0]!.attributes('d')).toBe('M0,0 h25v25H0z');
    expect(paths[1]!.attributes('d')!.length).toBeGreaterThan(100);
  });

  it('icon ⇒ 隐藏 img 预载（canvas 分支）', () => {
    const w = mount(
      h(QrCode, { value: 'https://apollo.design', icon: 'https://example.com/logo.png' }),
    );
    const img = w.find('img[alt="QR-Code"]');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://example.com/logo.png');
  });

  it('bordered=false ⇒ -borderless 类', () => {
    const w = mount(h(QrCode, { value: 'x', bordered: false }));
    expect(w.find('.apollo-qrcode-borderless').exists()).toBe(true);
  });

  it('status=expired ⇒ -cover 覆盖层 + locale 文案；refresh 事件可达', async () => {
    const onRefresh = vi.fn();
    const w = mount(h(QrCode, { value: 'x', status: 'expired', onRefresh }));
    const cover = w.find('.apollo-qrcode-cover');
    expect(cover.exists()).toBe(true);
    expect(w.find('.apollo-qrcode-expired').text()).toBe('QR code expired');
    // 点击刷新按钮 ⇒ emit('refresh') ⇒ 调用 onRefresh
    const btn = cover.find('button');
    expect(btn.exists()).toBe(true);
    await btn.trigger('click');
    expect(onRefresh).toHaveBeenCalled();
  });

  it('status=scanned ⇒ -scanned 文案；loading ⇒ Spin', () => {
    const scanned = mount(h(QrCode, { value: 'x', status: 'scanned' }));
    expect(scanned.find('.apollo-qrcode-scanned').text()).toBe('Scanned');
    const loading = mount(h(QrCode, { value: 'x', status: 'loading' }));
    expect(loading.find('.apollo-spin').exists()).toBe(true);
  });

  it('statusRender 完全接管覆盖层', () => {
    const w = mount(
      h(QrCode, {
        value: 'x',
        status: 'expired',
        statusRender: () => h('div', { class: 'custom-render' }, 'CUSTOM'),
      }),
    );
    expect(w.find('.custom-render').text()).toBe('CUSTOM');
    expect(w.find('.apollo-qrcode-expired').exists()).toBe(false);
  });

  it('errorLevel=L + icon ⇒ dev 告警', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    mount(h(QrCode, { value: 'x', icon: 'https://example.com/logo.png', errorLevel: 'L' }));
    expect(error.mock.calls.some((c) => String(c[0]).includes('ErrorLevel `L`'))).toBe(true);
    error.mockRestore();
  });

  it('ref.nativeElement 指向根元素', () => {
    const w = mount(h(QrCode, { value: 'x' }));
    const exposed = (w.vm as unknown as { nativeElement?: HTMLElement | null }).nativeElement;
    expect(exposed).toBeInstanceOf(HTMLElement);
  });

  it('语义槽 root/cover 落点', () => {
    const w = mount(
      h(QrCode, {
        value: 'x',
        status: 'scanned',
        classNames: { root: 'cls-root', cover: 'cls-cover' },
        styles: { cover: { color: 'red' } },
      }),
    );
    expect(w.find('.apollo-qrcode').classes()).toContain('cls-root');
    const cover = w.find('.apollo-qrcode-cover');
    expect(cover.classes()).toContain('cls-cover');
  });
});
