import React, { useState } from "react";
import { Booking, ROOMS, DEPARTMENTS, Room } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Check, X, Trash2, Calendar, Clock, Filter, BarChart3, ListOrdered, Sparkles, Building, Briefcase, Shield, Plus, Pencil, FileText, Printer, Download, Image as ImageIcon } from "lucide-react";
import { getRoomImageSrc } from "./BookingForm";

interface AdminDashboardProps {
  bookings: Booking[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, fields: Omit<Booking, "id" | "createdAt" | "userEmail">) => Promise<boolean>;
  onPurgeAll: () => Promise<void>;
  isSuperAdmin: boolean;
  subAdmins: string[];
  onAddSubAdmin: (email: string) => Promise<void>;
  onRemoveSubAdmin: (email: string) => Promise<void>;
  rooms?: Room[];
  onAddRoom?: (roomData: Omit<Room, "id">) => Promise<void>;
  onUpdateRoom?: (id: string, roomData: Partial<Room>) => Promise<void>;
  onDeleteRoom?: (id: string) => Promise<void>;
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export default function AdminDashboard({
  bookings,
  onApprove,
  onReject,
  onDelete,
  onUpdate,
  onPurgeAll,
  isSuperAdmin,
  subAdmins,
  onAddSubAdmin,
  onRemoveSubAdmin,
  rooms,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
}: AdminDashboardProps) {
  const displayRooms = rooms ?? ROOMS;
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"list" | "analytics" | "subadmins" | "rooms" | "reports">("list");

  // Edit State
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editSelectedDept, setEditSelectedDept] = useState("");
  const [editCustomDept, setEditCustomDept] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editEndTime, setEditEndTime] = useState("12:00");
  const [editRoom, setEditRoom] = useState("");
  const [editPurpose, setEditPurpose] = useState("");
  const [editAttendeesCount, setEditAttendeesCount] = useState(1);
  const [editStatus, setEditStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  React.useEffect(() => {
    if (editingBooking) {
      setEditFullName(editingBooking.fullName);
      
      if (DEPARTMENTS.includes(editingBooking.department)) {
        setEditSelectedDept(editingBooking.department);
        setEditCustomDept("");
      } else {
        setEditSelectedDept("อื่น ๆ (โปรดระบุ)");
        setEditCustomDept(editingBooking.department);
      }

      setEditStartDate(editingBooking.startDate);
      setEditEndDate(editingBooking.endDate);
      setEditStartTime(editingBooking.startTime);
      setEditEndTime(editingBooking.endTime);
      setEditRoom(editingBooking.room);
      setEditPurpose(editingBooking.purpose);
      setEditAttendeesCount(editingBooking.attendeesCount);
      setEditStatus(editingBooking.status);
      setEditError("");
    }
  }, [editingBooking]);

  // Room Management State
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState("");
  const [roomCapacity, setRoomCapacity] = useState("");
  const [roomEquipment, setRoomEquipment] = useState("");
  const [roomImageUrl, setRoomImageUrl] = useState("");
  const [imageOption, setImageOption] = useState<"url" | "upload">("url");
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [roomError, setRoomError] = useState("");
  const [roomLoading, setRoomLoading] = useState(false);

  const handleOpenEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomName(room.name);
    setRoomCapacity(room.capacity);
    setRoomEquipment(room.equipment);
    setRoomImageUrl(room.imageUrl || "");
    setImageOption(room.imageUrl && room.imageUrl.startsWith("data:") ? "upload" : "url");
    setRoomError("");
    setIsAddingRoom(false);
  };

  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    setRoomName("");
    setRoomCapacity("");
    setRoomEquipment("");
    setRoomImageUrl("");
    setImageOption("url");
    setIsAddingRoom(true);
    setRoomError("");
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 450;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
        callback(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoomError("");
    setRoomLoading(true);
    if (!roomName.trim()) {
      setRoomError("กรุณาระบุชื่อห้องประชุม");
      setRoomLoading(false);
      return;
    }
    if (!roomCapacity.trim()) {
      setRoomError("กรุณาระบุความจุ");
      setRoomLoading(false);
      return;
    }
    
    const payload = {
      name: roomName.trim(),
      capacity: roomCapacity.trim(),
      equipment: roomEquipment.trim(),
      imageUrl: roomImageUrl.trim()
    };
    
    try {
      if (editingRoom) {
        if (onUpdateRoom) {
          await onUpdateRoom(editingRoom.id, payload);
        }
        setEditingRoom(null);
      } else {
        const colorPresets = [
          { color: "bg-indigo-500", textColor: "text-indigo-500", borderColor: "border-indigo-500", bgLight: "bg-indigo-50", icon: "MonitorPlay" },
          { color: "bg-blue-600", textColor: "text-blue-600", borderColor: "border-blue-600", bgLight: "bg-blue-50", icon: "BookOpen" },
          { color: "bg-violet-600", textColor: "text-violet-600", borderColor: "border-violet-600", bgLight: "bg-violet-50", icon: "Users" },
          { color: "bg-emerald-600", textColor: "text-emerald-600", borderColor: "border-emerald-600", bgLight: "bg-emerald-50", icon: "Sparkles" },
          { color: "bg-pink-600", textColor: "text-pink-600", borderColor: "border-pink-600", bgLight: "bg-pink-50", icon: "Building" }
        ];
        const randomPreset = colorPresets[Math.floor(Math.random() * colorPresets.length)];
        if (onAddRoom) {
          await onAddRoom({
            ...payload,
            ...randomPreset
          });
        }
        setIsAddingRoom(false);
      }
    } catch (err: any) {
      setRoomError(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลห้องประชุม");
    } finally {
      setRoomLoading(false);
    }
  };

  // Reports State
  const [reportType, setReportType] = useState<"day" | "month" | "year">("month");
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedReportDate, setSelectedReportDate] = useState(todayStr); // YYYY-MM-DD
  const [selectedReportMonth, setSelectedReportMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedReportYear, setSelectedReportYear] = useState(new Date().getFullYear());

  const reportBookings = bookings.filter((b) => {
    if (reportType === "day") {
      return b.startDate === selectedReportDate;
    } else if (reportType === "month") {
      const bDate = new Date(b.startDate);
      const parts = b.startDate.split("-");
      if (parts.length === 3) {
        return Number(parts[1]) === Number(selectedReportMonth) && Number(parts[0]) === Number(selectedReportYear);
      }
      return bDate.getMonth() + 1 === Number(selectedReportMonth) && bDate.getFullYear() === Number(selectedReportYear);
    } else {
      const bDate = new Date(b.startDate);
      const parts = b.startDate.split("-");
      if (parts.length === 3) {
        return Number(parts[0]) === Number(selectedReportYear);
      }
      return bDate.getFullYear() === Number(selectedReportYear);
    }
  });

  const reportTotalCount = reportBookings.length;
  const reportApprovedCount = reportBookings.filter(b => b.status === "approved").length;
  const reportPendingCount = reportBookings.filter(b => b.status === "pending").length;
  const reportRejectedCount = reportBookings.filter(b => b.status === "rejected").length;
  const reportTotalAttendees = reportBookings.reduce((sum, b) => sum + (b.attendeesCount || 0), 0);

  const exportToCSV = () => {
    const headers = ["วันที่ขอจอง", "ชื่อผู้ขอใช้บริการ", "กลุ่มสาระ/งาน", "สถานที่/ห้อง", "วันที่ใช้งาน", "เวลาใช้งาน", "วัตถุประสงค์", "ผู้เข้าร่วม (คน)", "สถานะ"];
    const rows = reportBookings.map(b => [
      new Date(b.createdAt).toLocaleDateString("th-TH"),
      b.fullName,
      b.department,
      b.room,
      b.startDate === b.endDate ? b.startDate : `${b.startDate} ถึง ${b.endDate}`,
      `${b.startTime} - ${b.endTime}`,
      b.purpose,
      b.attendeesCount,
      b.status === "approved" ? "อนุมัติแล้ว" : b.status === "rejected" ? "ปฏิเสธ" : "รอตรวจสอบ"
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `รายงานการจอง_${reportType}_${selectedReportDate || "export"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("กรุณาอนุญาตให้เปิดหน้าต่างป๊อปอัปเพื่อสั่งพิมพ์รายงาน");
      return;
    }
    
    const titleText = `รายงานการจองใช้บริการ HUB โรงเรียนประสาทวิทยาคาร (${
      reportType === "day"
        ? `ประจำวันที่ ${selectedReportDate}`
        : reportType === "month"
        ? `ประจำเดือน ${THAI_MONTHS[selectedReportMonth - 1]} พ.ศ. ${selectedReportYear + 543}`
        : `ประจำปี พ.ศ. ${selectedReportYear + 543}`
    })`;

    const tableRows = reportBookings.map((b, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td>${b.fullName}</td>
        <td>${b.department}</td>
        <td>${b.room}</td>
        <td style="text-align: center;">${b.startDate === b.endDate ? b.startDate : `${b.startDate} ถึง ${b.endDate}`}</td>
        <td style="text-align: center;">${b.startTime} - ${b.endTime} น.</td>
        <td>${b.purpose}</td>
        <td style="text-align: center;">${b.attendeesCount}</td>
        <td style="text-align: center;">
          ${b.status === "approved" ? "อนุมัติแล้ว" : b.status === "rejected" ? "ปฏิเสธ" : "รอตรวจสอบ"}
        </td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${titleText}</title>
          <style>
            body { font-family: 'Sarabun', sans-serif; padding: 20px; color: #1e293b; }
            h2 { text-align: center; margin-bottom: 5px; font-size: 20px; }
            h4 { text-align: center; font-weight: normal; margin-top: 0; color: #64748b; font-size: 14px; }
            .summary { display: flex; justify-content: space-around; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
            .summary div { text-align: center; }
            .summary strong { font-size: 16px; color: #2563eb; display: block; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
            th { background-color: #f1f5f9; color: #334155; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h2>${titleText}</h2>
          <h4>พิมพ์รายงาน ณ วันที่ ${new Date().toLocaleDateString("th-TH")} เวลา ${new Date().toLocaleTimeString("th-TH")} น.</h4>
          
          <div class="summary">
            <div>จองทั้งหมด: <strong>${reportTotalCount} รายการ</strong></div>
            <div>อนุมัติแล้ว: <strong>${reportApprovedCount} รายการ</strong></div>
            <div>รอการอนุมัติ: <strong>${reportPendingCount} รายการ</strong></div>
            <div>ปฏิเสธ: <strong>${reportRejectedCount} รายการ</strong></div>
            <div>ผู้เข้าร่วมสะสม: <strong>${reportTotalAttendees} คน</strong></div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">ลำดับ</th>
                <th style="width: 15%;">ชื่อผู้จอง</th>
                <th style="width: 15%;">กลุ่มสาระ/ฝ่าย</th>
                <th style="width: 15%;">สถานที่ / ห้อง</th>
                <th style="width: 15%; text-align: center;">วันที่จอง</th>
                <th style="width: 10%; text-align: center;">เวลาจอง</th>
                <th style="width: 15%;">จุดประสงค์</th>
                <th style="width: 5%; text-align: center;">ผู้ใช้ (คน)</th>
                <th style="width: 5%; text-align: center;">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows.length > 0 ? tableRows : '<tr><td colspan="9" style="text-align: center; color: #94a3b8; padding: 20px;">ไม่พบข้อมูลการจองในช่วงเวลานี้</td></tr>'}
            </tbody>
          </table>
          
          <div style="margin-top: 40px; text-align: right; font-size: 12px; padding-right: 20px;">
            ลงชื่อ ............................................................ ผู้รายงาน<br>
            ( ผู้ดูแลระบบจองบริการ HUB โรงเรียนประสาทวิทยาคาร )
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Summary counts
  const totalCount = bookings.length;
  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const approvedCount = bookings.filter(b => b.status === "approved").length;
  const rejectedCount = bookings.filter(b => b.status === "rejected").length;

  // Filter logic
  const filteredBookings = bookings.filter(b => {
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    const matchRoom = roomFilter === "all" || b.room === roomFilter;
    return matchStatus && matchRoom;
  });

  // Analytics processing
  // Bookings by Room
  const roomAnalyticsData = displayRooms.map(room => {
    const count = bookings.filter(b => b.room === room.name && b.status === "approved").length;
    return {
      name: room.name.replace("ห้อง", "").replace("สมุด", ""),
      bookings: count,
      color: room.id === "resource_center" ? "#6366F1" : room.id === "education_hub" ? "#2563EB" : "#8B5CF6"
    };
  });

  // Bookings by Department
  const deptAnalyticsMap: { [key: string]: number } = {};
  DEPARTMENTS.forEach(d => {
    deptAnalyticsMap[d] = 0;
  });
  bookings.forEach(b => {
    if (b.status === "approved") {
      deptAnalyticsMap[b.department] = (deptAnalyticsMap[b.department] || 0) + 1;
    }
  });

  const departmentAnalyticsData = Object.keys(deptAnalyticsMap).map(key => ({
    name: key.replace("กลุ่มสาระฯ ", "").substring(0, 15),
    bookings: deptAnalyticsMap[key]
  })).filter(item => item.bookings > 0);

  return (
    <div id="admin-dashboard-container" className="space-y-6">
      {/* Admin stats widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total widget */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">คำขอจองทั้งหมด</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-brand-dark">{totalCount}</span>
            <span className="text-xs text-brand-neutral">รายการ</span>
          </div>
        </div>

        {/* Pending widget */}
        <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">รออนุมัติ</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-amber-600">{pendingCount}</span>
            <span className="text-xs text-amber-700">รายการ</span>
          </div>
        </div>

        {/* Approved widget */}
        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">อนุมัติแล้ว</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-emerald-600">{approvedCount}</span>
            <span className="text-xs text-emerald-700">รายการ</span>
          </div>
        </div>

        {/* Rejected widget */}
        <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">ปฏิเสธการจอง</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-rose-600">{rejectedCount}</span>
            <span className="text-xs text-rose-700">รายการ</span>
          </div>
        </div>
      </div>

      {/* Tabs selector */}
      <div className="bg-white p-1 rounded-xl border border-gray-100 shadow-xs inline-flex gap-1 flex-wrap">
        <button
          onClick={() => setActiveTab("list")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === "list"
              ? "bg-brand-primary text-white"
              : "text-brand-neutral hover:bg-slate-50"
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          รายการผู้ขอใช้บริการ
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === "analytics"
              ? "bg-brand-primary text-white"
              : "text-brand-neutral hover:bg-slate-50"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          สถิติการใช้งาน
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab("rooms")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === "rooms"
                ? "bg-brand-primary text-white"
                : "text-brand-neutral hover:bg-slate-50"
            }`}
          >
            <Building className="w-4 h-4" />
            จัดการข้อมูลห้องประชุม 🏢
          </button>
        )}
        <button
          onClick={() => setActiveTab("reports")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === "reports"
              ? "bg-brand-primary text-white"
              : "text-brand-neutral hover:bg-slate-50"
          }`}
        >
          <FileText className="w-4 h-4" />
          รายงานการจอง 📊
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab("subadmins")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === "subadmins"
                ? "bg-brand-primary text-white"
                : "text-brand-neutral hover:bg-slate-50"
            }`}
          >
            <Shield className="w-4 h-4" />
            จัดการแอดมินรอง 👥
          </button>
        )}
      </div>

      {activeTab === "list" ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden">
          {/* Filters Bar */}
          <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/40">
            <div>
              <h4 className="font-bold text-lg text-brand-dark font-sans flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-primary" />
                แผงจัดการการอนุมัติจอง (แอดมิน)
              </h4>
              <p className="text-xs text-brand-neutral">
                พิจารณาอนุมัติห้องหรือลบรายการจองของโรงเรียนประสาทวิทยาคาร
              </p>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {/* Purge All Bookings */}
              <button
                onClick={async () => {
                  if (confirm("⚠️ คำเตือน: คุณต้องการล้างข้อมูลการจองทั้งหมด (รวมถึงข้อมูลตัวอย่าง) ออกจากระบบใช่หรือไม่?\nการดำเนินการนี้ไม่สามารถย้อนกลับได้!")) {
                    await onPurgeAll();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                title="ล้างข้อมูลการจองและข้อมูลตัวอย่างทั้งหมด"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ล้างข้อมูลทั้งหมด
              </button>

              {/* Room filter */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs">
                <Building className="w-3.5 h-3.5 text-brand-neutral" />
                <select
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                  className="focus:outline-hidden font-semibold bg-transparent text-brand-dark cursor-pointer"
                >
                  <option value="all">ทุกสถานที่</option>
                  {displayRooms.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs">
                <Filter className="w-3.5 h-3.5 text-brand-neutral" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="focus:outline-hidden font-semibold bg-transparent text-brand-dark cursor-pointer"
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="pending">รอการอนุมัติ</option>
                  <option value="approved">อนุมัติแล้ว</option>
                  <option value="rejected">ปฏิเสธแล้ว</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table / List representation */}
          <div className="overflow-x-auto">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-16 text-brand-neutral text-sm">
                ไม่มีคำขอจองตรงกับตัวกรองที่เลือก
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-100 uppercase tracking-wider">
                    <th className="py-3 px-5">ผู้จอง / สังกัด</th>
                    <th className="py-3 px-5">สถานที่</th>
                    <th className="py-3 px-5">วัน-เวลา</th>
                    <th className="py-3 px-5">วัตถุประสงค์</th>
                    <th className="py-3 px-5">สถานะ</th>
                    <th className="py-3 px-5 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50/50 text-sm transition">
                      <td className="py-4 px-5">
                        <div className="font-semibold text-brand-dark">{booking.fullName}</div>
                        <div className="text-xs text-brand-neutral flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3" />
                          {booking.department}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{booking.userEmail}</div>
                      </td>
                      <td className="py-4 px-5 font-medium text-brand-dark">
                        {booking.room}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-brand-dark font-medium">
                          <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                          {booking.startDate}
                        </div>
                        <div className="text-xs text-brand-neutral flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-brand-primary" />
                          {booking.startTime} - {booking.endTime} น.
                        </div>
                      </td>
                      <td className="py-4 px-5 max-w-xs">
                        <div className="text-brand-dark truncate" title={booking.purpose}>
                          {booking.purpose}
                        </div>
                        <div className="text-xs text-brand-neutral mt-0.5">
                          จำนวน {booking.attendeesCount} คน
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                          booking.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : booking.status === "rejected"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {booking.status === "approved" && "อนุมัติแล้ว"}
                          {booking.status === "rejected" && "ปฏิเสธ"}
                          {booking.status === "pending" && "รอพิจารณา"}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex gap-2">
                          {booking.status === "pending" && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    await onApprove(booking.id);
                                    alert("อนุมัติการจองสำเร็จ");
                                  } catch (e: any) {
                                    alert("เกิดข้อผิดพลาดในการอนุมัติ: " + e.message);
                                  }
                                }}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-lg transition cursor-pointer"
                                title="อนุมัติ"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await onReject(booking.id);
                                    alert("ปฏิเสธการจองสำเร็จ");
                                  } catch (e: any) {
                                    alert("เกิดข้อผิดพลาดในการปฏิเสธ: " + e.message);
                                  }
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition cursor-pointer"
                                title="ปฏิเสธ"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setEditingBooking(booking)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-lg transition cursor-pointer"
                            title="แก้ไขข้อมูลจอง"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบคำขอนี้ออกจากระบบ?")) {
                                try {
                                  await onDelete(booking.id);
                                  alert("ลบรายการจองเสร็จสิ้น");
                                } catch (e: any) {
                                  alert("เกิดข้อผิดพลาดในการลบรายการ: " + e.message);
                                }
                              }
                            }}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                            title="ลบคำขอ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : activeTab === "analytics" ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-md grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Room Analytics Chart */}
          <div className="space-y-4">
            <h4 className="font-bold text-base text-brand-dark font-sans flex items-center gap-2 pl-2 border-l-4 border-brand-primary">
              จำนวนชั่วโมงการจองที่ได้รับการอนุมัติแบ่งตามสถานที่
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomAnalyticsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="bookings" radius={[4, 4, 0, 0]}>
                    {roomAnalyticsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Analytics Chart */}
          <div className="space-y-4">
            <h4 className="font-bold text-base text-brand-dark font-sans flex items-center gap-2 pl-2 border-l-4 border-emerald-500">
              จำนวนการจองที่ได้รับการอนุมัติแบ่งตามกลุ่มสาระฯ
            </h4>
            <div className="h-64">
              {departmentAnalyticsData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-brand-neutral text-sm">
                  ไม่มีข้อมูลชาร์ตสำหรับวิเคราะห์กลุ่มสาระในขณะนี้
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentAnalyticsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#10B981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Sub Admins tab */
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-md space-y-6">
          <div className="border-b border-gray-50 pb-4">
            <h4 className="font-bold text-lg text-brand-dark font-sans flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-primary" />
              จัดการสิทธิ์ผู้ดูแลระบบสำรอง (Sub-Admins)
            </h4>
            <p className="text-xs text-brand-neutral mt-1">
              เพิ่มหรือลบสมาชิกเพื่อให้มีสิทธิ์เข้ามาพิจารณาคำขอจองห้อง ตรวจสอบสถิติ และควบคุมดูแลระบบ HUB (เฉพาะ Super Admin เท่านั้นที่จัดการได้)
            </p>
          </div>

          {/* Form to add sub admin */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              const email = formData.get("email") as string;
              if (!email || !email.trim()) return;
              await onAddSubAdmin(email.trim());
              if (form) {
                form.reset();
              }
            }}
            className="flex gap-3 max-w-md"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="ระบุอีเมลผู้ใช้ เช่น somchai@pwk.ac.th"
              className="grow px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-brand-primary text-sm font-semibold text-brand-dark"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl text-sm transition cursor-pointer shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              เพิ่มแอดมินรอง
            </button>
          </form>

          {/* List of sub-admins */}
          <div className="space-y-3 pt-2">
            <h5 className="font-bold text-sm text-brand-dark">รายชื่อแอดมินรองปัจจุบัน ({subAdmins.length} ท่าน)</h5>
            {subAdmins.length === 0 ? (
              <p className="text-xs text-brand-neutral">ยังไม่มีผู้ดูแลระบบสำรองในขณะนี้</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subAdmins.map((email) => (
                  <div key={email} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-brand-primary flex items-center justify-center font-bold text-xs border border-blue-100 uppercase">
                        {email[0]}
                      </div>
                      <span className="text-sm font-semibold text-brand-dark break-all">{email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกสิทธิ์แอดมินของ ${email}?`)) {
                          onRemoveSubAdmin(email);
                        }
                      }}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                      title="ลบแอดมินรอง"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Room Management Tab UI */}
      {activeTab === "rooms" && (
        <div id="room-management-tab" className="bg-white rounded-3xl border border-gray-100 p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div>
              <h4 className="font-bold text-lg text-brand-dark font-sans flex items-center gap-2">
                <Building className="w-5 h-5 text-brand-primary" />
                จัดการข้อมูลและภาพห้องประชุม
              </h4>
              <p className="text-xs text-brand-neutral mt-0.5">
                เพิ่ม แก้ไข ลบข้อมูลสถานที่บริการ และอัปโหลดภาพห้องประชุมสำหรับนักเรียนและครู
              </p>
            </div>
            <button
              onClick={handleOpenAddRoom}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl text-sm transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              เพิ่มห้องประชุมใหม่
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayRooms.map((room) => {
              const hasImage = !!room.imageUrl;
              return (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition duration-200"
                >
                  <div>
                    {/* Room Image */}
                    <div className="relative w-full h-40 bg-slate-100 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                      {hasImage ? (
                        <img
                          src={getRoomImageSrc(room.imageUrl)}
                          alt={room.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.classList.remove("hidden");
                          }}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                      <div className={`absolute inset-0 bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-1.5 ${hasImage ? "hidden" : ""}`}>
                        <ImageIcon className="w-10 h-10 text-slate-300" />
                        <span className="text-[10px] font-semibold">ไม่มีภาพตัวอย่าง</span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full shrink-0 ${room.color || "bg-brand-primary"}`} />
                        <h5 className="font-bold text-base text-brand-dark font-sans leading-tight">{room.name}</h5>
                      </div>
                      
                      <div className="space-y-1.5 text-xs text-brand-neutral">
                        <div className="flex justify-between">
                          <span>ความจุคน:</span>
                          <strong className="text-brand-dark">{room.capacity}</strong>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>อุปกรณ์ในห้อง:</span>
                          <strong className="text-brand-dark text-right leading-relaxed truncate max-w-[180px]" title={room.equipment}>
                            {room.equipment || "-"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-slate-50 flex gap-2">
                    <button
                      onClick={() => handleOpenEditRoom(room)}
                      className="grow py-2 bg-slate-100 hover:bg-slate-200 text-brand-dark font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5 text-brand-neutral" />
                      แก้ไข
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบห้อง "${room.name}" ออกจากระบบ?\nข้อมูลนี้จะหายไปจากระบบจองทันที!`)) {
                          if (onDeleteRoom) onDeleteRoom(room.id);
                        }
                      }}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs transition cursor-pointer"
                      title="ลบห้องประชุม"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reports Tab UI */}
      {activeTab === "reports" && (
        <div id="reports-tab" className="bg-white rounded-3xl border border-gray-100 p-6 shadow-md space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
            <div>
              <h4 className="font-bold text-lg text-brand-dark font-sans flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-primary" />
                รายงานการขอใช้บริการและห้องบริการ HUB
              </h4>
              <p className="text-xs text-brand-neutral mt-0.5">
                เลือกช่วงเวลา สรุปข้อมูลสถิติ และสั่งพิมพ์รายงาน หรือส่งออกเป็นไฟล์ CSV เพื่อใช้งานทางราชการ
              </p>
            </div>

            {/* Export and Print Buttons */}
            <div className="flex gap-2 w-full md:w-auto shrink-0">
              <button
                onClick={exportToCSV}
                disabled={reportBookings.length === 0}
                className="grow md:grow-0 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                ส่งออก CSV (UTF-8)
              </button>
              <button
                onClick={handlePrintReport}
                disabled={reportBookings.length === 0}
                className="grow md:grow-0 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-slate-200 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                พิมพ์รายงาน
              </button>
            </div>
          </div>

          {/* Timeframe Selectors */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row flex-wrap items-center gap-4">
            <div className="flex rounded-lg bg-slate-200 p-1 w-full sm:w-auto">
              {(["day", "month", "year"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`grow sm:grow-0 px-4 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                    reportType === type
                      ? "bg-white text-brand-dark shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {type === "day" ? "รายวัน" : type === "month" ? "รายเดือน" : "รายปี"}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto grow">
              {/* Daily filter */}
              {reportType === "day" && (
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-brand-dark w-full sm:w-auto">
                  <span className="text-slate-400">เลือกวันที่:</span>
                  <input
                    type="date"
                    value={selectedReportDate}
                    onChange={(e) => setSelectedReportDate(e.target.value)}
                    className="focus:outline-hidden font-bold cursor-pointer"
                  />
                </div>
              )}

              {/* Monthly filter */}
              {reportType === "month" && (
                <>
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-brand-dark grow sm:grow-0">
                    <span className="text-slate-400">เลือกเดือน:</span>
                    <select
                      value={selectedReportMonth}
                      onChange={(e) => setSelectedReportMonth(Number(e.target.value))}
                      className="focus:outline-hidden font-bold cursor-pointer bg-transparent"
                    >
                      {THAI_MONTHS.map((m, idx) => (
                        <option key={m} value={idx + 1}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-brand-dark grow sm:grow-0">
                    <span className="text-slate-400">เลือกปี พ.ศ.:</span>
                    <select
                      value={selectedReportYear}
                      onChange={(e) => setSelectedReportYear(Number(e.target.value))}
                      className="focus:outline-hidden font-bold cursor-pointer bg-transparent"
                    >
                      {Array.from({ length: 5 }, (_, idx) => new Date().getFullYear() - 2 + idx).map((yr) => (
                        <option key={yr} value={yr}>{yr + 543}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Yearly filter */}
              {reportType === "year" && (
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-brand-dark w-full sm:w-auto">
                  <span className="text-slate-400">เลือกปี พ.ศ.:</span>
                  <select
                    value={selectedReportYear}
                    onChange={(e) => setSelectedReportYear(Number(e.target.value))}
                    className="focus:outline-hidden font-bold cursor-pointer bg-transparent w-full sm:w-auto"
                  >
                    {Array.from({ length: 5 }, (_, idx) => new Date().getFullYear() - 2 + idx).map((yr) => (
                      <option key={yr} value={yr}>{yr + 543}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">จองใช้บริการรวม</span>
              <span className="text-2xl font-bold text-slate-700 mt-2">{reportTotalCount} รายการ</span>
            </div>
            <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">อนุมัติแล้ว</span>
              <span className="text-2xl font-bold text-emerald-600 mt-2">{reportApprovedCount} รายการ</span>
            </div>
            <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">รอพิจารณา</span>
              <span className="text-2xl font-bold text-amber-600 mt-2">{reportPendingCount} รายการ</span>
            </div>
            <div className="bg-rose-50/40 p-4 rounded-2xl border border-rose-100 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider">ปฏิเสธการจอง</span>
              <span className="text-2xl font-bold text-rose-600 mt-2">{reportRejectedCount} รายการ</span>
            </div>
            <div className="col-span-2 md:col-span-1 bg-blue-50/40 p-4 rounded-2xl border border-blue-100 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-brand-primary uppercase tracking-wider">ผู้ร่วมบริการสะสม</span>
              <span className="text-2xl font-bold text-brand-primary mt-2">{reportTotalAttendees} คน</span>
            </div>
          </div>

          {/* Report Data Table */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-brand-dark uppercase tracking-wider">
                    <th className="p-4 text-center" style={{ width: "60px" }}>ลำดับ</th>
                    <th className="p-4">ผู้ขอใช้บริการ</th>
                    <th className="p-4">กลุ่มสาระ/งาน</th>
                    <th className="p-4">สถานที่ / ห้อง</th>
                    <th className="p-4 text-center">วันที่ใช้งาน</th>
                    <th className="p-4 text-center">เวลาใช้งาน</th>
                    <th className="p-4 text-center" style={{ width: "90px" }}>ผู้ใช้ (คน)</th>
                    <th className="p-4 text-center" style={{ width: "120px" }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-brand-dark">
                  {reportBookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400 font-semibold bg-white/50">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        ไม่พบข้อมูลประวัติการจองตามที่เลือก
                      </td>
                    </tr>
                  ) : (
                    reportBookings.map((b, index) => (
                      <tr key={b.id} className="hover:bg-slate-50/30 transition">
                        <td className="p-4 text-center text-slate-400 font-bold">{index + 1}</td>
                        <td className="p-4">
                          <div className="font-bold">{b.fullName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">ID: {b.id.substring(0, 8)}</div>
                        </td>
                        <td className="p-4 font-semibold text-slate-600">{b.department}</td>
                        <td className="p-4">
                          <span className="font-bold">{b.room}</span>
                        </td>
                        <td className="p-4 text-center font-semibold">
                          {b.startDate === b.endDate ? b.startDate : `${b.startDate} ถึง ${b.endDate}`}
                        </td>
                        <td className="p-4 text-center font-bold text-slate-600">
                          {b.startTime} - {b.endTime} น.
                        </td>
                        <td className="p-4 text-center font-semibold">{b.attendeesCount}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                            b.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : b.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}>
                            {b.status === "approved" ? "อนุมัติแล้ว" : b.status === "rejected" ? "ปฏิเสธ" : "รอตรวจสอบ"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Room Popup Modal (Super Admin) */}
      {(isAddingRoom || editingRoom) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-brand-dark flex items-center gap-2 font-sans">
                  <Building className="w-5 h-5 text-brand-primary" />
                  {editingRoom ? "แก้ไขข้อมูลห้องประชุม" : "เพิ่มห้องประชุมใหม่"}
                </h3>
                <p className="text-xs text-brand-neutral mt-0.5">
                  {editingRoom ? `แก้ไขข้อมูลของ ${editingRoom.name}` : "กรอกข้อมูลเพื่อตั้งค่าห้องบริการใหม่"}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddingRoom(false);
                  setEditingRoom(null);
                  setRoomError("");
                }}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="p-6 space-y-4 overflow-y-auto grow">
              {roomError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold">
                  {roomError}
                </div>
              )}

              <div className="space-y-4">
                {/* Room Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-dark">ชื่อห้องประชุม / สถานที่บริการ <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="เช่น ห้อง Resource Center ชั้น 2"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-brand-dark focus:outline-hidden focus:border-brand-primary font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Capacity */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-dark">ความจุสูงสุด (คน) <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={roomCapacity}
                      onChange={(e) => setRoomCapacity(e.target.value)}
                      placeholder="เช่น 30-40 คน หรือ 50 คน"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-brand-dark focus:outline-hidden focus:border-brand-primary"
                      required
                    />
                  </div>

                  {/* Icon setting (Optional) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-dark">อุปกรณ์เสริมหลัก</label>
                    <input
                      type="text"
                      value={roomEquipment}
                      onChange={(e) => setRoomEquipment(e.target.value)}
                      placeholder="เช่น โปรเจคเตอร์, คอมพิวเตอร์, ระบบเสียง"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-brand-dark focus:outline-hidden focus:border-brand-primary"
                    />
                  </div>
                </div>

                {/* Image Selection Block */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-brand-dark block">รูปภาพประกอบห้องประชุม</label>
                  
                  {/* Toggle Image Option */}
                  <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold w-fit">
                    <button
                      type="button"
                      onClick={() => {
                        setImageOption("url");
                        setRoomImageUrl("");
                      }}
                      className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                        imageOption === "url" ? "bg-white text-brand-dark shadow-xs" : "text-slate-500"
                      }`}
                    >
                      ระบุด้วย ลิงก์รูปภาพ (URL / Google Drive)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageOption("upload");
                        setRoomImageUrl("");
                      }}
                      className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                        imageOption === "upload" ? "bg-white text-brand-dark shadow-xs" : "text-slate-500"
                      }`}
                    >
                      แนบไฟล์ภาพจากเครื่อง
                    </button>
                  </div>

                  {imageOption === "url" ? (
                    <div className="space-y-1.5">
                      <input
                        type="url"
                        value={roomImageUrl}
                        onChange={(e) => setRoomImageUrl(e.target.value)}
                        placeholder="วางที่อยู่รูปภาพ (เช่น https://example.com/image.jpg หรือลิงก์ Google Drive)"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-brand-dark focus:outline-hidden focus:border-brand-primary"
                      />
                      <p className="text-[10px] text-brand-neutral leading-relaxed">
                        💡 รองรับลิงก์ทั่วไป และลิงก์แชร์จาก **Google Drive** โดยระบบจะทำการเปิดดูและแสดงผลเป็นหน้าปกให้ผู้ใช้แบบอัตโนมัติ
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-xs text-brand-dark font-bold">คลิกที่นี่ เพื่อเลือกไฟล์ภาพ</p>
                            <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, JPEG (บีบอัดลงฐานข้อมูลอัตโนมัติ)</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileChange(e, (base64) => setRoomImageUrl(base64))}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Real-time Image Preview */}
                  {roomImageUrl && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500">ตัวอย่างรูปภาพที่จะแสดงผล:</span>
                      <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                        <img
                          src={getRoomImageSrc(roomImageUrl)}
                          alt="Room Preview"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const errLabel = e.currentTarget.nextElementSibling as HTMLElement;
                            if (errLabel) errLabel.classList.remove("hidden");
                          }}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-rose-50 flex items-center justify-center text-rose-500 font-bold text-xs hidden p-4 text-center">
                          ⚠️ ไม่สามารถโหลดรูปภาพจากลิงก์นี้ได้ กรุณาตรวจสอบลิงก์หรืออัปโหลดรูปภาพใหม่
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingRoom(false);
                    setEditingRoom(null);
                    setRoomError("");
                  }}
                  className="w-1/2 py-2.5 border border-slate-200 hover:bg-slate-50 text-brand-neutral font-bold rounded-xl text-sm transition cursor-pointer text-center"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={roomLoading}
                  className="w-1/2 py-2.5 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-indigo-300 text-white font-bold rounded-xl text-sm transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {roomLoading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-brand-dark flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-brand-primary" />
                  แก้ไขข้อมูลการจอง
                </h3>
                <p className="text-xs text-brand-neutral mt-0.5">ID: {editingBooking.id}</p>
              </div>
              <button
                onClick={() => {
                  setEditingBooking(null);
                  setEditError("");
                }}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setEditError("");
                
                const finalDepartment = editSelectedDept === "อื่น ๆ (โปรดระบุ)" ? editCustomDept.trim() : editSelectedDept;
                if (!finalDepartment) {
                  setEditError("กรุณาเลือกหรือระบุกลุ่มสาระฯ/งาน");
                  return;
                }

                setEditLoading(true);
                try {
                  const success = await onUpdate(editingBooking.id, {
                    fullName: editFullName,
                    department: finalDepartment,
                    startDate: editStartDate,
                    endDate: editEndDate,
                    startTime: editStartTime,
                    endTime: editEndTime,
                    room: editRoom,
                    purpose: editPurpose,
                    attendeesCount: Number(editAttendeesCount),
                    status: editStatus
                  });
                  if (success) {
                    setEditingBooking(null);
                  }
                } catch (err: any) {
                  setEditError(err?.message || "เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
                } finally {
                  setEditLoading(false);
                }
              }}
              className="p-6 space-y-4 overflow-y-auto grow"
            >
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold whitespace-pre-line">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-dark">ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-brand-dark focus:outline-hidden focus:border-brand-primary"
                    required
                  />
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-dark">กลุ่มสาระฯ/งาน</label>
                  <select
                    value={editSelectedDept}
                    onChange={(e) => setEditSelectedDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-brand-dark focus:outline-hidden focus:border-brand-primary cursor-pointer"
                    required
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {editSelectedDept === "อื่น ๆ (โปรดระบุ)" && (
                    <input
                      type="text"
                      value={editCustomDept}
                      onChange={(e) => setEditCustomDept(e.target.value)}
                      placeholder="โปรดระบุกลุ่มสาระฯ / งานของคุณ"
                      className="w-full mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-brand-dark focus:outline-hidden focus:border-brand-primary"
                      required
                    />
                  )}
                </div>

                {/* Start Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-dark">วันที่เริ่มต้น</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-brand-dark focus:outline-hidden focus:border-brand-primary"
                    required
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-dark">วันที่สิ้นสุด</label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-brand-dark focus:outline-hidden focus:border-brand-primary"
                    required
                  />
                </div>

                {/* Start Time */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-dark">เวลาเริ่มต้น</label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-brand-dark focus:outline-hidden focus:border-brand-primary"
                    required
                  />
                </div>

                {/* End Time */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-dark">เวลาสิ้นสุด</label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-brand-dark focus:outline-hidden focus:border-brand-primary"
                    required
                  />
                </div>

                {/* Room */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-dark">สถานที่</label>
                  <select
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-brand-dark focus:outline-hidden focus:border-brand-primary cursor-pointer"
                    required
                  >
                    {displayRooms.map((r) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Attendees Count */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-dark">จำนวนผู้เข้าร่วม (คน)</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={editAttendeesCount}
                    onChange={(e) => setEditAttendeesCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-brand-dark focus:outline-hidden focus:border-brand-primary"
                    required
                  />
                </div>
              </div>

              {/* Purpose */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-dark">วัตถุประสงค์การขอใช้</label>
                <textarea
                  value={editPurpose}
                  onChange={(e) => setEditPurpose(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-brand-dark focus:outline-hidden focus:border-brand-primary min-h-[60px]"
                  required
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-dark">สถานะการจอง</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'pending' | 'approved' | 'rejected')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-brand-dark focus:outline-hidden focus:border-brand-primary cursor-pointer"
                  required
                >
                  <option value="pending">รอการตรวจสอบ (pending)</option>
                  <option value="approved">อนุมัติแล้ว (approved)</option>
                  <option value="rejected">ปฏิเสธแล้ว (rejected)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingBooking(null);
                    setEditError("");
                  }}
                  className="w-1/2 py-2.5 border border-slate-200 hover:bg-slate-50 text-brand-neutral font-bold rounded-xl text-sm transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="w-1/2 py-2.5 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-indigo-300 text-white font-bold rounded-xl text-sm transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {editLoading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
