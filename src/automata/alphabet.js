// Lecture et validation de l'alphabet saisi par l'utilisateur.
// Chaque caractère est un symbole : « a, b, c », « abc » et « {a,b,c} » donnent {a, b, c}.

const EST_SYMBOLE = /^[a-zA-Z0-9_.+-]$/;
const TAILLE_MAX = 26;

export function parseAlphabet(saisie) {
  const brut = String(saisie ?? '').replace(/[{}\s,;]/g, '');

  if (brut === '') {
    throw new Error('Alphabet vide : saisissez au moins un symbole (ex. a, b).');
  }

  const symboles = [];
  for (const c of Array.from(brut)) {
    if (c === 'ε' || c === '€') {
      throw new Error('ε n’est pas un symbole de l’alphabet : il désigne le mot vide.');
    }
    if (!EST_SYMBOLE.test(c)) {
      throw new Error(`Symbole non autorisé dans l’alphabet : « ${c} ». Utilisez des lettres, des chiffres ou _ . + -`);
    }
    if (!symboles.includes(c)) symboles.push(c);
  }

  if (symboles.length > TAILLE_MAX) {
    throw new Error(`Alphabet trop grand : ${TAILLE_MAX} symboles maximum.`);
  }

  return symboles.sort();
}