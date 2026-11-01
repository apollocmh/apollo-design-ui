import 'dayjs/locale/ar';
import 'dayjs/locale/zh-cn';
import { ar_EG, type Locale, zh_CN } from '@apollo-design/locale';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import Calendar from '../Calendar.vue';
import EventRange from '../demo/event-range.vue';

const locales: {
  name: string;
  locale?: Locale;
  direction: 'ltr' | 'rtl';
  rows: number;
}[] = [
  { name: 'default Sunday week', direction: 'ltr', rows: 2 },
  { name: 'Monday week in RTL', locale: zh_CN, direction: 'rtl', rows: 2 },
  { name: 'Saturday week in RTL', locale: ar_EG, direction: 'rtl', rows: 1 },
];

describe('Calendar event-range scroll boundary', () => {
  it('allows overflow only on this range demo, preserving the ordinary content scroll layer', () => {
    const demo = mount(EventRange);
    const ordinary = mount(Calendar);
    try {
      expect(
        demo.get<HTMLElement>('td[title="2026-01-08"] .apollo-picker-calendar-date-content').element
          .style.overflow,
      ).toBe('visible');
      expect(
        ordinary.get<HTMLElement>('.apollo-picker-calendar-date-content').element.style.overflow,
      ).toBe('');
    } finally {
      demo.unmount();
      ordinary.unmount();
    }
  });

  it.each(locales)(
    'splits cross-week bars by the actual rendered rows: $name',
    ({ locale, direction, rows: expectedRows }) => {
      const wrapper = mount(ConfigProvider, {
        props: { locale, direction },
        slots: { default: () => h(EventRange) },
      });
      try {
        const rows = new Map<Element, HTMLElement[]>();
        for (const date of ['17', '18', '19', '20']) {
          const bar = wrapper.get<HTMLElement>(
            `td[title="2026-01-${date}"] [data-event="cross-week"]`,
          ).element;
          const row = bar.closest('tr');
          if (!row) throw new Error('Range bars must remain in actual date rows');
          const current = rows.get(row) ?? [];
          current.push(bar);
          rows.set(row, current);
          expect(bar.title).toBe('Cross-week delivery');
        }
        expect(rows.size).toBe(expectedRows);
        for (const bars of rows.values()) {
          for (const [index, bar] of bars.entries()) {
            const position =
              bars.length === 1
                ? 'single'
                : index === 0
                  ? 'start'
                  : index === bars.length - 1
                    ? 'end'
                    : 'middle';
            expect(bar.dataset.position).toBe(position);
            expect(bar.textContent?.trim()).toBe(index === 0 ? 'Cross-week delivery' : '');
          }
        }
      } finally {
        wrapper.unmount();
      }
    },
  );
});
