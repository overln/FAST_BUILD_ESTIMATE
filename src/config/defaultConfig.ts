import type {
  Bathrooms,
  BuildingType,
  FinishLevel,
} from '../utils/calculation';

export interface AppConfig {
  building: {
    wall_height: number;
    storey_factor: number;
  };
  internalWallFactor: Record<BuildingType, number>;
  rates: {
    gib_wall_rate: number;
    gib_ceiling_rate: number;
    stopping_wall_rate: number;
    stopping_ceiling_rate: number;
    paint_wall_rate: number;
    paint_ceiling_rate: number;
  };
  finishFactor: Record<FinishLevel, number>;
  wetAreaFactor: Record<Bathrooms, number>;
  range: {
    low_factor: number;
    high_factor: number;
  };
}

export const defaultConfig: AppConfig = {
  building: {
    wall_height: 2.4,
    storey_factor: 1.5,
  },
  internalWallFactor: {
    detached_house: 1.6,
    townhouse: 1.8,
    duplex: 1.7,
  },
  rates: {
    gib_wall_rate: 32,
    gib_ceiling_rate: 32,
    stopping_wall_rate: 12,
    stopping_ceiling_rate: 12,
    paint_wall_rate: 22,
    paint_ceiling_rate: 22,
  },
  finishFactor: {
    basic: 0.9,
    standard: 1.0,
    high_end: 1.2,
  },
  wetAreaFactor: {
    '1': 1.0,
    '2': 1.03,
    '3_plus': 1.06,
  },
  range: {
    low_factor: 0.9,
    high_factor: 1.15,
  },
};
