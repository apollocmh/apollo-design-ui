/**
 * `FormStore` —— 表单状态机（批次 ③a）。
 *
 * 契约来源：`@rc-component/form@1.8.6/es/hooks/useForm.js`（918 行）。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.7.1–§4.7.6。
 *
 * ── ⚠️ 为什么这是「重写」而不是「翻译」──────────────────────────────────────
 *
 * 上游用 React 的 `forceUpdate` 驱动重渲染：
 *   - `subscribable === true` 时逐个调 `fieldEntity.onStoreChange(...)`，由 Field 自己
 *     决定要不要 `this.forceUpdate()`；
 *   - `subscribable === false`（render-props 模式）时只调 `forceRootUpdate()`。
 *
 * Vue 侧**保留同一套显式订阅模型**，只把「重渲染」的落点换掉：
 *   - `store` 是**普通对象**（不是 `reactive`）⇒ `getFieldValue` 读它**不建立响应式依赖**；
 *   - `forceRootUpdate` 由 `useForm` 注入（bump 一个 `shallowRef` 版本号）；
 *   - 每个 Field 的 `onStoreChange` 里 bump 自己的版本号。
 * 裁决与理由见契约 §6.4.1（P3）。
 *
 * ⚠️ 本类**没有 oracle 可对拍**（契约 §7.0.1）：`notifyObservers` 依赖 `subscribable`
 * 与 `forceRootUpdate`，`warningUnhooked` 依赖 `window`/`isDev`。机械移植一份带 React
 * 语义的 FormStore 只能证明「两边都想通了」。⇒ 期望值全部来自**读上游源码 + 行为测试**，
 * 不假装做过差分。
 */

import { isDev, merge, warning } from '@apollo-design/utils';

import { allPromiseFinish } from './async-util';
import { HOOK_MARK } from './form-context';
import type {
  Callbacks,
  FieldCancelRegister,
  FieldData,
  FieldEntity,
  FieldError,
  FilterFunc,
  FormInstance,
  GetFieldsValueConfig,
  InternalFormInstance,
  InternalHooks,
  InternalNamePath,
  NamePath,
  NotifyInfo,
  ReducerAction,
  Store,
  StoreValue,
  ValidateErrorEntity,
  ValidateMessages,
  WatchCallBack,
} from './form-types';
import NameMap from './name-map';
import { defaultValidateMessages } from './validate-messages';
import {
  cloneByNamePathList,
  containsNamePath,
  getNamePath,
  getValue,
  matchNamePath,
  setValue,
} from './value-util';
import WatcherCenter from './watcher-center';

/** `getFieldEntitiesForNamePathList` 里表示「这个路径没有对应字段」的哨兵。 */
interface InvalidateEntity {
  INVALIDATE_NAME_PATH: InternalNamePath;
}

type MaybeEntity = FieldEntity | InvalidateEntity;

/**
 * ⚠️ 判据必须是「**没有 `getNamePath`**」而不是「有 `INVALIDATE_NAME_PATH`」——
 * `FieldEntity` 的 `.d.ts` 里那个键是可选的（理论上真字段也能带），
 * 用后者会把带该键的真字段误判成哨兵。
 */
function isInvalidateEntity(entity: MaybeEntity): entity is InvalidateEntity {
  return typeof (entity as FieldEntity).getNamePath !== 'function';
}

export class FormStore {
  private formHooked = false;

  private forceRootUpdate: () => void;

  private subscribable = true;

  /**
   * ⭐⭐ **普通对象，不是响应式容器** —— 见文件头与契约 §6.4.1。
   * 所有写入都是**整体替换**（`this.store = nextStore`），与上游一致。
   */
  private store: Store = {};

  private fieldEntities: FieldEntity[] = [];

  private initialValues: Store = {};

  private callbacks: Callbacks = {};

  private validateMessages: ValidateMessages | null = null;

  private preserve: boolean | null | undefined = null;

  private lastValidatePromise: Promise<unknown[]> | null = null;

  private watcherCenter = new WatcherCenter(this);

  /**
   * 记录「上一个 Form 卸载时 `preserve === false` 的字段」。
   * 下次挂载要用 `initialValues` 回填它们，而不是沿用 store 里的旧值。
   */
  private prevWithoutPreserves: NameMap<boolean> | null = null;

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(forceRootUpdate: () => void) {
    this.forceRootUpdate = forceRootUpdate;
  }

