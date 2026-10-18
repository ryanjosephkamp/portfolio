# Piece briefs

The briefs for the ten pieces Ryan locked on October 18, 2026, in his build order, ready to paste into a new session opened on this repo. [../PIECES.md](../PIECES.md) has the rails; [../CONCEPTS.md](../CONCEPTS.md) has the rows. Run them three at a time, in the waves below, so the Mac keeps enough memory for each one's browser checks.

## Wave 1

### Lineage (Xhigh, port 4211)

```
Build a piece for my workshop in ryanjosephkamp/portfolio: an unbelievably cool web page, not a portfolio. It is one of ten pieces whose whole job is to push what people think a web page can do. You have about an hour. Your tech stack is not limited. Be inventive and audacious, explore what nobody has explored, and have fun.

PIECE: LINEAGE (slug lineage)
PREMISE: The page's own design is its DNA: type, color, layout, spacing and motion are genes. Each round the page shows two children of itself; the visitor picks one, it mutates, and within a dozen rounds they have bred a design nobody drew. The genome lives in the address, so a visitor can send someone the page they evolved.
SIGNATURE: Pick the child you like. A visitor should be doing it within five seconds of arriving. Everything else (the look, the stack, the details, what happens next) is yours.
WORTH KNOWING, take it or leave it: Random designs are mostly ugly or unreadable, so the craft is in the gene space: every generation keeps readable sizes and text contrast of at least 4.5 to 1. Karl Sims's Genetic Images (1993) and Picbreeder (2007) bred pictures; this breeds the page you are reading.

THIS IS NOT A PORTFOLIO: the portfolio rules (docs/PLAYBOOK.md, docs/FACTS.md, the ten projects) do not apply, and nothing on the page needs to be about me. docs/PIECES.md has the full rails; in short:
- static files with relative URLs on GitHub Pages: no server, no custom headers; commit any built output;
- works the moment it opens, on a phone and a desktop, by touch, mouse and keyboard; a camera, microphone or motion permission only after a tap, and the piece still works without it;
- nothing flashes more than three times a second, and every animation has a prefers-reduced-motion path that still shows the piece;
- American English, and anything stated as fact is true;
- open-licensed fonts, code and assets, self-hosted and listed with their licenses in your folder's README.md;
- a small "A piece by Ryan Kamp" line linking to https://ryanjosephkamp.github.io/;
- browser storage keys start with "lineage:".

WHERE: your own worktree. Run `git fetch origin && git switch -c piece/lineage origin/main`. Every file goes inside pieces/lineage/. Preview on port 4211 (a launch config named lineage). Commit with the identity in CLAUDE.md.

CHECK: see it working in a real browser at desktop and phone widths, with an empty console and no sideways scroll, and drive the signature by pointer, touch and keyboard. Other piece sessions share this Mac: run one headless browser at a time and close it when you are done.

DONE WHEN: `node tools/us-spelling.mjs pieces/lineage` prints nothing, the branch is pushed, and a pull request to main is open that changes only pieces/lineage/, with a screenshot, two sentences on what the piece does, and what a visitor should try first. Reply with the link and the one thing you are proudest of, and send the same report to the operator session.

When my usage reaches 98%, find a natural stopping point.
```

### Crumple (Xhigh, port 4212)

