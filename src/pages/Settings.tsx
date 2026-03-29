import { useState } from 'react';
import { defaultConfig, type AppConfig } from '../config/defaultConfig';
import { getConfig, resetConfig, saveConfig } from '../utils/config';

interface SettingsProps {
  onBack: () => void;
  onConfigChange: () => void;
}

const toNumber = (value: string): number => Number(value) || 0;

export default function Settings({ onBack, onConfigChange }: SettingsProps) {
  const [config, setConfig] = useState<AppConfig>(() => getConfig());
  const [status, setStatus] = useState('');

  const updateSection = <K extends keyof AppConfig>(
    section: K,
    key: keyof AppConfig[K],
    value: number,
  ) => {
    setConfig((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    saveConfig(config);
    setStatus('Settings saved.');
    onConfigChange();
  };

  const handleReset = () => {
    resetConfig();
    setConfig(defaultConfig);
    setStatus('Settings reset to default.');
    onConfigChange();
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <p className="eyebrow">ENGINEER SETTINGS</p>
          <h1>Engineer Settings</h1>
          <p className="panel-copy">
            Update assumptions, rates, and pricing factors used by the estimate.
          </p>
        </div>
        <div className="settings-actions">
          <button type="button" className="button button-secondary" onClick={onBack}>
            Back
          </button>
          <button type="button" className="button button-secondary" onClick={handleReset}>
            Reset
          </button>
          <button type="button" className="button" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>

      {status ? <p className="status-note">{status}</p> : null}

      <div className="settings-grid">
        <section className="panel">
          <h2>Building</h2>
          <div className="form-grid">
            <label className="field">
              <span>wall_height</span>
              <input
                type="number"
                step="0.01"
                value={config.building.wall_height}
                onChange={(event) =>
                  updateSection('building', 'wall_height', toNumber(event.target.value))
                }
              />
            </label>
            <label className="field">
              <span>storey_factor</span>
              <input
                type="number"
                step="0.01"
                value={config.building.storey_factor}
                onChange={(event) =>
                  updateSection('building', 'storey_factor', toNumber(event.target.value))
                }
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <h2>Internal Wall Factor</h2>
          <div className="form-grid">
            <label className="field">
              <span>detached_house</span>
              <input
                type="number"
                step="0.01"
                value={config.internalWallFactor.detached_house}
                onChange={(event) =>
                  updateSection(
                    'internalWallFactor',
                    'detached_house',
                    toNumber(event.target.value),
                  )
                }
              />
            </label>
            <label className="field">
              <span>townhouse</span>
              <input
                type="number"
                step="0.01"
                value={config.internalWallFactor.townhouse}
                onChange={(event) =>
                  updateSection('internalWallFactor', 'townhouse', toNumber(event.target.value))
                }
              />
            </label>
            <label className="field">
              <span>duplex</span>
              <input
                type="number"
                step="0.01"
                value={config.internalWallFactor.duplex}
                onChange={(event) =>
                  updateSection('internalWallFactor', 'duplex', toNumber(event.target.value))
                }
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <h2>Rates</h2>
          <div className="form-grid">
            <label className="field">
              <span>gib_wall_rate</span>
              <input
                type="number"
                step="0.01"
                value={config.rates.gib_wall_rate}
                onChange={(event) =>
                  updateSection('rates', 'gib_wall_rate', toNumber(event.target.value))
                }
              />
            </label>
            <label className="field">
              <span>gib_ceiling_rate</span>
              <input
                type="number"
                step="0.01"
                value={config.rates.gib_ceiling_rate}
                onChange={(event) =>
                  updateSection('rates', 'gib_ceiling_rate', toNumber(event.target.value))
                }
              />
            </label>
            <label className="field">
              <span>stopping_wall_rate</span>
              <input
                type="number"
                step="0.01"
                value={config.rates.stopping_wall_rate}
                onChange={(event) =>
                  updateSection('rates', 'stopping_wall_rate', toNumber(event.target.value))
                }
              />
            </label>
            <label className="field">
              <span>stopping_ceiling_rate</span>
              <input
                type="number"
                step="0.01"
                value={config.rates.stopping_ceiling_rate}
                onChange={(event) =>
                  updateSection('rates', 'stopping_ceiling_rate', toNumber(event.target.value))
                }
              />
            </label>
            <label className="field">
              <span>paint_wall_rate</span>
              <input
                type="number"
                step="0.01"
                value={config.rates.paint_wall_rate}
                onChange={(event) =>
                  updateSection('rates', 'paint_wall_rate', toNumber(event.target.value))
                }
              />
            </label>
            <label className="field">
              <span>paint_ceiling_rate</span>
              <input
                type="number"
                step="0.01"
                value={config.rates.paint_ceiling_rate}
                onChange={(event) =>
                  updateSection('rates', 'paint_ceiling_rate', toNumber(event.target.value))
                }
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <h2>Finish</h2>
          <div className="form-grid">
            <label className="field">
              <span>basic</span>
              <input
                type="number"
                step="0.01"
                value={config.finishFactor.basic}
                onChange={(event) =>
                  updateSection('finishFactor', 'basic', toNumber(event.target.value))
                }
              />
            </label>
            <label className="field">
              <span>standard</span>
              <input
                type="number"
                step="0.01"
                value={config.finishFactor.standard}
                onChange={(event) =>
                  updateSection('finishFactor', 'standard', toNumber(event.target.value))
                }
              />
            </label>
            <label className="field">
              <span>high_end</span>
              <input
                type="number"
                step="0.01"
                value={config.finishFactor.high_end}
                onChange={(event) =>
                  updateSection('finishFactor', 'high_end', toNumber(event.target.value))
                }
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <h2>Wet Area</h2>
          <div className="form-grid">
            <label className="field">
              <span>1</span>
              <input
                type="number"
                step="0.01"
                value={config.wetAreaFactor['1']}
                onChange={(event) =>
                  updateSection('wetAreaFactor', '1', toNumber(event.target.value))
                }
              />
            </label>
            <label className="field">
              <span>2</span>
              <input
                type="number"
                step="0.01"
                value={config.wetAreaFactor['2']}
                onChange={(event) =>
                  updateSection('wetAreaFactor', '2', toNumber(event.target.value))
                }
              />
            </label>
            <label className="field">
              <span>3_plus</span>
              <input
                type="number"
                step="0.01"
                value={config.wetAreaFactor['3_plus']}
                onChange={(event) =>
                  updateSection('wetAreaFactor', '3_plus', toNumber(event.target.value))
                }
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <h2>Range</h2>
          <div className="form-grid">
            <label className="field">
              <span>low_factor</span>
              <input
                type="number"
                step="0.01"
                value={config.range.low_factor}
                onChange={(event) =>
                  updateSection('range', 'low_factor', toNumber(event.target.value))
                }
              />
            </label>
            <label className="field">
              <span>high_factor</span>
              <input
                type="number"
                step="0.01"
                value={config.range.high_factor}
                onChange={(event) =>
                  updateSection('range', 'high_factor', toNumber(event.target.value))
                }
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
