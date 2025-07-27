const { WebSocketServer } = require('ws');
const quoteUtils = require('./utils/quoteUtils');

let clients = [];

function setupWebSocket(server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        clients.push(ws);
        if (quoteUtils.currentQuoteData.quote) {
            ws.send(JSON.stringify({ ...quoteUtils.currentQuoteData, limit: quoteUtils.quoteClickLimit }));
        }

        ws.on('close', () => {
            clients = clients.filter(client => client !== ws);
        });
    });

    quoteUtils.setClients(clients);
}

module.exports = { setupWebSocket };
