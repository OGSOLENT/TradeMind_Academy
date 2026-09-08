const FAQS = [
  {
    q: "Is this financial advice?",
    a: "No — and it never will be. TradeMind Academy teaches concepts on simulated data only. There are no signals, no live prices, no broker connections, and no claims about profitability. It is a university research project about how people learn.",
  },
  {
    q: "How does the adaptive tutor work?",
    a: "Every answer updates a Bayesian Knowledge Tracing model — a per-topic probability that you've mastered the skill. Routing rules pick your next question from your weakest unlocked topic, at a difficulty matched to your estimate. You can inspect the model's reasoning on any question.",
  },
  {
    q: "What data do you collect?",
    a: "Your answers, response times, and the model's mastery estimates — recorded with your GDPR consent for the dissertation evaluation, analysed anonymised. You can download everything or delete your account from Settings at any time.",
  },
  {
    q: "Who can use it?",
    a: "Adults (18+) only. The 18+ attestation is enforced at sign-up and in the database security rules, not just the interface.",
  },
  {
    q: "Do I need any trading experience?",
    a: "None. The placement test estimates your starting point in eight questions; if you're brand new, the tutor simply starts every topic from the beginning.",
  },
];

export function Faq() {
  return (
    <section id="faq" aria-label="Frequently asked questions" className="mx-auto max-w-3xl px-6 py-24">
      <h2 className="text-display-lg-mobile md:text-display-lg text-fg-primary">Questions</h2>
      <div className="mt-8 space-y-3">
        {FAQS.map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-card bg-bg-elevated-veil shadow-edge-lit open:pb-5"
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-card px-6 py-5 text-body-base font-medium text-fg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
              {q}
              <span aria-hidden="true" className="text-fg-muted transition-transform duration-200 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="px-6 text-sm leading-7 text-fg-secondary">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
