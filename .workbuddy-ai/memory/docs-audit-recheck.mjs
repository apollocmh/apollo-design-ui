/**
 * docs 接入前的审计复核扫描（vue-native-audit skill 的机械化清单再跑一遍）。
 *
 * 覆盖 skill 固化的 5 类缺陷模式：
 *   S1 根别名 props 残留（interface.ts / 运行时 props 声明 className|rootClassName|style）
 *   S2 消费者残留（h(C,{className:…} / 模板 :class-name= / :root-class-name=）
 *   S3 addEventListener / removeEventListener 失衡（监听器泄漏 lead）
 *   S4 cssinjs 开发态占位 keyframes（animation-name 引用 css-dev-only-do-not-override-*）
 *   S5 props.style 残留读取（root-alias 迁移后不应再有）
 *
 * 输出的是 lead 不是 finding —— 每条命中都要读上下文定性。
 * 已知合法保留（audit registry 已裁决）：Dropdown.rootClassName（popup 目标）、
 * Carousel.className/style（内层 slick-slider 目标）、XxxConfig.className/style（Provider 配置）。
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'packages/ui/src';

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (['__tests__', 'demo', 'node_modules', 'dist'].includes(e.name)) continue;
      walk(p, out);
      continue;
    }
    if (/\.(ts|tsx|vue)$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = walk(SRC);
const hits = { S1: [], S2: [], S3: [], S4: [], S5: [] };

for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const lines = s.split('\n');

  lines.forEach((l, i) => {
    // S1: 根别名 props 声明（interface.ts 与运行时 props 对象；排除注释与 Provider Config 文件）
    if (/^\s*(className|rootClassName|style)\s*[?:]/.test(l) && !/^\s*(\/\/|\*|\/\*)/.test(l)) {
      const isConfig = /Config\.ts$|config-provider|_internal/.test(f);
      hits.S1.push(`${f}:${i + 1}${isConfig ? ' [config]' : ''} ${l.trim().slice(0, 90)}`);
    }
    // S2: 消费者残留
    if (/className:\s|rootClassName:\s/.test(l) && !/^\s*(\/\/|\*|\/\*)/.test(l)) {
      hits.S2.push(`${f}:${i + 1} ${l.trim().slice(0, 90)}`);
    }
    if (/:class-name=|:root-class-name=/.test(l)) {
      hits.S2.push(`${f}:${i + 1} ${l.trim().slice(0, 90)}`);
    }
    // S5: props.style 残留
    if (/props\.style\b/.test(l) && !/^\s*(\/\/|\*|\/\*)/.test(l)) {
      hits.S5.push(`${f}:${i + 1} ${l.trim().slice(0, 90)}`);
    }
    // S4: 占位 keyframes
    if (/css-dev-only-do-not-override/.test(l)) {
      hits.S4.push(`${f}:${i + 1} ${l.trim().slice(0, 90)}`);
    }
  });

  // S3: 监听器失衡（文件级计数，命中才读上下文）
  const add = (s.match(/\.addEventListener\(/g) || []).length;
  const rem = (s.match(/\.removeEventListener\(/g) || []).length;
  if (add > rem) hits.S3.push(`${f} ADD=${add} REMOVE=${rem}`);
}

for (const k of Object.keys(hits)) {
  console.log(`\n== ${k} (${hits[k].length})`);
  for (const h of hits[k]) console.log('  ' + h);
}
console.log(`\nscanned ${files.length} files`);
