# Research: New Provider Data (April 2026)

## Research Status Summary

| Provider | Pricing Matrix | Zone Structure | PLZ Mapping | Status |
|----------|---------------|----------------|-------------|--------|
| **Unireso (GE)** | ✅ Complete | ✅ Single zone | ✅ 62 PLZ codes | **DONE** — data files created |
| **OSTWIND (Eastern CH)** | ✅ Complete (from PDF) | ✅ 111 zones, 1–7 + all | 🔲 Needed | **DONE** — pricing complete, PLZ mapping needed |
| **TNW (Basel)** | ⚠️ Partial — U-Abo is all-zones only | ✅ 48 zones | 🔲 Needed | Needs manual price verification |
| **Mobilis (Vaud)** | ✅ Complete (from T651.22 PNGs) | ✅ ~188 zones (from map PDF) | 🔲 Needed | **DONE** — pricing complete, PLZ mapping needed |

**Note:** Most Swiss transport websites were blocked by the network egress proxy. OSTWIND data was successfully extracted from the downloaded tariff flyer PDF. Mobilis zone map was analyzed but it contains no pricing data — the tariff regulation PDF (T651.22) is needed for prices.

---

## 1. Unireso (Geneva) — ✅ READY

### Zone System
- **Single unified zone: Zone 10 ("Tout Genève")**
- Covers entire Canton of Geneva (except municipality of Céligny)
- Includes: TPG buses/trams, local trains (CFF), Mouettes Genevoises (ferry boats)
- No sub-zones or multi-zone options within Geneva
- Cross-border: Léman Pass available for travel into France (separate product)

### Subscription Pricing (valid from 2024-12-15)

| Category | Class | Monthly (CHF) | Annual (CHF) |
|----------|-------|---------------|--------------|
| Adult | 2nd | 75 | 500 |
| Adult | 1st | 119 | 850 |
| Youth (<25) | 2nd | 45 | 400 |
| Youth (<25) | 1st | — (TBD) | — (TBD) |

### Single-Trip Tickets
| Type | Full (CHF) | Reduced (CHF) |
|------|-----------|---------------|
| Zone 10 (60 min) | 3.00 | 2.00 |
| Short trip ("Saut de puce") | 2.00 | 1.80 |
| Day pass | 10.00 | — |

### Special Programs (Geneva subsidies)
- **Under 6:** Free, no pass needed
- **6–17 years:** Free annual pass (Geneva residents)
- **18–24 (in training/low income):** Free annual pass (Geneva residents)
- **AVS/DI beneficiaries:** 50% discount on subscriptions

### Sources
- https://www.unireso.com/
- https://www.tpg.ch/en/ticket-fares
- https://www.unireso.com/titres-de-transport-2025/

---

## 2. TNW — Tarifverbund Nordwestschweiz (Basel) — ⚠️ PARTIAL

### Zone System
- **48 zones** covering the TNW network
- Basel metropolitan area: Zones 10, 11, 13 (EuroAirport), 14, 15
- Covers: Basel-Stadt, Basel-Landschaft, parts of Aargau (Fricktal), Solothurn (Schwarzbubenland), Jura (Ederswiler)
- Cross-border zones: RVL (Germany), DistriBus (France)

### Key Insight: U-Abo is an ALL-ZONES product
Unlike ZVV or OSTWIND, the TNW **U-Abo is NOT zone-tiered**. It covers the **entire TNW network** (all 48 zones). There is no "2-zone" or "3-zone" U-Abo — you either have a U-Abo (all zones) or you don't.

### U-Abo Pricing (valid from ~2025-12-13, 3.4% increase applied)

| Category | Class | Monthly (CHF) | Annual (CHF) |
|----------|-------|---------------|--------------|
| Adult | 2nd | ~86 | ~824 |
| Adult | 1st | TBD | TBD |
| Youth (<25) | 2nd | ~57 | ~542 |
| Youth (<25) Basel-Stadt residents | 2nd | — | 365 |

