import SwiftUI

// MARK: - Main View

struct ContentView: View {
    @StateObject private var model = CalculatorModel()
    @State private var showPrices  = false

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                HeroSection()

                VStack(spacing: 16) {
                    ageCard
                    travelCard
                    subscriptionPricesCard

                    // Results header
                    Text("Annual Cost Comparison")
                        .font(.title2.bold())
                        .tracking(-0.3)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    // Results grid
                    LazyVGrid(
                        columns: [GridItem(.flexible()), GridItem(.flexible())],
                        spacing: 12
                    ) {
                        ForEach(model.results) { result in
                            ResultCard(result: result)
                        }
                    }

                    Text("Prices are indicative. Verify current tariffs at sbb.ch before purchasing.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 8)
                        .padding(.bottom, 8)
                }
                .padding(.horizontal, 20)
                .padding(.top, 28)
                .padding(.bottom, 24)
            }
        }
        .background(Color(.systemGroupedBackground))
        .ignoresSafeArea(edges: .top)
    }

    // MARK: Age card

    var ageCard: some View {
        STCCard {
            VStack(alignment: .leading, spacing: 12) {
                CardLabel("AGE GROUP")
                Picker("Age", selection: $model.isYouth) {
                    Text("Under 25").tag(true)
                    Text("25 and older").tag(false)
                }
                .pickerStyle(.segmented)
            }
        }
    }

    // MARK: Travel card

    var travelCard: some View {
        STCCard {
            VStack(alignment: .leading, spacing: 0) {
                CardLabel("YOUR TRAVEL")
                InputRow(label: "Local trips per week",
                         sublabel: "Tram, bus, S-Bahn",
                         unit: "/wk",
                         value: $model.tramTripsPerWeek,
                         step: 1, format: "%.0f",
                         range: 0...99)
                Divider()
                InputRow(label: "Local trip price",
                         sublabel: "Half-fare per trip",
                         unit: "CHF",
                         value: $model.tramPricePerTrip,
                         step: 0.10, format: "%.2f",
                         range: 0...999)
                Divider()
                InputRow(label: "Long-distance trips/month",
                         sublabel: "SBB intercity trains",
                         unit: "/mo",
                         value: $model.trainTripsPerMonth,
                         step: 1, format: "%.0f",
                         range: 0...99)
                Divider()
                InputRow(label: "Long-distance trip price",
                         sublabel: "Half-fare per trip",
                         unit: "CHF",
                         value: $model.trainPricePerTrip,
                         step: 1, format: "%.0f",
                         range: 0...9999)
            }
        }
    }

    // MARK: Subscription prices card

    var subscriptionPricesCard: some View {
        STCCard {
            VStack(alignment: .leading, spacing: 0) {
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                        showPrices.toggle()
                    }
                } label: {
                    HStack {
                        Text("Subscription Prices")
                            .font(.body.weight(.semibold))
                            .foregroundStyle(.primary)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(.secondary)
                            .rotationEffect(.degrees(showPrices ? 90 : 0))
                    }
                }
                .buttonStyle(.plain)

                if showPrices {
                    VStack(alignment: .leading, spacing: 0) {
                        AdvancedSectionLabel("LOCAL PASS")
                        InputRow(label: "Annual local pass",
                                 sublabel: "Zone 1–2 yearly subscription",
                                 unit: "CHF/yr",
                                 value: $model.localPassYearly,
                                 step: 1, format: "%.0f", range: 0...99999)

                        AdvancedSectionLabel("BASE SUBSCRIPTIONS")
                        InputRow(label: "Halbtax",
                                 sublabel: nil,
                                 unit: "CHF/yr",
                                 value: $model.htPrice,
                                 step: 1, format: "%.0f", range: 0...9999)
                        Divider()
                        InputRow(label: "GA Night",
                                 sublabel: "Youth only",
                                 unit: "CHF/yr",
                                 value: $model.gaNightPrice,
                                 step: 1, format: "%.0f", range: 0...9999)
                        Divider()
                        InputRow(label: "GA",
                                 sublabel: "Generalabonnement",
                                 unit: "CHF/yr",
                                 value: $model.gaPrice,
                                 step: 10, format: "%.0f", range: 0...99999)

                        AdvancedSectionLabel("HT PLUS PACKAGES  —  COST  +  BONUS")
                        HTPackageRow(label: "HT Plus 1000",
                                     cost: $model.ht1Cost, bonus: $model.ht1Bonus)
                        Divider()
                        HTPackageRow(label: "HT Plus 2000",
                                     cost: $model.ht2Cost, bonus: $model.ht2Bonus)
                        Divider()
                        HTPackageRow(label: "HT Plus 3000",
                                     cost: $model.ht3Cost, bonus: $model.ht3Bonus)
                    }
                    .padding(.top, 16)
                    .transition(.opacity.combined(with: .move(edge: .top)))
                }
            }
        }
    }
}

