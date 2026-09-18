# `form-core` 契约文档

> G1/G2 分析产物。**先于实现存在**（`AGENTS.md` §2：步骤 3 的产物必须先于步骤 5）。
> 事实来源优先级：用户指令 > 仓库规范文件 > `registry/*.json` > antd 固定版本产物/源码 > 官方文档 > 模型先验。

---

## 1. 这个包解决什么

`registry/dependencies.json` 的 purpose 原文：

> 表单状态机 + 字段校验：字段注册/注销、依赖联动、异步校验、
> validateFields/setFieldsValue/getFieldsValue、rules 语义（含内置校验器）

`replaces`：

- `@rc-component/form`（antd 6.6.4 声明 `~1.8.6`）
- `@rc-component/async-validator`（`@rc-component/form@1.8.6` 声明 `^6.0.0`）

### ⚠️ 规模：**约 3600 行上游**，一轮做不完

| 上游 | 行数 | 性质 |
|---|---|---|
| `@rc-component/form` 的 `es/` | **2562** | 状态机 + 响应式（React） |
| `@rc-component/async-validator` 的 `es/` | **1078** | 纯逻辑校验引擎 |

对比：`overlay` 的上游（trigger 生命周期）约 600 行，本包是它的 **6 倍**。
且 `@rc-component/form` 的核心是 **React 的 `useState`/`useRef` + forceUpdate 驱动的 store**，
Vue 侧要用响应式重写 —— 这是全包最大风险，不能靠机械翻译（H3）。

因此本契约**覆盖全包**，但实现按 §3 的批次推进；**每批可独立收口**。

---

## 2. 事实来源

| 来源 | 版本 / 路径 | 取用范围 |
|---|---|---|
| `@rc-component/form` | **1.8.6** | `es/Form.js`(138)、`es/Field.js`(603)、`es/List.js`(143)、`es/hooks/useForm.js`(918)、`es/hooks/useWatch.js`(83)、`es/hooks/useNotifyWatch.js`(47)、`es/utils/{valueUtil,validateUtil,messages,NameMap,asyncUtil,delayUtil,typeUtil}.js`、`es/{FieldContext,FormContext,ListContext}.js` |
| `@rc-component/async-validator` | **6.0.0** | `es/index.js`(273)、`es/util.js`(221)、`es/messages.js`(55)、`es/rule/*.js`(7 个)、`es/validator/*.js`(17 个) |
| antd | 6.6.4 | `es/form/*`（`Form.Item` 的布局/错误展示属 **ui**，本包只提供 `validateMessages` 的默认值来源） |

⚠️ 本轮这两个 rc 包是**新下载**的。`/tmp` 不是持久存储，下次会话可能已丢失：

```bash
ls /tmp/rc-src/form/package/es/useForm.js || {
  mkdir -p /tmp/rc-src && cd /tmp/rc-src
  npm pack @rc-component/form@1.8.6 && mkdir -p form && tar -xzf rc-component-form-1.8.6.tgz -C form
  npm pack @rc-component/async-validator@6.0.0 && mkdir -p validator && tar -xzf rc-component-async-validator-6.0.0.tgz -C validator
}
```

---

## 3. ⭐ 分批策略（本契约的核心决策）

上游本身就是**两个包、三层职责**，我们按同一接缝切：

| 批次 | 内容 | 上游对应 | 规模 | 风险 | 状态 |
|---|---|---|---|---|---|
| **①校验引擎** | `Schema` + `format`/`isEmptyValue`/`deepMerge`/`complementError`/`asyncMap` + 7 个 rule + 17 个 validator + messages 模板 | async-validator 全部（1078 行） | 中 | **低**（纯逻辑，可穷举） | ✅ 已落地 |
| **②取值工具** | `getNamePath`/`getValue`/`setValue`/`cloneByNamePathList`/`containsNamePath`/`matchNamePath`/`NameMap` + `validateMessages` 默认模板 | rc-form `utils/valueUtil.js`(114) + `utils/NameMap.js`(75) + `utils/messages.js`(48) | 小 | **低**（纯函数） | ✅ 已落地 |
| **③状态机** | `FormStore` + `useForm` + `Field` 注册/校验/依赖联动 + `useWatch` + 三个 Context | rc-form `hooks/useForm.js`(918) + `Field.js`(603) + `Form.js`(138) + `List.js`(143) | **大** | **高**（React→Vue 响应式重写） | 见下（再切 ③a/③b/③c） |

**批次 ③ 的子批次**（每一批独立收口、独立登记 —— 上游 1802 行不可能一轮做完）：

| 子批次 | 内容 | 上游对应 | 状态 |
|---|---|---|---|
| **③a 状态机内核** | 类型契约 + 三个 Context + `WatcherCenter` + `allPromiseFinish` + `delayFrame` + `FormStore` + `useForm` + `useWatch` | `hooks/useForm.js`(918) + `useNotifyWatch.js`(47) + `useWatch.js`(83) + `utils/asyncUtil.js`(25) + `utils/delayUtil.js`(11) + 三个 Context | ✅ **已收口**（2026-09-18，`--verify` 实测 451 用例 / 0 失败；覆盖率 97.38·92.46·97.22；变异 8·8 抓到） |
| **③b 字段编排** | `validateRule`/`validateRules` + `Field`（注册/注销、`getControlled`、`shouldUpdate`/`dependencies`、`validateDebounce`/`validateFirst`） | `utils/validateUtil.js`(226) + `Field.js`(603) | ⬜ **未开工** |
| **③c 表单容器** | `Form`（provider + `nativeElement` + submit/reset）+ `FormProvider` + `List`（增删移 + key 管理） | `Form.js`(138) + `FormContext.js`(64) + `List.js`(143) | ⬜ **未开工** |

⚠️ **订正（2026-09-18）**：本表初稿把三个子批次**全部**标成「✅ 本轮」—— 那是**开工前的计划**，
被误写成了状态。实际只完成 ③a；③b/③c **一行代码都没有**。
契约 §4.7.7 / §4.7.8 / §4.7.11 因此仍是**未被任何代码验证的文档**（见 §9 第 8 条）。

**③a 实际落地的文件**（`packages/form-core/src/`）：
`name-path-type.ts`（`DeepNamePath` 逐字移植）、`form-types.ts`（全部类型契约）、
`form-context.ts`（`HOOK_MARK` + 三个 `InjectionKey` + 两个默认 Context）、
`watcher-center.ts`、`async-util.ts`、`delay-frame.ts`、`form-util.ts`、
`form-store.ts`、`use-form.ts`、`use-watch.ts`、`index.ts`（barrel 更新）。

**为什么按这个顺序**：

1. **纯逻辑优先** —— 批次①②没有 DOM、没有响应式，可以用穷举强度测试，是"能立刻封死"的部分；
2. **批次③是唯一真正困难的部分** —— `FormStore` 用 React 的 `forceUpdate` 驱动，Vue 必须换成
   `reactive`/`shallowRef` + 显式依赖追踪。**在没有真实 Form 组件消费之前**，
   它的 API 形状无法被验证（与 `position.measureAlign`、`overlay.useOverlay` 同类风险）；
3. **上游分层就是这么切的** —— 照搬接缝比自创接缝更不容易出错。

> ✅ 批次①② 均已落地（2026-09-18）。**批次③ 是唯一剩下的、也是唯一有风险的。**

✅ **`packages/ui/src/form/` 骨架已落地**（2026-09-18，`Form.vue` / `FormItem.vue` / `interface.ts`）。
它消费的正是本节 §6.4 的类型面 —— 骨架能通过 `vue-tsc`，就是「批次③ 的 API 形状可被消费」的
第一条证据（`registry/foundation.json` 的 `doneWhen` 要求的正是这一步）。

⚠️ 骨架**只定形状、不含实现**（内部是 TODO），因此**不得**在 `registry/components.json`
里把 `form` 标成任何维度的 `done`。它的作用是让 §6.4 的 API 从「纸面」变成「被编译器检查过的契约」。

---

## 4. antd 的契约（逐条）

### 4.1 校验引擎 · `Schema` 主类（`async-validator/es/index.js`）

#### 4.1.1 静态成员（`index.js:14-22`）

```js
static register = (type, validator) => {
  if (typeof validator !== 'function') throw new Error('Cannot register a validator by type, validator is not a function');
  validators[type] = validator;
};
static warning = warning;         // util.js 的 warning
static messages = defaultMessages;
static validators = validators;
```

#### 4.1.2 `define(rules)`（`index.js:30-42`）

- `!rules` → 抛 `Cannot configure a schema with no rules`
- 非对象或数组 → 抛 `Rules must be an object`
- ⭐ 每条规则**归一化成数组**：`this.rules[name] = Array.isArray(item) ? item : [item]`

#### 4.1.3 `messages(messages?)`（`index.js:43-48`）

- 传参时 `this._messages = deepMerge(newMessages(), messages)`；不传则返回当前值
- ⭐ `newMessages()` 每次返回**全新对象**（含 `clone()` 方法）—— 避免跨实例污染

#### 4.1.4 `validate(source, options?, callback?)`（`index.js:52-249`）

签名重载：`validate(source, callback)` 时 `options` 被当作 callback。

**早退**（`index.js:60-65`）：`!this.rules || Object.keys(this.rules).length === 0`
→ `callback(null, source)` 且 `return Promise.resolve(source)`。

**messages 解析**（`index.js:86-95`）：

```js
if (options.messages) {
  let messages = this.messages();
  if (messages === defaultMessages) messages = newMessages();   // ⭐ 防止改到模块级默认值
  deepMerge(messages, options.messages);
  options.messages = messages;
} else {
  options.messages = this.messages();
}
```

⭐ 这里有个易漏点：`this._messages` 初始值就是 `defaultMessages`（模块级单例），
若直接 `deepMerge(messages, options.messages)` 会**污染全局默认值**。
`=== defaultMessages` 那一行就是防线。

**构建 series**（`index.js:96-140`）：

```js
const series = {};
const keys = options.keys || Object.keys(this.rules);
keys.forEach(z => {
  const arr = this.rules[z];
  let value = source[z];
  arr.forEach(r => {
    let rule = r;
    if (typeof rule.transform === 'function') {
      if (source === source_) source = { ...source };   // ⭐ 首次 transform 时浅拷贝，不污染入参
      value = source[z] = rule.transform(value);
      if (value !== undefined && value !== null) {
        rule.type = rule.type || (Array.isArray(value) ? 'array' : typeof value);
      }
    }
    if (typeof rule === 'function') rule = { validator: rule };
    else rule = { ...rule };                            // ⭐ 复制，不改调用方的规则对象
    rule.validator = this.getValidationMethod(rule);
    if (!rule.validator) return;                        // ⭐ 没有可用的校验方法 ⇒ 跳过该规则
    rule.field = z;
    rule.fullField = rule.fullField || z;
    rule.type = this.getType(rule);
    series[z] = series[z] || [];
    series[z].push({ rule, value, source, field: z });
  });
});
```

四条容易读错的：

1. ⭐ `transform` 会**写回 source**（`source[z] = ...`），且首次触发时把 source 换成浅拷贝 ——
   所以「传进来的对象不会被改」这个保证**只在有 transform 时成立**；
