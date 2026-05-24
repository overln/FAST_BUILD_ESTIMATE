import type { ExternalCornerType, FinishLevel } from '../utils/calculation';

export interface RateTriple {
  low: number;
  mid: number;
  high: number;
}

export interface AppConfig {
  /** Wall area = floor_area × wallFactor[finish_level] */
  wallFactor: Record<FinishLevel, number>;
  /** Paint area = (wall_area + ceiling_area) × paintFactor[finish_level] */
  paintFactor: Record<FinishLevel, number>;
  fixing: {
    intertenancy_multiplier: number;
  };
  stoppingBreakdown: {
    /** square_stop_length = floor_area × square_stop_factor (lm/m2) */
    square_stop_factor: number;
    /** external_corner_length = floor_area × external_corner_factor (lm/m2) */
    external_corner_factor: number;
  };
  externalCorner: {
    default_type: ExternalCornerType;
    /** Extra $/lm added to corner mid rate when type = premium */
    premium_add_rate: number;
  };
  /** Direct unit rates ($/m2 or $/lm) — low / mid / high */
  rates: {
    fixing: RateTriple;
    stopping: RateTriple;
    squareStop: RateTriple;
    corner: RateTriple;
    paint: RateTriple;
    render: RateTriple;
  };
}

export const defaultConfig: AppConfig = {
  wallFactor: {
    simple: 2.5,
    standard: 2.65,
    complex: 2.85,
  },
  paintFactor: {
    simple: 1.1,
    standard: 1.14,
    complex: 1.2,
  },
  fixing: {
    intertenancy_multiplier: 1.12,
  },
  stoppingBreakdown: {
    square_stop_factor: 1,
    external_corner_factor: 0.3,
  },
  externalCorner: {
    default_type: 'standard',
    premium_add_rate: 5,
  },
  rates: {
    fixing:    { low: 10, mid: 14, high: 18 },
    stopping:  { low: 14, mid: 19, high: 28 },
    squareStop:{ low: 8,  mid: 10, high: 14 },
    corner:    { low: 18, mid: 25, high: 32 },
    paint:     { low: 14, mid: 18, high: 26 },
    render:    { low: 15, mid: 18, high: 25 },
  },
};
