#!/usr/bin/env python
"""
search_web.py

Generic web hotspot collection helper for the `ai-hotspot-monitor` skill.

Purpose:
- Perform simple web searches against multiple endpoints (Hacker News Algolia,
  DuckDuckGo lite, and generic news search) for AI-related queries.
- Produce a unified JSON array of candidate items for further AI filtering.

Notes:
- This script intentionally keeps dependencies minimal and uses the standard
  library where practical. For more advanced scraping you can extend it with
  `beautifulsoup4` or similar libraries.
"""

import argparse
import json
import sys
import urllib.parse
import urllib.request
from datetime import datetime
from html.parser import HTMLParser
from typing import List, Dict, Any


class LinkExtractor(HTMLParser):
    """Very simple <a> tag extractor for DuckDuckGo/news results."""

    def __init__(self) -> None:
        super().__init__()
        self.links: List[Dict[str, Any]] = []
        self._in_result = False
        self._current_href: str | None = None
        self._current_text_parts: List[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:  # type: ignore[override]
        if tag.lower() == "a":
            href = dict(attrs).get("href")
            if href and href.startswith("http"):
                self._in_result = True
                self._current_href = href
                self._current_text_parts = []

    def handle_endtag(self, tag: str) -> None:  # type: ignore[override]
        if tag.lower() == "a" and self._in_result and self._current_href:
            text = " ".join(t.strip() for t in self._current_text_parts if t.strip())
            if text:
                self.links.append({"href": self._current_href, "title": text})
            self._in_result = False
            self._current_href = None
            self._current_text_parts = []

    def handle_data(self, data: str) -> None:  # type: ignore[override]
        if self._in_result:
            self._current_text_parts.append(data)


def http_get(url: str, timeout: int = 15) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "ai-hotspot-monitor/1.0 (https://cursor.sh)",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode(resp.headers.get_content_charset() or "utf-8", errors="replace")


def search_hn(query: str, limit: int) -> List[Dict[str, Any]]:
    api_url = f"https://hn.algolia.com/api/v1/search?query={urllib.parse.quote(query)}&tags=story&hitsPerPage={limit}"
    try:
        raw = http_get(api_url)
        data = json.loads(raw)
    except Exception:
        return []

    items: List[Dict[str, Any]] = []
    for hit in data.get("hits") or []:
        title = hit.get("title") or ""
        url = hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID')}"
        created = hit.get("created_at") or ""
        try:
            dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
            published_at = dt.isoformat()
        except Exception:
            published_at = None

        items.append(
            {
                "source": "hackernews",
                "external_id": hit.get("objectID"),
                "title": title,
                "summary": hit.get("story_text") or "",
                "url": url,
                "raw_content": hit.get("story_text") or "",
                "published_at": published_at,
                "score": hit.get("points", 0),
                "comments": hit.get("num_comments", 0),
            }
        )
    return items


def search_duckduckgo_news(query: str, limit: int) -> List[Dict[str, Any]]:
    q = urllib.parse.quote(query)
    url = f"https://duckduckgo.com/html/?q={q}&ia=news"
    try:
        html = http_get(url)
    except Exception:
        return []

    parser = LinkExtractor()
    parser.feed(html)

    items: List[Dict[str, Any]] = []
    for link in parser.links[:limit]:
        items.append(
            {
                "source": "duckduckgo",
                "external_id": link["href"],
                "title": link["title"],
                "summary": "",
                "url": link["href"],
                "raw_content": "",
                "published_at": None,
            }
        )
    return items


def parse_args(argv: List[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generic web hotspot collector for AI-related queries."
    )
    parser.add_argument(
        "--keywords",
        required=True,
        help="Comma-separated keywords, e.g. 'GPT-5,Claude,开源LLM'.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=20,
        help="Maximum items per source (default: 20).",
    )
    return parser.parse_args(argv)


def main(argv: List[str]) -> int:
    args = parse_args(argv)
    query = " ".join(k.strip() for k in args.keywords.split(",") if k.strip())
    if not query:
        print(
            json.dumps(
                {"error": "invalid_keywords", "message": "No non-empty keywords provided."}
            ),
            file=sys.stderr,
        )
        return 1

    all_items: List[Dict[str, Any]] = []
    all_items.extend(search_hn(query, args.limit))
    all_items.extend(search_duckduckgo_news(query, args.limit))

    print(json.dumps({"items": all_items}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main(sys.argv[1:]))

