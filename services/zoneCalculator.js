/**
 * Zone Calculator for Swiss Public Transportation
 * Calculates fare zones based on postal codes and determines appropriate pricing
 */

class ZoneCalculator {
  constructor(plzZoneMap, providerPrices) {
    this.plzZoneMap = plzZoneMap;
    this.providerPrices = providerPrices;
  }

  /**
   * Get the zone(s) for a given postal code
   * @param {string} plz - Postal code (4 digits)
   * @returns {object|null} Zone data or null if not found
   */
  getZonesForPlz(plz) {
    const plzStr = String(plz).padStart(4, '0');
    return this.plzZoneMap[plzStr] || null;
  }

  /**
   * Determine the fare zone category for single trips (up to 7 zones)
   * @param {number} zonesTraversed - Number of zones in the journey
   * @returns {string} Zone category for single trips
   */
  determineSingleTripZone(zonesTraversed) {
    if (zonesTraversed <= 1) return 'local';
    if (zonesTraversed <= 2) return '1_2_zones';
    if (zonesTraversed === 3) return '3_zones';
    if (zonesTraversed === 4) return '4_zones';
    if (zonesTraversed === 5) return '5_zones';
    if (zonesTraversed === 6) return '6_zones';
    if (zonesTraversed === 7) return '7_zones';
    return 'all_zones';
  }

  /**
   * Determine the fare zone category for subscriptions (up to 5 zones)
   * @param {number} zonesTraversed - Number of zones in the journey
   * @returns {string} Zone category for subscriptions
   */
  determineSubscriptionZone(zonesTraversed) {
    if (zonesTraversed <= 1) return 'local';
    if (zonesTraversed <= 2) return '1_2_zones';
    if (zonesTraversed === 3) return '3_zones';
    if (zonesTraversed === 4) return '4_zones';
    if (zonesTraversed >= 5) return '5_zones'; // Subscriptions cap at 5_zones
    return '5_zones';
  }

  /**
   * Get subscription pricing for a specific zone category
   * @param {string} fareZone - Fare zone category (local, 1_2_zones, etc.)
   * @param {boolean} isYouth - Whether to get youth pricing
   * @param {string} provider - Transit provider (default: 'zvv')
   * @returns {object|null} Subscription pricing data or null
   */
  getSubscriptionPricing(fareZone, isYouth = true, provider = 'zvv') {
    const prices = this.providerPrices[provider];
    if (!prices) {
      return null;
    }

    const ageGroup = isYouth ? 'youth' : 'adult';
    const subscriptionData = prices.subscription_types.networkpass[ageGroup]['2nd_class'];

    if (!subscriptionData[fareZone]) {
      return null;
    }

    return {
      fareZone,
      monthly: subscriptionData[fareZone].monthly,
      annual: subscriptionData[fareZone].annual
    };
  }

  /**
   * Get human-readable description for zone count
   * @param {number} zonesTraversed - Number of zones
   * @returns {string} Description text
   */
  getZoneDescription(zonesTraversed) {
    const descriptions = {
      1: 'Local (1 zone)',
      2: '1-2 zones',
      3: '3 zones',
      4: '4 zones',
      5: '5 zones',
      6: '6 zones',
      7: '7 zones'
    };
    
    if (zonesTraversed <= 1) return descriptions[1];
    if (zonesTraversed <= 7) return descriptions[zonesTraversed];
    return '7+ zones (all zones)';
  }