2. ⭐ 规则对象被**复制**后再加 `field`/`fullField`/`type`/`validator`，调用方的原对象不受影响；
3. ⭐ `getValidationMethod` 返回 `undefined` 时该条规则**被静默跳过**（不报错）；
4. `rule.type` 在 transform 之后会被推断（`array` 或 `typeof`）。

**执行**（`index.js:142-248`）：`asyncMap(series, options, (data, doIt) => {...}, results => complete(results), source)`

每条规则的执行体（`index.js:143-245`）：

```js
const rule = data.rule;
let deep = (rule.type === 'object' || rule.type === 'array')
        && (typeof rule.fields === 'object' || typeof rule.defaultField === 'object');
deep = deep && (rule.required || (!rule.required && data.value));
rule.field = data.field;
```

`deep` 的含义：**这是「嵌套对象/数组」的规则**（有 `fields` 或 `defaultField`），
且「必填」或「值存在」。只有 `deep` 时才递归下去。

`cb(e)` 的错误处理（`index.js:154-216`）：

- 非数组包成数组；
- `!options.suppressWarning && errorList.length` → `Schema.warning('async-validator:', errorList)`；
- ⭐ `rule.message !== undefined && !== null` ⇒ **整个错误列表被替换成 `[rule.message]`**
  （即自定义 message 覆盖所有校验器产出的消息）；
- `filledErrors = errorList.map(complementError(rule, source))`；
- `options.first && filledErrors.length` ⇒ 记 `errorFields[rule.field] = 1` 并**立即 doIt**（短路）；
- `!deep` ⇒ 直接 `doIt(filledErrors)`；
- `deep` ⇒ 递归：`required && !value` 时用 `rule.message` 或 `options.error(rule, format(messages.required, rule.field))`；
  否则用 `defaultField`（对 value 的每个 key）与 `rule.fields` 合成子 schema，
  每个子规则的 `fullField` 变成 `${rule.fullField}.${key}`、`fullFields` 变成 `[...(rule.fullFields||[]), key]`。

⭐ `addFullField`（`index.js:147-153`）是嵌套字段**错误定位**的关键：

```js
{ ...schema, fullField: `${rule.fullField}.${key}`, fullFields: rule.fullFields ? [...rule.fullFields, key] : [key] }
```

**调用校验器**（`index.js:217-245`）：

```js
if (rule.asyncValidator) res = rule.asyncValidator(rule, data.value, cb, data.source, options);
else if (rule.validator) {
  try { res = rule.validator(rule, data.value, cb, data.source, options); }
  catch (error) {
    console.error?.(error);
    if (!options.suppressValidatorError) setTimeout(() => { throw error; }, 0);   // ⭐ 异步重抛
    cb(error.message);
  }
  if (res === true) cb();
  else if (res === false) cb(typeof rule.message === 'function' ? rule.message(rule.fullField || rule.field) : rule.message || `${rule.fullField || rule.field} fails`);
  else if (res instanceof Array) cb(res);
  else if (res instanceof Error) cb(res.message);
}
if (res && res.then) res.then(() => cb(), e => cb(e));    // ⭐ thenable 也支持
```

⭐ 五条返回值语义：`true` → 通过；`false` → 用 message 或 `"${field} fails"`；
`Array` → 当作错误列表；`Error` → 取其 `message`；`thenable` → 异步。

**`complete(results)`**（`index.js:66-85`）：

- 展平（`Array.isArray(e)` 时 `errors = errors.concat(...e)`，**不是 push**）；
- 无错误 ⇒ `callback(null, source)`；
- 有错误 ⇒ `callback(errors, convertFieldsError(errors))`。

#### 4.1.5 `getType(rule)`（`index.js:250-258`）

```js
if (rule.type === undefined && rule.pattern instanceof RegExp) rule.type = 'pattern';
if (typeof rule.validator !== 'function' && rule.type && !validators.hasOwnProperty(rule.type))
  throw new Error(format('Unknown rule type %s', rule.type));
return rule.type || 'string';
```

⭐ 默认类型是 **`string`**（不是 `any`）。

#### 4.1.6 `getValidationMethod(rule)`（`index.js:259-272`）

```js
if (typeof rule.validator === 'function') return rule.validator;
const keys = Object.keys(rule);
const messageIndex = keys.indexOf('message');
if (messageIndex !== -1) keys.splice(messageIndex, 1);
if (keys.length === 1 && keys[0] === 'required') return validators.required;   // ⭐ 只有 required 一个键
return validators[this.getType(rule)] || undefined;
```

⭐ 「只有 `required` 一个键（`message` 不算）」⇒ 用 `validators.required`（不做类型检查）。

### 4.2 校验引擎 · `util.js`

| 函数 | 行号 | 契约要点 |
|---|---|---|
| `format(template, ...args)` | 26-60 | `%s`/`%d`/`%j`/`%%`；`template` 是函数时直接 `apply`；参数不够时**原样保留占位符**（`return x`）；`%j` 循环引用 ⇒ `'[Circular]'` |
| `isEmptyValue(value, type)` | 64-75 | `undefined`/`null` ⇒ true；`type==='array'` 且空数组 ⇒ true；⭐ **6 种 native string 类型**（`string`/`url`/`hex`/`email`/`date`/`pattern`/`tel`）且空串 ⇒ true |
| `isEmptyObject(obj)` | 76-78 | `Object.keys(obj).length === 0` |
| `convertFieldsError(errors)` | 16-25 | 空 ⇒ `null`；按 `error.field` 分组 |
| `complementError(rule, source)` | 185-204 | 返回**闭包**；`fullFields` 时用 `getValue(source, fullFields)` 取 `fieldValue`；已是错误对象则补 `field`/`fieldValue` 并原样返回 |
| `deepMerge(target, source)` | 205-222 | ⭐ 只对**两层**做合并（`typeof value === 'object' && typeof target[s] === 'object'` ⇒ 浅展开），**不是递归深合并** |
| `AsyncValidationError` | 119-127 | `Error` 子类，带 `errors` 与 `fields` 两个字段，`message` 固定 `'Async Validation Error'` |
| `asyncMap(objArr, option, func, callback, source)` | 128-171 | 见下 |

`asyncMap` 的两种策略：

```js
if (option.first) {
  // ⭐ 串行：asyncSerialArray（顺序执行，遇错立即停）
  //    reject 用 new AsyncValidationError(errors, convertFieldsError(errors))
} else {
  const firstFields = option.firstFields === true ? Object.keys(objArr) : option.firstFields || [];
  // ⭐ 对 objArr 的每个 key：若在 firstFields 里 ⇒ 串行；否则 ⇒ 并行
  //    全部完成后 callback(results)，有错则 reject AsyncValidationError
}
pending.catch(e => e);   // ⭐ 吞掉 unhandled rejection（调用方仍能拿到 rejected promise）
```

⭐ 两个细节：`asyncSerialArray` 里 `index` 与 `original` 的写法保证了「先自增再判断」；
`!objArrKeys.length` 时**同步** `callback(results)` 并 `resolve(source)`。

### 4.3 校验引擎 · `messages.js`（55 行）

`newMessages()` 返回的模板（**这是 `validateMessages` 的最终来源**）：

```
default:      'Validation error on field %s'
required:     '%s is required'
enum:         '%s must be one of %s'
whitespace:   '%s cannot be empty'
date.format:  '%s date %s is invalid for format %s'
date.parse:   '%s date could not be parsed, %s is invalid '
date.invalid: '%s date %s is invalid'
types.{string,method,array,object,number,date,boolean,integer,float,regexp,email,tel,url,hex}
string.{len,min,max,range}
number.{len,min,max,range}
array.{len,min,max,range}
pattern.mismatch: '%s value %s does not match pattern %s'
```

⭐ `types.array` / `types.object` / `types.integer` 用的是 **`'%s is not an %s'`**（`an` 不是 `a`），
`types.method` 额外带 `(function)` 后缀 —— 这些是**逐字**的，别"顺手"改成更通顺的英文。

⭐ `clone()` 用 `JSON.parse(JSON.stringify(this))` 再挂回 `clone` —— 所以 messages 里**不能放函数**。

### 4.4 校验引擎 · 7 个 rule（`rule/`）

| rule | 签名 | 契约要点 |
|---|---|---|
| `required` | `(rule, value, source, errors, options, type?)` | ⭐ `!source.hasOwnProperty(rule.field) \|\| isEmptyValue(value, type \|\| rule.type)` —— **键不存在也算空** |
| `whitespace` | `(rule, value, source, errors, options)` | `/^\s+$/.test(value) \|\| value === ''`（空串也报） |
| `type` | `(rule, value, source, errors, options)` | `required && value === undefined` ⇒ 转交 `required` 并 **return**；12 个 custom 类型走 `types[]`，否则 `typeof value !== rule.type` |
| `range` | `(rule, value, source, errors, options)` | 只支持 `number`/`string`/`array`，**其他类型直接 `return false`**（静默）；字符串用 `spRegexp` 把补充平面字符算作 1（`'𠮷𠮷𠮷'.length === 3`）；`len` 优先，然后 `min && !max`、`max && !min`、`min && max` |
| `enum` | `(rule, value, source, errors, options)` | ⭐ **会写回 `rule.enum`**（非数组时置为 `[]`）；`indexOf(value) === -1` ⇒ 报错，值列表 `join(', ')` |
| `pattern` | `(rule, value, source, errors, options)` | ⭐ RegExp 时**先重置 `pattern.lastIndex = 0`**（防 `g` 标志导致状态化）；字符串则 `new RegExp` |
| `url` | 默认导出**一个 RegExp 单例**（惰性构造） | 移植自 `kevva/url-regex`；`(?:^...$)` + `i` 标志 |

### 4.5 校验引擎 · 17 个 validator（`validator/`，共 287 行）

统一模式：

```js
const x = (rule, value, callback, source, options) => {
  const errors = [];
  const validate = rule.required || (!rule.required && source.hasOwnProperty(rule.field));
  if (validate) {
    if (isEmptyValue(value, <type>) && !rule.required) return callback();   // ⭐ 非必填且为空 ⇒ 直接通过
    rules.required(rule, value, source, errors, options, <type>);
    if (!isEmptyValue(value, <type>)) { /* 组合 rules.type / range / pattern / whitespace / enum */ }
  }
  callback(errors);
};
```

⭐ 三个必须照抄的点：

1. **`validate` 的双条件**：必填 ⇒ 一定校验；非必填 ⇒ 只有 `source` 上**存在该键**才校验
   （不存在就整个跳过，连 required 都不跑）；
2. **`isEmptyValue` 的 type 参数**决定「空串算不算空」（只有 6 种 native string 类型算）；
3. `number` validator 有**额外一行**：`if (value === '') value = undefined;`（空串归一成 undefined）。

`validator/index.js` 的注册表（17 项）：`string` `method` `number` `boolean` `regexp` `integer`
`float` `array` `object` `enum` `pattern` `date` `url` `hex` `email` `tel` `required` `any`。
⭐ `url`/`hex`/`email`/`tel` **共用 `type` validator**（它们的差异全在 `rule/type.js` 的 `types[]` 里）。

⚠️ 剩余 11 个 validator（`any`/`array`/`boolean`/`date`/`float`/`integer`/`method`/`object`/`pattern`/`regexp`/`type`）
的逐行细节**待实现时逐个读**，本契约只钉住上面的统一模式。**不在此处凭模式推断它们的差异。**

