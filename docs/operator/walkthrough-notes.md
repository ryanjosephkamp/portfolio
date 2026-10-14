# Walkthrough notes, October 13, 2026

Ryan's verdicts and notes on the twelve concept sites, as he pasted them in chat when he finished
the walkthrough; the walkthrough page's database holds the same text. The text under each concept is his, unedited. The operator's additions are at the
end and are marked as such.

## Verdicts

- **Favorite:** One Splat, Molecule
- **Keep:** none
- **Rework:** Anagram Tiles, Specimen, Toy Box, Workshop, Overprint, Resonance, Slice, Atlas
- **Drop:** Ripple, Query
- **No verdict yet:** none

## Notes, in his words

### Anagram Tiles (v1) [Rework]

"Go on, poke it." is cringe.
Otherwise, no complaints.

### One Splat (one-splat) [Favorite]

Looks great. I think we should build this out just a bit further. For example, the lemma could be
shown visually somehow (obviously in a way that suits the page, etc.), etc.

Yes, let's move the capstone to last, and let's add any other portfolio projects that we have agreed
on being here.

Almost perfect otherwise, though! Great job :)

### Specimen (specimen) [Rework]

Very good, but a bit more minimal than I would prefer. Can we also increase the splat counts for the
neuron at the top of the page? I feel like we could build this one out a bit more.

### Toy Box (toybox) [Rework]

Excellent. This one is growing on me, and I think it's nearly perfect and probably one of my
favorites. Can we allow for more splats in the toy build at the top of the page, so that the toys
aren't so grainy? Aside from that, this is nearly perfect! Amazing work!

### Workshop (workshop) [Rework]

Really, really good. I love the connection between grooph and Splashery. Can we expand this to
support more groophs and splashery objects, not just the loop here and the torus?

### Overprint (overprint) [Rework]

Super cool scrolling effect where the splats move as the user scrolls down the page. I think this is
excellent! Let's reorder the projects to have the capstone at the end, and maybe we could add any
other projects that are missing.

### Molecule (molecule) [Favorite]

Basically perfect. The Cartoon "Drawn as" option only exists for Crambin. Can we see if we can make
it work for caffeine, dopamine, and serotonin, too? And can we expand this to support a much bigger
shelf or selection of molecules? Could we allow users to enter or upload their own somehow?

### Ripple (ripple) [Drop]

Definitely not my favorite. I like the splash effect, but the light and ripple lab stuff is maybe
too boring and plain for me. Let's drop it and find something better.

### Resonance (resonance) [Rework]

Doesn't seem to actually play the user's most recent recorded song or notes... it just plays the
same sequence.

Easily one of my favorites otherwise, though.

Can we very carefully design more color schemes than this gold one, and let the user choose one?
This looks really, really good, but I'm personally not a big fan of gold/yellow.

This is nearly perfect otherwise. Great work!

### Slice (slice) [Rework]

This is very good. I wonder if we can expand this to support more than just walnuts? I'd like to see
the maximum-intensity picture as a shaded cutaway if possible.

This is almost perfect otherwise. Easily a favorite!

### Atlas (atlas) [Rework]

I love this, but I'm not so sure how much I like the color style and theme. We should keep that for
now, but can we carefully design other color schemes beyond the blue and yellow, etc.?

The "Powers of 10" type of demo at the top is super cool, but the minimalist design is harder to
follow than expected. For example, as the user zooms in, it's hard to really grasp the scale changes
without seeing more shapes as the zoom goes further in than Washington, DC. It just looks like
circles, not shapes or outlines for the National Mall, The Enid A. Haupt Garden, the garden bed, one
maple leaf, cells inside the leaf, a chloroplast, and a ribosome. But zooming out to see bigger than
Washington, DC looks fine – the globe and solar system, etc. all look amazing.

Also, can we make the text and numbers, etc. on the plate be a bit bigger? It's hard to read it at
regular browser window zoom level.

Aside from those things, this is basically perfect. Great work!

### Query (query) [Drop]

