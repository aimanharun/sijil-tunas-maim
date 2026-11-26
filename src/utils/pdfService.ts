import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import {
  CalibrationMap,
  CertificateDynamicValues,
  CertificateTypeDefinition,
  ParticipantRow,
} from '../types/certificate';
import {
  DEFAULT_MAX_TEXT_WIDTH,
  PDF_PAGE_HEIGHT,
  PDF_PAGE_WIDTH,
} from '../data/certificateConfigs';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export interface RenderedTemplatePage {
  pageIndex: number;
  width: number;
  height: number;
  dataUrl: string;
}

export function sanitizePdfText(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

export async function renderTemplatePageToImage(
  pdfBytes: ArrayBuffer,
  pageIndex: number,
  scale = 2
): Promise<RenderedTemplatePage> {
  // Clone bytes because pdf.js detaches the buffer transferred to its worker
  const copy = new Uint8Array(pdfBytes.slice(0));
  const loadingTask = pdfjsLib.getDocument({ data: copy });
  const pdfDoc = await loadingTask.promise;

  const clampedIndex = Math.max(0, Math.min(pageIndex, pdfDoc.numPages - 1));
  const page = await pdfDoc.getPage(clampedIndex + 1);
  const baseViewport = page.getViewport({ scale: 1 });
  const renderViewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(renderViewport.width);
  canvas.height = Math.round(renderViewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Gagal mendapatkan konteks kanvas 2D untuk pratonton PDF.');
  }

  await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
  const dataUrl = canvas.toDataURL('image/png');
  await pdfDoc.destroy();

  return {
    pageIndex: clampedIndex,
    width: baseViewport.width,
    height: baseViewport.height,
    dataUrl,
  };
}

export async function getPdfPageCount(pdfBytes: ArrayBuffer): Promise<number> {
  const doc = await PDFDocument.load(pdfBytes);
  return doc.getPageCount();
}

export interface BulkGenerateOptions {
  templateBytes?: ArrayBuffer | null;
  certificateType: CertificateTypeDefinition;
  participants: ParticipantRow[];
  dynamicValues: CertificateDynamicValues;
  calibration: CalibrationMap;
  autoFitLongText: boolean;
  uppercaseNames: boolean;
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Generates a print-ready multi-page PDF with a plain white background
 * containing ONLY the calibrated overlay text fields (Nama, IC, Anugerah if applicable,
 * Nama Program/Kem, and Tarikh).
 */
export async function generateBulkCertificatesPdf(
  options: BulkGenerateOptions
): Promise<Uint8Array> {
  const {
    templateBytes,
    certificateType,
    participants,
    dynamicValues,
    calibration,
    autoFitLongText,
    uppercaseNames,
    onProgress,
  } = options;

  if (participants.length === 0) {
    throw new Error('Tiada peserta dipilih untuk dijana.');
  }

  let pageWidth = PDF_PAGE_WIDTH;
  let pageHeight = PDF_PAGE_HEIGHT;

  if (templateBytes) {
    const srcDoc = await PDFDocument.load(templateBytes);
    const safeIdx = Math.min(certificateType.pageIndex, Math.max(0, srcDoc.getPageCount() - 1));
    const refPage = srcDoc.getPage(safeIdx);
    const size = refPage.getSize();
    pageWidth = size.width;
    pageHeight = size.height;
  }

  const outDoc = await PDFDocument.create();
  const boldFont = await outDoc.embedFont(StandardFonts.HelveticaBold);

  const drawCenteredField = (
    page: ReturnType<PDFDocument['getPage']>,
    rawText: string,
    cal: { x: number; y: number; fontSize: number },
    maxWidth: number
  ) => {
    const text = sanitizePdfText(rawText.trim());
    if (!text) return;

    let size = cal.fontSize;
    let width = boldFont.widthOfTextAtSize(text, size);
    if (autoFitLongText && width > maxWidth) {
      size = Math.max(9, (size * maxWidth) / width);
      width = boldFont.widthOfTextAtSize(text, size);
    }

    page.drawText(text, {
      x: cal.x - width / 2,
      y: cal.y,
      size,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
  };

  for (let i = 0; i < participants.length; i++) {
    const p = participants[i];
    const page = outDoc.addPage([pageWidth, pageHeight]);

    // Explicit plain white background only (no template borders, logo, or static text)
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: rgb(1, 1, 1),
    });

    const displayName = uppercaseNames ? p.nama.toUpperCase() : p.nama;
    drawCenteredField(page, displayName, calibration.nama, DEFAULT_MAX_TEXT_WIDTH);
    drawCenteredField(page, p.ic, calibration.ic, DEFAULT_MAX_TEXT_WIDTH);

    if (certificateType.hasAnugerah) {
      drawCenteredField(page, dynamicValues.anugerah, calibration.anugerah, 520);
    }

    drawCenteredField(page, dynamicValues.program, calibration.program, 520);
    drawCenteredField(page, dynamicValues.tarikh, calibration.tarikh, 520);

    if (onProgress && (i % 10 === 0 || i === participants.length - 1)) {
      onProgress(i + 1, participants.length);
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  return outDoc.save();
}
