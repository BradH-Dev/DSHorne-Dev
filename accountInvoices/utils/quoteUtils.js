const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const logger = require('./logger');

let quotes = [];
let unusedQuotes = [];
let clients = [];

let quoteClickLimit = 10;
let globalStartup = true;
let currentQuoteData = { quote: '', name: '', speaker: '', season: '' };

const logFilePath = path.join(__dirname, '../quote_click_log.txt');

function timestampMaker() {
    const now = new Date();
    const [h, m, s] = [now.getHours(), now.getMinutes(), now.getSeconds()];
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
        .toString().padStart(2, '0')}/${now.getFullYear().toString().slice(-2)} ${(h % 12 || 12)}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} ${ampm}`;
}

function broadcastQuote(quoteData) {
    currentQuoteData = quoteData;
    clients.forEach(ws => {
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ ...quoteData, limit: quoteClickLimit }));
        }
    });
}

function getRandomQuote() {
    if (!quotes.length) return { quote: 'No quotes available', name: '', speaker: '', season: '' };

    if (!unusedQuotes.length) {
        unusedQuotes = [...Array(quotes.length).keys()];
    }

    const randomIndex = Math.floor(Math.random() * unusedQuotes.length);
    const quoteIndex = unusedQuotes[randomIndex];
    unusedQuotes.splice(randomIndex, 1);

    if (!globalStartup) {
        logger.logClick(timestampMaker(), quoteClickLimit, unusedQuotes.length, currentQuoteData);
    }

    return quotes[quoteIndex];
}

function loadQuotes() {
    const filePath = path.join(__dirname, '../cleaned_quotes.csv');
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', row => {
            if (row['Quote'] && row['Name']) {
                quotes.push({ quote: row['Quote'], name: row['Name'], speaker: row['Speaker'], season: row['Episode'] });
            }
        })
        .on('end', () => {
            unusedQuotes = [...Array(quotes.length).keys()];
            const firstQuote = getRandomQuote();
            broadcastQuote(firstQuote);
            globalStartup = false;
        });
}

function scheduleDailyReset() {
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

    setTimeout(() => {
        quoteClickLimit = 10;
        globalStartup = true;
        const quote = getRandomQuote();
        broadcastQuote(quote);
        globalStartup = false;

        logger.logReset(timestampMaker(), quoteClickLimit, unusedQuotes.length, currentQuoteData);

        scheduleDailyReset();
    }, msUntilMidnight);
}

function setClients(wsClients) {
    clients = wsClients;
}

module.exports = {
    quoteClickLimit,
    currentQuoteData,
    broadcastQuote,
    getRandomQuote,
    loadQuotes,
    scheduleDailyReset,
    setClients
};
