/* ==========================================================================
   غرفة العمليات المركزية — شبكة البوصلة الإخبارية (RAWI-YE.COM)
   المحرك البرمجي (app.js) — الجزء الأول:
   الاتصال بقاعدة البيانات، المصادقة، الإعدادات السيادية، الكادر، البوصلات، والإعلانات
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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

// ==================== 1. إعدادات الاتصال الرسمية بقاعدة بيانات Firebase ====================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAd4Df_Fpp2GlGkRPyvmKuFW68LbL_a4yU",
  authDomain: "rawi-01.firebaseapp.com",
  databaseURL: "https://rawi-01-default-rtdb.firebaseio.com",
  projectId: "rawi-01",
  storageBucket: "rawi-01.firebasestorage.app",
  messagingSenderId: "91203142966",
  appId: "1:91203142966:web:a44f7c06c98529a57a9f97",
  measurementId: "G-2VNWNSZLBJ"
};

// حفظ الإعدادات الصحيحة في المتصفح لضمان عدم بقاء أي مفاتيح قديمة
try {
  localStorage.setItem("bawsala_firebase_config", JSON.stringify(FIREBASE_CONFIG));
} catch (_) {}

const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
auth.languageCode = "ar";
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// مفتاح منصة رفع الصور (ImgBB API Key) الخاص بك
const IMGBB_API_KEY = "c2fd857fff0abe7b1a8a33b57cb621c6";
const PUBLIC_SITE_URL = "https://networkbawsala.rawi-ye.com";

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
  window.__opsToastTimer = setTimeout(() => toast.classList.add("hidden"), 3500);
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

function isUserAdmin() {
  return Boolean(state.userProfile && state.userProfile.role === "admin");
}

function isUserEditorOrAdmin() {
  return Boolean(
    state.userProfile && (state.userProfile.role === "admin" || state.userProfile.role === "editor")
  );
}

function canUserPublishDirectly() {
  if (!state.userProfile) return false;
  if (state.userProfile.role === "admin" || state.userProfile.role === "editor") return true;
  if (state.userProfile.requireReview) return false;
  return Boolean(state.userProfile.verified);
}

function getRoleArabicName(role) {
  if (role === "admin") return "قيادة عليا (مدير عام)";
  if (role === "editor") return "محرر ومراجع صحفي";
  return "كاتب وصحفي";
}

// ==================== 5. منظومة المصادقة وتسجيل الدخول المزدوجة (الهواتف والكمبيوتر) ====================
async function triggerGoogleLogin() {
  const errBox = document.getElementById("auth-error-box");
  const errText = document.getElementById("auth-error-text");
  const loginBtn = document.getElementById("google-login-btn");

  errBox?.classList.add("hidden");
  if (loginBtn) loginBtn.disabled = true;

  try {
    // المحاولة الأولى: فتح نافذة Google المباشرة بالمفاتيح الرسمية الصحيحة
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.warn("Popup sign-in notice:", err?.code || err);

    // إذا كان متصفح الهاتف يمنع النوافذ المنبثقة أو يدعم إعادة التوجيه فقط، نتحول فوراً إلى Redirect
    if (
      err?.code === "auth/popup-blocked" ||
      err?.code === "auth/cancelled-popup-request" ||
      err?.code === "auth/operation-not-supported-in-this-environment"
    ) {
      try {
        showOpsToast("جاري توجيهك لصفحة تسجيل الدخول الآمنة من Google...");
        await signInWithRedirect(auth, googleProvider);
        return;
      } catch (redirErr) {
        console.error("Redirect sign-in error:", redirErr);
      }
    }

    if (err?.code !== "auth/popup-closed-by-user") {
      if (errBox && errText) {
        errText.textContent = `تعذر تسجيل الدخول (${err?.code || "خطأ في الاتصال"}). تأكد من إضافة نطاق الموقع في Authorized domains داخل Firebase.`;
        errBox.classList.remove("hidden");
      }
    }
  } finally {
    if (loginBtn) loginBtn.disabled = false;
  }
}

async function checkPendingRedirectLogin() {
  try {
    await getRedirectResult(auth);
  } catch (err) {
    console.warn("Redirect result check:", err);
  }
}

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
      profileData = {
        id: emailKey,
        email: emailKey,
        name: firebaseUser.displayName || emailKey.split("@")[0],
        avatar: firebaseUser.photoURL || "",
        role: "admin",
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

  const alertBar = document.getElementById("staff-alert-bar");
  const alertMsg = document.getElementById("staff-alert-message");
  if (p.adminAlert && p.adminAlert.trim() !== "") {
    if (alertMsg) alertMsg.textContent = p.adminAlert;
    alertBar?.classList.remove("hidden");
  } else {
    alertBar?.classList.add("hidden");
  }

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
/* ==========================================================================
   غرفة العمليات المركزية — شبكة البوصلة الإخبارية (RAWI-YE.COM)
   المحرك البرمجي (app.js) — الجزء الثاني والأخير:
   إدارة المنشورات، الفلترة، المعاينة، المحرر المتقدم، رفع الصور، والعواجل الموقوتة
   ========================================================================== */

