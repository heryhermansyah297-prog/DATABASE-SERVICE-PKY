import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Database, 
  Upload, 
  RefreshCw, 
  Copy, 
  Check, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  MapPin, 
  User, 
  Users, 
  Wrench, 
  X, 
  ExternalLink, 
  ChevronRight, 
  Info, 
  Layers, 
  Calendar,
  Settings,
  AlertCircle,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SRRecord, UC3Status, UnitCondition, WorkStatus } from './types';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from './mockData';
import { 
  getStoredRecords, 
  saveStoredRecords, 
  getSavedGasUrl, 
  saveGasUrl, 
  formatDate, 
  calculateAvgAging 
} from './utils';

export default function App() {
  // State variables
  const [records, setRecords] = useState<SRRecord[]>([]);
  const [gasUrl, setGasUrl] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | null }>({ text: '', type: null });
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  
  // Filtering & Pagination State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCustomer, setFilterCustomer] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterCondition, setFilterCondition] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterUC3, setFilterUC3] = useState<string>('');
  
  // Specific Column Filters State (19 Columns total)
  const [filterSrNumber, setFilterSrNumber] = useState<string>('');
  const [filterWoNumber, setFilterWoNumber] = useState<string>('');
  const [filterUc3Number, setFilterUc3Number] = useState<string>('');
  const [filterSrDate, setFilterSrDate] = useState<string>('');
  const [filterSrAging, setFilterSrAging] = useState<string>('');
  const [filterPlanningDate, setFilterPlanningDate] = useState<string>('');
  const [filterActionDate, setFilterActionDate] = useState<string>('');
  const [filterRfuDate, setFilterRfuDate] = useState<string>('');
  const [filterSnUnit, setFilterSnUnit] = useState<string>('');
  const [filterModel, setFilterModel] = useState<string>('');
  const [filterIssueDescription, setFilterIssueDescription] = useState<string>('');
  const [filterLabour1, setFilterLabour1] = useState<string>('');
  const [filterLabour2, setFilterLabour2] = useState<string>('');
  const [filterLeadJobDescription, setFilterLeadJobDescription] = useState<string>('');
  
  // Advanced Column Filters Collapsible Dashboard UI State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  
  // Selected Detail Record Side Drawer
  const [selectedRecord, setSelectedRecord] = useState<SRRecord | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // Form State for editing / adding
  const [formState, setFormState] = useState<Omit<SRRecord, 'id'>>({
    customer: '',
    srNumber: '',
    woNumber: '',
    uc3Number: '',
    uc3Status: 'Done',
    srDate: new Date().toISOString().substring(0, 10),
    srAging: 0,
    planningDate: '',
    actionDate: '',
    rfuDate: '',
    unitCondition: 'Running With Trouble',
    snUnit: '',
    model: 'HX210HD',
    issueDescription: '',
    location: '',
    labour1: '',
    labour2: '',
    status: 'Inprogress',
    leadJobDescription: ''
  });

  // Load initial variables
  useEffect(() => {
    setRecords(getStoredRecords());
    setGasUrl(getSavedGasUrl());
  }, []);

  // Sync to local storage on changes
  const updateLocalRecords = (updated: SRRecord[]) => {
    setRecords(updated);
    saveStoredRecords(updated);
  };

  // Setup brief status alert helper
  const triggerAlert = (text: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage({ text: '', type: null });
    }, 5000);
  };

  // Copy app Script guide snippet
  const copyAppsScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    triggerAlert('Kode Google Apps Script berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Google Apps Script Fetch (GET)
  const fetchFromGoogleSheet = async () => {
    if (!gasUrl.trim()) {
      triggerAlert('Masukkan URL Publik Google Apps Script terlebih dahulu.', 'error');
      setShowConfig(true);
      return;
    }

    setIsRefreshing(true);
    triggerAlert('Menghubungi Google Apps Script...', 'info');

    try {
      // Fetching from published web app
      const response = await fetch(gasUrl, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const remoteData = await response.json();
      if (Array.isArray(remoteData)) {
        if (remoteData.length === 0) {
          triggerAlert('Koneksi berhasil, namun spreadsheet Anda masih kosong!', 'info');
        } else {
          updateLocalRecords(remoteData);
          triggerAlert(`Berhasil memuat ${remoteData.length} data dari Google Sheet.`, 'success');
        }
      } else {
        throw new Error('Format data tidak valid. Pastikan Apps Script mengembalikan array.');
      }
    } catch (error: any) {
      console.error(error);
      triggerAlert(`Gagal sinkronisasi data: ${error.message}. Pastikan URL valid, setelan "Anyone" sudah diatur, dan deployment sukses dilakukan.`, 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Push All local records to Google Apps Script (POST)
  const syncLocalToGoogleSheet = async (recordsToSync: SRRecord[]) => {
    if (!gasUrl.trim()) {
      triggerAlert('Konfigurasikan URL Google Apps Script terlebih dahulu untuk upload.', 'error');
      setShowConfig(true);
      return;
    }

    setIsRefreshing(true);
    triggerAlert('Mengirim data ke Google Sheet spreadsheet...', 'info');

    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors', // standard Apps Script redirects sometimes require no-cors if not handling preflight, but it's better to try to communicate
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // avoids preflight issues in standard Apps Script
        },
        body: JSON.stringify({
          action: 'sync_all',
          data: recordsToSync
        })
      });

      // Under "no-cors", we can't read the response payload, but it will generally succeed.
      triggerAlert('Pemintaan sinkronisasi terkirim! Silakan periksa spreadsheet Anda.', 'success');
    } catch (error: any) {
      console.error(error);
      triggerAlert(`Gagal mengunggah data: ${error.message}`, 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Save gas url helper
  const handleSaveGasUrl = () => {
    const trimmed = gasUrl.trim();
    saveGasUrl(trimmed);
    setGasUrl(trimmed);
    triggerAlert('URL Google Apps Script disimpan.', 'success');
    if (trimmed) {
      fetchFromGoogleSheet();
    }
  };

  // Reset local state to fallback screen cap data
  const handleResetToDefault = () => {
    if (window.confirm('Apakah Anda yakin ingin memuat ulang 5 baris data default dari gambar? Semua perubahan lokal akan digantikan.')) {
      localStorage.removeItem('sr_dashboard_records');
      setRecords(getStoredRecords());
      triggerAlert('Data berhasil di-reset ke data bawaan gambar.', 'success');
    }
  };

  // Open add modal
  const handleOpenAdd = () => {
    setIsAdding(true);
    setIsEditing(false);
    setSelectedRecord(null);
    setFormState({
      customer: '',
      srNumber: 'SR/PKY/' + new Date().getMonth() + '/26/XXXX',
      woNumber: '',
      uc3Number: '',
      uc3Status: 'None',
      srDate: new Date().toISOString().substring(0, 10),
      srAging: 0,
      planningDate: '',
      actionDate: '',
      rfuDate: '',
      unitCondition: 'Breakdown',
      snUnit: '',
      model: 'HX210HD',
      issueDescription: '',
      location: '',
      labour1: '',
      labour2: '',
      status: 'Inprogress',
      leadJobDescription: ''
    });
  };

  // Open edit modal
  const handleOpenEdit = (rec: SRRecord) => {
    setIsEditing(true);
    setIsAdding(false);
    setFormState({
      customer: rec.customer,
      srNumber: rec.srNumber,
      woNumber: rec.woNumber,
      uc3Number: rec.uc3Number,
      uc3Status: rec.uc3Status,
      srDate: rec.srDate,
      srAging: rec.srAging,
      planningDate: rec.planningDate,
      actionDate: rec.actionDate,
      rfuDate: rec.rfuDate,
      unitCondition: rec.unitCondition,
      snUnit: rec.snUnit,
      model: rec.model,
      issueDescription: rec.issueDescription,
      location: rec.location,
      labour1: rec.labour1,
      labour2: rec.labour2,
      status: rec.status,
      leadJobDescription: rec.leadJobDescription
    });
  };

  // Save changes
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.customer || !formState.srNumber || !formState.snUnit) {
      alert('Nama Customer, SR Number, dan Serial Number Unit wajib diisi!');
      return;
    }

    let updatedRecords: SRRecord[];
    if (isAdding) {
      const newRec: SRRecord = {
        ...formState,
        id: 'rec-' + Date.now(),
        srAging: Number(formState.srAging) || 0
      };
      updatedRecords = [newRec, ...records];
      triggerAlert('Berhasil menambahkan 1 Service Request baru.', 'success');
    } else {
      // Editing Mode
      if (!selectedRecord) return;
      updatedRecords = records.map(r => r.id === selectedRecord.id ? { 
        ...formState, 
        id: selectedRecord.id,
        srAging: Number(formState.srAging) || 0 
      } : r);
      setSelectedRecord({ ...formState, id: selectedRecord.id });
      triggerAlert('Berhasil memperbarui Service Request.', 'success');
    }

    updateLocalRecords(updatedRecords);
    setIsEditing(false);
    setIsAdding(false);

    // Prompt user to sync to GAS if linked
    if (gasUrl) {
      if (window.confirm('Data lokal terupdate. Ingin mensinkronkan perubahan ini langsung ke Google Sheet Anda?')) {
        syncLocalToGoogleSheet(updatedRecords);
      }
    }
  };

  // Delete Action
  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data Service Request ini?')) {
      const updated = records.filter(r => r.id !== id);
      updateLocalRecords(updated);
      setSelectedRecord(null);
      setIsEditing(false);
      triggerAlert('Record berhasil dihapus.', 'success');

      if (gasUrl) {
        syncLocalToGoogleSheet(updated);
      }
    }
  };

  // Filter Logic logic mapping
  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.srNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.snUnit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.issueDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.leadJobDescription.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCustomer = !filterCustomer || r.customer === filterCustomer;
    const matchesLocation = !filterLocation || r.location === filterLocation;
    const matchesCondition = !filterCondition || r.unitCondition === filterCondition;
    const matchesStatus = !filterStatus || r.status === filterStatus;
    const matchesUC3 = !filterUC3 || r.uc3Status === filterUC3;
    
    // Additional Column-specific filters matching
    const matchesSrNumber = !filterSrNumber || r.srNumber.toLowerCase().includes(filterSrNumber.toLowerCase());
    const matchesWoNumber = !filterWoNumber || (r.woNumber && r.woNumber.toLowerCase().includes(filterWoNumber.toLowerCase()));
    const matchesUc3Number = !filterUc3Number || (r.uc3Number && r.uc3Number.toLowerCase().includes(filterUc3Number.toLowerCase()));
    const matchesSrDate = !filterSrDate || r.srDate.includes(filterSrDate);
    const matchesSrAging = !filterSrAging || r.srAging.toString().includes(filterSrAging);
    const matchesPlanningDate = !filterPlanningDate || (r.planningDate && r.planningDate.includes(filterPlanningDate));
    const matchesActionDate = !filterActionDate || (r.actionDate && r.actionDate.includes(filterActionDate));
    const matchesRfuDate = !filterRfuDate || (r.rfuDate && r.rfuDate.includes(filterRfuDate));
    const matchesSnUnit = !filterSnUnit || r.snUnit.toLowerCase().includes(filterSnUnit.toLowerCase());
    const matchesModel = !filterModel || r.model === filterModel;
    const matchesIssueDescription = !filterIssueDescription || r.issueDescription.toLowerCase().includes(filterIssueDescription.toLowerCase());
    const matchesLabour1 = !filterLabour1 || r.labour1 === filterLabour1;
    const matchesLabour2 = !filterLabour2 || r.labour2 === filterLabour2;
    const matchesLeadJobDescription = !filterLeadJobDescription || (r.leadJobDescription && r.leadJobDescription.toLowerCase().includes(filterLeadJobDescription.toLowerCase()));

    return matchesSearch && 
      matchesCustomer && 
      matchesLocation && 
      matchesCondition && 
      matchesStatus && 
      matchesUC3 &&
      matchesSrNumber &&
      matchesWoNumber &&
      matchesUc3Number &&
      matchesSrDate &&
      matchesSrAging &&
      matchesPlanningDate &&
      matchesActionDate &&
      matchesRfuDate &&
      matchesSnUnit &&
      matchesModel &&
      matchesIssueDescription &&
      matchesLabour1 &&
      matchesLabour2 &&
      matchesLeadJobDescription;
  });

  // Calculate stats dynamically based on filtered records
  const totalRecordsCount = filteredRecords.length;
  const breakdownCount = filteredRecords.filter(r => r.unitCondition === 'Breakdown').length;
  const runningTroubleCount = filteredRecords.filter(r => r.unitCondition === 'Running With Trouble').length;
  const runningNormalCount = filteredRecords.filter(r => r.unitCondition === 'Running Without Trouble').length;
  
  const rfuCount = filteredRecords.filter(r => r.status === 'RFU_LEAD JOB').length;
  const progressCount = filteredRecords.filter(r => r.status === 'Inprogress').length;
  const delayCount = filteredRecords.filter(r => r.status === 'Delay Labour').length;
  const notProgressCount = filteredRecords.filter(r => r.status === 'Not Progress').length;
  const avgAging = calculateAvgAging(filteredRecords);

  // List unique values for filters
  const uniqueCustomers = Array.from(new Set(records.map(r => r.customer).filter(Boolean)));
  const uniqueLocations = Array.from(new Set(records.map(r => r.location).filter(Boolean)));
  const uniqueConditions = Array.from(new Set(records.map(r => r.unitCondition).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(records.map(r => r.status).filter(Boolean)));
  
  // Supplementary lists for new dropdown selectors
  const uniqueModels = Array.from(new Set(records.map(r => r.model).filter(Boolean)));
  const uniqueLabour1 = Array.from(new Set(records.map(r => r.labour1).filter(Boolean)));
  const uniqueLabour2 = Array.from(new Set(records.map(r => r.labour2).filter(Boolean)));
  
  // Compute active filters count
  const activeFiltersCount = [
    filterCustomer, filterLocation, filterCondition, filterStatus, filterUC3,
    filterSrNumber, filterWoNumber, filterUc3Number, filterSrDate, filterSrAging,
    filterPlanningDate, filterActionDate, filterRfuDate, filterSnUnit, filterModel,
    filterIssueDescription, filterLabour1, filterLabour2, filterLeadJobDescription
  ].filter(Boolean).length;
  
  // Custom design metrics
  const activeTechnicians = Array.from(new Set(records.flatMap(r => [r.labour1, r.labour2]).filter(Boolean))) as string[];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-500 selection:text-white pb-12">
      
      {/* Visual Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md shadow-blue-500/10 flex items-center justify-center">
              <Activity className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Heavy Equipment Service Tracker
                <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                  Dashboard V4
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                Sistem Pemantauan Service Request Alat Berat • Kalimantan Tengah
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-all ${
                showConfig 
                  ? 'bg-slate-100 border-slate-300 text-slate-800' 
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <Settings className={`h-4 w-4 ${showConfig ? 'rotate-45' : ''} transition-transform duration-300`} />
              Pengaturan Google Sheet
            </button>

            <button
              onClick={fetchFromGoogleSheet}
              disabled={isRefreshing}
              className="flex items-center gap-2 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Sync Sheet
            </button>

            <button
              id="btn-add-record"
              onClick={handleOpenAdd}
              className="flex items-center gap-2 text-sm font-semibold bg-blue-600 text-white shadow-xs px-4 py-2 rounded-lg hover:bg-blue-700 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tambah Data
            </button>
          </div>
        </div>
      </header>

      {/* Floating Status Bar / Alert Line */}
      <AnimatePresence>
        {statusMessage.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
          >
            <div className={`p-4 rounded-xl shadow-lg border flex items-start gap-3 justify-between ${
              statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
              statusMessage.type === 'error' ? 'bg-red-50 border-red-200 text-red-900' :
              'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <div className="flex gap-2.5">
                {statusMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" /> : 
                 statusMessage.type === 'error' ? <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" /> :
                 <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />}
                <p className="text-sm font-medium leading-relaxed">{statusMessage.text}</p>
              </div>
              <button 
                onClick={() => setStatusMessage({ text: '', type: null })}
                className="text-slate-400 hover:text-slate-600 p-0.5 hover:bg-white/50 rounded-md transition-all shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 gap-6 flex-1">
        
        {/* Google Sheet GAS Configuration Container Drawer */}
        <AnimatePresence>
          {showConfig && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  <h2 className="font-bold text-slate-900">Konfigurasi Sinkronisasi Google Spreadsheet</h2>
                </div>
                <button 
                  onClick={() => setShowConfig(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 text-sm">
                
                {/* Form Input URL Setup */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">
                      URL Web App Google Apps Script
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Database className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="url"
                        placeholder="https://script.google.com/macros/s/..."
                        value={gasUrl}
                        onChange={(e) => setGasUrl(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-slate-50/50 focus:bg-white transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                      Koneksikan dashboard ke spreadsheet milik Anda sendiri dengan Apps Script Web App.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveGasUrl}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-lg text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check className="h-4 w-4" />
                      Simpan &amp; Hubungkan
                    </button>
                    <button
                      onClick={handleResetToDefault}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-3 rounded-lg text-xs transition-all cursor-pointer"
                    >
                      Reset Default
                    </button>
                  </div>

                  {gasUrl && (
                    <div className="p-3.5 bg-sky-50 border border-sky-100 text-sky-900 rounded-xl">
                      <h4 className="font-semibold text-xs flex items-center gap-1.5 mb-1">
                        <Info className="h-4 w-4 text-sky-600" />
                        Status Koneksi
                      </h4>
                      <p className="text-[11px] leading-relaxed text-sky-800">
                        Koneksi sedang aktif. Anda dapat melakukan CRUD lokal dan menekan <span className="font-semibold">Sync Sheet</span> sewaktu-waktu untuk mengunggah atau memperbarui baris data langsung ke Spreadsheet Anda.
                      </p>
                    </div>
                  )}
                </div>

                {/* Instruction Steps Copy Paste apps script code */}
                <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-6 flex flex-col gap-3">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Langkah Integrasi Google Sheet</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600 leading-relaxed">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="w-5 h-5 bg-blue-100 text-blue-600 font-bold flex items-center justify-center rounded-full text-[10px] mb-2">1</div>
                      <p className="font-semibold text-slate-800 mb-0.5">Buka Apps Script</p>
                      <p className="text-[11px] text-slate-500">Buka Spreadsheet Anda, arahkan ke <span className="font-medium">Ekstensi</span> &rarr; <span className="font-medium">Apps Script</span>.</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="w-5 h-5 bg-blue-100 text-blue-600 font-bold flex items-center justify-center rounded-full text-[10px] mb-2">2</div>
                      <p className="font-semibold text-slate-800 mb-0.5">Tempel Kode</p>
                      <p className="text-[11px] text-slate-500">Salin kode makro di sebelah kanan, buang semua isi default, lalu paste kodenya.</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="w-5 h-5 bg-blue-100 text-blue-600 font-bold flex items-center justify-center rounded-full text-[10px] mb-2">3</div>
                      <p className="font-semibold text-slate-800 mb-0.5">Deploy Web App</p>
                      <p className="text-[11px] text-slate-500">Penerapan Baru &rarr; Aplikasi Web. Atur Hak Akses: <span className="font-medium">"Siapa Saja/Anyone"</span>.</p>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-slate-950 text-slate-200 rounded-xl">
                    <div className="flex items-start gap-2.5">
                      <CodeIcon className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-xs text-slate-100">Kode Google Apps Script</p>
                        <p className="text-[11px] text-slate-400">Siap dipasangkan langsung ke lembar kerja.</p>
                      </div>
                    </div>
                    <button
                      onClick={copyAppsScript}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-1.5 px-3.5 rounded-lg transition-all cursor-pointer"
                    >
                      {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedCode ? 'Tersalin!' : 'Salin Kode GAS'}
                    </button>
                  </div>
                </div>

              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Dynamic Live KPI Overview Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div className="col-span-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total SR Terdaftar</span>
              <Layers className="h-4 w-4 text-blue-500 bg-blue-50 p-0.5 rounded-md" />
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">{totalRecordsCount}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Sesuai filter terpilih</p>
            </div>
          </div>

          <div className="col-span-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Unit Breakdown</span>
              <AlertTriangle className="h-4 w-4 text-red-500 bg-red-50 p-0.5 rounded-md" />
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold tracking-tight text-red-600 font-mono">{breakdownCount}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Butuh respon cepat</p>
            </div>
          </div>

          <div className="col-span-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Running trouble</span>
              <AlertCircle className="h-4 w-4 text-amber-500 bg-amber-50 p-0.5 rounded-md" />
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold tracking-tight text-amber-600 font-mono">{runningTroubleCount}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Operasional dengan kendala</p>
            </div>
          </div>

          <div className="col-span-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Selesai (RFU Job)</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500 bg-emerald-50 p-0.5 rounded-md" />
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold tracking-tight text-emerald-600 font-mono">{rfuCount}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Ready for Use</p>
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Rataan SR Aging</span>
              <Clock className="h-4 w-4 text-slate-600 bg-slate-50 p-0.5 rounded-md" />
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold tracking-tight text-slate-950 font-mono">
                {avgAging} <span className="text-xs text-slate-500">Hari</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Waktu tanggap akumulatif</p>
            </div>
          </div>

        </section>

        {/* Interactive Custom SVG Graphics & Status Board */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Unit Condition Graph */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center justify-between">
              Kondisi Unit Saat Ini
              <span className="text-[10px] text-slate-400 normal-case font-mono">Persentase (%)</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-red-600 rounded-full inline-block"></span>
                    Breakdown
                  </span>
                  <span className="font-mono text-slate-500 font-semibold text-right">
                    {totalRecordsCount > 0 ? Math.round((breakdownCount / totalRecordsCount) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <motion.div 
                    className="bg-red-600 h-full rounded-full" 
                    initial={{ width: 0 }} 
                    animate={{ width: `${totalRecordsCount > 0 ? (breakdownCount / totalRecordsCount) * 100 : 0}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block"></span>
                    Running With Trouble
                  </span>
                  <span className="font-mono text-slate-500 font-semibold text-right">
                    {totalRecordsCount > 0 ? Math.round((runningTroubleCount / totalRecordsCount) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <motion.div 
                    className="bg-amber-500 h-full rounded-full" 
                    initial={{ width: 0 }} 
                    animate={{ width: `${totalRecordsCount > 0 ? (runningTroubleCount / totalRecordsCount) * 100 : 0}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span>
                    Running Without Trouble
                  </span>
                  <span className="font-mono text-slate-500 font-semibold text-right">
                    {totalRecordsCount > 0 ? Math.round((runningNormalCount / totalRecordsCount) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <motion.div 
                    className="bg-emerald-500 h-full rounded-full" 
                    initial={{ width: 0 }} 
                    animate={{ width: `${totalRecordsCount > 0 ? (runningNormalCount / totalRecordsCount) * 100 : 0}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
              <span className="leading-tight">Total sample data diproses:</span>
              <span className="font-mono font-bold text-slate-600">{totalRecordsCount} unit</span>
            </div>
          </div>

          {/* Work Status Breakdown Pie/Donut Visualizer alternative */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3 flex items-center justify-between">
                Alokasi Status Progres
                <span className="text-[10px] text-slate-400 normal-case font-mono">Beban Kerja</span>
              </h3>

              <div className="flex items-center justify-between gap-4 py-1">
                <div className="relative w-24 h-24 shrink-0">
                  {/* Beautiful Handcrafted Inline SVG Circular Chart */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {totalRecordsCount > 0 && (
                      <>
                        {/* Breakdown segments */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9155"
                          className="text-indigo-600"
                          strokeDasharray={`${(rfuCount / totalRecordsCount) * 100}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9155"
                          className="text-blue-500"
                          strokeDasharray={`${(progressCount / totalRecordsCount) * 100}, 100`}
                          strokeDashoffset={`-${(rfuCount / totalRecordsCount) * 100}`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9155"
                          className="text-amber-500"
                          strokeDasharray={`${(delayCount / totalRecordsCount) * 100}, 100`}
                          strokeDashoffset={`-${((rfuCount + progressCount) / totalRecordsCount) * 100}`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                        />
                      </>
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-slate-800 font-mono leading-none">
                      {totalRecordsCount > 0 ? Math.round(((rfuCount) / totalRecordsCount) * 100) : 0}%
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wide">RFU CAP</span>
                  </div>
                </div>

                <div className="flex-1 text-[11px] space-y-1.5 font-sans">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      RFU Lead Job:
                    </span>
                    <span className="font-mono font-bold text-slate-700">{rfuCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      In Progress:
                    </span>
                    <span className="font-mono font-bold text-slate-700">{progressCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Delay Labour:
                    </span>
                    <span className="font-mono font-bold text-slate-700">{delayCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      Not Progress:
                    </span>
                    <span className="font-mono font-bold text-slate-700">{notProgressCount}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 italic pt-2 border-t border-slate-100">
              *RFU (Ready for Use) mengindikasikan unit telah selesai ditangani mekanik.
            </p>
          </div>

          {/* Location & Labor Work distribution list */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3.5 flex items-center justify-between">
              Tenaga Kerja Aktif
              <span className="text-[10px] text-slate-400 font-mono font-semibold">Tugas Terkait</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {activeTechnicians.length === 0 ? (
                <p className="col-span-2 text-center py-6 text-slate-400 italic">Belum ada mekanik ditugaskan</p>
              ) : (
                activeTechnicians.map((name, idx) => {
                  const assignmentCount = records.filter(r => r.labour1 === name || r.labour2 === name).length;
                  return (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 text-blue-600 font-bold flex items-center justify-center rounded-xl text-xs">
                          {name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-700">{name}</span>
                      </div>
                      <span className="bg-blue-600 text-white font-mono font-bold px-2 py-0.5 rounded-md text-[10px]">
                        {assignmentCount}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <p className="text-[10px] text-slate-400 mt-4 leading-normal flex items-start gap-1">
              <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              Jumlah ketersediaan tim lapangan: {activeTechnicians.length} mekanik terdaftar di site Kalimantan.
            </p>
          </div>

        </section>

        {/* Main List, Filter Panel, Search Controls, Database Table */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Header Panel Filter Options */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-4">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Daftar Service Request (SR)
                  <span className="text-xs font-mono font-medium text-slate-400">
                    ({filteredRecords.length} dari {records.length} data)
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Filter dan amati status pengerjaan unit yang sedang aktif</p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                {/* Global search */}
                <div className="relative flex-1 sm:w-80">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari kata kunci umum..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 border border-slate-300 rounded-lg text-xs outline-hidden focus:ring-1 focus:ring-blue-500 bg-white transition-all font-medium"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold select-none transition-all cursor-pointer border ${
                      showAdvancedFilters 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                        : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                    }`}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    {showAdvancedFilters ? 'Sembunyikan Filter' : 'Filter per Kolom (19 Filter)'}
                    {activeFiltersCount > 0 && (
                      <span className={`ml-1 rounded-full font-mono text-[10px] w-5 h-5 flex items-center justify-center font-bold ${
                        showAdvancedFilters ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                      }`}>
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>

                  {(activeFiltersCount > 0 || searchTerm) && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterCustomer('');
                        setFilterLocation('');
                        setFilterCondition('');
                        setFilterStatus('');
                        setFilterUC3('');
                        setFilterSrNumber('');
                        setFilterWoNumber('');
                        setFilterUc3Number('');
                        setFilterSrDate('');
                        setFilterSrAging('');
                        setFilterPlanningDate('');
                        setFilterActionDate('');
                        setFilterRfuDate('');
                        setFilterSnUnit('');
                        setFilterModel('');
                        setFilterIssueDescription('');
                        setFilterLabour1('');
                        setFilterLabour2('');
                        setFilterLeadJobDescription('');
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1"
                      title="Reset semua filter aktif"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reset Filter
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Collapsible Column Specific Filters Panel */}
            <AnimatePresence>
              {showAdvancedFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white border border-slate-200 rounded-xl p-5 mt-2 space-y-5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-1">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4.5 w-4.5 text-blue-600" />
                        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Pencarian &amp; Filter Kolom Mandiri (19 Filter)</h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        Aktif: {activeFiltersCount} filter khusus
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Section 1: Dokumen & Identitas (5 Filters) */}
                      <div className="bg-slate-50/40 p-4 rounded-xl border border-slate-100 space-y-4">
                        <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                          <FileSpreadsheet className="h-4 w-4 shrink-0 text-blue-600" />
                          Identitas &amp; Dokumen
                        </h4>
                        
                        {/* 1. Customer */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                            <span>1. Customer</span>
                            {filterCustomer && <button onClick={() => setFilterCustomer('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                          </label>
                          <select
                            value={filterCustomer}
                            onChange={(e) => setFilterCustomer(e.target.value)}
                            className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                          >
                            <option value="">Semua Customer</option>
                            {uniqueCustomers.map((c, i) => <option key={i} value={c}>{c}</option>)}
                          </select>
                        </div>

                        {/* 2. SR Number */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                            <span>2. SR Number</span>
                            {filterSrNumber && <button onClick={() => setFilterSrNumber('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Cari SR: SR/PKY/..."
                              value={filterSrNumber}
                              onChange={(e) => setFilterSrNumber(e.target.value)}
                              className="w-full pr-7 bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
                            />
                            {filterSrNumber && (
                              <button onClick={() => setFilterSrNumber('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 3. WO Number */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                            <span>3. WO Number</span>
                            {filterWoNumber && <button onClick={() => setFilterWoNumber('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Cari WO..."
                              value={filterWoNumber}
                              onChange={(e) => setFilterWoNumber(e.target.value)}
                              className="w-full pr-7 bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
                            />
                            {filterWoNumber && (
                              <button onClick={() => setFilterWoNumber('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 4. UC3 Number */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                            <span>4. UC3 Number</span>
                            {filterUc3Number && <button onClick={() => setFilterUc3Number('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Cari No UC3..."
                              value={filterUc3Number}
                              onChange={(e) => setFilterUc3Number(e.target.value)}
                              className="w-full pr-7 bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
                            />
                            {filterUc3Number && (
                              <button onClick={() => setFilterUc3Number('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 5. UC3 Status */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                            <span>5. UC3 Status</span>
                            {filterUC3 && <button onClick={() => setFilterUC3('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                          </label>
                          <select
                            value={filterUC3}
                            onChange={(e) => setFilterUC3(e.target.value)}
                            className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-blue-500 font-semibold"
                          >
                            <option value="">Semua UC3 Status</option>
                            <option value="Done">Done</option>
                            <option value="Inprogress">Inprogress</option>
                            <option value="waiting Part">waiting Part</option>
                            <option value="None">None (Bukan UC3)</option>
                          </select>
                        </div>
                      </div>

                      {/* Section 2: Spesifikasi & Kondisi Unit (5 Filters) */}
                      <div className="bg-slate-50/40 p-4 rounded-xl border border-slate-100 space-y-4">
                        <h4 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                          <Wrench className="h-4 w-4 shrink-0 text-amber-600" />
                          Spesifikasi &amp; Kondisi
                        </h4>

                        {/* 6. Model */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                            <span>6. Model Unit</span>
                            {filterModel && <button onClick={() => setFilterModel('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                          </label>
                          <select
                            value={filterModel}
                            onChange={(e) => setFilterModel(e.target.value)}
                            className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-blue-500 font-mono font-medium"
                          >
                            <option value="">Semua Model</option>
                            {uniqueModels.map((m, i) => <option key={i} value={m}>{m}</option>)}
                          </select>
                        </div>

                        {/* 7. SN Unit */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                            <span>7. SN Unit (No. Seri)</span>
                            {filterSnUnit && <button onClick={() => setFilterSnUnit('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Cari Serial Number..."
                              value={filterSnUnit}
                              onChange={(e) => setFilterSnUnit(e.target.value)}
                              className="w-full pr-7 bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-blue-500 font-mono font-medium"
                            />
                            {filterSnUnit && (
                              <button onClick={() => setFilterSnUnit('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 8. Unit Condition */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                            <span>8. Unit Condition</span>
                            {filterCondition && <button onClick={() => setFilterCondition('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                          </label>
                          <select
                            value={filterCondition}
                            onChange={(e) => setFilterCondition(e.target.value)}
                            className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-blue-500 font-bold"
                          >
                            <option value="">Semua Kondisi</option>
                            {uniqueConditions.map((c, i) => <option key={i} value={c}>{c}</option>)}
                          </select>
                        </div>

                        {/* 9. Issue Description */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                            <span>9. Issue Description</span>
                            {filterIssueDescription && <button onClick={() => setFilterIssueDescription('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Cari deskripsi keluhan..."
                              value={filterIssueDescription}
                              onChange={(e) => setFilterIssueDescription(e.target.value)}
                              className="w-full pr-7 bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-blue-500"
                            />
                            {filterIssueDescription && (
                              <button onClick={() => setFilterIssueDescription('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 10. Location */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                            <span>10. Location (Site)</span>
                            {filterLocation && <button onClick={() => setFilterLocation('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                          </label>
                          <select
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                            className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Semua Lokasi</option>
                            {uniqueLocations.map((l, i) => <option key={i} value={l}>{l}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Section 3: Tanggal & Penugasan (9 Filters) */}
                      <div className="bg-slate-50/40 p-4 rounded-xl border border-slate-100 space-y-4">
                        <h4 className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                          <Calendar className="h-4 w-4 shrink-0 text-emerald-600" />
                          Tanggal &amp; Penugasan Mekanik
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          {/* 11. SR Date */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                              <span>11. SR Date</span>
                              {filterSrDate && <button onClick={() => setFilterSrDate('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                            </label>
                            <input
                              type="text"
                              placeholder="Cari tgl SR..."
                              value={filterSrDate}
                              onChange={(e) => setFilterSrDate(e.target.value)}
                              className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-blue-500 font-mono text-center"
                            />
                          </div>

                          {/* 12. SR Aging */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                              <span>12. Aging (Days)</span>
                              {filterSrAging && <button onClick={() => setFilterSrAging('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                            </label>
                            <input
                              type="text"
                              placeholder="Cari aging..."
                              value={filterSrAging}
                              onChange={(e) => setFilterSrAging(e.target.value)}
                              className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-blue-500 font-mono text-center"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {/* 13. Planning Date */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                              <span>13. Plan Date</span>
                              {filterPlanningDate && <button onClick={() => setFilterPlanningDate('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                            </label>
                            <input
                              type="text"
                              placeholder="Plan..."
                              value={filterPlanningDate}
                              onChange={(e) => setFilterPlanningDate(e.target.value)}
                              className="w-full bg-white border border-slate-250 rounded-lg px-1.5 py-1.5 text-[11px] outline-hidden focus:ring-1 focus:ring-blue-500 font-mono text-center"
                            />
                          </div>

                          {/* 14. Action Date */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                              <span>14. Action Date</span>
                              {filterActionDate && <button onClick={() => setFilterActionDate('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                            </label>
                            <input
                              type="text"
                              placeholder="Action..."
                              value={filterActionDate}
                              onChange={(e) => setFilterActionDate(e.target.value)}
                              className="w-full bg-white border border-slate-250 rounded-lg px-1.5 py-1.5 text-[11px] outline-hidden focus:ring-1 focus:ring-blue-500 font-mono text-center"
                            />
                          </div>

                          {/* 15. RFU Date */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                              <span>15. RFU Date</span>
                              {filterRfuDate && <button onClick={() => setFilterRfuDate('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                            </label>
                            <input
                              type="text"
                              placeholder="RFU..."
                              value={filterRfuDate}
                              onChange={(e) => setFilterRfuDate(e.target.value)}
                              className="w-full bg-white border border-slate-250 rounded-lg px-1.5 py-1.5 text-[11px] outline-hidden focus:ring-1 focus:ring-blue-500 font-mono text-center"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* 16. Labour 1 */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                              <span>16. Mekanik 1</span>
                              {filterLabour1 && <button onClick={() => setFilterLabour1('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                            </label>
                            <select
                              value={filterLabour1}
                              onChange={(e) => setFilterLabour1(e.target.value)}
                              className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Semua Mekanik 1</option>
                              {uniqueLabour1.map((l, i) => <option key={i} value={l}>{l}</option>)}
                            </select>
                          </div>

                          {/* 17. Labour 2 */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                              <span>17. Mekanik 2</span>
                              {filterLabour2 && <button onClick={() => setFilterLabour2('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                            </label>
                            <select
                              value={filterLabour2}
                              onChange={(e) => setFilterLabour2(e.target.value)}
                              className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Semua Mekanik 2</option>
                              {uniqueLabour2.map((l, i) => <option key={i} value={l}>{l}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* 18. Status Pekerjaan */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                            <span>18. Status Kerja</span>
                            {filterStatus && <button onClick={() => setFilterStatus('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                          </label>
                          <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-blue-500 font-bold"
                          >
                            <option value="">Semua Status</option>
                            {uniqueStatuses.map((s, i) => <option key={i} value={s}>{s}</option>)}
                          </select>
                        </div>

                        {/* 19. LEAD JOB DESCRIPTION */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                            <span>19. Lead Job Desc (Log)</span>
                            {filterLeadJobDescription && <button onClick={() => setFilterLeadJobDescription('')} className="text-red-500 font-bold lowercase text-[9px] hover:underline cursor-pointer">Clear</button>}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Cari di riwayat kerja..."
                              value={filterLeadJobDescription}
                              onChange={(e) => setFilterLeadJobDescription(e.target.value)}
                              className="w-full pr-7 bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-blue-500"
                            />
                            {filterLeadJobDescription && (
                              <button onClick={() => setFilterLeadJobDescription('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Table container view */}
          <div className="overflow-x-auto">
            {filteredRecords.length === 0 ? (
              <div className="py-16 text-center max-w-md mx-auto">
                <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">Tidak ada data ditemukan</h3>
                <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian Anda atau reset filter yang sedang aktif.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-100/65 text-slate-600 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">SR Details</th>
                    <th className="py-3 px-4">UC3 Status</th>
                    <th className="py-3 px-4">Mechanical Timeline</th>
                    <th className="py-3 px-4">Kondisi Alat / Masalah</th>
                    <th className="py-3 px-4">Mekanik Assigned</th>
                    <th className="py-3 px-4">Status Kerja</th>
                    <th className="py-3 px-4 text-center">Detail / Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredRecords.map((rec) => {
                    return (
                      <tr 
                        key={rec.id}
                        className="hover:bg-slate-50/80 transition-all cursor-pointer group"
                        onClick={() => {
                          setSelectedRecord(rec);
                          setIsEditing(false);
                          setIsAdding(false);
                        }}
                      >
                        
                        {/* Customer Column */}
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {rec.customer || '-'}
                        </td>

                        {/* SR Numbers etc. */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-[11px] text-slate-800 font-semibold">{rec.srNumber}</div>
                          {rec.uc3Number && (
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              No UC3: <span className="font-mono">{rec.uc3Number}</span>
                            </div>
                          )}
                        </td>

                        {/* UC3 Status */}
                        <td className="py-3.5 px-4">
                          {rec.uc3Status && rec.uc3Status !== 'None' ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              rec.uc3Status === 'Done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              rec.uc3Status === 'Inprogress' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                              'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {rec.uc3Status}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[10px]">-</span>
                          )}
                        </td>

                        {/* Timeline / Dates */}
                        <td className="py-3.5 px-4 leading-normal">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-[11px] text-slate-800">SR:</span> 
                            <span className="font-mono text-slate-500">{formatDate(rec.srDate)}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>Aging: <span className="font-bold font-mono text-slate-600">{rec.srAging} hr</span></span>
                            <span>•</span>
                            <span>Plan: <span className="font-mono">{rec.planningDate ? formatDate(rec.planningDate) : '-'}</span></span>
                          </div>
                        </td>

                        {/* Condition and Problems */}
                        <td className="py-3.5 px-4 max-w-xs">
                          {/* Unit Condition Indicator Badge */}
                          <div className="mb-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                              rec.unitCondition === 'Breakdown' ? 'bg-red-50 text-red-700 border border-red-100' :
                              rec.unitCondition === 'Running With Trouble' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {rec.unitCondition}
                            </span>
                          </div>
                          
                          {/* Model and serial number of target unit */}
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <span className="bg-slate-100 text-slate-700 font-mono px-1 rounded text-[10px]">{rec.model}</span>
                            <span className="font-mono text-slate-500 text-[11px]">{rec.snUnit}</span>
                          </div>
                          <div className="text-slate-500 text-[11px] truncate mt-0.5" title={rec.issueDescription}>
                            {rec.issueDescription}
                          </div>
                        </td>

                        {/* Assigned Labours */}
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              <span>{rec.labour1 || '-'}</span>
                            </div>
                            {rec.labour2 && (
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                <span>{rec.labour2}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span>{rec.location}</span>
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                            rec.status === 'RFU_LEAD JOB' ? 'bg-violet-100 text-violet-700 border border-violet-200' :
                            rec.status === 'Inprogress' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                            rec.status === 'Delay Labour' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-slate-200 text-slate-800'
                          }`}>
                            {rec.status === 'RFU_LEAD JOB' ? '⚙️ RFU LEAD JOB' : rec.status}
                          </span>
                        </td>

                        {/* Expand Button action controls */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRecord(rec);
                              setIsEditing(false);
                              setIsAdding(false);
                            }}
                            className="mr-1 bg-slate-100 hover:bg-slate-200 group-hover:bg-blue-600 group-hover:text-white text-slate-700 py-1 px-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-250 cursor-pointer inline-flex items-center gap-1"
                          >
                            Details
                            <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-white" />
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </section>

      </main>

      {/* Floating Modals and Side Slidover Timelines */}
      <AnimatePresence>
        
        {/* Drawers / Overlays */}
        {(selectedRecord || isAdding) && (
          <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 overflow-hidden">
              
              {/* Back Drop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900 transition-opacity cursor-pointer"
                onClick={() => {
                  setSelectedRecord(null);
                  setIsAdding(false);
                  setIsEditing(false);
                }}
              />

              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                
                {/* Panel Slider Content */}
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="pointer-events-auto w-screen max-w-2xl"
                >
                  <div className="flex h-full flex-col bg-white shadow-2xl border-l border-slate-200 overflow-y-auto">
                    
                    {/* Drawer Header context */}
                    <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-400/20 text-blue-400">
                          <Wrench className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold tracking-tight text-white uppercase opacity-75">
                            {isAdding ? 'Tambah Data Baru' : isEditing ? 'Edit Service Request' : 'Informasi Detil Unit'}
                          </h2>
                          <p className="text-base font-semibold text-slate-100 mt-0.5 truncate max-w-md">
                            {isAdding ? 'Buat Lembar Kerja Baru' : selectedRecord?.customer}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedRecord(null);
                          setIsAdding(false);
                          setIsEditing(false);
                        }}
                        className="p-1 px-1.5 border border-slate-700 hover:border-slate-500 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Drawer Main Body with Dynamic Scroll section */}
                    <div className="flex-1 p-6 relative">
                      
                      {/* ADDING / EDITING FORM CONDITIONAL */}
                      {isAdding || isEditing ? (
                        <form onSubmit={handleFormSubmit} className="space-y-5 text-xs text-slate-800">
                          
                          {/* Client & SR Identity header info */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1 text-blue-700">A. Identitas Service Request</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer *</label>
                                <input
                                  type="text"
                                  required
                                  value={formState.customer}
                                  onChange={(e) => setFormState({ ...formState, customer: e.target.value })}
                                  placeholder="Contoh: PT. KUDA LOGAM ENERGI"
                                  className="w-full bg-white border border-slate-350 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden font-medium"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">SR Number *</label>
                                <input
                                  type="text"
                                  required
                                  value={formState.srNumber}
                                  onChange={(e) => setFormState({ ...formState, srNumber: e.target.value })}
                                  placeholder="SR/PKY/03/26/0090"
                                  className="w-full bg-white border border-slate-350 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden font-mono"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">WO Number (Opsional)</label>
                                <input
                                  type="text"
                                  value={formState.woNumber}
                                  onChange={(e) => setFormState({ ...formState, woNumber: e.target.value })}
                                  placeholder="WO-"
                                  className="w-full bg-white border border-slate-350 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">UC3 Number (Opsional)</label>
                                <input
                                  type="text"
                                  value={formState.uc3Number}
                                  onChange={(e) => setFormState({ ...formState, uc3Number: e.target.value })}
                                  placeholder="UC3/"
                                  className="w-full bg-white border border-slate-350 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">UC3 Status</label>
                                <select
                                  value={formState.uc3Status}
                                  onChange={(e) => setFormState({ ...formState, uc3Status: e.target.value as UC3Status })}
                                  className="w-full bg-white border border-slate-350 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold"
                                >
                                  <option value="None">None</option>
                                  <option value="Done">Done</option>
                                  <option value="Inprogress">Inprogress</option>
                                  <option value="waiting Part">waiting Part</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Unit info details */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1 text-blue-700">B. Spesifikasi Alat &amp; Masalah</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Model Unit *</label>
                                <input
                                  type="text"
                                  required
                                  value={formState.model}
                                  onChange={(e) => setFormState({ ...formState, model: e.target.value })}
                                  placeholder="Contoh: HX210HD"
                                  className="w-full bg-white border border-slate-350 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Serial Number (SN Unit) *</label>
                                <input
                                  type="text"
                                  required
                                  value={formState.snUnit}
                                  onChange={(e) => setFormState({ ...formState, snUnit: e.target.value })}
                                  placeholder="HJSCE6G9JE0034008"
                                  className="w-full bg-white border border-slate-350 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kondisi Unit *</label>
                                <select
                                  value={formState.unitCondition}
                                  onChange={(e) => setFormState({ ...formState, unitCondition: e.target.value as UnitCondition })}
                                  className="w-full bg-white border border-slate-350 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold"
                                >
                                  <option value="Breakdown">Breakdown</option>
                                  <option value="Running With Trouble">Running With Trouble</option>
                                  <option value="Running Without Trouble">Running Without Trouble</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Issue Description (Keluhan Utama)</label>
                              <input
                                type="text"
                                value={formState.issueDescription}
                                onChange={(e) => setFormState({ ...formState, issueDescription: e.target.value })}
                                placeholder="Tuliskan keluhan utama, contoh: PM 2000 Hours + Swing Bearing Noise"
                                className="w-full bg-white border border-slate-350 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden"
                              />
                            </div>
                          </div>

                          {/* Scheduling & Labor Dates timeline */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1 text-blue-700">C. Timeline &amp; Penugasan Mekanik</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal SR Masuk</label>
                                <input
                                  type="date"
                                  value={formState.srDate}
                                  onChange={(e) => setFormState({ ...formState, srDate: e.target.value })}
                                  className="w-full bg-white border border-slate-350 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-hidden"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">SR Aging (Hari)</label>
                                <input
                                  type="number"
                                  value={formState.srAging}
                                  onChange={(e) => setFormState({ ...formState, srAging: Number(e.target.value) || 0 })}
                                  className="w-full bg-white border border-slate-350 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-hidden font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal Planning</label>
                                <input
                                  type="date"
                                  value={formState.planningDate}
                                  onChange={(e) => setFormState({ ...formState, planningDate: e.target.value })}
                                  className="w-full bg-white border border-slate-350 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-hidden"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal RFU (Ready)</label>
                                <input
                                  type="date"
                                  value={formState.rfuDate}
                                  onChange={(e) => setFormState({ ...formState, rfuDate: e.target.value })}
                                  className="w-full bg-white border border-slate-350 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-hidden"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Lokasi Pengerjaan / Site</label>
                                <input
                                  type="text"
                                  value={formState.location}
                                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                                  placeholder="Contoh: Tumbang Miri"
                                  className="w-full bg-white border border-slate-350 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mekanik 1 (Labour 1)</label>
                                <input
                                  type="text"
                                  value={formState.labour1}
                                  onChange={(e) => setFormState({ ...formState, labour1: e.target.value })}
                                  placeholder="Nama Mekanik Utama"
                                  className="w-full bg-white border border-slate-350 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mekanik 2 (Labour 2)</label>
                                <input
                                  type="text"
                                  value={formState.labour2}
                                  onChange={(e) => setFormState({ ...formState, labour2: e.target.value })}
                                  placeholder="Asisten Mekanik / Pendamping"
                                  className="w-full bg-white border border-slate-350 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Technical Action status logs */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1 text-blue-700">D. Progres Proyek &amp; Laporan Detil</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status Progres</label>
                                <select
                                  value={formState.status}
                                  onChange={(e) => setFormState({ ...formState, status: e.target.value as WorkStatus })}
                                  className="w-full bg-white border border-slate-350 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden font-bold"
                                >
                                  <option value="Inprogress">Inprogress</option>
                                  <option value="RFU_LEAD JOB">RFU_LEAD JOB (Selesai)</option>
                                  <option value="Delay Labour">Delay Labour</option>
                                  <option value="Not Progress">Not Progress</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal Eksekusi (Action Date)</label>
                                <input
                                  type="date"
                                  value={formState.actionDate}
                                  onChange={(e) => setFormState({ ...formState, actionDate: e.target.value })}
                                  className="w-full bg-white border border-slate-355 rounded-lg px-2 py-1"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Lead Job Description (Log Kerja Tim Lapangan)</label>
                              <textarea
                                value={formState.leadJobDescription}
                                onChange={(e) => setFormState({ ...formState, leadJobDescription: e.target.value })}
                                placeholder="Contoh: (01/04/2026) Memeriksa swing motor, membersihkan saringan oli, mengganti filter solar, serta melakukan pengujian operasi beban berat..."
                                rows={6}
                                className="w-full bg-white border border-slate-350 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-hidden font-sans text-xs"
                              />
                            </div>
                          </div>

                          {/* Save & Cancel Footer Buttons controls */}
                          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (isEditing && selectedRecord) {
                                  setIsEditing(false);
                                } else {
                                  setIsAdding(false);
                                }
                              }}
                              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-all cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              id="btn-save-record"
                              className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-xs hover:bg-blue-700 transition-all cursor-pointer"
                            >
                              Simpan &amp; Terapkan
                            </button>
                          </div>

                        </form>
                      ) : (
                        
                        /* READ-ONLY MULTI-PANEL VIEW WITH COOL TIMELINE */
                        selectedRecord && (
                          <div className="space-y-6">
                            
                            {/* Urgent Alert Banner if Breakdown */}
                            {selectedRecord.unitCondition === 'Breakdown' && (
                              <div className="bg-red-50 border border-red-100 text-red-900 rounded-xl p-4 flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="font-bold text-xs">Peringatan: Unit Breakdown!</h4>
                                  <p className="text-[11px] leading-relaxed text-red-700 mt-0.5">
                                    Alat berat berada dalam status lumpuh/berhenti (Breakdown). Penanganan mekanik lapangan diprioritaskan demi meminimalkan downtime kontraktor pembeli unit.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Section 1: Customer & UC3 Identification Card */}
                            <div>
                              <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Identifikasi Pekerjaan</h3>
                              <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4 grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                                <div>
                                  <span className="text-slate-400 block mb-0.5">Nama Kontraktor/Customer:</span>
                                  <span className="font-bold text-slate-900 text-sm leading-tight block">{selectedRecord.customer || '-'}</span>
                                </div>

                                <div>
                                  <span className="text-slate-400 block mb-0.5">Nomor SR Unit:</span>
                                  <span className="font-mono font-semibold text-slate-800 text-sm block">{selectedRecord.srNumber || '-'}</span>
                                </div>

                                <div className="border-t border-slate-100 pt-3">
                                  <span className="text-slate-400 block mb-0.5">Status UC3:</span>
                                  {selectedRecord.uc3Status && selectedRecord.uc3Status !== 'None' ? (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                                      selectedRecord.uc3Status === 'Done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                      selectedRecord.uc3Status === 'Inprogress' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                      'bg-amber-50 text-amber-700 border border-amber-100'
                                    }`}>
                                      {selectedRecord.uc3Status}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 font-mono font-medium">Bukan UC3</span>
                                  )}
                                </div>

                                <div className="border-t border-slate-100 pt-3">
                                  <span className="text-slate-400 block mb-0.5">Nomor UC3:</span>
                                  <span className="font-mono font-medium text-slate-700 block">{selectedRecord.uc3Number || '-'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Section 2: Model & Asset Specification Detail */}
                            <div>
                              <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Detil Unit &amp; Gejala Kerusakan</h3>
                              <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4 grid grid-cols-3 gap-3 text-xs">
                                <div>
                                  <span className="text-slate-400 block mb-0.5">Model Unit:</span>
                                  <span className="bg-slate-200 text-slate-850 px-2 py-0.5 font-bold font-mono rounded inline-block text-[11px]">{selectedRecord.model || '-'}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-slate-400 block mb-0.5">Serial Number:</span>
                                  <span className="font-mono font-bold text-slate-800 text-sm leading-none block pt-1">{selectedRecord.snUnit || '-'}</span>
                                </div>
                                <div className="col-span-3 border-t border-slate-100 pt-3">
                                  <span className="text-slate-400 block mb-0.5">Kondisi Fisik Alat:</span>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold mr-2 ${
                                    selectedRecord.unitCondition === 'Breakdown' ? 'bg-red-50 text-red-700 border border-red-100' :
                                    selectedRecord.unitCondition === 'Running With Trouble' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                    'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  }`}>
                                    {selectedRecord.unitCondition}
                                  </span>
                                </div>
                                <div className="col-span-3">
                                  <span className="text-slate-400 block mb-0.5">Deksripsi Isu / Keluhan:</span>
                                  <p className="font-semibold text-slate-800 text-xs bg-white p-2.5 rounded-xl border border-slate-200/60">{selectedRecord.issueDescription || '-'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Section 3: Labor Assignment & Working status */}
                            <div>
                              <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Penugasan Lapangan &amp; Status</h3>
                              <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4 grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="text-slate-400 block mb-0.5">Lokasi Kerja / Site:</span>
                                  <span className="font-bold text-slate-800 flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                    {selectedRecord.location || '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block mb-0.5">Status Pengerjaan Kerja:</span>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    selectedRecord.status === 'RFU_LEAD JOB' ? 'bg-violet-100 text-violet-700 border border-violet-200 animate-pulse' :
                                    selectedRecord.status === 'Inprogress' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                                    selectedRecord.status === 'Delay Labour' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                    'bg-slate-200 text-slate-800'
                                  }`}>
                                    {selectedRecord.status}
                                  </span>
                                </div>
                                <div className="col-span-2 border-t border-slate-100 pt-3">
                                  <span className="text-slate-400 block mb-1">Mekanik Handal Ditugaskan (Labours):</span>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedRecord.labour1 && (
                                      <span className="bg-white border border-slate-200 text-slate-700 font-semibold py-1 px-3 rounded-xl flex items-center gap-1">
                                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        Mekanik 1: {selectedRecord.labour1}
                                      </span>
                                    )}
                                    {selectedRecord.labour2 && (
                                      <span className="bg-white border border-slate-200 text-slate-700 font-semibold py-1 px-3 rounded-xl flex items-center gap-1">
                                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        Mekanik 2: {selectedRecord.labour2}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Section 4: Gorgeous Service Progress Timeline */}
                            <div>
                              <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3">Linimasa Tanggap Mekanik (Service Timeline)</h3>
                              <div className="px-1 py-1">
                                <div className="relative flex items-center justify-between">
                                  
                                  {/* Connector Line behind points */}
                                  <div className="absolute left-[5%] right-[5%] top-4 h-0.5 bg-slate-200 -z-1" />
                                  <div className="absolute left-[5%] right-[5%] top-4 h-0.5 bg-blue-500 -z-1" style={{
                                    width: selectedRecord.status === 'RFU_LEAD JOB' ? '100%' :
                                           selectedRecord.actionDate ? '66%' :
                                           selectedRecord.planningDate ? '33%' : '0%'
                                  }} />

                                  {/* Milestone 1: SR Created */}
                                  <div className="flex flex-col items-center flex-1">
                                    <div className="w-8.5 h-8.5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center border-4 border-white shadow-md">
                                      1
                                    </div>
                                    <span className="font-bold text-[10px] text-slate-800 mt-2">SR Diajukan</span>
                                    <span className="text-[10px] font-mono text-slate-400 mt-0.5">{formatDate(selectedRecord.srDate)}</span>
                                  </div>

                                  {/* Milestone 2: Planning Set */}
                                  <div className="flex flex-col items-center flex-1">
                                    <div className={`w-8.5 h-8.5 rounded-full font-bold flex items-center justify-center border-4 border-white shadow-md ${
                                      selectedRecord.planningDate ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                                    }`}>
                                      2
                                    </div>
                                    <span className="font-bold text-[10px] text-slate-800 mt-2">Direncanakan</span>
                                    <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                                      {selectedRecord.planningDate ? formatDate(selectedRecord.planningDate) : 'Belum Atur'}
                                    </span>
                                  </div>

                                  {/* Milestone 3: Action Taken */}
                                  <div className="flex flex-col items-center flex-1">
                                    <div className={`w-8.5 h-8.5 rounded-full font-bold flex items-center justify-center border-4 border-white shadow-md ${
                                      selectedRecord.actionDate ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                                    }`}>
                                      3
                                    </div>
                                    <span className="font-bold text-[10px] text-slate-800 mt-2">Eksekusi</span>
                                    <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                                      {selectedRecord.actionDate ? formatDate(selectedRecord.actionDate) : 'Belum Eksekusi'}
                                    </span>
                                  </div>

                                  {/* Milestone 4: Ready For Use (RFU) */}
                                  <div className="flex flex-col items-center flex-1">
                                    <div className={`w-8.5 h-8.5 rounded-full font-bold flex items-center justify-center border-4 border-white shadow-md ${
                                      selectedRecord.status === 'RFU_LEAD JOB' || selectedRecord.rfuDate ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                                    }`}>
                                      RFU
                                    </div>
                                    <span className="font-bold text-[10px] text-slate-800 mt-2">Ready Unit</span>
                                    <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                                      {selectedRecord.rfuDate ? formatDate(selectedRecord.rfuDate) : 'Menunggu RFU'}
                                    </span>
                                  </div>

                                </div>
                                
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 leading-normal flex items-start gap-1.5 justify-between">
                                  <div className="flex gap-1.5 items-start">
                                    <Clock className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
                                    <span>
                                      Status Durasi Tiket (SR Aging): <span className="font-bold font-mono text-blue-800">{selectedRecord.srAging} hari</span> berjalan dari waktu terbit service request di site lapangan.
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Section 5: Full Detailed Mechanical Log Description */}
                            <div>
                              <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Riwayat Log Kerja Mekanik - LEAD JOB DESCRIPTION</h3>
                              <div className="bg-slate-900 text-slate-100 p-4.5 rounded-2xl border border-slate-850 font-sans text-[11px] leading-relaxed select-text">
                                {selectedRecord.leadJobDescription ? (
                                  <p className="whitespace-pre-line break-words italic tracking-wide">
                                    {selectedRecord.leadJobDescription}
                                  </p>
                                ) : (
                                  <p className="italic text-slate-500 font-medium">Beban kerja belum dideskripsikan secara detil oleh tim mekanik lapangan.</p>
                                )}
                              </div>
                            </div>

                            {/* Action Operations for specific chosen row */}
                            <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-4 sticky bottom-0 bg-white py-4">
                              <button
                                type="button"
                                id="btn-delete-record"
                                onClick={() => handleDeleteRecord(selectedRecord.id)}
                                className="flex items-center justify-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-semibold px-4 py-2 hover:bg-red-50 rounded-xl border border-red-200 transition-all cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                                Hapus Record
                              </button>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedRecord(null)}
                                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 text-xs transition-all cursor-pointer"
                                >
                                  Tutup Panel
                                </button>
                                <button
                                  type="button"
                                  id="btn-edit-record"
                                  onClick={() => handleOpenEdit(selectedRecord)}
                                  className="flex items-center gap-1.5 bg-blue-600 text-white font-bold px-5 py-2 hover:bg-blue-700 rounded-xl text-xs transition-all cursor-pointer shadow-xs"
                                >
                                  <Edit3 className="h-4 w-4" />
                                  Edit Record
                                </button>
                              </div>
                            </div>

                          </div>
                        )
                      )}

                    </div>

                  </div>
                </motion.div>

              </div>
            </div>
          </div>
        )}

      </AnimatePresence>

      {/* Aesthetic visually humble and authentic copyright footer */}
      <footer className="mt-auto max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs text-center sm:text-left">
        <p className="font-sans">
          &copy; 2026 Heavy Equipment Service Tracker Dashboard KalTeng. Hak Cipta Dilindungi.
        </p>
        <p className="font-mono text-[10px]">
          UTC Time: 2026-05-25 • Google Sheet Connected via Apps Script API
        </p>
      </footer>

    </div>
  );
}

// Visual layout decorator component
function CodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
  );
}
