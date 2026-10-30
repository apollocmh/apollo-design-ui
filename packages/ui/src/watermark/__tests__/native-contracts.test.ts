import { raf } from '@apollo-design/utils';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSSRApp,
  defineComponent,
  effectScope,
  h,
  nextTick,
  ref,
  type StyleValue,
  shallowRef,
} from 'vue';
import { renderToString } from 'vue/server-renderer';
import { provideWatermark, usePanelRef } from '../context';
import { Watermark } from '../index';
import type { WatermarkRef } from '../interface';
import { useRafDebounce } from '../use-raf-debounce';
import { useSingletonCache } from '../use-singleton-cache';
import { useWatermark } from '../use-watermark';
import { getContentLines } from '../utils';

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Watermark native root and content', () => {
  it('accepts actual numeric pairs, including zero, through the runtime prop boundary', () => {
    const warning = vi.spyOn(console, 'warn');
    const wrapper = mount(Watermark, { props: { gap: [0, 20], offset: [0, -10] } });
    expect(wrapper.props('gap')).toEqual([0, 20]);
    expect(wrapper.props('offset')).toEqual([0, -10]);
    expect(warning).not.toHaveBeenCalled();
  });

  it('lands attrs and native listener arrays/once on the actual root', async () => {
    const click = vi.fn();
    const second = vi.fn();
    const once = vi.fn();
    const wrapper = mount(Watermark, {
      attrs: {
        id: 'watermark-root',
        'aria-label': 'Protected document',
        onClick: [click, second],
        onClickOnce: once,
      },
    });
    expect(wrapper.attributes('id')).toBe('watermark-root');
    expect(wrapper.attributes('aria-label')).toBe('Protected document');
    await wrapper.trigger('click');
    await wrapper.trigger('click');
    expect(click).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(2);
    expect(once).toHaveBeenCalledTimes(1);
    expect(click.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
  });

  it('uses Vue style arrays and strings with explicit root style precedence', async () => {
    const style = shallowRef<StyleValue>([
      { position: 'absolute', overflow: 'visible' },
      'color: red; --watermark-test: first',
    ]);
    const wrapper = mount(() => h(Watermark, { style: style.value }));
    const root = wrapper.get<HTMLElement>('div').element;
    expect(root.style.position).toBe('absolute');
    expect(root.style.overflow).toBe('visible');
    expect(root.style.color).toBe('red');
    expect(root.style.getPropertyValue('--watermark-test')).toBe('first');
    style.value = 'position: fixed; overflow: auto; --watermark-test: second';
    await nextTick();
    expect(root.style.position).toBe('fixed');
    expect(root.style.overflow).toBe('auto');
    expect(root.style.color).toBe('');
    expect(root.style.getPropertyValue('--watermark-test')).toBe('second');
  });

  it('keeps the real exposed element and native slot subtree across ordinary updates', async () => {
    const instance = shallowRef<WatermarkRef | null>(null);
    const text = ref('First');
    const wrapper = mount(() =>
      h(Watermark, { ref: instance, content: text.value }, () => [h('input'), text.value]),
    );
    const input = wrapper.get<HTMLInputElement>('input').element;
    input.value = 'Retained draft';
    expect(instance.value?.nativeElement).toBe(wrapper.element);
    text.value = 'Second';
    await nextTick();
    expect(wrapper.get('input').element).toBe(input);
    expect(input.value).toBe('Retained draft');
    expect(wrapper.text()).toBe('Second');
    wrapper.unmount();
    expect(instance.value).toBeNull();
  });

  it('SSR produces the native content without attempting canvas or scheduling a frame', async () => {
    const pending = raf.ids?.().size;
    const html = await renderToString(
      createSSRApp({ render: () => h(Watermark, { content: 'Private' }, () => 'Document') }),
    );
    expect(html).toContain('Document');
    expect(HTMLCanvasElement.prototype.getContext).not.toHaveBeenCalled();
    expect(raf.ids?.().size).toBe(pending);
  });
});

