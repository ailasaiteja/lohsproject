import { getCall, postCall } from "../../services/api";
 
export const fetchActiveProducts = async () =>{
    try {
        const response = await getCall('/products/active');
        return response;
    } catch (error) {
        console.error('Error fetching active products:', error);
        throw error;
    }
}
 
export const fetchUserAddresses = async () =>{
    try {
        const response = await getCall('/users/addresses/');
        return response;
    } catch (error) {
        console.error('Error fetching user addresses:', error);
        throw error;
    }
};
 
export const createUserAddress = async (addressData) =>{
    try {
        const response = await postCall('/users/addresses/create/', addressData);
        return response;
    } catch (error) {
        console.error('Error fetching user create addresses:', error);
        throw error;
    }
};
 
 
// product purchase form wallets
 
export const fetchProductPurchaseWallets = async (userId) => {
    try {
        const response = await getCall(`/wallet/all-wallets/${userId}/balance`);
        return response;
    } catch (error) {
        console.error('Error fetching product purchase wallets:', error);
        throw error;
    }  
};
 
// product purchase form orders
 
 
// Customer self purchase - POST request
export const ProductPurchaseUser = async (orderData) => {
    try {
        const response = await postCall('/orders/purchase_order/', orderData);
        return response;
    } catch (error) {
        console.error('Error creating product order for user:', error);
        throw error;
    }
};
 
// Agent self purchase - POST request
export const ProductOrderAgentPurchase = async (orderData) => {
    try {
        const response = await postCall('/orders/agent/purchase_order/', orderData);
        return response;
    } catch (error) {
        console.error('Error creating product order for agent:', error);
        throw error;
    }
};
 
// Agent purchasing for customer - GET request with query parameters
export const ProductOrderAgentPurchaseForUser = async (customerId, queryString) => {
    try {
        const response = await getCall(`/orders/agent/${customerId}/orders/?${queryString}`);
        return response;
    } catch (error) {
        console.error('Error creating product order for agent of the user:', error);
        throw error;
    }
};
 