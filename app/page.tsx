"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Compass, Globe, Share2, Smartphone } from "lucide-react";

export default function HomePage() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [activeUseCase, setActiveUseCase] = useState<"real-estate" | "hotel" | "retail">("real-estate");
  const isArabic = lang === "ar";
  const useCaseCopy = {
    "real-estate": isArabic
      ? "للوسطاء العقاريين: اعرض الشقة كاملة بجولة واحدة بدل عشرات الصور."
      : "For real estate: show a full apartment in one interactive tour.",
    hotel: isArabic
      ? "للفنادق: دع العميل يمشي داخل الغرفة قبل الحجز."
      : "For hotels: let guests walk through rooms before booking.",
    retail: isArabic
      ? "للمعارض والمتاجر: شارك المساحة مع العملاء عن بُعد بثوانٍ."
      : "For retail spaces: share your showroom remotely in seconds.",
  };

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen text-white">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-20">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">jawla</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setLang(isArabic ? "en" : "ar")}
              className="font-space inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-sm uppercase hover:bg-white/10"
              type="button"
            >
              <Globe size={14} />
              {isArabic ? "en" : "ar"}
            </button>
            <Link href="/auth" className="rounded-full border border-white/20 px-3 py-2 text-xs hover:bg-white/10 sm:px-4 sm:text-sm">
              {isArabic ? "تسجيل الدخول" : "Sign in"}
            </Link>
            <Link href="/app" className="rounded-full bg-white px-3 py-2 text-xs font-medium text-black hover:bg-white/90 sm:px-4 sm:text-sm">
              {isArabic ? "لوحة التحكم" : "Dashboard"}
            </Link>
          </div>
        </div>

        <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <a href="#hero" className="rounded-full border border-white/20 px-3 py-1.5 hover:bg-white/10">{isArabic ? "الرئيسية" : "Home"}</a>
          <a href="#features" className="rounded-full border border-white/20 px-3 py-1.5 hover:bg-white/10">{isArabic ? "المزايا" : "Features"}</a>
          <a href="#how" className="rounded-full border border-white/20 px-3 py-1.5 hover:bg-white/10">{isArabic ? "كيف تعمل" : "How it works"}</a>
          <a href="#share" className="rounded-full border border-white/20 px-3 py-1.5 hover:bg-white/10">{isArabic ? "المشاركة" : "Sharing"}</a>
          <a href="#start" className="rounded-full border border-white/20 px-3 py-1.5 hover:bg-white/10">{isArabic ? "ابدأ الآن" : "Get started"}</a>
        </nav>

        <div id="hero" className="grid gap-6">
          <div>
            <p className="font-space mb-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              {isArabic ? "MVP · جولات 360 بالجوال" : "MVP · mobile-first 360 tours"}
            </p>
            <h2 className="font-markazi text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              {isArabic ? "صوّر المكان مرة.. وخلّه يبيع نفسه" : "Capture once. Let your space sell itself."}
            </h2>
            <p className="mt-4 text-slate-300">
              {isArabic
                ? "jawla يحوّل صورك إلى جولة 360 تفاعلية مع نقاط انتقال بين الغرف ورابط جاهز للمشاركة في واتساب."
                : "jawla turns your photos into an interactive 360 tour with room hotspots and a WhatsApp-ready share link."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveUseCase("real-estate")}
                className={`rounded-full px-3 py-1.5 text-xs ${activeUseCase === "real-estate" ? "bg-white text-black" : "border border-white/20 hover:bg-white/10"}`}
              >
                {isArabic ? "العقار" : "Real estate"}
              </button>
              <button
                type="button"
                onClick={() => setActiveUseCase("hotel")}
                className={`rounded-full px-3 py-1.5 text-xs ${activeUseCase === "hotel" ? "bg-white text-black" : "border border-white/20 hover:bg-white/10"}`}
              >
                {isArabic ? "الفنادق" : "Hotels"}
              </button>
              <button
                type="button"
                onClick={() => setActiveUseCase("retail")}
                className={`rounded-full px-3 py-1.5 text-xs ${activeUseCase === "retail" ? "bg-white text-black" : "border border-white/20 hover:bg-white/10"}`}
              >
                {isArabic ? "المعارض" : "Showrooms"}
              </button>
            </div>
            <p className="mt-3 rounded-xl border border-white/10 bg-[#0b1228]/50 px-3 py-2 text-sm text-slate-200">
              {useCaseCopy[activeUseCase]}
            </p>

            <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
              <Link href="/app/new" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black">
                {isArabic ? "إنشاء جولة" : "Create Tour"} <ArrowRight size={16} />
              </Link>
              <Link href="/app" className="rounded-full border border-white/20 px-5 py-2.5 text-sm hover:bg-white/10">
                {isArabic ? "عرض لوحة التحكم" : "View Dashboard"}
              </Link>
            </div>
          </div>
        </div>

        <div id="features" className="mt-12">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold">{isArabic ? "مزايا تساعدك تبيع أسرع" : "Features that help you sell faster"}</h3>
              <p className="mt-1 text-sm text-slate-300">{isArabic ? "كل شيء من الهاتف بدون أدوات معقدة." : "Everything from your phone, no complex tools."}</p>
            </div>
            <Link href="/app/new" className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
              {isArabic ? "جرّب المزايا" : "Try features"}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm transition-transform hover:-translate-y-0.5">
                <Smartphone className="mb-2" size={16} />
                {isArabic ? "تصوير مباشر من الجوال" : "Direct mobile capture"}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm transition-transform hover:-translate-y-0.5">
                <Compass className="mb-2" size={16} />
                {isArabic ? "نقاط تفاعلية بين الغرف" : "Hotspot room navigation"}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm transition-transform hover:-translate-y-0.5">
                <Share2 className="mb-2" size={16} />
                {isArabic ? "مشاركة فورية عبر واتساب" : "Instant WhatsApp sharing"}
              </div>
          </div>
        </div>

        <div id="how" className="mt-16 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold">{isArabic ? "كيف تعمل jawla؟" : "How jawla works"}</h3>
              <p className="mt-1 text-sm text-slate-300">{isArabic ? "3 خطوات بسيطة لتحويل المكان إلى تجربة تفاعلية." : "3 simple steps to turn a place into an interactive experience."}</p>
            </div>
            <Link href="/app/new" className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
              {isArabic ? "ابدأ الخطوة الأولى" : "Start step one"}
            </Link>
          </div>
          <section className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="font-space text-xs text-slate-400">01</p>
            <h3 className="mt-1 text-lg font-semibold">{isArabic ? "صوّر" : "Capture"}</h3>
            <p className="mt-2 text-sm text-slate-300">{isArabic ? "ارفع صور كل غرفة من هاتفك." : "Upload room photos from your phone."}</p>
          </section>
          <section className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="font-space text-xs text-slate-400">02</p>
            <h3 className="mt-1 text-lg font-semibold">{isArabic ? "حوّلها إلى 360" : "Generate 360"}</h3>
            <p className="mt-2 text-sm text-slate-300">{isArabic ? "بنقرة واحدة أنشئ بانوراما لكل غرفة." : "Generate a panorama for each room in one click."}</p>
          </section>
          <section id="share" className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="font-space text-xs text-slate-400">03</p>
            <h3 className="mt-1 text-lg font-semibold">{isArabic ? "انشر وشارك" : "Publish & Share"}</h3>
            <p className="mt-2 text-sm text-slate-300">{isArabic ? "احصل على رابط وجاهز للواتساب فوراً." : "Get a link and share it instantly on WhatsApp."}</p>
          </section>
        </div>

        <div id="share" className="mt-16">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold">{isArabic ? "روابط جاهزة للمشاركة" : "Share-ready links"}</h3>
              <p className="mt-1 text-sm text-slate-300">{isArabic ? "انشر الجولة فوراً على واتساب أو أي منصة." : "Publish and share instantly on WhatsApp or anywhere."}</p>
            </div>
            <Link href="/app" className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
              {isArabic ? "عرض جولاتك" : "View your tours"}
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#0b1228]/50 p-4 text-center">
            <p className="font-space text-xl font-bold">3min</p>
            <p className="mt-1 text-xs text-slate-300">{isArabic ? "متوسط تجهيز جولة أولى" : "Average first-tour setup"}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0b1228]/50 p-4 text-center">
            <p className="font-space text-xl font-bold">∞</p>
            <p className="mt-1 text-xs text-slate-300">{isArabic ? "روابط مشاركة بدون تعقيد" : "Simple unlimited share links"}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0b1228]/50 p-4 text-center">
            <p className="font-space text-xl font-bold">360°</p>
            <p className="mt-1 text-xs text-slate-300">{isArabic ? "تجربة عرض تفاعلية كاملة" : "Full interactive viewing experience"}</p>
          </div>
        </div>

        <div id="start" className="mt-10 rounded-2xl border border-white/10 bg-[#0b1228]/60 p-6 text-center backdrop-blur-sm">
          <h3 className="text-2xl font-semibold">{isArabic ? "جاهز تنشر أول جولة؟" : "Ready to publish your first tour?"}</h3>
          <p className="mt-2 text-sm text-slate-300">{isArabic ? "أنشئ الجولة الآن وشاركها برابط واحد." : "Create your tour now and share it with one link."}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/app/new" className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black">{isArabic ? "ابدأ الآن" : "Start now"}</Link>
            <Link href="/auth" className="rounded-full border border-white/20 px-5 py-2.5 text-sm hover:bg-white/10">{isArabic ? "تسجيل الدخول" : "Sign in"}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
