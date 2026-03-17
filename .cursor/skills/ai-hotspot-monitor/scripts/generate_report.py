#!/usr/bin/env python
"""
generate_report.py

Post-process raw hotspot items (from search_twitter.py, search_web.py or other
collectors) into a normalized list and a simple text report.

Input:
- Reads JSON from stdin with structure: {"items": [ ... ]}
  Each item should at least contain: title, url, source, published_at (optional),
  summary/raw_content (optional).

Output:
- Writes JSON to stdout with:
  {
    "items": [normalized_items...],
    "report": "human-readable multi-line summary"
  }

This script intentionally leaves the deeper semantic scoring to the AI model
invoking it. It focuses on shape-normalization and basic formatting.
"""

import json
import sys
from datetime import datetime
from typing import Any, Dict, List


def normalize_item(raw: Dict[str, Any]) -> Dict[str, Any]:
    title = (raw.get("title") or "").strip()
    url = (raw.get("url") or "").strip()
    source = (raw.get("source") or "").strip() or "unknown"
    published_at = raw.get("published_at")

    # Best-effort ISO 8601 normalization
    if published_at:
        try:
            dt = datetime.fromisoformat(str(published_at).replace("Z", "+00:00"))
            published_at = dt.isoformat()
        except Exception:
            published_at = None

    summary = (raw.get("summary") or "").strip()
    if not summary:
        summary = (raw.get("raw_content") or "").strip()[:280]

    return {
        "title": title,
        "url": url,
        "source": source,
        "published_at": published_at,
        "summary": summary,
    }


def build_text_report(items: List[Dict[str, Any]]) -> str:
    """Build a lightweight, emoji-enhanced textual report.

    This is intentionally simple and does NOT try to compute importance or
    relevance scores. Those are left to the AI layer that consumes the JSON
    output. The goal here is just to provide a quick human-readable snapshot.
    """
    lines: List[str] = []

    # Header overview (no keywords/time-window context here; that comes from the caller)
    lines.append("📊 AI Hotspots Snapshot")
    lines.append("=" * 40)
    lines.append("")

    if not items:
        lines.append("No hotspot candidates found.")
        return "\n".join(lines)

    for idx, item in enumerate(items, start=1):
        ts = item.get("published_at") or "time: unknown"
        title = item.get("title") or "(no title)"
        summary = item.get("summary") or ""
        url = item.get("url") or ""
        source = item.get("source") or "unknown"

        lines.append(f"[{idx}] 🏷 标题：{title}")
        lines.append(f"    🌐 来源：{source} · {ts}")
        if summary:
            lines.append(f"    📝 摘要：{summary}")
        if url:
            lines.append(f"    🔗 链接：{url}")
        lines.append("")

    # Simple footer hint; the full structured summary is expected from the AI layer.
    lines.append("📌 提示：以上为原始热点快照，重要程度与相关性评分请由 AI 按 `ai-hotspot-monitor` Skill 进行进一步分析。")

    return "\n".join(lines)


def main() -> int:
    try:
        raw = sys.stdin.read()
        data = json.loads(raw or "{}")
    except Exception as exc:
        print(
            json.dumps(
                {"error": "invalid_input", "message": f"Failed to parse JSON from stdin: {exc}"}
            ),
            file=sys.stderr,
        )
        return 1

    raw_items = data.get("items") or []
    if not isinstance(raw_items, list):
        raw_items = []

    normalized: List[Dict[str, Any]] = []
    for r in raw_items:
        if not isinstance(r, dict):
            continue
        norm = normalize_item(r)
        if not norm.get("title") and not norm.get("url"):
            continue
        normalized.append(norm)

    report = build_text_report(normalized)
    print(json.dumps({"items": normalized, "report": report}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())

