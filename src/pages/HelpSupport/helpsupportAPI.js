import { getCall } from "../../services/api";

export const helpsupportApi = {
    fetchHelpSupport: async () => {
        try {
            const response = await getCall("/users/faqs/");
            return response;
        } catch (error) {
            console.error("Error fetching help support:", error);
            throw error;
        }
    },
};