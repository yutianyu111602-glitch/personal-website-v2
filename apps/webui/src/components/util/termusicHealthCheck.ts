/**
 * Termusic后端健康检查和连接测试工具
 * 用于诊断和验证后端连接状态
 */

interface HealthCheckResult {
  isHealthy: boolean;
  endpoint: string;
  status: number | null;
  latency: number;
  error?: string;
  capabilities?: string[];
  version?: string;
  timestamp: number;
}

interface ConnectionTestConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  timeout: number;
  retries: number;
}

// 默认测试配置
const DEFAULT_TEST_CONFIG: ConnectionTestConfig = {
  host: 'localhost',
  port: 7533,
  protocol: 'http',
  timeout: 5000,
  retries: 3
};

/**
 * Termusic后端健康检查器
 */
export class TermusicHealthChecker {
  private config: ConnectionTestConfig;
  
  constructor(config: Partial<ConnectionTestConfig> = {}) {
    this.config = { ...DEFAULT_TEST_CONFIG, ...config };
  }
  
  /**
   * 执行完整的健康检查
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    const endpoint = `${this.config.protocol}://${this.config.host}:${this.config.port}`;
    
    try {
      // 基础连接测试
      const healthResult = await this.testHealthEndpoint();
      
      if (healthResult.isHealthy) {
        // 扩展功能测试
        const capabilities = await this.detectCapabilities();
        const version = await this.getVersion();
        
        return {
          ...healthResult,
          capabilities,
          version,
          latency: performance.now() - startTime
        };
      }
      
      return healthResult;
    } catch (error) {
      return {
        isHealthy: false,
        endpoint,
        status: null,
        latency: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * 测试基础健康端点
   */
  private async testHealthEndpoint(): Promise<HealthCheckResult> {
    const endpoint = `${this.config.protocol}://${this.config.host}:${this.config.port}`;
    
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await fetch(`${endpoint}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'TiangongApp/2.0 HealthChecker'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        return {
          isHealthy: response.ok,
          endpoint,
          status: response.status,
          latency: 0, // 将在上层计算
          error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
          timestamp: Date.now()
        };
        
      } catch (error) {
        console.warn(`🔄 健康检查尝试 ${attempt}/${this.config.retries} 失败:`, error);
        
        if (attempt === this.config.retries) {
          throw error;
        }
        
        // 重试间隔 (指数退避)
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
    
    throw new Error('所有重试尝试都失败了');
  }
  
  /**
   * 检测后端支持的功能
   */
  private async detectCapabilities(): Promise<string[]> {
    const capabilities: string[] = [];
    const endpoint = `${this.config.protocol}://${this.config.host}:${this.config.port}`;
    
    // 测试各种API端点
    const testEndpoints = [
      { name: 'player_control', path: '/api/player/status' },
      { name: 'playlist_management', path: '/api/playlist' },  
      { name: 'websocket_support', path: '/ws' },
      { name: 'volume_control', path: '/api/player/volume' },
      { name: 'track_info', path: '/api/player/current-track' }
    ];
    
    for (const test of testEndpoints) {
      try {
        const response = await fetch(`${endpoint}${test.path}`, {
          method: 'HEAD', // 使用HEAD请求减少开销
          signal: AbortSignal.timeout(2000)
        });
        
        if (response.ok || response.status === 405) { // 405 Method Not Allowed 也表示端点存在
          capabilities.push(test.name);
        }
      } catch (error) {
        // 忽略单个端点的错误
        console.debug(`端点 ${test.path} 测试失败:`, error);
      }
    }
    
    return capabilities;
  }
  
  /**
   * 获取后端版本信息
   */
  private async getVersion(): Promise<string | undefined> {
    try {
      const endpoint = `${this.config.protocol}://${this.config.host}:${this.config.port}`;
      const response = await fetch(`${endpoint}/api/version`, {
        signal: AbortSignal.timeout(2000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.version || data.build || 'unknown';
      }
    } catch (error) {
      console.debug('版本信息获取失败:', error);
    }
    
    return undefined;
  }
  
  /**
   * 测试WebSocket连接
   */
  async testWebSocketConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const wsUrl = `ws://${this.config.host}:${this.config.port}/ws`;
        const ws = new WebSocket(wsUrl);
        
        const timeout = setTimeout(() => {
          ws.close();
          resolve(false);
        }, this.config.timeout);
        
        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        };
        
        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
        
      } catch (error) {
        resolve(false);
      }
    });
  }
  
  /**
   * 延迟工具函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 生成健康检查报告
   */
  generateHealthReport(result: HealthCheckResult): string {
    const lines = [
      '🏥 Termusic后端健康检查报告',
      '=' .repeat(40),
      `📡 端点: ${result.endpoint}`,
      `⚡ 状态: ${result.isHealthy ? '✅ 健康' : '❌ 不健康'}`,
      `🕐 延迟: ${result.latency.toFixed(2)}ms`,
      `📊 HTTP状态: ${result.status || 'N/A'}`,
    ];
    
    if (result.error) {
      lines.push(`❌ 错误: ${result.error}`);
    }
    
    if (result.version) {
      lines.push(`📦 版本: ${result.version}`);
    }
    
    if (result.capabilities && result.capabilities.length > 0) {
      lines.push(`🛠️  功能支持:`);
      result.capabilities.forEach(cap => {
        lines.push(`   • ${cap.replace('_', ' ').toUpperCase()}`);
      });
    }
    
    lines.push(`🕐 检查时间: ${new Date(result.timestamp).toLocaleString()}`);
    
    return lines.join('\n');
  }
}

