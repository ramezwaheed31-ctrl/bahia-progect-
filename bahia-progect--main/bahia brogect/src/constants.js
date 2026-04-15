// constants.js

// دالة لجلب الحروف الأولى من الاسم (Initials)
export function getInitials(name) {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
}

// دالة لجلب الوقت الحالي حسب اللغة
export function nowTime(lang) {
  const locale = lang === "ar" ? "ar-EG" : "en-US";
  return new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

// دالة لتجميع الهيستوري حسب التاريخ
export function groupBy(arr, key) {
  return arr.reduce((a, i) => {
    (a[i[key]] = a[i[key]] || []).push(i);
    return a;
  }, {});
}

// دالة لصناعة هيستوري تجريبي (لو احتجتيه)
export function makeHistory(lang) {
  if (lang === "ar") return [
    { id: 1, title: "بروتوكولات العلاج الكيميائي", date: "اليوم", preview: "يعتمد اختيار البروتوكول على..." },
    { id: 2, title: "المراحل الأربع لسرطان الثدي", date: "اليوم", preview: "تُصنَّف المراحل وفقاً لحجم الورم..." },
    { id: 3, title: "التغذية خلال فترة العلاج", date: "أمس", preview: "الأطعمة الغنية بالبروتين تساعد..." },
    { id: 4, title: "الآثار الجانبية للعلاج الإشعاعي", date: "أمس", preview: "تشمل التعب وتغيرات الجلد..." },
    { id: 5, title: "العلاج المناعي — مقدمة", date: "أمس", preview: "يعمل العلاج المناعي عن طريق..." },
  ];
  return [
    { id: 1, title: "Chemotherapy Protocols", date: "Today", preview: "Protocol selection depends on..." },
    { id: 2, title: "The Four Stages of Breast Cancer", date: "Today", preview: "Stages are classified by tumor size..." },
    { id: 3, title: "Nutrition During Treatment", date: "Yesterday", preview: "High-protein foods help the body..." },
    { id: 4, title: "Side Effects of Radiation", date: "Yesterday", preview: "Include fatigue and skin changes..." },
    { id: 5, title: "Immunotherapy — Introduction", date: "Yesterday", preview: "Immunotherapy works by activating..." },
  ];
}