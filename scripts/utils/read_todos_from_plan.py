#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
读取 DEPLOYMENT_PLAN_V2.md 中的任务条目（形如 - [ ] / - [x]），解析为待办清单并打印为行文本。
输出格式：TODO: <section> - <item>
"""

import os
import re
from pathlib import Path

def main() -> None:
    # 当前脚本位于: 程序集_Programs/个人网站项目V2/scripts/utils/
    # 项目根:      程序集_Programs/个人网站项目V2/
    project_root = Path(__file__).resolve().parents[2]
    plan_file = project_root / 'DEPLOYMENT_PLAN_V2.md'
    if not plan_file.exists():
        return
    section = ''
    pattern_section = re.compile(r'^###\s+(.*)')
    pattern_item = re.compile(r'^-\s*\[([ xX])\]\s*(.*)')
    with plan_file.open('r', encoding='utf-8') as f:
        for line in f:
            line = line.rstrip('\n')
            msec = pattern_section.match(line)
            if msec:
                section = msec.group(1).strip()
                continue
            mitem = pattern_item.match(line)
            if mitem:
                checked = mitem.group(1) in ('x', 'X')
                item = mitem.group(2).strip()
                if not checked and item:
                    print(f'TODO: {section} - {item}')

if __name__ == '__main__':
    main()


