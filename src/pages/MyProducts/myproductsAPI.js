import { getCall } from "../../services/api";

export const fetchMyProducts = async () => {
    try {
        const response = await getCall("/products/vendor/");
        return response;
    } catch (error) {
        console.error("Error fetching my products:", error);
        throw error;
    }
};