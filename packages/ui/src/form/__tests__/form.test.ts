import { mount } from '@vue/test-utils';
import { it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import Input from '../../input';
import { Form, FormItem, useForm } from '../index';

it('smoke: 校验流', async () => {
  const [formRef] = useForm();
  const App = defineComponent({
    setup() {
      return () =>
        h(
          Form as never,
          { form: formRef as never },
          {
            default: () =>
              h(
                FormItem as never,
                {
                  label: 'User',
                  name: 'user',
                  rules: [{ required: true, message: '必填' }],
                },
                { default: () => h(Input as never) },
              ),
          },
        );
    },
  });
  const w = mount(App);
  await nextTick();
  console.log('LABEL:', !!w.find('.apollo-form-item-label'));
  console.log('INPUT-ID:', w.find('input')?.attributes('id'));
  // 清空 → required 校验应失败
  formRef.setFieldsValue({ user: '' });
  let failed = false;
  try {
    await formRef.validateFields();
  } catch (err) {
    failed = true;
    console.log(
      'VALIDATE-FAIL:',
      JSON.stringify((err as { errorFields?: { errors: unknown[] }[] }).errorFields?.[0]?.errors),
    );
  }
  if (!failed) console.log('VALIDATE-UNEXPECTED-PASS');
  await new Promise((r) => setTimeout(r, 60));
  await nextTick();
  const addEl = w.find('.apollo-form-item-additional');
  console.log('ADDITIONAL:', addEl.exists() ? addEl.html().slice(0, 400) : 'NONE');
  const full = w.html();
  require('node:fs').writeFileSync('/tmp/form-html.txt', full);
  console.log(
    'EXPLAIN:',
    w.find('.apollo-form-item-explain-error').exists()
      ? w.find('.apollo-form-item-explain-error').text()
      : 'NONE',
  );
  console.log('HAS-ERROR:', w.find('.apollo-form-item-has-error').exists());
  const inputEl = w.find('input');
  console.log('ARIA:', inputEl.attributes('aria-invalid'), inputEl.attributes('aria-required'));
  // 填值 → 错误清除
  formRef.setFieldsValue({ user: 'x' });
  await formRef.validateFields().catch(() => console.log('SECOND-FAIL'));
  await new Promise((r) => setTimeout(r, 60));
  await nextTick();
  console.log('AFTER-FIX HAS-ERROR:', w.find('.apollo-form-item-has-error').exists());
  w.unmount();
}, 10000);
