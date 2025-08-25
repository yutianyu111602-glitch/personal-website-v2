#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将 gh pr view 导出的 JSON(含 comments/reviews) 转为 Markdown 摘要
用法: python3 collect_bugbot_pr.py <output_dir>
其中 <output_dir> 包含 pr1_full.json，脚本会生成 analysis.md
"""
import json
import os
import sys
from datetime import datetime

def sanitize(text: str) -> str:
    if not isinstance(text, str):
        return ""
    return text.replace("\r", " ").replace("\n", " ").strip()

def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python3 collect_bugbot_pr.py <output_dir>")
        return 2
    outdir = sys.argv[1]
    json_path = os.path.join(outdir, "pr1_full.json")
    if not os.path.exists(json_path):
        print(f"Not found: {json_path}")
        return 1

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    number = data.get("number")
    title = data.get("title", "")
    url = data.get("url", "")
    author = (data.get("author") or {}).get("login", "")
    comments = data.get("comments") or []
    reviews = data.get("reviews") or []

    lines = []
    lines.append(f"# BugBot 分析抓取 (PR #{number})")
    lines.append("")
    lines.append(f"- 标题: {title}")
    lines.append(f"- 链接: {url}")
    lines.append(f"- 作者: {author}")
    lines.append("")

    lines.append("## 评论")
    if not comments:
        lines.append("(无评论)")
    else:
        for c in comments:
            au = (c.get("author") or {}).get("login", "")
            created = c.get("createdAt", "")
            body = sanitize(c.get("body", ""))
            lines.append(f"- [{au}] {created}: {body}")
    lines.append("")

    lines.append("## 审查(Reviews)")
    if not reviews:
        lines.append("(无审查)")
    else:
        for r in reviews:
            au = (r.get("author") or {}).get("login", "")
            state = r.get("state", "")
            submitted = r.get("submittedAt", "")
            body = sanitize(r.get("body", ""))
            lines.append(f"- [{au}] {state} @ {submitted}: {body}")
    lines.append("")

    # 额外：提取疑似BugBot评论（包含 'BugBot' 或来自 'cursor'）
    bot_lines = []
    for c in comments:
        au = (c.get("author") or {}).get("login", "")
        body = sanitize(c.get("body", ""))
        if "bugbot" in body.lower() or au.lower() in {"cursor", "bugbot"}:
            bot_lines.append(f"- [{au}]: {body}")
    if bot_lines:
        lines.append("## 可能的 BugBot 评论")
        lines.extend(bot_lines)
        lines.append("")

    md_path = os.path.join(outdir, "analysis.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(md_path)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
