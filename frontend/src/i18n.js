/**
 * i18n.js — Bilingual translations (Arabic RTL / English LTR).
 * i18n.js — ترجمة ثنائية اللغة (العربية من اليمين لليسار / الإنجليزية من اليسار لليمين).
 *
 * All Arabic text follows gender-aware grammar post-login:
 *   - Female user: feminine verb conjugations (اسأليني، اكتشفي، سجّلي)
 *   - Male user:   masculine verb conjugations (اسألني، اكتشف، سجّل)
 * All auth/pre-login screens use strictly gender-neutral language.
 * 
 * تتبع جميع النصوص العربية قواعد النحو المراعية للجنسين بعد تسجيل الدخول:
 *   - المستخدمة الأنثى: صيغ المؤنث (اسأليني، اكتشفي، سجّلي)
 *   - المستخدم الذكر: صيغ المذكر (اسألني، اكتشف، سجّل)
 * تستخدم جميع شاشات تسجيل الدخول والمصادقة لغة محايدة تماماً.
 */

export const translations = {
  // Arabic Translations Block
  // كتلة الترجمات العربية
  ar: {
    dir: "rtl",
    appName: "MammoGuide",
    tagline: "مساعدك الذكي، دائماً معك.",
    online: "متصل",
    newChat: "+ محادثة جديدة",
    logout: "خروج",

    // ── Welcome titles (Emoji removed as requested) ──────────────────────────────
    // ── عناوين الترحيب (تمت إزالة الإيموجي بناءً على الطلب) ──────────────────────────────
    welcomeTitle: (name, gender) =>
      gender === "female" ? `مرحباً، ${name}` :
      gender === "male"   ? `مرحباً، ${name}` :
                            `مرحباً، ${name}`,

    // ── Welcome descriptions (Replaced as requested) ─────────────────────────────
    // ── وصف الترحيب (تم استبداله بناءً على الطلب) ─────────────────────────────
    // Female: feminine ("اكتشفي") | Male: masculine ("اكتشف")
    welcomeSub: "اكتشفي معلومات مبسطة حول الكشف المبكر، الأعراض، وطرق العلاج والدعم.",
    welcomeSubMale: "اكتشف معلومات مبسطة حول الكشف المبكر، الأعراض، وطرق العلاج والدعم.",

    // ── Disclaimer (Replaced as requested with medical advisory text) ──────────────
    // ── إخلاء المسؤولية (تم استبداله بنص استشاري طبي بناءً على الطلب) ──────────────
    disclaimer: "للحصول على تشخيص أو قرار علاجي دقيق، يُرجى مراجعة مقدم الرعاية الصحية.",
    disclaimerMale: "للحصول على تشخيص أو قرار علاجي دقيق، يُرجى مراجعة مقدم الرعاية الصحية.",

    // ── Input placeholders (Gender-aware) ───────────────────────────────────────
    // ── نصوص الإدخال التلميحية (مراعية للجنس) ───────────────────────────────────────
    inputPlaceholder: "اسأليني عن العلاج، الأعراض، التغذية...",
    inputPlaceholderMale: "اسألني عن العلاج، الأعراض، التغذية...",

    // ── Auth — Login (Fully gender-neutral) ─────────────────────────────────────
    // ── المصادقة — تسجيل الدخول (لغة محايدة تماماً للجنسين) ─────────────────────────
    loginWelcomeBack: "مرحباً بعودتك",
    loginSub: "يُرجى تسجيل الدخول للوصول إلى سجل محادثاتك",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "",
    passLabel: "كلمة المرور",
    passHint: "٨ أحرف على الأقل، تشمل حروفاً وأرقاماً",
    loginBtn: "الدخول ←",
    loginErr: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",

    // ── Login hero panel (Gender-neutral) ─────────────────────────────────────────
    // ── لوحة الترحيب الجانبية لشاشة الدخول (محايدة للجنسين) ──────────────────────────
    loginHeroine: "رفيقك في",
    loginHeroineSpan: "رحلة الشفاء.",
    loginHeroSub: "إجابات موثوقة ودعم متواصل — في أي وقت.",
    loginTags: ["العلاج الكيميائي", "الإشعاعي", "المناعي", "مراحل الورم", "التغذية", "الدعم النفسي"],

    // ── Quick suggestion chips ───────────────────────────────────────────────────
    // ── بطاقات الاقتراحات السريعة ─────────────────────────────────────────────────
    quickChips: ["أعراض سرطان الثدي", "ما هو العلاج المناعي؟", "التغذية أثناء العلاج", "مراحل الورم"],

    // ── History labels ───────────────────────────────────────────────────────────
    // ── تسميات سجل المحادثات ──────────────────────────────────────────────────────
    historyToday: "اليوم",
    historyYesterday: "أمس",
    role: "مريضة",
    roleMale: "مريض",

    // ── Gender selection modal (Gender-neutral instructions) ──────────────────────
    // ── نافذة تحديد الجنس (إرشادات محايدة للجنس) ─────────────────────────────────
    genderTitle: "مرحباً بك! ",
    genderSub: "لكي نتواصل معك بشكل صحيح، هل أنت...",
    genderFemale: "أنثى",
    genderMale: "ذكر",

    // ── Auth — Signup (Fully gender-neutral) ────────────────────────────────────
    // ── المصادقة — إنشاء حساب (لغة محايدة تماماً للجنسين) ──────────────────────────
    loginWelcomeNew: "إنشاء حساب جديد",
    loginSubNew: "يُرجى تسجيل البيانات للبدء",
    nameLabel: "الاسم الكامل",
    namePlaceholder: "",
    signupBtn: "إنشاء الحساب ←",
    signupErr: "هذا البريد الإلكتروني مستخدم بالفعل.",
    nameMissing: "يُرجى إدخال الاسم الكامل.",
    passMissing: "يُرجى إدخال كلمة المرور.",
    emailMissing: "يُرجى إدخال البريد الإلكتروني.",
    switchToSignup: "ليس لديك حساب؟",
    switchToSignupLink: "إنشاء حساب",
    switchToLogin: "لديك حساب بالفعل؟",
    switchToLoginLink: "تسجيل الدخول",

    // ── Feature cards for Female Users ───────────────────────────────────────────
    // ── بطاقات الميزات للمستخدمات الإناث ───────────────────────────────────────────
    featureCards: [
      { icon: "symptoms",   label: "الأعراض والعلاج",  title: "الأعراض والعلاجات",        desc: "اسألي عن الأعراض المبكرة وخيارات العلاج المتاحة",     query: "ما هي أعراض سرطان الثدي وخيارات العلاج المتاحة؟" },
      { icon: "awareness",  label: "التوعية",           title: "التوعية بسرطان الثدي",     desc: "حقائق هامة ومفاهيم شائعة ومعلومات توعوية موثوقة",    query: "ما هي أهم حقائق ومفاهيم التوعية بسرطان الثدي؟" },
      { icon: "support",    label: "الدعم النفسي",      title: "الدعم النفسي والوجداني",   desc: "إرشادات لتخطي القلق واستراتيجيات التأقلم الفعّالة",   query: "كيف يمكنني التعامل مع القلق والحصول على دعم نفسي؟" },
      { icon: "prevention", label: "الوقاية",           title: "الوقاية والكشف المبكر",    desc: "الفحص الذاتي وتصوير الثدي (الماموجرام) ومتى تبدئين", query: "كيف يمكنني إجراء الفحص الذاتي ومتى يجب عمل الماموجرام؟" },
    ],

    // ── Feature cards for Male Users (Gender-aware) ──────────────────────────────
    // ── بطاقات الميزات للمستخدمين الذكور (مراعية للجنس) ──────────────────────────────
    featureCardsMale: [
      { icon: "symptoms",   label: "الأعراض والعلاج",  title: "الأعراض والعلاجات",        desc: "اسأل عن الأعراض المبكرة وخيارات العلاج المتاحة",     query: "ما هي أعراض سرطان الثدي وخيارات العلاج المتاحة؟" },
      { icon: "awareness",  label: "التوعية",           title: "التوعية بسرطان الثدي",     desc: "حقائق هامة ومفاهيم شائعة ومعلومات توعوية موثوقة",    query: "ما هي أهم حقائق ومفاهيم التوعية بسرطان الثدي؟" },
      { icon: "support",    label: "الدعم النفسي",      title: "الدعم النفسي والوجداني",   desc: "إرشادات لتخطي القلق واستراتيجيات التأقلم الفعّالة",   query: "كيف يمكنني التعامل مع القلق والحصول على دعم نفسي؟" },
      { icon: "prevention", label: "الوقاية",           title: "الوقاية والكشف المبكر",    desc: "الفحص الذاتي وتصوير الثدي (الماموجرام) ومتى تبدأ",  query: "كيف يمكنني إجراء الفحص الذاتي ومتى يجب عمل الماموجرام؟" },
    ],

    // ── Footer ───────────────────────────────────────────────────────────────────
    // ── التذييل ───────────────────────────────────────────────────────────────────
    privacyNote: "محادثاتك آمنة وخاصة تماماً",

    // ── Sidebar ──────────────────────────────────────────────────────────────────
    // ── الشريط الجانبي ────────────────────────────────────────────────────────────
    sidebarTagline: "مساعدك الذكي، دائماً بجانبك",
  },

  // English Translations Block
  // كتلة الترجمات الإنجليزية
  en: {
    dir: "ltr",
    appName: "MammoGuide",
    tagline: "Your smart assistant, always with you.",
    online: "Online",
    newChat: "+ New Chat",
    logout: "Logout",

    // ── Welcome titles (Emoji removed as requested) ──────────────────────────────
    // ── عناوين الترحيب (تمت إزالة الإيموجي بناءً على الطلب) ──────────────────────────────
    welcomeTitle: (name, gender) => `Hello, ${name}`,

    // ── Welcome descriptions (Updated to match modified Arabic descriptions) ─────
    // ── وصف الترحيب (تم تحديثه ليتطابق مع النص العربي الجديد) ─────────────────────
    welcomeSub: "Discover simplified information about early detection, symptoms, treatment, and support.",
    welcomeSubMale: "Discover simplified information about early detection, symptoms, treatment, and support.",

    // ── Disclaimer (Updated to match Arabic medical advisory) ────────────────────
    // ── إخلاء المسؤولية (تم تحديثه ليتطابق مع النص العربي الاستشاري) ────────────────
    disclaimer: "For an accurate diagnosis or treatment decision, please consult a healthcare provider.",
    disclaimerMale: "For an accurate diagnosis or treatment decision, please consult a healthcare provider.",

    // ── Input placeholders ───────────────────────────────────────────────────────
    // ── نصوص الإدخال التلميحية ────────────────────────────────────────────────────
    inputPlaceholder: "Ask me about treatment, symptoms, nutrition...",
    inputPlaceholderMale: "Ask me about treatment, symptoms, nutrition...",

    // ── Auth — Login ─────────────────────────────────────────────────────────────
    // ── المصادقة — تسجيل الدخول ──────────────────────────────────────────────────
    loginWelcomeBack: "Welcome back",
    loginSub: "Sign in to access your conversation history",
    emailLabel: "Email address",
    emailPlaceholder: "",
    passLabel: "Password",
    passHint: "At least 8 characters including letters and numbers",
    loginBtn: "Sign in →",
    loginErr: "Incorrect email or password.",

    // ── Login hero panel ─────────────────────────────────────────────────────────
    // ── لوحة الترحيب الجانبية لشاشة الدخول ─────────────────────────────────────────
    loginHeroine: "Your companion in",
    loginHeroineSpan: "the journey to healing.",
    loginHeroSub: "Trusted answers and ongoing support — whenever you need it.",
    loginTags: ["Chemotherapy", "Radiation", "Immunotherapy", "Tumor Stages", "Nutrition", "Emotional Support"],

    // ── Quick suggestion chips ───────────────────────────────────────────────────
    // ── بطاقات الاقتراحات السريعة ─────────────────────────────────────────────────
    quickChips: ["Breast cancer symptoms", "What is immunotherapy?", "Nutrition during treatment", "Tumor stages"],

    // ── History labels ───────────────────────────────────────────────────────────
    // ── تسميات سجل المحادثات ──────────────────────────────────────────────────────
    historyToday: "Today",
    historyYesterday: "Yesterday",
    role: "Patient",
    roleMale: "Patient",

    // ── Gender selection modal ───────────────────────────────────────────────────
    // ── نافذة تحديد الجنس ─────────────────────────────────────────────────────────
    genderTitle: "Welcome! ",
    genderSub: "To address you properly, are you...",
    genderFemale: "Female",
    genderMale: "Male",

    // ── Auth — Signup ────────────────────────────────────────────────────────────
    // ── المصادقة — إنشاء حساب ─────────────────────────────────────────────────────
    loginWelcomeNew: "Create an account",
    loginSubNew: "Enter your details to get started",
    nameLabel: "Full name",
    namePlaceholder: "",
    signupBtn: "Create account →",
    signupErr: "This email is already in use.",
    nameMissing: "Please enter your full name.",
    passMissing: "Please enter your password.",
    emailMissing: "Please enter your email address.",
    switchToSignup: "New here?",
    switchToSignupLink: "Create account",
    switchToLogin: "Already have an account?",
    switchToLoginLink: "Sign in",

    // ── Feature cards for Female Users ───────────────────────────────────────────
    // ── بطاقات الميزات للمستخدمات الإناث ───────────────────────────────────────────
    featureCards: [
      { icon: "symptoms",   label: "Symptoms & Treatments", title: "Symptoms & Treatments",    desc: "Ask about early signs and available treatment options",   query: "What are breast cancer symptoms and treatment options?" },
      { icon: "awareness",  label: "Awareness",             title: "Breast Cancer Awareness",  desc: "Key facts, common myths, and trusted educational info",   query: "What is breast cancer awareness info and common myths?" },
      { icon: "support",    label: "Support",               title: "Mental Health Support",     desc: "Guidelines for coping with anxiety and emotional stress", query: "How to manage anxiety and find emotional support during treatment?" },
      { icon: "prevention", label: "Prevention",            title: "Prevention & Detection",   desc: "Self-exams, mammograms, and when to start screening",     query: "How do I perform a self-exam and when should I get a mammogram?" },
    ],

    // ── Feature cards for Male Users ─────────────────────────────────────────────
    // ── بطاقات الميزات للمستخدمين الذكور ─────────────────────────────────────────────
    featureCardsMale: [
      { icon: "symptoms",   label: "Symptoms & Treatments", title: "Symptoms & Treatments",    desc: "Ask about early signs and available treatment options",   query: "What are breast cancer symptoms and treatment options?" },
      { icon: "awareness",  label: "Awareness",             title: "Breast Cancer Awareness",  desc: "Key facts, common myths, and trusted educational info",   query: "What is breast cancer awareness info and common myths?" },
      { icon: "support",    label: "Support",               title: "Mental Health Support",     desc: "Guidelines for coping with anxiety and emotional stress", query: "How to manage anxiety and find emotional support during treatment?" },
      { icon: "prevention", label: "Prevention",            title: "Prevention & Detection",   desc: "Self-exams, mammograms, and when to start screening",     query: "How do I perform a self-exam and when should I get a mammogram?" },
    ],

    // ── Footer ───────────────────────────────────────────────────────────────────
    // ── التذييل ───────────────────────────────────────────────────────────────────
    privacyNote: "Your conversations are secure and private",

    // ── Sidebar ──────────────────────────────────────────────────────────────────
    // ── الشريط الجانبي ────────────────────────────────────────────────────────────
    sidebarTagline: "Your smart assistant, always by your side",
  },
};