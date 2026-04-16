import { getCall } from "../../services/api";

export const fetchCashbackwalletTransactions = async () => {
    try {
        const response = await getCall('/wallet/cashback-wallet/transactions/');
        return response;
    }catch(error){
        console.log('error fetching cashbackwallet transactions:', error)
        throw error;
    }
}