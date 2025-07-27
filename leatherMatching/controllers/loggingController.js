const fs = require('fs').promises;

exports.updateLog = async (req, res) => {
  const logFilePath = 'update_logs.txt';
  try {
    await fs.writeFile(logFilePath, `${new Date().toISOString()}`);
    res.status(200).json({ message: 'Log updated successfully' });
  } catch (err) {
    console.error('Failed to write to log file:', err);
    res.status(500).json({ error: 'Error writing to log file' });
  }
};

exports.getLastUpdateTime = async (req, res) => {
  const logFilePath = 'update_logs.txt';
  try {
    const data = await fs.readFile(logFilePath, 'utf8');
    const lines = data.trim().split('\n');
    const lastLine = lines.pop();
    const timestampRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/;
    const match = lastLine.match(timestampRegex);
    if (match) {
      res.send({ lastUpdateTime: match[0] });
    } else {
      res.status(404).send('No valid timestamp found in the logs');
    }
  } catch (err) {
    console.error('Failed to read the log file:', err);
    res.status(500).send('Failed to retrieve update time');
  }
};
