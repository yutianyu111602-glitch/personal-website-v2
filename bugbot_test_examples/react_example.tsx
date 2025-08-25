/**
 * BugBot测试示例 - React版本
 * 这个文件包含故意编写的常见React问题，用于测试BugBot的审查能力
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'

// 问题1: 组件缺少类型定义
function BadComponent(props) {
    return <div>{props.name}</div>
}

// 问题2: 状态更新不当
function BadStateUpdate() {
    const [count, setCount] = useState(0)
    
    const increment = () => {
        setCount(count + 1) // 应该用函数式更新
    }
    
    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={increment}>Increment</button>
        </div>
    )
}

// 问题3: useEffect缺少依赖
function BadUseEffect() {
    const [data, setData] = useState(null)
    const [id, setId] = useState(1)
    
    useEffect(() => {
        fetch(`/api/data/${id}`)
            .then(res => res.json())
            .then(setData)
    }, []) // 缺少id依赖
    
    return <div>{JSON.stringify(data)}</div>
}

// 问题4: 事件处理函数缺少useCallback
function BadEventHandler() {
    const [items, setItems] = useState([])
    
    const addItem = (item) => { // 应该用useCallback包装
        setItems([...items, item])
    }
    
    return (
        <div>
            {items.map((item, index) => (
                <div key={index}>{item}</div> // 应该用唯一ID
            ))}
            <button onClick={() => addItem('new item')}>Add Item</button>
        </div>
    )
}

// 问题5: 计算值缺少useMemo
function BadMemoization() {
    const [numbers, setNumbers] = useState([1, 2, 3, 4, 5])
    
    const sum = numbers.reduce((acc, num) => acc + num, 0) // 应该用useMemo
    
    return (
        <div>
            <p>Sum: {sum}</p>
            <button onClick={() => setNumbers([...numbers, Math.random()])}>
                Add Number
            </button>
        </div>
    )
}

// 问题6: 组件缺少key属性
function BadKeyUsage() {
    const [items, setItems] = useState(['a', 'b', 'c'])
    
    return (
        <div>
            {items.map((item, index) => (
                <div key={index}>{item}</div> // 应该用唯一值
            ))}
        </div>
    )
}

// 问题7: 异步操作缺少错误处理
function BadAsyncHandling() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    
    const fetchData = async () => {
        setLoading(true)
        const response = await fetch('/api/data')
        const result = await response.json()
        setData(result)
        setLoading(false)
        // 缺少错误处理
    }
    
    return (
        <div>
            {loading && <p>Loading...</p>}
            {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
            <button onClick={fetchData}>Fetch Data</button>
        </div>
    )
}

// 问题8: 内存泄漏风险
function BadMemoryLeak() {
    const [count, setCount] = useState(0)
    
    useEffect(() => {
        const interval = setInterval(() => {
            setCount(c => c + 1)
        }, 1000)
        
        // 缺少清理函数
    }, [])
    
    return <div>Count: {count}</div>
}

// 问题9: 条件渲染不当
function BadConditionalRendering() {
    const [show, setShow] = useState(false)
    const [data, setData] = useState(null)
    
    return (
        <div>
            {show && data && <div>{data.name}</div>} {/* 可能渲染undefined */}
            <button onClick={() => setShow(!show)}>Toggle</button>
        </div>
    )
}

// 问题10: 表单处理不当
function BadFormHandling() {
    const [formData, setFormData] = useState({})
    
    const handleSubmit = (e) => {
        e.preventDefault()
        console.log(formData) // 缺少验证
    }
    
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }
    
    return (
        <form onSubmit={handleSubmit}>
            <input
                name="username"
                onChange={handleChange}
                // 缺少value属性
            />
            <button type="submit">Submit</button>
        </form>
    )
}

// 问题11: 性能问题
function BadPerformance() {
    const [items, setItems] = useState(Array.from({ length: 1000 }, (_, i) => i))
    
    const filteredItems = items.filter(item => item % 2 === 0) // 每次渲染都重新计算
    
    return (
        <div>
            {filteredItems.map(item => (
                <div key={item}>{item}</div>
            ))}
        </div>
    )
}

