/**
 * 命令式实例的销毁队列 —— antd `components/modal/destroyFns.ts` 的 Vue 版（原样 2 行）。
 *
 * `Modal.confirm(...)` 每开一个实例就把自己的 `close` 推入；
 * `Modal.destroyAll()` 就是 `while (destroyFns.length) destroyFns.pop()!()`。
 *
 * ⚠️ **每次 `confirm()` 都要 push**（不是只在「首次创建」时）——
 *    `destroyAll` 会把队列清空，之后新开的实例必须重新入队，否则
 *    「再开一个 + destroyAll」关不掉它。本文件保持模块级单例，与上游一致。
 */
const destroyFns: Array<() => void> = [];

export default destroyFns;
