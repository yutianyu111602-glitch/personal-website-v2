# 🚀 重要功能更新端口指南

## 📋 概述

本文档详细说明了个人网站项目V2中所有重要功能的更新端口，通过修改 `main_config.json` 配置文件，可以动态调整系统行为，无需重启服务。

## 🔧 配置文件结构

主配置文件位于：`config/main_config.json`

```json
{
  "ports": { ... },           // 服务端口配置
  "api": { ... },             // API端点配置
  "ai": { ... },              // AI服务配置
  "paths": { ... },           // 文件路径配置
  "features": { ... },        // 功能开关配置
  "performance": { ... },     // 性能参数配置
  "security": { ... },        // 安全配置
  "monitoring": { ... },      // 监控配置
  "development": { ... },     // 开发模式配置
  "deployment": { ... }       // 部署配置
}
```

## 🎯 核心功能更新端口

### 1. 情绪核心系统 (EmotionCore)

**配置文件路径**: `features.emotionCore`

**可更新参数**:
- `unifiedLoop`: 是否启用统一循环模式
- `tickIntervalMs`: 主循环间隔（毫秒）
- `enableTechniqueBridge`: 是否启用切歌手法桥接
- `enableRandomAlgorithm`: 是否启用随机算法
- `enableEmotionDrivenRandomness`: 是否启用情绪驱动随机性
- `enableAIControl`: 是否启用AI完全控制预设
- `conservativeDropout`: 网络抖动阈值

**实时更新**: ✅ 支持（通过事件系统）

**示例更新**:
```json
{
  "features": {
    "emotionCore": {
      "tickIntervalMs": 250,        // 加快情绪更新频率
      "enableAIControl": false,     // 关闭AI控制，使用基础预设
      "conservativeDropout": 0.1    // 提高网络容错性
    }
  }
}
```

### 2. 可视化系统 (Visualization)

**配置文件路径**: `features.visualization`

**可更新参数**:
- `overlay.blendMode`: 叠加层混合模式
- `overlay.opacity`: 叠加层透明度
- `overlay.highFps`: 是否启用高帧率
- `shaders.count`: Shader数量
- `shaders.autoSwitch`: 是否自动切换
- `shaders.switchInterval`: 切换间隔

**实时更新**: ✅ 支持（通过预设事件）

**示例更新**:
```json
{
  "features": {
    "visualization": {
      "overlay": {
        "blendMode": "multiply",    // 改变混合模式
        "opacity": 0.95             // 提高透明度
      },
      "shaders": {
        "switchInterval": 5000      // 加快Shader切换速度
      }
    }
  }
}
```

### 3. 电台播放器 (Radio)

**配置文件路径**: `features.radio`

**可更新参数**:
- `enableWavesurfer`: 是否启用波形显示
- `enableMonitoring`: 是否启用监控面板
- `enableTechniqueSelector`: 是否启用手法选择器
- `snapToEdges`: 是否启用边缘吸附
- `rememberPosition`: 是否记住位置

**实时更新**: ✅ 支持（通过组件状态）

**示例更新**:
```json
{
  "features": {
    "radio": {
      "enableMonitoring": false,    // 关闭监控面板
      "snapToEdges": false         // 关闭边缘吸附
    }
  }
}
```

### 4. 布局系统 (Layout)

**配置文件路径**: `features.layout`

**可更新参数**:
- `focus.organizer.width/height`: 组织器尺寸
- `focus.taskLogger.width`: 任务日志宽度
- `responsive`: 是否启用响应式
- `mobileOptimized`: 是否优化移动端

**实时更新**: ✅ 支持（通过CSS变量）

**示例更新**:
```json
{
  "features": {
    "layout": {
      "focus": {
        "organizer": {
          "width": 800,             // 扩大组织器宽度
          "height": 100             // 增加组织器高度
        },
        "taskLogger": {
          "width": 300              // 扩大任务日志宽度
        }
      }
    }
  }
}
```

## ⚡ 性能参数更新端口

### 1. 渲染性能 (Rendering)

**配置文件路径**: `performance.rendering`

**可更新参数**:
- `targetFps`: 目标帧率
- `maxFps`: 最大帧率
- `vsync`: 是否启用垂直同步
- `hardwareAcceleration`: 是否启用硬件加速

**实时更新**: ✅ 支持（通过WebGL上下文）

