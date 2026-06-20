# Design Concept: The Classics Reading Desk

## Destination

The Classics should feel like a serious reader's working desk for the Ten-Year Great Conversation: Library, Bookclub, Great Authors, Glossary, Notes, Conversation Desk, timer, sync, and donation support in one durable static app.

The first screen should stay the app itself, not a landing page. A reader should immediately see where they are in the reading desk, move between the main surfaces, and take the next reading action.

## Product Shape

- **Library**: browse and search Works, filter by Great Idea, open Work details, launch Resource Links, start Notes, and jump into the Bookclub context.
- **Bookclub**: follow the Ten-Year Great Conversation by year, all-years view, tier, Great Idea, Reading Progress, Reading Stage, date, action, and note-related filters.
- **Great Authors**: scan authors alphabetically and use author identity as a route back into Works.
- **Glossary**: use Syntopicon terms as a map from ideas to references, dictionary/Wikipedia support, and related Works.
- **Notes Drawer**: keep reader-owned Notes close to the reading task, with search, filters, archive, import, export, and cross-device persistence.
- **Conversation Desk**: shape Notes and reading context into the reader's own argument, keeping the reader's voice and private context at the center.
- **Study Timer**: support focused reading sessions without becoming a productivity system.
- **Cloud Sync**: optional signed-in backup for private Reader Data.
- **Donation**: optional support path, never a paywall.

## Experience Principles

- The app points toward books, authors, terms, notes, and outside resources; it does not replace direct reading.
- Guidance should be practical and contextual, not instructional theater.
- Reader Data belongs to the reader and should be durable, portable, and private by default.
- The interface should be dense, newspaper-like, and work-focused rather than decorative.
- Controls should be visible, semantic, and repeat-use friendly on mobile and desktop.
- A Work should never feel isolated: it can connect to plan position, author, Great Ideas, Notes, Resource Links, and Conversation Desk drafts.
- The Conversation Desk should help the reader clarify their own contribution, not generate generic prose in place of thinking.

## Implementation Posture

- Keep the no-build static site unless the user explicitly approves a build-system change.
- Prefer incremental, behavior-first slices that leave the app usable after each change.
- Use existing app seams: data loading, state, storage, sync, view rendering, component controls, modals/drawers, and static data files.
- Keep future slice files out of `.agents/plans` until the slice breakdown is approved.

## Definition Of Done For The Destination

- A reader can open the app from a local HTTP server and use all primary surfaces without console-breaking errors.
- The reader can find a Work, understand its reading-plan context, choose a Reading Stage, open relevant Resource Links, and save progress.
- The reader can create, find, archive, export, import, and sync Notes.
- The reader can use the Glossary to move from a term or Great Idea back to related Works.
- The reader can draft in Conversation Desk from linked Works, authors, themes, Notes, and source cards.
- Optional sign-in sync and optional donation flows are clearly separated from the free local reading desk.
