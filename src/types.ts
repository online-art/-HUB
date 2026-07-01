export interface Booking {
  id: string;
  fullName: string;
  department: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  room: string;
  purpose: string;
  attendeesCount: number;
  status: 'pending' | 'approved' | 'rejected';
  userEmail: string;
  createdAt: string;
}

export const DEPARTMENTS = [
  "กลุ่มสาระฯ ภาษาไทย",
  "กลุ่มสาระฯ คณิตศาสตร์",
  "กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี",
  "กลุ่มสาระฯ สังคมศึกษา ศาสนา และวัฒนธรรม",
  "กลุ่มสาระฯ สุขศึกษาและพลศึกษา",
  "กลุ่มสาระฯ ศิลปะ",
  "กลุ่มสาระฯ การงานอาชีพ",
  "กลุ่มสาระฯ ภาษาต่างประเทศ",
  "กิจกรรมพัฒนาผู้เรียน",
  "ฝ่ายบริหาร/งานอื่น ๆ",
  "นักเรียน/สภานักเรียน"
];

export const ROOMS = [
  {
    id: "resource_center",
    name: "ห้อง Resource Center",
    capacity: "40-50 คน",
    equipment: "โปรเจคเตอร์, ไมโครโฟน, เครื่องเสียง, ระบบปรับอากาศ",
    color: "bg-indigo-500",
    textColor: "text-indigo-500",
    borderColor: "border-indigo-500",
    bgLight: "bg-indigo-50",
    icon: "MonitorPlay"
  },
  {
    id: "education_hub",
    name: "ห้องสมุด Education Hub",
    capacity: "80-100 คน",
    equipment: "จออัจฉริยะ, แล็ปท็อปเพื่อการค้นคว้า, บอร์ดเกม, พื้นที่นั่งทำงานกลุ่ม",
    color: "bg-blue-600",
    textColor: "text-blue-600",
    borderColor: "border-blue-600",
    bgLight: "bg-blue-50",
    icon: "BookOpen"
  },
  {
    id: "resource_hall",
    name: "ห้องโถง Resource Center",
    capacity: "120-150 คน",
    equipment: "เวทีขนาดเล็ก, เครื่องเสียงจัดเต็ม, เก้าอี้สัมมนา, นิทรรศการจัดแสดง",
    color: "bg-violet-600",
    textColor: "text-violet-600",
    borderColor: "border-violet-600",
    bgLight: "bg-violet-50",
    icon: "Users"
  }
];
