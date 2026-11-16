import { useMemo, useState } from 'react';
import { parse, RegexError } from './automata/parser';
import { toNFA } from './automata/thompson';
import { toDFA, testWord } from './automata/dfa';
import Automaton from './components/Automaton';

const EXAMPLES = ['(a|b)*abb', 'a(b|c)+d?', '(ab)*|c'];

export default function App() {
  const [regex, setRegex] = useState('(a|b)*abb');
  const [word, setWord] = useState('');

  // Étapes 1, 2, 5, 6 : validation puis AFN puis AFD
  const model = useMemo(() => {
    try {
      const nfa = toNFA(parse(regex));
      return { valid: true, nfa, dfa: toDFA(nfa) };
    } catch (e) {
      if (e instanceof RegexError) return { valid: false, message: e.message, position: e.position };
      throw e;
    }
  }, [regex]);

  // Étapes 3 et 4 : test du mot
  const verdict = model.valid ? testWord(model.dfa, word) : null;

  return (
    <main className="page">
      <header>
        <h1>Reconnaissance d'un langage régulier</h1>
        <p className="lead">Expression régulière, puis AFN (Thompson), puis AFD (sous-ensembles).</p>
      </header>

      <section>
        <h2>Expression régulière</h2>
        <input className="field mono" value={regex} spellCheck={false} onChange={(e) => setRegex(e.target.value)} aria-label="Expression régulière" placeholder="ex. (a|b)*abb" />
        <div className="chips">
          {EXAMPLES.map((ex) => <button key={ex} className="chip mono" onClick={() => setRegex(ex)}>{ex}</button>)}
        </div>
        <p className="hint">Union : <code>|</code> · répétitions : <code>*</code> <code>+</code> <code>?</code> · groupes : <code>( )</code> · mot vide : <code>ε</code></p>

        {model.valid ? (
          <p className="msg ok">Expression valide. Alphabet : {'{'}{model.nfa.alphabet.join(', ')}{'}'}</p>
        ) : (
          <div className="msg bad">
            <p>{model.message}</p>
            <pre className="mono pointer" aria-hidden="true">{regex}{'\n'}{' '.repeat(model.position)}^</pre>
          </div>
        )}
      </section>

      <section>
        <h2>Tester un mot</h2>
        <input className="field mono" value={word} disabled={!model.valid} spellCheck={false} onChange={(e) => setWord(e.target.value)} aria-label="Mot à tester" placeholder={model.valid ? 'Saisis un mot (vide = ε)' : 'Corrige d’abord l’expression'} />
        {verdict && <p className={`msg ${verdict.ok ? 'ok' : 'bad'}`}>{verdict.reason}</p>}
      </section>

      {model.valid && (
        <>
          <section>
            <h2>AFN <span className="count">{model.nfa.states.length} états</span></h2>
            <p className="hint">Transitions ε notées « ε ». Flèche entrante : état initial. Double cercle : état final.</p>
            <Automaton auto={model.nfa} prefix="q" title="AFN" />
          </section>

          <section>
            <h2>AFD <span className="count">{model.dfa.states.length} états</span></h2>
            <Automaton auto={model.dfa} prefix="D" title="AFD" />
            <ul className="subsets mono">
              {model.dfa.details.map((d) => <li key={d.id}>D{d.id} = {'{'}{d.nfaStates.map((q) => `q${q}`).join(', ')}{'}'}</li>)}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