  /**
   * Calculate minimum zones between home and destination
   * Uses zone numbers to estimate distance traveled
   * @param {array} homeZones - Zone(s) of home postal code
   * @param {array} destZones - Zone(s) of destination postal code
   * @returns {number} Estimated zones traversed
   */
  calculateZonesTraversed(homeZones, destZones) {
    // If either location has multiple zones (border case), use the first
    const homeZone = Array.isArray(homeZones) ? homeZones[0] : homeZones;
    const destZone = Array.isArray(destZones) ? destZones[0] : destZones;
    
    // Special counter for large cities (Zurich, Winterthur) with multiple zones
    // These are counted as 2 zones to reflect higher travel costs within them
    let doubleZone = 0;

    if ((Array.isArray(homeZones) && homeZones.length > 1) || 
        (Array.isArray(destZones) && destZones.length > 1)) {
      doubleZone = 1;
    }

    // Zone numbers encode their position in the grid
    // Zone numbering: 110 (center), 111-114 (ring 1), 121-123 (ring 2), etc.
    // Each 10 increment represents a new zone layer
    const homeRing = Math.floor(homeZone / 10);
    const destRing = Math.floor(destZone / 10);
    const ringDifference = Math.abs(destRing - homeRing);

    // Calculate zones traversed
    // Same zone: 1 zone (+ doubleZone if it's a large city)
    if (homeZone === destZone) {
      return 1 + doubleZone;
    }

    if (ringDifference > 0) {
      return ringDifference + 1 + doubleZone;
    }

    // Same ring, different zones - estimate based on position
    return Math.max(2, Math.abs(destZone % 10 - homeZone % 10) + 1 + doubleZone);
  }

  /**
   * Get pricing for a journey based on zones
   * @param {string} plzHome - Home postal code
   * @param {string} plzDestination - Destination postal code
   * @param {boolean} isYouth - Whether pricing should be for youth
   * @param {string} provider - Transit provider (default: 'zvv')
   * @returns {object|null} Pricing data with fare zone category and prices
   */
  getPricingForJourney(plzHome, plzDestination, isYouth = true, provider = 'zvv') {
    // Validate and get zone data
    const homeData = this.getZonesForPlz(plzHome);
    const destData = this.getZonesForPlz(plzDestination);

    if (!homeData || !destData) {
      return null;
    }

    // Check provider match
    if (homeData.provider !== provider || destData.provider !== provider) {
      return {
        error: 'Postal codes are in different transit provider zones',
        homeProvider: homeData.provider,
        destProvider: destData.provider
      };
    }

    // Calculate zones traversed
    const zonesTraversed = this.calculateZonesTraversed(homeData.zones, destData.zones);
    
    // Different zone categories for subscriptions vs single trips
    const subscriptionZone = this.determineSubscriptionZone(zonesTraversed);
    const singleTripZone = this.determineSingleTripZone(zonesTraversed);

    // Get provider pricing
    const prices = this.providerPrices[provider];
    if (!prices) {
      return { error: `Provider '${provider}' not found in pricing data` };
    }

    // Get subscription and single trip prices
    const ageGroup = isYouth ? 'youth' : 'adult';
    const subscriptionData = prices.subscription_types.networkpass[ageGroup]['2nd_class'];
    const singleTripData = prices.single_trip[ageGroup]['2nd_class'];

    if (!subscriptionData[subscriptionZone] || !singleTripData[singleTripZone]) {
      return { error: `Fare zone not available for this provider` };
    }

    return {
      success: true,
      plzHome,
      plzDestination,
      homeLocality: homeData.locality,
      destLocality: destData.locality,
      homeZones: homeData.zones,
      destZones: destData.zones,
      zonesTraversed,
      subscriptionZone,
      singleTripZone,
      provider,
      ageGroup,
      pricing: {
        subscription: {
          monthly: subscriptionData[subscriptionZone].monthly,
          annual: subscriptionData[subscriptionZone].annual
        },
        singleTrip: {
          fullPrice: singleTripData[singleTripZone].full,
          halftaxPrice: singleTripData[singleTripZone].halbtax
        }
      }
    };
  }

  /**
   * Get all available postal codes for a provider
   * @param {string} provider - Transit provider (default: 'zvv')
   * @returns {array} List of available postal codes
   */
  getAvailablePostalCodes(provider = 'zvv') {
    return Object.entries(this.plzZoneMap)
      .filter(([_, data]) => data.provider === provider)
      .map(([plz, data]) => ({
        plz,
        locality: data.locality,
        zones: data.zones
      }))
      .sort((a, b) => a.locality.localeCompare(b.locality));
  }
}

module.exports = ZoneCalculator;
