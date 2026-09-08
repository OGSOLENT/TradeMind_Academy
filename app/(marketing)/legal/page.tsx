import type { Metadata } from "next";

export const metadata: Metadata = { title: "Legal & privacy" };

export default function LegalPage() {
  return (
    <article className="mx-auto max-w-[720px] space-y-8 px-6 py-16">
      <header>
        <h1 className="text-display-lg-mobile text-fg-primary">Legal & privacy</h1>
        <p className="num mt-2 text-sm text-fg-secondary">Version 2026-07-15.v1</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-headline-md text-fg-primary">What this is</h2>
        <p className="text-body-base leading-7 text-fg-secondary">
          TradeMind Academy is a research artefact built for a BSc dissertation (Solent
          University, unit QHO634). It is an educational platform about trading concepts, running
          entirely on simulated data. It is not a financial service, does not provide investment
          advice or signals, holds no client money, and connects to no broker. Content must not be
          relied upon for real trading decisions. The service is restricted to adults (18+).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-headline-md text-fg-primary">Data we process (UK GDPR)</h2>
        <ul className="list-disc space-y-2 pl-5 text-body-base leading-7 text-fg-secondary">
          <li>
            <span className="text-fg-primary">Account data</span> — display name and email, to
            operate your account. Lawful basis: contract.
          </li>
          <li>
            <span className="text-fg-primary">Learning interactions</span> — answers, response
            times, and the tutor&apos;s mastery estimates. Lawful basis: your explicit consent,
            collected on the consent screen before any learning data is recorded. Used, in
            anonymised form, to evaluate the adaptive tutor for the dissertation.
          </li>
        </ul>
        <p className="text-body-base leading-7 text-fg-secondary">
          No payment data, no financial account data, and no live market activity exist anywhere
          in the system.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-headline-md text-fg-primary">Your rights</h2>
        <p className="text-body-base leading-7 text-fg-secondary">
          From Settings you can download everything we hold about your learning as CSV, and delete
          your account. Consent can be withdrawn at any time without giving a reason; withdrawal
          stops all further recording. Purging of already-recorded research data is honoured on
          request through the study contact. Data lives in Google Firebase (Firestore) and is
          retained only for the duration of the dissertation evaluation.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-headline-md text-fg-primary">Contact</h2>
        <p className="text-body-base leading-7 text-fg-secondary">
          Study contact: the project author via Solent University. For data-protection concerns
          you may also contact the university&apos;s Data Protection Officer or the ICO.
        </p>
      </section>
    </article>
  );
}
