import { defaultConfig, type AppConfig } from '../config/defaultConfig';

const STORAGE_KEY = 'fast_build_estimate_config';

const cloneDefaultConfig = (): AppConfig => ({
  building: { ...defaultConfig.building },
  internalWallFactor: { ...defaultConfig.internalWallFactor },
  rates: { ...defaultConfig.rates },
  finishFactor: { ...defaultConfig.finishFactor },
  wetAreaFactor: { ...defaultConfig.wetAreaFactor },
  range: { ...defaultConfig.range },
});

const mergeConfig = (value: unknown): AppConfig => {
  if (!value || typeof value !== 'object') {
    return cloneDefaultConfig();
  }

  const parsed = value as Partial<AppConfig>;

  return {
    building: {
      ...defaultConfig.building,
      ...parsed.building,
    },
    internalWallFactor: {
      ...defaultConfig.internalWallFactor,
      ...parsed.internalWallFactor,
    },
    rates: {
      ...defaultConfig.rates,
      ...parsed.rates,
    },
    finishFactor: {
      ...defaultConfig.finishFactor,
      ...parsed.finishFactor,
    },
    wetAreaFactor: {
      ...defaultConfig.wetAreaFactor,
      ...parsed.wetAreaFactor,
    },
    range: {
      ...defaultConfig.range,
      ...parsed.range,
    },
  };
};

export const getConfig = (): AppConfig => {
  if (typeof window === 'undefined') {
    return cloneDefaultConfig();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return cloneDefaultConfig();
  }

  try {
    return mergeConfig(JSON.parse(raw));
  } catch {
    return cloneDefaultConfig();
  }
};

export const saveConfig = (config: AppConfig): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const resetConfig = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};
