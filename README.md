# 舆情数据自动导出工具

这是一个用于自动导出舆情数据的工具，支持定时执行和数据导出功能。

## 功能特点

- 自动定时执行
- 支持工作日判断
- 自动记录执行状态
- 批量导出数据
- 自动处理下载文件

## 安装步骤

1. 克隆项目
```bash
git clone https://github.com/Weedychen/autoweb.git
cd autoweb
```

2. 安装依赖
```bash
npm install
```

3. 配置项目
- 复制 `config.example.js` 为 `config.js`
- 在 `config.js` 中配置你的 Cookie 信息
- 根据需要修改其他配置项

## 使用方法

1. 运行安装脚本
```bash
.\install.bat
```

2. 运行程序
```bash
.\run.bat
```

## 配置说明

### 敏感信息配置

1. 创建 `config.js` 文件（不要直接修改 `config.example.js`）
2. 在 `config.js` 中配置你的 Cookie 信息
3. 确保 `config.js` 已添加到 `.gitignore` 中

### 执行时间配置

- 默认执行时间：14:00
- 支持工作日判断
- 支持节假日配置

## 注意事项

1. 请勿将包含敏感信息的配置文件上传到代码仓库
2. 定期更新 Cookie 信息
3. 确保下载路径有足够的存储空间

## 文件说明

- `main.js`: 主程序文件
- `config.js`: 配置文件（需要自行创建）
- `config.example.js`: 配置示例文件
- `execution_record.js`: 执行记录管理
- `utils.js`: 工具函数
- `install.bat`: 安装脚本
- `run.bat`: 运行脚本

## 开发说明

1. 分支说明
   - `master`: 主分支
   - `docker`: Docker相关配置

2. 提交规范
   - 功能开发：feature/功能名称
   - 问题修复：fix/问题描述
   - 文档更新：docs/更新内容

## 许可证

MIT License 