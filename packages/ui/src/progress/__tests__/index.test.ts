/**
 * L1/L2 —— 判据：antd progress.tsx / Line / Circle / Steps 逐层。
 *
 * 覆盖：role=progressbar + aria / status 推导（>=100 ⇒ success）/ indicator（format、
 * exception/success 图标、bright 类）/ 类名链（type/line-align/line-position/steps/
 * show-info/small/inline-circle）/ Line 结构（rail > track + track-success）/ gradient
 * 变量 / Steps 激活数 / deprecated 告警 ×4 + usage ×2 / 圆环 dasharray 数学 / dashboard
 * gap / 小尺寸 Tooltip。
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { getCircleStyle } from '../engine/kernel';
import Progress from '../Progress';
import { getSize, isLightColor, sortGradient, validProgress } from '../utils';

const P = 'apollo-progress';

const mountP = (props: Record<string, unknown> = {}) =>
  mount(Progress, {
    props: props as never,
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });

describe('Progress · 结构契约（line）', () => {
  it('role=progressbar + aria-valuenow（parseInt）', () => {
    const w = mountP({ percent: 30 });
    const root = w.find(`.${P}`);
    expect(root.attributes('role')).toBe('progressbar');
    expect(root.attributes('aria-valuenow')).toBe('30');
    expect(root.attributes('aria-valuemin')).toBe('0');
    expect(root.attributes('aria-valuemax')).toBe('100');
    w.unmount();
  });

  it('类名链：-line -line-align-end -line-position-outer -show-info', () => {
    const w = mountP({ percent: 30 });
    const cls = w.find(`.${P}`).classes();
    expect(cls).toContain(`${P}-line`);
    expect(cls).toContain(`${P}-line-align-end`);
    expect(cls).toContain(`${P}-line-position-outer`);
    expect(cls).toContain(`${P}-show-info`);
    expect(cls).toContain(`${P}-status-normal`);
    w.unmount();
  });

  it('body > rail > track（width=percent%）+ indicator 外置', () => {
    const w = mountP({ percent: 30 });
    expect(w.find(`.${P}-body`).exists()).toBe(true);
    const rail = w.find(`.${P}-rail`);
    expect(rail.exists()).toBe(true);
    const track = w.find(`.${P}-track`);
    expect(track.exists()).toBe(true);
    expect((track.element as HTMLElement).style.width).toBe('30%');
    const indicator = w.find(`.${P}-indicator`);
    expect(indicator.text()).toBe('30%');
    expect(indicator.classes()).toContain(`${P}-indicator-end`);
    expect(indicator.classes()).toContain(`${P}-indicator-outer`);
    w.unmount();
  });

  it('success 分段：-track-success 宽度 = success.percent；aria-valuenow 取 success', () => {
    const w = mountP({ percent: 60, success: { percent: 20 } });
    const successTrack = w.find(`.${P}-track-success`);
    expect(successTrack.exists()).toBe(true);
    expect((successTrack.element as HTMLElement).style.width).toBe('20%');
    expect(w.find(`.${P}`).attributes('aria-valuenow')).toBe('20');
    w.unmount();
  });

  it('percent>=100 且无合法 status ⇒ status-success', () => {
    const w = mountP({ percent: 100 });
    expect(w.find(`.${P}`).classes()).toContain(`${P}-status-success`);
    // line 类型 success ⇒ CheckCircleFilled
    expect(w.find(`.${P}-indicator svg`).exists()).toBe(true);
    w.unmount();
  });

  it('status=exception ⇒ CloseCircleFilled（line）', () => {
    const w = mountP({ percent: 70, status: 'exception' });
    expect(w.find(`.${P}`).classes()).toContain(`${P}-status-exception`);
    expect(w.find(`.${P}-indicator svg`).exists()).toBe(true);
    w.unmount();
  });

  it('format 自定义 indicator（fn prop）', () => {
    const w = mountP({ percent: 30, format: (p?: number) => `P${p}` });
    expect(w.find(`.${P}-indicator`).text()).toBe('P30');
    w.unmount();
  });

  it('showInfo=false ⇒ 无 indicator；-show-info 退场', () => {
    const w = mountP({ percent: 30, showInfo: false });
    expect(w.find(`.${P}-indicator`).exists()).toBe(false);
    expect(w.find(`.${P}`).classes()).not.toContain(`${P}-show-info`);
    w.unmount();
  });

  it('size=small ⇒ -small 类；track 高 6px', () => {
    const w = mountP({ percent: 30, size: 'small' });
    expect(w.find(`.${P}`).classes()).toContain(`${P}-small`);
    expect((w.find(`.${P}-track`).element as HTMLElement).style.height).toBe('6px');
    w.unmount();
  });

  it('size 数组 [300,20] ⇒ track 高 20px', () => {
    const w = mountP({ percent: 30, size: [300, 20] });
    expect((w.find(`.${P}-track`).element as HTMLElement).style.height).toBe('20px');
    w.unmount();
  });

  it('percentPosition inner ⇒ indicator 进 track；center+outer ⇒ -body-layout-bottom', () => {
    const w = mountP({
      percent: 10,
      percentPosition: { align: 'center', type: 'inner' },
      size: [300, 20],
    });
    expect(w.find(`.${P}-track .${P}-indicator`).exists()).toBe(true);
    w.unmount();

    const w2 = mountP({ percent: 60, percentPosition: { align: 'center' } });
    expect(w2.find(`.${P}-body-layout-bottom`).exists()).toBe(true);
    w2.unmount();
  });

  it('gradient：background + --progress-line-stroke-color 变量（无前缀，产物逐字）', () => {
    const w = mountP({ percent: 30, strokeColor: { from: '#108ee9', to: '#87d068' } });
    const style = (w.find(`.${P}-track`).element as HTMLElement).getAttribute('style') ?? '';
    expect(style).toContain('linear-gradient(to right, #108ee9, #87d068)');
    expect(style).toContain('--progress-line-stroke-color');
    w.unmount();
  });

  it('多键 gradient 按 % 排序拼接', () => {
    const w = mountP({
      percent: 30,
      strokeColor: { '0%': '#afc163', '75%': '#009900', '50%': 'green' },
    });
    const style = (w.find(`.${P}-track`).element as HTMLElement).getAttribute('style') ?? '';
    expect(style).toContain('#afc163 0%, green 50%, #009900 75%');
    w.unmount();
  });

  it('strokeLinecap=butt ⇒ track/rail 圆角 0', () => {
    const w = mountP({ percent: 30, strokeLinecap: 'butt' });
    const trackStyle = (w.find(`.${P}-track`).element as HTMLElement).style;
    expect(trackStyle.borderRadius).toBe('0px');
    w.unmount();
  });

  it('steps ⇒ -steps 类 + -steps-item-active 数量', () => {
    const w = mountP({ percent: 60, steps: 5 });
    const cls = w.find(`.${P}`).classes();
    expect(cls).toContain(`${P}-steps`);
    expect(w.findAll(`.${P}-steps-item`).length).toBe(5);
    expect(w.findAll(`.${P}-steps-item-active`).length).toBe(3); // round(5*0.6)
    w.unmount();
  });
});

describe('Progress · 结构契约（circle/dashboard）', () => {
  it('type=circle ⇒ -circle 类；SVG viewBox 0 0 100 100；rail/path 圈', () => {
    const w = mountP({ percent: 75, type: 'circle' });
    const cls = w.find(`.${P}`).classes();
    expect(cls).toContain(`${P}-circle`);
    const svg = w.find(`.${P}-circle svg`);
    expect(svg.attributes('viewBox')).toBe('0 0 100 100');
    expect(w.find(`.${P}-circle-rail`).exists()).toBe(true);
    // 主段 + success 段（逆序渲染：主在前）
    const paths = w.findAll(`.${P}-circle-path`);
    expect(paths.length).toBe(2);
    // dasharray 逐值（r=47, c=2πr）
    const main = paths[0]!.element as SVGElement;
    const c = 2 * Math.PI * 47;
    expect(main.getAttribute('style')).toContain(`${c}px ${c}`);
    // dashoffset = (1-0.75)*c + strokeWidth/2(=3, round 修正)
    expect(main.getAttribute('style')).toContain(`stroke-dashoffset: ${(1 - 0.75) * c + 3}`);
    w.unmount();
  });

  it('dashboard ⇒ gapDegree=75 ⇒ rotate(127.5deg)；dasharray 为无 gap 周长', () => {
    const w = mountP({ percent: 75, type: 'dashboard' });
    const rail = w.find(`.${P}-circle-rail`).element as SVGElement;
    const c = 2 * Math.PI * 47;
    const cg = c * (285 / 360);
    expect(rail.getAttribute('style')).toContain(`${cg}px ${c}`);
    expect(rail.getAttribute('style')).toContain('rotate(127.5deg)');
    w.unmount();
  });

  it('success 段 stroke 绿色兜底 + ptg=0 ⇒ opacity 0', () => {
    const w = mountP({ percent: 75, type: 'circle' });
    const paths = w.findAll(`.${P}-circle-path`);
    const successPath = paths[1]!.element as SVGElement;
    expect(successPath.getAttribute('opacity')).toBe('0');
    // jsdom 把 stroke 规范化为 rgb；dashoffset = perimeterWithoutGap - 0.01（clamp 生效）
    expect(successPath.getAttribute('style')).toContain('stroke: rgb(82, 196, 26)');
    expect(successPath.getAttribute('style')).toContain('stroke-dashoffset: 295.2997094374406');
    w.unmount();
  });

  it('circle gradient ⇒ -circle-gradient 类 + mask/foreignObject + stroke=#FFF', () => {
    const w = mountP({
      percent: 75,
      type: 'circle',
      strokeColor: { '0%': '#108ee9', '100%': '#87d068' },
    });
    expect(w.find(`.${P}-circle-gradient`).exists()).toBe(true);
    expect(w.find('mask').exists()).toBe(true);
    expect(w.find('foreignObject').exists()).toBe(true);
    const mainPath = w.findAll('.apollo-progress-circle-path')[0]!.element as SVGElement;
    expect(mainPath.getAttribute('stroke')).toBe('#FFF');
    w.unmount();
  });

  it('size 数字 ⇒ width/height/fontSize 派生；size=20 ⇒ -inline-circle + Tooltip', async () => {
    const w = mountP({ percent: 50, type: 'circle', size: 20 });
    expect(w.find(`.${P}-inline-circle`).exists()).toBe(true);
    // ≤20px ⇒ indicator 包 Tooltip
    await new Promise((r) => setTimeout(r, 30));
    expect(w.find(`.${P}-body .${P}-indicator`).exists()).toBe(false);
    w.unmount();
  });

  it('size=14 + strokeWidth=20 ⇒ micro circle', () => {
    const w = mountP({
      percent: 60,
      type: 'circle',
      size: 14,
      strokeWidth: 20,
      railColor: '#e6f4ff',
    });
    const body = w.find(`.${P}-body`).element as HTMLElement;
    expect(body.style.width).toBe('14px');
    // strokeWidth 默认 = max(minPercent(3/14*100), 20) = 21.4286 ⇒ r = 50 - 10.714
    expect((w.find(`.${P}-circle-rail`).element as SVGElement).getAttribute('r')).toBe(
      '39.285714285714285',
    );
    w.unmount();
  });
});

describe('Progress · deprecated 与 usage 告警', () => {
  it('width / trailColor / gapPosition / size="default"', () => {
    const warnings: string[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...a) => {
      warnings.push(a.map(String).join(' '));
    });
    const w = mountP({ percent: 30, width: 120, trailColor: '#eee', size: 'default' });
    spy.mockRestore();
    const all = warnings.join('\n');
    expect(all).toContain('`width` is deprecated');
    expect(all).toContain('`trailColor` is deprecated');
    expect(all).toContain('`size="default"` is deprecated');
    w.unmount();
  });

  it('gapPosition deprecated', () => {
    const warnings: string[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...a) => {
      warnings.push(a.map(String).join(' '));
    });
    const w = mountP({ percent: 30, type: 'dashboard', gapPosition: 'left' });
    spy.mockRestore();
    expect(warnings.join('\n')).toContain('`gapPosition` is deprecated');
    w.unmount();
  });

  it('usage：circle 不接受数组/对象 size', () => {
    const warnings: string[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...a) => {
      warnings.push(a.map(String).join(' '));
    });
    const w = mountP({ percent: 30, type: 'circle', size: [100, 20] });
    spy.mockRestore();
    expect(warnings.join('\n')).toContain('do not accept array as `size`');
    w.unmount();

    const warnings2: string[] = [];
    const spy2 = vi.spyOn(console, 'error').mockImplementation((...a) => {
      warnings2.push(a.map(String).join(' '));
    });
    const w2 = mountP({ percent: 30, type: 'circle', size: { width: 100, height: 20 } });
    spy2.mockRestore();
    expect(warnings2.join('\n')).toContain('do not accept object as `size`');
    w2.unmount();
  });
});

describe('Progress · utils 单元', () => {
  it('validProgress 钳制 0..100', () => {
    expect(validProgress(-5)).toBe(0);
    expect(validProgress(150)).toBe(100);
    expect(validProgress(30)).toBe(30);
  });

  it('getSize 三套解析', () => {
    expect(getSize('small', 'circle')).toEqual([60, 60]);
    expect(getSize(undefined, 'circle')).toEqual([120, 120]);
    expect(getSize(20, 'circle')).toEqual([20, 20]);
    expect(getSize('small', 'line')).toEqual([-1, 6]);
    expect(getSize(undefined, 'line', { strokeWidth: 10 })).toEqual([-1, 10]);
    expect(getSize([300, 20], 'line')).toEqual([300, 20]);
    expect(getSize([20, 30], 'step', { steps: 3, strokeWidth: 8 })).toEqual([60, 30]);
  });

  it('sortGradient 按 % 排序', () => {
    expect(sortGradient({ '0%': '#afc163', '75%': '#009900', '50%': 'green' })).toBe(
      '#afc163 0%, green 50%, #009900 75%',
    );
  });

  it('isLightColor（FastColor 替代）', () => {
    expect(isLightColor('#B7EB8F')).toBe(true); // 亮绿
    expect(isLightColor('#1677ff')).toBe(false); // 蓝
  });

  it('getCircleStyle 数学（round 修正 + clamp）', () => {
    const perimeter = 295.3097094374406;
    const s = getCircleStyle(perimeter, perimeter, 0, 75, -90, 0, undefined, '#1677ff', 'round', 6);
    expect(s.strokeDasharray).toBe(`${perimeter}px ${perimeter}`);
    expect(s.strokeDashoffset).toBe((1 - 0.75) * perimeter + 3);
    expect(s.transform).toBe('rotate(-90deg)');
    // ptg=100 ⇒ 不加 round 修正
    const s2 = getCircleStyle(
      perimeter,
      perimeter,
      0,
      100,
      -90,
      0,
      undefined,
      '#1677ff',
      'round',
      6,
    );
    expect(s2.strokeDashoffset).toBe(0);
  });

  it('percent 变化 ⇒ aria-valuenow 更新（响应式）', async () => {
    const w = mountP({ percent: 30 });
    await w.setProps({ percent: 80 } as never);
    await nextTick();
    expect(w.find(`.${P}`).attributes('aria-valuenow')).toBe('80');
    w.unmount();
  });
});
