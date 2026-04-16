import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye,
  faEyeSlash,
  faUser,
  faEnvelope,
  faPhone,
  faVenusMars,
  faCalendar,
  faMapMarkerAlt,
  faCity,
  faLock,
  faCheckCircle,
  faBuilding,
  faMapMarker,
  faIdCard,
  faStore
} from '@fortawesome/free-solid-svg-icons';
import signupUser, { fetchStates, fetchCities } from './signupApi';
import 'bootstrap/dist/css/bootstrap.min.css';
import LoadingToast from '../loading/LoadingToast';
import { useToast } from '../toast/ToastContext';

const SignupPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const isSubmitting = useRef(false);
  const hasFetchedStates = useRef(false);
  const submitCount = useRef(0);

  const [formData, setFormData] = useState({
    // Common fields for all roles
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    city: '',
    state: '',
    password: '',
    confirmPassword: '',
    userRole: 'customer',

    // Vendor specific fields
    vendorEmail: '',
    vendorName: '',
    address: '',
    gstNumber: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [statesData, setStatesData] = useState([]);
  const [citiesData, setCitiesData] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Fetch states only once on mount
  useEffect(() => {
    if (hasFetchedStates.current) return;

    const getStates = async () => {
      setLoadingStates(true);
      try {
        const states = await fetchStates();
        setStatesData(states);
        hasFetchedStates.current = true;
      } catch (error) {
        console.error('Error fetching states:', error);
        toast.error('Error', 'Failed to load states');
      } finally {
        setLoadingStates(false);
      }
    };

    getStates();
  }, [toast]);

  // Fetch cities when state changes
  useEffect(() => {
    const getCities = async () => {

      if (!formData.state) {
        setCitiesData([]);
        return;
      }

      setLoadingCities(true);

      try {
        const cities = await fetchCities(formData.state);

        // Filter cities by selected state
        const filteredCities = cities.filter(
          (city) => city.state_id === Number(formData.state)
        );

        setCitiesData(filteredCities);

      } catch (error) {
        console.error("Failed to load cities", error);
        toast.error("Error", "Failed to load cities");
        setCitiesData([]);
      } finally {
        setLoadingCities(false);
      }
    };

    getCities();
  }, [formData.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle phone number formatting
    if (name === 'phone') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    // Handle state change - reset city when state changes
    else if (name === 'state') {
      setFormData(prev => ({
        ...prev,
        state: value,
        city: '' // reset city when state changes
      }));
    }
    // Handle GST number formatting (optional - can add validation)
    else if (name === 'gstNumber') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field if it exists
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleRoleSelect = (role) => {
    if (role === formData.userRole) return;

    // Reset form data when switching roles
    setFormData({
      ...formData,
      userRole: role,
      // Reset vendor fields when switching away from vendor
      ...(role !== 'vendor' && {
        vendorEmail: '',
        vendorName: '',
        address: '',
        gstNumber: '',
      })
    });

    // Clear all errors
    setErrors({});

    toast.info('Role Selected', `You are signing up as ${role}`);
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const validateForm = useCallback(() => {
    const newErrors = {};

    // Common validations for all roles
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 3) {
      newErrors.firstName = "First name must be at least 3 characters";
    } else if (!/^[A-Za-z ]+$/.test(formData.firstName)) {
      newErrors.firstName = "First name cannot contain numbers";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (!/^[A-Za-z ]+$/.test(formData.lastName)) {
      newErrors.lastName = "Last name cannot contain numbers";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Enter valid 10-digit phone number";
    } else if (/^(\d)\1{9}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number";
    }

    if (!formData.gender) newErrors.gender = 'Select gender';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth required';
    if (!formData.state) newErrors.state = 'Select state';
    if (!formData.city) newErrors.city = 'Select city';

    // Password validation for all roles
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase & number (min 6 characters)';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Vendor-specific validations
    if (formData.userRole === 'vendor') {
      // Vendor email validation
      if (!formData.vendorEmail) {
        newErrors.vendorEmail = 'Vendor email is required';
      } else if (!emailRegex.test(formData.vendorEmail)) {
        newErrors.vendorEmail = 'Invalid vendor email address';
      }

      // Vendor name validation
      if (!formData.vendorName) {
        newErrors.vendorName = 'Vendor name is required';
      } else if (formData.vendorName.trim().length < 3) {
        newErrors.vendorName = 'Vendor name must be at least 3 characters';
      }

      // Address validation
      if (!formData.address) {
        newErrors.address = 'Address is required';
      } else if (formData.address.trim().length < 10) {
        newErrors.address = 'Please enter a complete address';
      }

      // GST number validation (optional but if provided, validate format)
      if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
        newErrors.gstNumber = 'Invalid GST number format';
      }
    }

    if (!agreedToTerms) newErrors.terms = 'You must agree to the terms';

    return newErrors;
  }, [formData, agreedToTerms]);

  const handleSubmit = async (e) => {
  e.preventDefault();

  submitCount.current += 1;

  if (isSubmitting.current || submitCount.current > 1) {
    return;
  }

  setErrors({});

  const validationErrors = validateForm();
  if (Object.keys(validationErrors).length) {
    setErrors(validationErrors);
    toast.error('Validation Failed', 'Please check all required fields');
    submitCount.current = 0;
    return;
  }

  isSubmitting.current = true;
  setIsLoading(true);

  const payload = {
    phone_number: formData.phone,
    password: formData.password,
    first_name: formData.firstName,
    last_name: formData.lastName,
    email: formData.email.toLowerCase(),
    date_of_birth: formData.dateOfBirth,
    user_role: formData.userRole,
    state: formData.state,
    city: formData.city
  };

  if (formData.userRole === 'vendor') {
    payload.vendor_email = formData.vendorEmail.toLowerCase();
    payload.vendor_name = formData.vendorName;
    payload.address = formData.address;
    if (formData.gstNumber) {
      payload.gst_number = formData.gstNumber;
    }
  }

  try {
    const response = await signupUser(payload);

    // ✅ SUCCESS
    if (response.success && response.status === 201) {
      toast.success('Account Created Successfully!', 'Redirecting to login...');

      setTimeout(() => {
        navigate('/login');
      }, 2000);

      return;
    }

    // ❌ ERROR HANDLING
    if (response.status === 409) {
      // Phone already exists
      setErrors({
        phone: response.message || "Phone number already exists"
      });
      toast.error(response.message || "Phone number already registered");
    }
    else if (response.errors) {
      // Dynamic backend validation errors
      const apiErrors = response.errors;

      setErrors({
        phone: apiErrors.phone_number,
        email: apiErrors.email,
        general: response.message
      });

      toast.error(response.message || "Signup failed");
    }
    else {
      setErrors({ general: response.message || 'Signup failed' });
      toast.error('Signup Failed', response.message || 'Please try again');
    }

  } catch (error) {
    console.error("Signup error:", error);

    setErrors({ general: "Server error. Please try again." });
    toast.error("Server Error", "Unable to connect.");
  }

  isSubmitting.current = false;
  setIsLoading(false);
  submitCount.current = 0;
};

  useEffect(() => {
    return () => {
      submitCount.current = 0;
      isSubmitting.current = false;
    };
  }, []);

  // Render common fields for customer/agent
  const renderCommonFields = () => (
    <>
      {/* First Name */}
      <div className="col-md-6">
        <label className="form-label fw-semibold text-secondary">
          <FontAwesomeIcon icon={faUser} className="me-2" style={{ color: '#c42b2b' }} />
          First Name *
        </label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Enter first name"
          className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
          style={{
            borderRadius: '10px',
            padding: '10px 15px',
            border: '2px solid #e0e0e0',
            backgroundColor: isLoading ? '#f8f9fa' : 'white'
          }}
        />
        {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
      </div>

      {/* Last Name */}
      <div className="col-md-6">
        <label className="form-label fw-semibold text-secondary">
          <FontAwesomeIcon icon={faUser} className="me-2" style={{ color: '#c42b2b' }} />
          Last Name *
        </label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Enter last name"
          className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
          style={{
            borderRadius: '10px',
            padding: '10px 15px',
            border: '2px solid #e0e0e0',
            backgroundColor: isLoading ? '#f8f9fa' : 'white'
          }}
        />
        {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
      </div>

      {/* Email */}
      <div className="col-md-6">
        <label className="form-label fw-semibold text-secondary">
          <FontAwesomeIcon icon={faEnvelope} className="me-2" style={{ color: '#c42b2b' }} />
          Email *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Enter email address"
          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
          style={{
            borderRadius: '10px',
            padding: '10px 15px',
            border: '2px solid #e0e0e0',
            backgroundColor: isLoading ? '#f8f9fa' : 'white'
          }}
        />
        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
      </div>

      {/* Phone */}
      <div className="col-md-6">
        <label className="form-label fw-semibold text-secondary">
          <FontAwesomeIcon icon={faPhone} className="me-2" style={{ color: '#c42b2b' }} />
          Phone *
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          maxLength={10}
          disabled={isLoading}
          placeholder="Enter 10-digit phone number"
          className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
          style={{
            borderRadius: '10px',
            padding: '10px 15px',
            border: '2px solid #e0e0e0',
            backgroundColor: isLoading ? '#f8f9fa' : 'white'
          }}
        />
        {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
      </div>

      {/* Gender */}
      <div className="col-md-6">
        <label className="form-label fw-semibold text-secondary">
          <FontAwesomeIcon icon={faVenusMars} className="me-2" style={{ color: '#c42b2b' }} />
          Gender *
        </label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          disabled={isLoading}
          className={`form-select ${errors.gender ? 'is-invalid' : ''}`}
          style={{
            borderRadius: '10px',
            padding: '10px 15px',
            border: '2px solid #e0e0e0',
            backgroundColor: isLoading ? '#f8f9fa' : 'white'
          }}
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
      </div>

      {/* DOB */}
      <div className="col-md-6">
        <label className="form-label fw-semibold text-secondary">
          <FontAwesomeIcon icon={faCalendar} className="me-2" style={{ color: '#c42b2b' }} />
          Date of Birth *
        </label>
        <input
          type="date"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={handleChange}
          disabled={isLoading}
          className={`form-control ${errors.dateOfBirth ? 'is-invalid' : ''}`}
          style={{
            borderRadius: '10px',
            padding: '10px 15px',
            border: '2px solid #e0e0e0',
            backgroundColor: isLoading ? '#f8f9fa' : 'white'
          }}
        />
        {errors.dateOfBirth && <div className="invalid-feedback">{errors.dateOfBirth}</div>}
      </div>
    </>
  );

  // Render vendor-specific fields
  const renderVendorFields = () => (
    <>
      {/* Vendor Name */}
      <div className="col-md-6">
        <label className="form-label fw-semibold text-secondary">
          <FontAwesomeIcon icon={faStore} className="me-2" style={{ color: '#c42b2b' }} />
          Vendor/Business Name *
        </label>
        <input
          type="text"
          name="vendorName"
          value={formData.vendorName}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Enter business/vendor name"
          className={`form-control ${errors.vendorName ? 'is-invalid' : ''}`}
          style={{
            borderRadius: '10px',
            padding: '10px 15px',
            border: '2px solid #e0e0e0',
            backgroundColor: isLoading ? '#f8f9fa' : 'white'
          }}
        />
        {errors.vendorName && <div className="invalid-feedback">{errors.vendorName}</div>}
      </div>

      {/* Vendor Email */}
      <div className="col-md-6">
        <label className="form-label fw-semibold text-secondary">
          <FontAwesomeIcon icon={faEnvelope} className="me-2" style={{ color: '#c42b2b' }} />
          Vendor Email *
        </label>
        <input
          type="email"
          name="vendorEmail"
          value={formData.vendorEmail}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Enter vendor email address"
          className={`form-control ${errors.vendorEmail ? 'is-invalid' : ''}`}
          style={{
            borderRadius: '10px',
            padding: '10px 15px',
            border: '2px solid #e0e0e0',
            backgroundColor: isLoading ? '#f8f9fa' : 'white'
          }}
        />
        {errors.vendorEmail && <div className="invalid-feedback">{errors.vendorEmail}</div>}
      </div>

      {/* Address */}
      <div className="col-12">
        <label className="form-label fw-semibold text-secondary">
          <FontAwesomeIcon icon={faMapMarker} className="me-2" style={{ color: '#c42b2b' }} />
          Business Address *
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Enter complete business address"
          rows="3"
          className={`form-control ${errors.address ? 'is-invalid' : ''}`}
          style={{
            borderRadius: '10px',
            padding: '10px 15px',
            border: '2px solid #e0e0e0',
            backgroundColor: isLoading ? '#f8f9fa' : 'white',
            resize: 'vertical'
          }}
        />
        {errors.address && <div className="invalid-feedback">{errors.address}</div>}
      </div>

      {/* GST Number */}
      <div className="col-md-6">
        <label className="form-label fw-semibold text-secondary">
          <FontAwesomeIcon icon={faIdCard} className="me-2" style={{ color: '#c42b2b' }} />
          GST Number (Optional)
        </label>
        <input
          type="text"
          name="gstNumber"
          value={formData.gstNumber}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Enter GST number"
          className={`form-control ${errors.gstNumber ? 'is-invalid' : ''}`}
          style={{
            borderRadius: '10px',
            padding: '10px 15px',
            border: '2px solid #e0e0e0',
            backgroundColor: isLoading ? '#f8f9fa' : 'white'
          }}
        />
        {errors.gstNumber && <div className="invalid-feedback">{errors.gstNumber}</div>}
        <small className="text-muted">Format: 22AAAAA0000A1Z5</small>
      </div>
    </>
  );

  return (
    <div className="bg-light" style={{
      minHeight: '100vh',
      padding: '50px 0',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e9eef2 100%)'
    }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-10 col-lg-8">
            <div className="card shadow-lg border-0" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="card-header bg-white border-0 pt-4 pb-0" style={{ background: 'white' }}>
                <div className="text-center">
                  <img
                    className='rounded-circle shadow-sm p-2 mb-3'
                    src={'logo (2).png'}
                    alt="Logo"
                    style={{
                      height: '100px',
                      width: '100px',
                      objectFit: 'contain',
                      border: '3px solid #c42b2b'
                    }}
                  />
                  <h4 className='fw-bold mb-4' style={{ color: '#c42b2b', fontSize: '28px' }}>
                    Create {formData.userRole === 'vendor' ? 'Vendor' : 'Account'}
                  </h4>
                </div>

                {/* Role Selection Buttons */}
                <div className="row g-2 px-3 mb-4">
                  {['customer', 'agent', 'vendor'].map((role) => (
                    <div className="col-4" key={role}>
                      <button
                        type="button"
                        onClick={() => handleRoleSelect(role)}
                        className="btn w-100 py-3 fw-semibold"
                        disabled={isLoading}
                        style={{
                          background: formData.userRole === role ? '#c42b2b' : 'white',
                          color: formData.userRole === role ? 'white' : '#c42b2b',
                          border: '2px solid #c42b2b',
                          borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          boxShadow: formData.userRole === role ? '0 4px 12px rgba(196,43,43,0.3)' : 'none',
                          opacity: isLoading ? 0.6 : 1,
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {role}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-body p-4 p-md-5 pt-3">
                <form onSubmit={handleSubmit}>
                  <div className="row g-4">
                    {/* Common fields for all roles */}
                    {renderCommonFields()}

                    {/* Location fields for all roles */}
                    {/* State */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-secondary">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" style={{ color: '#c42b2b' }} />
                        State *
                      </label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        disabled={loadingStates || isLoading}
                        className={`form-select ${errors.state ? 'is-invalid' : ''}`}
                        style={{
                          borderRadius: '10px',
                          padding: '10px 15px',
                          border: '2px solid #e0e0e0',
                          backgroundColor: isLoading ? '#f8f9fa' : 'white'
                        }}
                      >
                        <option value="">
                          {loadingStates ? 'Loading states...' : 'Select State'}
                        </option>
                        {statesData.map((s) => (
                          <option key={s.state_id} value={s.state_id}>{s.state_name}</option>
                        ))}
                      </select>
                      {errors.state && <div className="invalid-feedback">{errors.state}</div>}
                    </div>

                    {/* City */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-secondary">
                        <FontAwesomeIcon icon={faCity} className="me-2" style={{ color: '#c42b2b' }} />
                        City *
                      </label>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        disabled={!formData.state || loadingCities || isLoading}
                        className={`form-select ${errors.city ? 'is-invalid' : ''}`}
                        style={{
                          borderRadius: '10px',
                          padding: '10px 15px',
                          border: '2px solid #e0e0e0',
                          backgroundColor: isLoading ? '#f8f9fa' : 'white'
                        }}
                      >
                        <option value="">
                          {loadingCities ? 'Loading cities...' : 'Select City'}
                        </option>
                        {citiesData.map((c) => (
                          <option key={c.city_id} value={c.city_id}>
                            {c.city_name}
                          </option>
                        ))}
                      </select>
                      {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                    </div>

                    {/* Vendor-specific fields */}
                    {formData.userRole === 'vendor' && renderVendorFields()}

                    {/* Password */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-secondary">
                        <FontAwesomeIcon icon={faLock} className="me-2" style={{ color: '#c42b2b' }} />
                        Password *
                      </label>
                      <div className="input-group">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          disabled={isLoading}
                          placeholder="Enter password"
                          className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                          style={{
                            borderRadius: '10px 0 0 10px',
                            padding: '10px 15px',
                            border: '2px solid #e0e0e0',
                            borderRight: 'none',
                            backgroundColor: isLoading ? '#f8f9fa' : 'white'
                          }}
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          disabled={isLoading}
                          className="btn btn-outline-secondary"
                          style={{
                            border: '2px solid #e0e0e0',
                            borderLeft: 'none',
                            borderRadius: '0 10px 10px 0',
                            background: isLoading ? '#f8f9fa' : 'white',
                            color: '#c42b2b'
                          }}
                        >
                          <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                        </button>
                      </div>
                      {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                    </div>

                    {/* Confirm Password */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-secondary">
                        <FontAwesomeIcon icon={faLock} className="me-2" style={{ color: '#c42b2b' }} />
                        Confirm Password *
                      </label>
                      <div className="input-group">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          disabled={isLoading}
                          placeholder="Confirm password"
                          className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                          style={{
                            borderRadius: '10px 0 0 10px',
                            padding: '10px 15px',
                            border: '2px solid #e0e0e0',
                            borderRight: 'none',
                            backgroundColor: isLoading ? '#f8f9fa' : 'white'
                          }}
                        />
                        <button
                          type="button"
                          onClick={toggleConfirmPasswordVisibility}
                          disabled={isLoading}
                          className="btn btn-outline-secondary"
                          style={{
                            border: '2px solid #e0e0e0',
                            borderLeft: 'none',
                            borderRadius: '0 10px 10px 0',
                            background: isLoading ? '#f8f9fa' : 'white',
                            color: '#c42b2b'
                          }}
                        >
                          <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                        </button>
                      </div>
                      {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}
                    </div>

                    {/* Terms */}
                    <div className="col-12">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          disabled={isLoading}
                          className="form-check-input"
                          style={{ borderColor: '#c42b2b', cursor: isLoading ? 'not-allowed' : 'pointer' }}
                        />
                        <label className="form-check-label text-secondary">
                          <FontAwesomeIcon icon={faCheckCircle} className="me-2" style={{ color: '#c42b2b' }} />
                          I agree to the <Link to="https://www.lotofhappysmiles.com/terms.html" style={{ color: '#c42b2b', textDecoration: 'none', fontWeight: '600' }}>Terms & Conditions</Link>
                        </label>
                      </div>
                      {errors.terms && <div className="invalid-feedback d-block">{errors.terms}</div>}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || isSubmitting.current}
                    className="btn w-100 py-3 mt-4 fw-bold fs-5"
                    style={{
                      background: isLoading || isSubmitting.current ? '#999' : '#c42b2b',
                      color: 'white',
                      borderRadius: '12px',
                      border: 'none',
                      transition: 'all 0.3s ease',
                      boxShadow: isLoading || isSubmitting.current ? 'none' : '0 4px 15px rgba(196,43,43,0.3)',
                      opacity: isLoading || isSubmitting.current ? 0.7 : 1,
                      cursor: isLoading || isSubmitting.current ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isLoading ? 'Creating Account...' : `Create ${formData.userRole === 'vendor' ? 'Vendor' : 'Account'}`}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <span className="text-secondary">Already have an account? </span>
                  <Link to="/login" style={{ color: '#c42b2b', textDecoration: 'none', fontWeight: '600' }}>
                    Login
                  </Link>
                </div>
              </div>

              {/* Loading Toast */}
              <LoadingToast show={isLoading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;