Very cool, but kind of weird and not that engaging. Just a lot of words and tacky stuff. Drop it.

## Operator's additions (not Ryan's words)

Measured on staging on October 12, 2026, by searching each page for the project's name:

- One Splat, Specimen and Overprint lack reword_nerd, Link Meteor and aqrobat.
- Toy Box and Workshop lack those three and the capstone.
- The six newer concepts name all ten.
- Atlas throws at `atlas.js:209` when its canvas has no size (a radius of -1 passed to `arc`), seen
  in a Browser pane zero pixels wide. It loads clean at 1440 wide. A guard belongs in its refine
  prompt.
- One Splat has a worktree (`.claude/worktrees/one-splat`) and no session of its own.

Open when these notes were recorded, for Ryan to answer:

1. The ten-project pass for Specimen, Toy Box and Workshop. His notes ask for it on One Splat and
   Overprint only.
2. Overprint's capstone: he asked for it to move to the end. Whether its interactive section also
   shrinks to one short entry is not stated.
3. Ripple and Query: what dropping means for each pull request and branch, and what, if anything,
   replaces them. For Ripple he wrote "find something better".
4. Anagram Tiles is merged, so its one-line fix needs a branch and a pull request of its own.

# Round two, October 13, 2026

Ryan's second walkthrough, of the ten concepts after the refine pass, read from the walkthrough
page's database (collection `review`, documents `r2-<slug>`). The text under each concept is his,
unedited.

## Verdicts

- **Favorite:** Workshop
- **Keep:** Specimen, Molecule, Resonance, Slice, Atlas
- **Rework:** Toy Box, Overprint
- **Drop:** none
- **Not marked:** Anagram Tiles, One Splat

## Notes, in his words

### Specimen (specimen) [Keep]

Looks great. The names seem correct. Not my absolute favorite, but certainly not bad.

### Toy Box (toybox) [Rework]

Almost perfect. Please change "digital media researcher · some assembly encouraged" to something else. that's kind of cringe, and i don't even know what the second part means. ACTUALLY: just remove that altogether. My name can stand by itself. I think that would look best. Thank you.

### Workshop (workshop) [Favorite]

Perfect as-is. Basically my favorite. We should plan to make this the main portfolio.

### Overprint (overprint) [Rework]

Can we make the splat stuff sharper, e.g., using more splats? It's a bit too blurry and grainy for my liking. Basically, we could just do what we did to improve the sharpness of the Toy Box. That's my only request here. At phone width, the QR code should fit whole above the text. There should be no overlap.

### Molecule (molecule) [Keep]

Sorting looks good to me. One of my favorites. Seriously, well done.

### Resonance (resonance) [Keep]

Copper. Perfect. Probably my favorite, but hard to choose.

### Slice (slice) [Keep]

Two scans will be enough. Not my favorite, but certainly quite good.

### Atlas (atlas) [Keep]

If Splashery is wrong, then let me know and give me a prompt to hand to the Opus operator session on that account, and I'll do it. This is my second-favorite.

## What the operator did with them (not Ryan's words)

- Sent round-two prompts to three lanes: Overprint (more splats, placed evenly, as Toy Box did; the
  QR code whole above the text at phone width), Toy Box (remove the line beside his name), and
  Resonance (copper as the default plate).
- No change asked of Specimen, Workshop, Molecule, Slice or Atlas.
- Atlas: his question was whether Splashery's stop labels are wrong. The operator's reading: the
  National Mall label (about 3.2 km from the Capitol to the Lincoln Memorial) is about a tenth short
  of the 3.58 km between the two buildings' centers, and "about 16 km across" for Washington, D.C.
  is the side of its original square, not its span. The other three are within their "about". A
  prompt for Splashery's own operator session went to Ryan in chat.
- Workshop: he wants to plan for it to be the main portfolio. That belongs to the publish step.
- One Splat's refine and Arcade's build were launched by Ryan and were running when these were read.

# Round three, October 14, 2026

