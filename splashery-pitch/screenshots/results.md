# Checks, October 16, 2026

77 of 77 passed.

| Check | Result | Detail |
| --- | --- | --- |
| desk: hero | pass | 300,000 splats, 60 fps |
| desk: frame | pass | 300,000 splats, 60 fps |
| desk: splat | pass | 300,000 splats, 60 fps |
| desk: dial | pass | 8 splats, 60 fps |
| desk: recipe | pass | 184,226 splats, 60 fps |
| desk: parts | pass | 184,226 splats, 60 fps |
| desk: equation | pass | 7,918 splats, 60 fps |
| desk: walnut | pass | 240,277 splats, 60 fps |
| desk: link | pass | 300,000 splats, 60 fps |
| desk: claims | pass | 300,000 splats, 60 fps |
| desk: no sideways scroll | pass | 1440 px wide at 1440 |
| desk: no console errors | pass |  |
| phone: hero | pass | 300,000 splats, 60 fps |
| phone: frame | pass | 300,000 splats, 60 fps |
| phone: splat | pass | 300,000 splats, 60 fps |
| phone: dial | pass | 8 splats, 60 fps |
| phone: recipe | pass | 128,957 splats, 60 fps |
| phone: parts | pass | 128,957 splats, 60 fps |
| phone: equation | pass | 7,918 splats, 60 fps |
| phone: walnut | pass | 160,262 splats, 60 fps |
| phone: link | pass | 300,000 splats, 60 fps |
| phone: claims | pass | 300,000 splats, 60 fps |
| phone: no sideways scroll | pass | 390 px wide at 390 |
| phone: no console errors | pass |  |
| reduced: hero | pass | 300,000 splats, 60 fps |
| reduced: frame | pass | 300,000 splats, 60 fps |
| reduced: splat | pass | 300,000 splats, 60 fps |
| reduced: dial | pass | 300,000 splats, 60 fps |
| reduced: recipe | pass | 184,226 splats, 60 fps |
| reduced: parts | pass | 184,226 splats, 60 fps |
| reduced: equation | pass | 7,918 splats, 60 fps |
| reduced: walnut | pass | 240,277 splats, 60 fps |
| reduced: link | pass | 300,000 splats, 60 fps |
| reduced: claims | pass | 300,000 splats, 60 fps |
| reduced: no sideways scroll | pass | 1280 px wide at 1280 |
| reduced: no console errors | pass |  |
| failure: first SOG blocked shows a message | pass | grape-lite.sog did not load: the network request failed (http://127.0.0.1:58368/assets/grape-lite.sog). |
| failure: first SOG blocked, the stage does not claim to be live | pass |  |
| failure: Retry after the SOG comes back | pass |  |
| failure: walnut 404 shows the file and status | pass | walnut.vol.gz did not load: HTTP 404 Not Found (http://127.0.0.1:58368/assets/walnut.vol.gz). |
| failure: Retry brings the walnut | pass |  |
| failure: broken worker URL shows a message | pass | The data thread could not start: its script did not load. |
| failure: broken worker offers a reload | pass | Reload the page |
| failure: Reload after the worker comes back | pass |  |
| keys: arrows turn the stage | pass | yaw -0.50 to -0.02 |
| keys: Enter takes the frame apart | pass |  |
| keys: radio arrows, End and Home | pass | after Right 1, End 4, Home 0, tab stops 0-1-1-1-1 |
| keys: Space on the stage picks a splat | pass | focus stage, splat 119569 |
| keys: Escape lets it go | pass |  |
| keys: Tab from the stage carries on in the step | pass | button pick-again |
| keys: arrows turn the dial a level at a time | pass | 18.47 to 12, showing 4,096 |
| keys: Enter on the lid button | pass | false to true |
| keys: arrows move the cut | pass |  |
| keys: Tab alone reaches every step | pass | 47 stops |
| keys: no console errors | pass |  |
| regress: opened partway down, then on to the recipe | pass | 184226 splats |
| regress: left alone, the stage stops drawing | pass | 0 draws in 4 s after 36 s alone |
| regress: a touch wakes it | pass | 241 draws in 4 s after a touch |
| detail: Auto picks a tier for this device | pass | High, auto |
| detail: Low swaps in the 100,000-splat grape and is kept | pass | {"tier":1,"count":100000,"drawn":100000,"label":"Low","saved":"1"} |
| detail: Low survives a reload | pass | {"tier":1,"count":100000,"drawn":100000,"label":"Low","saved":"1"} |
| detail: back to Auto | pass | High, auto |
| detail: slow frames step Auto down a tier, with a notice | pass | Mid, auto: Frames took 80 ms, so detail is now Mid. Change it under Detail. |
| detail: software rendering gets Low, thinned | pass | 24884 of 100000 drawn |
| webkit: hero | pass | 300,000 splats |
| webkit: frame | pass | 300,000 splats |
| webkit: splat | pass | 300,000 splats |
| webkit: dial | pass | 8 splats |
| webkit: recipe | pass | 128,957 splats |
| webkit: parts | pass | 128,957 splats |
| webkit: equation | pass | 7,918 splats |
| webkit: walnut | pass | 160,262 splats |
| webkit: link | pass | 300,000 splats |
| webkit: claims | pass | 300,000 splats |
| webkit: no page errors | pass |  |
| webkit: first SOG blocked shows a message | pass | grape-lite.sog did not load: the network request failed (http://127.0.0.1:58368/assets/grape-lite.sog). |
| webkit: Retry loads it | pass |  |
