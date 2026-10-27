import {
  Avatar,
  type AvatarEmits,
  AvatarGroup,
  type AvatarGroupProps,
  type AvatarProps,
  type AvatarSlots,
} from '@apollo-design/ui';
import type { Avatar as DeepAvatar, AvatarGroup as DeepGroup } from '@apollo-design/ui/avatar';
import { createApp } from 'vue';

const root: typeof DeepAvatar = Avatar,
  group: typeof DeepGroup = AvatarGroup,
  child: typeof DeepGroup = Avatar.Group;
const props: AvatarProps = {
  size: { xs: 24, md: 48 },
  gap: 4,
  alt: 'Olivia',
  beforeFallback: (event) => event.type !== 'error',
};
const sideEffect = (_event: Event): void => {};
const sideEffectProps: AvatarProps = { beforeFallback: sideEffect };
const slots: AvatarSlots = {
  image: () => ['Image', 'Tail', 0],
  icon: () => ['Icon', 'Tail', 0],
  default: () => 'Default',
};
const click: AvatarEmits['click'] = [new MouseEvent('click')];
const onError = (event: Event) => event.type;
const app = createApp({ render: () => null });
app.use(Avatar);
app.use(AvatarGroup);
// @ts-expect-error the old Group alias is removed
const legacy: AvatarGroupProps = { maxCount: 2 };
// @ts-expect-error native click payload is MouseEvent
const badEvent: AvatarEmits['click'] = [new Event('click')];
// @ts-expect-error cancellation hooks are synchronous boolean or void
const asyncHook: AvatarProps = { beforeFallback: async () => false };
const refs = (avatar: InstanceType<typeof Avatar>, group: InstanceType<typeof AvatarGroup>) => {
  const span: HTMLSpanElement | null = avatar.nativeElement,
    div: HTMLDivElement | null = group.nativeElement;
  // @ts-expect-error private state is not exposed
  avatar.scale = 2;
  // @ts-expect-error private render implementation is not exposed
  group.groupChildren();
  return [span, div];
};
void [
  root,
  group,
  child,
  props,
  sideEffectProps,
  slots,
  click,
  onError,
  legacy,
  badEvent,
  asyncHook,
  refs,
];
