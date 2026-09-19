import { describe, expect, it } from 'vitest';
import * as picker from '../index';

/**
 * 公开 API 面锁定。
 *
 * 为什么要有这个测试（两个理由，都不是凑覆盖率）：
 *
 * 1. 契约 §5 定的 API 面必须**可执行**地钉住。`index.ts` 只有 re-export，
 *    任何其它测试都不会 import 它 ⇒ 它既不在覆盖率报告里，改名/漏导也没有人会红。
 *    这里断言「导出的运行时符号集合 == 契约声明的集合」，漏一个或多余一个都会失败。
 *
 * 2. R4：本包是**引擎**，不导出任何 Vue 组件。这条边界很容易在日常开发里被无意突破
 *    （「顺手把 PickerPanel 放进来吧」），所以在这里断言 `default` 不存在、
 *    且没有任何导出是组件工厂。类型层面由 `picker.test-d.ts` 覆盖，这里管运行时。
 */
describe('公开 API 面', () => {
  it('运行时导出集合与契约 §5 一致（不多不少）', () => {
    expect(Object.keys(picker).sort()).toEqual(
      [
        'WEEK_DAY_COUNT',
        'buildPanelCells',
        'dayjsGenerateConfig',
        'fillIndex',
        'fillTime',
        'findValidateTime',
        'formatValue',
        'getFromDate',
        'getMaskRange',
        'getPanelGeometry',
        'getQuarter',
        'getRowFormat',
        'getRowStartDate',
        'getWeekNumber',
        'getWeekStartDate',
        'isInRange',
        'isSame',
        'isSameDate',
        'isSameDates',
        'isSameDecade',
        'isSameMonth',
        'isSameOrAfter',
        'isSameQuarter',
        'isSameTime',
        'isSameTimestamp',
        'isSameWeek',
        'isSameYear',
        'isWeekMode',
        'leftPad',
        'offsetCellValue',
        'orderDates',
        'pickProps',
        'toArray',
        'validateRangeSubmit',
      ].sort(),
    );
  });

  it('每个导出都是可调用的函数或常量，没有 undefined（漏导会在这里暴露）', () => {
    for (const [name, value] of Object.entries(picker)) {
      expect(value, `导出 "${name}" 是 undefined —— 多半是 re-export 的名字写错了`).not.toBe(
        undefined,
      );
    }
  });

  it('R4：不导出 Vue 组件（没有 default，也没有带组件特征的东西）', () => {
    expect('default' in picker).toBe(false);

    // 判据不是「只能是函数或数字」—— `dayjsGenerateConfig` 本身就是纯数据对象。
    // 真正的判据是「**没有任何一个导出像 Vue 组件**」：defineComponent 的产物
    // 一定带 render / setup / __vccOpts / __file 中的某个特征字段。
    const COMPONENT_MARKERS = ['render', 'setup', '__vccOpts', '__file', 'template'];
    for (const [name, value] of Object.entries(picker)) {
      if (value === null || (typeof value !== 'object' && typeof value !== 'function')) continue;
      const hit = COMPONENT_MARKERS.filter((m) => m in (value as object));
      expect(
        hit,
        `导出 "${name}" 带 Vue 组件特征字段 ${hit.join(', ')} —— R4 要求本包不导出组件`,
      ).toEqual([]);
    }

    // 顺带钉住唯一允许的非函数导出：日期库适配层是**纯数据对象**。
    expect(typeof picker.dayjsGenerateConfig).toBe('object');
  });
});
