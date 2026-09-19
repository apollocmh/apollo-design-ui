// 手写窄声明：见同目录 dateUtil.d.ts 的说明。
import type { Dayjs } from 'dayjs';
import type { GenerateConfig } from '../../src/types';

declare const generateConfig: GenerateConfig<Dayjs>;

export default generateConfig;
