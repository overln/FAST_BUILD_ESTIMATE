import { defaultConfig, type AppConfig } from '../config/defaultConfig';

export type FinishLevel = 'simple' | 'standard' | 'complex';
export type IntertenancyWall = 'yes' | 'no';
export type ExternalCornerType = 'standard' | 'premium';

export interface EstimateInput {
  floor_area: number | '';
  finish_level: FinishLevel;
  intertenancy_wall: IntertenancyWall;
  external_corner_type?: ExternalCornerType;
  render_area: number | '';
}

export interface RangeValue {
  low: number;
  mid: number;
  high: number;
}

export interface EstimateResult {
  wallFactor: number;
  paintFactor: number;
  intertenancyMultiplier: number;
  externalCornerType: ExternalCornerType;
  cornerPremiumAdd: number;
  floorArea: number;
  wallArea: number;
  ceilingArea: number;
  fixingArea: number;
  stoppingArea: number;
  squareStopLength: number;
  externalCornerLength: number;
  paintArea: number;
  renderArea: number;
  fixing: RangeValue;
  stopping: RangeValue;
  squareStop: RangeValue;
  corner: RangeValue;
  paint: RangeValue;
  render: RangeValue;
  total: RangeValue;
}

const normalizePositiveNumber = (value: number | ''): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;

export const calculateEstimate = (
  input: EstimateInput,
  config: AppConfig = defaultConfig,
): EstimateResult => {
  const floorArea = normalizePositiveNumber(input.floor_area);
  const renderArea = normalizePositiveNumber(input.render_area);

  const wallFactor = config.wallFactor[input.finish_level];
  const paintFactor = config.paintFactor[input.finish_level];

  const wallArea = floorArea * wallFactor;
  const ceilingArea = floorArea;

  // Fixing covers both walls AND ceilings (plasterboard installation on all surfaces).
  // Intertenancy wall adds extra surface area — applied to both fixing and stopping.
  const intertenancyMultiplier =
    input.intertenancy_wall === 'yes' ? config.fixing.intertenancy_multiplier : 1;
  const fixingArea = (wallArea + ceilingArea) * intertenancyMultiplier;
  const stoppingArea = wallArea * intertenancyMultiplier;

  const squareStopLength = floorArea * config.stoppingBreakdown.square_stop_factor;
  const externalCornerLength = floorArea * config.stoppingBreakdown.external_corner_factor;
  const paintArea = (wallArea + ceilingArea) * paintFactor;

  const externalCornerType = input.external_corner_type ?? config.externalCorner.default_type;
  const cornerPremiumAdd =
    externalCornerType === 'premium' ? config.externalCorner.premium_add_rate : 0;

  const r = config.rates;
  const tier = <K extends keyof typeof r>(
    key: K,
    quantity: number,
    extraPerUnit = 0,
  ): RangeValue => ({
    low: quantity * (r[key].low + extraPerUnit),
    mid: quantity * (r[key].mid + extraPerUnit),
    high: quantity * (r[key].high + extraPerUnit),
  });

  const fixing = tier('fixing', fixingArea);
  const stopping = tier('stopping', stoppingArea);
  const squareStop = tier('squareStop', squareStopLength);
  const corner = tier('corner', externalCornerLength, cornerPremiumAdd);
  const paint = tier('paint', paintArea);
  const render = tier('render', renderArea);

  return {
    wallFactor,
    paintFactor,
    intertenancyMultiplier,
    externalCornerType,
    cornerPremiumAdd,
    floorArea,
    wallArea,
    ceilingArea,
    fixingArea,
    stoppingArea,
    squareStopLength,
    externalCornerLength,
    paintArea,
    renderArea,
    fixing,
    stopping,
    squareStop,
    corner,
    paint,
    render,
    total: {
      low:  fixing.low  + stopping.low  + squareStop.low  + corner.low  + paint.low  + render.low,
      mid:  fixing.mid  + stopping.mid  + squareStop.mid  + corner.mid  + paint.mid  + render.mid,
      high: fixing.high + stopping.high + squareStop.high + corner.high + paint.high + render.high,
    },
  };
};
