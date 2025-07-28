const quoteUtils = require('../utils/quoteUtils');

exports.getNewQuote = (req, res) => {
    const newLimit = quoteUtils.decrementQuoteLimit();

    if (newLimit > 0) {
        const newQuote = quoteUtils.getRandomQuote();
        quoteUtils.broadcastQuote(newQuote);
        res.json({ message: 'New quote broadcasted', limit: newLimit });
    } else {
        res.status(429).json({ message: 'Daily limit reached', limit: 0 });
    }
};