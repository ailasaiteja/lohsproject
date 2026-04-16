import { postCall, getCall } from '../../services/api';

/**
 * Signup for users (customer / agent)
 */
const signupUser = async (data) => {
  try {
    const response = await postCall('/users/users/register/', data);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error?.response?.status,
      message:
        error?.response?.data?.message ||   // backend message
        error?.response?.data?.error || 
        'Signup failed',
      errors: error?.response?.data || {}   // full backend response
    };
  }
};

/**
 * Signup for vendors
 */
export const signupVendor = async (data) => {
  try {
    const response = await postCall('/users/vendors/register/', data);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error?.response?.status || 400,
      message: error?.message || 'Vendor signup failed',
      errors: error?.errors || {}
    };
  }
};

/**
 * Fetch states
 */
export const fetchStates = async () => {
  try {
    const states = await getCall('/users/states/');
    return Array.isArray(states) ? states : [];
  } catch (error) {
    console.error("Error fetching states:", error);
    return [];
  }
};

/**
 * Fetch cities by state
 */
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

export default signupUser;