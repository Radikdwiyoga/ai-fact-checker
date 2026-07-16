import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Globe, 
  Chrome, 
  FileCode, 
  BookOpen, 
  ArrowRight, 
  Check, 
  Copy, 
  Download, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  HelpCircle,
  FileText,
  Percent,
  TrendingDown,
  Info,
  Sun,
  Moon,
  Leaf,
  Newspaper,
  Palette,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Analytics } from '@vercel/analytics/react';
import { FactCheckData, GroundingSource, RatingType } from "./types";

// Standard Example prompts
interface DemoExample {
  title: string;
  url?: string;
  label: string;
  isFake: boolean;
}

const INDONESIAN_EXAMPLES: DemoExample[] = [
  {
    title: "Lemon hangat dicampur garam terbukti dapat menyembuhkan virus Corona dalam waktu 24 jam secara total.",
    label: "Kesehatan / Pengobatan Alternatif",
    isFake: true,
  },
  {
    title: "Badan Meteorologi Klimatologi dan Geofisika (BMKG) merilis peringatan dini cuaca ekstrem di wilayah pesisir Jawa Timur.",
    url: "https://www.bmkg.go.id",
    label: "Berita Resmi BMKG",
    isFake: false,
  },
  {
    title: "Vaksin Covid-19 mengandung microchip magnetik magnetis 5G buatan asing untuk melacak aktivitas penduduk Indonesia.",
    label: "Teori Konspirasi",
    isFake: true,
  },
  {
    title: "Presiden meresmikan jalan tol trans-Sumatera ruas terbaru guna mempercepat konektivitas logistik antar provinsi.",
    url: "https://setkab.go.id",
    label: "Pembangunan Infrastruktur",
    isFake: false,
  }
];

const ENGLISH_EXAMPLES: DemoExample[] = [
  {
    title: "NASA admits a massive 50-mile-wide asteroid is 100% heading towards Earth and will cause a total blackout tomorrow.",
    label: "Astronomy / Sensationalist",
    isFake: true,
  },
  {
    title: "A clinical trial published in The Lancet confirms that regular aerobic exercise significantly boosts memory in older adults.",
    url: "https://www.thelancet.com",
    label: "Scientific Research",
    isFake: false,
  },
  {
    title: "Drinking 3 glasses of cold water immediately after a meal freezes the oils in your food and causes instant stomach cancer.",
    label: "Alternative Medicine Rumor",
    isFake: true,
  },
  {
    title: "The United Nations General Assembly adopted a resolution promoting international cooperation on safe AI deployment.",
    url: "https://www.un.org",
    label: "International Affairs",
    isFake: false,
  }
];