// MARK: - Hero

struct HeroSection: View {
    var body: some View {
        VStack(spacing: 12) {
            Text("Swiss Transit\nCalculator")
                .font(.system(size: 38, weight: .bold))
                .tracking(-1)
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.75)

            Text("Find the best public transport\nsubscription for your travel.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 72)
        .padding(.bottom, 44)
        .padding(.horizontal, 24)
        .frame(maxWidth: .infinity)
        .background(Color(.systemBackground))
    }
}

// MARK: - Card container

struct STCCard<Content: View>: View {
    let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }

    var body: some View {
        content
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

// MARK: - Labels

struct CardLabel: View {
    let text: String
    init(_ text: String) { self.text = text }
    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .semibold))
            .tracking(0.8)
            .foregroundStyle(.secondary)
            .padding(.bottom, 8)
    }
}

struct AdvancedSectionLabel: View {
    let text: String
    init(_ text: String) { self.text = text }
    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .semibold))
            .tracking(0.8)
            .foregroundStyle(.secondary)
            .padding(.top, 16)
            .padding(.bottom, 6)
    }
}

// MARK: - Input row

struct InputRow: View {
    let label: String
    let sublabel: String?
    let unit: String
    @Binding var value: Double
    let step: Double
    let format: String
    let range: ClosedRange<Double>

    var body: some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                Text(label).font(.body)
                if let sub = sublabel {
                    Text(sub).font(.caption).foregroundStyle(.secondary)
                }
            }
            Spacer(minLength: 4)
            HStack(spacing: 4) {
                Text(String(format: format, value))
                    .font(.body.monospacedDigit())
                    .foregroundStyle(.secondary)
                    .frame(minWidth: 46, alignment: .trailing)
                Text(unit)
                    .font(.caption)
                    .foregroundStyle(Color(.tertiaryLabel))
                    .frame(minWidth: 34, alignment: .leading)
                Stepper("", value: $value, in: range, step: step)
                    .labelsHidden()
            }
        }
        .padding(.vertical, 11)
    }
}

// MARK: - HT Package row

struct HTPackageRow: View {
    let label: String
    @Binding var cost: Double
    @Binding var bonus: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label).font(.body)
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Cost").font(.caption).foregroundStyle(.secondary)
                    HStack(spacing: 4) {
                        Text("\(Int(cost)) CHF")
                            .font(.callout.monospacedDigit())
                        Stepper("", value: $cost, in: 0...99999, step: 25)
                            .labelsHidden()
                    }
                }
                Text("+")
                    .font(.body)
                    .foregroundStyle(.secondary)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Bonus").font(.caption).foregroundStyle(.secondary)
                    HStack(spacing: 4) {
                        Text("\(Int(bonus)) CHF")
                            .font(.callout.monospacedDigit())
                        Stepper("", value: $bonus, in: 0...99999, step: 25)
                            .labelsHidden()
                    }
                }
            }
        }
        .padding(.vertical, 11)
    }
}

// MARK: - Result card

struct ResultCard: View {
    let result: CalculatorResult

    var body: some View {
        ZStack(alignment: .topTrailing) {
            VStack(alignment: .leading, spacing: 0) {
                Text(result.name)
                    .font(.system(size: 11, weight: .semibold))
                    .tracking(0.4)
                    .textCase(.uppercase)
                    .foregroundStyle(result.isBestValue ? Color.accentColor : .secondary)
                    .padding(.top, result.isBestValue ? 18 : 0)
                    .padding(.bottom, 10)
                    .lineLimit(2)
                    .minimumScaleFactor(0.8)

                Text("CHF \(result.cost)")
                    .font(.system(size: 26, weight: .bold))
                    .minimumScaleFactor(0.55)
                    .lineLimit(1)

                Text("/ year  ·  CHF \(result.monthlyCost)/mo")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.top, 2)
                    .padding(.bottom, 10)

                Text(result.bonusText)
                    .font(.caption.weight(.medium))
                    .foregroundStyle(result.bonusIsPositive ? Color.green : Color.secondary)
                    .lineLimit(2)
                    .minimumScaleFactor(0.8)

                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(result.isBestValue
                          ? Color.accentColor.opacity(0.06)
                          : Color(.systemBackground))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(result.isBestValue ? Color.accentColor : Color.clear, lineWidth: 2)
            )
            .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)

            if result.isBestValue {
                Text("BEST")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.accentColor,
                                in: RoundedRectangle(cornerRadius: 8))
                    .padding(8)
            }
        }
    }
}

// MARK: - Preview

#Preview {
    ContentView()
}
