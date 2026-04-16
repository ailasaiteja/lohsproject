import { getCall, postCall } from "../../services/api";

export const fetchActiveLuckyDraws = async () => {
    try {
        const response = await getCall("/lucky-draws/active-luckydraws");
        return response;
    } catch (error) {
        console.error("Error fetching active lucky draws:", error);
        throw error;
    }
};

export const getLuckyDrawDetails = async (id) => {
    try {
        const response = await getCall(`/lucky-draws/${id}/details`);
        return response;
    } catch (error) {
        console.error("Error fetching lucky draw details:", error);
        throw error;
    }   
};

export const purchaseLuckyDrawTicket = async (id, purchaseData) => {  
    try {
        const response = await postCall(`/lucky-draws/${id}/purchase-ticket/`, purchaseData);

        return {
            data: response.data,
            status: response.status,
            success: response.status === 200
        };
    }
    catch (error) {
        console.error("Error purchasing lucky draw ticket:", error);
        throw error;
    }
};