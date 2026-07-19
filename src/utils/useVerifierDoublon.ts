import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { logDuplicateAttempt } from '../services/dbService';

export const useVerifierDoublon = (
  valeur: string,
  type: 'telephone' | 'cni',
  cniType?: 'CNI' | 'PASSEPORT',
  dossierId?: string,
  mairiePhone?: string,
  mairieId?: string | null
) => {
  const [statut, setStatut] = useState<'verification' | 'disponible' | 'doublon' | 'invalide' | null>(null);
  const [message, setMessage] = useState('');
  const [trigger, setTrigger] = useState(0);

  const triggerVerification = () => {
    setTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const cleanedVal = valeur.trim();
    if (!cleanedVal || (type === 'telephone' && cleanedVal === '+225') || (type === 'telephone' && cleanedVal === '+225 ') || cleanedVal.length < 3) {
      setStatut(null);
      setMessage('');
      return;
    }

    let isMounted = true;
    let timer: NodeJS.Timeout | null = null;

    const performVerification = async () => {
      if (!isMounted) return;
      setStatut('verification');
      setMessage('🔍 Vérification en cours...');

      if (type === 'telephone') {
        const stripped = cleanedVal.replace(/\s/g, '');
        const formatCI = /^(\+225|00225)?(01|05|07)[0-9]{8}$/;
        if (!formatCI.test(stripped)) {
          setStatut('invalide');
          setMessage(
            '⚠️ Format invalide.\n' +
            'Formats acceptés :\n' +
            '→ 07 XX XX XX XX\n' +
            '→ 05 XX XX XX XX\n' +
            '→ 01 XX XX XX XX\n' +
            '→ +225 XX XX XX XX XX'
          );
          return;
        }
      }

      if (type === 'cni' && cniType === 'CNI') {
        const formatCNI = /^CI[0-9]{10}$/i;
        if (!formatCNI.test(cleanedVal)) {
          setStatut('invalide');
          setMessage(
            '⚠️ Format de CNI invalide.\n' +
            'Format attendu : CI + 10 chiffres\n' +
            'Ex: CI0012345678'
          );
          return;
        }
      }

      try {
        const fn = type === 'telephone' ? 'verifier_telephone' : 'verifier_numero_piece';
        const paramName = type === 'telephone' ? 'tel' : 'numero';

        const { data, error } = await supabase.rpc(fn, {
          [paramName]: cleanedVal,
          exclusion_id: dossierId || null
        });

        if (error) throw error;

        if (data?.existe) {
          if (!isMounted) return;
          setStatut('doublon');
          const phoneNum = mairiePhone || '+225 27 22 44 88 00';
          if (type === 'telephone') {
            setMessage(
              `❌ Ce numéro de téléphone est déjà associé à un dossier en cours.\nVeuillez contacter la mairie au ${phoneNum}.`
            );
          } else {
            setMessage(
              `❌ Ce numéro de pièce d'identité est déjà utilisé dans un dossier de mariage en cours.\nSi vous pensez qu'il s'agit d'une erreur, contactez la mairie au ${phoneNum}.`
            );
          }
          logDuplicateAttempt(type, cleanedVal, '', mairieId);
        } else {
          if (!isMounted) return;
          setStatut('disponible');
          setMessage('✅ Disponible');
        }
      } catch (err) {
        if (isMounted) {
          setStatut(null);
          setMessage('');
        }
      }
    };

    if (trigger > 0) {
      performVerification();
    } else {
      timer = setTimeout(performVerification, 800);
    }

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [valeur, trigger, type, cniType, dossierId, mairiePhone, mairieId]);

  return { statut, message, triggerVerification };
};
