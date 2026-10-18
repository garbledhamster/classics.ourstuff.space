# Classics A release

October 17, 2026 · Live and publicly verified

## Outcome and constraints

Publish the approved A interface to [classics.ourstuff.space](https://classics.ourstuff.space/) after the bounded scrolling refinement. Keep all original pages, content, datasets, loader requests/fallbacks, account/storage/sync and saved behavior. Conversation Desk remains unchanged. The [current design](QUIET-PANES-DESIGN.md) records Joe's clarification: text and lists may scroll inside bounded areas; the outer page stays still. Existing [verification evidence](tests/interface/browser-parity.md) remains authoritative for checks already completed.

## Verified release path

Repository: [garbledhamster/classics.ourstuff.space](https://github.com/garbledhamster/classics.ourstuff.space). GitHub Pages settings were inspected read-only: Deploy from a branch, `main`, `/ (root)`, custom domain `classics.ourstuff.space`. Public and local remote main both matched `96892acf65e079a1efda1d35a6f8499bd59923e4` during discovery. Local reviewed HEAD before this refinement: `05a24e65528223722c08ab3326d441e48bf386d0`, 18 commits ahead and zero behind.

The previous [Pages run 28272418917](https://github.com/garbledhamster/classics.ourstuff.space/actions/runs/28272418917) succeeded through GitHub's built-in Jekyll → artifact → Pages workflow. Published payload is repository-root `index.html`, `assets/`, `data/`, `donate/`, `rss/` and `CNAME`. The old private-Gitea/npm README instructions are stale; Joe directed us to use current GitHub.

HTTPS currently returns 200 through Cloudflare. Pages itself reports Enforce HTTPS unavailable for the existing custom-domain configuration. Leave that configuration untouched. Cloudflare injects a challenge-platform script into HTML; compare expected source markers/resources and protected asset/data bytes rather than whole-response HTML bytes. Existing browser test hosts reject nonlocalhost execution; disposable writes must stay local.


A read-only local `git push --dry-run` could not obtain a GitHub username with terminal prompts disabled; no ref changed. The authenticated GitHub connector reports admin/push access. Publication used its Git data API: construct the complete reviewed tree, require the returned tree SHA to equal the local source tree, create a release commit parented by the verified current `main`, then update `main` non-force with an exact expected-head guard. The local feature history remains preserved; the public release commit and matching source tree will be recorded separately.

## Execution record

- [x] Complete and independently review the fixed-shell refinement, preserving original content/loading and Desk.
- [x] Verify the final deployable tree, record its SHA and recheck remote main immediately before a non-force update to `refs/heads/main`.
- [x] Wait for the new Pages run/deployment, then verify public pages/assets/data and representative read-only navigation on the custom domain.

**A is live at [classics.ourstuff.space](https://classics.ourstuff.space/).** Joe approved publication and clarified that long text may scroll inside its work area while the outer page stays still. The release preserves the original content/loading contracts and Conversation Desk.


Pre-publication live snapshot passed **17/17** checks against `96892ac`: six datasets, six protected runtime/account/storage modules, Desk controller and stylesheet, root HTML, donation thank-you page and original RSS XML. The root retained all 181 static IDs, 29 head resource references and complete Desk markup. Only the precisely identified existing Cloudflare injection was removed for HTML comparison. Ignored release tooling saves the detailed snapshot in `.superpowers/sdd/RELEASE-A/pre-live.json`; post mode compared the final committed source and changed assets without adding query parameters.


Contained-scroll implementation `c8c74b9832db0aeb82fa54d5ebabbfd9cf941989` passed independent release review with no Critical, Important or Minor findings. Final-source checks: **377 new + 324 existing rebuilt browser checks**, **70 archived-original checks**, **15 Node checks**, 25 file/six inline syntax checks, whitespace, exact original output digests and protected source/Desk markup. Native wheel/pointer/PageDown kept outer scroll at zero, and four-size Desk geometry matched the prior A layout. The detector remains explicitly degraded; physical phone, very short phone heights and live auth/sync/payments are not claimed. See the linked verification record for detailed evidence.


**Published source:** local reviewed snapshot `726071382e8520b0d07f2acb160890ff500c2505` has tree `5b0b03d1bd2778a31c0633e5dfbeb0a73feac2bb`. The GitHub-created tree matched exactly. Release commit `2b6431a7509b5b3f22ae8767663810b4034c0c7f` uses original `96892ac` as its parent; a non-force update of `main` succeeded with the exact expected-head guard. A fresh fetch verifies remote main and matching tree. The [new Pages run 39081943989](https://github.com/garbledhamster/classics.ourstuff.space/actions/runs/39081943989) completed with successful build, deploy and report jobs. The complete earlier feature history remains local; the public commit represents the same verified source tree.


**Public verification:** all **55/55** post-release checks passed at 00:16 UTC on October 18 (October 17 in Chicago), all HTTP 200. The public root, original datasets/protected modules, original Desk controller/styles/complete markup, changed interface assets, head resources, donation thank-you page and RSS match the reviewed committed source. The root has the expected 183 static IDs and 30 head resource references. Only the exact known Cloudflare HTML injection was removed for comparison. The initial release report is preserved at `.superpowers/sdd/RELEASE-A/initial-a-post-live.json`; `post-live.json` is used for the latest release check. A separate final source audit confirmed the remote/local reviewed tree equality, 15 unchanged protected/data/Desk files, 22 original loader snapshots and Firebase bridge. No hosting, DNS, authentication or reader-data migration was needed.

The local feature history and public main have different commit histories but the published snapshot has the exact same tree. Continue from current GitHub main for future release work; preserve the local branch as the implementation/review history. This post-release record is saved locally after publication; no second deployment is needed for recordkeeping.


**Live browser smoke check:** at 1280 × 720, Home, Bookclub/Apology, Library/The Wealth of Nations, Great Authors/Adam Smith, Notes drawer, Conversation Desk, Glossary/A priori and a posteriori and Help/Get Started all rendered at the public custom domain. Native wheel actions scrolled the left reading list and right reading text independently while the masthead, navigation and footer stayed in place. Desk retained its original document layout. No notes, reading completion, drafts or live account data were edited; no sign-in, enrichment, payment or device result is claimed.

## Typography correction requested

Joe reported that A looks oversized and requires zooming out, and that Bookclub's Year, filters & tools must be visible without a vertical scrolling control area. The live 984 × 779 measurements showed a 39px brand, 20px list titles and 167px of toolbar overflow. Computed CSS zoom and visualViewport.scale were both 1; the separate browser UI zoom setting was not measured.

Correction `ce046dc8d2bab8fb9f0b143b48b63688b28bfa92`, followed by constrained-height fix `57bf9a77558c7c9afbc08cf04189a0b54638326a`, is built from live `2b6431a` on `interface/reading-density`. The only production change is `assets/css/study-workspace.css`, final tested/reviewed blob `1f6c6d09271214cf57fd74d3580528d6385dccf0`. Newsreader/Inter and their loading remain unchanged. Brand is 30px desktop/28px phone, page headings 28px, list/empty guidance 16px, pane headings 20px, and readable prose 16px/1.55 up to 68ch. Phone inputs use 16px text and actions retain 44px targets. There is no CSS zoom/transform scaling.

Bookclub uses four filter columns plus a full-width action row on desktop; two filter columns plus wrapped actions on phone. Every original field, option, action, node and handler remains. At 984 × 779, expanded controls changed from 435px content in 268px to **259/259px**, panel 200→118px, with 321px of list space. At 390 × 844 they changed from 751px content in 224px to **369/369px**, panel 516→203.5px, with 120px of list space. Search and all year/filter/action controls are visible together, with no vertical toolbar scrolling.

Six meaningful toolbar checks failed before the type/toolbar correction; **387/387** passed afterward. Release review then reproduced a zero-height reading area at 390 × 500 with tools expanded. A non-shrinking **112px** reading floor uses the existing bounded work-region scrolling only when needed, while keeping the outer page still and toolbar free of internal scrolling. Eighteen focused assertions added four meaningful RED failures before that correction; the final **405/405** checks pass, including the original 377. Constrained visible reading areas are 112px and 111.914px. Normal desktop/phone dimensions remain unchanged; phone work is 352px wide and 488/488px scroll/client height with no fractional overflow or gutter. All **324** affected existing browser checks and **15 Node checks** pass, original saved-output digests match, and nine exact source guards remain unchanged. Index, all JavaScript, datasets, loading paths and Desk internals are untouched. Phone table columns remain reachable, including the last date-end option, with document scroll zero. One bounded desktop/phone visual batch is complete. The detector reports only generic warnings for pinned Inter and remains degraded by missing optional parsers. Physical phone, actual browser UI zoom and live services remain unchecked. Independent release review is approved: the Important collapsed-reading finding is resolved and no Critical, Important or Minor findings remain. Reviewed CSS and fixture blobs are pinned and match the committed implementation. **Published and verified:** release `95858a55cd3a4e8b4c3a8922370939291d502424`, parent `2b6431a`, has tree `ecb30aa280cc7271eae99e334aedae34c0513009`, exactly matching reviewed local snapshot `23b97f166e5377241db91665d837fcb5a3339648`. The six-file API payload reconstructed that tree exactly before a non-force update with an expected-head guard. A fresh fetch confirms origin/main and an empty tree diff. [Pages run 39083694547](https://github.com/garbledhamster/classics.ourstuff.space/actions/runs/39083694547) completed with successful build, deploy and report jobs. All **55/55** public checks passed against the new committed source; no source URLs, query parameters or hosting/authentication configuration changed.

Final public browser confirmation at 984 × 779 showed brand 30px, Home heading 28px, list 16px, expanded controls 259/259px client/scroll height, filter panel 118px, and View/Reset/Export on one row. The outer document stayed at scroll zero and height 779px. The live tab is left open; the redundant QA tab is closed. An initially cached stylesheet continued showing the earlier type after ordinary reloads, despite public byte checks passing. A bounded CDP Page.reload attempt stalled for roughly 16 minutes despite its requested timeout; subsequent ordinary reload showed the new CSS. Avoid CDP refresh/diagnostic calls for future checks; use the public resource comparison and ordinary browser reload. No reader records were edited.

To undo only this typography correction if needed, create a normal revert of public commit `95858a5` back toward prior live `2b6431a`, verify, and publish normally. Keep full-release recovery against `96892ac` separate. Post-publication evidence is saved locally without another deployment.

## Shared compact browse controls

Joe asked for Library and Great Authors to share Bookclub's compact filters/tools, including smaller actual filter boxes and search. This correction changes only `assets/css/study-workspace.css`: left-aligned search at most 28rem wide, 32px desktop form fields/actions, fine borders, restrained labels, plain checkbox/year controls and a clean alphabet strip. Phones retain 16px input text and 44px touch targets. Tool groups take their natural height, and a 112px reading floor remains available at constrained heights. No JavaScript, original markup, content, datasets, options, handlers or loading paths change. Conversation Desk stays unchanged.

Final local verification: **405/405 contained-scroll browser checks** and **15/15 Node preservation/behavior checks** pass. At 984 × 779, Bookclub search is 448 × 32px, its expanded controls are 237/237px, and the work area is 580/580px. At 390 × 844, its search is 352 × 44px with 16px text, expanded controls are 372/372px, and the work area is 488/488px. Library and Great Authors share the same 448 × 32px desktop search; their alphabet buttons are borderless 28px desktop/44px phone. With phone tools open, Library controls are 292/292px and Authors controls are 272/272px, leaving 112.84px and 133.03px reading areas. Both page work regions fit exactly (519/519px), and the outer document remains 844/844px at scroll zero. One bounded visual round plus a confirmation round is complete; the localhost fixture restored exact prior storage and its temporary tab is closed. No reader records were edited. The final layout detector returned no findings; this is a limited mechanical scan, not a certification. Physical phone and live account services remain unchecked.

Publication is pending. Earlier release evidence remains valid for the source it names.

## Recovery

Pre-release public source is `96892acf65e079a1efda1d35a6f8499bd59923e4`. Keep the original Git history and earlier recovery bundle. If a release defect requires rollback, create a normal revert commit for the released range, verify the restored deployable tree against that baseline, and push normally. Never force-push or discard reader data. No rollback or hosting/authentication change is currently requested.

## Joe's comments

“Looks good, let's get A live on classics.ourstuff.space. Keep all the existing pages, content, and loading exactly the same, and leave Conversation Desk as it is.”

“yeah like text can scroll but not the whole page, i hate when pages do tha”

Joe's sizing correction: “idk why it's so zoomed in but also on the bookclub the year filters & tools area shouldnt verticle it should all be in view, btu aslo why is the font so huge can you make the font more reasonable please it looks terribly huge in any view, i have to zoomout super far for it to look okay”

_Add release feedback here._