const express = require('express');
const cors = require('cors');
const path = require('path');
const AboCalculator = require('./services/sbbCalculator');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API endpoint to calculate ticket options
app.post('/api/calculate', async (req, res) => {
  try {
    const { tramTrips, trainTrips, youth, prices } = req.body;

    // Validate input
    if (tramTrips === undefined || trainTrips === undefined || youth === undefined) {
      return res.status(400).json({
        error: 'Missing required parameters: tramTrips, trainTrips, youth'
      });
    }

    if (tramTrips < 0 || trainTrips < 0) {
      return res.status(400).json({
        error: 'Trip counts must be non-negative'
      });
    }

    // Calculate all options
    const calculator = new AboCalculator(youth, prices || {});
    const results = await calculator.calculateAll(tramTrips, trainTrips);

    // Find the best option (minimum cost, then maximum bonus)
    let bestOption = null;
    let bestCost = Infinity;
    let bestBonus = -1;

    Object.entries(results).forEach(([name, [cost, bonus]]) => {
      if (cost < bestCost || (cost === bestCost && bonus > bestBonus)) {
        bestCost = cost;
        bestBonus = bonus;
        bestOption = name;
      }
    });

    res.json({
      tramTrips,
      trainTrips,
      youth,
      results,
      recommendation: {
        option: bestOption,
        cost: bestCost,
        bonusLeft: bestBonus
      }
    });
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ error: 'Internal server error during calculation' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SBB Ticket Calculator API is running' });
});

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SBB Ticket Calculator server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to use the calculator`);
});
