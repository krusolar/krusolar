import React, { useState, useEffect } from 'react';
import { Subject } from '../types';
import { 
  Sparkles, 
  X, 
  BookOpen, 
  Lightbulb, 
  Target, 
  Loader2, 
  Check, 
  Copy, 
  ArrowRight,
  Zap,
  HelpCircle,
  KeyRound,
  RefreshCw
} from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onApplyReflectionToForm?: (reflection: { outcomes: string; problems: string; solutions: string }) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onApplyReflectionToForm,
}) => {
  if (!isOpen) return null;

  const [activeTool, setActiveTool] = useState<'reflection' | 'remediation' | 'hook'>('reflection');

  // Tool 1 Inputs
  const [refSubject, setRefSubject] = useState(subjects[0]?.name || 'วิทยาศาสตร์พื้นฐาน 5');
  const [refGrade, setRefGrade] = useState(subjects[0]?.gradeLevel || 'ม.3');
  const [refTopic, setRefTopic] = useState('');
  const [refNotes, setRefNotes] = useState('');
  const [refResult, setRefResult] = useState<any>(null);

  // Tool 2 Inputs
  const [remSubject, setRemSubject] = useState(subjects[0]?.name || 'วิทยาศาสตร์พื้นฐาน 5');
  const [remProblem, setRemProblem] = useState('');
  const [remResult, setRemResult] = useState<any>(null);

  // Tool 3 Inputs
  const [hookSubject, setHookSubject] = useState(subjects[0]?.name || 'วิทยาศาสตร์พื้นฐาน 5');
  const [hookTopic, setHookTopic] = useState('');
  const [hookResult, setHookResult] = useState<any>(null);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // AI Connection Status
  const [apiStatus, setApiStatus] = useState<{
    configured?: boolean;
    status?: string;
    maskedKey?: string;
    model?: string;
    message?: string;
  } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const checkApiStatus = async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch('/api/ai/status');
      const data = await res.json();
      setApiStatus(data);
      if (data.configured && error?.includes('401')) {
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch AI status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkApiStatus();
    }
  }, [isOpen]);

  // Run Tool 1: Reflection
  const handleRunReflection = async () => {
    if (!refTopic.trim()) {
      alert('กรุณาระบุเรื่องที่สอนก่อนครับ');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/generate-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: refSubject,
          gradeLevel: refGrade,
          topic: refTopic,
          teachingMethod: 'Active Learning',
          rawNotes: refNotes || 'นักเรียนสนใจบทเรียน ทำงานกลุ่มได้ดี มีส่วนน้อยที่ยังสงสัยขั้นตอนคำนวณ',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'เกิดข้อผิดพลาดในการประมวลผล');
      setRefResult(data.reflection);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ AI ได้');
    } finally {
      setLoading(false);
    }
  };

  // Run Tool 2: Remediation
  const handleRunRemediation = async () => {
    if (!remProblem.trim()) {
      alert('กรุณาระบุปัญหาการเรียนรู้ของนักเรียนก่อนครับ');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/remediation-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: remSubject,
          gradeLevel: refGrade,
          problemDescription: remProblem,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'เกิดข้อผิดพลาด');
      setRemResult(data.plan);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ AI ได้');
    } finally {
      setLoading(false);
    }
  };

  // Run Tool 3: Lesson Hook
  const handleRunHook = async () => {
    if (!hookTopic.trim()) {
      alert('กรุณาระบุหัวข้อเรื่องก่อนครับ');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/lesson-hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: hookSubject,
          gradeLevel: refGrade,
          topic: hookTopic,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'เกิดข้อผิดพลาด');
      setHookResult(data.data);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ AI ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-5 flex items-center justify-between border-b border-indigo-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-500 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Sparkles className="w-5 h-5 text-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">สตูดิโอผู้ช่วย AI ครู (EduLog AI Pedagogy Studio)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                  Gemini Powered
                </span>
                {apiStatus && (
                  <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                    apiStatus.configured 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' 
                      : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${apiStatus.configured ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    <span>{apiStatus.configured ? 'AI พร้อมใช้งาน' : 'รอการตั้งค่า API Key'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200">
                เครื่องมือปัญญาประดิษฐ์ช่วยวิเคราะห์ผลการเรียน เขียนบันทึกหลังสอน และออกแบบกิจกรรม Active Learning
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tool Switcher Tabs */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex space-x-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTool('reflection')}
            className={`px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTool === 'reflection'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>1. ร่างบันทึกหลังสอน (Reflection)</span>
          </button>

          <button
            onClick={() => setActiveTool('remediation')}
            className={`px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTool === 'remediation'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-indigo-600" />
            <span>2. แผนซ่อมเสริม & เกมการเรียนรู้</span>
          </button>

          <button
            onClick={() => setActiveTool('hook')}
            className={`px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTool === 'hook'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-purple-600" />
            <span>3. ไอเดีย นำเข้าสู่บทเรียน (Warm-up)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm text-slate-800">
          
          {/* Error & Diagnostic Banner */}
          {error && (
            error.includes('401') || error.includes('Unauthorized') || error.includes('API Key') ? (
              <div className="p-4 sm:p-5 bg-gradient-to-br from-rose-50 via-amber-50/40 to-slate-50 border border-rose-200 rounded-2xl space-y-3.5 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                      <KeyRound className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-rose-900 text-sm">
                        เกิดข้อผิดพลาด 401 Unauthorized (การยืนยันตัวตน API Key)
                      </h4>
                      <p className="text-xs text-rose-700/90 mt-0.5 leading-relaxed">
                        ระบบไม่สามารถเรียกใช้งาน Gemini API ได้ เนื่องจาก API Key ไม่ถูกต้อง หมดอายุ หรือยังไม่ได้ตั้งค่าใน Secrets
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                    title="ปิดการแจ้งเตือน"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-white/90 p-3.5 rounded-xl border border-rose-100 text-xs text-slate-700 space-y-2">
                  <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                    <span>ขั้นตอนการตั้งค่า API Key เพื่อเปิดใช้งานระบบ:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 leading-relaxed">
                    <li>เปิดเมนู <strong className="text-slate-900 font-semibold">Settings (การตั้งค่า) &gt; Secrets</strong> ในหน้าต่าง AI Studio</li>
                    <li>ตรวจสอบหรือเพิ่ม Secret ชื่อ <code className="px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-mono text-[11px] font-bold">GEMINI_API_KEY</code></li>
                    <li>ใส่ค่า Google Gemini API Key ที่ได้จาก Google AI Studio (เริ่มต้นด้วย <code className="text-slate-800 font-mono">AIzaSy...</code>)</li>
                    <li>บันทึก Secret จากนั้นคลิกปุ่ม <strong>"ตรวจสอบการเชื่อมต่อ API อีกครั้ง"</strong> ด้านล่างนี้</li>
                  </ol>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={checkApiStatus}
                    disabled={checkingStatus}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? 'animate-spin' : ''}`} />
                    <span>{checkingStatus ? 'กำลังตรวจสอบ...' : 'ตรวจสอบการเชื่อมต่อ API อีกครั้ง'}</span>
                  </button>

                  {apiStatus?.maskedKey && (
                    <span className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                      คีย์ที่ตรวจพบ: {apiStatus.maskedKey}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 ml-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )
          )}

          {/* TOOL 1: REFLECTION */}
          {activeTool === 'reflection' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">รายวิชา</label>
                  <select
                    value={refSubject}
                    onChange={(e) => setRefSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เรื่องที่สอน</label>
                  <input
                    type="text"
                    placeholder="เช่น การสังเคราะห์ด้วยแสง"
                    value={refTopic}
                    onChange={(e) => setRefTopic(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleRunReflection}
                    disabled={loading}
                    className="w-full py-2 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>กำลังประมวลผล...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>สร้างบันทึกหลังสอน</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  โน้ตสั้นๆ บรรยากาศการเรียนในห้อง (Optional):
                </label>
                <textarea
                  rows={2}
                  placeholder="เช่น นักเรียนสนุกกับการทดลอง แต่ละกลุ่มใช้สารเคมีตรงตามขั้นตอน แต่มี 2 กลุ่มทำน้ำหกเลอะเทอะนิดหน่อย"
                  value={refNotes}
                  onChange={(e) => setRefNotes(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-slate-50/50"
                />
              </div>

              {/* Output */}
              {refResult && (
                <div className="bg-indigo-50/60 p-5 rounded-2xl border border-indigo-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                    <h4 className="font-bold text-indigo-900 text-sm flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>ผลลัพธ์บันทึกหลังสอนจาก AI</span>
                    </h4>

                    <button
                      onClick={() => handleCopyText(`${refResult.outcomes}\n\n${refResult.problems}\n\n${refResult.solutions}`)}
                      className="text-xs text-indigo-700 hover:underline flex items-center space-x-1 font-semibold"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความทั้งหมด'}</span>
                    </button>
                  </div>

                  <div className="space-y-3 text-xs text-slate-800">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-emerald-800">1. ผลการจัดการเรียนรู้:</span>
                      <p className="leading-relaxed">{refResult.outcomes}</p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-rose-800">2. ปัญหา / อุปสรรค:</span>
                      <p className="leading-relaxed">{refResult.problems}</p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-indigo-800">3. ข้อเสนอแนะ / แนวทางการแก้ไข:</span>
                      <p className="leading-relaxed">{refResult.solutions}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TOOL 2: REMEDIATION */}
          {activeTool === 'remediation' && (
            <div className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">รายวิชา</label>
                    <select
                      value={remSubject}
                      onChange={(e) => setRemSubject(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.name}>{s.code} - {s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ปัญหาที่พบในชั้นเรียน</label>
                    <input
                      type="text"
                      placeholder="เช่น นักเรียนอ่านกราฟและแปลความหมายไม่ได้"
                      value={remProblem}
                      onChange={(e) => setRemProblem(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRunRemediation}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                  <span>วิเคราะห์และค้นหาเทคนิค Active Learning ซ่อมเสริม</span>
                </button>
              </div>

              {remResult && (
                <div className="bg-indigo-50/60 p-5 rounded-2xl border border-indigo-200 space-y-4">
                  <div className="p-3 bg-white rounded-xl border border-indigo-100">
                    <span className="font-bold text-indigo-900 block text-xs">สรุปสาเหตุของปัญหา:</span>
                    <p className="text-xs text-slate-700 mt-1">{remResult.summaryAnalysis}</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                      แนวทางการจัดกิจกรรมซ่อมเสริม 3 รูปแบบ:
                    </h4>

                    {remResult.strategies?.map((st: any, i: number) => (
                      <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-700 text-sm">{i + 1}. {st.title}</span>
                          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold text-[10px]">
                            {st.type}
                          </span>
                        </div>
                        <p className="text-slate-700"><strong>ขั้นตอน:</strong> {st.steps}</p>
                        <p className="text-emerald-700"><strong>ผลลัพธ์ที่คาดหวัง:</strong> {st.expectedOutcome}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TOOL 3: LESSON HOOK */}
          {activeTool === 'hook' && (
            <div className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">รายวิชา</label>
                    <select
                      value={hookSubject}
                      onChange={(e) => setHookSubject(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.name}>{s.code} - {s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">หัวข้อบทเรียน</label>
                    <input
                      type="text"
                      placeholder="เช่น ระบบหมุนเวียนเลือดมนุษย์"
                      value={hookTopic}
                      onChange={(e) => setHookTopic(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRunHook}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300" />}
                  <span>สร้างไอเดียกิจกรรม Warm-up นำเข้าสู่บทเรียน (5 นาที)</span>
                </button>
              </div>

              {hookResult && (
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    ไอเดียกิจกรรมนำเข้าสู่บทเรียน 3 รูปแบบ:
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {hookResult.hooks?.map((hk: any, i: number) => (
                      <div key={i} className="p-4 bg-white rounded-2xl border border-purple-200 shadow-xs space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-900">{hk.title}</span>
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-semibold">
                            {hk.duration}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{hk.description}</p>
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-900 font-semibold text-[11px]">
                          ❓ {hk.question}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
