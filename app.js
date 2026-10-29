/* ==========================================================================
   البوابة الذكية التحريرية — شبكة البوصلة الإخبارية (RAWI-YE.COM)
   المحرك البرمجي المستقل والمحصن (app.js) — الجزء الأول (الجزء الأكبر):
   نظام الدخول المستقل (بدون جوجل)، الأدمن الرئيسي المطلق، الأجهزة الموثوقة،
   رمز الدخول السريع (4 أرقام)، العزل التام 100% للصحفيين، دفتر الملاحظات، والمنشورات
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==================== 1. إعدادات الاتصال بقاعدة بيانات Firebase ====================
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

const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

// اتصال خلفي صامت لدعم قواعد الكتابة في حال كانت مفعلة في فايربيس (بدون أي تدخل من جوجل)
signInAnonymously(auth).catch(() => {});

const IMGBB_API_KEY = "c2fd857fff0abe7b1a8a33b57cb621c6";
const PUBLIC_SITE_URL = "https://networkbawsala.rawi-ye.com";

// مفاتيح التخزين المحلي للجهاز الموثوق والجلسة
const STORAGE_DEVICE_ID_KEY = "bawsala_device_id_v2";
const STORAGE_TRUSTED_SESSION_KEY = "bawsala_trusted_session_v2";
const SESSION_TEMP_USER_KEY = "bawsala_temp_session_user_v2";
const SESSION_UNLOCKED_FLAG_KEY = "bawsala_session_unlocked_v2";

// الهوية الافتراضية للأدمن الرئيسي الوحيد (صاحب الصلاحية المطلقة — أحمد رشاد)
const MASTER_ADMIN_DOC_ID = "master-admin";
const DEFAULT_MASTER_ADMIN = {
  id: MASTER_ADMIN_DOC_ID,
  name: "أحمد رشاد",
  username: "admin",
  email: "rawialshamal@gmail.com",
  password: "Rawi@2026",
  quickPin: "",
  role: "admin",
  isMasterAdmin: true,
  jobTitle: "المدير العام ورئيس التحرير",
  avatar: "",
  bio: "المدير العام ورئيس تحرير شبكة البوصلة — مؤسسة RAWI-YE.COM الإعلامية الرقمية.",
  verified: true,
  requireReview: false,
  suspended: false,
  trustedDevices: []
};

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
<p>• جميع الوثائق والبيانات الخاصة بالكادر الصحفي تُحفظ بشكل مشفر وسري ولا يطلع عليها سوى القيادة العليا للمنصة.</p>`;

// ==================== 3. الحالة العامة للبوابة الذكية التحريرية (State) ====================
const state = {
  userProfile: null,
  pendingPinProfile: null,
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
  notes: [],
  activeTab: "dashboard",
  previewPostId: null,
  listenersStarted: false,
  notesUnsubscribe: null
};

// ==================== 4. الدوال المساعدة، بصمة الجهاز، وفحص الصلاحيات الصارم ====================
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
  window.__opsToastTimer = setTimeout(() => toast.classList.add("hidden"), 3600);
}

function formatArabicDate(timestamp) {
  if (!timestamp) return "الآن";
  let d = null;
  if (typeof timestamp.toDate === "function") d = timestamp.toDate();
  else if (timestamp.seconds) d = new Date(timestamp.seconds * 1000);
  else d = new Date(timestamp);
  if (!d || isNaN(d.getTime())) return "حديثاً";
  return d.toLocaleDateString("ar-YE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getPostTimestampMs(item) {
  if (!item) return 0;
  const t = item.createdAt || item.updatedAt;
  if (!t) return 0;
  if (typeof t.toMillis === "function") return t.toMillis();
  if (typeof t.seconds === "number") return t.seconds * 1000;
  const parsed = new Date(t).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

async function uploadImageToImgbb(file) {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData
  });
  const data = await res.json();
  if (data && data.success && data.data?.url) {
    return data.data.url;
  }
  throw new Error("Image upload failed");
}

// توليد أو جلب معرف فريد لهذا الجهاز والمتصفح
function getOrCreateDeviceId() {
  try {
    let devId = localStorage.getItem(STORAGE_DEVICE_ID_KEY);
    if (!devId) {
      devId = "dev_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem(STORAGE_DEVICE_ID_KEY, devId);
    }
    return devId;
  } catch (_) {
    return "dev_fallback_session";
  }
}

// التعرف الذكي على نوع واسم الجهاز والمتصفح لعرضه في قائمة "الأجهزة الموثوقة"
function detectDeviceFriendlyInfo() {
  const ua = navigator.userAgent || "";
  let os = "جهاز كمبيوتر";
  let icon = "computer";

  if (/iPhone/i.test(ua)) {
    os = "هاتف iPhone";
    icon = "smartphone";
  } else if (/iPad/i.test(ua)) {
    os = "جهاز iPad";
    icon = "tablet_mac";
  } else if (/Android/i.test(ua)) {
    os = "هاتف Android";
    icon = "smartphone";
  } else if (/Mac/i.test(ua)) {
    os = "حاسوب Mac";
    icon = "laptop_mac";
  } else if (/Windows/i.test(ua)) {
    os = "حاسوب Windows";
    icon = "laptop_windows";
  }

  let browser = "متصفح ويب";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";

  return {
    name: `${os} (${browser})`,
    icon
  };
}

// التحقق مما إذا كان المستخدم الحالي هو الأدمن الرئيسي الوحيد صاحب الصلاحية المطلقة
function isUserMasterAdmin() {
  if (!state.userProfile) return false;
  return Boolean(
    state.userProfile.isMasterAdmin ||
      state.userProfile.id === MASTER_ADMIN_DOC_ID ||
      state.userProfile.role === "admin"
  );
}

function canUserPublishDirectly() {
  if (isUserMasterAdmin()) return true;
  if (!state.userProfile) return false;
  if (state.userProfile.requireReview) return false;
  return Boolean(state.userProfile.verified);
}

// فحص صارم لملكية المقال: هل هذا المقال كتبه هذا الصحفي تحديداً؟
function isPostOwnedByCurrentUser(post) {
  if (!post || !state.userProfile) return false;
  const myId = String(state.userProfile.id || "").trim().toLowerCase();
  const myUsername = String(state.userProfile.username || "").trim().toLowerCase();
  const myEmail = String(state.userProfile.email || "").trim().toLowerCase();

  const postOwnerId = String(post.authorId || "").trim().toLowerCase();
  const postUsername = String(post.authorUsername || "").trim().toLowerCase();
  const postEmail = String(post.authorEmail || "").trim().toLowerCase();

  if (myId && postOwnerId && myId === postOwnerId) return true;
  if (myUsername && postUsername && myUsername === postUsername) return true;
  if (myEmail && postEmail && myEmail === postEmail) return true;
  if (myUsername && postEmail && myUsername === postEmail) return true;
  if (state.userProfile.name && post.author && state.userProfile.name.trim() === post.author.trim()) {
    return true;
  }
  return false;
}

// ==================== 5. تهيئة الأدمن الرئيسي ونظام الدخول المستقل والأجهزة الموثوقة ====================
async function ensureMasterAdminExists() {
  try {
    const masterRef = doc(db, "staff", MASTER_ADMIN_DOC_ID);
    const snap = await getDoc(masterRef);
    if (!snap.exists()) {
      await setDoc(masterRef, {
        ...DEFAULT_MASTER_ADMIN,
        createdAt: serverTimestamp()
      });
    } else {
      const data = snap.data();
      if (!data.username || !data.password) {
        await setDoc(
          masterRef,
          {
            username: data.username || DEFAULT_MASTER_ADMIN.username,
            password: data.password || DEFAULT_MASTER_ADMIN.password,
            role: "admin",
            isMasterAdmin: true,
            verified: true
          },
          { merge: true }
        );
      }
    }
  } catch (err) {
    console.warn("Master admin init notice:", err);
  }
}

// البحث عن حساب المستخدم (سواء الأدمن الرئيسي أو صحفي) عبر اسم المستخدم أو البريد
async function findStaffAccountByIdentifier(identifier = "") {
  const clean = String(identifier || "").trim().toLowerCase();
  if (!clean) return null;

  await ensureMasterAdminExists();

  const snap = await getDocs(collection(db, "staff"));
  const allStaff = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // أولاً: فحص حساب الأدمن الرئيسي
  const master = allStaff.find(
    (s) =>
      s.id === MASTER_ADMIN_DOC_ID ||
      s.isMasterAdmin ||
      s.role === "admin"
  );

  if (
    master &&
    (String(master.username || "").trim().toLowerCase() === clean ||
      String(master.email || "").trim().toLowerCase() === clean ||
      String(master.id || "").trim().toLowerCase() === clean)
  ) {
    return master;
  }

  // ثانياً: فحص حسابات الصحفيين المعتمدين
  return (
    allStaff.find(
      (s) =>
        String(s.username || "").trim().toLowerCase() === clean ||
        String(s.email || "").trim().toLowerCase() === clean ||
        String(s.id || "").trim().toLowerCase() === clean
    ) || null
  );
}

// فحص الجلسة والجهاز الموثوق عند فتح الموقع (أثناء عرض شاشة "الرجاء الانتظار...")
async function verifyStartupSessionAndTrustedDevice() {
  const loaderScreen = document.getElementById("session-loader-screen");
  const authScreen = document.getElementById("auth-screen");
  const opsApp = document.getElementById("ops-app");

  try {
    await ensureMasterAdminExists();

    const deviceId = getOrCreateDeviceId();
    let savedUserId = null;
    let isTrustedStorage = false;

    try {
      const trustedRaw = localStorage.getItem(STORAGE_TRUSTED_SESSION_KEY);
      if (trustedRaw) {
        const parsed = JSON.parse(trustedRaw);
        if (parsed && parsed.userId && parsed.deviceId === deviceId) {
          savedUserId = parsed.userId;
          isTrustedStorage = true;
        }
      }
      if (!savedUserId) {
        savedUserId = sessionStorage.getItem(SESSION_TEMP_USER_KEY);
      }
    } catch (_) {}

    if (!savedUserId) {
      showLoginCredentialsView();
      loaderScreen?.classList.add("hidden");
      authScreen?.classList.remove("hidden");
      return;
    }

    const userSnap = await getDoc(doc(db, "staff", savedUserId));
    if (!userSnap.exists()) {
      clearLocalSessionData();
      showLoginCredentialsView();
      loaderScreen?.classList.add("hidden");
      authScreen?.classList.remove("hidden");
      return;
    }

    const profile = { id: userSnap.id, ...userSnap.data() };

    if (profile.suspended && !profile.isMasterAdmin && profile.role !== "admin") {
      clearLocalSessionData();
      showAuthError("تم تجميد حسابك الصحفي مؤقتاً بقرار من القيادة العليا.");
      showLoginCredentialsView();
      loaderScreen?.classList.add("hidden");
      authScreen?.classList.remove("hidden");
      return;
    }

    // إذا كان الدخول عبر جهاز موثوق، نتأكد أن الجهاز لم يتم حذفه من قائمة الأجهزة الموثوقة
    if (isTrustedStorage) {
      const devices = Array.isArray(profile.trustedDevices) ? profile.trustedDevices : [];
      const stillTrusted = devices.some((d) => d.deviceId === deviceId);
      if (!stillTrusted) {
        clearLocalSessionData();
        showLoginCredentialsView();
        loaderScreen?.classList.add("hidden");
        authScreen?.classList.remove("hidden");
        return;
      }

      // إذا كان الصحفي قد عيّن رمز دخول سريع (4 أرقام) ولم يفتحه بعد في هذه الجلسة
      const isAlreadyUnlocked = sessionStorage.getItem(SESSION_UNLOCKED_FLAG_KEY) === "true";
      if (profile.quickPin && String(profile.quickPin).trim().length === 4 && !isAlreadyUnlocked) {
        state.pendingPinProfile = profile;
        showPinUnlockScreen(profile);
        loaderScreen?.classList.add("hidden");
        authScreen?.classList.remove("hidden");
        return;
      }
    }

    // الجهاز موثوق وجاهز للدخول المباشر
    await completePortalLogin(profile, false);
    loaderScreen?.classList.add("hidden");
    opsApp?.classList.remove("hidden");
  } catch (err) {
    console.error("Startup session verification error:", err);
    showLoginCredentialsView();
    loaderScreen?.classList.add("hidden");
    authScreen?.classList.remove("hidden");
  }
}

function showAuthError(msg = "") {
  const errBox = document.getElementById("auth-error-box");
  const errText = document.getElementById("auth-error-text");
  if (!errBox || !errText) return;
  if (!msg) {
    errBox.classList.add("hidden");
    return;
  }
  errText.textContent = msg;
  errBox.classList.remove("hidden");
}

function showPinUnlockScreen(profile) {
  showAuthError("");
  document.getElementById("credentials-login-form")?.classList.add("hidden");
  const pinView = document.getElementById("pin-unlock-view");
  pinView?.classList.remove("hidden");

  const avatarUrl =
    profile.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || "صحفي")}&background=1d4ed8&color=fff`;

  const avEl = document.getElementById("pin-user-avatar");
  if (avEl) avEl.src = avatarUrl;

  const nameEl = document.getElementById("pin-user-name");
  if (nameEl) nameEl.textContent = `أهلاً بعودتك، ${profile.name}`;

  const pinInput = document.getElementById("quick-pin-input");
  if (pinInput) {
    pinInput.value = "";
    setTimeout(() => pinInput.focus(), 80);
  }
}

function showLoginCredentialsView() {
  document.getElementById("pin-unlock-view")?.classList.add("hidden");
  document.getElementById("credentials-login-form")?.classList.remove("hidden");
}

function clearLocalSessionData() {
  try {
    localStorage.removeItem(STORAGE_TRUSTED_SESSION_KEY);
    sessionStorage.removeItem(SESSION_TEMP_USER_KEY);
    sessionStorage.removeItem(SESSION_UNLOCKED_FLAG_KEY);
  } catch (_) {}
}

// معالجة تسجيل الدخول عبر (اسم المستخدم + كلمة المرور)
async function handleCredentialsLoginSubmit(e) {
  e.preventDefault();
  showAuthError("");

  const usernameInput = (document.getElementById("login-username")?.value || "").trim();
  const passwordInput = (document.getElementById("login-password")?.value || "").trim();
  const trustDeviceChecked = Boolean(document.getElementById("login-trust-device")?.checked);
  const setupPinInput = (document.getElementById("login-quick-pin")?.value || "").trim();
  const submitBtn = document.getElementById("login-submit-btn");

  if (!usernameInput || !passwordInput) {
    showAuthError("يرجى إدخال اسم المستخدم وكلمة المرور.");
    return;
  }

  if (setupPinInput && !/^\d{4}$/.test(setupPinInput)) {
    showAuthError("رمز الدخول السريع الاختياري يجب أن يتكون من 4 أرقام فقط (مثال: 1234).");
    return;
  }

  if (submitBtn) submitBtn.disabled = true;

  try {
    const account = await findStaffAccountByIdentifier(usernameInput);

    if (!account) {
      showAuthError("اسم المستخدم أو البريد غير مسجل في البوابة الذكية التحريرية.");
      return;
    }

    if (String(account.password || "") !== passwordInput) {
      showAuthError("كلمة المرور غير صحيحة. يرجى التأكد والمحاولة مرة أخرى.");
      return;
    }

    if (account.suspended && !account.isMasterAdmin && account.role !== "admin") {
      showAuthError("تم تجميد هذا الحساب مؤقتاً بقرار من القيادة العليا.");
      return;
    }

    const deviceId = getOrCreateDeviceId();
    const devInfo = detectDeviceFriendlyInfo();
    let updatedDevices = Array.isArray(account.trustedDevices) ? [...account.trustedDevices] : [];
    let updatedPin = account.quickPin || "";

    if (trustDeviceChecked) {
      updatedDevices = updatedDevices.filter((d) => d.deviceId !== deviceId);
      updatedDevices.unshift({
        deviceId,
        deviceName: devInfo.name,
        icon: devInfo.icon,
        trustedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString()
      });

      if (setupPinInput && /^\d{4}$/.test(setupPinInput)) {
        updatedPin = setupPinInput;
      }

      await updateDoc(doc(db, "staff", account.id), {
        trustedDevices: updatedDevices,
        quickPin: updatedPin,
        lastLoginAt: serverTimestamp()
      });

      account.trustedDevices = updatedDevices;
      account.quickPin = updatedPin;

      localStorage.setItem(
        STORAGE_TRUSTED_SESSION_KEY,
        JSON.stringify({ userId: account.id, deviceId })
      );
    } else {
      clearLocalSessionData();
    }

    sessionStorage.setItem(SESSION_TEMP_USER_KEY, account.id);
    sessionStorage.setItem(SESSION_UNLOCKED_FLAG_KEY, "true");

    await completePortalLogin(account, true);
  } catch (err) {
    console.error("Login error:", err);
    showAuthError("تعذر الاتصال بقاعدة البيانات. تحقق من اتصال الإنترنت.");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

// معالجة فتح القفل عبر رمز الدخول السريع (4 أرقام - PIN)
async function handlePinUnlockSubmit(e) {
  e.preventDefault();
  showAuthError("");

  const enteredPin = (document.getElementById("quick-pin-input")?.value || "").trim();
  const profile = state.pendingPinProfile;

  if (!profile) {
    showLoginCredentialsView();
    return;
  }

  if (enteredPin !== String(profile.quickPin || "").trim()) {
    showAuthError("رمز الدخول السريع (4 أرقام) غير صحيح!");
    const pinInput = document.getElementById("quick-pin-input");
    if (pinInput) pinInput.value = "";
    return;
  }

  sessionStorage.setItem(SESSION_TEMP_USER_KEY, profile.id);
  sessionStorage.setItem(SESSION_UNLOCKED_FLAG_KEY, "true");
  await completePortalLogin(profile, true);
}

async function completePortalLogin(profileData, showWelcomeToast = false) {
  state.userProfile = profileData;
  state.pendingPinProfile = null;

  document.getElementById("session-loader-screen")?.classList.add("hidden");
  document.getElementById("auth-screen")?.classList.add("hidden");
  document.getElementById("ops-app")?.classList.remove("hidden");

  applyUserInterfacePermissions();
  populateMyProfileTab();
  startPersonalNotebookListener();

  if (!state.listenersStarted) {
    state.listenersStarted = true;
    startOpsRealtimeListeners();
  } else {
    renderOpsPostsList();
  }

  if (showWelcomeToast) {
    showOpsToast(`أهلاً بك يا ${profileData.name} في البوابة الذكية التحريرية`);
  }
}

// قفل الشاشة السريع (مع الاحتفاظ بالجهاز موثوقاً)
function lockPortalSession() {
  sessionStorage.removeItem(SESSION_UNLOCKED_FLAG_KEY);
  document.getElementById("ops-app")?.classList.add("hidden");
  document.getElementById("auth-screen")?.classList.remove("hidden");

  if (state.userProfile && state.userProfile.quickPin && String(state.userProfile.quickPin).length === 4) {
    state.pendingPinProfile = state.userProfile;
    showPinUnlockScreen(state.userProfile);
    showOpsToast("تم قفل الشاشة برمز الحماية السريع");
  } else {
    showLoginCredentialsView();
    showOpsToast("تم قفل الجلسة");
  }
}

// تسجيل الخروج النهائي وإلغاء الثقة عن الجهاز الحالي
async function logoutPortalCompletely() {
  const deviceId = getOrCreateDeviceId();
  if (state.userProfile && state.userProfile.id) {
    try {
      const currentDevices = Array.isArray(state.userProfile.trustedDevices)
        ? state.userProfile.trustedDevices
        : [];
      const remaining = currentDevices.filter((d) => d.deviceId !== deviceId);
      await updateDoc(doc(db, "staff", state.userProfile.id), {
        trustedDevices: remaining
      });
    } catch (_) {}
  }

  clearLocalSessionData();
  state.userProfile = null;
  state.pendingPinProfile = null;

  document.getElementById("ops-app")?.classList.add("hidden");
  showLoginCredentialsView();
  document.getElementById("auth-screen")?.classList.remove("hidden");
  showOpsToast("تم تسجيل الخروج وإزالة هذا الجهاز من الأجهزة الموثوقة");
}

// ==================== 6. تطبيق الصلاحيات والعزل التام 100% بين الأدمن والصحفي ====================
function applyUserInterfacePermissions() {
  const p = state.userProfile;
  if (!p) return;

  const masterFlag = isUserMasterAdmin();

  const nameEl = document.getElementById("current-user-name");
  if (nameEl) nameEl.textContent = p.name || p.username || "";

  const avatarUrl =
    p.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || "صحفي")}&background=1d4ed8&color=fff`;

  const avatarEl = document.getElementById("current-user-avatar");
  if (avatarEl) avatarEl.src = avatarUrl;

  const roleBadge = document.getElementById("current-user-role-badge");
  if (roleBadge) {
    roleBadge.textContent = masterFlag ? "الأدمن الرئيسي (قيادة مطلقة)" : "كاتب وصحفي";
  }

  const verIcon = document.getElementById("current-user-verified");
  if (verIcon) verIcon.classList.toggle("hidden", !(p.verified || masterFlag));

  // الأقسام السيادية تقتصر حصرياً على الأدمن الرئيسي الوحيد
  const masterOnlyIds = [
    "nav-tab-compasses",
    "nav-tab-staff",
    "nav-tab-ads",
    "nav-tab-settings",
    "dock-btn-staff",
    "magic-opt-ad",
    "ops-filter-author",
    "featured-check-wrap"
  ];

  masterOnlyIds.forEach((id) => {
    document.getElementById(id)?.classList.toggle("hidden", !masterFlag);
  });

  document.getElementById("dock-btn-charter")?.classList.toggle("hidden", masterFlag);

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  if (masterFlag) {
    setTxt("nav-label-dashboard", "لوحة القيادة الشاملة");
    setTxt("dashboard-panel-heading", "إدارة كافة منشورات الشبكة والمراجعة");
    setTxt("stat-label-published", "إجمالي المنشور بالشبكة");
    setTxt("stat-label-review", "مقالات بانتظار اعتمادك");
    setTxt("stat-label-draftOrBreaking", "عواجل وأخبار سريعة نشطة");
    setTxt("stat-label-views", "إجمالي قراءات الشبكة");
  } else {
    setTxt("nav-label-dashboard", "مقالاتي ومنشوراتي");
    setTxt("dashboard-panel-heading", "إدارة مقالاتي ومسوداتي الخاصة فقط");
    setTxt("stat-label-published", "مقالاتي المنشورة");
    setTxt("stat-label-review", "مقالاتي قيد المراجعة");
    setTxt("stat-label-draftOrBreaking", "مسوداتي وملاحظاتي");
    setTxt("stat-label-views", "إجمالي قراءات مقالاتي");
  }

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
        "تتمتع بصلاحية النشر المباشر المعتمدة. أي مادة تعتمدها ستُنشر فوراً في الموقع العام باسمك وصورتك.";
    }
    if (publishBtnLabel) publishBtnLabel.textContent = "نشر فوري في الموقع العام";
  } else {
    if (noticeText) {
      noticeText.textContent =
        "نظام الجودة التحريرية: عند الإرسال، ستُحال مادتك تلقائياً إلى القيادة العليا للمراجعة والاعتماد قبل ظهورها للجمهور.";
    }
    if (publishBtnLabel) publishBtnLabel.textContent = "إرسال المادة للمراجعة والاعتماد";
  }
}

// ==================== 7. قسم "دفتر الملاحظات" الشخصي المعزول 100% لكل صحفي ====================
function startPersonalNotebookListener() {
  if (state.notesUnsubscribe) {
    state.notesUnsubscribe();
    state.notesUnsubscribe = null;
  }
  const myOwnerKey = String(state.userProfile?.id || "").trim().toLowerCase();
  if (!myOwnerKey) return;

  const notesQuery = query(collection(db, "notes"), where("ownerId", "==", myOwnerKey));
  state.notesUnsubscribe = onSnapshot(
    notesQuery,
    (snap) => {
      state.notes = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          if (Boolean(b.pinned) !== Boolean(a.pinned)) return b.pinned ? 1 : -1;
          return getPostTimestampMs(b) - getPostTimestampMs(a);
        });
      renderNotebookGrid(document.getElementById("notebook-search")?.value || "");
      updateDashboardStats();
    },
    (err) => console.warn("Notebook sync warning:", err)
  );
}

function renderNotebookGrid(searchFilter = "") {
  const grid = document.getElementById("notebook-notes-grid");
  if (!grid) return;

  const q = searchFilter.trim().toLowerCase();
  const list = state.notes.filter((n) => {
    if (!q) return true;
    return `${n.title || ""} ${n.content || ""} ${n.category || ""}`.toLowerCase().includes(q);
  });

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">دفتر ملاحظاتك فارغ حالياً. دوّن أفكار مقالاتك، مصادرك، ومسوداتك السريعة من النموذج الجانبي.</div>`;
    return;
  }

  grid.innerHTML = list
    .map((n) => {
      const colorClass = n.color && n.color !== "default" ? `note-${n.color}` : "";
      return `
        <article class="note-card ${escapeHtml(colorClass)}">
          <div>
            <div class="note-card-header">
              <div>
                <span class="role-badge" style="margin-bottom:4px;display:inline-block;">${escapeHtml(
                  n.category || "ملاحظة"
                )}</span>
                <h3 class="note-card-title">${escapeHtml(n.title)}</h3>
              </div>
              ${
                n.pinned
                  ? `<span class="material-symbols-rounded" style="color:var(--primary);" translate="no" title="مثبتة">push_pin</span>`
                  : ""
              }
            </div>
            <div class="note-card-body" style="margin-top:8px;">${escapeHtml(n.content)}</div>
          </div>

          <div>
            <div class="note-card-footer">
              <span>${formatArabicDate(n.updatedAt || n.createdAt)}</span>
            </div>
            <div class="ops-post-actions" style="margin-top:8px;">
              <button type="button" class="btn-primary sm-btn" data-note-to-editor="${escapeHtml(n.id)}" title="نقل هذه الفكرة إلى محرر المقالات">
                <span class="material-symbols-rounded" translate="no">send_to_mobile</span>
                <span>تحويل لمقال</span>
              </button>
              <button type="button" class="btn-outline sm-btn" data-note-edit="${escapeHtml(n.id)}">
                <span class="material-symbols-rounded" translate="no">edit</span>
                <span>تعديل</span>
              </button>
              <button type="button" class="btn-outline sm-btn" data-note-pin="${escapeHtml(n.id)}" title="تثبيت / إلغاء تثبيت">
                <span class="material-symbols-rounded" translate="no">push_pin</span>
              </button>
              <button type="button" class="btn-outline sm-btn danger-icon-btn" data-note-del="${escapeHtml(n.id)}" title="حذف الملاحظة">
                <span class="material-symbols-rounded" translate="no">delete</span>
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  grid.querySelectorAll("[data-note-to-editor]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const note = state.notes.find((x) => x.id === btn.getAttribute("data-note-to-editor"));
      if (!note) return;
      resetArticleEditor();
      switchOpsTab("editor");
      document.getElementById("post-title").value = note.title || "";
      document.getElementById("post-content").value = note.content || "";
      showOpsToast("تم نقل الملاحظة إلى محرر المقالات لاستكمال كتابتها");
    });
  });

  grid.querySelectorAll("[data-note-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const note = state.notes.find((x) => x.id === btn.getAttribute("data-note-edit"));
      if (!note) return;
      document.getElementById("note-form-title").textContent = `تعديل: ${note.title}`;
      document.getElementById("note-edit-id").value = note.id;
      document.getElementById("note-title").value = note.title || "";
      document.getElementById("note-category").value = note.category || "فكرة مقال";
      document.getElementById("note-color").value = note.color || "default";
      document.getElementById("note-content").value = note.content || "";
      document.getElementById("note-pinned").checked = Boolean(note.pinned);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  grid.querySelectorAll("[data-note-pin]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-note-pin");
      const note = state.notes.find((x) => x.id === id);
      if (!note) return;
      await updateDoc(doc(db, "notes", id), { pinned: !note.pinned });
    });
  });

  grid.querySelectorAll("[data-note-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-note-del");
      if (!window.confirm("هل تريد حذف هذه الملاحظة من دفترك؟")) return;
      await deleteDoc(doc(db, "notes", id));
      showOpsToast("تم حذف الملاحظة");
    });
  });
}

function resetNoteForm() {
  document.getElementById("note-form-title").textContent = "تدوين ملاحظة أو فكرة جديدة";
  document.getElementById("note-edit-id").value = "";
  document.getElementById("notebook-form")?.reset();
}

async function saveNotebookItem(e) {
  e.preventDefault();
  const myOwnerKey = String(state.userProfile?.id || "").trim().toLowerCase();
  if (!myOwnerKey) return;

  const editId = (document.getElementById("note-edit-id")?.value || "").trim();
  const title = (document.getElementById("note-title")?.value || "").trim();
  const content = (document.getElementById("note-content")?.value || "").trim();
  if (!title || !content) return;

  const payload = {
    ownerId: myOwnerKey,
    ownerUsername: state.userProfile?.username || "",
    title,
    category: document.getElementById("note-category")?.value || "فكرة مقال",
    color: document.getElementById("note-color")?.value || "default",
    content,
    pinned: Boolean(document.getElementById("note-pinned")?.checked),
    updatedAt: serverTimestamp()
  };

  try {
    if (editId) {
      await setDoc(doc(db, "notes", editId), payload, { merge: true });
    } else {
      await addDoc(collection(db, "notes"), { ...payload, createdAt: serverTimestamp() });
    }
    showOpsToast("تم حفظ الملاحظة في دفترك الخاص");
    resetNoteForm();
  } catch (err) {
    console.error("Save note error:", err);
    showOpsToast("تعذر حفظ الملاحظة");
  }
}

// ==================== 8. قسم "ملفي والأجهزة الموثوقة" + تعديل كلمة المرور ورمز PIN ====================
function populateMyProfileTab() {
  const p = state.userProfile;
  if (!p) return;

  const avatarUrl =
    p.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || "صحفي")}&background=1d4ed8&color=fff`;

  const cardAvatar = document.getElementById("my-profile-card-avatar");
  if (cardAvatar) cardAvatar.src = avatarUrl;

  const cardName = document.getElementById("my-profile-card-name");
  if (cardName) cardName.textContent = p.name || "";

  const cardVer = document.getElementById("my-profile-card-verified");
  if (cardVer) cardVer.classList.toggle("hidden", !(p.verified || isUserMasterAdmin()));

  const cardRole = document.getElementById("my-profile-card-role");
  if (cardRole) {
    cardRole.textContent = p.jobTitle || (isUserMasterAdmin() ? "المدير العام ورئيس التحرير" : "كاتب وصحفي");
  }

  const pendingBox = document.getElementById("my-profile-pending-name-box");
  const pendingTxt = document.getElementById("my-profile-pending-name-text");
  if (p.pendingName && p.pendingName.trim() !== "") {
    if (pendingTxt) {
      pendingTxt.textContent = `طلب تغيير الاسم إلى "${p.pendingName}" قيد المراجعة لدى القيادة العليا.`;
    }
    pendingBox?.classList.remove("hidden");
  } else {
    pendingBox?.classList.add("hidden");
  }

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  };

  setVal("my-prof-name", p.name || "");
  setVal("my-prof-job", p.jobTitle || "");
  setVal("my-prof-username", p.username || p.email || "");
  setVal("my-prof-password", "");
  setVal("my-prof-pin", p.quickPin || "");
  setVal("my-prof-phone", p.phone || "");
  setVal("my-prof-avatar", p.avatar || "");
  setVal("my-prof-bio", p.bio || "");
  setVal("my-prof-x", p.socials?.x || "");
  setVal("my-prof-fb", p.socials?.facebook || "");

  // حالة توثيق الهوية KYC
  const kycDesc = document.getElementById("kyc-status-desc");
  const kycForm = document.getElementById("kyc-request-form");
  const kycLockedBox = document.getElementById("kyc-verified-locked-box");

  if (p.kycStatus === "pending") {
    if (kycDesc) {
      kycDesc.innerHTML = `<strong style="color:var(--warning);">وثيقة الهوية الخاصة بك قيد المراجعة حالياً لدى القيادة العليا.</strong>`;
    }
    kycLockedBox?.classList.add("hidden");
    kycForm?.classList.add("hidden");
  } else if (p.verified || isUserMasterAdmin()) {
    if (kycDesc) {
      kycDesc.innerHTML = `<strong style="color:var(--success);">حسابك وهويتك الصحفية موثقان رسمياً بالشارة الزرقاء المعتمدة.</strong>`;
    }
    kycLockedBox?.classList.remove("hidden");
    kycForm?.classList.add("hidden");
  } else {
    if (kycDesc) {
      kycDesc.textContent =
        "تمنح الشارة الزرقاء للصحفيين المعتمدين صلاحية النشر المباشر وتظهر بجانب اسمك وصورتك في جميع مقالاتك بالموقع العام.";
    }
    kycLockedBox?.classList.add("hidden");
    kycForm?.classList.remove("hidden");
  }

  renderMyTrustedDevicesList();
}

function renderMyTrustedDevicesList() {
  const listEl = document.getElementById("my-trusted-devices-list");
  if (!listEl || !state.userProfile) return;

  const currentDeviceId = getOrCreateDeviceId();
  const devices = Array.isArray(state.userProfile.trustedDevices)
    ? state.userProfile.trustedDevices
    : [];

  if (!devices.length) {
    listEl.innerHTML = `<div class="empty-state" style="padding:14px;">لا توجد أجهزة موثوقة محفوظة حالياً لهذا الحساب.</div>`;
    return;
  }

  listEl.innerHTML = devices
    .map((d) => {
      const isCurrent = d.deviceId === currentDeviceId;
      return `
        <div class="trusted-device-item">
          <div class="trusted-device-meta">
            <span class="material-symbols-rounded" translate="no">${escapeHtml(d.icon || "devices")}</span>
            <div>
              <strong>
                ${escapeHtml(d.deviceName || "جهاز متصفح")}
                ${isCurrent ? `<span class="status-pill status-published" style="margin-right:6px;">هذا الجهاز</span>` : ""}
              </strong>
              <span>تاريخ الوثوق: ${formatArabicDate(d.trustedAt)}</span>
            </div>
          </div>
          <button type="button" class="btn-outline sm-btn danger-icon-btn" data-revoke-device="${escapeHtml(
            d.deviceId
          )}" title="إلغاء الوثوق وحذف هذا الجهاز">
            <span class="material-symbols-rounded" translate="no">delete</span>
            <span>حذف</span>
          </button>
        </div>
      `;
    })
    .join("");

  listEl.querySelectorAll("[data-revoke-device]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const targetDevId = btn.getAttribute("data-revoke-device");
      if (!targetDevId || !state.userProfile) return;
      const updated = (state.userProfile.trustedDevices || []).filter(
        (x) => x.deviceId !== targetDevId
      );
      await updateDoc(doc(db, "staff", state.userProfile.id), {
        trustedDevices: updated
      });
      state.userProfile.trustedDevices = updated;
      if (targetDevId === currentDeviceId) {
        localStorage.removeItem(STORAGE_TRUSTED_SESSION_KEY);
      }
      renderMyTrustedDevicesList();
      showOpsToast("تمت إزالة الجهاز من قائمة الأجهزة الموثوقة");
    });
  });
}

async function revokeAllMyTrustedDevices() {
  if (!state.userProfile) return;
  if (!window.confirm("هل تريد إزالة جميع الأجهزة الموثوقة المتصلة بحسابك؟")) return;

  try {
    await updateDoc(doc(db, "staff", state.userProfile.id), {
      trustedDevices: []
    });
    state.userProfile.trustedDevices = [];
    localStorage.removeItem(STORAGE_TRUSTED_SESSION_KEY);
    renderMyTrustedDevicesList();
    showOpsToast("تم إلغاء الوثوق عن جميع الأجهزة بنجاح");
  } catch (err) {
    console.error("Revoke all devices error:", err);
    showOpsToast("تعذر إزالة الأجهزة");
  }
}

async function syncWriterIdentityAcrossPosts(staffDocId, newAvatar, newName, isVerified) {
  try {
    const myPosts = state.posts.filter((post) => isPostOwnedByStaffId(post, staffDocId));
    for (const post of myPosts) {
      const updates = {};
      if (newAvatar !== undefined) updates.authorAvatar = newAvatar;
      if (newName !== undefined) updates.author = newName;
      if (isVerified !== undefined) updates.authorVerified = Boolean(isVerified);
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, "posts", post.id), updates).catch(() => {});
      }
    }
  } catch (err) {
    console.warn("Sync writer posts notice:", err);
  }
}

function isPostOwnedByStaffId(post, staffDocId) {
  const member = state.staff.find((s) => s.id === staffDocId);
  if (!post || !member) return false;
  const targetId = String(member.id || "").toLowerCase();
  const targetUser = String(member.username || "").toLowerCase();
  if (post.authorId && String(post.authorId).toLowerCase() === targetId) return true;
  if (post.authorUsername && String(post.authorUsername).toLowerCase() === targetUser) return true;
  if (post.authorEmail && String(post.authorEmail).toLowerCase() === targetUser) return true;
  if (member.name && post.author && member.name.trim() === post.author.trim()) return true;
  return false;
}

async function saveMyPersonalProfile(e) {
  e.preventDefault();
  const p = state.userProfile;
  if (!p) return;

  const requestedName = (document.getElementById("my-prof-name")?.value || "").trim();
  const jobTitle = (document.getElementById("my-prof-job")?.value || "").trim();
  const newUsername = (document.getElementById("my-prof-username")?.value || "").trim().toLowerCase();
  const newPassword = (document.getElementById("my-prof-password")?.value || "").trim();
  const newPin = (document.getElementById("my-prof-pin")?.value || "").trim();
  const phone = (document.getElementById("my-prof-phone")?.value || "").trim();
  const avatar = (document.getElementById("my-prof-avatar")?.value || "").trim();
  const bio = (document.getElementById("my-prof-bio")?.value || "").trim();
  const socialX = (document.getElementById("my-prof-x")?.value || "").trim();
  const socialFb = (document.getElementById("my-prof-fb")?.value || "").trim();

  if (!requestedName || !newUsername) {
    showOpsToast("الاسم واسم المستخدم حقول أساسية لا يمكن تركها فارغة");
    return;
  }

  if (newPin && !/^\d{4}$/.test(newPin)) {
    showOpsToast("رمز الدخول السريع يجب أن يتكون من 4 أرقام فقط (أو اتركه فارغاً لإلغائه)");
    return;
  }

  // التأكد من عدم تكرار اسم المستخدم مع عضو آخر
  const duplicateUser = state.staff.find(
    (s) =>
      s.id !== p.id &&
      (String(s.username || "").toLowerCase() === newUsername ||
        String(s.email || "").toLowerCase() === newUsername)
  );
  if (duplicateUser) {
    showOpsToast("اسم المستخدم هذا مستخدم بالفعل لحساب آخر، اختر اسماً مختلفاً");
    return;
  }

  // الأدمن الرئيسي يغير اسمه فوراً، بينما الصحفي يُحال تغيير اسمه للمراجعة
  let finalName = p.name;
  let pendingName = p.pendingName || "";

  if (requestedName !== p.name) {
    if (isUserMasterAdmin()) {
      finalName = requestedName;
      pendingName = "";
    } else {
      pendingName = requestedName;
    }
  }

  const updatedFields = {
    name: finalName,
    pendingName,
    username: newUsername,
    email: newUsername.includes("@") ? newUsername : p.email || newUsername,
    password: newPassword ? newPassword : p.password,
    quickPin: newPin,
    phone,
    jobTitle: jobTitle || p.jobTitle || "كاتب ومحرر صحفي",
    avatar,
    bio,
    socials: {
      ...(p.socials || {}),
      x: socialX,
      facebook: socialFb
    },
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, "staff", p.id), updatedFields, { merge: true });
    state.userProfile = { ...p, ...updatedFields };
    await syncWriterIdentityAcrossPosts(p.id, avatar, finalName, p.verified);

    applyUserInterfacePermissions();
    populateMyProfileTab();

    if (pendingName && pendingName !== p.name) {
      showOpsToast("تم حفظ بياناتك وكلمة المرور، وإحالة تعديل الاسم لمراجعة القيادة العليا");
    } else {
      showOpsToast("تم حفظ وتحديث بياناتك وإعدادات الأمان بنجاح");
    }
  } catch (err) {
    console.error("Update personal profile error:", err);
    showOpsToast("تعذر تحديث الملف الشخصي، تحقق من اتصالك");
  }
}

async function submitKycVerificationRequest(e) {
  e.preventDefault();
  const p = state.userProfile;
  if (!p) return;

  const docUrl = (document.getElementById("kyc-doc-url")?.value || "").trim();
  const note = (document.getElementById("kyc-note")?.value || "").trim();

  if (!docUrl && !note) {
    showOpsToast("يرجى رفع صورة وثيقة الهوية أو كتابة بيانات التوثيق");
    return;
  }

  const isUpdatingVerifiedIdentity = Boolean(p.verified);

  try {
    await updateDoc(doc(db, "staff", p.id), {
      kycStatus: "pending",
      kycDocUrl: docUrl,
      kycNote: isUpdatingVerifiedIdentity ? `[طلب تحديث هوية موثقة]: ${note}` : note,
      requireReview: isUpdatingVerifiedIdentity ? true : Boolean(p.requireReview),
      kycRequestedAt: serverTimestamp()
    });
    state.userProfile.kycStatus = "pending";
    if (isUpdatingVerifiedIdentity) state.userProfile.requireReview = true;
    populateMyProfileTab();
    applyUserInterfacePermissions();
    showOpsToast(
      isUpdatingVerifiedIdentity
        ? "تمت إحالة تعديل الهوية للمراجعة لدى القيادة العليا"
        : "تم إرسال طلب توثيق الهوية بالشارة الزرقاء للقيادة العليا"
    );
  } catch (err) {
    console.error("KYC request error:", err);
    showOpsToast("تعذر إرسال طلب التوثيق");
  }
}

// ==================== 9. الإعدادات السيادية والميثاق الصحفي ====================
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
  if (!isUserMasterAdmin()) {
    showOpsToast("عذراً، تعديل الإعدادات السيادية مخصص للأدمن الرئيسي فقط");
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
    showOpsToast("تعذر حفظ الإعدادات، تحقق من الاتصال");
  }
}

// ==================== 10. إدارة الكادر الصحفي، مراجعة الهوية والأسماء، والترحيب ====================
function buildStaffWelcomeMessage(member) {
  const siteName = state.settings.siteName || "شبكة البوصلة";
  const opsUrl = window.location.origin + window.location.pathname;
  const charterPlainText = stripHtmlToText(state.settings.charterHtml || DEFAULT_CHARTER_HTML);
  const publishStatus =
    member.verified && !member.requireReview
      ? "تم منحك الشارة الزرقاء وصلاحية النشر المباشر."
      : "تُحفظ مقالاتك في قسم المراجعة التحريرية ليتم اعتمادها ونشرها من قِبل القيادة.";

  return `مرحباً بك أستاذ ${member.name} في أسرة "${siteName}" التابعة لمؤسسة RAWI-YE.COM الإعلامية الرقمية.

يسعدنا انضمامك إلينا واعتمادك رسمياً ضمن كادر الشبكة بصفة: (${member.jobTitle || "كاتب وصحفي"}).
• حالة النشر الخاصة بك: ${publishStatus}

---
بيانات الدخول الخاصة بك إلى البوابة الذكية التحريرية:
• رابط البوابة:
${opsUrl}
• اسم المستخدم: ${member.username || member.email}
• كلمة المرور: ${member.password || "راجع الإدارة"}
(ملاحظة: يمكنك بعد الدخول تغيير كلمة المرور وتفعيل الوثوق بجهازك وإنشاء رمز دخول سريع من 4 أرقام من قسم "ملفي والأجهزة").

---
ميثاق الشرف الصحفي والتوجيه الوطني المعتمد للعمل في الشبكة:
${charterPlainText}

---
نحن فخورون بوجود قلمك معنا، مع خالص التقدير والتمنيات بالتوفيق!`;
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
  const subject = `بيانات دخولك وميثاق العمل في البوابة الذكية التحريرية — ${siteName}`;
  const body = buildStaffWelcomeMessage(member);
  const targetEmail = (member.email || member.username || "").includes("@")
    ? member.email || member.username
    : "";

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    targetEmail
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(gmailUrl, "_blank", "noopener");
}

function renderStaffPendingRequests() {
  const panel = document.getElementById("staff-pending-requests-panel");
  const listEl = document.getElementById("staff-pending-requests-list");
  const badgeEl = document.getElementById("staff-requests-badge");
  if (!panel || !listEl) return;

  const pendingItems = state.staff.filter(
    (s) => (s.pendingName && s.pendingName.trim() !== "") || s.kycStatus === "pending"
  );

  if (badgeEl) {
    badgeEl.textContent = String(pendingItems.length);
    badgeEl.classList.toggle("hidden", pendingItems.length === 0);
  }

  if (!pendingItems.length || !isUserMasterAdmin()) {
    panel.classList.add("hidden");
    return;
  }

  panel.classList.remove("hidden");
  listEl.innerHTML = pendingItems
    .map((s) => {
      const hasNameReq = s.pendingName && s.pendingName.trim() !== "";
      const hasKycReq = s.kycStatus === "pending";

      return `
        <article class="staff-member-card" style="background:#fffbeb;border-color:#fde68a;">
          <div style="display:flex;flex-direction:column;gap:8px;">
            <strong>الصحفي: ${escapeHtml(s.name)} (${escapeHtml(s.username || s.email)})</strong>

            ${
              hasNameReq
                ? `<div class="alert-banner alert-warning">
                    <span>يطلب تعديل اسمه الصحفي إلى: <strong>"${escapeHtml(s.pendingName)}"</strong></span>
                    <div style="display:flex;gap:6px;">
                      <button type="button" class="btn-success sm-btn" data-approve-name="${escapeHtml(s.id)}">اعتماد الاسم</button>
                      <button type="button" class="btn-danger sm-btn" data-reject-name="${escapeHtml(s.id)}">رفض</button>
                    </div>
                  </div>`
                : ""
            }

            ${
              hasKycReq
                ? `<div class="alert-banner alert-info">
                    <div>
                      <span><strong>مراجعة وثيقة الهوية والتوثيق (KYC):</strong> ${escapeHtml(s.kycNote || "بدون ملاحظة")}</span>
                      ${
                        s.kycDocUrl
                          ? ` — <a href="${escapeHtml(s.kycDocUrl)}" target="_blank" rel="noopener" style="color:var(--primary);font-weight:900;text-decoration:underline;">فتح صورة الهوية المرفقة</a>`
                          : ""
                      }
                    </div>
                    <div style="display:flex;gap:6px;">
                      <button type="button" class="btn-success sm-btn" data-approve-kyc="${escapeHtml(s.id)}">اعتماد وتوثيق الهوية</button>
                      <button type="button" class="btn-danger sm-btn" data-reject-kyc="${escapeHtml(s.id)}">رفض الطلب</button>
                    </div>
                  </div>`
                : ""
            }
          </div>
        </article>
      `;
    })
    .join("");

  listEl.querySelectorAll("[data-approve-name]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-approve-name");
      const member = state.staff.find((x) => x.id === id);
      if (!member || !member.pendingName) return;
      const newApprovedName = member.pendingName;
      await updateDoc(doc(db, "staff", id), { name: newApprovedName, pendingName: "" });
      await syncWriterIdentityAcrossPosts(id, member.avatar, newApprovedName, member.verified);
      showOpsToast(`تم اعتماد الاسم الجديد (${newApprovedName}) وتحديثه في المقالات`);
    });
  });

  listEl.querySelectorAll("[data-reject-name]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-reject-name");
      await updateDoc(doc(db, "staff", id), { pendingName: "" });
      showOpsToast("تم رفض طلب تغيير الاسم");
    });
  });

  listEl.querySelectorAll("[data-approve-kyc]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-approve-kyc");
      const member = state.staff.find((x) => x.id === id);
      if (!member) return;
      await updateDoc(doc(db, "staff", id), {
        verified: true,
        requireReview: false,
        kycStatus: "approved"
      });
      await syncWriterIdentityAcrossPosts(id, member.avatar, member.name, true);
      showOpsToast(`تم اعتماد هوية (${member.name}) وتوثيقه بالشارة الزرقاء`);
    });
  });

  listEl.querySelectorAll("[data-reject-kyc]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-reject-kyc");
      await updateDoc(doc(db, "staff", id), { kycStatus: "rejected" });
      showOpsToast("تم رفض طلب التوثيق");
    });
  });
}

function renderStaffList(filterQuery = "") {
  renderStaffPendingRequests();

  const listEl = document.getElementById("ops-staff-list");
  if (!listEl) return;

  const q = filterQuery.trim().toLowerCase();
  const filtered = state.staff.filter((s) => {
    if (!q) return true;
    return `${s.name || ""} ${s.username || ""} ${s.email || ""} ${s.jobTitle || ""}`
      .toLowerCase()
      .includes(q);
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

      const isMaster = s.id === MASTER_ADMIN_DOC_ID || s.isMasterAdmin || s.role === "admin";
      const statusBadges = [];
      statusBadges.push(
        `<span class="role-badge">${isMaster ? "الأدمن الرئيسي (قيادة مطلقة)" : "كاتب وصحفي"}</span>`
      );

      if (s.verified || isMaster) {
        statusBadges.push(
          `<span class="status-pill status-published"><span class="material-symbols-rounded" style="font-size:14px;" translate="no">verified</span> موثق بالشارة الزرقاء</span>`
        );
      }
      if (s.requireReview && !isMaster) {
        statusBadges.push(
          `<span class="status-pill status-review"><span class="material-symbols-rounded" style="font-size:14px;" translate="no">policy</span> مقيد بالمراجعة</span>`
        );
      }
      if (s.suspended && !isMaster) {
        statusBadges.push(
          `<span class="status-pill status-breaking"><span class="material-symbols-rounded" style="font-size:14px;" translate="no">block</span> حساب مجمد</span>`
        );
      }

      const trustedCount = Array.isArray(s.trustedDevices) ? s.trustedDevices.length : 0;

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
                  <span>المستخدم: <strong dir="ltr">${escapeHtml(s.username || s.email || s.id)}</strong></span>
                  | <span>كلمة المرور: <strong dir="ltr">${escapeHtml(s.password || "—")}</strong></span>
                  ${s.phone ? ` | <span dir="ltr">${escapeHtml(s.phone)}</span>` : ""}
                  | <span>الأجهزة الموثوقة: (${trustedCount})</span>
                </div>
              </div>
            </div>
          </div>

          <div class="staff-actions-bar">
            <button type="button" class="btn-success sm-btn" data-staff-wa="${escapeHtml(s.id)}">
              <span class="material-symbols-rounded" translate="no">chat</span>
              <span>إرسال الدخول والميثاق (واتساب)</span>
            </button>

            <button type="button" class="btn-primary sm-btn" data-staff-mail="${escapeHtml(s.id)}">
              <span class="material-symbols-rounded" translate="no">mail</span>
              <span>إرسال عبر (Gmail)</span>
            </button>

            <button type="button" class="btn-outline sm-btn" data-staff-edit="${escapeHtml(s.id)}">
              <span class="material-symbols-rounded" translate="no">edit</span>
              <span>تعديل</span>
            </button>

            ${
              !isMaster
                ? `<button type="button" class="btn-outline sm-btn" data-staff-toggle-review="${escapeHtml(s.id)}">
                    <span class="material-symbols-rounded" translate="no">policy</span>
                    <span>${s.requireReview ? "إلغاء تقييد المراجعة" : "تقييد للمراجعة"}</span>
                  </button>
                  <button type="button" class="btn-outline sm-btn" data-staff-alert="${escapeHtml(s.id)}">
                    <span class="material-symbols-rounded" translate="no">notification_important</span>
                    <span>إرسال تنبيه</span>
                  </button>
                  <button type="button" class="btn-outline sm-btn danger-icon-btn" data-staff-delete="${escapeHtml(
                    s.id
                  )}" title="حذف الصحفي">
                    <span class="material-symbols-rounded" translate="no">delete</span>
                  </button>`
                : ""
            }
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
          ? `تم تقييد نشر (${member.name}) للمراجعة الإلزامية`
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
  document.getElementById("staff-edit-doc-id").value = member.id;
  document.getElementById("staff-name").value = member.name || "";
  document.getElementById("staff-username").value = member.username || member.email || "";
  document.getElementById("staff-password").value = member.password || "";
  document.getElementById("staff-phone").value = member.phone || "";
  document.getElementById("staff-job-title").value = member.jobTitle || "";
  document.getElementById("staff-avatar").value = member.avatar || "";
  document.getElementById("staff-bio").value = member.bio || "";
  document.getElementById("staff-verified").checked = Boolean(member.verified);
  document.getElementById("staff-require-review").checked = Boolean(member.requireReview);
  document.getElementById("staff-suspended").checked = Boolean(member.suspended);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetStaffForm() {
  document.getElementById("staff-form-title").textContent = "إضافة أو تعديل صحفي في الشبكة";
  document.getElementById("staff-edit-doc-id").value = "";
  document.getElementById("staff-form")?.reset();
}

async function saveStaffMember(e) {
  e.preventDefault();
  if (!isUserMasterAdmin()) {
    showOpsToast("إدارة الكادر مخصصة للأدمن الرئيسي فقط");
    return;
  }

  const editDocId = (document.getElementById("staff-edit-doc-id")?.value || "").trim();
  const name = (document.getElementById("staff-name")?.value || "").trim();
  const username = (document.getElementById("staff-username")?.value || "").trim().toLowerCase();
  const password = (document.getElementById("staff-password")?.value || "").trim();

  if (!name || !username || !password) {
    showOpsToast("يرجى إدخال اسم الصحفي واسم المستخدم وكلمة المرور");
    return;
  }

  // منع تكرار اسم المستخدم مع عضو آخر
  const existingConflict = state.staff.find(
    (s) =>
      s.id !== editDocId &&
      (String(s.username || "").toLowerCase() === username ||
        String(s.email || "").toLowerCase() === username)
  );
  if (existingConflict) {
    showOpsToast("اسم المستخدم هذا مسجل بالفعل لصحفي آخر");
    return;
  }

  const docId =
    editDocId ||
    username.replace(/[^a-z0-9@._-]/gi, "") ||
    "writer-" + Date.now();

  const isMaster = docId === MASTER_ADMIN_DOC_ID;
  const avatar = (document.getElementById("staff-avatar")?.value || "").trim();
  const verified = isMaster ? true : Boolean(document.getElementById("staff-verified")?.checked);

  const payload = {
    name,
    username,
    email: username,
    password,
    phone: (document.getElementById("staff-phone")?.value || "").trim(),
    role: isMaster ? "admin" : "writer",
    isMasterAdmin: isMaster,
    jobTitle: (document.getElementById("staff-job-title")?.value || "").trim() || "كاتب وصحفي",
    avatar,
    bio: (document.getElementById("staff-bio")?.value || "").trim(),
    verified,
    requireReview: isMaster ? false : Boolean(document.getElementById("staff-require-review")?.checked),
    suspended: isMaster ? false : Boolean(document.getElementById("staff-suspended")?.checked),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, "staff", docId), payload, { merge: true });
    await syncWriterIdentityAcrossPosts(docId, avatar, name, verified);
    showOpsToast(`تم اعتماد وحفظ بيانات الصحفي (${name}) بنجاح`);
    resetStaffForm();
  } catch (err) {
    console.error("Save staff error:", err);
    showOpsToast("حدث خطأ أثناء حفظ بيانات الصحفي");
  }
}

// ==================== 11. إدارة البوصلات والأقسام والإعلانات ====================
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
                <span class="material-symbols-rounded" style="color:${c.color || "#b91c1c"};" translate="no">${
        c.icon || "explore"
      }</span>
                <strong>${escapeHtml(c.name)}</strong>
              </div>
              <span class="status-pill ${isVisible ? "status-published" : "status-draft"}">
                ${isVisible ? "ظاهر" : "مخفي"}
              </span>
            </div>
            <p style="font-size:0.78rem;color:var(--text-muted);margin:6px 0;">${escapeHtml(c.description || "")}</p>
            ${
              subs.length
                ? `<div style="font-size:0.74rem;color:var(--text-secondary);"><strong>الفئات الفرعية:</strong> ${subs
                    .map(escapeHtml)
                    .join(" ، ")}</div>`
                : ""
            }
          </div>

          <div class="ops-post-actions" style="padding-top:8px;border-top:1px solid var(--border-color);">
            <button type="button" class="btn-outline sm-btn" data-compass-edit="${escapeHtml(c.id)}">
              <span class="material-symbols-rounded" translate="no">edit</span>
              <span>تعديل</span>
            </button>

            <button type="button" class="btn-outline sm-btn" data-compass-toggle="${escapeHtml(c.id)}">
              <span class="material-symbols-rounded" translate="no">${
                isVisible ? "visibility_off" : "visibility"
              }</span>
              <span>${isVisible ? "إخفاء" : "إظهار"}</span>
            </button>

            <button type="button" class="btn-outline sm-btn danger-icon-btn" data-compass-del="${escapeHtml(
              c.id
            )}" title="حذف القسم">
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
  if (!isUserMasterAdmin()) return;

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
  if (!isUserMasterAdmin()) return;
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
              الراعي: ${escapeHtml(ad.sponsorName || "شركاء البوصلة")} | النقرات الفعلية: <strong>${ad.clicks || 0}</strong>
            </p>
          </div>

          <div class="ops-post-actions" style="padding-top:8px;border-top:1px solid var(--border-color);">
            <button type="button" class="btn-outline sm-btn" data-ad-edit="${escapeHtml(ad.id)}">
              <span class="material-symbols-rounded" translate="no">edit</span>
              <span>تعديل</span>
            </button>

            <button type="button" class="btn-outline sm-btn" data-ad-toggle="${escapeHtml(ad.id)}">
              <span class="material-symbols-rounded" translate="no">${
                isActive ? "pause_circle" : "play_circle"
              }</span>
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
  if (!isUserMasterAdmin()) return;

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

// ==================== 12. قوائم البوصلات، العزل التام للمنشورات، والمعاينة الآمنة ====================
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
    if (exp && !isNaN(exp) && now > exp) return false;
  } else if (post.breakingDurationHours) {
    const createdMs = getPostTimestampMs(post);
    const durationMs = Number(post.breakingDurationHours) * 3600 * 1000;
    if (createdMs && durationMs > 0 && now > createdMs + durationMs) return false;
  }
  return true;
}

function populateCompassSelectorsAndFilters() {
  const compasses = getActiveCompassesList();

  const filterCompass = document.getElementById("ops-filter-compass");
  if (filterCompass) {
    const currentVal = filterCompass.value || "all";
    filterCompass.innerHTML = [
      `<option value="all">جميع البوصلات والأقسام</option>`,
      ...compasses.map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`)
    ].join("");
    filterCompass.value = currentVal;
  }

  const quickCompass = document.getElementById("quick-news-compass");
  if (quickCompass) {
    quickCompass.innerHTML = compasses
      .map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`)
      .join("");
  }

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

function updateDashboardStats() {
  const isMaster = isUserMasterAdmin();
  const scopedPosts = isMaster
    ? state.posts
    : state.posts.filter((p) => isPostOwnedByCurrentUser(p));

  const publishedCount = scopedPosts.filter((p) => !p.status || p.status === "published").length;
  const reviewCount = scopedPosts.filter((p) => p.status === "review" || p.status === "pending").length;
  const draftOrBreakingCount = isMaster
    ? scopedPosts.filter((p) => isBreakingStillActive(p) || p.isQuickNews).length
    : scopedPosts.filter((p) => p.status === "draft" || p.status === "rejected").length + state.notes.length;
  const totalViews = scopedPosts.reduce((acc, p) => acc + (Number(p.views) || 0), 0);

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = Number(val).toLocaleString("ar-YE");
  };

  setTxt("stat-published-count", publishedCount);
  setTxt("stat-review-count", reviewCount);
  setTxt("stat-breaking-count", draftOrBreakingCount);
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

  const isMaster = isUserMasterAdmin();

  // العزل التام 100%: الصحفي لا تظهر له في صفحته أي منشورات إطلاقاً إلا ما كتبه هو بنفسه!
  let filtered = isMaster
    ? [...state.posts]
    : state.posts.filter((p) => isPostOwnedByCurrentUser(p));

  if (statusFilter !== "all") {
    if (statusFilter === "published") {
      filtered = filtered.filter((p) => !p.status || p.status === "published");
    } else if (statusFilter === "review") {
      filtered = filtered.filter((p) => p.status === "review" || p.status === "pending");
    } else if (statusFilter === "rejected") {
      filtered = filtered.filter((p) => p.status === "rejected");
    } else if (statusFilter === "draft") {
      filtered = filtered.filter((p) => p.status === "draft");
    } else if (statusFilter === "breaking") {
      filtered = filtered.filter((p) => isBreakingStillActive(p) || p.isQuickNews);
    }
  }

  if (compassFilter !== "all") {
    filtered = filtered.filter((p) => getPostCompasses(p).includes(compassFilter));
  }

  if (authorFilter !== "all" && isMaster) {
    filtered = filtered.filter((p) => p.author === authorFilter);
  }

  if (searchQ) {
    filtered = filtered.filter((p) => {
      const hay = `${p.title || ""} ${p.summary || ""} ${p.author || ""} ${(p.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(searchQ);
    });
  }

  if (!filtered.length) {
    listEl.innerHTML = `<div class="empty-state">${
      isMaster
        ? "لا توجد منشورات تطابق خيارات الفلترة الحالية."
        : "لا توجد لديك منشورات مسجلة بعد. ابدأ بكتابة مقالك الأول الآن!"
    }</div>`;
    return;
  }

  listEl.innerHTML = filtered
    .map((post) => {
      const status = post.status || "published";
      let statusBadgeHtml = `<span class="status-pill status-published"><span class="material-symbols-rounded" style="font-size:14px;" translate="no">check_circle</span> منشور</span>`;
      if (status === "review" || status === "pending") {
        statusBadgeHtml = `<span class="status-pill status-review"><span class="material-symbols-rounded" style="font-size:14px;" translate="no">pending_actions</span> قيد المراجعة</span>`;
      } else if (status === "rejected") {
        statusBadgeHtml = `<span class="status-pill status-breaking"><span class="material-symbols-rounded" style="font-size:14px;" translate="no">assignment_return</span> مُعاد للتعديل</span>`;
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

      const showApproveBtn = isMaster && (status === "review" || status === "pending" || status === "rejected");

      return `
        <article class="ops-post-row">
          <div class="ops-post-info">
            <img src="${escapeHtml(thumb)}" alt="" class="ops-post-thumb" loading="lazy">
            <div>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
                ${statusBadgeHtml}
                ${breakingBadge}
                <span class="views-secret-badge" title="عدد القراءات الفعلية من الزوار">
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
              ${
                status === "rejected" && post.rejectionNote
                  ? `<div class="post-rejection-note">ملاحظة القيادة: ${escapeHtml(post.rejectionNote)}</div>`
                  : ""
              }
            </div>
          </div>

          <div class="ops-post-actions">
            <button type="button" class="btn-outline sm-btn" data-post-preview="${escapeHtml(post.id)}" title="معاينة داخلية آمنة">
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

            <button type="button" class="btn-outline sm-btn" data-post-edit="${escapeHtml(post.id)}">
              <span class="material-symbols-rounded" translate="no">edit</span>
              <span>تعديل</span>
            </button>

            <a href="${PUBLIC_SITE_URL}/?post=${encodeURIComponent(
        post.id
      )}" target="_blank" rel="noopener noreferrer" class="btn-outline sm-btn" title="فتح الرابط في الموقع العام">
              <span class="material-symbols-rounded" translate="no">open_in_new</span>
            </a>

            <button type="button" class="btn-outline sm-btn danger-icon-btn" data-post-delete="${escapeHtml(
              post.id
            )}" title="حذف المنشور">
              <span class="material-symbols-rounded" translate="no">delete</span>
            </button>
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
  if (!isUserMasterAdmin()) return;
  try {
    await updateDoc(doc(db, "posts", postId), {
      status: "published",
      rejectionNote: "",
      approvedBy: state.userProfile?.name || "القيادة العليا",
      approvedAt: serverTimestamp()
    });
    showOpsToast("تم اعتماد المادة ونشرها في الموقع العام بنجاح");
    document.getElementById("article-preview-modal")?.classList.add("hidden");
  } catch (err) {
    console.error("Approve post error:", err);
    showOpsToast("تعذر اعتماد المنشور");
  }
}

async function rejectPostWithNote(postId) {
  if (!isUserMasterAdmin()) return;
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;

  const note = window.prompt(
    `اكتب ملاحظة التحرير أو سبب إعادة المقال للكاتب (${post.author}):`,
    post.rejectionNote || ""
  );
  if (note === null) return;

  try {
    await updateDoc(doc(db, "posts", postId), {
      status: "rejected",
      rejectionNote: note.trim()
    });
    showOpsToast("تم إرسال الملاحظة وإعادة المقال للكاتب للتعديل");
    document.getElementById("article-preview-modal")?.classList.add("hidden");
  } catch (err) {
    console.error("Reject post error:", err);
    showOpsToast("تعذر إعادة المقال");
  }
}

async function deletePostItem(postId) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;
  if (!isUserMasterAdmin() && !isPostOwnedByCurrentUser(post)) {
    showOpsToast("لا تملك صلاحية حذف هذا المقال");
    return;
  }
  if (!window.confirm(`هل أنت متأكد من حذف المنشور: "${post.title}" نهائياً؟`)) return;
  try {
    await deleteDoc(doc(db, "posts", postId));
    showOpsToast("تم حذف المنشور بنجاح");
  } catch (err) {
    console.error("Delete post error:", err);
    showOpsToast("حدث خطأ أثناء حذف المنشور");
  }
}

function openPostPreviewModal(postId) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;
  if (!isUserMasterAdmin() && !isPostOwnedByCurrentUser(post)) return;

  state.previewPostId = postId;
  const modal = document.getElementById("article-preview-modal");
  if (!modal) return;

  const compasses = getPostCompasses(post);
  const status = post.status || "published";

  const badgesEl = document.getElementById("preview-badges");
  if (badgesEl) {
    badgesEl.innerHTML = [
      `<span class="status-pill ${
        status === "published"
          ? "status-published"
          : status === "review"
          ? "status-review"
          : status === "rejected"
          ? "status-breaking"
          : "status-draft"
      }">${
        status === "published"
          ? "منشور"
          : status === "review"
          ? "قيد المراجعة"
          : status === "rejected"
          ? "مُعاد للتعديل"
          : "مسودة"
      }</span>`,
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
  } | التاريخ: ${formatArabicDate(post.createdAt)} | القراءات الفعلية: ${post.views || 0}`;

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

  const isMaster = isUserMasterAdmin();
  const approveBtn = document.getElementById("preview-approve-btn");
  const rejectBtn = document.getElementById("preview-reject-btn");

  if (approveBtn) {
    approveBtn.classList.toggle("hidden", !(isMaster && status !== "published"));
    approveBtn.onclick = () => approveAndPublishPost(post.id);
  }

  if (rejectBtn) {
    rejectBtn.classList.toggle("hidden", !(isMaster && status !== "published"));
    rejectBtn.onclick = () => rejectPostWithNote(post.id);
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

// ------------------- نهاية الجزء الأول (الأكبر) من البوابة الذكية التحريرية -------------------
/* ==========================================================================
   البوابة الذكية التحريرية — شبكة البوصلة الإخبارية (RAWI-YE.COM)
   المحرك البرمجي المستقل والمحصن (app.js) — الجزء الثاني والأخير:
   محرر المقالات، العواجل الموقوتة، حماية المسارات، ربط أحداث الدخول والأجهزة، والمزامنة
   ========================================================================== */

