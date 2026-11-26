import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  Download,
  FileCheck2,
  Printer,
  Sliders,
  Users,
} from 'lucide-react';
import {
  CalibrationMap,
  CertificateDynamicValues,
  CertificateSettings,
  CertificateTypeId,
  FieldCalibration,
  FieldKey,
  ParticipantDataset,
} from './types/certificate';
import { CERTIFICATE_TYPES, getCertificateType } from './data/certificateConfigs';
import {
  createParticipantRow,
  parseSpreadsheetBuffer,
  validateMalaysianIc,
} from './utils/icValidator';
import {
  generateBulkCertificatesPdf,
  getPdfPageCount,
  RenderedTemplatePage,
  renderTemplatePageToImage,
} from './utils/pdfService';
import { CertificateSelectorStep } from './components/CertificateSelectorStep';
import { FileUploadPanel } from './components/FileUploadPanel';
import { ParticipantTable } from './components/ParticipantTable';
import { CertificateConfigPanel } from './components/CertificateConfigPanel';
import { LivePreviewCanvas } from './components/LivePreviewCanvas';

type WorkflowStep = 'select' | 'participants' | 'studio';

function buildInitialDynamicValues(): Record<CertificateTypeId, CertificateDynamicValues> {
  return {
    penghargaan_bestari: { ...CERTIFICATE_TYPES[0].defaultValues },
    penghargaan_belia: { ...CERTIFICATE_TYPES[1].defaultValues },
    penyertaan_bestari: { ...CERTIFICATE_TYPES[2].defaultValues },
    penyertaan_belia: { ...CERTIFICATE_TYPES[3].defaultValues },
  };
}

function cloneCalMap(cal: CalibrationMap): CalibrationMap {
  return {
    nama: { ...cal.nama },
    ic: { ...cal.ic },
    anugerah: { ...cal.anugerah },
    program: { ...cal.program },
    tarikh: { ...cal.tarikh },
  };
}

function buildInitialCalibrations(): Record<CertificateTypeId, CalibrationMap> {
  return {
    penghargaan_bestari: cloneCalMap(CERTIFICATE_TYPES[0].defaultCalibration),
    penghargaan_belia: cloneCalMap(CERTIFICATE_TYPES[1].defaultCalibration),
    penyertaan_bestari: cloneCalMap(CERTIFICATE_TYPES[2].defaultCalibration),
    penyertaan_belia: cloneCalMap(CERTIFICATE_TYPES[3].defaultCalibration),
  };
}

function emptyDataset(): ParticipantDataset {
  return { rows: [], fileName: null, detectedColumns: null, previewIndex: 0 };
}

function buildInitialDatasets(): Record<CertificateTypeId, ParticipantDataset> {
  return {
    penghargaan_bestari: emptyDataset(),
    penghargaan_belia: emptyDataset(),
    penyertaan_bestari: emptyDataset(),
    penyertaan_belia: emptyDataset(),
  };
}

function buildInitialSettings(): Record<CertificateTypeId, CertificateSettings> {
  const base = { autoFitLongText: true, uppercaseNames: true };
  return {
    penghargaan_bestari: { ...base },
    penghargaan_belia: { ...base },
    penyertaan_bestari: { ...base },
    penyertaan_belia: { ...base },
  };
}

const STEP_CONFIG = [
  { id: 'select' as WorkflowStep, label: 'Pilih Jenis Sijil', icon: Award, step: 1 },
  { id: 'participants' as WorkflowStep, label: 'Senarai Peserta', icon: Users, step: 2 },
  { id: 'studio' as WorkflowStep, label: 'Kalibrasi & Previu', icon: Sliders, step: 3 },
];

