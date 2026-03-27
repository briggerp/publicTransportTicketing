const axios = require('axios');

class SBBApiClient {
    constructor() {
        this.baseUrl = 'https://b2p-int.api.sbb.ch';
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    async authenticate() {
        if (!process.env.SBB_CLIENT_ID || !process.env.SBB_CLIENT_SECRET) {
            throw new Error('SBB API credentials not configured. Please set SBB_CLIENT_ID and SBB_CLIENT_SECRET environment variables.');
        }

        try {
            const response = await axios.post('https://b2p-int.api.sbb.ch/auth', {
                grant_type: 'client_credentials',
                client_id: process.env.SBB_CLIENT_ID,
                client_secret: process.env.SBB_CLIENT_SECRET
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
            
            return this.accessToken;
        } catch (error) {
            console.error('SBB API Authentication failed:', error.message);
            throw new Error('Failed to authenticate with SBB API');
        }
    }

    async getAccessToken() {
        if (!this.accessToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
            await this.authenticate();
        }
        return this.accessToken;
    }

    async getPrices() {
        try {
            const token = await this.getAccessToken();
            
            // Example request for Zurich HB to Bern route
            // This should be adapted based on your specific needs
            const response = await axios.post(`${this.baseUrl}/v3/trips/by-origin-destination`, {
                "originId": "8503000", // Zurich HB
                "destinationId": "8507000", // Bern
                "date": new Date().toISOString().split('T')[0],
                "time": "10:00",
                "passengers": [{
                    "id": "p1",
                    "age": 25,
                    "reductionCards": []
                }]
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            // Process and extract relevant pricing information
            const prices = this.extractPrices(response.data);
            return prices;

        } catch (error) {
            console.error('Failed to fetch SBB prices:', error.message);
            throw new Error('Failed to fetch current SBB prices');
        }
    }

    extractPrices(data) {
        // Process API response to extract relevant prices
        // This needs to be customized based on the specific price data needed
        const prices = {
            youth: {
                zvv_tram: null,
                zvv_month: null,
                HT_plus_1000: null,
                HT_plus_2000: null,
                HT_plus_3000: null,
                GA: null,
                HT: null,
                GA_Night: null
            },
            adult: {
                zvv_tram: null,
                zvv_month: null,
                HT_plus_1000: null,
                HT_plus_2000: null,
                HT_plus_3000: null,
                GA: null,
                HT: null
            }
        };

        // Extract and map prices from API response
        // This is a placeholder - actual implementation will depend on API response structure
        
        return prices;
    }
}

module.exports = new SBBApiClient();
