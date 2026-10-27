import {
  CheckableTag,
  CheckableTagGroup,
  type CheckableTagGroupProps,
  Tag,
  type TagConfig,
} from '@apollo-design/ui';
import type { CheckableTagGroup as DeepGroup, Tag as DeepTag } from '@apollo-design/ui/tag';
import { createApp } from 'vue';

const root: typeof DeepTag = Tag;
const group: typeof DeepGroup = CheckableTagGroup;
const staticGroup: typeof DeepGroup = Tag.CheckableTagGroup;
const staticChild: typeof CheckableTag = Tag.CheckableTag;
const config: TagConfig = {
  variant: 'outlined',
  closable: { disabled: true, 'aria-label': 'Remove' },
  styles: { content: { fontWeight: 600 } },
};
const multi: CheckableTagGroupProps<string, true> = { multiple: true, value: ['Books'] };
// @ts-expect-error A multiple published model accepts an array, not a scalar.
const wrong: CheckableTagGroupProps<string, true> = { multiple: true, value: 'Books' };
// @ts-expect-error Real group semantics do not include Tag's content region.
const wrongRegion: CheckableTagGroupProps = { styles: { content: { color: 'red' } } };
const app = createApp({ render: () => null });
app.use(Tag);
app.use(CheckableTag);
app.use(CheckableTagGroup);
void [root, group, staticGroup, staticChild, config, multi, wrong, wrongRegion];
