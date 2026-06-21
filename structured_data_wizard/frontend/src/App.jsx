import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  Upload, 
  FileText, 
  Database, 
  Copy, 
  Download, 
  RefreshCw, 
  Settings, 
  AlertCircle, 
  Terminal, 
  X
} from 'lucide-react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const BACKEND_URL = window.BACKEND_URL !== undefined ? window.BACKEND_URL : 'http://localhost:8002';

// Steps list
const STEPS = [
  { id: 1, name: 'Problem Framing' },
  { id: 2, name: 'Dataset Definition' },
  { id: 3, name: 'Dataset Preprocessing' },
  { id: 4, name: 'Model Planning' },
  { id: 5, name: 'Engine Execution' }
];

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submissionId, setSubmissionId] = useState('demo-submission');

  // STEP 1 State
  const [problemType, setProblemType] = useState('classification'); // classification, regression, clustering
  const [systemName, setSystemName] = useState('');
  const [inputDescription, setInputDescription] = useState('');
  const [primaryOutcome, setPrimaryOutcome] = useState('');

  // STEP 2 State
  const [datasetName, setDatasetName] = useState('');
  const [requiredFeatures, setRequiredFeatures] = useState('');
  const [targetColumn, setTargetColumn] = useState('');
  const [jumlahData, setJumlahData] = useState(2000);
  const [datasetSource, setDatasetSource] = useState('api'); // api or manual
  const [csvFile, setCsvFile] = useState(null);
  const [isDatasetLoading, setIsDatasetLoading] = useState(false);
  const [datasetError, setDatasetError] = useState('');

  // Loaded Dataset State (from step 2 response)
  const [datasetId, setDatasetId] = useState('');
  const [columns, setColumns] = useState([]);
  const [previewHead, setPreviewHead] = useState([]);
  const [previewTail, setPreviewTail] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);

  // STEP 3 State (Preprocessing & Plots)
  const [missingValueStrategy, setMissingValueStrategy] = useState('Drop blank rows');
  const [duplicateStrategy, setDuplicateStrategy] = useState('Drop Duplicates');
  const [categoricalEncoding, setCategoricalEncoding] = useState(true);
  const [applyStandardization, setApplyStandardization] = useState(true);

  // Plot axes
  const [scatterX, setScatterX] = useState('');
  const [scatterY, setScatterY] = useState('');
  const [featureA, setFeatureA] = useState('');
  const [featureB, setFeatureB] = useState('');

  // STEP 4 State (Algorithms & Hyperparams)
  const [algorithm, setAlgorithm] = useState('Logistic Regression');
  const [hyperparams, setHyperparams] = useState({
    // LogReg
    C: 1,
    max_iter: 100,
    penalty: 'l2',
    solver: 'lbfgs',
    // Decision Tree / RF / XGBoost common
    max_depth: '',
    min_samples_split: 2,
    criterion: 'gini',
    n_estimators: 100,
    learning_rate: 0.3
  });

  // STEP 5 State (Training & Monitoring)
  const [trainingJobId, setTrainingJobId] = useState('');
  const [trainingStatus, setTrainingStatus] = useState('idle'); // idle, pending, running, complete, error
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingError, setTrainingError] = useState('');
  const [trainingResult, setTrainingResult] = useState(null);

  // General Toast / Message State
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showApiDocs, setShowApiDocs] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('submission_id') || window.SUBMISSION_ID;
    if (id) {
      setSubmissionId(id);
      loadDraft(id);
    }
  }, []);

  // Set default scatter plot axes when columns change
  useEffect(() => {
    if (columns.length > 0) {
      const nonTarget = columns.filter(c => c !== targetColumn);
      if (nonTarget.length > 0) {
        setScatterX(nonTarget[0]);
        setScatterY(nonTarget[1] || nonTarget[0]);
        setFeatureA(nonTarget[0]);
        setFeatureB(nonTarget[1] || nonTarget[0]);
      }
    }
  }, [columns, targetColumn]);

  // Load draft from backend
  const loadDraft = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/draft/load/${id}`);
      if (res.ok) {
        const draft = await res.json();
        // Populate state
        if (draft.problem_type) setProblemType(draft.problem_type);
        if (draft.system_name) setSystemName(draft.system_name);
        if (draft.input_description) setInputDescription(draft.input_description);
        if (draft.primary_outcome) setPrimaryOutcome(draft.primary_outcome);
        if (draft.dataset_name) setDatasetName(draft.dataset_name);
        if (draft.required_features) setRequiredFeatures(draft.required_features);
        if (draft.target_column) setTargetColumn(draft.target_column);
        if (draft.jumlah_data) setJumlahData(draft.jumlah_data);
        if (draft.dataset_source) setDatasetSource(draft.dataset_source);
        if (draft.preprocessing_config) {
          const pc = draft.preprocessing_config;
          if (pc.missing_values) setMissingValueStrategy(pc.missing_values);
          if (pc.duplicate_strategy) setDuplicateStrategy(pc.duplicate_strategy);
          if (pc.categorical_encoding !== undefined) setCategoricalEncoding(pc.categorical_encoding);
          if (pc.standardization !== undefined) setApplyStandardization(pc.standardization);
        }
        if (draft.model_config) {
          const mc = draft.model_config;
          if (mc.algorithm) setAlgorithm(mc.algorithm);
          if (mc.parameters) setHyperparams(prev => ({ ...prev, ...mc.parameters }));
        }
        showToast('Draft successfully loaded', 'success');
      }
    } catch (err) {
      console.warn('Failed to load draft:', err);
    }
  };

  // Save draft
  const saveDraft = async () => {
    const draftData = {
      submission_id: submissionId,
      problem_type: problemType,
      system_name: systemName,
      input_description: inputDescription,
      primary_outcome: primaryOutcome,
      dataset_name: datasetName,
      required_features: requiredFeatures,
      target_column: targetColumn,
      jumlah_data: jumlahData,
      dataset_source: datasetSource,
      preprocessing_config: {
        missing_values: missingValueStrategy,
        duplicate_strategy: duplicateStrategy,
        categorical_encoding: categoricalEncoding,
        standardization: applyStandardization
      },
      model_config: {
        algorithm: algorithm,
        parameters: hyperparams
      }
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/draft/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftData)
      });
      if (res.ok) {
        showToast('Draft saved successfully!', 'success');
      } else {
        showToast('Failed to save draft.', 'error');
      }
    } catch (err) {
      showToast('Error connecting to backend.', 'error');
    }
  };

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Step validation check
  const isStepValid = () => {
    if (currentStep === 1) {
      return problemType && systemName.trim() && inputDescription.trim() && primaryOutcome.trim();
    }
    if (currentStep === 2) {
      const baseCheck = datasetName.trim() && requiredFeatures.trim() && jumlahData > 0;
      const targetCheck = problemType === 'clustering' ? true : targetColumn.trim();
      
      if (datasetSource === 'manual') {
        return baseCheck && targetCheck && (csvFile || datasetId);
      }
      return baseCheck && targetCheck;
    }
    if (currentStep === 3) {
      return datasetId ? true : false;
    }
    if (currentStep === 4) {
      return algorithm ? true : false;
    }
    return true;
  };

  // Handle Proceed button click (API call in step 2, train in step 5)
  const handleProceed = async () => {
    if (!isStepValid()) return;

    if (currentStep === 2) {
      setIsDatasetLoading(true);
      setDatasetError('');
      try {
        if (datasetSource === 'api') {
          const res = await fetch(`${BACKEND_URL}/api/dataset/fetch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataset_name: datasetName,
              required_features: requiredFeatures,
              target_column: problemType === 'clustering' ? '' : targetColumn,
              jumlah_data: Number(jumlahData),
              problem_type: problemType
            })
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.detail || 'Failed to fetch dataset');
          }

          const data = await res.json();
          setDatasetId(data.dataset_id);
          setColumns(data.columns);
          setPreviewHead(data.preview_head);
          setPreviewTail(data.preview_tail);
          setRowCount(data.row_count);
          setDuplicateCount(data.duplicate_count);
          
          showToast('Dataset loaded successfully!', 'success');
          setCurrentStep(3);
        } else {
          // Manual upload
          if (!csvFile && datasetId) {
            // Already uploaded previously
            setCurrentStep(3);
            setIsDatasetLoading(false);
            return;
          }
          const formData = new FormData();
          formData.append('file', csvFile);
          formData.append('dataset_name', datasetName);
          formData.append('required_features', requiredFeatures);
          formData.append('target_column', problemType === 'clustering' ? '' : targetColumn);
          formData.append('jumlah_data', String(jumlahData));
          formData.append('problem_type', problemType);

          const res = await fetch(`${BACKEND_URL}/api/dataset/upload`, {
            method: 'POST',
            body: formData
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.detail || 'Failed to upload CSV');
          }

          const data = await res.json();
          setDatasetId(data.dataset_id);
          setColumns(data.columns);
          setPreviewHead(data.preview_head);
          setPreviewTail(data.preview_tail);
          setRowCount(data.row_count);
          setDuplicateCount(data.duplicate_count);
          
          showToast('CSV uploaded and processed!', 'success');
          setCurrentStep(3);
        }
      } catch (err) {
        setDatasetError(err.message || 'Error processing dataset.');
        showToast(err.message || 'Dataset processing error.', 'error');
      } finally {
        setIsDatasetLoading(false);
      }
    } else if (currentStep === 4) {
      // Transitioning to step 5 -> trigger training!
      setCurrentStep(5);
      triggerTraining();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Trigger scikit-learn training pipeline
  const triggerTraining = async () => {
    setTrainingStatus('pending');
    setTrainingProgress(0);
    setTrainingError('');
    setTrainingResult(null);

    const config = {
      problem_type: problemType,
      dataset_id: datasetId,
      system_name: systemName,
      required_features: requiredFeatures,
      target_column: problemType === 'clustering' ? '' : targetColumn,
      jumlah_data: jumlahData,
      preprocessing_config: {
        missing_values: missingValueStrategy,
        duplicate_strategy: duplicateStrategy,
        categorical_encoding: categoricalEncoding,
        standardization: applyStandardization
      },
      model_config: {
        algorithm: algorithm,
        parameters: filterHyperparamsByAlgo()
      }
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!res.ok) {
        throw new Error('Failed to initiate model training.');
      }

      const { job_id } = await res.json();
      setTrainingJobId(job_id);
      
      // Start polling
      pollTrainingStatus(job_id);
    } catch (err) {
      setTrainingStatus('error');
      setTrainingError(err.message || 'Failed to start training.');
      showToast(err.message || 'Training error.', 'error');
    }
  };

  // Filter hyperparams based on selected algorithm
  const filterHyperparamsByAlgo = () => {
    if (algorithm === 'Logistic Regression') {
      return {
        C: hyperparams.C,
        max_iter: hyperparams.max_iter,
        penalty: hyperparams.penalty,
        solver: hyperparams.solver
      };
    }
    if (algorithm === 'Decision Tree') {
      return {
        max_depth: hyperparams.max_depth || null,
        min_samples_split: hyperparams.min_samples_split,
        criterion: hyperparams.criterion
      };
    }
    if (algorithm === 'Random Forest') {
      return {
        n_estimators: hyperparams.n_estimators,
        max_depth: hyperparams.max_depth || null,
        min_samples_split: hyperparams.min_samples_split
      };
    }
    if (algorithm === 'XGBoost') {
      return {
        n_estimators: hyperparams.n_estimators,
        learning_rate: hyperparams.learning_rate,
        max_depth: hyperparams.max_depth ? Number(hyperparams.max_depth) : 6
      };
    }
    return {};
  };

  // Poll training status
  const pollTrainingStatus = (jobId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/train/status/${jobId}`);
        if (!res.ok) {
          clearInterval(interval);
          throw new Error('Failed to fetch job status.');
        }

        const data = await res.json();
        setTrainingStatus(data.status);
        setTrainingProgress(data.progress);

        if (data.status === 'complete') {
          clearInterval(interval);
          fetchTrainingResult(jobId);
        } else if (data.status === 'error') {
          clearInterval(interval);
          setTrainingStatus('error');
          setTrainingError(data.error_message || 'An error occurred during training.');
        }
      } catch (err) {
        clearInterval(interval);
        setTrainingStatus('error');
        setTrainingError(err.message || 'Status check failed.');
      }
    }, 3000);
  };

  // Get results once completed
  const fetchTrainingResult = async (jobId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/train/result/${jobId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch training result details.');
      }
      const data = await res.json();
      setTrainingResult(data);
      showToast('Model training completed!', 'success');
    } catch (err) {
      setTrainingStatus('error');
      setTrainingError(err.message);
    }
  };

  const copyEndpoint = () => {
    const endpoint = `POST ${BACKEND_URL}/api/predict/${trainingJobId}`;
    navigator.clipboard.writeText(endpoint);
    showToast('Prediction API endpoint copied!', 'success');
  };

  // Helpers for chart calculations
  const combinedData = [...previewHead, ...previewTail];

  const checkIsNumeric = (col) => {
    if (!combinedData || combinedData.length === 0 || !col) return false;
    return combinedData.some(row => !isNaN(parseFloat(row[col])) && isFinite(row[col]));
  };

  // Histogram generation helper
  const getHistogramData = (featureName) => {
    if (!combinedData || combinedData.length === 0 || !featureName) return [];
    
    const isNum = checkIsNumeric(featureName);
    
    if (isNum) {
      const values = combinedData
        .map(row => parseFloat(row[featureName]))
        .filter(v => !isNaN(v));
        
      if (values.length === 0) return [];
      
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      if (min === max) {
        return [{ name: `${min}`, count: values.length }];
      }
      
      const binCount = 5;
      const step = (max - min) / binCount;
      const bins = Array.from({ length: binCount }, (_, i) => ({
        min: min + i * step,
        max: min + (i + 1) * step,
        count: 0,
        name: `${(min + i * step).toFixed(1)} - ${(min + (i + 1) * step).toFixed(1)}`
      }));
      
      values.forEach(v => {
        for (let i = 0; i < binCount; i++) {
          if (v >= bins[i].min && (i === binCount - 1 ? v <= bins[i].max : v < bins[i].max)) {
            bins[i].count++;
            break;
          }
        }
      });
      return bins;
    } else {
      // Categorical counts
      const counts = {};
      combinedData.forEach(row => {
        const val = String(row[featureName] || 'None');
        counts[val] = (counts[val] || 0) + 1;
      });
      return Object.keys(counts).map(key => ({
        name: key,
        count: counts[key]
      }));
    }
  };

  // Scatter plot data formatting
  const scatterData = combinedData
    .map(row => ({
      x: parseFloat(row[scatterX]),
      y: parseFloat(row[scatterY])
    }))
    .filter(pt => !isNaN(pt.x) && !isNaN(pt.y));

  const swapScatterAxes = () => {
    const temp = scatterX;
    setScatterX(scatterY);
    setScatterY(temp);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border transition-all duration-300 ${
          toastType === 'success' 
            ? 'bg-teal-950/90 text-teal-300 border-teal-800' 
            : 'bg-rose-950/90 text-rose-300 border-rose-800'
        }`}>
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <span>Intelligence Creation</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200">Structured Data</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={saveDraft}
            className="px-4 py-2 border border-slate-700 hover:border-slate-500 rounded-lg text-slate-300 hover:text-white text-sm font-medium transition-all"
          >
            Save Draft
          </button>
          <button 
            onClick={() => setShowApiDocs(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm font-medium transition-all shadow-lg shadow-purple-900/30"
          >
            API Documentation
          </button>
          <button 
            onClick={() => window.location.href = 'http://localhost:8000/dashboard'}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-white text-sm font-medium transition-all shadow-lg shadow-rose-900/30"
          >
            Back to Project
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className="w-80 border-r border-slate-800 bg-slate-900/40 p-6 flex flex-col">
          <div className="mb-8">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pipeline Progress</h2>
            <p className="text-sm text-slate-300 mt-1">Structured ML Execution</p>
          </div>

          <div className="flex-1 relative flex flex-col gap-10 pl-4">
            {/* Connecting Vertical Line */}
            <div className="absolute left-[29px] top-4 bottom-4 w-0.5 bg-slate-800 -z-10" />

            {STEPS.map((step) => {
              const isCompleted = step.id < currentStep;
              const isActive = step.id === currentStep;
              
              let circleStyle = "w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all ";
              if (isCompleted) {
                circleStyle += "bg-emerald-500 border-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20";
              } else if (isActive) {
                circleStyle += "bg-slate-100 border-slate-100 text-slate-950 shadow-lg shadow-white/10 scale-110";
              } else {
                circleStyle += "border-slate-700 bg-slate-900 text-slate-400";
              }

              return (
                <div key={step.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => step.id <= currentStep && setCurrentStep(step.id)}>
                  <div className={circleStyle}>
                    {isCompleted ? <Check size={14} strokeWidth={3} /> : step.id}
                  </div>
                  <div>
                    <span className={`text-xs font-bold block ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>STEP 0{step.id}</span>
                    <span className={`text-sm font-semibold transition-all ${
                      isActive ? 'text-slate-100' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ACTIVE SESSION</span>
            </div>
            <span className="text-xs text-slate-500 block mt-1 truncate">ID: {submissionId}</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-slate-950 p-8 overflow-y-auto flex flex-col justify-between">
          
          {/* Scrollable White Card */}
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 p-8 flex-1 overflow-y-auto mb-6">
            
            {/* Step 1: Problem Framing */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-teal-600 tracking-wider">STEP 01</span>
                  <h1 className="text-2xl font-bold text-slate-900 mt-1 uppercase">Problem Framing</h1>
                  <p className="text-slate-500 text-sm mt-1">Specify your machine learning target type and define framing metrics.</p>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Select Problem Type</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Classification Card */}
                    <div 
                      onClick={() => setProblemType('classification')}
                      className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                        problemType === 'classification'
                          ? 'border-teal-500 bg-teal-50/50 shadow-md shadow-teal-500/5'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-bold text-teal-700 block uppercase">Classification</span>
                      <p className="text-xs text-slate-500 mt-2">Predict discrete classes or categories.</p>
                    </div>

                    {/* Regression Card */}
                    <div 
                      onClick={() => setProblemType('regression')}
                      className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                        problemType === 'regression'
                          ? 'border-teal-500 bg-teal-50/50 shadow-md shadow-teal-500/5'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-bold text-teal-700 block uppercase">Regression</span>
                      <p className="text-xs text-slate-500 mt-2">Predict continuous numerical values.</p>
                    </div>

                    {/* Clustering Card */}
                    <div 
                      onClick={() => setProblemType('clustering')}
                      className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                        problemType === 'clustering'
                          ? 'border-teal-500 bg-teal-50/50 shadow-md shadow-teal-500/5'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-bold text-teal-700 block uppercase">Clustering</span>
                      <p className="text-xs text-slate-500 mt-2">Group similar data points automatically.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">System Name</label>
                    <input 
                      type="text" 
                      value={systemName}
                      onChange={(e) => setSystemName(e.target.value)}
                      placeholder="e.g., Gender Prediction System"
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:outline-none bg-slate-50 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Input Data Description</label>
                    <textarea 
                      value={inputDescription}
                      onChange={(e) => setInputDescription(e.target.value)}
                      placeholder="e.g., Physical measurements dataset"
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:outline-none bg-slate-50 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Primary Outcome</label>
                    <input 
                      type="text" 
                      value={primaryOutcome}
                      onChange={(e) => setPrimaryOutcome(e.target.value)}
                      placeholder="e.g., Probability of gender from body measurements"
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:outline-none bg-slate-50 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Dataset Definition */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-teal-600 tracking-wider">STEP 02</span>
                  <h1 className="text-2xl font-bold text-slate-900 mt-1 uppercase">Dataset Definition</h1>
                  <p className="text-slate-500 text-sm mt-1">Specify where your dataset originates and define the table schema.</p>
                </div>

                {datasetError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                    <AlertCircle size={14} />
                    <span>{datasetError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Dataset Name</label>
                    <input 
                      type="text" 
                      value={datasetName}
                      onChange={(e) => setDatasetName(e.target.value)}
                      placeholder="e.g., Telecom Churn Data"
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:outline-none bg-slate-50 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Jumlah Data (Data Count)</label>
                    <input 
                      type="number" 
                      value={jumlahData}
                      onChange={(e) => setJumlahData(Number(e.target.value))}
                      placeholder="2000"
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:outline-none bg-slate-50 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Required Features (comma-separated)</label>
                    <input 
                      type="text" 
                      value={requiredFeatures}
                      onChange={(e) => setRequiredFeatures(e.target.value)}
                      placeholder="Feature1, Feature2, Feature3"
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:outline-none bg-slate-50 text-sm"
                    />
                  </div>

                  {problemType !== 'clustering' && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Target Column</label>
                      <input 
                        type="text" 
                        value={targetColumn}
                        onChange={(e) => setTargetColumn(e.target.value)}
                        placeholder="e.g., churn"
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:outline-none bg-slate-50 text-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Dataset Source</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* API Fetch Card */}
                    <div 
                      onClick={() => setDatasetSource('api')}
                      className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                        datasetSource === 'api'
                          ? 'border-teal-500 bg-teal-50/50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="p-3 bg-teal-100 text-teal-700 rounded-lg">
                        <Database size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-teal-800 block uppercase">Request from API</span>
                        <p className="text-xs text-slate-500 mt-1">Automatically fetch/generate dataset from internal API.</p>
                      </div>
                    </div>

                    {/* Manual Upload Card */}
                    <div 
                      onClick={() => setDatasetSource('manual')}
                      className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                        datasetSource === 'manual'
                          ? 'border-teal-500 bg-teal-50/50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="p-3 bg-slate-100 text-slate-700 rounded-lg">
                        <Upload size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block uppercase">Manual Upload</span>
                        <p className="text-xs text-slate-500 mt-1">Upload your own local CSV dataset file directly.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {datasetSource === 'manual' && (
                  <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-center">
                    <input 
                      type="file" 
                      id="csv-file-picker" 
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files[0])}
                      className="hidden"
                    />
                    <label htmlFor="csv-file-picker" className="cursor-pointer flex flex-col items-center gap-2">
                      <div className="p-3 bg-white text-slate-700 rounded-full shadow border border-slate-100">
                        <Upload size={20} />
                      </div>
                      <span className="text-sm font-bold text-slate-700">
                        {csvFile ? csvFile.name : 'Select your CSV dataset file'}
                      </span>
                      <span className="text-xs text-slate-500">Supports .csv tabular files</span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Preprocessing & Visualization */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-teal-600 tracking-wider">STEP 03</span>
                  <h1 className="text-2xl font-bold text-slate-900 mt-1 uppercase">Dataset Preprocessing</h1>
                  <p className="text-slate-500 text-sm mt-1">Clean dataset rows, customize transformations, and examine graphical variables.</p>
                </div>

                {/* Dataset Active Badge */}
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                    <Check size={12} strokeWidth={3} />
                    <span>Dataset Active: {datasetName || 'Generated Dataset'}</span>
                  </div>
                </div>

                {/* Requirement Summary Card */}
                <div className="p-5 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <span className="text-xs font-bold text-slate-500 block uppercase">Jumlah Data</span>
                    <span className="text-sm font-bold text-slate-800 block mt-1">{rowCount} Rows</span>
                  </div>
                  {problemType !== 'clustering' && (
                    <div>
                      <span className="text-xs font-bold text-slate-500 block uppercase">Target Column</span>
                      <span className="text-xs font-bold bg-slate-200 text-slate-800 px-2 py-1 rounded mt-1 inline-block">{targetColumn}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-500 block uppercase">Required Features</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {requiredFeatures.split(',').map((feat, i) => (
                        <span key={i} className="text-xs font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                          {feat.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Data Preview Table */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Data Preview (Head & Tail)</label>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                          {columns.map((col, i) => (
                            <th key={i} className="p-3 font-bold text-slate-700">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewHead.map((row, i) => (
                          <tr key={`head-${i}`} className="border-b border-slate-100 hover:bg-slate-50">
                            {columns.map((col, j) => (
                              <td key={j} className="p-3 text-slate-600">{String(row[col])}</td>
                            ))}
                          </tr>
                        ))}
                        <tr className="bg-slate-50">
                          <td colSpan={columns.length} className="p-2 text-center text-[10px] font-bold text-slate-400 tracking-wider">
                            ... TAIL SEPARATOR ...
                          </td>
                        </tr>
                        {previewTail.map((row, i) => (
                          <tr key={`tail-${i}`} className="border-b border-slate-100 hover:bg-slate-50">
                            {columns.map((col, j) => (
                              <td key={j} className="p-3 text-slate-600">{String(row[col])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Processing Decisions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Cleaning Decisions</h3>
                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Missing Values Strategy</label>
                      <select 
                        value={missingValueStrategy}
                        onChange={(e) => setMissingValueStrategy(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-slate-200 bg-slate-50 focus:outline-none text-xs"
                      >
                        <option>Drop blank rows</option>
                        <option>Fill with mean</option>
                        <option>Fill with median</option>
                        <option>Fill with mode</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">Duplicate Strategy</label>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 rounded text-[10px] font-bold">
                          {duplicateCount} Duplicates Found
                        </span>
                      </div>
                      <select 
                        value={duplicateStrategy}
                        onChange={(e) => setDuplicateStrategy(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-slate-200 bg-slate-50 focus:outline-none text-xs"
                      >
                        <option>Keep Duplicates</option>
                        <option>Drop Duplicates</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Encoding & Scaling</h3>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                      <input 
                        type="checkbox" 
                        id="encoding-cb"
                        checked={categoricalEncoding}
                        onChange={(e) => setCategoricalEncoding(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500"
                      />
                      <label htmlFor="encoding-cb" className="text-xs font-medium text-slate-700 cursor-pointer">
                        Categorical Encoding <span className="text-slate-400 block text-[10px]">Convert text properties into numerical vectors</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                      <input 
                        type="checkbox" 
                        id="scaling-cb"
                        checked={applyStandardization}
                        onChange={(e) => setApplyStandardization(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500"
                      />
                      <label htmlFor="scaling-cb" className="text-xs font-medium text-slate-700 cursor-pointer">
                        Apply Standardization <span className="text-slate-400 block text-[10px]">Recommended for distance-based ML models</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Exploratory Analysis (Scatter Plot) */}
                <div className="space-y-4 border-t border-slate-150 pt-6">
                  <h3 className="text-sm font-bold text-slate-800">Exploratory Data Scatter Plot</h3>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-1">X Axis Variable</span>
                      <select 
                        value={scatterX}
                        onChange={(e) => setScatterX(e.target.value)}
                        className="border border-slate-200 rounded px-2 py-1 focus:outline-none bg-slate-50"
                      >
                        {columns.filter(c => c !== targetColumn).map((col, idx) => (
                          <option key={idx} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>

                    <button 
                      onClick={swapScatterAxes}
                      className="p-2 border border-slate-200 rounded-full hover:bg-slate-100 transition mt-4"
                      title="Swap Axes"
                    >
                      ⇄
                    </button>

                    <div>
                      <span className="text-slate-500 block mb-1">Y Axis Variable</span>
                      <select 
                        value={scatterY}
                        onChange={(e) => setScatterY(e.target.value)}
                        className="border border-slate-200 rounded px-2 py-1 focus:outline-none bg-slate-50"
                      >
                        {columns.filter(c => c !== targetColumn).map((col, idx) => (
                          <option key={idx} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {scatterData.length > 0 ? (
                    <div className="h-80 w-full bg-slate-50 p-4 border border-slate-200 rounded-xl">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis type="number" dataKey="x" name={scatterX} stroke="#64748b" style={{ fontSize: 10 }} />
                          <YAxis type="number" dataKey="y" name={scatterY} stroke="#64748b" style={{ fontSize: 10 }} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Scatter name="Features" data={scatterData} fill="#0d9488" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No numerical pair matches to plot scatter graph.
                    </div>
                  )}
                </div>

                {/* Feature Distribution Analysis (Histograms) */}
                <div className="space-y-4 border-t border-slate-150 pt-6">
                  <h3 className="text-sm font-bold text-slate-800">Feature Distribution Analysis</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Feature A Histogram */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Feature A Analysis</span>
                        <select 
                          value={featureA}
                          onChange={(e) => setFeatureA(e.target.value)}
                          className="border border-slate-200 rounded px-2 py-1 focus:outline-none bg-slate-50"
                        >
                          {columns.map((col, idx) => (
                            <option key={idx} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>

                      <div className="h-64 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getHistogramData(featureA)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 9 }} />
                            <YAxis stroke="#64748b" style={{ fontSize: 9 }} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Feature B Histogram */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Feature B Analysis</span>
                        <select 
                          value={featureB}
                          onChange={(e) => setFeatureB(e.target.value)}
                          className="border border-slate-200 rounded px-2 py-1 focus:outline-none bg-slate-50"
                        >
                          {columns.map((col, idx) => (
                            <option key={idx} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>

                      <div className="h-64 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getHistogramData(featureB)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 9 }} />
                            <YAxis stroke="#64748b" style={{ fontSize: 9 }} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#ab46e5" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Step 4: Model Planning */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-teal-600 tracking-wider">STEP 04</span>
                  <h1 className="text-2xl font-bold text-slate-900 mt-1 uppercase">Model Planning</h1>
                  <p className="text-slate-500 text-sm mt-1">Select algorithm target and adjust training hyperparameters dynamically.</p>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Select ML Algorithm</label>
                  <select 
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:outline-none bg-slate-50 text-sm font-medium"
                  >
                    <option>Logistic Regression</option>
                    <option>Decision Tree</option>
                    <option>Random Forest</option>
                    <option>XGBoost</option>
                  </select>
                </div>

                {/* Hyperparameter Settings */}
                <div className="p-6 border border-slate-200 bg-slate-50 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Settings size={16} className="text-slate-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Configure Hyperparameters</h3>
                  </div>

                  {algorithm === 'Logistic Regression' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">REGULARIZATION (C)</label>
                        <input 
                          type="number" 
                          value={hyperparams.C}
                          onChange={(e) => setHyperparams({ ...hyperparams, C: Number(e.target.value) })}
                          className="w-full border border-slate-200 rounded px-3 py-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">MAX ITERATIONS</label>
                        <input 
                          type="number" 
                          value={hyperparams.max_iter}
                          onChange={(e) => setHyperparams({ ...hyperparams, max_iter: Number(e.target.value) })}
                          className="w-full border border-slate-200 rounded px-3 py-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">PENALTY</label>
                        <select 
                          value={hyperparams.penalty}
                          onChange={(e) => setHyperparams({ ...hyperparams, penalty: e.target.value })}
                          className="w-full border border-slate-200 rounded px-3 py-2 bg-white"
                        >
                          <option>l2</option>
                          <option>l1</option>
                          <option>elasticnet</option>
                          <option>none</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">SOLVER</label>
                        <select 
                          value={hyperparams.solver}
                          onChange={(e) => setHyperparams({ ...hyperparams, solver: e.target.value })}
                          className="w-full border border-slate-200 rounded px-3 py-2 bg-white"
                        >
                          <option>lbfgs</option>
                          <option>liblinear</option>
                          <option>saga</option>
                          <option>sag</option>
                          <option>newton-cg</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {algorithm === 'Decision Tree' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">MAX DEPTH</label>
                        <input 
                          type="number" 
                          value={hyperparams.max_depth}
                          onChange={(e) => setHyperparams({ ...hyperparams, max_depth: e.target.value })}
                          placeholder="Unlimited"
                          className="w-full border border-slate-200 rounded px-3 py-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">MIN SAMPLES SPLIT</label>
                        <input 
                          type="number" 
                          value={hyperparams.min_samples_split}
                          onChange={(e) => setHyperparams({ ...hyperparams, min_samples_split: Number(e.target.value) })}
                          className="w-full border border-slate-200 rounded px-3 py-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">CRITERION</label>
                        <select 
                          value={hyperparams.criterion}
                          onChange={(e) => setHyperparams({ ...hyperparams, criterion: e.target.value })}
                          className="w-full border border-slate-200 rounded px-3 py-2 bg-white"
                        >
                          <option>gini</option>
                          <option>entropy</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {algorithm === 'Random Forest' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">N ESTIMATORS</label>
                        <input 
                          type="number" 
                          value={hyperparams.n_estimators}
                          onChange={(e) => setHyperparams({ ...hyperparams, n_estimators: Number(e.target.value) })}
                          className="w-full border border-slate-200 rounded px-3 py-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">MAX DEPTH</label>
                        <input 
                          type="number" 
                          value={hyperparams.max_depth}
                          onChange={(e) => setHyperparams({ ...hyperparams, max_depth: e.target.value })}
                          placeholder="Unlimited"
                          className="w-full border border-slate-200 rounded px-3 py-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">MIN SAMPLES SPLIT</label>
                        <input 
                          type="number" 
                          value={hyperparams.min_samples_split}
                          onChange={(e) => setHyperparams({ ...hyperparams, min_samples_split: Number(e.target.value) })}
                          className="w-full border border-slate-200 rounded px-3 py-2 bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {algorithm === 'XGBoost' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">N ESTIMATORS</label>
                        <input 
                          type="number" 
                          value={hyperparams.n_estimators}
                          onChange={(e) => setHyperparams({ ...hyperparams, n_estimators: Number(e.target.value) })}
                          className="w-full border border-slate-200 rounded px-3 py-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">LEARNING RATE</label>
                        <input 
                          type="number" 
                          value={hyperparams.learning_rate}
                          onChange={(e) => setHyperparams({ ...hyperparams, learning_rate: Number(e.target.value) })}
                          step="0.05"
                          className="w-full border border-slate-200 rounded px-3 py-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">MAX DEPTH</label>
                        <input 
                          type="number" 
                          value={hyperparams.max_depth || 6}
                          onChange={(e) => setHyperparams({ ...hyperparams, max_depth: e.target.value })}
                          className="w-full border border-slate-200 rounded px-3 py-2 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Engine Execution */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-teal-600 tracking-wider">STEP 05</span>
                  <h1 className="text-2xl font-bold text-slate-900 mt-1 uppercase">Engine Execution</h1>
                  <p className="text-slate-500 text-sm mt-1">Train pipelines, evaluate outcome metrics, and download production models.</p>
                </div>

                {/* Requirement Summary Card */}
                <div className="p-5 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <span className="text-xs font-bold text-slate-500 block uppercase">Jumlah Data</span>
                    <span className="text-sm font-bold text-slate-800 block mt-1">{rowCount} Rows</span>
                  </div>
                  {problemType !== 'clustering' && (
                    <div>
                      <span className="text-xs font-bold text-slate-500 block uppercase">Target Column</span>
                      <span className="text-xs font-bold bg-slate-200 text-slate-800 px-2 py-1 rounded mt-1 inline-block">{targetColumn}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-500 block uppercase">Required Features</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {requiredFeatures.split(',').map((feat, i) => (
                        <span key={i} className="text-xs font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                          {feat.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {(trainingStatus === 'pending' || trainingStatus === 'running') && (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-teal-600 animate-spin" />
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-teal-700">
                        {trainingProgress}%
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide">Awaiting Dataset Ingestion</h3>
                      <p className="text-slate-500 text-xs mt-2 max-w-md mx-auto">
                        We have sent a request to the Dataset Management service. The dataset is being processed. It will be downloaded automatically once it is ready. Please do not navigate away.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {trainingStatus === 'error' && (
                  <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                      <AlertCircle size={22} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-rose-800">Pipeline Training Failed</h3>
                      <p className="text-rose-700 text-xs mt-1">{trainingError || 'An error occurred during dataset modeling.'}</p>
                    </div>
                    <button 
                      onClick={triggerTraining}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold inline-flex items-center gap-1.5 transition"
                    >
                      <RefreshCw size={12} />
                      Retry Pipeline
                    </button>
                  </div>
                )}

                {/* Success / Result State */}
                {trainingStatus === 'complete' && trainingResult && (
                  <div className="space-y-6">
                    {/* Primary Score Banner */}
                    <div className="p-6 bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-700/20 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-100">Model Accuracy</span>
                        <h2 className="text-4xl font-black mt-1">{trainingResult.accuracy}%</h2>
                        <p className="text-xs text-teal-100 mt-1">Evaluated on 20% test-split validation data.</p>
                      </div>
                      <div className="flex gap-4 border-t md:border-t-0 md:border-l border-teal-500/50 pt-4 md:pt-0 pl-0 md:pl-6 text-center md:text-left">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200">Precision</span>
                          <span className="text-lg font-bold block">{trainingResult.precision}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200">Recall</span>
                          <span className="text-lg font-bold block">{trainingResult.recall}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200">F1 Score</span>
                          <span className="text-lg font-bold block">{trainingResult.f1}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Confusion Matrix */}
                      <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Confusion Matrix</span>
                        
                        <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold">
                          <div className="p-4 bg-white border border-slate-100 rounded-lg flex flex-col justify-center">
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">True Negative (TN)</span>
                            <span className="text-xl font-bold text-slate-800 mt-1">
                              {trainingResult.confusion_matrix?.[0]?.[0] ?? 0}
                            </span>
                          </div>
                          <div className="p-4 bg-white border border-slate-100 rounded-lg flex flex-col justify-center">
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">False Positive (FP)</span>
                            <span className="text-xl font-bold text-slate-800 mt-1">
                              {trainingResult.confusion_matrix?.[0]?.[1] ?? 0}
                            </span>
                          </div>
                          <div className="p-4 bg-white border border-slate-100 rounded-lg flex flex-col justify-center">
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">False Negative (FN)</span>
                            <span className="text-xl font-bold text-slate-800 mt-1">
                              {trainingResult.confusion_matrix?.[1]?.[0] ?? 0}
                            </span>
                          </div>
                          <div className="p-4 bg-white border border-slate-100 rounded-lg flex flex-col justify-center">
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">True Positive (TP)</span>
                            <span className="text-xl font-bold text-slate-800 mt-1">
                              {trainingResult.confusion_matrix?.[1]?.[1] ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Feature Importance Plot */}
                      <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Feature Importance Chart</span>
                        
                        {trainingResult.feature_importances?.length > 0 ? (
                          <div className="h-44 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart 
                                layout="vertical" 
                                data={trainingResult.feature_importances}
                                margin={{ left: -10, right: 10, top: 0, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                <XAxis type="number" stroke="#64748b" style={{ fontSize: 9 }} />
                                <YAxis type="category" dataKey="feature" stroke="#64748b" style={{ fontSize: 9 }} />
                                <Tooltip />
                                <Bar dataKey="importance" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-lg border border-slate-100">
                            Feature importance metric unavailable for this algorithm model.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Operational Commands Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-slate-200 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <a 
                          href={`${BACKEND_URL}/api/model/download/${trainingJobId}`}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow transition"
                        >
                          <Download size={14} />
                          Download Model (.pkl)
                        </a>
                        <button 
                          onClick={copyEndpoint}
                          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow transition"
                        >
                          <Copy size={14} />
                          Copy API Endpoint
                        </button>
                      </div>
                      
                      <button 
                        onClick={triggerTraining}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <RefreshCw size={12} />
                        Retrain Model
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Navigation Footer */}
          <footer className="flex items-center justify-between border-t border-slate-800 pt-6">
            <button 
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition ${
                currentStep === 1 
                  ? 'text-slate-600 border border-slate-800 cursor-not-allowed' 
                  : 'text-slate-300 border border-slate-700 hover:bg-slate-900/60 hover:text-white'
              }`}
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            <button 
              onClick={handleProceed}
              disabled={!isStepValid() || isDatasetLoading || trainingStatus === 'pending' || trainingStatus === 'running'}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-all ${
                isStepValid() && !isDatasetLoading && trainingStatus !== 'pending' && trainingStatus !== 'running'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/10' 
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              }`}
            >
              {isDatasetLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Processing...
                </>
              ) : currentStep === 5 ? (
                <>
                  Finished
                  <Check size={16} />
                </>
              ) : (
                <>
                  Proceed
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </footer>

        </main>
      </div>

      {/* API Documentation Modal */}
      {showApiDocs && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-400">
                <Terminal size={18} />
                <h3 className="font-bold text-slate-100">API Documentation</h3>
              </div>
              <button onClick={() => setShowApiDocs(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-sm text-slate-300">
              <p>The Structured Data ML engine provides a set of HTTP REST API endpoints to build, monitor, and query pipelines programmatically.</p>
              
              <div className="space-y-3">
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-850 px-4 py-2 border-b border-slate-800 font-bold text-xs flex items-center gap-2 text-purple-400">
                    <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 rounded text-[9px] font-bold">POST</span>
                    <span>/api/dataset/fetch</span>
                  </div>
                  <pre className="p-3 bg-slate-950 text-[10px] text-slate-400 overflow-x-auto font-mono">
{`Request Body:
{
  "dataset_name": "Telecom Churn Data",
  "required_features": "gender, MonthlyCharges, tenure",
  "target_column": "churn",
  "jumlah_data": 2000,
  "problem_type": "classification"
}`}
                  </pre>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-850 px-4 py-2 border-b border-slate-800 font-bold text-xs flex items-center gap-2 text-purple-400">
                    <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 rounded text-[9px] font-bold">POST</span>
                    <span>/api/train</span>
                  </div>
                  <pre className="p-3 bg-slate-950 text-[10px] text-slate-400 overflow-x-auto font-mono">
{`Request Body:
{
  "problem_type": "classification",
  "dataset_id": "uuid-string",
  "preprocessing_config": {
    "missing_values": "Drop blank rows",
    "duplicate_strategy": "Drop Duplicates",
    "categorical_encoding": true,
    "standardization": true
  },
  "model_config": {
    "algorithm": "Random Forest",
    "parameters": {
      "n_estimators": 100,
      "max_depth": null,
      "min_samples_split": 2
    }
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => setShowApiDocs(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
