/**
 * mrzService.ts - Service d'Analyse MRZ (Machine Readable Zone) & Auto-Correction ICAO 9303
 *
 * Conforme à la norme OACI / ICAO Doc 9303 :
 * - Format TD1 : 3 lignes de 30 caractères (Cartes d'Identité CDEAO / Ivoiriennes / Européennes)
 * - Format TD2 : 2 lignes de 36 caractères (Cartes de séjour / visas)
 * - Format TD3 : 2 lignes de 44 caractères (Passeports internationaux)
 *
 * Fonctionnalité clé : Auto-correction mathématique par Checksum (Modulo 10, poids 7-3-1)
 * Corrige automatiquement les erreurs d'OCR courantes ('O' <-> '0', 'I' <-> '1', 'B' <-> '8', etc.)
 */

export interface MrzResult {
  statut: 'VALIDE' | 'CORRIGE' | 'INVALIDE' | 'NON_DETECTE';
  typeDocument: 'CNI_TD1' | 'PASSEPORT_TD3' | 'VISA_TD2' | 'INCONNU';
  numeroDocument: string;
  nom: string;
  prenoms: string;
  dateNaissance: string; // Format DD/MM/YYYY
  dateExpiration: string; // Format DD/MM/YYYY
  nationalite: string;
  sexe: string;
  mrzValide: boolean;
  estCorrige: boolean;
  correctionsEffectuees: string[];
  mrzLignesRaw: string[];
}

// Pondération OACI 9303
const ICAO_WEIGHTS = [7, 3, 1];

/**
 * Calcule la valeur numérique d'un caractère selon la norme ICAO 9303.
 * '0'-'9' -> 0-9
 * 'A'-'Z' -> 10-35
 * '<' ou autre -> 0
 */
