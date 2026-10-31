import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import {
  defineComponent,
  Fragment,
  type FunctionalComponent,
  h,
  nextTick,
  ref,
  Suspense,
  shallowRef,
  Teleport,
  type VNode,
} from 'vue';
import { getElement } from '../dom/get-element';
import { getNodeRef, supportNodeRef, useComposeRef } from '../ref';
import NativeUtils from './fixtures/NativeUtils.vue';

describe('actual native Vue ref boundaries', () => {
  it('uses the public collection contract from an actual SFC without replacing the live input', async () => {
    const wrapper = mount(NativeUtils, { attachTo: document.body });
    const editor = wrapper.get<HTMLInputElement>('input');
    await editor.setValue('Draft');
    expect(wrapper.vm.element()).toBe(editor.element);
    expect(wrapper.vm.identityValid()).toBe(true);
    expect(wrapper.vm.calls()).toEqual(['original:set']);
    wrapper.vm.replace();
    await nextTick();
    expect(wrapper.get('input').element).toBe(editor.element);
    expect(editor.element.value).toBe('Draft');
    expect(wrapper.vm.identityValid()).toBe(true);
    expect(wrapper.vm.calls()).toEqual(['original:set', 'replacement:set']);
    const calls = wrapper.vm.calls;
    const element = wrapper.vm.element;
    wrapper.unmount();
    expect(calls()).toEqual(['original:set', 'replacement:set', 'replacement:clear']);
    expect(element()).toBeNull();
  });
  it('never calls function refs as getters and fills actual Vue refs without unwrapping their target', () => {
    const target = shallowRef<HTMLElement | null>(null);
    const callback = vi.fn<(node: HTMLElement | null) => void>();
    const composed = useComposeRef<HTMLElement>([target, callback]);
    const handler = composed.value;
    expect(callback).not.toHaveBeenCalled();
    const element = document.createElement('div');
    handler(element);
    expect(target.value).toBe(element);
    expect(callback).toHaveBeenCalledExactlyOnceWith(element);
    handler(null);
    expect(target.value).toBeNull();
  });

  it('uses the actual public expose proxy and never returns the private setup instance', () => {
    const publicRef = ref<{ visible: string } | null>(null);
    let child: VNode | null = null;
    const Child = defineComponent({
      setup(_props, { expose }) {
        expose({ visible: 'public' });
        return { secret: 'private' };
      },
      render() {
        return h('div', this.secret);
      },
    });
    mount(
      defineComponent({
        setup: () => () => {
          child = h(Child, { ref: publicRef });
          return child;
        },
      }),
      { global: { stubs: { teleport: false, suspense: false } } },
    );
    expect(publicRef.value?.visible).toBe('public');
    expect(getNodeRef(child)).toBe(publicRef.value);
    expect(getNodeRef(child)).not.toHaveProperty('secret');
  });

  it('does not fabricate an expose proxy when Vue has not materialized a public ref', () => {
    let child: VNode | null = null;
    const Child = defineComponent({
      setup(_props, { expose }) {
        expose({ visible: true });
        return () => h('div');
      },
    });
    mount(
      defineComponent({
        setup: () => () => {
          child = h(Child);
          return child;
        },
      }),
    );
    expect(getNodeRef(child)).toBeNull();
  });

  it('returns the real functional-component DOM ref and excludes builtin anchors', () => {
    const publicRef = ref<HTMLElement | null>(null);
    let child: VNode | null = null;
    const Child: FunctionalComponent = () => h('button', 'Functional');
    mount(
      defineComponent({
        setup: () => () => {
          child = h(Child, { ref: publicRef });
          return child;
        },
      }),
      { global: { stubs: { teleport: false, suspense: false } } },
    );
    expect(getNodeRef(child)).toBe(publicRef.value);
    expect(publicRef.value).toBeInstanceOf(HTMLButtonElement);
    expect(getElement(child)).toBe(publicRef.value);
    expect(supportNodeRef(h(Teleport, { to: document.body }, []))).toBe(false);
    expect(supportNodeRef(h(Suspense, {}, {}))).toBe(false);
    expect(getNodeRef(h(Fragment, {}, []))).toBeNull();
  });

  it('does not treat a React-only current wrapper as a Vue element ref', () => {
    expect(getElement({ current: document.createElement('div') })).toBeNull();
  });
});
