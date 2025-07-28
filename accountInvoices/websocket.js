const { WebSocketServer } = require('ws');
const quoteUtils = require('./utils/quoteUtils');

function setupWebSocket(server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        console.log('WebSocket client connected');

        // Send quote when ready
        function sendQuoteWhenReady() {
            const quote = quoteUtils.getCurrentQuoteData();
            if (quote?.quote?.trim()) {
                console.log('Sending current quote to client:', quote);
                ws.send(JSON.stringify({
                    ...quote,
                    limit: quoteUtils.getCurrentQuoteLimit()
                }));
            } else {
                setTimeout(sendQuoteWhenReady, 200);
            }
        }

        sendQuoteWhenReady();

        // Clean up and update client list
        ws.on('close', () => {
            console.log('Client disconnected');
            quoteUtils.setClients([...wss.clients].filter(client => client.readyState === 1));
        });

        quoteUtils.setClients([...wss.clients].filter(client => client.readyState === 1));
    });
}

module.exports = { setupWebSocket };
