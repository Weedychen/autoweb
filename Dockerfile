# 使用Node.js官方镜像作为基础镜像
FROM node:18-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# 安装Chrome依赖
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 安装Playwright浏览器
RUN npx playwright install chromium

# 复制项目文件
COPY . .

# 创建下载目录
RUN mkdir -p /app/downloads

# 设置环境变量
ENV NODE_ENV=production
ENV DOWNLOAD_PATH=/app/downloads

# 运行脚本
CMD ["node", "--expose-gc", "main.js"] 