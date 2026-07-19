export interface Partner {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  rating: number;
  contacted: boolean;
  mairieId?: string | null;
  contactPhone?: string;
  contactDate?: string;
}

export interface TavilyAnalysisResult {
  commune_valide: boolean;
  format_officiel: boolean;
  coherence_regionale: boolean;
  sources_consultees: string[];
  anomalies_detectees: string[];
  score_authenticite: number;
  decision: 'AUTHENTIQUE' | 'SUSPECT' | 'INCERTAIN';
  motif: string;
}

export interface AiAnalysisResult {
  type_document: string;
  est_lisible: boolean;
  est_authentique: boolean | 'INCERTAIN';
  confiance: number;
  infos_extraites: {
    nom: string;
    prenoms: string;
    date_naissance: string;
    lieu_naissance: string;
    numero_document: string;
    date_expiration: string;
    nationalite: string;
  };
  anomalies: string[];
  action_recommandee: 'VALIDER' | 'REJETER' | 'VERIFIER_MANUELLEMENT';
  motif: string;
  doubleVerification?: {
    confirmation_analyse: 'CONFIRME' | 'INFIRME';
    infos_coherentes: boolean;
    divergences: string[];
    decision_finale: 'VALIDER' | 'REJETER' | 'VERIFIER_MANUELLEMENT';
    niveau_confiance: number;
    motif: string;
  } | null;
  tavilyVerification?: TavilyAnalysisResult | null;
  date_delivrance_detectee?: string | null;
  date_limite_calculee?: string | null;
}

export interface AiConfig {
  geminiKey: string;
  mistralKey: string;
  groqKey: string;
  tavilyKey?: string;
  promptPrincipal: string;
  promptAntiDoublon: string;
  promptDoubleVerification: string;
  promptFaq: string;
  promptNemotronSafety?: string;
  openRouterModel1?: string;
  openRouterModel2?: string;
  openRouterModel3?: string;
  openRouterModel4?: string;
  openRouterModelSafety?: string;
  faceAPIKeyEpoux?: string;
  faceAPISecretEpoux?: string;
  faceAPIKeyEpouse?: string;
  faceAPISecretEpouse?: string;
  rdvDelayDays?: number; // Nombre de jours avant le mariage pour le RDV obligatoire en mairie
  usePaddleOcr?: boolean;
  paddleOcrToken?: string;
  paddleOcrModel?: string;
  paddleOcrJobUrl?: string;
  useDeepFace?: boolean;
  deepFaceApiUrl?: string;
}

export interface DocumentInfo {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'uploading' | 'verified' | 'rejected';
  fileName?: string;
  category: 'spouses' | 'witnesses' | 'special';
  icon: string;
  rejectionReason?: string;
  docNumber?: string | null;
  aiAnalysis?: AiAnalysisResult | null;
  nombre_tentatives?: number;
}

export interface TimelineStep {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'active' | 'upcoming';
  actionLabel?: string;
  icon: string;
  details?: string;
}

export interface AlertNotification {
  id: string;
  text: string;
  time: string;
  type: 'info' | 'warning' | 'success';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface PartnerContact {
  id: string;
  dossierId: string;
  partnerId: string;
  phone: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface PaystackConfig {
  mode: 'test' | 'live';
  publicKey: string;
  secretKey: string;
  currency: string;
  amount: number;
  enableWave: boolean;
  enableOrange: boolean;
  enableMtn: boolean;
  enableMoov: boolean;
  enableCard: boolean;
  // Notifications parameters
  enableEmailNotifs?: boolean;
  enableWhatsappNotifs?: boolean;
  emailApiKey?: string;
  emailSender?: string;
  whatsappToken?: string;
  whatsappPhoneId?: string;
  whatsappServerUrl?: string;
}

export interface PaymentInfo {
  id: string;
  dossierId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  reference: string;
  method: string;
  date: string;
  mairieId: string;
}

export interface SentNotificationLog {
  id: string;
  dossierId: string;
  recipient: string;
  type: 'whatsapp' | 'email';
  content: string;
  date: string;
  status: 'sent' | 'pending' | 'failed';
}

export interface OppositionInfo {
  id: string;
  dossierId: string;
  opposerName: string;
  opposerRole: string;
  opposerPhone?: string;
  reason: string;
  details?: string;
  fileName?: string;
  status: 'pending' | 'validated' | 'dismissed';
  createdAt: string;
}
