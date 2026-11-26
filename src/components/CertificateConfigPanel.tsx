import React, { useMemo, useState } from 'react';
import {
  Award,
  Check,
  Copy,
  FileCheck2,
  RotateCcw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  CalibrationMap,
  CertificateDynamicValues,
  CertificateTypeDefinition,
  CertificateTypeId,
  FieldCalibration,
  FieldKey,
} from '../types/certificate';
import {
  CERTIFICATE_TYPES,
  FIELD_LABELS,
  PDF_PAGE_HEIGHT,
  PDF_PAGE_WIDTH,
} from '../data/certificateConfigs';

interface CertificateConfigPanelProps {
  selectedType: CertificateTypeDefinition;
  dynamicValues: CertificateDynamicValues;
  calibration: CalibrationMap;
  activeField: FieldKey;
  autoFitLongText: boolean;
  uppercaseNames: boolean;
  onChangeDynamicValue: (field: keyof CertificateDynamicValues, value: string) => void;
  onSelectActiveField: (field: FieldKey) => void;
  onChangeCalibration: (field: FieldKey, next: Partial<FieldCalibration>) => void;
  onResetCalibration: () => void;
  onCopyCalibrationToTargets: (targetIds: CertificateTypeId[], fields: FieldKey[], includeDisplaySettings: boolean) => void;
  onToggleAutoFit: (val: boolean) => void;
  onToggleUppercaseNames: (val: boolean) => void;
  onSwitchCertificateStep: () => void;
}

const ANUGERAH_PRESETS = ['PESERTA TERBAIK (LELAKI)', 'PESERTA TERBAIK (PEREMPUAN)', 'PESERTA HARAPAN'];

