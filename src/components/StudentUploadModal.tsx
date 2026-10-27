import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Student } from '../types';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  X, 
  Check, 
  AlertCircle, 
  Download, 
  Sparkles,
  Users,
  Info,
  Trash2
} from 'lucide-react';

interface StudentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableClasses: string[];
  selectedClassDefault: string;
  onSaveBatch: (students: Student[], targetClass: string, isOverwrite: boolean) => void;
}

interface ParsedRow {
  studentNo: number;
  studentIdCode: string;
  prefix: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  note: string;
}

export const StudentUploadModal: React.FC<StudentUploadModalProps> = ({
  isOpen,
  onClose,
  availableClasses,
  selectedClassDefault,
  onSaveBatch,
}) => {
  const [targetClass, setTargetClass] = useState<string>(
    selectedClassDefault && selectedClassDefault !== 'all' ? selectedClassDefault : (availableClasses[0] || 'ม.3/1')
  );
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('replace');
  
  // File import state
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text paste state
  const [pastedText, setPastedText] = useState<string>('');

  // Parsed students preview
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper function to extract Thai prefix, first name, last name, and gender
  const parseFullName = (rawName: string) => {
    let clean = rawName.trim().replace(/\s+/g, ' ');
    let prefix = '';
    let gender: 'male' | 'female' | 'other' = 'male';

    const prefixes = [
      { name: 'เด็กชาย', short: 'ด.ช.', gender: 'male' as const },
      { name: 'เด็กหญิง', short: 'ด.ญ.', gender: 'female' as const },
      { name: 'นาย', short: 'นาย', gender: 'male' as const },
      { name: 'นางสาว', short: 'น.ส.', gender: 'female' as const },
      { name: 'นาง', short: 'นาง', gender: 'female' as const },
    ];

    for (const p of prefixes) {
      if (clean.startsWith(p.name)) {
        prefix = p.name;
        gender = p.gender;
        clean = clean.substring(p.name.length).trim();
        break;
      } else if (clean.startsWith(p.short)) {
        prefix = p.name;
        gender = p.gender;
        clean = clean.substring(p.short.length).trim();
        break;
      }
    }

    const nameParts = clean.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return { prefix, firstName, lastName, gender };
  };

  // Parse Excel / CSV File
  const handleFileUpload = (file: File) => {
    setErrorMsg(null);
    setFileName(file.name);

    const reader = new FileReader();

    if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsArrayBuffer(file);
    }

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let workbook: XLSX.WorkBook;

        if (typeof data === 'string') {
          workbook = XLSX.read(data, { type: 'string' });
        } else {
          workbook = XLSX.read(data, { type: 'array' });
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (!jsonRows || jsonRows.length === 0) {
          setErrorMsg('ไม่พบข้อมูลในไฟล์ที่อัปโหลด กรุณาตรวจสอบไฟล์อีกครั้ง');
          setParsedRows([]);
          return;
        }

        const rows: ParsedRow[] = [];

        jsonRows.forEach((row, index) => {
          // Normalize column headers to lowercase & trimmed
          const keys = Object.keys(row);
          const getVal = (possibleHeaders: string[]) => {
            for (const key of keys) {
              const kClean = key.toString().trim().toLowerCase();
              if (possibleHeaders.some(ph => kClean.includes(ph.toLowerCase()))) {
                return row[key]?.toString().trim() || '';
              }
            }
            return '';
          };

          const rawNo = getVal(['เลขที่', 'no', 'number', 'ลำดับ']);
          const rawId = getVal(['รหัส', 'id', 'student_id', 'รหัสนักเรียน']);
          const rawPrefix = getVal(['คำนำหน้า', 'prefix', 'คำนำ']);
          const rawFirstName = getVal(['ชื่อ', 'firstname', 'first_name']);
          const rawLastName = getVal(['นามสกุล', 'lastname', 'last_name']);
          const rawFullName = getVal(['ชื่อ-นามสกุล', 'ชื่อ นามสกุล', 'fullname', 'full_name']);
          const rawGender = getVal(['เพศ', 'gender']);
          const rawNote = getVal(['หมายเหตุ', 'note', 'remark']);

          let studentNo = parseInt(rawNo, 10);
          if (isNaN(studentNo)) {
            studentNo = index + 1;
          }

          let prefix = rawPrefix;
          let firstName = rawFirstName;
          let lastName = rawLastName;
          let gender: 'male' | 'female' | 'other' = rawGender.includes('หญิง') || rawGender.includes('female') ? 'female' : 'male';

          // If fullName is given instead of separate firstName/lastName
          if (!firstName && rawFullName) {
            const parsed = parseFullName(rawFullName);
            if (!prefix) prefix = parsed.prefix;
            firstName = parsed.firstName;
            lastName = parsed.lastName;
            if (!rawGender) gender = parsed.gender;
          }

          // Smart fallback prefix parsing if prefix is inside firstName
          if (!prefix && firstName) {
            const parsed = parseFullName(`${firstName} ${lastName}`.trim());
            if (parsed.prefix) {
              prefix = parsed.prefix;
              firstName = parsed.firstName;
              lastName = parsed.lastName || lastName;
              gender = parsed.gender;
            }
          }

          if (firstName || lastName) {
            rows.push({
              studentNo,
              studentIdCode: rawId,
              prefix: prefix || (gender === 'female' ? 'เด็กหญิง' : 'เด็กชาย'),
              firstName,
              lastName,
              gender,
              note: rawNote
            });
          }
        });

        if (rows.length === 0) {
          setErrorMsg('ไม่สามารถอ่านข้อมูลชื่อนักเรียนได้ กรุณาใช้ไฟล์แบบฟอร์มตัวอย่าง');
        } else {
          setParsedRows(rows);
        }
      } catch (err) {
        console.error('File parse error:', err);
        setErrorMsg('เกิดข้อผิดพลาดในการอ่านไฟล์ กรุณาตรวจสอบว่าเป็นไฟล์ Excel (.xlsx) หรือ CSV');
      }
    };
  };

  // Parse Text Paste
  const handleParseText = () => {
    setErrorMsg(null);
    if (!pastedText.trim()) {
      setErrorMsg('กรุณาวางรายชื่อนักเรียนก่อนประมวลผล');
      return;
    }

    const lines = pastedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const rows: ParsedRow[] = [];

    lines.forEach((line, idx) => {
      // Regex pattern to extract studentNo and studentIdCode if present
      // Example lines:
      // "1. 66101 เด็กชายสมชาย ใจดี"
      // "1 สมชาย ใจดี"
      // "นายวิชาญ สุขสว่าง"
      let cleanLine = line.replace(/^\d+[\.\)\s\-]+/, '').trim(); // remove leading numbers like 1. or 1)
      
      // Check if there is student ID code
      let studentIdCode = '';
      const idMatch = cleanLine.match(/^(\d{4,10})\s+(.+)$/);
      if (idMatch) {
        studentIdCode = idMatch[1];
        cleanLine = idMatch[2].trim();
      }

      const parsed = parseFullName(cleanLine);

      if (parsed.firstName) {
        rows.push({
          studentNo: idx + 1,
          studentIdCode,
          prefix: parsed.prefix || (parsed.gender === 'female' ? 'เด็กหญิง' : 'เด็กชาย'),
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          gender: parsed.gender,
          note: ''
        });
      }
    });

    if (rows.length === 0) {
      setErrorMsg('ไม่สามารถแปลงข้อความที่ระบุได้');
    } else {
      setParsedRows(rows);
    }
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const csvContent = "\uFEFFเลขที่,รหัสนักเรียน,คำนำหน้า,ชื่อ,นามสกุล,เพศ,หมายเหตุ\n" +
      "1,6630101,เด็กชาย,กิตติพงษ์,สุขสว่าง,ชาย,หัวหน้าห้อง\n" +
      "2,6630102,เด็กหญิง,กนกวรรณ,แสงทอง,หญิง,\n" +
      "3,6630103,เด็กชาย,ณัฐดนย์,ประเสริฐศิลป์,ชาย,";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ตัวอย่างรายชื่อนักเรียน_${targetClass}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Confirm Save
  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    const newStudents: Student[] = parsedRows.map((row, idx) => ({
      id: `std-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      studentNo: row.studentNo || idx + 1,
      studentIdCode: row.studentIdCode,
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      className: targetClass,
      gender: row.gender,
      note: row.note
    }));

    onSaveBatch(newStudents, targetClass, importMode === 'replace');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-3xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">นำเข้ารายชื่อนักเรียนเข้าห้องเรียน</h3>
              <p className="text-xs text-indigo-200/80">รองรับไฟล์ Excel (.xlsx), CSV หรือคัดลอกวางข้อความ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">

          {/* Classroom Selection & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>ห้องเรียนที่จะนำเข้าข้อมูล</span>
              </label>
              <select
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>ห้องเรียน {cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                <span>รูปแบบการบันทึกข้อมูล</span>
              </label>
              <div className="flex items-center space-x-3 pt-0.5">
                <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-medium text-rose-700">ล้างรายชื่อเดิมแล้วทับใหม่</span>
                </label>

                <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-medium">เพิ่มต่อท้ายรายชื่อเดิม</span>
                </label>
              </div>
            </div>
          </div>

          {/* Import Method Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('file')}
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'file'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>1. อัปโหลดไฟล์ Excel / CSV</span>
            </button>

            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'text'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>2. คัดลอก-วางรายชื่อ (Text Paste)</span>
            </button>
          </div>

          {/* Method 1: File Upload */}
          {activeTab === 'file' && (
            <div className="space-y-3">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-50/80 scale-[0.99]'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  accept=".xlsx, .xls, .csv, .txt"
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>

                <p className="text-xs font-bold text-slate-800">
                  {fileName ? `ไฟล์ที่เลือก: ${fileName}` : 'ลากไฟล์ Excel / CSV มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  รองรับนามสกุล .xlsx, .xls, .csv (คอลัมน์: เลขที่, รหัสนักเรียน, คำนำหน้า, ชื่อ, นามสกุล)
                </p>

                <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-indigo-700 font-semibold shadow-2xs hover:bg-slate-50">
                  <Download className="w-3.5 h-3.5" />
                  <span onClick={(e) => { e.stopPropagation(); handleDownloadTemplate(); }}>
                    ดาวน์โหลดแบบฟอร์มไฟล์ตัวอย่าง (.csv)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Method 2: Text Paste */}
          {activeTab === 'text' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                วางรายชื่อนักเรียน (บรรทัดละ 1 คน เช่น "1. 66101 เด็กชายสมชาย ใจดี")
              </label>
              <textarea
                rows={6}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`ตัวอย่าง:\n1. 66101 เด็กชายกิตติพงษ์ สุขสว่าง\n2. 66102 เด็กหญิงกนกวรรณ แสงทอง\n3. 66103 เด็กชายณัฐดนย์ ประเสริฐศิลป์`}
                className="w-full p-3 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
              <button
                type="button"
                onClick={handleParseText}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>ประมวลผลข้อความ</span>
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Parsed Data Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>ตรวจสอบตัวอย่างรายชื่อที่จะนำเข้า ({parsedRows.length} คน)</span>
                </h4>
                <button
                  onClick={() => setParsedRows([])}
                  className="text-[11px] text-rose-600 hover:underline flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>ล้างตัวอย่าง</span>
                </button>
              </div>

              <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-2 text-center w-12">เลขที่</th>
                      <th className="p-2 w-24">รหัสนักเรียน</th>
                      <th className="p-2 w-20">คำนำหน้า</th>
                      <th className="p-2">ชื่อ</th>
                      <th className="p-2">นามสกุล</th>
                      <th className="p-2 w-16">เพศ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2 text-center font-bold text-slate-600">{row.studentNo}</td>
                        <td className="p-2 text-slate-600 font-mono text-[11px]">{row.studentIdCode || '-'}</td>
                        <td className="p-2 text-slate-700 font-medium">{row.prefix}</td>
                        <td className="p-2 text-slate-900 font-semibold">{row.firstName}</td>
                        <td className="p-2 text-slate-900 font-semibold">{row.lastName}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            row.gender === 'female' 
                              ? 'bg-pink-100 text-pink-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {row.gender === 'female' ? 'หญิง' : 'ชาย'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            ยกเลิก
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={parsedRows.length === 0}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center space-x-2 transition-all ${
              parsedRows.length > 0
                ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                : 'bg-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>ยืนยันการนำเข้าข้อมูล ({parsedRows.length} คน)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
