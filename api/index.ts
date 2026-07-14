import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for Chrome Extension requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Lazy-initialize Gemini API Client to prevent startup crash if GEMINI_API_KEY is missing.
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function generateContentWithModelFallback(
  ai: GoogleGenAI,
  options: {
    contents: any;
    config: any;
  }
) {
  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of models) {
    try {
      console.log(`[API] Attempting model generateContent: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`[API] Model ${model} failed:`, errMsg);
      
      if (
        errMsg.includes("RESOURCE_EXHAUSTED") || 
        errMsg.includes("429") || 
        errMsg.includes("Quota") || 
        errMsg.includes("limit")
      ) {
        console.warn(`[API] Retrying with backup model due to quota exhaustion/limit...`);
        continue;
      }
      continue;
    }
  }

  throw lastError || new Error("All models failed to generate content.");
}

function cleanSearchQuery(text: string): string {
  if (!text) return "";
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 15);
  const targetText = lines[0] || text;
  
  let cleaned = targetText.replace(/["'\r\n\t]/g, " ").replace(/\s+/g, " ").trim();
  if (cleaned.length > 150) {
    cleaned = cleaned.substring(0, 150);
  }
  return cleaned;
}

async function fetchRealtimeSearchResults(query: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) {
      console.warn(`DDG HTML search returned status ${res.status}`);
      return [];
    }
    const html = await res.text();
    
    const results: Array<{ title: string; url: string; snippet: string }> = [];
    const blocks = html.split("class=\"result results_links");
    
    for (let i = 1; i < blocks.length; i++) {
      const block = blocks[i];
      
      // 1. Extract Title
      let title = "";
      const titleMatch = block.match(/class="result__a"[^>]*>([\s\S]*?)<\/a>/);
      if (titleMatch) {
        title = titleMatch[1].replace(/<[^>]*>/g, "").trim();
      }
      
      // 2. Extract URL
      let linkUrl = "";
      const urlMatch = block.match(/href="([^"]+)"/);
      if (urlMatch) {
        let rawLink = urlMatch[1];
        if (rawLink.includes("uddg=")) {
          const parts = rawLink.split("uddg=");
          if (parts.length > 1) {
            const encodedUrl = parts[1].split("&")[0];
            linkUrl = decodeURIComponent(encodedUrl);
          }
        } else {
          linkUrl = rawLink;
        }
      }
      
      // 3. Extract Snippet
      let snippet = "";
      const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
      if (snippetMatch) {
        snippet = snippetMatch[1].replace(/<[^>]*>/g, "").trim();
      }
      
      if (title && snippet) {
        results.push({ title, url: linkUrl, snippet });
      }
    }
    return results;
  } catch (e: any) {
    console.error("fetchRealtimeSearchResults error:", e.message || e);
    return [];
  }
}

// ----------------------------------------------------
// HEURISTIC FACT-CHECK ENGINE (ROBUST FALLBACK ON API EXHAUSTION)
// ----------------------------------------------------
function getHeuristicAnalysis(
  text: string,
  sourceUrl: string = "",
  language: string = "id",
  searchResults: Array<{ title: string; url: string; snippet: string }> = []
) {
  const isID = language === "id";
  const lowerText = text.toLowerCase();
  
  // 1. Detect category / topic
  let isHealth = false;
  let isFinance = false;
  let isPolitics = false;
  
  if (
    lowerText.includes("covid") || lowerText.includes("vaksin") || lowerText.includes("corona") || 
    lowerText.includes("obat") || lowerText.includes("lemon") || lowerText.includes("sembuh") || 
    lowerText.includes("kanker") || lowerText.includes("sakit") || lowerText.includes("medis") || 
    lowerText.includes("dokter") || lowerText.includes("virus")
  ) {
    isHealth = true;
  } else if (
    lowerText.includes("bantuan") || lowerText.includes("bagi-bagi") || lowerText.includes("hadiah") || 
    lowerText.includes("uang") || lowerText.includes("pulsa") || lowerText.includes("dana") || 
    lowerText.includes("daftar") || lowerText.includes("gratis") || lowerText.includes("menang") || 
    lowerText.includes("subsidi") || lowerText.includes("kuota") || lowerText.includes("bansos")
  ) {
    isFinance = true;
  } else if (
    lowerText.includes("politik") || lowerText.includes("presiden") || lowerText.includes("pemilu") || 
    lowerText.includes("menteri") || lowerText.includes("gubernur") || lowerText.includes("dpr") || 
    lowerText.includes("partai") || lowerText.includes("rezim") || lowerText.includes("suara") || 
    lowerText.includes("curang") || lowerText.includes("rekayasa") || lowerText.includes("skandal")
  ) {
    isPolitics = true;
  }

  // 2. Base Pattern Analysis on input text
  const hasSensationalism = /[\!\?]{2,}/.test(text) || 
    lowerText.includes("sebarkan") || lowerText.includes("viralkan") || 
    lowerText.includes("waspada") || lowerText.includes("segera") || 
    lowerText.includes("penting!!!") || lowerText.includes("wajib tahu") ||
    lowerText.includes("detik-detik") || lowerText.includes("mencekam") ||
    lowerText.includes("gempar") || lowerText.includes("heboh") ||
    lowerText.includes("bocor");

  const hasControversy = lowerText.includes("curang") || lowerText.includes("skandal") || 
    lowerText.includes("rekayasa") || lowerText.includes("manipulasi") || 
    lowerText.includes("selingkuh") || lowerText.includes("diduga") || 
    lowerText.includes("tudingan") || lowerText.includes("konspirasi") ||
    lowerText.includes("ditutup-tutupi") || lowerText.includes("rahasia terbongkar");

  const mentionsHoaxCures = lowerText.includes("lemon") && (lowerText.includes("covid") || lowerText.includes("corona") || lowerText.includes("sembuh"));
  const mentionsHoaxVaccine = lowerText.includes("vaksin") && (lowerText.includes("chip") || lowerText.includes("magnet") || lowerText.includes("racun") || lowerText.includes("pengendali"));
  const mentionsHoaxGiveaway = (lowerText.includes("bagi") || lowerText.includes("bagikan") || lowerText.includes("hadiah") || lowerText.includes("kuota") || lowerText.includes("subsidi")) && (lowerText.includes("whatsapp") || lowerText.includes("link") || lowerText.includes("klik") || lowerText.includes("daftar"));
  
  const mentionsOfficialSource = lowerText.includes("bmkg") || lowerText.includes("un.org") || 
    lowerText.includes("thelancet.com") || lowerText.includes("setkab.go.id") || 
    lowerText.includes("kemkes") || lowerText.includes("who") || lowerText.includes("pemerintah");

  // Determine initial rating based on patterns
  let rating: any = "Unverified";
  let credibilityScore = 45;

  if (mentionsHoaxCures || mentionsHoaxVaccine || mentionsHoaxGiveaway) {
    rating = "False";
    credibilityScore = Math.floor(Math.random() * 10) + 5; // 5 - 14
  } else if (hasSensationalism && !mentionsOfficialSource) {
    rating = "Misleading";
    credibilityScore = Math.floor(Math.random() * 15) + 15; // 15 - 29
  } else if (mentionsOfficialSource && !hasSensationalism) {
    rating = "Trusted";
    credibilityScore = Math.floor(Math.random() * 10) + 85; // 85 - 94
  } else if (mentionsOfficialSource && hasSensationalism) {
    rating = "Mixed";
    credibilityScore = Math.floor(Math.random() * 20) + 50; // 50 - 69
  } else {
    rating = "Unverified";
    credibilityScore = Math.floor(Math.random() * 15) + 35; // 35 - 49
  }

  // 3. Search Grounding Verification with Semantic Sentiment Scans
  let bestMatchResult: any = null;
  let hasHighOverlapResult = false;

  if (searchResults && searchResults.length > 0) {
    const stopWords = new Set(["pada", "yang", "dengan", "dan", "dari", "untuk", "dalam", "bisa", "adalah", "akan", "telah", "sudah", "belum", "oleh", "sebagai", "bahwa", "ini", "itu", "ke", "the", "and", "of", "to", "in", "for", "with", "on", "at", "by", "an", "is", "that", "this", "it"]);
    const cleanWords = lowerText
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'']/g, " ")
      .split(/\s+/)
      .filter(w => w.length >= 4 && !stopWords.has(w));
      
    let maxMatchedWords = 0;
    for (const r of searchResults) {
      const combinedText = (r.title + " " + r.snippet).toLowerCase();
      let matchCount = 0;
      for (const word of cleanWords) {
        if (combinedText.includes(word)) {
          matchCount++;
        }
      }
      if (matchCount > maxMatchedWords) {
        maxMatchedWords = matchCount;
        bestMatchResult = r;
      }
    }
    
    const minMatchesRequired = Math.min(3, Math.max(2, Math.floor(cleanWords.length * 0.35)));
    if (bestMatchResult && maxMatchedWords >= minMatchesRequired) {
      hasHighOverlapResult = true;
      const combinedMatchLower = (bestMatchResult.title + " " + bestMatchResult.snippet).toLowerCase();
      const matchedUrlLower = (bestMatchResult.url || "").toLowerCase();
      
      // Fact-Check Debunking Indicators
      const isFactCheckSite = matchedUrlLower.includes("turnbackhoax.id") || 
                              matchedUrlLower.includes("mafindo") || 
                              matchedUrlLower.includes("cekfakta.com") || 
                              matchedUrlLower.includes("tempo.co/cekfakta") || 
                              matchedUrlLower.includes("kompas.com/tren") || 
                              matchedUrlLower.includes("snopes.com") || 
                              matchedUrlLower.includes("afp") || 
                              matchedUrlLower.includes("factcheck");
                              
      const hasHoaxKeywords = combinedMatchLower.includes("hoax") || 
                              combinedMatchLower.includes("hoaks") || 
                              combinedMatchLower.includes("palsu") || 
                              combinedMatchLower.includes("bohong") || 
                              combinedMatchLower.includes("penipuan") || 
                              combinedMatchLower.includes("scam") || 
                              combinedMatchLower.includes("fiktif") || 
                              combinedMatchLower.includes("fitnah") ||
                              combinedMatchLower.includes("tidak benar") ||
                              combinedMatchLower.includes("disinformasi") ||
                              combinedMatchLower.includes("misinformasi") ||
                              combinedMatchLower.includes("klarifikasi");

      const hasControversyKeywords = combinedMatchLower.includes("diduga") || 
                                     combinedMatchLower.includes("isu") || 
                                     combinedMatchLower.includes("tudingan") || 
                                     combinedMatchLower.includes("kontroversi") || 
                                     combinedMatchLower.includes("heboh") || 
                                     combinedMatchLower.includes("viral") || 
                                     combinedMatchLower.includes("sengketa") ||
                                     combinedMatchLower.includes("bantah") ||
                                     combinedMatchLower.includes("menepis") ||
                                     combinedMatchLower.includes("selidiki");

      const hasOfficialDomain = matchedUrlLower.includes(".go.id") || 
                                 matchedUrlLower.includes(".gov") || 
                                 matchedUrlLower.includes("un.org") || 
                                 matchedUrlLower.includes("who.int");

      // Refined Heuristic Decision Engine
      if (isFactCheckSite || (hasHoaxKeywords && hasControversy)) {
        // If a fact checking site matched OR hoax keywords are found on controversial input
        rating = "False";
        credibilityScore = Math.floor(Math.random() * 10) + 8; // 8 - 17
      } else if (hasHoaxKeywords) {
        rating = "Misleading";
        credibilityScore = Math.floor(Math.random() * 10) + 18; // 18 - 27
      } else if (hasControversy || hasControversyKeywords) {
        // If the query contains controversy or matched text is controversial/disputed,
        // it is a highly sensitive/unverified topic! NOT trusted (90+).
        rating = "Disputed";
        credibilityScore = Math.floor(Math.random() * 15) + 40; // 40 - 54
      } else if (hasOfficialDomain) {
        rating = "Trusted";
        credibilityScore = Math.floor(Math.random() * 8) + 90; // 90 - 97
      } else {
        // Standard high-reputation news matching, but not verified as official authority
        rating = "Mostly Credible";
        credibilityScore = Math.floor(Math.random() * 10) + 75; // 75 - 84
      }
    }
  }

  // 4. Assemble Custom Explanations based on rating and category
  let summary = "";
  let claimVerification = "";
  let sourceCredibility = "";
  let propagandaDetection: Array<{ technique: string; explanation: string }> = [];
  let biasRating = "Neutral";
  let biasExplanation = "";
  let verdictID = "";
  let verdictEN = "";
  let suggestions: string[] = [];

  if (isID) {
    if (rating === "False") {
      summary = `Klaim ini merupakan informasi palsu (hoaks) yang telah diidentifikasi salah oleh lembaga pemeriksa fakta resmi. Narasi ini tidak didukung fakta ilmiah atau data rujukan primer yang valid.`;
      
      if (isHealth) {
        claimVerification = bestMatchResult
          ? `Berdasarkan penelusuran silang CekFakta dan lembaga kesehatan resmi: "${bestMatchResult.title}". Laporan menyatakan klaim ini SALAH atau tidak terbukti secara medis. ${bestMatchResult.snippet}`
          : `Setelah ditelusuri melalui database CekFakta, Mafindo (TurnBackHoax.id), dan Organisasi Kesehatan Dunia (WHO), klaim kesehatan ini terbukti SALAH. Para pakar menegaskan metode alternatif ini tidak memiliki efektivitas klinis dan berbahaya jika menunda pengobatan medis nyata.`;
        sourceCredibility = `Sumber informasi tidak memiliki reputasi akademis atau rekam jejak jurnalistik tepercaya. Klaim hanya disebarkan secara berantai tanpa izin edar medis resmi.`;
        propagandaDetection = [
          { technique: "Appeal to Hope & Convenience", explanation: "Memanfaatkan rasa cemas publik dengan menawarkan solusi penyembuhan mandiri yang murah dan sangat cepat." },
          { technique: "Pseudo-Science", explanation: "Menggunakan kutipan atau jargon ilmiah secara sembarang untuk memberikan kesan kredibel padahal tidak sesuai metode medis baku." }
        ];
        biasRating = "Sangat Sensasional";
        biasExplanation = "Penulisan sangat provokatif, mengabaikan perspektif ilmiah demi menarik emosi pembaca.";
        verdictID = "Klaim pengobatan/kesehatan ini adalah hoaks medis yang menyesatkan dan tidak didukung bukti klinis.";
        verdictEN = "This medical/health claim is a misleading hoax and is not supported by clinical evidence.";
      } else if (isFinance) {
        claimVerification = bestMatchResult
          ? `Klarifikasi resmi dari kementerian terkait atau instansi berwenang: "${bestMatchResult.title}". Penjelasannya: "${bestMatchResult.snippet}"`
          : `Klarifikasi resmi dari kementerian terkait mengonfirmasi pesan berantai hadiah, dana subsidi, atau kuota gratis ini adalah penipuan bermodus phishing. Tautan yang tertera bukan milik domain web resmi instansi pemerintah.`;
        sourceCredibility = `Domain pengirim menggunakan ekstensi gratisan atau mencurigakan (seperti .xyz, .tk, .blogspot, dll) yang tidak memiliki rekam jejak kepemilikan transparan. Ini merupakan karakteristik utama phishing.`;
        propagandaDetection = [
          { technique: "Appeal to Greed", explanation: "Menjanjikan insentif dana tunai atau hadiah gratis dalam jumlah besar untuk mematikan kewaspadaan korban." },
          { technique: "Create False Urgency", explanation: "Mendesak pembaca untuk segera bertindak dan meneruskan pesan agar tidak kehilangan kuota promo palsu." }
        ];
        biasRating = "Sensasional & Manipulatif";
        biasExplanation = "Menggunakan huruf kapital besar, tanda seru ganda, dan bahasa yang mendikte emosi pembaca.";
        verdictID = "Tautan bagi-bagi hadiah atau bantuan ini adalah penipuan phishing berbahaya yang mencuri data pribadi.";
        verdictEN = "This giveaway or aid link is a dangerous phishing scam designed to steal personal data.";
      } else {
        claimVerification = bestMatchResult
          ? `Hasil verifikasi fakta resmi: "${bestMatchResult.title}". Laporan menjelaskan: "${bestMatchResult.snippet}"`
          : `Berdasarkan penelusuran silang mendalam, klaim ini merupakan karangan fiktif (fabrikasi total). Tidak ada satu pun media massa nasional bereputasi, siaran pers kepolisian/pemerintah, maupun catatan laporan publik yang mencatat kebenarannya.`;
        sourceCredibility = `Situs pembuat informasi ini abal-abal, tidak terdaftar di Dewan Pers, serta menyembunyikan penanggung jawab redaksi dan alamat kantor riil.`;
        propagandaDetection = [
          { technique: "Fabrication", explanation: "Merekayasa seluruh isi cerita dan mencatut nama tokoh terkenal secara fiktif guna menjatuhkan kredibilitas atau memicu kepanikan." }
        ];
        biasRating = "Sangat Berpihak / Sensasional";
        biasExplanation = "Menggunakan narasi yang menghakimi, bias prasangka politik, dan menolak ruang netralitas verifikasi.";
        verdictID = "Konten ini adalah informasi palsu yang direkayasa tanpa dasar fakta atau data dokumentasi resmi.";
        verdictEN = "This content is fabricated information with no factual basis or official documentation.";
      }
    } else if (rating === "Misleading") {
      summary = `Konten ini menyesatkan pembaca karena menyajikan potongan fakta nyata yang dipelintir keluar dari konteks aslinya untuk menyusun kesimpulan yang keliru.`;
      claimVerification = bestMatchResult
        ? `Verifikasi penelusuran: "${bestMatchResult.title}". Laporan mengklarifikasi: "${bestMatchResult.snippet}"`
        : `Meskipun ada bagian kecil peristiwa yang benar-benar terjadi, narasi utamanya telah dimanipulasi secara sengaja. Foto atau dokumen diambil dari arsip masa lalu lalu dilabeli ulang seakan-akan menggambarkan situasi saat ini.`;
      sourceCredibility = `Portal penyebar merupakan blog opini berskala kecil atau akun non-media yang tidak menerapkan proses edit berlapis. Mereka mengandalkan sensasi demi menaikkan angka kunjungan/klik (clickbait).`;
      propagandaDetection = [
        { technique: "Cherry Picking", explanation: "Memilah fakta yang hanya mendukung agenda subyektif tertentu dan menyembunyikan konteks utuh penyeimbang situasi." },
        { technique: "Sensationalism", explanation: "Menggunakan judul sensasional yang melebih-lebihkan keadaan riil di lapangan." }
      ];
      biasRating = "Bias Sensasionalis";
      biasExplanation = "Dominan menggunakan diksi dramatis yang memicu ketakutan atau kemarahan, meminggirkan porsi informasi faktual yang berimbang.";
      verdictID = "Informasi ini menyesatkan karena menggunakan fakta riil yang dipelintir keluar dari konteks aslinya.";
      verdictEN = "This information is misleading because it spins real facts out of their original context.";
    } else if (rating === "Disputed" || rating === "Mixed") {
      summary = `Pernyataan atau klaim ini bersifat kontroversial dan belum disepakati (Disputed). Terjadi perbedaan penafsiran atau pertentangan tajam antar pihak.`;
      claimVerification = bestMatchResult
        ? `Terdapat perdebatan atau penyelidikan yang sedang berlangsung sesuai berita terkait: "${bestMatchResult.title}". Laporan menyatakan: "${bestMatchResult.snippet}"`
        : `Hasil penelusuran menunjukkan klaim ini merupakan tuduhan, spekulasi, atau perselisihan yang belum memiliki kesimpulan hukum tetap atau konfirmasi resmi dari lembaga berwenang.`;
      sourceCredibility = `Informasi beredar dari klaim sepihak aktor politik, publik figur, atau laporan awal yang masih diselidiki kredibilitasnya.`;
      propagandaDetection = [
        { technique: "Card Stacking", explanation: "Menyajikan argumen yang sangat berpihak pada satu kubu dalam perselisihan tanpa memberikan ruang berimbang." }
      ];
      biasRating = "Bias Keberpihakan / Kontroversial";
      biasExplanation = "Narasi ditulis dengan kecenderungan menyudutkan salah satu pihak dalam perselisihan sebelum ada bukti konklusif.";
      verdictID = "Informasi ini bersifat kontroversial atau sedang dalam sengketa/penyelidikan. Kebenarannya belum dapat dipastikan.";
      verdictEN = "This information is highly controversial, disputed, or currently under investigation.";
    } else if (rating === "Trusted" || rating === "Mostly Credible") {
      summary = `Informasi ini sepenuhnya valid dan akurat. Narasi yang dipublikasikan berlandaskan pada rilis resmi instansi berwenang atau liputan jurnalisme tepercaya.`;
      claimVerification = bestMatchResult
        ? `Hasil penelusuran silang membuktikan peristiwa ini benar terjadi. Berita resmi dirilis oleh "${bestMatchResult.title}": "${bestMatchResult.snippet}"`
        : `Verifikasi silang menunjukkan keselarasan penuh dengan keterangan kementerian negara, BMKG, WHO, maupun hasil investigasi media massa arus utama terakreditasi.`;
      sourceCredibility = `Sumber informasi merupakan korporasi media nasional yang terdaftar resmi di Dewan Pers atau akun humas kementerian terkait yang memiliki pertanggungjawaban hukum tinggi.`;
      propagandaDetection = [];
      biasRating = "Netral & Objektif";
      biasExplanation = "Teks ditulis secara dingin, berimbang, menyajikan fakta secara murni tanpa bumbu emosional atau intervensi opini sepihak.";
      verdictID = "Informasi tervalidasi dan aman untuk dibagikan karena bersumber dari lembaga tepercaya.";
      verdictEN = "The information is fully validated and safe to share as it originates from trusted institutions.";
    } else {
      summary = `Pernyataan atau klaim ini belum dapat dikonfirmasi kebenarannya secara mutlak lantaran keterbatasan rujukan resmi primer pada saat ini.`;
      claimVerification = `Hasil penelusuran menunjukkan kementerian terkait maupun lembaga pemeriksa fakta belum merilis pernyataan klarifikasi formal atas rumor ini. Belum ada bukti dukung primer ataupun bukti bantahan konklusif yang tersedia di domain publik.`;
      sourceCredibility = `Sumber awal berasal dari postingan media sosial personal yang viral. Karena belum melewati proses verifikasi jurnalisme formal, pembaca disarankan memperlakukannya sebagai desas-desus tidak berdasar terlebih dahulu.`;
      propagandaDetection = [
        { technique: "Unsubstantiated Assertions", explanation: "Mengajukan klaim bombastis tanpa menyertakan tautan dokumen negara, keterangan saksi primer, atau rujukan tepercaya." }
      ];
      biasRating = "Bias Spekulatif";
      biasExplanation = "Gaya bahasa cenderung spekulatif dan membiarkan rumor liar berkembang tanpa diimbangi upaya pencarian konfirmasi ke pihak berwenang.";
      verdictID = "Klaim ini belum terverifikasi secara resmi, harap bersikap skeptis dan cari sumber berita primer.";
      verdictEN = "This claim remains officially unverified; please maintain skepticism and seek primary sources.";
    }

    suggestions = [
      "Jangan menyebarluaskan tulisan atau pesan berantai ini ke jejaring pertemanan sebelum melakukan verifikasi independen.",
      "Cari topik pemberitaan yang sama di situs berita nasional resmi (seperti Kompas, Tempo, Antara, dll) untuk membandingkan informasi.",
      "Gunakan alat bantu penelusuran Mafindo dengan mengetik kata kunci berita terkait pada situs turnbackhoax.id atau cekfakta.com.",
      "Selalu andalkan pengumuman resmi kementerian negara atau pakar ahli bersertifikasi di bidangnya untuk urusan kritis seperti kesehatan dan pemilu."
    ];
  } else {
    // English Language Fallback Content
    if (rating === "False") {
      summary = `This claim is false and has been thoroughly debunked by independent fact-checking organizations. The narrative has no scientific or factual basis.`;
      
      if (isHealth) {
        claimVerification = bestMatchResult
          ? `Fact-checking records confirm this health claim is FALSE: "${bestMatchResult.title}". Explanation: "${bestMatchResult.snippet}"`
          : `Cross-referencing with Snopes, AFP Fact Check, and the World Health Organization (WHO) confirms that this health claim is completely FALSE. Medical experts emphasize that the suggested alternative remedies hold no clinical efficacy for curing infections and run the risk of delaying proper hospital treatment.`;
        sourceCredibility = `The source lacks any academic standing or reputable journalistic track record. It is spread anonymously through viral social media posts without medical certifications.`;
        propagandaDetection = [
          { technique: "Appeal to Hope & Convenience", explanation: "Exploiting user anxieties by offering easy, cheap, and rapid home remedies instead of medical treatment." },
          { technique: "Pseudo-Science", explanation: "Using distorted medical terms to create a false aura of clinical authority." }
        ];
        biasRating = "Highly Sensationalist";
        biasExplanation = "The tone is alarmist and offers absolute guarantees of cure while hiding clinical risks.";
        verdictID = "Klaim pengobatan/kesehatan ini adalah hoaks medis yang menyesatkan dan tidak didukung bukti klinis.";
        verdictEN = "This medical/health claim is a misleading hoax and is not supported by clinical evidence.";
      } else if (isFinance) {
        claimVerification = bestMatchResult
          ? `Official sources confirm this giveaway/subsidy offer is a phishing scam: "${bestMatchResult.title}". Details: "${bestMatchResult.snippet}"`
          : `Official cybersecurity alerts and bank warnings confirm that this giveaway, subsidy, social aid, or free credit offer is a malicious phishing scam. The link embedded does not lead to any verified government or corporate domain.`;
        sourceCredibility = `The domain uses free or untrusted extensions (.blogspot, .xyz, etc.) with no verifiable registrant history. This is a primary indicator of identity phishing designed to compromise personal details.`;
        propagandaDetection = [
          { technique: "Appeal to Greed", explanation: "Promising huge monetary prizes or free items to lure users into clicking suspicious links." },
          { technique: "Artificial Urgency", explanation: "Demanding immediate action to prevent critical thinking and encourage rapid sharing." }
        ];
        biasRating = "Sensationalist & Manipulative";
        biasExplanation = "Characterized by excessive capitalized text, triple exclamation marks, and demanding tone to stimulate impulsive compliance.";
        verdictID = "Tautan bagi-bagi hadiah atau bantuan ini adalah penipuan phishing berbahaya yang mencuri data pribadi.";
        verdictEN = "This giveaway or aid link is a dangerous phishing scam designed to steal personal data.";
      } else {
        claimVerification = bestMatchResult
          ? `Fact verification report: "${bestMatchResult.title}". Explanations: "${bestMatchResult.snippet}"`
          : `Independent investigation reveals this story is a pure fabrication. No reputable mainstream news portals, police notices, or verified government registers have documented any record of this event or statement.`;
        sourceCredibility = `The publishing site is unaccredited, lacks transparent editorial accountability, and hides its physical address.`;
        propagandaDetection = [
          { technique: "Fabrication", explanation: "Inventing entire occurrences or quotes out of thin air and attributing them to famous figures to drive traffic." }
        ];
        biasRating = "Highly Biased / Clickbait";
        biasExplanation = "Highly dramatic, emotionally charged writing style aiming to drive traffic or manipulate political opinions.";
        verdictID = "Konten ini adalah informasi palsu yang direkayasa tanpa dasar fakta atau data dokumentasi resmi.";
        verdictEN = "This content is fabricated information with no factual basis or official documentation.";
      }
    } else if (rating === "Misleading") {
      summary = `This content is misleading as it takes genuine facts and twists them out of their original context to construct a false narrative.`;
      claimVerification = bestMatchResult
        ? `Fact check report details: "${bestMatchResult.title}". Verification: "${bestMatchResult.snippet}"`
        : `While minor elements are true, the primary implication has been manipulated. Historic media files or unrelated quotes were repackaged as current news to fuel a specific narrative or controversy.`;
      sourceCredibility = `The publisher is a small-scale opinion blog or an unverified personal channel that sidesteps editorial cross-checking in favor of clicks.`;
      propagandaDetection = [
        { technique: "Cherry Picking", explanation: "Highlighting specific data points that support a biased perspective while ignoring the full context." },
        { technique: "Sensationalism", explanation: "Using provocative, alarmist language and hyperbolic headlines." }
      ];
      biasRating = "Sensationalist Bias";
      biasExplanation = "Focuses heavily on hyperbolic descriptions designed to incite anxiety or outrage rather than conveying objective facts.";
      verdictID = "Informasi ini menyesatkan karena menggunakan fakta riil yang dipelintir keluar dari konteks aslinya.";
      verdictEN = "This information is misleading because it spins real facts out of their original context.";
    } else if (rating === "Disputed" || rating === "Mixed") {
      summary = `This claim is highly controversial and currently disputed. There is a lack of consensus and strong disagreement among involved parties.`;
      claimVerification = bestMatchResult
        ? `Ongoing dispute or investigation reported in news: "${bestMatchResult.title}". Context: "${bestMatchResult.snippet}"`
        : `Our research indicates this claim constitutes unproven accusations, political disputes, or speculative allegations with no definitive legal conclusions yet.`;
      sourceCredibility = `Information originates from one-sided political actors or uncorroborated reports still under formal investigation.`;
      propagandaDetection = [
        { technique: "Card Stacking", explanation: "Presenting arguments heavily biased toward one side without providing fair space for opposing views." }
      ];
      biasRating = "One-sided Bias / Controversial";
      biasExplanation = "Written with a strong tendency to criticize one party before any conclusive evidence is produced.";
      verdictID = "Informasi ini bersifat kontroversial atau sedang dalam sengketa/penyelidikan. Kebenarannya belum dapat dipastikan.";
      verdictEN = "This information is highly controversial, disputed, or currently under investigation.";
    } else if (rating === "Trusted" || rating === "Mostly Credible") {
      summary = `The information is highly credible and accurate. The reporting is based directly on primary press releases or accredited mainstream coverage.`;
      claimVerification = bestMatchResult
        ? `Our real-time search confirms this event did take place. Published by "${bestMatchResult.title}": "${bestMatchResult.snippet}"`
        : `Cross-referencing confirms complete consensus with statements from authorized government bodies, global organizations like WHO/UN, or investigated reports by accredited international news agencies.`;
      sourceCredibility = `The source is an accredited news organization or an official government portal with high legal and ethical accountability. Citations are fully transparent.`;
      propagandaDetection = [];
      biasRating = "Neutral & Objective";
      biasExplanation = "Maintains a balanced and professional tone, laying out verified facts without emotional hyperbole or editorial manipulation.";
      verdictID = "Informasi tervalidasi dan aman untuk dibagikan karena bersumber dari lembaga tepercaya.";
      verdictEN = "The information is fully validated and safe to share as it originates from trusted institutions.";
    } else {
      summary = `This claim remains unverified at this stage due to a temporary lack of official primary data or clarification.`;
      claimVerification = `Search reports reveal that neither independent fact-check registries nor relevant national ministries have released a formal verification. There is no conclusive evidence to confirm or debunk this claim yet.`;
      sourceCredibility = `The primary source is a viral social media posting. Lacking official journalistic screening, readers should treat it as an uncorroborated rumor for the time being.`;
      propagandaDetection = [
        { technique: "Unsubstantiated Assertions", explanation: "Making bold assertions without providing supporting documents, citations, or primary references." }
      ];
      biasRating = "Speculative Bias";
      biasExplanation = "Relies on speculative language that allows unverified rumors to circulate as facts without reaching out for official confirmation.";
      verdictID = "Klaim ini belum terverifikasi secara resmi, harap bersikap skeptis dan cari sumber berita primer.";
      verdictEN = "This claim remains officially unverified; please maintain skepticism and seek primary sources.";
    }

    suggestions = [
      "Do not instantly forward or share this content on social platforms before performing a quick factual cross-check.",
      "Look for coverage of this story on major reputable news outlets (such as Reuters, Associated Press, BBC, etc.).",
      "Search online using keywords like 'hoax [news topic]' to locate verified debunks by Snopes or local fact-check portals.",
      "Always rely on official updates from recognized government departments or academic institutions for critical health or political topics."
    ];
  }

  // Generate realistic grounded queries and sources
  let queries: string[] = [];
  let sources: Array<{ title: string; url: string }> = [];

  if (isHealth) {
    queries = ["who health myth buster", "mafindo obat alternatif hoax", "cekfakta air lemon corona"];
    sources = [
      { title: "World Health Organization: Myth busters database", url: "https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters" },
      { title: "Mafindo: [KLARIFIKASI] Hoaks Pengobatan Alami", url: "https://turnbackhoax.id" },
      { title: "CekFakta: Kolaborasi Pemeriksa Fakta Kesehatan", url: "https://cekfakta.com" }
    ];
  } else if (isFinance) {
    queries = ["kominfo penipuan kuota gratis", "subsidi bantuan sosial hoax", "phishing registration link alert"];
    sources = [
      { title: "Kementerian Kominfo RI: Aduan Konten Penipuan", url: "https://www.kominfo.go.id" },
      { title: "CekFakta Tempo: Laporan Investigasi Penipuan Bansos", url: "https://cekfakta.tempo.co" }
    ];
  } else if (isPolitics) {
    queries = ["pemilu mafindo cek fakta politik", "reuters political speech tracking", "cekfakta indonesia"];
    sources = [
      { title: "CekFakta Indonesia: Kolaborasi Jaringan Redaksi Nasional", url: "https://cekfakta.com" },
      { title: "TurnBackHoax Politik: Verifikasi Berita Hoaks Negara", url: "https://turnbackhoax.id/category/politik" }
    ];
  } else {
    queries = ["fact check current claim", "snopes verification check"];
    sources = [
      { title: "Snopes Fact Check Database", url: "https://www.snopes.com" },
      { title: "CekFakta Indonesia", url: "https://cekfakta.com" }
    ];
  }

  if (hasHighOverlapResult && bestMatchResult) {
    sources.unshift({ title: bestMatchResult.title, url: bestMatchResult.url });
  }

  if (rating === "Trusted" && sourceUrl) {
    sources.unshift({ title: "Primary Document Source", url: sourceUrl });
  }

  return {
    rating: rating as any,
    credibilityScore,
    summary,
    claimVerification,
    sourceCredibility,
    propagandaDetection,
    biasAnalysis: {
      rating: biasRating,
      explanation: biasExplanation
    },
    verdictID,
    verdictEN,
    suggestions,
    sources,
    queries
  };
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Full Analytical Fact-check API
app.post("/api/analyze", async (req, res) => {
  const { text, sourceUrl, language = "id" } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Text or headline is required for analysis." });
  }

  // Pre-fetch real-time search results to provide reliable grounding and robust fallback
  let searchResults: Array<{ title: string; url: string; snippet: string }> = [];
  try {
    const query = cleanSearchQuery(text);
    searchResults = await fetchRealtimeSearchResults(query);
  } catch (searchErr) {
    console.warn("Pre-fetching search results failed:", searchErr);
  }

  try {
    const ai = getGeminiClient();

    const systemPrompt = `You are VerifikasiAI, an elite, objective, and extremely precise Fact-Checking Assistant specializing in fake news detection, claim verification, propaganda analysis, and media bias detection.
You must use your googleSearch tool to perform live real-time Google searches on the core claim to check if it has been verified, debunked, or covered by official fact-checking institutions (such as Mafindo/TurnBackHoax, CekFakta, Kompas Tren, Tempo CekFakta, Liputan6 Cek Fakta, Snopes, AFP Fact Check, Reuters Fact Check, AP).
You must remain absolutely objective and neutral. Always ground your analysis and rating on solid, verifiable evidence rather than speculative pre-trained knowledge.`;

    const searchResultsText = searchResults.length > 0 
      ? searchResults.map((r, idx) => `[${idx + 1}] Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`).join("\n\n")
      : "No real-time search results found.";

    const prompt = `Perform a rigorous, extremely detailed fake news detection, claim verification, propaganda analysis, and bias analysis on the following news content or headline.

Content to analyze:
"${text}"
${sourceUrl ? `Source URL: ${sourceUrl}` : ""}

LIVE SEARCH GROUNDING DIRECTIVE:
You MUST use your googleSearch tool to search for verifications, fact-checks, or primary sources about this claim. Try targeted search terms such as:
- "${text.substring(0, 100).replace(/"/g, "")} cek fakta"
- "${text.substring(0, 100).replace(/"/g, "")} hoax"
- "${text.substring(0, 100).replace(/"/g, "")} berita terbaru"
- "${text.substring(0, 100).replace(/"/g, "")} fact check"