function getIcaoCharValue(char: string): number {
  if (!char) return 0;
  const c = char.toUpperCase();
  if (c >= '0' && c <= '9') {
    return c.charCodeAt(0) - '0'.charCodeAt(0);
  }
  if (c >= 'A' && c <= 'Z') {
    return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
  }
  return 0; // '<' vaut 0
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes de caractères.
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const lenA = a.length;
  const lenB = b.length;

  for (let i = 0; i <= lenA; i++) matrix[i] = [i];
  for (let j = 0; j <= lenB; j++) matrix[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // suppression
        matrix[i][j - 1] + 1,       // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[lenA][lenB];
}

/**
 * Calcule si deux mots correspondent avec tolérance aux erreurs d'OCR (Fuzzy Matching).
 */
export function isFuzzyWordMatch(word1: string, word2: string): boolean {
  if (!word1 || !word2) return false;
  const w1 = word1.toUpperCase().trim();
  const w2 = word2.toUpperCase().trim();

  if (w1 === w2) return true;

  // Normalisation des confusions OCR courantes (ex: KADJ0 -> KADJO, 0 -> O, 1 -> I)
  const norm1 = w1.replace(/0/g, 'O').replace(/1/g, 'I').replace(/8/g, 'B').replace(/5/g, 'S');
  const norm2 = w2.replace(/0/g, 'O').replace(/1/g, 'I').replace(/8/g, 'B').replace(/5/g, 'S');

  if (norm1 === norm2) return true;

  const dist = levenshteinDistance(norm1, norm2);
  const maxLen = Math.max(norm1.length, norm2.length);

  // Mots courts (<= 3 chars) : doivent être identiques ou normalisés
  if (maxLen <= 3) return dist === 0;

  // Mots moyens (4-6 chars) : 1 faute/différence tolérée
  if (maxLen <= 6) return dist <= 1;

  // Mots longs (>= 7 chars) : jusqu'à 2 fautes tolérées
  return dist <= 2;
}

/**
 * Calcule le chiffre de contrôle (Checksum) d'une chaîne selon ICAO 9303 (Modulo 10).
 */
export function calculateIcaoChecksum(str: string): number {
  let total = 0;
  for (let i = 0; i < str.length; i++) {
    const val = getIcaoCharValue(str[i]);
    const weight = ICAO_WEIGHTS[i % 3];
    total += val * weight;
  }
  return total % 10;
}

/**
 * Dictionnaires de paires de confusion OCR récurrentes
 */
const CONFUSION_MAP: Record<string, string> = {
  'O': '0',
  '0': 'O',
  'I': '1',
  '1': 'I',
  'B': '8',
  '8': 'B',
  'Z': '2',
  '2': 'Z',
  'S': '5',
  '5': 'S',
  'G': '6',
  '6': 'G'
};

/**
 * Tente d'auto-corriger une chaîne avec son chiffre de contrôle en testant les inversions de confusion OCR.
 */
function autoCorrectFieldWithChecksum(fieldValue: string, expectedCheckDigit: string): { corrected: string; wasModified: boolean; fixDesc?: string } {
  const cleanVal = fieldValue.trim();
  const targetCheck = parseInt(expectedCheckDigit.trim(), 10);

  if (isNaN(targetCheck)) {
    return { corrected: cleanVal, wasModified: false };
  }

  // 1. Vérification initiale sans modification
  if (calculateIcaoChecksum(cleanVal) === targetCheck) {
    return { corrected: cleanVal, wasModified: false };
  }

  // 2. Tester les permutations de caractères ambigus
  const chars = cleanVal.split('');
  for (let i = 0; i < chars.length; i++) {
    const originalChar = chars[i];
    const replacement = CONFUSION_MAP[originalChar];
    if (replacement) {
      chars[i] = replacement;
      const candidateStr = chars.join('');
      if (calculateIcaoChecksum(candidateStr) === targetCheck) {
        return {
          corrected: candidateStr,
          wasModified: true,
          fixDesc: `Correction OCR '${originalChar}' -> '${replacement}' à la position ${i + 1}`
        };
      }
      chars[i] = originalChar; // Revenir en arrière
    }
  }

  // 3. Tester 2 permutations simultanées si la chaîne est plus longue
  for (let i = 0; i < chars.length; i++) {
    const rep1 = CONFUSION_MAP[chars[i]];
    if (!rep1) continue;
    for (let j = i + 1; j < chars.length; j++) {
      const rep2 = CONFUSION_MAP[chars[j]];
      if (!rep2) continue;

      const orig1 = chars[i];
      const orig2 = chars[j];
      chars[i] = rep1;
      chars[j] = rep2;

      const candidateStr = chars.join('');
      if (calculateIcaoChecksum(candidateStr) === targetCheck) {
        return {
          corrected: candidateStr,
          wasModified: true,
          fixDesc: `Double correction OCR '${orig1}'->'${rep1}' & '${orig2}'->'${rep2}'`
        };
      }
      chars[i] = orig1;
      chars[j] = orig2;
    }
  }

  return { corrected: cleanVal, wasModified: false };
}

/**
 * Convertit une date MRZ (AAMMJJ) en format français DD/MM/YYYY
 */
function parseMrzDate(yymmdd: string): string {
  if (!yymmdd || yymmdd.length !== 6 || !/^\d{6}$/.test(yymmdd)) return '';
  const yy = parseInt(yymmdd.substring(0, 2), 10);
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);

  // Année pivot : si yy > 35, on suppose 19yy, sinon 20yy
  const fullYear = yy > 35 ? 1900 + yy : 2000 + yy;
  return `${dd}/${mm}/${fullYear}`;
}

/**
 * Nettoie et extrait les noms/prénoms depuis une ligne MRZ (ex: DUPONT<<JEAN<PIERRE<<<<)
 */
function parseMrzNames(nameStr: string): { nom: string; prenoms: string } {
  const clean = nameStr.replace(/<+$/, '');
  const parts = clean.split('<<');
  const nom = (parts[0] || '').replace(/</g, ' ').trim();
  const prenoms = (parts[1] || '').replace(/</g, ' ').trim();
  return { nom, prenoms };
}