### 4.6 取值工具（批次 ②，`rc-form/es/utils/`）

来源：`valueUtil.js`(114) + `NameMap.js`(75) + `messages.js`(48) + `typeUtil.js`(8)
+ `validateUtil.js:13-21` 的 `replaceMessage`。

#### 4.6.1 ⚠️⚠️ `toArray` 同名不同义 —— 不要复用 `utils` 的那个

| | `@apollo-design/utils` 的 `toArray` | 本包 namePath 版的 `toArray` |
|---|---|---|
| 用途 | 展平 **Vue children** | 归一 **namePath** |
| 返回 | `VNode[]`（拆 Fragment、包 Text vnode） | `(string \| number)[]` |
| `null` | 跳过（或补 Comment 占位） | ⇒ `[]` |

**必须自己实现**。这是"看名字复用"最容易踩的坑。

#### 4.6.2 `getValue` / `setValue` **可以**复用

上游 `valueUtil.js:1` 就是 `import { get, set } from '@rc-component/util'` ——
而 `utils` 的 `object.ts` 正是那套的移植。**同一个来源，直接复用**（R6 已声明依赖）。

#### 4.6.3 `valueUtil` 的其余函数

| 函数 | 契约要点 |
|---|---|
| `getNamePath(path)` | `undefined`/`null` ⇒ `[]`；⭐ **数组入参原样返回（不拷贝）** |
| `cloneByNamePathList(store, list)` | 逐个 get 再 set ⇒ **中间层级会被创建** |
| `containsNamePath(list, path, partial?)` | ⭐⭐ **返回值是三态 `boolean \| null \| undefined`** —— 见下 |
| `matchNamePath(namePath, subNamePath, partial?)` | 非 partial 时长度必须相等；⭐ 参数顺序是「父, 子」 |
| `isSimilar(source, target)` | 浅比较但**跳过函数**（两个函数永远相等 —— 避免回调引用变化导致重渲染） |
| `defaultGetValueFromEvent(prop, ...args)` | 判据是 `prop in event.target`（不是 `!== undefined`）；⚠️ `...args` 只用了 `args[0]` |
| `move(array, from, to)` | 纯函数；⭐ 越界与相等时返回**原数组引用**（不是副本） |

⭐⭐ **`containsNamePath` 的三态返回是 Oracle 抓出来的**：

```js
// 上游
return namePathList && namePathList.some(...);
//      ↑ 短路时返回 namePathList 本身（null / undefined），不是 false
```

我原本写成 `!!namePathList && ...`，`containsNamePath(null, ['a'])` 得 `false`，
上游得 `null`。**两者都是 falsy，手写断言几乎不可能注意到** —— 这是 oracle 的典型价值。

##### ⚠️ 批次③ 开工时对批次② 的两处**声明订正**（2026-09-18）

批次② 收口时 `value-util.ts` 里 `NamePath` 是 `string | number | InternalNamePath`。
批次③ 要把它接到**深推导**的 `NamePath<T> = DeepNamePath<T>`（上游 `interface.d.ts` 的那份），
暴露了两个问题 —— 两处都只改**声明**，运行时行为一个字节没动：

1. **`getNamePath` / `toArray` 的形参收得太紧**：`DeepNamePath<Values>` 在**开放泛型**下
   TS 无法证明它属于那个简单联合（`DeepNamePath` 是条件类型，对未实例化的 `Values` 不透明）
   ⇒ `useWatch` 里 `getNamePath(dependencies)` 编译不过。
   **处置**：`value-util.ts` 的 `NamePath<T = never>` 改为
   `string | number | InternalNamePath | DeepNamePath<T>`。
   ⭐ 默认值取 **`never`**（`DeepNamePath<never>` 化简为 `never`）⇒ **不给泛型时与原来完全一致**，
   批次② 已收口的那两个函数**没有被放宽**；调用方显式写 `getNamePath<Values>(deepPath)` 即可。
2. **`| null` 漏了**：运行时一直把 `null` 当空路径（`value-util.ts:38`），
   上游签名也是 `getNamePath(path: NamePath | null)`，但我们声明的形参没有 `null`
   ⇒ 批次② 的测试里被迫写 `toNamePathArray(null as never)`。
   **处置**：补上 `| null`，并把那条测试里的 `as never` 去掉（**收紧**测试，不是放宽）。

⭐ 附带一处**公开面**的订正：`index.ts` 现在从 `form-types.ts` 导出 `NamePath`（深推导），
`InternalNamePath` 仍从 `value-util.ts` 导出。
依据：上游 `es/index.d.ts` 就是 `export type { … NamePath … } from './interface'`，
而 `es/interface.d.ts` 里正是 `NamePath<T = any> = DeepNamePath<T>`；
`es/utils/valueUtil.d.ts` 反而是 `import type { NamePath } from '../interface'`。
批次② 一度把**简单联合**当成公开 `NamePath`，与上游不符 —— 现已纠正。
⚠️ 简单联合没有消失：它仍是 `value-util.ts` 内部对那两个函数的**刻意收紧**，只是不再是公开 API。

#### 4.6.4 `NameMap` —— 用字符串键代替数组键

`Map` 用引用相等比较键，而 `['a','b'] !== ['a','b']`（每次调用都是新数组）⇒
必须先编码成字符串：

```
['a', 1]  ⇒  'string:a__@field_split__number:1'
```

⭐ 三个要点：

1. **每个单元带 `typeof` 前缀** ⇒ `['a', 1]` 与 `['a', '1']` **不撞键**；
2. `getAsPrefix` 的前缀判定**必须带 SPLIT**（`itemKey.startsWith(normalizedKey + SPLIT)`）——
   否则 `['a']` 会错误匹配 `['ab']`（`'string:a'` 是 `'string:ab'` 的前缀）；
3. `update(key, updater)` 用 **`if (!next)`** 判删除 ⇒ 返回 `0` / `''` / `undefined`
   都会**删掉该项**（不是"写假值"）。

⚠️ 编码是**有损**的（键字面含 `__@field_split__` 会撞）—— 上游接受，我们不"修"。

⚠️ 上游 `.d.ts` 把 `update` 的 updater 返回声明成 `V | null`，**比运行时窄**
（运行时判 `!next`）。测试里用断言保留 `undefined` 的用例。

#### 4.6.5 ⚠️⚠️ `defaultValidateMessages` 是**第二套**模板

| | `validate-messages.ts`（antd / rc-form 层） | `messages.ts`（async-validator 层） |
|---|---|---|
| 占位符 | `${name}` / `${type}` / `${min}` … | `%s` / `%d` / `%j` |
| 引号 | **自带**（`"'${name}' is required"`） | 无 |
| 谁替换 | **我们**（`replaceMessage`） | async-validator 的 `format()` |
| 来源 | 用户经 ConfigProvider 覆盖 | Schema 内部 |

**两套的桥是 `replaceMessage`**：`Schema` 先用 `%s` 填出带占位符的字符串，
再由 `replaceMessage` 把 `${name}` 换成实际值。

⚠️ 所以「用户覆盖 validateMessages」这条路**必须经过 `replaceMessage`** ——
直接把 `defaultValidateMessages` 交给 `Schema.messages()` 是错的（`Schema` 只认 `%s`）。

`replaceMessage(template, kv)` 的两条语义（`validateUtil.js:13-21`）：

- `${name}` ⇒ 取 `kv.name`；**`kv` 里没有的键 ⇒ 字符串 `'undefined'`**（上游行为，不抛错）；
- ⭐ `\${name}`（带反斜杠）⇒ **去掉反斜杠、原样输出** `${name}`（不替换）；
- ⚠️ 占位符名必须是 `\w+` ⇒ `${a-b}` / `${a.b}` **不被匹配**。

#### 4.6.6 归属裁决：`validateRule` / `validateRules` 属**批次③**

`validateUtil.js` 的其余部分（`validateRule` 单条校验、`validateRules` 编排、
`validateFirst` 的串行/并行、`warningOnly` 排序）是 **Field 的校验编排**，
依赖 store 的 options 与 Field 生命周期 ⇒ 归批次③。

⚠️ 且它 `import * as React from 'react'`（用 `React.isValidElement` / `cloneElement`
给错误消息加 key）—— Vue 侧没有对应物，**必须重写**（登记为差异，见 §6.3）。

### 4.7 状态机（批次 ③，`rc-form/es/`）

⚠️ **本节是批次 ③ 开工前逐行读源码产出的契约**（2026-09-18）。
⚠️ **本批次没有 Oracle**（判据见 §7.0.1）—— 以下每一条都来自读上游源码，期望值写在测试里。

#### 4.7.1 `FormStore` 的字段与生命周期（`hooks/useForm.js:9-23`）

| 字段 | 初值 | 语义 |
|---|---|---|
| `formHooked` | `false` | 是否被真实 `Form` 通过 `getInternalHooks` 挂钩 |
| `subscribable` | `true` | ⭐ `true` ⇒ 逐个通知 field；`false` ⇒ 只调 `forceRootUpdate()`（渲染 props 模式） |
| `store` | `{}` | ⭐⭐ **普通对象，不是响应式容器** —— 见 §6.4.1 |
| `fieldEntities` | `[]` | 已注册的字段实体（Field 实例） |
| `initialValues` | `{}` | 表单级初值 |
| `callbacks` | `{}` | `{ onValuesChange, onFieldsChange, onFinish, onFinishFailed }` |
| `validateMessages` | `null` | 用户覆盖的模板（与 `defaultValidateMessages` 合并后交给 `validateRules`） |
| `preserve` | `null` | 表单级 `preserve` |
| `lastValidatePromise` | `null` | ⭐ 用于判定 `outOfDate`（两次并发 `validateFields` 时，旧的作废） |
| `watcherCenter` | `new WatcherCenter(this)` | `useWatch` 的批量通知中心 |
| `prevWithoutPreserves` | `null` | 卸载时记录「`preserve === false` 的字段」，供下次挂载回填初值 |
| `timeoutId` | `null` | 「未挂钩」告警的去重句柄 |

`getForm()`（`:24-42`）每次调用**返回新对象**（方法引用相同），带 `_init: true`
（`isFormInstance` 的判据就是 `!!form._init`）与 `getInternalHooks`。

`getInternalHooks(key)`（`:45-65`）：`key === HOOK_MARK` ⇒ `formHooked = true` 并返回 hooks；
否则 `warning(false, '...')` 并返回 **`null`**（不是抛错）。

⭐ `warningUnhooked()`（`:137-146`）：**dev + 有 `window`** 时才 `setTimeout(fn)`（**不传延迟** ⇒ 默认 0），
回调里 `timeoutId = null` 再判 `!formHooked`。⚠️ 它在 `getFieldsValue` / `getFieldValue` /
`getFieldsError` / `isFieldsTouched` / `isFieldsValidating` / `resetFields` / `setFields` /
`setFieldsValue` / `validateFields` / `submit` 的**第一行**都被调用 —— 即「几乎所有公开读 API 都会触发它」。

#### 4.7.2 `getFieldsValue` 的四种入参（`:208-253`）⭐ 易错

