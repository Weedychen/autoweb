const fs = require('fs');
const path = require('path');

const RECORD_FILE = path.join(__dirname, 'execution_records.json');

// 初始化记录文件
function initRecordFile() {
    if (!fs.existsSync(RECORD_FILE)) {
        fs.writeFileSync(RECORD_FILE, JSON.stringify({}, null, 2));
    }
}

// 获取今天的日期字符串 (YYYYMMDD)
function getTodayString() {
    const now = new Date();
    return now.toISOString().slice(0, 10).replace(/-/g, '');
}

// 检查今天是否已经执行
function hasExecutedToday() {
    initRecordFile();
    const records = JSON.parse(fs.readFileSync(RECORD_FILE, 'utf8'));
    const today = getTodayString();
    return records[today] === true;
}

// 记录今天的执行
function recordTodayExecution() {
    initRecordFile();
    const records = JSON.parse(fs.readFileSync(RECORD_FILE, 'utf8'));
    const today = getTodayString();
    records[today] = true;
    fs.writeFileSync(RECORD_FILE, JSON.stringify(records, null, 2));
}

// 获取最近7天的执行记录
function getRecentExecutionRecords() {
    initRecordFile();
    const records = JSON.parse(fs.readFileSync(RECORD_FILE, 'utf8'));
    const today = new Date();
    const recentRecords = {};
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        recentRecords[dateStr] = records[dateStr] || false;
    }
    
    return recentRecords;
}

module.exports = {
    hasExecutedToday,
    recordTodayExecution,
    getRecentExecutionRecords
}; 