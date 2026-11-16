// Grammaire :
//   union  := concat ('|' concat)*
//   concat := repeat+
//   repeat := atome ('*' | '+' | '?')*
//   atome  := symbole | 'ε' | '(' union ')'
export class RegexError extends Error {
  constructor(message, position) {
    super(message);
    this.position = position; // index (base 0) du caractère fautif
  }
}

const SYMBOL = /^[A-Za-z0-9]$/;

export function parse(src) {
  if (src.length === 0) throw new RegexError("L'expression est vide : saisis au moins un symbole.", 0);
  let i = 0;

  const union = () => {
    let left = concat();
    while (src[i] === '|') {
      i++;
      left = { type: 'union', left, right: concat() };
    }
    return left;
  };

  const concat = () => {
    const parts = [];
    while (i < src.length && src[i] !== '|' && src[i] !== ')') parts.push(repeat());
    if (parts.length === 0) {
      const where = i < src.length ? `devant « ${src[i]} »` : "en fin d'expression";
      throw new RegexError(`Opérande manquant à la position ${i + 1} (${where}) : un symbole ou une sous-expression est attendu.`, Math.min(i, src.length - 1));
    }
    return parts.reduce((left, right) => ({ type: 'concat', left, right }));
  };

  const repeat = () => {
    let node = atom();
    while (i < src.length && '*+?'.includes(src[i])) {
      node = { type: { '*': 'star', '+': 'plus', '?': 'opt' }[src[i]], child: node };
      i++;
    }
    return node;
  };

  const atom = () => {
    const c = src[i];
    if (c === '(') {
      const start = i++;
      if (src[i] === ')') throw new RegexError(`Parenthèses vides à la position ${start + 1} : il manque une expression entre « ( » et « ) ».`, start);
      const node = union();
      if (src[i] !== ')') throw new RegexError(`La parenthèse ouvrante de la position ${start + 1} n'est jamais refermée.`, start);
      i++;
      return node;
    }
    if ('*+?'.includes(c)) throw new RegexError(`L'opérateur « ${c} » à la position ${i + 1} n'a rien à répéter : il doit suivre un symbole ou une parenthèse fermante.`, i);
    if (c === 'ε') { i++; return { type: 'eps' }; }
    if (SYMBOL.test(c)) { i++; return { type: 'sym', value: c }; }
    const label = c === ' ' ? 'espace' : `« ${c} »`;
    throw new RegexError(`Caractère ${label} non autorisé à la position ${i + 1}. Symboles acceptés : lettres, chiffres, ε et les opérateurs | * + ? ( ).`, i);
  };

  const ast = union();
  if (i < src.length) throw new RegexError(`La parenthèse fermante de la position ${i + 1} n'a pas de parenthèse ouvrante correspondante.`, i);
  return ast;
}

export function alphabetOf(ast, set = new Set()) {
  if (ast.type === 'sym') set.add(ast.value);
  if (ast.left) alphabetOf(ast.left, set);
  if (ast.right) alphabetOf(ast.right, set);
  if (ast.child) alphabetOf(ast.child, set);
  return [...set].sort();
}
