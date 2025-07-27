class ConnectionManager {
    constructor() {
        this.connections = [];
    }

    addConnection(res) {
        this.connections.push(res);
        res.on('close', () => {
            this.connections = this.connections.filter(conn => conn !== res);
        });
    }

    sendStatus(status) {
        this.connections.forEach(conn => {
            conn.write(`data: ${JSON.stringify(status)}\n\n`);
        });
    }
}

module.exports = new ConnectionManager();