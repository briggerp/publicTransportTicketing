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
   * Determine the fare zone category based on number of zones traversed
   * @param {number} zonesTraversed - Number of zones in the journey
   * @returns {string} Zone category: 'local', '1_2_zones', '3_zones', '4_zones', '5_zones', or 'all_zones'
   */
  determineFareZone(zonesTraversed) {
    if (zonesTraversed <= 1) return 'local';
    if (zonesTraversed <= 2) return '1_2_zones';
    if (zonesTraversed === 3) return '3_zones';
    if (zonesTraversed === 4) return '4_zones';
    if (zonesTraversed === 5) return '5_zones';
    return 'all_zones';
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

    // Zone numbers encode their position in the grid
    // Zone numbering: 110 (center), 111-114 (ring 1), 121-123 (ring 2), etc.
    // Each 10 increment represents a new zone layer
    const homeRing = Math.floor(homeZone / 10);
    const destRing = Math.floor(destZone / 10);
    const ringDifference = Math.abs(destRing - homeRing);

    // Calculate zones traversed
    // Same zone: 1 zone
    // Adjacent rings: ringDifference zones
    if (homeZone === destZone) {
      return 1;
    }

    if (ringDifference > 0) {
      return ringDifference + 1;
    }

    // Same ring, different zones - estimate based on position
    return Math.max(2, Math.abs(destZone % 10 - homeZone % 10) + 1);
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
    const fareZone = this.determineFareZone(zonesTraversed);

    // Get provider pricing
    const prices = this.providerPrices[provider];
    if (!prices) {
      return { error: `Provider '${provider}' not found in pricing data` };
    }

    // Get subscription and single trip prices
    const ageGroup = isYouth ? 'youth' : 'adult';
    const subscriptionData = prices.subscription_types.networkpass[ageGroup]['2nd_class'];
    const singleTripData = prices.single_trip[ageGroup]['2nd_class'];

    if (!subscriptionData[fareZone] || !singleTripData[fareZone]) {
      return { error: `Fare zone '${fareZone}' not available for this provider` };
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
      fareZone,
      provider,
      ageGroup,
      pricing: {
        subscription: {
          monthly: subscriptionData[fareZone].monthly,
          annual: subscriptionData[fareZone].annual
        },
        singleTrip: {
          fullPrice: singleTripData[fareZone].full,
          halftaxPrice: singleTripData[fareZone].halbtax
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