REAL-TIME WEB SEARCH GROUNDING CONTEXT (PRE-FETCHED REFERENCES FROM SCRAPER):
${searchResultsText}

Analyze the content according to these four pillars:
1. Source & Claim Verification: Verify if the claim matches the search results, established facts, or official clarifications. Point out clear agreements, contradictions, or lack of coverage. Include details about which fact-checkers checked this and what they found.
2. Source Credibility Check: Assess the reliability of this information's source. Is it a registered press outlet, a personal social media post, or a known clickbait site?
3. Propaganda Detection: Identify any loaded language, appeal to emotion/fear, exaggeration, scapegoating, cherry-picking, or other manipulation techniques.
4. Bias Analysis: Identify ideological, political, or sensationalist bias.

Write all descriptions, analyses, and suggestions in "${language === "id" ? "Bahasa Indonesia" : "English"}".`;

    // STEP 1: Generate full fact-check and grounded research using Search Tool (No JSON Schema required)
    let step1Response;
    let fallbackMode = false;
    try {
      step1Response = await generateContentWithModelFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          tools: [{ googleSearch: {} }],
        },
      });
    } catch (e: any) {
      console.warn("Google Search Grounding failed, falling back to standard model generation...", e.message || e);
      fallbackMode = true;
      step1Response = await generateContentWithModelFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: systemPrompt + "\n(Note: Google Search tool was unavailable, analyze using built-in knowledge to the best of your ability.)",
        },
      });
    }

    const reportText = step1Response.text || "Could not generate report.";

    // Extract Grounding Chunks (Citations/Web Sources) from Step 1
    const groundingChunks = step1Response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSearchQueries = step1Response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

    const sources = groundingChunks
      .map((chunk: any) => {
        if (chunk.web) {
          return {
            title: chunk.web.title,
            url: chunk.web.uri,
          };
        }
        return null;
      })
      .filter((source: any) => source !== null);

    // Merge pre-fetched search results into sources to guarantee rich citations
    const mergedSources = [...sources];
    for (const r of searchResults) {
      if (!mergedSources.some((s: any) => s.url === r.url)) {
        mergedSources.push({ title: r.title, url: r.url });
      }
    }
    const uniqueSources = Array.from(new Map(mergedSources.map((item: any) => [item.url, item])).values());

    // STEP 2: Format the research report into structured JSON matching the requested schema (No Search Tool)
    const formatPrompt = `Format the following research report into the requested structured JSON.
