import { getCall, postCall } from '../../services/api'

// Fetch all user schemes
export const fetchUserSchemes = async () => {
    try {
        const response = await getCall('/schemes/user-schemes/');
        console.log('API Response from fetchUserSchemes:', response);
        return response;
    }
    catch (error) {
        console.error('Error fetching user schemes:', error);
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch user schemes');
    }
};

// Make a part payment
export const makePartPayment = async (paymentData) => {
    try {
        console.log('Sending payment data to /schemes/part-payment/:', paymentData);
        const response = await postCall('/schemes/part-payment/', paymentData);
        
        // Log the full response structure
        console.log('Payment API full response:', response);
        console.log('Response data:', response.data);
        
        // The response might be nested under .data
        // Return the actual data part if it exists
        if (response && response.data) {
            console.log('Returning response.data');
            return response.data;
        }
        
        console.log('Returning response directly');
        return response;
    }
    catch (error) {
        console.error('Error making part payment:', error);
        console.error('Error response full:', error.response);
        console.error('Error response data:', error.response?.data);
        
        // If the API returns an error with a message, throw it
        if (error.response?.data) {
            if (error.response.data.error) {
                throw new Error(error.response.data.error);
            }
            if (error.response.data.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error(JSON.stringify(error.response.data));
        }
        throw error;
    }
};