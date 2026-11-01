# @apollo-design/ui-resolver

Official build-time component resolver for [unplugin-vue-components](https://github.com/unplugin/unplugin-vue-components). It imports Apollo components from their public JavaScript subpaths. It does not load the UI runtime in Node, register components globally, or select a theme.

## Install and configure

Install `@apollo-design/ui` >=0.1.8 and Vue as application dependencies, and `@apollo-design/ui-resolver`, `unplugin-vue-components` as development dependencies. Use Node >=22.12 and an ESM Vite configuration. This implementation is tested with unplugin-vue-components 32.1.0, Vue 3.5.42, Vite 8.3.0 and TypeScript 5.9.3.

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { ApolloResolver } from '@apollo-design/ui-resolver';

export default defineConfig({
  plugins: [vue(), Components({ resolvers: [ApolloResolver()], dts: 'src/components.d.ts' })],
});
```

```vue
<template>
  <AButton type="primary">Save</AButton>
  <AInputSearch placeholder="Search" />
</template>
```

Include the generated components declaration in the application's TypeScript project. PascalCase and kebab-case template tags are normalized by unplugin-vue-components: `<AButton>` and `<a-button>` both use the same public Button import. Unknown names are left for other resolvers or local components.

## API

`ApolloResolver({ importStyle?: boolean })` returns a component resolver. Automatic structural styles are enabled by default; `ApolloResolver({ importStyle: false })` imports only JavaScript and leaves all CSS loading to the application. There are no theme, runtime registration, arbitrary prefix, fallback or global-CSS options.

Compound components use explicit flat template names, including AInputSearch, AInputPassword, AInputOtp, ASelectOption, ASelectOptGroup, AFormItem, AFormList, ASpaceCompact, ALayoutSider, ASkeletonButton, ATableSummary, ATableSummaryRow and ATableSummaryCell. Typography children accept AText/ATitle/AParagraph/ALink and ATypographyText/ATypographyTitle/ATypographyParagraph/ATypographyLink. AAutoComplete uses Select structure; ATimePicker and ATimeRangePicker use DatePicker structure rather than nonexistent CSS paths. Parent member expressions in JavaScript remain normal explicit component imports.

## Styles and themes

The resolver reads the public `@apollo-design/ui/style-manifest.json` metadata. For each component it imports the manifest's ordered resource list: neutral `base.css`, required shared resources, and component `structure.css` files. Repeated resource paths are deduplicated by the bundler; the resolver has no per-file import state or second dependency graph. This requires the UI 0.1.8 structural style exports. Existing `style.css` entries remain available for manual use.

The resolver never imports a theme preset, theme registry or aggregate UI stylesheet. The application loads its public theme entry first, component structure CSS next, and application overrides last. Turning off automatic styles means the application must import the required component CSS itself. Manual JavaScript imports may coexist with resolved template components. Manual CSS imports can reuse the same public `base.css` and component `structure.css` paths to retain module deduplication.

Legacy component `style.css` files and aggregate UI CSS contain their existing dependency closures. Importing them alongside new structure entries repeats overlapping CSS text. Applications already loading those styles should use `ApolloResolver({ importStyle: false })`; the resolver still handles component JavaScript imports.

Theme-independent import checks and the complete preset/custom-theme acceptance are separate: the latter is integrated with the public theme contract from issue #80. Import success alone does not establish theme correctness.

## Maintenance

The static name table is checked against UI public exports and package CSS paths. Update the table and consumer regression whenever those public contracts change. Do not infer every component path with a kebab-case conversion, resolve service objects as components, import the UI package at resolver runtime, or use whole-library CSS as a fallback.

The repository consumer regression reads already built packages: `node packages/ui-resolver/tests/consumer.mjs [uiPackageRoot] [freshOutputDirectory] [--themes]`. It packs and installs once, then checks Vite, SSR, generated declarations and browser behavior. `--themes` additionally uses that same installation for the three import methods × four preset/custom values × two appearances matrix; it may appear before or after the optional paths. With no flag, the command keeps the focused resolver checks. A prepared installation can also run `node packages/ui-resolver/tests/theme-matrix.mjs <installedConsumerDirectory> [freshOutputDirectory]` without packing or installing again. These scripts build consumer applications, never package distribution files.
