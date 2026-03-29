// DOM Elements
const calculateBtn = document.getElementById('calculate-btn');
const ageGroupSelect = document.getElementById('age-group');
const tramTripsInput = document.getElementById('tram-trips');
const trainTripsInput = document.getElementById('train-trips');

// Price input elements
const tramTripPriceInput = document.getElementById('tram-trip-price');
const trainTripPriceInput = document.getElementById('train-trip-price');
const zvvTramInput = document.getElementById('zvv-tram');
const zvvMonthInput = document.getElementById('zvv-month');
const htPlus1000CostInput = document.getElementById('ht-plus-1000-cost');
const htPlus2000CostInput = document.getElementById('ht-plus-2000-cost');
const htPlus3000CostInput = document.getElementById('ht-plus-3000-cost');
const gaCostInput = document.getElementById('ga-cost');

// Default prices by age group
const DEFAULTS = {
    youth: { tramTripPrice: 3.20, trainTripPrice: 20, zvvTram: 586, zvvMonth: 63, htPlus1000Cost: 600, htPlus2000Cost: 1125, htPlus3000Cost: 1575, gaCost: 2780 },
    adult: { tramTripPrice: 3.20, trainTripPrice: 20, zvvTram: 809, zvvMonth: 87, htPlus1000Cost: 800, htPlus2000Cost: 1500, htPlus3000Cost: 2100, gaCost: 3995 }
};

function applyDefaults(group) {
    const d = DEFAULTS[group];
    tramTripPriceInput.value = d.tramTripPrice;
    trainTripPriceInput.value = d.trainTripPrice;
    zvvTramInput.value = d.zvvTram;
    zvvMonthInput.value = d.zvvMonth;
    htPlus1000CostInput.value = d.htPlus1000Cost;
    htPlus2000CostInput.value = d.htPlus2000Cost;
    htPlus3000CostInput.value = d.htPlus3000Cost;
    gaCostInput.value = d.gaCost;
}

// Update price defaults when age group changes
ageGroupSelect.addEventListener('change', () => applyDefaults(ageGroupSelect.value));

const resultsSection = document.getElementById('results-section');
const loadingSection = document.getElementById('loading');
const errorSection = document.getElementById('error');
const errorMessage = document.getElementById('error-message');

const bestOption = document.getElementById('best-option');
const bestCost = document.getElementById('best-cost');
const bestBonus = document.getElementById('best-bonus');
const resultsTbody = document.getElementById('results-tbody');

// Event Listeners
calculateBtn.addEventListener('click', calculateTicket);

// Allow Enter key to trigger calculation
tramTripsInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') calculateTicket();
});

trainTripsInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') calculateTicket();
});

async function calculateTicket() {
    // Hide previous results and errors
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
    loadingSection.style.display = 'block';

    // Get input values
    const tramTrips = parseInt(tramTripsInput.value);
    const trainTrips = parseInt(trainTripsInput.value);
    const youth = ageGroupSelect.value === 'youth';

    const prices = {
        tramTripPrice: parseFloat(tramTripPriceInput.value),
        trainTripPrice: parseFloat(trainTripPriceInput.value),
        zvvTram: parseFloat(zvvTramInput.value),
        zvvMonth: parseFloat(zvvMonthInput.value),
        htPlus1000Cost: parseFloat(htPlus1000CostInput.value),
        htPlus2000Cost: parseFloat(htPlus2000CostInput.value),
        htPlus3000Cost: parseFloat(htPlus3000CostInput.value),
        gaCost: parseFloat(gaCostInput.value),
    };

    // Validate inputs
    if (isNaN(tramTrips) || isNaN(trainTrips) || tramTrips < 0 || trainTrips < 0) {
        showError('Please enter valid non-negative numbers for trip counts.');
        return;
    }

    try {
        // Call API
        const response = await fetch('/api/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tramTrips,
                trainTrips,
                youth,
                prices
            })
        });

        console.log('Server response status:', response.status);
        const responseText = await response.text();
        console.log('Raw server response:', responseText);

        if (!response.ok) {
            throw new Error(`Server error: ${responseText}`);
        }

        let data;
        try {
            data = JSON.parse(responseText);
            console.log('Parsed response data:', data);
        } catch (e) {
            console.error('JSON parse error:', e);
            throw new Error('Invalid JSON response from server');
        }

        if (!data || !data.recommendation || typeof data.recommendation.cost !== 'number') {
            console.error('Invalid data structure:', data);
            throw new Error('Invalid response format from server');
        }

        // Display results
        displayResults(data);

    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'An error occurred while calculating. Please try again.');
    } finally {
        loadingSection.style.display = 'none';
    }
}

function displayResults(data) {
    console.log('Displaying results:', data);
    
    if (!data || !data.recommendation) {
        showError('Invalid response from server: missing recommendation');
        return;
    }

    // Display recommendation
    const { option = 'N/A', cost = 0, bonusLeft = 0 } = data.recommendation;
    console.log('Recommendation values:', { option, cost, bonusLeft });

    bestOption.textContent = option;
    bestCost.textContent = cost === null ? 'N/A' : 
                          typeof cost === 'number' ? cost.toLocaleString() : 'Invalid';

    // Handle infinity bonus (GA option)
    bestBonus.textContent = bonusLeft === Infinity ? 'Unlimited' :
                           bonusLeft === null ? 'N/A' :
                           typeof bonusLeft === 'number' ? bonusLeft.toLocaleString() : 'Invalid';

    // Clear previous table results
    resultsTbody.innerHTML = '';

    // Sort results by cost if results exist
    const sortedResults = data.results ? Object.entries(data.results).sort((a, b) => {
        const [costA = 0] = a[1] || [];
        const [costB = 0] = b[1] || [];
        return costA - costB;
    }) : [];

    // Populate table
    sortedResults.forEach(([optionName, [cost, bonus]]) => {
        const row = document.createElement('tr');

        // Highlight the best option
        if (optionName === data.recommendation.option) {
            row.classList.add('best-option');
        }

        const nameCell = document.createElement('td');
        nameCell.textContent = optionName;

        const costCell = document.createElement('td');
        costCell.textContent = (typeof cost === 'number' ? cost.toLocaleString() : 'N/A') + ' CHF';

        const bonusCell = document.createElement('td');
        bonusCell.textContent = bonus === Infinity ? 'Unlimited' : (typeof bonus === 'number' ? bonus.toLocaleString() : 'N/A') + ' CHF';

        row.appendChild(nameCell);
        row.appendChild(costCell);
        row.appendChild(bonusCell);

        resultsTbody.appendChild(row);
    });

    // Show results section
    resultsSection.style.display = 'block';

    // Smooth scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showError(message) {
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    loadingSection.style.display = 'none';
}

// Initialize - check if server is running
async function checkServerHealth() {
    try {
        const response = await fetch('/api/health');
        if (!response.ok) {
            console.warn('Server health check failed');
        }
    } catch (error) {
        console.warn('Could not connect to server:', error);
    }
}

// Run health check on page load
checkServerHealth();