```
Build a piece for my workshop in ryanjosephkamp/portfolio: an unbelievably cool web page, not a portfolio. It is one of ten pieces whose whole job is to push what people think a web page can do. You have about an hour. Your tech stack is not limited. Be inventive and audacious, explore what nobody has explored, and have fun.

PIECE: CRUMPLE (slug crumple)
PREMISE: The whole page is one sheet of paper with real, readable writing on it. A visitor can crumple it into a ball, throw it, and smooth it out again with every crease still there; fold it right and it becomes a paper plane that flies.
SIGNATURE: Grab any corner and crush it. A visitor should be doing it within five seconds of arriving. Everything else (the look, the stack, the details, what happens next) is yours.
WORTH KNOWING, take it or leave it: Tightly crushed cloth passes through itself unless collisions are handled, text blurs at low resolution, and phone GPUs may need a coarser sheet. If the crumpling and smoothing are done early, the plane is the stretch goal.

THIS IS NOT A PORTFOLIO: the portfolio rules (docs/PLAYBOOK.md, docs/FACTS.md, the ten projects) do not apply, and nothing on the page needs to be about me. docs/PIECES.md has the full rails; in short:
- static files with relative URLs on GitHub Pages: no server, no custom headers; commit any built output;
- works the moment it opens, on a phone and a desktop, by touch, mouse and keyboard; a camera, microphone or motion permission only after a tap, and the piece still works without it;
- nothing flashes more than three times a second, and every animation has a prefers-reduced-motion path that still shows the piece;
- American English, and anything stated as fact is true;
- open-licensed fonts, code and assets, self-hosted and listed with their licenses in your folder's README.md;
- a small "A piece by Ryan Kamp" line linking to https://ryanjosephkamp.github.io/;
- browser storage keys start with "crumple:".

WHERE: your own worktree. Run `git fetch origin && git switch -c piece/crumple origin/main`. Every file goes inside pieces/crumple/. Preview on port 4212 (a launch config named crumple). Commit with the identity in CLAUDE.md.

CHECK: see it working in a real browser at desktop and phone widths, with an empty console and no sideways scroll, and drive the signature by pointer, touch and keyboard. Other piece sessions share this Mac: run one headless browser at a time and close it when you are done.

DONE WHEN: `node tools/us-spelling.mjs pieces/crumple` prints nothing, the branch is pushed, and a pull request to main is open that changes only pieces/crumple/, with a screenshot, two sentences on what the piece does, and what a visitor should try first. Reply with the link and the one thing you are proudest of, and send the same report to the operator session.

When my usage reaches 98%, find a natural stopping point.
```

### Tenant (Xhigh, port 4213)

```
Build a piece for my workshop in ryanjosephkamp/portfolio: an unbelievably cool web page, not a portfolio. It is one of ten pieces whose whole job is to push what people think a web page can do. You have about an hour. Your tech stack is not limited. Be inventive and audacious, explore what nobody has explored, and have fun.

PIECE: TENANT (slug tenant)
PREMISE: A small creature lives inside the page's actual layout. It walks along the lines of text, climbs paragraphs, hides behind images and carries words off to rearrange sentences, animated procedurally so no two walks are alike.
SIGNATURE: Drag a word to it and see what it does with it. A visitor should be doing it within five seconds of arriving. Everything else (the look, the stack, the details, what happens next) is yours.
WORTH KNOWING, take it or leave it: Its ground is the real text (line boxes and element boxes), so it has to keep up when the window resizes and the text reflows. Desktop pets like Neko (1989) and Shimeji walked along window edges; here the world is the writing. Cute is not enough: it needs a behavior that surprises.

THIS IS NOT A PORTFOLIO: the portfolio rules (docs/PLAYBOOK.md, docs/FACTS.md, the ten projects) do not apply, and nothing on the page needs to be about me. docs/PIECES.md has the full rails; in short:
- static files with relative URLs on GitHub Pages: no server, no custom headers; commit any built output;
- works the moment it opens, on a phone and a desktop, by touch, mouse and keyboard; a camera, microphone or motion permission only after a tap, and the piece still works without it;
- nothing flashes more than three times a second, and every animation has a prefers-reduced-motion path that still shows the piece;
- American English, and anything stated as fact is true;
- open-licensed fonts, code and assets, self-hosted and listed with their licenses in your folder's README.md;
- a small "A piece by Ryan Kamp" line linking to https://ryanjosephkamp.github.io/;
- browser storage keys start with "tenant:".

WHERE: your own worktree. Run `git fetch origin && git switch -c piece/tenant origin/main`. Every file goes inside pieces/tenant/. Preview on port 4213 (a launch config named tenant). Commit with the identity in CLAUDE.md.

CHECK: see it working in a real browser at desktop and phone widths, with an empty console and no sideways scroll, and drive the signature by pointer, touch and keyboard. Other piece sessions share this Mac: run one headless browser at a time and close it when you are done.

DONE WHEN: `node tools/us-spelling.mjs pieces/tenant` prints nothing, the branch is pushed, and a pull request to main is open that changes only pieces/tenant/, with a screenshot, two sentences on what the piece does, and what a visitor should try first. Reply with the link and the one thing you are proudest of, and send the same report to the operator session.

When my usage reaches 98%, find a natural stopping point.
```

