import { defaultConfig, type AppConfig, type RateTriple } from '../config/defaultConfig';

const STORAGE_KEY = 'fast_build_estimate_config';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const safePositive = (value: unknown, fallback: number): number =>
  isFiniteNumber(value) && value >= 0 ? value : fallback;

const safeStrictlyPositive = (value: unknown, fallback: number): number =>
  isFiniteNumber(value) && value > 0 ? value : fallback;

const sanitizeTriple = (value: unknown, fallback: RateTriple): RateTriple => {
  const v = value && typeof value === 'object' ? (value as Partial<RateTriple>) : {};
  return {
    low:  safePositive(v.low,  fallback.low),
    mid:  safePositive(v.mid,  fallback.mid),
    high: safePositive(v.high, fallback.high),
  };
};

const mergeConfig = (value: unknown): AppConfig => {
  if (!value || typeof value !== 'object') {
    return structuredClone(defaultConfig);
  }

  const p = value as Partial<AppConfig>;
  const d = defaultConfig;

  return {
    wallFactor: {
      simple:   safeStrictlyPositive(p.wallFactor?.simple,   d.wallFactor.simple),
      standard: safeStrictlyPositive(p.wallFactor?.standard, d.wallFactor.standard),
      complex:  safeStrictlyPositive(p.wallFactor?.complex,  d.wallFactor.complex),
    },
    paintFactor: {
      simple:   safeStrictlyPositive(p.paintFactor?.simple,   d.paintFactor.simple),
      standard: safeStrictlyPositive(p.paintFactor?.standard, d.paintFactor.standard),
      complex:  safeStrictlyPositive(p.paintFactor?.complex,  d.paintFactor.complex),
    },
    fixing: {
      intertenancy_multiplier: safeStrictlyPositive(
        p.fixing?.intertenancy_multiplier,
        d.fixing.intertenancy_multiplier,
      ),
    },
    stoppingBreakdown: {
      square_stop_factor:    safePositive(p.stoppingBreakdown?.square_stop_factor,    d.stoppingBreakdown.square_stop_factor),
      external_corner_factor: safePositive(p.stoppingBreakdown?.external_corner_factor, d.stoppingBreakdown.external_corner_factor),
    },
    externalCorner: {
      default_type:
        p.externalCorner?.default_type === 'premium' || p.externalCorner?.default_type === 'standard'
          ? p.externalCorner.default_type
          : d.externalCorner.default_type,
      premium_add_rate: safePositive(p.externalCorner?.premium_add_rate, d.externalCorner.premium_add_rate),
    },
    rates: {
      fixing:     sanitizeTriple(p.rates?.fixing,     d.rates.fixing),
      stopping:   sanitizeTriple(p.rates?.stopping,   d.rates.stopping),
      squareStop: sanitizeTriple(p.rates?.squareStop, d.rates.squareStop),
      corner:     sanitizeTriple(p.rates?.corner,     d.rates.corner),
      paint:      sanitizeTriple(p.rates?.paint,      d.rates.paint),
      render:     sanitizeTriple(p.rates?.render,     d.rates.render),
    },
  };
};

export const getConfig = (): AppConfig => {
  if (typeof window === 'undefined') {
    return structuredClone(defaultConfig);
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return structuredClone(defaultConfig);
  }

  try {
    return mergeConfig(JSON.parse(raw));
  } catch {
    return structuredClone(defaultConfig);
  }
};

export const saveConfig = (config: AppConfig): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const resetConfig = (): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};
