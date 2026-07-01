import React from "react";
import { LogIn, LogOut, ShieldAlert, User, Menu, Sparkles } from "lucide-react";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userEmail: string | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  isAdmin?: boolean;
}

export default function Navbar({ currentTab, setCurrentTab, userEmail, onLoginClick, onLogoutClick, isAdmin = false }: NavbarProps) {

  const navigationItems = [
    { id: "home", label: "หน้าแรก" },
    { id: "calendar", label: "ตารางจอง" },
    { id: "regulations", label: "ระเบียบการ" },
    { id: "contact", label: "ติดต่อเรา" }
  ];

  if (isAdmin) {
    navigationItems.push({ id: "admin", label: "แผงควบคุมแอดมิน 🛠️" });
  }

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and branding */}
          <div
            onClick={() => setCurrentTab("home")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* Visual circle logo representing the School HUB */}
            <div className="w-11 h-11 rounded-full bg-brand-primary flex items-center justify-center text-white font-extrabold text-lg shadow-sm shadow-brand-primary/20 group-hover:scale-105 transition-all">
              H
            </div>
            <div>
              <h1 className="font-extrabold text-lg sm:text-xl text-brand-dark tracking-tight leading-none flex items-center gap-1 font-sans">
                HUB <span className="text-brand-primary">Prasat Wittayakarn School</span>
              </h1>
              <p className="text-[10px] text-brand-neutral font-medium uppercase tracking-wider mt-0.5">
                โรงเรียนประสาทวิทยาคาร (PWK)
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                    isActive
                      ? "text-brand-primary bg-blue-50/50"
                      : "text-brand-dark hover:text-brand-primary hover:bg-slate-50/50"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Authentication area */}
          <div className="flex items-center gap-3">
            {userEmail ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-1.5 rounded-2xl">
                {/* User Info */}
                <div className="hidden sm:flex flex-col items-end px-2">
                  <span className="text-xs font-bold text-brand-dark max-w-[150px] truncate">
                    {userEmail.split("@")[0]}
                  </span>
                  {isAdmin ? (
                    <span className="text-[9px] text-white bg-brand-primary px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Super Admin
                    </span>
                  ) : (
                    <span className="text-[9px] text-brand-neutral font-semibold">
                      สมาชิกทั่วไป
                    </span>
                  )}
                </div>

                {/* Avatar Icon */}
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>

                {/* Logout Button */}
                <button
                  onClick={onLogoutClick}
                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                เข้าสู่ระบบ
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
