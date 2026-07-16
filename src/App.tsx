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
  gridClass: string;
  shadowOffset: string;
  badgeClass: string;
  tagBorder: string;
  baseFont: string;
}> = {
  light: {
    nameId: "Sleek Dark",
    nameEn: "Sleek Dark",
    bg: "bg-[#090D1A] bg-grid-dark",
    text: "text-slate-100",
    cardBg: "bg-[#111827]",
    cardBorder: "border-slate-800",
    headerBg: "bg-[#090D1A]/90 backdrop-blur-md border-b border-slate-800/85",
    accentText: "text-blue-400",
    accentBg: "bg-blue-500/5 border border-blue-500/15",
    buttonBg: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/10",
    buttonHoverBg: "hover:bg-slate-800",
    primaryBrand: "blue",
    footerBg: "bg-[#090D1A] border-t border-slate-800/70",
    footerText: "text-slate-400",
    inputBg: "bg-[#0B0F19]",
    inputText: "text-slate-100",
    inputBorder: "border-slate-800 focus:border-blue-500 focus:ring-blue-500/20",
    tabActive: "border-blue-500 text-blue-400 bg-blue-500/10 font-bold",
    tabInactive: "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50",
    tabHover: "hover:text-slate-200 hover:bg-slate-800/50",
    neutralMuted: "text-slate-400",
    gridClass: "bg-grid-dark",
    shadowOffset: "shadow-2xl shadow-slate-950/50",
    badgeClass: "border border-slate-800 font-mono",
    tagBorder: "border-slate-800",
    baseFont: "font-sans"
  },
  dark: {
    nameId: "Sleek Dark",
    nameEn: "Sleek Dark",
    bg: "bg-[#090D1A] bg-grid-dark",
    text: "text-slate-100",
    cardBg: "bg-[#111827]",
    cardBorder: "border-slate-800",
    headerBg: "bg-[#090D1A]/90 backdrop-blur-md border-b border-slate-800/85",
    accentText: "text-blue-400",
    accentBg: "bg-blue-500/5 border border-blue-500/15",
    buttonBg: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/10",
    buttonHoverBg: "hover:bg-slate-800",
    primaryBrand: "blue",
    footerBg: "bg-[#090D1A] border-t border-slate-800/70",
    footerText: "text-slate-400",
    inputBg: "bg-[#0B0F19]",
    inputText: "text-slate-100",
    inputBorder: "border-slate-800 focus:border-blue-500 focus:ring-blue-500/20",
    tabActive: "border-blue-500 text-blue-400 bg-blue-500/10 font-bold",
    tabInactive: "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50",
    tabHover: "hover:text-slate-200 hover:bg-slate-800/50",
    neutralMuted: "text-slate-400",
    gridClass: "bg-grid-dark",
    shadowOffset: "shadow-2xl shadow-slate-950/50",
    badgeClass: "border border-slate-800 font-mono",
    tagBorder: "border-slate-800",
    baseFont: "font-sans"
  }
};

