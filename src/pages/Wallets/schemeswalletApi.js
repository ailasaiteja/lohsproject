import { getCall }  from "../../services/api";

export const fetchSchemewalletTransactions = async () => {
    try {
        const response = await getCall('/wallet/scheme-wallet/transactions/');
        return response;
    } catch (error){
        console.log('error fetching on schemewallet transactions:', error)
        throw error;
    }
}