import Foundation

// MARK: - Result

struct CalculatorResult: Identifiable {
    var id = UUID()
    let name: String
    let cost: Int
    let bonusLeft: Double
    var isBestValue: Bool = false

    var monthlyCost: Int { Int(round(Double(cost) / 12.0)) }

    var bonusText: String {
        if bonusLeft.isInfinite { return "Unlimited travel" }
        if bonusLeft == 0      { return "No unused credit" }
        return "CHF \(Int(bonusLeft)) credit left"
    }

    var bonusIsPositive: Bool { bonusLeft > 0 }
}

// MARK: - Model

class CalculatorModel: ObservableObject {

    // Travel inputs
    @Published var isYouth: Bool = true { didSet { loadPresets() } }
    @Published var tramTripsPerWeek: Double  = 5
    @Published var tramPricePerTrip: Double  = 3.20
    @Published var trainTripsPerMonth: Double = 2
    @Published var trainPricePerTrip: Double  = 20

    // Subscription prices
    @Published var localPassYearly: Double = 586
    @Published var htPrice: Double         = 100
    @Published var gaNightPrice: Double    = 100
    @Published var gaPrice: Double         = 2780
    @Published var ht1Cost: Double         = 600
    @Published var ht1Bonus: Double        = 400
    @Published var ht2Cost: Double         = 1125
    @Published var ht2Bonus: Double        = 875
    @Published var ht3Cost: Double         = 1575
    @Published var ht3Bonus: Double        = 1425

    // MARK: Presets

    func loadPresets() {
        if isYouth {
            localPassYearly = 586;  htPrice = 100;  gaNightPrice = 100;  gaPrice = 2780
            ht1Cost = 600;   ht1Bonus = 400
            ht2Cost = 1125;  ht2Bonus = 875
            ht3Cost = 1575;  ht3Bonus = 1425
        } else {
            localPassYearly = 809;  htPrice = 170;  gaNightPrice = 0;    gaPrice = 3995
            ht1Cost = 800;   ht1Bonus = 200
            ht2Cost = 1500;  ht2Bonus = 500
            ht3Cost = 2100;  ht3Bonus = 900
        }
    }

    // MARK: Calculation (mirrors Python notebook)

    /// Local pass + HT Night + HT + HT Plus for long-distance trips
    private func tramAboHTPlus(htCost: Double, htBonus: Double) -> (Int, Double) {
        let base        = localPassYearly + gaNightPrice + htPrice
        let yearlyTrain = trainTripsPerMonth * 12 * trainPricePerTrip
        if yearlyTrain > htCost + htBonus {
            return (Int(base + yearlyTrain - htBonus), 0)
        } else if yearlyTrain < htCost {
            return (Int(base + yearlyTrain), htBonus)
        } else {
            return (Int(base + htCost), htCost + htBonus - yearlyTrain)
        }
    }

    /// HT Night + HT + HT Plus covering both local & long-distance trips
    private func htPlusOnly(htCost: Double, htBonus: Double) -> (Int, Double) {
        let base         = gaNightPrice + htPrice
        let yearlyTotal  = tramTripsPerWeek * 52 * tramPricePerTrip
                         + trainTripsPerMonth * 12 * trainPricePerTrip
        if yearlyTotal > htCost + htBonus {
            return (Int(base + yearlyTotal - htBonus), 0)
        } else if yearlyTotal < htCost {
            return (Int(base + yearlyTotal), htBonus)
        } else {
            return (Int(base + htCost), htCost + htBonus - yearlyTotal)
        }
    }

    // MARK: Results

    var results: [CalculatorResult] {
        let r1 = tramAboHTPlus(htCost: ht1Cost, htBonus: ht1Bonus)
        let r2 = tramAboHTPlus(htCost: ht2Cost, htBonus: ht2Bonus)
        let r3 = htPlusOnly(htCost: ht1Cost,    htBonus: ht1Bonus)
        let r4 = htPlusOnly(htCost: ht2Cost,    htBonus: ht2Bonus)
        let r5 = htPlusOnly(htCost: ht3Cost,    htBonus: ht3Bonus)

        var options: [CalculatorResult] = [
            CalculatorResult(name: "Local Pass\n+ HT Plus 1000", cost: r1.0, bonusLeft: r1.1),
            CalculatorResult(name: "Local Pass\n+ HT Plus 2000", cost: r2.0, bonusLeft: r2.1),
            CalculatorResult(name: "HT Plus 1000",               cost: r3.0, bonusLeft: r3.1),
            CalculatorResult(name: "HT Plus 2000",               cost: r4.0, bonusLeft: r4.1),
            CalculatorResult(name: "HT Plus 3000",               cost: r5.0, bonusLeft: r5.1),
            CalculatorResult(name: "GA",                         cost: Int(gaPrice), bonusLeft: .infinity),
        ]

        if let minCost = options.map(\.cost).min() {
            for i in options.indices {
                options[i].isBestValue = options[i].cost == minCost
            }
        }
        return options
    }
}