// ==================== 10. تحديث قوائم البوصلات والكتّاب في الفلاتر والمحرر ====================
function getActiveCompassesList() {
  return [...state.compasses].sort((a, b) => (a.order || 99) - (b.order || 99));
}

function getPostCompasses(post) {
  const list = [];
  if (Array.isArray(post.categories)) list.push(...post.categories);
  if (post.category && !list.includes(post.category)) list.push(post.category);
  if (post.compassId && !list.includes(post.compassId)) list.push(post.compassId);
  return list.length ? list : ["بوصلة السياسة اليمنية"];
}

function isBreakingStillActive(post) {
  if (!post || !post.isBreaking) return false;
  const now = Date.now();
  if (post.breakingExpiresAt) {
    const exp =
      typeof post.breakingExpiresAt === "number"
        ? post.breakingExpiresAt
        : new Date(post.breakingExpiresAt).getTime();
    if (exp && now > exp) return false;
  } else if (post.breakingDurationHours) {
    const createdMs = getPostTimestampMs(post);
    const durationMs = Number(post.breakingDurationHours) * 3600 * 1000;
    if (createdMs && durationMs > 0 && now > createdMs + durationMs) return false;
  }
  return true;
}

function populateCompassSelectorsAndFilters() {
  const compasses = getActiveCompassesList();

  // 1. فلتر البوصلات في لوحة المتابعة
  const filterCompass = document.getElementById("ops-filter-compass");
  if (filterCompass) {
    const currentVal = filterCompass.value || "all";
    filterCompass.innerHTML = [
      `<option value="all">جميع البوصلات والأقسام</option>`,
      ...compasses.map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`)
    ].join("");
    filterCompass.value = currentVal;
  }

  // 2. قائمة البوصلات في نافذة الخبر العاجل السريع
  const quickCompass = document.getElementById("quick-news-compass");
  if (quickCompass) {
    quickCompass.innerHTML = compasses
      .map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`)
      .join("");
  }

  // 3. شبكة الاختيار المتعدد للبوصلات داخل محرر المقالات
  const multiGrid = document.getElementById("multi-compass-selector");
  if (multiGrid) {
    const currentlyChecked = Array.from(
      multiGrid.querySelectorAll('input[name="post-compass-item"]:checked')
    ).map((el) => el.value);

    multiGrid.innerHTML = compasses
      .map((c, idx) => {
        const isChecked = currentlyChecked.length
          ? currentlyChecked.includes(c.name)
          : idx === 0;
        return `
          <label class="compass-check-item">
            <input type="checkbox" name="post-compass-item" value="${escapeHtml(c.name)}" ${
              isChecked ? "checked" : ""
            }>
            <span class="material-symbols-rounded" style="font-size:17px;color:${
              c.color || "var(--primary)"
            };" translate="no">${c.icon || "explore"}</span>
            <span>${escapeHtml(c.name)}</span>
          </label>
        `;
      })
      .join("");
  }

  // 4. قائمة الاقتراحات للفئات الفرعية (Datalist)
  const subDatalist = document.getElementById("subcategories-datalist");
  if (subDatalist) {
    const allSubs = new Set();
    compasses.forEach((c) => {
      if (Array.isArray(c.subcategories)) {
        c.subcategories.forEach((s) => allSubs.add(s));
      }
    });
    subDatalist.innerHTML = Array.from(allSubs)
      .map((s) => `<option value="${escapeHtml(s)}"></option>`)
      .join("");
  }
}

function populateAuthorFilterDropdown() {
  const authorSelect = document.getElementById("ops-filter-author");
  if (!authorSelect) return;

  const currentVal = authorSelect.value || "all";
  const authorsSet = new Set();

  state.staff.forEach((s) => {
    if (s.name) authorsSet.add(s.name);
  });
  state.posts.forEach((p) => {
    if (p.author) authorsSet.add(p.author);
  });

  authorSelect.innerHTML = [
    `<option value="all">جميع الكتّاب</option>`,
    ...Array.from(authorsSet).map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
  ].join("");
  authorSelect.value = currentVal;
}

