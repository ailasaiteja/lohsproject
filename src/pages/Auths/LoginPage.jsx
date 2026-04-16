// src/pages/Auths/LoginPage.jsx (Updated - Add event dispatch)
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLocation } from "react-router-dom";
import LoadingToast from '../loading/LoadingToast';
import { loginUser } from './loginApi';
import logo from '../../assets/Logos/footerlogo.png';
import { useToast } from '../toast/ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SEO from '../../utils/SEO';
import {
  faPhone,
  faLock,
  faEye,
  faEyeSlash,
  faArrowRight,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';

const Login = () => {
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    phone: '',
    password: '',
    apiError: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();

  const phoneRegex = /^\d{10}$/;

  useEffect(() => {
    localStorage.clear();
    setFormData(prev => ({ ...prev, password: '' }));
    const timer = setTimeout(() => {
      setFormData(prev => ({ ...prev, password: '' }));
    }, 100);
    return () => clearTimeout(timer);

  }, []);

  const validateInputs = () => {
    let valid = true;
    let phoneError = '';
    let passwordError = '';

    if (!formData.phone.trim()) {
      phoneError = 'Phone number is required.';
      valid = false;
    } else if (!phoneRegex.test(formData.phone)) {
      phoneError = 'Please enter a valid 10-digit phone number.';
      valid = false;
    }

    if (!formData.password.trim()) {
      passwordError = 'Password is required.';
      valid = false;
    }

    setErrors({
      phone: phoneError,
      password: passwordError,
      apiError: '',
    });

    if (!valid) {
      // toast.error('Validation Failed', 'Please check your input fields');
    }

    return valid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: '',
      apiError: '',
    }));
  };

  const togglePasswordVisibility = (e) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateInputs()) return;

    setIsLoading(true);
    setErrors({
      phone: '',
      password: '',
      apiError: '',
    });

    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setErrors(prev => ({ ...prev, apiError: 'Request timeout. Please try again.' }));
        toast.error('Login Failed', 'Request timeout. Please try again.');
      }
    }, 10000);

    try {
      console.log('Attempting login with:', { phone: formData.phone });
      const result = await loginUser(formData.phone, formData.password);
      clearTimeout(timeoutId);

      if (result && result.success && result.status === 200) {
        // Store user data
        if (result.data) {
          localStorage.removeItem('guest_mode');
          localStorage.removeItem('guest_cart');

          localStorage.setItem('user_id', result.data.user_id || result.data.id);
          localStorage.setItem('user_type', result.data.user_type || 'customer');
          localStorage.setItem('user_data', JSON.stringify(result.data));
          localStorage.setItem('is_authenticated', 'true');
          localStorage.setItem('isLoggedIn', 'true'); // Important for header

          if (result.data.token || result.data.access) {
            localStorage.setItem('token', result.data.token || result.data.access);
          }
        }

        // IMPORTANT: Dispatch login success event for Layout to update
        window.dispatchEvent(new CustomEvent('user-login-success'));

        // Small delay to ensure state updates
        setTimeout(() => {
          const redirectTo = location.state?.redirectTo;
          const userType = result.data?.user_type || 'customer';
          if (userType === 'vendor') {
            navigate('/dashboard');
          } else {
            navigate(redirectTo || '/home');
          }
        }, 500);
      } else {
        setIsLoading(false);

        const errorMessage = result?.message || 'Invalid phone number or password';

        if (result?.errors) {
          if (result.errors.phone_number) {
            const phoneError = Array.isArray(result.errors.phone_number)
              ? result.errors.phone_number[0]
              : result.errors.phone_number;
            setErrors(prev => ({ ...prev, phone: phoneError }));
          }
          if (result.errors.password) {
            const passwordError = Array.isArray(result.errors.password)
              ? result.errors.password[0]
              : result.errors.password;
            setErrors(prev => ({ ...prev, password: passwordError }));
          }
          if (result.errors.non_field_errors) {
            const generalError = Array.isArray(result.errors.non_field_errors)
              ? result.errors.non_field_errors[0]
              : result.errors.non_field_errors;
            setErrors(prev => ({ ...prev, apiError: generalError }));
          }
          if (result.errors.detail) {
            setErrors(prev => ({ ...prev, apiError: result.errors.detail }));
          }
        } else {
          setErrors(prev => ({ ...prev, apiError: errorMessage }));
        }

        // toast.error('Login Failed', "Invalid phone number or password. Please try again.");
        return;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Unexpected login error:', error);
      const errorMessage = error?.message || 'An unexpected error occurred';
      setErrors(prev => ({ ...prev, apiError: errorMessage }));
      toast.error('Login Failed', errorMessage);
      setIsLoading(false);
    }
  };

  const getPhoneInputStyle = () => {
    if (errors.phone) return { borderColor: '#dc3545' };
    if (formData.phone && formData.phone.length === 10) return { borderColor: '#28a745' };
    return { borderColor: '#dee2e6' };
  };

  const getPasswordInputStyle = () => {
    if (errors.password) return { borderColor: '#dc3545' };
    return { borderColor: '#dee2e6' };
  };

  return (
    <div>
      <SEO
        title="Login to Your Account | Lots of Happy Smiles"
        description="Login to your Lots of Happy Smiles account to access your wallet, orders, cashback, and exclusive rewards. Secure and fast login."
        keywords="login, signin, account login, lots of happy smiles, secure login"
        url="http://app.lotofhappysmiles.com/login"
        author="Lots of Happy Smiles"
      />
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e9eef2 100%)',
        padding: '20px'
      }}>
        <div
          className="card shadow-lg p-4 p-lg-5 border-0 rounded-5 w-100"
          style={{
            maxWidth: '450px',
            margin: 'auto',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            overflow: 'hidden'
          }}
        >
          <div className="text-center mb-4">
            <div className="d-flex justify-content-center mb-3">
              <div
                className="bg-white d-flex align-items-center justify-content-center rounded-circle shadow-sm p-3"
                style={{
                  width: '120px',
                  height: '120px',
                  border: '3px solid #bf1f2f'
                }}
              >
                <img
                  src={logo}
                  alt="Company Logo"
                  className="img-fluid"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>
            <h4 className="fw-bold" style={{ color: '#bf1f2f', fontSize: '28px' }}>Login</h4>
          </div>

          {/* API Error Message - Display as alert for visibility */}
          {errors.apiError && (
            <div className="alert alert-danger d-flex align-items-center mb-4" role="alert" style={{ borderRadius: '10px' }}>
              <FontAwesomeIcon icon={faExclamationCircle} className="me-2" />
              <div>{errors.apiError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="phone" className="form-label fw-semibold mb-2" style={{ color: '#495057' }}>
                <FontAwesomeIcon icon={faPhone} className="me-2" style={{ color: '#bf1f2f' }} />
                Phone Number
              </label>
              <div className="position-relative">
                <span
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  style={{
                    zIndex: 5,
                    fontSize: '1rem',
                    fontWeight: '500',
                    backgroundColor: 'transparent'
                  }}
                >
                  +91
                </span>
                <input
                  type="tel"
                  className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter 10-digit phone number"
                  autoComplete="off"
                  style={{
                    borderRadius: '10px',
                    paddingLeft: '60px',
                    height: '52px',
                    fontSize: '1rem',
                    border: '2px solid',
                    ...getPhoneInputStyle()
                  }}
                />
                {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label fw-semibold mb-2" style={{ color: '#495057' }}>
                <FontAwesomeIcon icon={faLock} className="me-2" style={{ color: '#bf1f2f' }} />
                Password
              </label>
              <div className="position-relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  style={{
                    borderRadius: '10px',
                    height: '52px',
                    paddingRight: '45px',
                    fontSize: '1rem',
                    border: '2px solid',
                    ...getPasswordInputStyle()
                  }}
                />
                <button
                  type="button"
                  className="position-absolute top-50 end-0 translate-middle-y me-2 btn btn-link text-decoration-none p-0"
                  style={{
                    width: '35px',
                    height: '35px',
                    color: '#6c757d',
                    background: 'transparent',
                    border: 'none'
                  }}
                  onClick={togglePasswordVisibility}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
              {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
            </div>

            <div className="d-flex justify-content-end mb-4">
              <Link
                to="/forgot-password"
                className="text-decoration-none small fw-semibold"
                style={{ color: '#bf1f2f' }}
              >
                Forgot Password? <FontAwesomeIcon icon={faArrowRight} size="sm" />
              </Link>
            </div>

            <button
              type="submit"
              className="btn w-100 py-3 fw-bold mb-3 border-0 text-white"
              disabled={isLoading}
              style={{
                background: isLoading ? '#999' : '#bf1f2f',
                borderRadius: '12px',
                height: '52px',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                boxShadow: isLoading ? 'none' : '0 4px 15px rgba(191, 31, 47, 0.3)',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              Login
            </button>
          </form>

          <div className="text-center mt-3">
            <p className="text-muted mb-0">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="fw-semibold text-decoration-none"
                style={{ color: '#bf1f2f' }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Loading Toast */}
      <LoadingToast show={isLoading} />
    </div>
  );
};

export default Login;