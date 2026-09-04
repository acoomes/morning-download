# Repository guidance

This is a content repository for dated Morning Download briefings. Follow the format and working conventions in `CLAUDE.md`.

## Code Review Rules

- Treat a materially false, contradictory, misdated, or unsupported factual claim as a P1 finding when it could mislead a reader about the current state of an event, market, policy, product, or deadline.
- When reviewing a correction, re-check the entire affected briefing—not only the edited line—for headlines, closing summaries, dates, and analysis that still repeat or contradict the original error.
- Verify that correction commits address every earlier Codex P0/P1 concern and do not create a new factual inconsistency.
- Treat an already-completed event described as upcoming, pending, or planned as a P1 finding. Check the subject against earlier briefings in `briefs/`: if a prior briefing reports the event as done, the new claim is wrong regardless of what the cited source says.
- Treat a specific figure with no supporting entry in that briefing's `## Sources` list as a P1 finding, even when the surrounding item is otherwise accurate.
- Do not raise style-only preferences as P0/P1 findings.
