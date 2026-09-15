import { describe, expect, it } from 'vitest';
import { isDev, isProd, isTest, readImportMetaEnv, resolveDev, resolveTest } from '../env';

/**
 * env.ts 的判定在模块加载时固化成常量，所以这里分两部分测：
 *   1. 纯函数 `resolveDev` / `resolveTest` —— 穷举分支（这是唯一能覆盖全部优先级的方式）
 *   2. 常量本身 —— 只断言当前环境下的可观测结果
 *
 * 生产路径「模块加载时求值一次」由 L7 构建测试验证，不在这里重复。
 */

describe('resolveDev —— 优先级顺序即契约', () => {
  it('viteEnv.DEV 存在时优先，且只看它（不看 PROD / MODE）', () => {
    expect(resolveDev({ DEV: true }, 'production')).toBe(true);
    expect(resolveDev({ DEV: false }, 'development')).toBe(false);
    // 与 PROD 冲突时 DEV 赢 —— 顺序是契约
    expect(resolveDev({ DEV: true, PROD: true }, undefined)).toBe(true);
  });

  it('DEV 不是布尔时退到 PROD，且取反', () => {
    expect(resolveDev({ DEV: undefined, PROD: false }, undefined)).toBe(true);
    expect(resolveDev({ PROD: true }, undefined)).toBe(false);
  });

  it('PROD 也不是布尔时退到 MODE，只有 "production" 算生产', () => {
    expect(resolveDev({ MODE: 'production' }, undefined)).toBe(false);
    expect(resolveDev({ MODE: 'development' }, undefined)).toBe(true);
    expect(resolveDev({ MODE: 'staging' }, undefined)).toBe(true);
  });

  it('MODE 不是字符串时退到 process.env.NODE_ENV', () => {
    expect(resolveDev({ MODE: undefined }, 'production')).toBe(false);
    expect(resolveDev({ MODE: 1 as unknown as string }, 'production')).toBe(false);
    expect(resolveDev({}, 'development')).toBe(true);
  });

  it('完全没有信号时兜底为 dev（宁可多打一条告警）', () => {
    expect(resolveDev(undefined, undefined)).toBe(true);
    expect(resolveDev({}, undefined)).toBe(true);
    // 空字符串 NODE_ENV 视为"没有信号"，而不是"非 production"
    expect(resolveDev(undefined, '')).toBe(true);
  });

  it('★ 裸浏览器场景：viteEnv 与 NODE_ENV 都拿不到 → 按 dev 处理，不抛错', () => {
    expect(() => resolveDev(undefined, undefined)).not.toThrow();
    expect(resolveDev(undefined, undefined)).toBe(true);
  });
});

describe('resolveTest', () => {
  it('viteEnv.MODE === "test" 直接为真', () => {
    expect(resolveTest({ MODE: 'test' }, undefined)).toBe(true);
  });

  it('NODE_ENV === "test" 为真', () => {
    expect(resolveTest(undefined, { NODE_ENV: 'test' })).toBe(true);
  });

  it('VITEST === "true" 为真（Vitest 在某些配置下不改 NODE_ENV）', () => {
    expect(resolveTest(undefined, { VITEST: 'true' })).toBe(true);
  });

  it('VITEST 只认字符串 "true"，不认别的真值', () => {
    expect(resolveTest(undefined, { VITEST: '1' })).toBe(false);
    expect(resolveTest(undefined, { VITEST: 'TRUE' })).toBe(false);
  });

  it('processEnv 整体缺失时为假（不是"兜底为真"——与 resolveDev 的兜底策略相反）', () => {
    expect(resolveTest(undefined, undefined)).toBe(false);
    expect(resolveTest({ MODE: 'development' }, undefined)).toBe(false);
  });

  it('MODE 优先于 processEnv', () => {
    expect(resolveTest({ MODE: 'test' }, { NODE_ENV: 'production' })).toBe(true);
  });
});

describe('readImportMetaEnv', () => {
  it('读取注入对象的 env 字段', () => {
    const fake = { env: { MODE: 'production' } } as unknown as ImportMeta & {
      env: { MODE: string };
    };
    expect(readImportMetaEnv(fake)).toEqual({ MODE: 'production' });
  });

  it('env 为 undefined 时返回 undefined，不抛错', () => {
    expect(readImportMetaEnv({} as ImportMeta)).toBeUndefined();
  });

  it('★ env 是抛错的 getter 时被 catch 吞掉（CJS / 未替换 import.meta 的极端配置）', () => {
    const hostile = {
      get env(): never {
        throw new ReferenceError('import.meta is not defined');
      },
    } as unknown as ImportMeta;
    expect(() => readImportMetaEnv(hostile)).not.toThrow();
    expect(readImportMetaEnv(hostile)).toBeUndefined();
  });

  it('不传参时读取真实的 import.meta.env', () => {
    // Vitest 下一定存在，且 MODE 为 'test'
    expect(readImportMetaEnv()?.MODE).toBe('test');
  });
});

describe('导出的常量（当前测试环境下的可观测结果）', () => {
  it('测试环境既是 dev 也是 test', () => {
    expect(isDev).toBe(true);
    expect(isTest).toBe(true);
  });

  it('isProd 恒为 isDev 的取反', () => {
    expect(isProd).toBe(!isDev);
    expect(isProd).toBe(false);
  });

  it('是布尔而不是 truthy 值（antd 侧有 `!== false` 风格的判断，必须是真布尔）', () => {
    expect(typeof isDev).toBe('boolean');
    expect(typeof isProd).toBe('boolean');
    expect(typeof isTest).toBe('boolean');
  });
});