/**
 * 便捷的健康检查函数
 */
export async function quickHealthCheck(
  host: string = 'localhost', 
  port: number = 7533
): Promise<HealthCheckResult> {
  const checker = new TermusicHealthChecker({ host, port });
  return await checker.performHealthCheck();
}

/**
 * 网络连通性测试
 */
export async function testNetworkConnectivity(
  host: string = 'localhost',
  port: number = 7533
): Promise<boolean> {
  try {
    // 使用简单的TCP连接测试
    const response = await fetch(`http://${host}:${port}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000),
      mode: 'no-cors' // 避免CORS问题
    });
    
    return true; // 能发出请求就说明网络通
  } catch (error) {
    return false;
  }
}

/**
 * 端口占用检查
 */
export async function checkPortAvailability(
  host: string = 'localhost',
  port: number = 7533
): Promise<{ available: boolean; service?: string }> {
  try {
    const response = await fetch(`http://${host}:${port}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(2000)
    });
    
    // 端口被占用，尝试识别服务
    const server = response.headers.get('Server') || 'Unknown Service';
    
    return {
      available: false,
      service: server
    };
  } catch (error) {
    // 连接失败可能意味着端口可用
    return { available: true };
  }
}

/**
 * 诊断连接问题
 */
export async function diagnoseConnectionIssues(
  host: string = 'localhost',
  port: number = 7533
): Promise<string[]> {
  const issues: string[] = [];
  
  // 1. 网络连通性测试
  const networkOk = await testNetworkConnectivity(host, port);
  if (!networkOk) {
    issues.push(`无法连接到 ${host}:${port} - 检查网络连接`);
  }
  
  // 2. 端口可用性检查
  const portCheck = await checkPortAvailability(host, port);
  if (!portCheck.available && portCheck.service && !portCheck.service.includes('termusic')) {
    issues.push(`端口 ${port} 被其他服务占用: ${portCheck.service}`);
  }
  
  // 3. 健康检查
  try {
    const healthResult = await quickHealthCheck(host, port);
    if (!healthResult.isHealthy) {
      issues.push(`健康检查失败: ${healthResult.error}`);
    }
  } catch (error) {
    issues.push(`健康检查异常: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // 4. WebSocket测试
  const checker = new TermusicHealthChecker({ host, port });
  const wsOk = await checker.testWebSocketConnection();
  if (!wsOk) {
    issues.push('WebSocket连接失败 - 实时功能将不可用');
  }
  
  if (issues.length === 0) {
    issues.push('未发现明显问题，连接应该正常工作');
  }
  
  return issues;
}

// 导出单例实例供全局使用
export const globalHealthChecker = new TermusicHealthChecker();