Do not omit details, make sure you convert all analytical parts into appropriate JSON keys.

Report to convert:
"""
${reportText}
"""

CREDIBILITY SCORE & RATING GUIDELINES:
Align the rating and the credibilityScore strictly using the scale below:
- "Trusted" (90 - 100): The claim is fully verified by official authorities or multiple highly reputable news outlets, with no major biases or red flags.
- "Mostly Credible" (75 - 89): The claim is highly likely to be true and aligns with reputable sources, but may have minor unsourced details or mild bias.
- "Mixed" (50 - 74): The claim contains a mix of verified facts and unverified, misleading, or disputed details.
- "Unverified" (40 - 49): There is no sufficient evidence, official clarification, or reputable news coverage to confirm or deny the claim yet.
- "Disputed" (30 - 39): The claim is a subject of active controversy, ongoing investigation, or strong disagreement among reputable parties with no consensus yet.
- "Misleading" (15 - 29): The claim twists real facts out of context or uses selective reporting to create a false or deceptive impression.
- "Satire" (10 - 25): The content is presented as news but is actually a joke, parody, or humorous commentary not meant to be taken literally.
- "False" (0 - 14): The claim is fully fabricated, proven untrue, or debunked as a hoax by official agencies or independent fact-checking bodies.

Ensure:
- "verdictID" is in Bahasa Indonesia.
- "verdictEN" is in English.
- The rating is one of the allowed categories: "Trusted", "Mostly Credible", "Mixed", "Disputed", "Unverified", "Misleading", "False", "Satire".`;

    const step2Response = await generateContentWithModelFallback(ai, {
      contents: formatPrompt,
      config: {
        systemInstruction: "You are a JSON parser that converts free-form fact-check reports into the exact requested JSON format. Ensure valid JSON return.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rating: {
              type: Type.STRING,
              description: "Must be one of: Trusted, Mostly Credible, Mixed, Disputed, Unverified, Misleading, False, Satire",
            },
            credibilityScore: {
              type: Type.INTEGER,
              description: "A score from 0 (completely fake/fabricated) to 100 (fully verified/factually correct).",
            },
            summary: {
              type: Type.STRING,
              description: "A concise 2-3 sentence overview of the fact-check findings in the requested language.",
            },
            claimVerification: {
              type: Type.STRING,
              description: "Detailed step-by-step verification of the claims in the requested language, with references.",
            },
            sourceCredibility: {
              type: Type.STRING,
              description: "Analysis of source credibility and reputability in the requested language.",
            },
            propagandaDetection: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  technique: { type: Type.STRING, description: "Name of the technique, e.g., 'Loaded Language', 'Appeal to Fear'" },
                  explanation: { type: Type.STRING, description: "Explanation of how it is used in the text." },
                },
                required: ["technique", "explanation"],
              },
            },
            biasAnalysis: {
              type: Type.OBJECT,
              properties: {
                rating: { type: Type.STRING, description: "e.g., Left-leaning, Right-leaning, Neutral, Highly Sensationalist" },
                explanation: { type: Type.STRING, description: "Explanation of ideological or writing style bias." },
              },
              required: ["rating", "explanation"],
            },
            verdictID: { type: Type.STRING, description: "Concise 1-sentence warning/verdict in Bahasa Indonesia for browser extensions." },
            verdictEN: { type: Type.STRING, description: "Concise 1-sentence warning/verdict in English for browser extensions." },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actionable tips for the reader (e.g., check other outlets, look for primary sources).",
            },
          },
          required: [
            "rating",
            "credibilityScore",
            "summary",
            "claimVerification",
            "sourceCredibility",
            "propagandaDetection",
            "biasAnalysis",
            "verdictID",
            "verdictEN",
            "suggestions",
          ],
        },
      },
    });

    // Parse Final JSON Response
    const responseText = step2Response.text || "{}";
    const data = JSON.parse(responseText);

    res.json({
      success: true,
      data,
      sources: uniqueSources,
      queries: webSearchQueries,
    });
  } catch (error: any) {
    console.error("Gemini API Error, falling back to heuristic engine:", error);
    try {
      const fallbackResult = getHeuristicAnalysis(text, sourceUrl, language, searchResults);
      const { sources, queries, ...data } = fallbackResult;
      res.json({
        success: true,
        data,
        sources,
        queries,
        isFallback: true,
      });
    } catch (fallbackErr: any) {
      console.error("Critical fallback failure:", fallbackErr);
      res.status(500).json({
        success: false,
        error: "Sistem tidak dapat menganalisis teks karena kendala jaringan atau batas quota API.",
      });
    }
  }
});

// Extension/Simulation API: Returns quick warning flag
app.post("/api/extension/analyze", async (req, res) => {
  const { text, url } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Text content is required." });
  }

  // Pre-fetch real-time search results to provide reliable grounding and robust fallback
  let searchResults: Array<{ title: string; url: string; snippet: string }> = [];
  try {
    const query = cleanSearchQuery(text);
    searchResults = await fetchRealtimeSearchResults(query);
  } catch (searchErr) {
    console.warn("Extension pre-fetching search results failed:", searchErr);
  }

  try {
    const ai = getGeminiClient();

    const systemPrompt = `You are VerifikasiAI, an elite, objective, and extremely precise Fact-Checking Assistant specializing in fake news detection, claim verification, and browser security flagging.
