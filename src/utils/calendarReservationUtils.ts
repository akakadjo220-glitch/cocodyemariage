export interface SlotReservation {
  id: string;
  moisCélébration: string;
  debutReservation: string;
  ouvertureIso: string;
  conseil: string;
}

export const CALENDRIER_RESERVATIONS_2026: SlotReservation[] = [
  {
    id: "02_03",
    moisCélébration: "Février & Mars 2026",
    debutReservation: "22 Décembre 2025",
    ouvertureIso: "2025-12-22T00:00:00",
    conseil: "Idéal pour les célébrations de la Saint-Valentin. Les créneaux s'épuisent rapidement."
  },
  {
    id: "04_05",
    moisCélébration: "Avril & Mai 2026",
    debutReservation: "02 Février 2026",
    ouvertureIso: "2026-02-02T00:00:00",
    conseil: "Pensez à anticiper les ponts fériés de mai pour le dépôt physique de vos pièces."
  },
  {
    id: "06",
    moisCélébration: "Juin 2026",
    debutReservation: "02 Mars 2026",
    ouvertureIso: "2026-03-02T00:00:00",
    conseil: "Mois extrêmement sollicité. Nous vous conseillons de réserver dès le premier jour d'ouverture."
  },
  {
    id: "07",
    moisCélébration: "Juillet 2026",
    debutReservation: "1er Avril 2026",
    ouvertureIso: "2026-04-01T00:00:00",
    conseil: "Prenez garde aux délais d'établissement de vos documents durant les congés scolaires."
  },
  {
    id: "08",
    moisCélébration: "Août 2026",
    debutReservation: "04 Mai 2026",
    ouvertureIso: "2026-05-04T00:00:00",
    conseil: "Parfait pour les mariages d'été. Planifiez bien vos témoins pour éviter les absences."
  },
  {
    id: "09",
    moisCélébration: "Septembre 2026",
    debutReservation: "1er Juin 2026",
    ouvertureIso: "2026-06-01T00:00:00",
    conseil: "Climat de rentrée idéal. L'ouverture coïncide avec le début du mois de juin."
  },
  {
    id: "10",
    moisCélébration: "Octobre 2026",
    debutReservation: "1er Juillet 2026",
    ouvertureIso: "2026-07-01T00:00:00",
    conseil: "Idéal pour les thèmes automnaux. Le dépôt s'effectue dès le début de l'été."
  },
  {
    id: "11",
    moisCélébration: "Novembre 2026",
    debutReservation: "03 Août 2026",
    ouvertureIso: "2026-08-03T00:00:00",
    conseil: "Ambiance cocooning et intime. Idéal pour devancer les festivités de fin d'année."
  },
  {
    id: "12",
    moisCélébration: "Décembre 2026",
    debutReservation: "1er Septembre 2026",
    ouvertureIso: "2026-09-01T00:00:00",
    conseil: "Période de fin d'année magique et sur-réservée. Dépôt impératif à la rentrée de septembre."
  }
];

export const checkIsOpened = (ouvertureIso: string, referenceDate = new Date()): boolean => {
  const openingDate = new Date(ouvertureIso);
  return referenceDate >= openingDate;
};

export const getDaysRemainingStr = (ouvertureIso: string, referenceDate = new Date()): string => {
  const openingDate = new Date(ouvertureIso);
  const diffTime = openingDate.getTime() - referenceDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return '';
  return `Ouvre dans ${diffDays} j.`;
};

export const getSlotInfoById = (id: string): SlotReservation | undefined => {
  return CALENDRIER_RESERVATIONS_2026.find(s => s.id === id);
};
