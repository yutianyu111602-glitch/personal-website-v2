/**
 * BugBot测试示例 - TypeScript版本
 * 这个文件包含故意编写的常见TypeScript问题，用于测试BugBot的审查能力
 */

// 问题1: 隐式any类型
function implicitAny(param) {
    return param.length // param类型为any
}

// 问题2: 类型断言不当
function badTypeAssertion(value: unknown) {
    const str = value as string // 强制类型断言，可能不安全
    return str.toUpperCase()
}

// 问题3: 接口定义不完整
interface IncompleteInterface {
    name: string
    // 缺少其他必要属性
}

// 问题4: 泛型使用不当
function badGeneric<T>(items: T[]): T {
    return items[0] // 可能返回undefined
}

// 问题5: 联合类型处理不当
function badUnionType(value: string | number) {
    if (typeof value === 'string') {
        return value.length
    }
    // 缺少number类型的处理
}

// 问题6: 可选属性访问不当
interface User {
    name?: string
    email?: string
}

function badOptionalAccess(user: User) {
    return user.name.toUpperCase() // 可能抛出错误
}

// 问题7: 函数重载定义不当
function overloadedFunction(x: string): string
function overloadedFunction(x: number): number
function overloadedFunction(x: any): any {
    return x
}

// 问题8: 枚举使用不当
enum BadEnum {
    A = 1,
    B = 2,
    C = 3
}

function badEnumUsage(value: BadEnum) {
    if (value === 4) { // 4不在枚举中
        return 'invalid'
    }
    return 'valid'
}

// 问题9: 类型守卫不当
function badTypeGuard(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0
}

// 问题10: 映射类型使用不当
type BadMappedType = {
    [K in 'a' | 'b' | 'c']: string
}

// 问题11: 条件类型使用不当
type BadConditionalType<T> = T extends string ? string : number

// 问题12: 索引签名不当
interface BadIndexSignature {
    [key: string]: any // 过于宽泛
}

// 问题13: 函数类型定义不当
type BadFunctionType = (x: any, y: any) => any

// 问题14: 类继承不当
class BaseClass {
    protected baseMethod() {
        return 'base'
    }
}

class DerivedClass extends BaseClass {
    public baseMethod() { // 改变了访问修饰符
        return 'derived'
    }
}

// 问题15: 抽象类实现不当
abstract class AbstractClass {
    abstract abstractMethod(): string
}

class ConcreteClass extends AbstractClass {
    // 缺少抽象方法实现
}

// 问题16: 装饰器使用不当
function badDecorator(target: any, propertyKey: string) {
    // 装饰器逻辑不当
    target[propertyKey] = 'modified'
}

class DecoratedClass {
    @badDecorator
    property: string = 'original'
}

// 问题17: 命名空间使用不当
namespace BadNamespace {
    export const value = 42
    // 缺少类型定义
}

// 问题18: 模块导入导出不当
export * from './non-existent-module' // 模块不存在

// 问题19: 类型别名使用不当
type BadTypeAlias = any // 过于宽泛

// 问题20: 字面量类型使用不当
type BadLiteralType = 'a' | 'b' | 'c' | string // 冗余

// 问题21: 元组类型使用不当
type BadTuple = [string, number, ...any[]] // 可变长度元组

// 问题22: 交叉类型使用不当
type BadIntersection = string & number // 不可能的类型

// 问题23: 条件类型中的循环引用
type CircularType<T> = T extends never ? never : CircularType<T>

// 问题24: 泛型约束不当
function badGenericConstraint<T extends object>(obj: T) {
    return Object.keys(obj) // 可能返回空数组
}

// 问题25: 类型推断问题
const badInference = [] // 类型为never[]
badInference.push(1) // 类型错误

// 问题26: 严格模式问题
function strictModeIssues() {
    let x: string | null = null
    x = 'test'
    x = null
    return x.length // 可能为null
}

// 问题27: 异步类型处理不当
async function badAsyncType(): Promise<string> {
    const result = await Promise.resolve(42)
    return result // 类型不匹配
}

// 问题28: 事件类型定义不当
interface BadEvent {
    type: string
    target: any // 应该更具体
}

// 问题29: 回调函数类型不当
function badCallback(callback: Function) { // 应该更具体
    callback('test')
}

// 问题30: 类型断言链
function badTypeAssertionChain(value: unknown) {
    return (value as any).property.subProperty as string
}
