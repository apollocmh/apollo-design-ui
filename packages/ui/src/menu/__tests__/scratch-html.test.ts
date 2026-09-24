import { mount } from '@vue/test-utils';
import { it } from 'vitest';
import { nextTick } from 'vue';
import Menu from '../Menu';

it('scratch vertical html', async () => {
  const items = [
    { key: '1', label: 'One' },
    { key: '2', label: 'Two', disabled: true },
    { type: 'divider', key: 'd1' },
    {
      key: 'sub1',
      label: 'Sub',
      children: [
        { key: '3', label: 'Three' },
        { key: 'sub2', label: 'Inner', children: [{ key: '4', label: 'Four' }] },
      ],
    },
    { type: 'group', key: 'g1', label: 'Group', children: [{ key: '5', label: 'Five' }] },
  ] as never;
  const w = mount(Menu, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: { prefixCls: 'apollo-menu', items, defaultOpenKeys: ['sub1'], mode: 'vertical' },
  });
  await nextTick();
  const html = w.html();
  const i = html.indexOf('submenu-title');
  console.log('[v-sub]', html.slice(i - 160, i + 260));
  w.unmount();
});
