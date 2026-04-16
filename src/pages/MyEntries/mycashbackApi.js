import { getCall,postCallMultipart } from '../../services/api'

export const fetchUserCashbacks = async () => {
    try {
        const response = await getCall('/earn-cashbacks/user/earncashbacks/');
        return response
    }
    catch (error){
        console.log('Error fetching user cashbacks:', error);
        throw error;
    }
};
export const getCashbackDetails = async (id) => {
    try {
        const response = await getCall(`/earn-cashbacks/${id}/details`);
        return response;
    } catch (error) {
        console.error('Error fetching cashback details:', error);
        throw error;
    }
};
export const purchaseCashback = async (id, payload) => {
    try {
        const response = await postCallMultipart(`/earn-cashbacks/${id}/purchase/`, payload);
        return response;
    }
    catch (error) {
        console.error('Error purchasing cashback:', error);
        throw error;
    }
};
export const fetchWalletBalance = async () => {
    try {
        const response = await getCall('/wallet/get-mywallet-transactions/');
        return response;
    } catch (error) {
        console.log('Error fetching wallet balance:', error);
        throw error;
    }
};