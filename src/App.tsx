import { useState } from 'react';
import Settings from './pages/Settings';
import {
  calculateEstimate,
  type ExternalCornerType,
  type FinishLevel,
  type IntertenancyWall,
} from './utils/calculation';
import { getConfig } from './utils/config';
import { fieldOptionLabels, localeLabels, type Locale } from './utils/i18n';

type ViewMode = 'estimate' | 'settings';

type FormState = {
  floor_area: number | '';
  finish_level: FinishLevel;
  intertenancy_wall: IntertenancyWall;
  external_corner_type: ExternalCornerType;
  render_area: number | '';
};

type NumericFormKey = 'floor_area' | 'render_area';

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

const parsePositiveNumber = (value: string): number => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export default function App() {
  const [config, setConfig] = useState(() => getConfig());
  const [viewMode, setViewMode] = useState<ViewMode>('estimate');
  const [locale, setLocale] = useState<Locale>('zh');
  const [form, setForm] = useState<FormState>({
    floor_area: 120,
    finish_level: 'standard',
    intertenancy_wall: 'no',
    external_corner_type: config.externalCorner.default_type,
    render_area: 0,
  });

  const result = calculateEstimate(form, config);

  const updateNumericField = (key: NumericFormKey, value: string) => {
    if (value === '') {
      setForm((current) => ({
        ...current,
        [key]: '',
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      [key]: parsePositiveNumber(value),
    }));
  };

  if (viewMode === 'settings') {
    return (
      <div className="app-shell">
        <Settings
          locale={locale}
          onLocaleChange={setLocale}
          onBack={() => setViewMode('estimate')}
          onConfigChange={() => setConfig(getConfig())}
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
              <p className="eyebrow">FAST_BUILD_ESTIMATE 1.0</p>
              <div className="topline-actions">
                <div className="locale-switch" role="group" aria-label="Language switch">
                  {(Object.keys(localeLabels) as Locale[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`locale-button ${locale === value ? 'locale-button-active' : ''}`}
                      onClick={() => setLocale(value)}
                    >
                      {localeLabels[value]}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setViewMode('settings')}
                >
                  {locale === 'zh' ? '设置' : 'Settings'}
                </button>
              </div>
            </div>
            <h1>{locale === 'zh' ? 'AI 报价工具' : 'AI Quote Tool'}</h1>
            <p className="panel-copy">
              {locale === 'zh'
                ? '使用极简输入，快速估算 fixing、stopping、油漆和可选 render。'
                : 'Minimal-input estimate for fixing, stopping, painting, and optional render.'}
            </p>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>{locale === 'zh' ? 'floor_area / 建筑面积' : 'floor_area'}</span>
              <small>
                {locale === 'zh' ? '使用室内建筑面积' : 'Use internal floor area'}
              </small>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.floor_area}
                onChange={(event) => updateNumericField('floor_area', event.target.value)}
              />
            </label>

            <label className="field">
              <span>{locale === 'zh' ? 'finish_level / 装修等级' : 'finish_level'}</span>
              <select
                value={form.finish_level}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    finish_level: event.target.value as FinishLevel,
                  }))
                }
              >
                <option value="simple">{fieldOptionLabels.finish[locale].simple}</option>
                <option value="standard">{fieldOptionLabels.finish[locale].standard}</option>
                <option value="complex">{fieldOptionLabels.finish[locale].complex}</option>
              </select>
            </label>

            <label className="field">
              <span>{locale === 'zh' ? 'intertenancy_wall / 分户墙' : 'intertenancy_wall'}</span>
              <select
                value={form.intertenancy_wall}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    intertenancy_wall: event.target.value as IntertenancyWall,
                  }))
                }
              >
                <option value="no">{fieldOptionLabels.intertenancy[locale].no}</option>
                <option value="yes">{fieldOptionLabels.intertenancy[locale].yes}</option>
              </select>
            </label>

            <label className="field">
              <span>
                {locale === 'zh' ? 'external_corner_type / 外角类型' : 'external_corner_type'}
              </span>
              <select
                value={form.external_corner_type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    external_corner_type: event.target.value as ExternalCornerType,
                  }))
                }
              >
                <option value="standard">{fieldOptionLabels.corner[locale].standard}</option>
                <option value="premium">{fieldOptionLabels.corner[locale].premium}</option>
              </select>
            </label>

            <label className="field">
              <span>{locale === 'zh' ? 'render_area / render 面积' : 'render_area'}</span>
              <small>
                {locale === 'zh'
                  ? '可选，不计入油漆面积。'
                  : 'Optional. Not included in paint area.'}
              </small>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.render_area}
                onChange={(event) => updateNumericField('render_area', event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="panel panel-result">
          <div className="result-header">
            <h2>{locale === 'zh' ? '估算结果' : 'Estimate Result'}</h2>
            <p>
              {locale === 'zh' ? '墙体系数' : 'Wall factor'}: {formatNumber(result.wallFactor)} |{' '}
              {locale === 'zh' ? '油漆系数' : 'Paint factor'}:{' '}
              {formatNumber(result.paintFactor)}
            </p>

          </div>

          <div className="metric-grid">
            <div className="metric-card">
              <span>{locale === 'zh' ? '天花面积' : 'Ceiling area'}</span>
              <strong>{formatNumber(result.ceilingArea)} m2</strong>
            </div>
            <div className="metric-card">
              <span>{locale === 'zh' ? '墙面面积' : 'Wall area'}</span>
              <strong>{formatNumber(result.wallArea)} m2</strong>
            </div>
            <div className="metric-card">
              <span>{locale === 'zh' ? '定板面积' : 'Fixing area'}</span>
              <strong>{formatNumber(result.fixingArea)} m2</strong>
            </div>
            <div className="metric-card">
              <span>{locale === 'zh' ? '批荡面积 stopping area' : 'Stopping area'}</span>
              <strong>{formatNumber(result.stoppingArea)} m2</strong>
            </div>
            <div className="metric-card">
              <span>{locale === 'zh' ? '直角收口长度' : 'Square stop length'}</span>
              <strong>{formatNumber(result.squareStopLength)} lm</strong>
            </div>
            <div className="metric-card">
              <span>{locale === 'zh' ? '外角长度' : 'External corner length'}</span>
              <strong>{formatNumber(result.externalCornerLength)} lm</strong>
            </div>
            <div className="metric-card">
              <span>{locale === 'zh' ? '油漆面积' : 'Paint area'}</span>
              <strong>{formatNumber(result.paintArea)} m2</strong>
            </div>
            <div className="metric-card">
              <span>{locale === 'zh' ? 'Render 面积' : 'Render area'}</span>
              <strong>{formatNumber(result.renderArea)} m2</strong>
            </div>
          </div>

          <div className="result-header">
            <p>
              {locale === 'zh' ? '外角类型' : 'External corner'}:{' '}
              {fieldOptionLabels.corner[locale][result.externalCornerType]}
              {result.cornerPremiumAdd > 0
                ? ` | +${formatCurrency(result.cornerPremiumAdd)} ${locale === 'zh' ? '/米 premium 加价' : '/lm premium uplift'}`
                : ''}
            </p>
            <p>
              {locale === 'zh' ? '分户墙' : 'Intertenancy wall'}:{' '}
              {fieldOptionLabels.intertenancy[locale][form.intertenancy_wall]}
              {form.intertenancy_wall === 'yes'
                ? ` | fixing x ${formatNumber(result.intertenancyMultiplier)}`
                : ''}
            </p>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{locale === 'zh' ? '项目' : 'Item'}</th>
                  <th>{locale === 'zh' ? '低位' : 'Low'}</th>
                  <th>{locale === 'zh' ? '中位' : 'Mid'}</th>
                  <th>{locale === 'zh' ? '高位' : 'High'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{locale === 'zh' ? '定板' : 'fixing'}</td>
                  <td>{formatCurrency(result.fixing.low)}</td>
                  <td>{formatCurrency(result.fixing.mid)}</td>
                  <td>{formatCurrency(result.fixing.high)}</td>
                </tr>
                <tr>
                  <td>{locale === 'zh' ? '批荡' : 'stopping'}</td>
                  <td>{formatCurrency(result.stopping.low)}</td>
                  <td>{formatCurrency(result.stopping.mid)}</td>
                  <td>{formatCurrency(result.stopping.high)}</td>
                </tr>
                <tr>
                  <td>{locale === 'zh' ? '直角收口' : 'square stop'}</td>
                  <td>{formatCurrency(result.squareStop.low)}</td>
                  <td>{formatCurrency(result.squareStop.mid)}</td>
                  <td>{formatCurrency(result.squareStop.high)}</td>
                </tr>
                <tr>
                  <td>{locale === 'zh' ? '外角' : 'external corner'}</td>
                  <td>{formatCurrency(result.corner.low)}</td>
                  <td>{formatCurrency(result.corner.mid)}</td>
                  <td>{formatCurrency(result.corner.high)}</td>
                </tr>
                <tr>
                  <td>{locale === 'zh' ? '油漆' : 'paint'}</td>
                  <td>{formatCurrency(result.paint.low)}</td>
                  <td>{formatCurrency(result.paint.mid)}</td>
                  <td>{formatCurrency(result.paint.high)}</td>
                </tr>
                <tr>
                  <td>{locale === 'zh' ? 'Render' : 'render'}</td>
                  <td>{formatCurrency(result.render.low)}</td>
                  <td>{formatCurrency(result.render.mid)}</td>
                  <td>{formatCurrency(result.render.high)}</td>
                </tr>
                <tr className="total-row">
                  <td>{locale === 'zh' ? '总价' : 'total'}</td>
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