describe('Watermark drawing inputs and scheduler', () => {
  it('keeps distinct image identities in the single-result cache', () => {
    const cached = useSingletonCache<unknown, number>();
    const first = new Image();
    const second = new Image();
    const create = vi.fn().mockReturnValueOnce(1).mockReturnValueOnce(2);
    expect(cached([first, 120], create)).toBe(1);
    expect(cached([second, 120], create)).toBe(2);
    expect(cached([second, 120], create)).toBe(2);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('uses the last state in a frame and cancels pending work on scope disposal', () => {
    vi.useFakeTimers();
    const pending = raf.ids?.().size;
    const scope = effectScope();
    const callback = vi.fn();
    const run = scope.run(() => useRafDebounce(callback));
    run?.();
    run?.();
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(32);
    expect(callback).toHaveBeenCalledTimes(1);
    run?.();
    scope.stop();
    expect(raf.ids?.().size).toBe(pending);
    vi.advanceTimersByTime(32);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('inherits the current effective font when a per-line optional field is undefined', () => {
    const font = { fontSize: 20, color: 'blue' };
    expect(
      getContentLines({ text: 'Line', font: { fontSize: undefined, color: 'red' } }, font),
    ).toEqual([{ text: 'Line', font: { fontSize: 20, color: 'red' } }]);
  });
});

describe('Watermark panel registration and owned elements', () => {
  it('moves a registered panel between non-null roots and updates the current selector', async () => {
    const add = vi.fn();
    const remove = vi.fn();
    const selector = ref('.first');
    let register: ReturnType<typeof usePanelRef> | undefined;
    const Probe = defineComponent({
      setup() {
        register = usePanelRef(selector);
        return () => null;
      },
    });
    const wrapper = mount(
      defineComponent({
        setup() {
          provideWatermark({ add, remove });
          return () => h(Probe);
        },
      }),
    );
    const first = document.createElement('section');
    first.innerHTML = '<div class="first"></div><div class="second"></div>';
    const next = document.createElement('section');
    next.innerHTML = first.innerHTML;
    register?.(first);
    expect(add).toHaveBeenLastCalledWith(first.querySelector('.first'));
    register?.(next);
    expect(remove).toHaveBeenLastCalledWith(first.querySelector('.first'));
    expect(add).toHaveBeenLastCalledWith(next.querySelector('.first'));
    selector.value = '.second';
    await nextTick();
    expect(remove).toHaveBeenLastCalledWith(next.querySelector('.first'));
    expect(add).toHaveBeenLastCalledWith(next.querySelector('.second'));
    register?.(null);
    expect(remove).toHaveBeenLastCalledWith(next.querySelector('.second'));
    const count = remove.mock.calls.length;
    wrapper.unmount();
    expect(remove).toHaveBeenCalledTimes(count);
  });

  it('removes owned watermark elements even after they were externally moved', () => {
    const source = document.createElement('div');
    const other = document.createElement('div');
    const api = useWatermark(() => ({ position: 'absolute' }));
    api.appendWatermark('data:image/png;base64,TEST', 100, source);
    const mark = source.firstElementChild;
    if (!mark) throw new Error('No watermark was appended');
    other.append(mark);
    expect(() => api.removeWatermark(source)).not.toThrow();
    expect(other.childElementCount).toBe(0);
  });

  it('releases marks on external panel hosts when the owner is disposed', () => {
    const host = document.createElement('div');
    const api = useWatermark(() => ({ position: 'absolute' }));
    api.appendWatermark('data:image/png;base64,TEST', 100, host);
    expect(host.childElementCount).toBe(1);
    api.disposeAll();
    expect(host.childElementCount).toBe(0);
  });

  it('does not reinsert a watermark after the removal listener disposes its owner', () => {
    const host = document.createElement('div');
    const api = useWatermark(
      () => ({ position: 'absolute' }),
      () => api.disposeAll(),
    );
    api.appendWatermark('data:image/png;base64,TEST', 100, host);
    host.firstElementChild?.remove();
    api.appendWatermark('data:image/png;base64,TEST', 100, host);
    expect(host.childElementCount).toBe(0);
  });
});
