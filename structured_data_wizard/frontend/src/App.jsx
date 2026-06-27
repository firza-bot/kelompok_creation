import React, { useState, useEffect, useRef, useMemo } from 'react';


// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const BACKEND_URL =
  window.BACKEND_URL !== undefined ? window.BACKEND_URL : 'http://localhost:8000';

const STEPS = [
  { id: 1, name: 'Problem Framing' },
  { id: 2, name: 'Dataset Definition' },
  { id: 3, name: 'Processing' },
  { id: 4, name: 'Model Planning' },
  { id: 5, name: 'Engine Execution' },
];

// ─────────────────────────────────────────────
// UTILITY: destroy chart safely
// ─────────────────────────────────────────────
function destroyChart(id) {
  if (window.Chart) {
    const existing = window.Chart.getChart(id);
    if (existing) existing.destroy();
  }
}

// ─────────────────────────────────────────────
// UTILITY: compute numeric columns
// ─────────────────────────────────────────────
function getNumericCols(columns, rows) {
  return columns.filter((col) =>
    rows.slice(0, 20).every((r) => !isNaN(parseFloat(r[col])))
  );
}

// ─────────────────────────────────────────────
// STEP SIDEBAR
// ─────────────────────────────────────────────
function StepSidebar({ currentStep, completedSteps }) {
  return (
    <div className="wizard-sidebar">
      {STEPS.map((step, idx) => {
        const isCompleted = completedSteps.includes(step.id);
        const isActive = currentStep === step.id;
        return (
          <div key={step.id} className="sidebar-step">
            <div className="step-connector-wrap">
              <div
                className={`step-circle ${
                  isCompleted
                    ? 'step-circle--completed'
                    : isActive
                    ? 'step-circle--active'
                    : 'step-circle--pending'
                }`}
              >
                {isCompleted ? '✓' : step.id}
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`step-line ${
                    isCompleted ? 'step-line--completed' : ''
                  }`}
                />
              )}
            </div>
            <span
              className={`step-label ${isActive ? 'step-label--active' : ''}`}
            >
              {step.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// STEP 1 — PROBLEM FRAMING
// ─────────────────────────────────────────────
function Step1({ state, onChange }) {
  const { problemType, systemName, inputDescription, primaryOutcome } = state;

  const types = [
    {
      id: 'classification',
      label: 'Classification',
      desc: 'Predict discrete categories',
    },
    {
      id: 'regression',
      label: 'Regression',
      desc: 'Predict continuous values',
    },
    {
      id: 'clustering',
      label: 'Clustering',
      desc: 'Group similar data points',
    },
  ];

  return (
    <div className="step-content">
      <h2 className="section-title">01 PROBLEM FRAMING</h2>

      <div className="form-group">
        <label className="form-label">SELECT PROBLEM TYPE</label>
        <div className="radio-card-group">
          {types.map((t) => (
            <div
              key={t.id}
              className={`radio-card ${
                problemType === t.id ? 'radio-card--selected' : ''
              }`}
              onClick={() => onChange('problemType', t.id)}
            >
              <div className="radio-card-label">{t.label}</div>
              <div className="radio-card-desc">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">SYSTEM NAME</label>
        <input
          className="form-input"
          type="text"
          placeholder="e.g. Customer Churn Predictor"
          value={systemName}
          onChange={(e) => onChange('systemName', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">INPUT DATA DESCRIPTION</label>
        <textarea
          className="form-textarea"
          rows={4}
          placeholder="Describe your input data, source, and context..."
          value={inputDescription}
          onChange={(e) => onChange('inputDescription', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">PRIMARY OUTCOME</label>
        <input
          className="form-input"
          type="text"
          placeholder="e.g. Predict whether a customer will churn"
          value={primaryOutcome}
          onChange={(e) => onChange('primaryOutcome', e.target.value)}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STEP 2 — DATASET DEFINITION
// ─────────────────────────────────────────────
function Step2({ state, onChange, onDatasetLoaded, isLoading, error }) {
  const {
    datasetName,
    requiredFeatures,
    targetColumn,
    jumlahData,
    datasetSource,
    csvFile,
    problemType,
  } = state;

  return (
    <div className="step-content">
      <h2 className="section-title">02 DATASET DEFINITION</h2>

      <div className="form-group">
        <label className="form-label">DATASET NAME</label>
        <input
          className="form-input"
          type="text"
          placeholder="e.g. customer_transactions"
          value={datasetName}
          onChange={(e) => onChange('datasetName', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">REQUIRED FEATURES</label>
        <input
          className="form-input"
          type="text"
          placeholder="Comma-separated column names, e.g. age, income, tenure"
          value={requiredFeatures}
          onChange={(e) => onChange('requiredFeatures', e.target.value)}
        />
      </div>

      {problemType !== 'clustering' && (
        <div className="form-group">
          <label className="form-label">TARGET COLUMN</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. churn"
            value={targetColumn}
            onChange={(e) => onChange('targetColumn', e.target.value)}
          />
        </div>
      )}

      <div className="form-group">
        <label className="form-label">JUMLAH DATA</label>
        <input
          className="form-input"
          type="number"
          min={100}
          max={100000}
          value={jumlahData}
          onChange={(e) => onChange('jumlahData', Number(e.target.value))}
        />
      </div>

      <div className="form-group">
        <label className="form-label">DATASET SOURCE</label>
        <div className="radio-card-group">
          <div
            className={`radio-card ${
              datasetSource === 'api' ? 'radio-card--selected' : ''
            }`}
            onClick={() => onChange('datasetSource', 'api')}
          >
            <div className="radio-card-label">REQUEST FROM API</div>
            <div className="radio-card-desc">
              Synthetically generate dataset based on your schema
            </div>
          </div>
          <div
            className={`radio-card ${
              datasetSource === 'manual' ? 'radio-card--selected' : ''
            }`}
            onClick={() => onChange('datasetSource', 'manual')}
          >
            <div className="radio-card-label">MANUAL UPLOAD</div>
            <div className="radio-card-desc">Upload your own CSV file</div>
          </div>
        </div>
      </div>

      {datasetSource === 'manual' && (
        <div className="form-group">
          <label className="form-label">UPLOAD CSV FILE</label>
          <input
            className="form-input"
            type="file"
            accept=".csv"
            onChange={(e) => onChange('csvFile', e.target.files[0] || null)}
          />
          {csvFile && (
            <p className="form-hint">Selected: {csvFile.name}</p>
          )}
        </div>
      )}

      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          <span>Loading dataset...</span>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// DATA PREVIEW TABLE
// ─────────────────────────────────────────────
function DataTable({ columns, head, tail, label }) {
  return (
    <div className="data-table-wrap">
      {label && <div className="table-label">{label}</div>}
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {head.map((row, i) => (
              <tr key={`h-${i}`}>
                {columns.map((col) => (
                  <td key={col}>{String(row[col] ?? '')}</td>
                ))}
              </tr>
            ))}
            {tail && tail.length > 0 && (
              <>
                <tr className="table-divider-row">
                  <td colSpan={columns.length}>... TAIL ...</td>
                </tr>
                {tail.map((row, i) => (
                  <tr key={`t-${i}`}>
                    {columns.map((col) => (
                      <td key={col}>{String(row[col] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCATTER CHART
// ─────────────────────────────────────────────
function ScatterPlot({ processedRows, columns }) {
  const numericCols = useMemo(() => getNumericCols(columns, processedRows), [columns, processedRows]);
  const [xCol, setXCol] = useState('');
  const [yCol, setYCol] = useState('');

  // Sync selected columns when numeric columns list changes
  useEffect(() => {
    if (numericCols.length > 0) {
      const defaultX = numericCols[0] || '';
      const defaultY = numericCols[1] || numericCols[0] || '';
      
      if (!xCol || !numericCols.includes(xCol)) {
        setXCol(defaultX);
      }
      if (!yCol || !numericCols.includes(yCol)) {
        setYCol(defaultY);
      }
    } else {
      setXCol('');
      setYCol('');
    }
  }, [numericCols]);

  useEffect(() => {
    if (!xCol || !yCol || !processedRows.length) return;
    try {
      destroyChart('scatterChart');
      const points = processedRows
        .map((r) => ({ x: parseFloat(r[xCol]), y: parseFloat(r[yCol]) }))
        .filter((p) => !isNaN(p.x) && !isNaN(p.y));
      
      const ctx = document.getElementById('scatterChart');
      if (!ctx) return;

      new window.Chart(ctx, {
        type: 'scatter',
        data: {
          datasets: [{ data: points, pointRadius: 3 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { title: { display: true, text: xCol } },
            y: { title: { display: true, text: yCol } },
          },
        },
      });
    } catch (err) {
      console.error('Error creating scatter chart:', err);
    }
  }, [xCol, yCol, processedRows]);

  const swap = () => {
    const tmp = xCol;
    setXCol(yCol);
    setYCol(tmp);
  };

  if (numericCols.length === 0) {
    return (
      <div className="chart-section">
        <div className="chart-title">SCATTER PLOT</div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#a0aec0' }}>
          No numerical columns available for Scatter Plot. Try checking "Convert text to numerical vectors" (Categorical Encoding) to convert text fields into numbers.
        </div>
      </div>
    );
  }

  return (
    <div className="chart-section">
      <div className="chart-title">SCATTER PLOT</div>
      <div className="axis-selector-row">
        <div className="form-group-inline">
          <label className="form-label-sm">X Axis</label>
          <select
            className="form-select-sm"
            value={xCol}
            onChange={(e) => setXCol(e.target.value)}
          >
            {numericCols.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <button className="btn-swap" onClick={swap}>
          ⇄ Swap
        </button>
        <div className="form-group-inline">
          <label className="form-label-sm">Y Axis</label>
          <select
            className="form-select-sm"
            value={yCol}
            onChange={(e) => setYCol(e.target.value)}
          >
            {numericCols.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ position: 'relative', width: '100%', height: '320px' }}>
        <canvas id="scatterChart" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HISTOGRAM
// ─────────────────────────────────────────────
function buildHistogram(canvasId, col, processedRows) {
  try {
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas || !processedRows || !processedRows.length) return;

    // Check if column is numeric
    const isNumeric = processedRows.slice(0, 20).every((r) => {
      const val = r[col];
      if (val === null || val === undefined || val === '') return true;
      return !isNaN(parseFloat(val));
    });

    if (isNumeric) {
      const values = processedRows
        .map((r) => parseFloat(r[col]))
        .filter((v) => !isNaN(v));
      if (!values.length) return;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const binWidth = (max - min) / 10 || 1;
      const bins = Array.from({ length: 10 }, (_, i) =>
        +(min + i * binWidth + binWidth / 2).toFixed(1)
      );
      const counts = new Array(10).fill(0);
      values.forEach((v) => {
        const idx = Math.min(Math.floor((v - min) / binWidth), 9);
        if (idx >= 0) counts[idx]++;
      });
      new window.Chart(canvas, {
        type: 'bar',
        data: {
          labels: bins,
          datasets: [{ data: counts, barPercentage: 0.95, categoryPercentage: 1.0 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              title: { display: true, text: col },
              grid: { display: false },
            },
            y: {
              title: { display: true, text: 'Count' },
              beginAtZero: true,
            },
          },
        },
      });
    } else {
      // Categorical column frequency count
      const freq = {};
      processedRows.forEach((r) => {
        const val = r[col] !== null && r[col] !== undefined && r[col] !== '' ? String(r[col]) : 'Missing';
        freq[val] = (freq[val] || 0) + 1;
      });

      // Sort and take top 10 categories
      const sortedFreq = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const labels = sortedFreq.map(([k]) => k);
      const data = sortedFreq.map(([, v]) => v);

      new window.Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{ data: data, barPercentage: 0.95, categoryPercentage: 1.0 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              title: { display: true, text: `${col} (Top ${labels.length} Cats)` },
              grid: { display: false },
            },
            y: {
              title: { display: true, text: 'Count' },
              beginAtZero: true,
            },
          },
        },
      });
    }
  } catch (err) {
    console.error('Error rendering histogram for ' + col + ':', err);
  }
}

function Histograms({ processedRows, columns }) {
  const [colA, setColA] = useState('');
  const [colB, setColB] = useState('');

  // Sync selected columns when columns list changes
  useEffect(() => {
    if (columns.length > 0) {
      const defaultA = columns[0] || '';
      const defaultB = columns[1] || columns[0] || '';
      
      if (!colA || !columns.includes(colA)) {
        setColA(defaultA);
      }
      if (!colB || !columns.includes(colB)) {
        setColB(defaultB);
      }
    } else {
      setColA('');
      setColB('');
    }
  }, [columns]);

  useEffect(() => {
    if (colA && processedRows.length) buildHistogram('histA', colA, processedRows);
  }, [colA, processedRows]);

  useEffect(() => {
    if (colB && processedRows.length) buildHistogram('histB', colB, processedRows);
  }, [colB, processedRows]);

  if (columns.length === 0) {
    return (
      <div className="chart-section">
        <div className="chart-title">HISTOGRAM — FEATURE DISTRIBUTION</div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#a0aec0' }}>
          No columns available for Histograms.
        </div>
      </div>
    );
  }

  return (
    <div className="chart-section">
      <div className="chart-title">HISTOGRAM — FEATURE DISTRIBUTION</div>
      <div className="histogram-pair">
        <div className="histogram-item">
          <div className="form-group-inline">
            <label className="form-label-sm">Column A</label>
            <select
              className="form-select-sm"
              value={colA}
              onChange={(e) => setColA(e.target.value)}
            >
              {columns.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div style={{ position: 'relative', width: '100%', height: '280px' }}>
            <canvas id="histA" />
          </div>
        </div>
        <div className="histogram-item">
          <div className="form-group-inline">
            <label className="form-label-sm">Column B</label>
            <select
              className="form-select-sm"
              value={colB}
              onChange={(e) => setColB(e.target.value)}
            >
              {columns.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div style={{ position: 'relative', width: '100%', height: '280px' }}>
            <canvas id="histB" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BOX PLOT
// ─────────────────────────────────────────────
function getBoxStats(col, processedRows) {
  const vals = processedRows
    .map((r) => parseFloat(r[col]))
    .filter((v) => !isNaN(v))
    .sort((a, b) => a - b);
  if (!vals.length) return { min: 0, q1: 0, median: 0, q3: 0, max: 0, items: [] };
  const q1 = vals[Math.floor(vals.length * 0.25)] || 0;
  const median = vals[Math.floor(vals.length * 0.5)] || 0;
  const q3 = vals[Math.floor(vals.length * 0.75)] || 0;
  return { min: vals[0], q1, median, q3, max: vals[vals.length - 1], items: vals };
}

function BoxPlot({ processedRows, columns }) {
  const numericCols = useMemo(() => getNumericCols(columns, processedRows), [columns, processedRows]);
  const [selectedCol, setSelectedCol] = useState('');

  // Sync selected column when numeric columns list changes
  useEffect(() => {
    if (numericCols.length > 0) {
      const defaultCol = numericCols[0] || '';
      if (!selectedCol || !numericCols.includes(selectedCol)) {
        setSelectedCol(defaultCol);
      }
    } else {
      setSelectedCol('');
    }
  }, [numericCols]);

  useEffect(() => {
    if (!selectedCol || !processedRows.length) return;
    try {
      destroyChart('boxPlot');
      const ctx = document.getElementById('boxPlot');
      if (!ctx) return;
      const stats = getBoxStats(selectedCol, processedRows);
      
      new window.Chart(ctx, {
        type: 'boxplot',
        data: {
          labels: [selectedCol],
          datasets: [{ label: selectedCol, data: [stats] }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { title: { display: true, text: selectedCol } },
          },
        },
      });
    } catch (err) {
      console.error('Error creating box plot:', err);
    }
  }, [selectedCol, processedRows]);

  if (numericCols.length === 0) {
    return (
      <div className="chart-section">
        <div className="chart-title">BOX PLOT</div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#a0aec0' }}>
          No numerical columns available for Box Plot. Try checking "Convert text to numerical vectors" (Categorical Encoding) to convert text fields into numbers.
        </div>
      </div>
    );
  }

  return (
    <div className="chart-section">
      <div className="chart-title">BOX PLOT</div>
      <div className="form-group-inline">
        <label className="form-label-sm">Column</label>
        <select
          className="form-select-sm"
          value={selectedCol}
          onChange={(e) => setSelectedCol(e.target.value)}
        >
          {numericCols.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div style={{ position: 'relative', width: '100%', height: '280px' }}>
        <canvas id="boxPlot" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STEP 3 — PROCESSING
// ─────────────────────────────────────────────
function Step3({
  state,
  onChange,
  onProcess,
  isProcessing,
  processedRows,
  processedColumns,
  processStats,
  duplicateCount,
  previewHead,
  previewTail,
}) {
  const {
    missingValueStrategy,
    duplicateStrategy,
    categoricalEncoding,
    applyStandardization,
    requiredFeatures,
    targetColumn,
    jumlahData,
  } = state;

  const hasProcessed = processedRows && processedRows.length > 0;
  const chartRows = hasProcessed
    ? processedRows
    : (previewHead || []).concat(previewTail || []);

  // Cleanup charts when leaving step / on unmount
  useEffect(() => {
    return () => {
      ['scatterChart', 'histA', 'histB', 'boxPlot'].forEach(destroyChart);
    };
  }, []);

  return (
    <div className="step-content">
      <h2 className="section-title">03 PROCESSING</h2>

      {/* A: Requirement Summary */}
      <div className="summary-card">
        <div className="summary-card-title">REQUIREMENT SUMMARY</div>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-key">Jumlah Data</span>
            <span className="summary-val">{jumlahData}</span>
          </div>
          <div className="summary-item">
            <span className="summary-key">Target Column</span>
            <span className="summary-val">{targetColumn || '—'}</span>
          </div>
          <div className="summary-item">
            <span className="summary-key">Required Features</span>
            <span className="summary-val">{requiredFeatures || '—'}</span>
          </div>
        </div>
      </div>

      {/* B: Data Preview Raw */}
      {previewHead && previewHead.length > 0 && (
        <DataTable
          columns={processedColumns.length ? processedColumns : Object.keys(previewHead[0] || {})}
          head={previewHead}
          tail={previewTail}
          label="DATA PREVIEW — RAW (BEFORE PROCESSING)"
        />
      )}

      {/* Feature Descriptions Table */}
      {previewHead && previewHead.length > 0 && (
        <div className="processing-card" style={{ marginTop: '20px', marginBottom: '20px' }}>
          <div className="processing-card-title">FEATURE DESCRIPTIONS / DESKRIPSI FITUR</div>
          <p className="form-hint" style={{ marginBottom: '15px' }}>
            Sesuaikan deskripsi atau contoh nilai untuk masing-masing fitur di bawah ini. Deskripsi ini akan dicantumkan pada laporan akhir.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '10px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--muted)', width: '40%' }}>NAMA FITUR / KOLOM</th>
                  <th style={{ padding: '10px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--muted)', width: '60%' }}>DESKRIPSI / CONTOH NILAI</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(previewHead[0] || {})
                  .filter(col => !col.startsWith('_'))
                  .map(col => {
                    const val = state.featureDescriptions?.[col] || '';
                    return (
                      <tr key={col} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px 10px', fontWeight: '600', fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
                          {col.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="text"
                            className="form-input"
                            style={{ width: '100%', padding: '6px 12px', fontSize: '13px', margin: 0, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)' }}
                            value={val}
                            placeholder={`Contoh atau deskripsi untuk ${col}...`}
                            onChange={(e) => {
                              const newDescs = { ...state.featureDescriptions, [col]: e.target.value };
                              onChange('featureDescriptions', newDescs);
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* C: Processing Decisions */}
      <div className="processing-card">
        <div className="processing-card-title">PROCESSING DECISIONS</div>

        <div className="form-group">
          <label className="form-label">MISSING VALUES</label>
          <select
            className="form-select"
            value={missingValueStrategy}
            onChange={(e) => onChange('missingValueStrategy', e.target.value)}
          >
            <option>Drop blank rows</option>
            <option>Fill with mean</option>
            <option>Fill with median</option>
            <option>Fill with mode</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            DUPLICATE STRATEGY{' '}
            {duplicateCount > 0 && (
              <span className="badge">{duplicateCount} duplicates</span>
            )}
          </label>
          <select
            className="form-select"
            value={duplicateStrategy}
            onChange={(e) => onChange('duplicateStrategy', e.target.value)}
          >
            <option>Keep Duplicates</option>
            <option>Drop Duplicates</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">CATEGORICAL ENCODING</label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={categoricalEncoding}
              onChange={(e) => onChange('categoricalEncoding', e.target.checked)}
            />
            <span>Convert text to numerical vectors</span>
          </label>
        </div>

        <div className="form-group">
          <label className="form-label">APPLY STANDARDIZATION</label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={applyStandardization}
              onChange={(e) => onChange('applyStandardization', e.target.checked)}
            />
            <span>Recommended for distance-based models</span>
          </label>
        </div>

        <button
          className="btn-process"
          onClick={onProcess}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <span className="spinner" /> Processing...
            </>
          ) : (
            'Run Processing'
          )}
        </button>
      </div>

      {/* D: Analysis Results */}
      {/* D1: Processed Preview (only after processing) */}
      {hasProcessed && (
        <DataTable
          columns={processedColumns}
          head={processedRows.slice(0, 5)}
          tail={processedRows.slice(-5)}
          label="DATA PREVIEW — AFTER PROCESSING"
        />
      )}

      {/* D2: Scatter Plot */}
      <ScatterPlot processedRows={chartRows} columns={processedColumns} />

      {/* D3: Histograms */}
      <Histograms processedRows={chartRows} columns={processedColumns} />

      {/* D4: Box Plot */}
      <BoxPlot processedRows={chartRows} columns={processedColumns} />
    </div>
  );
}

// ─────────────────────────────────────────────
// STEP 4 — MODEL PLANNING
// ─────────────────────────────────────────────
function Step4({ state, onChange }) {
  const { algorithm, hyperparams } = state;

  const setParam = (key, val) => {
    onChange('hyperparams', { ...hyperparams, [key]: val });
  };

  return (
    <div className="step-content">
      <h2 className="section-title">04 MODEL PLANNING</h2>

      <div className="form-group">
        <label className="form-label">SELECT ALGORITHM</label>
        <select
          className="form-select"
          value={algorithm}
          onChange={(e) => onChange('algorithm', e.target.value)}
        >
          <option>Logistic Regression</option>
          <option>Decision Tree</option>
          <option>Random Forest</option>
          <option>XGBoost</option>
        </select>
      </div>

      <div className="params-card">
        <div className="params-card-title">CONFIGURE PARAMETERS</div>

        {algorithm === 'Logistic Regression' && (
          <>
            <div className="param-row">
              <label className="param-label">C (Regularization)</label>
              <input
                className="param-input"
                type="number"
                step="0.1"
                value={hyperparams.C}
                onChange={(e) => setParam('C', parseFloat(e.target.value))}
              />
            </div>
            <div className="param-row">
              <label className="param-label">Max Iterations</label>
              <input
                className="param-input"
                type="number"
                value={hyperparams.max_iter}
                onChange={(e) => setParam('max_iter', parseInt(e.target.value))}
              />
            </div>
            <div className="param-row">
              <label className="param-label">Penalty</label>
              <select
                className="param-select"
                value={hyperparams.penalty}
                onChange={(e) => setParam('penalty', e.target.value)}
              >
                <option value="l2">l2</option>
                <option value="l1">l1</option>
                <option value="elasticnet">elasticnet</option>
                <option value="none">none</option>
              </select>
            </div>
            <div className="param-row">
              <label className="param-label">Solver</label>
              <select
                className="param-select"
                value={hyperparams.solver}
                onChange={(e) => setParam('solver', e.target.value)}
              >
                <option value="lbfgs">lbfgs</option>
                <option value="liblinear">liblinear</option>
                <option value="saga">saga</option>
              </select>
            </div>
          </>
        )}

        {algorithm === 'Decision Tree' && (
          <>
            <div className="param-row">
              <label className="param-label">Max Depth</label>
              <input
                className="param-input"
                type="number"
                placeholder="None"
                value={hyperparams.max_depth || ''}
                onChange={(e) =>
                  setParam('max_depth', e.target.value ? parseInt(e.target.value) : '')
                }
              />
            </div>
            <div className="param-row">
              <label className="param-label">Min Samples Split</label>
              <input
                className="param-input"
                type="number"
                value={hyperparams.min_samples_split}
                onChange={(e) =>
                  setParam('min_samples_split', parseInt(e.target.value))
                }
              />
            </div>
            <div className="param-row">
              <label className="param-label">Criterion</label>
              <select
                className="param-select"
                value={hyperparams.criterion}
                onChange={(e) => setParam('criterion', e.target.value)}
              >
                <option value="gini">gini</option>
                <option value="entropy">entropy</option>
              </select>
            </div>
          </>
        )}

        {algorithm === 'Random Forest' && (
          <>
            <div className="param-row">
              <label className="param-label">N Estimators</label>
              <input
                className="param-input"
                type="number"
                value={hyperparams.n_estimators}
                onChange={(e) =>
                  setParam('n_estimators', parseInt(e.target.value))
                }
              />
            </div>
            <div className="param-row">
              <label className="param-label">Max Depth</label>
              <input
                className="param-input"
                type="number"
                placeholder="None"
                value={hyperparams.max_depth || ''}
                onChange={(e) =>
                  setParam('max_depth', e.target.value ? parseInt(e.target.value) : '')
                }
              />
            </div>
            <div className="param-row">
              <label className="param-label">Min Samples Split</label>
              <input
                className="param-input"
                type="number"
                value={hyperparams.min_samples_split}
                onChange={(e) =>
                  setParam('min_samples_split', parseInt(e.target.value))
                }
              />
            </div>
          </>
        )}

        {algorithm === 'XGBoost' && (
          <>
            <div className="param-row">
              <label className="param-label">N Estimators</label>
              <input
                className="param-input"
                type="number"
                value={hyperparams.n_estimators}
                onChange={(e) =>
                  setParam('n_estimators', parseInt(e.target.value))
                }
              />
            </div>
            <div className="param-row">
              <label className="param-label">Learning Rate</label>
              <input
                className="param-input"
                type="number"
                step="0.01"
                value={hyperparams.learning_rate}
                onChange={(e) =>
                  setParam('learning_rate', parseFloat(e.target.value))
                }
              />
            </div>
            <div className="param-row">
              <label className="param-label">Max Depth</label>
              <input
                className="param-input"
                type="number"
                value={hyperparams.max_depth || 6}
                onChange={(e) =>
                  setParam('max_depth', parseInt(e.target.value))
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FEATURE IMPORTANCE CHART
// ─────────────────────────────────────────────
function FeatureImportanceChart({ featureImportances }) {
  useEffect(() => {
    if (!featureImportances || !featureImportances.length) return;
    destroyChart('featureImportance');
    const labels = featureImportances.map((f) => f.feature);
    const values = featureImportances.map((f) => f.importance);
    new window.Chart(document.getElementById('featureImportance'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{ data: values, barPercentage: 0.6 }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Importance' }, beginAtZero: true },
        },
      },
    });
  }, [featureImportances]);

  return (
    <div className="chart-section">
      <div className="chart-title">FEATURE IMPORTANCE</div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: `${Math.max(200, (featureImportances?.length || 4) * 36)}px`,
        }}
      >
        <canvas id="featureImportance" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CONFUSION MATRIX
// ─────────────────────────────────────────────
function ConfusionMatrix({ matrix }) {
  if (!matrix || !matrix.length) return null;
  return (
    <div className="confusion-wrap">
      <div className="chart-title">CONFUSION MATRIX</div>
      <table className="confusion-table">
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              {row.map((val, j) => (
                <td
                  key={j}
                  className={`confusion-cell ${
                    i === j ? 'confusion-cell--diag' : ''
                  }`}
                >
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────
// STEP 5 — ENGINE EXECUTION
// ─────────────────────────────────────────────
function Step5({
  trainingStatus,
  trainingProgress,
  trainingError,
  trainingResult,
  jobId,
  onDownload,
  onCopyEndpoint,
}) {
  const isPending =
    trainingStatus === 'pending' || trainingStatus === 'running';
  const isComplete = trainingStatus === 'complete';
  const isError = trainingStatus === 'error';

  // 1. Executive dashboard summary details
  const accuracyText = trainingResult?.accuracy !== undefined
    ? `${trainingResult.accuracy.toFixed(1)}%`
    : '—';
  
  const probType = trainingResult?.model_summary?.problem_type || '';
  const performanceText = trainingResult?.accuracy !== undefined
    ? (trainingResult.accuracy > 90 ? 'Excellent' : (trainingResult.accuracy > 75 ? 'Good' : 'Needs Tuning'))
    : '—';
    
  const performanceColor = performanceText === 'Excellent'
    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    : (performanceText === 'Good' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10');

  const healthRating = trainingResult?.data_quality_report?.health_rating || 'Good';
  const healthColor = healthRating === 'Excellent'
    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    : (healthRating === 'Good' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10');

  const topFeature = trainingResult?.feature_importances?.[0]?.feature || '—';

  // 2. Data quality warning triggers
  const missingValPct = trainingResult?.data_quality_report?.missing_values_pct || 0;
  const duplicateValPct = trainingResult?.data_quality_report?.duplicate_rows_pct || 0;
  const showMissingWarning = missingValPct > 20;
  const showDuplicateWarning = duplicateValPct > 30;

  // 3. API request & response mock examples
  const apiUrl = `/api/predict/${jobId}`;
  const curlExample = `curl -X POST ${BACKEND_URL}${apiUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "features": {
      "${topFeature}": "value"
    }
  }'`;

  const pythonExample = `import requests

url = "${BACKEND_URL}${apiUrl}"
data = {
    "features": {
        "${topFeature}": "value"
    }
}
response = requests.post(url, json=data)
print(response.json())`;

  const responseExample = `{
  "prediction": "Japanese Rubber",
  "confidence": "94.2%"
}`;

  return (
    <div className="step-content">
      <h2 className="section-title">05 ENGINE EXECUTION</h2>

      {isPending && (
        <div className="training-pending flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="spinner spinner--lg border-t-purple-500 mb-4 animate-spin" />
          <p className="training-msg font-medium text-slate-300">
            Awaiting dataset ingestion... Please do not navigate away.
          </p>
          {trainingProgress > 0 && (
            <div className="progress-bar-wrap w-64 h-2 bg-slate-800 rounded-full mt-4 overflow-hidden">
              <div
                className="progress-bar h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${trainingProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {isError && (
        <div className="error-banner bg-red-950/40 border border-red-500/30 text-red-400 p-4 rounded-lg">
          Training failed: {trainingError}
        </div>
      )}

      {isComplete && trainingResult && (
        <div className="flex flex-col gap-6">
          
          {/* ─────────────────────────────────────────────
             9. EXECUTIVE DASHBOARD SUMMARY CARDS
          ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-1">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Model Performance</span>
              <span className={`text-lg font-bold border px-2 py-0.5 rounded-md inline-block w-fit mt-1 ${performanceColor}`}>
                {performanceText}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-1">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                {probType === 'clustering' ? 'Silhouette Score' : (probType === 'regression' ? 'R² Score' : 'Model Accuracy')}
              </span>
              <span className="text-2xl font-bold text-slate-100 mt-1">{accuracyText}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-1">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Dataset Health</span>
              <span className={`text-lg font-bold border px-2 py-0.5 rounded-md inline-block w-fit mt-1 ${healthColor}`}>
                {healthRating}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-1 overflow-hidden">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Top Driver Feature</span>
              <span className="text-lg font-bold text-purple-400 truncate mt-1" title={topFeature}>{topFeature}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-1">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Deployment Status</span>
              <span className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 mt-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" /> Ready
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ─────────────────────────────────────────────
               1. MODEL SUMMARY
            ───────────────────────────────────────────── */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col gap-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                1. Model Summary
              </h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between border-b border-slate-800/40 py-1.5 text-sm">
                  <span className="text-slate-400">Selected Algorithm</span>
                  <span className="font-medium text-slate-200">{trainingResult.model_summary?.algorithm}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/40 py-1.5 text-sm">
                  <span className="text-slate-400">Problem Type</span>
                  <span className="font-medium text-slate-200 capitalize">{trainingResult.model_summary?.problem_type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/40 py-1.5 text-sm">
                  <span className="text-slate-400">Training Records</span>
                  <span className="font-medium text-slate-200">{trainingResult.model_summary?.training_records}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/40 py-1.5 text-sm">
                  <span className="text-slate-400">Number of Features</span>
                  <span className="font-medium text-slate-200">{trainingResult.model_summary?.features_count}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/40 py-1.5 text-sm">
                  <span className="text-slate-400">Training Time</span>
                  <span className="font-medium text-slate-200">{trainingResult.model_summary?.training_time_sec} sec</span>
                </div>
                <div className="flex justify-between py-1.5 text-sm">
                  <span className="text-slate-400">Model Status</span>
                  <span className="font-medium text-emerald-400 capitalize">{trainingResult.model_summary?.status}</span>
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────────
               2. DATA QUALITY REPORT
            ───────────────────────────────────────────── */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col gap-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                2. Data Quality Report
              </h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between border-b border-slate-800/40 py-1.5 text-sm">
                  <span className="text-slate-400">Total Records</span>
                  <span className="font-medium text-slate-200">{trainingResult.data_quality_report?.total_records}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/40 py-1.5 text-sm">
                  <span className="text-slate-400">Missing Values Count</span>
                  <span className="font-medium text-slate-200">
                    {trainingResult.data_quality_report?.missing_values_count} ({missingValPct}%)
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/40 py-1.5 text-sm">
                  <span className="text-slate-400">Duplicate Rows Count</span>
                  <span className="font-medium text-slate-200">
                    {trainingResult.data_quality_report?.duplicate_rows_count} ({duplicateValPct}%)
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/40 py-1.5 text-sm">
                  <span className="text-slate-400">Numerical Features</span>
                  <span className="font-medium text-slate-200">{trainingResult.data_quality_report?.numerical_features_count}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/40 py-1.5 text-sm">
                  <span className="text-slate-400">Categorical Features</span>
                  <span className="font-medium text-slate-200">{trainingResult.data_quality_report?.categorical_features_count}</span>
                </div>
                <div className="flex justify-between py-1.5 text-sm">
                  <span className="text-slate-400">Dataset Health Score</span>
                  <span className="font-medium text-slate-200">{trainingResult.data_quality_report?.health_score} / 100</span>
                </div>
              </div>
              
              {/* Warnings badges if missing > 20% or duplicate > 30% */}
              {(showMissingWarning || showDuplicateWarning) && (
                <div className="flex flex-col gap-2 mt-2">
                  {showMissingWarning && (
                    <span className="bg-red-950/40 border border-red-500/30 text-red-400 text-xs px-2.5 py-1.5 rounded font-medium">
                      ⚠️ Warning: Missing values are higher than 20% ({missingValPct}%). This can degrade model accuracy.
                    </span>
                  )}
                  {showDuplicateWarning && (
                    <span className="bg-amber-950/40 border border-amber-500/30 text-amber-400 text-xs px-2.5 py-1.5 rounded font-medium">
                      ⚠️ Warning: Duplicate rows ratio is higher than 30% ({duplicateValPct}%). Model might overfit.
                    </span>
                  )}
                </div>
              )}
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ─────────────────────────────────────────────
               3. AI GENERATED INSIGHTS
            ───────────────────────────────────────────── */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                3. AI Generated Insights
              </h3>
              <div className="bg-blue-950/20 border-l-4 border-blue-500 p-4 rounded-r-lg text-slate-300 text-sm leading-relaxed">
                {trainingResult.ai_insights}
              </div>
            </div>

            {/* ─────────────────────────────────────────────
               10. BUSINESS INSIGHTS
            ───────────────────────────────────────────── */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                10. Business Insights
              </h3>
              <div className="flex flex-col gap-2">
                {trainingResult.business_insights?.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-purple-400 font-bold">✓</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ─────────────────────────────────────────────
               4. TOP FEATURE IMPORTANCE
            ───────────────────────────────────────────── */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col gap-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                4. Feature Impact Analysis
              </h3>
              <div className="flex flex-col gap-4">
                {trainingResult.feature_importances?.slice(0, 5).map((f, idx) => {
                  const pct = (f.importance * 100).toFixed(0);
                  const isHigh = f.importance >= 0.25;
                  const isMed = f.importance >= 0.10 && f.importance < 0.25;
                  const badgeColor = isHigh 
                    ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                    : (isMed ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-850 text-slate-400 border-slate-700');
                  const badgeText = isHigh ? 'High Impact' : (isMed ? 'Medium Impact' : 'Low Impact');

                  return (
                    <div key={f.feature} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-400">{idx + 1}. {f.feature}</span>
                          <span className={`text-[10px] uppercase font-bold border px-1.5 py-0.5 rounded ${badgeColor}`}>{badgeText}</span>
                        </div>
                        <span className="font-bold text-purple-400">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─────────────────────────────────────────────
               6. MODEL CONFIDENCE
            ───────────────────────────────────────────── */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col gap-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                6. Prediction Confidence Stats
              </h3>
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Average Confidence</span>
                    <span className="font-bold text-slate-200">{trainingResult.confidence_stats?.avg_confidence}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${trainingResult.confidence_stats?.avg_confidence || 0}%` }} />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Highest Confidence Record</span>
                    <span className="font-bold text-slate-200">{trainingResult.confidence_stats?.highest_confidence}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${trainingResult.confidence_stats?.highest_confidence || 0}%` }} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Lowest Confidence Record</span>
                    <span className="font-bold text-slate-200">{trainingResult.confidence_stats?.lowest_confidence}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all" style={{ width: `${trainingResult.confidence_stats?.lowest_confidence || 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ─────────────────────────────────────────────
             5. SAMPLE PREDICTIONS
          ───────────────────────────────────────────── */}
          {trainingResult.sample_predictions && trainingResult.sample_predictions.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                5. Sample Predictions preview
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      {Object.keys(trainingResult.sample_predictions[0] || {})
                        .filter((k) => !k.startsWith('_'))
                        .map((colName) => (
                          <th key={colName} className="p-3 font-semibold uppercase text-xs">{colName}</th>
                        ))}
                      <th className="p-3 font-semibold uppercase text-xs">Prediction</th>
                      <th className="p-3 font-semibold uppercase text-xs">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingResult.sample_predictions.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                        {Object.keys(row)
                          .filter((k) => !k.startsWith('_'))
                          .map((colName) => (
                            <td key={colName} className="p-3 truncate max-w-xs">{String(row[colName])}</td>
                          ))}
                        <td className="p-3 font-bold text-purple-400">{row._prediction}</td>
                        <td className="p-3">
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded font-bold">
                            {row._confidence}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────
             7. ADVANCED EVALUATION
          ───────────────────────────────────────────── */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              7. Advanced Evaluation Report
            </h3>
            
            {probType === 'classification' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-2">ROC Performance Curve</h4>
                  <div className="flex flex-col gap-2">
                    {trainingResult.advanced_eval?.roc_curve && (
                      <div className="relative border border-slate-800 bg-slate-950/60 rounded-xl p-4 flex flex-col items-center justify-center">
                        {/* Inline ROC Curve SVG */}
                        <svg viewBox="0 0 100 100" className="w-64 h-64 overflow-visible">
                          {/* Grid Lines */}
                          <line x1="0" y1="100" x2="100" y2="100" stroke="#1e293b" strokeWidth="1" />
                          <line x1="0" y1="0" x2="0" y2="100" stroke="#1e293b" strokeWidth="1" />
                          <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2" />
                          <line x1="50" y1="0" x2="50" y2="100" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2" />
                          
                          {/* Diagonal (Random Guess) */}
                          <line x1="0" y1="100" x2="100" y2="0" stroke="#475569" strokeWidth="1" strokeDasharray="4" />
                          
                          {/* ROC Path */}
                          <path
                            d={`M ${trainingResult.advanced_eval.roc_curve.map((p) => `${p.fpr * 100} ${100 - p.tpr * 100}`).join(' L ')}`}
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="2.5"
                          />
                        </svg>
                        <div className="flex justify-between w-64 text-[10px] text-slate-500 mt-2">
                          <span>False Positive Rate (FPR)</span>
                          <span>True Positive Rate (TPR)</span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-850 mt-1">
                      <span className="text-slate-400 text-sm">Computed Area Under Curve (AUC)</span>
                      <span className="text-lg font-bold text-slate-200">{trainingResult.advanced_eval?.auc_score}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-2">Confusion Matrix</h4>
                  {trainingResult.confusion_matrix && (
                    <ConfusionMatrix matrix={trainingResult.confusion_matrix} />
                  )}
                </div>
              </div>
            )}

            {probType === 'regression' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-2">Residual Error Scatter Plot</h4>
                  {trainingResult.advanced_eval?.residual_plot && (
                    <div className="relative border border-slate-800 bg-slate-950/60 rounded-xl p-4 flex flex-col items-center justify-center">
                      {/* Inline Residual Scatter SVG */}
                      <svg viewBox="0 0 100 100" className="w-64 h-64 overflow-visible">
                        {/* Zero Line */}
                        <line x1="0" y1="50" x2="100" y2="50" stroke="#475569" strokeWidth="1.5" />
                        <line x1="0" y1="100" x2="100" y2="100" stroke="#1e293b" strokeWidth="1" />
                        <line x1="0" y1="0" x2="0" y2="100" stroke="#1e293b" strokeWidth="1" />
                        
                        {/* Plot residuals */}
                        {trainingResult.advanced_eval.residual_plot.map((pt, index) => {
                          const x = Math.min(95, Math.max(5, (index / 40) * 100));
                          const y = Math.min(95, Math.max(5, 50 - pt.residual * 15));
                          return (
                            <circle key={index} cx={x} cy={y} r="2" fill="#8b5cf6" opacity="0.8" />
                          );
                        })}
                      </svg>
                      <div className="flex justify-between w-64 text-[10px] text-slate-500 mt-2">
                        <span>Predicted Target</span>
                        <span>Residual Error</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <h4 className="text-xs uppercase text-slate-500 font-semibold tracking-wider">Regression Metric Cards</h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-lg">
                      <span className="text-slate-400 text-sm">Mean Absolute Error (MAE)</span>
                      <span className="text-base font-bold text-slate-200">{trainingResult.advanced_eval?.mae}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-lg">
                      <span className="text-slate-400 text-sm">Root Mean Squared Error (RMSE)</span>
                      <span className="text-base font-bold text-slate-200">{trainingResult.advanced_eval?.rmse}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-lg">
                      <span className="text-slate-400 text-sm">R-Squared Coefficient (R²)</span>
                      <span className="text-base font-bold text-slate-200">{trainingResult.advanced_eval?.r2_score}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {probType === 'clustering' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-2">Cluster Distribution Analysis</h4>
                  <div className="flex flex-col gap-3">
                    {trainingResult.advanced_eval?.cluster_distribution?.map((c) => (
                      <div key={c.cluster} className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-lg text-sm">
                        <span className="text-slate-400 font-medium">{c.cluster}</span>
                        <span className="font-bold text-slate-200">{c.count} records</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4 justify-center">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl text-center">
                    <div className="text-sm uppercase tracking-wider text-slate-500 font-semibold">Silhouette Score</div>
                    <div className="text-4xl font-bold text-purple-400 my-2">{trainingResult.advanced_eval?.silhouette_score}</div>
                    <p className="text-xs text-slate-400 px-4 leading-relaxed">
                      Represents the density and separation of clusters. Values closer to 1 indicate well-formed, distinct clusters.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ─────────────────────────────────────────────
             8. DEPLOYMENT & ACTION SECTION
          ───────────────────────────────────────────── */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              8. Production Deployment & Export
            </h3>
            
            <div className="flex flex-wrap gap-3">
              <button className="btn-action bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-1.5" onClick={onDownload}>
                ⬇ Download Model (.pkl)
              </button>
              <button 
                className="btn-action bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-2 border border-slate-700 rounded-lg"
                onClick={() => window.open(`${BACKEND_URL}/api/dataset/download-processed/${trainingResult.dataset_id || ''}`)}
              >
                CSV Processed Dataset
              </button>
              <button 
                className="btn-action bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-2 border border-slate-700 rounded-lg"
                onClick={() => window.open(`${BACKEND_URL}/api/train/pdf-report/${jobId}`)}
              >
                Download PDF Report
              </button>
              <button className="btn-action bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-2 border border-slate-700 rounded-lg" onClick={onCopyEndpoint}>
                📋 Copy API Endpoint
              </button>
            </div>

            {/* Collapsible API Request and Response Examples */}
            <div className="border border-slate-800/80 rounded-xl overflow-hidden mt-2">
              <div className="bg-slate-850 p-4 border-b border-slate-800 text-sm font-bold text-slate-300">
                API Prediction Documentation & Code Snippets
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/20">
                <div className="flex flex-col gap-2">
                  <span className="text-xs uppercase text-slate-500 font-semibold tracking-wider">Example API Request (Python)</span>
                  <pre className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs font-mono overflow-x-auto text-emerald-400 select-all">
                    {pythonExample}
                  </pre>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs uppercase text-slate-500 font-semibold tracking-wider">Expected Response (JSON)</span>
                  <pre className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs font-mono overflow-x-auto text-blue-400">
                    {responseExample}
                  </pre>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);

  // ── Wizard shared state ──────────────────────
  const [wizardState, setWizardState] = useState({
    // Step 1
    problemType: 'classification',
    systemName: '',
    inputDescription: '',
    primaryOutcome: '',
    // Step 2
    datasetName: '',
    requiredFeatures: '',
    targetColumn: '',
    jumlahData: 2000,
    datasetSource: 'api',
    csvFile: null,
    // Step 3
    missingValueStrategy: 'Drop blank rows',
    duplicateStrategy: 'Drop Duplicates',
    categoricalEncoding: true,
    applyStandardization: true,
    // Step 4
    algorithm: 'Logistic Regression',
    hyperparams: {
      C: 1,
      max_iter: 100,
      penalty: 'l2',
      solver: 'lbfgs',
      max_depth: '',
      min_samples_split: 2,
      criterion: 'gini',
      n_estimators: 100,
      learning_rate: 0.3,
    },
    featureDescriptions: {},
  });

  // ── Dataset state ───────────────────────────
  const [datasetId, setDatasetId] = useState('');
  const [columns, setColumns] = useState([]);
  const [previewHead, setPreviewHead] = useState([]);
  const [previewTail, setPreviewTail] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [isDatasetLoading, setIsDatasetLoading] = useState(false);
  const [datasetError, setDatasetError] = useState('');

  // ── Processed state ─────────────────────────
  const [processedRows, setProcessedRows] = useState([]);
  const [processedColumns, setProcessedColumns] = useState([]);
  const [processStats, setProcessStats] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ── Training state ──────────────────────────
  const [jobId, setJobId] = useState('');
  const [trainingStatus, setTrainingStatus] = useState('idle');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingError, setTrainingError] = useState('');
  const [trainingResult, setTrainingResult] = useState(null);

  // ── Toast ───────────────────────────────────
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 4000);
  };

  // ── Update wizard state fields ───────────────
  const handleChange = (key, value) => {
    setWizardState((prev) => ({ ...prev, [key]: value }));
  };

  // ── Step validation ──────────────────────────
  const isStepValid = () => {
    const s = wizardState;
    switch (currentStep) {
      case 1:
        return (
          s.problemType &&
          s.systemName.trim() &&
          s.inputDescription.trim() &&
          s.primaryOutcome.trim()
        );
      case 2: {
        const base =
          s.datasetName.trim() &&
          s.requiredFeatures.trim() &&
          s.jumlahData > 0;
        const target =
          s.problemType === 'clustering' ? true : s.targetColumn.trim();
        if (s.datasetSource === 'manual')
          return base && target && (s.csvFile || datasetId);
        return base && target;
      }
      case 3:
        return datasetId && processedRows.length > 0;
      case 4:
        return !!s.algorithm;
      case 5:
        return trainingStatus === 'complete';
      default:
        return true;
    }
  };

  // ── Filter hyperparams by algorithm ─────────
  const filterHyperparams = () => {
    const h = wizardState.hyperparams;
    const algo = wizardState.algorithm;
    if (algo === 'Logistic Regression')
      return { C: h.C, max_iter: h.max_iter, penalty: h.penalty, solver: h.solver };
    if (algo === 'Decision Tree')
      return {
        max_depth: h.max_depth || null,
        min_samples_split: h.min_samples_split,
        criterion: h.criterion,
      };
    if (algo === 'Random Forest')
      return {
        n_estimators: h.n_estimators,
        max_depth: h.max_depth || null,
        min_samples_split: h.min_samples_split,
      };
    if (algo === 'XGBoost')
      return {
        n_estimators: h.n_estimators,
        learning_rate: h.learning_rate,
        max_depth: h.max_depth ? Number(h.max_depth) : 6,
      };
    return {};
  };

  // ── Fetch / Upload Dataset (Step 2 Proceed) ──
  const fetchDataset = async () => {
    setIsDatasetLoading(true);
    setDatasetError('');
    const s = wizardState;
    try {
      const body = {
        dataset_name: s.datasetName,
        required_features: s.requiredFeatures,
        target_column: s.problemType === 'clustering' ? '' : s.targetColumn,
        jumlah_data: Number(s.jumlahData),
        problem_type: s.problemType,
      };

      let res;
      if (s.datasetSource === 'api') {
        res = await fetch(`${BACKEND_URL}/api/dataset/fetch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        if (!s.csvFile && datasetId) {
          // Already loaded
          setIsDatasetLoading(false);
          markStepDone(2);
          setCurrentStep(3);
          return;
        }
        const fd = new FormData();
        fd.append('file', s.csvFile);
        fd.append('dataset_name', s.datasetName);
        fd.append('required_features', s.requiredFeatures);
        fd.append(
          'target_column',
          s.problemType === 'clustering' ? '' : s.targetColumn
        );
        fd.append('jumlah_data', String(s.jumlahData));
        fd.append('problem_type', s.problemType);
        res = await fetch(`${BACKEND_URL}/api/dataset/upload`, {
          method: 'POST',
          body: fd,
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to load dataset');
      }
      const data = await res.json();
      setDatasetId(data.dataset_id);
      setColumns(data.columns);
      setPreviewHead(data.preview_head);
      setPreviewTail(data.preview_tail);
      setRowCount(data.row_count);
      setDuplicateCount(data.duplicate_count || 0);
      // Reset processed data when new dataset loaded
      setProcessedRows([]);
      setProcessedColumns([]);

      // Initialize featureDescriptions from first row values
      const initialDescriptions = {};
      if (data.columns && data.preview_head && data.preview_head.length > 0) {
        const firstRow = data.preview_head[0];
        data.columns.forEach(col => {
          if (!col.startsWith('_')) {
            initialDescriptions[col] = firstRow[col] !== undefined && firstRow[col] !== null ? String(firstRow[col]) : '';
          }
        });
      }
      setWizardState(prev => ({
        ...prev,
        featureDescriptions: {
          ...prev.featureDescriptions,
          ...initialDescriptions
        }
      }));

      showToast('Dataset loaded successfully!', 'success');
      markStepDone(2);
      setCurrentStep(3);
    } catch (err) {
      setDatasetError(err.message || 'Error loading dataset');
      showToast(err.message, 'error');
    } finally {
      setIsDatasetLoading(false);
    }
  };

  // ── Process Dataset (Step 3 button) ─────────
  const handleProcess = async () => {
    setIsProcessing(true);
    const s = wizardState;
    try {
      const res = await fetch(`${BACKEND_URL}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: datasetId,
          missing_values: s.missingValueStrategy,
          duplicate_strategy: s.duplicateStrategy,
          categorical_encoding: s.categoricalEncoding,
          apply_standardization: s.applyStandardization,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Processing failed');
      }
      const data = await res.json();
      setProcessedRows(data.processed_rows);
      setProcessedColumns(data.columns);
      setProcessStats(data.stats);
      showToast('Processing complete!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Start Training (Step 5 entry) ────────────
  const startTraining = async () => {
    setTrainingStatus('pending');
    setTrainingProgress(0);
    setTrainingError('');
    setTrainingResult(null);
    const s = wizardState;
    try {
      const res = await fetch(`${BACKEND_URL}/api/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_type: s.problemType,
          system_name: s.systemName,
          dataset_id: datasetId,
          target_column: s.problemType === 'clustering' ? '' : s.targetColumn,
          required_features: s.requiredFeatures,
          processing_config: {
            missing_values: s.missingValueStrategy,
            duplicate_strategy: s.duplicateStrategy,
            categorical_encoding: s.categoricalEncoding,
            standardization: s.applyStandardization,
          },
          algorithm: s.algorithm,
          parameters: filterHyperparams(),
          feature_descriptions: s.featureDescriptions || {},
        }),
      });
      if (!res.ok) throw new Error('Failed to start training');
      const { job_id } = await res.json();
      setJobId(job_id);
      pollStatus(job_id);
    } catch (err) {
      setTrainingStatus('error');
      setTrainingError(err.message);
      showToast(err.message, 'error');
    }
  };

  const pollStatus = (jid) => {
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/train/status/${jid}`);
        const data = await res.json();
        setTrainingStatus(data.status);
        setTrainingProgress(data.progress || 0);
        if (data.status === 'complete') {
          clearInterval(iv);
          fetchResult(jid);
        } else if (data.status === 'error') {
          clearInterval(iv);
          setTrainingError(data.error || 'Training error');
        }
      } catch {
        clearInterval(iv);
        setTrainingStatus('error');
        setTrainingError('Failed to poll status');
      }
    }, 3000);
  };

  const fetchResult = async (jid) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/train/result/${jid}`);
      const data = await res.json();
      setTrainingResult(data);
      markStepDone(5);
      showToast('Training complete!', 'success');
    } catch (err) {
      showToast('Failed to load results', 'error');
    }
  };

  // ── Download model ───────────────────────────
  const handleDownload = () => {
    window.open(`${BACKEND_URL}/api/train/download/${jobId}`, '_blank');
  };

  // ── Copy endpoint ────────────────────────────
  const handleCopyEndpoint = () => {
    const endpoint = `${BACKEND_URL}/api/train/predict/${jobId}`;
    navigator.clipboard.writeText(endpoint).then(() =>
      showToast('API endpoint copied!', 'success')
    );
  };

  // ── Mark step done ───────────────────────────
  const markStepDone = (stepId) => {
    setCompletedSteps((prev) =>
      prev.includes(stepId) ? prev : [...prev, stepId]
    );
  };

  // ── Handle Proceed ───────────────────────────
  const handleProceed = async () => {
    if (!isStepValid()) return;
    if (currentStep === 1) {
      markStepDone(1);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      await fetchDataset();
      // Navigation handled inside fetchDataset
    } else if (currentStep === 3) {
      markStepDone(3);
      setCurrentStep(4);
    } else if (currentStep === 4) {
      markStepDone(4);
      setCurrentStep(5);
      startTraining();
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // ── Save Draft ───────────────────────────────
  const handleSaveDraft = async () => {
    const subId = window.SUBMISSION_ID;
    if (!subId || subId === '{{ submission_id }}') {
      showToast('No submission ID found to save draft', 'error');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/draft/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: subId,
          currentStep,
          completedSteps,
          wizardState,
          datasetId,
          columns,
          previewHead,
          previewTail,
          rowCount,
          duplicateCount,
          processedRows,
          processedColumns,
          processStats,
          jobId,
          trainingStatus,
          trainingProgress,
          trainingResult,
        }),
      });
      if (res.ok) {
        showToast('Draft saved successfully!', 'success');
      } else {
        throw new Error('Failed to save draft');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ── Handle Finish ─────────────────────────────
  const handleFinish = async () => {
    // 1. Save final draft so it can be viewed later
    await handleSaveDraft();
    
    // 2. Mark submission as completed in the database
    const subId = window.SUBMISSION_ID;
    if (subId && subId !== '{{ submission_id }}') {
      try {
        const res = await fetch(`${BACKEND_URL}/api/submissions/${subId}/stage/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage_index: 7, // Marks it as completed
            stage_data: {
              status: 'completed',
              finished_at: new Date().toISOString(),
              job_id: jobId,
              metrics: trainingResult ? {
                accuracy: trainingResult.accuracy,
                precision: trainingResult.precision,
                recall: trainingResult.recall,
                f1: trainingResult.f1
              } : null
            }
          })
        });
        if (res.ok) {
          showToast('Submission marked as completed!', 'success');
        } else {
          throw new Error('Failed to update submission status');
        }
      } catch (err) {
        showToast(err.message, 'error');
        return;
      }
    }
    
    // 3. Redirect back to the project list
    window.location.href = `${BACKEND_URL}/dashboard`;
  };

  // ── Trigger training when entering step 5 ────
  useEffect(() => {
    if (currentStep === 5 && trainingStatus === 'idle') {
      startTraining();
    }
  }, [currentStep]);

  // ── Load Draft or Submission Data on Mount ──
  useEffect(() => {
    const loadDraft = async () => {
      const subId = window.SUBMISSION_ID;
      if (!subId || subId === '{{ submission_id }}') return;
      try {
        const res = await fetch(`${BACKEND_URL}/api/draft/load/${subId}`);
        if (res.ok) {
          const draft = await res.json();
          if (draft.currentStep) setCurrentStep(draft.currentStep);
          if (draft.completedSteps) setCompletedSteps(draft.completedSteps);
          if (draft.wizardState) setWizardState(draft.wizardState);
          if (draft.datasetId) setDatasetId(draft.datasetId);
          if (draft.columns) setColumns(draft.columns);
          if (draft.previewHead) setPreviewHead(draft.previewHead);
          if (draft.previewTail) setPreviewTail(draft.previewTail);
          if (draft.rowCount) setRowCount(draft.rowCount);
          if (draft.duplicateCount) setDuplicateCount(draft.duplicateCount);
          if (draft.processedRows) setProcessedRows(draft.processedRows);
          if (draft.processedColumns) setProcessedColumns(draft.processedColumns);
          if (draft.processStats) setProcessStats(draft.processStats);
          if (draft.jobId) setJobId(draft.jobId);
          if (draft.trainingStatus) setTrainingStatus(draft.trainingStatus);
          if (draft.trainingProgress) setTrainingProgress(draft.trainingProgress);
          if (draft.trainingResult) setTrainingResult(draft.trainingResult);
          
          if (draft.trainingStatus === 'running' || draft.trainingStatus === 'pending') {
            if (draft.jobId) pollStatus(draft.jobId);
          }
        } else {
          // Fallback: No draft saved yet. Load submission data from backend!
          const subRes = await fetch(`${BACKEND_URL}/api/dataset/load-submission/${subId}`);
          if (subRes.ok) {
            const data = await subRes.json();
            setDatasetId(data.dataset_id);
            setColumns(data.columns);
            setPreviewHead(data.preview_head);
            setPreviewTail(data.preview_tail);
            setRowCount(data.row_count);
            setDuplicateCount(data.duplicate_count || 0);
            
            // Auto-detect features and target
            const features = data.columns.filter(c => c !== 'target' && c !== 'label' && c !== 'class' && c !== 'status').join(', ');
            const target = data.columns.includes('target') ? 'target' : (data.columns.includes('label') ? 'label' : (data.columns.includes('status') ? 'status' : (data.columns[data.columns.length - 1] || '')));

            const initialDescriptions = {};
            if (data.columns && data.preview_head && data.preview_head.length > 0) {
              const firstRow = data.preview_head[0];
              data.columns.forEach(col => {
                if (!col.startsWith('_')) {
                  initialDescriptions[col] = firstRow[col] !== undefined && firstRow[col] !== null ? String(firstRow[col]) : '';
                }
              });
            }

            setWizardState((prev) => ({
              ...prev,
              systemName: data.system_name || '',
              inputDescription: data.description || '',
              datasetName: (data.system_name || 'dataset').toLowerCase().replace(/[^a-z0-9]/g, '_'),
              requiredFeatures: features,
              targetColumn: target,
              jumlahData: data.row_count || 2000,
              featureDescriptions: initialDescriptions
            }));
            
            // Start from Step 1
            setCompletedSteps([]);
            setCurrentStep(1);
            showToast('Loaded data from Grid 2 automatically!', 'success');
          }
        }
      } catch (err) {
        console.error('Failed to load draft or submission:', err);
      }
    };
    loadDraft();
  }, []);




  // ── Render current step ──────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1 state={wizardState} onChange={handleChange} />;
      case 2:
        return (
          <Step2
            state={wizardState}
            onChange={handleChange}
            isLoading={isDatasetLoading}
            error={datasetError}
          />
        );
      case 3:
        return (
          <Step3
            state={wizardState}
            onChange={handleChange}
            onProcess={handleProcess}
            isProcessing={isProcessing}
            processedRows={processedRows}
            processedColumns={processedColumns.length ? processedColumns : columns}
            processStats={processStats}
            duplicateCount={duplicateCount}
            previewHead={previewHead}
            previewTail={previewTail}
          />
        );
      case 4:
        return <Step4 state={wizardState} onChange={handleChange} />;
      case 5:
        return (
          <Step5
            trainingStatus={trainingStatus}
            trainingProgress={trainingProgress}
            trainingError={trainingError}
            trainingResult={trainingResult}
            jobId={jobId}
            onDownload={handleDownload}
            onCopyEndpoint={handleCopyEndpoint}
          />
        );
      default:
        return null;
    }
  };

  const proceedLabel =
    currentStep === 2
      ? isDatasetLoading
        ? 'Loading...'
        : 'Load Dataset →'
      : currentStep === 4
      ? 'Start Training →'
      : 'Proceed →';

  const proceedDisabled =
    !isStepValid() ||
    isDatasetLoading ||
    (currentStep === 5 && trainingStatus !== 'complete');

  return (
    <div className="wizard-root">
      {/* TOP NAV */}
      <div className="wizard-topbar">
        <div className="topbar-breadcrumb">
          <span>Intelligence Creation</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-active">Structured Data</span>
        </div>
        <div className="topbar-actions">
          <button className="btn-outlined" onClick={handleSaveDraft}>Save Draft</button>
          <button className="btn-purple">API Documentation</button>
          <button className="btn-danger" onClick={() => window.location.href = '/dashboard'}>Back to Project</button>
        </div>
      </div>

      <div className="wizard-body">
        {/* SIDEBAR */}
        <StepSidebar currentStep={currentStep} completedSteps={completedSteps} />

        {/* MAIN CONTENT */}
        <div className="wizard-main">
          <div className="wizard-card">{renderStep()}</div>

          {/* FOOTER NAV */}
          <div className="wizard-footer">
            <button
              className="btn-nav btn-nav--prev"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              ← Previous
            </button>
            {currentStep < 5 ? (
              <button
                className="btn-nav btn-nav--proceed"
                onClick={handleProceed}
                disabled={proceedDisabled}
              >
                {proceedLabel}
              </button>
            ) : (
              <button
                className="btn-nav btn-nav--proceed btn-nav--finish"
                onClick={handleFinish}
                disabled={trainingStatus !== 'complete'}
              >
                Selesai ✓
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toast.msg && (
        <div className={`toast toast--${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}
