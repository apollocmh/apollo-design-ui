# `packages/picker/oracle/` —— 上游 Oracle 副本

> **用途**：`*.oracle.test.ts` 的判据。不是实现，不是移植源。
> **不要**从 `packages/picker/src` 的非测试代码 import 本目录。

## 内容

`upstream/` 下 4 个文件是 `@rc-component/picker@1.12.2` 的 `es/` 产物**逐字副本**
（sha256 见 `provenance.json`）。选这 4 个的唯一理由是：**它们的 import 链上没有任何 React**
—— 判据见 `MEMORY.md` 的「能不能做 Oracle，判据是上游有没有框架耦合」。

| 文件 | 上游路径 | 为什么能当判据 |
|---|---|---|
| `upstream/dateUtil.js` | `es/utils/dateUtil.js` | 128 行，只依赖传入的 `generateConfig` |
| `upstream/miscUtil.js` | `es/utils/miscUtil.js` | 59 行，零 import |
| `upstream/generate-dayjs.js` | `es/generate/dayjs.js` | 186 行，只 import dayjs 及其插件 |
| `upstream/timePanelUtil.js` | `es/PickerPanel/TimePanel/TimePanelBody/util.js` | 30 行，只依赖传入的 `generateConfig` |

⚠️ 反过来：全部 `PickerPanel/*` 面板组件与 `PickerInput/**` 都 `import * as React`
⇒ **不能**对拍，只能读源码作规格（契约文档 §3.4 / §3.5 / §3.6）。

## 为什么固化在仓库里而不是从 node_modules import

`@rc-component/picker` 的 `package.json` **有 `exports` 字段**，而且白名单里只有
`./es/generate/*` `./es/interface` `./es/locale/*` —— `./es/utils/*` 不在其中，
深路径 import 会被 Node/Vite 解析拒掉。固化为仓库内文件后按相对路径加载，不受 exports 限制。

（`MEMORY.md` 记的「深路径 import 的前提是包没有 exports 字段」正是这条。）

## 类型

`upstream/*.d.ts` 是**手写**的窄声明，只覆盖 oracle 实际调用的函数，
类型指向我们自己的 `GenerateConfig<Dayjs>`（`src/types.ts`）。
有意**不**复制上游的 `.d.ts`：它们 import `../interface`，而上游 `interface.d.ts`
引用 React 类型 —— 会把 React 类型拖进来（违反 H1 的精神）。

## 校验

```bash
cd packages/picker && shasum -a 256 oracle/upstream/*.js   # 与 provenance.json 比对
```

恢复命令见 `provenance.json` 的 `restoreCommand`
（`/tmp` 会被清理，缺了就重跑；`npm pack` 可用，`curl` 拉 codeload 会走不存在的代理）。
