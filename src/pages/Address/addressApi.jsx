import { getCall, postCall } from "../../services/api";

// Fetch user addresses
export const fetchUserAddresses = async () => {
    try {
        const response = await getCall('/users/addresses/');
        return response;
    } catch (error) {
        console.error('Error fetching user addresses:', error);
        throw error;
    }
};

// Create new address
export const createUserAddress = async (addressData) => {
    try {
        const response = await postCall('/users/addresses/create/', addressData);
        return response;
    } catch (error) {
        console.error('Error creating address:', error);
        throw error;
    }
};

// Update address
export const updateUserAddress = async (addressId, addressData) => {
    try {
        const response = await postCall(`/users/addresses/${addressId}/update/`, addressData);
        return response;
    } catch (error) {
        console.error('Error updating address:', error);
        throw error;
    }
};
export const fetchStates = async () => {
  try {
    const states = await getCall('/users/states/');
    return Array.isArray(states) ? states : [];
  } catch (err) {
    console.error('Error fetching states:', err);
    return [];
  }
};
export const fetchCities = async (stateId) => {
  try {
    if (!stateId) return [];

    const cities = await getCall(`/users/cities/by-state/?state=${stateId}`);
    return Array.isArray(cities) ? cities : [];
  } catch (error) {
    console.error("Error fetching cities:", error);
    return [];
  }
};