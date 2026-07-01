import React, { useState } from "react";
import { Booking, ROOMS, Room } from "../types";
import { ChevronLeft, ChevronRight, Calendar, Info, Clock, CheckCircle } from "lucide-react";

interface CalendarViewProps {
  bookings: Booking[];
  onDateSelect?: (date: string) => void;
  selectedDate?: string;
  rooms?: Room[];
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const THAI_WEEKDAYS = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

export default function CalendarView({ bookings, onDateSelect, selectedDate, rooms }: CalendarViewProps) {
  const displayRooms = rooms ?? ROOMS;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get total days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Get starting day of the month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  let startDayRaw = new Date(year, month, 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  let startDay = startDayRaw === 0 ? 6 : startDayRaw - 1;

  // Previous month days to fill empty start grid
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Helper to check if a day is today
  const isToday = (dayNum: number) => {
    const today = new Date();
    return (
      today.getDate() === dayNum &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  // Generate calendar days array
  const calendarDays: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

  // Pad prev month
  for (let i = startDay - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i;
    const prevMonthDate = new Date(year, month - 1, d);
    const dateStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push({
      day: d,
      isCurrentMonth: false,
      dateStr
    });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push({
      day: d,
      isCurrentMonth: true,
      dateStr
    });
  }

  // Pad next month
  const remainingCells = 42 - calendarDays.length; // 6 rows * 7 days = 42
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonthDate = new Date(year, month + 1, d);
    const dateStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push({
      day: d,
      isCurrentMonth: false,
      dateStr
    });
  }

  // Get active bookings for a date
  const getBookingsForDate = (dateStr: string) => {
    return bookings.filter((b) => {
      // Direct exact match
      if (b.startDate === dateStr) return true;
      // Date range match
      if (b.startDate <= dateStr && b.endDate >= dateStr) return true;
      return false;
    });
  };

  const getRoomColorBadge = (roomName: string) => {
    const room = displayRooms.find(r => r.name === roomName);
    return room ? (room.color || "bg-indigo-500") : "bg-slate-500";
  };

  return (
    <div id="calendar-view" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-brand-dark flex items-center gap-2 font-sans">
            <Calendar className="w-5 h-5 text-brand-primary" />
            ตารางการใช้ห้องและบริการ HUB
          </h3>
          <p className="text-sm text-brand-neutral mt-0.5">
            ตรวจสอบช่วงเวลาว่างและการจองใช้พื้นที่ของโรงเรียน
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-1.5 rounded-lg">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition text-brand-dark"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-brand-dark px-3 min-w-[120px] text-center font-sans">
            {THAI_MONTHS[month]} {year + 543}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition text-brand-dark"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of days */}
      <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
        {/* Week headers */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100 text-center py-2 text-xs font-semibold text-brand-dark uppercase tracking-wider">
          {THAI_WEEKDAYS.map((day, idx) => (
            <div key={idx} className={idx >= 5 ? "text-rose-500" : "text-brand-dark"}>
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 bg-slate-50/50">
          {calendarDays.map((cell, idx) => {
            const dateBookings = getBookingsForDate(cell.dateStr);
            const isSelected = selectedDate === cell.dateStr;
            const currentIsToday = cell.isCurrentMonth && isToday(cell.day);

            return (
              <div
                key={idx}
                id={`calendar-cell-${cell.dateStr}`}
                onClick={() => {
                  if (onDateSelect) onDateSelect(cell.dateStr);
                }}
                className={`min-h-[90px] p-1.5 border-b border-r border-slate-100 bg-white transition-all cursor-pointer relative group flex flex-col justify-between hover:bg-blue-50/20 ${
                  cell.isCurrentMonth ? "text-brand-dark" : "text-gray-300 bg-slate-50/30"
                } ${isSelected ? "ring-2 ring-brand-primary/50 bg-blue-50/30 z-10" : ""}`}
              >
                {/* Day number & Today indicator */}
                <div className="flex justify-between items-start">
                  <span
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                      currentIsToday
                        ? "bg-brand-primary text-white font-bold"
                        : "text-slate-500 group-hover:text-brand-primary"
                    }`}
                  >
                    {cell.day}
                  </span>
                  {dateBookings.length > 0 && cell.isCurrentMonth && (
                    <span className="text-[10px] bg-slate-100 text-brand-dark font-semibold px-1 py-0.5 rounded-md leading-none">
                      {dateBookings.length} รายการ
                    </span>
                  )}
                </div>

                {/* Booking entries inside the calendar cell */}
                <div className="mt-1 space-y-1 overflow-hidden flex-1 flex flex-col justify-end">
                  {cell.isCurrentMonth &&
                    dateBookings.slice(0, 2).map((booking) => (
                      <div
                        key={booking.id}
                        onClick={(e) => {
                          e.stopPropagation(); // Avoid triggering cell click
                          setSelectedBookingDetails(booking);
                        }}
                        className={`text-[9px] px-1 py-0.5 rounded-sm flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap border ${
                          booking.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : booking.status === "rejected"
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}
                        title={`${booking.room} (${booking.startTime}-${booking.endTime})`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getRoomColorBadge(booking.room)}`} />
                        <span className="font-medium truncate max-w-full">
                          {booking.startTime} {booking.fullName.split(" ")[0]}
                        </span>
                      </div>
                    ))}
                  {dateBookings.length > 2 && cell.isCurrentMonth && (
                    <div className="text-[8px] text-center text-brand-neutral font-medium">
                      + อีก {dateBookings.length - 2} รายการ
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Help tip */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-brand-neutral">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold">สัญลักษณ์ห้อง:</span>
          {displayRooms.map((room) => (
            <div key={room.id} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full ${room.color || "bg-indigo-500"}`} />
              <span>{room.name}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-brand-primary">
          <Info className="w-4 h-4 shrink-0" />
          <span>คลิกที่วันที่ในปฏิทินเพื่อเลือกวันจองในแบบฟอร์มด้านล่าง</span>
        </div>
      </div>

      {/* Booking detail modal/overlay */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider mb-2 ${
                  selectedBookingDetails.status === "approved"
                    ? "bg-emerald-100 text-emerald-800"
                    : selectedBookingDetails.status === "rejected"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {selectedBookingDetails.status === "approved" && "อนุมัติแล้ว"}
                  {selectedBookingDetails.status === "rejected" && "ปฏิเสธการจอง"}
                  {selectedBookingDetails.status === "pending" && "รอพิจารณาอนุมัติ"}
                </span>
                <h4 className="text-xl font-bold text-brand-dark font-sans leading-snug">
                  {selectedBookingDetails.room}
                </h4>
              </div>
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <ChevronRight className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-brand-dark">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-brand-neutral">ผู้ขอใช้บริการ:</span>
                  <span className="font-semibold">{selectedBookingDetails.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-neutral">กลุ่มสาระฯ/ฝ่าย:</span>
                  <span className="font-semibold">{selectedBookingDetails.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-neutral">จำนวนผู้ใช้:</span>
                  <span className="font-semibold">{selectedBookingDetails.attendeesCount} คน</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-brand-neutral">
                  <Calendar className="w-4 h-4 text-brand-primary" />
                  <span>
                    วันที่: <strong className="text-brand-dark">{selectedBookingDetails.startDate}</strong> 
                    {selectedBookingDetails.endDate !== selectedBookingDetails.startDate && (
                      <> ถึง <strong className="text-brand-dark">{selectedBookingDetails.endDate}</strong></>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-brand-neutral">
                  <Clock className="w-4 h-4 text-brand-primary" />
                  <span>
                    เวลา: <strong className="text-brand-dark">{selectedBookingDetails.startTime} - {selectedBookingDetails.endTime} น.</strong>
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs text-brand-neutral block mb-1">จุดประสงค์การใช้งาน:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg text-xs leading-relaxed italic border border-slate-100/50">
                  "{selectedBookingDetails.purpose}"
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedBookingDetails(null)}
              className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-brand-dark font-semibold rounded-xl text-center text-sm transition"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
