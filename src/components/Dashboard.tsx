import React, { useState, useEffect } from 'react';
import { Calendar, Mail, FolderOpen, ChevronRight, Hourglass, Info, Bell, Send, CheckCircle2, Award, Sparkles, Edit3, Copy, Check, Clock, Building, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { AlertNotification, DocumentInfo, Partner } from '../types';
import { getPartners, getMairies, MairieInfo, deletePartnerContactInDb, getPaymentForDossier } from '../services/dbService';
import MarriageReceiptModal from './MarriageReceiptModal';

const getSimulatedQuote = (category: string, isCFA: boolean) => {
  const cleanCat = category.trim();
  switch (cleanCat) {
    case 'Photographes':
      return {
        title: "Forfait Prestige Photographie & Vidéo",
        details: "Couverture complète du jour J des préparatifs jusqu'à la pièce montée par deux photographes et un vidéaste. Galerie en ligne sécurisée avec téléchargement illimité et livraison d'un coffret en bois contenant un album d'art et 50 tirages papier de prestige.",
        price: isCFA ? "1 600 000 FCFA" : "2 500 €",
        includeText: "Option d'exception validée par la mairie"
      };
    case 'Décoration':
      return {
        title: "Scénographie Florale & Design d'Exception",
        details: "Décoration florale majestueuse personnalisée de la salle des mariages de la mairie et de votre lieu de réception. Arche de cérémonie fleurie en fleurs fraîches haut de gamme, centres de table artistiques, bouquet de la mariée et boutonnières coordonnés.",
        price: isCFA ? "2 750 000 FCFA" : "4 200 €",
        includeText: "Prêt pour intégration au protocole de cérémonie"
      };
    case 'Robes & Tenues':
      return {
        title: "Création Couture Sur-Mesure de Luxe",
        details: "Dessin original et confection sur-mesure d'une robe de mariée d'exception et d'un costume trois pièces. Comprend les tissus de soie et dentelle fine, les retouches illimitées et trois séances d'essayage privées dans nos salons parisiens avec service coupe de champagne.",
        price: isCFA ? "4 500 000 FCFA" : "6 800 €",
        includeText: "Tenues d'apparat enregistrées"
      };
    case 'Traiteurs':
      return {
        title: "Dîner Gastronomique & Pièce Montée Royale",
        details: "Cocktail d'accueil avec 8 pièces de canapés fins par personne, dîner servi à table à trois plats (Entrée, Plat signature de poisson noble ou viande d'exception, Dessert), pièce montée spectaculaire en cascade et sélection de crus prestigieux avec champagne d'honneur.",
        price: isCFA ? "7 800 000 FCFA (100 pers.)" : "12 000 €",
        includeText: "Devis traiteur premium approuvé"
      };
    case 'Salles de Réception':
      return {
        title: "Privatisation Exclusive de Domaine Historique",
        details: "Accès exclusif au château et à ses magnifiques jardins à la française pour vos séances photo et votre réception. Mobilier de style royal, éclairage architectural LED intérieur/extérieur, et mise à disposition d'une suite nuptiale pour votre nuit de noces.",
        price: isCFA ? "5 500 000 FCFA" : "8 500 €",
        includeText: "Réservation de domaine pré-validée"
      };
    case 'Location de Voitures':
      return {
        title: "Escorte Royale en Rolls-Royce Phantom",
        details: "Mise à disposition d'une Rolls-Royce de prestige avec chauffeur professionnel certifié en uniforme. Décoration florale en fleurs naturelles sur le capot, bouteille de champagne millésimé à bord, et itinéraire d'honneur personnalisé de la mairie à votre réception.",
        price: isCFA ? "700 000 FCFA" : "1 100 €",
        includeText: "Véhicule d'apparat réservé"
      };
    default:
      return {
        title: "Prestation d'Exception sur Mesure",
        details: "Service haut de gamme personnalisé adapté à vos choix et aux exigences de votre cérémonie de prestige en partenariat avec la mairie de célébration.",
        price: "Sur devis",
        includeText: "Proposition sur mesure en cours"
      };
  }
};

interface DashboardProps {
  notifications: AlertNotification[];
  setTab: (tab: string) => void;
  removeNotification: (id: string) => void;
  documents: DocumentInfo[];
  spouse1Name: string;
  spouse2Name: string;
  dossierId: string;
  onUpdateNames: (s1: string, s2: string) => void;
  selectedMairieName: string;
  dossierStatus: 'under_review' | 'approved' | 'rejected' | 'celebrated';
  weddingDate: string | null;
  appointmentDate?: string | null;
}

export default function Dashboard({ 
  notifications, 
  setTab, 
  removeNotification, 
  documents,
  spouse1Name,
  spouse2Name,
  dossierId,
  onUpdateNames,
  selectedMairieName,
  dossierStatus,
  weddingDate,
  appointmentDate
}: DashboardProps) {
  const [showAgentChat, setShowAgentChat] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ sender: string; text: string; time: string }[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [mairies, setMairies] = useState<MairieInfo[]>([]);
  const [hasPaid, setHasPaid] = useState<boolean>(false);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [dbPartners, dbMairies, dbPayment] = await Promise.all([
          getPartners(dossierId),
          getMairies(),
          dossierId ? getPaymentForDossier(dossierId) : Promise.resolve(null)
        ]);
        setPartners(dbPartners);
        setMairies(dbMairies);
        setHasPaid(dbPayment !== null);
      } catch (e) {
        console.error("Error loading partners/mairies in Dashboard", e);
      }
    }
    loadData();

    // Poll every 3 seconds for real-time updates when vendors are contacted
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [dossierId]);

  const isNamesEmpty = !spouse1Name?.trim() || !spouse2Name?.trim();

  useEffect(() => {
    const isDefaultWelcome = chatHistory.length === 0 || (
      chatHistory.length === 1 && 
      chatHistory[0].sender === 'agent' && 
      (chatHistory[0].text.includes("Bienvenue sur E-Mariage") || chatHistory[0].text.includes("Votre dossier de mariage a bien été initialisé"))
    );

    if (isDefaultWelcome) {
      if (isNamesEmpty) {
        setChatHistory([
          { 
            sender: 'agent', 
            text: "Bonjour ! Bienvenue sur E-Mariage. Je suis votre agent municipal d'État Civil. Pour commencer votre parcours de mariage, veuillez cliquer sur 'Créer mon dossier civil' ou vous rendre dans l'onglet 'Documents / Dossier' pour renseigner vos identités, puis choisissez votre mairie de célébration.", 
            time: 'En ligne' 
          }
        ]);
      } else {
        setChatHistory([
          { 
            sender: 'agent', 
            text: `Bonjour ${spouse1Name} & ${spouse2Name} ! Votre dossier de mariage a bien été initialisé. Vous pouvez maintenant téléverser vos pièces justificatives (actes de naissance, pièces d'identité, justificatifs de domicile) depuis l'onglet 'Documents / Dossier' pour que je puisse les examiner.`, 
            time: 'En ligne' 
          }
        ]);
      }
    }
  }, [spouse1Name, spouse2Name, isNamesEmpty]);

  // Name editing states
  const [isEditingNames, setIsEditingNames] = useState(false);
  const [editS1, setEditS1] = useState(spouse1Name);
  const [editS2, setEditS2] = useState(spouse2Name);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(dossierId.toUpperCase().replace('DOSSIER_', ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNames = (e: React.FormEvent) => {
    e.preventDefault();
    if (editS1.trim() && editS2.trim()) {
      onUpdateNames(editS1, editS2);
      setIsEditingNames(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    setChatHistory((prev) => [
      ...prev,
      { sender: 'user', text: typedMessage, time: 'À l\'instant' }
    ]);
    const responseText = typedMessage;
    setTypedMessage('');
    
    // Auto-reply simulating the real agent response in real-time
    setTimeout(() => {
      setChatHistory((prev) => [
        ...prev,
        { 
          sender: 'agent', 
          text: `Bien reçu. Je joins votre remarque "${responseText}" à votre pièce administrative N° ${dossierId.toUpperCase().replace('DOSSIER_', '')}. Bonne fin de journée de préparation !`, 
          time: 'À l\'instant' 
        }
      ]);
    }, 1500);
  };
  const handleCancelContact = async (id: string, name: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir annuler votre demande auprès de ${name} ?`)) {
      return;
    }
    await deletePartnerContactInDb(id, dossierId);
    // Reload partners
    const dbPartners = await getPartners(dossierId);
    setPartners(dbPartners);
  };
  // Compute stats on the fly based on current documents validation from Dossier
  const totalRequired = documents ? documents.filter(doc => doc.category === 'spouses' || doc.category === 'witnesses').length : 6;
  const completedRequired = documents ? documents.filter(
    doc => (doc.category === 'spouses' || doc.category === 'witnesses') && doc.status === 'verified'
  ).length : 0;
  const completionPercentage = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

  // Format wedding date to French readable format
  const formatDateFrench = (dateStr: string | null) => {
    if (!dateStr) return "Non programmée";
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[2], 10);
        const monthNum = parseInt(parts[1], 10);
        const year = parts[0];
        const months = [
          "janvier", "février", "mars", "avril", "mai", "juin",
          "juillet", "août", "septembre", "octobre", "novembre", "décembre"
        ];
        const monthName = months[monthNum - 1] || parts[1];
        return `${day} ${monthName} ${year}`;
      }
      const dateObj = new Date(dateStr);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    } catch (e) {
      // ignore
    }
    return dateStr;
  };

  // Determine dynamic title and description for the main status card
  let statusTitle = "Dossier non initialisé";
  let statusDesc = "Veuillez renseigner le nom des futurs époux en cliquant sur le bouton ci-dessus pour commencer la constitution de votre dossier.";

  if (!isNamesEmpty) {
    if (dossierStatus === 'celebrated') {
      statusTitle = "Mariage Célébré";
      statusDesc = "Félicitations ! Votre mariage a été célébré et enregistré avec succès dans le registre national de l’État Civil.";
    } else if (dossierStatus === 'approved') {
      statusTitle = "Dossier approuvé";
      statusDesc = "Votre dossier civil a été validé et approuvé par l’officier d’État Civil. Toutes les pièces sont conformes.";
    } else if (dossierStatus === 'rejected') {
      statusTitle = "Dossier rejeté / À corriger";
      statusDesc = "Certaines pièces de votre dossier ont été rejetées par l’officier d’État Civil. Veuillez vérifier vos documents ou contacter l'officier.";
    } else {
      if (completionPercentage === 100) {
        statusTitle = "Dossier complet et soumis";
        statusDesc = "Félicitations ! Toutes vos pièces administratives requises sont validées par l’État Civil. Votre dossier est complet et en attente de la signature finale de l'officier.";
      } else {
        statusTitle = "Dossier en cours de constitution";
        statusDesc = "Votre dossier est en cours de constitution. Veuillez téléverser l'intégralité des pièces requises pour vos futurs époux ainsi que pour vos témoins afin de soumettre le dossier à l’État Civil pour révision.";
      }
    }
  }

  // Determine dynamic stats values
  let celebrationStatusText = "En attente";
  let celebrationColorClass = "text-amber-700";
  let celebrationBgClass = "bg-amber-50 text-amber-700";

  if (isNamesEmpty) {
    celebrationStatusText = "Non lancé";
    celebrationColorClass = "text-slate-500";
    celebrationBgClass = "bg-slate-50 text-slate-500";
  } else if (dossierStatus === 'celebrated') {
    celebrationStatusText = "Célébré";
    celebrationColorClass = "text-emerald-700";
    celebrationBgClass = "bg-emerald-50 text-emerald-700";
  } else if (dossierStatus === 'approved') {
    celebrationStatusText = "Approuvé";
    celebrationColorClass = "text-emerald-700";
    celebrationBgClass = "bg-emerald-50 text-emerald-700";
  } else if (dossierStatus === 'rejected') {
    celebrationStatusText = "Rejeté";
    celebrationColorClass = "text-red-700";
    celebrationBgClass = "bg-red-50 text-red-700";
  } else if (completionPercentage === 100) {
    celebrationStatusText = "Prêt";
    celebrationColorClass = "text-emerald-700";
    celebrationBgClass = "bg-emerald-50 text-emerald-700";
  }

  let weddingDateText = "Non programmée";
  if (weddingDate) {
    const formatted = formatDateFrench(weddingDate);
    if (dossierStatus === 'celebrated') {
      weddingDateText = `Célébrée (${formatted})`;
    } else if (dossierStatus === 'approved') {
      weddingDateText = `Confirmée (${formatted})`;
    } else {
      weddingDateText = `Provisoire (${formatted})`;
    }
  }

  // Filter alerts/notifications if the dossier has not launched yet
  const displayNotifications = isNamesEmpty ? [] : notifications;

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in text-left">
      {/* Header section with Premium Metadata */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <span className="font-sans text-[10px] font-bold text-accent uppercase tracking-widest block mb-1">
            Espace Conjoints Privé
          </span>
          <h2 className="font-serif text-3xl md:text-5xl text-slate-900 font-bold mb-2">
            Mon E-Mariage
          </h2>
          <div className="flex flex-wrap items-center gap-2.5 mt-1 font-sans text-xs">
            <span className="text-slate-500 font-medium">Portail de suivi officiel d'état civil.</span>
            {!isNamesEmpty && dossierId && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-accent/40" />
                <div className="flex items-center gap-2 bg-accent/5 border border-accent/25 rounded-lg px-2.5 py-0.5 text-accent font-bold shadow-sm">
                  <span className="tracking-wide">DOSSIER : {dossierId.toUpperCase().replace('DOSSIER_', '')}</span>
                  <button 
                    onClick={handleCopyCode} 
                    className="cursor-pointer text-slate-400 hover:text-accent transition-colors"
                    title="Copier le code"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Edit Names Trigger */}
        {!isEditingNames ? (
          <button
            onClick={() => {
              if (isNamesEmpty) {
                setTab('dossier');
              } else {
                setEditS1(spouse1Name);
                setEditS2(spouse2Name);
                setIsEditingNames(true);
              }
            }}
            className="flex items-center gap-1.5 text-primary hover:bg-primary/5 text-xs font-bold font-sans bg-white border border-primary/20 hover:border-primary px-4 py-2.5 rounded-xl cursor-pointer shadow-sm transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isNamesEmpty ? "Créer mon dossier civil" : `Modifier l'identité des époux`}
          </button>
        ) : (
          <form onSubmit={handleSaveNames} className="flex flex-wrap items-center gap-2.5 font-sans text-xs bg-white p-3 border border-accent/35 rounded-xl shadow-sm animate-reveal-up">
            <input 
              type="text" 
              value={editS1} 
              onChange={(e) => setEditS1(e.target.value)} 
              placeholder="Époux (Homme)"
              className="border border-neutral-300 rounded-lg px-3 py-2 bg-neutral-50/50 w-40 focus:outline-none focus:border-primary text-xs"
              required
            />
            <span className="font-bold text-slate-400">&amp;</span>
            <input 
              type="text" 
              value={editS2} 
              onChange={(e) => setEditS2(e.target.value)} 
              placeholder="Épouse (Femme)"
              className="border border-neutral-300 rounded-lg px-3 py-2 bg-neutral-50/50 w-40 focus:outline-none focus:border-primary text-xs"
              required
            />
            <button 
              type="submit" 
              className="bg-primary hover:bg-primary-container text-white px-3.5 py-2 rounded-lg font-bold cursor-pointer transition-colors"
            >
              Enregistrer
            </button>
            <button 
              type="button" 
              onClick={() => setIsEditingNames(false)} 
              className="border border-neutral-300 px-3.5 py-2 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
            >
              Annuler
            </button>
          </form>
        )}
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
        
        {/* Left Column Wrapper (8/12 of bento grid on desktop) */}
        <div className="lg:col-span-8 flex flex-col gap-8 w-full">
          
          {/* Main Status Card */}
          <div className="glass-premium rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-lg border border-accent/25 transition-all w-full">
            {/* Decorative premium progression top-bar */}
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary via-accent to-accent-light" />
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center mb-6">
              
              {/* Left Column: Status & Details */}
              <div className="md:col-span-8 flex flex-col gap-4">
                <div>
                  <span className="font-sans text-[10px] font-bold text-accent uppercase tracking-widest mb-1.5 block">
                    Statut Actuel de l'Union
                  </span>
                  <h3 className="font-serif text-2xl md:text-3xl text-slate-900 font-bold leading-tight">
                    {statusTitle}
                  </h3>
                  <p className="font-sans text-xs text-primary font-bold mt-1 tracking-wide uppercase">
                    🏛️ {selectedMairieName || 'Mairie non sélectionnée'}
                  </p>
                </div>

                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="font-sans text-xs md:text-sm text-slate-700 leading-relaxed">
                    {statusDesc}
                  </p>
                </div>
                {hasPaid && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setShowReceipt(true)}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-750 text-white rounded-lg text-xs font-bold cursor-pointer shadow flex items-center gap-1.5 transition-all border border-amber-600/20"
                    >
                      <FileText className="w-4 h-4 text-white" />
                      Télécharger ma Quittance (QR Code)
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Dynamic Rings Donut Graph */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-5 bg-white/50 rounded-2xl border border-accent/20 relative shadow-sm">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  
                  {/* SVG Donut */}
                  <svg width="112" height="112" viewBox="0 0 112 112" className="transform -rotate-90">
                    <defs>
                      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#dfc08a" />
                        <stop offset="100%" stopColor="#b20052" />
                      </linearGradient>
                    </defs>
                    {/* Track Circle */}
                    <circle
                      cx="56"
                      cy="56"
                      r="42"
                      fill="transparent"
                      stroke="#f1ebe4"
                      strokeWidth="7"
                    />
                    {/* Active Progress Rings */}
                    <motion.circle
                      cx="56"
                      cy="56"
                      r="42"
                      fill="transparent"
                      stroke="url(#goldGradient)"
                      strokeWidth="8"
                      strokeDasharray="263.89"
                      initial={{ strokeDashoffset: 263.89 }}
                      animate={{ strokeDashoffset: 263.89 - (completionPercentage / 100) * 263.89 }}
                      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Internal text metrics */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                    <span className="font-serif text-2xl font-bold text-slate-900 leading-none">
                      {completionPercentage}%
                    </span>
                    <span className="font-sans text-[8px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                      Conformité
                    </span>
                  </div>
                </div>

                {/* Caption details */}
                <div className="mt-3.5 text-center">
                  <span className="font-sans text-[11px] font-bold text-slate-800 block">
                    Dossier Administratif
                  </span>
                  <span className="font-sans text-[10px] text-slate-500 font-medium block mt-0.5">
                    {completedRequired} de {totalRequired} pièces validées
                  </span>
                </div>
              </div>

            </div>

            {/* Completion stats widget */}
            <div className="mt-8 border-t border-neutral-100 pt-6">
              <h4 className="font-serif text-xs font-bold uppercase tracking-widest text-slate-655 mb-4">Statistiques Globales</h4>
              <div className={`grid grid-cols-1 gap-3 ${appointmentDate ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
                <div 
                  onClick={() => setTab('dossier')}
                  className="bg-white/60 p-3.5 rounded-xl border border-neutral-200/60 flex items-center justify-between hover:border-primary/40 hover:bg-white transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider block">Pièces Jointes</span>
                    <span className="font-serif font-bold text-lg text-primary">{completedRequired} / {totalRequired}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-200">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="bg-white/60 p-3.5 rounded-xl border border-neutral-200/60 flex items-center justify-between shadow-sm">
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider block">Célébration</span>
                    <span className={`font-serif font-bold text-base ${celebrationColorClass}`}>
                      {celebrationStatusText}
                    </span>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${celebrationBgClass}`}>
                    <Award className="w-4 h-4" />
                  </div>
                </div>

                <div className="bg-white/60 p-3.5 rounded-xl border border-neutral-200/60 flex items-center justify-between shadow-sm">
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider block">Date d'Honneur</span>
                    <span className="font-sans font-bold text-[11px] text-slate-800 mt-1">
                      {weddingDateText}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-neutral-50 border border-neutral-200/60 flex items-center justify-center text-slate-500">
                    <Calendar className="w-4 h-4 text-accent" />
                  </div>
                </div>

                {appointmentDate && (
                  <div className="bg-white/60 p-3.5 rounded-xl border border-accent/30 flex items-center justify-between shadow-sm animate-fade-in">
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-primary text-[9px] font-bold uppercase tracking-wider block flex items-center gap-1">
                        <Clock className="w-3 h-3 text-primary shrink-0" /> RDV Mairie
                      </span>
                      <span className="font-sans font-bold text-[11px] text-slate-800 mt-1">
                        {appointmentDate}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-rose-50 border border-accent/20 flex items-center justify-center text-primary">
                      <Building className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prestataires d'Exception Section */}
          {(() => {
              const contactedPartners = partners.filter(p => p.contacted);
              const isCFA = selectedMairieName && selectedMairieName.toLowerCase().includes('cocody');
              return (
                <div className="glass-premium rounded-2xl border border-accent/25 p-6 md:p-8 shadow-lg transition-all w-full text-left">
                  <div className="flex items-center gap-2.5 mb-6 border-b border-neutral-100 pb-4 select-none">
                    <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                    <h3 className="font-serif text-xl font-bold text-slate-900">
                      Suivi de mes Prestataires d'Exception
                    </h3>
                  </div>

                  {contactedPartners.length === 0 ? (
                    <div className="text-center py-10 bg-white/40 rounded-xl border border-dashed border-accent/30 p-6 flex flex-col items-center justify-center shadow-sm">
                      <p className="font-sans text-slate-500 text-xs md:text-sm mb-4">
                        Vous n'avez pas encore pris contact avec un prestataire pour votre cérémonie.
                      </p>
                      <button 
                        onClick={() => setTab('partners')}
                        className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md cursor-pointer transition-all inline-flex items-center gap-1.5 border border-primary/20"
                      >
                        <Award className="w-4 h-4 text-accent" />
                        Découvrir les prestataires
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {contactedPartners.map((partner) => {
                        const partnerMairie = mairies.find(m => m.id === partner.mairieId);
                        const mairieName = partnerMairie ? partnerMairie.name : 'Toutes les mairies';
                        const isApproved = dossierStatus === 'approved' || dossierStatus === 'celebrated';
                        const quote = getSimulatedQuote(partner.category, isCFA);

                        return (
                          <div key={partner.id} className="border border-accent/20 rounded-xl p-5 bg-white/50 space-y-5 hover:border-primary/20 transition-all shadow-sm">
                            {/* Partner Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                              <div className="flex items-center gap-4 flex-grow">
                                <img 
                                  src={partner.imageUrl} 
                                  alt={partner.name} 
                                  className="w-14 h-14 rounded-xl object-cover border border-accent/20 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex-grow">
                                  <div className="flex justify-between items-start w-full gap-2">
                                    <h4 className="font-serif text-base font-bold text-slate-800">
                                      {partner.name}
                                    </h4>
                                    <button
                                      onClick={() => handleCancelContact(partner.id, partner.name)}
                                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-[10px] font-bold border border-rose-250 px-2 py-1 rounded-lg cursor-pointer transition-all shrink-0"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-1 select-none">
                                    <span className="text-[9px] font-sans font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                                      {partner.category}
                                    </span>
                                    <span className="flex items-center gap-1 text-[9px] font-sans font-bold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                                      <Building className="w-3 h-3 text-accent" />
                                      {mairieName}
                                    </span>
                                  </div>
                                  {partner.contactPhone && partner.contactDate && (
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-[10px] font-sans text-slate-500 font-medium select-none">
                                      <span className="bg-neutral-50 border border-neutral-200/50 px-2 py-0.5 rounded text-[9px]">
                                        Tél : <strong className="text-slate-700 font-bold">{partner.contactPhone}</strong>
                                      </span>
                                      <span className="bg-neutral-50 border border-neutral-200/50 px-2 py-0.5 rounded text-[9px]">
                                        Date d'effet : <strong className="text-slate-700 font-bold">{formatDateFrench(partner.contactDate)}</strong>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Contact Process Steps */}
                            <div className="pt-2 border-t border-neutral-100">
                              <span className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-4">
                                Étape du protocole
                              </span>
                              <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-2">
                                
                                {/* Connector Line (desktop) */}
                                <div className="hidden md:block absolute top-4 left-6 right-6 h-0.5 bg-neutral-200 z-0" />
                                <div className={`hidden md:block absolute top-4 left-6 h-0.5 z-0 bg-emerald-500 transition-all duration-500 ${
                                  isApproved ? 'w-[calc(100%-48px)]' : 'w-1/2'
                                }`} />

                                {/* Step 1: Demande Envoyée */}
                                <div className="flex md:flex-col items-center md:items-center gap-3 md:gap-2 z-10 w-full md:w-1/3 text-left md:text-center">
                                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center border-4 border-white shadow-sm shrink-0">
                                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                                  </div>
                                  <div className="md:mt-1">
                                    <span className="font-sans text-[11px] font-bold text-slate-800 block">
                                      1. Transmis
                                    </span>
                                    <span className="font-sans text-[9px] text-slate-500 block leading-normal">
                                      Dossier envoyé au prestataire.
                                    </span>
                                  </div>
                                </div>

                                {/* Step 2: Instruction Mairie */}
                                <div className="flex md:flex-col items-center md:items-center gap-3 md:gap-2 z-10 w-full md:w-1/3 text-left md:text-center">
                                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center border-4 border-white shadow-sm shrink-0">
                                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                                  </div>
                                  <div className="md:mt-1">
                                    <span className="font-sans text-[11px] font-bold text-slate-800 block">
                                      2. Accord Civil
                                    </span>
                                    <span className="font-sans text-[9px] text-slate-500 block leading-normal">
                                      Raccordement officiel validé.
                                    </span>
                                  </div>
                                </div>

                                {/* Step 3: Devis Reçu */}
                                <div className="flex md:flex-col items-center md:items-center gap-3 md:gap-2 z-10 w-full md:w-1/3 text-left md:text-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm shrink-0 ${
                                    isApproved ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white animate-pulse'
                                  }`}>
                                    {isApproved ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <Clock className="w-3.5 h-3.5 stroke-[2.5px]" />}
                                  </div>
                                  <div className="md:mt-1">
                                    <span className="font-sans text-[11px] font-bold text-slate-800 block">
                                      3. Devis Spécial
                                    </span>
                                    <span className="font-sans text-[9px] text-slate-500 block leading-normal">
                                      {isApproved ? "Proposition d'exception prête." : "En attente d'approbation."}
                                    </span>
                                  </div>
                                </div>

                              </div>
                            </div>

                            {/* Devis Section */}
                            {isApproved && (
                              <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm relative overflow-hidden mt-3 animate-reveal-up">
                                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[8px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-bl-lg select-none">
                                  Contrat Mairie
                                </div>
                                <div className="flex items-start gap-3">
                                  <FileText className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                  <div className="space-y-1 text-left w-full">
                                    <h5 className="font-serif text-sm font-bold text-slate-855">
                                      {quote.title}
                                    </h5>
                                    <p className="font-sans text-[11px] text-slate-500 leading-relaxed">
                                      {quote.details}
                                    </p>
                                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 mt-2">
                                      <div className="flex items-center gap-1.5 text-xs">
                                        <span className="text-slate-500">Montant convenu :</span>
                                        <span className="font-serif font-bold text-emerald-700 text-xs md:text-sm">
                                          {quote.price}
                                        </span>
                                      </div>
                                      <span className="text-[9px] font-sans font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                        {quote.includeText}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
          })()}
        </div>

        {/* Sidebar Column (4/12 on desktop) */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          
          {/* Quick links card */}
          <div className="bg-white rounded-2xl border border-accent/25 p-6 shadow-md shadow-slate-100/50">
            <h4 className="font-serif text-base font-bold text-slate-900 mb-4 select-none">
              Services Administratifs
            </h4>
            <ul className="flex flex-col gap-2">
              <li>
                <button 
                  onClick={() => setTab('timeline')}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-all group cursor-pointer text-left border border-transparent hover:border-accent/20"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                    <span className="font-sans text-xs font-semibold text-slate-700 group-hover:text-slate-900">Consulter mon agenda</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setShowAgentChat(true)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-all group cursor-pointer text-left border border-transparent hover:border-accent/20"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                    <span className="font-sans text-xs font-semibold text-slate-700 group-hover:text-slate-900">Contacter l'officier civil</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </li>
              <li>
                {isNamesEmpty ? (
                  <div className="w-full flex items-center justify-between p-3 rounded-xl opacity-50 cursor-not-allowed select-none text-left bg-slate-50/50 border border-transparent">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-4 h-4 text-slate-400" />
                      <span className="font-sans text-xs font-semibold text-slate-500">Mon dossier civil (Verrouillé)</span>
                    </div>
                    <span className="text-[9px] font-sans font-bold bg-neutral-100 text-slate-500 px-1.5 py-0.5 rounded-md border border-neutral-200">
                      Noms requis
                    </span>
                  </div>
                ) : (
                  <button 
                    onClick={() => setTab('dossier')}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-all group cursor-pointer text-left border border-transparent hover:border-accent/20"
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                      <span className="font-sans text-xs font-semibold text-slate-700 group-hover:text-slate-900">Déposer mes documents</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </li>
            </ul>
          </div>

          {/* Notifications Centre */}
          <div className="bg-white rounded-2xl border border-accent/25 p-6 shadow-md shadow-slate-100/50 flex-grow">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-2">
              <h4 className="font-serif text-base font-bold text-slate-900 select-none">
                Notifications Civiles
              </h4>
              <Bell className="w-4 h-4 text-slate-400" />
            </div>

            {displayNotifications.length === 0 ? (
              <p className="font-sans text-xs text-slate-400 italic py-4">
                Pas de nouvelles notifications.
              </p>
            ) : (
              <div className="relative pl-4 border-l-2 border-accent/20 space-y-5 text-left">
                {displayNotifications.map((notif) => {
                  const colorClass = 
                    notif.type === 'warning' ? 'bg-amber-500' :
                    notif.type === 'success' ? 'bg-emerald-500' : 'bg-primary';

                  return (
                    <div key={notif.id} className="relative group/item">
                      <span 
                        className={`absolute -left-[21px] top-1.5 w-2 h-2 rounded-full ${colorClass} ring-4 ring-white`} 
                      />
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-sans text-[11px] font-medium text-slate-800 leading-normal">
                          {notif.text}
                        </p>
                        <button 
                          onClick={() => removeNotification(notif.id)}
                          className="text-[9px] font-bold text-red-650 hover:bg-red-50 rounded px-1.5 py-0.5 shrink-0 cursor-pointer transition-all border border-red-200/30"
                        >
                          Effacer
                        </button>
                      </div>
                      <p className="font-sans text-[9px] text-slate-400 mt-1 font-semibold">
                        {notif.time}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Agent Admin Chat Dialog */}
      {showAgentChat && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 backdrop-blur-md px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 border border-accent/30 shadow-2xl relative animate-scale-up flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Conciergerie Administrative
                </h3>
                <p className="font-sans text-[11px] text-slate-500 mt-0.5">
                  Service État Civil • Mairie de célébration
                </p>
              </div>
              <button 
                onClick={() => setShowAgentChat(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-slate-400 hover:text-slate-655 transition-colors cursor-pointer text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Chat message logs */}
            <div className="flex-grow overflow-y-auto space-y-4 pr-2 hide-scrollbar min-h-[250px] max-h-[360px]">
              {chatHistory.map((item, idx) => {
                const isAgent = item.sender === 'agent';
                return (
                  <div key={idx} className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}>
                    <div className={`p-3.5 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                      isAgent 
                        ? 'bg-neutral-50 text-slate-700 border border-neutral-200/50 rounded-tl-none' 
                        : 'bg-primary text-white rounded-tr-none'
                    }`}>
                      {item.text}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1 font-semibold">{item.time}</span>
                  </div>
                );
              })}
            </div>

            {/* Chat entry form */}
            <form onSubmit={handleSendMessage} className="border-t border-neutral-100 pt-4 mt-4 flex gap-2">
              <input 
                type="text" 
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder="Rédigez votre demande d'assistance à l'officier..."
                className="flex-grow border border-neutral-300 rounded-xl px-3.5 py-3 text-xs bg-neutral-50/50 focus:border-primary focus:outline-none"
              />
              <button 
                type="submit"
                className="bg-primary hover:bg-primary-container text-white rounded-xl p-3 flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-all border border-primary/20"
              >
                <Send className="w-4 h-4 text-accent" />
              </button>
            </form>
          </div>
        </div>
      )}
      <MarriageReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        dossierId={dossierId}
        spouse1Name={spouse1Name}
        spouse2Name={spouse2Name}
        weddingDate={weddingDate}
        selectedMairieName={selectedMairieName}
      />
    </div>
  );
}
