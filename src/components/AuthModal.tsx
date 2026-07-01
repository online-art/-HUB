import React, { useState } from "react";
import { AlertCircle, X, ShieldCheck } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleLogin: () => Promise<void>;
}

export default function AuthModal({ isOpen, onClose, onGoogleLogin }: AuthModalProps) {
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-100 transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-brand-primary font-semibold text-xs tracking-wider uppercase bg-blue-50 px-2.5 py-1 rounded-full">
              Authentication
            </span>
            <h4 className="text-xl font-bold text-brand-dark font-sans mt-1.5">
              เข้าสู่ระบบใช้บริการ HUB
            </h4>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-brand-neutral mb-6 leading-relaxed">
          กรุณาเข้าสู่ระบบด้วยบัญชี Google หรืออีเมลโรงเรียนของท่านเพื่อยืนยันสิทธิ์ในการเข้าใช้งานและบริการจองระบบอย่างโปร่งใสและเป็นระเบียบเรียบร้อย
        </p>

        {/* Real Google Auth Option */}
        <div className="space-y-4">
          <button
            onClick={async () => {
              try {
                setErrorMessage("");
                await onGoogleLogin();
                onClose();
              } catch (err: any) {
                setErrorMessage(err?.message || "ระบบล็อคอินด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
              }
            }}
            className="w-full py-3.5 px-4 bg-white border border-slate-200 hover:border-brand-primary text-brand-dark font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-3 shadow-xs cursor-pointer hover:bg-slate-50 hover:shadow-sm"
          >
            {/* Simple Google SVG Icon */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            เข้าสู่ระบบด้วย Google Account
          </button>

          {errorMessage && (
            <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>ระบบรักษาความปลอดภัยผ่านมาตรฐานสากล</span>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-brand-neutral font-semibold rounded-xl text-center text-xs transition cursor-pointer"
        >
          ย้อนกลับ
        </button>
      </div>
    </div>
  );
}