```js
if (nameList === true || Array.isArray(nameList)) { mergedNameList = nameList; mergedFilterFunc = filterFunc; }
else if (nameList && typeof nameList === 'object') { mergedFilterFunc = nameList.filter; }
if (mergedNameList === true && !mergedFilterFunc) return this.store;   // ⭐ 返回引用，不拷贝
```

1. `getFieldsValue()` ⇒ 只含**已注册字段**的值（`cloneByNamePathList` 拼出来的新对象）；
2. `getFieldsValue(true)` ⇒ **直接返回 `this.store` 引用**（含未注册字段）；⚠️ 加了 `filter` 就不走这条短路；
3. `getFieldsValue(['a','b'])` ⇒ 指定路径；
4. `getFieldsValue({ filter })` ⇒ `filter(meta)`，`meta` 取 `'getMeta' in entity ? entity.getMeta() : null`
   （⚠️ 用 `in` 而不是取方法，所以 `INVALIDATE_NAME_PATH` 的假实体拿到 `null`）。

⭐ 两个细节：`isList()` 的实体**不进** `filteredNameList`（父字段已覆盖），而是记进 `listNamePaths`，
最后 `if (!getValue(mergedValues, namePath)) mergedValues = setValue(mergedValues, namePath, [])`
—— 即 **`Form.List` 为空时补 `[]`**。

#### 4.7.3 三个「不直观」的 API 语义

| API | 契约 | 行号 |
|---|---|---|
| `getFieldsValue(true)` | 返回 `store` **引用**（调用方改它会影响表单） | `:220-222` |
| `setFields(fields)` | `prevStore` 在**循环外**只取一次 ⇒ 同一批多个字段变更时，每个 `notifyObservers` 拿到的 `prevStore` 都是**批前**的 store | `:459-479` |
| `registerField` 的注销函数 | `setValue(prevStore, namePath, defaultValue, **true**)` —— 第三个参数是 `override`（`utils.set` 的语义） | `:548` |

#### 4.7.4 `isFieldsTouched` 与 `isFieldsValidating` 的**不对称**（`:289-358`）

- `isFieldsTouched` 用 `getFieldEntities(true)`（**只含有 name 的字段**）；
- `isFieldsValidating` 用 `getFieldEntities()`（**全部字段**，含 `name === undefined` 的）。

参数形态（`isFieldsTouched` 是**变参**）：

```
0 个        ⇒ namePathList = null, isAll = false
1 个数组    ⇒ namePathList = arg0.map(getNamePath), isAll = false
1 个非数组  ⇒ namePathList = null, isAll = arg0     // 只传 allFieldsTouched
2 个        ⇒ namePathList = arg0.map(getNamePath), isAll = arg1
```

`!namePathList` 时：`isAll ? every(e => isFieldTouched(e) || e.isList()) : some(isFieldTouched)`。
⭐ `isList()` 的字段在 `every` 模式下**视为已 touched**（`|| e.isList()`）。
有 `namePathList` 时按**前缀匹配**（`shortNamePath.every((u, i) => fieldNamePath[i] === u)`）聚到 NameMap，
再 `isAll ? every(list => list.some(touched)) : some(...)`。

#### 4.7.5 `validateFields` 的完整编排（`:741-873`）⭐⭐ 最复杂

**入参重载**：`Array.isArray(arg1) || typeof arg1 === 'string' || typeof arg2 === 'string'`
⇒ `(nameList, options)`；否则 `(options)`。

⚠️⚠️ **`validateFields('a')` 会同步抛 `TypeError` —— 上游的真实缺陷，我们照抄。**
判据里明明有 `typeof arg1 === 'string'`，但紧接着（`:749`）就是
`nameList.map(getNamePath)`，而字符串没有 `.map`。

> 第一版契约把它写成「所以 `validateFields('a')` 是合法的（单字段字符串）」——
> **读源码读漏了下一行**。2026-09-18 被 `batch3a.test.ts` 的红灯纠正，
> 现在由一条 `expect(...).toThrow(TypeError)` + 类型层负例共同钉住。

**收集阶段**（`getFieldEntities(true)` 遍历）：

1. `!provideNameList` 时：`if (!field.isList() || !namePathList.some(name => matchNamePath(name, fieldNamePath, true)))`
   ⇒ `finalValueNamePathList.push(fieldNamePath)`；然后 `namePathList.push(fieldNamePath)`。
   ⭐ `finalValueNamePathList` 与 `namePathList` 的差别：**前者不含 `Form.List` 的路径**（List 的值由子字段拼出）；
2. `!field.props.rules?.length` ⇒ **跳过**（不产生 promise，但已被 1 加进 namePathList）；
3. `dirty && !field.isFieldDirty()` ⇒ 跳过；
4. `validateNamePathList.add(fieldNamePath.join(TMP_SPLIT))`，`TMP_SPLIT = String(Date.now())`
   （⚠️ 用时间戳当分隔符 —— 用于后续算 `triggerNamePathList`）；
5. 只有 `!provideNameList || containsNamePath(namePathList, fieldNamePath, recursive)` 才**真的校验**；
6. `field.validateRules({ validateMessages: { ...defaultValidateMessages, ...this.validateMessages }, ...options })`，
   包成 `promise.then(通过) .catch(按 warningOnly 拆 errors/warnings；mergedErrors 非空 ⇒ reject)`。

**汇总**（`allPromiseFinish`）⇒ `lastValidatePromise = summaryPromise`：

- `summaryPromise.catch(r=>r).then(results => { notifyObservers(store, resultNamePathList, {type:'validateFinish'}); triggerOnFieldsChange(resultNamePathList, results); })`
- `returnPromise`：
  - 成功且 `lastValidatePromise === summaryPromise` ⇒ `resolve(getFieldsValue(finalValueNamePathList))`；
  - 成功但**已被更新的校验取代** ⇒ 先 `return Promise.reject([])`，⚠️⚠️ **但这个 rejection
    会立刻被紧随其后的 `.catch` 接住**，所以调用方最终拿到的是
    `{ message: undefined, values: getFieldsValue(namePathList), errorFields: [], outOfDate: true }`。

    > 第一版契约写成「⇒ `reject([])`（空数组，不是对象）」—— **只读到 `.then` 就停了**。
    > 2026-09-18 被 `batch3a.test.ts` 的「并发作废」用例纠正，现已按最终值断言。
  - 失败 ⇒ `reject({ message, values: getFieldsValue(namePathList), errorFields, outOfDate })`；
  - ⭐ `errorFields` 只含 `errors.length` 非空的项；`message` 取**第一个错误的第一个 message**。
- ⭐ `returnPromise.catch(e => e)`（吞掉 unhandled rejection，调用方仍能拿到 rejected promise）——
  与批次① 的 `pending.catch(e => e)` 同一手法。
- 最后 `triggerOnFieldsChange(triggerNamePathList)`（`validating` 状态变化）并返回 `returnPromise`。

⭐ **`validateFields` 从不抛同步异常**；失败只以 rejected promise 表达。

#### 4.7.6 `updateValue` 的联动链（`:622-646`）⭐

顺序**不可调换**：

```
1. setValue(store) → 2. notifyObservers(valueUpdate/internal)
→ 3. notifyWatch([namePath]) → 4. triggerDependenciesUpdate(prevStore, namePath)
→ 5. onValuesChange(changedValues, mergedAllValues) → 6. triggerOnFieldsChange([namePath, ...childrenFields])
```

⭐ 第 5 步的 `mergedAllValues` 有个**易漏的补偿**：
`allValues = getFieldsValue()`（只含已注册字段）后再 `setValue(allValues, namePath, getValue(changedValues, namePath))`
—— 因为刚变更的字段可能还没注册（`getFieldsValue()` 里没有它），不补这一下 `onValuesChange`
拿到的 `allValues` 会缺当前字段。

⭐ `triggerDependenciesUpdate` 对子字段调用的是 `validateFields(childrenFields, { delayFrame: true })`
—— `delayFrame` 会 `await` 一个宏任务 + 一帧，**为的是让 `useWatch` 动态改的 rules 生效**（上游注释）。

#### 4.7.7 `Field` 的契约（`Field.js`）

**实体接口**（`interface.d.ts:64-88`）：`onStoreChange` / `isFieldTouched` / `isFieldDirty` /
`isFieldValidating` / `isListField` / `isList` / `isPreserve` / `validateRules` / `getMeta` /
`getNamePath` / `getErrors` / `getWarnings` / `props` / `INVALIDATE_NAME_PATH?`。

**`getNamePath()`**：`name !== undefined ? [...prefixName, ...name] : []`（`Field.js:105-114`）
—— ⚠️ `prefixName` 来自 `FieldContext`（`Form.List` 注入），**不是** `props`。

**`getRules()`**：`rules.map(rule => typeof rule === 'function' ? rule(fieldContext) : rule)`
—— `RuleRender` 在这里被求值（`Field.js:115-126`）。

**`onStoreChange(prevStore, namePathList, info)`**（`Field.js:166-289`）—— 重渲染判定的全部逻辑。
⭐ 顺序上**先**处理 `info.type === 'valueUpdate' && source === 'external'` 的「清空校验态」
（`touched = dirty = true`，`validatePromise = null`，errors/warnings 清空），**再** `switch (info.type)`：

| `info.type` | 判定 | 动作 |
|---|---|---|
| `reset` | `!namePathList \|\| namePathMatch` | 清 touched/dirty/errors/warnings、`validatePromise = undefined`、`onReset?.()`、`refresh()` |
| `remove` | `shouldUpdate && requireUpdate(...)` | `reRender()` |
| `setField` | `namePathMatch` | 应用 `touched`/`validating`/`errors`/`warnings`（⚠️ `validating` 要 `!('originRCField' in data)`）、`dirty = true`、`reRender()` |
| `setField` | `'value' in data && containsNamePath(namePathList, namePath, **true**)` | `reRender()` |
| `setField` | `shouldUpdate && !namePath.length && requireUpdate(...)` | `reRender()` |
| `dependenciesUpdate` | `dependencies.map(getNamePath).some(d => containsNamePath(info.relatedFields, d))` | `reRender()` |
| 其它 | `namePathMatch \|\| (!dependencies.length \|\| namePath.length \|\| shouldUpdate) && requireUpdate(...)` | `reRender()` |

⭐ 兜底：`if (shouldUpdate === true) this.reRender();`（无论 switch 走到哪）。

`requireUpdate(shouldUpdate, prev, next, prevValue, nextValue, info)`（`:12-19`）：
函数 ⇒ `shouldUpdate(prev, next, 'source' in info ? {source} : {})`；否则 `prevValue !== nextValue`。

⭐ `setField` 的 `validating` 处理：`this.validatePromise = data.validating ? Promise.resolve([]) : null`
—— 即 `validating: true` 时**塞一个已 resolve 的 promise**（`isFieldValidating` 判 `!!validatePromise`）。

**`getMeta()`**（`:411-423`）：`{ touched, validating, errors, warnings, name, validated: this.validatePromise === null }`
⭐ 注意 `validated` 的判据是 `=== null`（所以初始 `undefined` 时 `validated === false`）。

**`validateRules(options)`**（`:290-383`）：

