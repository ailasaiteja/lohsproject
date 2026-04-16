import { postCall, putCall, getCall } from "../../services/api";

export const updateProfile = async (userId, profileData) => {
  const response = await putCall('/users/users/update/', profileData);
  return response;
};
export const postProfileImage = async (userId, imageData) => {
  const response = await postCall('/users/users/upload_profile_pic/', imageData);
  return {
    data: response.data,
    status: response.status,
    success: response.status === 200
  };
};
/**
 * Fetch list of states
 */
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