import React, { useState, useEffect, useRef } from "react";
import {
  FaEdit,
  FaMobileAlt,
  FaEnvelope,
  FaUser,
  FaSave,
  FaTimes,
  FaBirthdayCake,
  FaPencilAlt,
  FaMapMarkerAlt,
  FaCity,
  FaVenusMars,
  FaCalendarAlt,
  FaPhoneAlt,
  FaIdCard,
  FaUserCircle,
  FaRegUser,
  FaRegEnvelope,
  FaRegCalendarAlt,
  FaPhone,
  FaGlobe,
  FaBuilding,
  FaUserTag
} from "react-icons/fa";
import { updateProfile, fetchStates, fetchCities } from "./profileApi";
import LoadingToast from "../loading/LoadingToast";
import { useToast } from "../toast/ToastContext";

const ProfileContent = ({ user, onUpdateProfile }) => {
  const fileRef = useRef(null);
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [userType, setUserType] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // State for dropdown
  const [statesData, setStatesData] = useState([]);
  const [citiesData, setCitiesData] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedStateName, setSelectedStateName] = useState("");
  const [selectedCityName, setSelectedCityName] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
  });

  // Helper function to format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "-";

    try {
      // If it's a timestamp or number, convert to date
      let date;
      if (typeof dateString === 'number' || !isNaN(Number(dateString))) {
        date = new Date(Number(dateString));
      } else {
        date = new Date(dateString);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "-";
      }

      // Format as DD Month, YYYY (e.g., 15 January, 1990)
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "-";
    }
  };

  // Helper function to format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";

    try {
      let date;
      if (typeof dateString === 'number' || !isNaN(Number(dateString))) {
        date = new Date(Number(dateString));
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        return "";
      }

      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error("Date formatting error:", error);
      return "";
    }
  };

  // Fetch states on component mount
  useEffect(() => {
    const getStates = async () => {
      setLoadingStates(true);
      try {
        const states = await fetchStates();
        setStatesData(Array.isArray(states) ? states : []);
      } catch (error) {
        console.error('Error fetching states:', error);
        toast.error('Error', 'Failed to load states');
        setStatesData([]);
      } finally {
        setLoadingStates(false);
      }
    };

    getStates();
  }, []);

  // Fetch cities when state ID changes
  useEffect(() => {
    const getCities = async () => {
      if (!selectedStateId) {
        setCitiesData([]);
        return;
      }

      setLoadingCities(true);
      try {
        const cities = await fetchCities(selectedStateId);
        const filteredCities = cities.filter(
          (city) => String(city.state_id) === String(selectedStateId)
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
  }, [selectedStateId]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      setInitialLoading(true);
      try {
        const storedUser = JSON.parse(localStorage.getItem("user_data"));
        console.log("Stored user data:", storedUser);

        if (storedUser) {
          // Handle date of birth properly
          let formattedDOB = "";
          if (storedUser?.dob || storedUser?.date_of_birth) {
            formattedDOB = formatDateForInput(
              storedUser.dob || storedUser.date_of_birth
            );
          }

          setFormData({
            firstName: storedUser.first_name || "",
            lastName: storedUser.last_name || "",
            email: storedUser.email || "",
            phone: storedUser.phone_number || "",
            dob: formattedDOB,
            address: storedUser.address || "",
          });

          setSelectedStateName(storedUser.state || "");
          setSelectedCityName(storedUser.city || "");
          setProfileImage(storedUser.profileImage || null);
          setUserType(storedUser.user_type || "");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        toast.error("Error", "Failed to load profile data");
      } finally {
        setTimeout(() => {
          setInitialLoading(false);
        }, 500);
      }
    };

    loadUserData();
  }, [toast]);

  // Find state ID when state name changes
  useEffect(() => {
  if (!selectedStateName || statesData.length === 0) return;

  const foundState = statesData.find(
    state => state.state_name?.toLowerCase() === selectedStateName.toLowerCase()
  );

  if (foundState && String(foundState.state_id) !== String(selectedStateId)) {
    setSelectedStateId(String(foundState.state_id));
  }
}, [selectedStateName, statesData]);

  // Find city ID when city name changes
  useEffect(() => {
  if (!selectedCityName || citiesData.length === 0) return;

  const foundCity = citiesData.find(
    city => city.city_name?.toLowerCase() === selectedCityName.toLowerCase()
  );

  if (foundCity && String(foundCity.city_id) !== String(selectedCityId)) {
    setSelectedCityId(String(foundCity.city_id));
  }
}, [selectedCityName, citiesData]);

  // Validate form fields
  const validate = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!selectedStateId) newErrors.state = "State is required";
    if (!selectedCityId) newErrors.city = "City is required";
    if (!formData.dob.trim()) newErrors.dob = "Date of Birth is required";

    if (!formData.email) {
      newErrors.email = "Email can't be empty";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (formData.dob) {
      const dob = new Date(formData.dob);
      const today = new Date();
      const minDob = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
      const maxDob = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());

      if (dob > minDob) {
        newErrors.dob = "You must be at least 10 years old";
      } else if (dob < maxDob) {
        newErrors.dob = "You cannot be older than 100 years";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getMinDate = () => {
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
    return minDate.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    return maxDate.toISOString().split('T')[0];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleStateChange = (e) => {
    const stateId = e.target.value;
    const selectedState = statesData.find(state => String(state.state_id) === stateId);

    setSelectedStateId(stateId);
    setSelectedStateName(selectedState ? selectedState.state_name : "");
    setSelectedCityId("");
    setSelectedCityName("");
    setCitiesData([]);

    if (errors.state) setErrors(prev => ({ ...prev, state: '' }));
    if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
  };

  const handleCityChange = (e) => {
    const cityId = e.target.value;
    const selectedCity = citiesData.find(city => String(city.city_id) === cityId);

    setSelectedCityId(cityId);
    setSelectedCityName(selectedCity ? selectedCity.city_name : "");

    if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Validation Failed', 'Please check all required fields');
      return;
    }

    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem("user_data"));
      const payload = {
        id: userData?.user_id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        dob: formData.dob,
        phone_number: formData.phone,
        state: selectedStateName,
        city: selectedCityName,
        user_role: userData?.user_type?.toLowerCase(),
      };

      console.log("Payload:", payload);
      const response = await updateProfile(userData, payload);
      console.log("Response:", response);

      if (response.updator_info || response.user_id) {
        const updatedUser = response.user || response;

        const storedUser = JSON.parse(localStorage.getItem("user_data"));
        const mergedUser = {
          ...storedUser,
          first_name: updatedUser.first_name || formData.firstName,
          last_name: updatedUser.last_name || formData.lastName,
          email: updatedUser.email || formData.email,
          phone_number: updatedUser.phone_number || formData.phone,
          dob: updatedUser.dob || updatedUser.date_of_birth || formData.dob,
          state: updatedUser.state || selectedStateName,
          city: updatedUser.city || selectedCityName,
          user_type: updatedUser.user_role || storedUser.user_type,
        };

        localStorage.setItem("user_data", JSON.stringify(mergedUser));

        // Format dob for display
        const rawDOB = mergedUser.dob || mergedUser.date_of_birth;
        const formattedDOB = formatDateForInput(rawDOB);
        setFormData({
          firstName: mergedUser.first_name || "",
          lastName: mergedUser.last_name || "",
          email: mergedUser.email || "",
          phone: mergedUser.phone_number || "",
          dob: formattedDOB,
          address: mergedUser.address || "",
        });

        setUserType(mergedUser.user_type || "");
        onUpdateProfile?.(mergedUser);
        setIsEditing(false);

        toast.success('Profile Updated Successfully!', 'Your profile has been updated.');
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Update Error:", error);

      if (error.response && error.response.data) {
        const apiErrors = error.response.data;
        if (apiErrors.error_code) {
          toast.error("Update Failed", apiErrors.message || "Unable to update profile");
          setErrors({ general: apiErrors.message });
        } else if (apiErrors.email) {
          toast.error("Email Error", apiErrors.email);
          setErrors({ email: apiErrors.email });
        } else {
          toast.error("Update Failed", apiErrors.message || "Please try again");
          setErrors({ general: apiErrors.message });
        }
      } else {
        toast.error("Update Failed", "Unable to update profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading toast while initial data is being loaded
  if (initialLoading) {
    return (
      <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingToast show={initialLoading} message="Loading profile..." />
      </div>
    );
  }

  // Field component with consistent styling
  const Field = ({ label, icon, name, type, isEditing, formData, handleChange, disabled = false, error }) => (
    <div className="col-md-6">
      <label className="form-label fw-semibold mb-2" style={{ color: '#495057' }}>
        {icon} {label} *
      </label>
      {isEditing ? (
        <>
          <input
            type={type}
            className={`form-control ${error ? 'is-invalid' : ''}`}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            disabled={disabled}
            style={{
              borderRadius: '10px',
              padding: '10px 15px',
              border: '2px solid #e0e0e0',
              backgroundColor: disabled ? '#f8f9fa' : 'white'
            }}
          />
          {error && <div className="invalid-feedback d-block">{error}</div>}
        </>
      ) : (
        <div
          className="bg-light"
          style={{
            borderRadius: '10px',
            padding: '10px 15px',
            border: '2px solid #e0e0e0',
            backgroundColor: '#f8f9fa',
            color: '#495057'
          }}
        >
          {formData[name] || "-"}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Loading toast for update operations */}
      <LoadingToast show={loading} message="Updating profile..." />

      <div className="card shadow-lg border-0 mx-auto" style={{ maxWidth: "900px", borderRadius: "20px", overflow: "hidden" }}>
        <div className="card-body p-4 p-md-5 pt-3">
          {/* HEADER with Avatar */}
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <div className="d-flex align-items-center gap-4">
              {/* Avatar */}
              <div className="position-relative">
                <div
                  className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
                  style={{
                    width: "90px",
                    height: "90px",
                    fontSize: "32px",
                    border: "3px solid #c42b2b"
                  }}
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="profile"
                      className="w-100 h-100 rounded-circle object-fit-cover"
                    />
                  ) : (
                    <FaUserCircle size={50} />
                  )}
                </div>

                {isEditing && (
                  <button
                    className="btn btn-light btn-sm position-absolute bottom-0 end-0 rounded-circle shadow-sm"
                    onClick={() => fileRef.current.click()}
                    disabled={loading}
                    style={{
                      border: "1px solid #c42b2b",
                      color: "#c42b2b"
                    }}
                  >
                    <FaPencilAlt size={12} />
                  </button>
                )}
              </div>

              <input
                type="file"
                hidden
                ref={fileRef}
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading}
              />

              <div>
                <h5 className="mb-0 fw-bold" style={{ color: '#c42b2b' }}>
                  {formData.firstName} {formData.lastName}
                </h5>
                <small className="text-muted text-capitalize">
                  <FaUserTag className="me-1" size={12} /> {userType || "Customer"}
                </small>
              </div>
            </div>

            {!isEditing && (
              <button
                className="btn px-4 py-2 fw-semibold"
                onClick={() => setIsEditing(true)}
                disabled={loading}
                style={{
                  background: 'white',
                  color: '#c42b2b',
                  border: '2px solid #c42b2b',
                  borderRadius: '10px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#c42b2b';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#c42b2b';
                }}
              >
                <FaEdit className="me-2" /> Edit Profile
              </button>
            )}
          </div>

          {/* FORM */}
          <div className="row g-4">
            <Field
              label="First Name"
              icon={<FaUser style={{ color: '#c42b2b' }} />}
              name="firstName"
              type="text"
              isEditing={isEditing}
              formData={formData}
              handleChange={handleChange}
              disabled={loading}
              error={errors.firstName}
            />

            <Field
              label="Last Name"
              icon={<FaRegUser style={{ color: '#c42b2b' }} />}
              name="lastName"
              type="text"
              isEditing={isEditing}
              formData={formData}
              handleChange={handleChange}
              disabled={loading}
              error={errors.lastName}
            />

            <Field
              label="Email"
              icon={<FaRegEnvelope style={{ color: '#c42b2b' }} />}
              name="email"
              type="email"
              isEditing={isEditing}
              formData={formData}
              handleChange={handleChange}
              disabled={loading}
              error={errors.email}
            />

            {/* Mobile Number - Always disabled */}
            <div className="col-md-6">
              <label className="form-label fw-semibold mb-2" style={{ color: '#495057' }}>
                <FaPhoneAlt style={{ color: '#c42b2b' }} className="me-2" />
                Mobile Number *
              </label>
              <div
                className="bg-light"
                style={{
                  borderRadius: '10px',
                  padding: '10px 15px',
                  border: '2px solid #e0e0e0',
                  backgroundColor: '#f8f9fa',
                  color: '#495057'
                }}
              >
                +91 {formData.phone}
              </div>
            </div>

            {/* Date of Birth */}
            <div className="col-md-6">
              <label className="form-label fw-semibold mb-2" style={{ color: '#495057' }}>
                <FaRegCalendarAlt style={{ color: '#c42b2b' }} className="me-2" />
                Date of Birth *
              </label>
              {isEditing ? (
                <>
                  <input
                    type="date"
                    className={`form-control ${errors.dob ? 'is-invalid' : ''}`}
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    min={getMaxDate()}
                    max={getMinDate()}
                    disabled={loading}
                    style={{
                      borderRadius: '10px',
                      padding: '10px 15px',
                      border: '2px solid #e0e0e0',
                      backgroundColor: loading ? '#f8f9fa' : 'white'
                    }}
                  />
                  {errors.dob && <div className="invalid-feedback d-block">{errors.dob}</div>}
                  <small className="text-muted">Must be between 10 and 100 years old</small>
                </>
              ) : (
                <div
                  className="bg-light"
                  style={{
                    borderRadius: '10px',
                    padding: '10px 15px',
                    border: '2px solid #e0e0e0',
                    backgroundColor: '#f8f9fa',
                    color: '#495057'
                  }}
                >
                  {formatDateForDisplay(formData.dob)}
                </div>
              )}
            </div>

            {/* State Dropdown */}
            <div className="col-md-6">
              <label className="form-label fw-semibold mb-2" style={{ color: '#495057' }}>
                <FaMapMarkerAlt style={{ color: '#c42b2b' }} className="me-2" />
                State *
              </label>
              {isEditing ? (
                <>
                  <select
                    className={`form-control ${errors.state ? 'is-invalid' : ''}`}
                    value={selectedStateId}
                    onChange={handleStateChange}
                    disabled={loading || loadingStates}
                    style={{
                      borderRadius: '10px',
                      padding: '10px 15px',
                      border: '2px solid #e0e0e0',
                      backgroundColor: loading ? '#f8f9fa' : 'white'
                    }}
                  >
                    <option value="">
                      {loadingStates ? 'Loading states...' : 'Select State'}
                    </option>
                    {statesData.map((state) => (
                      <option key={state.state_id} value={state.state_id}>
                        {state.state_name}
                      </option>
                    ))}
                  </select>
                  {errors.state && <div className="invalid-feedback d-block">{errors.state}</div>}
                </>
              ) : (
                <div
                  className="bg-light"
                  style={{
                    borderRadius: '10px',
                    padding: '10px 15px',
                    border: '2px solid #e0e0e0',
                    backgroundColor: '#f8f9fa',
                    color: '#495057'
                  }}
                >
                  {selectedStateName || "-"}
                </div>
              )}
            </div>

            {/* City Dropdown */}
            <div className="col-md-6">
              <label className="form-label fw-semibold mb-2" style={{ color: '#495057' }}>
                <FaCity style={{ color: '#c42b2b' }} className="me-2" />
                City *
              </label>
              {isEditing ? (
                <>
                  <select
                    className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                    value={selectedCityId}
                    onChange={handleCityChange}
                    disabled={loading || !selectedStateId || loadingCities}
                    style={{
                      borderRadius: '10px',
                      padding: '10px 15px',
                      border: '2px solid #e0e0e0',
                      backgroundColor: loading ? '#f8f9fa' : 'white'
                    }}
                  >
                    <option value="">
                      {loadingCities ? 'Loading cities...' : 'Select City'}
                    </option>
                    {citiesData.map((city) => (
                      <option key={city.city_id} value={city.city_id}>
                        {city.city_name}
                      </option>
                    ))}
                  </select>
                  {errors.city && <div className="invalid-feedback d-block">{errors.city}</div>}
                  {!selectedStateId && (
                    <small className="text-muted">Please select a state first</small>
                  )}
                </>
              ) : (
                <div
                  className="bg-light"
                  style={{
                    borderRadius: '10px',
                    padding: '10px 15px',
                    border: '2px solid #e0e0e0',
                    backgroundColor: '#f8f9fa',
                    color: '#495057'
                  }}
                >
                  {selectedCityName || "-"}
                </div>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          {isEditing && (
            <div className="d-flex justify-content-end gap-3 mt-4 pt-3">
              <button
                className="btn px-4 py-2 fw-semibold"
                onClick={() => {
                  setIsEditing(false);
                  setErrors({});
                  const storedUser = JSON.parse(localStorage.getItem("user_data"));
                  if (storedUser) {
                    const formattedDOB = formatDateForInput(storedUser.date_of_birth);
                    setFormData({
                      firstName: storedUser.first_name || "",
                      lastName: storedUser.last_name || "",
                      email: storedUser.email || "",
                      phone: storedUser.phone_number || "",
                      dob: formattedDOB,
                      address: storedUser.address || "",
                      gender: storedUser.gender || "",
                    });
                    setSelectedStateName(storedUser.state || "");
                    setSelectedCityName(storedUser.city || "");

                    const foundState = statesData.find(
                      state => state.state_name?.toLowerCase() === storedUser.state?.toLowerCase()
                    );
                    if (foundState) {
                      setSelectedStateId(String(foundState.state_id));
                    } else {
                      setSelectedStateId("");
                    }
                  }
                  // toast.info('Cancelled', 'Changes were not saved');
                }}
                disabled={loading}
                style={{
                  background: 'white',
                  color: '#dc3545',
                  border: '2px solid #dc3545',
                  borderRadius: '10px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#dc3545';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#dc3545';
                }}
              >
                <FaTimes className="me-2" /> Cancel
              </button>
              <button
                className="btn px-4 py-2 fw-semibold text-white"
                onClick={handleSave}
                disabled={loading}
                style={{
                  background: loading ? '#999' : '#c42b2b',
                  borderRadius: '10px',
                  border: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: loading ? 'none' : '0 4px 15px rgba(196,43,43,0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.background = '#a01e2e';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.background = '#c42b2b';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                <FaSave className="me-2" /> {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileContent;