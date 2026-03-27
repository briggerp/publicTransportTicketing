/**
 * SBB Ticket Calculator
 * Calculates optimal Swiss public transportation ticket based on usage patterns
 */

class AboCalculator {
  constructor(youth = true, priceOverrides = {}) {
    this.youth = youth;

    // Ticket Prices
    this.tram_trip_price = 3.20; // Price per tram trip with HT
    this.train_trip_price = 20; // Price per train trip with HT

    // Abo Prices
    if (this.youth) {
      // Youth (< 25 years old)
      this.zvv_tram = 586; // Yearly tram subscription for zones 1-2
      this.zvv_month = 63;
      this.HT_plus_1000 = [600, 400]; // [Cost, Bonus]
      this.HT_plus_2000 = [1125, 875];
      this.HT_plus_3000 = [1575, 1425];
      this.GA = 2780; // GA price for youth
      this.HT = 100; // Half-Tax price
      this.GA_Night = 100; // GA Night price for youth
    } else {
      // Adult
      this.zvv_tram = 809; // Yearly tram subscription for zones 1-2
      this.zvv_month = 87;
      this.HT_plus_1000 = [800, 200];
      this.HT_plus_2000 = [1500, 500];
      this.HT_plus_3000 = [2100, 900];
      this.GA = 3995; // GA price for adults
      this.HT = 170; // Half-Tax price
      this.GA_Night = 0; // GA Night not available for adults
    }

    // Apply price overrides if provided
    if (priceOverrides.tramTripPrice !== undefined) this.tram_trip_price = priceOverrides.tramTripPrice;
    if (priceOverrides.trainTripPrice !== undefined) this.train_trip_price = priceOverrides.trainTripPrice;
    if (priceOverrides.zvvTram !== undefined) this.zvv_tram = priceOverrides.zvvTram;
    if (priceOverrides.zvvMonth !== undefined) this.zvv_month = priceOverrides.zvvMonth;
    if (priceOverrides.htPlus1000Cost !== undefined) this.HT_plus_1000[0] = priceOverrides.htPlus1000Cost;
    if (priceOverrides.htPlus2000Cost !== undefined) this.HT_plus_2000[0] = priceOverrides.htPlus2000Cost;
    if (priceOverrides.htPlus3000Cost !== undefined) this.HT_plus_3000[0] = priceOverrides.htPlus3000Cost;
    if (priceOverrides.gaCost !== undefined) this.GA = priceOverrides.gaCost;
  }

  tramabo_HTplus1000(traintrips) {
    let money_spent = this.zvv_tram + this.GA_Night + this.HT;
    let bonus_left = 0;
    const trainCost = traintrips * 12 * this.train_trip_price;
    const totalBonus = this.HT_plus_1000[0] + this.HT_plus_1000[1];

    if (trainCost > totalBonus) {
      money_spent += trainCost - this.HT_plus_1000[1];
      bonus_left = 0;
    } else if (trainCost < this.HT_plus_1000[0]) {
      money_spent += trainCost;
      bonus_left = this.HT_plus_1000[1];
    } else {
      money_spent += this.HT_plus_1000[0];
      bonus_left = totalBonus - trainCost;
    }

    return [Math.floor(money_spent), Math.floor(bonus_left)];
  }

  tramabo_HTplus2000(traintrips) {
    let money_spent = this.zvv_tram + this.GA_Night + this.HT;
    let bonus_left = 0;
    const trainCost = traintrips * 12 * this.train_trip_price;
    const totalBonus = this.HT_plus_2000[0] + this.HT_plus_2000[1];

    if (trainCost > totalBonus) {
      money_spent += trainCost - this.HT_plus_2000[1];
      bonus_left = 0;
    } else if (trainCost < this.HT_plus_2000[0]) {
      money_spent += trainCost;
      bonus_left = this.HT_plus_2000[1];
    } else {
      money_spent += this.HT_plus_2000[0];
      bonus_left = totalBonus - trainCost;
    }

    return [Math.floor(money_spent), Math.floor(bonus_left)];
  }

