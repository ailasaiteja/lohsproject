import { getCall, postCall } from '../../services/api';

export const fetchUserLuckydraws = async () => {
    try {
        const response = await getCall('/lucky-draws/user/lucky-draws/');
        return response;
    } catch (error) {
        console.log('Error fetching user luckydraws:', error);
        throw error;
    }
};

export const fetchUserPurchaseTickets = async (drawId, ticketCount) => {
    try {
        const response = await postCall(`/lucky-draws/${drawId}/purchase-ticket/`, {
            tickets_requested: ticketCount
        });
        return {
            data: response.data,
            status: response.status,
            success: response.status === 200,
            error: null
        };
    } catch (error) {
        console.log('Error purchasing additional tickets:', error);
        if (error.response && error.response.data) {
            return {
                success: false,
                error: error.response.data,
                status: error.response.status
            };
        }
        throw error;
    }
};

export const fetchLuckydrawDetails = async (drawId) => {
    try {
        const response = await getCall(`/lucky-draws/${drawId}/details/`);
        return response;
    } catch (error) {
        console.log('Error fetching luckydraw details:', error);
        throw error;
    }
};

// fetch the  wallet balance
export const fetchWalletBalance = async () => {
    try {
        const response = await getCall('/wallet/get-mywallet-transactions/');
        return response;
    } catch (error) {
        console.log('Error fetching wallet balance:', error);
        throw error;
    }
};