// Design tokens per Theme
const THEMES: Record<string, {
  nameId: string;
  nameEn: string;
  bg: string;
  text: string;
  cardBg: string;
  cardBorder: string;
  headerBg: string;
  accentText: string;
  accentBg: string;
  buttonBg: string;
  buttonHoverBg: string;
  primaryBrand: string;
  footerBg: string;
  footerText: string;
  inputBg: string;
  inputText: string;
  inputBorder: string;
  tabActive: string;
  tabInactive: string;
  tabHover: string;
  neutralMuted: string;
}> = {
  light: {
    nameId: "Terang",
    nameEn: "Light",
    bg: "bg-slate-50/50",
    text: "text-slate-900",
    cardBg: "bg-white",
    cardBorder: "border-slate-200",
    headerBg: "bg-white/90 border-b border-slate-200 backdrop-blur-md",
    accentText: "text-sky-600",
    accentBg: "bg-sky-50/70 border border-sky-100",
    buttonBg: "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-100",
    buttonHoverBg: "hover:bg-sky-50",
    primaryBrand: "sky",
    footerBg: "bg-white border-t border-slate-200",
    footerText: "text-slate-400",
    inputBg: "bg-white",
    inputText: "text-slate-800",
    inputBorder: "border-slate-200 focus:border-sky-500 focus:ring-sky-500/20",
    tabActive: "border-sky-600 text-sky-600 bg-sky-50/30",
    tabInactive: "border-transparent text-slate-500",
    tabHover: "hover:text-slate-800 hover:bg-slate-50",
    neutralMuted: "text-slate-500"
  },
  dark: {
    nameId: "Kosmik",
    nameEn: "Cosmic Dark",
    bg: "bg-slate-950",
    text: "text-slate-100",
    cardBg: "bg-slate-900/90 border border-slate-800 backdrop-blur-md",
    cardBorder: "border-slate-800",
    headerBg: "bg-slate-900/90 border-b border-slate-800 backdrop-blur-md",
    accentText: "text-indigo-400",
    accentBg: "bg-indigo-950/40 border border-indigo-900/30",
    buttonBg: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-900/20",
    buttonHoverBg: "hover:bg-indigo-950/20",
    primaryBrand: "indigo",
    footerBg: "bg-slate-950 border-t border-slate-900",
    footerText: "text-slate-500",
    inputBg: "bg-slate-950",
    inputText: "text-slate-100",
    inputBorder: "border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20",
    tabActive: "border-indigo-500 text-indigo-400 bg-indigo-950/20",
    tabInactive: "border-transparent text-slate-400",
    tabHover: "hover:text-slate-200 hover:bg-slate-800/50",
    neutralMuted: "text-slate-400"
  },
  sage: {
    nameId: "Sage Kalem",
    nameEn: "Sage Calm",
    bg: "bg-[#f4f7f4]",
    text: "text-emerald-950",
    cardBg: "bg-white",
    cardBorder: "border-emerald-100",
    headerBg: "bg-white/90 border-b border-emerald-100 backdrop-blur-md",
    accentText: "text-emerald-700",
    accentBg: "bg-emerald-50/70 border border-emerald-100/50",
    buttonBg: "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-100",
    buttonHoverBg: "hover:bg-emerald-50",
    primaryBrand: "emerald",
    footerBg: "bg-white border-t border-emerald-150",
    footerText: "text-emerald-700/60",
    inputBg: "bg-white",
    inputText: "text-emerald-900",
    inputBorder: "border-emerald-100 focus:border-emerald-600 focus:ring-emerald-600/20",
    tabActive: "border-emerald-700 text-emerald-700 bg-emerald-50/30",
    tabInactive: "border-transparent text-emerald-700/60",
    tabHover: "hover:text-emerald-950 hover:bg-emerald-50/50",
    neutralMuted: "text-emerald-800/60"
  },
  retro: {
    nameId: "Redaksi Retro",
    nameEn: "Retro Editorial",
    bg: "bg-[#faf8f3]",
    text: "text-stone-900",
    cardBg: "bg-[#f4eedf] border border-stone-300",
    cardBorder: "border-stone-300",
    headerBg: "bg-[#f4eedf]/90 border-b border-stone-300 backdrop-blur-md",
    accentText: "text-amber-950",
    accentBg: "bg-amber-100/60 border border-amber-200/50",
    buttonBg: "bg-stone-900 hover:bg-stone-800 text-[#faf8f3] shadow-sm",
    buttonHoverBg: "hover:bg-stone-200/50",
    primaryBrand: "stone",
    footerBg: "bg-[#f4eedf] border-t border-stone-300",
    footerText: "text-stone-500",
    inputBg: "bg-[#faf8f3]",
    inputText: "text-stone-900",
    inputBorder: "border-stone-300 focus:border-stone-800 focus:ring-stone-800/10",
    tabActive: "border-stone-900 text-stone-900 bg-stone-200/50",
    tabInactive: "border-transparent text-stone-600",
    tabHover: "hover:text-stone-900 hover:bg-stone-200/30",
    neutralMuted: "text-stone-500"
  }
};

