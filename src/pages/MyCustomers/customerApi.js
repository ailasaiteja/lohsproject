// customerApi.js
import { getCall } from "../../services/api";

export const customerApi = {
    getCustomers: async (agentId) => {
        try {   
            const response = await getCall(`/users/users/under-agent/`);
            console.log('API Response:', response);
            
            // Since your API returns the array directly
            if (Array.isArray(response)) {
                console.log('✅ Success: Received array with', response.length, 'customers');
                return response;
            }
            // If response has data property that's an array
            else if (response && response.data && Array.isArray(response.data)) {
                console.log('✅ Success: Received data array with', response.data.length, 'customers');
                return response.data;
            }
            // If response is wrapped in a results property
            else if (response && response.results && Array.isArray(response.results)) {
                console.log('✅ Success: Received results array with', response.results.length, 'customers');
                return response.results;
            }
            else {
                console.error('❌ Unexpected response format:', response);
                return [];
            }   
        } catch (error) {
            console.error('API Exception:', error);
            return [];
        }
    }
};