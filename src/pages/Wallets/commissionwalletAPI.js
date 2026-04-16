import { getCall } from "../../services/api";

export const fetchCommissionWallet = async () => {
    try {
        const response = await getCall("/incentives/incentives/my-incentives/");
        return response;
    } catch (error) {
        console.error("Error fetching commission wallet:", error);
        throw error;
    }

    
};