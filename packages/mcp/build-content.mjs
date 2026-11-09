import fs from 'node:fs';
import { buildAiContent } from '../docs/tooling/content/build-manifest.mjs';

const { bundle } = buildAiContent();
const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
if (pkg.version !== bundle.version) throw new Error('MCP and UI versions must match');
fs.writeFileSync(new URL('./dist/content.json', import.meta.url), JSON.stringify(bundle));
fs.chmodSync(new URL('./dist/cli.mjs', import.meta.url), 0o755);
