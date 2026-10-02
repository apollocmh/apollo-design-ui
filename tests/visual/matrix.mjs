/**
 * matrix.mjs — 视觉回归的截图矩阵定义。
 *
 * 约定：`id = <component>/<variant>__<theme>__<viewport>`，两侧（react / vue）共用同一 id，
 * 因此一张 React 截图与一张 Vue 截图天然配对。
 *
 * ── 与其他层的关系 ──────────────────────────────────────────────────────────
 *
 * `tests/compat` 在 jsdom 里比 DOM 结构（`A9` 允许它 import antd）；本目录在真实
 * 浏览器里比**像素**。两者互补，不重叠。
 *
 * ── 关于 dark / compact ─────────────────────────────────────────────────────
 *
 * `TESTING.md` §9.1 把 dark / compact 列为必选。但我们的主题切换依赖
 * `ConfigProvider`，而 `ConfigProvider` **组件**尚未实现（只有 `context.ts`），
 * 且零运行时架构下 `tokens.css` 是**构建期产物** —— 运行时无法切换算法。
 * 所以本阶段 `THEMES` 只有 light。这不是「降低门槛」（`H8`），而是把不可比的部分
 * 显式登记在 `LIMITATIONS` 里，等 ConfigProvider 落地后补齐。
 */

/** viewport：`TESTING.md` §9.1 要求每个状态至少覆盖 3 个。 */
export const VIEWPORTS = [
  { id: 'mobile', width: 375, height: 667 },
  { id: 'tablet', width: 768, height: 1024 },
  { id: 'desktop', width: 1440, height: 900 },
];

/**
 * 主题。dark / compact 见文件头说明。
 *
 * `antdTheme` 传给 antd 的 `ConfigProvider`；`apolloTokens` 是对应的构建期 token 产物名。
 */
export const THEMES = [{ id: 'light', antdTheme: 'default', apolloTokens: 'light' }];

/**
 * 组件矩阵。
 *
 * ⚠️ `variants` **不是** demo 名。antd 的 demo 与我们的 demo 并不一一对应
 * （antd 的 `customize` / `config-provider` / `style-class` 依赖 antd-style、
 * Select / Table 等我们尚未实现的组件），拿 demo 互相截图比的是「demo 不同」。
 *
 * 所以这里是**视觉用例**：两侧各写一份、语义逐条对齐，覆盖组件的**视觉面**。
 * 同名用例放在 `render/cases/react/<component>.jsx` 与 `render/cases/vue/<component>.js`，
 * 共用 `render/cases/shared.mjs` 里的常量，确保输入一致。
 */
