import * as XLSX from 'xlsx';
import { IcStatus, ParticipantRow } from '../types/certificate';

export interface IcValidationResult {
  icStatus: IcStatus;
  icIssues: string[];
  suggestedIc: string | null;
}

const STANDARD_IC_REGEX = /^\d{6}-\d{2}-\d{4}$/;

function isValidYyMmDd(sixDigits: string): { valid: boolean; reason?: string } {
  const yy = Number(sixDigits.slice(0, 2));
  const mm = Number(sixDigits.slice(2, 4));
  const dd = Number(sixDigits.slice(4, 6));

  if (mm < 1 || mm > 12) {
    return { valid: false, reason: `Bulan lahir tidak sah (${sixDigits.slice(2, 4)})` };
  }

  // Approximate century for leap-year validation (2000s vs 1900s)
  const fullYear = yy <= 30 ? 2000 + yy : 1900 + yy;
  const maxDay = new Date(fullYear, mm, 0).getDate();
  if (dd < 1 || dd > maxDay) {
    return {
      valid: false,
      reason: `Tarikh lahir tidak sah (hari ${sixDigits.slice(4, 6)} untuk bulan ${sixDigits.slice(2, 4)})`,
    };
  }
  return { valid: true };
}

export function validateMalaysianIc(rawInput: string): IcValidationResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      icStatus: 'invalid',
      icIssues: ['No. Kad Pengenalan kosong'],
      suggestedIc: null,
    };
  }

  const issues: string[] = [];
  const digitsOnly = trimmed.replace(/\D/g, '');
  const hasInvalidChars = /[^0-9\-\s]/.test(trimmed);

  if (hasInvalidChars) {
    issues.push('Mengandungi aksara bukan nombor/sengkang');
  }

  if (digitsOnly.length !== 12) {
    issues.push(`Jumlah digit bukan 12 (${digitsOnly.length} digit)`);
    return {
      icStatus: 'invalid',
      icIssues: issues,
      suggestedIc: null,
    };
  }

  const formatted = `${digitsOnly.slice(0, 6)}-${digitsOnly.slice(6, 8)}-${digitsOnly.slice(8, 12)}`;
  const dateCheck = isValidYyMmDd(digitsOnly.slice(0, 6));
  if (!dateCheck.valid && dateCheck.reason) {
    issues.push(dateCheck.reason);
  }

  const isStandardPattern = STANDARD_IC_REGEX.test(trimmed);
  if (!isStandardPattern) {
    if (trimmed.includes(' ')) {
      issues.push('Menggunakan jarak (space) menggantikan sengkang (-)');
    } else if (!trimmed.includes('-')) {
      issues.push('Tiada sengkang (format patut XXXXXX-XX-XXXX)');
    } else {
      issues.push('Kedudukan sengkang tidak standard (patut XXXXXX-XX-XXXX)');
    }
  }

  if (issues.length === 0) {
    return {
      icStatus: 'standard',
      icIssues: [],
      suggestedIc: null,
    };
  }

  // If 12 digits and date is valid, it is cleanly auto-fixable to XXXXXX-XX-XXXX
  if (!isStandardPattern && dateCheck.valid && !hasInvalidChars) {
    return {
      icStatus: 'fixable',
      icIssues: issues,
      suggestedIc: formatted,
    };
  }

  // Invalid date or unexpected characters even with 12 digits
  return {
    icStatus: 'invalid',
    icIssues: issues,
    suggestedIc: !isStandardPattern && !hasInvalidChars ? formatted : null,
  };
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function findColumnIndex(headers: string[], candidates: string[]): number {
  for (const cand of candidates) {
    const exact = headers.findIndex((h) => h === cand);
    if (exact !== -1) return exact;
  }
  for (const cand of candidates) {
    const partial = headers.findIndex((h) => h.includes(cand));
    if (partial !== -1) return partial;
  }
  return -1;
}

export function createParticipantRow(
  rowNumber: number,
  nama: string,
  ic: string,
  selected = true
): ParticipantRow {
  const cleanNama = nama.replace(/\s+/g, ' ').trim();
  const cleanIc = String(ic ?? '').trim();
  const validation = validateMalaysianIc(cleanIc);
  return {
    id: `row-${rowNumber}-${Math.random().toString(36).slice(2, 8)}`,
    rowNumber,
    nama: cleanNama,
    ic: cleanIc,
    icStatus: validation.icStatus,
    icIssues: validation.icIssues,
    suggestedIc: validation.suggestedIc,
    selected,
  };
}

export function parseSpreadsheetBuffer(buffer: ArrayBuffer): {
  rows: ParticipantRow[];
  detectedColumns: { nameCol: string; icCol: string };
} {
  const workbook = XLSX.read(buffer, { type: 'array', raw: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Fail tidak mempunyai helaian (sheet) data.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rawMatrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  if (rawMatrix.length === 0) {
    throw new Error('Fail kosong — tiada rekod peserta dijumpai.');
  }

  // Locate header row (first non-empty row, ideally containing NAMA)
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(rawMatrix.length, 10); i++) {
    const normalized = rawMatrix[i].map(normalizeHeader);
    if (normalized.some((cell) => cell.includes('NAMA'))) {
      headerRowIdx = i;
      break;
    }
  }

  const rawHeaders = rawMatrix[headerRowIdx] ?? [];
  const normalizedHeaders = rawHeaders.map(normalizeHeader);

  let nameColIdx = findColumnIndex(normalizedHeaders, [
    'NAMA PESERTA',
    'NAMA PENUH',
    'NAMA',
    'NAME',
  ]);
  let icColIdx = findColumnIndex(normalizedHeaders, [
    'NO. KAD PENGENALAN PESERTA',
    'NO KAD PENGENALAN PESERTA',
    'NO. KAD PENGENALAN',
    'NO KAD PENGENALAN',
    'KAD PENGENALAN',
    'NO. KP',
    'NO KP',
    'NO. IC',
    'NO IC',
    'IC',
  ]);

  // Fallback to columns 0 and 1 if headers weren't matched
  let startDataRow = headerRowIdx + 1;
  if (nameColIdx === -1 && icColIdx === -1 && rawHeaders.length >= 2) {
    nameColIdx = 0;
    icColIdx = 1;
    // Check if first row looks like data instead of header
    const secondCell = String(rawHeaders[1] ?? '').trim();
    if (/^\d{6}/.test(secondCell)) {
      startDataRow = headerRowIdx;
    }
  } else {
    if (nameColIdx === -1) nameColIdx = 0;
    if (icColIdx === -1) icColIdx = nameColIdx === 0 ? 1 : 0;
  }

  const participants: ParticipantRow[] = [];
  for (let i = startDataRow; i < rawMatrix.length; i++) {
    const row = rawMatrix[i];
    if (!row) continue;
    const rawName = String(row[nameColIdx] ?? '').trim();
    const rawIc = String(row[icColIdx] ?? '').trim();
    if (!rawName && !rawIc) continue;
    participants.push(createParticipantRow(participants.length + 1, rawName, rawIc, true));
  }

  if (participants.length === 0) {
    throw new Error('Tiada baris peserta sah dijumpai dalam fail.');
  }

  return {
    rows: participants,
    detectedColumns: {
      nameCol: String(rawHeaders[nameColIdx] ?? `Lajur ${nameColIdx + 1}`),
      icCol: String(rawHeaders[icColIdx] ?? `Lajur ${icColIdx + 1}`),
    },
  };
}