## Wave 2

### Broken (Xhigh, port 4214)

```
Build a piece for my workshop in ryanjosephkamp/portfolio: an unbelievably cool web page, not a portfolio. It is one of ten pieces whose whole job is to push what people think a web page can do. You have about an hour. Your tech stack is not limited. Be inventive and audacious, explore what nobody has explored, and have fun.

PIECE: BROKEN (slug broken)
PREMISE: A page made entirely of the ways web pages break: broken-image icons, half-loaded fonts, garbled text, jumping layouts, endless spinners. A visitor can fix it or break it further, and the most broken version turns out to be the most beautiful.
SIGNATURE: Drag the broken pieces until they snap into a working page, then break it again; it never fails the same way twice. A visitor should be doing it within five seconds of arriving. Everything else (the look, the stack, the details, what happens next) is yours.
WORTH KNOWING, take it or leave it: In its first seconds it must read as broken on purpose, or visitors will think the site is down and leave. JODI's wwwwwwwww.jodi.org (1995) looked broken as net art; this one makes the failures playable.

THIS IS NOT A PORTFOLIO: the portfolio rules (docs/PLAYBOOK.md, docs/FACTS.md, the ten projects) do not apply, and nothing on the page needs to be about me. docs/PIECES.md has the full rails; in short:
- static files with relative URLs on GitHub Pages: no server, no custom headers; commit any built output;
- works the moment it opens, on a phone and a desktop, by touch, mouse and keyboard; a camera, microphone or motion permission only after a tap, and the piece still works without it;
- nothing flashes more than three times a second, and every animation has a prefers-reduced-motion path that still shows the piece;
- American English, and anything stated as fact is true;
- open-licensed fonts, code and assets, self-hosted and listed with their licenses in your folder's README.md;
- a small "A piece by Ryan Kamp" line linking to https://ryanjosephkamp.github.io/;
- browser storage keys start with "broken:".

WHERE: your own worktree. Run `git fetch origin && git switch -c piece/broken origin/main`. Every file goes inside pieces/broken/. Preview on port 4214 (a launch config named broken). Commit with the identity in CLAUDE.md.

CHECK: see it working in a real browser at desktop and phone widths, with an empty console and no sideways scroll, and drive the signature by pointer, touch and keyboard. Other piece sessions share this Mac: run one headless browser at a time and close it when you are done.

DONE WHEN: `node tools/us-spelling.mjs pieces/broken` prints nothing, the branch is pushed, and a pull request to main is open that changes only pieces/broken/, with a screenshot, two sentences on what the piece does, and what a visitor should try first. Reply with the link and the one thing you are proudest of, and send the same report to the operator session.

When my usage reaches 98%, find a natural stopping point.
```

### Motion Only (Xhigh, port 4215)

