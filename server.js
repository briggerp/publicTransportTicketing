const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const AboCalculator = require('./services/sbbCalculator');
const ZoneCalculator = require('./services/zoneCalculator');

const app = express();
const PORT = process.env.PORT || 3001;

// Load data files from per-provider subdirectories under data/
let plzZoneMap = {};
let providerPrices = {};

const dataDir = path.join(__dirname, 'data');
const providerDirs = fs.readdirSync(dataDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name);

for (const providerDir of providerDirs) {
  const zoneMapPath = path.join(dataDir, providerDir, 'plz-zone-map.json');
  const pricesPath = path.join(dataDir, providerDir, 'provider-prices.json');

  try {
    const zoneData = JSON.parse(fs.readFileSync(zoneMapPath, 'utf8'));
    let entryCount = 0;
    for (const [key, value] of Object.entries(zoneData)) {
      if (key === '_meta') continue;
      plzZoneMap[key] = value;
      entryCount++;
    }
    console.log(`✓ Loaded ${entryCount} PLZ entries from data/${providerDir}/plz-zone-map.json`);
  } catch (err) {
    console.error(`✗ Error loading data/${providerDir}/plz-zone-map.json:`, err.message);
  }

  try {
    const priceData = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
    Object.assign(providerPrices, priceData);
    console.log(`✓ Loaded prices from data/${providerDir}/provider-prices.json`);
  } catch (err) {
    console.error(`✗ Error loading data/${providerDir}/provider-prices.json:`, err.message);
  }
}

console.log(`✓ Total: ${Object.keys(plzZoneMap).length} PLZ entries, ${Object.keys(providerPrices).length} providers`);

// Middleware
app.use(cors());
app.use(express.json());

// Serve root index.html FIRST
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

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

// API endpoint to get pricing based on postal codes
// API endpoint to get pricing based on postal codes
app.post('/api/zone-pricing', (req, res) => {
  try {
    const { plzHome, plzDestination, isYouth = true } = req.body;

    console.log('\n=== Zone Pricing Request ===');
    console.log('plzHome:', plzHome);
    console.log('plzDestination:', plzDestination);
    console.log('isYouth:', isYouth);

    // Validate input
    if (!plzHome || !plzDestination) {
      console.log('ERROR: Missing postal codes');
      return res.status(400).json({
        error: 'Missing required parameters: plzHome and plzDestination'
      });
    }

    // Pad postal codes
    const plzHomePadded = String(plzHome).padStart(4, '0');
    const plzDestPadded = String(plzDestination).padStart(4, '0');
    console.log('Padded home:', plzHomePadded, '- in map?', plzHomePadded in plzZoneMap);
    console.log('Padded dest:', plzDestPadded, '- in map?', plzDestPadded in plzZoneMap);

    // Auto-detect provider from home postal code (can be overridden via request body)
    const homeEntry = plzZoneMap[plzHomePadded];
    const provider = req.body.provider || (homeEntry ? homeEntry.provider : 'zvv');
    console.log('provider:', provider);

    // Create calculator instance with loaded data
    const calculator = new ZoneCalculator(plzZoneMap, providerPrices);

    // Get pricing
    const pricingData = calculator.getPricingForJourney(
      plzHomePadded,
      plzDestPadded,
      isYouth,
      provider
    );

    console.log('Pricing data result:', pricingData);

    if (!pricingData) {
      console.log('ERROR: pricingData is null');
      return res.status(404).json({
        error: 'Postal code(s) not found in database'
      });
    }

    if (pricingData.error) {
      console.log('ERROR in pricing data:', pricingData.error);
      return res.status(400).json(pricingData);
    }

    // Get subscription pricing for the determined fare zone
    const subscriptionPricing = calculator.getSubscriptionPricing(
      pricingData.subscriptionZone,
      isYouth,
      provider
    );

    const zoneDescription = calculator.getZoneDescription(pricingData.zonesTraversed);
    
    // Get the price source from the provider data
    const priceSource = providerPrices[provider]?.price_source || '';

    console.log('SUCCESS: Returning pricing data');
    res.json({
      ...pricingData,
      subscription: subscriptionPricing,
      zoneDescription,
      priceSource
    });
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

// API endpoint to list available providers
app.get('/api/providers', (req, res) => {
  const providers = Object.entries(providerPrices).map(([key, data]) => ({
    id: key,
    name: data.name,
    abbreviation: data.abbreviation,
    website: data.website,
    prices_valid_from: data.prices_valid_from
  }));
  res.json({ providers });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SBB Ticket Calculator API is running' });
});

// Static files AFTER ALL API routes (this is key!)
app.use(express.static('public'));

// 404 handler for debugging
app.use((req, res) => {
  console.log('404 - Path not found:', req.method, req.path);
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`\n✓ SBB Ticket Calculator server running on port ${PORT}`);
  console.log(`✓ Visit http://localhost:${PORT} to use the calculator\n`);
});
