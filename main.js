const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { 
  BASE_CONFIG, 
  TOPICS, 
  HOLIDAYS_2025, 
  SELECTORS, 
  COOKIES 
} = require('./config');
const {
  createLogStream,
  setupLogging,
  isWorkday,
  getLastWorkday,
  formatDateTime,
  getCurrentDateString,
  waitAndClick,
  openDownloadFolder,
  extractFiles,
  processDownloadedFiles
} = require('./utils');
const { hasExecutedToday, recordTodayExecution, getRecentExecutionRecords } = require('./execution_record');

// 创建日志文件路径
const downloadPath = 'C:\\Users\\92175\\Downloads\\Compressed';
const exportFolder = path.join(downloadPath, 'yuqing_export');

// 确保下载目录和导出文件夹存在
if (!fs.existsSync(downloadPath)) {
  fs.mkdirSync(downloadPath, { recursive: true });
}
if (!fs.existsSync(exportFolder)) {
  fs.mkdirSync(exportFolder, { recursive: true });
}

// 设置日志
const logStream = createLogStream();
setupLogging(logStream);

// 在程序退出时关闭日志流
process.on('exit', () => {
  logStream.end();
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  logStream.end();
  process.exit(1);
});

// 检查是否到达启动时间
function shouldStart() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // 检查是否是工作日
  if (!isWorkday(now, HOLIDAYS_2025)) {
    return false;
  }
  
  // 检查今天是否已经执行过
  if (hasExecutedToday()) {
    console.log('今天已经执行过任务，等待下一个工作日');
    return false;
  }
  
  // 如果今天还没执行过，检查是否过了14:00
  if (hour > 14 || (hour === 14 && minute >= 0)) {
    console.log('今天未执行且已过14:00，立即执行');
    return true;
  }
  
  console.log('今天未执行但未到14:00，等待执行时间');
  return false;
}

// 计算距离下次执行的时间（毫秒）
function getTimeUntilNextExecution() {
  const now = new Date();
  const target = new Date(now);
  
  // 检查是否是工作日且未执行过
  if (isWorkday(now, HOLIDAYS_2025) && !hasExecutedToday()) {
    // 设置目标时间为今天14:00
    target.setHours(14, 0, 0, 0);
    
    // 如果已经过了14:00，立即执行
    if (now > target) {
      return 0;
    }
    
    // 如果还没到14:00，等待到14:00
    return target.getTime() - now.getTime();
  }
  
  // 如果今天已执行过或是非工作日，设置目标时间为下一个工作日14:00
  target.setDate(target.getDate() + 1);
  target.setHours(14, 0, 0, 0);
  
  // 如果明天不是工作日，继续往后找下一个工作日
  while (!isWorkday(target, HOLIDAYS_2025)) {
    target.setDate(target.getDate() + 1);
  }
  
  return target.getTime() - now.getTime();
}