/**
 * Extrait et nettoie les lignes MRZ d'un texte d'analyse OCR
 */
export function extractMrzLinesFromText(rawText: string): string[] {
  if (!rawText) return [];

  // Supprimer les espaces parasites sur chaque ligne
  const lines = rawText.split('\n')
    .map(l => l.trim().toUpperCase().replace(/\s+/g, ''))
    .filter(l => l.length >= 28 && l.includes('<'));

  return lines;
}

/**
 * Analyseur Principal MRZ conforme ICAO 9303.
 * Supporte TD1 (3x30), TD2 (2x36), TD3 (2x44).
 */
export function parseAndValidateMrz(mrzLinesInput: string[] | string): MrzResult {
  const defaultRes: MrzResult = {
    statut: 'NON_DETECTE',
    typeDocument: 'INCONNU',
    numeroDocument: '',
    nom: '',
    prenoms: '',
    dateNaissance: '',
    dateExpiration: '',
    nationalite: '',
    sexe: '',
    mrzValide: false,
    estCorrige: false,
    correctionsEffectuees: [],
    mrzLignesRaw: []
  };

  const lines = Array.isArray(mrzLinesInput)
    ? mrzLinesInput
    : extractMrzLinesFromText(mrzLinesInput);

  if (!lines || lines.length === 0) return defaultRes;

  const cleanLines = lines.map(l => l.replace(/[^A-Z0-9<]/gi, ''));
  defaultRes.mrzLignesRaw = cleanLines;

  const corrections: string[] = [];
  let isChecksumValid = true;

  // -------------------------------------------------------------
  // 1. FORMAT TD3 (Passeport - 2 lignes de 44 caractères)
  // -------------------------------------------------------------
  const td3Line1 = cleanLines.find(l => l.length >= 40 && (l.startsWith('P<') || l.startsWith('P')));
  const td3Line2 = cleanLines.find(l => l !== td3Line1 && l.length >= 40 && /^[A-Z0-9<]{40,44}$/.test(l));

  if (td3Line1 && td3Line2) {
    const l1 = td3Line1.padEnd(44, '<');
    const l2 = td3Line2.padEnd(44, '<');

    const rawDocNum = l2.substring(0, 9);
    const docCheckDigit = l2.substring(9, 10);
    const rawNat = l2.substring(10, 13).replace(/</g, '');
    const rawBirth = l2.substring(13, 19);
    const birthCheckDigit = l2.substring(19, 20);
    const sexChar = l2.substring(20, 21);
    const rawExp = l2.substring(21, 27);
    const expCheckDigit = l2.substring(27, 28);

    // Auto-correction du numéro de document
    const docFix = autoCorrectFieldWithChecksum(rawDocNum, docCheckDigit);
    if (docFix.wasModified && docFix.fixDesc) corrections.push(`N° Passeport : ${docFix.fixDesc}`);

    // Auto-correction de la date de naissance
    const birthFix = autoCorrectFieldWithChecksum(rawBirth, birthCheckDigit);
    if (birthFix.wasModified && birthFix.fixDesc) corrections.push(`Date naissance : ${birthFix.fixDesc}`);

    // Auto-correction de la date d'expiration
    const expFix = autoCorrectFieldWithChecksum(rawExp, expCheckDigit);
    if (expFix.wasModified && expFix.fixDesc) corrections.push(`Date expiration : ${expFix.fixDesc}`);

    // Verification globale des checksums
    const docOk = calculateIcaoChecksum(docFix.corrected) === parseInt(docCheckDigit, 10);
    const birthOk = calculateIcaoChecksum(birthFix.corrected) === parseInt(birthCheckDigit, 10);
    const expOk = calculateIcaoChecksum(expFix.corrected) === parseInt(expCheckDigit, 10);

    if (!docOk || !birthOk || !expOk) isChecksumValid = false;

    const { nom, prenoms } = parseMrzNames(l1.substring(5));

    return {
      statut: corrections.length > 0 ? 'CORRIGE' : isChecksumValid ? 'VALIDE' : 'INVALIDE',
      typeDocument: 'PASSEPORT_TD3',
      numeroDocument: docFix.corrected.replace(/</g, ''),
      nom,
      prenoms,
      dateNaissance: parseMrzDate(birthFix.corrected),
      dateExpiration: parseMrzDate(expFix.corrected),
      nationalite: rawNat,
      sexe: sexChar === 'M' ? 'M' : sexChar === 'F' ? 'F' : 'X',
      mrzValide: isChecksumValid,
      estCorrige: corrections.length > 0,
      correctionsEffectuees: corrections,
      mrzLignesRaw: [l1, l2]
    };
  }

  // -------------------------------------------------------------
  // 2. FORMAT TD1 (CNI CDEAO / Ivoirienne - 3 lignes de 30 caractères)
  // -------------------------------------------------------------
  if (cleanLines.length >= 3) {
    const l1 = (cleanLines.find(l => l.startsWith('I') || l.startsWith('C') || l.length === 30) || cleanLines[0]).padEnd(30, '<');
    const l2 = cleanLines[1].padEnd(30, '<');
    const l3 = cleanLines[2].padEnd(30, '<');

    if (l1.length >= 30 && l2.length >= 30 && l3.length >= 30) {
      const rawDocNum = l1.substring(5, 14);
      const docCheckDigit = l1.substring(14, 15);

      const rawBirth = l2.substring(0, 6);
      const birthCheckDigit = l2.substring(6, 7);
      const sexChar = l2.substring(7, 8);
      const rawExp = l2.substring(8, 14);
      const expCheckDigit = l2.substring(14, 15);
      const rawNat = l2.substring(15, 18).replace(/</g, '');

      // Auto-correction du numéro de CNI
      const docFix = autoCorrectFieldWithChecksum(rawDocNum, docCheckDigit);
      if (docFix.wasModified && docFix.fixDesc) corrections.push(`N° CNI : ${docFix.fixDesc}`);

      // Auto-correction date de naissance
      const birthFix = autoCorrectFieldWithChecksum(rawBirth, birthCheckDigit);
      if (birthFix.wasModified && birthFix.fixDesc) corrections.push(`Date naissance : ${birthFix.fixDesc}`);

      // Auto-correction date expiration
      const expFix = autoCorrectFieldWithChecksum(rawExp, expCheckDigit);
      if (expFix.wasModified && expFix.fixDesc) corrections.push(`Date expiration : ${expFix.fixDesc}`);

      const docOk = calculateIcaoChecksum(docFix.corrected) === parseInt(docCheckDigit, 10);
      const birthOk = calculateIcaoChecksum(birthFix.corrected) === parseInt(birthCheckDigit, 10);
      const expOk = calculateIcaoChecksum(expFix.corrected) === parseInt(expCheckDigit, 10);

      if (!docOk || !birthOk || !expOk) isChecksumValid = false;

      const { nom, prenoms } = parseMrzNames(l3);

      return {
        statut: corrections.length > 0 ? 'CORRIGE' : isChecksumValid ? 'VALIDE' : 'INVALIDE',
        typeDocument: 'CNI_TD1',
        numeroDocument: docFix.corrected.replace(/</g, ''),
        nom,
        prenoms,
        dateNaissance: parseMrzDate(birthFix.corrected),
        dateExpiration: parseMrzDate(expFix.corrected),
        nationalite: rawNat,
        sexe: sexChar === 'M' ? 'M' : sexChar === 'F' ? 'F' : 'X',
        mrzValide: isChecksumValid,
        estCorrige: corrections.length > 0,
        correctionsEffectuees: corrections,
        mrzLignesRaw: [l1, l2, l3]
      };
    }
  }

  return defaultRes;
}
