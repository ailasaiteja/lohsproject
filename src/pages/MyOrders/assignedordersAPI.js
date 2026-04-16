import { getCall } from "../../services/api";

export const fetchAssignedOrders = async () => {
    try {
        const response = await getCall("/orders/vendor/assigned/");
        return response;
    } catch (error) {
        console.error("Error fetching assigned orders:", error);
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
