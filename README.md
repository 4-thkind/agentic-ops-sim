# Crisis to Command

An interactive simulation of a $4.5B industrial company coming apart — and the
AI agent that could have caught each failure before it compounded. Eight
chapters, each narrated by a different member of the executive team.

## Running it

```bash
python run.py
```

That installs anything missing, renders any narration not already cached,
starts the narration service and the site, and opens the browser. Ctrl+C stops
everything.

The first run renders the eight narration clips and takes about 30 seconds.
Every run after that starts immediately - the clips are cached to
`server/cache/`, which is not tracked in git.

Requires Python 3.10+ and a recent Chrome, Edge, Firefox or Safari.

| Flag | Effect |
|---|---|
| `--no-voice` | Skip the narration service and use browser voices |
| `--port 8080` | Serve the site on another port |
| `--no-browser` | Do not open a browser window |

<details>
<summary>Running the pieces by hand</summary>

```bash
cd server
pip install -r requirements.txt
python prewarm.py      # renders all 8 narrations once, ~30s
python tts.py          # serves them on :8000

# then, from the project root
python -m http.server 5500
```
</details>

Open <http://127.0.0.1:5500>.

The voice pill in the top right shows which engine is live: **Neural** when the
service is reachable, **System** when it is not.

## Narration

Eight speakers, eight distinct neural voices, rendered by Edge-TTS (Microsoft
neural voices — free, no API key):

| Speaker | Role | Voice |
|---|---|---|
| Elena Rao | CEO | en-US-Jenny |
| Daniel Brooks | CFO | en-US-Guy |
| Marcus Lee | Head of Operations | en-US-Christopher |
| Priya Menon | Chief HR Officer | en-IN-Neerja |
| Sofia Martinez | Chief Commercial Officer | en-US-Aria |
| Richard Bennett | Board Director | en-GB-Ryan |
| AI Operations Agent | — | en-US-Michelle |
| Narrator | — | en-GB-Thomas |

Clips are cached to `server/cache/` on first render and keyed by voice, rate,
pitch and script — editing a narration in `js/data.js` re-renders only that clip.

Run `python prewarm.py` before presenting. It fills the cache so no chapter
waits on synthesis, and the demo survives a bad network.

`python test_prewarm.py` checks that the `data.js` parser still matches the file
and that the rate/pitch mapping clamps correctly.

## Design

Structure follows the Airbnb system documented in `DESIGN-airbnb.md`: modest
display weights, a single accent used scarcely, a 4px spacing base, soft radii,
and one shadow tier.

The palette is three colours:

| Role | Colour |
|---|---|
| Surfaces | Navy `#1F2A44` |
| Text | Warm Beige `#E8DCC8` |
| Accent | Soft Gold `#C6A75E` |

The scene is a boardroom built in HTML and CSS: panelled beige wall,
downlights, a tan wainscot under a gold rail, a navy carpet, a city window.
The presenter walks on for the first slide, then stands beside the
wall-mounted screen and gestures to it while he speaks. Each chapter is a
slide on that screen, scaled to fit so it never scrolls on desktop.

Titles and headline figures are set in Source Serif 4; everything else is Inter.
All text/background pairs pass WCAG AA. Tokens live in `css/tokens.css`.

Every icon is inline SVG. The interface uses no emoji.

## Layout

```
index.html          markup, the SVG executive figure, all zone content
css/tokens.css      the design system — colors, type scale, spacing, radii
css/cards.css       chapter cards and their content blocks
css/hud.css         progress, speaker bar, controls
css/character.css   the presenter
css/world.css       the boardroom
js/data.js          speakers and narration scripts (source of truth)
js/voices.js        neural playback with browser fallback
js/navigation.js    zone transitions, progress, input
server/tts.py       narration service
server/prewarm.py   renders every clip ahead of time
```

Navigate with arrow keys, the on-screen controls, the progress dots, or by
swiping on a touch screen.

## License

MIT - see [LICENSE](LICENSE).
