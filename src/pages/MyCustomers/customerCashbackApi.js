// customerCashbackApi.js
import { getCall } from "../../services/api";

export const customerCashbackApi = {
    // Get cashbacks for a specific customer
    getAgentReferredECBs: async (userId) => {
        try {
            console.log('Fetching agent referred ECBs for user:', userId);
            
            if (!userId) {
                console.error('user_id is required');
                return { success: false, ecbs: [] };
            }
            
            // Pass user_id as query parameter
            const response = await getCall(`/earn-cashbacks/agent-referred-ecbs/?user_id=${userId}`);
            console.log('Agent referred ECBs response:', response);
            
            // Return the response directly - it will be {success: true, ecbs: []}
            return response;
        } catch (error) {
            console.error('API Exception in getAgentReferredECBs:', error);
            return { success: false, ecbs: [] };
        }
    }
};