1. `Promise.resolve().then(async () => {...})` —— **强制异步**（上游注释：避免 renderProps 下规则 OOD）；
2. `!this.mounted` ⇒ 返回 `[]`；
3. `showDelayFrame` ⇒ `await delayFrame()`；
4. `triggerName` ⇒ 过滤 `rule.validateTrigger`（`toArray` 后 `includes`）；
5. `validateDebounce && triggerName` ⇒ `await setTimeout`；`this.validatePromise !== rootPromise` ⇒ 返回 `[]`（**作废**）；
6. 调 `validateRules(...)`，`promise.catch(e=>e).then(ruleErrors => {...})`：
   只有 `this.validatePromise === rootPromise` 才写回 errors/warnings 并 `reRender()`；
7. `validateOnly` ⇒ **直接 return `rootPromise`**（不设 `validatePromise`/`dirty`，也不 reRender）；
8. 否则 `validatePromise = rootPromise; dirty = true; errors = EMPTY_ERRORS; warnings = EMPTY_WARNINGS; triggerMetaEvent(); reRender();`

⭐ `validateFirst` 的取值是 `boolean | 'parallel'`（`Field.d.ts:31`）—— 不是布尔。

**`getControlled(childProps)`**（`:458-550`）—— 把受控 props 注入子元素：

- `mergedValidateTrigger = validateTrigger !== undefined ? validateTrigger : fieldContext.validateTrigger`
- `valueProps = name !== undefined ? mergedGetValueProps(value) : {}`（`getValueProps || (val => ({[valuePropName]: val}))`）
- `control[trigger] = (...args) => { touched=dirty=true; triggerMetaEvent(); 取新值（getValueFromEvent / 默认）; normalize; 变了才 dispatch(updateValue); originTriggerFunc?.(...args) }`
- ⚠️ `newValue !== curValue` 才 dispatch（**引用比较**）
- `validateTriggerList` 的每个事件：包一层，**先**调原 handler，再 `if (rules?.length) dispatch({type:'validateField', namePath, triggerName})`

**`WrapperField`**（`:578-603`）：`isListField = restProps.isListField ?? !!listContext`；
`key = isMergedListField ? 'keep' : '_' + namePath.join('_')`。
⚠️ `preserve === false && isMergedListField && namePath.length <= 1` ⇒ dev 告警。

#### 4.7.8 `validateRules` / `validateRule`（`utils/validateUtil.js`）⭐

`validateRule(name, value, rule, options, messageVariables)`（`:23-99`）：

1. `cloneRule = {...rule}`，**`delete cloneRule.ruleIndex`**（⚠️ 上游注释说是 async-validator 的 bug）；
2. ⭐ `AsyncValidator.warning = () => void 0;` —— **全局把 `Schema.warning` 置空**（`:34`）；
3. `cloneRule.validator` 包一层 try/catch：抛错 ⇒ `console.error` + `Promise.reject('CODE_LOGIC_ERROR')`；
4. `type === 'array' && defaultField` ⇒ 抽出 `subRuleField` 并 **delete** `defaultField`；
5. `new AsyncValidator({ [name]: [cloneRule] })`；`validator.messages(merge(defaultValidateMessages, options.validateMessages))`；
6. `await validator.validate({ [name]: value }, {...options})`，catch 里 `errObj.errors.map(({message}, i) => message === 'CODE_LOGIC_ERROR' ? messages.default : message)`；
7. ⭐ `subRuleField && Array.isArray(value) && value.length > 0 && !result.length` ⇒ 对每个元素递归 `validateRule(`${name}.${i}`, ...)` 并**展平**；
8. `kv = { ...rule, name, enum: (rule.enum || []).join(', '), ...messageVariables }`，对字符串错误 `replaceMessage(error, kv)`。

⭐ 第 6 步的 `messages` 是 `merge(defaultValidateMessages, options.validateMessages)`
—— 这里用的就是**第二套模板**（`${name}` 具名占位符，§4.6.5）。**不能**把 `defaultValidateMessages`
直接交给 `Schema.messages()`。

`validateRules(namePath, value, rules, options, validateFirst, messageVariables)`（`:105-204`）：

1. `name = namePath.join('.')`；
2. 每条规则：`{...currentRule, ruleIndex}`；有 `validator` ⇒ 包一层「promise 优先 / callback 兼容 + 告警」；
3. ⭐ **排序**：`warningOnly` 的排到最后（`!!w1 === !!w2 ? i1 - i2 : (w1 ? 1 : -1)`）——
   `Array.prototype.sort` 稳定 ⇒ 同组保持原序；
4. `validateFirst === true` ⇒ **串行**（`for` + `await`），第一个有错即 `reject([{errors, rule}])`，全过 `resolve([])`；
5. 否则 ⇒ **并行**（`validateFirst ? finishOnFirstFailed : finishOnAllFailed`），
   且 `.then(errors => Promise.reject(errors))` —— ⭐ **总是 reject**（`Field` 靠 catch 拿结果）；
6. ⭐ `summaryPromise.catch(e => e)` 吞 unhandled rejection。

⭐ 两个「看起来是 bug 但必须照抄」的点：

- `finishOnFirstFailed`（`:211-225`）**没有 `hasError` 概念**，且 `promise.then` 里没有 `.catch` ——
  依赖第 2 步的包装保证每条 `rulePromise` 一定 resolve；
- `validateRule` 第 7 步的子规则展开**只在 `!result.length` 时发生**（父规则已报错就不递归）。

#### 4.7.9 `WatcherCenter`（`hooks/useNotifyWatch.js`）

- `macroTask(fn)` 用 **`MessageChannel`**（`port1.onmessage = fn; port2.postMessage(null)`）；
- `notify(namePath)`：按 `matchNamePath` 去重后 push，然后 `doBatch()`；
- `doBatch()`：`taskId += 1` 记 `currentId`；宏任务里 **`currentId === this.taskId && watcherList.size`** 才执行
  —— ⭐ 即「同一批次内的多次 notify 只触发一次」；
- 回调签名 `(values, allValues, namePathList)`，执行后 `namePathList = []`。

#### 4.7.10 `useWatch`（`hooks/useWatch.js`）

- `stringify(value)` 用 `JSON.stringify`，**抛错时返回 `Math.random()`**（⚠️ 不可序列化值时永远「不等」⇒ 每次都 setValue）；
- 初始值：`typeof dependencies === 'function' ? dependencies({}) : undefined`；
- `isFormInstance(_form)`（`!!form._init`）判 `(deps, form)` 还是 `(deps, options)`；
- `triggerUpdate(values, allValues)`：`options.preserve ? allValues ?? getFieldsValue(true) : values ?? getFieldsValue()`；
  `nextValue = typeof deps === 'function' ? deps(watchValue) : getValue(watchValue, getNamePath(deps))`；
  `stringify(value) !== stringify(nextValue)` 才 setValue；
- 两个 effect：deps 变 ⇒ `triggerUpdate()`；`isValidForm` 变 ⇒ `registerWatch(...)` 并返回 cancel；
- ⚠️ `flattenDeps = typeof deps === 'function' ? deps : JSON.stringify(deps)`。

#### 4.7.11 `Form`（`Form.js`）与 `List`（`List.js`）

`Form`：默认 `component = 'form'`，`validateTrigger = 'onChange'`；
`onSubmit` ⇒ `preventDefault + stopPropagation + submit()`；`onReset` ⇒ `preventDefault + resetFields() + restProps.onReset?.(event)`；
`Component === false` ⇒ 只渲染 wrapper（不产 `<form>`）；
`useSubscribe(!childrenRenderProps)`（渲染 props 时改为整体重渲染）；
`setInitialValues(initialValues, !mountRef.current)` —— ⭐ **只有首次渲染** `init = true`；
`fields` prop 变化用 `isSimilar` 比较后 `setFields`；卸载时 `destroyForm(clearOnDestroy)`。

`List`：`prefixName = [...getNamePath(context.prefixName), ...getNamePath(name)]`；
`keyManager = {keys: [], id: 0}`；
`listContext.getKey(namePath) = [keys[namePath[len]], namePath.slice(len+1)]`；
`shouldUpdate = (prev, next, {source}) => source === 'internal' ? false : prev !== next`；
`add(defaultValue, index)`：`index >= 0 && index <= newValue.length` ⇒ 插到中间，否则**追加**
（`index` 非法时 dev 告警）；每次 `id += 1`；
`remove(index | index[])`：`indexSet.size <= 0` ⇒ 直接 return；同时过滤 keys 与 value；
`move(from, to)`：`from === to` 或任一越界 ⇒ return；
⭐ `children` 不是函数 ⇒ dev 告警并返回 `null`；
⭐ `value` 不是数组 ⇒ 置 `[]` 并 dev 告警。

---

## 5. 边界

✅ 做（批次 ①）：校验引擎的全部 —— Schema、util、messages、7 rule、17 validator。

✅ 做（批次 ②）：namePath 的取值/赋值/比较工具、NameMap、validateMessages 默认模板。

✅ 做（批次 ③）：FormStore 的状态与联动语义、Field 的注册与校验编排、三个 Context 的配对。

❌ 不做：

- **任何 UI**（`Form.Item` 的布局、错误展示、`label` 排版）—— 属 `ui`
- **组件视觉语义**（R4：不得定义颜色/圆角/阴影，不产 CSS）
- **日期库**（`dayjs` 由 `picker` 决定；本包不解析日期字面量）
- **焦点管理**（`a11y`）与 **滚动定位**（`position`）

---

## 6. API 设计（批次 ①）

### 6.1 纯数据侧（可穷举测试）

| 导出 | 契约来源 |
|---|---|
| `format(template, ...args)` | `util.js:26-60` |
| `isEmptyValue(value, type?)` | `util.js:64-75` |
| `isEmptyObject(obj)` | `util.js:76-78` |
| `convertFieldsError(errors)` | `util.js:16-25` |
| `complementError(rule, source)` | `util.js:185-204` |
| `deepMerge(target, source)` | `util.js:205-222` |
| `defaultMessages` / `newMessages()` | `messages.js` |
| `rules`（7 个原子规则） | `rule/*.js` |
| `validators`（17 个） | `validator/*.js` |
| `AsyncValidationError` | `util.js:119-127` |

### 6.2 有状态/异步的一侧

```ts
class Schema {
  static register(type: string, validator: Validator): void;
  static readonly messages: Messages;
  static readonly validators: Record<string, Validator>;

  constructor(descriptor: Rules);

  define(rules: Rules): void;
  messages(messages?: Partial<Messages>): Messages;
  validate(source: object, options?: ValidateOptions): Promise<object>;
  validate(source: object, options: ValidateOptions, callback: Callback): Promise<object>;
  validate(source: object, callback: Callback): Promise<object>;
}
```

⚠️ **`validate` 返回的 Promise 在失败时是 rejected**（`asyncMap` 里 `reject(new AsyncValidationError(...))`），
而 `callback` 同时被调用。调用方**两者都拿得到** —— 但要注意 `pending.catch(e => e)` 的存在：
**直接 `await schema.validate(...)` 会抛**，而 `schema.validate(...).catch(...)` 能拿到 `AsyncValidationError`。

### 6.3 与 React 的差异

| # | async-validator（原生 JS） | 我们 | 处置 |
|---|---|---|---|
| 1 | 纯 JS 类，无框架耦合 | 同名 `Schema` 类 | 直接移植（H3 在此**不适用** —— 它本来就不是 React 代码） |
| 2 | `warning` 依赖 `process.env.NODE_ENV` + 全局 `ASYNC_VALIDATOR_NO_WARNING` | 用 `utils` 的 `isDev` + `devUseWarning` | 统一到仓库的告警体系 |
| 3 | `setTimeout(() => { throw error }, 0)` 异步重抛校验器异常 | 保留（可观测行为） | 见 §8 P2 |

