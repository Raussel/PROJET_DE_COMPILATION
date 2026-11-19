import { useMemo, useState } from 'react';
import { parseAlphabet } from './automata/alphabet';
import { parseRegex } from './automata/parser';
import { buildThompson } from './automata/thompson';
import { determinize } from './automata/subset';
import { minimiser } from './automata/minimise';
import { recognize } from './automata/recognize';
import { explainWord } from './automata/explain';
import Automaton from './components/Automaton';
import ThemeToggle from './ThemeToggle';

const EXAMPLES = [
  { alphabet: 'a, b', regex: '(a|b)*abb' },
  { alphabet: 'a, b, c, d', regex: 'a(b|c)*d' },
  { alphabet: 'a, b, c', regex: '(ab)*|c' },
];

export default function App() {
  const [alphabetInput, setAlphabetInput] = useState('a, b');
  const [regex, setRegex] = useState('(a|b)*abb');
  const [word, setWord] = useState('');

  // Étape 1 : lecture de l'alphabet
  const alphabetState = useMemo(() => {
    try {
      return { ok: true, symboles: parseAlphabet(alphabetInput) };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  }, [alphabetInput]);

  // Étapes suivantes : analyse, AFN (Thompson), AFD (sous-ensembles), AFD minimal
  const model = useMemo(() => {
    if (!alphabetState.ok) return { valid: false, alphabetError: true };
    try {
      const afn = buildThompson(parseRegex(regex, alphabetState.symboles));
      const afd = determinize(afn, alphabetState.symboles);
      return { valid: true, afn, afd, afdMin: minimiser(afd) };
    } catch (e) {
      const m = /\(position (\d+)\)\.$/.exec(e.message);
      return { valid: false, message: e.message, position: m ? Number(m[1]) - 1 : null };
    }
  }, [alphabetState, regex]);

  // Test du mot
  const verdict = useMemo(() => {
    if (!model.valid) return null;
    const mot = word === 'ε' || word === '€' ? '' : word;
    const r = recognize(model.afd, mot);
    return { ok: r.accepted, reason: explainWord(model.afd, mot, r) };
  }, [model, word]);

  return (
    <>
      <ThemeToggle />

      <main className="page">
        <header>
          <h1>Reconnaissance d'un langage régulier</h1>
          <div className="lead">
            <p>
              Cette application reconnaît les <strong>langages réguliers</strong>. Tu définis
              d'abord l'alphabet, puis une expression régulière construite sur cet alphabet.
              Elle est validée, transformée en automates, et tu peux tester des mots.
            </p>

            <ol className="steps">
              <li>
                <strong>Alphabet</strong>
                <span>Saisis les symboles autorisés (ex. <code>a, b</code>).</span>
              </li>
              <li>
                <strong>Expression</strong>
                <span>Entre une expression régulière qui n'utilise que ces symboles.</span>
              </li>
              <li>
                <strong>AFN</strong>
                <span>Le reconnaisseur génère l'automate non déterministe (construction de Thompson).</span>
              </li>
              <li>
                <strong>AFD</strong>
                <span>Il le convertit en automate déterministe (construction des sous-ensembles).</span>
              </li>
              <li>
                <strong>AFD minimal</strong>
                <span>Il fusionne les états équivalents pour obtenir l'automate minimal.</span>
              </li>
              <li>
                <strong>Test</strong>
                <span>Tu peux enfin tester un mot pour savoir s'il est accepté.</span>
              </li>
            </ol>
          </div>
        </header>

        <section>
          <h2>Alphabet</h2>
          <input
            className="field mono"
            value={alphabetInput}
            spellCheck={false}
            onChange={(e) => setAlphabetInput(e.target.value)}
            aria-label="Alphabet"
            placeholder="ex. a, b, c"
          />
          <p className="hint">
            Chaque caractère est un symbole : lettres, chiffres ou <code>_ . + -</code>.
            Les virgules et espaces sont ignorés.
          </p>
          {alphabetState.ok ? (
            <p className="msg ok">Alphabet : {'{'}{alphabetState.symboles.join(', ')}{'}'}</p>
          ) : (
            <p className="msg bad">{alphabetState.message}</p>
          )}
        </section>

        <section>
          <h2>Expression régulière</h2>
          <input
            className="field mono"
            value={regex}
            disabled={!alphabetState.ok}
            spellCheck={false}
            onChange={(e) => setRegex(e.target.value)}
            aria-label="Expression régulière"
            placeholder={alphabetState.ok ? 'ex. (a|b)*abb' : 'Corrige d’abord l’alphabet'}
          />

          {alphabetState.ok && (
            <>
              <div className="chips">
                Insérer :
                {[...alphabetState.symboles, '|', '*', '(', ')', 'ε'].map((s) => (
                  <button key={s} className="chip mono" onClick={() => setRegex((r) => r + s)}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="chips">
                Exemples :
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.regex}
                    className="chip mono"
                    onClick={() => { setAlphabetInput(ex.alphabet); setRegex(ex.regex); }}
                  >
                    {ex.regex}
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="hint">
            Union : <code>|</code> · étoile : <code>*</code> · groupes : <code>( )</code> · mot vide : <code>ε</code>.
            La concaténation s'écrit par juxtaposition, les espaces sont ignorés.
          </p>

          {model.valid && <p className="msg ok">Expression valide.</p>}
          {!model.valid && !model.alphabetError && (
            <div className="msg bad">
              <p>{model.message}</p>
              {model.position !== null && (
                <pre className="mono pointer" aria-hidden="true">
                  {regex}{'\n'}{' '.repeat(model.position)}^
                </pre>
              )}
            </div>
          )}
        </section>

        <section>
          <h2>Tester un mot</h2>
          <input
            className="field mono"
            value={word}
            disabled={!model.valid}
            spellCheck={false}
            onChange={(e) => setWord(e.target.value)}
            aria-label="Mot à tester"
            placeholder={model.valid ? 'Saisis un mot (vide = ε)' : 'Corrige d’abord l’alphabet et l’expression'}
          />
          {verdict && <p className={`msg ${verdict.ok ? 'ok' : 'bad'}`}>{verdict.reason}</p>}
        </section>

        {model.valid && (
          <>
            <section>
              <h2>AFN <span className="count">{model.afn.states} états</span></h2>
              <p className="hint">
                Transitions ε notées « ε ». Flèche entrante : état initial. Double cercle : état final.
              </p>
              <Automaton auto={model.afn} prefix="q" markerId="afn" title="AFN" />
            </section>

            <section>
              <h2>AFD <span className="count">{model.afd.states.length} états</span></h2>
              <Automaton auto={model.afd} markerId="afd" title="AFD" />
            </section>

            <section>
              <h2>
                AFD minimal{' '}
                <span className="count">
                  {model.afdMin.states.length} états
                  {model.afdMin.states.length < model.afd.states.length
                    ? ` (au lieu de ${model.afd.states.length})`
                    : ' (l’AFD était déjà minimal)'}
                </span>
              </h2>
              <Automaton auto={model.afdMin} markerId="min" title="AFD minimal" />
              <ul className="subsets mono">
                {model.afdMin.fusions.map((f) => (
                  <li key={f.nom}>{f.nom} = {'{'}{f.anciens.join(', ')}{'}'}</li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </>
  );
}