export const CertificateConfigPanel: React.FC<CertificateConfigPanelProps> = ({
  selectedType,
  dynamicValues,
  calibration,
  activeField,
  autoFitLongText,
  uppercaseNames,
  onChangeDynamicValue,
  onSelectActiveField,
  onChangeCalibration,
  onResetCalibration,
  onCopyCalibrationToTargets,
  onToggleAutoFit,
  onToggleUppercaseNames,
  onSwitchCertificateStep,
}) => {
  const availableFields: FieldKey[] = useMemo(
    () => selectedType.hasAnugerah ? ['nama', 'ic', 'anugerah', 'program', 'tarikh'] : ['nama', 'ic', 'program', 'tarikh'],
    [selectedType.hasAnugerah]
  );

  const otherCertTypes = useMemo(() => CERTIFICATE_TYPES.filter((c) => c.id !== selectedType.id), [selectedType.id]);

  const [copyPanelOpen, setCopyPanelOpen] = useState(false);
  const [copyFields, setCopyFields] = useState<FieldKey[]>(['nama', 'ic', 'anugerah', 'program', 'tarikh']);
  const [copyTargets, setCopyTargets] = useState<CertificateTypeId[]>(() => otherCertTypes.map((c) => c.id));
  const [copyDisplaySettings, setCopyDisplaySettings] = useState(true);
  const [copySuccessMsg, setCopySuccessMsg] = useState<string | null>(null);

  const safeActiveField: FieldKey = availableFields.includes(activeField) ? activeField : 'nama';
  const activeCal = calibration[safeActiveField];

  const nudge = (axis: keyof FieldCalibration, delta: number) => {
    onChangeCalibration(safeActiveField, { [axis]: Number((activeCal[axis] + delta).toFixed(1)) });
  };

  const effectiveCopyTargets = copyTargets.filter((id) => id !== selectedType.id);
  const effectiveCopyFields = copyFields.filter((f) => availableFields.includes(f));

  const toggleCopyField = (fk: FieldKey) => setCopyFields((prev) => prev.includes(fk) ? prev.filter((i) => i !== fk) : [...prev, fk]);
  const toggleCopyTarget = (id: CertificateTypeId) => setCopyTargets((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const handleApplyCopy = () => {
    if (effectiveCopyTargets.length === 0 || effectiveCopyFields.length === 0) return;
    onCopyCalibrationToTargets(effectiveCopyTargets, effectiveCopyFields, copyDisplaySettings);
    setCopySuccessMsg(`Disalin ke ${effectiveCopyTargets.length} sijil.`);
    setTimeout(() => setCopySuccessMsg(null), 3000);
  };

  const isAward = selectedType.category === 'Sijil Penghargaan';

  return (
    <div className="space-y-3">

      {/* ── Sijil Aktif ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              isAward ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
            }`}>
              {isAward ? <Award className="w-3 h-3" /> : <FileCheck2 className="w-3 h-3" />}
              {selectedType.category}
            </span>
            <span className="text-[10px] font-mono text-slate-400">Hal. {selectedType.pageIndex + 1}</span>
          </div>
          <div className="text-sm font-bold text-slate-900">{selectedType.title}</div>
        </div>
        <button
          type="button"
          onClick={onSwitchCertificateStep}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer shrink-0"
        >
          Tukar
        </button>
      </div>

      {/* ── Medan Dinamik ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Medan Dinamik</h3>

        {selectedType.hasAnugerah && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Anugerah <span className="text-amber-500 font-normal">(Sijil Penghargaan)</span>
            </label>
            <input
              type="text"
              value={dynamicValues.anugerah}
              onChange={(e) => onChangeDynamicValue('anugerah', e.target.value)}
              onFocus={() => onSelectActiveField('anugerah')}
              placeholder="Contoh: PESERTA TERBAIK (LELAKI)"
              className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {ANUGERAH_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangeDynamicValue('anugerah', preset)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-medium cursor-pointer"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Program / Kem</label>
          <input
            type="text"
            value={dynamicValues.program}
            onChange={(e) => onChangeDynamicValue('program', e.target.value)}
            onFocus={() => onSelectActiveField('program')}
            placeholder="Contoh: KEM AKHIR TAHUN"
            className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Tarikh Program</label>
          <input
            type="text"
            value={dynamicValues.tarikh}
            onChange={(e) => onChangeDynamicValue('tarikh', e.target.value)}
            onFocus={() => onSelectActiveField('tarikh')}
            placeholder="Contoh: 4-6 DISEMBER 2026"
            className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-2">
          <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input type="checkbox" checked={autoFitLongText} onChange={(e) => onToggleAutoFit(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            Auto-kecilkan fon jika teks panjang
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input type="checkbox" checked={uppercaseNames} onChange={(e) => onToggleUppercaseNames(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            Nama peserta dalam HURUF BESAR
          </label>
        </div>
      </div>

      {/* ── Kalibrasi Koordinat ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            Kalibrasi Posisi & Saiz Fon
          </h3>
          <button type="button" onClick={onResetCalibration} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">
            <RotateCcw className="w-3 h-3" />
            Set Semula
          </button>
        </div>

        {/* Field Selector */}
        <div className="flex flex-wrap gap-1.5">
          {availableFields.map((fk) => (
            <button
              key={fk}
              type="button"
              onClick={() => onSelectActiveField(fk)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                safeActiveField === fk ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {FIELD_LABELS[fk]}
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Kalibrasi: <span className="text-emerald-600">{FIELD_LABELS[safeActiveField]}</span>
            </span>
            <button
              type="button"
              onClick={() => onChangeCalibration(safeActiveField, { x: 297.5 })}
              className="text-[11px] text-emerald-600 hover:underline cursor-pointer font-medium"
            >
              Pusat X
            </button>
          </div>

          {/* X */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 font-medium">X — Tengah (pt)</span>
              <div className="inline-flex shrink-0 items-center rounded-lg border border-slate-200 overflow-hidden bg-white">
                <button type="button" onClick={() => nudge('x', -1)} className="w-9 shrink-0 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer text-xs font-bold border-r border-slate-200 select-none">−1</button>
                <input type="number" step="0.5" min={50} max={PDF_PAGE_WIDTH - 50} value={activeCal.x}
                  onChange={(e) => onChangeCalibration(safeActiveField, { x: Number(e.target.value) || 297.5 })}
                  className="calibration-number w-20 min-w-0 px-1 py-1 text-center font-mono text-xs bg-white focus:outline-none"
                />
                <button type="button" onClick={() => nudge('x', 1)} className="w-9 shrink-0 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer text-xs font-bold border-l border-slate-200 select-none">+1</button>
              </div>
            </div>
            <input type="range" min={100} max={PDF_PAGE_WIDTH - 100} step={0.5} value={activeCal.x}
              onChange={(e) => onChangeCalibration(safeActiveField, { x: Number(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Y */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 font-medium">Y — Dari Bawah (pt)</span>
              <div className="inline-flex shrink-0 items-center rounded-lg border border-slate-200 overflow-hidden bg-white">
                <button type="button" onClick={() => nudge('y', -1)} className="w-9 shrink-0 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer text-xs font-bold border-r border-slate-200 select-none" title="Turun">↓1</button>
                <input type="number" step="0.5" min={40} max={PDF_PAGE_HEIGHT - 40} value={activeCal.y}
                  onChange={(e) => onChangeCalibration(safeActiveField, { y: Number(e.target.value) || 300 })}
                  className="calibration-number w-20 min-w-0 px-1 py-1 text-center font-mono text-xs bg-white focus:outline-none"
                />
                <button type="button" onClick={() => nudge('y', 1)} className="w-9 shrink-0 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer text-xs font-bold border-l border-slate-200 select-none" title="Naik">↑1</button>
              </div>
            </div>
            <input type="range" min={80} max={PDF_PAGE_HEIGHT - 120} step={0.5} value={activeCal.y}
              onChange={(e) => onChangeCalibration(safeActiveField, { y: Number(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Font Size */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 font-medium">Saiz Fon (pt)</span>
              <div className="inline-flex shrink-0 items-center rounded-lg border border-slate-200 overflow-hidden bg-white">
                <button type="button" onClick={() => nudge('fontSize', -1)} className="w-9 shrink-0 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer text-xs font-bold border-r border-slate-200 select-none">−1</button>
                <input type="number" step="0.5" min={8} max={48} value={activeCal.fontSize}
                  onChange={(e) => onChangeCalibration(safeActiveField, { fontSize: Math.max(8, Number(e.target.value) || 18) })}
                  className="calibration-number w-20 min-w-0 px-1 py-1 text-center font-mono text-xs bg-white focus:outline-none"
                />
                <button type="button" onClick={() => nudge('fontSize', 1)} className="w-9 shrink-0 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer text-xs font-bold border-l border-slate-200 select-none">+1</button>
              </div>
            </div>
            <input type="range" min={10} max={42} step={0.5} value={activeCal.fontSize}
              onChange={(e) => onChangeCalibration(safeActiveField, { fontSize: Number(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Copy Panel */}
        <div className="border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setCopyPanelOpen((v) => !v)}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            {copyPanelOpen ? 'Tutup Panel Salin' : 'Salin Posisi ke Sijil Lain'}
          </button>

          {copyPanelOpen && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
              {/* Fields to copy */}
              <div>
                <div className="text-[11px] font-bold text-slate-600 uppercase mb-1.5">Medan yang disalin</div>
                <div className="flex flex-wrap gap-1.5">
                  {availableFields.map((fk) => {
                    const checked = effectiveCopyFields.includes(fk);
                    return (
                      <label key={fk} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
                        checked ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-medium' : 'bg-white border-slate-200 text-slate-500'
                      }`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCopyField(fk)} className="w-3.5 h-3.5 rounded text-emerald-600" />
                        {FIELD_LABELS[fk]}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Target certs */}
              <div>
                <div className="text-[11px] font-bold text-slate-600 uppercase mb-1.5">Sasaran sijil</div>
                <div className="space-y-1.5">
                  {otherCertTypes.map((cert) => {
                    const checked = effectiveCopyTargets.includes(cert.id);
                    return (
                      <label key={cert.id} className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer ${
                        checked ? 'bg-white border-emerald-400 text-slate-900 font-medium' : 'bg-white/60 border-slate-200 text-slate-500'
                      }`}>
                        <span className="inline-flex items-center gap-2">
                          <input type="checkbox" checked={checked} onChange={() => toggleCopyTarget(cert.id)} className="w-3.5 h-3.5 rounded text-emerald-600" />
                          {cert.title}
                        </span>
                        {!cert.hasAnugerah && effectiveCopyFields.includes('anugerah') && (
                          <span className="text-[10px] text-slate-400">(Anugerah diabaikan)</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" checked={copyDisplaySettings} onChange={(e) => setCopyDisplaySettings(e.target.checked)} className="w-3.5 h-3.5 rounded text-emerald-600" />
                Salin juga tetapan Auto-kecil & Huruf Besar
              </label>

              <button
                type="button"
                disabled={effectiveCopyTargets.length === 0 || effectiveCopyFields.length === 0}
                onClick={handleApplyCopy}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-40 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Terapkan ({effectiveCopyTargets.length} sijil)
              </button>

              {copySuccessMsg && (
                <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                  ✓ {copySuccessMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
