import { getCall } from "../../services/api";

export const fetchRejectedOrders = async () => {
    try {
        const response = await getCall("/orders/vendor/rejected/");
        return response;
    } catch (error) {
        console.error("Error fetching rejected orders:", error);
        throw error;
    }
};

export const fetchOrderDetails = async (orderId) => {
    try {
        const response = await getCall(`/orders/${orderId}/details/`);
        return response;
    } catch (error) {
        console.error("Error fetching order details:", error);
        throw error;
    }
};