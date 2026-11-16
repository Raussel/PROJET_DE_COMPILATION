import { alphabetOf } from './parser';

// Construction de Thompson : AST -> AFN avec transitions ε (symbol === null)
export function toNFA(ast) {
  let count = 0;
  const transitions = [];
  const state = () => count++;
  const add = (from, to, symbol = null) => transitions.push({ from, to, symbol });

  const build = (node) => {
    switch (node.type) {
      case 'sym': { const s = state(), f = state(); add(s, f, node.value); return { s, f }; }
      case 'eps': { const s = state(), f = state(); add(s, f); return { s, f }; }
      case 'concat': { const a = build(node.left), b = build(node.right); add(a.f, b.s); return { s: a.s, f: b.f }; }
      case 'union': {
        const a = build(node.left), b = build(node.right), s = state(), f = state();
        add(s, a.s); add(s, b.s); add(a.f, f); add(b.f, f);
        return { s, f };
      }
      case 'star': {
        const a = build(node.child), s = state(), f = state();
        add(s, a.s); add(a.f, f); add(s, f); add(a.f, a.s);
        return { s, f };
      }
      case 'plus': {
        const a = build(node.child), s = state(), f = state();
        add(s, a.s); add(a.f, f); add(a.f, a.s);
        return { s, f };
      }
      case 'opt': {
        const a = build(node.child), s = state(), f = state();
        add(s, a.s); add(a.f, f); add(s, f);
        return { s, f };
      }
      default: throw new Error('Nœud inconnu');
    }
  };

  const { s, f } = build(ast);
  return {
    states: Array.from({ length: count }, (_, k) => k),
    start: s,
    finals: [f],
    transitions,
    alphabet: alphabetOf(ast),
  };
}
