/** Ordered global fallback sources for context-free Modal static services. */
import { type MaybeRefOrGetter, onBeforeMount, onScopeDispose, toValue, watch } from 'vue';
import enUS from './locales/en_US';
import type { ModalLocale } from './types';

const defaultModalLocale = enUS.Modal as ModalLocale;

let runtimeLocale: ModalLocale = { ...defaultModalLocale };
const localeList: { locale: ModalLocale | undefined }[] = [];

function generateLocale(): ModalLocale {
  const merged = { ...defaultModalLocale };
  for (const entry of localeList) Object.assign(merged, entry.locale);
  return merged;
}

function registerConfirmLocale(locale?: ModalLocale) {
  const entry = { locale: locale ? { ...locale } : undefined };
  localeList.push(entry);
  runtimeLocale = generateLocale();

  return {
    update(current: ModalLocale | undefined): void {
      entry.locale = current ? { ...current } : undefined;
      runtimeLocale = generateLocale();
    },
    dispose(): void {
      const index = localeList.indexOf(entry);
      // A full reset has already released this source. Its old cleanup must
      // leave subsequently registered sources untouched.
      if (index < 0) return;
      localeList.splice(index, 1);
      runtimeLocale = generateLocale();
    },
  };
}

/**
 * Bind a provider's Modal source during setup. Client mount order determines
 * priority; replacement, deep edits and withdrawal retain that order. An absent
 * source contributes no fields. SSR never registers request-local data.
 */
export function useConfirmLocale(source: MaybeRefOrGetter<ModalLocale | undefined>): void {
  let registration: ReturnType<typeof registerConfirmLocale> | undefined;
  onScopeDispose(() => registration?.dispose());
  onBeforeMount(() => {
    const current = registerConfirmLocale();
    registration = current;
    watch(() => toValue(source), current.update, { immediate: true, deep: true });
  });
}

/**
 * 注册一份 Modal locale。
 *
 * @param newLocale `undefined` 时清空全部来源并重置为英文默认值。
 * @returns 反注册函数；`newLocale` 为空时返回 `undefined`
 */
export function changeConfirmLocale(newLocale?: ModalLocale): (() => void) | undefined {
  if (newLocale) {
    return registerConfirmLocale(newLocale).dispose;
  }

  resetConfirmLocale();
  return undefined;
}

/** 取当前生效的 Modal locale（`Modal.confirm` 用它）。 */
export function getConfirmLocale(): ModalLocale {
  return runtimeLocale;
}

/** 测试辅助：清空全部静态服务来源。生产代码不应调用。 */
export function resetConfirmLocale(): void {
  localeList.length = 0;
  runtimeLocale = { ...defaultModalLocale };
}
