/**
 * URL 校验用的正则（惰性构造的单例）。
 *
 * 契约来源：`@rc-component/async-validator@6.0.0/es/rule/url.js`（49 行），
 * 其自身移植自 `kevva/url-regex`。
 *
 * ⚠️⚠️ **这个文件是逐字移植的，不要"简化"或"重写"**。
 * 它是一段动态拼接的正则（IPv4/IPv6/域名/TLD/端口/路径各有子模式），
 * 任何一处改动都会让「哪些 URL 通过」的边界发生不可预测的漂移。
 * 契约 §9 第 4 条明确记录了「未逐字核对」的风险 —— 本轮已逐字对照。
 */

let urlReg: RegExp | undefined;

/**
 * 返回 URL 正则（模块级缓存）。
 *
 * ⭐ 上游把它做成「首次调用时才构造」—— 因为构造过程有 20+ 次字符串拼接，
 * 每次 `validate` 都重建是纯浪费。
 */
export default function getUrlRegex(): RegExp {
  if (urlReg) {
    return urlReg;
  }

  const v4 =
    '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}';

  const v6seg = '[a-fA-F\\d]{1,4}';
  const v6List = [
    `(?:${v6seg}:){7}(?:${v6seg}|:)`,
    `(?:${v6seg}:){6}(?:${v4}|:${v6seg}|:)`,
    `(?:${v6seg}:){5}(?::${v4}|(?::${v6seg}){1,2}|:)`,
    `(?:${v6seg}:){4}(?:(?::${v6seg}){0,1}:${v4}|(?::${v6seg}){1,3}|:)`,
    `(?:${v6seg}:){3}(?:(?::${v6seg}){0,2}:${v4}|(?::${v6seg}){1,4}|:)`,
    `(?:${v6seg}:){2}(?:(?::${v6seg}){0,3}:${v4}|(?::${v6seg}){1,5}|:)`,
    `(?:${v6seg}:){1}(?:(?::${v6seg}){0,4}:${v4}|(?::${v6seg}){1,6}|:)`,
    `(?::(?:(?::${v6seg}){0,5}:${v4}|(?::${v6seg}){1,7}|:))`,
  ];
  const v6Eth0 = '(?:%[0-9a-zA-Z]{1,})?';

  const v6 = `(?:${v6List.join('|')})${v6Eth0}`;

  const protocol = '(?:(?:[a-z]+:)?//)';
  const auth = '(?:\\S+(?::\\S*)?@)?';

  // ⭐⭐ 这里对上游做了一处**收紧**（H8），理由如下。
  //
  // 上游的写法是：
  //   const b = o => o && o.includeBoundaries ? '(?:(?<=\\s|^)...)' : ''
  //   const ip = o => o && o.exact ? v46Exact : new RegExp(`(?:${b(o)}${v4}${b(o)})|...`, 'g')
  //   ip.v4 = o => o && o.exact ? v4exact : new RegExp(`${b(o)}${v4}${b(o)}`, 'g')
  //   const ipv4 = ip.v4().source          // ← 无参调用
  //   const ipv6 = ip.v6().source
  //
  // 而 `b(undefined)` 恒为 `''`、`undefined?.exact` 恒为 falsy ⇒ **无参调用下**：
  //   ip.v4().source === new RegExp(v4, 'g').source === v4
  //   ip.v6().source === v6
  //
  // 也就是说 `b` / `ip` / `v46Exact` / `v4exact` / `v6exact` 这几层间接
  // **在唯一的使用路径上恒等且不可达**（覆盖率口径下是纯负债：分支 50%）。
  // 直接取 `v4` / `v6` 与上游产物**逐位一致**，同时去掉四个死分支。
  const ipv4 = v4;
  const ipv6 = v6;
  const host = '(?:(?:[a-z\\u00a1-\\uffff0-9][-_]*)*[a-z\\u00a1-\\uffff0-9]+)';
  const domain = '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*';
  const tld = '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))';
  const port = '(?::\\d{2,5})?';
  const path = '(?:[/?#][^\\s"]*)?';
  const regex = `(?:${protocol}|www\\.)${auth}(?:localhost|${ipv4}|${ipv6}|${host}${domain}${tld})${port}${path}`;

  urlReg = new RegExp(`(?:^${regex}$)`, 'i');
  return urlReg;
}