  // ======================== 对外实例 ========================

  /**
   * ⚠️ 每次调用返回**新对象**（方法引用相同）—— 上游如此。
   * 依赖「对象身份」做 memo 的调用方会每次都拿到新引用。
   */
  getForm = (): InternalFormInstance => ({
    getFieldValue: this.getFieldValue,
    getFieldsValue: this.getFieldsValue,
    getFieldError: this.getFieldError,
    getFieldWarning: this.getFieldWarning,
    getFieldsError: this.getFieldsError,
    isFieldsTouched: this.isFieldsTouched,
    isFieldTouched: this.isFieldTouched,
    isFieldValidating: this.isFieldValidating,
    isFieldsValidating: this.isFieldsValidating,
    resetFields: this.resetFields,
    setFields: this.setFields,
    setFieldValue: this.setFieldValue,
    setFieldsValue: this.setFieldsValue,
    validateFields: this.validateFields,
    submit: this.submit,
    _init: true,
    getInternalHooks: this.getInternalHooks,
  });

  // ======================== 内部 hooks ========================

  getInternalHooks = (key: string): InternalHooks | null => {
    if (key === HOOK_MARK) {
      this.formHooked = true;
      return {
        dispatch: this.dispatch,
        initEntityValue: this.initEntityValue,
        registerField: this.registerField,
        useSubscribe: this.useSubscribe,
        setInitialValues: this.setInitialValues,
        destroyForm: this.destroyForm,
        setCallbacks: this.setCallbacks,
        setValidateMessages: this.setValidateMessages,
        getFields: this.getFields,
        setPreserve: this.setPreserve,
        getInitialValue: this.getInitialValue,
        registerWatch: this.registerWatch,
      };
    }
    warning(false, '`getInternalHooks` is internal usage. Should not call directly.');
    return null;
  };

  useSubscribe = (subscribable: boolean): void => {
    this.subscribable = subscribable;
  };

  /** 首次 `setInitialValues` 要把初值灌进 store。 */
  setInitialValues = (initialValues: Store | undefined, init: boolean): void => {
    this.initialValues = initialValues || {};
    if (init) {
      let nextStore = merge(initialValues ?? {}, this.store);

      // 上一个 Form 卸载时 `preserve === false` 的字段：用 initialValues 回填。
      this.prevWithoutPreserves?.map(({ key: namePath }) => {
        nextStore = setValue(nextStore, namePath, getValue(initialValues, namePath));
        return null;
      });
      this.prevWithoutPreserves = null;
      this.updateStore(nextStore);
    }
  };

  destroyForm = (clearOnDestroy?: boolean): void => {
    if (clearOnDestroy) {
      this.updateStore({});
    } else {
      const prevWithoutPreserves = new NameMap<boolean>();
      this.getFieldEntities(true).forEach((entity) => {
        if (!this.isMergedPreserve(entity.isPreserve())) {
          prevWithoutPreserves.set(entity.getNamePath(), true);
        }
      });
      this.prevWithoutPreserves = prevWithoutPreserves;
    }
  };

  getInitialValue = (namePath: InternalNamePath): StoreValue => {
    const initValue = getValue(this.initialValues, namePath);
    // ⭐ 只在给了 `namePath` 时克隆 —— 无路径时直接返回引用（上游如此）。
    return namePath.length ? merge(initValue as Store) : initValue;
  };

  setCallbacks = (callbacks: Callbacks): void => {
    this.callbacks = callbacks;
  };

  setValidateMessages = (validateMessages: ValidateMessages | null): void => {
    this.validateMessages = validateMessages;
  };

  setPreserve = (preserve?: boolean): void => {
    this.preserve = preserve;
  };

  // ============================= Watch ============================

  registerWatch = (callback: WatchCallBack): (() => void) => this.watcherCenter.register(callback);

  notifyWatch = (namePath: InternalNamePath[] = []): void => {
    this.watcherCenter.notify(namePath);
  };

  // ========================== Dev Warning =========================

  /**
   * 「`useForm` 建了实例但没接到任何 `Form` 上」的告警。
   *
   * ⚠️ 三个条件缺一不可：dev、`timeoutId` 为空（去重）、`window` 存在（SSR 不打）。
   * 定时器**不传延迟**（⇒ 0），与上游一致。
   */
  private warningUnhooked = (): void => {
    if (isDev && !this.timeoutId && typeof window !== 'undefined') {
      this.timeoutId = setTimeout(() => {
        this.timeoutId = null;
        if (!this.formHooked) {
          warning(
            false,
            'Instance created by `useForm` is not connected to any Form element. Forget to pass `form` prop?',
          );
        }
      });
    }
  };

