import type { Locale } from "@/contexts/language-context";

export function nav(locale: Locale) {
  const t = {
    ar: {
      brand: "jawla",
      tours: "الجولات",
      newTour: "جولة جديدة",
      signOut: "تسجيل الخروج",
    },
    en: {
      brand: "jawla",
      tours: "Tours",
      newTour: "New Tour",
      signOut: "Sign out",
    },
  };
  return t[locale];
}

export function dashboardHome(locale: Locale) {
  const t = {
    ar: {
      title: "جولاتك",
      createNew: "إنشاء جولة",
      noTours: "لا توجد جولات بعد.",
      loadFailed: "تعذّر تحميل الجولات:",
      view: "عرض",
      manage: "إدارة",
    },
    en: {
      title: "Your tours",
      createNew: "Create new",
      noTours: "No tours yet.",
      loadFailed: "Failed to load tours:",
      view: "View",
      manage: "Manage",
    },
  };
  return t[locale];
}

export function authCopy(locale: Locale) {
  const t = {
    ar: {
      title: "تسجيل الدخول إلى jawla",
      subtitle: "تابع عبر Google أو استخدم البريد وكلمة المرور.",
      google: "تسجيل الدخول عبر Google",
      or: "أو",
      signIn: "دخول",
      signUp: "حساب جديد",
      fullName: "الاسم الكامل (اختياري)",
      emailPlaceholder: "you@example.com",
      passwordPlaceholder: "••••••••",
      wait: "يرجى الانتظار...",
      createAccount: "إنشاء حساب",
      signInBtn: "تسجيل الدخول",
      googleUrlMissing: "لم يُرجع رابط Google. حاول مرة أخرى.",
      googleFailed: "فشل تسجيل الدخول عبر Google.",
      accountCreated: "تم إنشاء الحساب. جاري التوجيه...",
      confirmEmailHint:
        "تم إنشاء الحساب، لكن تأكيد البريد مفعّل في Supabase. عطّله من إعدادات Auth لتفعيل التسجيل الفوري.",
      signedInRedirect: "تم تسجيل الدخول. جاري التوجيه...",
    },
    en: {
      title: "Sign in to jawla",
      subtitle: "Continue with Google or use your email and password.",
      google: "Sign in with Google",
      or: "or",
      signIn: "Sign in",
      signUp: "Sign up",
      fullName: "Full name (optional)",
      emailPlaceholder: "you@example.com",
      passwordPlaceholder: "••••••••",
      wait: "Please wait...",
      createAccount: "Create account",
      signInBtn: "Sign in",
      googleUrlMissing: "Google sign-in URL was not returned. Please try again.",
      googleFailed: "Google sign-in failed.",
      accountCreated: "Account created successfully. Redirecting...",
      confirmEmailHint:
        "Account created, but Supabase email confirmation is enabled. Disable it in Supabase Auth settings for instant signup.",
      signedInRedirect: "Signed in successfully. Redirecting...",
    },
  };
  return t[locale];
}

export function newTourCopy(locale: Locale) {
  const t = {
    ar: {
      title: "إنشاء جولة جديدة",
      tourTitle: "عنوان الجولة",
      tourTitlePlaceholder: "شقة إطلالة بحرية",
      language: "لغة الجولة",
      english: "الإنجليزية",
      arabic: "العربية",
      creating: "جاري الإنشاء...",
      createTour: "إنشاء الجولة",
      failedCreate: "تعذّر إنشاء الجولة",
      unexpected: "حدث خطأ غير متوقع",
    },
    en: {
      title: "Create new tour",
      tourTitle: "Title",
      tourTitlePlaceholder: "Sea View Apartment",
      language: "Language",
      english: "English",
      arabic: "Arabic",
      creating: "Creating...",
      createTour: "Create tour",
      failedCreate: "Failed to create tour",
      unexpected: "Unexpected error",
    },
  };
  return t[locale];
}

export function tourManageHeader(locale: Locale) {
  const t = {
    ar: {
      emptyHint: "أضف أول غرفة لبدء رفع الصور.",
      subtitle: "إدارة الغرف والصور ونقاط الانتقال والنشر.",
    },
    en: {
      emptyHint: "Add your first room to start uploading photos.",
      subtitle: "Manage rooms, photos, hotspots, and publishing.",
    },
  };
  return t[locale];
}

export function captureSteps(locale: Locale): string[] {
  const ar = [
    "قف في المنتصف ووجّه الكاميرا نحو الجدار الأول مع إظهار الأرض والسقف.",
    "ادر ٩٠° يميناً نحو الجدار الثاني مع تداخل حوالي ٣٠٪ مع الصورة السابقة.",
    "استمر إلى الجدار الثالث بنفس الارتفاع والتداخل.",
    "أكمل الجدار الرابع لإغلاق حلقة ٣٦٠°.",
    "اختياري: صوّر زاوية إضافية لتحسين استمرارية الدمج.",
  ];
  const en = [
    "Stand in the center, face wall 1, and keep floor + ceiling visible.",
    "Rotate 90° right to wall 2 with ~30% overlap from previous photo.",
    "Rotate to wall 3 with the same height and overlap.",
    "Rotate to wall 4 and complete the full 360 loop.",
    "Optional: capture one corner detail to improve stitching continuity.",
  ];
  return locale === "ar" ? ar : en;
}

