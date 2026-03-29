import { getConfig } from './config';

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
  wallHeight: number;
  storeyFactor: number;
  baseInternalFactor: number;
  wetAreaFactor: number;
  externalWallArea: number;
  internalWallArea: number;
  wallArea: number;
  ceilingArea: number;
  totalLiningArea: number;
  gib: RangeValue;
  stopping: RangeValue;
  paint: RangeValue;
  total: RangeValue;
}

const createRangeValue = (
  wallArea: number,
  ceilingArea: number,
  wallRate: number,
  ceilingRate: number,
  finishFactor: number,
  wetAreaFactor: number,
  lowFactor: number,
  highFactor: number,
): RangeValue => {
  const mid =
    (wallArea * wallRate + ceilingArea * ceilingRate) *
    finishFactor *
    wetAreaFactor;

  return {
    low: mid * lowFactor,
    mid,
    high: mid * highFactor,
  };
};

export const getDefaultExternalWallLength = (floorAreaM2: number): number => {
  if (!Number.isFinite(floorAreaM2) || floorAreaM2 <= 0) {
    return 0;
  }

  return 4 * Math.sqrt(floorAreaM2);
};

export const calculateEstimate = (input: EstimateInput): EstimateResult => {
  const config = getConfig();
  const externalWallArea =
    input.external_wall_length_m *
    config.building.wall_height *
    config.building.storey_factor;
  const baseInternalFactor = config.internalWallFactor[input.building_type];
  const internalWallArea = externalWallArea * baseInternalFactor;
  const wallArea = externalWallArea + internalWallArea;
  const ceilingArea = input.floor_area_m2;
  const totalLiningArea = wallArea + ceilingArea;
  const finishFactor = config.finishFactor[input.finish_level];
  const wetAreaFactor = config.wetAreaFactor[input.bathrooms];

  const gib = createRangeValue(
    wallArea,
    ceilingArea,
    config.rates.gib_wall_rate,
    config.rates.gib_ceiling_rate,
    finishFactor,
    wetAreaFactor,
    config.range.low_factor,
    config.range.high_factor,
  );
  const stopping = createRangeValue(
    wallArea,
    ceilingArea,
    config.rates.stopping_wall_rate,
    config.rates.stopping_ceiling_rate,
    finishFactor,
    wetAreaFactor,
    config.range.low_factor,
    config.range.high_factor,
  );
  const paint = createRangeValue(
    wallArea,
    ceilingArea,
    config.rates.paint_wall_rate,
    config.rates.paint_ceiling_rate,
    finishFactor,
    wetAreaFactor,
    config.range.low_factor,
    config.range.high_factor,
  );

  return {
    wallHeight: config.building.wall_height,
    storeyFactor: config.building.storey_factor,
    baseInternalFactor,
    wetAreaFactor,
    externalWallArea,
    internalWallArea,
    wallArea,
    ceilingArea,
    totalLiningArea,
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
