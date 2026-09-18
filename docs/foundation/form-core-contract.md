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
| **①校验引擎** | `Schema` + `format`/`isEmptyValue`/`deepMerge`/`complementError`/`asyncMap` + 7 个 rule + 17 个 validator + messages 模板 | async-validator 全部（1078 行） | 中 | **低**（纯逻辑，可穷举） | 本轮 |
| **②取值工具** | `getNamePath`/`getValue`/`setValue`/`cloneByNamePathList`/`containsNamePath`/`matchNamePath`/`NameMap` + `validateMessages` 默认模板 | rc-form `utils/valueUtil.js`(114) + `utils/NameMap.js`(75) + `utils/messages.js`(48) | 小 | **低**（纯函数） | ✅ 本轮 |
| **③状态机** | `FormStore` + `useForm` + `Field` 注册/校验/依赖联动 + `useWatch` + 三个 Context | rc-form `hooks/useForm.js`(918) + `Field.js`(603) + `Form.js`(138) + `List.js`(143) | **大** | **高**（React→Vue 响应式重写） | 待做 |

**为什么按这个顺序**：

1. **纯逻辑优先** —— 批次①②没有 DOM、没有响应式，可以用穷举强度测试，是"能立刻封死"的部分；
2. **批次③是唯一真正困难的部分** —— `FormStore` 用 React 的 `forceUpdate` 驱动，Vue 必须换成
   `reactive`/`shallowRef` + 显式依赖追踪。**在没有真实 Form 组件消费之前**，
   它的 API 形状无法被验证（与 `position.measureAlign`、`overlay.useOverlay` 同类风险）；
3. **上游分层就是这么切的** —— 照搬接缝比自创接缝更不容易出错。

> ✅ 批次①② 均已落地（2026-09-18）。**批次③ 是唯一剩下的、也是唯一有风险的。**

⚠️ **批次 ③ 开工前必须先有 `packages/ui/src/form` 的设计**（或至少 `Form.Item` 的骨架），
否则会重复 `overlay` 的处境：契约封了但无人消费，API 形状无从校验。

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

⚠️ **本节待批次 ③ 开工时补全**。已知的骨架：

- `FormStore`（`hooks/useForm.js`，918 行）：`getFieldValue` / `getFieldsValue` / `getFieldError` /
  `getFieldsError` / `isFieldTouched` / `isFieldsTouched` / `isFieldValidating` / `isFieldsValidating` /
  `resetFields` / `setFields` / `setFieldValue` / `setFieldsValue` / `validateFields` /
  `validateFieldsPromise` / `submit` / `getInternalHooks` / `registerField` / `unregisterField` /
  `registerWatch` / `notifyWatch`
- `Field`（603 行）：字段注册、`getControlled`（把 value/onChange 注入子组件）、
  `validateRules`（`validateFirst` / `dependencies` / `shouldUpdate` / `onFieldsChange`）
- `Form`（138 行）：`FormProvider` + `FieldContext.Provider` + `ListContext.Provider`
- `List`（143 行）：`Form.List` 的增删移
- `useWatch` / `useNotifyWatch`

⭐ 批次 ③ 的核心难点（**开工前必须先解决**）：rc-form 的 store 用 React 的
`forceUpdate` 驱动，字段值存在 `store` 的普通对象里。Vue 侧必须改成响应式容器，
且要保证「读 `getFieldValue` 不建立依赖」与「`useWatch` 精确订阅」两种语义同时成立 ——
否则会出现「任一字段变化导致全表单重渲染」的性能问题。

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
- **建议**：**开工时先做 5-10 行的 PoC**（模拟 `useWatch` 的精确订阅 + `getFieldValue` 不建立依赖），
  再决定。这是全包唯一需要 PoC 的地方 —— 上游 `pocRequired: false` 是 Phase 1 的判断，
  针对的是「纯函数差分」，不覆盖这一条。

### P4 · 是否保留 `Schema.register` 的全局可变注册表

`Schema.validators` 是模块级对象，`register` 会改它（影响所有实例）。
- **建议**：**保留**（antd 的 `Form` 用它注册 `enum` 等自定义校验器），
  但要在文档里明确「这是全局副作用」。

---

## 9. 这个包**没有**证明什么

1. **没有与真实 React 运行时对拍**。本仓库禁止引入 React（H1），批次 ① 的结论全部来自读源码。
   ⚠️ 但批次 ① 是纯 JS，可以用**从 npm 安装的 `async-validator` 作为 Oracle** 做逐位差分
   （与 `position`/`motion` 同档强度）—— 这是**下一步该做的**，本契约尚未包含。
2. **批次 ③ 的契约尚未分析** —— 本文档对它只有职责边界，没有逐条契约。
   **不要把 §4.7 当作已验证的契约。**（批次 ② 已在 §4.6 补齐并验证。）
3. **没有验证 `ui` 层会怎么消费**。`FormStore` 的 API 形状在真实 `Form.Item` 出现前无法验证
   （与 `position.measureAlign`、`overlay.useOverlay` 同类风险）。
4. **`url` 正则没有逐字核对**（49 行动态拼接的正则，移植时必须逐段对照，不能凭印象重写）。