  // ============================ Store =============================

  private updateStore = (nextStore: Store): void => {
    this.store = nextStore;
  };

  // ============================ Fields ============================

  /** @param pure 只返回「有 name」的字段（默认 `false`）。 */
  private getFieldEntities = (pure = false): FieldEntity[] => {
    if (!pure) {
      return this.fieldEntities;
    }
    return this.fieldEntities.filter((field) => field.getNamePath().length);
  };

  private getFieldsMap = (pure = false): NameMap<FieldEntity> => {
    const cache = new NameMap<FieldEntity>();
    this.getFieldEntities(pure).forEach((field) => {
      cache.set(field.getNamePath(), field);
    });
    return cache;
  };

  private getFieldEntitiesForNamePathList = (
    nameList?: NamePath[] | null,
    includesSubNamePath = false,
  ): MaybeEntity[] => {
    if (!nameList) {
      return this.getFieldEntities(true);
    }
    const cache = this.getFieldsMap(true);
    if (!includesSubNamePath) {
      return nameList.map((name) => {
        const namePath = getNamePath(name);
        return cache.get(namePath) || { INVALIDATE_NAME_PATH: getNamePath(name) };
      });
    }
    // ⚠️ 必须显式给 `flatMap` 的元素类型 `MaybeEntity`：否则 TS 会把两个分支推成
    // `FieldEntity[] | InvalidateEntity[]`，而 `flatMap` 要的是
    // `U | readonly U[]` —— 两个数组分支都合法，联合起来反而不合法。
    return nameList.flatMap<MaybeEntity>((name) => {
      const namePath = getNamePath(name);
      const fields = cache.getAsPrefix(namePath);
      if (fields.length) {
        return fields;
      }
      return [{ INVALIDATE_NAME_PATH: namePath }];
    });
  };

  /**
   * 取表单值。四种入参见契约 §4.7.2。
   *
   * ⭐ `getFieldsValue(true)` **直接返回 `this.store` 引用**（不拷贝）；
   * ⭐ `Form.List` 为空时会把该路径补成 `[]`；
   * ⚠️ 传了 `filter` 时**连哨兵实体也参与过滤**（`filterFunc(null)`）—— 上游如此。
   */
  getFieldsValue = (
    nameList?: NamePath[] | true | GetFieldsValueConfig,
    filterFunc?: FilterFunc,
  ): StoreValue => {
    this.warningUnhooked();

    let mergedNameList: NamePath[] | true | undefined;
    let mergedFilterFunc: FilterFunc | undefined;
    if (nameList === true || Array.isArray(nameList)) {
      mergedNameList = nameList;
      mergedFilterFunc = filterFunc;
    } else if (nameList && typeof nameList === 'object') {
      mergedFilterFunc = nameList.filter;
    }
    if (mergedNameList === true && !mergedFilterFunc) {
      return this.store;
    }

    const fieldEntities = this.getFieldEntitiesForNamePathList(
      Array.isArray(mergedNameList) ? mergedNameList : null,
      true,
    );
    const filteredNameList: InternalNamePath[] = [];
    const listNamePaths: InternalNamePath[] = [];
    fieldEntities.forEach((entity) => {
      const invalidate = isInvalidateEntity(entity);
      const namePath = invalidate ? entity.INVALIDATE_NAME_PATH : entity.getNamePath();

      // `Form.List` 的路径不进 filteredNameList（父字段已经覆盖），单独收集。
      if (!invalidate && entity.isList?.()) {
        listNamePaths.push(namePath);
        return;
      }
      if (!mergedFilterFunc) {
        filteredNameList.push(namePath);
        return;
      }
      const meta = !invalidate && 'getMeta' in entity ? entity.getMeta() : null;
      if (mergedFilterFunc(meta)) {
        filteredNameList.push(namePath);
      }
    });
    let mergedValues: Store = cloneByNamePathList(this.store, filteredNameList.map(getNamePath));

    // `Form.List` 为空时补 `[]`
    listNamePaths.forEach((namePath) => {
      if (!getValue(mergedValues, namePath)) {
        mergedValues = setValue(mergedValues, namePath, []);
      }
    });
    return mergedValues;
  };

