# Pilot results

Generated 2026-09-22 by `scripts/analyse.ts` from the production database (read-only). Learners are pseudonymised in sign-up order; test accounts are excluded. n = 3.

## Per learner

| Learner | Consent | Placement | Post-test | Normalised gain | Practice sessions | Items answered | Practice accuracy | Time on task (answers, min) | Session wall-clock (min) | KCs mastered (of 16) | SUS |
| --- | :---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| P1 | yes | skipped | – | – | 0 | 0 | – | 0.0 | 0.0 | 0 | – |
| P2 | yes | skipped | – | – | 1 | 8 | 75% | 3.8 | 5.1 | 1 | – |
| P3 | yes | 9/16 | – | – | 0 | 0 | – | 0.7 | 0.0 | 0 | – |

## Summary

| Measure | Value |
| --- | ---: |
| Learners signed up | 3 |
| Learners with at least one practice session | 1 |
| Learners with placement and post-test | 0 |
| Mean placement score | – |
| Mean post-test score | – |
| Mean normalised gain (sd) | – (–) |
| Median normalised gain | – |
| Learners with positive gain | – |
| Mean practice sessions per active learner | 1.0 |
| Mean items answered per active learner | 8.0 |
| Mean time on task per active learner (min) | 3.8 |
| Mean KCs mastered per active learner | 1.0 |
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

| Knowledge component | Opportunities | Error rate, first half | Error rate, second half | Slope per opportunity | Reads as |
| --- | ---: | ---: | ---: | ---: | --- |
| candle-anatomy | 8 | 50% | 0% | -0.095 | too few answers to read |

Components reading as flat or rising are the ones to re-examine: either the lessons are not teaching them or the items are not measuring one skill.

## Caveats

- Placement (form A) and post-test (form B) use different items for every module except Liquidity, which has one pretest-eligible item, so that module is a repeat.
- Time on task from answer latencies excludes reading lessons and watching recordings; it's a floor. Session wall-clock includes them but is capped at two hours per session to stop an abandoned tab counting.
- There's no control group. Gains are pre/post on one group and can't separate the routing from the content. The routing question is addressed by simulation in EVALUATION.md.
- Only the first completed post-test per learner counts.
- Option positions are evened out at build time (lib/content/debias.ts), so no answer position is worth guessing. Two authoring tells remain and are not corrected: the correct option is the longest in 37 of 55 multiple-choice items (42 characters against 26 for the distractors), and the true/false items run 5 true to 10 false. Both would inflate scores slightly for a test-wise participant.
