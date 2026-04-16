const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const AboCalculator = require('./services/sbbCalculator');
const ZoneCalculator = require('./services/zoneCalculator');

const app = express();
const PORT = process.env.PORT || 3001;

// Load data files
const plzZoneMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/plz-zone-map.json'), 'utf8'));
const providerPrices = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/provider-prices.json'), 'utf8'));

// Middleware
app.use(cors());
app.use(express.json());

// Serve root index.html BEFORE static middleware
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoints BEFORE static middleware
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

// API endpoint to get pricing based on postal codes
app.post('/api/zone-pricing', (req, res) => {
  try {
    const { plzHome, plzDestination, isYouth = true, provider = 'zvv' } = req.body;

    // Validate input
    if (!plzHome || !plzDestination) {
      return res.status(400).json({
        error: 'Missing required parameters: plzHome and plzDestination'
      });
    }

    // Create calculator instance with loaded data
    const calculator = new ZoneCalculator(plzZoneMap, providerPrices);

    // Get pricing
    const pricingData = calculator.getPricingForJourney(
      String(plzHome).padStart(4, '0'),
      String(plzDestination).padStart(4, '0'),
      isYouth,
      provider
    );

    if (!pricingData) {
      return res.status(404).json({
        error: 'Postal code(s) not found in database'
      });
    }

    if (pricingData.error) {
      return res.status(400).json(pricingData);
    }

    res.json(pricingData);
  } catch (error) {
    console.error('Zone calculation error:', error);
    res.status(500).json({ error: 'Internal server error during zone calculation' });
  }
});

// API endpoint to search postal codes
app.get('/api/postal-codes', (req, res) => {
  try {
    const { search = '', provider = 'zvv' } = req.query;
    const calculator = new ZoneCalculator(plzZoneMap, providerPrices);
    const codes = calculator.getAvailablePostalCodes(provider);
    
    // Filter by search term (postal code or locality name)
    const filtered = codes.filter(item =>
      item.plz.includes(search) ||
      item.locality.toLowerCase().includes(search.toLowerCase())
    );

    res.json({
      provider,
      count: filtered.length,
      postalCodes: filtered.slice(0, 20) // Limit to 20 results
    });
  } catch (error) {
    console.error('Postal code search error:', error);
    res.status(500).json({ error: 'Internal server error during search' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SBB Ticket Calculator API is running' });
});

// Static files AFTER explicit routes
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`SBB Ticket Calculator server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to use the calculator`);
});
