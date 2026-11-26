import { CertificateTypeDefinition, CertificateTypeId, FieldKey } from '../types/certificate';

export const PDF_PAGE_WIDTH = 595.5;
export const PDF_PAGE_HEIGHT = 842.25;
export const DEFAULT_MAX_TEXT_WIDTH = 480; // Matches the horizontal divider line width in template

export const FIELD_LABELS: Record<FieldKey, string> = {
  nama: 'Nama Peserta',
  ic: 'No. Kad Pengenalan',
  anugerah: 'Anugerah',
  program: 'Nama Program / Kem',
  tarikh: 'Tarikh',
};

export const CERTIFICATE_TYPES: CertificateTypeDefinition[] = [
  {
    id: 'penghargaan_bestari',
    pageIndex: 0,
    title: 'Sijil Penghargaan — TUNAS BESTARI',
    category: 'Sijil Penghargaan',
    track: 'TUNAS BESTARI',
    badgeColor: 'emerald',
    hasAnugerah: true,
    defaultValues: {
      anugerah: 'PESERTA TERBAIK (LELAKI)',
      program: 'KEM AKHIR TAHUN',
      tarikh: '4-6 DISEMBER 2026',
    },
    defaultCalibration: {
      nama: { x: 297.5, y: 542.9, fontSize: 20 },
      ic: { x: 297.5, y: 460.9, fontSize: 20 },
      anugerah: { x: 297.5, y: 381.6, fontSize: 28 },
      program: { x: 297.5, y: 295.9, fontSize: 28 },
      tarikh: { x: 297.5, y: 244.9, fontSize: 18 },
    },
  },
  {
    id: 'penghargaan_belia',
    pageIndex: 1,
    title: 'Sijil Penghargaan — TUNAS BELIA',
    category: 'Sijil Penghargaan',
    track: 'TUNAS BELIA',
    badgeColor: 'amber',
    hasAnugerah: true,
    defaultValues: {
      anugerah: 'PESERTA TERBAIK (PEREMPUAN)',
      program: 'KEM KEPIMPINAN BELIA',
      tarikh: '11-13 DISEMBER 2026',
    },
    defaultCalibration: {
      nama: { x: 297.5, y: 542.9, fontSize: 20 },
      ic: { x: 297.5, y: 460.9, fontSize: 20 },
      anugerah: { x: 297.5, y: 381.6, fontSize: 28 },
      program: { x: 297.5, y: 295.9, fontSize: 28 },
      tarikh: { x: 297.5, y: 244.9, fontSize: 18 },
    },
  },
  {
    id: 'penyertaan_bestari',
    pageIndex: 2,
    title: 'Sijil Penyertaan — TUNAS BESTARI',
    category: 'Sijil Penyertaan',
    track: 'TUNAS BESTARI',
    badgeColor: 'teal',
    hasAnugerah: false,
    defaultValues: {
      anugerah: '',
      program: 'KEM AKHIR TAHUN',
      tarikh: '4-6 DISEMBER 2026',
    },
    defaultCalibration: {
      nama: { x: 297.5, y: 542.9, fontSize: 20 },
      ic: { x: 297.5, y: 460.9, fontSize: 20 },
      anugerah: { x: 297.5, y: 381.6, fontSize: 28 },
      program: { x: 297.5, y: 381.6, fontSize: 28 },
      tarikh: { x: 297.5, y: 244.9, fontSize: 18 },
    },
  },
  {
    id: 'penyertaan_belia',
    pageIndex: 3,
    title: 'Sijil Penyertaan — TUNAS BELIA',
    category: 'Sijil Penyertaan',
    track: 'TUNAS BELIA',
    badgeColor: 'sky',
    hasAnugerah: false,
    defaultValues: {
      anugerah: '',
      program: 'KEM KEPIMPINAN BELIA',
      tarikh: '11-13 DISEMBER 2026',
    },
    defaultCalibration: {
      nama: { x: 297.5, y: 542.9, fontSize: 20 },
      ic: { x: 297.5, y: 460.9, fontSize: 20 },
      anugerah: { x: 297.5, y: 381.6, fontSize: 28 },
      program: { x: 297.5, y: 381.6, fontSize: 28 },
      tarikh: { x: 297.5, y: 244.9, fontSize: 18 },
    },
  },
];

export function getCertificateType(id: CertificateTypeId): CertificateTypeDefinition {
  const found = CERTIFICATE_TYPES.find((c) => c.id === id);
  if (!found) {
    throw new Error(`Unknown certificate type: ${id}`);
  }
  return found;
}