export function App() {
  const [activeStep, setActiveStep] = useState<WorkflowStep>('select');
  const [selectedTypeId, setSelectedTypeId] = useState<CertificateTypeId>('penghargaan_bestari');
  const [datasetsByType, setDatasetsByType] = useState<Record<CertificateTypeId, ParticipantDataset>>(buildInitialDatasets);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [templateBytes, setTemplateBytes] = useState<ArrayBuffer | null>(null);
  const [templateFileName, setTemplateFileName] = useState<string>('SIJIL TUNAS MAIM (PRINT).pdf');
  const [templatePageCount, setTemplatePageCount] = useState<number>(4);
  const [renderedPages, setRenderedPages] = useState<Record<number, RenderedTemplatePage>>({});
  const [isLoadingTemplate, setIsLoadingTemplate] = useState<boolean>(true);
  const [dynamicValuesMap, setDynamicValuesMap] = useState(buildInitialDynamicValues);
  const [calibrationMap, setCalibrationMap] = useState(buildInitialCalibrations);
  const [settingsMap, setSettingsMap] = useState(buildInitialSettings);
  const [activeField, setActiveField] = useState<FieldKey>('nama');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<{ done: number; total: number } | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const selectedType = useMemo(() => getCertificateType(selectedTypeId), [selectedTypeId]);
  const activeDataset = datasetsByType[selectedTypeId];
  const participants = activeDataset.rows;
  const activeDynamicValues = dynamicValuesMap[selectedTypeId];
  const activeCalibration = calibrationMap[selectedTypeId];
  const activeSettings = settingsMap[selectedTypeId];

  const loadDefaultTemplate = useCallback(async () => {
    setIsLoadingTemplate(true);
    try {
      const resp = await fetch('/sijil-template.pdf');
      if (!resp.ok) throw new Error('Gagal memuatkan sijil PDF lalai.');
      const buf = await resp.arrayBuffer();
      const pages = await getPdfPageCount(buf);
      setTemplateBytes(buf);
      setTemplateFileName('SIJIL TUNAS MAIM (PRINT).pdf');
      setTemplatePageCount(pages);
      setRenderedPages({});
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Gagal memuatkan sijil PDF.');
    } finally {
      setIsLoadingTemplate(false);
    }
  }, []);

  useEffect(() => { void loadDefaultTemplate(); }, [loadDefaultTemplate]);

  useEffect(() => {
    if (!templateBytes) return;
    const targetPage = Math.min(selectedType.pageIndex, Math.max(0, templatePageCount - 1));
    if (renderedPages[targetPage]) return;
    let cancelled = false;
    setIsLoadingTemplate(true);
    renderTemplatePageToImage(templateBytes, targetPage, 2)
      .then((rendered) => { if (!cancelled) setRenderedPages((prev) => ({ ...prev, [targetPage]: rendered })); })
      .catch((err) => { if (!cancelled) setUploadError(err instanceof Error ? err.message : 'Gagal memaparkan halaman PDF.'); })
      .finally(() => { if (!cancelled) setIsLoadingTemplate(false); });
    return () => { cancelled = true; };
  }, [templateBytes, templatePageCount, selectedType.pageIndex, renderedPages]);

  const updateActiveDataset = useCallback(
    (updater: (prev: ParticipantDataset) => ParticipantDataset) => {
      setDatasetsByType((prev) => ({ ...prev, [selectedTypeId]: updater(prev[selectedTypeId]) }));
    },
    [selectedTypeId]
  );

  const handleUploadParticipants = async (file: File) => {
    setUploadError(null);
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseSpreadsheetBuffer(buf);
      updateActiveDataset(() => ({ rows: parsed.rows, fileName: file.name, detectedColumns: parsed.detectedColumns, previewIndex: 0 }));
      setStatusBanner(`${parsed.rows.length} peserta berjaya dimuatkan daripada ${file.name}.`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Fail Excel/CSV tidak dapat dibaca.');
    }
  };

  const handleUploadTemplatePdf = async (file: File) => {
    setUploadError(null);
    setIsLoadingTemplate(true);
    try {
      const buf = await file.arrayBuffer();
      const pages = await getPdfPageCount(buf);
      setTemplateBytes(buf);
      setTemplateFileName(file.name);
      setTemplatePageCount(pages);
      setRenderedPages({});
      setStatusBanner(`Sijil ditukar kepada ${file.name} (${pages} halaman).`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Fail PDF tidak sah atau rosak.');
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const handleUpdateRow = (id: string, field: 'nama' | 'ic', value: string) => {
    updateActiveDataset((ds) => ({
      ...ds,
      rows: ds.rows.map((row) => {
        if (row.id !== id) return row;
        if (field === 'nama') return { ...row, nama: value };
        const validation = validateMalaysianIc(value);
        return { ...row, ic: value, icStatus: validation.icStatus, icIssues: validation.icIssues, suggestedIc: validation.suggestedIc };
      }),
    }));
  };

  const handleToggleSelect = (id: string) => {
    updateActiveDataset((ds) => ({ ...ds, rows: ds.rows.map((row) => (row.id === id ? { ...row, selected: !row.selected } : row)) }));
  };

  const handleSelectGroup = (mode: 'all' | 'none' | 'standard_only') => {
    updateActiveDataset((ds) => ({
      ...ds,
      rows: ds.rows.map((row) => ({ ...row, selected: mode === 'all' ? true : mode === 'none' ? false : row.icStatus === 'standard' })),
    }));
  };

  const handleAutoFixSingleIc = (id: string) => {
    updateActiveDataset((ds) => ({
      ...ds,
      rows: ds.rows.map((row) => {
        if (row.id !== id || !row.suggestedIc) return row;
        const validation = validateMalaysianIc(row.suggestedIc);
        return { ...row, ic: row.suggestedIc, icStatus: validation.icStatus, icIssues: validation.icIssues, suggestedIc: validation.suggestedIc };
      }),
    }));
  };

  const handleAutoFixAllFixableIcs = () => {
    let fixedCount = 0;
    updateActiveDataset((ds) => ({
      ...ds,
      rows: ds.rows.map((row) => {
        if (row.icStatus !== 'fixable' || !row.suggestedIc) return row;
        fixedCount++;
        const validation = validateMalaysianIc(row.suggestedIc);
        return { ...row, ic: row.suggestedIc, icStatus: validation.icStatus, icIssues: validation.icIssues, suggestedIc: validation.suggestedIc };
      }),
    }));
    if (fixedCount > 0) setStatusBanner(`${fixedCount} No. IC berjaya dibaiki.`);
  };

  const handleUppercaseAllNames = () => {
    updateActiveDataset((ds) => ({ ...ds, rows: ds.rows.map((row) => ({ ...row, nama: row.nama.replace(/\s+/g, ' ').trim().toUpperCase() })) }));
    setStatusBanner('Semua nama ditukar kepada HURUF BESAR.');
  };

  const handleAddParticipant = () => {
    updateActiveDataset((ds) => ({
      ...ds,
      rows: [...ds.rows, createParticipantRow(ds.rows.length + 1, 'PESERTA BARU', '101010-10-1010', true)],
    }));
  };

  const handleDeleteParticipant = (id: string) => {
    updateActiveDataset((ds) => {
      const filtered = ds.rows.filter((r) => r.id !== id).map((r, i) => ({ ...r, rowNumber: i + 1 }));
      return { ...ds, rows: filtered, previewIndex: Math.max(0, Math.min(ds.previewIndex, filtered.length - 1)) };
    });
  };

  const handlePreviewParticipant = (id: string) => {
    const idx = participants.findIndex((p) => p.id === id);
    if (idx !== -1) {
      updateActiveDataset((ds) => ({ ...ds, previewIndex: idx }));
      setActiveStep('studio');
    }
  };

  const handleSelectType = (id: CertificateTypeId) => {
    setSelectedTypeId(id);
    setUploadError(null);
    const nextDef = getCertificateType(id);
    if (!nextDef.hasAnugerah && activeField === 'anugerah') setActiveField('program');
  };

  const handleChangeDynamicValue = (field: keyof CertificateDynamicValues, value: string) => {
    setDynamicValuesMap((prev) => ({ ...prev, [selectedTypeId]: { ...prev[selectedTypeId], [field]: value } }));
  };

  const handleChangeCalibration = (field: FieldKey, next: Partial<FieldCalibration>) => {
    setCalibrationMap((prev) => ({
      ...prev,
      [selectedTypeId]: { ...prev[selectedTypeId], [field]: { ...prev[selectedTypeId][field], ...next } },
    }));
  };

  const handleResetCalibration = () => {
    setCalibrationMap((prev) => ({ ...prev, [selectedTypeId]: cloneCalMap(selectedType.defaultCalibration) }));
    setStatusBanner(`Kalibrasi ${selectedType.title} diset semula.`);
  };

  const handleCopyCalibrationToTargets = (targetIds: CertificateTypeId[], fields: FieldKey[], includeDisplaySettings: boolean) => {
    const sourceCal = calibrationMap[selectedTypeId];
    const sourceSettings = settingsMap[selectedTypeId];
    setCalibrationMap((prev) => {
      const next = { ...prev };
      for (const targetId of targetIds) {
        const targetDef = getCertificateType(targetId);
        const updatedTargetCal = cloneCalMap(next[targetId]);
        for (const fk of fields) {
          if (fk === 'anugerah' && !targetDef.hasAnugerah) continue;
          updatedTargetCal[fk] = { ...sourceCal[fk] };
        }
        next[targetId] = updatedTargetCal;
      }
      return next;
    });
    if (includeDisplaySettings) {
      setSettingsMap((prev) => {
        const next = { ...prev };
        for (const targetId of targetIds) next[targetId] = { ...sourceSettings };
        return next;
      });
    }
    setStatusBanner(`Posisi & saiz (${fields.length} medan) disalin ke ${targetIds.length} sijil lain.`);
  };

  const selectedParticipants = useMemo(() => participants.filter((p) => p.selected), [participants]);
  const selectedIssueCount = useMemo(() => selectedParticipants.filter((p) => p.icStatus !== 'standard').length, [selectedParticipants]);

  const handleExportPdf = async (mode: 'download' | 'print') => {
    if (selectedParticipants.length === 0) return;
    setIsGenerating(true);
    setGenerationProgress({ done: 0, total: selectedParticipants.length });
    setUploadError(null);
    try {
      const pdfBytes = await generateBulkCertificatesPdf({
        templateBytes,
        certificateType: selectedType,
        participants: selectedParticipants,
        dynamicValues: activeDynamicValues,
        calibration: activeCalibration,
        autoFitLongText: activeSettings.autoFitLongText,
        uppercaseNames: activeSettings.uppercaseNames,
        onProgress: (done, total) => setGenerationProgress({ done, total }),
      });
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      if (mode === 'download') {
        const safeTitle = selectedType.title.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toUpperCase();
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeTitle}_${selectedParticipants.length}_PESERTA.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        setStatusBanner(`PDF berjaya dijana — ${selectedParticipants.length} sijil.`);
      } else {
        const win = window.open(url, '_blank');
        if (!win) setUploadError('Pop-up disekat. Sila benarkan pop-up atau guna Muat Turun PDF.');
        else setStatusBanner(`PDF ${selectedParticipants.length} sijil dibuka untuk dicetak.`);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Ralat semasa menjana PDF.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  const currentTemplatePageIdx = Math.min(selectedType.pageIndex, Math.max(0, templatePageCount - 1));
  const currentTemplateImage = renderedPages[currentTemplatePageIdx] ?? null;

  const stepActiveClass = 'bg-emerald-600 text-white shadow-sm';
  const stepDoneClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  const stepIdleClass = 'bg-white text-slate-500 border border-slate-200';

  const getStepClass = (stepId: WorkflowStep) => {
    if (activeStep === stepId) return stepActiveClass;
    const order = { select: 0, participants: 1, studio: 2 };
    return order[activeStep] > order[stepId] ? stepDoneClass : stepIdleClass;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Logo + Title */}
          <div className="flex items-center gap-3 shrink-0">
            <img src="/logo-tunas.png" alt="TUNAS MAIM" className="h-9 w-auto object-contain" />
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-slate-900 leading-tight">Penjana Sijil TUNAS MAIM</div>
              <div className="text-[11px] text-slate-400 leading-tight">
                {selectedType.category} · {selectedType.track}
              </div>
            </div>
          </div>

          {/* Step Indicator (center) */}
          <nav className="hidden md:flex items-center gap-1.5">
            {STEP_CONFIG.map((s) => {
              const Icon = s.icon;
              const cls = getStepClass(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveStep(s.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${cls}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{s.step}. {s.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {selectedIssueCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveStep('participants')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-100 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {selectedIssueCount} isu IC
              </button>
            )}
            <button
              type="button"
              disabled={isGenerating || selectedParticipants.length === 0}
              onClick={() => void handleExportPdf('print')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              title="Cetak PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak
            </button>
            <button
              type="button"
              disabled={isGenerating || selectedParticipants.length === 0}
              onClick={() => void handleExportPdf('download')}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-40 cursor-pointer transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              {isGenerating && generationProgress
                ? `${generationProgress.done}/${generationProgress.total}...`
                : `Muat Turun PDF${selectedParticipants.length > 0 ? ` (${selectedParticipants.length})` : ''}`}
            </button>
          </div>
        </div>

        {/* Mobile step bar */}
        <div className="md:hidden border-t border-slate-100 flex">
          {STEP_CONFIG.map((s) => {
            const Icon = s.icon;
            const isActive = activeStep === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStep(s.id)}
                className={`flex-1 inline-flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold cursor-pointer transition-colors border-b-2 ${
                  isActive ? 'border-emerald-600 text-emerald-700 bg-white' : 'border-transparent text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Status Banner */}
        {statusBanner && (
          <div className="bg-emerald-50 border-t border-emerald-100 px-4 sm:px-6 py-1.5 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-xs text-emerald-700 font-medium">{statusBanner}</span>
            <button type="button" onClick={() => setStatusBanner(null)} className="ml-auto text-emerald-500 hover:text-emerald-700 text-xs cursor-pointer">✕</button>
          </div>
        )}
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 space-y-4">

        {/* ── STEP 1: Pilih Jenis Sijil ── */}
        {activeStep === 'select' && (
          <CertificateSelectorStep
            selectedTypeId={selectedTypeId}
            datasetsByType={datasetsByType}
            calibrationMap={calibrationMap}
            onSelectType={handleSelectType}
            onProceedToUpload={() => setActiveStep('participants')}
            onProceedToStudio={() => setActiveStep('studio')}
          />
        )}

        {/* ── STEP 2: Peserta ── */}
        {activeStep === 'participants' && (
          <div className="space-y-4">
            {/* Context bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                {selectedType.category === 'Sijil Penghargaan'
                  ? <Award className="w-4 h-4 text-amber-500" />
                  : <FileCheck2 className="w-4 h-4 text-sky-500" />}
                <div>
                  <div className="text-sm font-bold text-slate-900">{selectedType.title}</div>
                  <div className="text-[11px] text-slate-400">Senarai peserta khusus untuk jenis sijil ini</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setActiveStep('select')} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
                  ← Tukar Sijil
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep('studio')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
                >
                  Seterusnya <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <FileUploadPanel
              activeCertificateTitle={selectedType.title}
              participantFileName={activeDataset.fileName}
              participantCount={participants.length}
              detectedColumns={activeDataset.detectedColumns}
              templateFileName={templateFileName}
              templatePageCount={templatePageCount}
              onUploadParticipants={handleUploadParticipants}
              onUploadTemplatePdf={handleUploadTemplatePdf}
              onResetDefaultTemplate={loadDefaultTemplate}
              errorMessage={uploadError}
            />

            <ParticipantTable
              participants={participants}
              previewParticipantId={participants[activeDataset.previewIndex]?.id ?? null}
              onUpdateRow={handleUpdateRow}
              onToggleSelect={handleToggleSelect}
              onSelectGroup={handleSelectGroup}
              onAutoFixSingleIc={handleAutoFixSingleIc}
              onAutoFixAllFixableIcs={handleAutoFixAllFixableIcs}
              onUppercaseAllNames={handleUppercaseAllNames}
              onAddParticipant={handleAddParticipant}
              onDeleteParticipant={handleDeleteParticipant}
              onPreviewParticipant={handlePreviewParticipant}
            />
          </div>
        )}

        {/* ── STEP 3: Studio ── */}
        {activeStep === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-5 xl:col-span-4">
              <CertificateConfigPanel
                selectedType={selectedType}
                dynamicValues={activeDynamicValues}
                calibration={activeCalibration}
                activeField={activeField}
                autoFitLongText={activeSettings.autoFitLongText}
                uppercaseNames={activeSettings.uppercaseNames}
                onChangeDynamicValue={handleChangeDynamicValue}
                onSelectActiveField={setActiveField}
                onChangeCalibration={handleChangeCalibration}
                onResetCalibration={handleResetCalibration}
                onCopyCalibrationToTargets={handleCopyCalibrationToTargets}
                onToggleAutoFit={(val) => setSettingsMap((prev) => ({ ...prev, [selectedTypeId]: { ...prev[selectedTypeId], autoFitLongText: val } }))}
                onToggleUppercaseNames={(val) => setSettingsMap((prev) => ({ ...prev, [selectedTypeId]: { ...prev[selectedTypeId], uppercaseNames: val } }))}
                onSwitchCertificateStep={() => setActiveStep('select')}
              />
            </div>
            <div className="lg:col-span-7 xl:col-span-8">
              <LivePreviewCanvas
                templateImage={currentTemplateImage}
                isLoadingTemplate={isLoadingTemplate}
                certificateType={selectedType}
                participants={participants}
                previewParticipantIndex={activeDataset.previewIndex}
                dynamicValues={activeDynamicValues}
                calibration={activeCalibration}
                activeField={activeField}
                autoFitLongText={activeSettings.autoFitLongText}
                uppercaseNames={activeSettings.uppercaseNames}
                onChangePreviewIndex={(idx) => updateActiveDataset((ds) => ({ ...ds, previewIndex: idx }))}
                onSelectActiveField={setActiveField}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
