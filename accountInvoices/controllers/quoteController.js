const quoteUtils = require('../utils/quoteUtils');

exports.getNewQuote = (req, res) => {
    if (quoteUtils.quoteClickLimit > 0) {
        quoteUtils.quoteClickLimit--;
        const newQuote = quoteUtils.getRandomQuote();
        quoteUtils.broadcastQuote(newQuote);
        res.json({ message: 'New quote broadcasted', limit: quoteUtils.quoteClickLimit });
    } else {
        res.status(429).json({ message: 'Daily limit reached', limit: 0 });
    }
};