// ==================== 11. لوحة المتابعة، الإحصائيات السرية، وفلترة المنشورات ====================
function updateDashboardStats() {
  const publishedCount = state.posts.filter(
    (p) => !p.status || p.status === "published"
  ).length;
  const reviewCount = state.posts.filter(
    (p) => p.status === "review" || p.status === "pending"
  ).length;
  const breakingCount = state.posts.filter(
    (p) => (!p.status || p.status === "published") && (isBreakingStillActive(p) || p.isQuickNews)
  ).length;
  const totalViews = state.posts.reduce((acc, p) => acc + (Number(p.views) || 0), 0);

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = Number(val).toLocaleString("ar-YE");
  };

  setTxt("stat-published-count", publishedCount);
  setTxt("stat-review-count", reviewCount);
  setTxt("stat-breaking-count", breakingCount);
  setTxt("stat-total-views", totalViews);
}

function renderOpsPostsList() {
  const listEl = document.getElementById("ops-posts-list");
  if (!listEl) return;

  updateDashboardStats();

  const searchQ = (document.getElementById("ops-posts-search")?.value || "").trim().toLowerCase();
  const statusFilter = document.getElementById("ops-filter-status")?.value || "all";
  const compassFilter = document.getElementById("ops-filter-compass")?.value || "all";
  const authorFilter = document.getElementById("ops-filter-author")?.value || "all";

  let filtered = [...state.posts];

  if (!isUserEditorOrAdmin() && state.userProfile) {
    const myEmail = (state.userProfile.email || "").toLowerCase();
    const myName = state.userProfile.name || "";
    filtered = filtered.filter(
      (p) =>
        (p.authorEmail && p.authorEmail.toLowerCase() === myEmail) ||
        p.author === myName ||
        !p.status ||
        p.status === "published"
    );
  }

  if (statusFilter !== "all") {
    if (statusFilter === "published") {
      filtered = filtered.filter((p) => !p.status || p.status === "published");
    } else if (statusFilter === "review") {
      filtered = filtered.filter((p) => p.status === "review" || p.status === "pending");
    } else if (statusFilter === "draft") {
      filtered = filtered.filter((p) => p.status === "draft");
    } else if (statusFilter === "breaking") {
      filtered = filtered.filter((p) => isBreakingStillActive(p) || p.isQuickNews);
    }
  }

  if (compassFilter !== "all") {
    filtered = filtered.filter((p) => getPostCompasses(p).includes(compassFilter));
  }

  if (authorFilter !== "all") {
    filtered = filtered.filter((p) => p.author === authorFilter);
  }

  if (searchQ) {
    filtered = filtered.filter((p) => {
      const hay = `${p.title || ""} ${p.summary || ""} ${p.author || ""} ${(p.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(searchQ);
    });
  }

  if (!filtered.length) {
    listEl.innerHTML = `<div class="empty-state">لا توجد منشورات تطابق خيارات الفلترة الحالية.</div>`;
    return;
  }

  listEl.innerHTML = filtered
    .map((post) => {
      const status = post.status || "published";
      let statusBadgeHtml = `<span class="status-pill status-published"><span class="material-symbols-rounded" style="font-size:14px;" translate="no">check_circle</span> منشور</span>`;
      if (status === "review" || status === "pending") {
        statusBadgeHtml = `<span class="status-pill status-review"><span class="material-symbols-rounded" style="font-size:14px;" translate="no">pending_actions</span> قيد المراجعة</span>`;
      } else if (status === "draft") {
        statusBadgeHtml = `<span class="status-pill status-draft"><span class="material-symbols-rounded" style="font-size:14px;" translate="no">draft</span> مسودة</span>`;
      }

      const breakingBadge = isBreakingStillActive(post)
        ? `<span class="status-pill status-breaking"><span class="material-symbols-rounded" style="font-size:14px;" translate="no">bolt</span> عاجل نشط</span>`
        : "";

      const compassesStr = getPostCompasses(post).join(" ، ");
      const thumb =
        post.imageUrl ||
        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=300&q=60";

      const canManagePost =
        isUserEditorOrAdmin() ||
        (state.userProfile &&
          ((post.authorEmail &&
            post.authorEmail.toLowerCase() === (state.userProfile.email || "").toLowerCase()) ||
            post.author === state.userProfile.name));

      const showApproveBtn =
        isUserEditorOrAdmin() && (status === "review" || status === "pending" || status === "draft");

      return `
        <article class="ops-post-row">
          <div class="ops-post-info">
            <img src="${escapeHtml(thumb)}" alt="" class="ops-post-thumb" loading="lazy">
            <div>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
                ${statusBadgeHtml}
                ${breakingBadge}
                <span class="views-secret-badge" title="عدد القراءات (سري للإدارة والكاتب فقط)">
                  <span class="material-symbols-rounded" style="font-size:14px;" translate="no">visibility</span>
                  <span>${Number(post.views || 0).toLocaleString("ar-YE")} قراءة</span>
                </span>
              </div>
              <h3 class="ops-post-title">${escapeHtml(post.title)}</h3>
              <div class="ops-post-meta">
                <span>الكاتب: <strong>${escapeHtml(post.author || "هيئة التحرير")}</strong></span>
                <span>|</span>
                <span>البوصلة: ${escapeHtml(compassesStr)}</span>
                <span>|</span>
                <span>${formatArabicDate(post.createdAt)}</span>
              </div>
            </div>
          </div>

          <div class="ops-post-actions">
            <button type="button" class="btn-outline sm-btn" data-post-preview="${escapeHtml(post.id)}" title="فتح ومعاينة المنشور في غرفة العمليات">
              <span class="material-symbols-rounded" translate="no">visibility</span>
              <span>معاينة</span>
            </button>

            ${
              showApproveBtn
                ? `<button type="button" class="btn-success sm-btn" data-post-approve="${escapeHtml(post.id)}">
                    <span class="material-symbols-rounded" translate="no">check_circle</span>
                    <span>اعتماد ونشر</span>
                  </button>`
                : ""
            }

            ${
              canManagePost
                ? `<button type="button" class="btn-outline sm-btn" data-post-edit="${escapeHtml(post.id)}">
                    <span class="material-symbols-rounded" translate="no">edit</span>
                    <span>تعديل</span>
                  </button>`
                : ""
            }

            <a href="${PUBLIC_SITE_URL}/?post=${encodeURIComponent(post.id)}" target="_blank" rel="noopener noreferrer" class="btn-outline sm-btn" title="فتح الرابط المباشر في الموقع العام">
              <span class="material-symbols-rounded" translate="no">open_in_new</span>
            </a>

            ${
              canManagePost
                ? `<button type="button" class="btn-outline sm-btn danger-icon-btn" data-post-delete="${escapeHtml(post.id)}" title="حذف المنشور">
                    <span class="material-symbols-rounded" translate="no">delete</span>
                  </button>`
                : ""
            }
          </div>
        </article>
      `;
    })
    .join("");

  listEl.querySelectorAll("[data-post-preview]").forEach((btn) => {
    btn.addEventListener("click", () => openPostPreviewModal(btn.getAttribute("data-post-preview")));
  });

  listEl.querySelectorAll("[data-post-approve]").forEach((btn) => {
    btn.addEventListener("click", () => approveAndPublishPost(btn.getAttribute("data-post-approve")));
  });

  listEl.querySelectorAll("[data-post-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const post = state.posts.find((p) => p.id === btn.getAttribute("data-post-edit"));
      if (post) populateEditorForPost(post);
    });
  });

  listEl.querySelectorAll("[data-post-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deletePostItem(btn.getAttribute("data-post-delete")));
  });
}

async function approveAndPublishPost(postId) {
  if (!isUserEditorOrAdmin()) {
    showOpsToast("اعتماد المقالات مخصص للمحررين والقيادة فقط");
    return;
  }
  try {
    await updateDoc(doc(db, "posts", postId), {
      status: "published",
      approvedBy: state.userProfile?.name || state.currentUser?.email || "الإدارة",
      approvedAt: serverTimestamp()
    });
    showOpsToast("تم اعتماد المادة ونشرها في الموقع العام بنجاح");
    document.getElementById("article-preview-modal")?.classList.add("hidden");
  } catch (err) {
    console.error("Approve post error:", err);
    showOpsToast("تعذر اعتماد المنشور");
  }
}

async function deletePostItem(postId) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;
  if (!window.confirm(`هل أنت متأكد من حذف المنشور: "${post.title}" نهائياً؟`)) return;
  try {
    await deleteDoc(doc(db, "posts", postId));
    showOpsToast("تم حذف المنشور بنجاح");
  } catch (err) {
    console.error("Delete post error:", err);
    showOpsToast("حدث خطأ أثناء حذف المنشور");
  }
}

// ==================== 12. نافذة فتح ومعاينة المنشور داخل غرفة العمليات ====================
function openPostPreviewModal(postId) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;

  state.previewPostId = postId;
  const modal = document.getElementById("article-preview-modal");
  if (!modal) return;

  const compasses = getPostCompasses(post);
  const status = post.status || "published";

  const badgesEl = document.getElementById("preview-badges");
  if (badgesEl) {
    badgesEl.innerHTML = [
      `<span class="status-pill ${
        status === "published" ? "status-published" : status === "review" ? "status-review" : "status-draft"
      }">${status === "published" ? "منشور" : status === "review" ? "قيد المراجعة" : "مسودة"}</span>`,
      ...compasses.map((c) => `<span class="role-badge">${escapeHtml(c)}</span>`)
    ].join("");
  }

  document.getElementById("preview-title").textContent = post.title || "";
  const sumEl = document.getElementById("preview-summary");
  if (sumEl) {
    sumEl.textContent = post.summary || "";
    sumEl.classList.toggle("hidden", !post.summary);
  }

  document.getElementById("preview-meta").textContent = `الكاتب: ${
    post.author || "هيئة التحرير"
  } | التاريخ: ${formatArabicDate(post.createdAt)} | القراءات: ${post.views || 0}`;

  const mediaEl = document.getElementById("preview-media");
  if (mediaEl) {
    mediaEl.innerHTML = post.imageUrl
      ? `<img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}">`
      : "";
  }

  const contentEl = document.getElementById("preview-content");
  if (contentEl) {
    contentEl.innerHTML = post.content || "";
  }

  const approveBtn = document.getElementById("preview-approve-btn");
  if (approveBtn) {
    const canApprove = isUserEditorOrAdmin() && status !== "published";
    approveBtn.classList.toggle("hidden", !canApprove);
    approveBtn.onclick = () => approveAndPublishPost(post.id);
  }

  const editBtn = document.getElementById("preview-edit-btn");
  if (editBtn) {
    editBtn.onclick = () => {
      modal.classList.add("hidden");
      populateEditorForPost(post);
    };
  }

  modal.classList.remove("hidden");
}

