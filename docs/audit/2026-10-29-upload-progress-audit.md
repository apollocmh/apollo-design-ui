# Upload 进度字段与共享 Progress 修复

范围：`UPLOAD-PROGRESS-20261029`。完整盘点与修改前发布包证据见
`/tmp/apollo-css-dependency-audit/upload-progress-plan.md`、
`upload-progress-runtime-evidence.json` 和 `controls-browser-evidence.json`。
本单元覆盖 Upload 进度的全部六个公开字段、文件 percent/ARIA、Provider、
四类列表与 Dragger、受控/非受控更新、条件整行槽和生命周期，以及复用所需的
Progress Line 数字宽度和三种 Progress 的公共 ARIA 值。
其他 Upload 引擎交互与其他 Progress API 不在此处宣称完成。

用户已裁决：部分 progress 对象也默认满宽 2px；数字/tuple size 决定宽高，
其余情况下显式 strokeWidth 优先于 small 6px/default 8px；保留合法 CSS 长度字符串。
ARIA 保留小数、限制在 0–100，非有限输入按 0；Progress 原有 status 整数推导不变，
Upload 上传中始终 normal，100% 不代替上传成功事件。真实 Progress 组合替换旧固定 DOM，
不增加旧替身或兼容分支，不扩大 UploadListProgressProps。

修改前仓库红灯：

```sh
pnpm exec vitest run --project unit packages/ui/src/upload/__tests__/progress.test.ts packages/ui/src/progress/__tests__/upload-integration.test.ts --maxWorkers=2
```

2026-10-29 首次实际退出 1：2 文件、46 用例，39 失败、7 通过；
补齐现有 Demo、SSR 水合/延迟清理和默认文件名称后，实施前最终红灯为
49 用例，42 失败、7 通过。
失败覆盖默认/数字尺寸、渐变、showInfo、ARIA 名称、动态清除、Provider、
共享 Progress 宽度与 ARIA 小数/越界/非有限值。日志保存于
`/tmp/apollo-css-dependency-audit/upload-progress-repo-red.log` 与
`upload-progress-repo-red-authorized.log`。
旧测试、历史参考快照及视觉基线均保留。

源码真实浏览器修改前也已执行：

```sh
UPLOAD_PROGRESS_SOURCE=1 UPLOAD_PROGRESS_EVIDENCE=/tmp/apollo-css-dependency-audit/upload-progress-browser-source-red.json node tests/browser/upload-progress.mjs
```

72 条断言中 32 失败、40 通过，45 个场景和 20 个动态阶段；0 浏览器错误/警告、
六个发布产物 SHA 不变、读者均退出。首次夹具因缺少 Vue 编译插件失败，补齐后
上述结果来自完整运行，不把工具链错误算成缺陷红灯。严格类型预检查已退出 0，
包含 Upload/Progress 源码、全部现有 Demo 和新测试；不写类型或构建产物。

共享影响核对：Notification、Image、Spin 里的同名 Progress 分别是各自内部组件，
不依赖公开 Progress，本次不修改它们。公开 Progress 的三种类型、success 分段、
整数 status 推导和语义尺寸由本组件完整现有回归加新增针对性用例验证。

## 完整清单收口

| 链路 | 修复与保留行为 | 源码验证 |
|---|---|---|
| strokeColor | 保留纯色、from/to、百分比色标，真实 Progress 消费当前颜色与 RTL，替换/清除不残留 | 首次渲染、动态纯色→渐变→清除、Provider 与 RTL 均通过 |
| strokeWidth | 数字 px、合法 CSS 长度字符串；显式值优先于预设，数字/tuple size 优先于它 | 数字、px/rem、优先级、旧字符串清除均通过 |
| showInfo | 默认 false，true 显示实时百分比，100% 上传中仍显示数字且 normal | 受控与真实文件选择后的非受控请求、动态显隐、Demo 均通过 |
| size / 默认 | 部分对象仍满宽 2px；small/default 为6/8px；数字/tuple 完整消费，动态恢复自适应宽度 | Upload 与共享 Progress 的数字/tuple/对象宽度、动态高度均通过 |
| aria-label / aria-labelledby | 唯一实际 bar 消费原生属性；局部配置覆盖 Provider，再覆盖文件；缺名称时使用文件名 | 文件、配置、动态移除、Provider、默认文件名均通过 |
| 文件 percent / 状态 | 文件拥有百分比；absent 不渲染、undefined/0 为0、小数保留、越界限制、非有限值0；100%不代替成功事件 | NaN/±Infinity、负数、120、0、小数、done/error、重新上传均有回归 |
| Slots / model / emits / expose | 整行槽继续拥有内容；不增事件、模型或 expose；保持已有事件 payload | 条件 itemRender、受控替换、真实文件选择、customRequest→progress→success 均通过 |
| Provider / 生命周期 / 焦点 | 当前合并、前缀和方向；首次300ms延迟、离场与卸载清理、双实例和反复开关 | 原生 Teleport 下触发器身份与焦点、SSR水合、两轮隐藏/重挂均通过 |
| 共享 Progress | 数字宽度输出px；三类 ARIA保留有限小数并归一化，success来源优先；status整数推导保持 | 三类型、success、同名attrs不可覆盖内部值、原有整数/状态断言均保留且通过 |

