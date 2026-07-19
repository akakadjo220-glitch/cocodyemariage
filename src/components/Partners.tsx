import React, { useState, useEffect } from 'react';
import { Star, Mail, Search, Check, ThumbsUp, HeartHandshake, Phone, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Partner } from '../types';
import { getPartners, contactPartnerInDb, deletePartnerContactInDb, getMairies, MairieInfo } from '../services/dbService';
import { ensurePhonePrefix, handlePhoneChange } from './Landing';

interface PartnersProps {
  initialPartners: Partner[];
  addNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
  selectedMairieId: string | null;
  selectedMairieName: string;
  dossierId: string;
  weddingDate: string | null;
  spouse1Phone?: string;
  spouse2Phone?: string;
}

export default function Partners({
  initialPartners,
  addNotification,
  selectedMairieId,
  selectedMairieName,
  dossierId,
  weddingDate,
  spouse1Phone,
  spouse2Phone
}: PartnersProps) {
  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [mairies, setMairies] = useState<MairieInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactModal, setShowContactModal] = useState<Partner | null>(null);
  const [contactPhone, setContactPhone] = useState('+225 ');
  const [contactDate, setContactDate] = useState('');

  useEffect(() => {
    if (showContactModal) {
      setContactPhone(spouse1Phone || spouse2Phone ? ensurePhonePrefix(spouse1Phone || spouse2Phone) : '+225 ');
      setContactDate(weddingDate || '');
    }
  }, [showContactModal, weddingDate, spouse1Phone, spouse2Phone]);

  useEffect(() => {
    async function loadPartnersAndMairies() {
      const [dbPartners, dbMairies] = await Promise.all([
        getPartners(dossierId),
        getMairies()
      ]);
      setPartners(dbPartners);
      setMairies(dbMairies);
    }
    loadPartnersAndMairies();
  }, [dossierId]);

  const categories = [
    'Tous',
    'Photographes',
    'Décoration',
    'Robes & Tenues',
    'Traiteurs',
    'Salles de Réception',
    'Location de Voitures'
  ];

  // Helper to format date in French
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

  // Contact vendor action
  const handleContactVendor = async (id: string, name: string, phone: string, date: string) => {
    if (!dossierId) {
      addNotification("Veuillez d'abord initialiser votre dossier de mariage civil.", 'warning');
      return;
    }
    // Optimistic UI update
    setPartners(prev => prev.map(p => p.id === id ? { ...p, contacted: true, contactPhone: phone, contactDate: date } : p));
    addNotification(`Demande de devis d'exception envoyée au prestataire : ${name} !`, 'success');
    setShowContactModal(null);

    // Sync with database
    await contactPartnerInDb(id, phone, date, dossierId);
  };

  const handleCancelContact = async (id: string, name: string) => {
    if (!dossierId) {
      addNotification("Veuillez d'abord initialiser votre dossier de mariage civil.", 'warning');
      return;
    }
    if (!window.confirm(`Êtes-vous sûr de vouloir annuler votre demande de devis auprès de ${name} ?`)) {
      return;
    }

    // Optimistic UI update
    setPartners(prev => prev.map(p => p.id === id ? { ...p, contacted: false, contactPhone: undefined, contactDate: undefined } : p));
    addNotification(`Demande de devis annulée pour le prestataire : ${name}`, 'info');

    // Sync with database
    await deletePartnerContactInDb(id, dossierId);
  };

  // Filter logic: Filter by category, search query, and mairie association
  const filteredPartners = partners.filter(p => {
    if (p.mairieId && p.mairieId !== selectedMairieId) {
      return false;
    }
    const matchesCategory = selectedCategory === 'Tous' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in text-left">

      {/* Hero Section */}
      <motion.section
        className="text-center max-w-3xl mx-auto py-6 select-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="font-sans text-[10px] font-bold text-accent uppercase tracking-widest block mb-1">
          Une Sélection d'Honneur
        </span>
        <h2 className="font-serif text-3xl md:text-5xl text-slate-900 font-bold mb-4 tracking-tight leading-tight">
          Nos Partenaires <span className="text-rose-gradient italic font-semibold">d'Exception</span>
        </h2>
        <p className="font-sans text-xs md:text-sm text-slate-500 leading-relaxed max-w-2xl mx-auto font-medium">
          Découvrez notre sélection rigoureuse de professionnels de renom de l'événementiel de luxe, triés sur le volet pour leur excellence afin de sublimer votre cérémonie d'union.
        </p>
      </motion.section>

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 w-full items-center justify-between border-b border-accent/20 pb-6 sticky top-16 z-30 bg-[#fdfbf7]/90 backdrop-blur-md pt-2">
        {/* Categories Scroller */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 px-1 snap-x w-full lg:max-w-[70%] text-left select-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`snap-start shrink-0 relative px-5 py-2.5 rounded-full font-sans text-xs font-bold transition-all cursor-pointer ${isActive
                    ? 'text-white'
                    : 'bg-white/60 border border-accent/20 text-slate-500 hover:text-primary hover:border-primary/50'
                  }`}
              >
                <span className="relative z-10">{cat}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryBg"
                    className="absolute inset-0 bg-primary rounded-full shadow-md shadow-primary/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Input query search */}
        <div className="relative w-full lg:max-w-[28%] shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un prestataire..."
            className="w-full border border-accent/30 rounded-full pl-10 pr-4 py-3 text-xs bg-white/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/25 font-sans font-medium"
          />
        </div>
      </div>

      {/* Grid rendering partners cards */}
      {filteredPartners.length === 0 ? (
        <motion.div
          className="text-center py-16 bg-white/40 rounded-2xl border border-accent/20 p-8 shadow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="font-sans text-slate-500 text-xs font-semibold">
            Aucun prestataire haut de gamme ne correspond à vos filtres actuels.
          </p>
          <button
            onClick={() => { setSelectedCategory('Tous'); setSearchQuery(''); }}
            className="mt-4 text-primary text-xs font-bold underline hover:text-primary-container font-sans cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </motion.div>
      ) : (
        <motion.section
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredPartners.map((vendor) => (
              <motion.article
                key={vendor.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="glass-premium rounded-2xl overflow-hidden group flex flex-col justify-between border border-accent/20 shadow-sm"
              >
                {/* Image and rating badge */}
                <div className="h-56 w-full relative overflow-hidden bg-neutral-100 shrink-0">
                  <img
                    src={vendor.imageUrl}
                    alt={vendor.name}
                    className="w-full h-full object-cover group-hover:scale-105 duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 border border-accent/20 text-[10px] font-bold shadow-sm">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-slate-800 font-sans">{vendor.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 flex-grow flex flex-col justify-between gap-5 text-left">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2 select-none">
                      <span className="text-slate-400 font-sans text-[9px] font-bold uppercase tracking-widest block">
                        {vendor.category.endsWith('s') ? vendor.category.slice(0, -1) : vendor.category}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      {(() => {
                        const assignedMairie = mairies.find(m => m.id === vendor.mairieId);
                        return (
                          <span className={`text-[9px] font-sans font-bold px-2 py-0.5 rounded ${assignedMairie
                              ? 'bg-primary/10 text-primary'
                              : 'bg-slate-100 text-slate-500'
                            }`}>
                            {assignedMairie ? assignedMairie.name : 'Toutes les mairies'}
                          </span>
                        );
                      })()}
                    </div>
                    <h3 className="font-serif text-lg md:text-xl font-bold text-slate-800 leading-snug">
                      {vendor.name}
                    </h3>
                    <p className="font-sans text-xs text-slate-500 leading-relaxed mt-2.5 font-medium">
                      {vendor.description}
                    </p>
                  </div>

                  {/* Footer and contact button */}
                  <div className="mt-2 pt-4 border-t border-neutral-100 flex flex-col w-full gap-2">
                    {vendor.contacted ? (
                      <div className="flex flex-col gap-2">
                        <span className="w-full py-3 px-4 rounded-xl border border-accent/30 text-primary bg-rose-50/50 text-xs font-bold flex items-center justify-center gap-1.5 select-none shadow-inner-sm">
                          <Check className="w-4 h-4 text-primary" />
                          <span>Contacté • Devis demandé</span>
                        </span>
                        <button
                          onClick={() => handleCancelContact(vendor.id, vendor.name)}
                          className="w-full py-2 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer font-sans"
                        >
                          Annuler la demande de devis
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (!dossierId) {
                            addNotification("Veuillez d'abord initialiser votre dossier de mariage civil pour pouvoir contacter ce prestataire.", 'warning');
                          } else {
                            setShowContactModal(vendor);
                          }
                        }}
                        className="w-full py-3 px-4 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-inner"
                      >
                        <Mail className="w-4 h-4 text-accent" />
                        <span>Contacter la Maison</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.section>
      )}

      {/* Contact Modal (Wow effect) */}
      <AnimatePresence>
        {showContactModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/50 backdrop-blur-md px-4 text-left font-sans">
            <motion.div
              className="bg-white rounded-2xl w-full max-w-md p-6 border border-neutral-200 shadow-2xl relative my-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <button
                onClick={() => setShowContactModal(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-slate-400 hover:text-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-serif text-xl font-bold text-slate-900 border-b border-neutral-100 pb-3 mb-4 flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-primary animate-pulse" />
                Demande de devis d'exception
              </h3>

              <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
                Saisissez vos coordonnées de contact pour que <strong>{showContactModal.name}</strong> prenne connaissance de votre projet d'union (<strong>Dossier N° {dossierId?.replace('DOSSIER_', '').toUpperCase()}</strong>).
              </p>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (!contactPhone.trim()) {
                  alert("Veuillez saisir votre numéro de téléphone.");
                  return;
                }
                if (!contactDate.trim()) {
                  alert("Veuillez choisir la date de la prestation.");
                  return;
                }
                handleContactVendor(showContactModal.id, showContactModal.name, contactPhone, contactDate);
              }} className="space-y-4">

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase tracking-wider block">
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => handlePhoneChange(e.target.value, setContactPhone)}
                    placeholder="Ex: +225 07 00 00 00 00"
                    className="w-full border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase tracking-wider block">
                    Date de prestation souhaitée
                  </label>
                  <input
                    type="date"
                    required
                    value={contactDate}
                    onChange={(e) => setContactDate(e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="bg-slate-50/50 p-4 rounded-2xl border border-accent/20 text-xs space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-450 font-medium">Lieu de célébration :</span>
                    <span className="font-bold text-slate-800">{selectedMairieName || 'Mairie non sélectionnée'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450 font-medium">Prestation recherchée :</span>
                    <span className="font-bold text-primary">{showContactModal.category}</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-200/50 pt-2">
                    <span className="text-slate-450 font-medium">Date d'Honneur :</span>
                    <span className="font-bold text-rose-600 font-serif">{formatDateFrench(weddingDate)}</span>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setShowContactModal(null)}
                    className="flex-1 py-2.5 border border-neutral-350 rounded-xl text-xs font-bold text-slate-700 hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-primary/10 border border-primary/20 cursor-pointer transition-colors"
                  >
                    Envoyer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
