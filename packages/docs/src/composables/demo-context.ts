/** The same-origin frame boundary carries selections, never executable theme objects. */
import type { SiteLocale } from './locale';
import { isSitePreset, isThemeMode, type SitePreset, type ThemeMode } from './theme';
export interface DemoContextMessage {
  type: 'apollo-demo:context';
  frameId: string;
  preset: SitePreset;
  mode: ThemeMode;
  lang: SiteLocale;
}
export function isDemoEnvelope(value: unknown): value is { type: string; frameId: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof value.type === 'string' &&
    'frameId' in value &&
    typeof value.frameId === 'string'
  );
}
export function isDemoContextMessage(value: unknown): value is DemoContextMessage {
  return (
    isDemoEnvelope(value) &&
    value.type === 'apollo-demo:context' &&
    'preset' in value &&
    isSitePreset(value.preset) &&
    'mode' in value &&
    isThemeMode(value.mode) &&
    'lang' in value &&
    (value.lang === 'zh-CN' || value.lang === 'en-US')
  );
}
