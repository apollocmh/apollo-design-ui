# Menu 原生操作的键盘与点击链路

当前窄范围：Breadcrumb 真实红灯牵出的 MenuItem 原生操作，不替代 Menu 整组件的完整审计。先核对 `MenuInfo`/Item 数据与监听器、MenuItem 的 li/标题区/原生内容、disabled、Menu 的选择/开合回调及 useAccessibility 的聚焦/子级入口。

| 链路 | 分类与验收 |
| --- | --- |
| li 获得焦点 → Enter → 其中的 href/按钮 | 必修：原实现只发业务回调，未激活所属原生操作；恰有一个操作时使用它自己的 click，保留 href/target/取消与原生处理器 |
| 已聚焦的 a/button → Enter/Space | 必修：浏览器负责原生激活，不能在 keydown 先手调一次业务回调、随后 click 再双发 |
| 普通菜单项 Enter/Space | 原 Enter 回归保留；菜单项 Space 激活且不滚动，单次业务事件 |
| 取消 / disabled / 原生 disabled 按钮 | 必修：已取消的键盘事件不激活；disabled 菜单项拦截原生点击默认行为，不能仅跳过业务回调却仍导航 |
| 原生输入与可编辑内容的按键 | 必修：不把业务输入的 Enter/方向键解释成菜单选择或导航 |
| 子控件聚焦 → 当前项 / 子级打开 | 必验：所属项保持 active；叶项 Enter 不能伪造子菜单 openKeys；已有子菜单方向/Esc继续回归 |
| 多个原生操作 | 不猜主操作；容器保留菜单选择，具体目标由用户直接聚焦；不自动点击任意第一个控件 |
| 反复操作、多实例、卸载 | 必验：每次只走一条点击链；待执行焦点帧随作用域销毁清理 |
| 类型、emits/v-model、样式/Provider | 不新增公开API或兼容层，保留 MenuInfo/Event 与模型；不更改样式/主题策略，不把窄修声明为全 Menu 验收 |

基线 `1b361487` 的 Breadcrumb 浏览器14项13通过/1失败，真实失败保留。补成组单元红灯后集中修复，再跑Menu与Dropdown/Breadcrumb/Tabs等实际消费者及原键位矩阵；浏览器验证真实导航、取消、disabled与单次操作。Demo与双语说明同步，发布产物与其他三个单元在冻结提交上统一验收。

## 源码阶段结果

15条原生成组复现修前1通过/14失败，修后18条（含额外编辑域/卸载覆盖）与相关39文件576条四层全部通过；Chrome11项实际导航/按钮/取消/disabled/单次选择/滚动与焦点通过，零页面错误。仅disabled附加捕获守卫，避免启用项的空捕获监听器在Vue假时钟中吞掉后续冒泡；原Dropdown受控拒绝关闭断言保留。原14个Demo保留，新增真实native-actions成对Demo，两个清单计数同步15。

Breadcrumb实际导航也已修复；另纠正测试将.html#误写成/#的glob，换完整精确URL，不删除导航/关闭断言。其源码14/14和原Demo60/60通过。最终发布包/L7/Docs与整库门禁继续待统一验证。详见menu-native-actions.json。
