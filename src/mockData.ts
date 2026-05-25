import { SRRecord } from './types';

export const INITIAL_RECORDS: SRRecord[] = [
  {
    id: "rec-1",
    customer: "EDI SANTO",
    srNumber: "SR/PKY/02/26/0080",
    woNumber: "",
    uc3Number: "UC3/PKY/02/26/0036",
    uc3Status: "Done",
    srDate: "2026-02-23",
    srAging: 35,
    planningDate: "2026-03-30",
    actionDate: "2026-03-30",
    rfuDate: "2026-03-30",
    unitCondition: "Breakdown",
    snUnit: "HDCKEBAEHS0040120",
    model: "HX210HD",
    issueDescription: "Swing Bearing Noise",
    location: "Tumbang Miri",
    labour1: "Adi",
    labour2: "Wahyu",
    status: "RFU_LEAD JOB",
    leadJobDescription: "(01/04/2026) Checked swing motor, clean up and assembled swing motor, Assembled swing motor and control valve, Installed swing reduction and swing motor, connected lines hydraulic hose, performance tested and pressure checked by cluster (280Bar) and swing pressure good, carried out swing deflection found endplay 2,08mm, carried out PM1000hours, operational groundtest and found alternator cant charging due to regulator and dioda failure, follow up finding deffect and installed by mechanic customer."
  },
  {
    id: "rec-2",
    customer: "PT. KUDA LOGAM ENERGI",
    srNumber: "SR/PKY/03/26/0090",
    woNumber: "",
    uc3Number: "",
    uc3Status: "Inprogress",
    srDate: "2026-03-17",
    srAging: 44,
    planningDate: "2026-04-27",
    actionDate: "2026-04-30",
    rfuDate: "2026-04-30",
    unitCondition: "Running With Trouble",
    snUnit: "HDCKEBAECS0040010",
    model: "HX210HD",
    issueDescription: "PM 2000 Hours",
    location: "Tumbang Miri",
    labour1: "Lingga",
    labour2: "Indra",
    status: "RFU_LEAD JOB",
    leadJobDescription: "(05/05/2028) Reposition unit, replaced engine oil filter, Change engine oil, Replaced fuel separator, Replaced primary fuel filter, Change swing oil and leveling, Change final drives oil RH and LH and leveling, Replaced element hydraulic oil filters, Change hydraulic oil and leveling, Replaced AC filter, Replaced air filter inner and outer, Washed radiator core, final checked and operational ground tested good, RFU"
  },
  {
    id: "rec-3",
    customer: "PT. KUDA LOGAM ENERGI",
    srNumber: "SR/PKY/03/26/0090",
    woNumber: "",
    uc3Number: "",
    uc3Status: "Done",
    srDate: "2026-03-17",
    srAging: 44,
    planningDate: "2026-04-25",
    actionDate: "",
    rfuDate: "2026-04-30",
    unitCondition: "Running Without Trouble",
    snUnit: "HJSCE6G9JE0034008",
    model: "HX210HD",
    issueDescription: "PM 2000 Hours + Swing Bearing Noise",
    location: "Tukun Kapuas",
    labour1: "Agus.S",
    labour2: "Deni",
    status: "Inprogress",
    leadJobDescription: "Persiapan pengerjaan PM 2000 Hours dan investigasi suara bising pada swing bearing. Koordinasi dengan tim lapangan untuk penyesuaian jadwal servis."
  },
  {
    id: "rec-4",
    customer: "PT. KUDA LOGAM ENERGI",
    srNumber: "SR/PKY/03/26/0090",
    woNumber: "",
    uc3Number: "",
    uc3Status: "Done",
    srDate: "2026-03-17",
    srAging: 44,
    planningDate: "2026-04-25",
    actionDate: "",
    rfuDate: "2026-04-30",
    unitCondition: "Running With Trouble",
    snUnit: "HJSCE6G9JE0034008",
    model: "HX210HD",
    issueDescription: "PM 2000 Hours + Swing Bearing Noise",
    location: "Tukun Kapuas",
    labour1: "Agus.S",
    labour2: "Deni",
    status: "Delay Labour",
    leadJobDescription: "Terjadi hambatan tenaga kerja (Labour Delay). Mekanik terjadwal sedang menyelesaikan penanganan unit darurat di site terdekat. Dijadwalkan kembali sesegera mungkin."
  },
  {
    id: "rec-5",
    customer: "PT. KUDA LOGAM ENERGI",
    srNumber: "SR/PKY/03/26/0090",
    woNumber: "",
    uc3Number: "",
    uc3Status: "waiting Part",
    srDate: "2026-03-17",
    srAging: 44,
    planningDate: "2026-04-25",
    actionDate: "",
    rfuDate: "2026-04-30",
    unitCondition: "Running With Trouble",
    snUnit: "HJSCE6G9JE0034008",
    model: "HX210HD",
    issueDescription: "PM 2000 Hours + Swing Bearing Noise",
    location: "Tukun Kapuas",
    labour1: "Agus.S",
    labour2: "Deni",
    status: "Not Progress",
    leadJobDescription: "Menunggu kedatangan filter kit PM 2000 serta seal swing bearing cadangan dari gudang logistik pusat."
  }
];

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// CODE GOOGLE APPS SCRIPT (GAS) UNTUK INTEGRASI SPREADSHEET
// 1. Buka Google Sheet Anda.
// 2. Klik Eksistensi -> Apps Script.
// 3. Ganti kode di dalamnya dengan kode di bawah ini.
// 4. Klik "Terapkan" -> "Penerapan Baru" -> "Jenis Penerapan: Aplikasi Web".
// 5. Di bagian "Siapa yang memiliki akses", pilih "Siapa saja" (Anyone, even anonymous).
// 6. Klik "Terapkan", setujui izin, lalu salin URL Aplikasi Web yang diberikan.
// 7. Tempel URL tersebut ke input di Dashboard untuk mengaktifkan sinkronisasi langsung!

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = getSheetData(sheet);
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var result = { success: false };
  try {
    var rawData = e.postData.contents;
    var payload = JSON.parse(rawData);
    
    if (payload.action === 'sync_all') {
      // Membersihkan sheet dan menulis ulang semua data
      sheet.clear();
      var headers = [
        "Customer", "SR Number", "WO Number", "UC3 Number", "UC3 Status", 
        "SR Date", "SR Aging", "Planning Date", "Action Date", "RFU Date", 
        "Unit Condition", "SN Unit", "Model", "Issue Description", "Location", 
        "Labour 1", "Labour 2", "Status", "LEAD JOB DESCRIPTION"
      ];
      sheet.appendRow(headers);
      for (var i = 0; i < payload.data.length; i++) {
        var r = payload.data[i];
        sheet.appendRow([
          r.customer || "", r.srNumber || "", r.woNumber || "", r.uc3Number || "", r.uc3Status || "",
          r.srDate || "", r.srAging || 0, r.planningDate || "", r.actionDate || "", r.rfuDate || "",
          r.unitCondition || "", r.snUnit || "", r.model || "", r.issueDescription || "", r.location || "",
          r.labour1 || "", r.labour2 || "", r.status || "", r.leadJobDescription || ""
        ]);
      }
      result.success = true;
      result.message = "Berhasil sinkronisasi " + payload.data.length + " data.";
    } else if (payload.action === 'add') {
      var r = payload.record;
      sheet.appendRow([
        r.customer || "", r.srNumber || "", r.woNumber || "", r.uc3Number || "", r.uc3Status || "",
        r.srDate || "", r.srAging || 0, r.planningDate || "", r.actionDate || "", r.rfuDate || "",
        r.unitCondition || "", r.snUnit || "", r.model || "", r.issueDescription || "", r.location || "",
        r.labour1 || "", r.labour2 || "", r.status || "", r.leadJobDescription || ""
      ]);
      result.success = true;
      result.message = "Berhasil menambah data baru.";
    }
  } catch (err) {
    result.success = false;
    result.error = err.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var headers = rows[0];
  var data = [];
  
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row[0] && !row[1]) continue; // Lewati baris kosong
    
    var obj = {};
    var mapping = [
      { field: "customer", index: 0 },
      { field: "srNumber", index: 1 },
      { field: "woNumber", index: 2 },
      { field: "uc3Number", index: 3 },
      { field: "uc3Status", index: 4 },
      { field: "srDate", index: 5 },
      { field: "srAging", index: 6 },
      { field: "planningDate", index: 7 },
      { field: "actionDate", index: 8 },
      { field: "rfuDate", index: 9 },
      { field: "unitCondition", index: 10 },
      { field: "snUnit", index: 11 },
      { field: "model", index: 12 },
      { field: "issueDescription", index: 13 },
      { field: "location", index: 14 },
      { field: "labour1", index: 15 },
      { field: "labour2", index: 16 },
      { field: "status", index: 17 },
      { field: "leadJobDescription", index: 18 }
    ];
    
    obj.id = "sheet-row-" + i;
    mapping.forEach(function(m) {
      var val = row[m.index];
      if (val instanceof Date) {
        // format ke tanggal standard YYYY-MM-DD
        var yyyy = val.getFullYear();
        var mm = ('0' + (val.getMonth() + 1)).slice(-2);
        var dd = ('0' + val.getDate()).slice(-2);
        obj[m.field] = yyyy + "-" + mm + "-" + dd;
      } else {
        obj[m.field] = val !== undefined && val !== null ? val.toString() : "";
      }
    });
    obj.srAging = Number(obj.srAging) || 0;
    data.push(obj);
  }
  return data;
}
`;
