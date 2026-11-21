# Contract Status

An honest, current classification of the contract crates in this workspace.

The membership and test-attribute inventory below is generated from source. The
prose sections that follow are historical notes from a 2026-08-10 heuristic
scan and are labelled as such. The previous version of this file reported
`coin-flip`, `dice-roll` and `prize-pool` as untested and listed eight
crates that are no longer in the workspace. Those claims were wrong. They have
been replaced by the generated block rather than patched by hand, so the
membership list and test counts cannot drift again without `--check` failing.

## What this file does and does not say

- It records which crates Cargo builds, which are effectively excluded, and a
  mechanical count of `#[test]` attributes per crate.
- It does **not** audit code, verify authorization, judge test quality, or sign
  any crate off as production-ready. See the explicit note at the end of the
  generated inventory.
- The old "implemented / partial / stub" labels were a heuristic from a scan
  dated 2026-08-10. They are retained below as context only, are not
  regenerated, and must not be used as a current status.

<!-- BEGIN GENERATED CONTRACT INVENTORY -->
### Source-backed workspace inventory

Generated from `contracts/Cargo.toml` and `#[test]` attributes in each crate's
`.rs` files by `python3 scripts/contract_inventory.py`. Re-run it and commit the
result whenever membership or test attributes change;
`python3 scripts/contract_inventory.py --check` fails when this block is stale.

- Workspace members: **135**
- Effectively excluded crates: **19** (a crate listed in both
  `members` and `exclude` is a member, not an exclusion)
- Crate directories containing a `Cargo.toml`: **154**

**Excluded crates** (19): `higher-lower`, `merch-redemption`, `profile-perks`, `daily-reward-emission`, `escrow-ledger`, `escrow-vault`, `fanout-distributor`, `guild-progress`, `ladder-checkpoints`, `ladder-seasons`, `loot-crate`, `map-voting`, `mission-ledger`, `prize-router-v2`, `quest-ledger-v2`, `queue-rewards`, `squad-rewards`, `squad-roster`, `wallet-reserves`.

#### Test attributes by crate

