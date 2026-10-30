import {
  type FormInstance,
  getNamePath,
  type InternalNamePath,
  useForm as useCoreForm,
} from '@apollo-design/form-core';
import scrollIntoView from 'scroll-into-view-if-needed';
import { inject } from 'vue';
import { type FieldControl, formContextKey } from '../context';

type RegisterField = (name: InternalNamePath, instance: FieldControl) => () => void;
const registries = new WeakMap<object, RegisterField>();

function fieldElement(instance: FieldControl): Element | undefined {
  if (instance instanceof Element) return instance;
  if ('nativeElement' in instance && instance.nativeElement instanceof Element)
    return instance.nativeElement;
  if ('$el' in instance && instance.$el instanceof Element) return instance.$el;
  return undefined;
}

function focusControl(instance: FieldControl): void {
  if ('focus' in instance && typeof instance.focus === 'function') {
    instance.focus();
    return;
  }
  const element = fieldElement(instance);
  if (element && 'focus' in element && typeof element.focus === 'function') element.focus();
}

/** The UI and its public instance share one registry of actual Vue control refs. */
export function useFormWithRegistry<Values = unknown>(
  form?: FormInstance<Values>,
): {
  form: FormInstance<Values>;
  registerField: RegisterField;
} {
  const [coreForm] = useCoreForm<Values>(form);
  const existing = registries.get(coreForm);
  if (existing) return { form: coreForm, registerField: existing };

  const fields = new Map<string, { instance: FieldControl }>();
  const keyOf = (name: InternalNamePath): string => JSON.stringify(name);
  const registerField: RegisterField = (name, instance) => {
    const key = keyOf(name);
    const entry = { instance };
    fields.set(key, entry);
    return () => {
      if (fields.get(key) === entry) fields.delete(key);
    };
  };
  const currentField = (name: Parameters<FormInstance<Values>['getFieldValue']>[0]) =>
    fields.get(keyOf(getNamePath<Values>(name)))?.instance;

  const methods: Required<
    Pick<FormInstance<Values>, 'getFieldInstance' | 'focusField' | 'scrollToField'>
  > = {
    getFieldInstance: currentField,
    focusField: (name) => {
      const instance = currentField(name);
      if (instance) focusControl(instance);
    },
    scrollToField: (name, options = {}) => {
      const instance = currentField(name);
      if (!instance) return;
      const element = fieldElement(instance);
      if (!element) return;
      const { focus, ...scrollOptions } = options;
      scrollIntoView(element, { scrollMode: 'if-needed', block: 'nearest', ...scrollOptions });
      if (focus) focusControl(instance);
    },
  };
  Object.assign(coreForm, methods);
  registries.set(coreForm, registerField);
  return { form: coreForm, registerField };
}

export function useForm<Values = unknown>(form?: FormInstance<Values>): [FormInstance<Values>] {
  return [useFormWithRegistry(form).form];
}

/** Read the nearest mounted UI Form instead of creating a new store. */
export function useFormInstance(): FormInstance | undefined {
  return inject(formContextKey, undefined)?.form;
}
