import { describe, expect, it } from 'vitest';
import toList, { capitalize } from '../to-list';

describe('toList', () => {
  it('单值包装成单元素数组', () => {
    expect(toList(1)).toEqual([1]);
    expect(toList('a')).toEqual(['a']);
    expect(toList(null)).toEqual([null]);
    expect(toList(undefined)).toEqual([undefined]);
  });

  it('数组原样返回（不复制）', () => {
    const arr = [1, 2, 3];
    expect(toList(arr)).toBe(arr);
  });

  it('skipEmpty 只跳过 null / undefined', () => {
    expect(toList(null, { skipEmpty: true })).toEqual([]);
    expect(toList(undefined, { skipEmpty: true })).toEqual([]);
  });

  it('skipEmpty 不跳过其它 falsy 值 —— 这是 antd 的既定行为', () => {
    expect(toList(0, { skipEmpty: true })).toEqual([0]);
    expect(toList('', { skipEmpty: true })).toEqual(['']);
    expect(toList(false, { skipEmpty: true })).toEqual([false]);
  });

  it('空数组保持空数组', () => {
    expect(toList([], { skipEmpty: true })).toEqual([]);
  });
});

describe('capitalize', () => {
  it('只大写首字符', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('helloWorld')).toBe('HelloWorld');
    expect(capitalize('HELLO')).toBe('HELLO');
  });

  it('空字符串保持空', () => {
    expect(capitalize('')).toBe('');
  });

  it('非字符串原样返回，不做 String() 转换', () => {
    expect(capitalize(123)).toBe(123);
    expect(capitalize(null)).toBe(null);
    expect(capitalize(undefined)).toBe(undefined);
    const obj = {};
    expect(capitalize(obj)).toBe(obj);
  });
});
