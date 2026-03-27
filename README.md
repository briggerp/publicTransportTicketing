# SBB Ticket Calculator

A web application that helps you find the best Swiss public transportation ticket package based on your usage patterns. Compare costs between different ticket options including Tram Abo, HT Plus cards, and GA (General Abonnement).

## Features

- Calculate optimal ticket based on your travel frequency
- Compare all available ticket options side-by-side
- Support for both youth (under 25) and adult pricing
- Modern, responsive web interface
- Real-time calculations

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the Application

Start the development server:
```bash
npm run dev
```

Or start the production server:
```bash
npm start
```

The application will be available at `http://localhost:3001`

## How to Use

1. Open your browser and navigate to `http://localhost:3001`
2. Select your age group (Youth or Adult)
3. Enter your average tram trips per week
4. Enter your average train trips per month
5. Click "Calculate Best Option"
6. View your personalized recommendation and comparison table

## Ticket Options Explained

- **Tram Abo + HT Plus**: Yearly tram subscription (zones 1-2) combined with a train discount card and bonus credit
- **HT Plus**: Discount card with bonus credit for both tram and train trips
- **GA (General Abonnement)**: Unlimited travel on all Swiss public transportation

## API Endpoints

### POST `/api/calculate`
Calculate the best ticket option based on usage patterns.

Request body:
```json
{
  "tramTrips": 5,
  "trainTrips": 4,
  "youth": true
}
```

Response:
```json
{
  "tramTrips": 5,
  "trainTrips": 4,
  "youth": true,
  "results": {
    "Tram Abo + HT Plus 1000": [1386, 400],
    "...": "..."
  },
  "recommendation": {
    "option": "Tram Abo + HT Plus 1000",
    "cost": 1386,
    "bonusLeft": 400
  }
}
```

### GET `/api/health`
Health check endpoint.

## Project Structure

```
publicTransportTicketing/
├── server.js              # Express server
├── services/
│   └── sbbCalculator.js   # Ticket calculation logic
├── public/
│   ├── index.html         # Main HTML page
│   ├── style.css          # Styles
│   └── app.js             # Frontend JavaScript
├── SBB.py                 # Original Python implementation
├── SBB_Jupyter_Notebook.ipynb  # Jupyter notebook
└── package.json           # Node.js dependencies
```

## Original Python Implementation

The original calculations are available in `SBB.py` and `SBB_Jupyter_Notebook.ipynb` for reference.
