import { getCall } from "../../services/api";

export const getCustomerLottery = async (customerId) => {
  try {
    const response = await getCall(`/lucky-draws/agent-referred-lucky-draws/${customerId}`);
    return response.data;
    } catch (error) {
    console.error("Error fetching customer lottery:", error);
    throw error;
  }
};
