import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Form, Badge, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { 
  FaHome, 
  FaMapMarkerAlt, 
  FaCheckCircle, 
  FaPlusCircle, 
  FaInfoCircle, 
  FaEdit, 
  FaTrash, 
  FaStar,
  FaBuilding,
  FaRoad,
  FaCity,
  FaLandmark,
  FaRegBuilding,
  FaStreetView,
  // FaPostcode,
  FaPhoneAlt,
  FaUser,
  FaEnvelope
} from 'react-icons/fa';
import { useToast } from '../toast/ToastContext';
import { 
  fetchUserAddresses, 
  createUserAddress, 
  updateUserAddress,
  fetchStates,
  fetchCities
} from './addressApi';

const AddressSelection = ({ 
  show, 
  onClose, 
  onAddressSelect, 
  selectedAddressId,
  userId,
  userData,
  isProcessing = false 
}) => {
  const toast = useToast();
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressesError, setAddressesError] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(selectedAddressId || null);
  const [editMode, setEditMode] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  // State and City dropdown states
  const [statesData, setStatesData] = useState([]);
  const [citiesData, setCitiesData] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  
  const [newAddress, setNewAddress] = useState({
    address_type: 'home',
    door_no: '',
    street: '',
    area: '',
    city: '',
    state: '',
    postal_code: '',
    landmark: ''
  });

  // Postal code validation
  const validatePostalCode = (postalCode) => {
    const postalCodeRegex = /^[1-9][0-9]{5}$/;
    return postalCodeRegex.test(postalCode);
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    
    if (!newAddress.door_no.trim()) {
      errors.door_no = 'Door/Building number is required';
    }
    
    if (!newAddress.street.trim()) {
      errors.street = 'Street name is required';
    }
    
    if (!newAddress.area.trim()) {
      errors.area = 'Area/Colony is required';
    }
    
    if (!selectedStateId) {
      errors.state = 'Please select a state';
    }
    
    if (!selectedCityId) {
      errors.city = 'Please select a city';
    }
    
    if (!newAddress.postal_code.trim()) {
      errors.postal_code = 'Postal code is required';
    } else if (!validatePostalCode(newAddress.postal_code)) {
      errors.postal_code = 'Please enter a valid 6-digit PIN code (e.g., 110001)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fetch states on component mount
  useEffect(() => {
    const getStates = async () => {
      setLoadingStates(true);
      try {
        const states = await fetchStates();
        console.log("States loaded:", states);
        setStatesData(Array.isArray(states) ? states : []);
      } catch (error) {
        console.error('Error fetching states:', error);
        toast.error('Error', 'Failed to load states');
        setStatesData([]);
      } finally {
        setLoadingStates(false);
      }
    };

    if (showAddressModal) {
      getStates();
    }
  }, [toast, showAddressModal]);

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
    }, [selectedStateId, toast]);

  // Handle state change
  const handleStateChange = (e) => {
    const stateId = e.target.value;
    const selectedState = statesData.find(state => String(state.state_id) === stateId);
    
    console.log("State changed to:", stateId, selectedState);
    
    setSelectedStateId(stateId);
    // Reset city when state changes
    setSelectedCityId("");
    setCitiesData([]);
    
    // Update newAddress state
    setNewAddress(prev => ({
      ...prev,
      state: selectedState ? selectedState.state_name : "",
      city: ""
    }));
    
    // Clear errors
    if (formErrors.city) {
      setFormErrors(prev => ({ ...prev, city: '' }));
    }
    if (formErrors.state) {
      setFormErrors(prev => ({ ...prev, state: '' }));
    }
  };

  // Handle city change
  const handleCityChange = (e) => {
    const cityId = e.target.value;
    const selectedCity = citiesData.find(city => String(city.city_id) === cityId);
    
    console.log("City changed to:", cityId, selectedCity);
    
    setSelectedCityId(cityId);
    setNewAddress(prev => ({
      ...prev,
      city: selectedCity ? selectedCity.city_name : ""
    }));
    
    // Clear city error
    if (formErrors.city) {
      setFormErrors(prev => ({ ...prev, city: '' }));
    }
  };

  // Handle postal code change with validation
  const handlePostalCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setNewAddress(prev => ({ ...prev, postal_code: value }));
    
    if (formErrors.postal_code) {
      setFormErrors(prev => ({ ...prev, postal_code: '' }));
    }
  };

  // Handle input change with validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAddress(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Fetch addresses from API
  const fetchAddressesFromAPI = async (showToastOnLoad = false) => {
    setLoadingAddresses(true);
    setAddressesError(null);

    try {
      console.log('Fetching user addresses from API...');
      const response = await fetchUserAddresses();
      console.log('Addresses API response:', response);

      if (response) {
        let addressesArray = [];
        
        if (Array.isArray(response)) {
          addressesArray = response;
        } else if (response.data && Array.isArray(response.data)) {
          addressesArray = response.data;
        } else if (response.addresses && Array.isArray(response.addresses)) {
          addressesArray = response.addresses;
        } else if (response.results && Array.isArray(response.results)) {
          addressesArray = response.results;
        }

        const transformedAddresses = addressesArray.map(addr => ({
          id: addr.id,
          address_type: addr.address_type?.toLowerCase() || 'home',
          name: addr.name || userData?.name || '',
          phone: addr.phone || userData?.phone || '',
          door_no: addr.door_no || '',
          street: addr.street || '',
          area: addr.area || '',
          city: addr.city || '',
          state: addr.state || '',
          postal_code: addr.postal_code || addr.pincode || '',
          landmark: addr.landmark || '',
          is_default: addr.is_default || false,
          state_id: addr.state_id || '',
          city_id: addr.city_id || '',
          api_data: addr
        }));

        console.log(`Transformed ${transformedAddresses.length} addresses from API`);
        setAddresses(transformedAddresses);

        // Set default address if none selected
        if (!selectedAddress && transformedAddresses.length > 0) {
          const defaultAddress = transformedAddresses.find(addr => addr.is_default);
          if (defaultAddress) {
            setSelectedAddress(defaultAddress.id);
            onAddressSelect(defaultAddress);
          }
        }
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddressesError('Failed to load addresses from server');
      
      if (showToastOnLoad) {
        toast.error('Error', 'Failed to load addresses');
      }
      
      // Try to load from localStorage as fallback
      try {
        const savedLocalAddresses = localStorage.getItem('flh_addresses');
        if (savedLocalAddresses) {
          const localAddresses = JSON.parse(savedLocalAddresses);
          setAddresses(localAddresses);
          console.log(`Loaded ${localAddresses.length} addresses from localStorage as fallback`);
        }
      } catch (e) {
        console.error('Error loading local addresses:', e);
      }
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Save new address
  const saveAddress = async () => {
    if (!validateForm()) {
      toast.error('Validation Failed', 'Please check all required fields');
      return;
    }
    
    setSavingAddress(true);
    try {
      const addressData = {
        door_no: newAddress.door_no,
        street: newAddress.street,
        area: newAddress.area,
        city: newAddress.city,
        postal_code: newAddress.postal_code,
        state: newAddress.state,
        address_type: newAddress.address_type,
        landmark: newAddress.landmark || '',
        name: userData?.name || '',
        phone: userData?.phone || '',
        state_id: selectedStateId,
        city_id: selectedCityId
      };

      console.log('Creating address with data:', addressData);

      const response = await createUserAddress(addressData);
      console.log('Address created successfully:', response);

      // Fetch updated addresses
      await fetchAddressesFromAPI(false);
      
      setShowAddressModal(false);
      setEditMode(false);
      setEditingAddress(null);
      
      // Reset form
      resetAddressForm();
      
      toast.success('Address Added', 'New address added successfully');

    } catch (error) {
      console.error('Error saving address:', error);
      
      let errorMessage = 'Failed to save address. Please try again.';
      if (error.response) {
        console.log('Error response data:', error.response.data);
        errorMessage = error.response.data?.message || error.response.data?.detail || 'Failed to save address. Please check all fields.';
        toast.error('Error', errorMessage);
      } else if (error.request) {
        console.log('Error request:', error.request);
        toast.error('Network Error', 'No response from server');
      } else {
        console.log('Error message:', error.message);
        toast.error('Error', errorMessage);
      }
    } finally {
      setSavingAddress(false);
    }
  };

  // Update existing address
  const updateAddress = async () => {
    if (!editingAddress) return;
    
    if (!validateForm()) {
      toast.error('Validation Failed', 'Please check all required fields');
      return;
    }
    
    setSavingAddress(true);
    try {
      const addressData = {
        door_no: newAddress.door_no,
        street: newAddress.street,
        area: newAddress.area,
        city: newAddress.city,
        postal_code: newAddress.postal_code,
        state: newAddress.state,
        address_type: newAddress.address_type,
        landmark: newAddress.landmark || '',
        name: userData?.name || '',
        phone: userData?.phone || '',
        state_id: selectedStateId,
        city_id: selectedCityId
      };

      console.log('Updating address with data:', addressData);
      const response = await updateUserAddress(editingAddress.id, addressData);
      console.log('Address updated successfully:', response);

      await fetchAddressesFromAPI(false);
      
      setShowAddressModal(false);
      setEditMode(false);
      setEditingAddress(null);
      
      // Reset form
      resetAddressForm();

      toast.success('Address Updated', 'Address updated successfully');

    } catch (error) {
      console.error('Error updating address:', error);
      
      let errorMessage = 'Failed to update address. Please try again.';
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.detail || 'Failed to update address';
        toast.error('Error', errorMessage);
      } else if (error.request) {
        toast.error('Network Error', 'No response from server');
      } else {
        toast.error('Error', errorMessage);
      }
    } finally {
      setSavingAddress(false);
    }
  };

  // Reset address form
  const resetAddressForm = () => {
    setNewAddress({
      address_type: 'home',
      door_no: '',
      street: '',
      area: '',
      city: '',
      state: '',
      postal_code: '',
      landmark: ''
    });
    setSelectedStateId("");
    setSelectedCityId("");
    setCitiesData([]);
    setFormErrors({});
  };

  // Delete address
  const handleDeleteAddress = async () => {
    if (!addressToDelete) return;
    
    setSavingAddress(true);
    try {
      // Since no delete API endpoint, remove from local state only
      const updatedAddresses = addresses.filter(addr => addr.id !== addressToDelete.id);
      setAddresses(updatedAddresses);
      localStorage.setItem('flh_addresses', JSON.stringify(updatedAddresses));
      
      setShowDeleteConfirm(false);
      setAddressToDelete(null);
      
      // If the deleted address was selected, clear selection
      if (selectedAddress === addressToDelete.id) {
        setSelectedAddress(null);
        onAddressSelect(null);
      }

      toast.success('Address Deleted', 'Address removed successfully');

    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Error', 'Failed to delete address');
    } finally {
      setSavingAddress(false);
    }
  };

  // Handle edit address
  const handleEditAddress = (address) => {
    setEditMode(true);
    setEditingAddress(address);
    
    // Find state ID from state name
    const foundState = statesData.find(
      state => state.state_name?.toLowerCase() === address.state?.toLowerCase()
    );
    
    setSelectedStateId(foundState ? String(foundState.state_id) : "");
    
    setNewAddress({
      address_type: address.address_type,
      door_no: address.door_no || '',
      street: address.street || '',
      area: address.area || '',
      city: address.city || '',
      state: address.state || '',
      postal_code: address.postal_code || '',
      landmark: address.landmark || ''
    });
    
    setFormErrors({});
    setShowAddressModal(true);
  };

  // Handle address selection
  const handleAddressClick = (address) => {
    if (isProcessing) return;
    setSelectedAddress(address.id);
    onAddressSelect(address);
  };

  // Load addresses when modal opens
  useEffect(() => {
    if (show) {
      fetchAddressesFromAPI(true);
    }
  }, [show]);

  // Handle address selection from parent
  useEffect(() => {
    if (selectedAddressId) {
      setSelectedAddress(selectedAddressId);
    }
  }, [selectedAddressId]);

  // Set city ID when cities are loaded and editing an address
  useEffect(() => {
    if (editMode && citiesData.length > 0 && newAddress.city && !selectedCityId) {
      const foundCity = citiesData.find(
        city => city.city_name?.toLowerCase() === newAddress.city?.toLowerCase()
      );
      if (foundCity) {
        setSelectedCityId(String(foundCity.city_id));
      }
    }
  }, [citiesData, editMode, newAddress.city, selectedCityId]);

  // Get address type icon
  const getAddressIcon = (type) => {
    switch(type) {
      case 'home': return <FaHome className="me-1" />;
      case 'work': return <FaBuilding className="me-1" />;
      default: return <FaMapMarkerAlt className="me-1" />;
    }
  };

  // Get address type label
  const getAddressTypeLabel = (type) => {
    return type === 'home' ? 'Home' : type === 'work' ? 'Work' : 'Other';
  };

  // Format address for display
  const formatAddress = (address) => {
    const parts = [];
    if (address.door_no) parts.push(address.door_no);
    if (address.street) parts.push(address.street);
    if (address.area) parts.push(address.area);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postal_code) parts.push(address.postal_code);
    return parts.join(', ');
  };

  return (
    <>
      {/* Address Selection Modal */}
      <Modal
        show={show}
        onHide={onClose}
        size="lg"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title className="fw-bold">
            <FaMapMarkerAlt className="me-2" />
            Select Delivery Address
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Your Saved Addresses</h6>
            <Button
              variant="outline-warning"
              size="sm"
              onClick={() => {
                setEditMode(false);
                setEditingAddress(null);
                resetAddressForm();
                setShowAddressModal(true);
              }}
              disabled={savingAddress || isProcessing}
            >
              <FaPlusCircle className="me-1" /> Add New Address
            </Button>
          </div>

          {loadingAddresses ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading your addresses...</p>
            </div>
          ) : addressesError ? (
            <Alert variant="danger" className="text-center">
              <p>{addressesError}</p>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={() => fetchAddressesFromAPI(true)} 
                disabled={isProcessing}
              >
                Try Again
              </Button>
            </Alert>
          ) : addresses.length === 0 ? (
            <Alert variant="warning" className="text-center">
              <FaInfoCircle className="me-2" />
              No addresses saved. Please add a delivery address.
            </Alert>
          ) : (
            <Row>
              {addresses.map(address => (
                <Col md={6} key={address.id} className="mb-3">
                  <Card
                    className={`cursor-pointer border-2 ${selectedAddress === address.id ? 'border-primary' : 'border-secondary'}`}
                    onClick={() => handleAddressClick(address)}
                    style={{ 
                      cursor: isProcessing ? 'not-allowed' : 'pointer', 
                      opacity: isProcessing ? 0.7 : 1,
                      transition: 'all 0.2s',
                      backgroundColor: selectedAddress === address.id ? '#e3f2fd' : 'white'
                    }}
                  >
                    <Card.Body>
                      <div className="d-flex justify-content-between">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <h6 className="mb-0">
                              {getAddressIcon(address.address_type)}
                              {getAddressTypeLabel(address.address_type)}
                              {address.is_default && (
                                <Badge bg="success" className="ms-2" size="sm">
                                  <FaStar className="me-1" size={10} />
                                  Default
                                </Badge>
                              )}
                            </h6>
                            <div>
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 me-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAddress(address);
                                }}
                                disabled={savingAddress || isProcessing}
                                title="Edit address"
                              >
                                <FaEdit className="text-info" />
                              </Button>
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAddressToDelete(address);
                                  setShowDeleteConfirm(true);
                                }}
                                disabled={savingAddress || isProcessing}
                                title="Delete address"
                              >
                                <FaTrash className="text-danger" />
                              </Button>
                            </div>
                          </div>
                          
                          {address.name && (
                            <div className="mb-1">
                              <small className="text-muted">Name:</small>
                              <strong className="ms-2">{address.name}</strong>
                            </div>
                          )}
                          
                          {address.phone && (
                            <div className="mb-1">
                              <small className="text-muted">Phone:</small>
                              <strong className="ms-2">{address.phone}</strong>
                            </div>
                          )}
                          
                          <div className="mt-2">
                            <small className="text-muted d-block">
                              {formatAddress(address)}
                            </small>
                            {address.landmark && (
                              <small className="text-muted d-block mt-1">
                                <strong>Landmark:</strong> {address.landmark}
                              </small>
                            )}
                          </div>
                        </div>
                        {selectedAddress === address.id && (
                          <div>
                            <FaCheckCircle className="text-success" size={24} />
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            variant="warning" 
            onClick={() => {
              const selected = addresses.find(addr => addr.id === selectedAddress);
              if (selected) {
                onAddressSelect(selected);
                onClose();
              } else {
                toast.warning('No Address Selected', 'Please select a delivery address');
              }
            }}
            disabled={!selectedAddress || loadingAddresses || isProcessing}
          >
            <FaCheckCircle className="me-2" />
            Confirm Address
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add/Edit Address Modal */}
      <Modal
        show={showAddressModal}
        onHide={() => {
          setShowAddressModal(false);
          setEditMode(false);
          setEditingAddress(null);
          resetAddressForm();
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            {editMode ? <FaEdit className="me-2" /> : <FaPlusCircle className="me-2" />}
            {editMode ? 'Edit Address' : 'Add New Address'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaHome className="me-2 text-danger" />
                    Address Type
                  </Form.Label>
                  <Form.Select
                    value={newAddress.address_type}
                    onChange={(e) => setNewAddress({ ...newAddress, address_type: e.target.value })}
                    disabled={savingAddress}
                    style={{
                      borderRadius: '10px',
                      padding: '10px 15px',
                      border: '2px solid #e0e0e0'
                    }}
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaRegBuilding className="me-2 text-danger" />
                    Door No / Building Name *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="door_no"
                    value={newAddress.door_no}
                    onChange={handleInputChange}
                    placeholder="e.g., 123, ABC Apartments"
                    disabled={savingAddress}
                    isInvalid={!!formErrors.door_no}
                    style={{
                      borderRadius: '10px',
                      padding: '10px 15px',
                      border: '2px solid #e0e0e0'
                    }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.door_no}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaStreetView className="me-2 text-danger" />
                    Street *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="street"
                    value={newAddress.street}
                    onChange={handleInputChange}
                    placeholder="Street Name, Locality"
                    disabled={savingAddress}
                    isInvalid={!!formErrors.street}
                    style={{
                      borderRadius: '10px',
                      padding: '10px 15px',
                      border: '2px solid #e0e0e0'
                    }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.street}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaLandmark className="me-2 text-danger" />
                    Area / Colony *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="area"
                    value={newAddress.area}
                    onChange={handleInputChange}
                    placeholder="Area, Colony, Sector"
                    disabled={savingAddress}
                    isInvalid={!!formErrors.area}
                    style={{
                      borderRadius: '10px',
                      padding: '10px 15px',
                      border: '2px solid #e0e0e0'
                    }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.area}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaMapMarkerAlt className="me-2 text-danger" />
                    State *
                  </Form.Label>
                  <Form.Select
                    value={selectedStateId}
                    onChange={handleStateChange}
                    disabled={loadingStates || savingAddress}
                    isInvalid={!!formErrors.state}
                    style={{
                      borderRadius: '10px',
                      padding: '10px 15px',
                      border: '2px solid #e0e0e0'
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
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.state}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaCity className="me-2 text-danger" />
                    City *
                  </Form.Label>
                  <Form.Select
                    value={selectedCityId}
                    onChange={handleCityChange}
                    disabled={!selectedStateId || loadingCities || savingAddress}
                    isInvalid={!!formErrors.city}
                    style={{
                      borderRadius: '10px',
                      padding: '10px 15px',
                      border: '2px solid #e0e0e0'
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
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.city}
                  </Form.Control.Feedback>
                  {!selectedStateId && (
                    <small className="text-muted">Please select a state first</small>
                  )}
                  {selectedStateId && citiesData.length === 0 && !loadingCities && (
                    <small className="text-danger">No cities found for selected state</small>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {/* <FaPostcode className="me-2 text-danger" /> */}
                    Postal Code *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="postal_code"
                    value={newAddress.postal_code}
                    onChange={handlePostalCodeChange}
                    placeholder="6-digit PIN code"
                    maxLength={6}
                    disabled={savingAddress}
                    isInvalid={!!formErrors.postal_code}
                    style={{
                      borderRadius: '10px',
                      padding: '10px 15px',
                      border: '2px solid #e0e0e0'
                    }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.postal_code}
                  </Form.Control.Feedback>
                  {/* <small className="text-muted">Enter a valid 6-digit PIN code (e.g., 110001)</small> */}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaInfoCircle className="me-2 text-danger" />
                    Landmark (Optional)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="landmark"
                    value={newAddress.landmark}
                    onChange={handleInputChange}
                    placeholder="Nearby landmark"
                    disabled={savingAddress}
                    style={{
                      borderRadius: '10px',
                      padding: '10px 15px',
                      border: '2px solid #e0e0e0'
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Display user info for reference */}
            {(userData?.name || userData?.phone) && (
              <div className="bg-light rounded p-3 mt-2">
                <small className="text-muted d-block mb-2">
                  <FaInfoCircle className="me-1" /> This address will be saved for:
                </small>
                {userData?.name && (
                  <div className="mb-1">
                    <FaUser className="me-2 text-muted" size={12} />
                    <strong>{userData.name}</strong>
                  </div>
                )}
                {userData?.phone && (
                  <div>
                    <FaPhoneAlt className="me-2 text-muted" size={12} />
                    <strong>{userData.phone}</strong>
                  </div>
                )}
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddressModal(false);
              setEditMode(false);
              setEditingAddress(null);
              resetAddressForm();
            }}
            disabled={savingAddress}
            style={{ borderRadius: '10px', padding: '8px 20px' }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={editMode ? updateAddress : saveAddress}
            disabled={savingAddress}
            style={{ 
              borderRadius: '10px', 
              padding: '8px 20px',
              backgroundColor: '#c42b2b',
              borderColor: '#c42b2b'
            }}
          >
            {savingAddress ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                {editMode ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                <FaCheckCircle className="me-2" />
                {editMode ? 'Update Address' : 'Save Address'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => {
          setShowDeleteConfirm(false);
          setAddressToDelete(null);
        }}
        centered
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <FaTrash className="me-2" />
            Delete Address
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this address?</p>
          {addressToDelete && (
            <div className="p-3 bg-light rounded">
              <strong>{getAddressTypeLabel(addressToDelete.address_type)}</strong>
              <div className="text-muted small mt-1">
                {formatAddress(addressToDelete)}
              </div>
              {addressToDelete.landmark && (
                <div className="text-muted small mt-1">
                  Landmark: {addressToDelete.landmark}
                </div>
              )}
            </div>
          )}
          <p className="mt-3 text-danger small">
            <FaInfoCircle className="me-1" />
            This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDeleteConfirm(false);
              setAddressToDelete(null);
            }}
            disabled={savingAddress}
            style={{ borderRadius: '10px', padding: '8px 20px' }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteAddress}
            disabled={savingAddress}
            style={{ borderRadius: '10px', padding: '8px 20px' }}
          >
            {savingAddress ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Deleting...
              </>
            ) : (
              <>
                <FaTrash className="me-2" />
                Delete Address
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AddressSelection;