export const COMPONENTS = {
  affix: {
    // ── 视觉变体的**重复豁免**（由 `node tests/visual/run.mjs --check-baselines` 强制）──
    // 每条都必须**恰好命中**一组重复；未命中的豁免会让自检失败（防腐烂）。
    duplicateAllow: [
      {
        variants: ['basic', 'class'],
        reason:
          '`class` 变体只传 `className` / `rootClassName` —— 差异**只在类名上**（那是 L4 的事）。⚠️ 已实测：给它注入可见样式会让**两侧的类名落在不同元素上**（1.2~1.5% block-diff），说明这条差异不该由 L6 承担。',
      },
    ],
    // 5 个 variant × 3 个 viewport = 15 张
    // ⚠️ 只覆盖**未固钉**的静态形态：页面停在顶部时 `getBoundingClientRect` 的
    //    top 远大于阈值 ⇒ 不固钉（`docs/analysis/affix.md` §8）。
    //    固钉态（position:fixed）需要真实滚动，不进视觉比对。
    variants: [
      'basic', // offsetTop=80 + 内容（未固钉：内层无 apollo-affix 类名、无占位层）
      'offset-bottom', // offsetBottom=80（与 offsetTop 互斥）
      'class', // className / rootClassName
      'style', // style 透传到外层占位测量层
      'no-children', // 无子内容（SSR 下 React 会警告 ResizeObserver 空子，仍可渲染）
    ],
  },
  button: {
    // 9 个 variant × 3 个 viewport = 27 张
    variants: [
      'type', // 五种旧版类型糖 + 两个中文字（D7 的形态差异在像素层裁决）
      'size', // small / middle / large
      'loading', // 布尔与 { delay: 0 } 两条「立刻加载」路径
      'disabled', // <button> 分支与 <a> 分支的不对称表达
      'danger', // danger 与五种 type 的组合
      'ghost', // ghost 把 solid 退化成 outlined（放在有色背景上）
      'icon', // prop 图标 / icon-only / iconPlacement=end / shape
      'color-variant', // v6 的 color × variant 六组
      'semantic', // classNames / styles 语义化覆盖
    ],
  },
  'config-provider': {
    // 组件本身不产 DOM，所以这三条比的是「它对下游产生的效果」。
    // 具体下游链路见 `render/cases/shared.mjs` 的 ConfigProvider 段。
    variants: [
      'locale', // locale → Empty 的描述文案
      'theme-token', // theme.token.colorPrimary → Spin 的主色
      'theme-dark', // theme.algorithm = darkAlgorithm → Empty 的描述色
    ],
  },
  divider: {
    variants: [
      'horizontal', // 水平（含 dashed）
      'with-text', // 标题 center / start / end + styles.content.margin
      'vertical', // 垂直（orientation 与 vertical 两条路径）
      'variant', // solid / dotted / dashed
      'size', // small / medium / large
      'plain', // 正文样式的标题
      'customize-style', // style prop 覆盖 borderColor / borderWidth
      'semantic', // classNames / styles 语义化覆盖
    ],
  },
  empty: {
    variants: [
      'default', // 默认：locale 文案 + 默认插画
      'simple', // PRESENTED_IMAGE_SIMPLE（触发 -normal 类名）
      'no-description', // description={false}：不渲染描述块
      'custom-description', // description 传节点
      'custom-image', // image 传 data URI
      'with-footer', // 默认插槽 → footer
      'semantic', // classNames / styles 语义化覆盖
    ],
  },
  flex: {
    // 5 个 variant × 3 个 viewport = 15 张
    variants: [
      'basic', // 水平默认 + vertical 切换（gap=medium）
      'vertical', // vertical 与 orientation 两条路径（含 orientation 压过 vertical）
      'gap', // 三档预设（token 派生）+ 自定义 '16px'
      'wrap', // 多行换行（12 块）
      'justify-align', // justify / align 对齐（含垂直 justify）
    ],
  },
  grid: {
    // 6 个 variant × 3 个 viewport = 18 张
    variants: [
      'basic', // span 24/12/8/6 阶梯
      'gutter', // gutter 数字与数组（margin/padding/rowGap 链路）
      'offset-sort', // offset 与 push/pull
      'justify-align', // justify 六种 + align 三种
      'responsive', // xs/sm/md 响应式类（固定 viewport 验证 media query 生效）
      'flex', // flex 布局填充与响应式 flex 变量
    ],
  },
  badge: {
    // 6 个 variant × 3 个 viewport = 18 张
    variants: [
      'basic', // count wrapper 形态（5 / 99+ / 0+showZero）
      'status', // 状态点五态 + text（processing 波纹不在比对面）
      'colorful', // 13 预设色状态点
      'dot', // 纯点形态
      'ribbon', // Ribbon 预设色/自定义色/双挂角
      'offset-size', // 封顶 + offset + size small
    ],
  },
  'border-beam': {
    // 2 个 variant × 3 个 viewport = 6 张（流光动画本身不在比对面，截静态形态）
    variants: ['basic', 'color'],
  },
  result: {
    // 3 个 variant × 3 个 viewport = 9 张
    variants: ['basic', 'exception', 'semantic'],
  },
  'back-top': {
    // 1 个 variant × 3 个 viewport = 3 张（fixed 定位；visibilityHeight=0 恒显）
    variants: ['basic'],
  },
  tabs: {
    // ── 视觉变体的**重复豁免**（由 `node tests/visual/run.mjs --check-baselines` 强制）──
    // 每条都必须**恰好命中**一组重复；未命中的豁免会让自检失败（防腐烂）。
    duplicateAllow: [
      {
        variants: ['basic', 'extraContent'],
        reason:
          '用例容器**固定 640px 宽**（> 移动视口 375px）⇒ 右侧的 `tabBarExtraContent` 落在可视区之外**被裁掉**（探针实测 `scrollWidth 656 > 375`）。只在 mobile 下重复。要测它需让容器自适应宽度。',
      },
    ],
    // 13 个 variant × 3 个 viewport = 39 张
    // ⚠️ 只覆盖**静态形态**：溢出下拉展开、键盘焦点移动、面板切换动画都不进像素比对
    //    （它们的语义由 L2 的 index.test.ts 与 L5 的 a11y.test.ts 钉住）。
    // ⚠️ `-ink-bar` 的位置来自 DOM 实测 —— 视觉层跑真 Chrome，两侧的测量链一致 ⇒ 可比。
    variants: [
      'basic', // 默认（指示条居中）
      'activeThird', // 激活第三项（指示条移到最右）
      'card', // 卡片式
      'editableCard', // 卡片 + 删除按钮 + 「+」
      'centeredCard', // 卡片居中
      'vertical', // 纵向（左侧）
      'bottom', // 底部
      'small', // 小尺寸
      'large', // 大尺寸
      'gutter', // 自定义页签间距
      'disabledItem', // 含禁用页签
      'extraContent', // 右侧附加内容
      'indicatorStart', // 指示条对齐 start
    ],
  },
  tag: {
    // 3 个 variant × 3 个 viewport = 9 张
    variants: ['basic', 'checkable', 'semantic'],
  },
  skeleton: {
    // 8 个 variant × 3 个 viewport = 24 张
    variants: [
      'basic', // 默认：title（38%）+ 3 行 paragraph（末行 61%）
      'avatar', // 头像三组合：avatar+title+paragraph / +title:false / +paragraph:false
      'round', // 胶囊圆角（标题与段落行的 border-radius 换成 100px）
      'paragraph', // rows / width 数组 / width 数字（含 `-active` 的微光动画）
      'title', // title 宽度的三张表（38% / 50% / 数字）
      'element', // Skeleton.Button / Input / Avatar（含 block / size / shape）
      'node-image', // Skeleton.Node（自定义插槽）与 Skeleton.Image（内置占位图）
      'semantic', // classNames / styles 语义化覆盖
    ],
  },
  alert: {
    // 6 个 variant × 3 个 viewport = 18 张
    variants: [
      'basic', // 四 type（outlined，无图标）
      'icon', // showIcon + description（with-description 形态）
      'banner', // banner 四态（含 no-icon）
      'closable', // 关闭按钮 + closeText
      'filled', // filled 形态
      'semantic', // classNames / styles 语义化覆盖
    ],
  },
  checkbox: {
    // 5 个 variant × 3 个 viewport = 15 张
    variants: [
      'basic', // 默认态 + checked + disabled
      'indeterminate', // 半选（含 checked 半选组合）
      'group', // options 三形态（字符串/对象/对象 disabled）
      'check-all', // 全选 + 半选 + Divider
      'semantic', // 语义化 classNames / styles
    ],
  },
  layout: {
    // ── 视觉变体的**重复豁免**（由 `node tests/visual/run.mjs --check-baselines` 强制）──
    // 每条都必须**恰好命中**一组重复；未命中的豁免会让自检失败（防腐烂）。
    duplicateAllow: [
      {
        variants: ['side', 'collapsible'],
        reason:
          '`-sider-trigger` 是 **`position: fixed; bottom: 0`**（相对**视口**定位，antd 如此）⇒ 在「只截 `#stage`」的视觉用例里**恒定落在截图区之外**（探针实测：stage 高 252px、trigger 在 y=852）。三个视口都重复。要测它必须让 stage 占满视口高度或改截全页。',
      },
    ],
    // 6 个 variant × 3 个 viewport = 18 张
    variants: [
      'basic', // Header + Content + Footer（无 Sider）
      'side', // Layout + Sider(dark) + Content
      'side-light', // Sider theme=light
      'collapsible', // Sider collapsible（带 trigger）
      'collapsed', // Sider collapsed=true（默认图标方向）
      'zero-width', // collapsedWidth=0（零宽触发器）
    ],
  },
  watermark: {
    // 4 个 variant × 3 个 viewport = 12 张
    variants: [
      'basic', // 单行文本水印（默认 rotate -22 / gap 100）
      'multi-line', // 多行（第二行独立 fontSize）
      'image', // 图片水印（内联 SVG data URL，避免网络依赖）
      'gap-offset', // gap + offset 自定义（交错平铺锚点）
    ],
  },
  statistic: {
    // 5 个 variant × 3 个 viewport = 15 张
    variants: [
      'basic', // title/value/precision/prefix/suffix（含千分位与小数）
      'status', // styles.content 染色（涨/跌两态）
      'loading', // Skeleton 骨架分支
      'semantic', // classNames / styles 语义化覆盖
      'timer', // Statistic.Timer（format 只到「天」——秒级截图两侧漂移）
    ],
  },
  space: {
    // 9 个 variant × 3 个 viewport = 27 张
    variants: [
      'basic', // 默认：水平 + 默认 size（small）+ 默认 align（center）
      'size', // small / medium / large + 数字 24 四档
      'align', // center / start / end / baseline 四档（含高矮不齐的块）
      'vertical', // orientation="vertical" + size="medium" + 三张卡片
      'wrap', // size={[8, 16]} + wrap（12 个块，跨行）
      'separator', // separator 传 Divider（垂直）与传字符串两条路径
      'compact', // Space.Compact：block / 非 block、两个输入、输入+按钮
      'compact-vertical', // Space.Compact orientation="vertical" 的边框合并
      'semantic', // classNames / styles 语义化覆盖
    ],
  },
  spin: {
    // 8 个 variant × 3 个 viewport = 24 张
    variants: [
      'basic', // 非嵌套：根元素自己就是 section
      'size', // small / medium / large（dot 尺寸三档）
      'description', // 三个尺寸 + 文案（嵌套形态）
      'nested', // 嵌套：转 / 不转 两个状态并排
      'custom-indicator', // 自定义指示器（indicator > ConfigProvider > setDefaultIndicator）
      'percent', // 定长进度环（percent=60；'auto' 是时间驱动的，不进视觉比对）
      'fullscreen', // 遮罩 + 居中（在建立包含块的盒子里，见 shared.mjs）
      'semantic', // classNames / styles 语义化覆盖
    ],
  },
  typography: {
    // 8 个 variant × 3 个 viewport = 24 张
    variants: [
      'text', // Text：基础 + 四种语义 type + disabled
      'title', // Title：h1 ~ h5 五级
      'paragraph', // Paragraph：默认 + 多段（含 `div&` 的 margin-bottom）
      'decorations', // code / mark / underline / delete / strong / keyboard / italic
      'link', // Link：默认 / 语义 type / disabled / target=_blank
      'ellipsis', // 单行 + 多行 + expandable（JS 二分裁剪路径）
      'copyable', // 复制按钮（未复制态）
      'semantic', // classNames / styles 语义化覆盖
    ],
  },
  radio: {
    // 5 个 variant × 3 个 viewport = 15 张
    variants: [
      'basic', // 普通 / 选中 / 禁用 / 选中+禁用（含 `::after` 的 \a0 基线占位）
      'group', // options 三形态（字符串 / 对象 / 对象 disabled）+ vertical + block
      'button', // Radio.Button 三态（正常 / 单项禁用 / 整组禁用）+ solid
      'size', // large / 默认 / small（size 只对 button 形态生效）
      'semantic', // 语义化 classNames / styles
    ],
  },
  switch: {
    // 5 个 variant × 3 个 viewport = 15 张
    variants: [
      'basic', // 普通 / 选中 / 禁用 / 选中+禁用（把手位移 + 圆点状态）
      'loading', // loading（强制 disabled）+ size small 的 loading 图标尺寸
      'size', // 默认 / small（轨道与把手两档）
      'text', // checkedChildren / unCheckedChildren 四种形态（字符串 / 数字 / 图标 / 图标+文字）
      'semantic', // 语义化 classNames / styles
    ],
  },
  input: {
    // 3 个 variant × 3 个 viewport = 9 张
    variants: [
      'basic', // 默认 + size 三档
      'variants', // 四形态变体
      'states', // disabled / readonly / status / allowClear / showCount / password / textarea
    ],
  },
  'input-number': {
    // 3 个 variant × 3 个 viewport = 9 张
    variants: [
      'basic', // 默认 + size 三档
      'variants', // variant 四形态
      'states', // disabled / readonly / status / out-of-range / spinner / presuffix
    ],
  },
  collapse: {
    // ── 视觉变体的**重复豁免**（由 `node tests/visual/run.mjs --check-baselines` 强制）──
    // 每条都必须**恰好命中**一组重复；未命中的豁免会让自检失败（防腐烂）。
    duplicateAllow: [
      {
        variants: ['basic', 'accordion'],
        reason:
          '`accordion` 只约束**后续交互**（初始 `defaultActiveKey` 在两种模式下都展开）⇒ 静态帧逐字节相同。⚠️ 已实测验证：把 `accordion` 用例的 `defaultActiveKey` 改成两个键后**仍然相同**。差异只能在点击时出现 ⇒ 归 L2/L6-交互。',
      },
    ],
    // 3 个 variant × 3 个 viewport = 9 张
    variants: [
      'basic', // 默认展开一项 + 箭头旋转
      'accordion', // role=tablist + 手风琴
      'borderless', // 无外框 + 两项展开
    ],
  },
  'qr-code': {
    // 3 个 variant × 3 个 viewport = 9 张（canvas 绘制两侧矩阵同源 ⇒ 像素一致）
    variants: [
      'basic', // 默认 canvas + 边框
      'custom', // 自定义前景/背景/尺寸
      'svg', // svg 形态
    ],
  },
  splitter: {
    // 3 个 variant × 3 个 viewport = 9 张（SSR 帧容器未测量 ⇒ dragger 无激活态，稳定）
    variants: [
      'basic', // 两面板 + 默认 dragger
      'vertical', // 纵向布局
      'multiple', // 3 面板 + min/max
    ],
  },
  list: {
    // 11 个 variant × 3 个 viewport = 33 张
    //
    // ⚠️ List **没有浮层**（分页不带下拉时不开浮层；`-item-action` 是行内 `<ul>`）
    //    ⇒ 不需要 `getPopupContainer`。它的视觉面是**结构 + 间距**：
    //    `-items` / `-item` / `-item-meta` / `-item-action` 的 padding、分割线、`-bordered` 的内圆角。
    //
    // ⚠️ 两条硬约定（见 `cases/{react,vue}/list.*` 的文件头）：
    //    字体在用例内钉住 + 容器宽度 320px。
    //
    // 🚨 **本组件在 antd 6.6.4 里整体 deprecated** ⇒ 两侧渲染都会发一条 `console.error`
    //    （上游行为，不是本仓引入的噪音）。
    //
    // ⚠️ 每个变体都必须**非空转**：写完后先
    //    `md5 tests/visual/baselines/react/list/*.png | sort` 查同哈希（PITFALLS 276）。
    variants: [
      'basic', // `-split` 分割线 + item padding
      'meta', // Item.Meta 三段 + `h4` 标题
      'actions', // `-item-action` 的 ul/li + `-item-action-split`
      'bordered', // `-bordered` 外框 + header/footer 的 calc 内圆角
      'vertical', // `-vertical` + `-item-main` / `-item-extra` 两段式
      'grid', // `-grid .{antCls}-col > -item`（用的是 antCls！）
      'pagination', // `-pagination` margin + `-something-after-last-item`
      'loading', // Spin 嵌套容器 + 53px 占位块
      'empty', // `-empty-text` 默认空态
      'size', // `-lg` / `-sm` 的 item padding
      'rtl', // 根 `-rtl`（逻辑属性翻转）
    ],
  },
  listy: {
    // 3 个 variant × 3 个 viewport = 9 张
    // ⚠️ Raw 路径（antd 默认 virtual=false）；虚拟模式像素不稳定（滚动位置依赖时序）不进静态帧
    variants: [
      'basic', // 数据驱动项 + 分隔线 + hover 通道
      'groupSticky', // 分组 + CSS sticky 组头 + 渐变底
      'height', // height ⇒ maxHeight + overflowY:auto（有滚动条空间）
    ],
  },
  descriptions: {
    // 4 个 variant × 3 个 viewport = 12 张
    variants: [
      'basic', // 默认 3 列 + 行尾补齐（colSpan=3）
      'bordered', // th/td 分格 + labelBg + 圆角
      'vertical', // label 行 + content 行
      'size', // small / medium 两档 padding
    ],
  },
  carousel: {
    // ── 视觉变体的**重复豁免**（由 `node tests/visual/run.mjs --check-baselines` 强制）──
    // 每条都必须**恰好命中**一组重复；未命中的豁免会让自检失败（防腐烂）。
    duplicateAllow: [
      {
        variants: ['basic', 'fade'],
        reason:
          '`effect="fade"` 的差异只在**切换动画进行中**可见 —— 静态帧两侧都停在第一张。要测它需要交互（`goTo`）。',
      },
    ],
    // 4 个 variant × 3 个 viewport = 12 张
    variants: [
      'basic', // 默认 3 张 + 底部圆点（slick 轨道 / slide 排布 / 圆点几何）
      'fade', // effect=fade：当前张可见、其余透明（无 clone）
      'arrows', // arrows + 默认箭头几何（√2 的 ::after 旋转边框）
      'vertical', // dotPlacement=start：纵向布局 + 左侧圆点（宽高对调）
    ],
  },
  image: {
    // 3 个 variant × 3 个 viewport = 9 张
    // ⚠️ 全部 data URI 图片（外网图片会污染基线）；preview 为 open 受控静态帧。
    variants: [
      'basic', // 本体（img + cover）
      'cover', // cover 层（hover 封面）
      'preview', // 预览浮层（open 受控，portal + 变换内核的静态帧）
    ],
  },
  message: {
    // 3 个 variant × 3 个 viewport = 9 张
    // ⚠️ 命令式路径是 portal + 自动消失 ⇒ 用例全部走**静态面板**
    //    （`_InternalPanel*` / `_InternalList*`，与 L4 同形态）。
    variants: [
      'single', // 单条（success 图标 + 文案）
      'types', // 四种类型的列表（几何 + 图标着色）
      'custom', // 语义槽样式（root / icon / title 三层）
    ],
  },
  notification: {
    // 3 个 variant × 3 个 viewport = 9 张
    // ⚠️ 命令式路径是 portal + 自动消失 ⇒ 用例全部走**静态面板**（与 L4 同形态）。
    variants: [
      'basic', // 单条（success 图标 + 标题 + 描述 + 关闭按钮）
      'placement', // bottomRight 定位（message 没有这个概念）
      'actions', // actions 区（操作按钮 + 关闭按钮的几何）
    ],
  },
  drawer: {
    // 3 个 variant × 3 个 viewport = 9 张
    // ⚠️ 受控 open + getContainer:false（内联）—— 不 portal、不 push 页面，避免污染其他组件。
    variants: [
      'basic', // 右抽屉（默认方位）+ 标题/extra/页脚
      'size', // 左抽屉 + size='large'（736px）
      'bottom', // 底部抽屉（垂直高度轴）+ 无遮罩
    ],
  },
  app: {
    // 1 个 variant × 3 个 viewport = 3 张
    variants: ['basic'],
  },
  dropdown: {
    // 2 个 variant × 3 个 viewport = 6 张
    // open 受控静态帧 + placement=bottom + autoAdjustOverflow=false 钉死落点。
    variants: [
      'basicOpen', // open + bottom：Menu 浮层（portal 定位 + item/danger/disabled）
      'arrow', // 带箭头（--arrow-x/y 运行时变量 + ::before/::after 斜块）
    ],
  },
  progress: {
    // 3 个 variant × 3 个 viewport = 9 张
    variants: ['line-states', 'circle-dashboard', 'gradient-success'],
  },
  'float-button': {
    // 3 个 variant × 3 个 viewport = 9 张
    variants: ['basic', 'shape-content', 'badge-tooltip'],
  },
  'auto-complete': {
    // 3 个 variant × 3 个 viewport = 9 张
    variants: ['basic', 'status', 'style-class'],
  },
  rate: {
    // 3 个 variant × 3 个 viewport = 9 张
    variants: [
      'basic', // 默认 + disabled
      'half', // 半星
      'character', // 自定义字符
    ],
  },
  cascader: {
    // 3 个 variant × 3 个 viewport = 9 张
    // ⚠️ 触发元素用 open 受控静态帧钉住（与 dropdown / select 同判）；
    //    列结构走 `panel`（两侧同一份：antd `Cascader.Panel` ↔ 本仓 `CascaderPanel`，
    //    rc Panel = **只有列**，无 select 外壳；不要用
    //    `_InternalPanelDoNotUseOrYouWillBeFired`，那是完整 Cascader 的 PurePanel）。
    variants: [
      'basic', // title + 列展开 + 选中态
      'multiple', // 多选 checkbox
      'panel', // 纯面板形态
    ],
  },
  pagination: {
    // ── 视觉变体的**重复豁免**（由 `node tests/visual/run.mjs --check-baselines` 强制）──
    // 每条都必须**恰好命中**一组重复；未命中的豁免会让自检失败（防腐烂）。
    duplicateAllow: [
      {
        variants: ['quickJumper', 'quickJumperButton', 'sizeChanger'],
        reason:
          '同 tabs：用例容器固定 **640px** 宽（> 移动视口 375px）⇒ 右侧的 sizeChanger / quickJumper 被裁（探针实测 `scrollWidth 656 > 375`）。只在 mobile 下重复。',
      },
    ],
    // 10 个 variant × 3 个 viewport = 30 张
    // ⚠️ 只覆盖**静态形态**：下拉展开、输入过程中的帧不进像素比对
    //    （它们的语义由 L2 的 index.test.ts 与 L5 的 a11y.test.ts 钉住）。
    variants: [
      'basic', // 默认（含跳页项）
      'totalText', // showTotal 的 li
      'simple', // 简化模式（输入 / 总页数）
      'quickJumper', // 快速跳转（跳至 __ 页）
      'quickJumperButton', // 快速跳转 + 确认按钮
      'sizeChanger', // 尺寸切换器（内部是本仓 Select）
      'disabled', // 禁用态
      'large', // 大尺寸 + 快速跳转
      'alignCenter', // 中对齐 + showTotal
      'lessItems', // showLessItems（±3、buffer 1）
    ],
  },
  slider: {
    // 8 个 variant × 3 个 viewport = 24 张
    // ⚠️ 只覆盖**静态形态**：拖拽/键盘过程帧与 tooltip 浮层（portal + 依赖布局定位）
    //    不进像素比对 —— 它们的语义由 L2（index.test.ts）与 L5（a11y.test.ts）钉住。
    variants: [
      'basic', // 单把手 + 已选轨道
      'range', // 双把手 + 中间段轨道
      'marks', // 文字标记（含对象形态的 label/style）
      'dots', // step=10 的刻度点
      'vertical', // 纵向（位置走 bottom/top + translateY）
      'reverse', // 反向（rtl 方向）
      'disabled', // 禁用态
      'includedOff', // included=false（只有 rail，没有已选轨道）
    ],
  },
  form: {
    // 5 个 variant × 3 个 viewport = 15 张
    // ⚠️ 只用**参数驱动的静态形态**：校验链是异步的，跑一条 `validateFields` 会让
    //    截图时刻不确定（错误文案有 debounce 动效）。错误/帮助文案用
    //    `validateStatus` / `help` / `extra` 显式驱动，反馈图标同理。
    variants: [
      'basic', // horizontal + label/required/extra
      'vertical', // 纵向布局
      'inline', // 行内布局
      'label', // requiredMark=optional / requiredMark=false / colon=false / tooltip
      'status', // help + validateStatus 四态 + hasFeedback 图标
      'sizes', // small / middle / large 三档
      'col', // labelCol 8 / wrapperCol 16 栅格布局
    ],
  },
  'tree-select': {
    // ── 视觉变体的**重复豁免**（由 `node tests/visual/run.mjs --check-baselines` 强制）──
    // 每条都必须**恰好命中**一组重复；未命中的豁免会让自检失败（防腐烂）。
    duplicateAllow: [
      {
        variants: ['checkable', 'multiple'],
        reason:
          '`treeCheckable` 的**勾选框在未展开的下拉里** ⇒ 静态帧（下拉关闭）与 `multiple` 逐字节相同。要测它必须 `open` 受控展开浮层。',
      },
    ],
    // 3 个 variant × 3 个 viewport = 9 张
    variants: [
      'basic', // 单选 + value 回显
      'multiple', // 多选 tags + maxTagCount
      'checkable', // treeCheckable + SHOW_CHILD 回显
    ],
  },
  tree: {
    // 3 个 variant × 3 个 viewport = 9 张
    // ⚠️ 全展开 + selected/checkable 静态态钉住；目录树走 directory variant。
    variants: [
      'basic', // checkable + 展开 + 选中 + 勾选级联
      'directory', // DirectoryTree（Folder/File 图标 + 选中）
      'show-line', // 连接线 + 展开态
    ],
  },
  popconfirm: {
    // 3 个 variant × 3 个 viewport = 9 张
    // ⚠️ 浮层用 open 受控静态帧钉住（与 dropdown / select 同判）；
    //    纯面板形态走 `render-panel`（PurePanel，无需 portal）。
    variants: [
      'basic', // title + description + 默认 icon + 双按钮
      'no-cancel', // showCancel=false（只有 OK）
      'render-panel', // PurePanel 静态面板
    ],
  },
  tour: {
    // 3 个 variant × 3 个 viewport = 9 张
    // ⚠️ 浮层用 open 受控静态帧钉住（与 popconfirm / dropdown 同判）；
    //    纯面板形态走 `render-panel`（PurePanel，无需 portal）。
    variants: [
      'basic', // 蒙层挖洞 + 面板 bottom + 默认关闭钮
      'non-modal', // mask=false + type=primary（面板完整可见）
      'render-panel', // PurePanel 静态面板（default + primary 堆叠）
    ],
  },
  segmented: {
    // 4 个 variant × 3 个 viewport = 12 张
    variants: [
      'basic', // 原始值 options + 选中第 2 项（thumb 静止态）
      'shape-round', // shape=round 全圆角
      'vertical', // 纵向 + thumb 沿纵轴
      'sizes', // 三档尺寸堆叠
    ],
  },
  steps: {
    // 3 个 variant × 3 个 viewport = 9 张
    variants: [
      'basic', // 状态推导 + rail（filled）
      'vertical', // 纵向 + 标题横排
      'dot', // 点状
    ],
  },
  select: {
    // 3 个 variant × 3 个 viewport = 9 张
    // open 受控静态帧钉住下拉（与 dropdown 同判）；basic/multiple 走回填态。
    variants: [
      'basic', // 单选回填 + allowClear（清除位与箭头共存）
      'multiple', // 多选 tag（-selection-item / -content-item 布局）
      'open', // 展开态（dropdown / list / holder 三层 + active/selected/disabled）
    ],
  },
  modal: {
    // 3 个 variant × 3 个 viewport = 9 张
    // ⚠️ 全部走**内联渲染**（受控 open + getContainer:false）或 PurePanel ——
    //    portal 出来的浮层会盖住别的组件、动效相位也不稳定（与 drawer 同判，PITFALLS 177）。
    variants: [
      'basic', // 内联 + 标题/正文/页脚/关闭按钮
      'confirm', // PurePanel type=confirm（图标 + 标题 + 正文 + 两按钮）
      'loading', // 骨架态（footer 强制不渲染）
    ],
  },
  menu: {
    // 4 个 variant × 3 个 viewport = 12 张
    // 全部静态帧（selectedKeys/openKeys 受控）；horizontal 走真浏览器 RO 测量。
    variants: [
      'vertical', // 垂直 + 展开 submenu
      'inline', // 内嵌展开
      'dark', // 暗色主题
      // ⚠️ horizontal PENDING（PENDING-1）：Overflow 的 RO 测量时序存在
      //    hidden 中间态冻结（displayCount 早退后 absolute 元素的 RO 不再
      //    触发 ⇒ 无法收敛）—— DOM 结构由 L4 menu:horizontal 钉住，几何
      //    待 Overflow 时序精调后回归（与 picker 的 PENDING 同模式）。
    ],
  },
  popover: {
    // 2 个 variant × 3 个 viewport = 6 张
    // open 受控静态帧 + placement=bottom + autoAdjustOverflow=false 钉死落点
    //（tooltip 期结论）。
    variants: [
      'basicOpen', // open + bottom：title/content 容器 + portal 浮层（定位几何 + 箭头）
      'purePanel', // PurePanel 静态面板（-placement 类 + title/content 结构）
    ],
  },
  timeline: {
    // 12 个 variant × 3 个 viewport = 36 张
    //
    // ⚠️ Timeline **没有浮层** ⇒ 不需要 `getPopupContainer`。
    // ⚠️ 它**也没有自己的 DOM** —— 是 `Steps` 的薄壳 ⇒ 用例同时拍到 Steps 的产物
    //    （**有意**：Timeline 的视觉面就是「Steps 的 DOM + Timeline 的样式覆盖」）。
    //
    // ⚠️ 两条硬约定（见 `cases/{react,vue}/timeline.*` 的文件头）：
    //    字体在用例内钉住 + 容器宽度 320px。
    //
    // ⚠️ 每个变体都必须**非空转**：写完后先
    //    `md5 tests/visual/baselines/react/timeline/*.png | sort` 查同哈希（PITFALLS 276）。
    variants: [
      'basic', // 纵向 + 有 title ⇒ **交错**（head-span-ptg 分栏）
      'verticalSingle', // 纵向 + **无** title ⇒ 不交错（layoutAlternate 的第二条判据为假）
      'alternate', // 显式 mode=alternate（奇偶交替）
      'horizontal', // 一整套绝对定位（left:50% + translateX(-50%)）
      'titleSpanNumber', // 内联 --{root}-timeline-head-span（24 栅格制）
      'titleSpanString', // 内联 -head-span-ptg（百分比）
      'colors', // 预设色的**三连类** + 任意色值的内联变量
      'loading', // status: process + LoadingOutlined
      'pending', // 追加项的 status: process + 默认加载图标
      'reverse', // 项顺序反转 + rail 的 status 跟当前项
      'variantFilled', // variant 透传给 Steps
      'rtl', // 逻辑属性翻转（走 ConfigProvider）
    ],
  },
  'time-picker': {
    // 5 个 variant × 3 个 viewport = 15 张
    //
    // ⚠️ 与 `date-picker` **同一套做法**：把浮层**放进截图区域**
    //    （两侧都传 `getPopupContainer` 指向用例盒子 + 盒子 `position: relative`），
    //    因为时间轴的核心视觉面**就是时间面板**（三列 + 选中态 + 滚动位置），
    //    只拍触发器等于没测。
    //
    // 🚨 **面板必须由 `value` / `defaultValue` 驱动，不能用 `defaultOpenValue`** ——
    //    本仓的 `date-picker` **忽略** `defaultOpenValue`（README §5 第 7 条）⇒
    //    用它会让 Vue 侧停在 `00:00:00` 且一格不选中（首轮 L6 3/21 的根因）。
    //    ⚠️ 也**不能**干脆不给值：rc 的 openValue 会回退到 `getNow()`
    //    ⇒ 基线随运行时刻变化（flaky）。
    //
    // 🚨 **不写 `use12Hours` / `minuteStep` / `hourStep` 变体** ——
    //    本仓的顶层时间 props **静默失效**（README §5 第 5 条 / PITFALLS 317）
    //    ⇒ 那是**必然空转**的变体（同哈希）。改用 `no-seconds`（`format: 'HH:mm'`
    //    ⇒ 三列变两列）作可测差异。
    //
    // ⚠️ 写完后先 `md5 tests/visual/baselines/react/time-picker/*.png | sort` 查同哈希。
    variants: [
      'value', // 单值有值：字段文本 + 三列面板的选中态与滚动位置
      'no-seconds', // `format: 'HH:mm'` ⇒ **两列**（与 value 的可测差异）
      'footer', // `renderExtraFooter`：面板底部多一条
      'range', // 范围有值：两个输入框 + 分隔符 + **两个独立的时间面板**
      'variants', // 变体 / 尺寸 / 状态 / 禁用 / 前后缀（**不开浮层**）
    ],
  },
  tooltip: {
    // 3 个 variant × 3 个 viewport = 9 张
    // ⚠️ 全部 open 受控静态帧（不走 hover 时序）。basicOpen/colorful 的浮层经
    //    portal 挂 body、由两侧各自的定位几何落位 —— AR1 的逐像素验证点。
    variants: [
      'basicOpen', // open + top：触发元素 + portal 浮层（定位几何 + 箭头）
      'colorful', // 预设色 blue + 自定义色 #f50（内联变量 + 亮度文本色）
      'purePanel', // PurePanel 静态面板（无 portal，纯 flow 布局）
    ],
  },
  upload: {
    // 3 个 variant × 3 个 viewport = 9 张
    // ⚠️ 全部受控 fileList + 静态状态（done / uploading / error），不发真实请求：
    //    静态帧截图下任何异步上传都是时序噪声。缩略图用内联 SVG data URI（离线 + 无网络抖动）。
    variants: [
      'basic', // text 列表：done / uploading(60%) / error 三项 + select 触发区
      'pictureCard', // picture-card：缩略图 + 悬浮遮罩 + 上传按钮方格
      'drag', // Dragger：虚线框 + drag-container + 列表
    ],
  },
  'date-picker': {
    // 5 个 variant × 3 个 viewport = 15 张
    //
    // ⚠️ 与其它浮层组件的**关键差异**：这里把浮层**放进截图区域**
    //    （两侧都传 `getPopupContainer` 指向用例盒子 + 盒子 `position: relative`），
    //    因为 date-picker 的核心视觉面就是面板 —— 只拍触发器等于没测。
    //    为什么不用 antd 的 `_InternalPanelDoNotUseOrYouWillBeFired` 见
    //    `cases/vue/date-picker.js` 的文件头（它的 holder 用实测高度撑高，
    //    Vue 侧撑不出同一个高度 ⇒ 两侧 `#stage` 尺寸不等）。
    //
    // ⚠️ 日期一律用**固定字面量** + `defaultPickerValue` 锚定月份
    //    （用 `dayjs()` 会让截图随运行日变化）。
    variants: [
      'basic', // 空值：触发框 + 日期面板（含「今天」/选中态）
      'value', // 有值：格式化后的字段文本 + 面板选中态
      'datetime', // showTime：日期 + 三段时间列 + 确定按钮（needConfirm）
      'month', // picker="month"：月面板
      'year', // picker="year"：年面板
      'multiple', // 多选：标签列表（Overflow）+ 多选面板
      'variants', // 变体 / 尺寸 / 状态 / 禁用 / 前后缀（**不开浮层**）
      // ---------------------------------------------------------------- 范围（S5）
      'range', // 范围空值：两个输入框 + 分隔符 + **并排两个面板**
      'range-value', // 范围有值（**跨月**）：两端文本 + 两个面板各自的区间态
    ],
  },
  anchor: {
    // ── 视觉变体的**重复豁免**（由 `node tests/visual/run.mjs --check-baselines` 强制）──
    // 每条都必须**恰好命中**一组重复；未命中的豁免会让自检失败（防腐烂）。
    duplicateAllow: [
      {
        variants: ['active', 'rtl-active'],
        reason:
          '**预期相同**：antd 对 Anchor **零 RTL CSS**（`-rtl` 类不影响任何几何或颜色）⇒ 两侧的 `rtl-active` 本就应与 `active` 逐字节相同。',
      },
    ],
    // 8 个 variant × 3 个 viewport = 24 张
    //
    // ⚠️ Anchor **没有浮层** ⇒ 不需要 `getPopupContainer`。它的视觉面是
    //    **链接列表 + ink 指示条**，而 ink 的位置来自「当前锚点」（滚动侦测的结果）。
    //
    // 🚨 `active` 用例要出效果必须**同时**满足两条（细节见 `cases/react/anchor.jsx` 的文件头）：
    //    ① 目标元素的**视口 top** 要 `<= offsetTop + bounds`（默认 0 / 5）—— 视觉用例
    //       不滚动页面，所以用 `bounds` 抬阈值，目标由零高度夹具提供；
    //    ② `affix` 不能是 `false`（除非给 `showInkInFixed`）—— `-fixed` 上的
    //       `display: none`（3 个类）压过 `-ink-visible`（2 个类），ink 恒被隐藏。
    //    2026-10-01 实测：旧写法漏了 ② 和 ①，`active` / `affix` / `rtl` 三张基线与
    //    `basic` **逐字节相同** —— 用例是空转的。
    //
    // ⚠️ 一条硬约定（见 `cases/{react,vue}/anchor.*` 的文件头）：
    //    **字体在用例内钉住**（两侧页面的 `html` 字体栈不同）。
    variants: [
      'basic', // `affix: false`：结构最干净（含 `-fixed` 类）
      'active', // 第 1 条 active（默认 affix）⇒ `-link-active` / `-link-title-active` / ink 竖条
      'active-last', // 第 3 条 active ⇒ 验证 ink 的 `top` 跟着链接走
      'horizontal', // 水平：`-wrapper-horizontal`，ink 是底部横条
      'horizontal-active', // 水平 + active ⇒ ink 走另一条路径（`left` / `width` 由 JS 实测）
      'nested', // 嵌套 items（垂直才展开）
      'semantic', // classNames / styles
      // RTL + active。⚠️ 与 `active` **逐字节相同是预期的**（antd 对 Anchor 零 RTL CSS）——
      // 留着它是为了守「不许擅自加 antd 没有的 RTL CSS」，别当重复删掉（PITFALLS 276 第三种情形）。
      'rtl-active',
    ],
  },
  breadcrumb: {
    // 8 个 variant × 3 个 viewport = 24 张
    //
    // ⚠️ Breadcrumb **没有浮层**（`menu` 项虽然用 Dropdown，但静态帧里浮层不展开、
    //    不 portal）⇒ 不需要 `getPopupContainer`。
    //
    // ⚠️ 两条硬约定（见 `cases/{react,vue}/breadcrumb.*` 的文件头）：
    //    **字体在用例内钉住** + **容器宽度 320px**（比最小视口窄 ⇒ 三个视口宽度一致、
    //    且内容不换行 —— 换行位置依赖文字度量，一旦换行差异会被放大）。
    //
    // ⚠️ 每个变体都必须**非空转**：写完后先
    //    `md5 tests/visual/baselines/react/breadcrumb/*.png | sort` 查同哈希（PITFALLS 276）。
    variants: [
      'basic', // 3 项（末项无 href ⇒ `<span>`）+ 默认分隔符 `/`
      'with-icon', // 每项「裸 svg + span」⇒ 命中 `-link > svg` 与 `> svg + span` 两条规则
      'separator', // `separator=">"`（prop 覆盖默认值）
      'separator-item', // `type: 'separator'` 的显式分隔符（与注入的分隔符并存）
      'with-params', // `params` + `path` ⇒ href **累加**（`#/home/list/7`）+ `:id` 替换
      'overlay', // 带 `menu` 的项 ⇒ Dropdown + `-overlay-link` 样式 + `DownOutlined`
      'semantic', // classNames / styles 三槽
      'rtl', // direction: rtl ⇒ 根上的 `-rtl` + `direction:rtl`（**有真实 CSS**，与 anchor 不同）
    ],
  },
  avatar: {
    // 12 个 variant × 3 个 viewport = 36 张
    //
    // ⚠️ Avatar **没有浮层**（`group-max` 的溢出 Popover 在静态帧里不展开）
    //    ⇒ 不需要 `getPopupContainer`。它的视觉面是**几何**：宽高、圆角、字号、字符缩放。
    //
    // ⚠️ 两条硬约定（见 `cases/{react,vue}/avatar.*` 的文件头）：
    //    字体在用例内钉住 + 容器宽度 320px。⚠️ `text` / `overflow` 变体里的字符头像
    //    走 `setScaleParam`（真浏览器里 offsetWidth 有效）⇒ **字体一变 scale 就变**，
    //    所以字体必须钉死。
    //
    // ⚠️ 每个变体都必须**非空转**：写完后先
    //    `md5 tests/visual/baselines/react/avatar/*.png | sort` 查同哈希（PITFALLS 276）。
    variants: [
      'basic', // 五种尺寸（含数字 14）× circle + icon
      'square', // 五种尺寸 × square（圆角走 `-square` 分支）
      'text', // 字符头像（单字符 / 多字符）
      'overflow', // 长文本 + 默认 gap ⇒ 触发**字符缩放**（`scale` 内联 transform）
      'icon', // 只有 icon（`-icon` 的字号分支）
      'src', // 图片头像（data URI）+ `src` 是 vnode 的形态
      'numeric', // 数字尺寸（内联 width/height/fontSize）
      'badge', // 带徽标的头像（`Badge` 包裹）
      'group', // Avatar.Group 四个子头像（重叠 + 边框色）
      'group-max', // `max.count` 截断 + `+N`（溢出项）
      'responsive', // 响应式尺寸（**三个视口下尺寸不同**）
      'rtl', // direction: rtl ⇒ group 根上的 `-group-rtl`
    ],
  },
  card: {
    // 11 个 variant × 3 个 viewport = 33 张
    //
    // ⚠️ Card **没有浮层**（`tabs` 变体的页签浮层在静态帧里不展开、不 portal）
    //    ⇒ 不需要 `getPopupContainer`。它的视觉面是四段结构：
    //    head（含 tabs）/ cover / body / actions。
    //
    // ⚠️ 两条硬约定（见 `cases/{react,vue}/card.*` 的文件头）：
    //    字体在用例内钉住 + 容器宽度 320px（窄于最小视口 ⇒ 三视口一致、正文不换行）。
    //
    // ⚠️ `-hoverable` **没有独立变体**：`:hover` 在静态帧里不触发，可见面只有
    //    `cursor` / `transition`（截图上不可见）⇒ 必然空转。它归 L1 的类名断言与 L4。
    //
    // ⚠️ 每个变体都必须**非空转**：写完后先
    //    `md5 tests/visual/baselines/react/card/*.png | sort` 查同哈希（PITFALLS 276）。
    variants: [
      'basic', // head（title + extra）+ body
      'actions', // `<ul>` + 每项 `<li><span>` + 内联百分比宽度 + 竖分隔线
      'small', // `-small` 的三条 head 覆盖 + body padding
      'borderless', // `:not(-bordered)` 的 boxShadowTertiary
      'inner', // `-type-inner` 的 head 背景与字号
      'loading', // Skeleton 4 行段落（title={false}）
      'grid', // `-contain-grid` + 五段 box-shadow
      'meta', // cover + Card.Meta（avatar / title / description）
      'tabs', // head 里的全局 `.apollo-tabs-top` + `-contain-tabs`
      'semantic', // classNames / styles 七槽
      'rtl', // direction: rtl ⇒ 根 `-rtl`（**有真实 CSS**，与 anchor 不同）
    ],
  },
  masonry: {
    // ── 视觉变体的**重复豁免**（由 `node tests/visual/run.mjs --check-baselines` 强制）──
    // 每条都必须**恰好命中**一组重复；未命中的豁免会让自检失败（防腐烂）。
    duplicateAllow: [
      {
        variants: ['basic', 'fresh'],
        reason:
          '`fresh` 只改**每个条目各挂 ResizeObserver**、不改 DOM 结构（用例注释自陈「应与 basic 一致」）⇒ 天生测不到；它的意图归 L4/L2。',
      },
      {
        variants: ['basic', 'fresh', 'responsive'],
        reason:
          '① `fresh` 同上的原因；② `responsive` 在 **desktop/tablet** 下解析出的列数与 `basic` 相同（都是 3 列，只有 mobile 会变 1 列）⇒ 预期相同。',
      },
    ],
    // 5 个 variant × 3 个 viewport = 15 张
    //
    // ⚠️ **没有浮层**（不 portal）⇒ 不需要 `getPopupContainer`，比其它组件简单。
    //    它的视觉面就是**几何**：容器高度、条目宽高与列偏移。
    //
    // ⚠️ 两条硬约定（见 `cases/{react,vue}/masonry.*` 的文件头）：
    //    ① **字体必须在用例内钉住**（条目内容是用户渲染的，两侧页面字体栈不同）；
    //    ② **高度必须是字面量** —— 排布完全由实测高度决定，随机值 = 每天红。
    //
    // ⚠️ 容器宽度固定 320px（窄于最小视口 375px）⇒ 三视口下容器一致，
    //    唯一的差异来源就是 `columns` 的**响应式解析**（`responsive` 用例专测这个）。
    variants: [
      'basic', // 默认 3 列 + gutter 16
      'gutter', // 非对称间距 [水平, 纵向]
      'columns', // 4 列（列宽与偏移都变）
      'responsive', // 响应式列数：mobile 1 / tablet 2 / desktop 3
      'fresh', // 每个条目各挂 ResizeObserver（**不改 DOM 结构** ⇒ 应与 basic 一致）
      'semantic', // classNames / styles 两个语义槽
      'rtl', // direction: rtl ⇒ 根 `-rtl` 类 + inset-inline-start 反向
    ],
  },
};

