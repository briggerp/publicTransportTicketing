require('dotenv').config();
const SBBApiClient = require('./client');
const fs = require('fs').promises;
const path = require('path');

const CACHE_FILE = path.join(__dirname, 'price-cache.json');
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

async function loadCachedPrices() {
    try {
        const data = await fs.readFile(CACHE_FILE, 'utf8');
        const cache = JSON.parse(data);
        
        // Check if cache is expired
        if (Date.now() - cache.timestamp > CACHE_DURATION) {
            return null;
        }
        
        return cache.prices;
    } catch (error) {
        return null;
    }
}

async function savePricesToCache(prices) {
    try {
        const cache = {
            timestamp: Date.now(),
            prices
        };
        await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
    } catch (error) {
        console.error('Failed to cache prices:', error);
    }
}

async function getCurrentPrices() {
    // Try to get prices from cache first
    const cachedPrices = await loadCachedPrices();
    if (cachedPrices) {
        return cachedPrices;
    }

    try {
        // Fetch fresh prices from API
        const prices = await SBBApiClient.getPrices();
        
        // Cache the new prices
        await savePricesToCache(prices);
        
        return prices;
    } catch (error) {
        console.error('Failed to update SBB prices:', error);
        
        // Return last known prices from cache, even if expired
        const lastKnownPrices = await loadCachedPrices();
        if (lastKnownPrices) {
            console.log('Using expired cached prices');
            return lastKnownPrices;
        }
        
        // If all else fails, return hardcoded defaults
        return require('../sbbCalculator').getDefaultPrices();
    }
}

module.exports = {
    getCurrentPrices
};
