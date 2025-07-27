const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../quote_click_log.txt');

function logClick(timestamp, remaining, unusedCount, quote) {
    const msg = `Clicked at ${timestamp}. Remaining refreshes: ${remaining}. Remaining quotes: ${unusedCount} || Quote: "${quote.quote}" - ${quote.speaker} (${quote.season})\n`;
    fs.appendFile(logFilePath, msg, err => err && console.error('Log error:', err));
}

function logReset(timestamp, remaining, unusedCount, quote) {
    const msg = `NEW QUOTE AT ${timestamp}. Remaining refreshes after reset: ${remaining}. Remaining quotes in pool: ${unusedCount} || Quote now shown: "${quote.quote}" - ${quote.speaker} (${quote.season})\n`;
    fs.appendFile(logFilePath, msg, err => err && console.error('Log error:', err));
}

module.exports = { logClick, logReset };