// ==================== 13. محرر المقالات المتقدم، رفع الصور، وتعدد البوصلات ====================
async function handleEditorImageUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const statusEl = document.getElementById("image-upload-status");
  if (statusEl) statusEl.textContent = "جاري رفع الصورة وتجهيز الرابط المباشر...";

  try {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();

    if (data && data.success && data.data?.url) {
      const urlInput = document.getElementById("post-image-url");
      if (urlInput) urlInput.value = data.data.url;
      if (statusEl) statusEl.textContent = "تم رفع الصورة وإدراج رابطها بنجاح";
      showOpsToast("تم رفع الصورة بنجاح");
    } else {
      throw new Error("Upload failed");
    }
  } catch (err) {
    console.error("Image upload error:", err);
    if (statusEl) statusEl.textContent = "تعذر الرفع التلقائي، يمكنك وضع رابط مباشر للصورة";
    showOpsToast("تعذر رفع الصورة، يرجى المحاولة مرة أخرى أو لصق رابط الصورة");
  }
}

function applyToolbarFormatting(formatType) {
  const textarea = document.getElementById("post-content");
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end) || "النص هنا";
  let replacement = selected;

  if (formatType === "h2") {
    replacement = `\n<h2>${selected}</h2>\n`;
  } else if (formatType === "h3") {
    replacement = `\n<h3>${selected}</h3>\n`;
  } else if (formatType === "bold") {
    replacement = `<strong>${selected}</strong>`;
  } else if (formatType === "quote") {
    replacement = `\n<blockquote>${selected}</blockquote>\n`;
  } else if (formatType === "paragraph") {
    replacement = `\n<p>${selected}</p>\n`;
  } else if (formatType === "link") {
    const url = window.prompt("أدخل الرابط الكامل (https://...):", "https://");
    if (!url) return;
    replacement = `<a href="${url.trim()}" target="_blank" rel="noopener noreferrer">${selected}</a>`;
  }

  textarea.setRangeText(replacement, start, end, "end");
  textarea.focus();
}