- **Annual = ~20% cheaper** than 12 × monthly
- **Daily cost:** CHF 2.87/day (monthly) or CHF 2.26/day (annual) for adults

### Single-Trip Tickets (2025)
| Zones | Full (CHF) | Halbtax (CHF) |
|-------|-----------|---------------|
| 1 zone | 4.20 | 2.90 |
| 2 zones | 5.10 | TBD |
| Short distance | — | 2.00 |

### Day Tickets
- Basel city (zones 10,11,13,14,15): ~CHF 9
- Full network (all 48 zones): ~CHF 20.20

### Price Changes
- Dec 2023: +4.4% average
- Dec 2025: +3.4% average

### ⚠️ NEEDS MANUAL VERIFICATION
1. Exact monthly/annual prices (the ~86/~824 figures need confirmation)
2. 1st class pricing
3. Whether zone-specific subscriptions exist (separate from U-Abo)
4. Complete single-trip price table by zone count

### Sources
- https://www.tnw.ch/tickets-preise/abonnemente/das-u-abo
- https://www.u-abo.ch/preissrechner/
- https://www.tnw.ch/assets/images/content/TNW_Tarifinfo_2025_Web.pdf (blocked)

---

## 3. OSTWIND — Tarifverbund Ostwind (Eastern CH) — ⚠️ STRUCTURE ONLY

### Zone System
- **111 zones** across Eastern Switzerland + Liechtenstein
- Subscription tiers: **1 zone, 2 zones, 3 zones, 4 zones, 5 zones, 6 zones, 7 zones, all zones**
- Since Dec 2023: purchasing **8+ zones automatically gives "all zones"** (previously 13)
- Covers: St. Gallen, Thurgau, Appenzell AR, Appenzell IR, Glarus, Schaffhausen, March (SZ), Liechtenstein
- Example: St. Gallen city = Zone 210, Abtwil/Wittenbach = Zone 211

### Subscription Structure
| Tier | Adult 2nd | Adult 1st | Youth 2nd | Youth 1st |
|------|-----------|-----------|-----------|-----------|
| 1 zone | TBD | TBD | TBD | N/A |
| 2 zones | TBD | TBD | TBD | N/A |
| 3 zones | TBD | TBD | TBD | N/A |
| 4 zones | TBD | TBD | TBD | N/A |
| 5 zones | TBD | TBD | TBD | N/A |
| 6 zones | TBD | TBD | TBD | N/A |
| 7 zones | TBD | TBD | TBD | N/A |
| All zones (8+) | TBD | TBD | TBD | N/A |

- **Youth = up to 24.99 years**, 2nd class only
- **Adults = from 25 years**, 2nd or 1st class
- **Annual saves up to 25%** vs. 12 × monthly
- Annual = 12 months for the price of 9

### Day Passes
- 9 AM day pass (all zones): CHF 40 full / CHF 20 with Halbtax or children 6–16
- Minimum day pass extension: CHF 15

### ⚠️ NEEDS MANUAL LOOKUP
The complete pricing matrix is available in:
1. **PDF:** https://www3.postauto.ch/-/media/postauto/reisen-und-services/dokumente/unterlagen-bestellen/tarifverbund-ostwind-tarifinfo-2025-26.pdf
2. **PDF:** https://www.ostwind.ch/assets/resources/Dateien/Tarifflyer/flyer-otv-vvv-2025-druck.pdf
3. **Calculator:** https://www.ostwind.ch/preisrechner
4. **Webshop:** https://shop.ostwind.ch/

### Sources
- https://www.ostwind.ch/billette-abos/abos/monats-und-jahresabos/
- https://www.ostwind.ch/en/customer-service/monthly-and-annual-travelcard/new-travelcard/price-information.html

---

## 4. Mobilis (Vaud) — ⚠️ STRUCTURE ONLY