  getFieldValue = (name: NamePath): StoreValue => {
    this.warningUnhooked();
    const namePath = getNamePath(name);
    return getValue(this.store, namePath);
  };

  getFieldsError = (nameList?: NamePath[]): FieldError[] => {
    this.warningUnhooked();
    const fieldEntities = this.getFieldEntitiesForNamePathList(nameList);
    return fieldEntities.map((entity, index) => {
      if (!isInvalidateEntity(entity)) {
        return {
          name: entity.getNamePath(),
          errors: entity.getErrors(),
          warnings: entity.getWarnings(),
        };
      }
      return {
        name: getNamePath(nameList?.[index]),
        errors: [],
        warnings: [],
      };
    });
  };

  getFieldError = (name: NamePath): FieldError['errors'] => {
    this.warningUnhooked();
    const namePath = getNamePath(name);
    return this.getFieldsError([namePath])[0]?.errors ?? [];
  };

  getFieldWarning = (name: NamePath): FieldError['warnings'] => {
    this.warningUnhooked();
    const namePath = getNamePath(name);
    return this.getFieldsError([namePath])[0]?.warnings ?? [];
  };

  /**
   * ⚠️ **变参**（契约 §4.7.4）：
   * - 0 个 ⇒ 全部字段「有任一 touched」
   * - 1 个数组 ⇒ 这些路径里「有任一 touched」
   * - 1 个布尔 ⇒ 全部字段「全部 touched」（List 字段视为已 touched）
   * - 2 个 ⇒ `(nameList, allFieldsTouched)`
   */
  isFieldsTouched: FormInstance['isFieldsTouched'] = (...args: unknown[]): boolean => {
    this.warningUnhooked();
    const [arg0, arg1] = args;
    let namePathList: InternalNamePath[] | null;
    let isAllFieldsTouched = false;
    if (args.length === 0) {
      namePathList = null;
    } else if (args.length === 1) {
      if (Array.isArray(arg0)) {
        namePathList = arg0.map(getNamePath);
        isAllFieldsTouched = false;
      } else {
        namePathList = null;
        isAllFieldsTouched = Boolean(arg0);
      }
    } else {
      namePathList = (arg0 as NamePath[]).map(getNamePath);
      isAllFieldsTouched = Boolean(arg1);
    }
    const fieldEntities = this.getFieldEntities(true);
    const isFieldTouched = (field: FieldEntity): boolean => field.isFieldTouched();

    if (!namePathList) {
      return isAllFieldsTouched
        ? fieldEntities.every((entity) => isFieldTouched(entity) || entity.isList())
        : fieldEntities.some(isFieldTouched);
    }

    const mergedNamePathList = namePathList;
    const map = new NameMap<FieldEntity[]>();
    mergedNamePathList.forEach((shortNamePath) => {
      map.set(shortNamePath, []);
    });
    fieldEntities.forEach((field) => {
      const fieldNamePath = field.getNamePath();
      mergedNamePathList.forEach((shortNamePath) => {
        if (shortNamePath.every((nameUnit, i) => fieldNamePath[i] === nameUnit)) {
          map.update(shortNamePath, (list) => [...(list ?? []), field]);
        }
      });
    });

    const isNamePathListTouched = (entities: FieldEntity[]): boolean =>
      entities.some(isFieldTouched);
    const namePathListEntities = map.map(({ value }) => value);
    return isAllFieldsTouched
      ? namePathListEntities.every(isNamePathListTouched)
      : namePathListEntities.some(isNamePathListTouched);
  };

  isFieldTouched = (name: NamePath): boolean => {
    this.warningUnhooked();
    return this.isFieldsTouched([name]);
  };

  /**
   * ⚠️ 与 `isFieldsTouched` 的**不对称**：这里用 `getFieldEntities()`（全部字段），
   * 不是 `getFieldEntities(true)`。见契约 §4.7.4。
   */
  isFieldsValidating = (nameList?: NamePath[]): boolean => {
    this.warningUnhooked();
    const fieldEntities = this.getFieldEntities();
    if (!nameList) {
      return fieldEntities.some((testField) => testField.isFieldValidating());
    }
    const namePathList = nameList.map(getNamePath);
    return fieldEntities.some((testField) => {
      const fieldNamePath = testField.getNamePath();
      return (
        Boolean(containsNamePath(namePathList, fieldNamePath)) && testField.isFieldValidating()
      );
    });
  };