```
Build a piece for my workshop in ryanjosephkamp/portfolio: an unbelievably cool web page, not a portfolio. It is one of ten pieces whose whole job is to push what people think a web page can do. You have about an hour. Your tech stack is not limited. Be inventive and audacious, explore what nobody has explored, and have fun.

PIECE: MOTION ONLY (slug motion-only)
PREMISE: Every frame of the page is random noise, yet a visitor reads it easily, because the words and pictures exist only in how the noise moves. Pause it, or take a screenshot, and there is nothing there.
SIGNATURE: The page asks you to take a screenshot, and the screenshot is static. A visitor should be doing it within five seconds of arriving. Everything else (the look, the stack, the details, what happens next) is yours.
WORTH KNOWING, take it or leave it: It stays a trick unless the page builds something with it. Moving noise can be hard to watch: keep it under three flashes a second, and make the reduced-motion path show the content plainly. The real text stays in the page for screen readers.

THIS IS NOT A PORTFOLIO: the portfolio rules (docs/PLAYBOOK.md, docs/FACTS.md, the ten projects) do not apply, and nothing on the page needs to be about me. docs/PIECES.md has the full rails; in short:
- static files with relative URLs on GitHub Pages: no server, no custom headers; commit any built output;
- works the moment it opens, on a phone and a desktop, by touch, mouse and keyboard; a camera, microphone or motion permission only after a tap, and the piece still works without it;
- nothing flashes more than three times a second, and every animation has a prefers-reduced-motion path that still shows the piece;
- American English, and anything stated as fact is true;
- open-licensed fonts, code and assets, self-hosted and listed with their licenses in your folder's README.md;
- a small "A piece by Ryan Kamp" line linking to https://ryanjosephkamp.github.io/;
- browser storage keys start with "motion-only:".

WHERE: your own worktree. Run `git fetch origin && git switch -c piece/motion-only origin/main`. Every file goes inside pieces/motion-only/. Preview on port 4215 (a launch config named motion-only). Commit with the identity in CLAUDE.md.

CHECK: see it working in a real browser at desktop and phone widths, with an empty console and no sideways scroll, and drive the signature by pointer, touch and keyboard. Other piece sessions share this Mac: run one headless browser at a time and close it when you are done.

DONE WHEN: `node tools/us-spelling.mjs pieces/motion-only` prints nothing, the branch is pushed, and a pull request to main is open that changes only pieces/motion-only/, with a screenshot, two sentences on what the piece does, and what a visitor should try first. Reply with the link and the one thing you are proudest of, and send the same report to the operator session.

When my usage reaches 98%, find a natural stopping point.
```

### Ctrl+F (Xhigh, port 4216)

```
Build a piece for my workshop in ryanjosephkamp/portfolio: an unbelievably cool web page, not a portfolio. It is one of ten pieces whose whole job is to push what people think a web page can do. You have about an hour. Your tech stack is not limited. Be inventive and audacious, explore what nobody has explored, and have fun.

PIECE: CTRL+F (slug ctrl-f)
PREMISE: A page played with the browser's own controls instead of anything drawn on it: the find bar opens hidden doors, the back button rewinds time, resizing the window widens a keyhole, zooming reveals writing too small to see, and printing gives you the last page. A second page hides in View Source and the developer console.
SIGNATURE: "Press Ctrl+F and type a word you find on the wall." (Command+F on a Mac.) A visitor should be doing it within five seconds of arriving. Everything else (the look, the stack, the details, what happens next) is yours.
WORTH KNOWING, take it or leave it: `hidden="until-found"` and the `beforematch` event let find-in-page reveal things, but support varies by browser, and phones bury their find bars in a menu, so every control needs a second way in. The clues must be fair.

THIS IS NOT A PORTFOLIO: the portfolio rules (docs/PLAYBOOK.md, docs/FACTS.md, the ten projects) do not apply, and nothing on the page needs to be about me. docs/PIECES.md has the full rails; in short:
- static files with relative URLs on GitHub Pages: no server, no custom headers; commit any built output;
- works the moment it opens, on a phone and a desktop, by touch, mouse and keyboard; a camera, microphone or motion permission only after a tap, and the piece still works without it;
- nothing flashes more than three times a second, and every animation has a prefers-reduced-motion path that still shows the piece;
- American English, and anything stated as fact is true;
- open-licensed fonts, code and assets, self-hosted and listed with their licenses in your folder's README.md;
- a small "A piece by Ryan Kamp" line linking to https://ryanjosephkamp.github.io/;
- browser storage keys start with "ctrl-f:".

WHERE: your own worktree. Run `git fetch origin && git switch -c piece/ctrl-f origin/main`. Every file goes inside pieces/ctrl-f/. Preview on port 4216 (a launch config named ctrl-f). Commit with the identity in CLAUDE.md.

CHECK: see it working in a real browser at desktop and phone widths, with an empty console and no sideways scroll, and drive the signature by pointer, touch and keyboard. Other piece sessions share this Mac: run one headless browser at a time and close it when you are done.

DONE WHEN: `node tools/us-spelling.mjs pieces/ctrl-f` prints nothing, the branch is pushed, and a pull request to main is open that changes only pieces/ctrl-f/, with a screenshot, two sentences on what the piece does, and what a visitor should try first. Reply with the link and the one thing you are proudest of, and send the same report to the operator session.

When my usage reaches 98%, find a natural stopping point.
```

