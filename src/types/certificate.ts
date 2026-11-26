export type CertificateTypeId =
  | 'penghargaan_bestari'
  | 'penghargaan_belia'
  | 'penyertaan_bestari'
  | 'penyertaan_belia';

export type FieldKey = 'nama' | 'ic' | 'anugerah' | 'program' | 'tarikh';

export interface FieldCalibration {
  x: number;
  y: number;
  fontSize: number;
}

export type CalibrationMap = Record<FieldKey, FieldCalibration>;

export interface CertificateDynamicValues {
  anugerah: string;
  program: string;
  tarikh: string;
}

export interface CertificateSettings {
  autoFitLongText: boolean;
  uppercaseNames: boolean;
}

export interface CertificateTypeDefinition {
  id: CertificateTypeId;
  pageIndex: number; // 0-based index in SIJIL TUNAS MAIM (PRINT).pdf
  title: string;
  category: 'Sijil Penghargaan' | 'Sijil Penyertaan';
  track: 'TUNAS BESTARI' | 'TUNAS BELIA';
  badgeColor: string;
  hasAnugerah: boolean;
  defaultValues: CertificateDynamicValues;
  defaultCalibration: CalibrationMap;
}

export type IcStatus = 'standard' | 'fixable' | 'invalid';

export interface ParticipantRow {
  id: string;
  rowNumber: number;
  nama: string;
  ic: string;
  icStatus: IcStatus;
  icIssues: string[];
  suggestedIc: string | null;
  selected: boolean;
}

export interface ParticipantDataset {
  rows: ParticipantRow[];
  fileName: string | null;
  detectedColumns: { nameCol: string; icCol: string } | null;
  previewIndex: number;
}