UploadProgress 只归一化 Upload 已有配置并组合公开 Progress，没有复制轨道、渐变或信息引擎。
UploadList 的原默认对象仍可传递，部分配置由组合边界补齐；没有扩大公开字段或缩窄字符串厚度。
ListItem 保持原 motion 和延迟逻辑，ARIA 经 attrs 进入真实 Progress，避免错误的横杠 prop 读取。

## 最终源码检查

| 命令 | 实际结果 | 日志 |
|---|---|---|
| `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/upload/__tests__ packages/ui/src/progress/__tests__ --maxWorkers=2` | 12文件258例通过 | `/tmp/apollo-css-dependency-audit/upload-progress-source-gates-final.log` |
| `pnpm exec vitest run --project types packages/ui/src/upload/__tests__/type.test-d.ts packages/ui/src/progress/__tests__/type.test-d.ts --maxWorkers=2` | 两个源测试分别执行运行与类型检查，共4项目文件48例通过，Type Errors为no errors | `upload-progress-type-gates.log` |
| `pnpm exec vue-tsc --noEmit -p /tmp/apollo-css-dependency-audit/upload-progress-types.tsconfig.json` | 0诊断；覆盖Upload/Progress源码、40个现有Demo及新测试 | `upload-progress-types-final.log` |
| 定向 `biome check`，文件见冻结清单 | 0错误/警告/信息 | `upload-progress-format-final.log` |
| `UPLOAD_PROGRESS_SOURCE=1 UPLOAD_PROGRESS_EVIDENCE=/tmp/apollo-css-dependency-audit/upload-progress-browser-source-final.json node tests/browser/upload-progress.mjs` | 75/75，45场景与20动态阶段，含实际Provider触发器身份/焦点；0浏览器错误/警告 | `upload-progress-browser-source-final.log/json` |
| `UPLOAD_PROGRESS_SOURCE=1 UPLOAD_PROGRESS_CSS=component UPLOAD_PROGRESS_EVIDENCE=/tmp/apollo-css-dependency-audit/upload-progress-browser-component-final.json node tests/browser/upload-progress.mjs` | 仅使用公开Upload按需CSS，75/75；0浏览器错误/警告 | `upload-progress-browser-component-final.log/json` |

真实浏览器用当前源码 JS 和冻结发布 CSS；只有临时夹具打包，六个发布产物SHA前后不变，
所有浏览器与预览服务器均已退出。全量 CSS 与 Upload 按需 CSS 入口另有独立运行记录。
这不是新源码发布包验证；需主任务构建并冻结新 JS/声明后运行发布模式。

首次实现后两条完成状态用例在jsdom未收到CSS动画事件，调整为执行既有2000ms离场deadline，
保持“完成后内置bar移除”的原断言。Provider身份用例发现VTU的teleport-stub重挂子树，
改为使用真实Teleport后同一身份断言通过，并加真实浏览器焦点/身份覆盖；未修改生产Provider。
浏览器动态size的高度断言落在rail；showInfo生效后body同时包含信息，不能把body高度当作轨道高度。
这些修正均按实际契约保留替代覆盖，没有放宽阈值或删旧断言。

当前运行时对旧 MiniProgress 的引用为0后已删除旧文件；主任务同步当前根注释、样式注释和
Registry路径后，本工作树 `packages/ui/src` 与当前Registry也没有旧名引用。
带日期或sourceCommit的历史证据保留。删后再次执行严格类型检查0诊断、定向Biome0诊断、
`git diff --check`通过；没有继续修改生产实现。

本单元文件SHA、生产代码摘要、两种CSS模式的全部浏览器断言及真实产物指纹，保存于
[源码冻结证据](evidence/upload-progress-source-freeze.json)。该证据按基准提交加逐文件SHA描述
本单元尚未提交的修改；最终整合提交和全库门禁由主任务记录。

## 交付边界

源码运行时、类型、Demo、DOM/无障碍/主题与真实浏览器已分别验证。没有执行包构建或写dist，
没有生成、接受或替换视觉基线，未执行全库最终门禁或文档站构建。
根入口与静态样式文件的历史注释、Registry、KNOWN-ISSUES和全库最终提交门禁由主任务协调。
正式发布包、正式Apollo视觉、Docs和全库结论仍须据实际命令另记，不能据本轮局部结果宣称通过。