**示例更新**:
```json
{
  "performance": {
    "rendering": {
      "targetFps": 30,             // 降低帧率节省性能
      "hardwareAcceleration": false // 关闭硬件加速
    }
  }
}
```

### 2. 内存管理 (Memory)

**配置文件路径**: `performance.memory`

**可更新参数**:
- `maxHeapSize`: 最大堆大小
- `gcThreshold`: 垃圾回收阈值
- `cleanupInterval`: 清理间隔

**实时更新**: ⚠️ 部分支持（需要重启）

**示例更新**:
```json
{
  "performance": {
    "memory": {
      "maxHeapSize": "1GB",        // 增加内存限制
      "gcThreshold": 0.9           // 提高GC阈值
    }
  }
}
```

### 3. 网络性能 (Network)

**配置文件路径**: `performance.network`

**可更新参数**:
- `maxConcurrentRequests`: 最大并发请求数
- `requestTimeout`: 请求超时时间
- `retryAttempts`: 重试次数

**实时更新**: ✅ 支持（通过HTTP客户端）

**示例更新**:
```json
{
  "performance": {
    "network": {
      "maxConcurrentRequests": 20,  // 增加并发数
      "requestTimeout": 15000       // 延长超时时间
    }
  }
}
```

## 🔒 安全配置更新端口

### 1. CORS设置 (CORS)

**配置文件路径**: `security.cors`

**可更新参数**:
- `enabled`: 是否启用CORS
- `allowedOrigins`: 允许的源
- `credentials`: 是否允许凭据

**实时更新**: ⚠️ 需要重启服务

**示例更新**:
```json
{
  "security": {
    "cors": {
      "allowedOrigins": [
        "http://localhost:3000",
        "http://localhost:3500",
        "https://your-domain.com"
      ]
    }
  }
}
```

### 2. 速率限制 (Rate Limiting)

**配置文件路径**: `security.rateLimit`

**可更新参数**:
- `enabled`: 是否启用速率限制
- `maxRequestsPerMinute`: 每分钟最大请求数
- `maxRequestsPerHour`: 每小时最大请求数

**实时更新**: ✅ 支持（通过中间件）

**示例更新**:
```json
{
  "security": {
    "rateLimit": {
      "maxRequestsPerMinute": 200,  // 提高限制
      "maxRequestsPerHour": 2000    // 提高限制
    }
  }
}
```

### 3. 验证设置 (Validation)

**配置文件路径**: `security.validation`

**可更新参数**:
- `enableEventValidation`: 是否启用事件验证
- `enableInputSanitization`: 是否启用输入清理
- `enableOutputEncoding`: 是否启用输出编码

**实时更新**: ✅ 支持（通过验证器）

**示例更新**:
```json
{
  "security": {
    "validation": {
      "enableEventValidation": false,    // 关闭事件验证（调试用）
      "enableInputSanitization": true    // 启用输入清理
    }
  }
}
```

## 📊 监控配置更新端口

### 1. 健康检查 (Health Check)

**配置文件路径**: `monitoring.healthCheck`

**可更新参数**:
- `enabled`: 是否启用健康检查
- `interval`: 检查间隔
- `timeout`: 检查超时

**实时更新**: ✅ 支持（通过监控服务）

**示例更新**:
```json
{
  "monitoring": {
    "healthCheck": {
      "interval": 15000,           // 加快检查频率
      "timeout": 3000              // 减少超时时间
    }
  }
}
```

### 2. 日志配置 (Logging)

**配置文件路径**: `monitoring.logging`

**可更新参数**:
- `level`: 日志级别
- `format`: 日志格式
- `maxFileSize`: 最大文件大小
- `maxFiles`: 最大文件数

**实时更新**: ⚠️ 部分支持（需要重启日志服务）

**示例更新**:
```json
{
  "monitoring": {
    "logging": {
      "level": "debug",            // 提高日志级别
      "maxFileSize": "20MB"        // 增加文件大小
    }
  }
}
```

### 3. 指标收集 (Metrics)

**配置文件路径**: `monitoring.metrics`

**可更新参数**:
- `enabled`: 是否启用指标收集
- `collectInterval`: 收集间隔
- `retentionDays`: 保留天数

**实时更新**: ✅ 支持（通过指标服务）

**示例更新**:
```json
{
  "monitoring": {
    "metrics": {
      "collectInterval": 30000,    // 加快收集频率
      "retentionDays": 60          // 延长保留时间
    }
  }
}
```

