import { BookOpen, ShieldAlert, CheckCircle, Clock } from "lucide-react";

export default function Regulations() {
  const rules = [
    {
      icon: Clock,
      title: "เวลาให้บริการ",
      description: "วันจันทร์ - วันศุกร์ เวลา 08:00 - 16:30 น. (เว้นวันหยุดราชการและวันหยุดนักขัตฤกษ์ หรือตามระเบียบโรงเรียน)"
    },
    {
      icon: BookOpen,
      title: "การสำรองพื้นที่ล่วงหน้า",
      description: "ต้องทำการจองใช้พื้นที่ล่วงหน้าอย่างน้อย 1-3 วันทำการ เพื่อให้คณะกรรมการหรืออาจารย์ผู้ดูแลตรวจสอบความถูกต้องและอนุมัติ"
    },
    {
      icon: ShieldAlert,
      title: "ข้อปฏิบัติการใช้ห้อง",
      description: "ห้ามนำอาหารและเครื่องดื่มมีสีเข้ามาภายในห้องเด็ดขาด รักษาความสะอาด ไม่ส่งเสียงดังรบกวนผู้อื่น และจัดเก็บอุปกรณ์ให้อยู่ในสภาพเดิม"
    },
    {
      icon: CheckCircle,
      title: "การใช้อุปกรณ์ส่วนกลาง",
      description: "กรณีต้องการใช้โปรเจคเตอร์ คอมพิวเตอร์ หรือเครื่องเสียง กรุณาระบุรายละเอียดให้ชัดเจนในแบบฟอร์มการจอง"
    }
  ];

  return (
    <div id="regulations-section" className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-brand-primary font-semibold text-sm tracking-wider uppercase bg-blue-50 px-3 py-1 rounded-full">
          Rules & Regulations
        </span>
        <h2 className="text-3xl font-bold text-brand-dark mt-3 font-sans">
          ระเบียบการใช้งานพื้นที่ HUB
        </h2>
        <p className="text-brand-neutral mt-2">
          เพื่อความเรียบร้อยและความปลอดภัยในการใช้บริการ กรุณาปฏิบัติตามกฎกติกาอย่างเคร่งครัด
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules.map((rule, index) => {
          const Icon = rule.icon;
          return (
            <div
              key={index}
              id={`rule-card-${index}`}
              className="flex items-start p-5 rounded-xl bg-blue-50/20 border border-blue-100/50 hover:border-brand-primary/30 transition-all duration-300"
            >
              <div className="p-3 bg-brand-primary/10 rounded-lg text-brand-primary mr-4 shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-brand-dark font-sans">
                  {rule.title}
                </h3>
                <p className="text-sm text-brand-neutral mt-1 leading-relaxed">
                  {rule.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-yellow-600 shrink-0" />
        <span>
          <strong>หมายเหตุ:</strong> คณะกรรมการโรงเรียนประสาทวิทยาคาร ขอสงวนสิทธิ์ในการยกเลิกหรือเปลี่ยนแปลงการอนุมัติหากมีกิจกรรมเร่งด่วนของทางโรงเรียน
        </span>
      </div>
    </div>
  );
}
