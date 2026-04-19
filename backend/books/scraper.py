import time
import random
import re
import json
import requests
from bs4 import BeautifulSoup
import spacy

nlp = spacy.load("en_core_web_sm")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml",
}

MUSIC_PATTERNS = [
    r'(?:listening to|listen to)\s+([A-Z][^\.,\n]{2,30})',
    r'([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+(?:vibes|energy|feel|mood)',
    r'([A-Z][^\.,\n]{2,25})\s+by\s+([A-Z][^\.,\n]{2,25})',
    r'(?:reminds me of|sounds like|feels like)\s+([A-Z][^\.,\n]{2,30})',
    r'(?:soundtrack|playlist|music).*?(?:would be|is|:)\s+([A-Z][^\.,\n]{2,30})',
]


def _get_apollo_state(html):
    soup = BeautifulSoup(html, "html.parser")
    for script in soup.find_all("script"):
        if script.string and "apolloState" in script.string:
            data = json.loads(script.string)
            return data["props"]["pageProps"]["apolloState"]
    return {}


def _strip_html(text):
    return BeautifulSoup(text, "html.parser").get_text(separator=" ", strip=True)


def scrape_goodreads(goodreads_id):
    url = f"https://www.goodreads.com/book/show/{goodreads_id}"
    time.sleep(random.uniform(3, 7))
    response = requests.get(url, headers=HEADERS, timeout=15)
    response.raise_for_status()

    state = _get_apollo_state(response.text)

    reviews = []
    tag_counts = {}

    for key, value in state.items():
        if not key.startswith("Review:"):
            continue

        raw_text = value.get("text") or ""
        clean_text = _strip_html(raw_text)
        if len(clean_text) >= 100:
            reviews.append(clean_text)

        shelving = value.get("shelving") or {}
        for tagging in shelving.get("taggings", []):
            tag_name = tagging.get("tag", {}).get("name", "")
            if tag_name:
                tag_counts[tag_name] = tag_counts.get(tag_name, 0) + 1

    shelf_tags = [
        {"tag": tag, "mention_count": count}
        for tag, count in tag_counts.items()
    ]

    return reviews, shelf_tags


def extract_music_mentions(reviews):
    mention_map = {}

    for review in reviews:
        doc = nlp(review)

        for ent in doc.ents:
            if ent.label_ in ("PERSON", "ORG"):
                name = ent.text.strip()
                if name not in mention_map:
                    mention_map[name] = {"count": 0, "raw_mention": review[:200]}
                mention_map[name]["count"] += 1

        for pattern in MUSIC_PATTERNS:
            for match in re.finditer(pattern, review):
                name = match.group(1).strip()
                if name not in mention_map:
                    mention_map[name] = {"count": 0, "raw_mention": review[:200]}
                mention_map[name]["count"] += 1

    results = []
    for name, data in mention_map.items():
        if data["count"] >= 2:
            results.append({
                "artist_name": name,
                "mention_count": data["count"],
                "raw_mention": data["raw_mention"],
            })

    return results