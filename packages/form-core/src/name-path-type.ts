// biome-ignore-all lint/suspicious/noExplicitAny: 本文件是上游 `namePathType.d.ts`（12 行）的
// **逐字移植**。上游用 `any` 不是偷懒 —— `DeepNamePath` 是**分布式条件类型**，
// `Store = any` 的 `any` 参与 `Store extends BaseNamePath` 的分布求值；
// 收紧成 `unknown` 会让条件类型不再按联合成员分布，`FormInstance<Values>` 的
// `NamePath<Values>` 推导直接失效（消费者写 `form.getFieldValue('user')` 会报错）。
// 这与 `types.ts` 里 `Value = any` 是同一处置（见该文件头注释）。
// 本文件**只有类型**，无运行时行为。

/**
 * `namePath` 的深度推导类型。
 *
 * 契约来源：`@rc-component/form@1.8.6/es/namePathType.d.ts`。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §6.4。
 *
 * ⭐ 它解决的问题：`FormInstance<{ user: { name: string } }>` 的 `getFieldValue`
 * 只接受 `'user'` / `['user']` / `['user', 'name']` —— 写错的路径在**编译期**就报错。
 *
 * ⭐ 三个关键约束（都是上游有意的）：
 * 1. `ParentNamePath['length'] extends 5 ? never` —— 深度**硬上限 5 层**，
 *    防止 `DeepNamePath` 在递归类型上无限展开（TS 会报 "excessively deep"）；
 * 2. `Store[FieldKey] extends Function ? never` —— 函数字段**不能作为 namePath**
 *    （`getFieldValue('onChange')` 无意义）；
 * 3. 非根层级**不再产出裸 `FieldKey`**（`ParentNamePath['length'] extends 0 ? FieldKey : never`）
 *    —— 即 `['user', 'name']` 合法但**不会**单独出现 `'name'`。
 */
type BaseNamePath = string | number | boolean | (string | number | boolean)[];

export type DeepNamePath<
  Store = any,
  ParentNamePath extends any[] = [],
> = ParentNamePath['length'] extends 5
  ? never
  : true extends (Store extends BaseNamePath ? true : false)
    ? ParentNamePath['length'] extends 0
      ? Store | BaseNamePath
      : Store extends any[]
        ? [...ParentNamePath, number]
        : never
    : Store extends any[]
      ? // 连接路径，如 `{ a: { b: string }[] }`
        [...ParentNamePath, number] | DeepNamePath<Store[number], [...ParentNamePath, number]>
      : keyof Store extends never
        ? Store
        : {
            // biome-ignore lint/complexity/noBannedTypes: 语义是「值是函数 ⇒ 它不是表单字段」，必须匹配一切可调用对象（`(...args: never[]) => unknown` 会漏掉构造签名/重载）。
            [FieldKey in keyof Store]: Store[FieldKey] extends Function
              ? never
              :
                  | (ParentNamePath['length'] extends 0 ? FieldKey : never)
                  | [...ParentNamePath, FieldKey]
                  | DeepNamePath<Required<Store>[FieldKey], [...ParentNamePath, FieldKey]>;
          }[keyof Store];