⭐ 注意：**批次 ① 是纯 JS 移植，不涉及 Vue**。这是它风险低、可先做的根本原因。
`H3（禁止机械翻译）`约束的是 React→Vue 的改写；对无框架耦合的纯逻辑，**照抄就是正确做法**
（与 `utils` 移植 rc-util 同理）。

### 6.4 批次 ③ 的 Vue API 形态（G2 产物）

#### 6.4.1 ⭐⭐ P3 裁决：**plain store + 版本号 + 显式订阅**（不做 `reactive(store)`）

契约 §8 的 P3 问「`reactive` 还是 `shallowRef` + 手动版本号」。**裁决：后者。**
理由不是偏好，而是两条**必须同时成立**的语义：

| 要求 | `reactive(store)` 方案 | plain store + 版本号（**采用**） |
|---|---|---|
| 「读 `getFieldValue` 不建立依赖」 | ❌ `getValue(this.store, path)` 会 track ⇒ 任何组件里读它都会建立依赖 | ✅ store 是普通对象，`getValue` 是纯函数 ⇒ **零依赖** |
| 「`useWatch` 精确订阅」 | ⚠️ 需要额外的 `toRaw`/`markRaw` 纪律，且 `set` 创建的新对象会**整体替换**（track 面变大） | ✅ 靠 `WatcherCenter` 的显式回调 + `stringify` 比较 |
| 「单字段变化不全表单重渲染」 | ❌ 除非所有读取点都刻意避让 | ✅ 逐个 `onStoreChange`，由 Field 自己决定要不要 reRender |

⭐ 与 React 的对应关系是**一一对应**的，这本身就是「Vue-native 重设计」而不是「翻译」：

| React | Vue |
|---|---|
| `useState({})` 的 `forceUpdate`（`useForm`） | ⭐ 同一个组件实例上的 `getCurrentInstance().proxy.$forceUpdate()` |
| `Field extends PureComponent` + `forceUpdate()` | renderless 组件的 `shallowRef(0)` + `reRender()`（**③b**） |
| `useState(value)` + `setValue`（`useWatch`） | `shallowRef` + `WatcherCenter` 回调 |
| `cloneElement(child, control)` | **scoped slot** `default(control, meta, form)` + 消费方 `v-bind="control"`（**③b**） |

> ⚠️⚠️ **订正（2026-09-18，实现期发现）**：本表第一行原先写的是
> 「`useForm` 内的 `shallowRef(0)` 版本号，`forceRootUpdate` 只 bump 它」—— **那条不成立**。
> 版本号必须有人**读**才会触发渲染，而 `useForm` 返回的是普通对象，
> 组件不会因为它的值变化而重渲染。版本号方案只适用于 **`Field` 的 renderless 组件**
> （它的 render 函数直接读那个 `shallowRef`）。
> `useForm` 的对应物只能是 `$forceUpdate()`（作用在**调用 `useForm` 的那个实例**上，
> 与 React 的 `forceUpdate` 作用点一致）。
> 证据：`batch3a.test.ts` 的「在组件 setup 里调用：`forceRootUpdate` 触发**该组件**重渲染」。

⭐ 另外一处 Vue 侧的结构性简化：**`useForm` 不需要 React 的 `useRef` 单例守卫**。
上游靠 `if (!formRef.current)` 保证「一个组件实例只建一次 store」，因为 React 的函数组件体
每次渲染都重跑；Vue 的 `setup()` **一个实例只跑一次** ⇒ 局部常量即单例（H3 的心智模型差异）。

**PoC（契约要求先做）**：见 `packages/form-core/src/__tests__/batch3a.test.ts` 的
「读值不建立依赖」与「useWatch 精确订阅」两组用例 —— 它们是**行为断言**，
不是「我们打算这么做」的说明。

#### 6.4.2 三个 Context → `InjectionKey` + `provide`/`inject`

| 上游 | 我们 | 默认值 |
|---|---|---|
| `FieldContext`（`InternalFormInstance`） | `fieldContextKey` | ⭐ 全部方法指向 `warningFunc`（调一次 dev 告警，返回 `undefined`） |
| `FormContext`（跨表单协调） | `formContextKey` | 四个 no-op + `validateMessages: undefined` |
| `ListContext`（`getKey`） | `listContextKey` | `null` |

⚠️ `HOOK_MARK` 保持上游字符串 `'RC_FORM_INTERNAL_HOOKS'`（不是可观测 API，不做无意义改名）。

#### 6.4.3 组件形态：**renderless + scoped slot**

上游 `Field` / `List` 用 render props，`Form` 用 `component` prop 渲染容器。
Vue 的对应物：

| 上游 | 我们 | 说明 |
|---|---|---|
| `<Field>{(control, meta, form) => ...}</Field>` | `<AField v-slot="(control, meta, form)">` | scoped slot |
| `<Field><Input/></Field>`（单元素 clone） | 同上（消费方 `v-bind="control"`） | ⭐ **不做 `cloneElement`** —— 那是 React 的注入手段，Vue 的对应物是 `v-bind` |
| `<Form component={false}>` | `<AForm :component="false">` | 保持 |
| `<Form component="form">` | 默认渲染 `<form>` | 保持 |
| `<List>{(fields, ops, meta) => ...}</List>` | `<AList v-slot="(fields, ops, meta)">` | scoped slot |

⭐ **命名**：`form-core` 导出 `Form` / `Field` / `List` / `FormProvider`（与上游同名，便于对照）。
`ui` 层的 `Form` / `Form.Item` / `Form.List` 是**包装**，不是同一个东西。

#### 6.4.4 composable 形态

```ts
// 与上游同构：返回元组，便于 `const [form] = useForm()` 直接迁移
function useForm<Values = any>(form?: FormInstance<Values>): [FormInstance<Values>];

// ⭐ 有意差异（INTENDED）：返回 Ref，Vue 侧才能参与响应式
function useWatch<Values = any>(
  dependencies: WatchDependencies<Values>,   // 见下
  formOrOptions?: FormInstance<Values> | WatchOptions<Values>,
): Ref<unknown>;
```

⭐ `WatchDependencies<Values> = NamePath<Values> | ((values: Store) => unknown)`。

> ⚠️⚠️ **订正（2026-09-18）**：本处原先还列了 `NamePath<Values>[]` 这一支 —— **那是错的**。
> 上游 9 个重载里的 `dependencies: [TDependencies1, TDependencies2]` 是
> **嵌套路径的元组**（`['a','b']` ⇒ `values.a.b`），**不是**「同时监听 a 和 b」；
> 唯一的「多项」形态是 `dependencies: []`（整表）。所以没有「路径数组」这一支。
>
> ⚠️ 上游那 9 个重载的**返回类型**要从 `validateFields` 的泛型反推（`GetGeneric<TForm>`），
> Vue 侧返回 `Ref` 会让反推链断掉 ⇒ 采用上面的简化签名（§6.4.5 差异 5）。

⚠️ `useWatch` 用**变参**声明（`...args`）而不是可选形参，为的是保住上游
`args.length === 2` 这个**判别语义**：`useWatch(deps)` 与 `useWatch(deps, undefined)`
在上游是**不同**的（后者不告警）。已由 `batch3a.test.ts` 两条用例分别钉住。

#### 6.4.5 与 React 的差异登记（批次 ③）

| # | 上游（React） | 我们 | 判定 |
|---|---|---|---|
| 1 | `validateUtil` 用 `React.isValidElement`/`cloneElement` 给错误消息加 `key` | **整段删除** —— Vue 渲染 `VNodeChild` 不需要 `key`，消息原样返回 | **INTENDED**（Vue 无对应物；契约 §4.6.6 已预告） |
| 2 | `Field` 用 `cloneElement` 注入 control | scoped slot + `v-bind` | **INTENDED**（Vue 的受控注入手段） |
| 3 | `forceUpdate` / `useState` | `$forceUpdate()`（`useForm`）/ `shallowRef` 版本号（`Field`）+ 显式订阅 | **INTENDED**（§6.4.1） |
| 4 | `React.useImperativeHandle` 暴露 `nativeElement` | `defineExpose` | **INTENDED** |
| 5 | `useWatch` 返回**值**，且 9 个重载做深度推导 | 返回 **`Ref`**，签名简化为 `WatchDependencies<Values>` | **INTENDED**（Vue 侧要能参与响应式；反推链断在返回类型上） |
| 6 | `process.env.NODE_ENV !== 'production'` | `@apollo-design/utils` 的 `isDev` | 与批次①② 同一处置 |
| 7 | `@rc-component/util` 的 `merge` / `isEqual` / `toArray`(children) | `@apollo-design/utils` 的同名移植（**同一来源**，见 §4.6.2） | 直接复用 |
| 8 | `useWatch` 每次渲染重算 `dependencies`（`flattenDeps`） | `dependencies` 在 `setup()` 期**捕获一次** | **INTENDED**（`setup` 只跑一次；上游那次重算只会「再调一次 `triggerUpdate`」，不重新注册 watcher） |
| 9 | `isFormInstance` 短路返回 `null` / `0` / `''`（`.d.ts` 却声明 `boolean`） | `Boolean(...)` ⇒ 恒为 `boolean` | **INTENDED**（修声明而非抄实现；调用点只用真值语境，`batch3a.oracle.test.ts` 把差异显式钉住） |
| 10 | `useWatch` 在实例之外 `useContext`（React 会抛） | `inject` 前先判 `getCurrentInstance()`，无实例时取 `defaultFieldContext` | **INTENDED**（Vue 的 `inject` 在实例外**返回 `undefined` 并告警**，不会给默认值） |

⭐ 差异 1 的**证据**：`validateUtil.js:71-76` 的 `React.isValidElement(mergedMessage) ?
React.cloneElement(mergedMessage, { key: `error_${index}` }) : mergedMessage`。
我们的对应实现是「原样返回」，并由 `batch3b.test.ts` 断言 VNode 消息**引用不变**地透传。

⚠️ 差异 1 的**副作用（必须登记）**：`ReactElement` → `VNodeChild` 是一次**放宽**。
Vue 的 `VNodeChildAtom` 含 `number | boolean | null | undefined | void | VNodeArrayChildren`
⇒ 我们的 `FieldMessage = string | VNodeChild` **严格宽于**上游的 `string | ReactElement`
（例如 `42` 是合法的 `FieldMessage`）。这是「Vue 无 ReactElement」的必然结果，
已由 `batch3.test-d.ts` 显式钉住（正例 `42` + 负例 `{}`）。

---

## 7. 测试策略

### 7.0 ⭐⭐ Oracle 差分（本包最强的一层，别的包做不到）

**上游 `@rc-component/async-validator@6.0.0` 是纯 JS（无 React 耦合）⇒ 可以直接当 Oracle 跑。**
这不是"读源码再手写断言"，而是**两侧同时运行、逐位对比**（与 `position` 的 5000 组几何差分同档）。

做法（`src/__tests__/schema.oracle.test.ts`）：

