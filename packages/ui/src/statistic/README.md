# Statistic当前契约

Statistic、StatisticTimer、StatisticCountdown使用Vue原生槽、事件、当前Provider和静态CSS变量。公共契约见[中文API](index.zh-CN.md)/[English API](index.en-US.md)。

数值内容使用#value的{value,text}；Timer增加{duration,type}，不暴露/克隆内部VNode。Timer仅挂载后启动，SSR首帧为'-'，目标/方向变化重启，format变化只更新文本，无效目标不计时，卸载清理。

两组件字号Token消费当前源主题；root/header/title/content/value/prefix/suffix语义落点、三种原生style写法及完整槽由三个组件共享。保留已有效的valueStyle和Countdown历史别名，不新增兼容内容函数。

本轮状态与修前/修后/未验边界见[完整清单](../../../../docs/audit/2026-10-27-statistic-contract-audit.md)，破坏性内容/计时修正见[集中迁移](../../../../docs/migrations/statistic-contracts.md)。历史上游对照仍保留为参考，不定义当前Vue行为。
