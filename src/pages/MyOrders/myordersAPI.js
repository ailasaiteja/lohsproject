import { getCall } from "../../services/api";

export const myordersApi = {
    fetchMyOrders: async () => {
        try {
            const response = await getCall("/admin/vendor/{vendor_id}/orders/");
            return response;
        } catch (error) {
            console.error("Error fetching my orders:", error);
            throw error;
        }
    },
};


