# Crisis to Command

An interactive AI operations workshop. The viewer takes the CEO's chair at
Nova Brands, a $4.5B consumer goods company under pressure in every function,
and works through problems one to one with an AI operations advisor.

Three short narrated slides set the scene. Then the workshop: the CEO types a
problem and the result they need, in their own words. The advisor confirms it,
diagnoses where the process actually leaks, lays out three ways forward with
time, cost, risk and projected impact, and says which it would pick. The CEO
decides, or proposes their own approach. The advisor reacts, pushes back where
it disagrees, asks one follow-up question, and shows the outcome. A wrap-up
summarises every decision as an operating model.

The session is fully scripted and runs offline. No LLM, no API keys. Seven
prepared problem areas: finance close, accounts payable, retailer deductions,
supply chain, compliance alerts, customer care, and talent and knowledge loss.

## Running it

```bash
python run.py
```

That installs anything missing, renders any voice clips not already cached,
starts the narration service and the site, and opens the browser. Ctrl+C stops
everything.

The first run renders about 80 voice clips and takes a minute or two.
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
python prewarm.py      # renders every clip once
python tts.py          # serves them on :8000

# then, from the project root
python -m http.server 5500
```
</details>

Open <http://127.0.0.1:5500>.

The voice pill in the top right shows which engine is live: **Neural** when the
service is reachable, **System** when it is not.

## Narration

Two neural voices, rendered by Edge-TTS (Microsoft neural voices, free, no API
key): the Narrator (en-GB-Thomas) opens, and Iris, the AI advisor
(en-US-Michelle), speaks everything else, including every workshop reply.

Clips are cached to `server/cache/` and keyed by voice, rate, pitch and text,
so editing a line in `js/data.js` re-renders only that clip.

Run `python prewarm.py` before presenting. It renders all ~80 clips so no reply
waits on synthesis. Without the service (for example on a static host) the page
falls back to browser voices.

Checks:

```bash
python server/test_prewarm.py   # data.js parser + rate/pitch mapping
node js/test_matcher.js         # typed problems route to the right scenario
```

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
js/data.js          speakers, intro narration, workshop scenarios (source of truth)
js/workshop.js      the CEO/advisor conversation and problem matcher
css/chat.css        workshop chat screen
js/voices.js        neural playback with browser fallback
js/navigation.js    zone transitions, progress, input
server/tts.py       narration service
server/prewarm.py   renders every clip ahead of time
```

Navigate with arrow keys, the on-screen controls, the progress dots, or by
swiping on a touch screen.

## License

MIT - see [LICENSE](LICENSE).
