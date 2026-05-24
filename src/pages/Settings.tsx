import { useState } from 'react';
import { defaultConfig, type AppConfig, type RateTriple } from '../config/defaultConfig';
import { getConfig, resetConfig, saveConfig } from '../utils/config';
import { extractPdfText, PdfReadError, summarizePdfQuote, type PdfQuoteSummary } from '../utils/pdf';
import { localeLabels, type Locale } from '../utils/i18n';

interface SettingsProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onBack: () => void;
  onConfigChange: () => void;
}

const formatCurrency = (value: number | null) => {
  if (value === null) return 'N/A';
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getScopedTotal = (summary: PdfQuoteSummary): number =>
  summary.fixing + summary.stopping + summary.squareStop + summary.corner + summary.paint + summary.render;

type RateKey = keyof AppConfig['rates'];

const rateRows: { key: RateKey; labelZh: string; labelEn: string; unit: string }[] = [
  { key: 'fixing',     labelZh: '定板 fixing',          labelEn: 'fixing',          unit: '$/m²' },
  { key: 'stopping',   labelZh: '批荡 stopping',         labelEn: 'stopping',        unit: '$/m²' },
  { key: 'paint',      labelZh: '油漆 paint',            labelEn: 'paint',           unit: '$/m²' },
  { key: 'squareStop', labelZh: '直角收口 square stop',   labelEn: 'square stop',     unit: '$/lm' },
  { key: 'corner',     labelZh: '外角 external corner',   labelEn: 'external corner', unit: '$/lm' },
  { key: 'render',     labelZh: 'Render',                labelEn: 'render',          unit: '$/m²' },
];

const isOrdered = (t: RateTriple) => t.low <= t.mid && t.mid <= t.high;

export default function Settings({ locale, onLocaleChange, onBack, onConfigChange }: SettingsProps) {
  const [config, setConfig] = useState<AppConfig>(() => getConfig());
  const [status, setStatus] = useState('');
  const [pdfSummary, setPdfSummary] = useState<PdfQuoteSummary | null>(null);
  const [pdfTextPreview, setPdfTextPreview] = useState('');

  const handleRateChange = (key: RateKey, tier: keyof RateTriple, raw: string) => {
    const value = parseFloat(raw);
    if (!Number.isFinite(value) || value < 0) return;
    setConfig((prev) => ({
      ...prev,
      rates: {
        ...prev.rates,
        [key]: { ...prev.rates[key], [tier]: value },
      },
    }));
  };

  const handleFactorChange = (
    field: 'square_stop_factor' | 'external_corner_factor',
    raw: string,
  ) => {
    const value = parseFloat(raw);
    if (!Number.isFinite(value) || value < 0) return;
    setConfig((prev) => ({
      ...prev,
      stoppingBreakdown: { ...prev.stoppingBreakdown, [field]: value },
    }));
  };

  const handlePremiumAddChange = (raw: string) => {
    const value = parseFloat(raw);
    if (!Number.isFinite(value) || value < 0) return;
    setConfig((prev) => ({
      ...prev,
      externalCorner: { ...prev.externalCorner, premium_add_rate: value },
    }));
  };

  const handleSave = () => {
    saveConfig(config);
    setStatus(locale === 'zh' ? '设置已保存。' : 'Settings saved.');
    onConfigChange();
  };

  const handleReset = () => {
    resetConfig();
    setConfig(structuredClone(defaultConfig));
    setPdfSummary(null);
    setPdfTextPreview('');
    setStatus(locale === 'zh' ? '已恢复为默认单价。' : 'Settings reset to defaults.');
    onConfigChange();
  };

  const handlePdfUpload = async (file: File | undefined) => {
    if (!file) return;
    setStatus(locale === 'zh' ? '正在读取 PDF...' : 'Reading PDF...');
    try {
      const text = await extractPdfText(file);
      const summary = summarizePdfQuote(text);
      setPdfSummary(summary);
      setPdfTextPreview(text.slice(0, 800));
      setStatus(
        locale === 'zh'
          ? 'PDF 已解析。请先查看摘要，再决定是否手动调整单价。'
          : 'PDF parsed. Review the summary before adjusting rates.',
      );
    } catch (error) {
      const message =
        error instanceof PdfReadError
          ? error.message
          : locale === 'zh'
            ? '无法读取这个 PDF。请换一个文件，或使用 calibration CSV 流程。'
            : 'Could not read this PDF. Try another file or use the calibration CSV workflow.';
      setStatus(message);
    }
  };

  const scopedTotal = pdfSummary ? getScopedTotal(pdfSummary) : null;
  const disorderedRows = rateRows.filter(({ key }) => !isOrdered(config.rates[key]));

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <p className="eyebrow">V2 SETTINGS</p>
          <h1>{locale === 'zh' ? '单价设置' : 'Unit Rate Settings'}</h1>
          <p className="panel-copy">
            {locale === 'zh'
              ? '直接填每个工种的低 / 中 / 高单价，面积由系统自动算。'
              : 'Set low / mid / high unit rates for each trade. Areas are calculated automatically.'}
          </p>
        </div>
        <div className="settings-actions">
          <div className="locale-switch" role="group" aria-label="Language switch">
            {(Object.keys(localeLabels) as Locale[]).map((value) => (
              <button
                key={value}
                type="button"
                className={`locale-button ${locale === value ? 'locale-button-active' : ''}`}
                onClick={() => onLocaleChange(value)}
              >
                {localeLabels[value]}
              </button>
            ))}
          </div>
          <button type="button" className="button button-secondary" onClick={onBack}>
            {locale === 'zh' ? '返回' : 'Back'}
          </button>
          <button type="button" className="button button-secondary" onClick={handleReset}>
            {locale === 'zh' ? '重置' : 'Reset'}
          </button>
          <button type="button" className="button" onClick={handleSave}>
            {locale === 'zh' ? '保存' : 'Save'}
          </button>
        </div>
      </div>

      {status ? <p className="status-note">{status}</p> : null}

      <div className="settings-grid">
        <section className="panel">
          <h2>{locale === 'zh' ? '各工种单价' : 'Unit Rates by Trade'}</h2>
          <p className="panel-copy">
            {locale === 'zh'
              ? '每行一个工种，直接输入 low / mid / high 单价（NZD）。保存后立即生效。'
              : 'One row per trade. Enter low / mid / high unit rates (NZD). Takes effect on save.'}
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{locale === 'zh' ? '工种' : 'Trade'}</th>
                  <th>{locale === 'zh' ? '单位' : 'Unit'}</th>
                  <th>{locale === 'zh' ? '低位' : 'Low'}</th>
                  <th>{locale === 'zh' ? '中位' : 'Mid'}</th>
                  <th>{locale === 'zh' ? '高位' : 'High'}</th>
                </tr>
              </thead>
              <tbody>
                {rateRows.map(({ key, labelZh, labelEn, unit }) => {
                  const bad = !isOrdered(config.rates[key]);
                  return (
                    <tr key={key} className={bad ? 'row-warn' : ''}>
                      <td>{locale === 'zh' ? labelZh : labelEn}</td>
                      <td>{unit}</td>
                      {(['low', 'mid', 'high'] as const).map((tier) => (
                        <td key={tier}>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            className="rate-input"
                            value={config.rates[key][tier]}
                            onChange={(e) => handleRateChange(key, tier, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {disorderedRows.length > 0 ? (
            <p className="warn-note">
              {locale === 'zh'
                ? `提示：${disorderedRows.map((r) => r.labelZh).join('、')} 的 low/mid/high 不是递增顺序。请检查。`
                : `Warning: ${disorderedRows.map((r) => r.labelEn).join(', ')} have low/mid/high out of order.`}
            </p>
          ) : null}
          <div className="extra-params">
            <label className="field">
              <span>{locale === 'zh' ? '直角收口长度系数 (lm/m²)' : 'Square stop factor (lm/m²)'}</span>
              <small>
                {locale === 'zh'
                  ? 'square_stop_length = floor_area × 此系数'
                  : 'square_stop_length = floor_area × this factor'}
              </small>
              <input
                type="number"
                min="0"
                step="0.05"
                value={config.stoppingBreakdown.square_stop_factor}
                onChange={(e) => handleFactorChange('square_stop_factor', e.target.value)}
              />
            </label>
            <label className="field">
              <span>{locale === 'zh' ? '外角长度系数 (lm/m²)' : 'External corner factor (lm/m²)'}</span>
              <small>
                {locale === 'zh'
                  ? 'external_corner_length = floor_area × 此系数'
                  : 'external_corner_length = floor_area × this factor'}
              </small>
              <input
                type="number"
                min="0"
                step="0.05"
                value={config.stoppingBreakdown.external_corner_factor}
                onChange={(e) => handleFactorChange('external_corner_factor', e.target.value)}
              />
            </label>
            <label className="field">
              <span>{locale === 'zh' ? '外角 premium 加价 ($/lm)' : 'Premium uplift ($/lm)'}</span>
              <small>
                {locale === 'zh'
                  ? '选择 premium 时，加在 corner low/mid/high 单价之上'
                  : 'Added to corner low/mid/high when premium is selected'}
              </small>
              <input
                type="number"
                min="0"
                step="0.5"
                value={config.externalCorner.premium_add_rate}
                onChange={(e) => handlePremiumAddChange(e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <h2>{locale === 'zh' ? '面积模型（只读）' : 'Area Model (read-only)'}</h2>
          <p className="panel-copy">
            {locale === 'zh'
              ? '这些系数控制由 floor_area 推出 wall / paint / fixing area。'
              : 'These factors derive wall / paint / fixing area from floor_area.'}
          </p>
          <div className="summary-list">
            <p>
              wall_area = floor_area × wallFactor — simple {config.wallFactor.simple} / standard{' '}
              {config.wallFactor.standard} / complex {config.wallFactor.complex}
            </p>
            <p>
              paint_area = (wall_area + ceiling_area) × paintFactor — simple{' '}
              {config.paintFactor.simple} / standard {config.paintFactor.standard} / complex{' '}
              {config.paintFactor.complex}
            </p>
            <p>
              {locale === 'zh' ? '分户墙乘数（同时影响 fixing 与 stopping）' : 'Intertenancy multiplier (affects both fixing and stopping)'}
              : {config.fixing.intertenancy_multiplier}
            </p>
          </div>
        </section>

        <section className="panel">
          <h2>{locale === 'zh' ? 'PDF 校准检查' : 'PDF Calibration Check'}</h2>
          <p className="panel-copy">
            {locale === 'zh'
              ? '上传报价 PDF，提取各工种实际金额，对比你的单价是否合理。'
              : 'Upload a quote PDF to extract trade amounts and check if your rates are in range.'}
          </p>
          <label className="field">
            <span>{locale === 'zh' ? 'quote_pdf / 报价文件' : 'quote_pdf'}</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => handlePdfUpload(event.target.files?.[0])}
            />
          </label>

          {pdfSummary ? (
            <div className="summary-list">
              <p>{locale === 'zh' ? 'Proposal 总价' : 'Proposal total'}: {formatCurrency(pdfSummary.proposalTotal)}</p>
              <p>{locale === 'zh' ? '模型范围提取总价' : 'Model-scope extracted total'}: {formatCurrency(scopedTotal)}</p>
              <p>Fixing: {formatCurrency(pdfSummary.fixing)}</p>
              <p>Stopping: {formatCurrency(pdfSummary.stopping)}</p>
              <p>Square stop: {formatCurrency(pdfSummary.squareStop)}</p>
              <p>External corner: {formatCurrency(pdfSummary.corner)}</p>
              <p>Paint: {formatCurrency(pdfSummary.paint)}</p>
              <p>Render: {formatCurrency(pdfSummary.render)}</p>
            </div>
          ) : null}
        </section>

        <section className="panel">
          <h2>{locale === 'zh' ? 'PDF 文本预览' : 'PDF Text Preview'}</h2>
          <p className="panel-copy">
            {locale === 'zh'
              ? '用这里确认 PDF 已被读取。更细的参数拟合仍然需要结构化 CSV 审核。'
              : 'Use this preview to confirm the PDF was read. Detailed rate fitting still needs structured CSV review.'}
          </p>
          <pre className="pdf-preview">{pdfTextPreview || (locale === 'zh' ? '还没有上传 PDF。' : 'No PDF uploaded yet.')}</pre>
        </section>
      </div>
    </div>
  );
}
