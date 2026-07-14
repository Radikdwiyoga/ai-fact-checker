export type RatingType = 
  | "Trusted" 
  | "Mostly Credible" 
  | "Mixed" 
  | "Disputed" 
  | "Unverified" 
  | "Misleading" 
  | "False" 
  | "Satire";

export interface PropagandaTechnique {
  technique: string;
  explanation: string;
}

export interface BiasAnalysis {
  rating: string;
  explanation: string;
}

export interface FactCheckData {
  rating: RatingType;
  credibilityScore: number;
  summary: string;
  claimVerification: string;
  sourceCredibility: string;
  propagandaDetection: PropagandaTechnique[];
  biasAnalysis: BiasAnalysis;
  verdictID: string;
  verdictEN: string;
  suggestions: string[];
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface AnalysisResponse {
  success: boolean;
  data: FactCheckData;
  sources: GroundingSource[];
  queries: string[];
  error?: string;
}

export interface ExtensionFiles {
  success: boolean;
  manifest: string;
  contentJs: string;
  popupHtml: string;
  popupJs: string;
  hostUrl: string;
}
