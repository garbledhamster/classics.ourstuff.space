# The Classics

The Classics is a reader-owned study desk for the Great Books tradition.

It is built for people who want more than a static book list. The site helps a serious reader move between the library, the ten-year reading plan, author context, great ideas, notes, progress tracking, and long-form reflection without losing the thread of what they are reading.

## What The Site Is For

Use this site when you want to:

- browse the Great Books library by title, author, or idea
- follow the ten-year Great Conversation bookclub plan
- track where you are in a book and what your next reading task is
- keep notes, quotes, reflections, and essays attached to specific works
- trace a theme or Great Idea across multiple authors
- draft your own thinking in the Conversation Desk instead of outsourcing it

This is not meant to replace the reading. It is meant to help you read better, remember more, and build your own argument over time.

## How To Use The Site Properly

### 1. Start In One Of Two Ways

If you are new, the cleanest entry points are:

- `Library` if you already know the work or author you want
- `Bookclub` if you want the guided ten-year path

Use `Library` when you want freedom.
Use `Bookclub` when you want sequence.

### 2. Open A Work And Set Your Reading Direction

From a library card or plan card, open the work and decide what you are doing next.

The app is designed around a reading sequence like this:

1. get context
2. do a first reading
3. annotate and reflect
4. return for a deeper reading
5. connect the work to larger ideas

Treat the task controls as your reading desk, not as productivity theater. They exist to keep you moving through a real book.

### 3. Use The Bookclub Plan As Structure

The `Bookclub` view organizes the reading plan by year, tier, and progress.

- `Core` works are the essential path
- `Extended` works deepen the year
- `Optional` works are there when you want more

If you want the strongest default workflow, start with `Year 1` and move in order. The plan is designed to build on itself.

### 4. Use Great Authors And Great Ideas To Cross-Reference

The site is not only a list of books. It is also a way to move sideways through the tradition.

- `Great Authors` lets you see each author's place in the plan
- `Great Idea` filters help you follow permanent questions across centuries
- the glossary and linked references help you bridge confusion without abandoning the book

When a theme starts recurring, stop thinking in terms of isolated books. Start thinking in terms of a conversation.

### 5. Keep Notes While You Read

Open the `Notes Drawer` from the top navigation when you want to capture:

- notes
- quotes
- excerpts
- reflections
- essays
- great idea connections

Good usage pattern:

1. create a note from the current work
2. tag it to the book
3. record the exact selection or section
4. write your own reaction before looking elsewhere

You can also filter, archive, export, import, and bulk-manage notes later.

### 6. Use Conversation Desk For Your Own Thinking

`Conversation Desk` is where you turn reading into argument.

Use it to draft:

- central questions
- claims
- objections
- source notes
- essays or contribution drafts

The intended posture is reader first, writer second. Let the books pressure your thinking. Then use the desk to make your position clearer.

### 7. Use The Timer When You Need A Session Boundary

The timer in the header is there for focused reading sessions.

Use it when you want:

- a short inspectional read
- a 25-minute focused pass
- a bounded note-taking session

The timer supports saved settings and resumes from local state.

## Account And Sync Model

The site is local-first.

Without an account:

- your reading progress is stored in your browser
- your notes stay in your browser
- your settings stay in your browser

With an account on the deployed site:

- your profile can sync through Firebase
- notes, progress, tasks, dates, timer settings, and Conversation Desk state can sync across devices
- you can manually trigger sync with the sync button

Important behavior:

- `localhost` and `file://` use local reader simulation
- local simulation supports email-style local sign-in only
- Google sign-in and real cloud auth are for deployed cloud mode
- local donation flow is simulated; deployed donation flow uses Stripe

If you only use one browser on one device, you do not need an account.

## A Good First Session

If you want a simple first run:

1. open `Bookclub`
2. stay in `Year 1`
3. choose a short work such as Plato
4. mark your current reading status
5. create one note and one reflection
6. open `Conversation Desk` and write the central question the work raises for you

That is enough to understand the core rhythm of the site.

## Repo Structure

This repository has two layers:

- `src/` is the deployable web root
- the repo root contains the private Gitea workspace, local tooling, tests, agent docs, and project context

Inside `src/`:

- `index.html` is the app shell
- `assets/js/classics/` contains the reading desk modules
- `assets/css/` contains the visual system
- `data/library.json` is the library catalog
- `data/bookclub.json` and related data files drive the reading plan and supporting content

## Run The Site Locally

From the repo root:

```bash
npm run serve
```

Then open:

```text
http://localhost:4173
```

## Local Checks

From the repo root:

```bash
npm run test:syntax
npm run test:unit
npm run test:smoke
```

Or run the combined local check:

```bash
npm run test:local
```

## Maintenance Notes

When editing this project:

- treat `src/` as the public site payload
- keep the app reader-first and dense rather than marketing-heavy
- preserve the local-first data model
- do not turn the site into an AI writing substitute
- prefer names and modules that describe the reading workflow clearly

## In One Sentence

The Classics is a serious reading desk for people working through the Great Books, the ten-year plan, and their own notes and arguments over time.
