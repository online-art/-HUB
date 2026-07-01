import { MapPin, Phone, Mail, Clock, ShieldCheck } from "lucide-react";

export default function ContactUs() {
  const contactInfo = [
    {
      icon: MapPin,
      label: "ที่ตั้งโรงเรียน",
      value: "โรงเรียนประสาทวิทยาคาร เลขที่ 1 ถนนสุรินทร์-สังขะ ต.กังแอน อ.ปราสาท จ.สุรินทร์ 32140"
    },
    {
      icon: Phone,
      label: "เบอร์โทรศัพท์ติดต่อ",
      value: "044-551-119 (ฝ่ายเทคโนโลยีสารสนเทศเพื่อการศึกษา)"
    },
    {
      icon: Mail,
      label: "อีเมลติดต่อ",
      value: "admin@pwk.ac.th"
    },
    {
      icon: Clock,
      label: "เวลาประสานงาน",
      value: "วันจันทร์ - ศุกร์ (08:30 - 16:30 น.)"
    }
  ];

  return (
    <div id="contact-section" className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <span className="text-brand-primary font-semibold text-sm tracking-wider uppercase bg-blue-50 px-3 py-1 rounded-full">
            Contact Info
          </span>
          <h2 className="text-3xl font-bold text-brand-dark mt-3 mb-6 font-sans">
            ติดต่อสอบถามผู้ดูแลระบบ
          </h2>
          <p className="text-brand-neutral mb-8">
            หากท่านมีปัญหาเกี่ยวกับการใช้งานระบบจองห้อง การยกเลิกสิทธิ์ หรือความต้องการพิเศษเพิ่มเติม สามารถติดต่อสอบถามทีมผู้ดูแลระบบได้ทันที
          </p>

          <div className="space-y-6">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <div key={index} className="flex items-start gap-4">
                  <div className="p-3 bg-slate-100 rounded-lg text-brand-primary shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-dark text-sm">{info.label}</h4>
                    <p className="text-brand-neutral text-sm mt-1">{info.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col justify-between bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <div>
            <h3 className="font-bold text-xl text-brand-dark mb-3 font-sans">
              ที่ตั้งศูนย์การเรียนรู้ HUB Prasat Wittayakarn School
            </h3>
            <p className="text-sm text-brand-neutral mb-6">
              ตึกวิทยบริการ ชั้น 2 โรงเรียนประสาทวิทยาคาร ใกล้กับห้องสมุดกลางและศูนย์ภาษาไทย
            </p>
          </div>

          <div className="bg-slate-200 h-64 rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner">
            {/* Visual placeholder for school map */}
            <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/103.41,14.63,14,0/600x300?access_token=mock')` }}></div>
            <div className="z-10 text-center p-4">
              <MapPin className="w-10 h-10 text-brand-primary mx-auto mb-2 animate-bounce" />
              <p className="font-semibold text-brand-dark text-sm">โรงเรียนประสาทวิทยาคาร (PWK)</p>
              <p className="text-xs text-brand-neutral mt-1">อ.ปราสาท จ.สุรินทร์</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>รับรองการเชื่อมต่อกับระบบเครือข่ายความเร็วสูงโรงเรียน (PWK-Gigabit)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
