# Theme 基础包契约修正

2026-10-29，范围与验收见 [Theme 基础包审计](../audit/2026-10-29-theme-foundation-contract-audit.md)。本记录只描述 Theme 自身；ConfigProvider 可写上下文及完整提供链另组验收。

- `getDesignToken({ algorithm: [] })` 现在使用默认算法，返回完整 Alias，而不是缺字段及含 NaN 的对象。非空算法数组保留顺序、调用次数和前一 Map 传递。
- `token` 及直接 `formatToken` 的 `override` 中，显式 `undefined` 等同省略。旧上游对照曾锁定 undefined 输出，但与 Apollo 的必填 AliasToken 返回类型冲突；现在保留派生值。`0`、`false`、有意义的空串仍有效，不改成真值过滤。原历史 Oracle 保留；Seed/Alias/扩展键、暗色紧凑组合和输入不变均有替代覆盖。
- 已知 Seed/Map/Alias 覆盖遵守实际字段类型。例如 `colorPrimaryBg` 接受 string，`fontHeight` 接受 number；不能借扩展索引签名传入 false 或任意字符串。未知扩展仍接受 string/number/boolean，所有可选键仍可省略或传 undefined。不新增全域运行时 schema 校验。
- 移除无实际消费的 `ThemeConfig.prefixCls`。旧注释承诺改 DOM 前缀，链路实际上仅搬运字段，既没有改变 DOM 类名，也没有改变变量名。本开发版直接修正该无效接口：DOM 前缀使用已有的 `ConfigProvider` 顶层 `prefixCls`，变量名称使用 `theme.cssVarPrefix`；自定义前缀需对应静态 CSS。没有新增前缀策略或无效兼容分支。
- `createThemeContext().config` 保持可写 Ref，整值与通过 `.value` 的深层 Token/组件覆盖更新都会使计算 Token 重算。ThemeProvider 的配置拷贝与 props 隔离，运行修改不反向变异输入；之后整值或深层 prop 更新恢复 prop 权威。Ref 容器整体重绑、修改计算结果、直接改导出默认对象不属于承诺的主题更新路径，不借本轮冻结对象或收窄旧 Ref 类型。
- 无 Provider 的默认 context 从跨 app 可写单例改为同一 Vue app 共享、不同 app 隔离。SSR 每次请求创建独立 app；复用同一 app 仍共享。确需跨 app 联动时显式 provide 同一个 `createThemeContext()` 结果。显式空 ThemeProvider 和无 `sourceActive` 元数据的旧自定义 context 继续视为显式来源。
- ThemeProvider 保持 renderless、默认内容槽，无新增 wrapper、业务事件、模型或 expose。类型明确 default 槽接受完整 VNodeChild，不再假装接受不消费的具名槽。DOM attrs/listeners 放业务元素，不隐式转发到多根内容或变量 target。
- `injectCssVar` 只在 mounted 后写 DOM，支持反复启停、target 与当前有效配置的 cssVarPrefix 切换，卸载释放当前 scope。SSR 只派生和提供数据；若需要服务端自定义主题首帧，使用已有 `getCSSVarDeclarations` 把变量放入服务端页面/目标样式，不能依赖 renderless Provider 在服务端修改 HTMLElement。
- CSS scope 按元素与变量持有所有权，最近 apply 的活跃 scope 可见；释放后恢复另一活跃 scope，最后恢复原 inline 值和 priority，不删除其它 scope 的变量。外部写入不同值或 priority 后清理保留外部值；完全相同的普通 CSSOM 写入无法区分。`applyCSSVar` / `injectTokenCssVar` 继续一次性加法写入，明确交出所有权，即使等值也保留，不注册无法释放的永久 owner。
- CSS 规则表只按 own key 查找；constructor、toString、__proto__ 等扩展键不再被原型属性误当作 preserve/ignore/unitless，refs 也安全保留这些 own 键。变量命名与静态 CSS 保持一致。

本轮不增加全 CSS 颜色表达式解析或新的非法数值归一化。颜色使用现有 utils.Color 支持的具体色值；预设色空串会报解析错误，colorLink 空串有既定回退。常规正字号和小数字号是支持域；零、极小、负字号及非有限输入仍可能产生无效数值，不为这些值承诺有效排版。允许零的其它尺寸不受影响。

主线程同批发布声明复核补齐原生DOM引用：`ref<HTMLDivElement | null>(null)` 直接绑定ThemeProvider.target原被类型拒绝，实际运行时早已通过`target ?? document.documentElement`接受空值。已保存实际发布SFC的TS2322红灯，声明补为HTMLElement/null/省略；不新增运行时目标能力。补source正负例、真实null目标切换/文档根恢复与SSR检查，完整回执由主线程整合。

同组原生作用域复核同时对齐SVGElement目标：CSS变量原语和Provider沿用已有DOM style操作，仅补精确目标类型。原生SVG引用、实际fill绘制、目标撤回与业务节点身份有独立覆盖；不加入新的CSS运行时。

CSS变量转换/静态声明与scope/一次性写入接受`Partial<AliasToken>`，使原本已有效的部分变量操作具有准确声明；已知字段类型保持精确。scope.apply缺失字段仅释放自己的旧写入，一次性apply保持加法语义，原有所有权与原生覆盖规则不分叉。
