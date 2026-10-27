import React, { useState, useEffect } from 'react';
import { 
  Presentation, 
  BookOpen, 
  Mic, 
  Printer, 
  ChevronRight, 
  ChevronLeft, 
  Maximize2, 
  Minimize2, 
  ShieldCheck, 
  BarChart3, 
  Award, 
  QrCode, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  Smartphone, 
  Laptop, 
  School, 
  Clock, 
  Lock, 
  RefreshCw, 
  KeyRound, 
  AlertTriangle,
  Lightbulb,
  Layers,
  ArrowRight,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { TeacherProfile } from '../types';

interface PresentationGuideModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  profile: TeacherProfile;
}

export const PresentationGuideModal: React.FC<PresentationGuideModalProps> = ({
  isOpen = true,
  onClose,
  profile,
}) => {
  const [activeTab, setActiveTab] = useState<'slides' | 'manual' | 'script'>('slides');
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isSlideFullscreen, setIsSlideFullscreen] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // Keyboard navigation for slides
  useEffect(() => {
    if (activeTab !== 'slides') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlideIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Escape' && isSlideFullscreen) {
        setIsSlideFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isSlideFullscreen]);

  // Slides data
  const slides = [
    {
      id: 1,
      badge: 'บทนำ & วิสัยทัศน์',
      title: 'Krusolar EduLog',
      subtitle: 'นวัตกรรมระบบสารสนเทศบริหารจัดการชั้นเรียน & วัดผลการเรียนรู้ยุคดิจิทัล',
      speakerTitle: 'สไลด์ที่ 1: แนะนำนวัตกรรม',
      speakerScript: `กราบเรียนท่านคณะกรรมการและท่านผู้บริหารทุกท่านครับ ผมขออนุญาตนำเสนอนวัตกรรม "Krusolar EduLog" ซึ่งเป็นแพลตฟอร์มสารสนเทศเพื่อการจัดการเรียนการสอนแบบองค์รวม ที่พัฒนาขึ้นเพื่อตอบโจทย์การทำงานจริงของครูไทย ลดภาระงานเอกสารซ้ำซ้อน และเชื่อมโยงตั้งแต่การเช็คชื่อเข้าเรียน การตัดเกรดอิงเกณฑ์ สพฐ. ไปจนถึงการจัดทำบันทึกหลังการสอนตามเกณฑ์ ว.PA ให้เสร็จสิ้นได้ในระบบเดียวครับ`,
      bullets: [
        'ออกแบบเพื่อครูไทย ยึดหลักเกณฑ์ สพฐ. และข้อตกลง ว.PA',
        'เชื่อมโยง 7 ระบบงานหลัก: แดชบอร์ดผลการเรียน, บันทึกการสอน, เช็คชื่อ QR, สมุดเกรด, รายชื่อนักเรียน, รายวิชา, และผู้ช่วย AI',
        'ทำงานบนระบบ Cloud Real-time พร้อมโหมด Offline-ready ปลอดภัย ข้อมูลไม่สูญหาย',
      ],
      icon: School,
      color: 'from-indigo-600 via-indigo-700 to-purple-800'
    },
    {
      id: 2,
      badge: 'ปัญหาเดิม (Pain Points)',
      title: 'ความท้าทายในห้องเรียนยุคปัจจุบัน',
      subtitle: 'ทำไมครูยุคดิจิทัลจึงต้องมีระบบบูรณาการนี้?',
      speakerTitle: 'สไลด์ที่ 2: ปัญหาเดิมและความต้องการของโรงเรียน',
      speakerScript: `ในห้องเรียนระดับมัธยมศึกษา โดยเฉพาะ ม.6 ที่นักเรียนมีสมาร์ทโฟน เราพบปัญหาคลาสสิก 3 ประการหลักครับ: ประการแรกคือ "การเช็คชื่อ" เสียเวลาต้นคาบกว่า 10 นาที และเมื่อใช้ QR Code มักเกิดปัญหา "สแกนแทนเพื่อนที่อยู่บ้าน" ประการที่สองคือ การตัดเกรดและการทำตารางคะแนน 70:30 ใน Excel ที่มักสูญหายหรือคำนวณผิดพลาด และประการสุดท้ายคือ ครูต้องมานั่งสรุปกราฟผลสัมฤทธิ์และพิมพ์เอกสารบันทึกหลังสอน ว.PA ทีหลัง ซึ่งกินเวลานอกเวลาสอนเป็นอย่างมากครับ`,
      bullets: [
        '❌ เช็คชื่อกระดาษกินเวลาคาบเรียน 10-15 นาที สถิติกระจัดกระจาย',
        '❌ การใช้ QR Code ทั่วไป มักถูกนักเรียนถ่ายรูปส่งไลน์ให้เพื่อนที่นอนอยู่บ้านแอบเช็คชื่อแทน',
        '❌ การคำนวณคะแนนเก็บ 70:30 ในกระดาษ เสี่ยงคำนวณผิด และไม่เห็นภาพรวมผลสัมฤทธิ์ทันที',
        '❌ ภาระการพิมพ์เอกสารราชการ ว.PA และสรุปสถิติผลการเรียนส่งวิชาการโรงเรียน',
      ],
      icon: AlertTriangle,
      color: 'from-rose-600 via-rose-700 to-amber-700'
    },
    {
      id: 3,
      badge: 'ระบบไฮไลต์ 1 (QR Smart Attendance)',
      title: 'ระบบเช็คชื่อ QR Code ป้องกันการสแกนแทนเพื่อน',
      subtitle: 'Anti-Proxy Buddy Punching Suite 5 ชั้นความปลอดภัย',
      speakerTitle: 'สไลด์ที่ 3: ระบบเช็คชื่อไฮเทค ป้องกันการโกง',
      speakerScript: `ไฮไลต์สำคัญประการแรกคือระบบเช็คชื่อด้วยสมาร์ทโฟน ซึ่งเราได้พัฒนาเกราะป้องกันการสแกนแทนกันถึง 5 ชั้น: 1) Dynamic Rolling QR เปลี่ยนรหัสสดทุก 20 วินาที ป้องกันการถ่ายรูปส่ง LINE ให้เพื่อนที่บ้าน 2) Single-Device Lockdown ล็อก 1 เครื่องต่อ 1 คน ป้องกันเพื่อนในห้องกดวน 3) Classroom PIN 4 หลักบนจอโปรเจกเตอร์ 4) Duplicate Device Alert แจ้งเตือนเครื่องซ้ำบนจอครู และ 5) Headcount Cross-Check นำยอดคนจริงในห้องเทียบกับในระบบทันทีครับ`,
      bullets: [
        '🛡️ Dynamic Rolling QR: รหัส QR หมุนเวียนเปลี่ยนอัตโนมัติทุก 20 วินาที หากส่งต่อภาพจะหมดอายุทันที',
        '📱 Single-Device Lockdown: ล็อกรหัสประจำเครื่อง 1 สมาร์ทโฟน ต่อ 1 นักเรียน บล็อกการเช็คชื่อวนแทนเพื่อน',
        '🔑 Classroom 4-Digit PIN: รหัสลับ 4 หลักฉายหน้าห้องเฉพาะคนที่อยู่ในห้องจริงเท่านั้นที่รู้',
        '🚨 Real-Time Duplicate Alert: แจ้งเตือนแถบสีแดงบนจอครูทันทีหากมีอุปกรณ์เครื่องเดียวกันเช็คหลายคน',
        '👥 Fast Headcount Match: ครูพิมพ์ยอดคนจริงในห้อง ระบบเทียบยอดสแกนเพื่อตรวจจับการแอบสแกนแทน',
      ],
      icon: ShieldCheck,
      color: 'from-emerald-600 via-teal-700 to-cyan-800'
    },
    {
      id: 4,
      badge: 'ระบบไฮไลต์ 2 (Grade Distribution)',
      title: 'แดชบอร์ดสรุปผลการเรียนเฉลี่ย & การกระจายเกรด',
      subtitle: 'Recharts Interactive Analytics เจาะลึกรายบุคคลและรายห้อง',
      speakerTitle: 'สไลด์ที่ 4: การวิเคราะห์ผลสัมฤทธิ์ทางการเรียน',
      speakerScript: `ในส่วนของการวัดผล เราได้นำเทคโนโลยี Recharts มาสร้างแดชบอร์ดวิเคราะห์ผลสัมฤทธิ์ โดยแสดงกราฟแท่งแจกแจงเกรด 0 ถึง 4 ของนักเรียนทุกคนในห้อง และพิเศษที่สุดคือ "เมื่อคลิกหรือมองที่แท่งเกรด จะแสดงรายชื่อและเลขที่ของนักเรียนทุกคนที่ได้เกรดนั้นทันที" ทำให้ครูผู้สอนเห็นภาพชัดเจนว่าเด็กกลุ่มใดต้องการการสอนซ่อมเสริม หรือกลุ่มใดพร้อมสำหรับการส่งเสริมความเป็นเลิศครับ`,
      bullets: [
        '📊 แผนภูมิแท่ง Grade Distribution: เห็นสัดส่วนเกรด 4, 3.5, 3, 2.5, 2, 1.5, 1, 0 ได้ชัดเจนในพริบตา',
        '👤 แสดงรายชื่อนักเรียนในแต่ละแท่งเกรด: ระบุชื่อ-นามสกุล เลขที่ คะแนนรวมของนักเรียนแต่ละคน',
        '📈 สรุปสถิติวิชาการ: ค่าเฉลี่ยห้อง (GPAX), มัธยฐาน, คะแนนสูงสุด-ต่ำสุด และสัดส่วนเกรด 3-4 (ดีเยี่ยม)',
        '🎯 สนับสนุนการสอนซ่อมเสริม (RTI): คัดกรองนักเรียนกลุ่มเสี่ยง (เกรด 0, 1, 1.5) เพื่อช่วยเหลือได้ตรงจุด',
      ],
      icon: BarChart3,
      color: 'from-blue-600 via-indigo-700 to-sky-800'
    },
    {
      id: 5,
      badge: 'ระบบไฮไลต์ 3 (Standard Gradebook)',
      title: 'สมุดบันทึกคะแนนอิงเกณฑ์ สพฐ. 70:30',
      subtitle: 'ตัดเกรดอัตโนมัติ รองรับทั้งมัธยมศึกษาและประถมศึกษา',
      speakerTitle: 'สไลด์ที่ 5: สมุดคะแนนมาตรฐานและการตัดเกรด',
      speakerScript: `ระบบสมุดบันทึกคะแนนถูกสร้างขึ้นตรงตามระเบียบการวัดและประเมินผลของกระทรวงศึกษาธิการ โดยกำหนดสัดส่วนคะแนนเก็บต่องานสอบ 70:30 (คะแนนเก็บ 70, สอบกลางภาค 15, ปลายภาค 15) ครูสามารถเพิ่มช่องชิ้นงาน กำหนดคะแนนเต็ม และกรอกคะแนนได้อย่างรวดเร็ว ระบบจะทำการตัดเกรด 8 ระดับ (0 - 4) พร้อมสรุปผลการผ่านเกณฑ์ และส่งออกเป็นไฟล์ Excel ได้ในคลิกเดียวครับ`,
      bullets: [
        '⚖️ สัดส่วนมาตรฐาน สพฐ. 70:30: คำนวณน้ำหนักคะแนนเก็บและสอบให้อัตโนมัติอย่างแม่นยำ 100%',
        '⚡ ตัดเกรดอัตโนมัติ 8 ระดับ: เกรด 4 (80+), 3.5 (75-79), 3 (70-74), 2.5, 2, 1.5, 1 และ 0',
        '📋 นำเข้ารายชื่อนักเรียนแบบ Batch: ก๊อปปี้วางจาก Excel ครั้งเดียวได้ทั้งห้อง ไม่ต้องพิมพ์ทีละคน',
        '📥 ส่งออกไฟล์ Excel/CSV: พร้อมนำไปจัดทำเอกสาร ปพ.5 ส่งฝ่ายวิชาการได้ทันที',
      ],
      icon: Award,
      color: 'from-amber-600 via-orange-700 to-yellow-800'
    },
    {
      id: 6,
      badge: 'ระบบไฮไลต์ 4 (ว.PA & AI Assistant)',
      title: 'บันทึกหลังการสอน ว.PA & ผู้ช่วยครู AI',
      subtitle: 'พิมพ์แบบฟอร์มทางการราชการ A4 และสตูดิโอผู้ช่วยเขียนแผน',
      speakerTitle: 'สไลด์ที่ 6: การตอบโจทย์เกณฑ์ ว.PA และผู้ช่วย AI',
      speakerScript: `ในด้านการประเมินวิทยฐานะ ว.PA ระบบมีแบบบันทึกหลังสอนที่ตรงตาม 3 องค์ประกอบหลัก ได้แก่ ผลการจัดการเรียนรู้, ปัญหา/อุปสรรค, และข้อเสนอแนะ/แนวทางแก้ไข พร้อมระบบแนบรูปถ่ายกิจกรรม และสั่งพิมพ์ออกเป็นเอกสารราชการขนาด A4 ที่สมบูรณ์แบบ นอกจากนี้ยังมี "สตูดิโอผู้ช่วย AI ครู" ที่ช่วยคิดวัตถุประสงค์เชิงพฤติกรรม ออกแบบกิจกรรม Active Learning และเกณฑ์รูบริกส์ได้อย่างชาญฉลาดครับ`,
      bullets: [
        '📝 แบบฟอร์มบันทึกหลังสอนมาตรฐาน ว.PA: ครอบคลุมผลการเรียนรู้ ปัญหา และแนวทางแก้ไข',
        '🖨️ ระบบพิมพ์เอกสารราชการ A4 (Official Print Preview): จัดหน้าสวยงาม พร้อมลงนามครูและผู้บริหาร',
        '🤖 ผู้ช่วย AI ครู (AI Teaching Studio): ช่วยเขียนแผนการสอน วัตถุประสงค์ และเกณฑ์การประเมิน',
        '📷 คลังรูปภาพหลักฐานการสอน: บันทึกภาพกิจกรรมในคาบเรียนเพื่อประกอบการประเมินวิทยฐานะ',
      ],
      icon: Sparkles,
      color: 'from-purple-600 via-pink-700 to-indigo-800'
    },
    {
      id: 7,
      badge: 'สรุปผลสัมฤทธิ์ (Impact & Conclusion)',
      title: 'ผลลัพธ์และคุณค่าที่โรงเรียนได้รับ',
      subtitle: 'เปลี่ยนห้องเรียนสู่ Digital Classroom ที่มีประสิทธิภาพสูงสุด',
      speakerTitle: 'สไลด์ที่ 7: สรุปผลประโยชน์ที่โรงเรียนจะได้รับ',
      speakerScript: `สรุปคุณค่าที่เกิดขึ้นจากการนำ Krusolar EduLog มาใช้งาน: ครูประหยัดเวลาการทำเอกสารและเช็คชื่อไปมากกว่าร้อยละ 70, นักเรียนมีความรับผิดชอบต่อเวลาและเกิดความโปร่งใส ปราศจากการสแกนแทนกัน, ฝ่ายบริหารและผู้ปกครองได้รับข้อมูลสารสนเทศที่รวดเร็ว แม่นยำ และพร้อมรับการประเมินคุณภาพภายนอกและวิทยฐานะ ว.PA ตลอดเวลาครับ`,
      bullets: [
        '⏱️ ประหยัดเวลาทำงานครูกว่า 70%: ลดการทำงานเอกสารซ้ำซ้อน มีเวลาพัฒนาผู้เรียนมากขึ้น',
        '💯 ความถูกต้องโปร่งใส 100%: ระบบป้องกันสแกนแทนเพื่อน ปลูกฝังวินัยและความซื่อสัตย์ให้นักเรียน',
        '📱 ใช้งานได้ทุกอุปกรณ์ (Cross-Platform): รองรับคอมพิวเตอร์ แท็บเล็ต และสมาร์ทโฟนครูและนักเรียน',
        '🌟 ยกระดับโรงเรียนสู่ Smart Digital School: สอดรับนโยบายกระทรวงศึกษาธิการและการศึกษา 4.0',
      ],
      icon: CheckCircle2,
      color: 'from-teal-600 via-emerald-700 to-blue-800'
    }
  ];

  const currentSlide = slides[currentSlideIndex];

  const copyScriptHandler = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[85vh] text-slate-100">
      
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-900 px-6 py-4 border-b border-indigo-700/40 flex flex-wrap items-center justify-between gap-3 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center text-amber-300 shadow-inner">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                PRESENTATION & GUIDE
              </span>
              <span className="text-xs text-indigo-200">
                {profile.schoolName || 'โรงเรียนสาธิตวิทยาการ'}
              </span>
            </div>
            <h2 className="text-lg font-black tracking-tight mt-0.5">
              คู่มือการใช้งาน & สไลด์นำเสนอผลงาน (Pitch Deck)
            </h2>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('slides')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'slides'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Presentation className="w-4 h-4" />
            <span>สไลด์นำเสนอ ({slides.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>คู่มือการใช้งานระบบ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('script')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'script'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>สคริปต์บทพูดนำเสนอ</span>
          </button>
        </div>

        {/* Print / Close */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์คู่มือ / สไลด์</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Body Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">

        {/* ============================================================== */}
        {/* TAB 1: INTERACTIVE PITCH DECK SLIDES                           */}
        {/* ============================================================== */}
        {activeTab === 'slides' && (
          <div className="max-w-5xl mx-auto space-y-5">
            
            {/* The Slide Viewport */}
            <div className={`relative rounded-3xl overflow-hidden shadow-2xl border border-slate-700 bg-gradient-to-br ${currentSlide.color} transition-all duration-500 p-6 sm:p-10 flex flex-col justify-between ${
              isSlideFullscreen ? 'min-h-[75vh]' : 'min-h-[460px]'
            }`}>
              
              {/* Background ambient pattern */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

              {/* Slide Top Indicator */}
              <div className="flex items-center justify-between text-white relative z-10">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/20">
                    {currentSlide.badge}
                  </span>
                  <span className="text-xs text-white/70">
                    Krusolar EduLog Slide Deck
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-bold bg-black/30 px-3 py-1 rounded-full text-white/90">
                    สไลด์ {currentSlideIndex + 1} / {slides.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSlideFullscreen(!isSlideFullscreen)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    title={isSlideFullscreen ? 'ย่อขนาด' : 'ขยายเต็มจอ'}
                  >
                    {isSlideFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Slide Center Hero Content */}
              <div className="my-6 relative z-10 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-amber-300 shadow-xl">
                    <currentSlide.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                      {currentSlide.title}
                    </h1>
                    <p className="text-sm sm:text-lg text-white/90 font-medium mt-0.5">
                      {currentSlide.subtitle}
                    </p>
                  </div>
                </div>

                {/* Bullet Points Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                  {currentSlide.bullets.map((b, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-2xl bg-black/30 backdrop-blur-md border border-white/15 text-white/95 text-xs sm:text-sm font-medium leading-relaxed flex items-start space-x-2.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slide Footer */}
              <div className="pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/70 relative z-10">
                <div className="flex items-center space-x-2">
                  <span>ผู้นำเสนอ: <strong className="text-white">{profile.name}</strong></span>
                  <span>•</span>
                  <span>{profile.position} ({profile.schoolName})</span>
                </div>
                <div className="hidden sm:block text-[11px] text-white/60">
                  ใช้ปุ่มลูกศร ◀ ▶ หรือแป้น Spacebar ในการเปลี่ยนสไลด์
                </div>
              </div>

            </div>

            {/* Slide Navigation Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentSlideIndex === 0}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>สไลด์ก่อนหน้า</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors shadow-md"
                >
                  <span>สไลด์ถัดไป</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Slide Dots */}
              <div className="flex items-center space-x-1.5">
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`h-2.5 rounded-full transition-all cursor-pointer ${
                      currentSlideIndex === idx
                        ? 'w-8 bg-amber-400'
                        : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                    }`}
                    title={`ไปยังสไลด์ที่ ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="text-xs text-slate-400 font-mono">
                {currentSlideIndex + 1} of {slides.length}
              </div>
            </div>

            {/* Presenter Speaker Notes Drawer */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mic className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-xs text-amber-300 uppercase tracking-wider">
                    สคริปต์บทพูดของผู้นำเสนอ (Speaker Notes ประจำสไลด์นี้)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyScriptHandler(currentSlide.speakerScript)}
                  className="text-xs text-indigo-300 hover:text-white flex items-center space-x-1 cursor-pointer"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'คัดลอกบทพูดแล้ว' : 'คัดลอกบทพูด'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                "{currentSlide.speakerScript}"
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: DETAILED STEP-BY-STEP USER MANUAL                       */}
        {/* ============================================================== */}
        {activeTab === 'manual' && (
          <div className="max-w-5xl mx-auto space-y-6">
            
            <div className="text-center space-y-1 mb-6">
              <h2 className="text-2xl font-black text-white">
                คู่มือการใช้งานระบบ Krusolar EduLog อย่างละเอียด (User Manual)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                คู่มือมาตรฐานสำหรับครูผู้สอน หัวหน้ากลุ่มสาระ และฝ่ายวิชาการโรงเรียน
              </p>
            </div>

            {/* Module 1: QR Attendance with Anti-Proxy */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    โมดูลที่ 1: ระบบเช็คชื่อเข้าเรียนด้วยสมาร์ทโฟน & ป้องกันการสแกนแทนเพื่อน
                  </h3>
                  <p className="text-xs text-slate-400">
                    Smart QR Code Attendance with Anti-Proxy Suite
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="space-y-2.5">
                  <h4 className="font-bold text-amber-300">ขั้นตอนการใช้งานของครู (ฉายขึ้นจอโปรเจกเตอร์):</h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                    <li>เข้าเมนู <strong>"เช็คชื่อ & สแกน QR"</strong> บนแถบเมนูด้านซ้าย</li>
                    <li>เลือกรายวิชาและห้องเรียนที่ต้องการ (เช่น ม.6/1)</li>
                    <li>กดปุ่ม <strong>"สแกน QR Code"</strong> เพื่อเปิดหน้าจอโปรเจกเตอร์เต็มจอ</li>
                    <li>
                      ระบบเปิดระบบ <strong>Dynamic Rolling QR</strong> และ <strong>ล็อก 1 เครื่อง/1 คน</strong> โดยอัตโนมัติ
                    </li>
                    <li>(ทางเลือก) สามารถกด <strong>"ความปลอดภัย & ป้องกันแอบสแกน"</strong> เพื่อเปิดรหัส PIN 4 หลัก หรือตรวจนับยอดคนจริงในห้อง</li>
                  </ol>
                </div>

                <div className="space-y-2.5">
                  <h4 className="font-bold text-sky-300">ขั้นตอนของนักเรียน (บนสมาร์ทโฟน):</h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                    <li>เปิดกล้องมือถือ หรือแอป LINE สแกน QR Code บนจอโปรเจกเตอร์</li>
                    <li>ระบบจะพาเข้าสู่หน้าเช็คชื่อของห้องเรียนนั้นโดยตรง</li>
                    <li>เลือกชื่อตนเอง (หรือพิมพ์ค้นหาด้วยเลขที่/ชื่อ)</li>
                    <li>(หากครูเปิด PIN) กรอกรหัส 4 หลักที่แสดงบนจอหน้าห้อง</li>
                    <li>กดปุ่ม <strong>"ยืนยันการเช็คชื่อเข้าเรียนทันที"</strong> ข้อมูลจะเด้งบนจอครูแบบเรียลไทม์ พร้อมจำลองบัตรเข้าเรียนดิจิทัล</li>
                  </ol>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-200">
                💡 <strong>ระบบป้องกันการโกง:</strong> หากนักเรียนถ่ายรูปจอส่งไลน์ให้เพื่อนที่บ้าน เมื่อเพื่อนเปิดสแกน โค้ดจะหมดอายุภายใน 20 วินาที และหากเพื่อนในห้องพยายามใช้เครื่องเดียวกดเช็คให้คนอื่น ระบบจะบล็อกด้วย Device ID ล็อกทันที
              </div>
            </div>

            {/* Module 2: Grade Distribution & Recharts */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    โมดูลที่ 2: แดชบอร์ดสรุปผลการเรียนเฉลี่ยรายวิชา (Grade Distribution)
                  </h3>
                  <p className="text-xs text-slate-400">
                    กราฟวิเคราะห์การกระจายเกรด พร้อมแสดงรายชื่อนักเรียนในแต่ละระดับ
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <p>
                  1. เข้าสู่หน้า <strong>"ภาพรวมการสอน (Dashboard)"</strong> เลื่อนลงมาที่ส่วน <strong>"การกระจายผลการเรียนเฉลี่ยรายวิชา (Grade Distribution)"</strong>
                </p>
                <p>
                  2. เลือก <strong>"รายวิชา"</strong> และ <strong>"ห้องเรียน"</strong> จากตัวกรองด้านบน
                </p>
                <p>
                  3. กราฟแท่งจะแจกแจงจำนวนนักเรียนในแต่ละระดับเกรด (เกรด 4 ถึงเกรด 0) อย่างชัดเจน
                </p>
                <p>
                  4. <strong>ฟังก์ชันพิเศษ:</strong> ด้านล่างกราฟจะแจกแจงกล่องสีแสดงรายชื่อนักเรียนทุกคนที่ได้เกรดนั้นๆ อย่างชัดเจน เช่น คลิกดูว่ามีใครบ้างที่ได้เกรด 4 (กลุ่มเป็นเลิศ) หรือใครบ้างที่ได้เกรด 0, 1 (กลุ่มต้องซ่อมเสริม)
                </p>
              </div>
            </div>

            {/* Module 3: Gradebook 70:30 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    โมดูลที่ 3: สมุดบันทึกคะแนนและตัดเกรดอิงเกณฑ์ สพฐ. 70:30
                  </h3>
                  <p className="text-xs text-slate-400">
                    Standard Gradebook & Automatic Grade Calculation
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <p>
                  1. เข้าเมนู <strong>"สมุดบันทึกคะแนน & ตัดเกรด"</strong>
                </p>
                <p>
                  2. ระบบตั้งค่าน้ำหนักคะแนนตามเกณฑ์ สพฐ. มัธยมศึกษา <strong>70:30</strong> (คะแนนเก็บ 70 คะแนน + สอบกลางภาค 15 + สอบปลายภาค 15 รวม 100 คะแนน)
                </p>
                <p>
                  3. สามารถกด <strong>"+ เพิ่มช่องงาน/ชิ้นงาน"</strong> เพื่อระบุชื่องานและคะแนนเต็ม
                </p>
                <p>
                  4. กรอกคะแนนในตาราง ระบบจะคำนวณคะแนนรวมและตัดเกรด 0, 1, 1.5, 2, 2.5, 3, 3.5, 4 ให้อัตโนมัติทันที
                </p>
                <p>
                  5. กดปุ่ม <strong>"ส่งออก Excel / CSV"</strong> เพื่อนำไฟล์ไปใช้งานต่อกับระบบสารสนเทศของโรงเรียน
                </p>
              </div>
            </div>

            {/* Module 4: ว.PA & AI Assistant */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    โมดูลที่ 4: บันทึกหลังการสอน ว.PA & สตูดิโอผู้ช่วย AI ครู
                  </h3>
                  <p className="text-xs text-slate-400">
                    Official PA Log & Gemini AI Educational Assistant
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <p>
                  1. เข้าเมนู <strong>"บันทึกการสอน (Lesson Logs)"</strong> เพื่อสร้างบันทึกหลังสอนในแต่ละคาบ
                </p>
                <p>
                  2. กรอกผลการจัดการเรียนรู้ ปัญหา/อุปสรรค และข้อเสนอแนะ พร้อมแนบรูปถ่ายหลักฐานการจัดการเรียนรู้
                </p>
                <p>
                  3. กดปุ่ม <strong>"พิมพ์รายงานเป็นทางการ (A4)"</strong> เพื่อพิมพ์เอกสารราชการที่จัดรูปแบบสวยงาม มีที่สำหรับลงชื่อครูผู้สอนและหัวหน้าฝ่ายวิชาการ
                </p>
                <p>
                  4. คลิกปุ่ม <strong>"ผู้ช่วย AI ครู"</strong> ที่แถบหัวเรื่อง เพื่อขอไอเดียกิจกรรม Active Learning, วัตถุประสงค์เชิงพฤติกรรม, หรือข้อสอบวัดระดับผลการเรียนรู้ได้ตลอดเวลา
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: COMPLETE PITCH SCRIPT FOR PRESENTING                    */}
        {/* ============================================================== */}
        {activeTab === 'script' && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            <div className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-700/40 p-5 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-lg text-white">
                  สคริปต์บทพูดนำเสนออย่างเป็นทางการ (Official Presentation Script)
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  ความยาวประมาณ 5-7 นาที เหมาะสำหรับนำเสนอต่อผู้อำนวยการ, ศึกษานิเทศก์ หรือกรรมการประเมิน ว.PA
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const fullScript = `กราบเรียนท่านประธาน ท่านคณะกรรมการ และผู้มีเกียรติทุกท่านครับ...`;
                  copyScriptHandler(fullScript);
                }}
                className="shrink-0 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white flex items-center space-x-1.5 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>คัดลอกทั้งบท</span>
              </button>
            </div>

            {/* Script Breakdown */}
            <div className="space-y-4 text-xs sm:text-sm">
              
              {/* Part 1 */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-amber-400 font-bold">
                  <span>ช่วงที่ 1: การเปิดบทนำและกล่าวถึงปัญหา (นาทีที่ 0:00 - 1:30)</span>
                  <span className="text-[11px] text-slate-500 font-mono">1.5 นาที</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl text-slate-200 leading-relaxed font-serif text-[13px]">
                  "กราบเรียนท่านคณะกรรมการและท่านผู้บริหารทุกท่านครับ ผม <strong>{profile.name}</strong> ตำแหน่ง {profile.position} {profile.schoolName} วันนี้มีความภาคภูมิใจเป็นอย่างยิ่งที่จะขอนำเสนอแพลตฟอร์ม <strong>Krusolar EduLog</strong><br/><br/>
                  ในยุคการศึกษา 4.0 ครูเราเผชิญปัญหาหลักคือ ภาระงานเอกสารซ้ำซ้อน ทั้งการเช็คชื่อเข้าเรียนที่กินเวลาคาบละ 10 นาที การบันทึกคะแนนในสมุด ปพ.5 ที่มักคำนวณผิดพลาด และการรวบรวมหลักฐาน ว.PA ส่งฝ่ายวิชาการ เราจึงได้พัฒนาระบบนี้ขึ้นมาเพื่อแก้ปัญหาดังกล่าวแบบครบวงจรในที่เดียวครับ"
                </div>
              </div>

              {/* Part 2 */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>ช่วงที่ 2: ไฮไลต์การเช็คชื่อ QR Code และระบบป้องกันโกง (นาทีที่ 1:30 - 3:30)</span>
                  <span className="text-[11px] text-slate-500 font-mono">2.0 นาที</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl text-slate-200 leading-relaxed font-serif text-[13px]">
                  "จุดเด่นชิ้นแรกที่แก้ปัญหาในชั้น ม.6 ได้อย่างตรงจุด คือ <strong>Smart QR Attendance พร้อมระบบ Anti-Proxy ป้องกันการเช็คชื่อแทนเพื่อน 5 ชั้น</strong> ครับ<br/><br/>
                  เมื่อครูเปิดจอโปรเจกเตอร์ QR Code จะเป็นรหัสสดหมุนเวียน (Dynamic Rolling QR) เปลี่ยนทุก 20 วินาที หากเด็กในห้องถ่ายรูปส่ง LINE ไปให้เพื่อนที่นอนอยู่บ้าน เมื่อเพื่อนเปิดกล้องสแกน โค้ดจะหมดอายุทันที และยังมีระบบล็อก 1 เครื่องต่อ 1 คน ป้องกันเพื่อนในห้องใช้มือถือกดเช็ควนแทนกัน พร้อมรหัส PIN 4 หลักหน้าห้อง และตัวตรวจจับยอดคนจริงในห้อง ทำให้การเช็คชื่อโปร่งใส 100% และเสร็จสิ้นภายใน 2 นาทีแรกของคาบครับ"
                </div>
              </div>

              {/* Part 3 */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-sky-400 font-bold">
                  <span>ช่วงที่ 3: แดชบอร์ดผลการเรียน Recharts และสมุดตัดเกรด 70:30 (นาทีที่ 3:30 - 5:00)</span>
                  <span className="text-[11px] text-slate-500 font-mono">1.5 นาที</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl text-slate-200 leading-relaxed font-serif text-[13px]">
                  "จุดเด่นที่สอง คือ <strong>แดชบอร์ด Grade Distribution</strong> ที่วิเคราะห์ผลสัมฤทธิ์ทางการเรียนออกมาเป็นแผนภูมิแท่งแจกแจงเกรด 0 ถึงเกรด 4 แบบอินเทอร์แอคทีฟ เมื่อดูที่แท่งเกรด จะระบุชื่อนักเรียนทุกคนที่ได้เกรดนั้นทันที ทำให้ครูจำแนกกลุ่มเด็กเก่งเพื่อต่อยอด และคัดกรองเด็กกลุ่มเสี่ยงเพื่อสอนซ่อมเสริมได้อย่างทันท่วงที<br/><br/>
                  โดยทำงานร่วมกับสมุดบันทึกคะแนนอิงเกณฑ์ สพฐ. 70:30 ที่ตัดเกรดอัตโนมัติ และส่งออกเป็น Excel ได้ทันทีครับ"
                </div>
              </div>

              {/* Part 4 */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-purple-400 font-bold">
                  <span>ช่วงที่ 4: การสรุปประโยชน์และตอบข้อซักถาม (นาทีที่ 5:00 - 6:00)</span>
                  <span className="text-[11px] text-slate-500 font-mono">1.0 นาที</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl text-slate-200 leading-relaxed font-serif text-[13px]">
                  "สุดท้ายนี้ Krusolar EduLog ช่วยลดเวลาทำงานเอกสารของครูลงกว่า 70% เชื่อมโยงไปสู่รายงานราชการ ว.PA ขนาด A4 และมีผู้ช่วย AI ครูคอยสนับสนุน การนำระบบนี้มาใช้จึงไม่เพียงแต่ช่วยเพิ่มประสิทธิภาพการทำงานของครู แต่ยังส่งผลโดยตรงต่อคุณภาพการเรียนรู้ของผู้เรียนตามเป้าหมายของโรงเรียนครับ ผมขอขอบพระคุณคณะกรรมการทุกท่าน และยินดีตอบข้อซักถามครับ"
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Footer bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <School className="w-4 h-4 text-indigo-400" />
          <span>Krusolar EduLog • ระบบบริหารจัดการชั้นเรียนระดับมืออาชีพ</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-slate-500">ปรับปรุงล่าสุด: 2026</span>
          <button
            type="button"
            onClick={() => setActiveTab('slides')}
            className="text-amber-400 hover:underline cursor-pointer font-bold"
          >
            เปิดโหมดสไลด์นำเสนอ
          </button>
        </div>
      </div>

    </div>
  );
};