## Wave 3

### Feedback (Xhigh, port 4217)

```
Build a piece for my workshop in ryanjosephkamp/portfolio: an unbelievably cool web page, not a portfolio. It is one of ten pieces whose whole job is to push what people think a web page can do. You have about an hour. Your tech stack is not limited. Be inventive and audacious, explore what nobody has explored, and have fun.

PIECE: FEEDBACK (slug feedback)
PREMISE: Video feedback, the analog art of pointing a camera at its own monitor, made into an instrument: nudge the "camera" a degree and the screen blooms into spirals, flames and living cells. Open the page on a phone and point its camera at the page on a laptop, and the loop becomes real, across two devices.
SIGNATURE: Drag to twist the camera and watch patterns grow out of nothing. A visitor should be doing it within five seconds of arriving. Everything else (the look, the stack, the details, what happens next) is yours.
WORTH KNOWING, take it or leave it: Feedback strobes easily, so the three-flashes limit needs a hard guard in the code, not just care. It is a shader demo unless the controls feel like real knobs and a camera on a tripod. The phone camera is optional and asked for only after a tap.

THIS IS NOT A PORTFOLIO: the portfolio rules (docs/PLAYBOOK.md, docs/FACTS.md, the ten projects) do not apply, and nothing on the page needs to be about me. docs/PIECES.md has the full rails; in short:
- static files with relative URLs on GitHub Pages: no server, no custom headers; commit any built output;
- works the moment it opens, on a phone and a desktop, by touch, mouse and keyboard; a camera, microphone or motion permission only after a tap, and the piece still works without it;
- nothing flashes more than three times a second, and every animation has a prefers-reduced-motion path that still shows the piece;
- American English, and anything stated as fact is true;
- open-licensed fonts, code and assets, self-hosted and listed with their licenses in your folder's README.md;
- a small "A piece by Ryan Kamp" line linking to https://ryanjosephkamp.github.io/;
- browser storage keys start with "feedback:".

WHERE: your own worktree. Run `git fetch origin && git switch -c piece/feedback origin/main`. Every file goes inside pieces/feedback/. Preview on port 4217 (a launch config named feedback). Commit with the identity in CLAUDE.md.

CHECK: see it working in a real browser at desktop and phone widths, with an empty console and no sideways scroll, and drive the signature by pointer, touch and keyboard. Other piece sessions share this Mac: run one headless browser at a time and close it when you are done.

DONE WHEN: `node tools/us-spelling.mjs pieces/feedback` prints nothing, the branch is pushed, and a pull request to main is open that changes only pieces/feedback/, with a screenshot, two sentences on what the piece does, and what a visitor should try first. Reply with the link and the one thing you are proudest of, and send the same report to the operator session.

When my usage reaches 98%, find a natural stopping point.
```

