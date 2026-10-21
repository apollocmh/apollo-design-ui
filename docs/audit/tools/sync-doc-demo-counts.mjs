/** 同步组件 index 文档里的 demo 数量（阶段 2 收口）。可重复执行。 */
import fs from 'node:fs';
import path from 'node:path';

const root = 'packages/ui/src';
let changed = 0;
for (const comp of fs.readdirSync(root)) {
  const demoDir = path.join(root, comp, 'demo');
  if (!fs.existsSync(demoDir)) continue;
  const count = fs.readdirSync(demoDir).filter((f) => f.endsWith('.vue')).length;
  for (const lang of ['zh-CN', 'en-US']) {
    const file = path.join(root, comp, 'index.' + lang + '.md');
    if (!fs.existsSync(file)) continue;
    let text = fs.readFileSync(file, 'utf8');
    const before = text;
    if (lang === 'zh-CN') {
      text = text.replace(
        /(见 \[`demo\/`\]\(\.\/demo\)（)([^）]*)(）)/,
        (match, open, body, close) => open + body.replace(/\d+/, String(count)) + close,
      );
      text = text.replace(
        /(见 \[`demo\/`\]\(\.\/demo\)\()([^)]*)(\))/,
        (match, open, body, close) => open + body.replace(/\d+/, String(count)) + close,
      );
    } else {
      text = text.replace(
        /(See \[`demo\/`\]\(\.\/demo\) \()([^)]*)(\))/,
        (match, open, body, close) => open + body.replace(/\d+/, String(count)) + close,
      );
      text = text.replace(
        /(See \[`demo\/`\]\(\.\/demo\)（)([^）]*)(）)/,
        (match, open, body, close) => open + body.replace(/\d+/, String(count)) + close,
      );
    }
    if (text !== before) {
      fs.writeFileSync(file, text);
      changed += 1;
      console.log(file, '→', count);
    }
  }
}
console.log('updated files', changed);
