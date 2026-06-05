// constants.js
// الثوابت والدوال المساعدة العامة

/**
 * Extracts initials from a user's full name.
 * @param {string} name - Full name of the user.
 * @returns {string} Initials or placeholder.
 * 
 * تستخلص الحروف الأولى من اسم المستخدم الكامل.
 * @param {string} name - الاسم الكامل للمستخدم.
 * @returns {string} الحروف الأولى أو علامة استفهام افتراضية.
 */
export function getInitials(name) {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
}

/**
 * Formats current system time to local time string based on language choice.
 * @param {string} lang - Selected language ('ar' or 'en').
 * @returns {string} Formatted hour:minute string.
 * 
 * تهيئ وقت النظام الحالي إلى صيغة نصية محلية بناءً على اللغة المحددة.
 * @param {string} lang - اللغة المحددة ('ar' أو 'en').
 * @returns {string} الوقت المنسق بالساعة والدقائق.
 */
export function nowTime(lang) {
  const locale = lang === "ar" ? "ar-EG" : "en-US";
  return new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

/**
 * Groups objects in an array by a target key.
 * @param {Array} arr - Collection of items to group.
 * @param {string} key - Object property key to group by.
 * @returns {object} Object mapped by grouping keys.
 * 
 * تجمع العناصر الموجودة في مصفوفة بناءً على مفتاح محدد.
 * @param {Array} arr - مجموعة العناصر المراد تجميعها.
 * @param {string} key - اسم الخاصية التي سيتم التجميع بناءً عليها.
 * @returns {object} الكائن النهائي المجمّع.
 */
export function groupBy(arr, key) {
  return arr.reduce((a, i) => {
    (a[i[key]] = a[i[key]] || []).push(i);
    return a;
  }, {});
}

/**
 * Generates sample conversation history dataset.
 * @param {string} lang - Target language ('ar' or 'en').
 * @returns {Array} Array of historical conversation objects.
 * 
 * تنشئ مجموعة بيانات تجريبية لسجل المحادثات.
 * @param {string} lang - اللغة المستهدفة ('ar' أو 'en').
 * @returns {Array} مصفوفة من كائنات المحادثة التجريبية.
 */
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