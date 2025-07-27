const squareService = require('../services/squareService');

exports.search = async (req, res) => {
  try {
    const result = await squareService.searchCatalog(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.batchRetrieve = async (req, res) => {
  try {
    const data = await squareService.batchRetrieve(req.body.object_ids || req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getInventory = async (req, res) => {
    try {
      const data = await squareService.inventoryBatchRetrieve(req.body);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Error forwarding request' });
    }
  };
  
  exports.updateInventory = async (req, res) => {
    try {
      const result = await squareService.inventoryChangesBatchCreate(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  