exports.parseCurrency = (amount) => {
    return parseFloat(amount.replace(/[$,]/g, '')) || 0;
  };
  
  exports.sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
  