```ts
const ours = new Schema(cloneDeep(rules));
const theirs = new UpstreamSchema(cloneDeep(rules));
const a = await runSide(ours, cloneDeep(source), options);    // 取 callback 与 promise 两侧
const b = await runSide(theirs, cloneDeep(source), options);
expect(a).toEqual(b);
```

⭐ 三个实现细节（踩过）：

1. **不能用 `structuredClone`** —— 它遇到函数会抛 `DataCloneError`，而
   `transform` / `validator` / `asyncValidator` / `message` 全是函数。
   实测：换上去会让 7 个用例直接炸在克隆这一步（不是实现有问题）。
   要手写 `cloneDeep`（保留函数 / RegExp / Date）。
2. **两侧都要比 callback _和_ promise 的结局** —— 只比一边会漏掉
   「promise 该 reject 却没 reject」这类缺陷（双通道语义见 §6.2）。
3. `fieldValue` 为 `undefined` 时要显式归一成哨兵值，否则两侧的 `undefined`
   处理会互相掩盖差异。

依赖声明：`devDependencies` 里的 `@rc-component/async-validator`（`catalog:`）。
⚠️ 它**不在** E19 的扫描范围（那条只针对 `@ant-design/*`），但放 devDeps 的理由相同。

#### 7.0.1 ⚠️⚠️ 批次 ③ **没有 Oracle** —— 判据与诚实边界

**判据（已在 memory 确立）**：上游**零框架耦合 ⇒ 可做 Oracle；绑 React 生命周期 ⇒ 不能。**

| 上游文件 | 能否对拍 | 依据 |
|---|---|---|
| `@rc-component/async-validator`（全部） | ✅ | 纯 JS，无 `import react` |
| `utils/{valueUtil,NameMap,messages}.js` | ✅ | 已 grep 确认不 import react |
| `utils/typeUtil.js` | ✅ | 纯函数（`toArray` 在批次② 对拍；`isFormInstance` 在 ③a 对拍） |
| `utils/asyncUtil.js` | ✅ | 纯函数（③a 对拍 `allPromiseFinish`） |
| `utils/delayUtil.js` | ⚠️ 不对拍 | 它本身不 import react，但依赖 `@rc-component/util` 的 `raf` —— 断言会变成「比谁的计时器先跑」而不是「比语义」 |
| `hooks/useForm.js` 的 `FormStore` | ❌ | 类内部用 `forceRootUpdate` + `setTimeout`/`window`；且**方法全是实例字段箭头函数**，脱离 React 实例化虽可行，但 `warningUnhooked` 依赖 `process.env`/`window`，**语义会被测试环境改写** |
| `hooks/useWatch.js` / `useNotifyWatch.js` | ❌ | `useState`/`useEffect`/`useEvent` |
| `Field.js` | ❌ | `React.PureComponent` + `forceUpdate` |
| `utils/validateUtil.js` | ❌ | `import * as React from 'react'`（`isValidElement`/`cloneElement`） |

⚠️ **`FormStore` 为什么也不对拍**：它的**大部分**方法确实是纯对象操作，但
`notifyObservers` 依赖 `subscribable` 与 `forceRootUpdate`（React 的 `useState` bump），
`warningUnhooked` 依赖 `window` 与 `process.env.NODE_ENV`。要对拍就得**机械移植一份带 React 语义的
`FormStore`**，而那份移植本身就会把「React 的调度语义」当成规格 —— 差分通过只能说明
「两边都想通了」，不能把分歧归因于「我们有意改了什么」（这正是 `WORKFLOW.md` §1.1.1
给 PoC 定的判据）。

⇒ **本批次只能「读源码 + 行为测试」**。契约里每一条都标了上游行号，测试的期望值**来自源码**，
不是照我们的实现反推。**绝不假装做过 oracle 差分。**

⭐ 两个例外：`utils/asyncUtil.js` 的 `allPromiseFinish` 与 `utils/typeUtil.js` 的
`isFormInstance` 都是纯函数，**已逐位对拍** —— 见 `__tests__/batch3a.oracle.test.ts`
（38 个用例：12 组 promise 组合 × 结局/值两层 + thenable + 空数组引用 + 20 组 `isFormInstance` 真值矩阵）。

⚠️ 这两处对拍**不是**「读源码再手写断言」：两侧同时运行、逐位比较
（与 `position` 的 5000 组几何差分同档）。批次③ 其余部分**没有**这个强度，
结论强度低于批次①②，见 §9。

⚠️ 对拍还抓出了一处**上游声明与运行时不符**：`asyncUtil.d.ts` 把入参声明成
`Promise<FieldError>[]`，运行时只用到 `.catch`/`.then`（任何 promise 都行）。
测试按**上游自己的形参类型**断言，并在用例里写明理由 —— 不是放宽断言。

#### 7.0.2 批次 ③ 的测试分层

⚠️ 下表按**子批次**给状态。③a 本轮收口，③b/③c 未开工 —— 不许把 ③a 的绿当成 ③ 的绿。

| 子批次 | 层 | 内容 | 状态 |
|---|---|---|---|
| ③a | **Oracle** | `allPromiseFinish` + `isFormInstance` 逐位差分（38） | ✅ |
| ③a | L1 单元 | `FormStore` 的全部公开方法（含边界：`getFieldsValue(true)` 引用语义、`getFieldsValue` 四入参、`isFieldsTouched` 变参矩阵、`isFieldsValidating` 的**不对称**、`setFields` 的 prevStore 批前语义、`registerField` 注销与 `preserve=false` 清值、`destroyForm` + `prevWithoutPreserves` 回填、`resetFields`、`updateValue` 六步链、`validateFields` 的并发作废/`warningOnly`/`dirty`、`submit`） | ✅ |
| ③a | L2 交互 | `WatcherCenter` 的批量/去重/`taskId` 守卫/无 watcher 不清空、`useWatch` 的路径与选择器两形态/精确订阅/`preserve`/`stringify` 比较/`args.length` 告警语义/`onScopeDispose` 清理、`useForm` 的组件内 `$forceUpdate`、`delayFrame` 的时序、默认 Context 兜底 | ✅ |
| ③a | **P3 PoC** | 「读 `getFieldValue`/`getFieldsValue(true)` 不建立响应式依赖」+ **对照组**（`reactive` 会建立依赖，证明前两条不是碰巧）+「订阅是显式的」 | ✅ |
| ③a | L3 类型 | `NamePath` 深推导 / `FormRuleType` 14 个 / `FieldMessage` / `FormInstance` 重载 / `RecursivePartial` / `FieldProps`（无 `children`）/ `FormProps.component` / `ListProps.name` 必填 / `WatchDependencies` —— 正例 + 负例（`batch3.test-d.ts`） | ✅ |
| ③a | L4/L5/L6 | **n/a** —— 本包不产 DOM、无 ARIA、无渲染产物（组件是 renderless） | n/a |
| ③a | L7 | `tests/build/run.mjs`（整包构建门禁，需抢 `/tmp/apollo-build-gate.lock`） | ✅ 实测通过（`检查项 127 \| FAIL 0 \| PENDING 1`，本包 `✅ @apollo-design/form-core`；唯一 PENDING 是 `ui` 的 B6 体积预算，与本包无关） |
| ③b | 全部 | `validateRules`/`validateRule` + `Field` renderless 组件 | ⬜ |
| ③c | 全部 | `Form` + `FormProvider` + `List` | ⬜ |

**实测（2026-09-18）** —— 权威数字来自 `registry:foundation:verify`
（`CODEBUDDY_SAFE_DELETE_ENABLED=0 node registry/tools/foundation-status.mjs --verify`，
它串行跑 `unit` + `dom-contract` + `types` + `a11y` 四个 project，全仓覆盖率全量采集）：

```
Test Files  10 passed (10)        ← form-core 在四个 project 下的文件数
     Tests  451 passed (451)      ← 0 失败
覆盖率（按 packages/form-core/src/ 聚合）：
  statements 97.38 / branches 92.46 / functions 97.22 / lines 97.42
  （阈值 95 / 90 / 95 ⇒ thresholds.met = true）
```

⚠️ **口径差异（两个数字都对，但别混用）**：只跑 `--project unit` 并限定
`--coverage.include='packages/form-core/src/**'` 时得到的是
`6 passed / 339 passed`、`97.38 / 92.34 / 96.83` —— 少跑了 `types` 的**运行时执行**
与 `dom-contract` / `a11y`，且插桩文件集不同（21 vs 17）。
⭐ **登记进 `registry/foundation.json` 的必须是 `--verify` 那一组**，
否则 `registry:foundation:check` 会判定过期。

⚠️ 覆盖率报告里 `form-types.ts` / `name-path-type.ts` / `types.ts` / `index.ts`
显示 `0 | 0 | 0 | 0` —— 那是**纯类型模块 / 只被 `import type` 引用**的显示假象：
`coverage-summary.json` 里它们的 `functions.pct` 是 `100`（`total: 0`），不参与拉低聚合值。
实测脚本已核对，不是「0% 却通过了阈值」。

| 层 | 内容 | 状态 |
|---|---|---|
| **Oracle** | 55 个用例 × 逐位差分（16 个 type / required 8 种边界 / range 4×16 值 / pattern / whitespace / enum / message 覆盖 / 多规则多字段 / first / firstFields / keys / transform / 自定义 validator 5 种返回 / 嵌套 fields / defaultField） | ✅ done |
| L1 | §6.1 全部纯函数 + 7 rule + 17 validator 的直接调用（含四情况矩阵） —— `units.test.ts`（97） | ✅ done |
| **Oracle②** | 批次② 与 rc-form 的三个纯 JS 文件逐位差分 —— `batch2.oracle.test.ts`（22）：
getNamePath 12 种输入 / cloneByNamePathList 8 组 / matchNamePath 12 对 × 2 / containsNamePath 20 组 × 2 /
isSimilar 15 对 / defaultGetValueFromEvent 10 组 / move 11 组 / NameMap 9 项 / defaultValidateMessages 整体 | ✅ done |
| L1② | `replaceMessage`（**无法 oracle** —— 它在 `validateUtil.js` 里且未导出）+ NameMap 补充分支 —— `batch2.test.ts`（25） | ✅ done |
| L2 | `Schema.validate` 的异步路径：`first` / `firstFields` / 嵌套 / transform / 校验器抛错与重抛 / `options.error` —— 合并在 oracle 与 units 里 | ✅ done |
| L3 | 类型契约（含负例） —— `form-core.test-d.ts`（26） | ✅ done |
| L4 | n/a —— 本包不产 DOM | n/a |
| L5 | n/a —— ARIA 在组件层 | n/a |
| L6 | n/a —— 无渲染产物 | n/a |
| L7 | `tests/build/run.mjs` | ⬜ 待收口（批次 ① 单独构建已通过） |

**覆盖率（批次 ①②，按 `packages/form-core/src/` 聚合）：语句 97.68 / 分支 91.93 / 函数 98.79**
（阈值 95/90/95，达标）。合计 **252 个用例**。

### 7.2 变异验证（5 个，全部被抓到）

