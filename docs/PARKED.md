# Parked — designed, deliberately not built

These prototype screens exist in `design/prototype/` as appendix evidence of
the full product vision. They are **out of scope for the dissertation build**
(BUILD_PROMPT §6) and become the report's future-work section. The designs
must not be deleted.

| Feature | Prototype screens | Why it was cut |
| --- | --- | --- |
| Mentor marketplace | `mentor_booking_checkout_*`, `mentor_booking_schedule_session_*`, `mentor_booking_select_service_*`, `mentor_profile_sarah_chen_*` (all six) | No contribution to the research question (does BKT-driven adaptation work?); introduces paid-guidance/signals ethics risks that AE1 explicitly warns against — no payment code of any kind ships. |
| Terminal simulator / order flow | `trademind_terminal_simulator`, `trademind_terminal_mobile`, `trademind_dashboard_order_flow_animated` | A bar-by-bar replay engine with order tickets is a product in itself; the chart-annotation question type already covers visual assessment for the evaluation. |
| Trade review with mentor CTA | `trade_review_analysis_desktop`, `trade_review_*_with_mentor_cta_*`, `trade_review_mobile` | Superseded by the simpler post-session answer review; the trade-journal variant presumes the terminal simulator exists. |
| Mentor response dashboards | `dashboard_mentor_response_desktop/_mobile` | Depend on the mentor marketplace above. |
| AI tutor feedback | (no dedicated screen — feedback panels are rule-based) | Generative feedback raises accuracy/ethics stakes the evaluation can't carry; rule-based explanations are auditable. Documented future work in AE1. |