export function manageTour(locale: Locale) {
  const t = {
    ar: {
      rooms: "الغرف",
      addRoom: "إضافة غرفة",
      livingPlaceholder: "غرفة المعيشة",
      add: "إضافة",
      noPanorama: "لا يوجد بانوراما بعد. ارفع الصور ثم اضغط «إنشاء بانوراما».",
      guidedTitle: "التقاط موجّه للغرفة",
      guidedIntro: (min: number) =>
        `التقط الصور بالتتابع لدمج أفضل. الحد الأدنى: ${min}.`,
      step: "الخطوة",
      nextPhoto: (cur: number, min: number) => `الصورة التالية (${cur}/${min})`,
      optionalExtra: "صورة إضافية اختيارية",
      generating: "جاري الإنشاء...",
      needMore: (n: number) => (n === 1 ? "يلزم صورة واحدة أخرى" : `يلزم ${n} صور أخرى`),
      generatePanorama: "إنشاء بانوراما",
      hotspotTitle: "إنشاء نقطة انتقال",
      hotspotWalkHint:
        "ضع النقاط عند الممرات أو الأبواب — الزوار ينتقلون بين الغرف في نفس النافذة (مثل Street View).",
      hotspotHint: "استخدم مركز العارض الحالي أو عدّل القيم يدوياً.",
      yaw: "انحراف",
      pitch: "ميل",
      labelPlaceholder: "تسمية (اختياري)",
      saveHotspot: "حفظ النقطة",
      publishTour: "نشر الجولة",
      publishedAt: (slug: string) => `منشور على /t/${slug}`,
      uploading: "جاري رفع الملفات...",
      failedAddRoom: "تعذّر إضافة الغرفة",
      failedRecord: "تعذّر تسجيل الصورة",
      uploadFail: "فشل الرفع",
      enoughPhotos: "ممتاز. لديك صور كافية لإنشاء البانوراما.",
      addMore: (remaining: number) =>
        remaining === 1 ? "تم الرفع. أضف صورة موجّهة أخرى." : `تم الرفع. أضف ${remaining} صور موجّهة أخرى.`,
      needMinPhotos: (min: number) =>
        `يلزم التقاط ${min} صور على الأقل (واحدة لكل جدار) قبل إنشاء البانوراما.`,
      stitchFailed: "فشل الدمج",
      failedHotspot: "تعذّر إنشاء نقطة الانتقال",
      hotspotAdded: "تمت إضافة نقطة الانتقال.",
      failedPublish: "تعذّر نشر الجولة",
      tourPublished: "تم نشر الجولة.",
      panoramaGenerated: "تم إنشاء البانوراما.",
    },
    en: {
      rooms: "Rooms",
      addRoom: "Add room",
      livingPlaceholder: "Living room",
      add: "Add",
      noPanorama: "No panorama yet. Upload photos and click Generate panorama.",
      guidedTitle: "Guided room capture",
      guidedIntro: (min: number) =>
        `Capture photos in sequence for better stitching. Minimum required: ${min}.`,
      step: "Step",
      nextPhoto: (cur: number, min: number) => `Next photo (${cur}/${min})`,
      optionalExtra: "Add optional extra photo",
      generating: "Generating...",
      needMore: (n: number) => `Need ${n} more photo${n > 1 ? "s" : ""}`,
      generatePanorama: "Generate panorama",
      hotspotTitle: "Create hotspot",
      hotspotWalkHint:
        "Place hotspots at doorways or hallways — visitors walk between rooms in one viewer (Street View–style).",
      hotspotHint: "Use current viewer center point or edit values manually.",
      yaw: "Yaw",
      pitch: "Pitch",
      labelPlaceholder: "Label (optional)",
      saveHotspot: "Save hotspot",
      publishTour: "Publish tour",
      publishedAt: (slug: string) => `Already published at /t/${slug}`,
      uploading: "Uploading files...",
      failedAddRoom: "Failed to add room",
      failedRecord: "Failed to record uploaded photo",
      uploadFail: "Upload failed",
      enoughPhotos: "Great. You have enough photos to generate panorama.",
      addMore: (remaining: number) =>
        `Photo uploaded. Add ${remaining} more guided shot${remaining > 1 ? "s" : ""}.`,
      needMinPhotos: (min: number) =>
        `Please capture at least ${min} photos (one per wall) before generating panorama.`,
      stitchFailed: "Stitching failed",
      failedHotspot: "Failed to create hotspot",
      hotspotAdded: "Hotspot added.",
      failedPublish: "Failed to publish tour",
      tourPublished: "Tour published.",
      panoramaGenerated: "Panorama generated.",
    },
  };
  return t[locale];
}

export function publicTour(locale: Locale) {
  const t = {
    ar: {
      noRooms: "لا توجد غرف في هذه الجولة.",
      shareWhatsApp: "مشاركة عبر واتساب",
      waText: (url: string) => `جولة افتراضية 360: ${url}`,
      noPanorama: "البانوراما غير متاحة. عرض صور الغرفة.",
      walkHint:
        "جميع الغرف المدمجة تظهر في نافذة واحدة — تنقّل كخرائط جوجل: اسحب للنظر، واضغط الأسهم للانتقال بين الغرف.",
      noStitchYet: "بانتظار الدمج",
    },
    en: {
      noRooms: "No rooms available in this tour.",
      shareWhatsApp: "Share on WhatsApp",
      waText: (url: string) => `Take this virtual tour: ${url}`,
      noPanorama: "Panorama unavailable. Showing room photos fallback carousel.",
      walkHint:
        "All stitched rooms load in one viewer — walk through like Street View: drag to look around, tap arrows to move between rooms.",
      noStitchYet: "pending stitch",
    },
  };
  return t[locale];
}
