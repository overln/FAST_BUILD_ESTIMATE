export type BuildingType = 'detached_house' | 'townhouse' | 'duplex';
export type Bathrooms = '1' | '2' | '3_plus';
export type FinishLevel = 'basic' | 'standard' | 'high_end';

export interface EstimateInput {
  floor_area_m2: number;
  external_wall_length_m: number;
  building_type: BuildingType;
  bathrooms: Bathrooms;
  finish_level: FinishLevel;
}

export interface RangeValue {
  low: number;
  mid: number;
  high: number;
}

export interface EstimateResult {
  wall_height: number;
  storey_factor: number;
  external_wall_area: number;
  internal_wall_factor: number;
  internal_wall_area: number;
  ceiling_area: number;
  total_lining_area: number;
  gib: RangeValue;
  stopping: RangeValue;
  paint: RangeValue;
  total: RangeValue;
}

const WALL_HEIGHT = 2.4;
const STOREY_FACTOR = 1.5;

const BASE_INTERNAL_FACTOR: Record<BuildingType, number> = {
  detached_house: 1.6,
  townhouse: 1.8,
  duplex: 1.7,
};

const BATHROOM_ADJUSTMENT: Record<Bathrooms, number> = {
  '1': 0,
  '2': 0.05,
  '3_plus': 0.1,
};

const UNIT_RATES = {
  gib: 32,
  stopping: 12,
  paint: 22,
} as const;

const FINISH_FACTOR: Record<FinishLevel, number> = {
  basic: 0.9,
  standard: 1.0,
  high_end: 1.2,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const createRangeValue = (area: number, unitRate: number, finishFactor: number): RangeValue => {
  const mid = area * unitRate * finishFactor;

  return {
    low: mid * 0.9,
    mid,
    high: mid * 1.15,
  };
};

export const getDefaultExternalWallLength = (floorAreaM2: number): number => {
  if (!Number.isFinite(floorAreaM2) || floorAreaM2 <= 0) {
    return 0;
  }

  return 4 * Math.sqrt(floorAreaM2);
};

export const calculateEstimate = (input: EstimateInput): EstimateResult => {
  const external_wall_area =
    input.external_wall_length_m * WALL_HEIGHT * STOREY_FACTOR;

  const internal_wall_factor = clamp(
    BASE_INTERNAL_FACTOR[input.building_type] + BATHROOM_ADJUSTMENT[input.bathrooms],
    1.4,
    2.2,
  );

  const internal_wall_area = external_wall_area * internal_wall_factor;
  const ceiling_area = input.floor_area_m2;
  const total_lining_area = external_wall_area + internal_wall_area + ceiling_area;
  const finishFactor = FINISH_FACTOR[input.finish_level];

  const gib = createRangeValue(total_lining_area, UNIT_RATES.gib, finishFactor);
  const stopping = createRangeValue(total_lining_area, UNIT_RATES.stopping, finishFactor);
  const paint = createRangeValue(total_lining_area, UNIT_RATES.paint, finishFactor);

  return {
    wall_height: WALL_HEIGHT,
    storey_factor: STOREY_FACTOR,
    external_wall_area,
    internal_wall_factor,
    internal_wall_area,
    ceiling_area,
    total_lining_area,
    gib,
    stopping,
    paint,
    total: {
      low: gib.low + stopping.low + paint.low,
      mid: gib.mid + stopping.mid + paint.mid,
      high: gib.high + stopping.high + paint.high,
    },
  };
};
