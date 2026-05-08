/* get-started.js — "GET STARTED" onboarding view. Self-contained IIFE; injects nav tab + view section; patches window.setView. */
(()=> {
  const GREAT_IDEAS = [
    "Angel","Animal","Aristocracy","Art","Astronomy","Beauty","Being","Cause","Chance",
    "Change","Citizen","Constitution","Courage","Custom and Convention","Definition",
    "Democracy","Desire","Dialectic","Duty","Education","Element","Emotion","Eternity",
    "Evolution","Experience","Family","Fate","Form","God","Good and Evil","Government",
    "Habit","Happiness","History","Honor","Hypothesis","Idea","Immortality","Induction",
    "Infinity","Justice","Knowledge","Labor","Language","Law","Liberty","Life and Death",
    "Logic","Love","Man","Mathematics","Matter","Mechanics","Medicine","Memory and Imagination",
    "Metaphysics","Mind","Monarchy","Nature","Necessity and Contingency","Oligarchy","One and Many",
    "Opinion","Opposition","Philosophy","Physics","Pleasure and Pain","Poetry","Principle",
    "Progress","Prophecy","Prudence","Punishment","Quality","Quantity","Reasoning","Relation",
    "Religion","Revolution","Rhetoric","Same and Other","Science","Sense","Sign and Symbol",
    "Sin","Slavery","Soul","Space","State","Temperance","Theology","Time","Truth","Tyranny",
    "Universal and Particular","Virtue and Vice","War and Peace","Wealth","Will","Wisdom","World"
  ];

  const YEAR_ONE = [
    { num:"1",  title:"Iliad", author:"Homer", note:"Begin at the beginning. The Iliad is the fountainhead of Western literature — wrath, honor, and mortality laid bare. Read it aloud whenever you can." },
    { num:"2",  title:"Odyssey", author:"Homer", note:"The companion epic. The hero's journey home is also the journey inward. Notice how Odysseus thinks before he acts." },
    { num:"3",  title:"Apology · Meno · Phaedo", author:"Plato", note:"Your first taste of Socratic dialogue. Ask yourself: what is knowledge? What is virtue? Can they be taught?" },
    { num:"4",  title:"Republic (Books I – IV)", author:"Plato", note:"What is justice? What is the ideal city? Plato's masterwork introduces Forms, the tripartite soul, and philosopher-kings." },
    { num:"5",  title:"Poetics", author:"Aristotle", note:"A short, dense treatise. Aristotle answers what Plato questioned: why tragedy matters and what it teaches us about being human." },
    { num:"6",  title:"History of the Peloponnesian War", author:"Thucydides", note:"The first rigorous work of historical analysis. Power, empire, and democracy collide. Pericles' Funeral Oration should be memorized." },
    { num:"7",  title:"Oedipus the King · Antigone", author:"Sophocles", note:"Two perfect tragedies. Read them back-to-back and feel the weight of fate, free will, and civic duty pressing against each other." },
    { num:"8",  title:"Nicomachean Ethics (Books I – III)", author:"Aristotle", note:"What is the good life? How do we cultivate virtue? Aristotle's ethics remain the most practical philosophical text ever written." }
  ];

  function escHtml(s){ return String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }
  function $(sel, root=document){ return root.querySelector(sel); }

  function buildNavTab(){
    const tabRow = $(".navRow");
    if (!tabRow || $("#tabGetStarted")) return;
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.id = "tabGetStarted";
    btn.type = "button";
    btn.setAttribute("aria-label", "Get started with the Great Conversation");
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 8 16 12 12 16"></polyline>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
      Get Started
    `;
    tabRow.appendChild(btn);
    btn.addEventListener("click", () => setGetStartedView());
  }

  function buildViewSection(){
    if ($("#getStartedView")) return;
    const anchor = $("#glossaryView") || $("#authorsView") || $("#planView") || $("#libraryView");
    if (!anchor) return;

    const section = document.createElement("section");
    section.id = "getStartedView";
    section.className = "view";
    section.setAttribute("aria-label", "Get Started — introduction to the Great Conversation");
    section.innerHTML = buildViewHTML();
    anchor.insertAdjacentElement("afterend", section);
    wireEvents(section);
  }

  function buildViewHTML(){
    const ideasHtml = GREAT_IDEAS.map(idea => `<span class="gsIdeaPill">${escHtml(idea)}</span>`).join("");
    const year1Html = YEAR_ONE.map(b => `
      <div class="gsReadingCard">
        <div class="gsReadingNum">Year 1 · Book ${escHtml(b.num)}</div>
        <div class="gsReadingTitle">${escHtml(b.title)}</div>
        <div class="gsReadingAuthor">${escHtml(b.author)}</div>
        <div class="gsReadingNote">${escHtml(b.note)}</div>
      </div>
    `).join("");    return `
<!-- ═══════════════════════════════════════════════════
     MASTHEAD
═══════════════════════════════════════════════════ -->
<div class="gsMasthead">
  <div class="gsEditionBug">Readers' Guide · Est. 1952</div>
  <h1 class="gsHeadline">Begin the<br>Great Conversation</h1>
  <hr class="gsMastheadRule">
  <p class="gsDeck">
    A complete guide to joining 2,500 years of dialogue between the greatest minds in Western civilization —
    and to using this ten-year reading tracker to navigate your journey.
  </p>
  <div class="gsByline">Written in the tradition of Mortimer J. Adler &amp; Robert Maynard Hutchins</div>
</div>

<!-- ═══════════════════════════════════════════════════
     QUICK-START ACTIONS
═══════════════════════════════════════════════════ -->
<div class="gsActionRow">
  <button class="btn" id="gsGoLibrary" type="button">
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
    Browse the Library
  </button>
  <button class="btn" id="gsGoPlan" type="button">
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
    Open My Bookclub Plan
  </button>
  <button class="btn" id="gsGoGlossary" type="button">
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><path d="M8 7h8"></path><path d="M8 11h8"></path><path d="M8 15h5"></path></svg>
    Explore the Glossary
  </button>
  <a class="btn" href="https://thinkingwest.com/10-year-reading-plan/" target="_blank" rel="noopener noreferrer">
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
    10-Year Plan Reference
  </a>
</div>

<!-- ═══════════════════════════════════════════════════
     THREE-COLUMN LEAD
═══════════════════════════════════════════════════ -->
<div class="gsLead" aria-label="Introduction to the Great Conversation">
  <div class="gsLeadCol">
    <div class="gsKicker">The Tradition</div>
    <h2 class="gsColTitle">What Is the Great Conversation?</h2>
    <p class="gsColText gsDropcap">
      In 1952, Mortimer J. Adler and Robert Maynard Hutchins published the
      <em>Great Books of the Western World</em> — a 54-volume set encompassing
      the foundational texts of Western civilization spanning 2,500 years.
    </p>
    <p class="gsColText">
      Adler observed something remarkable: these books were not isolated monuments.
      They were participants in a continuous, multigenerational argument about the
      deepest questions humanity has ever posed — about justice, beauty, knowledge,
      God, death, and the good life. He called this ongoing exchange
      <strong>The Great Conversation</strong>.
    </p>
    <p class="gsColText">
      Plato asks what justice is. Aristotle refines the answer. Cicero applies it to
      Rome. Aquinas reconciles it with Scripture. Hobbes overturns it. Kant rebuilds it.
      Mill extends it. Every great author writes knowing the others, and writes
      <em>against</em> them as much as with them.
    </p>
    <div class="gsPullQuote">
      <p class="gsPullQuoteText">"The tradition of the West is embodied in the Great Conversation that began in the dawn of history."</p>
      <div class="gsPullQuoteSource">— Robert Maynard Hutchins, 1952</div>
    </div>
    <p class="gsColText">
      To read the classics is not merely to absorb old information. It is to take your
      seat at a table that has been set for twenty-five centuries, and to add your own
      voice to the argument.
    </p>
  </div>

  <div class="gsLeadCol">
    <div class="gsKicker">The Case</div>
    <h2 class="gsColTitle">Why Read the Classics Now?</h2>
    <p class="gsColText gsDropcap">
      The classics are not relics. They are diagnostics. Every problem that torments
      modern civilization — democratic collapse, the nature of justice, the limits of
      science, the purpose of education — has been argued with more precision,
      depth, and intellectual honesty in these pages than in any contemporary source.
    </p>
    <p class="gsColText">
      Reading Homer teaches you what grief and glory cost. Reading Thucydides teaches
      you that democracies destroy themselves in predictable ways. Reading Plato teaches
      you that most of what passes for certainty is opinion. Reading Aristotle teaches
      you how to think in categories without losing the particular. Reading Dante teaches
      you that moral imagination is the prerequisite for moral action.
    </p>
    <p class="gsColText">
      The ten-year reading plan at the heart of this site is deliberately structured.
      It begins with the Greeks — Homer, the tragedians, the pre-Socratics, Plato,
      Aristotle — and spirals outward through Roman stoics, medieval theologians,
      Renaissance humanists, Enlightenment philosophers, and finally the moderns. Each
      year builds vocabulary for the next.
    </p>
    <div class="gsPullQuote">
      <p class="gsPullQuoteText">"Not to know what happened before you were born is to remain forever a child."</p>
      <div class="gsPullQuoteSource">— Cicero, Orator</div>
    </div>
    <p class="gsColText">
      Ten years is not long. Ten years of deliberate, joyful reading can transform the
      quality of your mind, your conversation, and your life.
    </p>
  </div>

  <div class="gsLeadCol">
    <div class="gsKicker">The Method</div>
    <h2 class="gsColTitle">Three Pillars of This Study</h2>
    <p class="gsColText gsDropcap">
      Adler gave us not just a reading list but a method. The three pillars of his
      approach — <strong>Great Books</strong>, <strong>Great Ideas</strong>, and
      <strong>Syntopical Reading</strong> — are all built into this app.
    </p>
    <p class="gsColText">
      <strong>Great Books</strong> are the ~400 primary texts catalogued in the Library.
      They range from Homer's epics to Einstein's relativity papers. Some are short
      dialogues (Plato's <em>Apology</em>); some are massive systems (Aquinas's
      <em>Summa Theologica</em>). The ten-year plan selects the most essential and
      orders them pedagogically.
    </p>
    <p class="gsColText">
      <strong>Great Ideas</strong> are Adler's 102 topical categories — from
      Angel to World — through which the same questions recur across different authors
      and centuries. The Glossary view on this site maps every term and connects it to
      relevant works in the library.
    </p>
    <p class="gsColText">
      <strong>Syntopical Reading</strong> means reading multiple authors on the same
      question simultaneously — discovering not only what each author says, but how
      they disagree. It is the highest and most rewarding form of reading.
    </p>
    <div class="gsPullQuote">
      <p class="gsPullQuoteText">"A good book is the precious life-blood of a master spirit."</p>
      <div class="gsPullQuoteSource">— John Milton, Areopagitica (1644)</div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════
     SECTION 1: APP NAVIGATION GUIDE
═══════════════════════════════════════════════════ -->
<div class="gsSection">
  <div class="gsSectionHeader">
    <span class="gsSectionNumber" aria-hidden="true">I</span>
    <h2 class="gsSectionTitle">Using This App — A Five-Minute Tour</h2>
  </div>
  <div class="gsSectionBody">
    <div class="gsBodyText" style="margin-bottom:16px;">
      <p>This site is a reading tracker, reference library, and intellectual diary — all in one. There is no account required to use the core features; your progress is stored locally in your browser. Sign in with Google to sync across devices.</p>
    </div>
    <div class="gsFeatureGrid">
      <div class="gsFeature">
        <div class="gsFeatureIcon">📚</div>
        <div class="gsFeatureTitle">Library</div>
        <div class="gsFeatureText">Browse all ~400 works in the Great Books catalog. Filter by Great Idea, author, title, or completion status. Click any card to open research tools — Open Library details, Wikipedia, Google, YouTube — and manage your reading status.</div>
      </div>
      <div class="gsFeature">
        <div class="gsFeatureIcon">📅</div>
        <div class="gsFeatureTitle">Bookclub</div>
        <div class="gsFeatureText">Your ten-year reading plan, organized year by year. Each card tracks status (Not Started, In Progress, Complete, Skipped), your current reading action (from Spine Read to Final Essay), start/finish dates, and linked notes.</div>
      </div>
      <div class="gsFeature">
        <div class="gsFeatureIcon">🏛</div>
        <div class="gsFeatureTitle">Great Authors</div>
        <div class="gsFeatureText">An author-centric view of the same catalog. Discover the breadth of each thinker's contribution — how many works they have in the plan, across which years, under which Great Ideas. Click to open deep research.</div>
      </div>
      <div class="gsFeature">
        <div class="gsFeatureIcon">🔍</div>
        <div class="gsFeatureTitle">Glossary</div>
        <div class="gsFeatureText">A full interactive Syntopicon index. Every one of Adler's 102 Great Ideas, searchable, with dictionary definitions, Wikipedia summaries, and cross-references to the works in your library. The connective tissue of the whole conversation.</div>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════
     SECTION 2: HOW TO READ — ADLER'S METHOD
═══════════════════════════════════════════════════ -->
<div class="gsSection">
  <div class="gsSectionHeader">
    <span class="gsSectionNumber" aria-hidden="true">II</span>
    <h2 class="gsSectionTitle">How to Read a Classic — The Adler Method</h2>
  </div>
  <div class="gsSectionBody">
    <div class="gsBodyCols">
      <div>
        <p class="gsBodyText">
          Mortimer Adler's <em>How to Read a Book</em> (1940, revised 1972) remains the
          definitive guide to reading great works. His central insight: there are four
          distinct levels of reading, each richer than the last. Most people never get
          past the second.
        </p>
        <p class="gsBodyText" style="margin-top:10px;">
          The app's ten-step <strong>Reading Sequence</strong> — available on every Bookclub
          card — is a practical implementation of Adler's method. Begin with the spine,
          end with your own essay. The goal is not speed but depth.
        </p>
        <div class="gsCallout" style="margin-top:14px;">
          <div class="gsCalloutTitle">The Reading Sequence (10 Steps)</div>
          <ul class="gsStepList" style="gap:6px;">
            <li style="font-size:.85rem; padding:6px 10px; border:1px solid var(--ink); display:flex; gap:8px; align-items:start;">
              <span style="font-weight:900;opacity:.5;min-width:18px;">1</span>
              <span><strong>Spine Read</strong> — Read the table of contents, preface, and index. Ask: what is this book about?</span>
            </li>
            <li style="font-size:.85rem; padding:6px 10px; border:1px solid var(--ink); display:flex; gap:8px; align-items:start;">
              <span style="font-weight:900;opacity:.5;min-width:18px;">2</span>
              <span><strong>Author Documentary/Biography</strong> — Who wrote this? Why? When? What were the circumstances?</span>
            </li>
            <li style="font-size:.85rem; padding:6px 10px; border:1px solid var(--ink); display:flex; gap:8px; align-items:start;">
              <span style="font-weight:900;opacity:.5;min-width:18px;">3</span>
              <span><strong>Pre-reading Breakdown</strong> — Skim chapters; identify the major arguments and structure.</span>
            </li>
            <li style="font-size:.85rem; padding:6px 10px; border:1px solid var(--ink); display:flex; gap:8px; align-items:start;">
              <span style="font-weight:900;opacity:.5;min-width:18px;">4</span>
              <span><strong>Audiobook (First Pass)</strong> — Absorb the whole work. Don't stop to look things up. Follow the argument.</span>
            </li>
            <li style="font-size:.85rem; padding:6px 10px; border:1px solid var(--ink); display:flex; gap:8px; align-items:start;">
              <span style="font-weight:900;opacity:.5;min-width:18px;">5</span>
              <span><strong>Deep Read</strong> — Read slowly, pencil in hand. Underline, question, and annotate every page.</span>
            </li>
            <li style="font-size:.85rem; padding:6px 10px; border:1px solid var(--ink); display:flex; gap:8px; align-items:start;">
              <span style="font-weight:900;opacity:.5;min-width:18px;">6</span>
              <span><strong>Discussion / Seminar</strong> — Find a reading partner or group. Argue about what the author really means.</span>
            </li>
            <li style="font-size:.85rem; padding:6px 10px; border:1px solid var(--ink); display:flex; gap:8px; align-items:start;">
              <span style="font-weight:900;opacity:.5;min-width:18px;">7</span>
              <span><strong>Audiobook (Second Pass)</strong> — Hear the text again after deep engagement. You will hear a different book.</span>
            </li>
            <li style="font-size:.85rem; padding:6px 10px; border:1px solid var(--ink); display:flex; gap:8px; align-items:start;">
              <span style="font-weight:900;opacity:.5;min-width:18px;">8</span>
              <span><strong>Research</strong> — Consult secondary sources: commentaries, critical essays, encyclopedia entries.</span>
            </li>
            <li style="font-size:.85rem; padding:6px 10px; border:1px solid var(--ink); display:flex; gap:8px; align-items:start;">
              <span style="font-weight:900;opacity:.5;min-width:18px;">9</span>
              <span><strong>Great Conversation Note</strong> — Write your own Great Conversation entry using the Notes Drawer.</span>
            </li>
            <li style="font-size:.85rem; padding:6px 10px; border:1px solid var(--ink); display:flex; gap:8px; align-items:start;">
              <span style="font-weight:900;opacity:.5;min-width:18px;">10</span>
              <span><strong>Final Essay</strong> — Write a one-to-three page essay on the work's central argument. This completes the cycle.</span>
            </li>
          </ul>
        </div>
      </div>
      <div>
        <div class="gsCallout">
          <div class="gsCalloutTitle">Adler's Four Levels of Reading</div>
          <div class="gsAdlerStages">
            <div class="gsAdlerStage">
              <div class="gsAdlerStageNum">I</div>
              <div class="gsAdlerStageName">Elementary</div>
              <div class="gsAdlerStageDesc">What does this sentence say? Decoding at the literal level. Most reading education stops here.</div>
            </div>
            <div class="gsAdlerStage">
              <div class="gsAdlerStageNum">II</div>
              <div class="gsAdlerStageName">Inspectional</div>
              <div class="gsAdlerStageDesc">What is this book about as a whole? Systematic skimming: preface, contents, index, sample chapters.</div>
            </div>
            <div class="gsAdlerStage">
              <div class="gsAdlerStageNum">III</div>
              <div class="gsAdlerStageName">Analytical</div>
              <div class="gsAdlerStageDesc">What is the author saying in detail, and is it true? The slow, complete, critical reading of a single work.</div>
            </div>
            <div class="gsAdlerStage">
              <div class="gsAdlerStageNum">IV</div>
              <div class="gsAdlerStageName">Syntopical</div>
              <div class="gsAdlerStageDesc">What do many authors say about the same question? Reading multiple books together, constructing your own framework.</div>
            </div>
          </div>
        </div>
        <div class="gsPullQuote" style="margin-top:16px;">
          <p class="gsPullQuoteText">"The person who says he knows what he thinks but cannot express it usually does not know what he thinks."</p>
          <div class="gsPullQuoteSource">— Mortimer J. Adler, How to Read a Book</div>
        </div>
        <div class="gsCallout" style="margin-top:16px;">
          <div class="gsCalloutTitle">Using the Notes Drawer</div>
          <p style="font-size:.87rem; line-height:1.55; color:var(--ink2);">
            Every book in the plan has a linked notes panel. Open it from any card with <strong>Notes</strong>.
            Select a note type — Quote, Reflection, Great Idea, Essay — to keep your reading journal
            organized. Notes sync to the cloud when you sign in. They are the raw material of
            your own contribution to the Great Conversation.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════
     SECTION 3: YEAR ONE READING LIST
═══════════════════════════════════════════════════ -->
<div class="gsSection">
  <div class="gsSectionHeader">
    <span class="gsSectionNumber" aria-hidden="true">III</span>
    <h2 class="gsSectionTitle">Year One — Where to Begin</h2>
  </div>
  <div class="gsSectionBody">
    <p class="gsBodyText" style="margin-bottom:16px;">
      The ten-year plan opens with the ancient Greeks because they invented the questions.
      Every subsequent thinker — Roman, medieval, Renaissance, modern — is in dialogue with
      Homer, Plato, and Aristotle. Begin here; these eight works will give you the conceptual
      vocabulary for everything that follows.
    </p>
    <div class="gsReadingList">
      ${year1Html}
    </div>
    <div class="gsPullQuote" style="margin-top:18px;">
      <p class="gsPullQuoteText">"Wonder is the beginning of wisdom."</p>
      <div class="gsPullQuoteSource">— Aristotle, Metaphysics</div>
    </div>
    <div class="gsCallout" style="margin-top:0;">
      <div class="gsCalloutTitle">Practical Advice for Year One</div>
      <p style="font-size:.88rem; line-height:1.6; color:var(--ink2);">
        Read the <em>Iliad</em> in the Fagles translation (Penguin Classics). Read Plato in the
        Cooper edition (Hackett). For Aristotle, the Hackett <em>Nicomachean Ethics</em> translated
        by Irwin is ideal for beginners. Keep a notebook — not a digital one, a physical one. Write
        the questions the text raises for you before you look up the answers. The questions are more
        valuable than the answers at this stage. Set aside one hour per day. In a year, you will have
        read more primary philosophy and literature than most graduate students.
      </p>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════
     SECTION 4: THE 102 GREAT IDEAS
═══════════════════════════════════════════════════ -->
<div class="gsSection">
  <div class="gsSectionHeader">
    <span class="gsSectionNumber" aria-hidden="true">IV</span>
    <h2 class="gsSectionTitle">The 102 Great Ideas — Adler's Syntopicon</h2>
  </div>
  <div class="gsSectionBody">
    <p class="gsBodyText" style="margin-bottom:14px;">
      In the <em>Syntopicon</em>, Adler identified 102 recurring themes — "Great Ideas" —
      that run through the entire corpus of great books. Every passage in every great book
      was indexed under one or more of these terms. They are the connective tissue of
      the Great Conversation. Open the <strong>Glossary</strong> view to explore each idea
      with dictionary definitions, Wikipedia summaries, and links to related works.
    </p>
    <div class="gsIdeaGrid">
      ${ideasHtml}
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════
     SECTION 5: BOOKCLUB STATUS & TRACKING
═══════════════════════════════════════════════════ -->
<div class="gsSection">
  <div class="gsSectionHeader">
    <span class="gsSectionNumber" aria-hidden="true">V</span>
    <h2 class="gsSectionTitle">Tracking Your Progress — The Bookclub Plan</h2>
  </div>
  <div class="gsSectionBody">
    <div class="gsBodyCols">
      <div>
        <p class="gsBodyText">
          The Bookclub view organizes all ~300 plan entries by year. Each card represents one work
          and carries full metadata: author, year of publication, Great Ideas tags, tier classification,
          and your personal reading state.
        </p>
        <p class="gsBodyText" style="margin-top:10px;">
          You can filter by year (1–10), by tier (Primary / Secondary), by Great Idea, or by tracking status.
          You can sort by reading year, publication date, author, title, or by your own notes count.
        </p>
        <table class="gsTable" style="margin-top:14px;">
          <thead>
            <tr><th>Status</th><th>Meaning</th></tr>
          </thead>
          <tbody>
            <tr><td>📖 Not Started</td><td>On your list; you haven't begun yet.</td></tr>
            <tr><td>⏳ In Progress</td><td>Currently reading. Set a start date on the card.</td></tr>
            <tr><td>✅ Complete</td><td>Finished. Set a finish date. Celebrate.</td></tr>
            <tr><td>⏭ Skipped</td><td>Deferred for now. You can return to it.</td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <div class="gsCallout">
          <div class="gsCalloutTitle">Card Actions — Quick Reference</div>
          <table class="gsTable">
            <thead><tr><th>Button</th><th>What It Does</th></tr></thead>
            <tbody>
              <tr><td>Research</td><td>Opens search: Google, YouTube, Open Library, Gutenberg, Wikipedia</td></tr>
              <tr><td>Notes</td><td>Opens the Notes Drawer linked to this specific work</td></tr>
              <tr><td>Great Conversation</td><td>Opens the community comments thread for this work</td></tr>
              <tr><td>Go to Plan</td><td>Jumps from Library view to this work's plan card</td></tr>
              <tr><td>Details</td><td>Fetches cover art, description, and edition info from Open Library</td></tr>
            </tbody>
          </table>
        </div>
        <div class="gsCallout" style="margin-top:12px;">
          <div class="gsCalloutTitle">Cloud Sync</div>
          <p style="font-size:.87rem; line-height:1.55; color:var(--ink2);">
            All data is stored in <strong>localStorage</strong> by default — no account needed.
            Sign in with Google (via the Sign In button in the top nav) to sync your reading progress,
            notes, and settings across multiple devices using Firebase. Your data is private.
            Use the Manual Sync button to force an immediate sync at any time.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════
     SECTION 6: FREQUENTLY ASKED QUESTIONS
═══════════════════════════════════════════════════ -->
<div class="gsSection">
  <div class="gsSectionHeader">
    <span class="gsSectionNumber" aria-hidden="true">VI</span>
    <h2 class="gsSectionTitle">Questions &amp; Answers</h2>
  </div>
  <div class="gsSectionBody">
    <div class="gsBodyCols">
      <div>
        <ol class="gsStepList">
          <li class="gsStep">
            <span class="gsStepNum">?</span>
            <div>
              <div class="gsStepTitle">Do I need to read every word of every book?</div>
              <div class="gsStepText">No. Adler explicitly permits "inspectional" reading of some works — skimming for the argument. The plan distinguishes Primary texts (read completely) from Secondary (read selectively). Your Bookclub cards are marked with tier.</div>
            </div>
          </li>
          <li class="gsStep">
            <span class="gsStepNum">?</span>
            <div>
              <div class="gsStepTitle">What translation should I use?</div>
              <div class="gsStepText">The plan assumes English-language readers. For Greeks: Fagles (Penguin) for Homer and Sophocles; Cooper edition (Hackett) for Plato; Irwin or Ross for Aristotle. For Dante: the Hollander dual-language edition. Project Gutenberg has free versions of most works — find them via the Research button on any card.</div>
            </div>
          </li>
          <li class="gsStep">
            <span class="gsStepNum">?</span>
            <div>
              <div class="gsStepTitle">How much time should I set aside?</div>
              <div class="gsStepText">Adler estimated ~1,000 pages per year for the plan — roughly 3 pages per day, or one hour of careful reading. The ten-year structure allows for life. If you fall behind, don't stop; just continue. The conversation has been waiting 2,500 years; it will wait for you too.</div>
            </div>
          </li>
        </ol>
      </div>
      <div>
        <ol class="gsStepList" start="4">
          <li class="gsStep">
            <span class="gsStepNum">?</span>
            <div>
              <div class="gsStepTitle">What if I find a book boring or too hard?</div>
              <div class="gsStepText">Read it anyway — at least the first thirty pages. Many books that seem impenetrable on first contact become luminous once you have more context from other books in the plan. Difficulty is usually a signal that the book is teaching you something your existing framework cannot yet accommodate. That is precisely why you should continue.</div>
            </div>
          </li>
          <li class="gsStep">
            <span class="gsStepNum">?</span>
            <div>
              <div class="gsStepTitle">Is there a reading group or community?</div>
              <div class="gsStepText">The Great Conversation comment feature (accessible from any card) allows you to add your own annotations and responses to a shared thread. For external communities, look for St. John's College's online programs, the Aquinas Institute, and the Great Books Foundation — all offer structured reading groups.</div>
            </div>
          </li>
          <li class="gsStep">
            <span class="gsStepNum">?</span>
            <div>
              <div class="gsStepTitle">My data is gone — what happened?</div>
              <div class="gsStepText">Data lives in localStorage by default. Clearing browser history, using private/incognito mode, or using a different browser will make it invisible. Sign in with Google to protect your progress in the cloud. You can also export your full progress as CSV or JSON using the Export button in the Bookclub view.</div>
            </div>
          </li>
        </ol>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════
     COLOPHON
═══════════════════════════════════════════════════ -->
<div class="gsColophon">
  <strong>classics.ourstuff.space</strong> — A ten-year reading tracker for the Great Books of the Western World. ·
  Built in the spirit of Mortimer J. Adler's <em>How to Read a Book</em> (1940) and the <em>Syntopicon</em> (1952). ·
  Data: <span class="mono">library.json</span> (~400 works) · <span class="mono">bookclub.json</span> (ten-year plan) ·
  <span class="mono">syntopicon_terms.json</span> (102 Great Ideas). ·
  All reading progress stored locally; sign in to sync across devices.
</div>
    `;
  }

  function wireEvents(section){
    section.querySelector("#gsGoLibrary")?.addEventListener("click", () => {
      if (typeof setView === "function") setView("library");
    });
    section.querySelector("#gsGoPlan")?.addEventListener("click", () => {
      if (typeof setView === "function") setView("plan");
    });
    section.querySelector("#gsGoGlossary")?.addEventListener("click", () => {
      if (typeof setView === "function") setView("glossary");
    });
  }

  function setGetStartedView(){
    if (window.state) window.state.view = "get-started";
    const views = ["#libraryView","#planView","#authorsView","#glossaryView","#getStartedView"];
    views.forEach(sel => document.querySelector(sel)?.classList.toggle("on", sel === "#getStartedView"));
    const tabs = ["#tabLibrary","#tabPlan","#tabAuthors","#tabGlossary","#tabGetStarted"];
    tabs.forEach(sel => document.querySelector(sel)?.classList.remove("tabOn"));
    document.querySelector("#tabGetStarted")?.classList.add("tabOn");
    const planName = document.querySelector("#planName");
    if (planName) planName.textContent = "Get Started";
  }

  function installSetViewPatch(){
    const original = window.setView;
    if (typeof original !== "function" || original._getStartedPatched) return;
    function patched(view){
      if (view === "get-started") return setGetStartedView();
      document.querySelector("#getStartedView")?.classList.remove("on");
      document.querySelector("#tabGetStarted")?.classList.remove("tabOn");
      return original(view);
    }
    patched._getStartedPatched = true;
    window.setView = patched;
  }

  function init(){
    buildNavTab();
    buildViewSection();
    installSetViewPatch();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
