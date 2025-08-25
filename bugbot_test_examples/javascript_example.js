/**
 * BugBot测试示例 - JavaScript版本
 * 这个文件包含故意编写的常见JavaScript问题，用于测试BugBot的审查能力
 */

// 问题1: 未定义的变量
console.log(undefinedVariable)

// 问题2: 缺少分号
const name = "test"
const value = 42

// 问题3: 未使用的导入
import { useState, useEffect } from 'react'
import { createStore } from 'redux'

// 问题4: 变量声明重复
let x = 1
let x = 2

// 问题5: 函数缺少参数类型检查
function processData(data) {
    // 问题6: 直接使用参数，未验证
    return data.value + data.count
}

// 问题7: 异步函数缺少错误处理
async function fetchData() {
    const response = await fetch('/api/data')
    const data = await response.json()
    return data
}

// 问题8: 回调函数中的this绑定问题
const obj = {
    name: 'test',
    method: function() {
        setTimeout(function() {
            console.log(this.name) // this指向window/global，不是obj
        }, 1000)
    }
}

// 问题9: 内存泄漏风险
function createMemoryLeak() {
    const element = document.getElementById('test')
    element.addEventListener('click', function() {
        // 事件监听器未移除
        console.log('clicked')
    })
}

// 问题10: 类型转换不当
function badTypeConversion(value) {
    if (value == null) { // 应该用 === null 或 === undefined
        return 'null or undefined'
    }
    return value.toString()
}

// 问题11: 数组操作不当
function badArrayOperation() {
    const arr = [1, 2, 3]
    arr[10] = 10 // 创建稀疏数组
    return arr.length // 返回11，但实际只有4个元素
}

// 问题12: 对象属性访问不当
function badObjectAccess(obj) {
    return obj.property.anotherProperty.deepProperty // 可能抛出错误
}

// 问题13: 正则表达式效率问题
function badRegex() {
    const text = 'test string'
    const regex = /(a+)+b/ // 灾难性回溯
    return regex.test(text)
}

// 问题14: 闭包中的变量引用问题
function createClosure() {
    const elements = []
    for (var i = 0; i < 10; i++) { // 应该用let
        elements.push(function() {
            return i // 所有闭包都引用同一个i
        })
    }
    return elements
}

// 问题15: 原型污染
function prototypePollution() {
    const obj = {}
    obj.__proto__.polluted = true // 污染原型链
}

// 问题16: 全局变量污染
globalVariable = 'polluting global scope'

// 问题17: 缺少严格模式
function noStrictMode() {
    undeclaredVar = 'this should cause error in strict mode'
}

// 问题18: 事件处理不当
function badEventHandler() {
    document.addEventListener('scroll', function() {
        // 滚动事件可能频繁触发，缺少节流
        console.log('scrolling')
    })
}

// 问题19: 资源清理不当
function badResourceManagement() {
    const interval = setInterval(() => {
        console.log('tick')
    }, 1000)
    // 缺少clearInterval
}

// 问题20: 错误处理不当
function badErrorHandling() {
    try {
        throw new Error('test error')
    } catch (e) {
        // 错误被静默忽略
    }
}

// 问题21: 性能问题
function performanceIssue() {
    const items = []
    for (let i = 0; i < 10000; i++) {
        items.push({ id: i, data: 'test' })
    }
    
    // 在循环中查找
    for (let i = 0; i < items.length; i++) {
        const found = items.find(item => item.id === i) // 每次都要遍历
        console.log(found)
    }
}

// 问题22: 安全漏洞
function securityVulnerability() {
    const userInput = document.getElementById('userInput').value
    eval(userInput) // 代码注入风险
}

// 问题23: 模块导出不当
export default {
    // 缺少方法实现
    method1: function() {},
    method2: function() {
        throw new Error('Not implemented')
    }
}
