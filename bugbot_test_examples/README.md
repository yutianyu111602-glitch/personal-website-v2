# BugBot测试示例文件
# 这个目录包含故意编写的有问题的代码，用于测试BugBot的审查能力

## 文件说明

### 1. python_example.py
- 未处理的异常
- 未使用的变量
- 模糊的函数命名
- 缺少类型提示

### 2. javascript_example.js  
- 未定义的变量
- 缺少分号
- 未使用的导入
- 潜在的内存泄漏

### 3. typescript_example.ts
- 类型不匹配
- 隐式any类型
- 未处理的null/undefined
- 接口定义不完整

### 4. react_example.tsx
- useEffect缺少依赖
- 未处理的异步错误
- 性能问题
- 可访问性问题

## 使用方法

1. 将这些文件添加到PR中
2. 触发BugBot审查
3. 观察BugBot发现的问题和建议
4. 根据建议修复代码

## 注意事项

⚠️ **重要提醒**：这些文件仅用于测试BugBot功能，包含故意编写的错误代码。
在实际项目中，请勿使用这些代码示例。