Ryan's final review of the eleven concepts, as he pasted it in chat; the walkthrough page's database
holds the same text (collection `review`, documents `r3-<slug>`). His words, unedited.

## Verdicts

- **Favorite:** none
- **Keep:** Anagram Tiles, One Splat, Specimen, Toy Box, Workshop, Overprint, Molecule, Resonance
- **Rework:** Slice, Atlas, Arcade
- **Drop:** none

## Notes, in his words

### Anagram Tiles (v1) [Keep]

Wording is good. Perfect now.

### One Splat (one-splat) [Keep]

That's acceptable. Lemma section looks amazing! Very, very impressive. This looks perfect.

### Specimen (specimen) [Keep]

Perfect.

### Toy Box (toybox) [Keep]

Keep the packaging voice. Those lines are fine.

### Workshop (workshop) [Keep]

Perfect! I was ultimately planning to actually maybe make one gallery page on my website called
"Portfolios", where these will be shown like movie posters or something (ideally, they'll be
dynamic), and users can click into them and see these portfolios.

Let's disregard what "main" means here. I've changed my mind a bit. I want to be able to link to any
of these if needed, or to the Portfolios page on my site, etc. So, "main" no longer really applies. I
also want to open these portfolios up as templates that other people can clone and replace names or
projects, etc. and further develop if they want to. We should keep our portfolios as they are (or
with any other fixes or improvements that I've specified), but maybe we can make template versions
that others can easily clone and add their own contents to?

### Overprint (overprint) [Keep]

Looks amazing! The text even supports EMOJIS! WOW! This might be my favorite.

### Molecule (molecule) [Keep]

(no notes)

### Resonance (resonance) [Keep]

(no notes)

### Slice (slice) [Rework]

Almost perfect, but when the user chooses the "Gar's Head", section D ("The same walnut, in
Splashery") doesn't change to something like "The young gar's head, in Splashery", and the text below
it ("Everything above is this page's own drawing of the scan. This one is Splashery's: its walnut toy
in the embed player, the same CT scan drawn as volume splats. It turns when idle and you can orbit it.
In the playground you can cut it, or show only its dense shell.") doesn't update for the young gar's
head toy.

If we were to try to expand this to support more objects than just a walnut and a young gar's head,
how would we do that? Should we give a prompt to the Splashery operator to have it add the new toys
to Splashery first? If so, then what ideas do you have about suitable objects?

### Atlas (atlas) [Rework]

I'm sending the prompt to the Splashery operator now. Atlas is basically complete, but I'd like to
see a few more color themes. Maybe something like the Field edition with a bit of color? I don't
like Indigo and gilt as the default, but I don't want to delete it or anything; Field edition is
close to what I want, but maybe it could have a bit more color? Is there a way to allow the user to
customize the color without making this look terrible?

### Arcade (arcade) [Rework]

EXTREMELY COOL! WOW! So creative... thank you for making this. Now, is the Amordle game demo actually
playable? Can we make it playable? And can we make the red letter box animation go away or be slower
or something? Aside from those comments, this portfolio is basically perfect. Great work!

## His other notes, the same day

1. I want to create ~blank templates from these portfolios and create a portfolio gallery page on my
   personal website called "Portfolios", and people can browse these. I noted that a bit above.
2. I want to have some prompts or an artifact, etc. that I can easily use to request changes or new
   portfolio concept pages like these, etc. in the future. Can you create that artifact for me?
3. Please mark my notes here but don't send messages to the other sessions just yet. Save whatever you
   need to save to the repo. I will need to sign out of this account and sign into another account
   briefly before coming back to this account.

## What the operator did with them (not Ryan's words)

- Held the three rework prompts (Slice, Atlas, Arcade), as he asked. They are drafted in
  `docs/operator/RESUME.md`, ready to send when he says so.
- Drafted a prompt for Splashery's own operator session to add new scans, so Slice can show more than
  two objects. It is in the same file.
- "Main portfolio" is retired. The publish step is now a "Portfolios" gallery on his site, and
  templates for others are a separate step after it.
