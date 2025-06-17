// 配置文件模板
// 复制此文件为 config.js 并填入实际配置

module.exports = {
    // 网站配置
    website: {
        url: 'https://example.com',  // 网站地址
        username: 'your_username',   // 登录用户名
        password: 'your_password'    // 登录密码
    },
    
    // 自动化配置
    automation: {
        maxRetries: 3,              // 最大重试次数
        retryDelay: 5000,           // 重试延迟（毫秒）
        timeout: 30000              // 操作超时时间（毫秒）
    },
    
    // 通知配置
    notification: {
        enabled: true,              // 是否启用通知
        email: {
            enabled: false,         // 是否启用邮件通知
            smtp: {
                host: 'smtp.example.com',
                port: 587,
                secure: true,
                auth: {
                    user: 'your_email@example.com',
                    pass: 'your_email_password'
                }
            },
            recipients: ['recipient@example.com']
        },
        webhook: {
            enabled: false,         // 是否启用 Webhook 通知
            url: 'https://webhook.example.com/notify'
        }
    },
    
    // 日志配置
    logging: {
        level: 'info',             // 日志级别：debug, info, warn, error
        file: 'app.log'            // 日志文件名
    }
}; 