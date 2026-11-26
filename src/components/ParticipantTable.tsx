import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Plus,
  Search,
  Trash2,
  Wand2,
  XCircle,
  CaseUpper,
  CheckSquare,
  Square,
} from 'lucide-react';
import { ParticipantRow } from '../types/certificate';

type FilterMode = 'all' | 'issues' | 'standard' | 'selected';

interface ParticipantTableProps {
  participants: ParticipantRow[];
  previewParticipantId: string | null;
  onUpdateRow: (id: string, field: 'nama' | 'ic', value: string) => void;
  onToggleSelect: (id: string) => void;
  onSelectGroup: (mode: 'all' | 'none' | 'standard_only') => void;
  onAutoFixSingleIc: (id: string) => void;
  onAutoFixAllFixableIcs: () => void;
  onUppercaseAllNames: () => void;
  onAddParticipant: () => void;
  onDeleteParticipant: (id: string) => void;
  onPreviewParticipant: (id: string) => void;
}

export const ParticipantTable: React.FC<ParticipantTableProps> = ({
  participants,
  previewParticipantId,
  onUpdateRow,
  onToggleSelect,
  onSelectGroup,
  onAutoFixSingleIc,
  onAutoFixAllFixableIcs,
  onUppercaseAllNames,
  onAddParticipant,
  onDeleteParticipant,
  onPreviewParticipant,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const stats = useMemo(() => {
    let standard = 0, fixable = 0, invalid = 0, selected = 0;
    for (const p of participants) {
      if (p.icStatus === 'standard') standard++;
      else if (p.icStatus === 'fixable') fixable++;
      else invalid++;
      if (p.selected) selected++;
    }
    return { total: participants.length, standard, fixable, invalid, selected };
  }, [participants]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return participants.filter((p) => {
      if (filterMode === 'issues' && p.icStatus === 'standard') return false;
      if (filterMode === 'standard' && p.icStatus !== 'standard') return false;
      if (filterMode === 'selected' && !p.selected) return false;
      if (q) return p.nama.toLowerCase().includes(q) || p.ic.toLowerCase().includes(q);
      return true;
    });
  }, [participants, filterMode, searchQuery]);

  const FILTERS: { id: FilterMode; label: string; count: number; color?: string }[] = [
    { id: 'all', label: 'Semua', count: stats.total },
    { id: 'issues', label: 'Isu IC', count: stats.fixable + stats.invalid, color: 'amber' },
    { id: 'standard', label: 'IC Sah', count: stats.standard, color: 'emerald' },
    { id: 'selected', label: 'Dipilih', count: stats.selected },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-200">
        <div className="px-4 py-3">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Jumlah</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{stats.total}</div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[11px] text-emerald-600 font-medium uppercase tracking-wide">IC Sah</div>
          <div className="text-xl font-bold text-emerald-700 mt-0.5">{stats.standard}</div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[11px] text-amber-600 font-medium uppercase tracking-wide">Perlu Baiki</div>
          <div className="text-xl font-bold text-amber-600 mt-0.5">{stats.fixable}</div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[11px] text-emerald-700 font-medium uppercase tracking-wide">Dipilih Cetak</div>
          <div className="text-xl font-bold text-emerald-800 mt-0.5">{stats.selected}</div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="px-4 py-3 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-slate-50/60">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama / IC..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 w-48"
            />
          </div>

          {/* Filter tabs */}
          <div className="inline-flex rounded-lg bg-white border border-slate-200 p-0.5 text-xs">
            {FILTERS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  filterMode === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 ${filterMode === tab.id ? 'text-slate-300' : 'text-slate-400'}`}>
                    ({tab.count})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stats.fixable > 0 && (
            <button
              type="button"
              onClick={onAutoFixAllFixableIcs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs font-semibold cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Auto-Baiki IC ({stats.fixable})
            </button>
          )}
          <button type="button" onClick={onUppercaseAllNames} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium cursor-pointer" title="Tukar semua nama ke HURUF BESAR">
            <CaseUpper className="w-3.5 h-3.5" />
            Huruf Besar
          </button>
          <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden text-xs">
            <button type="button" onClick={() => onSelectGroup('all')} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:bg-slate-50 cursor-pointer border-r border-slate-200">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              Semua
            </button>
            <button type="button" onClick={() => onSelectGroup('standard_only')} className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-50 cursor-pointer border-r border-slate-200">
              IC Sah
            </button>
            <button type="button" onClick={() => onSelectGroup('none')} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:bg-slate-50 cursor-pointer">
              <Square className="w-3.5 h-3.5 text-slate-400" />
              Nyah
            </button>
          </div>
          <button type="button" onClick={onAddParticipant} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            Tambah
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">✓</th>
              <th className="py-2.5 px-2 w-10 text-center">#</th>
              <th className="py-2.5 px-3 min-w-[220px]">Nama Peserta</th>
              <th className="py-2.5 px-3 w-44">No. Kad Pengenalan</th>
              <th className="py-2.5 px-3 min-w-[200px]">Status IC</th>
              <th className="py-2.5 px-3 w-20 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  {participants.length === 0
                    ? 'Belum ada peserta. Muat naik fail Excel/CSV atau klik Tambah.'
                    : 'Tiada rekod sepadan dengan penapis semasa.'}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const isPreviewed = row.id === previewParticipantId;
                const rowBg =
                  row.icStatus === 'invalid'
                    ? 'bg-rose-50/60 hover:bg-rose-50'
                    : row.icStatus === 'fixable'
                      ? 'bg-amber-50/50 hover:bg-amber-50'
                      : isPreviewed
                        ? 'bg-emerald-50/50'
                        : 'hover:bg-slate-50/80';

                return (
                  <tr key={row.id} className={`${rowBg} transition-colors`}>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={() => onToggleSelect(row.id)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-2 px-2 text-center text-slate-400 font-mono">{row.rowNumber}</td>
                    <td className="py-1.5 px-3">
                      <input
                        type="text"
                        value={row.nama}
                        onChange={(e) => onUpdateRow(row.id, 'nama', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none font-medium text-slate-800 bg-transparent"
                        placeholder="Nama peserta..."
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <input
                        type="text"
                        value={row.ic}
                        onChange={(e) => onUpdateRow(row.id, 'ic', e.target.value)}
                        className={`w-full px-2 py-1 rounded border font-mono focus:outline-none focus:bg-white ${
                          row.icStatus === 'standard'
                            ? 'border-transparent hover:border-slate-300 focus:border-emerald-500 text-slate-700 bg-transparent'
                            : row.icStatus === 'fixable'
                              ? 'border-amber-300 bg-amber-50/40 text-amber-900 focus:border-amber-500'
                              : 'border-rose-300 bg-rose-50/40 text-rose-900 focus:border-rose-500'
                        }`}
                        placeholder="XXXXXX-XX-XXXX"
                      />
                    </td>
                    <td className="py-2 px-3">
                      {row.icStatus === 'standard' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sah
                        </span>
                      ) : row.icStatus === 'fixable' ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Boleh Dibaiki
                          </span>
                          {row.suggestedIc && (
                            <button
                              type="button"
                              onClick={() => onAutoFixSingleIc(row.id)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-600 text-white hover:bg-amber-700 font-medium cursor-pointer text-[11px]"
                            >
                              <Wand2 className="w-3 h-3" />
                              {row.suggestedIc}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-medium">
                            <XCircle className="w-3.5 h-3.5" />
                            Tidak Sah
                          </span>
                          <span className="text-rose-600 text-[11px]">{row.icIssues[0]}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onPreviewParticipant(row.id)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                            isPreviewed ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                          }`}
                          title="Pratonton sijil"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteParticipant(row.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-100 hover:text-rose-600 cursor-pointer transition-colors"
                          title="Padam"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
