import { expectTypeOf, test } from 'vitest';
import { genStyleAssets, type StyleManifest } from '../assets';
import type { ComponentStyleEntry } from '../index';
import { styleSource } from '../source';

test('retains precise JSON and explicit source shapes without an untyped parser boundary', () => {
  const result = genStyleAssets();
  expectTypeOf(result.manifest).toEqualTypeOf<StyleManifest>();
  expectTypeOf(result.manifest.schemaVersion).toEqualTypeOf<1>();
  expectTypeOf(result.manifest.components).not.toBeAny();
  expectTypeOf(result.files).toEqualTypeOf<Record<string, string>>();
  const entry: ComponentStyleEntry = {
    name: 'sample',
    gen: () => '.sample{}',
    source: () => styleSource`.sample{}`,
  };
  genStyleAssets([entry], ['probe']);
  const invalid: ComponentStyleEntry = {
    name: 'sample',
    gen: () => '',
    // @ts-expect-error A style source is an explicit structure/shared definition, not CSS text.
    source: () => '.sample{}',
  };
  void invalid;
});
