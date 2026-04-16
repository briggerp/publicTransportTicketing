# Implementation Plan: Local Public Transport Provider Integration

## Goal

Allow users to enter their home ZIP code (PLZ) and commute ZIP code, automatically determine which local transport provider(s) cover that stretch, pull the correct subscription prices from an offline data dictionary, and incorporate those prices into the annual cost comparison.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (UI)                        │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │ Home PLZ │  │Commute   │  │ Zone picker (conditional) │  │
│  │ input    │  │PLZ input │  │ only if PLZ has >1 zone   │  │
│  └────┬─────┘  └────┬─────┘  └────────────┬─────────────┘  │
│       │              │                     │                │
│       └──────────────┴─────────────────────┘                │
│                        │                                    │
│               ┌────────▼────────┐                           │
│               │ POST /api/calc  │                           │
│               └────────┬────────┘                           │
└────────────────────────┼────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     BACKEND (Express)                       │
│                                                             │
│  1. plzToZone lookup  ──▶  data/plz-zone-map.json          │
│  2. zone pair → provider  ──▶  data/provider-rules.json    │
│  3. provider + zones → price ──▶  data/provider-prices.json│
│  4. inject local pass price into AboCalculator              │
│  5. return results + provider metadata (name, link)         │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Layer Design

Three static JSON files power the lookup chain. They are maintained offline and updated manually (or via scraper) when prices change (typically once per year in December with the timetable change).

### File 1: `data/plz-zone-map.json`

Maps every Swiss PLZ to one or more fare zones within a provider.

```json
{
  "8001": { "provider": "zvv", "zones": [110] },
  "8002": { "provider": "zvv", "zones": [110] },
  "8600": { "provider": "zvv", "zones": [150] },
  "8610": { "provider": "zvv", "zones": [150, 154] },
  "3001": { "provider": "libero", "zones": [100, 101] },
  "6003": { "provider": "passepartout", "zones": [10] }
}
```

When a PLZ maps to multiple zones (e.g. `8610 → [150, 154]`), the frontend shows a zone picker so the user can disambiguate.

### File 2: `data/provider-prices.json`

Contains the subscription price matrix for each provider, keyed by number of zones traversed, age group, and class.

```json
{
  "zvv": {
    "name": "Zürcher Verkehrsverbund (ZVV)",
    "website": "https://www.zvv.ch/en/travelcards-and-tickets/travelcards/network-pass.html",
    "prices_valid_from": "2024-12-15",
    "subscription_types": {
      "networkpass": {
        "adult": {
          "2nd_class": {
            "local":    { "monthly": 51,  "annual": 474  },
            "1_2_zones": { "monthly": 87,  "annual": 809  },
            "3_zones":   { "monthly": 128, "annual": 1189 },
            "4_zones":   { "monthly": 169, "annual": 1569 },
            "5_zones":   { "monthly": 207, "annual": 1922 },
            "all_zones": { "monthly": 247, "annual": 2295 }
          },
          "1st_class": {
            "local":     { "monthly": 84,  "annual": 781  },
            "1_2_zones": { "monthly": 144, "annual": 1338 },
            "3_zones":   { "monthly": 211, "annual": 1961 },
            "4_zones":   { "monthly": 279, "annual": 2592 },
            "5_zones":   { "monthly": 342, "annual": 3178 },
            "all_zones": { "monthly": 408, "annual": 3791 }
          }
        },
        "youth": {
          "2nd_class": {
            "local":     { "monthly": 37,  "annual": 343  },
            "1_2_zones": { "monthly": 63,  "annual": 586  },
            "3_zones":   { "monthly": 93,  "annual": 861  },
            "4_zones":   { "monthly": 123, "annual": 1138 },
            "5_zones":   { "monthly": 150, "annual": 1393 },
            "all_zones": { "monthly": 179, "annual": 1663 }
          }
        }
      }
    }
  }
}
```

### File 3: `data/zone-adjacency.json` (ZVV-specific)

Maps the shortest zone path between any two ZVV zones. This determines how many zones a commute traverses, which determines the subscription tier.

```json
{
  "zvv": {
    "zone_distances": {
      "110-110": 1,
      "110-150": 2,
      "110-121": 3,
      "150-154": 2
    },
    "tier_mapping": {
      "1": "local",
      "2": "1_2_zones",
      "3": "3_zones",
      "4": "4_zones",
      "5": "5_zones",
      "6": "all_zones"
    }
  }
}
```

---

## Implementation Phases

### Phase 1: ZVV Only (MVP)

Start with ZVV because prices are already hardcoded in the app and it's the largest network. This phase proves the architecture before scaling to other providers.

#### Step 1.1 — Build the PLZ-to-zone data for ZVV