| Crate | Membership | `#[test]` attributes |
| --- | --- | ---: |
| `access-control` | member | 11 |
| `achievement-badge` | member | 24 |
| `achievements` | member | 9 |
| `affiliate-ledger` | member | 6 |
| `ai-generated-game` | member | 5 |
| `anti-cheat-bounties` | member | 19 |
| `arena-ladder` | member | 13 |
| `arena-passes` | member | 7 |
| `arena-sessions` | member | 10 |
| `asset-escrow-v3` | member | 15 |
| `attendance-pass` | member | 12 |
| `badge-minter` | member | 14 |
| `balance-management` | member | 10 |
| `blind-auction` | member | 6 |
| `bonus-rotator` | member | 6 |
| `bonus-vault` | member | 6 |
| `bounty-escrow` | member | 8 |
| `campaign-claims` | member | 5 |
| `challenge-ladder` | member | 6 |
| `clan-seasons` | member | 11 |
| `coin-flip` | member | 44 |
| `color-prediction` | member | 28 |
| `combo-rewards` | member | 6 |
| `comprehensive-test-suite` | member | 8 |
| `contract-address-registry` | member | 26 |
| `contract-circuit-breaker` | member | 3 |
| `contract-doc-generator` | member | 14 |
| `contract-health-registry` | member | 8 |
| `contract-interaction-library` | member | 15 |
| `contract-metadata-registry` | member | 20 |
| `contract-monitoring` | member | 9 |
| `contract-role-registry` | member | 21 |
| `contract-upgrade-timelock` | member | 10 |
| `creator-drops` | member | 9 |
| `creator-escrow` | member | 5 |
| `creator-royalties` | member | 11 |
| `creator-vaults` | member | 12 |
| `cross-chain-bridge` | member | 13 |
| `cross-contract-call-guard` | member | 5 |
| `cross-contract-handler` | member | 26 |
| `daily-challenges` | member | 15 |
| `daily-reward-emission` | excluded | 3 |
| `daily-trivia` | member | 9 |
| `deployment-scripts` | member | 3 |
| `dice-roll` | member | 34 |
| `duel-engine` | member | 4 |
| `dutch-auction` | member | 15 |
| `dynamic-fee-policy` | member | 9 |
| `emergency-pause` | member | 14 |
| `epoch-scheduler` | member | 15 |
| `escrow-ledger` | excluded | 7 |
| `escrow-marketplace` | member | 10 |
| `escrow-vault` | excluded | 5 |
| `exploit-prevention` | member | 36 |
| `fanout-distributor` | excluded | 9 |
| `fee-allocator` | member | 6 |
| `fee-management` | member | 26 |
| `fee-shield` | member | 4 |
| `gas-optimization-analysis` | member | 2 |
| `governance` | member | 29 |
| `governance-token` | member | 13 |
| `grant-ledger` | member | 9 |
| `guild-progress` | excluded | 17 |
| `guild-season` | member | 6 |
| `higher-lower` | excluded | 10 |
| `identity-registry` | member | 9 |
| `jackpot-pool` | member | 13 |
| `ladder-checkpoints` | excluded | 5 |
| `ladder-seasons` | excluded | 6 |
| `leaderboard` | member | 6 |
| `lending-pool` | member | 8 |
| `lobby-escrow` | member | 7 |
| `lobby-gates` | member | 6 |
| `loot-crate` | excluded | 10 |
| `loot-rotation` | member | 9 |
| `map-voting` | excluded | 8 |
| `matchmaking-queue` | member | 13 |
| `merch-redemption` | excluded | 5 |
| `minesweeper-escrow` | member | 7 |
| `mission-checkins` | member | 9 |
| `mission-ledger` | excluded | 12 |
| `mission-pass` | member | 8 |
| `multiplayer-room` | member | 11 |
| `nft-reward` | member | 8 |
| `number-guess` | member | 24 |
| `oracle-integration` | member | 27 |
| `pattern-puzzle` | member | 14 |
| `penalty-slashing` | member | 6 |
| `perk-claims` | member | 6 |
| `player-stamps` | member | 3 |
| `prediction-market` | member | 3 |
| `price-prediction` | member | 37 |
| `prize-ledger-v2` | member | 5 |
| `prize-pool` | member | 35 |
| `prize-router-v2` | excluded | 7 |
| `prize-streamer` | member | 8 |
| `profile-perks` | excluded | 3 |
| `quest-ledger-v2` | excluded | 13 |
| `quest-redeemer` | member | 10 |
| `queue-rewards` | excluded | 5 |
| `raffle-engine` | member | 3 |
| `random-generator` | member | 41 |
| `rank-rewards` | member | 5 |
| `referral-quests` | member | 13 |
| `referral-rewards` | member | 2 |
| `referral-system` | member | 27 |
| `reserve-auction` | member | 6 |
| `reserve-manager` | member | 9 |
| `revenue-split` | member | 8 |
| `reward-bridges` | member | 4 |
| `reward-distribution` | member | 21 |
| `reward-router` | member | 6 |
| `reward-stream` | member | 8 |
| `reward-unlocker` | member | 13 |
| `reward-vesting` | member | 20 |
| `rock-paper-scissors` | member | 14 |
| `round-finalizer` | member | 6 |
| `round-vouchers` | member | 3 |
| `season-rewards-vault` | member | 12 |
| `session-nonce-manager` | member | 14 |
| `settlement-queue` | member | 17 |
| `shared` | member | 0 |
| `speed-trivia` | member | 8 |
| `sponsor-lockbox` | member | 2 |
| `sponsor-pool` | member | 10 |
| `sponsorship-ledger` | member | 11 |
| `squad-match` | member | 6 |
| `squad-rewards` | excluded | 3 |
| `squad-roster` | excluded | 5 |
| `staking` | member | 11 |
| `staking-rewards` | member | 7 |
| `streak-bonus` | member | 21 |
| `streak-ladder` | member | 8 |
| `team-prizes` | member | 9 |
| `ticket-market` | member | 21 |
| `ticket-redeemer` | member | 7 |
| `token-streaming` | member | 8 |
| `tournament-gates` | member | 7 |
| `tournament-lobby` | member | 6 |
| `tournament-system` | member | 19 |
| `treasury` | member | 14 |
| `treasury-allocation` | member | 14 |
| `treasury-safeguard` | member | 9 |
| `trivia-game` | member | 3 |
| `upgrade-mechanism` | member | 8 |
| `vault-claims` | member | 7 |
| `vault-routing` | member | 2 |
| `vip-subscription` | member | 24 |
| `vote-escrow` | member | 3 |
| `voucher-escrow` | member | 4 |
| `voucher-minter` | member | 9 |
| `wallet-claims-v2` | member | 3 |
| `wallet-reserves` | excluded | 16 |
| `wordle-clone` | member | 22 |

