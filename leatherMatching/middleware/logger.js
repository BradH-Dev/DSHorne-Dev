const fs = require('fs');
const access = fs.createWriteStream('server.log', { flags: 'a' });

module.exports = function logger() {
  process.stdout.write = process.stderr.write = access.write.bind(access);
};