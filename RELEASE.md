# Classics A release

October 17, 2026 · Authorized by Joe; preparation underway

## Outcome and constraints

Publish the approved A interface to [classics.ourstuff.space](https://classics.ourstuff.space/) after the bounded scrolling refinement. Keep all original pages, content, datasets, loader requests/fallbacks, account/storage/sync and saved behavior. Conversation Desk remains unchanged. The [current design](QUIET-PANES-DESIGN.md) records Joe's clarification: text and lists may scroll inside bounded areas; the outer page stays still. Existing [verification evidence](tests/interface/browser-parity.md) remains authoritative for checks already completed.

## Verified release path

Repository: [garbledhamster/classics.ourstuff.space](https://github.com/garbledhamster/classics.ourstuff.space). GitHub Pages settings were inspected read-only: Deploy from a branch, `main`, `/ (root)`, custom domain `classics.ourstuff.space`. Public and local remote main both matched `96892acf65e079a1efda1d35a6f8499bd59923e4` during discovery. Local reviewed HEAD before this refinement: `05a24e65528223722c08ab3326d441e48bf386d0`, 18 commits ahead and zero behind.

The previous [Pages run 28272418917](https://github.com/garbledhamster/classics.ourstuff.space/actions/runs/28272418917) succeeded through GitHub's built-in Jekyll → artifact → Pages workflow. Published payload is repository-root `index.html`, `assets/`, `data/`, `donate/`, `rss/` and `CNAME`. The old private-Gitea/npm README instructions are stale; Joe directed us to use current GitHub.

HTTPS currently returns 200 through Cloudflare. Pages itself reports Enforce HTTPS unavailable for the existing custom-domain configuration. Leave that configuration untouched. Cloudflare injects a challenge-platform script into HTML; compare expected source markers/resources and protected asset/data bytes rather than whole-response HTML bytes. Existing browser test hosts reject nonlocalhost execution; disposable writes must stay local.


A read-only local `git push --dry-run` could not obtain a GitHub username with terminal prompts disabled; no ref changed. The authenticated GitHub connector reports admin/push access. Publication will use its Git data API: construct the complete reviewed tree, require the returned tree SHA to equal the local source tree, create a release commit parented by the verified current `main`, then update `main` non-force with an exact expected-head guard. The local feature history remains preserved; the public release commit and matching source tree will be recorded separately.

## Execution record

- [x] Complete and independently review the fixed-shell refinement, preserving original content/loading and Desk.
- [ ] Verify the final deployable tree, record its SHA and recheck remote main immediately before a normal non-force push to `refs/heads/main`.
- [ ] Wait for the new Pages run/deployment, then verify public pages/assets/data and representative read-only navigation on the custom domain.

No live change has been performed yet. Deployment SHA, run URL and public results will be recorded here after verification.


Pre-publication live snapshot passed **17/17** checks against `96892ac`: six datasets, six protected runtime/account/storage modules, Desk controller and stylesheet, root HTML, donation thank-you page and original RSS XML. The root retained all 181 static IDs, 29 head resource references and complete Desk markup. Only the precisely identified existing Cloudflare injection was removed for HTML comparison. Ignored release tooling saves the detailed snapshot in `.superpowers/sdd/RELEASE-A/pre-live.json`; post mode will compare the final committed source and changed assets without adding query parameters.


Contained-scroll implementation `c8c74b9832db0aeb82fa54d5ebabbfd9cf941989` passed independent release review with no Critical, Important or Minor findings. Final-source checks: **377 new + 324 existing rebuilt browser checks**, **70 archived-original checks**, **15 Node checks**, 25 file/six inline syntax checks, whitespace, exact original output digests and protected source/Desk markup. Native wheel/pointer/PageDown kept outer scroll at zero, and four-size Desk geometry matched the prior A layout. The detector remains explicitly degraded; physical phone, very short phone heights and live auth/sync/payments are not claimed. See the linked verification record for detailed evidence.

## Recovery

Pre-release public source is `96892acf65e079a1efda1d35a6f8499bd59923e4`. Keep the original Git history and earlier recovery bundle. If a release defect requires rollback, create a normal revert commit for the released range, verify the restored deployable tree against that baseline, and push normally. Never force-push or discard reader data. No rollback or hosting/authentication change is currently requested.

## Joe's comments

“Looks good, let's get A live on classics.ourstuff.space. Keep all the existing pages, content, and loading exactly the same, and leave Conversation Desk as it is.”

“yeah like text can scroll but not the whole page, i hate when pages do tha”

_Add release feedback here._