> **A test count is not a security sign-off.** These numbers count `#[test]`
> attributes mechanically. They do not say what a test asserts, whether it is
> enabled in CI, whether a crate is authorized correctly, or whether its
> Soroban release build passes. Nothing in this document certifies any crate as
> audited or production-ready; that requires a separate review recorded in the
> linked issue and PR.
<!-- END GENERATED CONTRACT INVENTORY -->

## Historical heuristic audit (2026-08-10)

The scan that produced the old status labels counted lines in `src/lib.rs`,
looked for `todo!()` / `unimplemented!()` / literal `TODO` comments, counted
`#[test]` blocks as a proxy for coverage, and searched for placeholder
language. It was a heuristic, not a manual review. Some classifications were
almost certainly wrong at the margins, which is exactly why the generated
block above now owns the factual claims.

Old rule, kept only to explain the retired labels: "stub" meant fewer than 70
lines or placeholder language; "implemented" meant `#[test]` blocks, at least
150 lines and no `todo!`/`TODO`; "partial" meant everything else. The old
summary counts were 39 implemented, 78 partial and 34 stub. Those counts no
longer describe the workspace and are not restated here.

## Historical build health note (2026-08-10)

A past audit found that the workspace failed to resolve its dependency graph
because eight near-empty crates pinned `soroban-sdk = "20.0.0"` while the rest
used `25.0.2`. Those eight were bumped in that pass. A separate note claimed
`badge-minter` and `season-rewards-vault` failed to compile due to
`#[contractevent]` / `#[topic]` API drift and an unsupported `usize` contract
parameter. Both are excluded from the workspace today, so re-check them with
the current SDK before relying on that note. This paragraph is history, not a
current build result; run `cd contracts && cargo check --workspace --locked`
for the actual state.

## Contracts proposed for v1 (current test-attribute counts)

Per `ANTIGRAVITY-BUILD-PROMPT.md`. The counts below come from the generated
inventory above, not from the retired heuristic. Membership is shown because
some of these crates are not currently built by CI.

| Contract | Membership | `#[test]` attributes | Note |
| --- | --- | ---: | --- |
| `random-generator` | member | 41 | Review the provably-fair RNG design; consider fuzz/property tests |
| `treasury` | member | 14 | Review access-control paths |
| `quest-ledger-v2` | excluded | 13 | Review edge cases (streak resets, double-claims); not built by CI |
| `access-control` | member | 11 | Review the RBAC paths the tests cover |
| `coin-flip` | member | 44 | Review exposure tracking and recent-game history |
| `dice-roll` | member | 34 | Review outcome derivation and payout paths |
| `higher-lower` | excluded | 10 | Not built by CI; check why before relying on its tests |
| `number-guess` | member | 24 | Check remaining TODOs |
| `trivia-game` | excluded | 3 | Not built by CI; close remaining TODOs |
| `pattern-puzzle` | member | 14 | Check remaining TODOs |
| `prize-pool` | member | 34 | This contract moves money; review its payout tests before v1 |
| `leaderboard` | member | 6 | Review score submission and ranking tests |

Test attributes are evidence that someone wrote tests, not that the tests
protect the contract. The v1 decision still needs the review described in the
generated inventory's sign-off note.

## On the "move non-v1 contracts to contracts/incubator/" idea

A past build prompt proposed physically moving the non-shortlisted crates into
`contracts/incubator/`. That was not done and is still not done here. This repo
has a long history and a workspace `Cargo.toml` with an explicit `members` list
and `exclude` list that CI depends on. Moving that many directories is a
large, hard-to-revert change with real risk of breaking CI or in-flight
branches, for a tidier directory listing that the generated inventory already
provides. If a maintainer wants the physical move later, the inventory above
is the input list for it.
