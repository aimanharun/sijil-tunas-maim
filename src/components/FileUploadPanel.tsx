import React, { useRef, useState } from 'react';
import { FileSpreadsheet, FileText, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

interface FileUploadPanelProps {
  activeCertificateTitle: string;
  participantFileName: string | null;
  participantCount: number;
  detectedColumns: { nameCol: string; icCol: string } | null;
  templateFileName: string;
  templatePageCount: number;
  onUploadParticipants: (file: File) => Promise<void>;
  onUploadTemplatePdf: (file: File) => Promise<void>;
  onResetDefaultTemplate: () => Promise<void>;
  errorMessage: string | null;
}

export const FileUploadPanel: React.FC<FileUploadPanelProps> = ({
  activeCertificateTitle,
  participantFileName,
  participantCount,
  detectedColumns,
  templateFileName,
  templatePageCount,
  onUploadParticipants,
  onUploadTemplatePdf,
  onResetDefaultTemplate,
  errorMessage,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const spreadsheetInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.name.toLowerCase().endsWith('.pdf')) await onUploadTemplatePdf(file);
    else await onUploadParticipants(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

      {/* Excel/CSV Upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`lg:col-span-2 rounded-xl border-2 border-dashed p-5 transition-colors ${
          isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-white hover:border-emerald-400'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-sm font-semibold text-slate-900">Muat Naik Senarai Peserta</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                  {activeCertificateTitle}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Fail <code className="bg-slate-100 px-1 rounded">.xlsx</code>,{' '}
                <code className="bg-slate-100 px-1 rounded">.xls</code> atau{' '}
                <code className="bg-slate-100 px-1 rounded">.csv</code> — perlu ada lajur{' '}
                <strong className="text-slate-700">NAMA PESERTA</strong> &{' '}
                <strong className="text-slate-700">NO. KAD PENGENALAN</strong>
              </p>

              {participantFileName && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {participantFileName} · {participantCount} peserta
                  </span>
                  {detectedColumns && (
                    <span className="text-slate-400">
                      Lajur: <strong className="text-slate-600">{detectedColumns.nameCol}</strong> &{' '}
                      <strong className="text-slate-600">{detectedColumns.icCol}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <input
              ref={spreadsheetInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void onUploadParticipants(f); e.target.value = ''; }}
            />
            <button
              type="button"
              onClick={() => spreadsheetInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              Pilih Fail
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-3 flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Template PDF */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">Sijil Rujukan</h2>
            <p className="text-xs text-slate-500 truncate mt-0.5" title={templateFileName}>{templateFileName}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{templatePageCount} halaman · previu kalibrasi sahaja</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            ref={pdfInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void onUploadTemplatePdf(f); e.target.value = ''; }}
          />
          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Tukar Sijil
          </button>
          {templateFileName !== 'SIJIL TUNAS MAIM (PRINT).pdf' && (
            <button
              type="button"
              onClick={() => void onResetDefaultTemplate()}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 cursor-pointer"
            >
              Asal
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
