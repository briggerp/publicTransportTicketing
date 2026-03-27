# SBB Ticket Calculator AI Instructions

## Project Overview
This is a web application that helps users find the optimal Swiss public transportation ticket package based on their usage patterns. It calculates costs for various ticket combinations (tram passes, train passes, and general abonnements) based on frequency of use and age group.

## Architecture & Components

### Core Components
- Python ticket calculator (`SBB.py`)
  - Defines pricing logic and calculations for different ticket combinations
  - Contains `AboCalculator` class that handles all cost calculations
  - Supports youth (<25) and adult pricing tiers

- Node.js Server (`server.js`, `services/sbbCalculator.js`)
  - Express server providing calculation API endpoints
  - JavaScript port of the Python calculator logic
  - RESTful API endpoint at `/api/calculate`
  - Health check endpoint at `/api/health`

- Frontend (`public/`)
  - Single page web interface
  - Interactive form for inputting travel patterns
  - Displays results with recommendations and comparisons

### Key Data Flows
1. User inputs age group, tram trips/week, train trips/month
2. Frontend sends POST to `/api/calculate`
3. Server calculates all options using `AboCalculator`
4. Results returned with costs and bonus amounts
5. Frontend displays recommendation and comparison table

## Critical Patterns & Conventions

### Ticket Option Calculations
- All cost calculations include both money spent AND bonus left
- Bonus calculations handle three cases:
  ```javascript
  if (tripCost > totalBonus) {
    // Over bonus limit - pay difference
  } else if (tripCost < baseCost) {
    // Under base cost - pay actual trip cost
  } else {
    // In between - pay base cost, keep remaining bonus
  }
  ```

### Price Constants
Located in both `SBB.py` and `sbbCalculator.js`:
- Youth vs adult pricing tiers
- Base ticket costs (tram, train, GA)
- HT Plus variants (1000/2000/3000) with [cost, bonus] arrays

### API Response Format
```javascript
{
  tramTrips: number,
  trainTrips: number, 
  youth: boolean,
  results: {
    [optionName: string]: [cost: number, bonus: number]
  },
  recommendation: {
    option: string,
    cost: number,
    bonusLeft: number
  }
}
```

## Development Workflows

### Running the Application
1. Start Node server: `node server.js`
2. Access web interface: http://localhost:3001

### Making Changes
- Calculator logic must be kept in sync between `SBB.py` and `sbbCalculator.js`
- New ticket options require updates to:
  1. Price constants in both calculators
  2. Calculation methods in both calculators
  3. Frontend display logic for new option

### Error Handling
- All numeric inputs must be validated as non-negative
- Cost calculations should handle edge cases (zero trips, exceeding bonus)
- Frontend should gracefully handle API errors
- Special case: GA ticket has infinite bonus value

## Integration Points
- SBB/ZVV pricing (documented in code comments)
- Browser localStorage for persisting inputs
- Server health monitoring via `/api/health`
