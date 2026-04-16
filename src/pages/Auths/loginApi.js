// src/pages/Auths/loginApi.js (Updated)
import { postCall } from '../../services/api';

export const loginUser = async (phone, password) => {
  try {
    const response = await postCall('/users/auth/user-login/', {
      phone_number: phone,
      password: password,
    });

    console.log('Login response:', response);
    console.log('Response status:', response.status);

    // Extract data from response
    const responseData = response.data || response;
    
    // Store tokens if they exist in the response
    if (responseData.access) {
      localStorage.setItem('token', responseData.access);
    }
    if (responseData.refresh) {
      localStorage.setItem('refresh_token', responseData.refresh);
    }

    // Store user data
    const userData = responseData.user || responseData;
    
    return {
      success: true,
      status: response.status,
      data: {
        user_id: userData.id || userData.user_id,
        user_type: userData.user_type || 'customer',
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone_number: userData.phone_number || phone,
        ...userData
      },
      // message: 'Login successful'
    };
  } catch (error) {
    console.error('Login API error:', error);

    let errorMessage = 'Invalid login credentials';
    let errorData = { non_field_errors: [errorMessage] };

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401 || status === 400) {
        if (data.detail) {
          errorMessage = data.detail;
          errorData = { non_field_errors: [data.detail] };
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors)
            ? data.non_field_errors[0]
            : data.non_field_errors;
          errorData = data;
        } else if (data.message) {
          errorMessage = data.message;
          errorData = { non_field_errors: [data.message] };
        } else if (data.errors) {
          errorData = data.errors;
          const firstErrorKey = Object.keys(data.errors)[0];
          if (firstErrorKey) {
            const firstError = data.errors[firstErrorKey];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          }
        }
      } else if (status === 403) {
        errorMessage = 'Your account has been locked. Please contact support.';
        errorData = { non_field_errors: [errorMessage] };
      } else if (status === 404) {
        errorMessage = 'User not found with this phone number';
        errorData = { phone_number: [errorMessage] };
      } else {
        errorMessage = 'Server error. Please try again later.';
        errorData = { non_field_errors: [errorMessage] };
      }
    } else if (error.request) {
      errorMessage = 'No response from server. Please check your internet connection.';
      errorData = { non_field_errors: [errorMessage] };
    }

    return {
      success: false,
      message: errorMessage,
      errors: errorData,
      status: error.response?.status
    };
  }
};

export default loginUser;