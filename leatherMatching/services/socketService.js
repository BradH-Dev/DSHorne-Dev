const useragent = require('useragent');
let io;

exports.init = (server) => {
  io = require('socket.io')(server);

  io.on('connection', (socket) => {
    let ipAddress = socket.request.connection.remoteAddress;
    let userAgentString = socket.request.headers['user-agent'];
    let agent = useragent.parse(userAgentString);
    console.log('A user connected from IP:', ipAddress);
    console.log('User Agent:', userAgentString);
    console.log('Parsed User Agent:', {
      browser: agent.toAgent(),
      os: agent.os.toString(),
      device: agent.device.toString(),
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected from IP: ${ipAddress}`);
    });
  });

  return io;
};

exports.emit = (...args) => {
  if (io) io.emit(...args);
};
