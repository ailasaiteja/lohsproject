import { getCall } from '../../services/api'

export const fetchUserOrders = async () => {
    try {
        const response = await getCall('/orders/user/orders');
        return response
    }
    catch (error){
        console.log('Error fetching user orders:', error);
        throw error;
    }
};
export const fetchOrderDetails = async (orderId) => {
    try {
        const response = await getCall(`/orders/${orderId}/details`);
        return response
    }
    catch (error){
        console.log('Error fetching order details:', error);
        throw error;
    }
};