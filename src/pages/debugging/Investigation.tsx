import { useId, useState } from "react";

export interface Question {
  label: string;
  hint?: string;
  /** Returns true when the typed answer is right. It can be async (for example, it can ask the server). */
  check: (answer: string) => boolean | Promise<boolean>;
}

/** A small form of questions about what the learner found in the trace or the console. */
export default function Investigation({
  title,
  questions,
  solvedMessage,
}: {
  title: string;
  questions: Question[];
  solvedMessage: string;
}) {
  const id = useId();
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ""));
  const [results, setResults] = useState<boolean[] | null>(null);
  const [checking, setChecking] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setChecking(true);
    try {
      setResults(await Promise.all(questions.map((q, i) => q.check(answers[i].trim()))));
    } finally {
      setChecking(false);
    }
  };

  const correct = results?.filter(Boolean).length ?? 0;

  return (
    <form className="investigation" aria-labelledby={`${id}-title`} onSubmit={submit}>
      <h2 id={`${id}-title`}>{title}</h2>
      {questions.map((q, i) => {
        const inputId = `${id}-q${i}`;
        const result = results?.[i];
        const hasNote = Boolean(q.hint) || result !== undefined;
        return (
          <div className="form-group" key={q.label}>
            <label htmlFor={inputId}>{q.label}</label>
            <input
              id={inputId}
              type="text"
              autoComplete="off"
              value={answers[i]}
              onChange={(event) => {
                const next = [...answers];
                next[i] = event.target.value;
                setAnswers(next);
                setResults(null);
              }}
              aria-describedby={hasNote ? `${inputId}-note` : undefined}
              aria-invalid={result === false || undefined}
            />
            {hasNote && (
              <span id={`${inputId}-note`} className={result === undefined ? "field-hint" : result ? "answer-right" : "error-message"}>
                {result === undefined ? q.hint : result ? "Correct" : "Not quite"}
              </span>
            )}
          </div>
        );
      })}
      <button type="submit" disabled={checking}>
        {checking ? "Checking…" : "Check answers"}
      </button>
      {results && (
        <p className={correct === questions.length ? "result success" : "result"} role="status">
          {correct} of {questions.length} correct.
          {correct === questions.length && ` ${solvedMessage}`}
        </p>
      )}
    </form>
  );
}