### Vessel (Max, port 4218)

```
Build a piece for my workshop in ryanjosephkamp/portfolio: an unbelievably cool web page, not a portfolio. It is one of ten pieces whose whole job is to push what people think a web page can do. You have one to two hours. Your tech stack is not limited. Be inventive and audacious, explore what nobody has explored, and have fun.

PIECE: VESSEL (slug vessel)
PREMISE: Each browser window is a glass of water. Drag the window across the screen and the water inside sloshes; open a second window, set it below the first, and the water pours down into it. On a phone, tilt it.
SIGNATURE: Shake the window. A visitor should be doing it within five seconds of arriving. Everything else (the look, the stack, the details, what happens next) is yours.
WORTH KNOWING, take it or leave it: Windows can find each other with BroadcastChannel and read where they are from screenX and screenY every frame. Safari reports position coarsely, a second window has to be opened by a click, and iPhones ask permission for motion, so tilt starts after a tap. Bjørn Staal's linked windows (2023) shared one picture across windows; nothing we know of moves matter between them.

THIS IS NOT A PORTFOLIO: the portfolio rules (docs/PLAYBOOK.md, docs/FACTS.md, the ten projects) do not apply, and nothing on the page needs to be about me. docs/PIECES.md has the full rails; in short:
- static files with relative URLs on GitHub Pages: no server, no custom headers; commit any built output;
- works the moment it opens, on a phone and a desktop, by touch, mouse and keyboard; a camera, microphone or motion permission only after a tap, and the piece still works without it;
- nothing flashes more than three times a second, and every animation has a prefers-reduced-motion path that still shows the piece;
- American English, and anything stated as fact is true;
- open-licensed fonts, code and assets, self-hosted and listed with their licenses in your folder's README.md;
- a small "A piece by Ryan Kamp" line linking to https://ryanjosephkamp.github.io/;
- browser storage keys start with "vessel:".

WHERE: your own worktree. Run `git fetch origin && git switch -c piece/vessel origin/main`. Every file goes inside pieces/vessel/. Preview on port 4218 (a launch config named vessel). Commit with the identity in CLAUDE.md.

CHECK: see it working in a real browser at desktop and phone widths, with an empty console and no sideways scroll, and drive the signature by pointer, touch and keyboard. Other piece sessions share this Mac: run one headless browser at a time and close it when you are done.

DONE WHEN: `node tools/us-spelling.mjs pieces/vessel` prints nothing, the branch is pushed, and a pull request to main is open that changes only pieces/vessel/, with a screenshot, two sentences on what the piece does, and what a visitor should try first. Reply with the link and the one thing you are proudest of, and send the same report to the operator session.

When my usage reaches 98%, find a natural stopping point.
```

### Handscroll (Max, port 4219)

