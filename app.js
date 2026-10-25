/* ==========================================================================
   غرفة العمليات المركزية — شبكة البوصلة الإخبارية (RAWI-YE.COM)
   المحرك البرمجي (app.js) — الجزء الأول: المصادقة، الكادر، البوصلات، الإعلانات، والإعدادات
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==================== 1. إعدادات الاتصال الثابتة بقاعدة البيانات ====================
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyD-RAWI-01-DEFAULT-KEY-REPLACE-IF-NEEDED",
  authDomain: "rawi-01.firebaseapp.com",
  projectId: "rawi-01",
  storageBucket: "rawi-01.appspot.com",
  messagingSenderId: "100000000000",
  appId: "1:100000000000:web:rawi01bawsala"
};

function resolveFirebaseConfig() {
  try {
    const saved = localStorage.getItem("bawsala_firebase_config") || localStorage.getItem("firebaseConfig");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.projectId) return parsed;
    }
  } catch (_) {}
  return DEFAULT_FIREBASE_CONFIG;
}

const app = initializeApp(resolveFirebaseConfig());
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const PUBLIC_SITE_URL = "https://networkbawsala.rawi-ye.com";
const DEFAULT_IMGBB_API_KEY = "6d207e02198a847aa98d0a2a901485a5";

// ==================== 2. البوصلات التخصصية والنصوص المؤسسية الافتراضية ====================
const DEFAULT_COMPASSES = [
  {
    id: "yemen-politics",
    name: "بوصلة السياسة اليمنية",
    slug: "yemen-politics",
    icon: "shield",
    flagUrl: "https://flagcdn.com/w80/ye.png",
    color: "#b91c1c",
    description: "رصد وتحليل معمق للمشهد السياسي والميداني اليمني، ودعم مؤسسات الدولة والشرعية.",
    subcategories: ["الشرعية ومؤسسات الدولة", "التحليلات الاستراتيجية", "الشأن المحلي والمحافظات", "كشف زيف الميليشيات"],
    visible: true,
    order: 1
  },
  {
    id: "saudi-politics",
    name: "بوصلة السياسة السعودية",
    slug: "saudi-politics",
    icon: "public",
    flagUrl: "https://flagcdn.com/w80/sa.png",
    color: "#047857",
    description: "تغطية شاملة للسياسة السعودية، الأمن القومي المشترك، والتحالفات الإقليمية والدولية.",
    subcategories: ["الأمن القومي اليمني السعودي", "الدبلوماسية الإقليمية", "رؤية المملكة 2030", "المشاريع التنموية"],
    visible: true,
    order: 2
  },
  {
    id: "regional-international",
    name: "البوصلة الإقليمية والدولية",
    slug: "regional-international",
    icon: "travel_explore",
    flagUrl: "",
    color: "#0369a1",
    description: "قراءة تحليلية في المتغيرات الجيوسياسية بالشرق الأوسط والعالم.",
    subcategories: ["الشرق الأوسط", "السياسة الدولية", "أمن البحر الأحمر والممرات"],
    visible: true,
    order: 3
  },
  {
    id: "culture-thought",
    name: "بوصلة الثقافة والفكر",
    slug: "culture-thought",
    icon: "menu_book",
    flagUrl: "",
    color: "#6d28d9",
    description: "مساحة حرة للأدب، الفكر، الهوية الوطنية، والتاريخ الحضاري.",
    subcategories: ["أدب وفكر", "تاريخ وهوية", "قراءات وكتب", "مقالات الرأي"],
    visible: true,
    order: 4
  },
  {
    id: "tech-future",
    name: "بوصلة التقنية والمستقبل",
    slug: "tech-future",
    icon: "memory",
    flagUrl: "",
    color: "#0f766e",
    description: "مواكبة ثورة الذكاء الاصطناعي، الأمن السيبراني، والتحول الرقمي.",
    subcategories: ["الذكاء الاصطناعي", "الأمن السيبراني", "تطبيقات ومنصات", "ابتكارات"],
    visible: true,
    order: 5
  },
  {
    id: "art-media",
    name: "بوصلة الفن والإعلام",
    slug: "art-media",
    icon: "theater_comedy",
    flagUrl: "",
    color: "#be185d",
    description: "متابعة المشهد الفني، الدراما، السينما، وصناعة الإعلام الجديد.",
    subcategories: ["فن ودراما", "إعلام رقمي", "تراث وفنون"],
    visible: true,
    order: 6
  },
  {
    id: "economy-dev",
    name: "بوصلة الاقتصاد والتنمية",
    slug: "economy-dev",
    icon: "monitoring",
    flagUrl: "",
    color: "#b45309",
    description: "تحليلات الأسواق، العملات، الطاقة، ومشاريع إعادة الإعمار والتنمية.",
    subcategories: ["أسواق وعملات", "طاقة ونفط", "إعمار وتنمية"],
    visible: true,
    order: 7
  }
];

const DEFAULT_ABOUT_HTML = `<p><strong>منصة إخبارية وتحليلية شاملة، تنبض بروح الوطن، وتؤمن بأن الكلمة أمانة والموقف مبدأ.</strong></p>
<p>تندرج <strong>شبكة البوصلة</strong> تحت مظلة <strong>مؤسسة RAWI-YE.COM الإعلامية الرقمية</strong>، وهي مؤسسة إعلامية مهنية رائدة تضم عدة منصات نوعية متكاملة في رؤيتها ومستقلة في خطوطها التحريرية، من أبرزها "شبكة البوصلة" و"موسوعة الحجرية". ننطلق من رسالة إعلامية راسخة لتكون منصاتنا مساحة رحبة وموضوعية لكل الأقلام الحرة والمبدعة في مختلف المجالات؛ الثقافية، الفنية، التقنية، والتحليلات المعمقة، التزاماً منا بإثراء وعي القارئ العربي ومواكبة الحقيقة بمهنية ومصداقية عالية.</p>
<h3>التوجيه التحريري والثوابت الوطنية: التزام لا حياد فيه تجاه الاستقرار</h3>
<p>تتبنى شبكة البوصلة معايير الصحافة الرصينة في التحقق من الحقائق وتقديم محتوى تحليلي موضوعي بعيداً عن التهويل. وفي الوقت الذي نؤمن فيه بالانفتاح المهني وتعددية الطرح في الشؤون العامة، فإننا نؤكد أن <strong>الخط الوطني والسيادي للشبكة هو خط ثابت لا يقبل المساومة</strong>:</p>
<blockquote>
<p>• <strong>الانحياز للدولة والاستقرار:</strong> تؤمن المؤسسة ومنصاتها بضرورة دعم مؤسسات الدولة الشرعية، وتعزيز مسار الأمن والاستقرار، ورفض كافة المشاريع الكيانية المتمردة أو الميليشيات التي تسعى لتقويض النسيج الاجتماعي وتخدم الأجندات التخريبية.</p>
<p>• <strong>الأمن القومي المشترك:</strong> ننطلق من قناعة راسخة بأن أمن الجمهورية اليمنية وأمن المملكة العربية السعودية يمثلان عمقاً استراتيجياً وأمناً قومياً مشتركاً لا يتجزأ. وبناءً عليه، فإننا ندعم كل المساعي والتحالفات التي تصب في مصلحة استقرار المنطقة وسلامتها، ونتخذ موقفاً موضوعياً مناهضاً لكل ما يهدد السلم والأمن الإقليمي.</p>
</blockquote>
<p>إن <strong>شبكة البوصلة</strong> تلتزم تماماً بسياسات النشر الرقمي العالمية ومعايير الشفافية والموضوعية، لتظل منبراً إعلامياً رصيناً يخدم الحقيقة، ويعزز الوعي، وينتصر بثبات لمصلحة الوطن ورفعة شأنه.</p>`;

const DEFAULT_CHARTER_HTML = `<p>يمثل هذا الميثاق الدستور المهني والأخلاقي والوطني لكافة المحررين والكتّاب في <strong>شبكة البوصلة (RAWI-YE.COM)</strong>:</p>
<h3>أولاً: الثوابت الوطنية والسياسية</h3>
<p>1. الالتزام التام بدعم الدولة والشرعية والاصطفاف مع المصلحة الوطنية العليا، وعدم الترويج لأي خطاب يخدم الميليشيات أو المشاريع التخريبية المعادية.</p>
<p>2. احترام عمق الأمن القومي المشترك بين اليمن والمملكة العربية السعودية باعتباره ركيزة استقرار المنطقة.</p>
<h3>ثانياً: المعايير المهنية والتحريرية</h3>
<p>1. تحري الدقة والمصداقية والاعتماد على المصادر الموثوقة قبل نشر أي خبر أو تحليل.</p>
<p>2. الكتابة باللغة العربية الفصحى الرصينة، والابتعاد عن الألفاظ النابية أو التجريح الشخصي.</p>
<p>3. تخضع مقالات الكتّاب الجدد للمراجعة التحريرية قبل النشر، بينما يتمتع الكتّاب الموثقون بالشارة الزرقاء بصلاحية النشر المباشر وفق ضوابط الميثاق.</p>`;

const DEFAULT_PRIVACY_HTML = `<p>تحترم <strong>شبكة البوصلة</strong> خصوصية كافة زوارها وقرّائها، وتلتزم بحماية البيانات وفق أعلى المعايير التقنية:</p>
<p>• لا نقوم بجمع أي بيانات شخصية عن الزوار أثناء تصفح الأخبار والمقالات.</p>
<p>• جميع الوثائق والبيانات الخاصة بالكادر الصحفي تُحفظ بشكل مشفر وسري ولا يطلع عليها سوى الإدارة العليا للمنصة.</p>`;

// ==================== 3. الحالة العامة لغرفة العمليات (State) ====================
const state = {
  currentUser: null,
  userProfile: null,
  settings: {
    siteName: "شبكة البوصلة",
    networkName: "RAWI-YE.COM",
    siteDescription: "منصة إخبارية وتحليلية شاملة تندرج تحت مظلة مؤسسة RAWI-YE.COM الإعلامية الرقمية",
    logoUrl: "",
    faviconUrl: "",
    coverImageUrl: "",
    accentColor: "#b91c1c",
    aboutHtml: DEFAULT_ABOUT_HTML,
    charterHtml: DEFAULT_CHARTER_HTML,
    privacyHtml: DEFAULT_PRIVACY_HTML,
    socials: {}
  },
  compasses: [...DEFAULT_COMPASSES],
  posts: [],
  staff: [],
  ads: [],
  activeTab: "dashboard",
  previewPostId: null,
  listenersStarted: false
};

// ==================== 4. الدوال المساعدة وفحص الصلاحيات ====================
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtmlToText(html = "") {
  const tmp = document.createElement("div");
  tmp.innerHTML = html
    .replace(/<\/(p|h1|h2|h3|h4|blockquote|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
  return (tmp.textContent || tmp.innerText || "").replace(/\n{3,}/g, "\n\n").trim();
}

function showOpsToast(msg) {
  const toast = document.getElementById("ops-toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(window.__opsToastTimer);
  window.__opsToastTimer = setTimeout(() => toast.classList.add("hidden"), 3400);
}

function formatArabicDate(timestamp) {
  if (!timestamp) return "الآن";
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(d.getTime())) return "حديثاً";
  return d.toLocaleDateString("ar-YE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getPostTimestampMs(post) {
  if (!post || !post.createdAt) return 0;
  if (typeof post.createdAt.toMillis === "function") return post.createdAt.toMillis();
  if (post.createdAt.seconds) return post.createdAt.seconds * 1000;
  const parsed = new Date(post.createdAt).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

// فحص صلاحيات المستخدم الحالي بدقة
function isUserAdmin() {
  return Boolean(state.userProfile && state.userProfile.role === "admin");
}

function isUserEditorOrAdmin() {
  return Boolean(
    state.userProfile && (state.userProfile.role === "admin" || state.userProfile.role === "editor")
  );
}

// هل يملك الكاتب صلاحية النشر المباشر الفوري دون مراجعة؟
function canUserPublishDirectly() {
  if (!state.userProfile) return false;
  if (state.userProfile.role === "admin" || state.userProfile.role === "editor") return true;
  // إذا كان الكاتب مقيداً بالمراجعة الإلزامية حتى لو كان يملك الشارة الزرقاء، تحال مقالاته للمراجعة
  if (state.userProfile.requireReview) return false;
  return Boolean(state.userProfile.verified);
}

function getRoleArabicName(role) {
  if (role === "admin") return "قيادة عليا (مدير عام)";
  if (role === "editor") return "محرر ومراجع صحفي";
  return "كاتب وصحفي";
}

// ==================== 5. نظام المصادقة والتحقق من الكادر (Authentication) ====================
async function handleAuthUser(firebaseUser) {
  const authScreen = document.getElementById("auth-screen");
  const opsApp = document.getElementById("ops-app");
  const errBox = document.getElementById("auth-error-box");
  const errText = document.getElementById("auth-error-text");

  if (!firebaseUser) {
    state.currentUser = null;
    state.userProfile = null;
    authScreen?.classList.remove("hidden");
    opsApp?.classList.add("hidden");
    return;
  }

  const emailKey = (firebaseUser.email || "").trim().toLowerCase();
  if (!emailKey) {
    await signOut(auth);
    return;
  }

  try {
    const staffRef = doc(db, "staff", emailKey);
    const staffSnap = await getDoc(staffRef);

    let profileData = null;

    if (staffSnap.exists()) {
      profileData = { id: emailKey, email: emailKey, ...staffSnap.data() };
    } else {
      // إذا لم يكن مسجلاً في السجل بعد، ننشئ له ملفاً أولياً أو نعتمد المدير المؤسس
      profileData = {
        id: emailKey,
        email: emailKey,
        name: firebaseUser.displayName || emailKey.split("@")[0],
        avatar: firebaseUser.photoURL || "",
        role: "admin", // يمنح صلاحية القيادة للمؤسس، ويمكن تعديل رتب الأعضاء من قسم الكادر
        jobTitle: "عضو هيئة التحرير",
        verified: true,
        requireReview: false,
        suspended: false,
        createdAt: serverTimestamp()
      };
      await setDoc(staffRef, profileData, { merge: true });
    }

    if (profileData.suspended) {
      if (errBox && errText) {
        errText.textContent = "تم تجميد حسابك مؤقتاً من قِبل إدارة التحرير. يرجى التواصل مع القيادة.";
        errBox.classList.remove("hidden");
      }
      await signOut(auth);
      return;
    }

    state.currentUser = firebaseUser;
    state.userProfile = profileData;

    errBox?.classList.add("hidden");
    authScreen?.classList.add("hidden");
    opsApp?.classList.remove("hidden");

    applyUserInterfacePermissions();
    if (!state.listenersStarted) {
      state.listenersStarted = true;
      startOpsRealtimeListeners();
    }
  } catch (err) {
    console.error("Auth check error:", err);
    if (errBox && errText) {
      errText.textContent = "حدث خطأ أثناء التحقق من الصلاحيات. تأكد من اتصالك بالإنترنت.";
      errBox.classList.remove("hidden");
    }
  }
}

function applyUserInterfacePermissions() {
  const p = state.userProfile;
  if (!p) return;

  const nameEl = document.getElementById("current-user-name");
  if (nameEl) nameEl.textContent = p.name || p.email;

  const avatarEl = document.getElementById("current-user-avatar");
  if (avatarEl) {
    avatarEl.src =
      p.avatar ||
      state.currentUser?.photoURL ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || "محرر")}&background=1d4ed8&color=fff`;
  }

  const roleBadge = document.getElementById("current-user-role-badge");
  if (roleBadge) roleBadge.textContent = getRoleArabicName(p.role);

  const verIcon = document.getElementById("current-user-verified");
  if (verIcon) verIcon.classList.toggle("hidden", !p.verified);

  // إظهار أو إخفاء الأقسام السيادية حسب الرتبة
  const adminOnlyIds = [
    "nav-tab-staff",
    "nav-tab-settings",
    "dock-btn-staff",
    "dock-btn-settings"
  ];
  const editorOrAdminIds = ["nav-tab-compasses", "nav-tab-ads", "dock-btn-compasses"];

  adminOnlyIds.forEach((id) => {
    document.getElementById(id)?.classList.toggle("hidden", !isUserAdmin());
  });
  editorOrAdminIds.forEach((id) => {
    document.getElementById(id)?.classList.toggle("hidden", !isUserEditorOrAdmin());
  });

  // عرض التنبيه الإداري الموجه للصحفي إن وجد
  const alertBar = document.getElementById("staff-alert-bar");
  const alertMsg = document.getElementById("staff-alert-message");
  if (p.adminAlert && p.adminAlert.trim() !== "") {
    if (alertMsg) alertMsg.textContent = p.adminAlert;
    alertBar?.classList.remove("hidden");
  } else {
    alertBar?.classList.add("hidden");
  }

  // تحديث إشعار حالة النشر في المحرر
  const noticeText = document.getElementById("writer-publishing-notice-text");
  const publishBtnLabel = document.getElementById("publish-btn-label");
  if (canUserPublishDirectly()) {
    if (noticeText) {
      noticeText.textContent =
        "تتمتع بصلاحية النشر المباشر (صحفي موثق بالشارة الزرقاء / هيئة التحرير). أي مادة تعتمدها ستُنشر فوراً في الموقع العام.";
    }
    if (publishBtnLabel) publishBtnLabel.textContent = "نشر فوري في الموقع العام";
  } else {
    if (noticeText) {
      noticeText.textContent =
        "نظام الجودة التحريرية: عند الضغط على إرسال، ستُحال مادتك تلقائياً إلى قسم (قيد المراجعة) لاعتمادها من هيئة التحرير قبل ظهورها للجمهور.";
    }
    if (publishBtnLabel) publishBtnLabel.textContent = "إرسال المادة للمراجعة والاعتماد";
  }
}

// ==================== 6. الإعدادات السيادية والميثاق الصحفي ====================
function populateSettingsForm() {
  const s = state.settings;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  };

  setVal("set-site-name", s.siteName || "شبكة البوصلة");
  setVal("set-accent-color", s.accentColor || "#b91c1c");
  setVal("set-site-desc", s.siteDescription || "");
  setVal("set-logo-url", s.logoUrl || "");
  setVal("set-favicon-url", s.faviconUrl || "");
  setVal("set-cover-url", s.coverImageUrl || "");

  const soc = s.socials || {};
  setVal("set-social-wa", soc.whatsapp || "");
  setVal("set-social-tg", soc.telegram || "");
  setVal("set-social-x", soc.x || soc.twitter || "");
  setVal("set-social-fb", soc.facebook || "");
  setVal("set-social-yt", soc.youtube || "");

  setVal("set-about-html", s.aboutHtml || DEFAULT_ABOUT_HTML);
  setVal("set-charter-html", s.charterHtml || DEFAULT_CHARTER_HTML);
  setVal("set-privacy-html", s.privacyHtml || DEFAULT_PRIVACY_HTML);

  // تحديث عرض الميثاق في تبويب الميثاق والسلامة لكل الكادر
  const charterDisplay = document.getElementById("ops-charter-display");
  if (charterDisplay) {
    charterDisplay.innerHTML = s.charterHtml || DEFAULT_CHARTER_HTML;
  }
}

async function saveSovereignSettings(e) {
  e.preventDefault();
  if (!isUserAdmin()) {
    showOpsToast("عذراً، تعديل الإعدادات السيادية مخصص للقيادة العليا فقط");
    return;
  }

  const getVal = (id) => (document.getElementById(id)?.value || "").trim();

  const updatedSettings = {
    siteName: getVal("set-site-name") || "شبكة البوصلة",
    networkName: "RAWI-YE.COM",
    accentColor: getVal("set-accent-color") || "#b91c1c",
    siteDescription: getVal("set-site-desc"),
    logoUrl: getVal("set-logo-url"),
    faviconUrl: getVal("set-favicon-url"),
    coverImageUrl: getVal("set-cover-url"),
    aboutHtml: getVal("set-about-html") || DEFAULT_ABOUT_HTML,
    charterHtml: getVal("set-charter-html") || DEFAULT_CHARTER_HTML,
    privacyHtml: getVal("set-privacy-html") || DEFAULT_PRIVACY_HTML,
    socials: {
      whatsapp: getVal("set-social-wa"),
      telegram: getVal("set-social-tg"),
      x: getVal("set-social-x"),
      facebook: getVal("set-social-fb"),
      youtube: getVal("set-social-yt")
    },
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, "settings", "general"), updatedSettings, { merge: true });
    showOpsToast("تم حفظ وتعميم الإعدادات السيادية في الموقع العام بنجاح");
  } catch (err) {
    console.error("Save settings error:", err);
    showOpsToast("تعذر حفظ الإعدادات، تحقق من الصلاحيات أو الاتصال");
  }
}

// ==================== 7. إدارة الكادر الصحفي ومنظومة الترحيب التلقائي ====================
function buildStaffWelcomeMessage(member) {
  const siteName = state.settings.siteName || "شبكة البوصلة";
  const opsUrl = window.location.origin + window.location.pathname;
  const charterPlainText = stripHtmlToText(state.settings.charterHtml || DEFAULT_CHARTER_HTML);
  const roleLabel = getRoleArabicName(member.role);
  const publishStatus =
    member.verified && !member.requireReview
      ? "تم منحك الشارة الزرقاء وصلاحية النشر المباشر."
      : "تُحفظ مقالاتك في قسم المراجعة التحريرية ليتم اعتمادها ونشرها من قِبل هيئة التحرير.";

  return `مرحباً بك أستاذ ${member.name} في أسرة "${siteName}" التابعة لمؤسسة RAWI-YE.COM الإعلامية الرقمية.

يسعدنا انضمامك إلينا واعتمادك رسمياً ضمن كادر الشبكة بصفة: (${roleLabel} — ${member.jobTitle || "كاتب ومحرر صحفي"}).
• حالة النشر الخاصة بك: ${publishStatus}

---
طريقة الدخول إلى غرفة العمليات المركزية:
1. افتح رابط غرفة العمليات الرسمي:
${opsUrl}
2. اضغط على زر (تسجيل الدخول عبر حساب Google المعتمد).
3. اختر بريدك الإلكتروني المسجل لدينا:
${member.email}

---
ميثاق الشرف الصحفي والتوجيه الوطني المعتمد للعمل في الشبكة:
${charterPlainText}

---
نحن فخورون بوجود قلمك معنا، ولا تتردد أبداً في التواصل معنا في أي وقت إذا احتجت إلى أي مساعدة تقنية أو تحريرية. مع خالص التقدير والتمنيات بالتوفيق!`;
}

function sendStaffWelcomeWhatsApp(member) {
  const msg = buildStaffWelcomeMessage(member);
  const cleanPhone = String(member.phone || "").replace(/[^0-9]/g, "");
  const waUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, "_blank", "noopener");
}

function sendStaffWelcomeEmail(member) {
  const siteName = state.settings.siteName || "شبكة البوصلة";
  const subject = `اعتماد عضويتك الصحفية وميثاق العمل في ${siteName} — RAWI-YE.COM`;
  const body = buildStaffWelcomeMessage(member);

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    member.email || ""
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(gmailUrl, "_blank", "noopener");
}

function renderStaffList(filterQuery = "") {
  const listEl = document.getElementById("ops-staff-list");
  if (!listEl) return;

  const q = filterQuery.trim().toLowerCase();
  const filtered = state.staff.filter((s) => {
    if (!q) return true;
    return `${s.name || ""} ${s.email || ""} ${s.jobTitle || ""}`.toLowerCase().includes(q);
  });

  if (!filtered.length) {
    listEl.innerHTML = `<div class="empty-state">لا يوجد صحفيون مسجلون يطابقون البحث.</div>`;
    return;
  }

  listEl.innerHTML = filtered
    .map((s) => {
      const avatar =
        s.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || "صحفي")}&background=1d4ed8&color=fff`;

      const statusBadges = [];
      statusBadges.push(`<span class="role-badge">${escapeHtml(getRoleArabicName(s.role))}</span>`);

      if (s.verified) {
        statusBadges.push(
          `<span class="status-pill status-published"><span class="material-symbols-rounded" style="font-size:14px;" translate="no">verified</span> موثق بالشارة الزرقاء</span>`
        );
      }
      if (s.requireReview) {
        statusBadges.push(
          `<span class="status-pill status-review"><span class="material-symbols-rounded" style="font-size:14px;" translate="no">policy</span> مقيد بالمراجعة الإلزامية</span>`
        );
      }
      if (s.suspended) {
        statusBadges.push(
          `<span class="status-pill status-breaking"><span class="material-symbols-rounded" style="font-size:14px;" translate="no">block</span> حساب مجمد</span>`
        );
      }

      return `
        <article class="staff-member-card">
          <div class="staff-top-row">
            <div class="staff-identity">
              <img src="${escapeHtml(avatar)}" alt="${escapeHtml(s.name)}" class="staff-avatar-img">
              <div>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                  <strong style="font-size:1rem;">${escapeHtml(s.name || "بدون اسم")}</strong>
                  ${statusBadges.join("")}
                </div>
                <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;">
                  <span>${escapeHtml(s.email)}</span>
                  ${s.phone ? ` | <span dir="ltr">${escapeHtml(s.phone)}</span>` : ""}
                  ${s.jobTitle ? ` | <span>${escapeHtml(s.jobTitle)}</span>` : ""}
                </div>
              </div>
            </div>
          </div>

          <div class="staff-actions-bar">
            <button type="button" class="btn-success sm-btn" data-staff-wa="${escapeHtml(s.id)}">
              <span class="material-symbols-rounded" translate="no">chat</span>
              <span>ترحيب وميثاق (واتساب)</span>
            </button>

            <button type="button" class="btn-primary sm-btn" data-staff-mail="${escapeHtml(s.id)}">
              <span class="material-symbols-rounded" translate="no">mail</span>
              <span>ترحيب وميثاق (Gmail)</span>
            </button>

            <button type="button" class="btn-outline sm-btn" data-staff-edit="${escapeHtml(s.id)}">
              <span class="material-symbols-rounded" translate="no">edit</span>
              <span>تعديل</span>
            </button>

            <button type="button" class="btn-outline sm-btn" data-staff-toggle-review="${escapeHtml(s.id)}">
              <span class="material-symbols-rounded" translate="no">policy</span>
              <span>${s.requireReview ? "إلغاء تقييد المراجعة" : "تقييد للمراجعة"}</span>
            </button>

            <button type="button" class="btn-outline sm-btn" data-staff-alert="${escapeHtml(s.id)}">
              <span class="material-symbols-rounded" translate="no">notification_important</span>
              <span>إرسال تنبيه</span>
            </button>

            <button type="button" class="btn-outline sm-btn danger-icon-btn" data-staff-delete="${escapeHtml(s.id)}" title="حذف الصحفي">
              <span class="material-symbols-rounded" translate="no">delete</span>
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  // ربط أزرار الترحيب والتعديل والتقييد والتنبيه لكل صحفي
  listEl.querySelectorAll("[data-staff-wa]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const member = state.staff.find((m) => m.id === btn.getAttribute("data-staff-wa"));
      if (member) sendStaffWelcomeWhatsApp(member);
    });
  });

  listEl.querySelectorAll("[data-staff-mail]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const member = state.staff.find((m) => m.id === btn.getAttribute("data-staff-mail"));
      if (member) sendStaffWelcomeEmail(member);
    });
  });

  listEl.querySelectorAll("[data-staff-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const member = state.staff.find((m) => m.id === btn.getAttribute("data-staff-edit"));
      if (member) populateStaffFormForEdit(member);
    });
  });

  listEl.querySelectorAll("[data-staff-toggle-review]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-staff-toggle-review");
      const member = state.staff.find((m) => m.id === id);
      if (!member) return;
      const newState = !member.requireReview;
      await updateDoc(doc(db, "staff", id), { requireReview: newState });
      showOpsToast(
        newState
          ? `تم تقييد نشر (${member.name}) للمراجعة الإلزامية مع احتفاظه بشارته`
          : `تم رفع تقييد المراجعة عن (${member.name})`
      );
    });
  });

  listEl.querySelectorAll("[data-staff-alert]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-staff-alert");
      const member = state.staff.find((m) => m.id === id);
      if (!member) return;
      const msg = window.prompt(
        `اكتب نص التنبيه الإداري الموجه للصحفي (${member.name}) ليظهر في أعلى شاشته (أو اتركه فارغاً لمسح التنبيه):`,
        member.adminAlert || ""
      );
      if (msg === null) return;
      await updateDoc(doc(db, "staff", id), { adminAlert: msg.trim() });
      showOpsToast("تم تحديث التنبيه الإداري للصحفي بنجاح");
    });
  });

  listEl.querySelectorAll("[data-staff-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-staff-delete");
      const member = state.staff.find((m) => m.id === id);
      if (!member) return;
      if (!window.confirm(`هل أنت متأكد من حذف الصحفي (${member.name}) من سجل الكادر؟`)) return;
      await deleteDoc(doc(db, "staff", id));
      showOpsToast("تم حذف عضو الكادر بنجاح");
    });
  });
}

function populateStaffFormForEdit(member) {
  document.getElementById("staff-form-title").textContent = `تعديل بيانات: ${member.name}`;
  document.getElementById("staff-name").value = member.name || "";
  document.getElementById("staff-email").value = member.email || member.id || "";
  document.getElementById("staff-phone").value = member.phone || "";
  document.getElementById("staff-role").value = member.role || "writer";
  document.getElementById("staff-job-title").value = member.jobTitle || "";
  document.getElementById("staff-avatar").value = member.avatar || "";
  document.getElementById("staff-bio").value = member.bio || "";
  document.getElementById("staff-verified").checked = Boolean(member.verified);
  document.getElementById("staff-require-review").checked = Boolean(member.requireReview);
  document.getElementById("staff-suspended").checked = Boolean(member.suspended);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetStaffForm() {
  document.getElementById("staff-form-title").textContent = "إضافة أو تعديل عضو في الكادر الصحفي";
  document.getElementById("staff-form")?.reset();
}

async function saveStaffMember(e) {
  e.preventDefault();
  if (!isUserAdmin()) {
    showOpsToast("إدارة الكادر مخصصة للقيادة العليا فقط");
    return;
  }

  const emailKey = (document.getElementById("staff-email")?.value || "").trim().toLowerCase();
  const name = (document.getElementById("staff-name")?.value || "").trim();
  if (!emailKey || !name) {
    showOpsToast("يرجى إدخال اسم الصحفي وبريده الإلكتروني");
    return;
  }

  const payload = {
    name,
    email: emailKey,
    phone: (document.getElementById("staff-phone")?.value || "").trim(),
    role: document.getElementById("staff-role")?.value || "writer",
    jobTitle: (document.getElementById("staff-job-title")?.value || "").trim() || "كاتب ومحرر صحفي",
    avatar: (document.getElementById("staff-avatar")?.value || "").trim(),
    bio: (document.getElementById("staff-bio")?.value || "").trim(),
    verified: Boolean(document.getElementById("staff-verified")?.checked),
    requireReview: Boolean(document.getElementById("staff-require-review")?.checked),
    suspended: Boolean(document.getElementById("staff-suspended")?.checked),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, "staff", emailKey), payload, { merge: true });
    showOpsToast(`تم حفظ بيانات الصحفي (${name}) بنجاح`);
    resetStaffForm();
  } catch (err) {
    console.error("Save staff error:", err);
    showOpsToast("حدث خطأ أثناء حفظ بيانات الصحفي");
  }
}

// ==================== 8. إدارة البوصلات والأقسام والفئات الفرعية ====================
function renderCompassesManagerList() {
  const listEl = document.getElementById("ops-compasses-list");
  if (!listEl) return;

  const sorted = [...state.compasses].sort((a, b) => (a.order || 99) - (b.order || 99));

  listEl.innerHTML = sorted
    .map((c) => {
      const isVisible = c.visible !== false;
      const subs = Array.isArray(c.subcategories) ? c.subcategories : [];
      return `
        <article class="ops-item-card" style="border-right: 4px solid ${c.color || "#b91c1c"};">
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="material-symbols-rounded" style="color:${c.color || "#b91c1c"};" translate="no">${c.icon || "explore"}</span>
                <strong>${escapeHtml(c.name)}</strong>
              </div>
              <span class="status-pill ${isVisible ? "status-published" : "status-draft"}">
                ${isVisible ? "ظاهر" : "مخفي"}
              </span>
            </div>
            <p style="font-size:0.78rem;color:var(--text-muted);margin:6px 0;">${escapeHtml(c.description || "")}</p>
            ${
              subs.length
                ? `<div style="font-size:0.74rem;color:var(--text-secondary);"><strong>الفئات الفرعية:</strong> ${subs.map(escapeHtml).join(" ، ")}</div>`
                : ""
            }
          </div>

          <div class="ops-post-actions" style="padding-top:8px;border-top:1px solid var(--border-color);">
            <button type="button" class="btn-outline sm-btn" data-compass-edit="${escapeHtml(c.id)}">
              <span class="material-symbols-rounded" translate="no">edit</span>
              <span>تعديل</span>
            </button>

            <button type="button" class="btn-outline sm-btn" data-compass-toggle="${escapeHtml(c.id)}">
              <span class="material-symbols-rounded" translate="no">${isVisible ? "visibility_off" : "visibility"}</span>
              <span>${isVisible ? "إخفاء" : "إظهار"}</span>
            </button>

            <button type="button" class="btn-outline sm-btn danger-icon-btn" data-compass-del="${escapeHtml(c.id)}" title="حذف القسم">
              <span class="material-symbols-rounded" translate="no">delete</span>
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  listEl.querySelectorAll("[data-compass-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const comp = state.compasses.find((c) => c.id === btn.getAttribute("data-compass-edit"));
      if (comp) populateCompassFormForEdit(comp);
    });
  });

  listEl.querySelectorAll("[data-compass-toggle]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-compass-toggle");
      const comp = state.compasses.find((c) => c.id === id);
      if (!comp) return;
      const nextVis = comp.visible === false ? true : false;
      await setDoc(doc(db, "categories", id), { ...comp, visible: nextVis }, { merge: true });
      showOpsToast(nextVis ? `تم إظهار (${comp.name}) في الموقع العام` : `تم إخفاء (${comp.name}) من الموقع العام`);
    });
  });

  listEl.querySelectorAll("[data-compass-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-compass-del");
      const comp = state.compasses.find((c) => c.id === id);
      if (!comp) return;
      if (!window.confirm(`هل تريد حذف القسم (${comp.name}) نهائياً؟`)) return;
      await deleteDoc(doc(db, "categories", id));
      state.compasses = state.compasses.filter((c) => c.id !== id);
      renderCompassesManagerList();
      showOpsToast("تم حذف القسم بنجاح");
    });
  });
}

function populateCompassFormForEdit(comp) {
  document.getElementById("compass-form-title").textContent = `تعديل: ${comp.name}`;
  document.getElementById("compass-edit-id").value = comp.id;
  document.getElementById("compass-name").value = comp.name || "";
  document.getElementById("compass-icon").value = comp.icon || "explore";
  document.getElementById("compass-color").value = comp.color || "#b91c1c";
  document.getElementById("compass-flag-url").value = comp.flagUrl || "";
  document.getElementById("compass-desc").value = comp.description || "";
  document.getElementById("compass-subcategories").value = Array.isArray(comp.subcategories)
    ? comp.subcategories.join(", ")
    : "";
  document.getElementById("compass-order").value = comp.order || 1;
  document.getElementById("compass-visible").checked = comp.visible !== false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetCompassForm() {
  document.getElementById("compass-form-title").textContent = "إضافة أو تعديل بوصلة / قسم";
  document.getElementById("compass-edit-id").value = "";
  document.getElementById("compass-form")?.reset();
}

async function saveCompassItem(e) {
  e.preventDefault();
  const editId = (document.getElementById("compass-edit-id")?.value || "").trim();
  const name = (document.getElementById("compass-name")?.value || "").trim();
  if (!name) return;

  const id = editId || "compass-" + Date.now();
  const subsRaw = (document.getElementById("compass-subcategories")?.value || "").trim();
  const subcategories = subsRaw
    ? subsRaw.split(/[,،]/).map((s) => s.trim()).filter(Boolean)
    : [];

  const payload = {
    id,
    name,
    slug: id,
    icon: document.getElementById("compass-icon")?.value || "explore",
    color: document.getElementById("compass-color")?.value || "#b91c1c",
    flagUrl: (document.getElementById("compass-flag-url")?.value || "").trim(),
    description: (document.getElementById("compass-desc")?.value || "").trim(),
    subcategories,
    order: Number(document.getElementById("compass-order")?.value || 1),
    visible: Boolean(document.getElementById("compass-visible")?.checked),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, "categories", id), payload, { merge: true });
    showOpsToast(`تم حفظ البوصلة (${name}) بنجاح`);
    resetCompassForm();
  } catch (err) {
    console.error("Save compass error:", err);
    showOpsToast("حدث خطأ أثناء حفظ القسم");
  }
}

async function seedDefaultCompassesToDb() {
  try {
    for (const comp of DEFAULT_COMPASSES) {
      await setDoc(doc(db, "categories", comp.id), comp, { merge: true });
    }
    showOpsToast("تمت استعادة وتثبيت كافة البوصلات الأساسية بنجاح");
  } catch (err) {
    console.error("Seed compasses error:", err);
    showOpsToast("تعذر استعادة الأقسام الأساسية");
  }
}

// ==================== 9. إدارة الإعلانات والرعايات (Ads Manager) ====================
function renderAdsManagerList() {
  const listEl = document.getElementById("ops-ads-list");
  if (!listEl) return;

  if (!state.ads.length) {
    listEl.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">لا توجد حملات إعلانية مسجلة حالياً.</div>`;
    return;
  }

  listEl.innerHTML = state.ads
    .map((ad) => {
      const isActive = ad.active !== false;
      return `
        <article class="ops-item-card">
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <strong>${escapeHtml(ad.title)}</strong>
              <span class="status-pill ${isActive ? "status-published" : "status-draft"}">
                ${isActive ? "نشط" : "متوقف"}
              </span>
            </div>
            <p style="font-size:0.78rem;color:var(--text-muted);margin:4px 0;">
              الراعي: ${escapeHtml(ad.sponsorName || "شركاء البوصلة")} | النقرات: <strong>${ad.clicks || 0}</strong>
            </p>
          </div>

          <div class="ops-post-actions" style="padding-top:8px;border-top:1px solid var(--border-color);">
            <button type="button" class="btn-outline sm-btn" data-ad-edit="${escapeHtml(ad.id)}">
              <span class="material-symbols-rounded" translate="no">edit</span>
              <span>تعديل</span>
            </button>

            <button type="button" class="btn-outline sm-btn" data-ad-toggle="${escapeHtml(ad.id)}">
              <span class="material-symbols-rounded" translate="no">${isActive ? "pause_circle" : "play_circle"}</span>
              <span>${isActive ? "إيقاف" : "تفعيل"}</span>
            </button>

            <button type="button" class="btn-outline sm-btn danger-icon-btn" data-ad-del="${escapeHtml(ad.id)}">
              <span class="material-symbols-rounded" translate="no">delete</span>
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  listEl.querySelectorAll("[data-ad-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const ad = state.ads.find((a) => a.id === btn.getAttribute("data-ad-edit"));
      if (ad) populateAdFormForEdit(ad);
    });
  });

  listEl.querySelectorAll("[data-ad-toggle]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-ad-toggle");
      const ad = state.ads.find((a) => a.id === id);
      if (!ad) return;
      await updateDoc(doc(db, "ads", id), { active: ad.active === false ? true : false });
      showOpsToast("تم تحديث حالة الحملة الإعلانية");
    });
  });

  listEl.querySelectorAll("[data-ad-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-ad-del");
      if (!window.confirm("هل تريد حذف هذا الإعلان نهائياً؟")) return;
      await deleteDoc(doc(db, "ads", id));
      showOpsToast("تم حذف الحملة الإعلانية");
    });
  });
}

function populateAdFormForEdit(ad) {
  document.getElementById("ad-form-title").textContent = `تعديل إعلان: ${ad.title}`;
  document.getElementById("ad-edit-id").value = ad.id;
  document.getElementById("ad-title").value = ad.title || "";
  document.getElementById("ad-sponsor").value = ad.sponsorName || "";
  document.getElementById("ad-style-type").value = ad.styleType || "glass";
  document.getElementById("ad-image-url").value = ad.imageUrl || "";
  document.getElementById("ad-target-url").value = ad.targetUrl || "";
  document.getElementById("ad-active").checked = ad.active !== false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetAdForm() {
  document.getElementById("ad-form-title").textContent = "إضافة أو تعديل حملة إعلانية";
  document.getElementById("ad-edit-id").value = "";
  document.getElementById("ad-form")?.reset();
}

async function saveAdItem(e) {
  e.preventDefault();
  const editId = (document.getElementById("ad-edit-id")?.value || "").trim();
  const title = (document.getElementById("ad-title")?.value || "").trim();
  const targetUrl = (document.getElementById("ad-target-url")?.value || "").trim();
  if (!title || !targetUrl) return;

  const payload = {
    title,
    sponsorName: (document.getElementById("ad-sponsor")?.value || "").trim() || "شركاء شبكة البوصلة",
    styleType: document.getElementById("ad-style-type")?.value || "glass",
    imageUrl: (document.getElementById("ad-image-url")?.value || "").trim(),
    targetUrl,
    active: Boolean(document.getElementById("ad-active")?.checked),
    updatedAt: serverTimestamp()
  };

  try {
    if (editId) {
      await setDoc(doc(db, "ads", editId), payload, { merge: true });
    } else {
      await addDoc(collection(db, "ads"), { ...payload, clicks: 0, createdAt: serverTimestamp() });
    }
    showOpsToast("تم حفظ وتحديث الإعلان بنجاح");
    resetAdForm();
  } catch (err) {
    console.error("Save ad error:", err);
    showOpsToast("تعذر حفظ الإعلان");
  }
}

// ------------------- نهاية الجزء الأول من غرفة العمليات -------------------