// ==================== 13. محرر المقالات المتقدم، رفع الصور، وحفظ الملكية ====================
async function handleEditorImageUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const statusEl = document.getElementById("image-upload-status");
  if (statusEl) statusEl.textContent = "جاري رفع الصورة وتجهيز الرابط المباشر...";

  try {
    const url = await uploadImageToImgbb(file);
    const urlInput = document.getElementById("post-image-url");
    if (urlInput) urlInput.value = url;
    if (statusEl) statusEl.textContent = "تم رفع الصورة وإدراج رابطها بنجاح";
    showOpsToast("تم رفع الصورة بنجاح");
  } catch (err) {
    console.error("Image upload error:", err);
    if (statusEl) statusEl.textContent = "تعذر الرفع التلقائي، يمكنك وضع رابط مباشر للصورة";
    showOpsToast("تعذر رفع الصورة، يرجى المحاولة مرة أخرى أو لصق رابط مباشر");
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
  if (!isUserMasterAdmin() && !isPostOwnedByCurrentUser(post)) {
    showOpsToast("عذراً، لا تملك صلاحية تعديل مقال لا يخصك");
    return;
  }

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

  const rejectionAlert = document.getElementById("editor-rejection-alert");
  const rejectionReason = document.getElementById("editor-rejection-reason");
  if (post.status === "rejected" && post.rejectionNote) {
    if (rejectionReason) rejectionReason.textContent = post.rejectionNote;
    rejectionAlert?.classList.remove("hidden");
  } else {
    rejectionAlert?.classList.add("hidden");
  }

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
  document.getElementById("editor-rejection-alert")?.classList.add("hidden");
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
    isFeatured: isUserMasterAdmin() ? Boolean(document.getElementById("post-is-featured")?.checked) : false,
    isBreaking,
    breakingDurationHours: breakingHours,
    breakingExpiresAt,
    isQuickNews: Boolean(document.getElementById("post-is-quick")?.checked),
    status: postStatus,
    rejectionNote: "",
    updatedAt: serverTimestamp()
  };

  try {
    if (editId) {
      await setDoc(doc(db, "posts", editId), payload, { merge: true });
    } else {
      await addDoc(collection(db, "posts"), {
        ...payload,
        authorId: authorProfile.id || "",
        authorUsername: (authorProfile.username || "").toLowerCase(),
        author: authorProfile.name || "هيئة التحرير",
        authorEmail: (authorProfile.email || authorProfile.username || "").toLowerCase(),
        authorAvatar: authorProfile.avatar || "",
        authorVerified: Boolean(authorProfile.verified || isUserMasterAdmin()),
        views: 0,
        createdAt: serverTimestamp()
      });
    }

    if (saveAsDraft) {
      showOpsToast("تم حفظ المادة في مسوداتك الخاصة بنجاح");
    } else if (postStatus === "published") {
      showOpsToast("تم نشر المادة الصحفية مباشرة في الموقع العام");
    } else {
      showOpsToast("تم إرسال مادتك إلى القيادة العليا للمراجعة والاعتماد");
    }

    resetArticleEditor();
    switchOpsTab("dashboard");
  } catch (err) {
    console.error("Save article error:", err);
    showOpsToast("حدث خطأ أثناء حفظ المقال، تحقق من اتصالك");
  }
}

