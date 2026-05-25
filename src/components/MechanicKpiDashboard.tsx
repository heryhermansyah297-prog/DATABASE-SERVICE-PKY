import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Calendar, 
  TrendingUp, 
  Search, 
  User, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Award
} from 'lucide-react';
import { MechanicST, SRRecord } from '../types';
import { 
  getStoredMechanicST, 
  saveStoredMechanicST, 
  calculateSTDays, 
  formatDate,
  DEFAULT_MECHANIC_ST
} from '../utils';
import { motion, AnimatePresence } from 'motion/react';

interface MechanicKpiDashboardProps {
  srRecords: SRRecord[];
}

export default function MechanicKpiDashboard({ srRecords }: MechanicKpiDashboardProps) {
  const [mechanics, setMechanics] = useState<MechanicST[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load state on mount
  useEffect(() => {
    setMechanics(getStoredMechanicST());
  }, []);

  // Recalculate ST days inline if start/end changes
  const handleDateChange = (id: string, startVal: string, endVal: string) => {
    const updated = mechanics.map(m => {
      if (m.id === id) {
        const days = calculateSTDays(startVal, endVal);
        return { ...m, stStart: startVal, stEnd: endVal, stDays: days };
      }
      return m;
    });
    setMechanics(updated);
    saveStoredMechanicST(updated);
    triggerSaveFeedBack();
  };

  const triggerSaveFeedBack = () => {
    setSaveStatus('saved');
    setTimeout(() => {
      setSaveStatus('idle');
    }, 2000);
  };

  // Quick Preset: Assign 2026-05-25 to 2026-05-29 (Mon - Fri)
  const applyPresetWeek = (id: string) => {
    handleDateChange(id, '2026-05-25', '2026-05-29');
  };

  // Clear dates for a mechanic
  const clearDates = (id: string) => {
    handleDateChange(id, '', '');
  };

  // Reset to original mock state
  const handleResetToDefault = () => {
    if (confirm('Apakah Anda yakin ingin menyetel ulang data ST ke data standar?')) {
      setMechanics(DEFAULT_MECHANIC_ST);
      saveStoredMechanicST(DEFAULT_MECHANIC_ST);
      triggerSaveFeedBack();
    }
  };

  // Help calculate associated data from SRRecords
  const getMechanicWorkStats = (name: string) => {
    // case-insensitive matching for mechanic names
    const shortName = name.split(' ')[0]?.toLowerCase() || '';
    
    const assignedSRs = srRecords.filter(r => {
      const l1 = (r.labour1 || '').toLowerCase();
      const l2 = (r.labour2 || '').toLowerCase();
      const fullNameLower = name.toLowerCase();
      return l1 === fullNameLower || l2 === fullNameLower || 
             (shortName && (l1.includes(shortName) || l2.includes(shortName)));
    });

    const completedJobs = assignedSRs.filter(r => r.status === 'RFU_LEAD JOB');
    
    return {
      assignedCount: assignedSRs.length,
      completedCount: completedJobs.length,
      completionRate: assignedSRs.length > 0 ? Math.round((completedJobs.length / assignedSRs.length) * 100) : 0
    };
  };

  // Filter list
  const filteredMechanics = mechanics.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute analytics
  const totalSTDaysLogged = mechanics.reduce((sum, m) => sum + m.stDays, 0);
  const activeSTCount = mechanics.filter(m => m.stDays > 0).length;

  // Helper for Monday to Friday work week KPI (Achievement on 5-day week base)
  const getKpiInfo = (days: number) => {
    const targetDays = 5; // Monday to Friday target
    const percentage = Math.min(Math.round((days / targetDays) * 100), 100);
    
    let statusLabel = 'Belum Ada Dinas';
    let statusColor = 'text-slate-500 bg-slate-100 border-slate-200';
    let labelBadgeColor = 'bg-slate-100 text-slate-700';
    let barColor = 'bg-slate-300';
    let rating = 'F';

    if (days >= 5) {
      statusLabel = 'Sangat Baik (100% Full)';
      statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-150';
      labelBadgeColor = 'bg-emerald-500 text-white';
      barColor = 'bg-gradient-to-r from-emerald-500 to-teal-400';
      rating = 'A+';
    } else if (days >= 3) {
      statusLabel = `Baik (${percentage}%)`;
      statusColor = 'text-blue-700 bg-blue-50 border-blue-150';
      labelBadgeColor = 'bg-blue-500 text-white';
      barColor = 'bg-gradient-to-r from-blue-500 to-sky-450';
      rating = 'B';
    } else if (days > 0) {
      statusLabel = `Cukup (${percentage}%)`;
      statusColor = 'text-amber-700 bg-amber-50 border-amber-150';
      labelBadgeColor = 'bg-amber-500 text-white';
      barColor = 'bg-gradient-to-r from-amber-500 to-orange-400';
      rating = 'C';
    }

    return {
      percentage,
      statusLabel,
      statusColor,
      labelBadgeColor,
      barColor,
      rating
    };
  };
  
  // Find top performer (highest ST days) ONLY IF mechanic name is assigned/listed in the SR records (assignedCount > 0)
  const eligibleMechanicsForTop = mechanics.filter(m => {
    const stats = getMechanicWorkStats(m.name);
    return stats.assignedCount > 0;
  });

  const topMechanic = eligibleMechanicsForTop.length > 0
    ? eligibleMechanicsForTop.reduce((prev, current) => {
        return (current.stDays > prev.stDays) ? current : prev;
      }, eligibleMechanicsForTop[0])
    : { name: 'Belum Ada (Tidak ada di SR)', stDays: 0 };

  const maxStDaysValue = Math.max(...mechanics.map(m => m.stDays), 1);

  return (
    <div id="section-kpi-mechanic" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 text-amber-950 p-2.5 rounded-xl flex items-center justify-center shrink-0 border border-amber-200">
            <Wrench className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              KPI & Pencapaian Surat Tugas (ST) Mekanik
              <span className="text-[10px] bg-amber-150 text-amber-800 font-semibold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                Senin - Jumat Only
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Perhitungan & akumulasi hari dinas aktif Surat Tugas yang berlaku dari senin sampai jumat, terintegrasi otomatis.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {saveStatus === 'saved' && (
            <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 animate-pulse">
              <CheckCircle className="h-3.5 w-3.5" /> Tersimpan ke Lokal!
            </span>
          )}
          <button
            onClick={handleResetToDefault}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1"
            title="Setel Ulang semua Surat Tugas ke setelan standar"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Standar
          </button>
        </div>
      </div>

      {/* Top Highlights Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Metric Card 1 */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-xl border border-slate-200/60 flex items-center gap-4">
          <div className="bg-blue-50 text-blue-650 p-3 rounded-xl border border-blue-100">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Hari Tugas Aktif</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{totalSTDaysLogged} Hari</span>
            <span className="text-[10.5px] text-slate-500 font-medium block">Dari seluruh mekanik terdaftar (Mon-Fri)</span>
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-xl border border-slate-200/60 flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-650 p-3 rounded-xl border border-emerald-100">
            <CheckCircle className="h-5 w-5 text-emerald-605" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Mekanik Ter-ST (Dinas)</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{activeSTCount} <span className="text-xs font-normal text-slate-500">dari {mechanics.length} Orang</span></span>
            <span className="text-[10.5px] text-slate-500 font-medium block">Tengah memiliki tugas lapangan aktif</span>
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-xl border border-slate-200/60 flex items-center gap-4">
          <div className="bg-amber-50 text-amber-655 p-3 rounded-xl border border-amber-100">
            <Award className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Dinas Terbanyak (Tercantum di SR)</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block truncate max-w-[200px]" title="Diambil hanya dari mekanik yang namanya tercantum dalam Service Request">
              {topMechanic.stDays > 0 ? topMechanic.name : '-'}
            </span>
            <span className="text-[10.5px] text-amber-700 font-semibold font-mono block mt-0.5">
              {topMechanic.stDays > 0 ? `Pencapaian: ${topMechanic.stDays} Hari ST` : 'N/A (Belum tercantum/tidak ada ST)'}
            </span>
          </div>
        </div>

      </div>

      {/* Dynamic Editor & Table Area - Expanded Full Width */}
      <div className="space-y-4 w-full">
          
          {/* Controls row */}
          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 font-bold" />
              <input
                type="text"
                placeholder="Cari mekanik..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-250 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-650 cursor-pointer font-bold text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            
            <div className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider shrink-0 mr-1.5 hidden sm:inline">
              Mekanik List ({filteredMechanics.length})
            </div>
          </div>

          {/* Interactive Editable Table Panel */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead className="bg-slate-100 uppercase text-[9.5px] font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-150">Nama Mekanik</th>
                    <th className="px-3 py-3 border-b border-slate-150 w-[110px]">ST Mulai</th>
                    <th className="px-3 py-3 border-b border-slate-150 w-[110px]">ST Selesai</th>
                    <th className="px-3 py-3 border-b border-slate-150 text-center w-[70px]">Hari ST</th>
                    <th className="px-4 py-3 border-b border-slate-150 text-center w-[160px]">Pencapaian KPI (Senin-Jumat)</th>
                    <th className="px-4 py-3 border-b border-slate-150 text-right w-[90px]">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMechanics.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-xs text-slate-400 font-medium font-sans">
                        Tidak ada mekanik yang cocok dengan pencarian Anda.
                      </td>
                    </tr>
                  ) : (
                    filteredMechanics.map(m => {
                      const stats = getMechanicWorkStats(m.name);
                      const kpi = getKpiInfo(m.stDays);

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/70 transition-all group">
                          
                          {/* Mechanic Name & Linked operational details */}
                          <td className="px-4 py-3.5 font-sans">
                            <div className="font-bold text-slate-800">{m.name}</div>
                            <div className="text-[10px] text-slate-450 flex items-center gap-1.5 mt-0.5">
                              {stats.assignedCount > 0 ? (
                                <span className="text-blue-650 font-semibold bg-blue-50/50 px-1 rounded">
                                  {stats.assignedCount} SR Aktif • {stats.completionRate}% RFU
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Tidak ada SR aktif di database</span>
                              )}
                            </div>
                          </td>

                          {/* ST Start Date Picker input */}
                          <td className="px-3 py-3">
                            <input
                              type="date"
                              value={m.stStart}
                              onChange={(e) => handleDateChange(m.id, e.target.value, m.stEnd)}
                              className="bg-slate-50 border border-slate-200 text-slate-705 font-mono text-xs rounded-md px-1.5 py-1 focus:ring-1 focus:ring-blue-400 outline-hidden w-full cursor-pointer hover:bg-slate-100/50 transition-colors"
                            />
                          </td>

                          {/* ST End Date Picker input */}
                          <td className="px-3 py-3">
                            <input
                              type="date"
                              value={m.stEnd}
                              onChange={(e) => handleDateChange(m.id, m.stStart, e.target.value)}
                              className="bg-slate-50 border border-slate-200 text-slate-750 font-mono text-xs rounded-md px-1.5 py-1 focus:ring-1 focus:ring-blue-400 outline-hidden w-full cursor-pointer hover:bg-slate-100/50 transition-colors"
                            />
                          </td>

                          {/* Calculated ST Weekdays days badge */}
                          <td className="px-3 py-3 text-center">
                            <span className={`font-mono font-bold text-xs px-2 py-1 rounded-md inline-block ${
                              m.stDays > 0 
                                ? 'bg-sky-50 text-blue-700 border border-blue-200' 
                                : 'bg-slate-50 text-slate-400 border border-slate-200'
                            }`}>
                              {m.stDays} d
                            </span>
                          </td>

                          {/* KPI percentage, rating & mini progress bar */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1 max-w-[140px] mx-auto">
                              <div className="flex items-center justify-between w-full text-[10px] gap-2">
                                <span className={`text-[9px] font-bold border px-1.5 rounded-sm ${kpi.statusColor}`}>
                                  {kpi.rating}
                                </span>
                                <span className="font-mono font-bold text-slate-650">
                                  {kpi.percentage}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${kpi.barColor}`}
                                  style={{ width: `${kpi.percentage}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Actions: Presets & Clear details */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                              
                              {/* Option 1: preset week */}
                              {m.stDays === 0 ? (
                                <button
                                  onClick={() => applyPresetWeek(m.id)}
                                  className="text-[9.5px] font-bold uppercase bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded-md border border-blue-150 cursor-pointer shadow-3xs hover:shadow-2xs transition-all flex items-center gap-0.5"
                                  title="Isi otomatis 1 minggu penuh (Senin-Jumat)"
                                >
                                  Preset
                                </button>
                              ) : (
                                <button
                                  onClick={() => clearDates(m.id)}
                                  className="text-[9.5px] font-bold uppercase bg-red-50 hover:bg-red-100 text-red-650 px-2 py-1 rounded-md border border-red-150 cursor-pointer transition-all flex items-center gap-0.5"
                                  title="Kosongkan tanggal Surat Tugas"
                                >
                                  Bersihkan
                                </button>
                              )}
                              
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="bg-slate-50 p-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px] text-slate-500 font-sans">
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>Format Tanggal mengikuti penulisan standar lokal (Hari-Bulan-Tahun).</span>
              </span>
              <span className="font-semibold text-slate-600">
                Data disimpan otomatis secara aman di penyimpanan browser lokal Anda.
              </span>
            </div>

          </div>

        </div>

    </div>
  );
}