## 🛠️ 开发模式更新端口

### 1. 开发工具 (Development Tools)

**配置文件路径**: `development`

**可更新参数**:
- `hotReload`: 是否启用热重载
- `sourceMaps`: 是否启用源码映射
- `debugMode`: 是否启用调试模式

**实时更新**: ⚠️ 部分支持（需要重启开发服务器）

**示例更新**:
```json
{
  "development": {
    "hotReload": false,            // 关闭热重载
    "debugMode": false             // 关闭调试模式
  }
}
```

### 2. 模拟服务 (Mock Services)

**配置文件路径**: `development.mockServices`

**可更新参数**:
- `termusic`: 是否模拟Termusic服务
- `audio`: 是否模拟音频服务
- `stream`: 是否模拟流媒体服务

**实时更新**: ✅ 支持（通过服务代理）

**示例更新**:
```json
{
  "development": {
    "mockServices": {
      "termusic": false,           // 关闭模拟，使用真实服务
      "audio": false               // 关闭模拟，使用真实服务
    }
  }
}
```

### 3. 测试数据 (Test Data)

**配置文件路径**: `development.testData`

**可更新参数**:
- `enableMockAudio`: 是否启用模拟音频
- `enableMockPlaylists`: 是否启用模拟歌单
- `enableMockEvents`: 是否启用模拟事件

**实时更新**: ✅ 支持（通过数据提供者）

**示例更新**:
```json
{
  "development": {
    "testData": {
      "enableMockAudio": false,    // 使用真实音频文件
      "enableMockPlaylists": false // 使用真实歌单
    }
  }
}
```

## 🚀 部署配置更新端口

### 1. 环境设置 (Environment)

**配置文件路径**: `deployment`

**可更新参数**:
- `environment`: 部署环境
- `autoUpdate`: 是否自动更新
- `backupBeforeDeploy`: 是否部署前备份
- `healthCheckAfterDeploy`: 是否部署后健康检查
- `rollbackOnFailure`: 是否失败时回滚

**实时更新**: ⚠️ 部分支持（需要重新部署）

**示例更新**:
```json
{
  "deployment": {
    "environment": "production",    // 切换到生产环境
    "autoUpdate": false,           // 关闭自动更新
    "rollbackOnFailure": true      // 启用失败回滚
  }
}
```

## 📝 更新方法

### 1. 直接修改配置文件

```bash
# 编辑主配置文件
vim config/main_config.json

# 或者使用其他编辑器
code config/main_config.json
```

### 2. 通过API更新（推荐）

```bash
# 更新情绪核心配置
curl -X POST http://localhost:3500/api/config/update \
  -H "Content-Type: application/json" \
  -d '{
    "path": "features.emotionCore.tickIntervalMs",
    "value": 250
  }'

# 更新可视化配置
curl -X POST http://localhost:3500/api/config/update \
  -H "Content-Type: application/json" \
  -d '{
    "path": "features.visualization.overlay.opacity",
    "value": 0.95
  }'
```

### 3. 通过环境变量覆盖

```bash
# 覆盖端口配置
export WEBUI_PORT=3010
export METADATA_PORT=3510

# 覆盖功能配置
export EMOTION_CORE_TICK_INTERVAL=250
export VISUALIZATION_OVERLAY_OPACITY=0.95
```

## 🔄 配置热重载

### 1. 自动重载

系统会监控配置文件变化，自动重载配置：

```json
{
  "monitoring": {
    "configReload": {
      "enabled": true,
      "watchInterval": 5000,
      "autoReload": true
    }
  }
}
```

### 2. 手动重载

```bash
# 发送重载信号
curl -X POST http://localhost:3500/api/config/reload

# 或者重启服务
./oneclick_start.sh --restart
```

## ⚠️ 注意事项

1. **实时更新限制**: 某些配置需要重启服务才能生效
2. **配置验证**: 所有配置更新都会进行验证，无效配置会被拒绝
3. **备份建议**: 重要配置更新前建议备份原配置
4. **权限控制**: 生产环境建议限制配置更新权限
5. **监控告警**: 配置异常变化会触发告警

## 📚 相关文档

- [主配置文件](./main_config.json)
- [配置验证规则](./validation_rules.md)
- [配置更新API](./config_api.md)
- [配置最佳实践](./best_practices.md)

---

**最后更新**: 2025-01-25  
**维护者**: AI助手  
**版本**: 1.0.0
