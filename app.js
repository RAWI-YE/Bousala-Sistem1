/* ==========================================================================
   غرفة العمليات المركزية — شبكة البوصلة الإخبارية (RAWI-YE.COM)
   المحرك البرمجي المحصن (app.js) — الجزء الأول (الجزء الأكبر):
   الأمان الصارم، العزل، الإعدادات، الكادر وطلبات KYC، دفتر الملاحظات، الملف الشخصي، البوصلات، والإعلانات
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

try {
  localStorage.removeItem("firebaseConfig");
  localStorage.setItem("bawsala_firebase_config", JSON.stringify(FIREBASE_CONFIG));
} catch (_) {}

const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
auth.languageCode = "ar";
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const IMGBB_API_KEY = "c2fd857fff0abe7b1a8a33b57cb621c6";
const PUBLIC_SITE_URL = "https://networkbawsala.rawi-ye.com";

// القائمة السيادية لبريد القيادة العليا (صلاحية مطلقة دائماً)
const SUPER_ADMIN_EMAILS = [
  "rawialshamal@gmail.com",
  "a1hmedrashad@gmail.com"
];

function isSuperAdminEmail(email = "") {
  return SUPER_ADMIN_EMAILS.includes(String(email || "").trim().toLowerCase());
}

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
  notes: [],
  activeTab: "dashboard",
  previewPostId: null,
  listenersStarted: false,
  notesUnsubscribe: null
};

// ==================== 4. الدوال المساعدة، رفع الصور، وفحص الصلاحيات الصارم ====================
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

// دالة موحدة لرفع الصور إلى ImgBB وإرجاع الرابط المباشر
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

// دوال التحقق من الرتب والعزل الأمني (RBAC)
function isUserAdmin() {
  if (state.currentUser && isSuperAdminEmail(state.currentUser.email)) return true;
  return Boolean(state.userProfile && state.userProfile.role === "admin");
}

function isUserEditorOrAdmin() {
  if (isUserAdmin()) return true;
  return Boolean(
    state.userProfile && (state.userProfile.role === "admin" || state.userProfile.role === "editor")
  );
}

function canUserPublishDirectly() {
  if (isUserEditorOrAdmin()) return true;
  if (!state.userProfile) return false;
  if (state.userProfile.requireReview) return false;
  return Boolean(state.userProfile.verified);
}

// فحص هل يملك المستخدم الحالي ملكية هذا المقال تحديداً؟
function isPostOwnedByCurrentUser(post) {
  if (!post || !state.userProfile) return false;
  const myEmail = (state.userProfile.email || state.currentUser?.email || "").trim().toLowerCase();
  const postEmail = (post.authorEmail || "").trim().toLowerCase();
  if (myEmail && postEmail && myEmail === postEmail) return true;
  if (state.userProfile.name && post.author && state.userProfile.name.trim() === post.author.trim()) {
    return true;
  }
  return false;
}

function getRoleArabicName(role) {
  if (role === "admin") return "قيادة عليا (مدير عام)";
  if (role === "editor") return "محرر ومراجع صحفي";
  return "كاتب وصحفي";
}

// ==================== 5. البوابة الأمنية المغلقة (منع الدخول العشوائي تماماً) ====================
async function triggerGoogleLogin() {
  const errBox = document.getElementById("auth-error-box");
  const errText = document.getElementById("auth-error-text");
  const loginBtn = document.getElementById("google-login-btn");

  errBox?.classList.add("hidden");
  if (loginBtn) loginBtn.disabled = true;

  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.warn("Popup sign-in notice:", err?.code || err);

    if (
      err?.code === "auth/popup-blocked" ||
      err?.code === "auth/cancelled-popup-request" ||
      err?.code === "auth/operation-not-supported-in-this-environment"
    ) {
      try {
        showOpsToast("جاري توجيهك لبوابة Google الآمنة...");
        await signInWithRedirect(auth, googleProvider);
        return;
      } catch (redirErr) {
        console.error("Redirect sign-in error:", redirErr);
      }
    }

    if (err?.code !== "auth/popup-closed-by-user") {
      if (errBox && errText) {
        errText.textContent = `تعذر تسجيل الدخول (${err?.code || "خطأ اتصال"}). يرجى المحاولة مرة أخرى.`;
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

  const isSuper = isSuperAdminEmail(emailKey);

  try {
    const staffRef = doc(db, "staff", emailKey);
    const staffSnap = await getDoc(staffRef);

    let profileData = null;

    if (staffSnap.exists()) {
      profileData = { id: emailKey, email: emailKey, ...staffSnap.data() };

      // إذا كان البريد ضمن القائمة السيادية، نضمن ترقيته الفورية دائماً
      if (isSuper && (profileData.role !== "admin" || !profileData.verified || profileData.suspended)) {
        profileData.role = "admin";
        profileData.verified = true;
        profileData.requireReview = false;
        profileData.suspended = false;
        await setDoc(
          staffRef,
          { role: "admin", verified: true, requireReview: false, suspended: false },
          { merge: true }
        );
      }

      // تحديث تلقائي للصورة في حال لم يكن لدى الصحفي صورة محفوظة واستخدم صورة جوجل
      if (!profileData.avatar && firebaseUser.photoURL) {
        profileData.avatar = firebaseUser.photoURL;
        await updateDoc(staffRef, { avatar: firebaseUser.photoURL }).catch(() => {});
      }
    } else if (isSuper) {
      // فقط البريدان السياديان لـ أحمد رشاد يتم إنشاؤهما تلقائياً كقيادة عليا
      profileData = {
        id: emailKey,
        email: emailKey,
        name: firebaseUser.displayName || "أحمد رشاد",
        avatar: firebaseUser.photoURL || "",
        role: "admin",
        jobTitle: "المدير العام ورئيس التحرير",
        verified: true,
        requireReview: false,
        suspended: false,
        createdAt: serverTimestamp()
      };
      await setDoc(staffRef, profileData, { merge: true });
    } else {
      // إغلاق ثغرة الباب المفتوح: أي شخص آخر غير مضاف مسبقاً من القيادة يتم رفضه وطرده فوراً!
      if (errBox && errText) {
        errText.textContent = `عذراً، البريد (${emailKey}) غير مدرج ضمن الكادر الصحفي المعتمد في شبكة البوصلة. لا يمكنك الدخول إلا بعد اعتماد بريدك من قِبل القيادة العليا.`;
        errBox.classList.remove("hidden");
      }
      await signOut(auth);
      return;
    }

    if (profileData.suspended && !isSuper) {
      if (errBox && errText) {
        errText.textContent = "تم تجميد حسابك الصحفي مؤقتاً بقرار من إدارة التحرير. يرجى مراجعة القيادة.";
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
    populateMyProfileTab();
    startPersonalNotebookListener();

    if (!state.listenersStarted) {
      state.listenersStarted = true;
      startOpsRealtimeListeners();
    }
  } catch (err) {
    console.error("Auth gate error:", err);
    if (errBox && errText) {
      errText.textContent = "تعذر التحقق من سجل الكادر الصحفي. تأكد من اتصالك بالإنترنت.";
      errBox.classList.remove("hidden");
    }
  }
}

function applyUserInterfacePermissions() {
  const p = state.userProfile;
  if (!p) return;

  const adminFlag = isUserAdmin();
  const editorOrAdminFlag = isUserEditorOrAdmin();
  const effectiveRole = adminFlag ? "admin" : p.role || "writer";

  const nameEl = document.getElementById("current-user-name");
  if (nameEl) nameEl.textContent = p.name || p.email;

  const avatarUrl =
    p.avatar ||
    state.currentUser?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || "صحفي")}&background=1d4ed8&color=fff`;

  const avatarEl = document.getElementById("current-user-avatar");
  if (avatarEl) avatarEl.src = avatarUrl;

  const roleBadge = document.getElementById("current-user-role-badge");
  if (roleBadge) roleBadge.textContent = getRoleArabicName(effectiveRole);

  const verIcon = document.getElementById("current-user-verified");
  if (verIcon) verIcon.classList.toggle("hidden", !(p.verified || adminFlag));

  // عزل التبويبات والأزرار السيادية عن الكاتب العادي تماماً
  const adminOnlyIds = ["nav-tab-staff", "nav-tab-settings", "dock-btn-staff"];
  const editorOrAdminIds = [
    "nav-tab-compasses",
    "nav-tab-ads",
    "magic-opt-ad",
    "ops-filter-author",
    "post-is-featured"
  ];

  adminOnlyIds.forEach((id) => {
    document.getElementById(id)?.classList.toggle("hidden", !adminFlag);
  });

  // في الشريط السفلي للهاتف: إذا لم يكن مديراً، نظهر له زر "الميثاق" بدلاً من زر "الكادر"
  document.getElementById("dock-btn-charter")?.classList.toggle("hidden", adminFlag);

  editorOrAdminIds.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === "post-is-featured") {
      el.closest(".check-pill")?.classList.toggle("hidden", !editorOrAdminFlag);
    } else {
      el.classList.toggle("hidden", !editorOrAdminFlag);
    }
  });

  // تخصيص العناوين الإحصائية لتعكس العزل الشخصي للكاتب أو الشمولية للقيادة
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  if (editorOrAdminFlag) {
    setTxt("nav-label-dashboard", "لوحة المتابعة الشاملة");
    setTxt("dashboard-panel-heading", "إدارة كافة منشورات الشبكة والمراجعة");
    setTxt("stat-label-published", "إجمالي المنشور بالشبكة");
    setTxt("stat-label-review", "مقالات بانتظار المراجعة");
    setTxt("stat-label-draftOrBreaking", "عواجل وأخبار سريعة نشطة");
    setTxt("stat-label-views", "إجمالي قراءات الشبكة");
  } else {
    setTxt("nav-label-dashboard", "مقالاتي ومنشوراتي");
    setTxt("dashboard-panel-heading", "إدارة مقالاتي ومسوداتي الخاصة");
    setTxt("stat-label-published", "مقالاتي المنشورة");
    setTxt("stat-label-review", "مقالاتي قيد المراجعة");
    setTxt("stat-label-draftOrBreaking", "مسوداتي وملاحظاتي");
    setTxt("stat-label-views", "إجمالي قراءات مقالاتي");
  }

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
        "تتمتع بصلاحية النشر المباشر المعتمدة. أي مادة تعتمدها ستُنشر فوراً في الموقع العام باسمك وصورتك.";
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

// ==================== 6. قسم "دفتر الملاحظات" الشخصي للصحفي (Journalist Notebook) ====================
function startPersonalNotebookListener() {
  if (state.notesUnsubscribe) {
    state.notesUnsubscribe();
    state.notesUnsubscribe = null;
  }
  const myEmail = (state.userProfile?.email || state.currentUser?.email || "").trim().toLowerCase();
  if (!myEmail) return;

  const notesQuery = query(collection(db, "notes"), where("ownerEmail", "==", myEmail));
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
  const myEmail = (state.userProfile?.email || state.currentUser?.email || "").trim().toLowerCase();
  if (!myEmail) return;

  const editId = (document.getElementById("note-edit-id")?.value || "").trim();
  const title = (document.getElementById("note-title")?.value || "").trim();
  const content = (document.getElementById("note-content")?.value || "").trim();
  if (!title || !content) return;

  const payload = {
    ownerEmail: myEmail,
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

// ==================== 7. قسم "ملفي الشخصي والتوثيق (KYC)" + مزامنة صور الكاتب ====================
function populateMyProfileTab() {
  const p = state.userProfile;
  if (!p) return;

  const avatarUrl =
    p.avatar ||
    state.currentUser?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || "صحفي")}&background=1d4ed8&color=fff`;

  const cardAvatar = document.getElementById("my-profile-card-avatar");
  if (cardAvatar) cardAvatar.src = avatarUrl;

  const cardName = document.getElementById("my-profile-card-name");
  if (cardName) cardName.textContent = p.name || "";

  const cardVer = document.getElementById("my-profile-card-verified");
  if (cardVer) cardVer.classList.toggle("hidden", !(p.verified || isUserAdmin()));

  const cardRole = document.getElementById("my-profile-card-role");
  if (cardRole) cardRole.textContent = p.jobTitle || getRoleArabicName(p.role);

  // إشعار الاسم قيد المراجعة إن وجد
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

  // تعبئة حقول التعديل الشخصي
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  };

  setVal("my-prof-name", p.name || "");
  setVal("my-prof-job", p.jobTitle || "");
  setVal("my-prof-email", p.email || "");
  setVal("my-prof-phone", p.phone || "");
  setVal("my-prof-avatar", p.avatar || "");
  setVal("my-prof-bio", p.bio || "");
  setVal("my-prof-x", p.socials?.x || "");
  setVal("my-prof-fb", p.socials?.facebook || "");

  // حالة قسم التوثيق KYC
  const kycDesc = document.getElementById("kyc-status-desc");
  const kycForm = document.getElementById("kyc-request-form");
  if (p.verified || isUserAdmin()) {
    if (kycDesc) {
      kycDesc.innerHTML = `<strong style="color:var(--success);">حسابك موثق رسمياً بالشارة الزرقاء المعتمدة في شبكة البوصلة.</strong>`;
    }
    kycForm?.classList.add("hidden");
  } else if (p.kycStatus === "pending") {
    if (kycDesc) {
      kycDesc.innerHTML = `<strong style="color:var(--warning);">طلب التوثيق الخاص بك قيد المراجعة حالياً لدى القيادة العليا.</strong>`;
    }
    kycForm?.classList.add("hidden");
  } else {
    kycForm?.classList.remove("hidden");
  }
}

// مزامنة صورة الكاتب واسمه في جميع مقالاته المنشورة لضمان ظهورها في كل مكان بالموقع العام
async function syncWriterIdentityAcrossPosts(emailKey, newAvatar, newName, isVerified) {
  try {
    const myPosts = state.posts.filter(
      (post) => (post.authorEmail || "").trim().toLowerCase() === emailKey.toLowerCase()
    );
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

async function saveMyPersonalProfile(e) {
  e.preventDefault();
  const p = state.userProfile;
  if (!p) return;

  const oldEmail = (p.email || p.id || "").trim().toLowerCase();
  const newEmail = (document.getElementById("my-prof-email")?.value || "").trim().toLowerCase();
  const requestedName = (document.getElementById("my-prof-name")?.value || "").trim();
  const jobTitle = (document.getElementById("my-prof-job")?.value || "").trim();
  const phone = (document.getElementById("my-prof-phone")?.value || "").trim();
  const avatar = (document.getElementById("my-prof-avatar")?.value || "").trim();
  const bio = (document.getElementById("my-prof-bio")?.value || "").trim();
  const socialX = (document.getElementById("my-prof-x")?.value || "").trim();
  const socialFb = (document.getElementById("my-prof-fb")?.value || "").trim();

  if (!newEmail || !requestedName) {
    showOpsToast("الاسم والبريد الإلكتروني حقول أساسية لا يمكن تركها فارغة");
    return;
  }

  // تطبيق شرطك الأمني: المدير يغير اسمه فوراً، أما الصحفي فإذا غيّر اسمه يُحال الاسم الجديد للمراجعة!
  let finalName = p.name;
  let pendingName = p.pendingName || "";

  if (requestedName !== p.name) {
    if (isUserAdmin()) {
      finalName = requestedName;
      pendingName = "";
    } else {
      pendingName = requestedName;
    }
  }

  const updatedProfile = {
    ...p,
    name: finalName,
    pendingName,
    email: newEmail,
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
    if (newEmail !== oldEmail) {
      // ترحيل ملف الصحفي ومقالاته وملاحظاته إلى بريده الجديد بسلاسة
      await setDoc(doc(db, "staff", newEmail), updatedProfile, { merge: true });
      for (const post of state.posts) {
        if ((post.authorEmail || "").toLowerCase() === oldEmail) {
          await updateDoc(doc(db, "posts", post.id), {
            authorEmail: newEmail,
            authorAvatar: avatar
          }).catch(() => {});
        }
      }
      for (const note of state.notes) {
        await updateDoc(doc(db, "notes", note.id), { ownerEmail: newEmail }).catch(() => {});
      }
      if (!isSuperAdminEmail(oldEmail)) {
        await deleteDoc(doc(db, "staff", oldEmail)).catch(() => {});
      }
      state.userProfile = { ...updatedProfile, id: newEmail };
      showOpsToast(`تم تحديث بياناتك وترحيل حسابك إلى البريد الجديد (${newEmail})`);
    } else {
      await setDoc(doc(db, "staff", oldEmail), updatedProfile, { merge: true });
      state.userProfile = { ...updatedProfile, id: oldEmail };
      await syncWriterIdentityAcrossPosts(oldEmail, avatar, finalName, p.verified);

      if (pendingName && pendingName !== p.name) {
        showOpsToast("تم حفظ بياناتك وصورتك، وإحالة طلب تغيير الاسم لموافقة القيادة العليا");
      } else {
        showOpsToast("تم حفظ وتحديث بياناتك وصورتك الشخصية في الموقع بنجاح");
      }
    }

    applyUserInterfacePermissions();
    populateMyProfileTab();
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
    showOpsToast("يرجى رفع صورة الوثيقة أو كتابة توضيح لطلب التوثيق");
    return;
  }

  try {
    await updateDoc(doc(db, "staff", p.id), {
      kycStatus: "pending",
      kycDocUrl: docUrl,
      kycNote: note,
      kycRequestedAt: serverTimestamp()
    });
    state.userProfile.kycStatus = "pending";
    populateMyProfileTab();
    showOpsToast("تم إرسال طلب التوثيق بالشارة الزرقاء إلى القيادة العليا بنجاح");
  } catch (err) {
    console.error("KYC request error:", err);
    showOpsToast("تعذر إرسال طلب التوثيق");
  }
}

// ==================== 8. الإعدادات السيادية والميثاق الصحفي ====================
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
    showOpsToast("تعذر حفظ الإعدادات، تحقق من الاتصال");
  }
}

// ==================== 9. إدارة الكادر الصحفي، مراجعة طلبات التوثيق والأسماء، والترحيب ====================
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

// عرض طلبات التوثيق (KYC) وطلبات تغيير الاسم للقيادة العليا
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

  if (!pendingItems.length || !isUserAdmin()) {
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
            <strong>الصحفي: ${escapeHtml(s.name)} (${escapeHtml(s.email)})</strong>

            ${
              hasNameReq
                ? `<div class="alert-banner alert-warning">
                    <span>يطلب تغيير اسمه الصحفي إلى: <strong>"${escapeHtml(s.pendingName)}"</strong></span>
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
                      <span><strong>طلب توثيق بالشارة الزرقاء (KYC):</strong> ${escapeHtml(s.kycNote || "بدون ملاحظة")}</span>
                      ${
                        s.kycDocUrl
                          ? ` — <a href="${escapeHtml(s.kycDocUrl)}" target="_blank" rel="noopener" style="color:var(--primary);font-weight:900;text-decoration:underline;">فتح صورة الوثيقة المرفقة</a>`
                          : ""
                      }
                    </div>
                    <div style="display:flex;gap:6px;">
                      <button type="button" class="btn-success sm-btn" data-approve-kyc="${escapeHtml(s.id)}">توثيق ومنح الشارة</button>
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
      await updateDoc(doc(db, "staff", id), { verified: true, kycStatus: "approved" });
      await syncWriterIdentityAcrossPosts(id, member.avatar, member.name, true);
      showOpsToast(`تم توثيق (${member.name}) بالشارة الزرقاء بنجاح`);
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

      const memberRole = isSuperAdminEmail(s.email) ? "admin" : s.role;
      const statusBadges = [];
      statusBadges.push(`<span class="role-badge">${escapeHtml(getRoleArabicName(memberRole))}</span>`);

      if (s.verified || isSuperAdminEmail(s.email)) {
        statusBadges.push(
          `<span class="status-pill status-published"><span class="material-symbols-rounded" style="font-size:14px;" translate="no">verified</span> موثق بالشارة الزرقاء</span>`
        );
      }
      if (s.requireReview && !isSuperAdminEmail(s.email)) {
        statusBadges.push(
          `<span class="status-pill status-review"><span class="material-symbols-rounded" style="font-size:14px;" translate="no">policy</span> مقيد بالمراجعة الإلزامية</span>`
        );
      }
      if (s.suspended && !isSuperAdminEmail(s.email)) {
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

  const avatar = (document.getElementById("staff-avatar")?.value || "").trim();
  const verified = isSuperAdminEmail(emailKey)
    ? true
    : Boolean(document.getElementById("staff-verified")?.checked);

  const payload = {
    name,
    email: emailKey,
    phone: (document.getElementById("staff-phone")?.value || "").trim(),
    role: isSuperAdminEmail(emailKey) ? "admin" : document.getElementById("staff-role")?.value || "writer",
    jobTitle: (document.getElementById("staff-job-title")?.value || "").trim() || "كاتب ومحرر صحفي",
    avatar,
    bio: (document.getElementById("staff-bio")?.value || "").trim(),
    verified,
    requireReview: isSuperAdminEmail(emailKey)
      ? false
      : Boolean(document.getElementById("staff-require-review")?.checked),
    suspended: isSuperAdminEmail(emailKey)
      ? false
      : Boolean(document.getElementById("staff-suspended")?.checked),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, "staff", emailKey), payload, { merge: true });
    await syncWriterIdentityAcrossPosts(emailKey, avatar, name, verified);
    showOpsToast(`تم اعتماد وحفظ بيانات الصحفي (${name}) ومزامنة صورته بنجاح`);
    resetStaffForm();
  } catch (err) {
    console.error("Save staff error:", err);
    showOpsToast("حدث خطأ أثناء حفظ بيانات الصحفي");
  }
}

// ==================== 10. إدارة البوصلات والأقسام والإعلانات ====================
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
  if (!isUserEditorOrAdmin()) return;

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
  if (!isUserEditorOrAdmin()) return;
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
  if (!isUserEditorOrAdmin()) return;

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

// ------------------- نهاية الجزء الأول (الأكبر) من غرفة العمليات -------------------
