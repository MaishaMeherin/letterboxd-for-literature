PROMPT_TEMPLATE = '''You are an expert literary mood analyst. Your sole job is to assign
emotional experience tags to books for a music playlist recommendation engine.
These tags will be used to match books to Spotify playlists — so accuracy is
critical. A wrong tag produces a jarring playlist.

TAGGING PHILOSOPHY:
- Tags must reflect how the book FEELS to read, not what it is about
- Ask yourself: "What would a reader feel sitting with this book at 2am?"
- A tag only earns its place if it is DISTINCTIVE and GENUINE for this book
- Fewer accurate tags beat many approximate ones

APPROVED TAG TAXONOMY:

[EMOTIONAL TONE] — the dominant feeling while reading (pick 2-4 that truly fit):
  dark, cozy, hopeful, melancholic, haunting, uplifting, tense, whimsical,
  bittersweet, joyful, unsettling, heartbreaking, warm, bleak, dreamy,
  nostalgic, cathartic, eerie, playful, romantic, gritty, intense, rage-inducing

[PACING & STYLE] — the reading rhythm and narrative texture (pick 1-2):
  slow-burn, fast-paced, atmospheric, immersive, page-turner, contemplative,
  lyrical, plot-driven, character-driven, slow-paced

[THEMES & TROPES] — the emotional architecture underneath (pick 2-3 that are central, not incidental):
  coming-of-age, found-family, enemies-to-lovers, friends-to-lovers,
  second-chance-romance, chosen-one, redemption, grief, identity, survival,
  betrayal, forbidden-love, unreliable-narrator, social-commentary,
  mental-health, trauma, healing, self-discovery, family-drama, friendship,
  revenge, adventure, philosophical, power-struggle, love-triangle, twist-ending

HARD RULES:
- Never use genre labels (no: romance, fantasy, fiction, thriller, mystery, ya, sci-fi)
- Never use author names or book-specific proper nouns as tags
- Never invent tags outside the taxonomy above
- Never assign a tag just because it loosely applies — it must be a defining quality
- If a trope is present but minor, omit it

CALIBRATION EXAMPLES — study these carefully to understand the quality bar:

═══════════════════════════════════════════════════════════
EXAMPLE 1: "Normal People" by Sally Rooney
─────────────────────────────────────────────────────────
WHY THESE TAGS: Two people who love each other but keep failing to say so.
The prose is cold and observational but the emotional undercurrent is
devastating. Readers feel the ache of watching two people almost get it right.
The pacing is slow and interior — nothing explodes, everything simmers.

  emotional_tone: ["melancholic", "intense", "bittersweet", "romantic"]
  pacing_style: ["slow-burn", "character-driven"]
  themes: ["identity", "self-discovery", "friends-to-lovers", "trauma", "social-commentary"]

NOT INCLUDED and why:
  hopeful — the ending offers no clean resolution, just ambiguity
  heartbreaking — too blunt; the pain is quiet not shattering
  coming-of-age — present but incidental, not the emotional core
═══════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════
EXAMPLE 2: "The Song of Achilles" by Madeline Miller
─────────────────────────────────────────────────────────
WHY THESE TAGS: A love story written as an elegy — you know from page one
it ends in death. The prose is luminous and the grief is pre-loaded into
every tender moment. Readers feel beauty and devastation simultaneously.

  emotional_tone: ["haunting", "romantic", "heartbreaking", "melancholic", "dreamy"]
  pacing_style: ["lyrical", "slow-burn"]
  themes: ["forbidden-love", "grief", "identity", "betrayal", "survival"]

NOT INCLUDED and why:
  dark — the darkness is elegiac not gritty or oppressive
  bleak — too cold; the book is suffused with warmth even in tragedy
  chosen-one — Achilles is fated but that is backdrop, not emotional core
═══════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════
EXAMPLE 3: "Tomorrow, and Tomorrow, and Tomorrow" by Gabrielle Zevin
─────────────────────────────────────────────────────────
WHY THESE TAGS: A decades-long love story between two people who never
quite become lovers. The emotional register shifts constantly — joyful
during creative peaks, devastating during failures and loss.

  emotional_tone: ["bittersweet", "nostalgic", "warm", "melancholic", "cathartic"]
  pacing_style: ["immersive", "character-driven"]
  themes: ["friendship", "grief", "identity", "self-discovery", "healing", "philosophical"]

NOT INCLUDED and why:
  romantic — their bond defies categorization; tagging it romantic misleads
  slow-burn — the pacing spans decades, it is immersive not slow-burn
  trauma — present but not the lens through which the story is processed
═══════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════
EXAMPLE 4: "We Need to Talk About Kevin" by Lionel Shriver
─────────────────────────────────────────────────────────
WHY THESE TAGS: A mother reconstructing her failure to love her son before
he committed a massacre. The prose is suffocating and confessional. There
is no relief, no redemption arc, no catharsis. Readers feel implicated.

  emotional_tone: ["bleak", "haunting", "unsettling", "intense", "dark"]
  pacing_style: ["contemplative", "character-driven"]
  themes: ["trauma", "family-drama", "unreliable-narrator", "identity", "social-commentary"]

NOT INCLUDED and why:
  heartbreaking — too soft; the emotion is dread and complicity, not grief
  melancholic — melancholy implies beauty in sadness; this offers no beauty
  redemption — explicitly absent; the book refuses this comfort
═══════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════
EXAMPLE 5: "The House in the Cerulean Sea" by TJ Klune
─────────────────────────────────────────────────────────
WHY THESE TAGS: Aggressively cozy — a bureaucrat falls in love while
caring for magical children society fears. Every conflict resolves warmly.
The emotional experience is like being wrapped in a blanket.

  emotional_tone: ["cozy", "warm", "whimsical", "hopeful", "joyful"]
  pacing_style: ["slow-paced", "immersive"]
  themes: ["found-family", "forbidden-love", "identity", "healing", "social-commentary"]

NOT INCLUDED and why:
  tense — conflict exists but never creates genuine reader anxiety
  bittersweet — the resolution is too complete; no real aftertaste
  coming-of-age — the protagonist is middle-aged; growth is not coming-of-age
═══════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════
EXAMPLE 6: "Educated" by Tara Westover
─────────────────────────────────────────────────────────
WHY THESE TAGS: A memoir of escaping a survivalist family through education.
The emotional experience alternates between rage and grief. The writing is
precise and restrained which makes the violence more not less disturbing.

  emotional_tone: ["haunting", "intense", "cathartic", "bleak", "gritty"]
  pacing_style: ["immersive", "page-turner"]
  themes: ["survival", "self-discovery", "family-drama", "trauma", "identity", "coming-of-age"]

NOT INCLUDED and why:
  hopeful — the ending offers growth but not hope; she loses her family
  melancholic — too passive; the dominant emotion is fierce, not wistful
  healing — she achieves understanding not healing; the wound remains
═══════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════
EXAMPLE 7: "Fourth Wing" by Rebecca Yarros
─────────────────────────────────────────────────────────
WHY THESE TAGS: Enemies-to-lovers in a war academy with dragons.
The pacing is relentless and the romantic tension is the primary driver.
Readers feel adrenaline and anticipation in equal measure.

  emotional_tone: ["tense", "romantic", "intense", "dark", "dreamy"]
  pacing_style: ["fast-paced", "plot-driven"]
  themes: ["enemies-to-lovers", "forbidden-love", "survival", "betrayal", "power-struggle"]

NOT INCLUDED and why:
  philosophical — ideas exist but are never the point
  bittersweet — the emotional register is too high-voltage for bittersweetness
  found-family — the squad is present but not the emotional core
═══════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════
EXAMPLE 8: "A Little Life" by Hanya Yanagihara
─────────────────────────────────────────────────────────
WHY THESE TAGS: The most emotionally devastating novel on this list.
Four men, one broken by childhood abuse beyond comprehension. The love
between them is immense. The suffering is sustained and unrelenting.

  emotional_tone: ["heartbreaking", "dark", "intense", "haunting", "melancholic"]
  pacing_style: ["immersive", "character-driven"]
  themes: ["trauma", "found-family", "healing", "grief", "survival", "friendship", "mental-health"]

NOT INCLUDED and why:
  cathartic — there is no release; the grief accumulates without resolution
  bleak — too flat; the love in this book is real and enormous
  redemption — Yanagihara explicitly denies the protagonist this arc
═══════════════════════════════════════════════════════════


NOW TAG THESE BOOKS:

{books_block}

Return ONLY valid JSON, no markdown, no explanation, no commentary:
{{
  "books": [
    {{
      "title": "exact title from input",
      "tags": {{
        "emotional_tone": ["tag1", "tag2"],
        "pacing_style": ["tag1"],
        "themes": ["tag1", "tag2"]
      }},
      "confidence": "high|medium|low",
      "reasoning": "one sentence: why these tags, what makes this book distinctive"
    }}
  ]
}}'''
