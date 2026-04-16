import { getCall, postCall } from "../../services/api";

export const fetchActiveSchemes = async () => {
    try {
        const response = await getCall('/schemes/active/');
        return response;
    } catch (error) {
        console.error('Error fetching active schemes:', error);
        throw error;
    }
};

// API functions for scheme joining
export const joinSchemeByAgent = async (data) => {
    try {
        const response = await postCall('/schemes/join-by-agent/', data);
        return {
            data: response.data,
            status: response.status,
            success: response.status === 200
        };
    } catch (error) {
        console.error('Error joining scheme by agent:', error);
        throw error;
    }
};

export const joinScheme = async (data) => {
    try {
        const response = await postCall('/schemes/join/', data);
        return {
            data: response.data,
            status: response.status,
            success: response.status === 200
        };
    } catch (error) {
        console.error('Error joining scheme:', error);
        throw error;
    }
};