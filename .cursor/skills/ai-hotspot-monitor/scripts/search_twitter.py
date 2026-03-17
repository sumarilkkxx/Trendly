#!/usr/bin/env python
"""
search_twitter.py

Lightweight helper script for the `ai-hotspot-monitor` skill.

Purpose:
- Use TwitterAPI.io's advanced_search endpoint to fetch tweets for given
  AI-related keywords within a time window.
- Output results as JSON to stdout for further AI analysis.

Requirements:
- Python 3.9+
- requests (pip install requests)

Usage (example):
  python search_twitter.py \\
    --api-key YOUR_TWITTERAPI_IO_API_KEY \\
    --keywords "GPT-5,Claude,开源LLM" \\
    --since 2026-03-10 \\
    --max-pages 3
"""

import argparse
import json
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Any

try:
    import requests
except ImportError:  # pragma: no cover - simple runtime guard
    print(
        json.dumps(
            {
                "error": "missing_dependency",
                "message": "The 'requests' package is required. Install via 'pip install requests'.",
            }
        ),
        file=sys.stderr,
    )
    sys.exit(1)


API_BASE = "https://api.twitterapi.io"


def build_query(keywords: List[str], since: str | None) -> str:
    terms = [f'"{k.strip()}"' for k in keywords if k.strip()]
    if not terms:
        raise ValueError("At least one non-empty keyword is required")
    base = " OR ".join(terms)
    if since:
        return f"{base} since:{since}"
    return base


def fetch_tweets(
    api_key: str,
    keywords: List[str],
    since: str | None,
    max_pages: int,
) -> List[Dict[str, Any]]:
    query = build_query(keywords, since)
    items: List[Dict[str, Any]] = []
    cursor = ""
    pages = 0

    session = requests.Session()
    headers = {"X-API-Key": api_key}

    while pages < max_pages:
        params = {
            "query": query,
            "queryType": "Latest",
            "cursor": cursor,
        }
        resp = session.get(
            f"{API_BASE}/twitter/tweet/advanced_search",
            params=params,
            headers=headers,
            timeout=20,
        )
        try:
            data = resp.json()
        except Exception:  # pragma: no cover - robustness
            break

        if not resp.ok:
            # surface minimal error details and abort
            msg = data.get("msg") or data.get("message") or resp.reason
            raise RuntimeError(f"TwitterAPI.io error: {msg}")

        tweets = data.get("tweets") or []
        for t in tweets:
            a = t.get("author") or {}
            items.append(
                {
                    "source": "twitter",
                    "external_id": t.get("id"),
                    "title": (t.get("text") or "")[:100],
                    "summary": (t.get("text") or "")[:300],
                    "url": t.get("url") or f"https://x.com/i/status/{t.get('id')}",
                    "raw_content": (t.get("text") or "")[:2000],
                    "published_at": t.get("createdAt"),
                    "author": a.get("name") or a.get("userName") or "",
                    "like_count": t.get("likeCount", 0),
                    "retweet_count": t.get("retweetCount", 0),
                    "view_count": t.get("viewCount", 0),
                }
            )

        if not data.get("has_next_page") or not data.get("next_cursor"):
            break

        cursor = data["next_cursor"]
        pages += 1

    return items


def parse_args(argv: List[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Search Twitter via TwitterAPI.io for AI hotspots.")
    parser.add_argument("--api-key", required=True, help="TwitterAPI.io API key (X-API-Key).")
    parser.add_argument(
        "--keywords",
        required=True,
        help="Comma-separated keywords, e.g. 'GPT-5,Claude,开源LLM'.",
    )
    parser.add_argument(
        "--since",
        default=None,
        help="Optional since date in YYYY-MM-DD. Default: 7 days ago.",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=3,
        help="Maximum pages to fetch (default: 3).",
    )
    return parser.parse_args(argv)


def main(argv: List[str]) -> int:
    args = parse_args(argv)

    if args.since is None:
        since_date = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
    else:
        since_date = args.since

    keywords = [k.strip() for k in args.keywords.split(",") if k.strip()]

    try:
        items = fetch_tweets(
            api_key=args.api_key,
            keywords=keywords,
            since=since_date,
            max_pages=max(1, args.max_pages),
        )
    except Exception as exc:  # pragma: no cover - surface error
        print(
            json.dumps(
                {
                    "error": "twitter_search_failed",
                    "message": str(exc),
                }
            ),
            file=sys.stderr,
        )
        return 1

    print(json.dumps({"items": items}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main(sys.argv[1:]))

