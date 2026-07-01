import React, { useState, useEffect } from "react";
import { DEPARTMENTS, ROOMS, Booking, Room } from "../types";
import { User, Layers, Calendar, Clock, BookOpen, MonitorPlay, Users, CheckSquare, Sparkles, Image as ImageIcon } from "lucide-react";

export function getRoomImageSrc(imageUrl?: string) {
  if (!imageUrl) return "";
  const url = imageUrl.trim();
  const driveMatch = url.match(/(?:drive\.google\.com\/file\/d\/|open\?id=)([^/?#\s]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }
  return url;
}

interface BookingFormProps {
  userEmail: string | null;
  onLoginClick: () => void;
  onSubmitBooking: (bookingData: Omit<Booking, "id" | "status" | "userEmail" | "createdAt">) => Promise<boolean>;
  selectedCalendarDate?: string;
  rooms?: Room[];
}

export default function BookingForm({ userEmail, onLoginClick, onSubmitBooking, selectedCalendarDate, rooms }: BookingFormProps) {
  const displayRooms = rooms ?? ROOMS;
  const [fullName, setFullName] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [customDept, setCustomDept] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [purpose, setPurpose] = useState("");
  const [attendeesCount, setAttendeesCount] = useState(1);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Set initial selected room based on available rooms
  useEffect(() => {
    if (displayRooms.length > 0 && !selectedRoom) {
      setSelectedRoom(displayRooms[0].name);
    }
  }, [displayRooms, selectedRoom]);

  // Sync calendar date selection with form
  useEffect(() => {
    if (selectedCalendarDate) {
      setStartDate(selectedCalendarDate);
      setEndDate(selectedCalendarDate);
    }
  }, [selectedCalendarDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!userEmail) {
      setErrorMsg("กรุณาเข้าสู่ระบบก่อนทำการจองห้องใช้บริการ");
      onLoginClick();
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg("กรุณากรอกชื่อ-นามสกุล");
      return;
    }

    const finalDepartment = selectedDept === "อื่น ๆ (โปรดระบุ)" ? customDept.trim() : selectedDept;

    if (!finalDepartment) {
      setErrorMsg("กรุณาเลือกหรือระบุกลุ่มสาระฯ/งาน");
      return;
    }

    if (!startDate || !endDate) {
      setErrorMsg("กรุณาระบุวันที่เริ่มและวันที่สิ้นสุด");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มต้น");
      return;
    }

    if (!startTime || !endTime) {
      setErrorMsg("กรุณาระบุเวลาที่เริ่มและเวลาที่สิ้นสุด");
      return;
    }

    if (!purpose.trim()) {
      setErrorMsg("กรุณากรอกจุดประสงค์การขอใช้ห้อง");
      return;
    }

    if (attendeesCount <= 0) {
      setErrorMsg("จำนวนผู้เข้าใช้ต้องมากกว่า 0 คน");
      return;
    }

    setLoading(true);
    try {
      const success = await onSubmitBooking({
        fullName,
        department: finalDepartment,
        startDate,
        endDate,
        startTime,
        endTime,
        room: selectedRoom,
        purpose,
        attendeesCount: Number(attendeesCount)
      });

      if (success) {
        setSuccessMsg("ส่งคำขอจองใช้บริการสำเร็จ! รอการตรวจสอบและอนุมัติจากผู้ดูแลระบบ");
        // Reset state
        setFullName("");
        setSelectedDept("");
        setCustomDept("");
        setPurpose("");
        setAttendeesCount(1);
      } else {
        setErrorMsg("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "เกิดข้อผิดพลาด ไม่สามารถส่งข้อมูลจองได้");
    } finally {
      setLoading(false);
    }
  };

  const getRoomIcon = (iconName: string) => {
    switch (iconName) {
      case "BookOpen": return <BookOpen className="w-6 h-6" />;
      case "MonitorPlay": return <MonitorPlay className="w-6 h-6" />;
      case "Users": return <Users className="w-6 h-6" />;
      default: return <BookOpen className="w-6 h-6" />;
    }
  };

  return (
    <div id="booking-form-section" className="bg-white rounded-3xl border border-gray-100 p-8 shadow-md">
      <div className="text-center max-w-xl mx-auto mb-8">
        <h3 className="text-2xl font-bold text-brand-dark font-sans flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-brand-primary" />
          แบบฟอร์มการขอใช้บริการ HUB
        </h3>
        <p className="text-brand-neutral text-sm mt-1">
          กรุณากรอกรายละเอียดให้ครบถ้วนเพื่อประกอบการพิจารณาการจองห้องเรียนรู้เชิงสร้างสรรค์
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-brand-dark flex items-center gap-1.5 font-sans">
              <User className="w-4 h-4 text-brand-primary" />
              ชื่อ - นามสกุล <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ระบุชื่อจริง-นามสกุลของคุณ"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm transition"
              required
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-brand-dark flex items-center gap-1.5 font-sans">
              <Layers className="w-4 h-4 text-brand-primary" />
              กลุ่มสาระฯ / งาน <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm transition cursor-pointer appearance-none"
              required
            >
              <option value="">เลือกหน่วยงาน/กลุ่มสาระ</option>
              {DEPARTMENTS.map((dept, index) => (
                <option key={index} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {selectedDept === "อื่น ๆ (โปรดระบุ)" && (
              <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <input
                  type="text"
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  placeholder="โปรดระบุกลุ่มสาระฯ / งานของคุณ"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm transition"
                  required
                />
              </div>
            )}
          </div>
        </div>

        {/* Date and Time selectors */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
          <h4 className="text-sm font-bold text-brand-dark flex items-center gap-2 border-l-4 border-brand-primary pl-2 font-sans">
            วันและเวลาที่ต้องการ
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-primary/15 text-xs font-medium"
                required
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-primary/15 text-xs font-medium"
                required
              />
            </div>

            {/* Start Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                เวลาเริ่มต้น
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-primary/15 text-xs font-medium"
                required
              />
            </div>

            {/* End Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                เวลาสิ้นสุด
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-primary/15 text-xs font-medium"
                required
              />
            </div>
          </div>
        </div>

        {/* Room selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-brand-dark flex items-center gap-1.5 font-sans">
            <CheckSquare className="w-4 h-4 text-brand-primary" />
            เลือกสถานที่ / ห้องบริการ <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayRooms.map((room) => {
              const isSelected = selectedRoom === room.name;
              const hasImage = !!room.imageUrl;
              return (
                <div
                  key={room.id}
                  id={`room-option-${room.id}`}
                  onClick={() => setSelectedRoom(room.name)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-brand-primary bg-blue-50/10 shadow-xs"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-xs"
                  }`}
                >
                  <div className="space-y-3">
                    {hasImage && (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-150">
                        <img
                          src={getRoomImageSrc(room.imageUrl)}
                          alt={room.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // Hide image on load failure and show icon
                            e.currentTarget.style.display = "none";
                            const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.classList.remove("hidden");
                          }}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center hidden">
                          <ImageIcon className="w-8 h-8 text-slate-400" />
                        </div>
                      </div>
                    )}
                    
                    <div className={`p-3 rounded-xl w-fit ${isSelected ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-600"} ${hasImage ? "hidden" : "block"}`}>
                      {getRoomIcon(room.icon || "BookOpen")}
                    </div>
                    
                    <h5 className="font-bold text-base text-brand-dark font-sans leading-snug">{room.name}</h5>
                    <p className="text-xs text-brand-neutral leading-relaxed">{room.equipment}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>ความจุสูงสุด:</span>
                    <span className="text-brand-dark">{room.capacity}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Purpose & Attendees count */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Purpose */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-semibold text-brand-dark font-sans">
              จุดประสงค์การขอใช้ห้อง <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="ระบุรายละเอียดกิจกรรมหรือวัตถุประสงค์ในการจองห้องเรียนรู้"
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm transition resize-none"
              required
            />
          </div>

          {/* Attendees Count */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-brand-dark font-sans">
              จำนวนผู้เข้าใช้ (คน) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={attendeesCount}
              onChange={(e) => setAttendeesCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm transition h-[116px] text-center text-xl font-bold text-brand-dark"
              required
            />
          </div>
        </div>

        {/* Message Banner */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-sm">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm">
            {successMsg}
          </div>
        )}

        {/* Submit */}
        <div>
          {userEmail ? (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-2xl shadow-md shadow-brand-primary/20 transition-all text-center flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "กำลังส่งข้อมูลจอง..." : "ยืนยันการส่งข้อมูลการจอง"}
            </button>
          ) : (
            <div className="text-center p-5 rounded-2xl bg-blue-50 border border-blue-100/50">
              <p className="text-sm text-brand-dark font-medium mb-3">
                กรุณาเข้าสู่ระบบด้วย Gmail บัญชีโรงเรียนเพื่อจองห้องใช้บริการ HUB
              </p>
              <button
                type="button"
                onClick={onLoginClick}
                className="py-2.5 px-6 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                เข้าสู่ระบบ / ลงทะเบียน
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
