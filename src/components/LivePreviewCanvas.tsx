import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Eye,
  Layers,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  CalibrationMap,
  CertificateDynamicValues,
  CertificateTypeDefinition,
  FieldKey,
  ParticipantRow,
} from '../types/certificate';
import { RenderedTemplatePage } from '../utils/pdfService';
import { DEFAULT_MAX_TEXT_WIDTH, FIELD_LABELS } from '../data/certificateConfigs';

interface LivePreviewCanvasProps {
  templateImage: RenderedTemplatePage | null;
  isLoadingTemplate: boolean;
  certificateType: CertificateTypeDefinition;
  participants: ParticipantRow[];
  previewParticipantIndex: number;
  dynamicValues: CertificateDynamicValues;
  calibration: CalibrationMap;
  activeField: FieldKey;
  autoFitLongText: boolean;
  uppercaseNames: boolean;
  onChangePreviewIndex: (idx: number) => void;
  onSelectActiveField: (field: FieldKey) => void;
}

const measureCtx =
  typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;

function computeFittedFontSize(text: string, baseSize: number, maxWidth: number, enabled: boolean): number {
  if (!enabled || !text || !measureCtx) return baseSize;
  measureCtx.font = `700 ${baseSize}px Helvetica, Arial, sans-serif`;
  const measured = measureCtx.measureText(text).width;
  if (measured <= maxWidth) return baseSize;
  return Math.max(9, (baseSize * maxWidth) / measured);
}

