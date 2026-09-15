# @apollo-design/utils

> **层**：L0 ｜ **风险**：high ｜ **Phase 2 实施顺序**：1
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

通用工具集。全库的地基，被全部 72 个组件依赖。

## 替代的 Ant Design 依赖

- `@rc-component/util`
- `@rc-component/resize-observer`
- `@rc-component/mutate-observer`
- `@rc-component/overflow（检测部分）`
- `throttle-debounce`

## 公开 API

- 类型判断：isNumber / isString / isFunction / isPlainObject / isThenable / isPrimitive / isNonNullable / isRenderable / isVNode / isEmptyVNode / isFragmentVNode / isElementVNode / isComponentVNode / isWindow / isDocument / isHTMLElement / isTransitionEvent
- 警告体系：warning / note / warningOnce / noteOnce / preMessage / resetWarned（dev-only + 去重）
- 开发期告警：devUseWarning(component)（组件名前缀 + deprecated 聚合 + strict 开关）
- DOM：canUseDom / contains / isVisible / isStyleSupport / getScroll / getElement / isDOM
- 调度：raf / cancelRaf / throttleByAnimationFrame / throttle / debounce
- ref 工具：fillRef / composeRef / useComposeRef / supportRef / supportNodeRef / getNodeRef
- 属性工具：pickAttrs / toNativeEventName（React 合成事件名 → DOM 事件名）
- 对象工具：omit / mergeProps / isEqual / get / set / merge / mergeWith
- 子节点工具：toArray（展平 slot / 数组 / Fragment）
- 键盘：KeyCode
- 焦点：getFocusNodeList / triggerFocus / lockFocus / useLockFocus
- 观察器：useResizeObserver / useMutationObserver / useOverflow（单例复用）
- composable：useControlledValue / useDelayState / useUpdateEffect / useId / useSafeState
- 其他：toList / capitalize

## 明确不做（边界）

- ❌ 不含任何组件视觉语义（无颜色/圆角/尺寸）
- ❌ 不产出任何 CSS
- ❌ 不依赖 @apollo-design/* 的任何其他包（L0 是最底层）
- ❌ 不提供 render/unmount —— 含 Vue 渲染器耦合，归 packages/ui/src/_internal

## 必须遵守的契约

- warning 的输出格式必须与 antd 一致（含组件名前缀），因为测试会断言 warning
- pickAttrs 的白名单逐字复刻，且必须做 React 事件名 → DOM 事件名的转换（见 docs/foundation/rc-util-contract.md §6.1）
- isEqual 的共享引用 quirk 必须保留（见同文档 §6.2）
- raf 的 cancel 对已完成的 id 必须幂等且不抛错
- useResizeObserver 必须支持批量监听同一元素（单例 observer 复用）
- 任何 dev-only 代码不得裸写 process.env.NODE_ENV（见同文档 §6.4）

## 依赖

### 运行时依赖

（无）

### peer 依赖

| `vue` | `catalog:` |

## 依赖约束（ARCHITECTURE.md §3.1）

- **R1 单向**：只能依赖同层或更低层
- **R2 无环**：不得与其他包循环依赖
- **R3 地基纯净**（仅 L0）：不得包含任何组件视觉语义
- **R4 引擎无视觉**（仅 L2）：不得定义颜色/圆角/阴影，不得产出 CSS
- **R6 显式声明**：跨包导入必须在本文件的 `dependencies` 中声明（`.npmrc` 已设 `hoist=false`）

本包的依赖已通过 `registry/tools/scaffold-packages.mjs` 的分层校验。


## 测试

```bash
pnpm --filter @apollo-design/utils test
pnpm --filter @apollo-design/utils lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
L0 包的覆盖率下限为 语句 95% / 分支 90% / 函数 95%。
