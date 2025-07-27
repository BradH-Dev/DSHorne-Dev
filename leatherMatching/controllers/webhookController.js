const queueService = require('../services/queueService');
const handleWebhook = require('../utils/webhookHandlers');
exports.webhook = (req, res) => {
  console.log('Received webhook:', req.body);
  const { type } = req.body;

  switch (type) {
    case 'payment.created':
      queueService.enqueue(() => handleWebhook.handlePaymentCreated(req.body.data), true);
      break;
    case 'inventory.count.updated':
      queueService.enqueue(() => handleWebhook.handleInventoryUpdate(req.body.data));
      break;
    case 'catalog.version.updated':
      queueService.enqueue(() => handleWebhook.handleGeneralUpdate(req.body));
      break;
    default:
      res.status(400).send('Unsupported webhook type');
      return;
  }

  res.status(200).send('Webhook received and will be processed');
};
