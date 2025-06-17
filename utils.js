const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { BASE_CONFIG } = require('./config');

// 创建日志写入流
function createLogStream() {
  const logFileName = `export_log_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
  const logFilePath = path.join(BASE_CONFIG.DOWNLOAD_PATH, BASE_CONFIG.EXPORT_FOLDER_NAME, logFileName);
  return fs.createWriteStream(logFilePath, { flags: 'a' });
}

// 重写console方法
function setupLogging(logStream) {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  console.log = function(...args) {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
    ).join(' ');
    
    logStream.write(`[${timestamp}] ${message}\n`);
    originalConsoleLog.apply(console, args);
  };

  console.error = function(...args) {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
    ).join(' ');
    
    logStream.write(`[${timestamp}] ERROR: ${message}\n`);
    originalConsoleError.apply(console, args);
  };
}

// 判断是否为工作日
function isWorkday(date, holidays) {
  const dateStr = date.toISOString().split('T')[0];
  // 如果是周末（周六或周日）
  if (date.getDay() === 0 || date.getDay() === 6) {
    return false;
  }
  // 如果是法定节假日
  if (holidays[dateStr]) {
    return false;
  }
  return true;
}

// 获取上一个工作日
function getLastWorkday(date, holidays) {
  let lastDay = new Date(date);
  lastDay.setDate(date.getDate() - 1);
  while (!isWorkday(lastDay, holidays)) {
    lastDay.setDate(lastDay.getDate() - 1);
  }
  return lastDay;
}

// 格式化日期时间
function formatDateTime(date, useCurrentTime = false) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  if (useCurrentTime) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:00`;
  }
  
  return `${year}/${month}/${day} ${BASE_CONFIG.DEFAULT_EXPORT_TIME}`;
}

// 获取当前日期字符串
function getCurrentDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0].replace(/-/g, '');
}

// 等待并点击元素
async function waitAndClick(page, selector, timeout = 60000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  await page.click(selector);
  await page.waitForTimeout(BASE_CONFIG.WAIT_TIMES.ANIMATION);
}

// 打开下载文件夹
function openDownloadFolder(exportFolder) {
  console.log('\n打开下载文件夹:', exportFolder);
  
  try {
    // 检查文件夹是否存在
    if (!fs.existsSync(exportFolder)) {
      console.error('下载文件夹不存在，尝试创建...');
      try {
        fs.mkdirSync(exportFolder, { recursive: true });
        console.log('已创建下载文件夹');
      } catch (error) {
        console.error('创建下载文件夹失败:', error);
        return;
      }
    }
    
    // 检查文件夹是否为空
    const files = fs.readdirSync(exportFolder);
    console.log(`文件夹中有 ${files.length} 个文件/文件夹`);
    
    // 确保路径是绝对路径
    const absolutePath = path.resolve(exportFolder);
    console.log('绝对路径:', absolutePath);
    
    if (process.platform === 'win32') {
      // 使用start命令打开文件夹
      const command = `start "" "${absolutePath}"`;
      console.log('执行命令:', command);
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('打开下载文件夹失败:', error);
          console.error('错误详情:', stderr);
          
          // 如果start命令失败，尝试使用explorer命令
          try {
            const { execSync } = require('child_process');
            execSync(`explorer "${absolutePath}"`);
            console.log('使用explorer命令成功打开文件夹');
          } catch (backupError) {
            console.error('备用方法也失败:', backupError);
          }
        } else {
          console.log('成功打开下载文件夹');
        }
      });
    } else if (process.platform === 'darwin') {
      const command = `open "${absolutePath}"`;
      exec(command, (error) => {
        if (error) {
          console.error('打开下载文件夹失败:', error);
        }
      });
    } else {
      const command = `xdg-open "${absolutePath}"`;
      exec(command, (error) => {
        if (error) {
          console.error('打开下载文件夹失败:', error);
        }
      });
    }
  } catch (error) {
    console.error('打开文件夹时发生错误:', error);
  }
}

// 检查文件类型
async function checkFileType(file, exportFolder) {
  try {
    const filePath = path.join(exportFolder, file);
    const stats = fs.statSync(filePath);
    
    // 读取文件的前几个字节来检查文件类型
    const buffer = Buffer.alloc(4);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);
    
    // 检查文件头
    const header = buffer.toString('hex');
    
    // ZIP文件的文件头是 50 4B 03 04
    if (header.startsWith('504b0304')) {
      console.log(`文件 ${file} 是ZIP格式`);
      return 'zip';
    }
    
    return 'unknown';
  } catch (error) {
    console.error(`检查文件类型时出错: ${error.message}`);
    return 'unknown';
  }
}

// 解压文件
async function extractFiles(file, exportFolder) {
  try {
    console.log(`\n开始解压文件: ${file}`);
    const zipPath = path.join(exportFolder, file);
    
    const stats = fs.statSync(zipPath);
    const createTime = stats.birthtime;
    const createTimeStr = createTime.toISOString().split('T')[0].replace(/-/g, '');
    
    const extractPath = path.join(exportFolder, createTimeStr);
    
    let counter = 1;
    let finalExtractPath = extractPath;
    while (fs.existsSync(finalExtractPath)) {
      finalExtractPath = path.join(exportFolder, `${createTimeStr}_${counter}`);
      counter++;
    }
    
    fs.mkdirSync(finalExtractPath, { recursive: true });
    
    const command = `"C:\\Program Files\\7-Zip\\7z.exe" x "${zipPath}" -o"${finalExtractPath}" -y`;
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      console.error('解压过程中出现警告:', stderr);
    }
    
    console.log(`文件解压完成: ${file}`);
    console.log('解压输出:', stdout);
    
    // 不再删除原始文件
    console.log(`保留原始文件: ${file}`);
    
  } catch (error) {
    console.error(`处理文件 ${file} 时出错:`, error);
  }
}

