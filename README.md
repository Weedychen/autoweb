# AutoWeb 舆情数据自动导出工具

这是一个基于Playwright的自动化工具，用于定时导出舆情数据。

## 功能特点

- 自动在工作日14:00执行导出任务
- 支持多主题批量导出
- 自动处理下载文件
- Docker容器化部署
- 资源使用优化

## 系统要求

- Node.js 18+
- Docker
- Docker Compose

## 快速开始

1. 克隆仓库：
```bash
git clone https://github.com/你的用户名/autoweb.git
cd autoweb
```

2. 使用Docker部署：
```bash
# 创建下载目录
mkdir -p downloads

# 构建并启动容器
docker-compose up -d --build

# 查看日志
docker-compose logs -f
```

## 配置说明

1. 环境变量：
- `DOWNLOAD_PATH`: 下载文件保存路径
- `TZ`: 时区设置（默认Asia/Shanghai）

2. 资源限制：
- CPU: 2核
- 内存: 2GB

## 目录结构

```
autoweb/
├── main.js          # 主程序
├── config.js        # 配置文件
├── utils.js         # 工具函数
├── Dockerfile       # Docker构建文件
├── docker-compose.yml # Docker编排文件
└── downloads/       # 下载文件目录
```

## 注意事项

1. 确保服务器时间准确
2. 确保下载目录有正确的权限
3. 建议使用监控脚本确保服务持续运行

## 许可证

MIT License 