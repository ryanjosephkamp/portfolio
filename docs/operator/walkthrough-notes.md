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
