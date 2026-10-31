import { expectTypeOf } from 'vitest';
import type { ConfigOptions, MessageInstance, MessageType } from '../../message/interface';
import type { ModalHookAPI, ModalHookInstance } from '../../modal/interface';
import type { NotificationConfig, NotificationInstance } from '../../notification/interface';
import type { AppConfig, UseAppProps } from '../app-context';

expectTypeOf<UseAppProps['message']>().toEqualTypeOf<MessageInstance>();
expectTypeOf<UseAppProps['notification']>().toEqualTypeOf<NotificationInstance>();
expectTypeOf<UseAppProps['modal']>().toEqualTypeOf<ModalHookAPI>();
expectTypeOf<AppConfig['message']>().toEqualTypeOf<ConfigOptions | undefined>();
expectTypeOf<AppConfig['notification']>().toEqualTypeOf<NotificationConfig | undefined>();

function contracts(api: UseAppProps) {
  expectTypeOf(api.message.success('Ready')).toEqualTypeOf<MessageType>();
  expectTypeOf(api.modal.confirm({ title: 'Confirm' })).toEqualTypeOf<ModalHookInstance>();
  // @ts-expect-error Message has a content API, not arbitrary methods.
  api.message.nonexistent();
  // @ts-expect-error Notification placement must be an actual supported placement.
  const config: AppConfig = { notification: { placement: 'somewhere' } };
  // @ts-expect-error Modal hook service requires a configuration object.
  api.modal.confirm('Confirm');
  return config;
}
void contracts;