| 变异 | 抓到的用例 |
|---|---|
| `isEmptyValue` 去掉 `'url'` 类型 | 1（units 的「7 种 native string 类型」） |
| `shouldValidate` 改成 `rule.required === true` | **首轮漏网** → 补 `required: 1` 用例后 1 个（oracle） |
| `asyncSerialArray` 不再遇错即停 | 4+（oracle 的 first / firstFields + units 的串行用例） |
| `complementError` 去掉 `fullFields` 分支 | 2（**只有 units 抓到，oracle 抓不到** —— 嵌套用例的 `fieldValue` 两侧都是 `undefined`，被哨兵值抹平） |
| `number` validator 不再把 `''` 归一成 `undefined` | 2（oracle） |

### 7.3 批次② 的变异验证（3 个，全部被抓到）

| 变异 | 抓到的用例 |
|---|---|
| `containsNamePath` 加 `!!`（把三态压成 boolean） | 1（**oracle** —— 这正是它抓出来的那个真实差异） |
| `NameMap.getAsPrefix` 的前缀去掉 SPLIT | 3（oracle + units） |
| `replaceMessage` 去掉转义分支 | 1（units） |

⚠️ 两条教训：

1. **oracle 不是万能的** —— 它比的是「最终错误」，当某个中间值在两侧都是 `undefined`
   时，差异会被掩盖（第 4 条变异）。所以**直接调用测试（units）必须与 oracle 并存**。
2. **变异脚本一次只跑一个**（`PITFALLS.md` 第 62 条）—— 多个一起跑会 OOM，
   而且会把结果误报成「漏网」。

覆盖率下限：语句 95% / 分支 90% / 函数 95%（L2 档位）。

### 7.4 批次③a 的变异验证（8 个，**全部被抓到**，2026-09-18）

一次只跑一个（`PITFALLS.md` 第 62 条）。脚本改一处 → 跑 `batch3a.test.ts` +
`batch3a.oracle.test.ts` → 必须变红 → 还原（`finally` 里还原，跑完再校验一次原文在位）。

| # | 变异 | 抓到的用例 |
|---|---|---|
| M1 | `updateValue` 去掉 `allValues` 补偿（直接 `= allValues`） | 1（`allValues` 的补偿） |
| M2 | `WatcherCenter.doBatch` 去掉 `currentId === this.taskId` 守卫 | 1（同一批内多次 notify 只触发一次） |
| M3 | `getFieldsValue(true)` 改成 `{ ...this.store }`（返回副本） | 1（`getFieldsValue(true)` ⇒ 返回引用） |
| M4 | `useWatch` 去掉 `stringify` 比较（每次都写 `ref`） | 1（值未变时不写 ref） |
| M5 | `isFieldsTouched` 的 all 分支 `every` → `some` | 1（2 个参数 ⇒ `(nameList, allFieldsTouched)`） |
| M6 | `allPromiseFinish` 把 `resolve(results)` 提到 `if (hasError)` **之前** | 2（**oracle** 的失败组 + 「reject 后没有 return」） |
| M7 | `setFields` 把 `prevStore` 挪进循环 | 1（`prevStore` 在循环外只取一次） |
| M8 | `isFormInstance` 只看 truthy（`Boolean(form)`） | 1（**oracle** 的真值矩阵） |

**漏网 0 个。**

⚠️ M6/M8 是**只有 oracle 能抓**的两条（行为测试里 `null` 与 `false` 都是 falsy、
`resolve` 与 `reject` 的先后在同值下不可观测）—— 这正是「oracle 与直接调用测试必须并存」的又一例证。

### 7.1 测试侧会踩的坑（先写下来）

1. **`validate` 的 Promise 会 reject** —— 断言失败路径要用 `await expect(...).rejects`，
   同时**不能**忘了 `callback` 也被调用了（两者都要断言）。
2. **`warning` 只在 dev + 有 window/document 时输出** —— 测试里断言告警要显式控制 `isDev`。
3. **`deepMerge` 不是深合并** —— 只展开一层；三层嵌套的期望值要按「一层」手算。
4. **`asyncMap` 在 `first` 模式下遇错即停** —— 断言「校验器被调用了几个」时不能用「全部」。
5. **`enum` rule 会写回 `rule.enum`** —— 传同一个规则对象跑两次，第二次对象已被改过；
   测试要用 `structuredClone` 或每次新建。
6. **`pattern` rule 会重置 `lastIndex`** —— 测 `g` 标志的正则时要断言「连续两次结果一致」。

---

## 8. 待裁决

### P1 · `validate` 的双通道（callback + Promise）是否都保留

上游两者都有，且 `asyncMap` 里有 `pending.catch(e => e)` 吞掉 rejection。
- **建议**：**都保留**（`form-core` 的上层是 `ui`，antd 的 `Form` 走 callback；
  但 Promise 形态对 `async/await` 调用方更友好）。⚠️ 必须在契约里写明
  「失败时 callback 被调用 **且** Promise reject」这条双通道语义，否则调用方会踩 `unhandledRejection`。

### P2 · `setTimeout(() => { throw error }, 0)` 的异步重抛

上游在校验器**同步抛错**时：`console.error` + （非 `suppressValidatorError` 时）异步重抛 + `cb(error.message)`。
- **建议**：**保留**（它是可观测行为，且是「校验器写错时报错不被吞掉」的唯一保障）。
  但要用 `utils` 的 `isDev` 包一层，生产环境不重抛。

### P3 · 批次 ③ 的响应式形态

`FormStore` 用 `reactive` 还是 `shallowRef` + 手动版本号？

- **裁决（2026-09-18，已落地）**：**plain store + `shallowRef` 版本号 + 显式订阅**。
  理由与两方案的对照见 §6.4.1；PoC 以行为断言的形式落在 `batch3a.test.ts`。
- ⚠️ 否决 `reactive(store)` 的**决定性**理由：`getValue(this.store, path)` 会建立依赖，
  违反「读 `getFieldValue` 不建立依赖」这条硬要求；而这条要求是 `useWatch`
  精确订阅与「单字段变化不全表单重渲染」的前提。

### P4 · 是否保留 `Schema.register` 的全局可变注册表

`Schema.validators` 是模块级对象，`register` 会改它（影响所有实例）。
- **建议**：**保留**（antd 的 `Form` 用它注册 `enum` 等自定义校验器），
  但要在文档里明确「这是全局副作用」。

---

## 9. 这个包**没有**证明什么

1. **没有与真实 React 运行时对拍**。本仓库禁止引入 React（H1），批次 ① 的结论全部来自读源码。
   ✅ 批次 ① 已用从 npm 安装的 `async-validator` 作 Oracle 做逐位差分；批次 ② 同档。
2. ⚠️⚠️ **批次 ③ 基本没有 Oracle**（依据见 §7.0.1）。它的结论强度**低于**批次①②：
   批次①② 能说「与上游逐位一致」，批次③ 只能说「按上游源码逐条实现 + 行为测试通过」。
   **不要把批次③ 的测试强度等同于批次①②。** 这是本包目前最大的、且**已知**的验证缺口。
   - ③a 的两个纯函数例外（`allPromiseFinish` / `isFormInstance`）是**真对拍**，
     但它们占 ③a 的体量不到 5%；`FormStore`（约 950 行）、`WatcherCenter`、`useForm`、
     `useWatch` **全部**是「读源码 + 行为测试」。
   - ⚠️ 本轮有 **2 条契约条目被行为测试的红灯纠正**（`validateFields('a')` 会抛、
     并发作废的 rejection 值被后续 `.catch` 改写）。这说明「读源码」确实会漏 ——
     反过来说明**没被红灯照到的条目同样可能有漏**，只是还没有测试去照。
3. **没有验证 `ui` 层会怎么消费**（部分缓解）：`packages/ui/src/form/` 的**骨架**已经消费了
   §6.4 的类型面，且**全仓 `vue-tsc --noEmit` 0 错误** ⇒ 「API 形状可被消费」有了第一条证据。
   ⚠️ 但骨架**没有实现**，所以「真实 `Form.Item` 跑起来后 store 的行为是否够用」**仍未验证**。
4. **`url` 正则没有逐字核对**（49 行动态拼接的正则，移植时必须逐段对照，不能凭印象重写）。
   ⚠️ 仍然成立。
5. **`FormStore` 的并发校验语义只测了我们关心的路径** —— 上游 `lastValidatePromise` 的
   `outOfDate` 判定在「连续两次 `validateFields` 且第一次先返回」的时序下有覆盖，
   但「两次都 pending 时用户再次提交」这类竞态没有穷举。
6. **`WatcherCenter` 的 `MessageChannel` 在真实浏览器的事件循环时序**没有验证 ——
   测试在 jsdom 下跑，`MessageChannel` 的投递时机可能与浏览器不同。⚠️ 若将来出现
   「`useWatch` 在浏览器里晚一拍」的问题，第一嫌疑人是这里。
7. **`form-store.ts` 的文件级分支覆盖率只有 86.17%**（聚合值 92.46% 是靠其它文件拉起来的）。
   未覆盖的分支主要是「上游的防御性/告警分支」（如 `getFieldEntitiesForNamePathList` 的
   `includesSubNamePath` 组合、`resetWithFieldInitialValue` 的「多字段同路径 initialValue」
   告警、`validateFields` 的 `recursive` 组合）。⚠️ **这是真实的覆盖缺口，不是假象** ——
   本轮没有为它们补测试，因为其中几条的**可观测行为**要等 `Field`（③b）才能构造出来。
8. **③b / ③c 完全没做** ⇒ `Field`、`validateRules`/`validateRule`、`Form`、`FormProvider`、
   `List` 一行都没有。契约 §4.7.7 / §4.7.8 / §4.7.11 目前是**未被任何代码验证的文档**。
9. **`FieldEntity` 的替身是按 `Field.js` 的语义手写的**（`batch3a.test.ts` 的 `createField`）。
   它证明的是「`FormStore` 与一个符合契约的实体协作正常」，**不是**「真实 `Field` 也符合」。
   ⚠️ 替身与真实现之间的偏差要等 ③b 才能暴露。
10. ⚠️⚠️ **L3 类型测试曾经是「假绿」，是 `--verify` 才照出来的**（2026-09-18）。
   `batch3.test-d.ts` 里有 5 条用了 `const form = null as unknown as FormInstance; form.xxx();` ——
   类型上完全正确（`vue-tsc` 0 错误），但 **vitest 的 `types` 项目会「运行时执行」`*.test-d.ts`**，
   执行到 `null.xxx()` 就是 `TypeError`，5 条全红。
   ⇒ 教训：**`lint:types`（vue-tsc）与 `types` project 不是同一条通道**，
   只跑前者会得到假绿。已改为「包在永不调用的函数里」（`PITFALLS.md` 74）。
11. ⚠️ **`vitest run --project types` 解析不了 `.vue`**，会对**基线文件**报
   `Unhandled Source Error: Cannot find module './Empty.vue'`（`packages/ui/src/empty/index.ts:22`）。
   **已用「把 `packages/ui/src/form/` 移走再跑」证明这是基线 `9326146` 就存在的既有问题**，
   不是本批次引入的；本批次的 `ui/src/form` 骨架只是又多了 3 条**同类**报错。
   后果：`--verify` 的 exit code 是 1，但 `verification.unit.failed` 是 0
   （Unhandled Source Error 不计入 assertion failure）。
   ⚠️ 修它要动 `vitest.config.ts` —— **不在本包的 file domain 内**，属基建议题（`PITFALLS.md` 73）。
