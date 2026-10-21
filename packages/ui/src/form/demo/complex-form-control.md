---
order: 201
title:
  zh-CN: 复杂表单控件
  en-US: Complex form control
---

当控件的值与表单存储值不是同一单位时，用 `Form.Item` 的 `getValueProps` 把存储值转换成控件展示值，再用 `getValueFromEvent` 把控件事件转换回存储格式。示例中表单内部以「分」存储金额，`InputNumber` 展示与输入的是「元」；`useWatch('price')` 实时显示底层存储值。