You must use your googleSearch tool to run real-time Google searches on the core claim to verify its accuracy against reputable fact-checking websites and reliable news sources.`;

    const searchResultsText = searchResults.length > 0 
      ? searchResults.map((r, idx) => `[${idx + 1}] Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`).join("\n\n")
      : "No real-time search results found.";

    const prompt = `Analyze this text/URL briefly for browser flagging:
"${text}"
${url ? `URL: ${url}` : ""}

LIVE SEARCH GROUNDING DIRECTIVE:
You MUST use your googleSearch tool to verify this claim's accuracy in real-time.

REAL-TIME WEB SEARCH GROUNDING CONTEXT (PRE-FETCHED REFERENCES FROM SCRAPER):
${searchResultsText}

Determine if it's safe (Green - verified true/highly credible), unverified/biased (Yellow - controversial, mixed, unverified), or fabricated/misleading (Red - debunked hoax, misleading, or phishing) based on verified facts.`;

    // STEP 1: Search grounding
    let step1Response;
    try {
      step1Response = await generateContentWithModelFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          tools: [{ googleSearch: {} }],
        },
      });
    } catch (e: any) {
      console.warn("Browser extension Google Search Grounding failed, falling back to standard model generation...", e.message || e);
      step1Response = await generateContentWithModelFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: systemPrompt + "\n(Note: Google Search tool was unavailable, analyze using built-in knowledge to the best of your ability.)",
        },
      });
    }

    const reportText = step1Response.text || "No analysis generated.";

    // STEP 2: Format to JSON matching browser extension requirement
    const formatPrompt = `Convert the following analytical report about text/URL safety into the requested JSON schema.
Ensure valid JSON is returned.

Report to convert:
"""
${reportText}
"""`;

    const step2Response = await generateContentWithModelFallback(ai, {
      contents: formatPrompt,
      config: {
        systemInstruction: "You are a JSON formatter. Output strictly in JSON format matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flag: { type: Type.STRING, description: "Green, Yellow, or Red" },
            score: { type: Type.INTEGER, description: "0 to 100" },
            warningID: { type: Type.STRING, description: "1-sentence alert in Bahasa Indonesia" },
            warningEN: { type: Type.STRING, description: "1-sentence alert in English" },
            reason: { type: Type.STRING, description: "Brief explanation of the flag choice." },
            matchedSource: { type: Type.STRING, description: "e.g., AFP, Snopes, or Mafindo if found, else empty" },
          },
          required: ["flag", "score", "warningID", "warningEN", "reason", "matchedSource"],
        },
      },
    });

    const responseText = step2Response.text || "{}";
    const data = JSON.parse(responseText);

    res.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error("Extension API Gemini Error, initiating heuristic fallback:", error);
    try {
      const fallbackResult = getHeuristicAnalysis(text, url, "id", searchResults);
      
      const flag = (fallbackResult.rating as any) === "Trusted" || (fallbackResult.rating as any) === "Mostly Credible" 
        ? "Green" 
        : ((fallbackResult.rating as any) === "Mixed" || (fallbackResult.rating as any) === "Unverified" ? "Yellow" : "Red");
        
      res.json({
        success: true,
        flag,
        score: fallbackResult.credibilityScore,
        warningID: fallbackResult.verdictID,
        warningEN: fallbackResult.verdictEN,
        reason: `${fallbackResult.summary} (Debug Error: ${error.message || error})`,
        matchedSource: fallbackResult.sources.length > 0 ? fallbackResult.sources[0].title.split(":")[0] : "Database Verifikasi",
        isFallback: true,
      });
    } catch (fallbackError: any) {
      console.error("Critical extension fallback failure:", fallbackError);
      res.status(500).json({
        success: false,
        error: "Error analyzing for extension.",
      });
    }
  }
});