// 格式化剩余时间
function formatRemainingTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}小时${minutes}分钟${seconds}秒`;
}

// 等待到指定时间
async function waitUntilStartTime() {
  while (true) {
    const timeUntilNext = getTimeUntilNextExecution();
    const targetTime = new Date(Date.now() + timeUntilNext);
    
    // 如果今天未执行且已过14:00，立即执行
    if (timeUntilNext === 0) {
      console.log('\n今天未执行且已过14:00，立即开始执行...');
      return;
    }
    
    console.log(`\n下次执行时间: ${targetTime.toLocaleString()}`);
    console.log(`距离执行还有: ${formatRemainingTime(timeUntilNext)}`);
    
    // 如果剩余时间小于1分钟，开始精确计时
    if (timeUntilNext <= 60000) {
      console.log('\n即将开始执行...');
      // 等待到目标时间
      await new Promise(resolve => setTimeout(resolve, timeUntilNext));
      
      // 再次验证时间，确保准确
      if (shouldStart()) {
        console.log('到达执行时间，开始执行任务...');
        return;
      }
    } else {
      // 如果剩余时间大于1分钟，等待到下一个整分钟
      const waitTime = Math.min(timeUntilNext, 60000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // 强制进行垃圾回收
    if (global.gc) {
      global.gc();
    }
  }
}

// 监控导出状态
async function monitorExports(page) {
  console.log('\n=== 开始监控导出状态 ===');
  const today = getCurrentDateString();
  console.log('当前日期:', today);
  
  const exportedTopics = new Set();
  const pendingTopics = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const exportingTopics = new Set();
  const topicStatus = new Map();
  
  try {
    console.log('\n步骤1: 访问下载页面');
    await page.goto('https://yuqing.nybkz.com/nindex/userCenter/myDownload');
    await page.waitForLoadState('networkidle');
    console.log('下载页面加载完成');
    
    console.log('\n步骤2: 等待列表加载');
    await page.waitForSelector('.sourcelist', { timeout: 10000 });
    console.log('列表加载完成');
    
    console.log('\n步骤3: 获取导出记录');
    const records = await page.$$('.sourcelist');
    console.log(`找到 ${records.length} 条导出记录`);
    
    console.log('\n步骤4: 开始处理今天的记录');
    for (const record of records) {
      try {
        const title = await record.$eval('div:nth-child(2)', el => el.textContent.trim());
        const time = await record.$eval('div:nth-child(4)', el => el.textContent.trim());
        
        const timeDate = time.slice(0, 10).replace(/-/g, '');
        if (timeDate !== today) {
          continue;
        }
        
        console.log('\n--- 处理今天的记录 ---');
        console.log('记录标题:', title);
        console.log('记录时间:', time);
        
        let status = '';
        try {
          console.log('尝试获取状态...');
          const exportingElement = await record.$('span[data-v-108915d0].color-orange');
          if (exportingElement) {
            status = await exportingElement.textContent();
            console.log('找到正在导出的状态:', status);
          } else {
            console.log('未找到正在导出的状态，尝试获取其他状态');
            const statusElement = await record.$('div:nth-child(5) span');
            if (statusElement) {
              status = await statusElement.textContent();
            } else {
              status = await record.$eval('div:nth-child(5)', el => el.textContent.trim());
            }
          }
        } catch (error) {
          console.log('获取状态失败:', error.message);
          continue;
        }
        
        console.log('最终获取到的状态:', status);
        
        console.log('检查是否是我们关注的主题...');
        for (const [num, topic] of Object.entries(TOPICS.HEALTH)) {
          const baseTitle = title.split('_')[0];
          if (baseTitle === topic) {
            console.log(`匹配到主题: ${topic}`);
            const topicNum = parseInt(num);
            const statusText = status.toLowerCase();
            
            topicStatus.set(topicNum, {
              status: statusText,
              originalStatus: status,
              title: title
            });
            
            if (statusText.includes('成功')) {
              exportedTopics.add(topicNum);
              pendingTopics.delete(topicNum);
              exportingTopics.delete(topicNum);
              console.log(`主题 ${topic} 已成功导出`);
            } else if (statusText.includes('正在导出') || statusText.includes('导出中')) {
              exportingTopics.add(topicNum);
              pendingTopics.delete(topicNum);
              console.log(`主题 ${topic} 正在导出中 (进度: ${status})`);
            } else {
              exportingTopics.add(topicNum);
              pendingTopics.delete(topicNum);
              console.log(`主题 ${topic} 正在处理中 (状态: ${status})`);
            }
          }
        }
      } catch (error) {
        console.log('处理记录时出错:', error.message);
        continue;
      }
    }
    
    console.log('\n步骤5: 输出最终状态');
    console.log('\n=== 导出状态详情 ===');
    console.log('已导出的主题:', Array.from(exportedTopics).map(num => TOPICS.HEALTH[num]));
    console.log('正在导出的主题:', Array.from(exportingTopics).map(num => {
      const status = topicStatus.get(num);
      return `${TOPICS.HEALTH[num]} (${status ? status.originalStatus : '未知状态'})`;
    }));
    console.log('待导出的主题:', Array.from(pendingTopics).map(num => TOPICS.HEALTH[num]));
    
    return {
      exportedTopics: Array.from(exportedTopics),
      pendingTopics: Array.from(pendingTopics),
      exportingTopics: Array.from(exportingTopics)
    };
  } catch (error) {
    console.error('监控导出状态时出错:', error);
    throw error;
  }
}

// 执行筛选操作
async function performFiltering(page) {
  try {
    // 确保页面在顶部
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);

    // 点击"自定义"按钮
    await waitAndClick(page, SELECTORS.PAGE.CUSTOM_BUTTON);

    const today = new Date();
    const lastWorkday = getLastWorkday(today, HOLIDAYS_2025);
    
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    const isAfter14 = currentHour > 14 || (currentHour === 14 && currentMinute > 0);

    console.log('设置开始日期和时间 (上一个工作日14:00)...');
    const startDateTime = formatDateTime(lastWorkday);
    await page.fill(SELECTORS.DATETIME.START_TIME, startDateTime);
    await page.waitForTimeout(300);

    // 验证开始时间输入
    const startTimeValue = await page.inputValue(SELECTORS.DATETIME.START_TIME);
    if (!startTimeValue) {
      throw new Error('开始时间输入失败');
    }
    console.log('开始时间验证通过:', startTimeValue);

    console.log('设置结束日期和时间...');
    const endDateTime = formatDateTime(today, !isAfter14);
    console.log(`结束时间设置为: ${endDateTime}`);
    await page.fill(SELECTORS.DATETIME.END_TIME, endDateTime);
    await page.waitForTimeout(300);

    // 验证结束时间输入
    const endTimeValue = await page.inputValue(SELECTORS.DATETIME.END_TIME);
    if (!endTimeValue) {
      throw new Error('结束时间输入失败');
    }
    console.log('结束时间验证通过:', endTimeValue);

    // 验证时间范围
    const startDate = new Date(startTimeValue);
    const endDate = new Date(endTimeValue);
    if (endDate < startDate) {
      throw new Error('结束时间不能早于开始时间');
    }

    console.log('勾选"全部"选项...');
    const allCheckbox = await page.locator(SELECTORS.CHECKBOXES.ALL);
    const isAllChecked = await allCheckbox.locator('input[type="checkbox"]').isChecked();
    if (!isAllChecked) {
      await allCheckbox.locator('.el-checkbox__inner').click();
      await page.waitForTimeout(300);
    }
    // 验证"全部"选项是否成功勾选
    const isAllCheckedAfter = await allCheckbox.locator('input[type="checkbox"]').isChecked();
    if (!isAllCheckedAfter) {
      throw new Error('"全部"选项勾选失败');
    }
    console.log('"全部"选项处理完成。');

    console.log('取消勾选"微博"...');
    const weiboLabel = await page.locator(SELECTORS.CHECKBOXES.WEIBO);
    const weiboChecked = await weiboLabel.locator('input[type="checkbox"]').isChecked();
    if (weiboChecked) {
      await weiboLabel.locator('.el-checkbox__inner').click();
      await page.waitForTimeout(300);
    }
    // 验证"微博"选项是否成功取消勾选
    const isWeiboCheckedAfter = await weiboLabel.locator('input[type="checkbox"]').isChecked();
    if (isWeiboCheckedAfter) {
      throw new Error('"微博"选项取消勾选失败');
    }
    console.log('"微博"复选框处理完成。');

    console.log('处理APP下拉菜单...');
    try {
      console.log('悬停在APP按钮上...');
      const appLabel = await page.locator(SELECTORS.CHECKBOXES.APP);
      await appLabel.hover();
      await page.waitForTimeout(300);

      console.log('尝试点击小红书选项...');
      const clicked = await page.evaluate(() => {
        const dropdowns = Array.from(document.querySelectorAll('ul.el-dropdown-menu.el-popper'));
        console.log(`找到 ${dropdowns.length} 个下拉菜单`);
        
        for (const dropdown of dropdowns) {
          const items = Array.from(dropdown.querySelectorAll('li.el-dropdown-menu__item .dropdown-item'));
          const xiaohongshuItem = items.find(el => el.textContent.includes('小红书'));
          if (xiaohongshuItem) {
            console.log('找到小红书选项，尝试点击');
            xiaohongshuItem.click();
            return true;
          }
        }
        return false;
      });
      
      if (clicked) {
        console.log('"小红书"选项点击成功');
      } else {
        console.log('未找到小红书选项');
      }
      
      await page.waitForTimeout(300);
    } catch (error) {
      console.error('处理APP下拉菜单时出错:', error);
    }
    console.log('"小红书"复选框处理完成。');

    console.log('取消勾选"视频"...');
    const vedioLabel = await page.locator(SELECTORS.CHECKBOXES.VIDEO);
    const vedioChecked = await vedioLabel.locator('input[type="checkbox"]').isChecked();
    if (vedioChecked) {
      await vedioLabel.locator('.el-checkbox__inner').click();
      await page.waitForTimeout(300);
    }
    console.log('"视频"复选框处理完成。');

    await waitAndClick(page, SELECTORS.PAGE.FILTER_BUTTON);
    
    await page.waitForSelector(SELECTORS.PAGE.DATA_LOADED, { state: 'visible' });
    await page.waitForTimeout(BASE_CONFIG.WAIT_TIMES.PAGE_LOAD);
    
    await page.hover(SELECTORS.PAGE.EXPORT_BUTTON);
    await waitAndClick(page, SELECTORS.PAGE.EXPORT_BUTTON);
    
    await waitAndClick(page, SELECTORS.PAGE.CONFIRM_BUTTON);
  } catch (error) {
    console.error('执行筛选操作时出错:', error);
    throw error;
  }
}

// 执行导出任务
async function executeExportTask(page, topicNumber) {
  try {
    console.log(`开始处理主题: ${TOPICS.HEALTH[topicNumber]}`);
    
    await page.goto('https://yuqing.nybkz.com/nindex/publicSentiment/informationSet');
    await page.waitForLoadState('networkidle');
    
    const isCurrentTopic = await page.evaluate((topicName) => {
      const titleElement = document.querySelector('div[data-v-13cae079].ovhidden');
      return titleElement && titleElement.textContent.trim() === topicName;
    }, TOPICS.HEALTH[topicNumber]);
    
    if (isCurrentTopic) {
      console.log(`当前页面已经是目标主题: ${TOPICS.HEALTH[topicNumber]}`);
    } else {
      console.log(`需要切换到目标主题: ${TOPICS.HEALTH[topicNumber]}`);
      
      const folderName = TOPICS.HEALTH[topicNumber].includes('主词') || TOPICS.HEALTH[topicNumber].includes('组合') ? '非创建者勿动1' : '产品';
      console.log(`尝试展开${folderName}文件夹...`);
      
      const isTargetFolderExpanded = await page.evaluate((folderName) => {
        const folders = document.querySelectorAll('div.plan-list-folder.cp');
        for (const folder of folders) {
          if (folder.textContent.includes(folderName) && folder.classList.contains('curr')) {
            return true;
          }
        }
        return false;
      }, folderName);
      
      if (!isTargetFolderExpanded) {
        console.log('尝试关闭其他已展开的文件夹...');
        try {
          const expandedFolders = await page.$$(SELECTORS.FOLDER.EXPANDED);
          console.log(`找到 ${expandedFolders.length} 个已展开的文件夹`);
          
          for (const folder of expandedFolders) {
            try {
              const folderText = await folder.textContent();
              if (folderText.includes(folderName)) {
                console.log(`跳过目标文件夹: ${folderText.trim()}`);
                continue;
              }
              console.log(`尝试关闭文件夹: ${folderText.trim()}`);
              await folder.click();
              await page.waitForTimeout(BASE_CONFIG.WAIT_TIMES.FOLDER_EXPAND);
            } catch (folderError) {
              console.log(`关闭文件夹时出错: ${folderError.message}`);
              continue;
            }
          }
        } catch (error) {
          console.error('关闭文件夹时出错:', error);
        }
      }
      
      async function clickFolderAndVerifyTopic() {
        if (!isTargetFolderExpanded) {
          console.log('开始查找并点击目标文件夹...');
          const folders = await page.$$(SELECTORS.FOLDER.TARGET);
          let found = false;
          
          for (const folder of folders) {
            const text = await folder.textContent();
            console.log(`检查文件夹: ${text.trim()}`);
            if (text.includes(folderName)) {
              console.log(`找到目标文件夹: ${text.trim()}`);
              await folder.click();
              found = true;
              await page.waitForTimeout(BASE_CONFIG.WAIT_TIMES.FOLDER_EXPAND);
              break;
            }
          }
          
          if (!found) {
            console.log(`未找到目标文件夹: ${folderName}`);
            return false;
          }
        }
        
        try {
          console.log('等待主题出现...');
          const isTopicVisible = await page.evaluate((topicName) => {
            const files = document.querySelectorAll('div.plan-list-file');
            for (const file of files) {
              if (file.textContent.includes(topicName)) {
                return true;
              }
            }
            return false;
          }, TOPICS.HEALTH[topicNumber]);

          if (isTopicVisible) {
            console.log(`主题 ${TOPICS.HEALTH[topicNumber]} 已在列表中可见。`);
            const files = await page.$$('div.plan-list-file');
            for (const file of files) {
              const text = await file.textContent();
              if (text.includes(TOPICS.HEALTH[topicNumber])) {
                console.log(`点击主题: ${text.trim()}`);
                await file.click();
                await page.waitForTimeout(BASE_CONFIG.WAIT_TIMES.ANIMATION);
                return true;
              }
            }
          }

          console.log('主题未立即出现，等待加载...');
          await page.waitForFunction(
            (topicName) => {
              const files = document.querySelectorAll('div.plan-list-file');
              for (const file of files) {
                if (file.textContent.includes(topicName)) {
                  return true;
                }
              }
              return false;
            },
            { timeout: 2000 },
            TOPICS.HEALTH[topicNumber]
          );
          console.log(`主题 ${TOPICS.HEALTH[topicNumber]} 已在列表中可见。`);
          
          const files = await page.$$('div.plan-list-file');
          for (const file of files) {
            const text = await file.textContent();
            if (text.includes(TOPICS.HEALTH[topicNumber])) {
              console.log(`点击主题: ${text.trim()}`);
              await file.click();
              await page.waitForTimeout(BASE_CONFIG.WAIT_TIMES.ANIMATION);
              return true;
            }
          }
          
          return false;
        } catch (e) {
          console.log(`主题 ${TOPICS.HEALTH[topicNumber]} 未立即显示。`);
          return false;
        }
      }

      let topicVisible = await clickFolderAndVerifyTopic();
      if (!topicVisible) {
        console.log(`再次尝试点击${folderName}文件夹并等待主题...`);
        await page.waitForTimeout(BASE_CONFIG.WAIT_TIMES.ANIMATION);
        topicVisible = await clickFolderAndVerifyTopic();
      }

      if (!topicVisible) {
        throw new Error(`无法展开文件夹或主题 ${TOPICS.HEALTH[topicNumber]} 未在预期时间内显示。`);
      }
      
      // 直接使用 JavaScript 点击确定按钮
      console.log('使用 JavaScript 点击确定按钮...');
      await page.evaluate(() => {
        const button = document.querySelector('button[data-v-f1ed8238].btn.btn-sussess');
        if (button) {
          button.click();
          return true;
        }
        return false;
      });
      await page.waitForTimeout(300);
    }
    
    await performFiltering(page);
    
    console.log(`开始监控主题 ${TOPICS.HEALTH[topicNumber]} 的导出状态...`);
    let isExported = false;
    let isExporting = false;
    const startTime = Date.now();
    
    while (!isExported && (Date.now() - startTime < BASE_CONFIG.EXPORT_TIMEOUT)) {
      await page.waitForTimeout(30000);
      
      const { exportedTopics, exportingTopics } = await monitorExports(page);
      
      if (exportedTopics.includes(topicNumber)) {
        isExported = true;
        console.log(`主题 ${TOPICS.HEALTH[topicNumber]} 已成功导出`);
      } else if (exportingTopics.includes(topicNumber)) {
        isExporting = true;
        const progress = await page.evaluate(() => {
          const statusElement = document.querySelector('span[data-v-108915d0].color-orange');
          if (statusElement) {
            const text = statusElement.textContent;
            const match = text.match(/(\d+)%/);
            return match ? parseInt(match[1]) : 0;
          }
          return 0;
        });
        
        if (progress < 50) {
          console.log(`主题 ${TOPICS.HEALTH[topicNumber]} 导出进度 ${progress}%，等待一分钟...`);
          await page.waitForTimeout(60000);
        } else {
          console.log(`主题 ${TOPICS.HEALTH[topicNumber]} 导出进度 ${progress}%，继续监控...`);
          await page.waitForTimeout(30000);
        }
      } else if (isExporting) {
        console.log(`主题 ${TOPICS.HEALTH[topicNumber]} 导出可能失败`);
        break;
      } else {
        console.log(`主题 ${TOPICS.HEALTH[topicNumber]} 等待导出开始...`);
        await page.waitForTimeout(30000);
      }
    }
    
    if (!isExported) {
      if (isExporting) {
        console.error(`主题 ${TOPICS.HEALTH[topicNumber]} 导出超时`);
      } else {
        console.error(`主题 ${TOPICS.HEALTH[topicNumber]} 导出失败`);
      }
    }
    
    console.log(`完成主题: ${TOPICS.HEALTH[topicNumber]}`);
  } catch (error) {
    console.error(`处理主题 ${TOPICS.HEALTH[topicNumber]} 时出错:`, error);
    throw error;
  }
}

// 执行批量导出
async function performBatchExport(page) {
  console.log('\n=== 开始执行批量导出 ===');
  try {
    await page.waitForSelector('div[data-v-108915d0].checkbox input[type="checkbox"]', { timeout: 10000 });
    
    const checkboxes = await page.$$('div[data-v-108915d0].checkbox input[type="checkbox"]');
    console.log(`找到 ${checkboxes.length} 个复选框`);
    
    for (const checkbox of checkboxes) {
      try {
        const record = await checkbox.evaluateHandle(el => el.closest('.sourcelist'));
        const title = await record.$eval('div:nth-child(2)', el => el.textContent.trim());
        const time = await record.$eval('div:nth-child(4)', el => el.textContent.trim());
        const status = await record.$eval('div:nth-child(5)', el => el.textContent.trim());
        
        const timeDate = time.slice(0, 10).replace(/-/g, '');
        const today = getCurrentDateString();
        
        if (timeDate === today && status.includes('成功')) {
          for (const [_, topic] of Object.entries(TOPICS.HEALTH)) {
            if (title.startsWith(topic)) {
              console.log('\n找到符合条件的记录:');
              console.log('标题:', title);
              console.log('时间:', time);
              console.log('状态:', status);
              console.log('已勾选');
              await checkbox.check();
              break;
            }
          }
        }
      } catch (error) {
        console.log('处理复选框时出错:', error.message);
        continue;
      }
    }

    console.log('\n尝试点击批量导出按钮...');
    try {
      await page.waitForSelector(SELECTORS.PAGE.BATCH_EXPORT_BUTTON, { timeout: 5000 });
      
      const buttonText = await page.$eval(SELECTORS.PAGE.BATCH_EXPORT_BUTTON, el => el.textContent.trim());
      console.log('找到按钮，文本内容:', buttonText);
      
      await page.waitForSelector(SELECTORS.PAGE.BATCH_EXPORT_BUTTON, { state: 'visible', timeout: 5000 });
      
      await page.click(SELECTORS.PAGE.BATCH_EXPORT_BUTTON);
      console.log('批量导出按钮点击成功');
    } catch (error) {
      console.error('点击批量导出按钮失败:', error.message);
      try {
        await page.evaluate(() => {
          const button = document.querySelector('button[data-v-108915d0].btn.btn-sussess');
          if (button) {
            button.click();
            return true;
          }
          return false;
        });
        console.log('通过JavaScript点击批量导出按钮成功');
      } catch (jsError) {
        console.error('通过JavaScript点击也失败:', jsError.message);
        throw jsError;
      }
    }
    
    console.log('批量导出操作完成');
    
  } catch (error) {
    console.error('执行批量导出时出错:', error);
    throw error;
  }
}

// 主运行函数
async function monitorAndExport() {
  let browser;
  let context;
  let page;
  const startTime = new Date();
  console.log(`\n=== 开始执行时间: ${startTime.toLocaleString()} ===\n`);
  
  try {
    console.log('启动监控和导出任务...');
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // 确保 Playwright 浏览器已安装
        const { execSync } = require('child_process');
        try {
          console.log('检查并安装 Playwright 浏览器...');
          execSync('npx playwright install chromium', { stdio: 'inherit' });
        } catch (installError) {
          console.log('Playwright 浏览器安装失败，尝试使用管理员权限安装...');
          try {
            execSync('npx playwright install chromium --with-deps', { stdio: 'inherit' });
          } catch (adminError) {
            console.error('使用管理员权限安装也失败:', adminError);
            throw adminError;
          }
        }
        
        console.log('正在启动浏览器...');
        browser = await chromium.launch({ 
          headless: false, // 改为有头模式以便观察
          downloadsPath: exportFolder,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials',
            '--disable-extensions',
            '--disable-component-extensions-with-background-pages',
            '--disable-default-apps',
            '--mute-audio',
            '--no-default-browser-check',
            '--no-first-run',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-breakpad',
            '--disable-client-side-phishing-detection',
            '--disable-hang-monitor',
            '--disable-ipc-flooding-protection',
            '--disable-popup-blocking',
            '--disable-prompt-on-repost',
            '--disable-renderer-backgrounding',
            '--disable-sync',
            '--force-color-profile=srgb',
            '--metrics-recording-only',
            '--password-store=basic',
            '--use-mock-keychain'
          ],
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
          timeout: 60000
        });

        console.log('创建浏览器上下文...');
        context = await browser.newContext({
          viewport: { width: 1600, height: 900 },
          acceptDownloads: true,
          javaScriptEnabled: true,
          bypassCSP: true,
          ignoreHTTPSErrors: true,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });
        
        // 设置页面超时
        context.setDefaultTimeout(60000); // 增加超时时间到60秒
        context.setDefaultNavigationTimeout(60000);
        
        console.log('创建新页面...');
        page = await context.newPage();
        
        // 设置页面缩放
        await page.evaluate(() => {
          document.body.style.zoom = "100%";
        });
        
        console.log('添加cookies...');
        await context.addCookies(COOKIES);

        console.log('尝试访问下载页面...');
        await page.goto('https://yuqing.nybkz.com/nindex/userCenter/myDownload', {
          waitUntil: 'networkidle',
          timeout: 60000
        });
        
        console.log('页面加载完成，开始监控导出状态...');
        break;
      } catch (error) {
        retryCount++;
        console.error(`浏览器启动或页面访问失败 (尝试 ${retryCount}/${maxRetries}):`, error);
        
        // 清理资源
        if (page) {
          try {
            await page.close();
          } catch (e) {
            console.error('关闭页面失败:', e);
          }
        }
        if (context) {
          try {
            await context.close();
          } catch (e) {
            console.error('关闭上下文失败:', e);
          }
        }
        if (browser) {
          try {
            await browser.close();
          } catch (e) {
            console.error('关闭浏览器失败:', e);
          }
        }
        
        if (retryCount === maxRetries) {
          throw new Error(`浏览器启动或页面访问失败，已重试 ${maxRetries} 次`);
        }
        
        console.log('等待 10 秒后重试...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    while (true) {
      try {
        const { exportedTopics, pendingTopics, exportingTopics } = await monitorExports(page);
        
        console.log('\n=== 当前状态报告 ===');
        console.log('已导出的主题:', exportedTopics.map(num => TOPICS.HEALTH[num]));
        console.log('正在导出的主题:', exportingTopics.map(num => TOPICS.HEALTH[num]));
        console.log('待导出的主题:', pendingTopics.map(num => TOPICS.HEALTH[num]));
        
        if (exportingTopics.length > 0) {
          console.log('有主题正在导出，等待一分钟后重新检查...');
          await page.waitForTimeout(BASE_CONFIG.WAIT_TIMES.EXPORT_CHECK);
          continue;
        }
        
        if (pendingTopics.length > 0) {
          console.log('开始导出待处理的主题...');

          for (const topicNumber of pendingTopics) {
            let success = false;
            for (let i = 0; i < BASE_CONFIG.MAX_RETRIES; i++) {
              try {
                console.log(`尝试处理主题 ${TOPICS.HEALTH[topicNumber]} (尝试 ${i + 1}/${BASE_CONFIG.MAX_RETRIES})...`);
                await executeExportTask(page, topicNumber);
                success = true;
                break;
              } catch (error) {
                console.error(`处理主题 ${TOPICS.HEALTH[topicNumber]} 失败 (尝试 ${i + 1}/${BASE_CONFIG.MAX_RETRIES}):`, error);
                if (i < BASE_CONFIG.MAX_RETRIES - 1) {
                  console.log('刷新页面并等待30秒后重试...');
                  await page.reload();
                  await page.waitForLoadState('networkidle');
                  await page.waitForTimeout(BASE_CONFIG.WAIT_TIMES.RETRY_WAIT);
                } else {
                  console.error(`主题 ${TOPICS.HEALTH[topicNumber]} 经过 ${BASE_CONFIG.MAX_RETRIES} 次尝试后仍未成功。`);
                }
              }
            }
            if (success) {
              await page.waitForTimeout(BASE_CONFIG.WAIT_TIMES.ANIMATION);
            }
          }
        } else {
          console.log('所有主题都已处理完成！');
          
          await performBatchExport(page);
          
          console.log('等待文件下载完成...');
          await page.waitForTimeout(BASE_CONFIG.WAIT_TIMES.FILE_DOWNLOAD);
          
          // 处理下载的文件
          await processDownloadedFiles(exportFolder);
          
          // 打开下载文件夹
          openDownloadFolder(exportFolder);
          
          // 记录结束时间和计算总耗时
          const endTime = new Date();
          const totalTime = (endTime - startTime) / 1000; // 转换为秒
          const hours = Math.floor(totalTime / 3600);
          const minutes = Math.floor((totalTime % 3600) / 60);
          const seconds = Math.floor(totalTime % 60);
          
          console.log('\n=== 执行时间统计 ===');
          console.log(`开始时间: ${startTime.toLocaleString()}`);
          console.log(`结束时间: ${endTime.toLocaleString()}`);
          console.log(`总耗时: ${hours}小时 ${minutes}分钟 ${seconds}秒`);
          console.log('===================\n');
          
          // 在成功执行完成后记录执行
          recordTodayExecution();
          console.log('已记录今天的执行状态');
          
          break;
        }
        
      } catch (error) {
        console.error('监控过程中发生错误:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('发生错误:', error);
    throw error;
  } finally {
    // 确保资源被正确清理
    if (page) {
      try {
        await page.close();
      } catch (e) {
        console.error('关闭页面失败:', e);
      }
    }
    if (context) {
      try {
        await context.close();
      } catch (e) {
        console.error('关闭上下文失败:', e);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('关闭浏览器失败:', e);
      }
    }
  }
}

// 启动脚本
async function start() {
  try {
    console.log('程序启动...');
    
    // 显示最近7天的执行记录
    const recentRecords = getRecentExecutionRecords();
    console.log('\n最近7天的执行记录:');
    Object.entries(recentRecords).forEach(([date, executed]) => {
      console.log(`${date}: ${executed ? '已执行' : '未执行'}`);
    });
    
    // 等待到执行时间
    await waitUntilStartTime();
    
    await monitorAndExport();
  } catch (error) {
    console.error('脚本执行失败:', error);
  } finally {
    // 强制进行垃圾回收
    if (global.gc) {
      global.gc();
    }
  }
}

// 检查是否支持垃圾回收
const hasGC = typeof global.gc === 'function';

if (hasGC) {
  console.log('垃圾回收功能已启用');
  start().catch(e => console.error('脚本顶层捕获:', e));
} else {
  console.log('警告: 垃圾回收功能未启用，建议使用 --expose-gc 参数运行脚本');
  console.log('示例: node --expose-gc main.js');
  console.log('是否继续运行？(y/n)');
  
  process.stdin.once('data', (data) => {
    const answer = data.toString().trim().toLowerCase();
    if (answer === 'y') {
      console.log('继续运行脚本...');
      start().catch(e => console.error('脚本顶层捕获:', e));
    } else {
      console.log('已取消运行');
      process.exit(0);
    }
  });
} 