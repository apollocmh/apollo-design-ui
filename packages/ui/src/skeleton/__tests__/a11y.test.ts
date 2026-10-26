/** Apollo loading semantics replace the historical requirement to copy missing ARIA. */
import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import Image from '../Image.vue';
import Node from '../Node.vue';
import Skeleton from '../Skeleton.vue';

const P = 'apollo-skeleton';
a11yDemoTest('Skeleton', { demos: import.meta.glob('../demo/*.vue', { eager: true }) });

describe('Skeleton loading ownership', () => {
  const rootAriaAttrs = (el: Element) =>
    el.getAttributeNames().filter((n) => n === 'role' || n.startsWith('aria-'));
  it.each([
    ['default', {}],
    ['all blocks', { avatar: true, title: true, paragraph: true }],
    ['active', { active: true }],
    ['round', { round: true }],
  ])('%s owns busy without inventing a live announcement', (_label, props) => {
    const wrapper = mount(Skeleton, { props });
    const root = wrapper.get<HTMLElement>(`.${P}`).element;
    expect(rootAriaAttrs(root)).toEqual(['aria-busy']);
    expect(root.getAttribute('aria-busy')).toBe('true');
  });
  it('keeps all five decorative targets inside hidden containers', () => {
    const wrapper = mount(Skeleton, { props: { avatar: true } });
    for (const name of ['header', 'section', 'title', 'paragraph', 'avatar']) {
      expect(wrapper.get(`.${P}-${name}`).element.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });
  it('marks loading busy and leaves live-announcement policy to the caller', () => {
    const wrapper = mount(Skeleton, { props: { loading: true } });
    expect(wrapper.get(`.${P}`).attributes('aria-busy')).toBe('true');
    expect(wrapper.get(`.${P}`).attributes('aria-live')).toBeUndefined();
  });
});

describe('Skeleton has no default keyboard target', () => {
  it('contains no focusable decorative element', () => {
    const wrapper = mount(Skeleton, { props: { avatar: true, active: true } });
    expect(wrapper.findAll('[tabindex], a[href], button, input, select, textarea')).toHaveLength(0);
  });
  it('has no default root tabindex', () => {
    const wrapper = mount(Skeleton, { props: { avatar: true } });
    expect(wrapper.get(`.${P}`).attributes('tabindex')).toBeUndefined();
  });
});

describe('Skeleton.Image retains its decorative SVG', () => {
  it('keeps SVG aria-hidden and nonfocusable', () => {
    const wrapper = mount(Image);
    expect(wrapper.get('svg').attributes('aria-hidden')).toBe('true');
    expect(wrapper.get('svg').attributes('focusable')).toBe('false');
  });
  it('keeps the actual illustration in the DOM', () => {
    const wrapper = mount(Image);
    expect(wrapper.findAll('svg')).toHaveLength(1);
    expect(wrapper.get('svg').attributes('aria-hidden')).toBe('true');
  });
  it('does not hide the public root that may own native names or business content', () => {
    const wrapper = mount(Image);
    expect(wrapper.get(`.${P}`).attributes('aria-hidden')).toBeUndefined();
  });
});

describe('Skeleton.Node retains real business content', () => {
  it('leaves the root accessible and preserves complete native slot content', () => {
    const wrapper = mount(Node, { slots: { default: () => h('span', { class: 'probe' }, 'X') } });
    expect(wrapper.get(`.${P}`).attributes('aria-hidden')).toBeUndefined();
    expect(wrapper.get('.probe').text()).toBe('X');
  });
});

describe('Skeleton loading=false accessible content', () => {
  it('renders only business content with no stale decorative blocks', () => {
    const wrapper = mount(Skeleton, {
      props: { loading: false },
      slots: { default: () => h('span', { class: 'real' }, '内容') },
    });
    expect(wrapper.find(`.${P}-section`).exists()).toBe(false);
    expect(wrapper.find(`.${P}-header`).exists()).toBe(false);
    expect(wrapper.get('.real').text()).toBe('内容');
  });
});