```
Build a piece for my workshop in ryanjosephkamp/portfolio: an unbelievably cool web page, not a portfolio. It is one of ten pieces whose whole job is to push what people think a web page can do. You have one to two hours. Your tech stack is not limited. Be inventive and audacious, explore what nobody has explored, and have fun.

PIECE: HANDSCROLL (slug handscroll)
PREMISE: The page is a painted handscroll that never ends. Scroll sideways and it unrolls a continuous landscape full of small figures going about their day, generated from position so the same stretch looks the same for everyone; zoom into any figure and it is doing something specific.
SIGNATURE: Unroll it. A visitor should be doing it within five seconds of arriving. Everything else (the look, the stack, the details, what happens next) is yours.
WORTH KNOWING, take it or leave it: Generated scenes get samey after a minute, so give it a journey: seasons, day into night, weather. Take the format, not any particular painting; a shallow borrowed style reads as pastiche.

THIS IS NOT A PORTFOLIO: the portfolio rules (docs/PLAYBOOK.md, docs/FACTS.md, the ten projects) do not apply, and nothing on the page needs to be about me. docs/PIECES.md has the full rails; in short:
- static files with relative URLs on GitHub Pages: no server, no custom headers; commit any built output;
- works the moment it opens, on a phone and a desktop, by touch, mouse and keyboard; a camera, microphone or motion permission only after a tap, and the piece still works without it;
- nothing flashes more than three times a second, and every animation has a prefers-reduced-motion path that still shows the piece;
- American English, and anything stated as fact is true;
- open-licensed fonts, code and assets, self-hosted and listed with their licenses in your folder's README.md;
- a small "A piece by Ryan Kamp" line linking to https://ryanjosephkamp.github.io/;
- browser storage keys start with "handscroll:".

WHERE: your own worktree. Run `git fetch origin && git switch -c piece/handscroll origin/main`. Every file goes inside pieces/handscroll/. Preview on port 4219 (a launch config named handscroll). Commit with the identity in CLAUDE.md.

CHECK: see it working in a real browser at desktop and phone widths, with an empty console and no sideways scroll, and drive the signature by pointer, touch and keyboard. Other piece sessions share this Mac: run one headless browser at a time and close it when you are done.

DONE WHEN: `node tools/us-spelling.mjs pieces/handscroll` prints nothing, the branch is pushed, and a pull request to main is open that changes only pieces/handscroll/, with a screenshot, two sentences on what the piece does, and what a visitor should try first. Reply with the link and the one thing you are proudest of, and send the same report to the operator session.

When my usage reaches 98%, find a natural stopping point.
```

## Wave 4

### Wildcard (Max, port 4220)

Run one, or two side by side and keep the better one; the second takes port 4221.

```
Build a piece for my workshop in ryanjosephkamp/portfolio: an unbelievably cool web page, not a portfolio. It is one of ten pieces whose whole job is to push what people think a web page can do. You have one to two hours. Your tech stack is not limited. Be inventive and audacious, explore what nobody has explored, and have fun.

PIECE: yours to invent. The whole brief is one line: make a web page do something people don't think a web page can do. Pick the idea, the name, the look and the stack yourself. Nine other pieces are taken (see the Pieces rows in docs/CONCEPTS.md); go somewhere none of them goes. Name it early: its slug is the folder and branch name below.

THIS IS NOT A PORTFOLIO: the portfolio rules (docs/PLAYBOOK.md, docs/FACTS.md, the ten projects) do not apply, and nothing on the page needs to be about me. docs/PIECES.md has the full rails; in short:
- static files with relative URLs on GitHub Pages: no server, no custom headers; commit any built output;
- works the moment it opens, on a phone and a desktop, by touch, mouse and keyboard; a camera, microphone or motion permission only after a tap, and the piece still works without it;
- nothing flashes more than three times a second, and every animation has a prefers-reduced-motion path that still shows the piece;
- American English, and anything stated as fact is true;
- open-licensed fonts, code and assets, self-hosted and listed with their licenses in your folder's README.md;
- a small "A piece by Ryan Kamp" line linking to https://ryanjosephkamp.github.io/;
- browser storage keys start with "<your slug>:".

WHERE: your own worktree. Run `git fetch origin && git switch -c piece/<your slug> origin/main`. Every file goes inside pieces/<your slug>/. Preview on port 4220 (a launch config named <your slug>). Commit with the identity in CLAUDE.md.

CHECK: see it working in a real browser at desktop and phone widths, with an empty console and no sideways scroll, and drive the signature by pointer, touch and keyboard. Other piece sessions share this Mac: run one headless browser at a time and close it when you are done.

DONE WHEN: `node tools/us-spelling.mjs pieces/<your slug>` prints nothing, the branch is pushed, and a pull request to main is open that changes only pieces/<your slug>/, with a screenshot, two sentences on what the piece does, and what a visitor should try first. Reply with the link and the one thing you are proudest of, and send the same report to the operator session.

When my usage reaches 98%, find a natural stopping point.
```
