const squareService = require('../services/squareService');

exports.getOrderDetails = async (req, res) => {
  try {
    const data = await squareService.getOrder(req.body.orderId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching order details' });
  }
};