export default function App() {
  // Localization: 'id' for Bahasa Indonesia, 'en' for English
  const [lang, setLang] = useState<"id" | "en">("id");

  // Visual Theme state: locked to dark
  const [themeKey, setThemeKey] = useState<"light" | "dark">("dark");
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
    if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
      setThemeKey(savedTheme);
    }
  }, []);

  const changeTheme = (newTheme: "light" | "dark") => {
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
    <div className={`min-h-screen ${activeTheme.bg} ${activeTheme.text} ${activeTheme.baseFont} antialiased transition-all duration-300 pb-12`}>
      {/* HEADER SECTION */}
      <header className={`sticky top-0 z-50 ${activeTheme.headerBg} border-b border-slate-800/60 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/10">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  VerifikasiAI
                </span>
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  v1.3
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider hidden sm:block mt-0.5">
                Independent Real-time Verification Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Bilingual Toggle Button Group */}
            <div className="flex border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
              <button 
                id="lang-btn-id"
                onClick={() => setLang("id")}
                className={`px-3 py-1.5 font-mono text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
                  lang === "id" 
                    ? "bg-blue-600 text-white" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/45"
                }`}
              >
                ID ID
              </button>
              <button 
                id="lang-btn-en"
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 font-mono text-[10px] font-bold tracking-wider transition-all cursor-pointer border-l border-slate-800 ${
                  lang === "en" 
                    ? "bg-blue-600 text-white" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/45"
                }`}
              >
                GB EN
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HERO SECTION */}
        <section className="text-center pb-6 mb-8 mt-10">
          <motion.h2 
            className="font-sans font-extrabold text-3.5xl sm:text-4.5xl tracking-tight leading-tight mb-3.5 text-white"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {t.title}
          </motion.h2>
          <motion.p 
            className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed text-slate-400 font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            {t.subtitle}
          </motion.p>
        </section>

        {/* CENTERED WORKSPACE DASHBOARD */}
        <div className="space-y-8 mt-6">
          
          {/* MAIN INPUT & EXAMPLES CARD */}
          <motion.div 
            className="bg-[#111827] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-slate-950/50 relative transition-all duration-300 space-y-6" 
            id="input-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            {/* Input Label Header */}
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <Search className="w-5 h-5 text-blue-400" />
              <h3 className="font-sans font-bold text-base text-slate-100">
                {t.enterNews}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <textarea
                  id="news-textarea"
                  rows={4}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={t.textPlaceholder}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-y font-sans"
                />
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    id="news-url-input"
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder={t.urlPlaceholder}
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
                  />
                </div>

                <motion.button
                  id="submit-analysis-btn"
                  onClick={() => handleAnalyze(textInput, urlInput)}
                  disabled={isAnalyzing || !textInput.trim()}
                  className={`px-6 py-3.5 rounded-xl font-sans text-xs font-bold uppercase tracking-wider transition-all shrink-0 flex items-center justify-center gap-2.5 ${
                    isAnalyzing || !textInput.trim()
                      ? "bg-slate-800/40 text-slate-500 border border-slate-800/60 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30 cursor-pointer"
                  }`}
                  whileHover={{ scale: isAnalyzing || !textInput.trim() ? 1 : 1.01 }}
                  whileTap={{ scale: isAnalyzing || !textInput.trim() ? 1 : 0.99 }}
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

            {/* Divider */}
            <div className="border-t border-slate-800/80 my-4" />

            {/* Coba Contoh Kasus Grid */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                {t.examplesTitle}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(lang === "id" ? INDONESIAN_EXAMPLES : ENGLISH_EXAMPLES).map((item, idx) => (
                  <motion.button
                    id={`demo-claim-${idx}`}
                    key={idx}
                    onClick={() => {
                      setTextInput(item.title);
                      setUrlInput(item.url || "");
                      handleAnalyze(item.title, item.url);
                    }}
                    className="text-left p-4 rounded-xl bg-[#0B0F19]/50 hover:bg-[#0B0F19] border border-slate-800/70 hover:border-slate-700 flex flex-col justify-between gap-3.5 h-full transition-all duration-200 cursor-pointer"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <p className="text-xs leading-relaxed text-slate-200 font-sans font-medium">
                      "{item.title}"
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-900/40">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 bg-slate-800/40 px-2 py-0.5 rounded border border-slate-800/30">
                        {item.label}
                      </span>
                      <span className={`font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        item.isFake 
                          ? "text-rose-400 bg-rose-500/5 border-rose-500/10" 
                          : "text-emerald-400 bg-emerald-500/5 border-emerald-500/10"
                      }`}>
                        {item.isFake ? (lang === "id" ? "KEMUNGKINAN HOAKS" : "LIKELY FAKE") : (lang === "id" ? "VALID / RESMI" : "VALID / OFFICIAL")}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Verification tag indicator */}
          <div className="font-mono text-[9px] uppercase tracking-widest flex items-center gap-2 opacity-50 justify-center">
            <span>[*]</span>
            <span>INDEPENDENT REAL-TIME VERIFICATION ENGINE</span>
          </div>

          {/* ERROR VIEW */}
          {errorMsg && (
            <motion.div 
              className="bg-rose-950/30 border border-rose-900/50 rounded-2xl p-6 text-slate-100 relative shadow-xl shadow-slate-950/25"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-mono text-xs uppercase tracking-wider font-bold text-rose-300">{lang === "id" ? "Gagal Menganalisis" : "Analysis Failed"}</h4>
                  <p className="mt-1 text-sm text-slate-300 leading-relaxed">{errorMsg}</p>
                  <p className="mt-3 text-xs font-mono uppercase tracking-wider text-rose-400">
                    💡 Tip: {t.errorApiKey}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* LOADING & RESULTS CONTAINER */}
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div 
                className="bg-[#111827] border border-slate-800 rounded-2xl p-12 text-center shadow-2xl shadow-slate-950/45 min-h-[250px] flex flex-col items-center justify-center space-y-4"
                key="analyzing-state"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
              >
                <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest block font-bold text-blue-400 mb-1">[ {lang === 'id' ? 'SEDANG MEMPROSES' : 'PROCESSING'} ]</span>
                  <p className="text-sm max-w-sm mx-auto text-slate-300 leading-relaxed">
                    {lang === 'id' 
                      ? 'Membandingkan klaim dengan korpus berita global terpercaya & database pencarian Google real-time...' 
                      : 'Verifying claim integrity against Google Search corpus & international fact check databases...'}
                  </p>
                </div>
              </motion.div>
            ) : result ? (
              <motion.div 
                className="bg-[#111827] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-slate-950/50 space-y-6 transition-all duration-300" 
                id="analysis-results"
                key="analysis-results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
              >
                {/* Analysis Report Title */}
                <div className="border-b border-slate-800 pb-4 flex justify-between items-baseline">
                  <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-slate-400">
                    [ {t.resultsTitle} ]
                  </span>
                  <span className="font-mono text-[9px] text-slate-500">
                    REF ID: #{(Math.floor(Math.random() * 90000) + 10000)}
                  </span>
                </div>

                {/* Stamp & Verification Score layout */}
                <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center py-2">
                  <div className="flex items-center gap-4">
                    {/* Badge representation of veracity */}
                    <div className="shrink-0 p-3 bg-[#0B0F19] border border-slate-800 rounded-xl">
                      {result.data.credibilityScore >= 75 ? (
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                      ) : result.data.credibilityScore >= 45 ? (
                        <AlertTriangle className="w-10 h-10 text-amber-500" />
                      ) : (
                        <ShieldAlert className="w-10 h-10 text-rose-500" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest block text-slate-400">{t.overallRating}</span>
                      <div className="mt-1 flex items-center">
                        <span className={`px-3 py-1 font-mono text-xs uppercase tracking-wider border rounded-lg font-bold ${getRatingBadgeColor(result.data.rating)}`}>
                          [ {result.data.rating} ]
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SCORE Stamp Gauge */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase tracking-widest block text-slate-400">{t.credibilityScore}</span>
                      <span className="text-3xl font-sans font-extrabold tracking-tight text-white">{result.data.credibilityScore} <span className="text-xs font-mono font-normal text-slate-500">/ 100</span></span>
                    </div>
                    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="text-slate-800"
                          fill="transparent"
                        />
                        <motion.circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke={
                            result.data.credibilityScore >= 75 ? "#10b981" : result.data.credibilityScore >= 45 ? "#f59e0b" : "#ef4444"
                          }
                          strokeWidth="3"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 20}
                          initial={{ strokeDashoffset: 2 * Math.PI * 20 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 20 * (1 - result.data.credibilityScore / 100) }}
                          transition={{ duration: 1.0, ease: "easeOut" }}
                        />
                      </svg>
                      <span className="absolute font-mono text-[9px] font-bold text-slate-300">%</span>
                    </div>
                  </div>
                </div>

                {/* EXECUTIVE SUMMARY */}
                <motion.div 
                  className="bg-blue-500/5 border border-blue-500/15 p-4 border-l-4 border-l-blue-500 rounded-r-xl"
                  initial={{ scale: 0.99, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h4 className="font-mono text-[10px] uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-bold text-blue-400">
                    <Info className="w-3.5 h-3.5" />
                    {t.summary}
                  </h4>
                  <p className="text-sm leading-relaxed font-medium italic text-slate-100">
                    "{result.data.summary}"
                  </p>
                </motion.div>

                {/* FOUR PILLARS TABBED SECTION */}
                <div className="space-y-4">
                  <div className="border-b border-slate-800">
                    <nav className="flex flex-wrap -mb-px gap-1.5 pb-2">
                      {Object.keys(t.tabs).map((tabKey) => {
                        const key = tabKey as keyof typeof t.tabs;
                        const isActive = activeTab === key;
                        return (
                          <button
                            id={`tab-btn-${key}`}
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`py-2 px-3 font-mono text-[10px] uppercase tracking-wider border rounded-lg cursor-pointer transition-all duration-150 ${
                              isActive 
                                ? `${activeTheme.tabActive} border-blue-500/30` 
                                : `${activeTheme.tabInactive} border-transparent`
                            }`}
                          >
                            {t.tabs[key]}
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  <div className="pt-2 min-h-[140px] relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                      >
                        {/* Verification Tab */}
                        {activeTab === "verification" && (
                          <div className="space-y-4">
                            <div className="text-sm leading-relaxed font-sans whitespace-pre-line p-4 border border-slate-800 rounded-xl bg-[#0B0F19]/50 text-slate-200">
                              {result.data.claimVerification}
                            </div>

                            {/* Search Grounding info box */}
                            <div className="p-4 flex items-start gap-3 border border-blue-500/10 bg-blue-500/5 rounded-xl">
                              <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg shrink-0 mt-0.5">
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider block text-blue-300">{t.googleGrounded}</span>
                                <p className="text-xs mt-1 leading-relaxed text-slate-400">
                                  Informasi diverifikasi langsung dengan bantuan mesin penelusur Google Search untuk membandingkan klaim dengan korpus berita tepercaya global & lokal (Snopes, AFP, Tempo, dll).
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Source Credibility Tab */}
                        {activeTab === "credibility" && (
                          <div className="space-y-4">
                            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-400">{t.reputationAnalyzed}</h4>
                            <div className="text-sm leading-relaxed font-sans p-4 border border-slate-800 rounded-xl bg-[#0B0F19]/50 text-slate-200">
                              {result.data.sourceCredibility}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                              <div className="border border-slate-800 rounded-xl p-4 text-xs bg-[#0B0F19]/30">
                                <span className="font-mono font-bold block mb-1 text-slate-400">Status Keamanan Domain:</span>
                                <span className="text-slate-400 leading-relaxed">Domain dinilai berdasarkan riwayat penyebaran hoaks dan afiliasi editorial resmi.</span>
                              </div>
                              <div className="border border-slate-800 rounded-xl p-4 text-xs bg-[#0B0F19]/30">
                                <span className="font-mono font-bold block mb-1 text-slate-400">Transparansi Penulis:</span>
                                <span className="text-slate-400 leading-relaxed">Analisis menyelidiki keberadaan atribusi jurnalis dan penanggung jawab redaksi.</span>
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
                                  className="border border-slate-800 rounded-xl p-4 bg-slate-900/40 hover:bg-slate-900/70 transition-all"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/5 px-2 py-0.5 border border-rose-500/10 rounded-md">
                                    {prop.technique}
                                  </span>
                                  <p className="text-sm mt-2 text-slate-300 leading-relaxed">
                                    {prop.explanation}
                                  </p>
                                </motion.div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-slate-500 text-sm">
                                <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                                {t.propagandaEmpty}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Bias Analysis Tab */}
                        {activeTab === "bias" && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-400">Kategori Bias:</span>
                              <span className="text-[10px] font-mono border border-blue-500/20 font-bold px-2.5 py-0.5 uppercase tracking-wide bg-blue-500/5 text-blue-400 rounded-md">
                                {result.data.biasAnalysis.rating}
                              </span>
                            </div>
                            <div className="text-sm leading-relaxed font-sans p-4 border border-slate-800 rounded-xl bg-[#0B0F19]/50 text-slate-200 font-medium">
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
                                className="flex items-start gap-2.5 p-3.5 border border-slate-800 rounded-xl bg-slate-900/40 text-xs text-slate-300"
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.04 }}
                              >
                                <div className="p-0.5 rounded-full mt-0.5 shrink-0 bg-blue-500/10 text-blue-400 border border-blue-500/25">
                                  <Check className="w-3 h-3" />
                                </div>
                                <span className="opacity-95 leading-relaxed">{sug}</span>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* SEARCH GROUNDING & SOURCES DETAILED VIEW */}
                <div className="border-t border-slate-800 pt-6 space-y-4">
                  {/* Web Queries Run */}
                  {result.queries && result.queries.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 text-slate-400">
                        <Search className="w-3 h-3 text-blue-400" />
                        {t.searchQueries}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.queries.map((q, idx) => (
                          <span key={idx} className="text-[10px] px-2.5 py-1 border border-slate-800 font-mono bg-slate-900/80 rounded-lg text-slate-300">
                            "{q}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grounded Web references */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest block text-slate-400">
                      [ {t.sourcesFound} ]
                    </span>
                    {result.sources && result.sources.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {result.sources.map((src, index) => (
                          <motion.a
                            key={index}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 border border-slate-800 flex items-start justify-between group rounded-xl bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/90 transition-all duration-200"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <p className="text-xs font-sans font-bold line-clamp-2 leading-snug text-slate-200 group-hover:underline group-hover:text-blue-400">
                                {src.title || "Rujukan Valid"}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] min-w-0">
                                <span className="border border-blue-500/10 font-mono font-bold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider shrink-0 bg-blue-500/5 text-blue-400">
                                  {(() => {
                                    try {
                                      const u = new URL(src.url);
                                      return u.hostname.replace('news.', '').replace('www.', '');
                                    } catch {
                                      return 'Source';
                                    }
                                  })()}
                                </span>
                                <span className="text-slate-500 font-mono truncate flex-1" title={src.url}>
                                  {src.url}
                                </span>
                              </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0 ml-2 mt-0.5" />
                          </motion.a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        {t.noSources}
                      </p>
                    )}
                  </div>
                </div>

              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* FULL-WIDTH TRUST BANNER MATCHING MOCKUP */}
        <section className="border border-slate-800/80 bg-[#111827] py-6 px-6 sm:px-8 mt-12 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl shadow-slate-950/20">
          <div className="max-w-2xl">
            <span className="block font-mono text-[9px] uppercase tracking-widest font-bold mb-1.5 text-blue-400">
              [ Truth Network ]
            </span>
            <h4 className="font-sans font-bold text-2xl tracking-tight mb-2 text-white">
              Snopes, Tempo & AFP Connectivity
            </h4>
            <p className="text-sm leading-relaxed text-slate-400 font-sans">
              Sistem memanfaatkan Google Search Grounding untuk menjembatani data global dan lokal dari <strong>Snopes.com</strong>, <strong>AFP Fact Check</strong>, serta jaringan penangkal hoaks nasional <strong>Mafindo (TurnBackHoax)</strong> dan <strong>CekFakta</strong>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <span className="font-mono text-[9px] uppercase tracking-wider bg-slate-900/80 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg shadow-sm font-semibold">Snopes API</span>
            <span className="font-mono text-[9px] uppercase tracking-wider bg-slate-900/80 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg shadow-sm font-semibold">AFP Fact</span>
            <span className="font-mono text-[9px] uppercase tracking-wider bg-slate-900/80 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg shadow-sm font-semibold">CekFakta</span>
          </div>
        </section>
      </main>

      {/* FOOTER MATCHING MOCKUP */}
      <footer className="mt-16 border-t border-current/30 pt-8 pb-12 font-mono text-[10px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="opacity-75">
            © 2026 VERIFIKASIAI / BUILT WITH GOOGLE GEMINI 3.5 & SEARCH GROUNDING
          </p>
          <div className="flex flex-wrap items-center gap-4 opacity-80">
            <span>[ SNOPES CONNECTED ]</span>
            <span>[ AFP VERIFIED ]</span>
            <span>[ MAFINDO GROUNDED ]</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