**Task:** Create `data/plz-zone-map.json` with all ~200 PLZ codes in the ZVV area.

**Data source:** The ZVV zone map PDF and the official Swiss PLZ directory from opendata.swiss. Cross-reference manually or use the ZVV zone map interactive tool at zvv.ch.

**Approach:**
1. Download the ZVV regional network PDF maps from zvv.ch
2. Use the Swiss official PLZ-Gemeinde registry from opendata.swiss (Amtliches Ortschaftenverzeichnis) to get every PLZ in canton Zurich plus the border areas
3. Map each PLZ to its ZVV fare zone(s) using the zone map
4. Flag PLZ codes that span two zones (border cases)

**Estimated effort:** 3–4 hours of data entry + verification.

#### Step 1.2 — Build the ZVV price dictionary

**Task:** Create `data/provider-prices.json` with the full ZVV NetworkPass price matrix.

**Data source:** The official ZVV price PDF (valid from 15.12.2024): `https://www.zvv.ch/content/dam/zvv/publikationen/info/tickets/tickets-und-preise-en.pdf`

This is already partially researched. The adult 2nd-class annual prices are:

| Zones | Monthly (CHF) | Annual (CHF) |
|-------|--------------|--------------|
| Local (1 zone, e.g. Zone 110) | 51 | 474 |
| 1–2 zones | 87 | 809 |
| 3 zones | 128 | 1,189 |
| 4 zones | 169 | 1,569 |
| 5 zones | 207 | 1,922 |
| All zones | 247 | 2,295 |

Youth (under 25) 2nd-class annual prices:

| Zones | Monthly (CHF) | Annual (CHF) |
|-------|--------------|--------------|
| Local | 37 | 343 |
| 1–2 zones | 63 | 586 |
| 3 zones | 93 | 861 |
| 4 zones | 123 | 1,138 |
| 5 zones | 150 | 1,393 |
| All zones | 179 | 1,663 |

#### Step 1.3 — Build the zone-distance lookup for ZVV

**Task:** Create `data/zone-adjacency.json` for the 45 ZVV zones.

**Approach:** Model the ZVV zone graph as an adjacency list (which zones border which). Then use BFS to compute shortest path between any two zones. The "number of zones traversed" determines the subscription tier.

This can be pre-computed into a simple distance matrix so the runtime lookup is O(1).

#### Step 1.4 — Backend: New lookup service

**New file:** `services/localTransportLookup.js`

```javascript
/**
 * Resolves PLZ pair → provider, zone count, subscription price
 */
class LocalTransportLookup {
  constructor() {
    this.plzMap = require('../data/plz-zone-map.json');
    this.prices = require('../data/provider-prices.json');
    this.adjacency = require('../data/zone-adjacency.json');
  }

  /** Returns zone options for a given PLZ */
  getZonesForPlz(plz) {
    const entry = this.plzMap[plz];
    if (!entry) return null;
    return { provider: entry.provider, zones: entry.zones };
  }

  /** Given home zone, commute zone, and provider → subscription tier + price */
  getSubscriptionPrice(provider, homeZone, commuteZone, ageGroup, travelClass = '2nd_class') {
    const providerAdj = this.adjacency[provider];
    const key = [homeZone, commuteZone].sort().join('-');
    const distance = providerAdj.zone_distances[key] || 1;
    const tier = providerAdj.tier_mapping[String(distance)]
                 || providerAdj.tier_mapping[String(Math.min(distance, 6))];

    const providerPrices = this.prices[provider];
    const tierPrices = providerPrices.subscription_types.networkpass[ageGroup][travelClass][tier];

    return {
      provider: providerPrices.name,
      website: providerPrices.website,
      tier,
      zonesTraversed: distance,
      monthly: tierPrices.monthly,
      annual: tierPrices.annual,
      pricesValidFrom: providerPrices.prices_valid_from
    };
  }
}
```

#### Step 1.5 — Backend: New API endpoints

Add to `server.js`:

```javascript
// GET /api/zones?plz=8001
// Returns: { provider: "zvv", zones: [110], providerName: "ZVV" }
// If multiple zones: { provider: "zvv", zones: [150, 154], providerName: "ZVV" }

// POST /api/subscription-price
// Body: { homePlz, homeZone, commutePlz, commuteZone, ageGroup }
// Returns: { provider, website, tier, monthly, annual, zonesTraversed }
```

The existing `POST /api/calculate` is then extended: it receives the resolved local pass price and uses it instead of the hardcoded `zvv_tram` value.

#### Step 1.6 — Frontend: Location inputs + dynamic price

Add new UI section **above** the existing "Enter Your Travel Patterns":