/** 本阶段明确不覆盖的维度 —— 出现在报告里，避免「没做」被误读为「做了」。 */
export const LIMITATIONS = [
  {
    dimension: 'theme',
    missing: ['dark', 'compact'],
    reason:
      '`THEMES` 是**页面级**维度：把 dark / compact 加进去，等于要为 divider / empty / spin 重新生成一整套基线（3 组件 × 8 variant × 3 viewport × 2 主题），而 `baselines/` 是入库的共享资源 —— 并行流里改它会撞车。ConfigProvider 已落地，dark 先以「用例内部的 `theme.algorithm`」形式在 `config-provider/theme-dark` 里覆盖到；compact 同理，尚未有用例。',
    unblockWhen: '整合期（并行流收敛后）把 dark / compact 并入 THEMES，一次性重生成全部基线。',
  },
  {
    dimension: 'config-provider',
    missing: [
      'componentSize',
      'componentDisabled',
      'direction',
      'prefixCls',
      'renderEmpty',
      'wave',
      'virtual',
    ],
    reason:
      '这些能力**没有可观测的下游**：已落地的三个组件（divider / empty / spin）都不读 SizeContext / DisabledContext / direction，`prefixCls` 换了反而会让静态 CSS 匹配不上（那是「换前缀 → 丢样式」，不是视觉差异），`renderEmpty` 需要 Table / List / Select 等宿主组件。它们的语义由 L1/L2/L4 钉住（`packages/ui/src/config-provider/__tests__/`），视觉层补不了也不会假称补了。',
    unblockWhen:
      '有组件开始消费 SizeContext / DisabledContext / direction（如 Button / Input）后，按消费方逐个补视觉用例。',
  },
  {
    dimension: 'state',
    missing: ['hover', 'active', 'focus', 'disabled'],
    reason:
      'Empty 与 Divider 都是纯展示组件：无事件、无状态、无可交互元素（与 registry 的 interactionStatus = n/a 同源）。Spin 的 `loading` 态**已覆盖**（`nested` 用例并排了 spinning 真/假两个状态）。',
    unblockWhen: 'hover / active / focus / disabled 仍不适用：Spin 没有可聚焦元素与事件。',
  },
  {
    dimension: 'spin·fullscreen',
    missing: ['viewport-sized overlay'],
    reason:
      '`.spin-fullscreen{position:fixed;inset:0}` 铺满**视口**，而本目录的截图目标是 `#stage`（`run.mjs` 固定）—— 高度会塌成 0 无法截图，且两侧 body 默认 margin 不同会让裁剪区域错开。用例改在外层盒子上加 `transform` 建立包含块，遮罩改为铺满该盒子；比到的仍是 `-fullscreen` 那套规则（遮罩色 / 居中 / 白色文案）。',
    unblockWhen: '截图目标支持「按视口截图」后，补一个真正的全屏用例。',
  },
  {
    dimension: 'spin·percent',
    missing: ["percent='auto'"],
    reason:
      '`auto` 是时间驱动的（每 200ms 渐近推进一跳），截图时刻不确定 ⇒ 视觉层会 flaky。它的语义由 L2 在 `vi.useFakeTimers()` 下钉住（`__tests__/index.test.ts`）。',
    unblockWhen: '需要「视觉上确认 auto 的推进观感」时，用固定推进帧数的受控用例补。',
  },
  {
    dimension: 'space·standins',
    missing: ['真实 Button / Input / Select / Card 被 Space 驱动'],
    reason:
      'antd 的 Space demo 依赖 Button / Input / Select / Card / Typography，但它们在本仓库**尚未实现**（Space 在 DAG 上先于它们）。若 React 侧用 antd 的 Button、Vue 侧用原生 button，比出来的差异会是「Button 的实现差异」—— 那是假阳性。所以 9 个用例全部改用**两侧同一份**原生 `<button>` / `<input>` 替身（`render/cases/shared.mjs` 的 `SPACE_*_STYLE`，取值是 antd 6.6.4 的默认 Button / Input）。代价：`Space.Compact` 的**边框合并**只验证到替身上，没验证到真实 Button / Input 的类名拼接上 —— 而后者才是 `useCompactItemContext` 真正的消费方（10 个下游组件）。',
    unblockWhen:
      'Button / Input 落地后，把 `compact` / `compact-vertical` 两个用例换成真实组件（那时比的是「Compact 协议 + Button 实现」的合成结果）。',
  },
  {
    dimension: 'space·state',
    missing: ['hover', 'active', 'focus', 'disabled'],
    reason:
      'Space / Space.Compact / Space.Addon 本身都没有可交互元素（不设 tabindex、不绑事件、没有禁用态），所以这四态对它们不适用 —— 与 Empty / Divider 同源。⚠️ 但 `Space.Compact` 会**改变子元素的 hover 层级**（`genCompactItemStyle` 给 `-compact-item:hover` 设 `z-index: 4`、`[disabled]` 设 `z-index: 0`）。那两条规则作用在**子组件自己的类名**上，而截图是静态的、不会触发 hover ⇒ 视觉层观测不到。它的语义由 `theme.test.ts` 钉住**选择器与顺序**（可判定），层叠结果等真实子组件落地后再补。',
    unblockWhen:
      '有真实的可聚焦子组件（Button / Input）后，用 Playwright 的 `hover()` 补一条「紧凑项 hover 时边框不被邻居遮住」的用例。',
  },
  {
    dimension: 'typography·state',
    missing: ['hover', 'active', 'focus-visible', 'copied', 'editing'],
    reason:
      'Typography 是第一个**有交互态**的组件：`Link` 与四个操作按钮（expand / collapse / edit / copy）各有 hover / focus / active / disabled 四态，`copyable` 还有 `copied` 态。`run.mjs` 只截**静态帧**（渲染完成即截图，无交互步骤），所以这些状态进不了像素比对。它们的语义由 L1/L2 钉住（`__tests__/index.test.ts` 的 `trigger` / `vi.useFakeTimers` 用例），CSS 规则本身由 `__tests__/theme.test.ts` 断言存在。',
    unblockWhen:
      '给 `run.mjs` 加交互步骤（hover / click 后再截）后，补 `link-hover` / `copy-copied` 两个用例。',
  },
  {
    dimension: 'typography·editable',
    missing: ['编辑态（`editable` 进入后的 textarea）'],
    reason:
      'antd 的编辑态渲染 `Input.TextArea`（`ResizableTextArea` 包裹层 + `ant-input` 类 + `ant-typography-edit-content` 上的 `-textarea` 语义槽），而 Input 组件尚未落地。我们用**原生 `<textarea>`** 承载同一套 `-edit-content` CSS（差异 D-typography-3，见 `packages/ui/src/typography/README.md` §7）—— DOM 与视觉都**不**与 antd 一致，拿它进像素比对只会得到一个必然失败的用例。编辑态的**行为**（Enter 确认 / Esc 取消 / blur 确认 / IME 守卫）由 L1/L2 在 `__tests__/` 里钉住，不受此影响。',
    unblockWhen:
      'Input / TextArea 落地后，把编辑态换成真 TextArea 并把 `editable` 补进 `variants`。',
  },
  {
    dimension: 'typography·tooltip',
    missing: ['`ellipsis.tooltip`', '`copyable.tooltips`', '`editable.tooltip` 的悬浮气泡'],
    reason:
      'Tooltip 组件尚未落地。antd 的 Tooltip 在**未展开**时不额外产 DOM（只 clone 子元素并挂事件），所以本阶段用例里的 `copyable` / `ellipsis` 与 antd 逐像素一致；缺的是「悬浮后出现气泡」那一半 —— 那需要交互式截图（`run.mjs` 目前只截静态帧）。`ellipsis.tooltip` 对根元素 `aria-label` 的影响由 L4 钉住。',
    unblockWhen: 'Tooltip 落地后补 hover 态用例（需要给 `run.mjs` 加交互步骤）。',
  },
  {
    // ⚠️ 这一条不是「没做」，而是「做了、红了、并且已经定位到组件外的根因」。
    //    它必须留在 LIMITATIONS 里，否则后人看到报告里的 21/24 会以为只是没覆盖。
    dimension: 'typography·visual-residual',
    missing: ['`typography/copyable__light__{mobile,tablet,desktop}` 的逐像素一致'],
    reason:
      '24 组里 21 组 0.000% exact；`copyable` 三组是 `block-diff`（差异率 0.3211% / 0.1568% / 0.0836%，散点占比 1.7% —— 差异**成块**而非抗锯齿散点）。diff 图显示红色区域**只落在复制图标**上（`tests/visual/diff/typography/copyable__light__*.png`），文字部分逐像素一致。根因在组件之外：`@apollo-design/icons` 导出了 `getIconStyle(iconPrefixCls)`（D15：只导出、不注入），但**仓库里没有任何地方消费它** —— 于是图标缺基础样式（`.apollo-icon` 没有 `display:inline-flex`、没有 `vertical-align:-0.125em`），SVG 退化成 `display:inline`，字形基线与 antd 差一点点。⚠️ 为什么不在本组件的收口里修：修法是在全局 `BASE_CSS` 里接上 `getIconStyle`，那会改变**所有**渲染图标的组件（`spin` 的 `LoadingOutlined` 等）的像素输出，属于 foundation 层的接线工作，超出本组件的改动面（`packages/ui/src/typography/**` + registry + memory）。缺口已登记在 `packages/ui/src/typography/README.md` §7 与 registry 的 `layerNotes.visual`。',
    unblockWhen:
      '`packages/ui/src/style/index.ts` 的 `BASE_CSS` 接上 `getIconStyle(iconPrefixCls)`（或 `@apollo-design/icons` 提供默认注入路径）后，重跑 `--mode compare`，三组应变 0.000% exact；届时同步复核 `spin` / `empty` 等已入库基线。',
  },
  {
    dimension: 'radio·state',
    missing: ['hover', 'active', 'focus-visible', 'checked 的过渡帧'],
    reason:
      'Radio 是第一个**状态几乎全在 CSS 里**的组件：`-wrapper-checked` / `-checked` / `-disabled` 三个类名落 DOM（L4 已钉），但 `:hover` 的边框色、`input:focus-visible` 的焦点环、圆点 `::after` 的 `scale(0)→opacity:1` 过渡帧都只存在于 CSS 状态里，而 `run.mjs` 只截**静态帧**（渲染完成即截图，无交互步骤）。5 个用例覆盖的是「未交互时的确定形态」：默认 / 选中 / 禁用 / button 三态 / 三档尺寸 / 语义化。⚠️ `defaultChecked` 的形态**已被覆盖**（`basic` 用例第 2 个）—— 它同时是上游「wrapper 类名不含非受控内部态」那条不一致的视觉证据。',
    unblockWhen:
      '给 `run.mjs` 加交互步骤（hover / focus 后再截）后，补 `hover` / `focus-visible` 两个用例；过渡帧永远不进像素比对（时刻不确定，属 flaky 源）。',
  },
  {
    dimension: 'radio·wave',
    missing: ['点击波纹（`Wave` 的 `ant-wave-target` 动画）'],
    reason:
      'Wave 基建未落地（D43，与 button / skeleton / checkbox 同判）。`ant-wave-target` 类名**已逐字保留**（非 button 形态），所以两侧 DOM 一致；缺的只是「点击后出现的波纹元素与动画」—— 它是运行时 DOM 注入，静态帧里本来就不存在。',
    unblockWhen: 'Wave 基建落地后，用交互式截图（click 后再截）补一条。',
  },
  {
    dimension: 'switch·state',
    missing: ['hover', 'active（按压反馈）', 'focus-visible', '切换过渡帧'],
    reason:
      'Switch 的**核心视觉全在状态里**：`:hover:not(-disabled)` 的轨道色、`:active` 时把手 `::before` 拉长 30% 与内容区让位、`:focus-visible` 焦点环、以及 `transition: all 0.2s` 的把手位移过程。`run.mjs` 只截**静态帧**，所以 5 个用例覆盖的是「未交互时的确定形态」（含选中/禁用/loading/size/children）。⚠️ 其中 `basic` 的选中态已经把「把手位移到 `inset-inline-start: calc(100% - (handleSize + trackPadding))`」与「`-inner` 的负 margin 轮换」这两条最容易写错的几何钉住了。',
    unblockWhen:
      '给 `run.mjs` 加交互步骤（hover / mousedown 后再截）后，补 `hover` / `active` 两个用例；过渡帧永远不进像素比对（时刻不确定）。',
  },
  {
    dimension: 'switch·wave',
    missing: ['点击波纹'],
    reason:
      'Wave 基建未落地（与 button / skeleton / checkbox / radio 同判）。⚠️ Switch **本来就没有** `ant-wave-target` 类（antd 的 Wave 在 6.6.4 不往子元素注入该类，实测 SSR 产物确认），所以两侧 DOM 逐字一致，缺的只是运行时注入的波纹元素与动画。',
    unblockWhen: 'Wave 基建落地后，用交互式截图（click 后再截）补一条。',
  },
  {
    dimension: 'switch·dark-compact',
    missing: ['dark / compact 主题下的开关形态'],
    reason:
      '与全局 `theme` 维度同源：`THEMES` 目前只有 light。⚠️ Switch 有一条**只在该维度下才会暴露**的风险：13 个 Component Token 是**构建期算好的解析值**（`22px` / `44px` / `18px` / `#fff` / `rgba(0,35,11,0.2)` …），其中 `handleBg`（= `colorWhite`）与 `handleShadow`（antd 硬编码 `#00230b`）在 dark 主题下 antd 会重新生成、我们不会 ⇒ **dark 主题下这两个值会与 antd 分叉**。已登记为 D50。',
    unblockWhen:
      '整合期把 dark 并入 THEMES 后重生成基线；届时需要决定是否为这两个 token 补 dark 分支（或接受分叉并写入 COMPATIBILITY）。',
  },
  {
    dimension: 'switch·icon-children',
    missing: ['`checkedChildren` / `unCheckedChildren` 放**真图标组件**（`@apollo-design/icons`）'],
    reason:
      '视觉侧的 vue 渲染入口只链接了 `@apollo-design/theme` 与 `@apollo-design/ui` 两个 workspace 包（根 `package.json` 的 devDependencies），**拿不到** `@apollo-design/icons`；而 react 侧经 antd 的依赖可以拿到 `@ant-design/icons`。若只在一侧用真图标，比出来的会是「图标基线差异」而不是「Switch 差异」—— 那是假阳性。所以 `text` 用例改用**两侧逐字相同**的内联结构（`Flex` + `<b>` + 文本）当替身，与 `space·standins` 同思路。图标形态的 children 由 7 个 demo 里的 `text.vue` 与 L1「children 四种形态」覆盖。',
    unblockWhen:
      '把 `@apollo-design/icons` 加进根 `package.json` 的 devDependencies（需重生成 pnpm-lock）后，`text` 用例可以换成真图标。',
  },
  {
    dimension: 'carousel·motion',
    missing: [
      '切换动画中间帧',
      '拖拽过程帧',
      'autoplay 的圆点进度动画帧',
      '拖到边界的橡皮筋阻尼帧',
    ],
    reason:
      'Carousel 的动画全部是**运行时**行为（track 的 transform transition、opacity 交叉淡化、拖拽位移、`--dot-duration` 进度动画），`run.mjs` 只截**静态帧**—— 时刻不确定的帧不进像素比对。4 个用例覆盖的是「初始定位形态」：轨道 % 公式、fade 的透明度分档、箭头 √2 几何、纵向宽高对调。翻页/拖拽的状态机语义由 L1 钉（29 条）。',
    unblockWhen:
      '给 `run.mjs` 加「交互后截帧」能力后补；进度动画帧永远不进像素比对（时刻不确定）。',
  },
];

