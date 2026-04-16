import { getCall } from "../../services/api";

export const getWithdrawalHistory = async (params = {}) => {
    try {
        const response = await getCall("/payments/my-withdrawals/", params);
        if (response && response.data) {
            return response.data;
        }
        return response;
    } catch (error) {
        console.error("Error fetching withdrawal history:", error);
        throw error;
    }
};