export const LivePreviewCanvas: React.FC<LivePreviewCanvasProps> = ({
  templateImage,
  isLoadingTemplate,
  certificateType,
  participants,
  previewParticipantIndex,
  dynamicValues,
  calibration,
  activeField,
  autoFitLongText,
  uppercaseNames,
  onChangePreviewIndex,
  onSelectActiveField,
}) => {
  const [showGuides, setShowGuides] = useState(true);
  const [whiteOutputPreview, setWhiteOutputPreview] = useState(false);
  const [zoomPercent, setZoomPercent] = useState(100);

  const currentParticipant = participants[previewParticipantIndex] ?? null;

  const previewItems = useMemo(() => {
    const rawName = currentParticipant?.nama || 'NAMA PESERTA CONTOH';
    const displayName = uppercaseNames ? rawName.toUpperCase() : rawName;
    const displayIc = currentParticipant?.ic || '101010-10-1010';

    const items: Array<{ key: FieldKey; text: string; maxWidth: number }> = [
      { key: 'nama', text: displayName, maxWidth: DEFAULT_MAX_TEXT_WIDTH },
      { key: 'ic', text: displayIc, maxWidth: DEFAULT_MAX_TEXT_WIDTH },
    ];
    if (certificateType.hasAnugerah) {
      items.push({ key: 'anugerah', text: dynamicValues.anugerah, maxWidth: 520 });
    }
    items.push(
      { key: 'program', text: dynamicValues.program, maxWidth: 520 },
      { key: 'tarikh', text: dynamicValues.tarikh, maxWidth: 520 }
    );
    return items;
  }, [currentParticipant, uppercaseNames, certificateType.hasAnugerah, dynamicValues]);

  const pageWidth = templateImage?.width ?? 595.5;
  const pageHeight = templateImage?.height ?? 842.25;
  const activeCal = calibration[activeField];
  const activeSvgY = pageHeight - activeCal.y;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">

      {/* ── Top Bar ── */}
      <div className="px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Pratonton</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
            {certificateType.title}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Template / White toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setWhiteOutputPreview(false)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium cursor-pointer ${
                !whiteOutputPreview ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Latar templat sijil"
            >
              <Layers className="w-3 h-3" />
              Templat
            </button>
            <button
              type="button"
              onClick={() => setWhiteOutputPreview(true)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium cursor-pointer ${
                whiteOutputPreview ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Output PDF sebenar (latar putih)"
            >
              <Eye className="w-3 h-3" />
              Latar Putih
            </button>
          </div>

          {/* Guides toggle */}
          <button
            type="button"
            onClick={() => setShowGuides((v) => !v)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer border ${
              showGuides ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            Panduan
          </button>

          {/* Zoom */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden text-xs">
            <button type="button" onClick={() => setZoomPercent((z) => Math.max(60, z - 15))} className="p-1.5 hover:bg-slate-100 text-slate-500 cursor-pointer" title="Zum Keluar">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-600">{zoomPercent}%</span>
            <button type="button" onClick={() => setZoomPercent((z) => Math.min(160, z + 15))} className="p-1.5 hover:bg-slate-100 text-slate-500 cursor-pointer" title="Zum Masuk">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Participant Switcher ── */}
      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between gap-2 bg-white">
        <button
          type="button"
          disabled={participants.length === 0 || previewParticipantIndex <= 0}
          onClick={() => onChangePreviewIndex(Math.max(0, previewParticipantIndex - 1))}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Sebelum
        </button>

        <div className="flex-1 max-w-sm">
          {participants.length > 0 ? (
            <select
              value={previewParticipantIndex}
              onChange={(e) => onChangePreviewIndex(Number(e.target.value))}
              className="w-full px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              {participants.map((p, idx) => (
                <option key={p.id} value={idx}>#{p.rowNumber} — {p.nama} ({p.ic})</option>
              ))}
            </select>
          ) : (
            <div className="text-center text-xs text-slate-400">Tiada peserta — memaparkan teks contoh</div>
          )}
        </div>

        <button
          type="button"
          disabled={participants.length === 0 || previewParticipantIndex >= participants.length - 1}
          onClick={() => onChangePreviewIndex(Math.min(participants.length - 1, previewParticipantIndex + 1))}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
        >
          Seterusnya
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Canvas Area ── */}
      <div className="bg-slate-200/80 p-4 sm:p-6 overflow-auto flex justify-center items-start min-h-[480px] max-h-[780px]">
        {!whiteOutputPreview && (isLoadingTemplate || !templateImage) ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <span>Memuatkan templat PDF...</span>
          </div>
        ) : (
          <div
            className="relative bg-white shadow-xl ring-1 ring-slate-900/10 shrink-0 transition-all"
            style={{ width: `${(520 * zoomPercent) / 100}px`, aspectRatio: `${pageWidth} / ${pageHeight}` }}
          >
            {!whiteOutputPreview && templateImage && (
              <img
                src={templateImage.dataUrl}
                alt={`Templat ${certificateType.title}`}
                className="w-full h-full block select-none pointer-events-none"
              />
            )}

            <svg viewBox={`0 0 ${pageWidth} ${pageHeight}`} className="absolute inset-0 w-full h-full">
              {showGuides && (
                <g pointerEvents="none">
                  <line x1={activeCal.x} y1={0} x2={activeCal.x} y2={pageHeight} stroke="#059669" strokeWidth="0.9" strokeDasharray="4 3" opacity="0.7" />
                  <line x1={40} y1={activeSvgY} x2={pageWidth - 40} y2={activeSvgY} stroke="#d97706" strokeWidth="0.9" strokeDasharray="3 3" opacity="0.85" />
                  <rect x={42} y={activeSvgY - 14} width={120} height={13} rx={3} fill="#d97706" opacity="0.9" />
                  <text x={46} y={activeSvgY - 5} fontSize="8" fontWeight="600" fill="#ffffff" fontFamily="sans-serif">
                    {FIELD_LABELS[activeField]} ({activeCal.x.toFixed(1)}, {activeCal.y.toFixed(1)})
                  </text>
                </g>
              )}

              {previewItems.map((item) => {
                const cal = calibration[item.key];
                const fittedSize = computeFittedFontSize(item.text, cal.fontSize, item.maxWidth, autoFitLongText);
                const svgY = pageHeight - cal.y;
                const isActive = item.key === activeField;
                return (
                  <g key={item.key} onClick={() => onSelectActiveField(item.key)} className="cursor-pointer">
                    {showGuides && isActive && <circle cx={cal.x} cy={svgY} r={3} fill="#d97706" opacity="0.9" />}
                    <text
                      x={cal.x}
                      y={svgY}
                      textAnchor="middle"
                      dominantBaseline="alphabetic"
                      fontSize={fittedSize}
                      fontWeight="700"
                      fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
                      fill="#000000"
                    >
                      {item.text}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-400 flex items-center justify-between gap-2">
        <span>
          {whiteOutputPreview
            ? 'Output PDF — teks sahaja pada latar putih'
            : 'Klik teks pada sijil untuk memilih medan kalibrasi'}
        </span>
        <span className="font-mono">{pageWidth.toFixed(0)} × {pageHeight.toFixed(0)} pt</span>
      </div>
    </div>
  );
};
