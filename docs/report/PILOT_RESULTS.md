# Pilot results

Generated 2026-09-23 by `scripts/analyse.ts` from the emulator. Learners are pseudonymised in sign-up order; test accounts are excluded. n = 0.

No learner accounts yet. The tables below fill in when the pilot runs.

## Per learner

| Learner | Consent | Placement | Post-test | Normalised gain | Practice sessions | Items answered | Practice accuracy | Time on task (answers, min) | Session wall-clock (min) | KCs mastered (of 16) | SUS |
| --- | :---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |

## Summary

| Measure | Value |
| --- | ---: |
| Learners signed up | 0 |
| Learners with at least one practice session | 0 |
| Learners with placement and post-test | 0 |
| Mean placement score | – |
| Mean post-test score | – |
| Mean normalised gain (sd) | – (–) |
| Median normalised gain | – |
| Learners with positive gain | – |
| Mean practice sessions per active learner | – |
| Mean items answered per active learner | – |
| Mean time on task per active learner (min) | – |
| Mean KCs mastered per active learner (rebuilt from the log) | – |
| Sessions whose model write failed and was restored from the log | 0 |
| SUS responses | 0 |
| Mean SUS (sd) | – (–) |

Hake (1998) reads normalised gain as low below 0.3, medium from 0.3 to 0.7 and high above 0.7. Bangor, Kortum and Miller (2008) put the SUS average at 68; above 80 is the top decile.

## The post-test as a held-out check of the model

Each post-test answer was logged with the model's estimate for that module at the time. Practice answers can't give this number cleanly because they move the estimate; post-test answers don't.

| Model said | Post-test items | Answered correctly |
| --- | ---: | ---: |
| Mastered (pL ≥ 0.8) | 0 | – |
| Not yet mastered | 0 | – |
| All | 0 | – |

## Open answers

None yet.

## Knowledge-component validation (learning curves)

A knowledge component should behave like one skill: error rate falls as opportunities accumulate (Cen, Koedinger and Junker, 2006). A flat curve suggests the component is not being learned; a rising or jagged one suggests it bundles more than one skill, or that its items do not measure the same thing. This is the check that turns the decomposition in Section 5.6 from an assertion into a result.

No practice answers yet, so no curves. This section fills in when the pilot runs.

## Caveats

- Placement (form A) and post-test (form B) use different items for every module except Liquidity, which has one pretest-eligible item, so that module is a repeat.
- Time on task from answer latencies excludes reading lessons and watching recordings; it's a floor. Session wall-clock includes them but is capped at two hours per session to stop an abandoned tab counting.
- There's no control group. Gains are pre/post on one group and can't separate the routing from the content. The routing question is addressed by simulation in EVALUATION.md.
- Only the first completed post-test per learner counts.
- Modules mastered are rebuilt from the append-only response log, not read from the learner's mastery document, which the browser writes. The log's shape and ranges are enforced by the security rules, but answers are graded in the browser, so the log records what the learner's client reported (see the report's limitations).
- Option positions are evened out at build time (lib/content/debias.ts), so no answer position is worth guessing. Two authoring tells remain and are not corrected: the correct option is the longest in 37 of 55 multiple-choice items (42 characters against 26 for the distractors), and the true/false items run 5 true to 10 false. Both would inflate scores slightly for a test-wise participant.