function populateEditorForPost(post) {
  switchOpsTab("editor");
  document.getElementById("editor-form-heading").textContent = `تعديل المنشور: ${post.title}`;
  document.getElementById("edit-post-id").value = post.id;
  document.getElementById("post-title").value = post.title || "";
  document.getElementById("post-subcategory").value = post.subcategory || "";
  document.getElementById("post-summary").value = post.summary || "";
  document.getElementById("post-image-url").value = post.imageUrl || "";
  document.getElementById("post-video-url").value = post.videoUrl || "";
  document.getElementById("post-content").value = post.content || "";
  document.getElementById("post-tags").value = Array.isArray(post.tags) ? post.tags.join(", ") : "";
  document.getElementById("post-breaking-hours").value = String(post.breakingDurationHours || 6);
  document.getElementById("post-is-featured").checked = Boolean(post.isFeatured);
  document.getElementById("post-is-breaking").checked = Boolean(post.isBreaking);
  document.getElementById("post-is-quick").checked = Boolean(post.isQuickNews);

  const postCompasses = getPostCompasses(post);
  document.querySelectorAll('input[name="post-compass-item"]').forEach((chk) => {
    chk.checked = postCompasses.includes(chk.value);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetArticleEditor() {
  document.getElementById("editor-form-heading").textContent = "تحرير ونشر مادة صحفية";
  document.getElementById("edit-post-id").value = "";
  document.getElementById("article-editor-form")?.reset();
  const statusEl = document.getElementById("image-upload-status");
  if (statusEl) statusEl.textContent = "";
  populateCompassSelectorsAndFilters();
}

function formatContentParagraphs(rawContent = "") {
  const trimmed = rawContent.trim();
  if (!trimmed) return "";
  if (/<(p|h2|h3|blockquote|ul|ol|div)\b/i.test(trimmed)) {
    return trimmed;
  }
  return trimmed
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

async function submitArticleForm(saveAsDraft = false) {
  const editId = (document.getElementById("edit-post-id")?.value || "").trim();
  const title = (document.getElementById("post-title")?.value || "").trim();
  const rawContent = (document.getElementById("post-content")?.value || "").trim();

  if (!title || !rawContent) {
    showOpsToast("يرجى كتابة عنوان المقال والنص الكامل أولاً");
    return;
  }

  const selectedCompasses = Array.from(
    document.querySelectorAll('input[name="post-compass-item"]:checked')
  ).map((el) => el.value);

  if (!selectedCompasses.length) {
    showOpsToast("يرجى اختيار بوصلة أو قسم واحد على الأقل للمقال");
    return;
  }

  const tagsRaw = (document.getElementById("post-tags")?.value || "").trim();
  const tags = tagsRaw
    ? tagsRaw
        .split(/[,،]/)
        .map((t) => t.replace(/^#/, "").trim())
        .filter(Boolean)
    : [];

  const isBreaking = Boolean(document.getElementById("post-is-breaking")?.checked);
  const breakingHours = Number(document.getElementById("post-breaking-hours")?.value || 6);
  const breakingExpiresAt = isBreaking ? Date.now() + breakingHours * 3600 * 1000 : null;

  let postStatus = "review";
  if (saveAsDraft) {
    postStatus = "draft";
  } else if (canUserPublishDirectly()) {
    postStatus = "published";
  } else {
    postStatus = "review";
  }

  const authorProfile = state.userProfile || {};
  const payload = {
    title,
    summary: (document.getElementById("post-summary")?.value || "").trim(),
    content: formatContentParagraphs(rawContent),
    category: selectedCompasses[0],
    categories: selectedCompasses,
    subcategory: (document.getElementById("post-subcategory")?.value || "").trim(),
    imageUrl: (document.getElementById("post-image-url")?.value || "").trim(),
    videoUrl: (document.getElementById("post-video-url")?.value || "").trim(),
    tags,
    isFeatured: Boolean(document.getElementById("post-is-featured")?.checked),
    isBreaking,
    breakingDurationHours: breakingHours,
    breakingExpiresAt,
    isQuickNews: Boolean(document.getElementById("post-is-quick")?.checked),
    status: postStatus,
    updatedAt: serverTimestamp()
  };

  try {
    if (editId) {
      await setDoc(doc(db, "posts", editId), payload, { merge: true });
    } else {
      await addDoc(collection(db, "posts"), {
        ...payload,
        author: authorProfile.name || state.currentUser?.displayName || "هيئة التحرير",
        authorEmail: (authorProfile.email || state.currentUser?.email || "").toLowerCase(),
        authorAvatar: authorProfile.avatar || state.currentUser?.photoURL || "",
        authorVerified: Boolean(authorProfile.verified),
        views: 0,
        createdAt: serverTimestamp()
      });
    }

    if (saveAsDraft) {
      showOpsToast("تم حفظ المادة في المسودات بنجاح");
    } else if (postStatus === "published") {
      showOpsToast("تم نشر المادة الصحفية مباشرة في الموقع العام");
    } else {
      showOpsToast("تم إرسال مادتك إلى هيئة التحرير للمراجعة والاعتماد");
    }

    resetArticleEditor();
    switchOpsTab("dashboard");
  } catch (err) {
    console.error("Save article error:", err);
    showOpsToast("حدث خطأ أثناء حفظ المقال، تحقق من اتصالك");
  }
}

// ==================== 14. تقنية النشر السريع للأخبار العاجلة الموقوتة ====================
async function submitQuickBreakingForm(e) {
  e.preventDefault();
  const title = (document.getElementById("quick-news-title")?.value || "").trim();
  const compass = document.getElementById("quick-news-compass")?.value || "بوصلة السياسة اليمنية";
  const durationHours = Number(document.getElementById("quick-news-duration")?.value || 6);
  const bodyText = (document.getElementById("quick-news-body")?.value || "").trim();

  if (!title) return;

  const postStatus = canUserPublishDirectly() ? "published" : "review";
  const authorProfile = state.userProfile || {};

  const payload = {
    title,
    summary: bodyText || title,
    content: formatContentParagraphs(bodyText || title),
    category: compass,
    categories: [compass],
    isBreaking: true,
    isQuickNews: true,
    breakingDurationHours: durationHours,
    breakingExpiresAt: Date.now() + durationHours * 3600 * 1000,
    tags: ["عاجل", "أخبار_سريعة", "شبكة_البوصلة"],
    status: postStatus,
    author: authorProfile.name || "غرفة الأخبار العاجلة",
    authorEmail: (authorProfile.email || state.currentUser?.email || "").toLowerCase(),
    authorAvatar: authorProfile.avatar || "",
    authorVerified: Boolean(authorProfile.verified),
    views: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "posts"), payload);
    document.getElementById("quick-breaking-form")?.reset();
    document.getElementById("quick-breaking-modal")?.classList.add("hidden");

    showOpsToast(
      postStatus === "published"
        ? `تم بث الخبر العاجل لمدة (${durationHours}) ساعات في الموقع العام`
        : "تم إرسال الخبر السريع للمراجعة الفورية"
    );
  } catch (err) {
    console.error("Quick breaking error:", err);
    showOpsToast("تعذر بث الخبر العاجل");
  }
}

// ==================== 15. التنقل بين التبويبات والزر المركزي السحري (+) ====================
function switchOpsTab(tabName) {
  state.activeTab = tabName;

  const sections = {
    dashboard: document.getElementById("tab-dashboard"),
    editor: document.getElementById("tab-editor"),
    compasses: document.getElementById("tab-compasses"),
    staff: document.getElementById("tab-staff"),
    ads: document.getElementById("tab-ads"),
    charter: document.getElementById("tab-charter"),
    settings: document.getElementById("tab-settings")
  };

  Object.entries(sections).forEach(([key, el]) => {
    if (el) el.classList.toggle("hidden", key !== tabName);
  });

  document.querySelectorAll("[data-ops-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-ops-tab") === tabName);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==================== 16. ربط الأحداث والمزامنة اللحظية مع Firestore ====================
function bindOpsEvents() {
  // ربط زر تسجيل الدخول عبر Google بالدالة المزدوجة (Popup + Redirect Fallback)
  document.getElementById("google-login-btn")?.addEventListener("click", triggerGoogleLogin);

  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await signOut(auth);
  });

  // إغلاق التنبيه الإداري للصحفي بعد قراءته
  document.getElementById("dismiss-staff-alert-btn")?.addEventListener("click", async () => {
    document.getElementById("staff-alert-bar")?.classList.add("hidden");
    if (state.userProfile?.id) {
      await updateDoc(doc(db, "staff", state.userProfile.id), { adminAlert: "" }).catch(() => {});
    }
  });

  // التنقل بين التبويبات
  document.querySelectorAll("[data-ops-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-ops-tab");
      if (targetTab) switchOpsTab(targetTab);
    });
  });

  // الزر المركزي السحري (+) وخياراته المنبثقة
  const magicModal = document.getElementById("magic-publish-modal");
  document.getElementById("magic-create-btn")?.addEventListener("click", () => {
    magicModal?.classList.remove("hidden");
  });

  document.getElementById("magic-opt-article")?.addEventListener("click", () => {
    magicModal?.classList.add("hidden");
    resetArticleEditor();
    switchOpsTab("editor");
  });

  document.getElementById("magic-opt-breaking")?.addEventListener("click", () => {
    magicModal?.classList.add("hidden");
    document.getElementById("quick-breaking-modal")?.classList.remove("hidden");
  });

  document.getElementById("magic-opt-ad")?.addEventListener("click", () => {
    magicModal?.classList.add("hidden");
    if (!isUserEditorOrAdmin()) {
      showOpsToast("إدارة الإعلانات مخصصة لهيئة التحرير والقيادة");
      return;
    }
    switchOpsTab("ads");
  });

  document.getElementById("magic-opt-compass")?.addEventListener("click", () => {
    magicModal?.classList.add("hidden");
    if (!isUserEditorOrAdmin()) {
      showOpsToast("إدارة البوصلات مخصصة لهيئة التحرير والقيادة");
      return;
    }
    switchOpsTab("compasses");
  });

  // أزرار الاختصار في لوحة المتابعة
  document.getElementById("new-article-trigger-btn")?.addEventListener("click", () => {
    resetArticleEditor();
    switchOpsTab("editor");
  });

  document.getElementById("quick-breaking-trigger-btn")?.addEventListener("click", () => {
    document.getElementById("quick-breaking-modal")?.classList.remove("hidden");
  });

  // إغلاق النوافذ المنبثقة
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modalId = btn.getAttribute("data-close-modal");
      if (modalId) document.getElementById(modalId)?.classList.add("hidden");
    });
  });

  // فلاتر المنشورات في لوحة المتابعة
  ["ops-posts-search", "ops-filter-status", "ops-filter-compass", "ops-filter-author"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", renderOpsPostsList);
    el.addEventListener("change", renderOpsPostsList);
  });

  // أحداث المحرر وشريط الأدوات
  document.getElementById("post-image-file")?.addEventListener("change", handleEditorImageUpload);

  document.querySelectorAll(".tool-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyToolbarFormatting(btn.getAttribute("data-format")));
  });

  document.getElementById("article-editor-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    submitArticleForm(false);
  });

  document.getElementById("save-draft-btn")?.addEventListener("click", () => {
    submitArticleForm(true);
  });

  document.getElementById("reset-editor-btn")?.addEventListener("click", resetArticleEditor);

  // نموذج الأخبار العاجلة السريعة
  document.getElementById("quick-breaking-form")?.addEventListener("submit", submitQuickBreakingForm);

  // نماذج البوصلات، الكادر، الإعلانات، والإعدادات السيادية
  document.getElementById("compass-form")?.addEventListener("submit", saveCompassItem);
  document.getElementById("reset-compass-form-btn")?.addEventListener("click", resetCompassForm);
  document.getElementById("seed-default-compasses-btn")?.addEventListener("click", seedDefaultCompassesToDb);

  document.getElementById("staff-form")?.addEventListener("submit", saveStaffMember);
  document.getElementById("reset-staff-form-btn")?.addEventListener("click", resetStaffForm);
  document.getElementById("ops-staff-search")?.addEventListener("input", (e) => {
    renderStaffList(e.target.value);
  });

  document.getElementById("ad-form")?.addEventListener("submit", saveAdItem);
  document.getElementById("reset-ad-form-btn")?.addEventListener("click", resetAdForm);

  document.getElementById("sovereign-settings-form")?.addEventListener("submit", saveSovereignSettings);
}