/** 展开成截图任务列表。 */
export function buildCases({ component, variants } = {}) {
  const names = component ? [component] : Object.keys(COMPONENTS);
  const cases = [];

  for (const name of names) {
    const def = COMPONENTS[name];
    if (!def) throw new Error(`组件 ${name} 未在 matrix.mjs 的 COMPONENTS 中登记`);
    const useVariants = variants ?? def.variants;

    for (const variant of useVariants) {
      if (!def.variants.includes(variant)) {
        throw new Error(
          `组件 ${name} 没有 variant「${variant}」（已登记：${def.variants.join(', ')}）`,
        );
      }
      for (const theme of THEMES) {
        for (const viewport of VIEWPORTS) {
          cases.push({
            component: name,
            variant,
            theme: theme.id,
            antdTheme: theme.antdTheme,
            apolloTokens: theme.apolloTokens,
            viewport: viewport.id,
            width: viewport.width,
            height: viewport.height,
            id: `${name}/${variant}__${theme.id}__${viewport.id}`,
          });
        }
      }
    }
  }
  return cases;
}

/** 渲染页的 URL：`?component=&variant=&theme=` */
export function caseUrl(c) {
  const q = new URLSearchParams({
    component: c.component,
    variant: c.variant,
    theme: c.theme,
  });
  return `/?${q.toString()}`;
}
