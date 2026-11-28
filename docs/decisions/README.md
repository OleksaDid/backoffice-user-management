# Decision log

Architecture Decision Records in a lightweight [MADR](https://adr.github.io/madr/) style: context,
decision, consequences. Assumptions made where the requirements leave room for interpretation are
recorded here too, so reviewers can see what was decided and why.

A decision is never edited after it is accepted; a new record supersedes it.

| #                                                   | Decision                                            | Status   |
| --------------------------------------------------- | --------------------------------------------------- | -------- |
| [0001](0001-monorepo-and-technology-stack.md)       | Monorepo and technology stack                       | Accepted |
| [0002](0002-delivery-workflow.md)                   | Delivery workflow: trunk, release-please, gates     | Accepted |
| [0003](0003-interpretation-of-open-requirements.md) | Interpretation of open requirements                 | Accepted |
| [0004](0004-credentials-in-a-separate-table.md)     | Credentials in a separate table, added by migration | Accepted |
| [0005](0005-session-id-in-an-httponly-cookie.md)    | Session id in an httpOnly cookie                    | Accepted |
| [0006](0006-testing-strategy.md)                    | Testing strategy and quality gates                  | Accepted |
| [0007](0007-session-probe-answers-nulls.md)         | The session probe answers `null`s instead of 401    | Accepted |
