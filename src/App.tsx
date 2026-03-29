import { useEffect, useState } from 'react';
import Settings from './pages/Settings';
import {
  calculateEstimate,
  getDefaultExternalWallLength,
  type Bathrooms,
  type BuildingType,
  type FinishLevel,
} from './utils/calculation';

type ViewMode = 'estimate' | 'settings';

type FormState = {
  floor_area_m2: number;
  external_wall_length_m: number;
  building_type: BuildingType;
  bathrooms: Bathrooms;
  finish_level: FinishLevel;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-NZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('estimate');
  const [, setConfigVersion] = useState(0);
  const [form, setForm] = useState<FormState>(() => {
    const floorArea = 120;

    return {
      floor_area_m2: floorArea,
      external_wall_length_m: getDefaultExternalWallLength(floorArea),
      building_type: 'detached_house',
      bathrooms: '2',
      finish_level: 'standard',
    };
  });
  const [isExternalWallLengthManual, setIsExternalWallLengthManual] = useState(false);

  useEffect(() => {
    if (isExternalWallLengthManual) {
      return;
    }

    setForm((current) => {
      const nextExternalWallLength = getDefaultExternalWallLength(current.floor_area_m2);

      if (current.external_wall_length_m === nextExternalWallLength) {
        return current;
      }

      return {
        ...current,
        external_wall_length_m: nextExternalWallLength,
      };
    });
  }, [form.floor_area_m2, isExternalWallLengthManual]);

  const result = calculateEstimate(form);

  if (viewMode === 'settings') {
    return (
      <div className="app-shell">
        <Settings
          onBack={() => setViewMode('estimate')}
          onConfigChange={() => setConfigVersion((current) => current + 1)}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-card">
        <section className="panel panel-form">
          <div>
            <div className="panel-topline">
              <p className="eyebrow">FAST_BUILD_ESTIMATE</p>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setViewMode('settings')}
              >
                Settings
              </button>
            </div>
            <h1>Residential Interior Estimate Tool</h1>
            <p className="panel-copy">
              Front-end only estimator for lining, stopping, and paint ranges.
            </p>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>floor_area_m2</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.floor_area_m2}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    floor_area_m2: Number(event.target.value) || 0,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>external_wall_length_m</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.external_wall_length_m}
                onChange={(event) => {
                  setIsExternalWallLengthManual(true);
                  setForm((current) => ({
                    ...current,
                    external_wall_length_m: Number(event.target.value) || 0,
                  }));
                }}
              />
            </label>

            <p className="panel-copy">
              Default external wall length: {formatNumber(getDefaultExternalWallLength(form.floor_area_m2))} m
            </p>

            <label className="field">
              <span>building_type</span>
              <select
                value={form.building_type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    building_type: event.target.value as BuildingType,
                  }))
                }
              >
                <option value="detached_house">detached_house</option>
                <option value="townhouse">townhouse</option>
                <option value="duplex">duplex</option>
              </select>
            </label>

            <label className="field">
              <span>bathrooms</span>
              <select
                value={form.bathrooms}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bathrooms: event.target.value as Bathrooms,
                  }))
                }
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3_plus">3_plus</option>
              </select>
            </label>

            <label className="field">
              <span>finish_level</span>
              <select
                value={form.finish_level}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    finish_level: event.target.value as FinishLevel,
                  }))
                }
              >
                <option value="basic">basic</option>
                <option value="standard">standard</option>
                <option value="high_end">high_end</option>
              </select>
            </label>
          </div>
        </section>

        <section className="panel panel-result">
          <div className="result-header">
            <h2>Estimate Result</h2>
            <p>
              Wall area: {formatNumber(result.wallArea)} m2 | Ceiling area:{' '}
              {formatNumber(result.ceilingArea)} m2
            </p>
          </div>

          <div className="metric-grid">
            <div className="metric-card">
              <span>External wall area</span>
              <strong>{formatNumber(result.externalWallArea)} m2</strong>
            </div>
            <div className="metric-card">
              <span>Internal wall area</span>
              <strong>{formatNumber(result.internalWallArea)} m2</strong>
            </div>
            <div className="metric-card">
              <span>Total wall area</span>
              <strong>{formatNumber(result.wallArea)} m2</strong>
            </div>
            <div className="metric-card">
              <span>Ceiling area</span>
              <strong>{formatNumber(result.ceilingArea)} m2</strong>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Low</th>
                  <th>Mid</th>
                  <th>High</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>gib</td>
                  <td>{formatCurrency(result.gib.low)}</td>
                  <td>{formatCurrency(result.gib.mid)}</td>
                  <td>{formatCurrency(result.gib.high)}</td>
                </tr>
                <tr>
                  <td>stopping</td>
                  <td>{formatCurrency(result.stopping.low)}</td>
                  <td>{formatCurrency(result.stopping.mid)}</td>
                  <td>{formatCurrency(result.stopping.high)}</td>
                </tr>
                <tr>
                  <td>paint</td>
                  <td>{formatCurrency(result.paint.low)}</td>
                  <td>{formatCurrency(result.paint.mid)}</td>
                  <td>{formatCurrency(result.paint.high)}</td>
                </tr>
                <tr className="total-row">
                  <td>total</td>
                  <td>{formatCurrency(result.total.low)}</td>
                  <td>{formatCurrency(result.total.mid)}</td>
                  <td>{formatCurrency(result.total.high)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