export default function App() {
  // Localization: 'id' for Bahasa Indonesia, 'en' for English
  const [lang, setLang] = useState<"id" | "en">("id");

  // Visual Theme state
  const [themeKey, setThemeKey] = useState<"light" | "dark" | "sage" | "retro">("light");
  const activeTheme = THEMES[themeKey];

  // Core Fact checker state
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    data: FactCheckData;
    sources: GroundingSource[];
    queries: string[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active analysis tab
  const [activeTab, setActiveTab] = useState<"verification" | "credibility" | "propaganda" | "bias" | "suggestions">("verification");

  // Load theme preference from localStorage if available
  useEffect(() => {
    const savedTheme = localStorage.getItem("verifikasiai-theme");
    if (savedTheme && THEMES[savedTheme]) {
      setThemeKey(savedTheme as any);
    }
  }, []);

  const changeTheme = (newTheme: "light" | "dark" | "sage" | "retro") => {
    setThemeKey(newTheme);
    localStorage.setItem("verifikasiai-theme", newTheme);
  };

  // Translate helper
  const t = {
    title: lang === "id" ? "Detektor Berita Bohong & Asisten Verifikasi" : "Fake News Detection & Fact-checking Assistant",
    subtitle: lang === "id" ? "Analisis hoaks, propaganda, kredibilitas media, dan bias menggunakan kecerdasan buatan terverifikasi pencarian Google real-time." : "Analyze hoaxes, propaganda, media credibility, and bias powered by real-time Google Search grounded intelligence.",
    enterNews: lang === "id" ? "Masukkan Headline / Kutipan Berita" : "Enter Headline / News Paragraph",
    urlPlaceholder: lang === "id" ? "URL Sumber (Opsional, contoh: https://news-site.com/article)" : "Source URL (Optional, e.g. https://news-site.com/article)",
    textPlaceholder: lang === "id" ? "Tempel paragraf berita, judul, atau klaim mencurigakan di sini untuk memverifikasi kebenarannya..." : "Paste the news paragraph, headline, or suspicious claim here to verify its credibility...",
    analyzeBtn: lang === "id" ? "Analisis Kredibilitas" : "Analyze Credibility",
    analyzing: lang === "id" ? "Sedang Memverifikasi..." : "Verifying & Grounding...",
    examplesTitle: lang === "id" ? "Coba Contoh Kasus:" : "Try These Example Claims:",
    errorApiKey: lang === "id" ? "Masukkan Kunci API Gemini di Secrets untuk mengaktifkan analisis penuh." : "Configure your Gemini API key in Secrets to run real-time analysis.",
    resultsTitle: lang === "id" ? "Hasil Analisis Kredibilitas" : "Credibility Analysis Results",
    overallRating: lang === "id" ? "Peringkat Kebenaran" : "Veracity Rating",
    credibilityScore: lang === "id" ? "Skor Kredibilitas" : "Credibility Score",
    summary: lang === "id" ? "Ringkasan Eksekutif" : "Executive Summary",
    tabs: {
      verification: lang === "id" ? "Klaim & Verifikasi" : "Claim & Verification",
      credibility: lang === "id" ? "Kredibilitas Sumber" : "Source Credibility",
      propaganda: lang === "id" ? "Deteksi Propaganda" : "Propaganda Analysis",
      bias: lang === "id" ? "Analisis Bias" : "Bias Analysis",
      suggestions: lang === "id" ? "Panduan Cek Mandiri" : "Self-Factcheck Tips"
    },
    googleGrounded: lang === "id" ? "Terverifikasi Pencarian Google" : "Grounded with Google Search",
    searchQueries: lang === "id" ? "Kueri yang Ditanyakan" : "Search Queries Run",
    sourcesFound: lang === "id" ? "Referensi & Sumber Terkait" : "References & Matched Outlets",
    noSources: lang === "id" ? "Tidak ada referensi eksternal yang dikutip langsung." : "No external references cited directly.",
    noDataYet: lang === "id" ? "Silakan kirim analisis atau pilih contoh klaim di atas untuk memulai." : "Please submit news text or click one of our examples to generate an analysis.",
    propagandaEmpty: lang === "id" ? "Tidak ada teknik propaganda manipulatif yang terdeteksi dalam teks." : "No manipulative propaganda techniques detected in the text.",
    reputationAnalyzed: lang === "id" ? "Analisis Reputasi & Domain" : "Reputation & Domain Analysis"
  };

  // Run the full analytical check
  const handleAnalyze = async (text: string, srcUrl?: string) => {
    if (!text || text.trim() === "") return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          sourceUrl: srcUrl || "",
          language: lang
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setResult({
          data: resData.data,
          sources: resData.sources,
          queries: resData.queries
        });
        // Set active tab default
        setActiveTab("verification");
      } else {
        setErrorMsg(resData.error || "Gagal melakukan analisis.");
      }
    } catch (err: any) {
      setErrorMsg("Error connecting to server. Please check your internet or configuration.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper to determine color badge based on rating
  const getRatingBadgeColor = (rating: RatingType) => {
    const r = rating?.toLowerCase() || "";
    if (r.includes("trusted") || r.includes("credible") || r.includes("benar") || r.includes("valid")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800";
    }
    if (r.includes("mixed") || r.includes("unverified") || r.includes("campuran") || r.includes("diragukan")) {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800";
    }
    if (r.includes("disputed") || r.includes("misleading") || r.includes("false") || r.includes("salah") || r.includes("hoaks")) {
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800";
    }
    return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700";
  };

  return (
    <div className={`min-h-screen ${activeTheme.bg} ${activeTheme.text} font-sans antialiased transition-colors duration-300`}>
      {/* HEADER SECTION */}
      <header className={`sticky top-0 z-50 ${activeTheme.headerBg} transition-colors duration-300 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className={`${themeKey === 'dark' ? 'bg-indigo-600' : 'bg-sky-600'} text-white p-2.5 rounded-xl shadow-md flex items-center justify-center`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShieldCheck className="w-6 h-6" id="app-logo-icon" />
            </motion.div>
            <div>
              <span className="font-extrabold text-lg tracking-tight flex items-center gap-1.5">
                VerifikasiAI
                <span className={`text-[10px] ${themeKey === 'dark' ? 'bg-indigo-950 text-indigo-300 border border-indigo-900/50' : 'bg-sky-100 text-sky-800'} font-bold px-2 py-0.5 rounded-full`}>v1.3</span>
              </span>
              <p className={`text-[11px] ${activeTheme.neutralMuted} font-medium hidden sm:block`}>Independent Real-time Verification Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Selector Palette Toggle */}
            <div className={`flex items-center gap-1.5 ${themeKey === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-150/80 border-slate-200'} p-1 rounded-xl border`}>
              <button
                onClick={() => changeTheme("light")}
                className={`p-1.5 rounded-lg transition-all ${themeKey === "light" ? "bg-white text-sky-600 shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
                title="Light Theme"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => changeTheme("dark")}
                className={`p-1.5 rounded-lg transition-all ${themeKey === "dark" ? "bg-slate-950 text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-200"}`}
                title="Cosmic Dark"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                onClick={() => changeTheme("sage")}
                className={`p-1.5 rounded-lg transition-all ${themeKey === "sage" ? "bg-[#f4f7f4] text-emerald-700 border border-emerald-100 shadow-sm" : "text-slate-400 hover:text-emerald-700"}`}
                title="Sage Calm"
              >
                <Leaf className="w-4 h-4" />
              </button>
              <button
                onClick={() => changeTheme("retro")}
                className={`p-1.5 rounded-lg transition-all ${themeKey === "retro" ? "bg-[#f4eedf] text-amber-950 border border-stone-300 shadow-sm" : "text-slate-400 hover:text-stone-800"}`}
                title="Retro Editorial"
              >
                <Newspaper className="w-4 h-4" />
              </button>
            </div>

            {/* Bilingual Toggle */}
            <div className={`p-1 rounded-xl flex items-center border ${themeKey === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-150/80 border-slate-200'}`}>
              <button 
                id="lang-btn-id"
                onClick={() => setLang("id")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  lang === "id" 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-400 hover:text-slate-800"
                }`}
              >
                🇮🇩 ID
              </button>
              <button 
                id="lang-btn-en"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  lang === "en" 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-400 hover:text-slate-800"
                }`}
              >
                🇬🇧 EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <div className={`relative overflow-hidden py-10 px-4 transition-colors duration-300`}>
        {/* Ambient background decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
          <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 mix-blend-multiply ${
            themeKey === 'dark' ? 'bg-indigo-500' : 'bg-sky-400'
          }`} />
          <div className={`absolute top-10 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-20 mix-blend-multiply ${
            themeKey === 'dark' ? 'bg-purple-500' : 'bg-amber-300'
          }`} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1 
            className="text-3xl sm:text-4xl font-black tracking-tight leading-tight"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t.title}
          </motion.h1>
          <motion.p 
            className="mt-3.5 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed opacity-85"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {t.subtitle}
          </motion.p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="space-y-8">
            
            {/* INPUT CARD */}
            <motion.div 
              className={`${activeTheme.cardBg} border ${activeTheme.cardBorder} rounded-2xl shadow-sm p-6`} 
              id="input-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <h2 className="text-base font-bold flex items-center gap-2 mb-4">
                <Search className={`w-5 h-5 ${activeTheme.accentText}`} />
                {t.enterNews}
              </h2>

              <div className="space-y-4">
                <div>
                  <textarea
                    id="news-textarea"
                    rows={4}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={t.textPlaceholder}
                    className={`w-full rounded-xl border p-4 text-sm focus:outline-none transition-all resize-y ${
                      themeKey === 'dark' 
                        ? 'bg-slate-950 border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-slate-100 placeholder-slate-500' 
                        : themeKey === 'sage'
                        ? 'bg-white border-emerald-100 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-emerald-950 placeholder-emerald-300'
                        : themeKey === 'retro'
                        ? 'bg-[#faf8f3] border-stone-300 focus:border-stone-800 focus:ring-2 focus:ring-stone-800/10 text-stone-900 placeholder-stone-400'
                        : 'bg-white border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative grow">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <input
                      id="news-url-input"
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder={t.urlPlaceholder}
                      className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all ${
                        themeKey === 'dark' 
                          ? 'bg-slate-950 border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-slate-100 placeholder-slate-500' 
                          : themeKey === 'sage'
                          ? 'bg-white border-emerald-100 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-emerald-950 placeholder-emerald-300'
                          : themeKey === 'retro'
                          ? 'bg-[#faf8f3] border-stone-300 focus:border-stone-800 focus:ring-2 focus:ring-stone-800/10 text-stone-900 placeholder-stone-400'
                          : 'bg-white border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <motion.button
                    id="submit-analysis-btn"
                    onClick={() => handleAnalyze(textInput, urlInput)}
                    disabled={isAnalyzing || !textInput.trim()}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isAnalyzing || !textInput.trim()
                        ? "bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-600 cursor-not-allowed"
                        : activeTheme.buttonBg
                    }`}
                    whileHover={{ scale: isAnalyzing || !textInput.trim() ? 1 : 1.02 }}
                    whileTap={{ scale: isAnalyzing || !textInput.trim() ? 1 : 0.98 }}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{t.analyzing}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>{t.analyzeBtn}</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* DEMO EXAMPLES QUICK FILL */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
                <span className={`text-xs font-bold uppercase tracking-wider block mb-3 ${activeTheme.neutralMuted}`}>
                  {t.examplesTitle}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(lang === "id" ? INDONESIAN_EXAMPLES : ENGLISH_EXAMPLES).map((item, idx) => (
                    <motion.button
                      id={`demo-claim-${idx}`}
                      key={idx}
                      onClick={() => {
                        setTextInput(item.title);
                        setUrlInput(item.url || "");
                        handleAnalyze(item.title, item.url);
                      }}
                      className={`text-left p-3 rounded-xl border transition-all text-xs flex flex-col justify-between group cursor-pointer ${
                        themeKey === 'dark' 
                          ? 'border-slate-800 hover:border-indigo-500 hover:bg-indigo-950/20' 
                          : themeKey === 'sage'
                          ? 'border-emerald-50 hover:border-emerald-200 hover:bg-emerald-50/50'
                          : themeKey === 'retro'
                          ? 'border-stone-300 hover:border-stone-500 hover:bg-stone-200/20'
                          : 'border-slate-100 hover:border-sky-200 hover:bg-sky-50/50'
                      }`}
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <span className="font-medium group-hover:opacity-100 opacity-90 line-clamp-2 mb-2">
                        "{item.title}"
                      </span>
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                          themeKey === 'dark' 
                            ? 'bg-slate-800 text-slate-300 border-slate-700' 
                            : themeKey === 'sage'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                            : themeKey === 'retro'
                            ? 'bg-stone-200 text-stone-800 border-stone-300'
                            : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                          {item.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.isFake 
                            ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400" 
                            : "bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400"
                        }`}>
                          {item.isFake ? (lang === "id" ? "Kemungkinan Hoaks" : "Likely Fake") : (lang === "id" ? "Valid/Resmi" : "Valid/Official")}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ERROR VIEW */}
            {errorMsg && (
              <motion.div 
                className="bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40 rounded-xl p-4 text-sm text-rose-800 dark:text-rose-300 flex items-start gap-3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">{lang === "id" ? "Gagal Menganalisis Berita" : "Analysis Failed"}</h4>
                  <p className="mt-1">{errorMsg}</p>
                  <p className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-400">
                    💡 Tip: {t.errorApiKey}
                  </p>
                </div>
              </motion.div>
            )}

            {/* MAIN RESULTS SECTION */}
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  className={`${activeTheme.cardBg} border ${activeTheme.cardBorder} rounded-2xl shadow-sm p-6 space-y-6`} 
                  id="analysis-results"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Visual Header */}
                  <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                        {result.data.credibilityScore >= 75 ? (
                          <CheckCircle className="w-12 h-12 text-emerald-500" />
                        ) : result.data.credibilityScore >= 45 ? (
                          <AlertTriangle className="w-12 h-12 text-amber-500" />
                        ) : (
                          <ShieldAlert className="w-12 h-12 text-rose-500" />
                        )}
                      </div>
                      <div>
                        <span className={`text-xs font-extrabold uppercase tracking-wider ${activeTheme.neutralMuted}`}>{t.overallRating}</span>
                        <div className="flex items-center gap-2.5 mt-0.5">
                          <span className={`px-3 py-1 rounded-full text-sm font-black border ${getRatingBadgeColor(result.data.rating)}`}>
                            {result.data.rating}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SCORE GAUGE */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`text-xs font-extrabold uppercase tracking-wider block ${activeTheme.neutralMuted}`}>{t.credibilityScore}</span>
                        <span className="text-3xl font-black tracking-tight">{result.data.credibilityScore} <span className="text-sm font-normal text-slate-400">/ 100</span></span>
                      </div>
                      {/* Ring gauge simulation with animations */}
                      <div className="relative w-14 h-14 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="28"
                            cy="28"
                            r="24"
                            stroke={themeKey === 'dark' ? '#1e293b' : '#f1f5f9'}
                            strokeWidth="5"
                            fill="transparent"
                          />
                          <motion.circle
                            cx="28"
                            cy="28"
                            r="24"
                            stroke={
                              result.data.credibilityScore >= 75 ? "#10b981" : result.data.credibilityScore >= 45 ? "#f59e0b" : "#f43f5e"
                            }
                            strokeWidth="5"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 24}
                            initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - result.data.credibilityScore / 100) }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                          />
                        </svg>
                        <span className="absolute text-xs font-extrabold">%</span>
                      </div>
                    </div>
                  </div>

                  {/* EXECUTIVE SUMMARY */}
                  <motion.div 
                    className={`${
                      themeKey === 'dark' ? 'bg-indigo-950/20 border-indigo-900/50' : 'bg-sky-50/50 border border-sky-100'
                    } rounded-xl p-4`}
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h4 className={`text-xs font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${activeTheme.accentText}`}>
                      <Info className="w-4 h-4" />
                      {t.summary}
                    </h4>
                    <p className="text-sm leading-relaxed font-medium">
                      {result.data.summary}
                    </p>
                  </motion.div>

                  {/* FOUR PILLARS TABBED SECTION */}
                  <div className="space-y-4">
                    <div className="border-b border-slate-200 dark:border-slate-800/80">
                      <nav className="flex flex-wrap -mb-px gap-1 relative">
                        {Object.keys(t.tabs).map((tabKey) => {
                          const key = tabKey as keyof typeof t.tabs;
                          const isActive = activeTab === key;
                          return (
                            <button
                              id={`tab-btn-${key}`}
                              key={key}
                              onClick={() => setActiveTab(key)}
                              className={`relative py-2.5 px-4 font-bold text-xs tracking-wide rounded-t-xl transition-all border-b-2 cursor-pointer ${
                                isActive 
                                  ? activeTheme.tabActive 
                                  : `${activeTheme.tabInactive} ${activeTheme.tabHover}`
                              }`}
                            >
                              {t.tabs[key]}
                              {isActive && (
                                <motion.div
                                  layoutId="activeTabIndicator"
                                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                                    themeKey === 'dark' ? 'bg-indigo-500' : themeKey === 'sage' ? 'bg-emerald-700' : themeKey === 'retro' ? 'bg-stone-900' : 'bg-sky-600'
                                  }`}
                                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                              )}
                            </button>
                          );
                        })}
                      </nav>
                    </div>

                    <div className="pt-2 min-h-40 relative overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          {/* Verification Tab */}
                          {activeTab === "verification" && (
                            <div className="space-y-4">
                              <div className={`text-sm leading-relaxed whitespace-pre-line rounded-xl p-4 border ${
                                themeKey === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/50'
                              }`}>
                                {result.data.claimVerification}
                              </div>

                              {/* Search Grounding info box */}
                              <div className={`rounded-xl p-4 flex items-start gap-3 border ${
                                themeKey === 'dark' ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-emerald-50/50 border-emerald-100'
                              }`}>
                                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 rounded-md shrink-0">
                                  <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">{t.googleGrounded}</span>
                                  <p className={`text-xs mt-1 ${activeTheme.neutralMuted}`}>
                                    Informasi diverifikasi langsung dengan bantuan mesin penelusur Google Search untuk membandingkan klaim dengan korpus berita tepercaya global & lokal (Snopes, AFP, Tempo, dll).
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Source Credibility Tab */}
                          {activeTab === "credibility" && (
                            <div className="space-y-4">
                              <h4 className="text-sm font-extrabold">{t.reputationAnalyzed}</h4>
                              <div className={`text-sm leading-relaxed rounded-xl p-4 border ${
                                themeKey === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/50'
                              }`}>
                                {result.data.sourceCredibility}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                <div className={`border rounded-lg p-3 text-xs ${
                                  themeKey === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200/70'
                                }`}>
                                  <span className="font-bold text-slate-500 dark:text-slate-400 block mb-1">Status Keamanan Domain:</span>
                                  <span className="opacity-95">Domain dinilai berdasarkan riwayat penyebaran hoaks dan afiliasi editorial resmi.</span>
                                </div>
                                <div className={`border rounded-lg p-3 text-xs ${
                                  themeKey === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200/70'
                                }`}>
                                  <span className="font-bold text-slate-500 dark:text-slate-400 block mb-1">Transparansi Penulis:</span>
                                  <span className="opacity-95">Analisis menyelidiki keberadaan atribusi jurnalis dan penanggung jawab redaksi.</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Propaganda Detection Tab */}
                          {activeTab === "propaganda" && (
                            <div className="space-y-3">
                              {result.data.propagandaDetection && result.data.propagandaDetection.length > 0 ? (
                                result.data.propagandaDetection.map((prop, index) => (
                                  <motion.div 
                                    key={index} 
                                    className="border border-rose-100 dark:border-rose-950/40 rounded-xl p-4 bg-rose-50/30 dark:bg-rose-950/10"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                  >
                                    <span className="text-xs font-black text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/40">
                                      {prop.technique}
                                    </span>
                                    <p className="text-sm mt-2 font-medium">
                                      {prop.explanation}
                                    </p>
                                  </motion.div>
                                ))
                              ) : (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                  {t.propagandaEmpty}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bias Analysis Tab */}
                          {activeTab === "bias" && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-extrabold uppercase tracking-wider">Kategori Bias:</span>
                                <span className={`text-xs font-black px-3 py-1 rounded-full ${
                                  themeKey === 'dark' ? 'bg-indigo-950 text-indigo-300 border border-indigo-900/40' : 'bg-sky-100 text-sky-800'
                                }`}>
                                  {result.data.biasAnalysis.rating}
                                </span>
                              </div>
                              <div className={`text-sm leading-relaxed rounded-xl p-4 border ${
                                themeKey === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/50'
                              }`}>
                                {result.data.biasAnalysis.explanation}
                              </div>
                            </div>
                          )}

                          {/* Suggestions Tab */}
                          {activeTab === "suggestions" && (
                            <div className="space-y-3">
                              {result.data.suggestions.map((sug, idx) => (
                                <motion.div 
                                  key={idx} 
                                  className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs ${
                                    themeKey === 'dark' ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-100'
                                  }`}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                >
                                  <div className={`p-1 rounded-full mt-0.5 shrink-0 ${
                                    themeKey === 'dark' ? 'bg-indigo-950 text-indigo-400' : 'bg-sky-100 text-sky-700'
                                  }`}>
                                    <Check className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="opacity-95">{sug}</span>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* SEARCH GROUNDING & SOURCES DETAILED VIEW */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 space-y-4">
                    {/* Web Queries Run */}
                    {result.queries && result.queries.length > 0 && (
                      <div className="space-y-2">
                        <span className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${activeTheme.neutralMuted}`}>
                          <Search className="w-3.5 h-3.5 text-slate-500" />
                          {t.searchQueries}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {result.queries.map((q, idx) => (
                            <span key={idx} className={`text-xs px-3 py-1 rounded-lg border font-mono ${
                              themeKey === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                            }`}>
                              "{q}"
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grounded Web references */}
                    <div className="space-y-2">
                      <span className={`text-xs font-extrabold uppercase tracking-wider block ${activeTheme.neutralMuted}`}>
                        {t.sourcesFound}
                      </span>
                      {result.sources && result.sources.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {result.sources.map((src, index) => (
                            <motion.a
                              key={index}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-3 border rounded-xl flex items-start justify-between group min-w-0 ${
                                themeKey === 'dark' 
                                  ? 'bg-slate-900 border-slate-800 hover:border-indigo-500 hover:bg-indigo-950/10' 
                                  : themeKey === 'sage'
                                  ? 'bg-white border-emerald-150 hover:border-emerald-300 hover:bg-emerald-50/20'
                                  : themeKey === 'retro'
                                  ? 'bg-[#faf8f3] border-stone-300 hover:border-stone-500 hover:bg-stone-200/20'
                                  : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/20'
                              } transition-all duration-200`}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <div className="space-y-1.5 min-w-0 flex-1">
                                <p className={`text-xs font-extrabold line-clamp-2 leading-snug group-hover:text-indigo-400 ${
                                  themeKey === 'dark' ? 'text-slate-100' : 'text-slate-800'
                                }`}>
                                  {src.title || "Rujukan Valid"}
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] min-w-0">
                                  <span className={`border font-semibold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider shrink-0 ${
                                    themeKey === 'dark'
                                      ? 'bg-indigo-950/40 text-indigo-300 border-indigo-900/40'
                                      : 'bg-sky-50 text-sky-700 border-sky-100'
                                  }`}>
                                    {(() => {
                                      try {
                                        const u = new URL(src.url);
                                        return u.hostname.replace('news.', '').replace('www.', '');
                                      } catch {
                                        return 'Source';
                                      }
                                    })()}
                                  </span>
                                  <span className="text-slate-400 font-mono truncate flex-1" title={src.url}>
                                    {src.url}
                                  </span>
                                </div>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 shrink-0 ml-2 mt-0.5" />
                            </motion.a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          {t.noSources}
                        </p>
                      )}
                    </div>
                  </div>

                </motion.div>
              ) : (
                <motion.div 
                  className={`${activeTheme.cardBg} border ${activeTheme.cardBorder} rounded-2xl p-10 text-center shadow-sm`}
                  key="no-data"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ShieldCheck className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                  <h3 className="text-base font-bold">Verifikasi Berita Instan</h3>
                  <p className={`text-sm max-w-sm mx-auto mt-2 ${activeTheme.neutralMuted}`}>
                    {t.noDataYet}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* INTEGRATION GUIDE SECTION */}
            <motion.div 
              className={`text-white rounded-2xl shadow-lg p-6 overflow-hidden relative ${
                themeKey === 'dark' ? 'bg-linear-to-br from-indigo-950 to-slate-900 border border-slate-800' : 'bg-slate-900'
              }`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-sky-600/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <span className="text-xs font-extrabold text-sky-400 uppercase tracking-wider block mb-1">Fact-checking Network</span>
                  <h3 className="text-lg font-black tracking-tight">Konektivitas Snopes, Tempo & AFP Fact Check</h3>
                  <p className="text-xs text-slate-300 mt-1.5 max-w-xl leading-relaxed">
                    Sistem kami memanfaatkan Google Search Grounding untuk menjembatani pemeriksaan klaim langsung dengan data terkini dari situs global seperti <strong>Snopes.com</strong>, <strong>AFP Fact Check</strong>, dan jaringan penangkal hoaks lokal Indonesia seperti <strong>Mafindo (TurnBackHoax)</strong> dan <strong>CekFakta</strong>.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <span className="text-[10px] bg-slate-800 text-white border border-slate-700 px-2 py-1 rounded font-bold">Snopes Connected</span>
                  <span className="text-[10px] bg-slate-800 text-white border border-slate-700 px-2 py-1 rounded font-bold">AFP Fact Check API</span>
                  <span className="text-[10px] bg-slate-800 text-white border border-slate-700 px-2 py-1 rounded font-bold">CekFakta / Mafindo</span>
                </div>
              </div>
            </motion.div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className={`${activeTheme.footerBg} py-8 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium">
          <p className={activeTheme.footerText}>© 2026 VerifikasiAI. All Rights Reserved. Built securely using Google Gemini 3.5 & Google Search Grounding.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-sky-500" /> Snopes Connected</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-sky-500" /> AFP Verified</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-sky-500" /> Mafindo Grounded</span>
          </div>
        </div>
      </footer>
      <Analytics />
    </div>
  );
}
