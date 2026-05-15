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
   * @returns {string} Standard zone category key for single trips
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
   * @returns {string} Standard zone category key for subscriptions
   */
  determineSubscriptionZone(zonesTraversed) {
    if (zonesTraversed <= 1) return 'local';
    if (zonesTraversed <= 2) return '1_2_zones';
    if (zonesTraversed === 3) return '3_zones';
    if (zonesTraversed === 4) return '4_zones';
    return '5_zones';
  }

  /**
   * Resolve a standard zone key to the provider's actual price-table key.
   *
   * Resolution order:
   *  1. special_price_zones  – checked first; each entry wins if its condition
   *     holds for the given zone arrays (independent of the standard key).
   *  2. zone_key_map         – renames a standard key to the provider's key.
   *  3. standard key         – returned unchanged as fallback.
   *
   * Supported conditions in special_price_zones:
   *  "all_zones_within"  – every zone value in both home and dest arrays must
   *                        appear in the entry's required_zones list.
   *
   * @param {number[]} homeZones   - Raw zone array for the home PLZ
   * @param {number[]} destZones   - Raw zone array for the destination PLZ
   * @param {string}   standardKey - Key produced by determine*Zone()
   * @param {object}   providerData - Entry from providerPrices for this provider
   * @returns {string} Resolved price-table key
   */
  resolveZoneKey(homeZones, destZones, standardKey, providerData) {
    if (!providerData) return standardKey;

    // 1. Special price zones (e.g. "10_zone_LU" for Lucerne city-only journeys)
    const specials = providerData.special_price_zones;
    if (Array.isArray(specials)) {
      for (const special of specials) {
        if (special.condition === 'all_zones_within') {
          const required = new Set(special.required_zones);
          const allHomeMatch = homeZones.every(z => required.has(z));
          const allDestMatch = destZones.every(z => required.has(z));
          if (allHomeMatch && allDestMatch) {
            return special.key;
          }
        }
      }
    }

    // 2. Generic key rename map (e.g. "local" → "1_zones")
    const keyMap = providerData.zone_key_map;
    if (keyMap && keyMap[standardKey] !== undefined) {
      return keyMap[standardKey];
    }

    // 3. Fall back to the standard key
    return standardKey;
  }

  /**
   * Get subscription pricing for a specific zone category
   * @param {string}  fareZone  - Fare zone key (standard or provider-specific)
   * @param {boolean} isYouth   - Whether to get youth pricing
   * @param {string}  provider  - Transit provider (default: 'zvv')
   * @returns {object|null} Subscription pricing data or null
   */
  getSubscriptionPricing(fareZone, isYouth = true, provider = 'zvv') {
    const prices = this.providerPrices[provider];
    if (!prices) return null;

    const ageGroup = isYouth ? 'youth' : 'adult';
    const subscriptionData = prices.subscription_types.networkpass[ageGroup]['2nd_class'];

    // Apply zone_key_map so callers can pass either standard or resolved keys
    const keyMap = prices.zone_key_map || {};
    const resolvedKey = keyMap[fareZone] ?? fareZone;

    if (!subscriptionData[resolvedKey]) return null;

    return {
      fareZone:  resolvedKey,
      monthly:   subscriptionData[resolvedKey].monthly,
      annual:    subscriptionData[resolvedKey].annual
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
   * Calculate minimum zones between home and destination.
   *
   * Zone numbers encode their position: e.g. 110 (city centre), 111–114 (ring 1),
   * 121–123 (ring 2). Each 10-increment in the tens digit represents one zone layer.
   *
   * The doubleZone bonus is only applied when a PLZ genuinely straddles two
   * different zones (i.e. its zones array contains distinct values), which
   * represents a border location rather than a "firmly in one zone" entry.
   *
   * @param {number[]} homeZones - Zone(s) of home postal code
   * @param {number[]} destZones - Zone(s) of destination postal code
   * @returns {number} Estimated zones traversed
   */
  calculateZonesTraversed(homeZones, destZones) {
    const homeZone = Array.isArray(homeZones) ? homeZones[0] : homeZones;
    const destZone = Array.isArray(destZones) ? destZones[0] : destZones;

    // Only add a border-crossing bonus when the PLZ genuinely spans multiple
    // distinct zones (e.g. [110, 121]).  A repeated value like [210, 210]
    // means "unambiguously in zone 210" and must NOT add an extra zone.
    const homeIsMultiZone = Array.isArray(homeZones) && new Set(homeZones).size > 1;
    const destIsMultiZone = Array.isArray(destZones) && new Set(destZones).size > 1;
    const doubleZone = (homeIsMultiZone || destIsMultiZone) ? 1 : 0;

    const homeRing = Math.floor(homeZone / 10);
    const destRing = Math.floor(destZone / 10);
    const ringDifference = Math.abs(destRing - homeRing);

    if (homeZone === destZone) {
      return 1 + doubleZone;
    }

    if (ringDifference > 0) {
      return ringDifference + 1 + doubleZone;
    }

    // Same ring, different zones – use positional distance within the ring
    return Math.max(2, Math.abs(destZone % 10 - homeZone % 10) + 1 + doubleZone);
  }

  /**
   * Get pricing for a journey based on zones
   * @param {string}  plzHome        - Home postal code
   * @param {string}  plzDestination - Destination postal code
   * @param {boolean} isYouth        - Whether pricing should be for youth
   * @param {string}  provider       - Transit provider (default: 'zvv')
   * @returns {object|null} Pricing data with fare zone category and prices
   */
  getPricingForJourney(plzHome, plzDestination, isYouth = true, provider = 'zvv') {
    const homeData = this.getZonesForPlz(plzHome);
    const destData = this.getZonesForPlz(plzDestination);

    if (!homeData || !destData) return null;

    if (homeData.provider !== provider || destData.provider !== provider) {
      return {
        error: 'Postal codes are in different transit provider zones',
        homeProvider: homeData.provider,
        destProvider: destData.provider
      };
    }

    const zonesTraversed = this.calculateZonesTraversed(homeData.zones, destData.zones);

    const standardSubKey    = this.determineSubscriptionZone(zonesTraversed);
    const standardSingleKey = this.determineSingleTripZone(zonesTraversed);

    const prices = this.providerPrices[provider];
    if (!prices) {
      return { error: `Provider '${provider}' not found in pricing data` };
    }

    // Resolve standard keys to provider-specific keys (zone_key_map + special_price_zones)
    const subscriptionZone = this.resolveZoneKey(homeData.zones, destData.zones, standardSubKey,    prices);
    const singleTripZone   = this.resolveZoneKey(homeData.zones, destData.zones, standardSingleKey, prices);

    const ageGroup        = isYouth ? 'youth' : 'adult';
    const subscriptionData = prices.subscription_types.networkpass[ageGroup]['2nd_class'];
    const singleTripData   = prices.single_trip[ageGroup]['2nd_class'];

    if (!subscriptionData[subscriptionZone] || !singleTripData[singleTripZone]) {
      return { error: `Fare zone not available for this provider` };
    }

    return {
      success: true,
      plzHome,
      plzDestination,
      homeLocality:    homeData.locality,
      destLocality:    destData.locality,
      homeZones:       homeData.zones,
      destZones:       destData.zones,
      zonesTraversed,
      subscriptionZone,
      singleTripZone,
      provider,
      ageGroup,
      pricing: {
        subscription: {
          monthly: subscriptionData[subscriptionZone].monthly,
          annual:  subscriptionData[subscriptionZone].annual
        },
        singleTrip: {
          fullPrice:    singleTripData[singleTripZone].full,
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
        zones:    data.zones
      }))
      .sort((a, b) => a.locality.localeCompare(b.locality));
  }
}

module.exports = ZoneCalculator;