  HTplus1000(tramtrips, traintrips) {
    let money_spent = this.GA_Night + this.HT;
    let bonus_left = 0;
    const totalTripCost = tramtrips * 52 * this.tram_trip_price + traintrips * 12 * this.train_trip_price;
    const totalBonus = this.HT_plus_1000[0] + this.HT_plus_1000[1];

    if (totalTripCost > totalBonus) {
      money_spent += totalTripCost - this.HT_plus_1000[1];
      bonus_left = 0;
    } else if (totalTripCost < this.HT_plus_1000[0]) {
      money_spent += totalTripCost;
      bonus_left = this.HT_plus_1000[1];
    } else {
      money_spent += this.HT_plus_1000[0];
      bonus_left = totalBonus - totalTripCost;
    }

    return [Math.floor(money_spent), Math.floor(bonus_left)];
  }

  HTplus2000(tramtrips, traintrips) {
    let money_spent = this.GA_Night + this.HT;
    let bonus_left = 0;
    const totalTripCost = tramtrips * 52 * this.tram_trip_price + traintrips * 12 * this.train_trip_price;
    const totalBonus = this.HT_plus_2000[0] + this.HT_plus_2000[1];

    if (totalTripCost > totalBonus) {
      money_spent += totalTripCost - this.HT_plus_2000[1];
      bonus_left = 0;
    } else if (totalTripCost < this.HT_plus_2000[0]) {
      money_spent += totalTripCost;
      bonus_left = this.HT_plus_2000[1];
    } else {
      money_spent += this.HT_plus_2000[0];
      bonus_left = totalBonus - totalTripCost;
    }

    return [Math.floor(money_spent), Math.floor(bonus_left)];
  }

  HTplus3000(tramtrips, traintrips) {
    let money_spent = this.GA_Night + this.HT;
    let bonus_left = 0;
    const totalTripCost = tramtrips * 52 * this.tram_trip_price + traintrips * 12 * this.train_trip_price;
    const totalBonus = this.HT_plus_3000[0] + this.HT_plus_3000[1];

    if (totalTripCost > totalBonus) {
      money_spent += totalTripCost - this.HT_plus_3000[1];
      bonus_left = 0;
    } else if (totalTripCost < this.HT_plus_3000[0]) {
      money_spent += totalTripCost;
      bonus_left = this.HT_plus_3000[1];
    } else {
      money_spent += this.HT_plus_3000[0];
      bonus_left = totalBonus - totalTripCost;
    }

    return [Math.floor(money_spent), Math.floor(bonus_left)];
  }

  GAabo() {
    return [this.GA, Infinity];
  }

  // Tram-only yearly subscription (with HT and GA-night) - train trips paid at full price
  tramAboOnly(trainTrips) {
    const trainCost = trainTrips * 12 * (this.train_trip_price);
    return [this.zvv_tram + trainCost, 0];
  }

  // Half-Tax card as standalone cost (no trips counted) — user asked to show how much is spent on a Halbtax
  HTOnly() {
    return [this.HT, 0];
  }

  // GA Night standalone cost (some youth offers include GA Night). Show as its own line item.
  GA_NightOnly() {
    return [this.GA_Night || 0, 0];
  }

  calculateAll(tramTrips, trainTrips) {
    return {
      'Tram Abo + HT Plus 1000': this.tramabo_HTplus1000(trainTrips),
      'Tram Abo + HT Plus 2000': this.tramabo_HTplus2000(trainTrips),
      'HT Plus 1000': this.HTplus1000(tramTrips, trainTrips),
      'HT Plus 2000': this.HTplus2000(tramTrips, trainTrips),
      'HT Plus 3000': this.HTplus3000(tramTrips, trainTrips),
      'GA': this.GAabo(),
      'Tram Abo': this.tramAboOnly(trainTrips),
    };
  }
}

module.exports = AboCalculator;
