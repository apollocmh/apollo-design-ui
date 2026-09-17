import { describe, expect, it } from 'vitest';
import { CacheMap, createCacheMap } from '../index';

describe('CacheMap（utils/CacheMap.js）', () => {
  it('set / get 基本读写', () => {
    const map = new CacheMap<number>();
    map.set('a', 10);
    expect(map.get('a')).toBe(10);
    expect(map.get('b')).toBeUndefined();
  });

  it('数字键与字符串键命中同一条（JS 属性语义）', () => {
    const map = new CacheMap<number>();
    map.set(1, 10);
    expect(map.get('1')).toBe(10);
  });

  it('⭐ id 每次 set 都自增 —— 外部拿它当「缓存代次」', () => {
    const map = new CacheMap<number>();
    expect(map.id).toBe(0);
    map.set('a', 1);
    expect(map.id).toBe(1);
    map.set('a', 2);
    expect(map.id).toBe(2);
    // get 不自增
    map.get('a');
    expect(map.id).toBe(2);
  });

  it('⭐ maps 无原型 —— 危险键不会命中原型链', () => {
    const map = createCacheMap();
    expect(map.get('constructor')).toBeUndefined();
    expect(map.get('toString')).toBeUndefined();
    expect(map.get('__proto__')).toBeUndefined();
    expect(Object.getPrototypeOf(map.maps)).toBeNull();
  });

  it('⚠️ 对照：普通对象确实会命中（说明上面那条不是白测的）', () => {
    const plain: Record<string, unknown> = {};
    expect(plain.constructor).toBeTypeOf('function');
    expect(plain.toString).toBeTypeOf('function');
  });

  it('⭐ diffRecords 记的是「上一次的值」', () => {
    const map = new CacheMap<number>();
    map.set('a', 10);
    expect(map.getRecord().get('a')).toBeUndefined(); // 首次 ⇒ 上一次不存在

    map.set('a', 20);
    expect(map.getRecord().get('a')).toBe(10);

    map.set('a', 30);
    expect(map.getRecord().get('a')).toBe(20);
  });

  it('resetRecord 清空记录但不影响 maps', () => {
    const map = new CacheMap<number>();
    map.set('a', 10);
    map.set('a', 20);
    expect(map.getRecord().size).toBe(1);
    map.resetRecord();
    expect(map.getRecord().size).toBe(0);
    expect(map.get('a')).toBe(20);
  });

  it('⭐ 上一次的值是 undefined 与「从没设过」无法区分 —— 上游的补偿逻辑依赖这一点', () => {
    const map = new CacheMap<number>();
    map.set('a', 10);
    map.set('a', 20);
    // 第 1 次 set 之前没有值 ⇒ undefined ⇒ 上游据此判断「首次测量」
    expect(map.getRecord().get('a')).toBe(10);
  });
});
