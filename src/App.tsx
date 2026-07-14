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
  Info
} from "lucide-react";
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

export default function App() {
  // Localization: 'id' for Bahasa Indonesia, 'en' for English
  const [lang, setLang] = useState<"id" | "en">("id");

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
    if (r.includes("trusted") || r.includes("credible")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (r.includes("mixed") || r.includes("unverified")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    if (r.includes("disputed") || r.includes("misleading") || r.includes("false")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* HEADER SECTION */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-sky-600 text-white p-2.5 rounded-xl shadow-md shadow-sky-100 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" id="app-logo-icon" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                VerifikasiAI
                <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">v1.2</span>
              </span>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Independent Real-time Verification Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Bilingual Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
              <button 
                id="lang-btn-id"
                onClick={() => setLang("id")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  lang === "id" 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🇮🇩 Bahasa Indonesia
              </button>
              <button 
                id="lang-btn-en"
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  lang === "en" 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO HERO SECTION */}
      <div className="bg-gradient-to-b from-sky-50 via-white to-transparent py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
            {t.title}
          </h1>
          <p className="mt-3.5 text-slate-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            {t.subtitle}
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="space-y-8">
            
            {/* INPUT CARD */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6" id="input-card">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-sky-500" />
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
                    className="w-full rounded-xl border border-slate-200 p-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-y"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <input
                      id="news-url-input"
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder={t.urlPlaceholder}
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    />
                  </div>

                  <button
                    id="submit-analysis-btn"
                    onClick={() => handleAnalyze(textInput, urlInput)}
                    disabled={isAnalyzing || !textInput.trim()}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                      isAnalyzing || !textInput.trim()
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-100 hover:shadow-lg active:scale-95"
                    }`}
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
                  </button>
                </div>
              </div>

              {/* DEMO EXAMPLES QUICK FILL */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  {t.examplesTitle}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(lang === "id" ? INDONESIAN_EXAMPLES : ENGLISH_EXAMPLES).map((item, idx) => (
                    <button
                      id={`demo-claim-${idx}`}
                      key={idx}
                      onClick={() => {
                        setTextInput(item.title);
                        setUrlInput(item.url || "");
                        handleAnalyze(item.title, item.url);
                      }}
                      className="text-left p-3 rounded-xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50/50 transition-all text-xs flex flex-col justify-between group"
                    >
                      <span className="text-slate-700 font-medium group-hover:text-slate-900 line-clamp-2 mb-2">
                        "{item.title}"
                      </span>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md font-semibold border border-slate-100">
                          {item.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.isFake ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                        }`}>
                          {item.isFake ? (lang === "id" ? "Kemungkinan Hoaks" : "Likely Fake") : (lang === "id" ? "Valid/Resmi" : "Valid/Official")}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ERROR VIEW */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-800 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">{lang === "id" ? "Gagal Menganalisis Berita" : "Analysis Failed"}</h4>
                  <p className="mt-1">{errorMsg}</p>
                  <p className="mt-2 text-xs font-semibold text-rose-700">
                    💡 Tip: {t.errorApiKey}
                  </p>
                </div>
              </div>
            )}

            {/* MAIN RESULTS SECTION */}
            {result ? (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6" id="analysis-results">
                {/* Visual Header */}
                <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="shrink-0 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      {result.data.credibilityScore >= 75 ? (
                        <CheckCircle className="w-12 h-12 text-emerald-500" />
                      ) : result.data.credibilityScore >= 45 ? (
                        <AlertTriangle className="w-12 h-12 text-amber-500" />
                      ) : (
                        <ShieldAlert className="w-12 h-12 text-rose-500" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{t.overallRating}</span>
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
                      <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">{t.credibilityScore}</span>
                      <span className="text-3xl font-black text-slate-800 tracking-tight">{result.data.credibilityScore} <span className="text-sm font-normal text-slate-400">/ 100</span></span>
                    </div>
                    {/* Ring gauge simulation */}
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          stroke="#f1f5f9"
                          strokeWidth="5"
                          fill="transparent"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          stroke={
                            result.data.credibilityScore >= 75 ? "#10b981" : result.data.credibilityScore >= 45 ? "#f59e0b" : "#f43f5e"
                          }
                          strokeWidth="5"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 24}
                          strokeDashoffset={2 * Math.PI * 24 * (1 - result.data.credibilityScore / 100)}
                        />
                      </svg>
                      <span className="absolute text-xs font-extrabold text-slate-700">%</span>
                    </div>
                  </div>
                </div>

                {/* EXECUTIVE SUMMARY */}
                <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-4">
                  <h4 className="text-xs font-extrabold text-sky-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Info className="w-4 h-4" />
                    {t.summary}
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {result.data.summary}
                  </p>
                </div>

                {/* FOUR PILLARS TABBED SECTION */}
                <div className="space-y-4">
                  <div className="border-b border-slate-200">
                    <nav className="flex flex-wrap -mb-px gap-1">
                      {Object.keys(t.tabs).map((tabKey) => {
                        const key = tabKey as keyof typeof t.tabs;
                        const isActive = activeTab === key;
                        return (
                          <button
                            id={`tab-btn-${key}`}
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`py-2.5 px-4 font-bold text-xs tracking-wide rounded-t-xl transition-all border-b-2 ${
                              isActive 
                                ? "border-sky-600 text-sky-600 bg-sky-50/20" 
                                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            }`}
                          >
                            {t.tabs[key]}
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  <div className="pt-2 min-h-[160px]">
                    {/* Verification Tab */}
                    {activeTab === "verification" && (
                      <div className="space-y-4">
                        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 rounded-xl p-4 border border-slate-200/50">
                          {result.data.claimVerification}
                        </div>

                        {/* Search Grounding info box */}
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                          <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-md shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider block">{t.googleGrounded}</span>
                            <p className="text-xs text-slate-600 mt-1">
                              Informasi diverifikasi langsung dengan bantuan mesin penelusur Google Search untuk membandingkan klaim dengan korpus berita tepercaya global & lokal (Snopes, AFP, Tempo, dll).
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Source Credibility Tab */}
                    {activeTab === "credibility" && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-extrabold text-slate-800">{t.reputationAnalyzed}</h4>
                        <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-200/50">
                          {result.data.sourceCredibility}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                          <div className="border border-slate-150 rounded-lg p-3 bg-white text-xs">
                            <span className="font-bold text-slate-500 block mb-1">Status Keamanan Domain:</span>
                            <span className="text-slate-700">Domain dinilai berdasarkan riwayat penyebaran hoaks dan afiliasi editorial resmi.</span>
                          </div>
                          <div className="border border-slate-150 rounded-lg p-3 bg-white text-xs">
                            <span className="font-bold text-slate-500 block mb-1">Transparansi Penulis:</span>
                            <span className="text-slate-700">Analisis menyelidiki keberadaan atribusi jurnalis dan penanggung jawab redaksi.</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Propaganda Detection Tab */}
                    {activeTab === "propaganda" && (
                      <div className="space-y-3">
                        {result.data.propagandaDetection && result.data.propagandaDetection.length > 0 ? (
                          result.data.propagandaDetection.map((prop, index) => (
                            <div key={index} className="border border-rose-100 rounded-xl p-4 bg-rose-50/30">
                              <span className="text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                {prop.technique}
                              </span>
                              <p className="text-sm text-slate-700 mt-2 font-medium">
                                {prop.explanation}
                              </p>
                            </div>
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
                          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Kategori Bias:</span>
                          <span className="text-xs font-black bg-sky-100 text-sky-800 px-3 py-1 rounded-full">
                            {result.data.biasAnalysis.rating}
                          </span>
                        </div>
                        <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-200/50">
                          {result.data.biasAnalysis.explanation}
                        </div>
                      </div>
                    )}

                    {/* Suggestions Tab */}
                    {activeTab === "suggestions" && (
                      <div className="space-y-3">
                        {result.data.suggestions.map((sug, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700">
                            <div className="p-1 bg-sky-100 text-sky-700 rounded-full mt-0.5 shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <span>{sug}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* SEARCH GROUNDING & SOURCES DETAILED VIEW */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  {/* Web Queries Run */}
                  {result.queries && result.queries.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-slate-500" />
                        {t.searchQueries}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {result.queries.map((q, idx) => (
                          <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-lg border border-slate-200 font-mono">
                            "{q}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grounded Web references */}
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                      {t.sourcesFound}
                    </span>
                    {result.sources && result.sources.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {result.sources.map((src, index) => (
                          <a
                            key={index}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-white border border-slate-200 rounded-xl hover:border-sky-300 hover:bg-sky-50/20 transition-all flex items-start justify-between group"
                          >
                            <div className="space-y-1">
                              <p className="text-xs font-extrabold text-slate-800 line-clamp-1 group-hover:text-sky-700">
                                {src.title || "Rujukan Valid"}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono line-clamp-1">
                                {src.url}
                              </p>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 shrink-0 ml-2" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        {t.noSources}
                      </p>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
                <ShieldCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-base font-bold text-slate-800">Verifikasi Berita Instan</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2">
                  {t.noDataYet}
                </p>
              </div>
            )}

            {/* INTEGRATION GUIDE SECTION */}
            <div className="bg-slate-900 text-white rounded-2xl shadow-lg p-6 overflow-hidden relative">
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
            </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-medium">
          <p>© 2026 VerifikasiAI. All Rights Reserved. Built securely using Google Gemini 3.5 & Google Search Grounding.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-sky-500" /> Snopes Connected</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-sky-500" /> AFP Verified</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-sky-500" /> Mafindo Grounded</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