  isFieldValidating = (name: NamePath): boolean => {
    this.warningUnhooked();
    return this.isFieldsValidating([name]);
  };

  /** 用 Field 的 `initialValue` prop 重置值。见契约 §4.7.1。 */
  private resetWithFieldInitialValue = (
    info: { entities?: FieldEntity[]; namePathList?: InternalNamePath[]; skipExist?: boolean } = {},
  ): void => {
    type Record_ = { entity: FieldEntity; value: StoreValue };
    const cache = new NameMap<Set<Record_>>();
    const fieldEntities = this.getFieldEntities(true);
    fieldEntities.forEach((field) => {
      const { initialValue } = field.props;
      const namePath = field.getNamePath();
      if (initialValue !== undefined) {
        const records = cache.get(namePath) || new Set<Record_>();
        records.add({ entity: field, value: initialValue });
        cache.set(namePath, records);
      }
    });

    const resetWithFields = (entities: FieldEntity[]): void => {
      entities.forEach((field) => {
        const { initialValue } = field.props;
        if (initialValue === undefined) {
          return;
        }
        const namePath = field.getNamePath();
        const formInitialValue = this.getInitialValue(namePath);
        if (formInitialValue !== undefined) {
          // 与 Form 的 initialValues 冲突 ⇒ 告警且**不改值**
          warning(
            false,
            `Form already set 'initialValues' with path '${namePath.join('.')}'. Field can not overwrite it.`,
          );
        } else {
          const records = cache.get(namePath);
          if (records && records.size > 1) {
            warning(
              false,
              `Multiple Field with path '${namePath.join('.')}' set 'initialValue'. Can not decide which one to pick.`,
            );
          } else if (records) {
            const originValue = this.getFieldValue(namePath);
            const isListField = field.isListField();
            if (!isListField && (!info.skipExist || originValue === undefined)) {
              const first = [...records][0];
              if (first) {
                this.updateStore(setValue(this.store, namePath, first.value));
              }
            }
          }
        }
      });
    };

    let requiredFieldEntities: FieldEntity[];
    if (info.entities) {
      requiredFieldEntities = info.entities;
    } else if (info.namePathList) {
      requiredFieldEntities = [];
      info.namePathList.forEach((namePath) => {
        const records = cache.get(namePath);
        if (records) {
          requiredFieldEntities.push(...[...records].map((r) => r.entity));
        }
      });
    } else {
      requiredFieldEntities = fieldEntities;
    }
    resetWithFields(requiredFieldEntities);
  };

  resetFields = (nameList?: NamePath[]): void => {
    this.warningUnhooked();
    const prevStore = this.store;
    if (!nameList) {
      this.updateStore(merge(this.initialValues));
      this.resetWithFieldInitialValue();
      this.notifyObservers(prevStore, null, { type: 'reset' });
      this.notifyWatch();
      return;
    }

    const namePathList = nameList.map(getNamePath);
    namePathList.forEach((namePath) => {
      const initialValue = this.getInitialValue(namePath);
      this.updateStore(setValue(this.store, namePath, initialValue));
    });
    this.resetWithFieldInitialValue({ namePathList });
    this.notifyObservers(prevStore, namePathList, { type: 'reset' });
    this.notifyWatch(namePathList);
  };

  /**
   * ⚠️ `prevStore` 在**循环外只取一次** ⇒ 同一批多个字段变更时，每个
   * `notifyObservers` 拿到的都是**批前**的 store。见契约 §4.7.3。
   */
  setFields = (fields: FieldData[]): void => {
    this.warningUnhooked();
    const prevStore = this.store;
    const namePathList: InternalNamePath[] = [];
    fields.forEach((fieldData) => {
      const { name, ...data } = fieldData;
      const namePath = getNamePath(name);
      namePathList.push(namePath);

      if ('value' in data) {
        this.updateStore(setValue(this.store, namePath, data.value));
      }
      this.notifyObservers(prevStore, [namePath], { type: 'setField', data: fieldData });
    });
    this.notifyWatch(namePathList);
  };