// ==================== 14. النشر السريع للأخبار العاجلة الموقوتة ====================
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
    authorId: authorProfile.id || "",
    authorUsername: (authorProfile.username || "").toLowerCase(),
    author: authorProfile.name || "غرفة الأخبار العاجلة",
    authorEmail: (authorProfile.email || authorProfile.username || "").toLowerCase(),
    authorAvatar: authorProfile.avatar || "",
    authorVerified: Boolean(authorProfile.verified || isUserMasterAdmin()),
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

// ==================== 15. التنقل الذكي بين التبويبات وحماية المسارات ====================
function switchOpsTab(tabName) {
  const masterOnlyTabs = ["compasses", "staff", "ads", "settings"];
  if (masterOnlyTabs.includes(tabName) && !isUserMasterAdmin()) {
    showOpsToast("هذا القسم سيادي ومخصص للأدمن الرئيسي فقط");
    return;
  }

  state.activeTab = tabName;

  const sections = {
    dashboard: document.getElementById("tab-dashboard"),
    editor: document.getElementById("tab-editor"),
    notebook: document.getElementById("tab-notebook"),
    profile: document.getElementById("tab-profile"),
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
  // أحداث بوابة تسجيل الدخول المستقلة ورمز PIN
  document.getElementById("credentials-login-form")?.addEventListener("submit", handleCredentialsLoginSubmit);
  document.getElementById("pin-unlock-form")?.addEventListener("submit", handlePinUnlockSubmit);

  document.getElementById("switch-to-password-btn")?.addEventListener("click", () => {
    showAuthError("");
    showLoginCredentialsView();
  });

  document.getElementById("toggle-login-pass-btn")?.addEventListener("click", () => {
    const passInput = document.getElementById("login-password");
    if (!passInput) return;
    passInput.type = passInput.type === "password" ? "text" : "password";
  });

  document.getElementById("login-trust-device")?.addEventListener("change", (e) => {
    document.getElementById("login-pin-setup-wrap")?.classList.toggle("hidden", !e.target.checked);
  });

  document.getElementById("lock-session-btn")?.addEventListener("click", lockPortalSession);
  document.getElementById("logout-btn")?.addEventListener("click", logoutPortalCompletely);

  document.getElementById("dismiss-staff-alert-btn")?.addEventListener("click", async () => {
    document.getElementById("staff-alert-bar")?.classList.add("hidden");
    if (state.userProfile?.id) {
      await updateDoc(doc(db, "staff", state.userProfile.id), { adminAlert: "" }).catch(() => {});
    }
  });

  document.querySelectorAll("[data-ops-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-ops-tab");
      if (targetTab) switchOpsTab(targetTab);
    });
  });

  // الزر المركزي السحري (+)
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

  document.getElementById("magic-opt-note")?.addEventListener("click", () => {
    magicModal?.classList.add("hidden");
    resetNoteForm();
    switchOpsTab("notebook");
  });

  document.getElementById("magic-opt-ad")?.addEventListener("click", () => {
    magicModal?.classList.add("hidden");
    if (!isUserMasterAdmin()) {
      showOpsToast("إدارة الإعلانات مخصصة للأدمن الرئيسي فقط");
      return;
    }
    switchOpsTab("ads");
  });

  document.getElementById("new-article-trigger-btn")?.addEventListener("click", () => {
    resetArticleEditor();
    switchOpsTab("editor");
  });

  document.getElementById("quick-breaking-trigger-btn")?.addEventListener("click", () => {
    document.getElementById("quick-breaking-modal")?.classList.remove("hidden");
  });

  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modalId = btn.getAttribute("data-close-modal");
      if (modalId) document.getElementById(modalId)?.classList.add("hidden");
    });
  });

  ["ops-posts-search", "ops-filter-status", "ops-filter-compass", "ops-filter-author"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", renderOpsPostsList);
    el.addEventListener("change", renderOpsPostsList);
  });

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
  document.getElementById("quick-breaking-form")?.addEventListener("submit", submitQuickBreakingForm);

  // أحداث دفتر الملاحظات
  document.getElementById("notebook-form")?.addEventListener("submit", saveNotebookItem);
  document.getElementById("reset-note-form-btn")?.addEventListener("click", resetNoteForm);
  document.getElementById("notebook-search")?.addEventListener("input", (e) => {
    renderNotebookGrid(e.target.value);
  });

  // أحداث الملف الشخصي، الأجهزة الموثوقة، وتوثيق الهوية (KYC)
  document.getElementById("my-profile-form")?.addEventListener("submit", saveMyPersonalProfile);
  document.getElementById("revoke-all-devices-btn")?.addEventListener("click", revokeAllMyTrustedDevices);

  document.getElementById("my-prof-avatar-file")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const statusEl = document.getElementById("my-avatar-upload-status");
    if (statusEl) statusEl.textContent = "جاري رفع صورتك الشخصية...";
    try {
      const url = await uploadImageToImgbb(file);
      document.getElementById("my-prof-avatar").value = url;
      if (statusEl) statusEl.textContent = "تم رفع الصورة بنجاح";
      showOpsToast("تم رفع صورتك الشخصية بنجاح");
    } catch (_) {
      if (statusEl) statusEl.textContent = "تعذر رفع الصورة، جرب رابطاً مباشراً";
      showOpsToast("تعذر رفع الصورة");
    }
  });

  document.getElementById("kyc-update-identity-btn")?.addEventListener("click", () => {
    document.getElementById("kyc-request-form")?.classList.remove("hidden");
    document.getElementById("kyc-doc-url")?.focus();
    showOpsToast("أرفق وثيقة الهوية المحدثة؛ سيتم إحالة التعديل لمراجعة القيادة العليا");
  });

  document.getElementById("kyc-request-form")?.addEventListener("submit", submitKycVerificationRequest);
  document.getElementById("kyc-doc-file")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImageToImgbb(file);
      document.getElementById("kyc-doc-url").value = url;
      showOpsToast("تم رفع وثيقة الهوية بنجاح");
    } catch (_) {
      showOpsToast("تعذر رفع وثيقة الهوية");
    }
  });

  // أحداث البوصلات، الكادر، الإعلانات، والإعدادات السيادية
  document.getElementById("compass-form")?.addEventListener("submit", saveCompassItem);
  document.getElementById("reset-compass-form-btn")?.addEventListener("click", resetCompassForm);
  document.getElementById("seed-default-compasses-btn")?.addEventListener("click", seedDefaultCompassesToDb);

  document.getElementById("staff-form")?.addEventListener("submit", saveStaffMember);
  document.getElementById("reset-staff-form-btn")?.addEventListener("click", resetStaffForm);
  document.getElementById("ops-staff-search")?.addEventListener("input", (e) => {
    renderStaffList(e.target.value);
  });
  document.getElementById("staff-avatar-file")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImageToImgbb(file);
      document.getElementById("staff-avatar").value = url;
      showOpsToast("تم رفع صورة الكاتب بنجاح");
    } catch (_) {
      showOpsToast("تعذر رفع الصورة");
    }
  });

  document.getElementById("ad-form")?.addEventListener("submit", saveAdItem);
  document.getElementById("reset-ad-form-btn")?.addEventListener("click", resetAdForm);

  document.getElementById("sovereign-settings-form")?.addEventListener("submit", saveSovereignSettings);
}

