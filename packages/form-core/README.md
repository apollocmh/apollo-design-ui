# @apollo-design/form-core

Vue 表单状态与校验引擎。提供字段注册、嵌套值路径、依赖联动、动态列表、异步校验与订阅，供自定义表单或 `@apollo-design/ui` 的 Form 使用。

## 安装

```bash
npm install @apollo-design/form-core vue
```

需要带布局、标签和错误提示的表单时，使用 `@apollo-design/ui` 的 `Form` 与 `Form.Item`；本包负责状态和字段协作。

## 独立数据校验

```ts
import { Schema } from '@apollo-design/form-core';

const schema = new Schema({
  email: [
    { required: true, message: '请输入邮箱' },
    { type: 'email', message: '邮箱格式不正确' },
  ],
});

try {
  await schema.validate({ email: 'hello@example.com' });
  console.log('校验通过');
} catch (error) {
  console.error('校验失败', error);
}
```

## 表单能力

| 需求 | 入口 |
| --- | --- |
| 创建类型化表单实例 | `useForm<Values>()`，返回 `[form]` |
| 观察字段 | `useWatch` |
| 字段收集与校验 | `Form`、`Field` |
| 动态字段列表 | `List` |
| 多表单协作与校验消息 | `FormProvider` |
| 脱离视觉组件的数据校验 | `Schema`、`Rule`、`ValidateMessages` |

`useForm` 在组件 `setup()` 中创建。表单实例提供取值、设值、重置、提交与 `validateFields`；异步错误通过校验 Promise 返回。`Field` 和 `List` 的原生作用域插槽由宿主渲染内容。

字段路径使用字符串、数字或路径数组；动态列表应使用稳定字段键。异步校验处理过期结果，卸载时释放字段订阅。嵌套 Provider 的校验消息按当前响应式配置读取。

本包不提供 Form.Item 的标签、网格、错误样式或主题 CSS。完整字段/插槽/实例类型从包根导出。

## 文档与维护

[公开导出](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/form-core/src/index.ts) · [项目规范](https://github.com/apollocmh/apollo-design-ui/blob/master/AGENTS.md) · [测试要求](https://github.com/apollocmh/apollo-design-ui/blob/master/TESTING.md)
