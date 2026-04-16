import { getCall, postCall } from "../../services/api";

export const fetchMywalletTransactions = async () => {
    try {
        const response = await getCall('/wallet/get-mywallet-transactions/');
        return response;
    } catch (error) {
        console.log('fetching error mywallet transactions:', error);
        throw error;
    }
}

export const fetchMywalletAddcash = async (data) => {
    try {
        const response = await postCall('/wallet/addCash/', data);
        return {
            data: response.data,
            status: response.status,
            success: response.status === 200
        };
    } catch (error) {
        console.log('fetching error mywallet addcash', error);
        throw error;
    }
}
export const createRazorpayOrder = async (data) => {
    try {
        const response = await postCall('/payments/api/create-order/', data);
        return {
            data: response.data,
            status: response.status,
            success: response.status === 200
        };
    } catch (error) {
        console.log('fetching error mywallet addcash', error);
        throw error;
    }
}
export const withdrawrequest = async (data) => {
    try {
        const response = await postCall('/payments/request-withdraw/', data);
        return {
            data: response.data,
            status: response.status,
            success: response.status === 200
        };
    } catch (error) {
        console.log('fetching error mywallet addcash', error);
        throw error;
    }
}