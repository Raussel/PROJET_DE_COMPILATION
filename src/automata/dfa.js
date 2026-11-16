// Construction par sous-ensembles : AFN -> AFD (sans état puits : une transition absente = rejet)
export function toDFA(nfa) {
  const closure = (set) => {
    const seen = new Set(set), stack = [...set];
    while (stack.length) {
      const q = stack.pop();
      for (const t of nfa.transitions) {
        if (t.from === q && t.symbol === null && !seen.has(t.to)) { seen.add(t.to); stack.push(t.to); }
      }
    }
    return [...seen].sort((a, b) => a - b);
  };

  const keyOf = (set) => set.join(',');
  const startSet = closure([nfa.start]);
  const states = [{ id: 0, nfaStates: startSet }];
  const index = new Map([[keyOf(startSet), 0]]);
  const transitions = [];

  for (let k = 0; k < states.length; k++) {
    for (const a of nfa.alphabet) {
      const moved = new Set();
      for (const t of nfa.transitions) {
        if (t.symbol === a && states[k].nfaStates.includes(t.from)) moved.add(t.to);
      }
      if (moved.size === 0) continue;
      const target = closure([...moved]);
      const key = keyOf(target);
      if (!index.has(key)) { index.set(key, states.length); states.push({ id: states.length, nfaStates: target }); }
      transitions.push({ from: k, to: index.get(key), symbol: a });
    }
  }

  return {
    states: states.map((s) => s.id),
    details: states,
    start: 0,
    finals: states.filter((s) => s.nfaStates.some((q) => nfa.finals.includes(q))).map((s) => s.id),
    transitions,
    alphabet: nfa.alphabet,
  };
}

// Lit le mot dans l'AFD et explique le verdict
export function testWord(dfa, rawWord) {
  const word = rawWord === 'ε' ? '' : rawWord;
  let cur = dfa.start;
  for (let i = 0; i < word.length; i++) {
    const c = word[i];
    const prefix = word.slice(0, i);
    if (!dfa.alphabet.includes(c)) {
      return { ok: false, reason: `Le symbole « ${c} » (position ${i + 1}) n'appartient pas à l'alphabet {${dfa.alphabet.join(', ')}} de l'expression.` };
    }
    const t = dfa.transitions.find((x) => x.from === cur && x.symbol === c);
    if (!t) {
      return { ok: false, reason: `Après « ${prefix || 'ε'} », l'automate est dans l'état D${cur} et n'a aucune transition pour « ${c} » (position ${i + 1}) : aucun mot du langage ne commence par « ${prefix + c} ».` };
    }
    cur = t.to;
  }
  const shown = word === '' ? 'ε (mot vide)' : `« ${word} »`;
  if (dfa.finals.includes(cur)) return { ok: true, reason: `${shown} appartient au langage : l'automate lit le mot en entier et s'arrête dans l'état final D${cur}.` };
  return { ok: false, reason: `${shown} est lu en entier, mais l'état atteint D${cur} n'est pas final : c'est le début d'un mot du langage, pas un mot complet.` };
}
