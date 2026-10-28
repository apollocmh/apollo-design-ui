# Upload 进度与共享 Progress 契约修正

适用版本：当前未发布的 `0.0.0` 开发版。2026-10-29 用户在完整盘点与实际复现后
批准成组修正，追踪号 `UPLOAD-PROGRESS-20261029`。
保留既有 Upload / Progress 导出、六字段 UploadListProgressProps、文件模型和事件。
不新增旧替身、兼容开关或弃用期。

## 行为变化

| 场景 | 旧行为 | 修正后的契约 |
|---|---|---|
| 无配置或部分 progress 对象 | 默认数字高度被浏览器忽略；部分对象另丢失默认尺寸 | 满宽 2px，默认不显示信息；颜色、名称或 showInfo 的局部配置不改变默认厚度 |
| 数值 strokeWidth | 无有效高度，动态替换后可能残留旧字符串高度 | 按 px 生效；合法 CSS 长度字符串继续保留 |
| size | 只读取高度，忽略宽度；两个预设未完整消费 | 数字决定方形宽高，tuple 决定 [宽,高]，非正宽度沿用 Progress 的自适应规则；small=6px、default=8px |
| 厚度优先级 | 数字/tuple size 优先，但最终高度无效 | 数字/tuple size 优先；其余情况下显式 strokeWidth 优先于预设和默认厚度 |
| 渐变 / showInfo | 公开字段传到旧 MiniProgress 后无效 | 使用真实 Progress 的渐变和百分比信息，支持动态替换及清除 |
| ARIA 名称 | 横杠 prop 被 Vue 归一化后读取错误，名称丢失 | 传给实际 progressbar；配置名称覆盖文件名称，清除配置后恢复文件值；没有自定义名称时使用文件名 |
| 文件 percent | 小数保留，但负值/越界/非有限值泄漏到宽度或 ARIA | 保留有限小数，限制到 0–100，非有限值按 0；absent 不显示，显式 undefined/0 显示零进度 |
| 上传达到 100% | 内置进度一直 normal，但信息配置无效 | 继续保持 normal，等待真实上传成功事件；showInfo:true 显示 100% |
| Provider、RTL 与前缀 | MiniProgress 固定 apollo 类；数字/对象更新留下旧 CSS | 使用真实 Progress 的当前上下文；数值和样式更新不残留。自定义前缀仍需消费者提供相应静态 CSS |
| Progress 线形数字宽度 | 数字直接写入 style，未生成 CSS 长度 | 数字、tuple、对象 size 的有效宽度输出 px；恢复自适应宽度时清除旧值 |
| 三类 Progress 的 ARIA 值 | parseInt 截断小数，负值和越界原样输出 | 使用有限的原始小数并限制到 0–100；非有限值为 0；success.percent 仍优先。原 status 整数推导不变 |

公共用法保持：

```vue
<Upload
  v-model:file-list="files"
  :progress="{
    strokeWidth: '0.25rem',
    strokeColor: { '0%': '#108ee9', '100%': '#87d068' },
    showInfo: true,
    'aria-label': 'Report upload progress',
  }"
/>
```

不需要替代 prop。依赖旧无效字段、0px 轨道、忽略 size 宽度、整数 ARIA 快照的调用者
应移除对应补丁或更新对这些错误行为的预期；需要固定宽高时使用 size，
仅调厚度时使用 strokeWidth。Upload 不增加 Progress 的 percent/type/status/format 等配置字段。

原有正常行为继续保留：受控与非受控文件列表、当前 Provider 的浅合并与局部优先、
四类列表与 Dragger、整行 itemRender 槽所有权、首次挂载 300ms 延迟、状态离场、
反复显示和卸载清理、触发器及操作按钮焦点。

## 验证与发布边界

仓库回归位于 Upload 的 `progress.test.ts` / `type.test-d.ts` 和 Progress 的
`upload-integration.test.ts`；真实浏览器回归为：

```sh
UPLOAD_PROGRESS_SOURCE=1 node tests/browser/upload-progress.mjs
UPLOAD_PROGRESS_SOURCE=1 UPLOAD_PROGRESS_CSS=component node tests/browser/upload-progress.mjs
```

上述脚本只打包临时浏览器夹具，不执行包构建或写 dist。未指定 SOURCE 时读取发布包，
须在主任务构建并冻结同一提交的产物后执行。修改前、修改后实际命令与结果见
[本轮审计](../audit/2026-10-29-upload-progress-audit.md)。
这份迁移说明不代表全 Upload、全 Progress、发布包或正式视觉已经通过验收。
