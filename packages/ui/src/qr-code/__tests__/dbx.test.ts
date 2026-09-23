import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { QrCode } from '../index';

describe('dbx', () => {
  it('expired cover', () => {
    const w = mount(h(QrCode, { value: 'x', status: 'expired', onRefresh: () => {} }));
    const inst = (
      w.find('.apollo-qrcode').element as unknown as {
        __vueParentComponent?: { props: Record<string, unknown> };
      }
    ).__vueParentComponent;
    console.log('PROPS-KEYS:', Object.keys(inst?.props ?? {}).join(','));
    console.log('onRefresh:', typeof inst?.props.onRefresh);
    expect(1).toBe(1);
  });
});
