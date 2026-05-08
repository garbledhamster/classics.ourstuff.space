/* get-started.js — "Get Started" newspaper-style landing page. */
(()=> {
  function $(sel, root){ return (root||document).querySelector(sel); }

  const GREAT_IDEAS_SAMPLE = [
    "Angel","Animal","Aristocracy","Art","Astronomy","Beauty","Being","Cause","Chance","Change",
    "Citizen","Constitution","Courage","Custom and Convention","Definition","Democracy","Desire",
    "Dialectic","Duty","Education","Element","Emotion","Equality","Eternity","Evolution",
    "Experience","Family","Fate","Form","God","Good and Evil","Government","Habit","Happiness",
    "History","Honor","Hypothesis","Idea","Immortality","Induction","Infinity","Judgment",
    "Justice","Knowledge","Labor","Language","Law","Liberty","Life and Death","Logic","Love",
    "Man","Mathematics","Matter","Mechanics","Medicine","Memory and Imagination","Metaphysics",
    "Mind","Monarchy","Nature","Necessity and Contingency","Oligarchy","One and Many","Opinion",
    "Opposition","Philosophy","Physics","Pleasure and Pain","Poetry","Principle","Progress",
    "Prophecy","Prudence","Punishment","Quality","Quantity","Reasoning","Relation","Religion",
    "Revolution","Rhetoric","Same and Other","Science","Sense","Sign and Symbol","Sin","Slavery",
    "Soul","Space","State","Temperance","Theology","Time","Truth","Tyranny and Despotism",
    "Universal and Particular","Virtue and Vice","War and Peace","Wealth","Will","Wisdom","World"
  ];

  function escapeHtml(s){
    return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
  }

  function buildGetStartedView(){
    const tabRow = $(".navRow");
    if (tabRow && !$("#tabGetStarted")) {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.id = "tabGetStarted";
      btn.type = "button";
      btn.setAttribute("aria-label", "Get started with the Great Conversation");
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle><polyline points="12 8 16 12 12 16"></polyline><line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        Get Started
      `;
      tabRow.appendChild(btn);
      btn.addEventListener("click", () => setGetStartedView());
    }

    if (!$("#getStartedView")) {
      const section = document.createElement("section");
      section.id = "getStartedView";
      section.className = "view";
      section.setAttribute("aria-label", "Get started view");
      section.innerHTML = buildGetStartedHTML();
      const afterEl = $("#glossaryView") || $("#authorsView") || $("#planView") || $("#libraryView");
      if (afterEl) afterEl.insertAdjacentElement("afterend", section);
      else document.body.appendChild(section);

      wireGetStartedEvents(section);
    }
  }

  function buildGetStartedHTML(){
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" }).toUpperCase();
    const ideaPills = GREAT_IDEAS_SAMPLE.map(idea =>
      `<button class="gsIdeaPill" type="button" data-gs-idea="${escapeHtml(idea)}">${escapeHtml(idea)}</button>`
    ).join("");

    return `
      <!-- ══ MASTHEAD ══════════════════════════════════════════ -->
      <div class="gsMasthead">
        <h1 class="gsFlag">The Great Conversation</h1>
        <hr class="gsFlagRule">
        <p class="gsEditionLine">Est. 450 B.C. &bull; Continued Daily &bull; ${escapeHtml(dateStr)} &bull; Great Books Edition</p>
        <p class="gsDeck">"The tradition of the West is embodied in the Great Conversation that began in the dawn of history and that continues to the present day." — Mortimer J. Adler</p>
      </div>

      <!-- ══ TOP STORY ═════════════════════════════════════════ -->
      <div class="gsTopStory">
        <div class="gsTopStoryMain">
          <div class="gsSectionLabel">Front Page</div>
          <h2 class="gsHeadline">A Twenty-Five-Century Dialogue You Are Invited to Join</h2>
          <div class="gsByline">By the Editors &bull; Classics.OurStuff.Space</div>
          <p class="gsBodyText gsDropCap">The Western intellectual tradition is not a museum. It is a living conversation — conducted across centuries, languages, and civilizations — about the questions that matter most: What is justice? What makes a good life? What do we owe one another? How should we be governed? What is the soul?</p>
          <p class="gsBodyText">From Plato's dialogues and Aristotle's treatises, through Dante, Shakespeare, Locke, Kant, and Darwin, to Tolstoy and Freud — each great mind enters the conversation already in progress, responds to predecessors, and sets the stage for successors. No single author holds all the answers. That is the point.</p>
          <p class="gsBodyText">Mortimer Adler and Robert Maynard Hutchins assembled the fifty-four-volume <em>Great Books of the Western World</em> (1952) to make this conversation accessible to any reader. They identified <strong>103 Great Ideas</strong> — the recurring themes that link every thinker to every other — and organized them in the Syntopicon, the first index of ideas in intellectual history.</p>
          <div class="gsPullQuote">
            "What is the purpose of education? To develop the intellect and free it for lifelong self-education."
            <div class="gsAttrib">— Mortimer J. Adler, The Paideia Proposal</div>
          </div>
          <p class="gsBodyText">This website is your reading companion for the Great Books Bookclub — a ten-year reading plan designed to take you through the essential works at a sustainable pace. You can track your progress, annotate your reactions, and follow the threads of any great idea across centuries of debate.</p>
        </div>
        <div class="gsTopStorySide">
          <div>
            <div class="gsSectionLabel">Inside This Edition</div>
            <ul style="list-style:none;padding:0;margin:0;font-size:0.88rem;line-height:1.6;">
              <li style="padding:6px 0;border-bottom:1px solid var(--ink);">▶ What Is the Great Conversation? .............. p.1</li>
              <li style="padding:6px 0;border-bottom:1px solid var(--ink);">▶ The 10-Year Reading Plan ...................... p.2</li>
              <li style="padding:6px 0;border-bottom:1px solid var(--ink);">▶ Who Was Mortimer Adler? ....................... p.3</li>
              <li style="padding:6px 0;border-bottom:1px solid var(--ink);">▶ How to Use This Website ....................... p.4</li>
              <li style="padding:6px 0;border-bottom:1px solid var(--ink);">▶ The 103 Great Ideas .......................... p.5</li>
              <li style="padding:6px 0;border-bottom:1px solid var(--ink);">▶ Where Should I Begin? ........................ p.6</li>
              <li style="padding:6px 0;">▶ Frequently Asked Questions ................... p.7</li>
            </ul>
          </div>
          <div>
            <div class="gsSectionLabel">At a Glance</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;">
              <div style="border:2px solid var(--ink);padding:10px;text-align:center;box-shadow:3px 3px 0 var(--ink);">
                <div style="font-family:'Newsreader',Georgia,serif;font-size:2.2rem;font-weight:900;line-height:1;">10</div>
                <div style="font-size:0.72rem;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;">Years</div>
              </div>
              <div style="border:2px solid var(--ink);padding:10px;text-align:center;box-shadow:3px 3px 0 var(--ink);">
                <div style="font-family:'Newsreader',Georgia,serif;font-size:2.2rem;font-weight:900;line-height:1;">103</div>
                <div style="font-size:0.72rem;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;">Great Ideas</div>
              </div>
              <div style="border:2px solid var(--ink);padding:10px;text-align:center;box-shadow:3px 3px 0 var(--ink);">
                <div style="font-family:'Newsreader',Georgia,serif;font-size:2.2rem;font-weight:900;line-height:1;">~130</div>
                <div style="font-size:0.72rem;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;">Works</div>
              </div>
              <div style="border:2px solid var(--ink);padding:10px;text-align:center;box-shadow:3px 3px 0 var(--ink);">
                <div style="font-family:'Newsreader',Georgia,serif;font-size:2.2rem;font-weight:900;line-height:1;">2500+</div>
                <div style="font-size:0.72rem;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;">Years of Ideas</div>
              </div>
            </div>
          </div>
          <div class="gsCtaBox">
            <div class="gsSectionLabel">Ready to Begin?</div>
            <p class="gsBodyText" style="font-size:0.84rem;">Jump into the 10-year reading plan or explore the library and glossary.</p>
            <button class="gsCtaBtn" type="button" data-gs-nav="plan">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              View Bookclub Plan
            </button>
            <button class="gsCtaBtn gsCtaBtnSecondary" type="button" data-gs-nav="library">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              Browse Library
            </button>
          </div>
        </div>
      </div>

      <!-- ══ THE 10-YEAR PLAN ══════════════════════════════════ -->
      <div class="gsTwoCol">
        <div class="gsTwoColMain">
          <div class="gsSectionLabel">The Plan — Page 2</div>
          <h2 class="gsHeadline">A Decade to Stretch the Mind</h2>
          <p class="gsBodyText">The ten-year reading plan is not designed to be "got through" as quickly as possible. It is a guide for lifelong mental growth: a disciplined way of reading works that are often over most people's heads, and therefore worth growing into. The aim is not merely to finish the list, but to read well enough that the books change you.</p>
          <p class="gsBodyText">Each year gathers works around a governing idea, while the readings inside that year move broadly in chronological order so you can feel the historical development of the conversation. Across the full decade, the plan ranges through law, politics, theology, epic, tragedy, science, psychology, rhetoric, and poetry so that no one discipline becomes the whole of your education.</p>
          <div class="gsPullQuote">
            "Not to know the great works of the past is to be a cultural orphan, adrift in time."
            <div class="gsAttrib">— Clifton Fadiman</div>
          </div>
          <p class="gsBodyText">The bookclub tracker on this site lets you mark your progress through each stage: pre-reading research, first listening, first and second reads, analysis, discussion, reflection, and integration. Each card tracks one work's complete lifecycle in your reading life.</p>
        </div>
        <div class="gsTwoColSide">
          <div class="gsSectionLabel">Year by Year</div>
          <div style="display:flex;flex-direction:column;gap:0;">
            ${[
              ["Year 1","Foundations of Law &amp; Morality","Political and moral life begin with Plato, Aristotle, Augustine, Machiavelli, and modern founding texts on liberty, revolution, and democracy."],
              ["Year 2","Ancient Epics &amp; Modern Liberty","Epic, tragedy, history, atomism, stoicism, and Mill's defense of liberty place literature and ethics side by side."],
              ["Year 3","History, Theology &amp; the Human Condition","War, law, faith, and freedom meet in Thucydides, Aquinas, Milton, Kant, and Dostoevsky."],
              ["Year 4","Scientific Revolution &amp; Psychological Depth","Questions of knowledge and method lead into Galileo, Bacon, Descartes, Newton, Euripides, and Melville."],
              ["Year 5","Nature, Being &amp; Narrative Synthesis","Soul, species, substance, empire, and long-form narrative converge in Aristotle, Virgil, Spinoza, Darwin, and Tolstoy."],
              ["Year 6","Origins, Scriptural Roots &amp; Modernity","Biblical beginnings, Homeric wandering, Shakespearean comedy, Hegelian history, and Kierkegaardian inwardness reshape first principles."],
              ["Year 7","Wisdom, Mathematics &amp; Aesthetic Judgment","Job, Symposium, Archimedes, Epictetus, Dante, and Kant test how truth, beauty, and goodness are judged."],
              ["Year 8","Rhetoric, Psychology &amp; the Power of Habit","Persuasion, teaching, sovereignty, inner life, and spiritual struggle animate Aristotle, Augustine, Hobbes, James, and Goethe."],
              ["Year 9","Social Systems &amp; Modern Disillusionment","Law, electricity, civilization, manners, and artistic self-consciousness define the move into modern scientific and literary life."],
              ["Year 10","The Order of Nature &amp; the Modern Wasteland","Cosmos, corruption, pilgrimage, kingship, and cultural exhaustion bring the decade to its final reckoning."]
            ].map(([y,t,d]) => `
              <div style="padding:10px 0;border-bottom:1px solid var(--ink);">
                <div style="font-size:0.7rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);">${y}</div>
                <div style="font-weight:900;font-size:0.92rem;margin:2px 0;">${t}</div>
                <div style="font-size:0.82rem;line-height:1.45;color:var(--ink2);">${d}</div>
              </div>`).join("")}
          </div>
          <button class="gsCtaBtn" type="button" data-gs-nav="plan" style="margin-top:12px;width:100%;justify-content:center;">
            Open Bookclub Plan →
          </button>
        </div>
      </div>

      <!-- ══ THREE COLUMNS: ADLER / SYNTOPICON / HOW-TO ═══════ -->
      <div class="gsThreeCol">
        <div class="gsCol">
          <div class="gsSectionLabel">Biography — Page 3</div>
          <h2 class="gsSubhead">Who Was Mortimer Adler?</h2>
          <p class="gsBodyText">Mortimer Jerome Adler (1902–2001) was an American philosopher, educator, and popularizer of the Great Books. A self-described "public philosopher," he spent his career arguing that the Western tradition's greatest works belong to everyone — not just scholars.</p>
          <p class="gsBodyText">Together with Robert Maynard Hutchins, president of the University of Chicago, Adler developed the Great Books curriculum and co-edited the fifty-four-volume <em>Great Books of the Western World</em> (Encyclopædia Britannica, 1952). His most audacious project was the Syntopicon — an index of 3,000 topics organized under 102 chapters (103 ideas by modern count) — which took ten years to compile and required reading every page of every book.</p>
          <p class="gsBodyText">Adler also wrote <em>How to Read a Book</em> (1940, revised 1972), arguably the most important guide to serious reading ever published, and founded the Paideia Group, which advocated for a classical liberal arts education for all students regardless of background.</p>
          <div class="gsRule"></div>
          <div style="font-size:0.8rem;font-style:italic;color:var(--muted);">Key works: <em>How to Read a Book</em> (1940), <em>The Idea of Freedom</em> (1958), <em>The Paideia Proposal</em> (1982), <em>Adler's Philosophical Dictionary</em> (1995).</div>
        </div>
        <div class="gsCol">
          <div class="gsSectionLabel">Reference — Page 3</div>
          <h2 class="gsSubhead">What Is the Syntopicon?</h2>
          <p class="gsBodyText">The Syntopicon (from Greek: <em>syntopikos</em>, "of the same place") is the two-volume index at the heart of <em>Great Books of the Western World</em>. It organizes all the ideas in the entire set by 103 Great Ideas — from Angel to World — and for each idea lists the specific passages in the Great Books where that idea appears and is debated.</p>
          <p class="gsBodyText">Want to trace what Plato, Aristotle, Aquinas, Hobbes, Locke, and Kant each said about Justice? The Syntopicon shows you exactly where to look. It turns 32,000 pages of text into a navigable intellectual network.</p>
          <p class="gsBodyText">This website recreates the Syntopicon as a digital glossary. Click <strong>Glossary</strong> in the top navigation to explore the ~2,000 Syntopicon terms and the 103 Great Ideas, each linked to related books in the library.</p>
          <div class="gsPullQuote" style="font-size:0.95rem;">
            "The Syntopicon is the greatest index ever compiled."
            <div class="gsAttrib">— Encyclopedia Britannica</div>
          </div>
        </div>
        <div class="gsCol">
          <div class="gsSectionLabel">Tutorial — Page 4</div>
          <h2 class="gsSubhead">How to Use This Website</h2>
          <ol class="gsStepList">
            <li>
              <div>
                <strong>Library</strong> — Browse all ~130 Great Books works. Filter by Great Idea, search by author or title, and click any card to open its detail drawer with book info, reading tasks, and notes.
              </div>
            </li>
            <li>
              <div>
                <strong>Bookclub</strong> — Follow the 10-year reading plan. Each year's readings are organized by author and tier (Core, Extended, Optional). Use the task tracker on each card to move through the reading sequence.
              </div>
            </li>
            <li>
              <div>
                <strong>Great Authors</strong> — See all authors alphabetically with counts of their works in the plan.
              </div>
            </li>
            <li>
              <div>
                <strong>Glossary</strong> — Browse the Syntopicon index of ~2,000 terms plus the 103 Great Ideas. Each term links to its references, a dictionary definition, Wikipedia summary, and related library works.
              </div>
            </li>
            <li>
              <div>
                <strong>Notes</strong> — Open the Notes Drawer from the top nav to keep personal reading notes, quotes, and reflections linked to specific books. Sign in to sync across devices.
              </div>
            </li>
          </ol>
        </div>
      </div>

      <!-- ══ 103 GREAT IDEAS ═══════════════════════════════════ -->
      <div class="gsBanner">
        <div class="gsSectionLabel" style="color:var(--paper);border-color:var(--paper);">The Core Vocabulary — Page 5</div>
        <h2 class="gsHeadline" style="color:var(--paper);">The 103 Great Ideas: The Vocabulary of the Great Conversation</h2>
        <p class="gsBodyText" style="color:var(--paper);max-width:80ch;">Every great thinker from Plato to Freud was engaged with some subset of these ideas. Adler identified them as the permanent themes of the Western tradition. Click any idea below to find it in the Glossary.</p>
      </div>
      <div style="border:2px solid var(--ink);padding:16px;margin-bottom:20px;box-shadow:5px 5px 0 var(--ink);">
        <div class="gsIdeaGrid">${ideaPills}</div>
      </div>

      <!-- ══ WHERE TO BEGIN ════════════════════════════════════ -->
      <div>
        <div class="gsSectionLabel">Reading Paths — Page 6</div>
        <h2 class="gsHeadline" style="margin-bottom:14px;">Where Should I Begin? Four Paths Into the Conversation</h2>
      </div>
      <div class="gsPathRow">
        <div class="gsPathCard">
          <div class="gsPathNum">A</div>
          <div class="gsPathTitle">The First-Timer</div>
          <p class="gsPathText">Start with Plato's <em>Apology</em> and <em>Crito</em> — short, gripping, and immediately relevant. Then try Aristotle's <em>Nicomachean Ethics</em> Book I for a different temperament. You will have read two of the greatest minds in 60 pages.</p>
        </div>
        <div class="gsPathCard">
          <div class="gsPathNum">B</div>
          <div class="gsPathTitle">The Story Reader</div>
          <p class="gsPathText">Begin with Homer's <em>Iliad</em> — epic, emotional, and foundational. Follow it with Sophocles' <em>Oedipus Rex</em>. Great ideas arrive wrapped in great narrative. Tolstoy's <em>War and Peace</em> awaits you in Year 9.</p>
        </div>
        <div class="gsPathCard">
          <div class="gsPathNum">C</div>
          <div class="gsPathTitle">The Idea Hunter</div>
          <p class="gsPathText">Pick a Great Idea that matters to you — Justice, Freedom, God, Democracy — and use the Glossary to find all the books where it appears. Read those passages. This is the Syntopicon method at its purest.</p>
        </div>
        <div class="gsPathCard">
          <div class="gsPathNum">D</div>
          <div class="gsPathTitle">The Committed Beginner</div>
          <p class="gsPathText">Start at Year 1 of the Bookclub plan and follow it in order. The plan is designed to build: later works presuppose earlier ones. Adler's <em>How to Read a Book</em> is your first companion.</p>
        </div>
      </div>

      <!-- ══ HOW TO READ A GREAT BOOK ══════════════════════════ -->
      <div class="gsTwoCol">
        <div class="gsTwoColMain">
          <div class="gsSectionLabel">Technique — Page 6</div>
          <h2 class="gsHeadline">How to Read a Great Book: The Four Levels</h2>
          <p class="gsBodyText gsDropCap">Adler's <em>How to Read a Book</em> distinguishes four levels of reading that apply perfectly to the Great Books. You need not reach Level Four every time — but knowing the levels tells you how deep you are going and what the work demands.</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0;">
            ${[
              ["I. Elementary","You understand the words and can follow the sentences. The prerequisite for everything else."],
              ["II. Inspectional","You survey the whole book: title, preface, chapter headings, first and last paragraphs. You understand the structure before diving in."],
              ["III. Analytical","You read the whole work, identify the author's main arguments, formulate their questions, and assess their answers. This is the level of serious study."],
              ["IV. Syntopical","You read many books on the same theme, identify their shared questions, and construct a conversation between them. This is exactly what the Syntopicon enables."]
            ].map(([lev,desc]) => `
              <div style="border:2px solid var(--ink);padding:12px;box-shadow:3px 3px 0 var(--ink);">
                <div style="font-weight:900;font-size:0.88rem;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:6px;">${lev}</div>
                <div style="font-size:0.84rem;line-height:1.5;">${desc}</div>
              </div>`).join("")}
          </div>
          <p class="gsBodyText">For most books in the plan, aim for Level III on your first pass and Level IV — through the Glossary and the plan — over time. Do not worry about understanding everything at once. The tradition rewards re-reading above all else.</p>
        </div>
        <div class="gsTwoColSide">
          <div class="gsSectionLabel">Companion Tools</div>
          <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px;">
            ${[
              ["📚","Reading Tasks","Each book card has a task tracker: Inspect → First Read → Annotate → Second Read → Reflect → Discuss. Work through them at your own pace."],
              ["🗒️","Notes Drawer","Keep reading notes linked to specific books. Create quotes, reflections, great ideas, or essays. Sign in to sync across devices."],
              ["🔍","Glossary Lookup","Search any term or idea in the Glossary. Each entry links to dictionary definitions, Wikipedia, and related books."],
              ["👥","Great Authors","See all 60+ authors in the plan with their works. Click an author to filter the library to their contributions."],
              ["⏱️","Reading Timer","Use the built-in timer (clock icon in the header) to track sessions. Stay focused and log your reading time."]
            ].map(([icon,title,desc]) => `
              <div style="border:1px solid var(--ink);padding:10px;display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:start;">
                <div style="font-size:1.4rem;line-height:1;">${icon}</div>
                <div>
                  <div style="font-weight:900;font-size:0.85rem;margin-bottom:3px;">${title}</div>
                  <div style="font-size:0.8rem;line-height:1.45;color:var(--ink2);">${desc}</div>
                </div>
              </div>`).join("")}
          </div>
        </div>
      </div>

      <!-- ══ FAQ ════════════════════════════════════════════════ -->
      <div style="border:2px solid var(--ink);padding:20px;margin-bottom:20px;box-shadow:5px 5px 0 var(--ink);">
        <div class="gsSectionLabel">Frequently Asked Questions — Page 7</div>
        <h2 class="gsSubhead" style="margin-bottom:14px;">Readers Ask. We Answer.</h2>
        ${[
          ["Do I need to read every book?","No. The plan distinguishes Core (essential), Extended (highly recommended), and Optional works. If time is short, focus on Core. Even reading one book from each year gives you a foundation."],
          ["How long does each book take?","It varies enormously — from 30 minutes for a Platonic dialogue to several months for the complete works of Aristotle. The plan is designed for about 20–30 minutes of reading per day."],
          ["What if I don't understand something?","That is normal and expected. Adler advises reading all the way through on a first pass without stopping. Understanding comes in layers. Use the Glossary, Wikipedia, and the discussion community to fill gaps."],
          ["Do I need to read in order?","The plan is designed to be followed in order because later books build on earlier ones. But the Syntopicon method lets you jump directly to a topic that interests you."],
          ["Which translation should I use?","This is a real and important question. The site links to standard editions. For Homer, the Fagles or Lattimore translations are widely loved. For Plato, Grube/Cooper or the Hackett editions. The specific translation matters less than reading seriously."],
          ["Can I use this site without an account?","Yes. All tracking is saved locally in your browser. Create an account only if you want to sync across devices using the cloud backup feature."],
          ["What are the 103 Great Ideas?","They are the permanent themes identified by Adler: concepts like Justice, Knowledge, God, Soul, and Truth that recur across all the Great Books. Browse them in the Glossary or click any idea pill above to explore."],
          ["Is this a course? Do I get a certificate?","No. This is self-directed education at its purest. The reward is the reading itself — and the transformation it produces in how you think."]
        ].map(([q,a]) => `
          <div class="gsFaqItem">
            <div class="gsFaqQ">Q: ${escapeHtml(q)}</div>
            <div class="gsFaqA">${escapeHtml(a)}</div>
          </div>`).join("")}
      </div>

      <!-- ══ FOOTER CTA ═════════════════════════════════════════ -->
      <div class="gsBanner" style="text-align:center;">
        <h2 class="gsHeadline" style="color:var(--paper);">The Conversation Has Been Going for 2,500 Years.<br>Your Chair Has Been Waiting.</h2>
        <p class="gsBodyText" style="color:var(--paper);max-width:60ch;margin:10px auto 0;">"To be a student of great books is to take your place in one of the longest and most important conversations in the history of the human race." — Mortimer Adler</p>
        <div style="margin-top:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button class="gsCtaBtn" type="button" data-gs-nav="plan">
            Start the Reading Plan →
          </button>
          <button class="gsCtaBtn gsCtaBtnSecondary" type="button" data-gs-nav="glossary">
            Explore the Glossary →
          </button>
          <button class="gsCtaBtn gsCtaBtnSecondary" type="button" data-gs-nav="library">
            Browse the Library →
          </button>
        </div>
      </div>
    `;
  }

  function wireGetStartedEvents(section){
    section.addEventListener("click", e => {
      const navBtn = e.target.closest("[data-gs-nav]");
      if (navBtn) {
        const target = navBtn.dataset.gsNav;
        if (target === "glossary" && typeof window.setView === "function") window.setView("glossary");
        else if (typeof window.setView === "function") window.setView(target);
        return;
      }
      const ideaPill = e.target.closest("[data-gs-idea]");
      if (ideaPill) {
        const idea = ideaPill.dataset.gsIdea;
        if (typeof window.setView === "function") window.setView("glossary");
        setTimeout(() => {
          const glossaryQ = document.getElementById("glossaryQ");
          if (glossaryQ) {
            glossaryQ.value = idea;
            glossaryQ.dispatchEvent(new Event("input", { bubbles:true }));
          }
        }, 150);
      }
    });
  }

  function setGetStartedView(){
    if (window.state) window.state.view = "get-started";
    ["#libraryView","#planView","#authorsView","#glossaryView","#getStartedView"].forEach(sel =>
      document.querySelector(sel)?.classList.toggle("on", sel === "#getStartedView")
    );
    ["#tabLibrary","#tabPlan","#tabAuthors","#tabGlossary","#tabGetStarted"].forEach(sel =>
      document.querySelector(sel)?.classList.remove("tabOn")
    );
    document.getElementById("tabGetStarted")?.classList.add("tabOn");
    const planName = document.getElementById("planName");
    if (planName) planName.textContent = "Get Started";
  }

  function installGetStartedPatch(){
    const original = window.setView;
    if (typeof original !== "function" || original._gsPatched) return;
    function patched(view){
      if (view === "get-started") return setGetStartedView();
      document.querySelector("#getStartedView")?.classList.remove("on");
      document.querySelector("#tabGetStarted")?.classList.remove("tabOn");
      return original(view);
    }
    patched._gsPatched = true;
    window.setView = patched;
  }

  function init(){
    buildGetStartedView();
    installGetStartedPatch();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
