/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Form
 *
 * 基准：`tests/compat/baselines/form.dom.json`（机械 oracle，20 用例）。
 * `keepStyle: false`。
 *
 * ⚠️ 基线只钉**参数驱动的静态形态**（布局 / label / 显式 validateStatus / feedback /
 *    noStyle / hidden / form name 前缀）—— 校验链是异步的，`renderToStaticMarkup`
 *    拿不到那条时间线。校验链的 DOM 由 `form.test.ts`（L2）与
 *    `tests/visual/debug/probe-form-nostyle.mjs`（antd 运行时取证）覆盖。
 *
 * ⚠️ 控件用两侧各自的 **Input**（antd Input / apollo Input）：Form 的注入
 *    （value / id / aria-* / 事件合成）只有真实控件才看得到。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import baseline from '../../../../../tests/compat/baselines/form.dom.json';
import Input from '../../input';
import { Form, FormItem } from '../index';

const BP = { prefixCls: 'apollo-form' };

/** Form.Item + 控件（与基线脚本的 `item()` 同构）。 */
const item = (props: Record<string, unknown>, children?: unknown): DomRenderResult =>
  h(FormItem as never, props as never, {
    default: () => children ?? h(Input as never, { prefixCls: 'apollo-input' } as never),
  });

const form = (
  props: Record<string, unknown> | null,
  ...items: DomRenderResult[]
): DomRenderResult => h(Form as never, { ...(props ?? {}) } as never, { default: () => items });

const CASES: Record<string, () => DomRenderResult> = {
  'form:basic': () => form(null, item({ label: 'User', name: 'user', prefixCls: BP.prefixCls })),
  'form:required': () =>
    form(
      null,
      item({ label: 'User', name: 'user', required: true, prefixCls: BP.prefixCls }),
      item({ label: 'Age', prefixCls: BP.prefixCls }),
    ),
  'form:vertical': () =>
    form({ layout: 'vertical' }, item({ label: 'User', name: 'user', prefixCls: BP.prefixCls })),
  'form:inline': () =>
    form({ layout: 'inline' }, item({ label: 'User', name: 'user', prefixCls: BP.prefixCls })),
  'form:size-small': () =>
    form({ size: 'small' }, item({ label: 'User', name: 'user', prefixCls: BP.prefixCls })),
  'form:size-large': () =>
    form({ size: 'large' }, item({ label: 'User', name: 'user', prefixCls: BP.prefixCls })),
  'form:required-mark-optional': () =>
    form(
      { requiredMark: 'optional' },
      item({ label: 'User', name: 'user', prefixCls: BP.prefixCls }),
      item({ label: 'Age', name: 'age', required: true, prefixCls: BP.prefixCls }),
    ),
  'form:hide-required-mark': () =>
    form({ requiredMark: false }, item({ label: 'User', name: 'user', prefixCls: BP.prefixCls })),
  'form:no-colon': () =>
    form({ colon: false }, item({ label: 'User', name: 'user', prefixCls: BP.prefixCls })),
  'form:label-tooltip': () =>
    form(null, item({ label: 'User', name: 'user', tooltip: 'hint', prefixCls: BP.prefixCls })),
  'form:label-col-24': () =>
    form(
      { labelCol: { span: 24 } },
      item({ label: 'User', name: 'user', prefixCls: BP.prefixCls }),
    ),
  'form:help': () =>
    form(
      null,
      item({
        label: 'User',
        name: 'user',
        help: 'help text',
        validateStatus: 'error',
        prefixCls: BP.prefixCls,
      }),
    ),
  'form:extra': () =>
    form(null, item({ label: 'User', name: 'user', extra: 'extra text', prefixCls: BP.prefixCls })),
  'form:feedback-success': () =>
    form(
      null,
      item({
        label: 'User',
        name: 'user',
        hasFeedback: true,
        validateStatus: 'success',
        prefixCls: BP.prefixCls,
      }),
    ),
  'form:feedback-warning': () =>
    form(
      null,
      item({
        label: 'User',
        name: 'user',
        hasFeedback: true,
        validateStatus: 'warning',
        prefixCls: BP.prefixCls,
      }),
    ),
  'form:feedback-error': () =>
    form(
      null,
      item({
        label: 'User',
        name: 'user',
        hasFeedback: true,
        validateStatus: 'error',
        prefixCls: BP.prefixCls,
      }),
    ),
  'form:feedback-validating': () =>
    form(
      null,
      item({
        label: 'User',
        name: 'user',
        hasFeedback: true,
        validateStatus: 'validating',
        prefixCls: BP.prefixCls,
      }),
    ),
  'form:no-style': () => form(null, item({ name: 'user', noStyle: true, prefixCls: BP.prefixCls })),
  'form:hidden': () =>
    form(null, item({ label: 'User', name: 'user', hidden: true, prefixCls: BP.prefixCls })),
  'form:form-name': () =>
    form({ name: 'login' }, item({ label: 'User', name: 'user', prefixCls: BP.prefixCls })),
};

domContractTest('Form', {
  baseline,
  keepStyle: false,
  allow: {},
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Form semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。基线用例：` +
          baseline.cases.map((c) => c.id).join(', '),
      );
    }
    return build();
  },
});

describe('Form · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});
