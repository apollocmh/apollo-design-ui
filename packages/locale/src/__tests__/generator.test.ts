/**
 * 生成器自身的测试。
 *
 * 覆盖两件事：
 *   1. **幂等** —— 产物与源一致（`--check` 返回 0）
 *   2. **能发现漂移** —— 有人手改了产物时 `--check` 会失败
 *
 * ⚠️ 这两条都需要 **antd 的 es 目录**在场（`/tmp/antd-src/package/es` 或
 *    `packages/locale/node_modules/antd/es`）。不在场时**整块跳过** ——
 *    跳过是显式的（`describe.skipIf`），不会假装通过。见契约文档 §9 第 2 条。
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../../../..');
const SCRIPT = path.join(ROOT, 'registry/tools/gen-locale.mjs');
const RC_DIR = path.join(ROOT, 'registry/source/locale-rc');
const OUT_DIR = path.join(ROOT, 'packages/locale/src/locales');

function findAntdEs(): string | undefined {
  return [path.join(ROOT, 'packages/locale/node_modules/antd/es'), '/tmp/antd-src/package/es'].find(
    (dir) => fs.existsSync(path.join(dir, 'locale')),
  );
}

const antdEs = findAntdEs();

/**
 * ⚠️ 生成器要跑几秒（建临时树 + 求值 73 个模块 + 序列化），
 *    远超 vitest 默认的 5s 超时 ⇒ 调用它的用例都要显式给 timeout。
 */
const GEN_TIMEOUT = 120_000;

function runGen(extraArgs: string[] = []): { status: number | null; output: string } {
  const result = spawnSync(process.execPath, [SCRIPT, ...extraArgs], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, VITE_CONFIG_NATIVE_IGNORE_WARNING: 'true' },
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

function readProvenance(): {
  packages: Record<string, { name: string; version: string; files: Record<string, string> }>;
} {
  return JSON.parse(fs.readFileSync(path.join(RC_DIR, 'provenance.json'), 'utf8'));
}

describe('gen-locale.mjs · 固化副本', () => {
  it('provenance 记录了锁定版本', () => {
    expect(fs.existsSync(RC_DIR)).toBe(true);
    const provenance = readProvenance();
    expect(provenance.packages.pagination?.name).toBe('@rc-component/pagination');
    expect(provenance.packages.picker?.name).toBe('@rc-component/picker');
    // 版本是锁定的 —— 改版本等于换数据源
    expect(provenance.packages.pagination?.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(provenance.packages.picker?.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('⭐ 每个文件都记了 sha256', () => {
    const provenance = readProvenance();
    for (const key of ['pagination', 'picker']) {
      const files = provenance.packages[key]?.files ?? {};
      expect(Object.keys(files).length).toBeGreaterThan(50);
      for (const hash of Object.values(files)) {
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
      }
    }
  });

  it('⭐ 固化的文件确实存在（provenance 不是空账）', () => {
    const provenance = readProvenance();
    for (const key of ['pagination', 'picker']) {
      for (const name of Object.keys(provenance.packages[key]?.files ?? {})) {
        expect(fs.existsSync(path.join(RC_DIR, key, name))).toBe(true);
      }
    }
  });

  it('⭐ sha256 与文件内容真的对得上（抽查 5 个）', () => {
    const provenance = readProvenance();
    const entries = Object.entries(provenance.packages.picker?.files ?? {}).slice(0, 5);
    expect(entries).toHaveLength(5);
    for (const [name, hash] of entries) {
      const text = fs.readFileSync(path.join(RC_DIR, 'picker', name), 'utf8');
      expect(createHash('sha256').update(text).digest('hex')).toBe(hash);
    }
  });
});

describe.skipIf(!antdEs)('gen-locale.mjs · 与 antd 源对账', () => {
  it('⭐ 幂等：产物与源一致（--check 返回 0）', { timeout: GEN_TIMEOUT }, () => {
    const { status, output } = runGen(['--check']);
    expect(output).toContain('与源一致');
    expect(status).toBe(0);
  });

  it('⭐ 能发现漂移：改坏一个产物后 --check 失败', { timeout: GEN_TIMEOUT }, () => {
    const target = path.join(OUT_DIR, 'zh_CN.ts');
    const original = fs.readFileSync(target, 'utf8');
    try {
      fs.writeFileSync(target, `${original}\n// 手改一行\n`);
      const { status, output } = runGen(['--check']);
      expect(status).toBe(1);
      expect(output).toContain('与源不一致');
    } finally {
      fs.writeFileSync(target, original);
    }
  });

  it('⭐ 产物数量：73 个语言包 + index.ts', { timeout: GEN_TIMEOUT }, () => {
    const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.ts'));
    expect(files).toHaveLength(74);
  });
});