function startOpsRealtimeListeners() {
  onSnapshot(doc(db, "settings", "general"), (snap) => {
    if (snap.exists()) {
      state.settings = { ...state.settings, ...snap.data() };
    }
    populateSettingsForm();
  });

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

  onSnapshot(collection(db, "staff"), (snap) => {
    state.staff = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderStaffList(document.getElementById("ops-staff-search")?.value || "");
    populateAuthorFilterDropdown();

    if (state.userProfile?.id) {
      const updatedMe = state.staff.find((s) => s.id === state.userProfile.id);
      if (updatedMe) {
        if (updatedMe.suspended && !updatedMe.isMasterAdmin && updatedMe.role !== "admin") {
          logoutPortalCompletely();
          return;
        }
        state.userProfile = updatedMe;
        applyUserInterfacePermissions();
        populateMyProfileTab();
      }
    }
  });

  onSnapshot(collection(db, "posts"), (snap) => {
    state.posts = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => getPostTimestampMs(b) - getPostTimestampMs(a));

    populateAuthorFilterDropdown();
    renderOpsPostsList();
  });

  onSnapshot(collection(db, "ads"), (snap) => {
    state.ads = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderAdsManagerList();
  });
}

// ==================== 17. نقطة انطلاق البوابة الذكية التحريرية ====================
document.addEventListener("DOMContentLoaded", () => {
  populateCompassSelectorsAndFilters();
  populateSettingsForm();
  bindOpsEvents();
  verifyStartupSessionAndTrustedDevice();
});