// 问题12: 可访问性问题
function BadAccessibility() {
    return (
        <div>
            <div onClick={() => console.log('clicked')}>Click me</div> {/* 缺少role和aria-label */}
            <img src="/image.jpg" /> {/* 缺少alt属性 */}
            <button>Submit</button> {/* 缺少aria-label */}
        </div>
    )
}

// 问题13: 组件拆分不当
function BadComponentStructure() {
    const [user, setUser] = useState(null)
    const [posts, setPosts] = useState([])
    const [comments, setComments] = useState([])
    
    // 组件过于复杂，应该拆分
    
    return (
        <div>
            {/* 用户信息 */}
            {user && (
                <div>
                    <h1>{user.name}</h1>
                    <p>{user.email}</p>
                    <p>{user.bio}</p>
                </div>
            )}
            
            {/* 文章列表 */}
            <div>
                <h2>Posts</h2>
                {posts.map(post => (
                    <div key={post.id}>
                        <h3>{post.title}</h3>
                        <p>{post.content}</p>
                    </div>
                ))}
            </div>
            
            {/* 评论列表 */}
            <div>
                <h2>Comments</h2>
                {comments.map(comment => (
                    <div key={comment.id}>
                        <p>{comment.text}</p>
                        <small>{comment.author}</small>
                    </div>
                ))}
            </div>
        </div>
    )
}

// 问题14: Hook使用不当
function BadHookUsage() {
    const [count, setCount] = useState(0)
    
    if (count > 5) {
        useEffect(() => {
            console.log('Count is high')
        }, [count]) // Hook在条件语句中
    }
    
    return <div>Count: {count}</div>
}

// 问题15: 事件冒泡处理不当
function BadEventHandling() {
    const handleClick = (e) => {
        e.stopPropagation() // 阻止事件冒泡，可能影响其他功能
        console.log('clicked')
    }
    
    return (
        <div onClick={() => console.log('parent clicked')}>
            <button onClick={handleClick}>Click me</button>
        </div>
    )
}

// 问题16: 状态更新顺序问题
function BadStateOrder() {
    const [count, setCount] = useState(0)
    
    const incrementTwice = () => {
        setCount(count + 1)
        setCount(count + 1) // 两次更新都基于同一个值
    }
    
    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={incrementTwice}>Increment Twice</button>
        </div>
    )
}

// 问题17: 组件缺少错误边界
function BadErrorBoundary() {
    const [data, setData] = useState(null)
    
    if (!data) {
        throw new Error('Data is required') // 应该用错误边界处理
    }
    
    return <div>{data.name}</div>
}

// 问题18: 国际化处理不当
function BadInternationalization() {
    const messages = {
        en: { hello: 'Hello' },
        zh: { hello: '你好' }
    }
    
    const language = 'en'
    
    return (
        <div>
            <h1>{messages[language].hello}</h1> {/* 硬编码语言 */}
        </div>
    )
}

// 问题19: 主题处理不当
function BadThemeHandling() {
    const [theme, setTheme] = useState('light')
    
    const styles = {
        light: { backgroundColor: 'white', color: 'black' },
        dark: { backgroundColor: 'black', color: 'white' }
    }
    
    return (
        <div style={styles[theme]}>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                Toggle Theme
            </button>
        </div>
    )
}

// 问题20: 路由处理不当
function BadRouting() {
    const [currentPage, setCurrentPage] = useState('home')
    
    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <div>Home Page</div>
            case 'about':
                return <div>About Page</div>
            case 'contact':
                return <div>Contact Page</div>
            default:
                return <div>404 Not Found</div>
        }
    }
    
    return (
        <div>
            {renderPage()}
            <nav>
                <button onClick={() => setCurrentPage('home')}>Home</button>
                <button onClick={() => setCurrentPage('about')}>About</button>
                <button onClick={() => setCurrentPage('contact')}>Contact</button>
            </nav>
        </div>
    )
}