// 检查并修复文件扩展名
async function checkAndFixFileExtension(file, exportFolder) {
  try {
    const filePath = path.join(exportFolder, file);
    const stats = fs.statSync(filePath);
    
    // 读取文件的前几个字节来检查文件类型
    const buffer = Buffer.alloc(4);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);
    
    // 检查文件头
    const header = buffer.toString('hex');
    
    // ZIP文件的文件头是 50 4B 03 04
    if (header.startsWith('504b0304')) {
      if (!file.toLowerCase().endsWith('.zip')) {
        const newFilePath = filePath + '.zip';
        fs.renameSync(filePath, newFilePath);
        console.log(`已修复文件扩展名: ${file} -> ${file}.zip`);
        return file + '.zip';
      }
    }
    
    return file;
  } catch (error) {
    console.error(`检查文件扩展名时出错: ${error.message}`);
    return file;
  }
}

// 重命名文件
async function renameFile(file, exportFolder) {
  try {
    const filePath = path.join(exportFolder, file);
    const stats = fs.statSync(filePath);
    
    // 获取文件创建时间
    const createTime = stats.birthtime;
    const createTimeStr = createTime.toISOString().split('T')[0].replace(/-/g, '');
    
    // 使用配置文件中的命名格式
    const newFileName = `${BASE_CONFIG.FILE_NAMING.PREFIX}${createTimeStr}${BASE_CONFIG.FILE_NAMING.EXTENSION}`;
    const newFilePath = path.join(exportFolder, newFileName);
    
    // 如果目标文件已存在，添加序号
    let counter = 1;
    let finalNewFilePath = newFilePath;
    while (fs.existsSync(finalNewFilePath)) {
      finalNewFilePath = path.join(exportFolder, `${BASE_CONFIG.FILE_NAMING.PREFIX}${createTimeStr}_${counter}${BASE_CONFIG.FILE_NAMING.EXTENSION}`);
      counter++;
    }
    
    // 重命名文件
    fs.renameSync(filePath, finalNewFilePath);
    console.log(`文件已重命名: ${file} -> ${path.basename(finalNewFilePath)}`);
    
    return path.basename(finalNewFilePath);
  } catch (error) {
    console.error(`重命名文件时出错: ${error.message}`);
    return file;
  }
}

// 处理下载的文件
async function processDownloadedFiles(exportFolder) {
  try {
    console.log('\n=== 开始处理下载的文件 ===');
    
    const files = fs.readdirSync(exportFolder);
    console.log(`找到 ${files.length} 个文件`);
    
    // 获取当前时间
    const now = new Date();
    
    // 存储文件信息
    const fileInfos = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(exportFolder, file);
        
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
          console.log(`跳过正在下载的文件: ${file}`);
          continue;
        }
        
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(file)) {
          console.log(`跳过非下载文件: ${file}`);
          continue;
        }
        
        // 检查文件类型
        const fileType = await checkFileType(file, exportFolder);
        console.log(`文件 ${file} 的类型是: ${fileType}`);
        
        if (fileType === 'zip') {
          // 计算文件创建时间与当前时间的差值（毫秒）
          const timeDiff = now - stats.birthtime;
          fileInfos.push({
            file,
            birthtime: stats.birthtime,
            timeDiff
          });
        } else {
          console.log(`文件 ${file} 不是ZIP格式，保持原名`);
        }
        
      } catch (error) {
        console.log(`处理文件 ${file} 时出错:`, error.message);
        continue;
      }
    }
    
    // 按时间差排序，找到最新的文件
    if (fileInfos.length > 0) {
      fileInfos.sort((a, b) => a.timeDiff - b.timeDiff);
      const latestFile = fileInfos[0];
      
      // 使用配置文件中的时间窗口
      if (latestFile.timeDiff <= BASE_CONFIG.FILE_NAMING.TIME_WINDOW) {
        console.log(`处理最新文件: ${latestFile.file}，创建时间: ${latestFile.birthtime}`);
        // 重命名文件
        const newFileName = await renameFile(latestFile.file, exportFolder);
        console.log(`文件已重命名: ${latestFile.file} -> ${newFileName}`);
      } else {
        console.log('没有找到最近下载的文件');
      }
    } else {
      console.log('没有找到符合条件的ZIP文件');
    }
    
    console.log('=== 文件处理完成 ===\n');
  } catch (error) {
    console.error('处理文件时出错:', error);
  }
}

module.exports = {
  createLogStream,
  setupLogging,
  isWorkday,
  getLastWorkday,
  formatDateTime,
  getCurrentDateString,
  waitAndClick,
  openDownloadFolder,
  extractFiles,
  checkAndFixFileExtension,
  processDownloadedFiles
}; 