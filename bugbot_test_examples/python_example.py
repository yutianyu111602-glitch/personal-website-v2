#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BugBot测试示例 - Python版本
这个文件包含故意编写的常见Python问题，用于测试BugBot的审查能力
"""

import os
import sys
from typing import List, Dict, Any

# 问题1: 未使用的导入
import json
import xml.etree.ElementTree as ET

# 问题2: 全局变量定义不当
global_var = "test"
GLOBAL_CONSTANT = 42

def bad_function(data):
    """问题3: 函数命名不规范，缺少类型提示"""
    # 问题4: 未使用的变量
    unused_var = "this is not used"
    
    # 问题5: 硬编码路径
    file_path = "/hard/coded/path/file.txt"
    
    # 问题6: 异常处理不当
    try:
        result = data / 0  # 可能除零
    except:
        pass  # 捕获所有异常但不处理
    
    # 问题7: 返回类型不一致
    if data > 0:
        return "positive"
    elif data < 0:
        return -1
    else:
        return None

def another_bad_function():
    """问题8: 函数缺少参数和返回值类型"""
    # 问题9: 列表推导式可能产生副作用
    items = [print(i) for i in range(10)]
    
    # 问题10: 字典键值对操作不当
    d = {}
    d[1] = "one"
    d["1"] = "string_one"
    
    # 问题11: 字符串拼接效率低
    result = ""
    for i in range(1000):
        result += str(i)
    
    return result

class BadClass:
    """问题12: 类缺少文档字符串"""
    
    def __init__(self):
        # 问题13: 实例变量未在__init__中定义
        self.undefined_attr = None
    
    def method_with_issues(self, param):
        # 问题14: 参数未使用
        # 问题15: 缺少self参数的类型提示
        return "method result"
    
    # 问题16: 静态方法定义不当
    @staticmethod
    def static_method(self):  # 静态方法不应该有self参数
        return "static"

# 问题17: 主程序缺少if __name__ == "__main__"保护
print("This will run on import")

# 问题18: 资源管理不当
file = open("test.txt", "w")
file.write("test")
# 缺少file.close()

# 问题19: 列表操作可能产生索引错误
def list_operation():
    lst = [1, 2, 3]
    return lst[10]  # 索引越界

# 问题20: 循环变量泄漏
for i in range(5):
    pass
print(f"Loop variable leaked: {i}")  # i在循环外仍然可用

if __name__ == "__main__":
    # 问题21: 主函数缺少错误处理
    bad_function(0)
    another_bad_function()
    
    # 问题22: 未处理的异常
    list_operation()