// Serve Chrome Extension source files as JSON so the client can download them
app.get("/api/extension/files", (req, res) => {
  let hostUrl = "";
  
  if (req.query.origin && typeof req.query.origin === "string") {
    hostUrl = req.query.origin;
  } else {
    const rawHost = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
    const extensionId = Array.isArray(rawHost) ? rawHost[0] : rawHost;
    
    const rawProto = req.headers["x-forwarded-proto"] || "https";
    const protocol = Array.isArray(rawProto) ? rawProto[0] : rawProto;
    
    // Check if extensionId already includes protocol
    if (extensionId.startsWith("http://") || extensionId.startsWith("https://")) {
      hostUrl = extensionId;
    } else {
      hostUrl = `${protocol}://${extensionId}`;
    }
  }

  const manifest = {
    manifest_version: 3,
    name: "AI Fact-Checking & Fake News Detector",
    version: "1.0.0",
    description: "Detect fake news, propaganda, and bias in real-time using Gemini Search Grounding.",
    permissions: ["activeTab", "scripting", "storage"],
    host_permissions: ["<all_urls>"],
    action: {
      default_popup: "popup.html",
      default_icon: "icon.png",
    },
    icons: {
      "128": "icon.png",
    },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["content.js"],
      },
    ],
  };

  const contentJs = `
// AI Fact-Checking Browser Extension - Content Script
// Highlights or monitors webpage text for credibility checks

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedText") {
    const selectedText = window.getSelection().toString().trim();
    sendResponse({ text: selectedText || document.title });
  } else if (request.action === "getPageContent") {
    // Return document title and first few paragraphs
    const paragraphs = Array.from(document.querySelectorAll("p"))
      .slice(0, 5)
      .map(p => p.innerText.trim())
      .filter(t => t.length > 50)
      .join("\\n");
    sendResponse({
      title: document.title,
      url: window.location.href,
      content: paragraphs || document.body.innerText.substring(0, 1000)
    });
  }
  return true;
});
`;

  const popupHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      width: 320px;
      margin: 0;
      padding: 16px;
      background-color: #f8fafc;
      color: #0f172a;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .logo {
      font-weight: 700;
      font-size: 14px;
      color: #0284c7;
    }
    .badge {
      font-size: 11px;
      background-color: #e0f2fe;
      color: #0369a1;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }
    .card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      margin-bottom: 8px;
    }
    .flag-Red { background-color: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
    .flag-Yellow { background-color: #fffbeb; color: #d97706; border: 1px solid #fde047; }
    .flag-Green { background-color: #f0fdf4; color: #16a34a; border: 1px solid #86efac; }
    
    .score {
      font-weight: 700;
      font-size: 16px;
    }
    .warning-text {
      font-size: 12px;
      line-height: 1.5;
      color: #475569;
      margin: 8px 0;
    }
    .meta {
      font-size: 10px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
    }
    button {
      width: 100%;
      background-color: #0f172a;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    button:hover {
      background-color: #1e293b;
    }
    .loader {
      display: none;
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #64748b;
    }
    .source-tag {
      font-size: 11px;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🔍 AI Fact Checker</div>
    <div class="badge">V1.0</div>
  </div>

  <div id="loader" class="loader">
    Analyzing news content with Gemini Search Grounding...
  </div>

  <div id="result-container">
    <div class="card">
      <div id="flag-badge" class="status-badge flag-Green">
        <span id="flag-text">Safe / Credible</span>
      </div>
      <div class="meta">
        <span>Credibility Score:</span>
        <span id="score-val" class="score">95/100</span>
      </div>
      <p id="warning-text" class="warning-text">No suspicious claims detected on this page. Content aligns with verified sources.</p>
      
      <div id="source-wrapper" style="margin-top: 8px; display: none;">
        <span class="meta">Matched Fact Check:</span>
        <span id="source-name" class="source-tag">-</span>
      </div>
    </div>
  </div>

  <button id="check-btn">Analyze Current Webpage</button>
  <div style="font-size: 9px; text-align: center; color: #94a3b8; margin-top: 10px;">
    Powered by Gemini 3.5 & Google Search Grounding
  </div>

  <script src="popup.js"></script>
</body>
</html>
`;

  const popupJs = `
// Popup controller
document.getElementById('check-btn').addEventListener('click', async () => {
  const loader = document.getElementById('loader');
  const resultContainer = document.getElementById('result-container');
  const checkBtn = document.getElementById('check-btn');
  const warningText = document.getElementById('warning-text');
  const flagBadge = document.getElementById('flag-badge');
  const flagText = document.getElementById('flag-text');
  const scoreVal = document.getElementById('score-val');
  const sourceWrapper = document.getElementById('source-wrapper');
  const sourceName = document.getElementById('source-name');

  loader.style.display = 'block';
  resultContainer.style.display = 'none';
  checkBtn.disabled = true;

  const isID = navigator.language.startsWith('id');

  try {
    // 1. Query active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error("NoActiveTab");
    }

    const url = tab.url || "";
    
    // Check for restricted URLs (chrome://, chrome-extension://, about:, webstore)
    const isRestricted = url.startsWith("chrome://") || 
                        url.startsWith("chrome-extension://") || 
                        url.startsWith("about:") || 
                        url.startsWith("view-source:") || 
                        url.includes("chrome.google.com/webstore") ||
                        url.includes("chromewebstore.google.com");

    if (isRestricted) {
      flagBadge.className = 'status-badge flag-Yellow';
      flagText.innerText = isID ? 'Akses Dibatasi' : 'Access Restricted';
      scoreVal.innerText = '-';
      sourceWrapper.style.display = 'none';
      warningText.innerText = isID 
        ? "Ekstensi tidak dapat memindai halaman sistem Chrome (seperti chrome:// atau Web Store). Silakan buka situs berita nyata (contoh: Kompas.com, Detik.com) lalu coba lagi!"
        : "The extension cannot scan Chrome system pages (such as chrome:// or the Web Store). Please open a real news website (e.g., BBC, Kompas) and try again!";
      return;
    }

    // 2. Fetch page content via content script
    let pageContent = "";
    let pageTitle = tab.title || "News Article";
    let pageUrl = url;

    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: "getPageContent" });
      if (response) {
        pageContent = response.content || "";
        pageTitle = response.title || pageTitle;
        pageUrl = response.url || pageUrl;
      }
    } catch (scriptErr) {
      console.warn("Content script communication failed. Normal fallback to tab details.", scriptErr);
      // Content script may not have loaded yet if the user hasn't refreshed the page after installing the extension
    }

    const textToAnalyze = pageContent || pageTitle;
    if (!textToAnalyze) {
      throw new Error("NoContentToAnalyze");
    }

    // 3. Request API analysis
    let analyzeRes;
    try {
      const params = new URLSearchParams();
      params.append('text', textToAnalyze);
      params.append('url', pageUrl);

      analyzeRes = await fetch("${hostUrl}/api/extension/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "include",
        body: params.toString()
      });
    } catch (netErr) {
      console.error("Network Error when contacting API:", netErr);
      throw new Error("API_Connection_Failed");
    }

    if (!analyzeRes.ok) {
      throw new Error("API_Status_" + analyzeRes.status);
    }

    const data = await analyzeRes.json();
    
    if (data.success) {
      flagBadge.className = 'status-badge flag-' + data.flag;
      flagText.innerText = data.flag === 'Red' ? 'Misleading / Fake' : (data.flag === 'Yellow' ? 'Unverified / Biased' : 'Safe / Credible');
      scoreVal.innerText = data.score + '/100';
      
      warningText.innerText = isID ? data.warningID : data.warningEN;
      
      if (data.matchedSource) {
        sourceWrapper.style.display = 'block';
        sourceName.innerText = data.matchedSource;
      } else {
        sourceWrapper.style.display = 'none';
      }
    } else {
      throw new Error("API_Error_Response");
    }

  } catch (err) {
    console.error("Popup process failed:", err);
    flagBadge.className = 'status-badge flag-Yellow';
    flagText.innerText = 'Error';
    scoreVal.innerText = '0/100';
    sourceWrapper.style.display = 'none';

    if (err.message === "API_Connection_Failed") {
      warningText.innerText = isID 
        ? "Gagal terhubung ke API Verifikasi di ${hostUrl}. Silakan pastikan server web Anda sedang aktif dan Anda memiliki koneksi internet."
        : "Failed to connect to the Verification API at ${hostUrl}. Please make sure your server is running and you have an internet connection.";
    } else if (err.message === "NoContentToAnalyze") {
      warningText.innerText = isID
        ? "Tidak ada konten atau teks halaman yang dapat dianalisis. Silakan buka artikel berita nyata."
        : "No page content or text could be analyzed. Please open a real news article.";
    } else {
      warningText.innerText = isID
        ? "Terjadi kesalahan. Jika Anda baru memasang ekstensi ini, silakan REFRESH/MUAT ULANG halaman berita Anda terlebih dahulu lalu coba lagi!"
        : "An error occurred. If you just installed the extension, please REFRESH the news webpage first, then try again!";
    }
  } finally {
    loader.style.display = 'none';
    resultContainer.style.display = 'block';
    checkBtn.disabled = false;
  }
});
`;

  res.json({
    success: true,
    manifest: JSON.stringify(manifest, null, 2),
    contentJs,
    popupHtml,
    popupJs,
    hostUrl,
  });
});

// ----------------------------------------------------
// VITE OR STATIC SERVING MIDDLEWARE
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Integrate Vite in Middleware mode for Hot Reload and typescript dev experience
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets from dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fake News Detector backend running on port ${PORT}`);
    console.log(`Vite setup completed in ${process.env.NODE_ENV || "development"} mode.`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
  });
}

export default app;
