import React, { useState, useEffect } from 'react';
import { Search, Building, Calendar, AlertTriangle, CheckCircle2, FileText, X, ShieldAlert, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DossierInfo, MairieInfo, getDocuments, getPaymentForDossier } from '../services/dbService';
import { OppositionInfo } from '../types';
import { getDossiers, getMairies, getOppositions, createOpposition } from '../services/dbService';

interface EnrichedDossier extends DossierInfo {
  allDocsVerified?: boolean;
  isPhysicalVerified?: boolean;
  isPaid?: boolean;
}

interface BansListProps {
  addNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
  currentDossierId?: string;
}

export default function BansList({ addNotification }: BansListProps) {
  const [dossiers, setDossiers] = useState<EnrichedDossier[]>([]);
  const [mairies, setMairies] = useState<MairieInfo[]>([]);
  const [allOppositions, setAllOppositions] = useState<OppositionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [mairieFilter, setMairieFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Opposition Modal state
  const [selectedDossier, setSelectedDossier] = useState<DossierInfo | null>(null);
  const [opposerName, setOpposerName] = useState('');
  const [opposerPhone, setOpposerPhone] = useState('');
  const [opposerRole, setOpposerRole] = useState('Conjoint précédent');
  const [reason, setReason] = useState('Bigamie');
  const [details, setDetails] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dbDossiers, dbMairies, dbOppositions] = await Promise.all([
        getDossiers(),
        getMairies(),
        getOppositions()
      ]);

      const enriched = await Promise.all(
        dbDossiers.map(async (d) => {
          const isPhysicalVerified = !!d.physical_verified;
          const payment = await getPaymentForDossier(d.id);
          const isPaid = payment?.status === 'success';
          const docs = await getDocuments(d.id);
          const allDocsVerified = docs.length > 0 && docs.every(doc => doc.status === 'verified');

          return {
            ...d,
            allDocsVerified,
            isPhysicalVerified,
            isPaid
          };
        })
      );

      setDossiers(enriched);
      setMairies(dbMairies);
      setAllOppositions(dbOppositions);
    } catch (err) {
      console.error("Failed to load banns data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Set up BroadcastChannel listener for changes
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('e_mariage_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'opposition_changed' || event.data?.type === 'dossiers_changed') {
          console.log('Real-time sync triggered on BansList');
          loadData();
        }
      };
    } catch (e) {
      // Ignore
    }

    return () => {
      if (bc) bc.close();
    };
  }, []);

  // Format date helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const getDossierStatusAndCountdown = (dossier: DossierInfo) => {
    const opps = allOppositions.filter(o => o.dossierId === dossier.id);
    const hasActiveOpp = opps.some(o => o.status === 'pending' || o.status === 'validated');
    
    if (hasActiveOpp) {
      return {
        code: 'blocked',
        label: 'Opposition active',
        color: 'bg-rose-100 text-rose-800 border-rose-200',
        textColor: 'text-rose-700',
        description: 'La publication des bans est suspendue suite à une contestation juridique déposée.'
      };
    }

    // Default publication time: 10 days starting from bans_published_at
    const publicationTime = dossier.bans_published_at 
      ? new Date(dossier.bans_published_at) 
      : ((dossier as any).created_at ? new Date((dossier as any).created_at) : new Date(Date.now() - 4 * 24 * 3600 * 1000));
    const diffTime = Date.now() - publicationTime.getTime();
    const diffDays = Math.floor(diffTime / (24 * 3600 * 1000));
    const remaining = 10 - diffDays;

    if (remaining <= 0) {
      return {
        code: 'cleared',
        label: 'Délai légal purgé',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        textColor: 'text-emerald-700',
        description: 'Le délai obligatoire d\'affichage de 10 jours est complété sans opposition. Prêt pour la célébration.'
      };
    } else {
      return {
        code: 'active',
        label: `${remaining} jour${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}`,
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        textColor: 'text-indigo-700',
        description: 'Affichage des bans en cours d\'écoulement légal pour recueil des consentements.'
      };
    }
  };

  // Submit Opposition handler
  const handleFileOpposition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDossier) return;

    if (!opposerName.trim()) {
      alert("Veuillez saisir votre nom complet.");
      return;
    }

    if (!opposerPhone.trim()) {
      alert("Veuillez saisir votre numéro de téléphone.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOpposition({
        dossierId: selectedDossier.id,
        opposerName,
        opposerRole,
        opposerPhone: opposerPhone.trim(),
        reason,
        details: details.trim() || undefined,
        status: 'pending'
      }, selectedFile || undefined);

      if (result) {
        addNotification("Votre opposition civile a été déposée avec succès. L'officier de la mairie va l'examiner.", 'success');
        setSelectedDossier(null);
        setOpposerName('');
        setOpposerPhone('');
        setOpposerRole('Conjoint précédent');
        setReason('Bigamie');
        setDetails('');
        setSelectedFile(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
      addNotification("Une erreur est survenue lors du dépôt de l'opposition.", 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDossiers = dossiers.filter(d => {
    // Check publication status & active opposition
    const opps = allOppositions.filter(o => o.dossierId === d.id);
    const hasActiveOpp = opps.some(o => o.status === 'pending' || o.status === 'validated');
    
    // It must have been published (have a valid bans_published_at date or status approved)
    const isPublished = !!d.bans_published_at || d.status === 'approved';
    if (!isPublished) return false;

    // Show only if:
    // (a) status is approved, OR
    // (b) status is under_review AND there is an active opposition (contested state)
    const isValidStatus = d.status === 'approved' || (d.status === 'under_review' && hasActiveOpp);
    if (!isValidStatus) return false;

    // And it MUST satisfy all 3 conditions:
    const satisfyCondition1 = !!d.allDocsVerified;
    const satisfyCondition2 = !!d.isPhysicalVerified;
    const satisfyCondition3 = !!d.isPaid;

    if (!satisfyCondition1 || !satisfyCondition2 || !satisfyCondition3) {
      return false;
    }

    const matchesSearch = 
      d.spouse1_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.spouse2_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMairie = mairieFilter === 'all' || d.mairie_id === mairieFilter;
    
    const statusInfo = getDossierStatusAndCountdown(d);
    const matchesStatus = statusFilter === 'all' || statusInfo.code === statusFilter;

    return matchesSearch && matchesMairie && matchesStatus;
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
        <span className="font-sans text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">
          Registre d'État Civil Public
        </span>
        <h2 className="font-serif text-3xl md:text-5xl text-slate-900 font-bold mb-4 tracking-tight leading-tight">
          Panneau d'Affichage <span className="text-rose-gradient italic font-semibold">des Bans</span>
        </h2>
        <p className="font-sans text-xs md:text-sm text-slate-500 leading-relaxed max-w-2xl mx-auto font-medium">
          Consultez les publications obligatoires de bans de mariage de la commune. Conformément à la loi civile, les tiers disposent d'un délai d'affichage de 10 jours pour formuler toute opposition légale.
        </p>
      </motion.section>

      {/* Filter Section */}
      <div className="flex flex-col lg:flex-row gap-4 w-full items-center justify-between border-b border-accent/20 pb-6 sticky top-16 z-30 bg-[#fdfbf7]/90 backdrop-blur-md pt-2">
        <div className="flex flex-wrap gap-3 w-full lg:max-w-[70%] select-none">
          {/* Mairie Filter */}
          <div className="flex flex-col gap-1 text-left">
            <span className="font-bold text-slate-650 text-[9px] uppercase tracking-wider">Mairie</span>
            <select
              value={mairieFilter}
              onChange={(e) => setMairieFilter(e.target.value)}
              className="border border-accent/30 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-primary cursor-pointer text-slate-700 font-sans font-semibold"
            >
              <option value="all">Toutes les communes</option>
              {mairies.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1 text-left">
            <span className="font-bold text-slate-650 text-[9px] uppercase tracking-wider">Statut légal</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-accent/30 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-primary cursor-pointer text-slate-700 font-sans font-semibold"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">🟢 Affichage en cours</option>
              <option value="cleared">🔵 Délai légal purgé</option>
              <option value="blocked">🔴 Opposition active</option>
            </select>
          </div>
        </div>

        {/* Input Search */}
        <div className="relative w-full lg:max-w-[28%] shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un conjoint..."
            className="w-full border border-accent/30 rounded-full pl-10 pr-4 py-3 text-xs bg-white/60 focus:border-primary focus:outline-none font-sans font-medium"
          />
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-sans font-bold">Chargement des bans de la République...</span>
        </div>
      ) : filteredDossiers.length === 0 ? (
        <div className="text-center py-16 bg-white/40 border border-accent/20 rounded-2xl p-8 shadow-sm">
          <p className="font-sans text-slate-500 text-xs font-semibold">
            Aucune publication de ban ne correspond aux critères de recherche.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredDossiers.map((dossier) => {
              const mairieInfo = mairies.find(m => m.id === dossier.mairie_id);
              const statusInfo = getDossierStatusAndCountdown(dossier);
              const publicationDate = dossier.bans_published_at 
                ? new Date(dossier.bans_published_at) 
                : ((dossier as any).created_at ? new Date((dossier as any).created_at) : new Date(Date.now() - 4 * 24 * 3600 * 1000));
              const endAffichage = new Date(publicationDate.getTime() + 10 * 24 * 3600 * 1000);

              return (
                <motion.article 
                  key={dossier.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ y: -4, transition: { duration: 0.15 } }}
                  className="glass-premium rounded-2xl p-6 border border-accent/20 shadow-sm flex flex-col justify-between gap-5 text-left"
                >
                  <div className="flex flex-col gap-3">
                    {/* Status badge */}
                    <div className="flex justify-between items-center select-none">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400 font-semibold uppercase">CODE: {dossier.id.toUpperCase().replace('DOSSIER_', '')}</span>
                    </div>

                    {/* Spouses names */}
                    <div className="mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Futurs Époux</span>
                      <h3 className="font-serif text-lg font-bold text-slate-800 tracking-tight leading-snug">
                        {dossier.spouse1_name} <br/>&amp; {dossier.spouse2_name}
                      </h3>
                    </div>

                    {/* Mairie info */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-650 font-sans mt-1">
                      <Building className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="font-semibold">{mairieInfo ? mairieInfo.name : 'Mairie'} ({mairieInfo ? mairieInfo.region : 'Abidjan'})</span>
                    </div>

                    {/* Publication details */}
                    <div className="p-3 bg-white/60 border border-accent/15 rounded-xl text-[10px] space-y-1.5 font-sans leading-tight mt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Début d'affichage :</span>
                        <span className="font-bold text-slate-700">{formatDate(publicationDate.toISOString())}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Fin d'affichage légal :</span>
                        <span className="font-bold text-slate-700">{formatDate(endAffichage.toISOString())}</span>
                      </div>
                      {dossier.wedding_date && (
                        <div className="flex justify-between items-center border-t border-accent/10 pt-1.5 mt-1 text-rose-600">
                          <span className="font-medium text-slate-500">Célébration prévue :</span>
                          <span className="font-bold font-serif">{dossier.wedding_date}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[9.5px] text-slate-400 leading-normal italic mt-1.5">
                      {statusInfo.description}
                    </p>
                  </div>

                  {/* Action button */}
                  <div className="border-t border-neutral-100 pt-4 mt-2">
                    {statusInfo.code === 'blocked' ? (
                      <div className="w-full py-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 select-none">
                        <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse text-rose-600" />
                        <span>Procédure Suspendue</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedDossier(dossier)}
                        className="w-full py-2.5 bg-white border border-primary/30 hover:border-primary/50 text-primary hover:bg-primary/5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <AlertTriangle className="w-4 h-4 text-accent shrink-0" />
                        <span>Formuler une opposition</span>
                      </button>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Opposition Form Modal */}
      <AnimatePresence>
        {selectedDossier && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/50 backdrop-blur-md px-4 text-left font-sans">
            <motion.div 
              className="bg-white rounded-2xl w-full max-w-lg p-6 border border-neutral-200 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <button
                onClick={() => { setSelectedDossier(null); setSelectedFile(null); }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-slate-400 hover:text-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-serif text-lg md:text-xl font-bold text-rose-900 border-b border-neutral-100 pb-3 mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                Dépôt d'Opposition Légale Civile
              </h3>

              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-850 rounded-xl text-xs flex gap-2.5 mb-4 select-none leading-relaxed">
                <Info className="w-4.5 h-4.5 text-rose-650 shrink-0 mt-0.5" />
                <p>
                  <strong>Avertissement légal :</strong> Le dépôt d'une opposition suspend immédiatement l'instruction du mariage civil. Toute fausse déclaration ou opposition abusive expose le déclarant à des poursuites judiciaires pénales.
                </p>
              </div>

              <div className="mb-4 text-xs font-sans p-3 border border-neutral-200 rounded-xl bg-slate-50 flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Union concernée :</span>
                <span className="font-bold text-slate-800 text-sm">{selectedDossier.spouse1_name} &amp; {selectedDossier.spouse2_name}</span>
                <span className="text-[9px] text-slate-500 font-medium font-mono">Dossier N° : {selectedDossier.id.toUpperCase()}</span>
              </div>

              <form onSubmit={handleFileOpposition} className="space-y-4 text-xs">
                
                {/* Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700 text-[10px] uppercase">Nom & Prénoms du Déclarant (Opposant)</label>
                    <input
                      type="text"
                      required
                      value={opposerName}
                      onChange={(e) => setOpposerName(e.target.value)}
                      placeholder="Ex: M. Kouadio Koffi Sylvain"
                      className="border border-neutral-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700 text-[10px] uppercase">Numéro de téléphone</label>
                    <input
                      type="tel"
                      required
                      value={opposerPhone}
                      onChange={(e) => setOpposerPhone(e.target.value)}
                      placeholder="Ex: +225 07 08 09 10 11"
                      className="border border-neutral-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:border-primary focus:outline-none text-slate-700 font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Role / Qualité */}
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700 text-[10px] uppercase">Qualité / Lien de parenté</label>
                    <select
                      value={opposerRole}
                      onChange={(e) => setOpposerRole(e.target.value)}
                      className="border border-neutral-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:border-primary focus:outline-none cursor-pointer"
                    >
                      <option value="Conjoint précédent">Conjoint précédent (Lien non dissous)</option>
                      <option value="Père de la future épouse">Père de la future épouse</option>
                      <option value="Mère du futur époux">Mère du futur époux</option>
                      <option value="Tuteur légal">Tuteur légal</option>
                      <option value="Représentant du Ministère Public">Représentant du Ministère Public</option>
                      <option value="Autre ayant-droit légitime">Autre ayant-droit légitime</option>
                    </select>
                  </div>

                  {/* Reason */}
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700 text-[10px] uppercase">Motif juridique d'opposition</label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="border border-neutral-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:border-primary focus:outline-none cursor-pointer"
                    >
                      <option value="Bigamie">Lien de mariage précédent non dissous (Bigamie)</option>
                      <option value="Minorité légale">Minorité légale sans consentement des parents</option>
                      <option value="Défaut de consentement">Absence de consentement réel (Mariage forcé/blanc)</option>
                      <option value="Lien de parenté prohibé">Lien de parenté prohibé (Inceste)</option>
                      <option value="Autre empêchement légal">Autre empêchement légal légitime</option>
                    </select>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase">Explication détaillée & arguments légaux</label>
                  <textarea
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Indiquez précisément les faits juridiques motivant votre opposition..."
                    className="border border-neutral-300 rounded-xl p-3 bg-slate-50 focus:border-primary focus:outline-none leading-relaxed"
                  />
                </div>

                {/* File Upload */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700 text-[10px] uppercase">Pièce justificative juridique (Actes / Preuves PDF, JPG)</label>
                  <div className="border-2 border-dashed border-neutral-300 rounded-xl p-4 bg-slate-50 text-center flex flex-col items-center justify-center gap-2 relative">
                    <FileText className="w-6 h-6 text-slate-400" />
                    {selectedFile ? (
                      <div className="text-xs">
                        <span className="font-bold text-emerald-700">{selectedFile.name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Taille: {(selectedFile.size / 1024).toFixed(1)} KB</span>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="text-rose-600 hover:text-rose-800 text-[10px] font-bold underline mt-1.5 cursor-pointer block mx-auto animate-fade-in"
                        >
                          Supprimer le fichier
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-[11px] text-slate-500 font-medium">Sélectionnez ou déposez votre preuve légale</span>
                        <span className="text-[9px] text-slate-400">PDF, JPG, PNG (Max 5Mo)</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              setSelectedFile(e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 justify-end pt-3 border-t border-neutral-100 font-sans text-xs">
                  <button
                    type="button"
                    onClick={() => { setSelectedDossier(null); setSelectedFile(null); }}
                    className="flex-1 py-2.5 border border-neutral-350 hover:bg-neutral-50 rounded-xl font-bold text-slate-700 cursor-pointer text-center"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase tracking-wider rounded-xl shadow-md shadow-rose-600/10 cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />}
                    <span>{isSubmitting ? "Dépôt en cours..." : "Déposer l'objection légale"}</span>
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