### Zone System
- **~140 zones** spanning Canton of Vaud
- Zones must be **contiguous** (geographically connected)
- From **12+ zones**, the subscription becomes an **all-zones** ticket (all 140 zones)
- Covers: trains, buses, metro (Lausanne M1/M2), funiculars

### Subscription Types
- **Weekly** (7 days)
- **Monthly** (1 month, can start any day)
- **Annual** (12 months for the price of 9)
- **FlexiAbo**: 100 activation days per year
- **Abonnement Transmissible**: Transferable, price = 1.5 × regular adult
- **Abonnement Modulable**: Flexible

### Subscription Tiers (pricing TBD)
| Tier | Adult 2nd | Adult 1st | Youth 2nd | Youth 1st |
|------|-----------|-----------|-----------|-----------|
| 1–2 zones | TBD | TBD | TBD | TBD |
| 3 zones | TBD | TBD | TBD | TBD |
| 4 zones | TBD | TBD | TBD | TBD |
| 5 zones | TBD | TBD | TBD | TBD |
| 6 zones | TBD | TBD | TBD | TBD |
| 7 zones | TBD | TBD | TBD | TBD |
| 8 zones | TBD | TBD | TBD | TBD |
| 9 zones | TBD | TBD | TBD | TBD |
| 10 zones | TBD | TBD | TBD | TBD |
| 11 zones | TBD | TBD | TBD | TBD |
| All zones (12+) | TBD | TBD | TBD | TBD |

- **Categories:** Child/Youth (<25), Adult, Senior (65+)
- **Classes:** 2nd and 1st

### Partial Pricing Data
- 10-zone monthly (full price): ~CHF 264
- 10-zone annual equivalent: ~CHF 145/month
- Short journey single: CHF 2.30
- 4-zone single (e.g. Yverdon–Orbe): CHF 7.80

### Youth/Senior Discounts (Canton of Vaud program)
- From summer 2025 (youth) / Jan 2026 (seniors):
- **50% discount** on annual subscriptions for Vaud residents
- Youth discount: CHF 247.50 off a 2-zone annual
- Senior discount: CHF 319.50 off a 2-zone annual

### ⚠️ NEEDS MANUAL LOOKUP
1. **Tariff regulation PDF:** https://www.mobilis-vaud.ch/wp-content/uploads/2021/08/T651.22-01.06.2025.pdf
2. **Zone map PDF:** https://www.mobilis-vaud.ch/wp-content/uploads/2021/08/2024-12-15_Plan_Mobilis-General.pdf
3. **Website:** https://www.mobilis-vaud.ch/en/tarifs/

### Sources
- https://www.mobilis-vaud.ch/en/tarifs/
- https://www.mobilis-vaud.ch/en/produits/abonnement-annuel/
- https://www.mobilis-vaud.ch/en/produits/abonnement-mensuel/

---

## Next Steps

### Manual Data Collection Required
Due to network restrictions, the following pricing data must be gathered manually by visiting the provider websites or downloading their PDF tariff documents:

1. **OSTWIND** — Download and extract prices from:
   - `tarifverbund-ostwind-tarifinfo-2025-26.pdf` (PostAuto)
   - Use the price calculator at ostwind.ch/preisrechner
   
2. **TNW** — Verify U-Abo pricing at:
   - `u-abo.ch/preissrechner/`
   - Confirm whether zone-specific subscriptions exist
   
3. **Mobilis** — Download and extract prices from:
   - `T651.22-01.06.2025.pdf` tariff regulation
   - Use the Mobilis website pricing pages

4. **PLZ-to-Zone Mapping** — For all four providers:
   - Cross-reference Swiss PLZ registry with zone maps
   - Download zone plan PDFs from each provider
   - OSTWIND: otv-faltplan-2025.pdf
   - TNW: tnw.ch/fahrplan-liniennetz/zonenplan
   - Mobilis: Plan_Mobilis-General.pdf
   - Unireso: Simple — all Geneva PLZ codes = Zone 10