  getFields = (): FieldData[] => {
    const entities = this.getFieldEntities(true);
    return entities.map((field) => {
      const namePath = field.getNamePath();
      const meta = field.getMeta();
      const fieldData: FieldData = {
        ...meta,
        name: namePath,
        value: this.getFieldValue(namePath),
      };
      Object.defineProperty(fieldData, 'originRCField', { value: true });
      return fieldData;
    });
  };

  /** 只在 Field 构造期调用 —— 避免拿到太晚的 `initialValue`。 */
  initEntityValue = (entity: FieldEntity): void => {
    const { initialValue } = entity.props;
    if (initialValue !== undefined) {
      const namePath = entity.getNamePath();
      const prevValue = getValue(this.store, namePath);
      if (prevValue === undefined) {
        this.updateStore(setValue(this.store, namePath, initialValue));
      }
    }
  };

  private isMergedPreserve = (fieldPreserve?: boolean): boolean => {
    const mergedPreserve = fieldPreserve !== undefined ? fieldPreserve : this.preserve;
    return mergedPreserve ?? true;
  };

  registerField = (entity: FieldEntity): FieldCancelRegister => {
    this.fieldEntities.push(entity);
    const namePath = entity.getNamePath();
    this.notifyWatch([namePath]);

    if (entity.props.initialValue !== undefined) {
      const prevStore = this.store;
      this.resetWithFieldInitialValue({ entities: [entity], skipExist: true });
      this.notifyObservers(prevStore, [entity.getNamePath()], {
        type: 'valueUpdate',
        source: 'internal',
      });
    }

    return (isListField?: boolean, preserve?: boolean, subNamePath: InternalNamePath = []) => {
      this.fieldEntities = this.fieldEntities.filter((item) => item !== entity);

      // `preserve === false` 时清掉 store 里的值
      if (!this.isMergedPreserve(preserve) && (!isListField || subNamePath.length > 1)) {
        const defaultValue = isListField ? undefined : this.getInitialValue(namePath);
        if (
          namePath.length &&
          this.getFieldValue(namePath) !== defaultValue &&
          this.fieldEntities.every((field) => !matchNamePath(field.getNamePath(), namePath))
        ) {
          const prevStore = this.store;
          // ⚠️ 第四个参数是 `removeIfUndefined`（`utils.set` 的语义）
          this.updateStore(setValue(prevStore, namePath, defaultValue, true));
          this.notifyObservers(prevStore, [namePath], { type: 'remove' });
          this.triggerDependenciesUpdate(prevStore, namePath);
        }
      }
      this.notifyWatch([namePath]);
    };
  };

  dispatch = (action: ReducerAction): void => {
    switch (action.type) {
      case 'updateValue': {
        this.updateValue(action.namePath, action.value);
        break;
      }
      case 'validateField': {
        this.validateFields([action.namePath], { triggerName: action.triggerName });
        break;
      }
      default:
      // 目前没有别的 action，什么都不做。
    }
  };

  private notifyObservers = (
    prevStore: Store,
    namePathList: InternalNamePath[] | null,
    info: NotifyInfo,
  ): void => {
    if (this.subscribable) {
      const mergedInfo = { ...info, store: this.getFieldsValue(true) as Store };
      this.getFieldEntities().forEach(({ onStoreChange }) => {
        onStoreChange(prevStore, namePathList, mergedInfo);
      });
    } else {
      this.forceRootUpdate();
    }
  };

  /**
   * 通知「依赖了 `namePath` 的子字段」。
   * ⚠️ 校验走 `delayFrame: true` —— 让 `useWatch` 动态改的 rules 先生效。
   */
  private triggerDependenciesUpdate = (
    prevStore: Store,
    namePath: InternalNamePath,
  ): InternalNamePath[] => {
    const childrenFields = this.getDependencyChildrenFields(namePath);
    if (childrenFields.length) {
      this.validateFields(childrenFields, { delayFrame: true });
    }
    this.notifyObservers(prevStore, childrenFields, {
      type: 'dependenciesUpdate',
      relatedFields: [namePath, ...childrenFields],
    });
    return childrenFields;
  };