```
┌─────────────────────────────────────────────────┐
│         Where Do You Live & Commute?            │
│                                                 │
│  Home PLZ:     [8001    ]  → Zone 110 (Zürich)  │
│  Commute PLZ:  [8600    ]  → Zone 150 (Uster)   │
│                                                 │
│  (if ambiguous:)                                │
│  Your home zone: [150 ▼] [154 ▼]               │
│                                                 │
│  ✓ ZVV NetworkPass (1-2 zones)                  │
│    Annual: 809 CHF | Monthly: 87 CHF            │
│    Source: zvv.ch ↗                             │
└─────────────────────────────────────────────────┘
```

**Behavior:**
1. User types home PLZ → frontend calls `GET /api/zones?plz=8001`
2. If single zone → auto-select. If multiple → show zone dropdown.
3. User types commute PLZ → same logic.
4. Once both zones are resolved → frontend calls `POST /api/subscription-price`
5. The returned price auto-fills the "Yearly local transport pass" field in the price customization section.
6. A provider badge + source link is displayed.
7. User can still manually override the price if desired.

#### Step 1.7 — Frontend: Results section update

The results table and recommendation already work. The only changes needed:

1. Show which provider/zones were used in the results header
2. Add a "Source" link next to the local pass price row
3. Display the provider name in the option labels (e.g. "ZVV NetworkPass + HT Plus 1000" instead of "Tram Abo + HT Plus 1000")

---

### Phase 2: Generalize to All Providers

Once ZVV works end-to-end, extend to other providers by adding their data to the same three JSON files.

#### Step 2.1 — Priority order for additional providers

Based on population coverage:

| Priority | Provider | Cantons | Why |
|----------|----------|---------|-----|
| 1 | ZVV | ZH | Done in Phase 1 |
| 2 | Libero | BE, SO | Second-largest city (Bern) |
| 3 | TNW | BS, BL | Third-largest metro (Basel) |
| 4 | Mobilis | VD | Lausanne metro |
| 5 | Unireso | GE | Geneva (single zone — simplest) |
| 6 | Passepartout | LU, OW, NW | Central Switzerland |
| 7 | OSTWIND | SG, TG, AR, AI, GL, SH | Largest by area |
| 8 | Arcobaleno | TI | Italian-speaking Switzerland |
| 9 | All remaining | various | Long tail |

#### Step 2.2 — Handle cross-provider commutes

If `homePlz` resolves to provider A and `commutePlz` to provider B, the user needs a national product (GA, Halbtax, Streckenabo) rather than a local pass. The app should detect this and:

1. Show a message: "Your commute crosses provider boundaries (ZVV → Libero). A local pass won't cover this stretch."
2. Suggest the GA or Halbtax + point-to-point tickets as alternatives
3. Optionally show both local passes (home + destination) for users who also travel locally at each end

#### Step 2.3 — Handle cantons without Tarifverbund

For Uri and Valais, the app should explain there is no formal zone-based subscription and link to the relevant alternative (UriTicket or PASS 13*).

---

### Phase 3: Data Maintenance Strategy

#### Annual price updates

Swiss public transport prices change once per year (December timetable change). The workflow:

1. Each provider publishes new prices in autumn
2. Update `data/provider-prices.json` with new values
3. Update `prices_valid_from` field
4. Deploy

This is a manual process. A future enhancement could scrape provider websites, but the annual cadence makes manual updates feasible.

#### PLZ data updates

Swiss PLZ codes rarely change. The opendata.swiss registry can be re-downloaded periodically. New PLZ codes (from new developments) should be added to `data/plz-zone-map.json`.

---

## File Changes Summary

```
publicTransportTicketing/
├── data/                              ← NEW DIRECTORY
│   ├── plz-zone-map.json            ← PLZ → provider + zone(s)
│   ├── provider-prices.json          ← subscription price matrices
│   └── zone-adjacency.json           ← zone graph for distance calc
├── services/
│   ├── sbbCalculator.js              ← MODIFY: accept dynamic local pass price
│   └── localTransportLookup.js       ← NEW: PLZ/zone/price resolution
├── server.js                          ← MODIFY: add 2 new API endpoints
├── public/
│   ├── index.html                    ← MODIFY: add PLZ input section
│   ├── app.js                        ← MODIFY: PLZ lookup logic + auto-fill
│   └── style.css                     ← MODIFY: style new inputs
```

---

## Recommended First Step

Start with **Step 1.2** (build the ZVV price dictionary) since the price data is already confirmed from research. Then do **Step 1.1** (PLZ-to-zone mapping), which is the most labor-intensive data entry step. The code changes in steps 1.4–1.7 are straightforward once the data layer is solid.

The riskiest part is building a correct PLZ-to-zone mapping. Consider scraping the ZVV zone lookup tool (enter a station name → get zone number) and cross-referencing with the Swiss PLZ registry, rather than purely manual mapping from the PDF zone map.
