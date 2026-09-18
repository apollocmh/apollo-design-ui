/**
 * `validateFields` 的 promise 汇总（批次 ③a）。
 *
 * 契约来源：`@rc-component/form@1.8.6/es/utils/asyncUtil.js`（25 行）。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.7.5。
 *
 * ⭐ 这是批次 ③ 里**唯一能做 oracle 对拍**的函数（纯函数、不 import react）——
 * 见 `__tests__/batch3a.test.ts` 的 oracle 段。
 *
 * ── 两条必须照抄的语义 ──────────────────────────────────────────────────────
 *
 * 1. **永不 reject 单个错误**：每个 promise 都先 `.catch(e => { hasError = true; return e })`
 *    —— 错误被**吞进结果数组**，最后统一 `reject(results)`。所以调用方拿到的
 *    rejection 值是「全部结果」而不是「第一个错误」。
 * 2. **顺序稳定**：`results[index] = result` 按**入参顺序**写位（不是完成顺序）。
 *
 * ⚠️ 上游在 `if (hasError) reject(results);` 之后**没有 return**，紧接着
 * `resolve(results)`。因为 promise 一旦 settle 就不可变，那句 `resolve` 是**空操作**。
 * 这里保留原样（并在测试里钉住「最终是 rejected」），以免后人以为漏了 return 而去"修"。
 */

/**
 * 等所有 promise 结束（无论成功失败）。
 *
 * @returns 全部结果按**入参顺序**排列；任一失败 ⇒ 整体 rejected（值仍是全部结果）。
 */
export function allPromiseFinish(promiseList: Promise<unknown>[]): Promise<unknown[]> {
  let hasError = false;
  let count = promiseList.length;
  const results: unknown[] = [];

  if (!promiseList.length) {
    return Promise.resolve([]);
  }

  return new Promise((resolve, reject) => {
    promiseList.forEach((promise, index) => {
      promise
        .catch((e) => {
          hasError = true;
          return e;
        })
        .then((result) => {
          count -= 1;
          results[index] = result;
          if (count > 0) {
            return;
          }
          if (hasError) {
            reject(results);
          }
          resolve(results);
        });
    });
  });
}