  /** 单字段值变更的完整联动链。⚠️ 六步顺序**不可调换**，见契约 §4.7.6。 */
  private updateValue = (name: NamePath, value: StoreValue): void => {
    const namePath = getNamePath(name);
    const prevStore = this.store;
    this.updateStore(setValue(this.store, namePath, value));
    this.notifyObservers(prevStore, [namePath], { type: 'valueUpdate', source: 'internal' });
    this.notifyWatch([namePath]);

    const childrenFields = this.triggerDependenciesUpdate(prevStore, namePath);

    const { onValuesChange } = this.callbacks;
    if (onValuesChange) {
      const changedValues = cloneByNamePathList(this.store, [namePath]);
      const allValues = this.getFieldsValue() as Store;
      // ⭐ 刚变更的字段可能**还没注册** ⇒ `getFieldsValue()` 里没有它，这里补一下。
      const mergedAllValues = setValue(allValues, namePath, getValue(changedValues, namePath));
      onValuesChange(changedValues, mergedAllValues);
    }
    this.triggerOnFieldsChange([namePath, ...childrenFields]);
  };

  setFieldsValue = (store?: Store): void => {
    this.warningUnhooked();
    const prevStore = this.store;
    if (store) {
      this.updateStore(merge(this.store, store));
    }
    this.notifyObservers(prevStore, null, { type: 'valueUpdate', source: 'external' });
    this.notifyWatch();
  };

  setFieldValue = (name: NamePath, value: StoreValue): void => {
    this.setFields([{ name, value, errors: [], warnings: [], touched: true }]);
  };

  private getDependencyChildrenFields = (rootNamePath: InternalNamePath): InternalNamePath[] => {
    const children = new Set<FieldEntity>();
    const childrenFields: InternalNamePath[] = [];
    const dependencies2fields = new NameMap<Set<FieldEntity>>();

    this.getFieldEntities().forEach((field) => {
      const { dependencies } = field.props;
      (dependencies || []).forEach((dependency) => {
        const dependencyNamePath = getNamePath(dependency);
        dependencies2fields.update(dependencyNamePath, (fields = new Set<FieldEntity>()) => {
          fields.add(field);
          return fields;
        });
      });
    });
    const fillChildren = (namePath: InternalNamePath): void => {
      const fields = dependencies2fields.get(namePath) || new Set<FieldEntity>();
      fields.forEach((field) => {
        if (!children.has(field)) {
          children.add(field);
          const fieldNamePath = field.getNamePath();
          if (field.isFieldDirty() && fieldNamePath.length) {
            childrenFields.push(fieldNamePath);
            fillChildren(fieldNamePath);
          }
        }
      });
    };
    fillChildren(rootNamePath);
    return childrenFields;
  };

  private triggerOnFieldsChange = (
    namePathList: InternalNamePath[],
    filedErrors?: FieldError[],
  ): void => {
    const { onFieldsChange } = this.callbacks;
    if (onFieldsChange) {
      const fields = this.getFields();
      if (filedErrors) {
        const cache = new NameMap<FieldError['errors']>();
        filedErrors.forEach(({ name, errors }) => {
          cache.set(name, errors);
        });
        fields.forEach((field) => {
          field.errors = cache.get(field.name as InternalNamePath) || field.errors;
        });
      }
      const changedFields = fields.filter(({ name: fieldName }) =>
        Boolean(containsNamePath(namePathList, fieldName as InternalNamePath)),
      );
      if (changedFields.length) {
        onFieldsChange(changedFields, fields);
      }
    }
  };

  // =========================== Validate ===========================

