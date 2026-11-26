import React from 'react';
import { ArrowRight, Award, CheckCircle2, FileCheck2, Users } from 'lucide-react';
import {
  CalibrationMap,
  CertificateTypeId,
  ParticipantDataset,
} from '../types/certificate';
import { CERTIFICATE_TYPES } from '../data/certificateConfigs';

interface CertificateSelectorStepProps {
  selectedTypeId: CertificateTypeId;
  datasetsByType: Record<CertificateTypeId, ParticipantDataset>;
  calibrationMap: Record<CertificateTypeId, CalibrationMap>;
  onSelectType: (id: CertificateTypeId) => void;
  onProceedToUpload: () => void;
  onProceedToStudio: () => void;
}

function isCalibrationModified(current: CalibrationMap, defaults: CalibrationMap, hasAnugerah: boolean): boolean {
  const keys: Array<keyof CalibrationMap> = hasAnugerah
    ? ['nama', 'ic', 'anugerah', 'program', 'tarikh']
    : ['nama', 'ic', 'program', 'tarikh'];
  return keys.some(
    (k) => current[k].x !== defaults[k].x || current[k].y !== defaults[k].y || current[k].fontSize !== defaults[k].fontSize
  );
}

export const CertificateSelectorStep: React.FC<CertificateSelectorStepProps> = ({
  selectedTypeId,
  datasetsByType,
  calibrationMap,
  onSelectType,
  onProceedToUpload,
  onProceedToStudio,
}) => {
  const activeDataset = datasetsByType[selectedTypeId];
  const hasParticipants = activeDataset.rows.length > 0;

  return (
    <div className="space-y-5">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pilih Jenis Sijil</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Setiap jenis sijil mempunyai senarai peserta dan kalibrasi posisi teks tersendiri.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasParticipants && (
            <button
              type="button"
              onClick={onProceedToStudio}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 cursor-pointer"
            >
              Terus ke Pratonton
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onProceedToUpload}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer transition-colors shadow-sm"
          >
            Muat Naik Peserta
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Certificate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CERTIFICATE_TYPES.map((cert) => {
          const isSelected = cert.id === selectedTypeId;
          const isAward = cert.category === 'Sijil Penghargaan';
          const dataset = datasetsByType[cert.id];
          const selectedCount = dataset.rows.filter((r) => r.selected).length;
          const modified = isCalibrationModified(calibrationMap[cert.id], cert.defaultCalibration, cert.hasAnugerah);

          return (
            <button
              key={cert.id}
              type="button"
              onClick={() => onSelectType(cert.id)}
              className={`text-left p-5 rounded-xl border-2 transition-all cursor-pointer relative group ${
                isSelected
                  ? 'border-emerald-500 bg-white shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Top Row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className={`p-2 rounded-lg ${isAward ? 'bg-amber-100' : 'bg-sky-100'}`}>
                  {isAward
                    ? <Award className="w-5 h-5 text-amber-600" />
                    : <FileCheck2 className="w-5 h-5 text-sky-600" />}
                </div>
                <div className="flex items-center gap-2">
                  {modified && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                      Dikalibrasi
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-slate-400">Hal. {cert.pageIndex + 1}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
              </div>

              {/* Title */}
              <div>
                <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isAward ? 'text-amber-600' : 'text-sky-600'}`}>
                  {cert.category}
                </div>
                <div className="text-sm font-bold text-slate-900">{cert.track}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {cert.hasAnugerah
                    ? 'Nama · IC · Anugerah · Program · Tarikh'
                    : 'Nama · IC · Program · Tarikh'}
                </div>
              </div>

              {/* Participant Count */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  {dataset.rows.length > 0
                    ? <span><strong className="text-slate-800">{dataset.rows.length}</strong> peserta · {selectedCount} dipilih</span>
                    : <span className="text-slate-400">Belum ada peserta</span>}
                </span>
                {dataset.fileName && (
                  <span className="text-slate-400 truncate max-w-[140px] text-[10px]">{dataset.fileName}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
