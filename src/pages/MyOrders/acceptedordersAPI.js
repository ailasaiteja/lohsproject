import { getCall } from "../../services/api";

export const fetchAcceptedOrders = async () => {
    try {
        const response = await getCall("/orders/vendor/accepted/");
        return response;
    } catch (error) {
        console.error("Error fetching accepted orders:", error);
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