  /**
   * 校验字段。完整编排见契约 §4.7.5。
   *
   * ⚠️ **从不抛同步异常**；失败只以 rejected promise 表达。
   * ⚠️ 上游的入参嗅探里有 `typeof arg1 === 'string'` 分支 —— 那个分支若真被走到
   * （`validateFields('a')`）会因 `'a'.map` 而**抛 TypeError**。类型面本来只允许数组，
   * 这里**照抄上游**（不"顺手修好"，否则行为就不再与上游一致），并在测试里钉住。
   */
  validateFields = (arg1?: unknown, arg2?: unknown): Promise<unknown> => {
    this.warningUnhooked();
    let nameList: NamePath[] | undefined;
    let options: Record<string, unknown> | undefined;
    if (Array.isArray(arg1) || typeof arg1 === 'string' || typeof arg2 === 'string') {
      nameList = arg1 as NamePath[];
      options = arg2 as Record<string, unknown>;
    } else {
      options = arg1 as Record<string, unknown>;
    }
    const provideNameList = !!nameList;
    // ⚠️ 判空用 `nameList` 而不是 `provideNameList` —— TS 不会从
    // `const provideNameList = !!nameList` 反推 `nameList` 非空。语义完全一致。
    const namePathList: InternalNamePath[] = nameList ? nameList.map(getNamePath) : [];
    // 与 namePathList 相同，但**不含** `Form.List` 的路径
    const finalValueNamePathList = [...namePathList];

    const promiseList: Promise<unknown>[] = [];

    const TMP_SPLIT = String(Date.now());
    const validateNamePathList = new Set<string>();
    const { recursive, dirty } = options || {};

    this.getFieldEntities(true).forEach((field) => {
      const fieldNamePath = field.getNamePath();

      if (!provideNameList) {
        // 是普通字段 ⇒ 直接加；是 List ⇒ 已有子字段路径时不加
        if (
          !field.isList() ||
          !namePathList.some((name) => matchNamePath(name, fieldNamePath, true))
        ) {
          finalValueNamePathList.push(fieldNamePath);
        }
        namePathList.push(fieldNamePath);
      }

      if (!field.props.rules?.length) {
        return;
      }
      if (dirty && !field.isFieldDirty()) {
        return;
      }
      validateNamePathList.add(fieldNamePath.join(TMP_SPLIT));

      if (!provideNameList || containsNamePath(namePathList, fieldNamePath, recursive as boolean)) {
        const promise = field.validateRules({
          validateMessages: {
            ...defaultValidateMessages,
            ...this.validateMessages,
          },
          ...options,
        });

        promiseList.push(
          promise
            .then(() => ({ name: fieldNamePath, errors: [], warnings: [] }))
            .catch((ruleErrors: { rule: { warningOnly?: boolean }; errors: unknown[] }[]) => {
              const mergedErrors: unknown[] = [];
              const mergedWarnings: unknown[] = [];
              ruleErrors.forEach?.(({ rule: { warningOnly }, errors }) => {
                if (warningOnly) {
                  mergedWarnings.push(...errors);
                } else {
                  mergedErrors.push(...errors);
                }
              });
              if (mergedErrors.length) {
                return Promise.reject({
                  name: fieldNamePath,
                  errors: mergedErrors,
                  warnings: mergedWarnings,
                });
              }
              return {
                name: fieldNamePath,
                errors: mergedErrors,
                warnings: mergedWarnings,
              };
            }),
        );
      }
    });

    const summaryPromise = allPromiseFinish(promiseList);
    this.lastValidatePromise = summaryPromise;

    // 通知「校验已结束」的字段（`validating` 状态要变）
    summaryPromise
      .catch((results) => results)
      .then((results) => {
        const resultNamePathList = (results as { name: InternalNamePath }[]).map(
          ({ name }) => name,
        );
        this.notifyObservers(this.store, resultNamePathList, { type: 'validateFinish' });
        this.triggerOnFieldsChange(resultNamePathList, results as FieldError[]);
      });

    const returnPromise = summaryPromise
      .then(() => {
        if (this.lastValidatePromise === summaryPromise) {
          return Promise.resolve(this.getFieldsValue(finalValueNamePathList));
        }
        return Promise.reject([]);
      })
      .catch((results: FieldError[]) => {
        const errorList = results.filter((result) => result?.errors.length);
        const errorMessage = errorList[0]?.errors?.[0];
        return Promise.reject({
          message: errorMessage,
          values: this.getFieldsValue(namePathList),
          errorFields: errorList,
          outOfDate: this.lastValidatePromise !== summaryPromise,
        });
      });

    // 不在控制台抛错
    returnPromise.catch((e) => e);

    const triggerNamePathList = namePathList.filter((namePath) =>
      validateNamePathList.has(namePath.join(TMP_SPLIT)),
    );
    this.triggerOnFieldsChange(triggerNamePathList);
    return returnPromise;
  };

  // ============================ Submit ============================

  submit = (): void => {
    this.warningUnhooked();
    this.validateFields()
      .then((values) => {
        const { onFinish } = this.callbacks;
        if (onFinish) {
          try {
            onFinish(values as Store);
          } catch (err) {
            // `onFinish` 自己抛错时只打印，不打断提交流程（上游如此）
            console.error(err);
          }
        }
      })
      .catch((e: ValidateErrorEntity) => {
        const { onFinishFailed } = this.callbacks;
        if (onFinishFailed) {
          onFinishFailed(e);
        }
      });
  };
}