function startOpsRealtimeListeners() {
  // 1. مزامنة الإعدادات السيادية
  onSnapshot(doc(db, "settings", "general"), (snap) => {
    if (snap.exists()) {
      state.settings = { ...state.settings, ...snap.data() };
    }
    populateSettingsForm();
  });

  // 2. مزامنة البوصلات والأقسام
  onSnapshot(collection(db, "categories"), (snap) => {
    if (!snap.empty) {
      const dbCats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const merged = [...DEFAULT_COMPASSES];
      dbCats.forEach((cat) => {
        const idx = merged.findIndex((m) => m.id === cat.id || m.name === cat.name);
        if (idx >= 0) merged[idx] = { ...merged[idx], ...cat };
        else merged.push(cat);
      });
      state.compasses = merged;
    }
    populateCompassSelectorsAndFilters();
    renderCompassesManagerList();
  });

  // 3. مزامنة الكادر الصحفي
  onSnapshot(collection(db, "staff"), (snap) => {
    state.staff = snap.docs.map((d) => ({ id: d.id, email: d.id, ...d.data() }));
    renderStaffList(document.getElementById("ops-staff-search")?.value || "");
    populateAuthorFilterDropdown();

    if (state.currentUser?.email) {
      const myEmail = state.currentUser.email.toLowerCase();
      const updatedMe = state.staff.find((s) => s.id === myEmail);
      if (updatedMe) {
        state.userProfile = updatedMe;
        applyUserInterfacePermissions();
      }
    }
  });

  // 4. مزامنة المنشورات والمقالات والعواجل
  onSnapshot(collection(db, "posts"), (snap) => {
    state.posts = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => getPostTimestampMs(b) - getPostTimestampMs(a));

    populateAuthorFilterDropdown();
    renderOpsPostsList();
  });

  // 5. مزامنة الإعلانات
  onSnapshot(collection(db, "ads"), (snap) => {
    state.ads = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderAdsManagerList();
  });
}

// ==================== 17. نقطة انطلاق غرفة العمليات ====================
document.addEventListener("DOMContentLoaded", () => {
  populateCompassSelectorsAndFilters();
  populateSettingsForm();
  bindOpsEvents();

  // فحص أي عملية دخول عائدة من إعادة التوجيه (Redirect) على الهواتف
  checkPendingRedirectLogin();

  onAuthStateChanged(auth, (user) => {
    handleAuthUser(user);
  });
});
