/** Read the current Item/List prefix, with ConfigProvider fallback for standalone errors. */
import { inject } from 'vue';
import { useComponentConfig } from '../../config-provider/context';
import { type FormItemPrefixContextValue, formItemPrefixContextKey } from '../context';

export function useFormItemPrefixContext(): FormItemPrefixContextValue {
  const injected = inject(formItemPrefixContextKey, undefined);
  if (injected) return injected;
  const config = useComponentConfig('form');
  return {
    get prefixCls() {
      return config.getPrefixCls('form');
    },
  };
}
