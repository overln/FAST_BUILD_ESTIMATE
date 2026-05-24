import type { ExternalCornerType, FinishLevel, IntertenancyWall } from './calculation';

export type Locale = 'en' | 'zh';

export const localeLabels: Record<Locale, string> = {
  en: 'EN',
  zh: '中文',
};

export const fieldOptionLabels = {
  finish: {
    en: {
      simple: 'simple',
      standard: 'standard',
      complex: 'complex',
    },
    zh: {
      simple: '简单',
      standard: '标准',
      complex: '复杂',
    },
  } satisfies Record<Locale, Record<FinishLevel, string>>,
  intertenancy: {
    en: {
      yes: 'yes',
      no: 'no',
    },
    zh: {
      yes: '有',
      no: '没有',
    },
  } satisfies Record<Locale, Record<IntertenancyWall, string>>,
  corner: {
    en: {
      standard: 'standard',
      premium: 'premium',
    },
    zh: {
      standard: '标准',
      premium: '升级',
    },
  } satisfies Record<Locale, Record<ExternalCornerType, string>>,
};
