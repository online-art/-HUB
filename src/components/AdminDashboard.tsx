import React, { useState } from "react";
import { Booking, ROOMS, DEPARTMENTS } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Check, X, Trash2, Calendar, Clock, Filter, BarChart3, ListOrdered, Sparkles, Building, Briefcase, Shield, Plus, Pencil } from "lucide-react";

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
}

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
}: AdminDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"list" | "analytics" | "subadmins">("list");

  // Edit State
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
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
      setEditDepartment(editingBooking.department);
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
  const roomAnalyticsData = ROOMS.map(room => {
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
                  {ROOMS.map(r => (
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

      {/* Edit Booking Modal */}
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
                setEditLoading(true);
                try {
                  const success = await onUpdate(editingBooking.id, {
                    fullName: editFullName,
                    department: editDepartment,
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
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-brand-dark focus:outline-hidden focus:border-brand-primary cursor-pointer"
                    required
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
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
                    {ROOMS.map((r) => (
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
