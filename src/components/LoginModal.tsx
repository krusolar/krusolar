import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  BookOpen, 
  Sparkles, 
  Eye, 
  EyeOff, 
  KeyRound, 
  AlertCircle,
  GraduationCap
} from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      // Validate credentials
      if (username.trim() === 'solarnetwork' && password === 'solar01') {
        sessionStorage.setItem('krusolar_edulog_session', 'authenticated');
        sessionStorage.setItem('krusolar_edulog_user', 'solarnetwork');
        setIsLoading(false);
        onLoginSuccess();
      } else {
        setIsLoading(false);
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่อีกครั้ง');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Background Decorative Blur Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-blue-600 to-cyan-400 text-white shadow-xl shadow-indigo-500/25 ring-4 ring-indigo-500/20">
            <BookOpen className="w-7 h-7" />
          </div>

          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>ระบบลงชื่อเข้าใช้งาน</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Krusolar EduLog
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center justify-center space-x-1">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              <span>เว็บบันทึกหลังการสอน ครู ซอลาฮุดดิน แยะแย</span>
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-950/50 border border-rose-500/30 text-rose-300 rounded-2xl text-xs flex items-start space-x-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              ชื่อผู้ใช้ (Username)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="กรอกชื่อผู้ใช้งาน..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all duration-150 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <span>กำลังตรวจสอบข้อมูล...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>เข้าสู่ระบบ Krusolar EduLog</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-1 text-[11px] text-slate-500">
          © {new Date().getFullYear()} Krusolar EduLog • ระบบบันทึกหลังการสอนครู ซอลาฮุดดิน แยะแย
        </div>

      </div>
    </div>
  );
};
