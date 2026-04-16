import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaShoppingBag, FaArrowLeft, FaRupeeSign, FaCheckCircle, FaStar,
  FaShoppingCart, FaTag, FaBox, FaFilter, FaTimes, FaUsers,
  FaHistory, FaUserCheck, FaSearch, FaEye, FaUser, FaHome,
  FaMapMarkerAlt, FaPhone, FaEnvelope, FaInfoCircle, FaTruck,
  FaCreditCard, FaFileInvoice, FaUserPlus, FaPlusCircle, FaArrowRight,
  FaSync, FaWallet, FaGift, FaCoins, FaExclamationTriangle
} from 'react-icons/fa';
import { Modal, Button, Card, Form, InputGroup, Badge, Alert, Toast, ToastContainer, Row, Col, Carousel, Spinner } from 'react-bootstrap';
import {
  fetchActiveProducts,
  fetchProductPurchaseWallets,
  ProductPurchaseUser,
  ProductOrderAgentPurchase
} from './productApi';
import { customerApi } from '../MyCustomers/customerApi';
import LoadingToast from '../loading/LoadingToast';
import { useToast } from '../toast/ToastContext';
import AddressSelection from '../Address/AddressPage';

// Function to save order to MyOrder page
const saveOrderToLocalStorage = (product, address, customerInfo, purchaseMode, quantity = 1, userData, walletDetails = null, apiResponse = null) => {
  const currentUser = {
    id: userData.user_id || 'agent_001',
    name: userData.name || 'FLH Agent',
    phone: userData.phone || '',
    email: userData.email || ''
  };

  const orderId = Date.now();
  const expectedDelivery = new Date();
  expectedDelivery.setDate(expectedDelivery.getDate() + 7);

  const productImage = product.images && product.images.length > 0
    ? product.images[0].image_url
    : 'https://via.placeholder.com/600x400';

  const productImages = product.images
    ? product.images.map(img => img.image_url)
    : [];

  // Format address string from API address object
  const addressString = address ?
    `${address.door_no || ''}, ${address.street || ''}, ${address.area || ''}, ${address.city || ''}, ${address.state || ''} - ${address.postal_code || ''}`.replace(/, ,/g, ',').replace(/, $/, '')
    : 'Address not specified';

  // Calculate wallet deductions
  let walletDeductions = {};
  let totalWalletDeduction = 0;

  if (walletDetails) {
    if (walletDetails.useUserWallet) {
      walletDeductions.userWallet = walletDetails.userWalletAmount;
      totalWalletDeduction += walletDetails.userWalletAmount;
    }
    if (walletDetails.useCashbackWallet) {
      walletDeductions.cashbackWallet = walletDetails.cashbackAmount;
      totalWalletDeduction += walletDetails.cashbackAmount;
    }
    if (walletDetails.useSchemeWallet) {
      walletDeductions.schemeWallet = walletDetails.schemeAmount;
      totalWalletDeduction += walletDetails.schemeAmount;
    }
  }

  const totalAmount = parseFloat(product.original_price) * quantity;
  const finalAmount = totalAmount - totalWalletDeduction;
  
  // Get API order ID if available
  let apiOrderId = null;
  let orderNo = null;
  if (apiResponse) {
    if (apiResponse.order_id) {
      apiOrderId = apiResponse.order_id;
    } else if (apiResponse.id) {
      apiOrderId = apiResponse.id;
    } else if (apiResponse.order?.id) {
      apiOrderId = apiResponse.order.id;
    }
    if (apiResponse.order_no) {
      orderNo = apiResponse.order_no;
    } else if (apiResponse.order?.order_no) {
      orderNo = apiResponse.order.order_no;
    }
  }

  const newOrder = {
    id: orderId,
    apiOrderId: apiOrderId,
    orderNo: orderNo,
    userId: currentUser.id,
    customerId: purchaseMode === 'self' ? currentUser.id : customerInfo?.id,
    customerName: purchaseMode === 'self' ? 'Self Purchase' : customerInfo?.name,
    customerPhone: purchaseMode === 'self' ? currentUser.phone : customerInfo?.phone,
    customerEmail: purchaseMode === 'self' ? currentUser.email : customerInfo?.email,
    customerAddress: addressString,
    title: product.name,
    description: product.description,
    detailedDescription: product.description,
    category: 'products',
    type: 'Product Purchase',
    amount: totalAmount,
    finalAmount: finalAmount,
    walletDeductions: walletDeductions,
    totalWalletDeduction: totalWalletDeduction,
    unitPrice: parseFloat(product.original_price),
    quantity: quantity,
    productId: product.id,
    productName: product.name,
    productImage: productImage,
    productImages: productImages,
    status: 'pending',
    reference: orderNo || `ORD${orderId.toString().slice(-8)}`,
    date: new Date().toISOString(),
    orderDate: new Date().toISOString(),
    timestamp: orderId,
    expectedDelivery: expectedDelivery.toISOString(),
    deliveryCharge: 0,
    paymentMethod: totalWalletDeduction >= totalAmount ? 'Wallet' : 'wallet to paid',
    paymentStatus: totalWalletDeduction >= totalAmount ? 'paid' : 'pending',
    isSelfPurchase: purchaseMode === 'self',
    trackingNumber: `TRK${orderId.toString().slice(-10)}`,
    deliveryPartner: 'FLH Express',
    purchasedBy: currentUser.name,
    purchasedById: currentUser.id,
    purchaseRole: userData.user_type || 'customer'
  };

  const savedEntries = JSON.parse(localStorage.getItem('userEntries') || '[]');
  savedEntries.unshift(newOrder);
  localStorage.setItem('userEntries', JSON.stringify(savedEntries));

  return newOrder;
};

const ProductPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Create refs to track if toasts have been shown
  const productsToastShown = useRef(false);
  const customersToastShown = useRef(false);
  const walletToastShown = useRef(false);

  // Get user data from localStorage
  const [userData, setUserData] = useState(() => {
    try {
      const data = localStorage.getItem('user_data');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  });

  const userType = userData.user_type?.toLowerCase() || 'customer';
  const userId = localStorage.getItem("user_id");

  // State for error
  const [error, setError] = useState(null);

  // State management - MATCHING API STRUCTURE
  const [formData, setFormData] = useState({
    user_id: "",
    items: [],
    userwallet_share: "0.00",
    cashbackwallet_share: "0.00",
    schemewallet_share: "0.00",
    delivery_address: ""
  });

  // State for wallet selections
  const [walletSelections, setWalletSelections] = useState({
    useUserWallet: false,
    useCashbackWallet: false,
    useSchemeWallet: false
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState({
    products: false,
    wallets: false,
    submit: false,
    customers: false
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [walletBalances, setWalletBalances] = useState({
    user_wallet_balance: 0,
    scheme_wallet_balance: 0,
    cashback_wallet_balance: 0,
    applicable_cb_balance: 0
  });
  const [cashbackMaxLimit, setCashbackMaxLimit] = useState(120);
  const [requestedQuantity, setRequestedQuantity] = useState(1);

  // Customers state - from API
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customersError, setCustomersError] = useState(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Modal and UI states
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('userCart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  // const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState(false);
const [orderSuccessData, setOrderSuccessData] = useState(null);

  const [purchaseDetails, setPurchaseDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    minPrice: 0,
    maxPrice: 500000,
    sortBy: 'default',
    showInStock: false,
    showDiscountOnly: false
  });
  const [purchaseStep, setPurchaseStep] = useState('options'); // 'options', 'customer', 'invoice', 'address'
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedAddressObject, setSelectedAddressObject] = useState(null);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Fetch products on mount
  useEffect(() => {
    loadProducts();
    if (userType === 'agent') {
      fetchCustomersFromAPI(false);
    }
  }, []);

  // Fetch wallet balances when customer is selected
  useEffect(() => {
    if (formData.user_id) {
      fetchWalletBalances(formData.user_id);
    } else {
      setWalletBalances({
        user_wallet_balance: 0,
        scheme_wallet_balance: 0,
        cashback_wallet_balance: 0,
        applicable_cb_balance: 0
      });
    }
  }, [formData.user_id]);

  // Update product details when product is selected
  useEffect(() => {
    if (selectedProduct) {
      updateWalletShares();
    }
  }, [walletSelections, requestedQuantity, walletBalances, selectedProduct]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('userCart', JSON.stringify(cart));
  }, [cart]);

  const loadProducts = async () => {
    setLoading(prev => ({ ...prev, products: true }));
    setError(null);
    try {
      const data = await fetchActiveProducts();
      setProducts(data || []);
      // Only show toast once using useRef
      if (data && data.length > 0 && !productsToastShown.current) {
        // toast.success('Products Loaded', `Loaded ${data.length} products`);
        productsToastShown.current = true;
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again later.');
      if (!productsToastShown.current) {
        toast.error('Error', 'Failed to load products');
        productsToastShown.current = true;
      }
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  // Fetch wallet balances
  const fetchWalletBalances = async (userId) => {
    setLoading(prev => ({ ...prev, wallets: true }));
    try {
      const response = await fetchProductPurchaseWallets(userId);
      if (response && response.success) {
        const walletData = response.data;
        setWalletBalances({
          user_wallet_balance: parseFloat(walletData.user_wallet_balance) || 0,
          scheme_wallet_balance: parseFloat(walletData.scheme_wallet_balance) || 0,
          cashback_wallet_balance: parseFloat(walletData.cashback_wallet_balance) || 0,
          applicable_cb_balance: parseFloat(walletData.applicable_cb_balance) || 120
        });
        setCashbackMaxLimit(parseFloat(walletData.applicable_cb_balance) || 120);
        // Remove success toast to avoid multiple messages
      }
    } catch (err) {
      console.error("Error fetching wallet balances:", err);
      setWalletBalances({
        user_wallet_balance: 0,
        scheme_wallet_balance: 0,
        cashback_wallet_balance: 0,
        applicable_cb_balance: 0
      });
      // Only show error toast once
      if (!walletToastShown.current) {
        toast.error('Error', 'Failed to load wallet balances');
        walletToastShown.current = true;
      }
    } finally {
      setLoading(prev => ({ ...prev, wallets: false }));
    }
  };

  // Calculate total amount based on original price
const calculateTotalAmount = () => {
  // ✅ CART FLOW
  if (selectedProduct?.id === "cart") {
    return cart.reduce(
      (sum, item) =>
        sum + parseFloat(item.original_price) * item.quantity,
      0
    );
  }

  // ✅ BUY NOW FLOW
  if (selectedProduct) {
    return (
      parseFloat(selectedProduct.original_price || 0) *
      requestedQuantity
    );
  }

  return 0;
};

  // Calculate total wallet deduction
  const calculateTotalWalletDeduction = () => {
    const userShare = parseFloat(formData.userwallet_share) || 0;
    const cashbackShare = parseFloat(formData.cashbackwallet_share) || 0;
    const schemeShare = parseFloat(formData.schemewallet_share) || 0;
    return userShare + cashbackShare + schemeShare;
  };

  // Update wallet shares based on selections
  const updateWalletShares = () => {
    const totalAmount = calculateTotalAmount();
    let remainingAmount = totalAmount;

    const updatedShares = {
      userwallet_share: "0.00",
      cashbackwallet_share: "0.00",
      schemewallet_share: "0.00"
    };

    // Distribute amount across selected wallets in priority order
    if (walletSelections.useSchemeWallet && walletBalances.scheme_wallet_balance > 0 && remainingAmount > 0) {
      const share = Math.min(remainingAmount, walletBalances.scheme_wallet_balance);
      updatedShares.schemewallet_share = share.toFixed(2);
      remainingAmount -= share;
    }

    if (walletSelections.useCashbackWallet && walletBalances.cashback_wallet_balance > 0 && remainingAmount > 0) {
      const maxCashback = Math.min(walletBalances.cashback_wallet_balance, cashbackMaxLimit);
      const share = Math.min(remainingAmount, maxCashback);
      updatedShares.cashbackwallet_share = share.toFixed(2);
      remainingAmount -= share;
    }

    if (walletSelections.useUserWallet && walletBalances.user_wallet_balance > 0 && remainingAmount > 0) {
      const share = Math.min(remainingAmount, walletBalances.user_wallet_balance);
      updatedShares.userwallet_share = share.toFixed(2);
      remainingAmount -= share;
    }

    // Update formData with new shares
    setFormData(prev => ({
      ...prev,
      userwallet_share: updatedShares.userwallet_share,
      cashbackwallet_share: updatedShares.cashbackwallet_share,
      schemewallet_share: updatedShares.schemewallet_share
    }));
  };

  // Handle checkbox changes
  const handleWalletCheckboxChange = (walletType) => {
    setWalletSelections(prev => ({
      ...prev,
      [walletType]: !prev[walletType]
    }));
  };

  // Calculate remaining amount after wallet deductions
  const calculateRemainingAmount = () => {
    const total = calculateTotalAmount();
    const userShare = parseFloat(formData.userwallet_share) || 0;
    const cashbackShare = parseFloat(formData.cashbackwallet_share) || 0;
    const schemeShare = parseFloat(formData.schemewallet_share) || 0;
    return Math.max(0, total - userShare - cashbackShare - schemeShare);
  };

  const remainingAmount = calculateRemainingAmount();
  const totalAmount = calculateTotalAmount();
  const totalWalletDeduction = calculateTotalWalletDeduction();

  // Fetch customers from API
  const fetchCustomersFromAPI = async (showToastParam = false) => {
    if (userType !== 'agent') return;

    setLoadingCustomers(true);
    setCustomersError(null);

    try {
      const response = await customerApi.getCustomers();
      if (response && Array.isArray(response)) {
        const transformedCustomers = response.map(customer => ({
          id: customer.id,
          name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown',
          firstName: customer.first_name || '',
          lastName: customer.last_name || '',
          phone: customer.phone_number || customer.phone || '',
          email: customer.email || '',
          address: customer.city || customer.district || '',
          avatar: (customer.first_name ? customer.first_name.charAt(0).toUpperCase() : 'C') +
            (customer.last_name ? customer.last_name.charAt(0).toUpperCase() : 'U'),
          tagged_agent: customer.tagged_agent,
          creator_info: customer.creator_info
        }));
        setCustomers(transformedCustomers);
        // Only show toast once when explicitly requested and not shown before
        if (showToastParam && transformedCustomers.length > 0 && !customersToastShown.current) {
          // toast.success('Customers Loaded', `Loaded ${transformedCustomers.length} customers`);
          customersToastShown.current = true;
        }
      } else {
        setCustomers([]);
        if (showToastParam && !customersToastShown.current) {
          // toast.info('No Customers', 'No customers found. Please add customers first.');
          customersToastShown.current = true;
        }
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomersError('Failed to load customers');
      if (showToastParam && !customersToastShown.current) {
        toast.error('Error', 'Failed to load customers');
        customersToastShown.current = true;
      }
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Helper functions for UI
  const addToCart = (product) => {
    const cartItem = { ...product, cartId: Date.now(), quantity: 1 };
    setCart(prev => [...prev, cartItem]);
    toast.success('Added to Cart', `${product.name} added to cart`);
  };

  const removeFromCart = (cartId) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
    // toast.info('Removed', 'Item removed from cart');
  };

  const handleBuyNow = (product) => {
    setSelectedProduct(product);
    setRequestedQuantity(1);
    setFormData({
      user_id: "",
      items: [{
        product: product.id,
        requested_quantity: 1
      }],
      userwallet_share: "0.00",
      cashbackwallet_share: "0.00",
      schemewallet_share: "0.00",
      delivery_address: ""
    });
    setSelectedCustomer(null);
    setSelectedAddress(null);
    setSelectedAddressObject(null);
    setOrderPlaced(false);
    setWalletSelections({
      useUserWallet: false,
      useCashbackWallet: false,
      useSchemeWallet: false
    });

    if (userType === 'customer') {
      setFormData(prev => ({ ...prev, user_id: parseInt(userId) }));
      setPurchaseStep('invoice');
    } else {
      setPurchaseStep('options');
    }
    setShowPurchaseModal(true);
    // toast.info('Buy Now', `Initiating purchase for ${product.name}`);
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setSelectedImageIndex(0);
    setShowProductDetail(true);
    // toast.info('Product Details', `Viewing details for ${product.name}`);
  };

  const handleAgentOptionSelect = (option) => {
    if (option === 'self') {
      setFormData(prev => ({ ...prev, user_id: parseInt(userId) }));
      setPurchaseStep('invoice');
      // toast.info('Self Purchase', 'Proceeding with self purchase');
    } else {
      setPurchaseStep('customer');
      // toast.info('Customer Purchase', 'Please select a customer');
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= (selectedProduct?.remaining_quantity || 999)) {
      setRequestedQuantity(newQuantity);
      setFormData(prev => ({
        ...prev,
        items: [{
          product: selectedProduct.id,
          requested_quantity: newQuantity
        }]
      }));
      // toast.info('Quantity Updated', `${newQuantity} item(s) selected`);
    } else {
      toast.warning('Limit Reached', `Maximum ${selectedProduct?.remaining_quantity} items available`);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({ ...prev, user_id: customer.id }));
    setPurchaseStep('invoice');
    setWalletSelections({
      useUserWallet: false,
      useCashbackWallet: false,
      useSchemeWallet: false
    });
    // toast.success('Customer Selected', `${customer.name} selected for purchase`);
  };

  const saveCustomer = () => {
    const customerId = Date.now();
    const customerToSave = { id: customerId, ...newCustomer };
    const updatedCustomers = [...customers, customerToSave];
    setCustomers(updatedCustomers);
    localStorage.setItem('flh_customers', JSON.stringify(updatedCustomers));
    handleCustomerSelect(customerToSave);
    setShowAddCustomerModal(false);
    setNewCustomer({ name: '', email: '', phone: '', address: '' });
    // toast.success('Customer Added', `${customerToSave.name} added successfully`);
  };

  // NEW: Handle address selection and proceed to payment
  const handleSelectAddress = () => {
      const token = localStorage.getItem("token");

  if (!token) {
    // ❌ User NOT logged in
    navigate("/login", {
      state: {
        redirectTo: window.location.pathname, // come back here after login
      },
    });
    return;
  }
    if (remainingAmount > 0) {
      toast.error('Validation Error', `Insufficent wallet balance to purchase the product`);
      return;
    }
    // Open address selection modal
    setShowAddressModal(true);
  };

  // NEW: Handle address selected from modal
  const handleAddressSelected = (address) => {
    setSelectedAddress(address.id);
    setSelectedAddressObject(address);
    setFormData(prev => ({
      ...prev,
      delivery_address: `${address.door_no || ''}, ${address.street || ''}, ${address.area || ''}, ${address.city || ''}, ${address.state || ''} - ${address.postal_code || ''}`.replace(/, ,/g, ',').replace(/, $/, '')
    }));
    // toast.success('Address Selected', 'Delivery address confirmed');
    setShowAddressModal(false);
  };

  // Main confirm purchase function - FIXED for your API structure
  const handleConfirmOrder = async () => {
    if (userType === 'agent' && !formData.user_id) {
      toast.error('Error', 'Please select a customer');
      return;
    }

    if (!selectedAddressObject) {
      toast.error('Error', 'Please select a delivery address');
      return;
    }

    if (orderPlaced) {
      // toast.warning('Order Already Placed', 'This order has already been processed');
      return;
    }

    if (remainingAmount > 0) {
      toast.error('Validation Error', `Wallet deductions do not cover total amount. Remaining: ₹${remainingAmount}`);
      return;
    }

    setProcessingOrder(true);
    // toast.info('Processing', 'Creating your order...');

    try {
      const addressObj = selectedAddressObject;
      const addressString = addressObj ?
        `${addressObj.door_no || ''}, ${addressObj.street || ''}, ${addressObj.area || ''}, ${addressObj.city || ''}, ${addressObj.state || ''} - ${addressObj.postal_code || ''}`.replace(/, ,/g, ',').replace(/, $/, '')
        : '';

      // Prepare the exact request body as per your API
      const submitData = {
        items: formData.items,
        userwallet_share: formData.userwallet_share,
        cashbackwallet_share: formData.cashbackwallet_share,
        schemewallet_share: formData.schemewallet_share,
        delivery_address: addressString
      };

      console.log('Submit Data:', submitData);

      let apiResponse;
      if (userType === 'customer') {
        apiResponse = await ProductPurchaseUser(submitData);
      } else if (userType === 'agent') {
        apiResponse = await ProductOrderAgentPurchase(submitData);
      }

      // DEBUG: Log the complete response structure
      console.log('=== API RESPONSE DEBUG ===');
      console.log('Full API Response:', JSON.stringify(apiResponse, null, 2));
      console.log('Type of apiResponse:', typeof apiResponse);
      console.log('apiResponse keys:', apiResponse ? Object.keys(apiResponse) : 'null');
      console.log('apiResponse.success:', apiResponse?.success);
      console.log('apiResponse.success type:', typeof apiResponse?.success);
      console.log('apiResponse.success === true:', apiResponse?.success === true);
      console.log('apiResponse.data?.success:', apiResponse?.data?.success);
      console.log('apiResponse.order:', apiResponse?.order);

      // Check for success in different possible response structures
      let isSuccess = false;
      let orderData = null;

      // Case 1: Direct success property
      if (apiResponse && apiResponse.success === true) {
        isSuccess = true;
        orderData = apiResponse.order;
        console.log('Case 1: Direct success property');
      }
      // Case 2: Success inside data property
      else if (apiResponse && apiResponse.data && apiResponse.data.success === true) {
        isSuccess = true;
        orderData = apiResponse.data.order;
        console.log('Case 2: Success inside data property');
      }
      // Case 3: Response is the order object directly (no wrapper)
      else if (apiResponse && apiResponse.order_no && apiResponse.id) {
        isSuccess = true;
        orderData = apiResponse;
        console.log('Case 3: Response is the order object directly');
      }
      // Case 4: Response has success as string 'true'
      else if (apiResponse && apiResponse.success === 'true') {
        isSuccess = true;
        orderData = apiResponse.order;
        console.log('Case 4: Success as string');
      }

      console.log('Final isSuccess:', isSuccess);
      console.log('Final orderData:', orderData);

      if (isSuccess && orderData) {
        console.log('Order successful! Processing order data...');
        setOrderPlaced(true);
        const orderId = orderData.order_no || `ORD${Date.now().toString().slice(-6)}`;

        const order = saveOrderToLocalStorage(
          selectedProduct,
          addressObj,
          { id: formData.user_id, name: selectedCustomer?.name || 'Customer' },
          userType === 'customer' ? 'self' : 'customer',
          requestedQuantity,
          userData,
          {
            useUserWallet: walletSelections.useUserWallet,
            useCashbackWallet: walletSelections.useCashbackWallet,
            useSchemeWallet: walletSelections.useSchemeWallet,
            userWalletAmount: parseFloat(formData.userwallet_share) || 0,
            cashbackAmount: parseFloat(formData.cashbackwallet_share) || 0,
            schemeAmount: parseFloat(formData.schemewallet_share) || 0
          },
          orderData
        );

        window.dispatchEvent(new CustomEvent('new-order', { detail: { type: 'NEW_ORDER', order } }));

        setPurchaseDetails({
          productName: selectedProduct.name,
          customerName: selectedCustomer?.name || 'Self Purchase',
          address: addressObj,
          amount: totalAmount,
          finalAmount: totalAmount - remainingAmount,
          walletDeduction: totalAmount - remainingAmount,
          date: new Date().toLocaleString(),
          orderId: orderId,
          quantity: requestedQuantity,
          api_order_id: orderData.id,
          walletTransactionIds: {
            user: orderData.userwallet_transaction_id,
            cashback: orderData.cashbackwallet_transaction_id,
            scheme: orderData.schemwallet_transaction_id
          }
        });

        // Reset all states
        setSelectedProduct(null);
        setSelectedCustomer(null);
        setSelectedAddress(null);
        setSelectedAddressObject(null);
        setPurchaseStep('options');
        setRequestedQuantity(1);
        setWalletSelections({
          useUserWallet: false,
          useCashbackWallet: false,
          useSchemeWallet: false
        });
        setFormData({
          user_id: "",
          items: [],
          userwallet_share: "0.00",
          cashbackwallet_share: "0.00",
          schemewallet_share: "0.00",
          delivery_address: ""
        });
        setShowPurchaseModal(false);
        setShowAddressModal(false);

        // Show success toast
        setTimeout(() => {
          // setShowSuccessToast(true);
          setOrderSuccessData({
  orderId: orderId,
  productName: selectedProduct?.name || "Cart Items",
  customerName: selectedCustomer?.name || "Self Purchase",
  amount: totalAmount,
  quantity: requestedQuantity,
  date: new Date().toLocaleString()
});

setShowOrderSuccessModal(true);
        }, 100);

        toast.success('Order Placed!', `Order #${orderId} created successfully`);
        window.dispatchEvent(new Event("wallet-updated"));

      } else {
        // If API response doesn't have success true, throw error with message
        const errorMsg = apiResponse?.message || apiResponse?.error || apiResponse?.data?.message || 'Failed to create order';
        console.error('API returned unsuccessful response:', errorMsg, apiResponse);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Purchase failed - Full error:', error);
      let errorMessage = error.response?.data?.message || error.message || 'Purchase failed. Please try again.';
      toast.error('Purchase Failed', errorMessage);
    } finally {
      setProcessingOrder(false);
    }
  };

  const proceedToCheckout = () => {
  if (cart.length === 0) {
    toast.warning('Empty Cart', 'Please add products to proceed');
    return;
  }

  // ✅ Convert cart into items for API
  const cartItems = cart.map(item => ({
    product: item.id,
    requested_quantity: item.quantity
  }));

  // ✅ Set form data
  setFormData({
user_id: userType === 'customer' ? parseInt(userId) : "",    items: cartItems,
    userwallet_share: "0.00",
    cashbackwallet_share: "0.00",
    schemewallet_share: "0.00",
    delivery_address: ""
  });

  // ✅ Create virtual product (for UI display)
  const totalPrice = cart.reduce(
    (sum, item) => sum + parseFloat(item.original_price) * item.quantity,
    0
  );

  setSelectedProduct({
    id: "cart",
    name: "Cart Items",
    original_price: totalPrice,
    remaining_quantity: 999
  });

  setRequestedQuantity(1);
  setSelectedAddress(null);
  setSelectedAddressObject(null);
  setOrderPlaced(false);

  // ✅ Close cart modal
  setShowCartModal(false);

  if (userType === 'customer') {
    setPurchaseStep('invoice');
  } else {
    setPurchaseStep('options');
  }

  setShowPurchaseModal(true);
};

  const filteredCustomers = customers.filter(customer => {
    const searchLower = customerSearch.toLowerCase();
    return (customer.name || '').toLowerCase().includes(searchLower) ||
      (customer.email || '').toLowerCase().includes(searchLower) ||
      (customer.phone || '').includes(searchLower);
  });

  const categories = ['all', ...new Set(products.map(p => p.category))];

  const filteredProducts = products?.filter(product => {
    if (searchQuery && !product.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !product.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filters.category !== 'all' && product.category !== filters.category) return false;
    const price = parseFloat(product.original_price);
    if (price < filters.minPrice || price > filters.maxPrice) return false;
    if (filters.showInStock && product.remaining_quantity <= 0) return false;
    if (filters.showDiscountOnly) {
      const strikethrough = parseFloat(product.strikethrough_price);
      const original = parseFloat(product.original_price);
      if (strikethrough <= original) return false;
    }
    return true;
  }).sort((a, b) => {
    const priceA = parseFloat(a.original_price);
    const priceB = parseFloat(b.original_price);
    const strikethroughA = parseFloat(a.strikethrough_price);
    const strikethroughB = parseFloat(b.strikethrough_price);
    switch (filters.sortBy) {
      case 'price-low': return priceA - priceB;
      case 'price-high': return priceB - priceA;
      case 'discount':
        const discountA = ((strikethroughA - priceA) / strikethroughA) * 100;
        const discountB = ((strikethroughB - priceB) / strikethroughB) * 100;
        return discountB - discountA;
      default: return 0;
    }
  }) || [];

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.original_price) * item.quantity), 0);

  const clearAllFilters = () => {
    setFilters({
      category: 'all',
      minPrice: 0,
      maxPrice: 500000,
      sortBy: 'default',
      showInStock: false,
      showDiscountOnly: false
    });
    setSearchQuery('');
    toast.info('Filters Cleared', 'All filters have been reset');
  };

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) return product.images[0].image_url;
    return 'https://via.placeholder.com/600x400';
  };

  const getProductImages = (product) => {
    if (product.images && product.images.length > 0) return product.images.map(img => img.image_url);
    return ['https://via.placeholder.com/600x400'];
  };

  const getSavingsAmount = (product) => {
    const strikethrough = parseFloat(product.strikethrough_price);
    const original = parseFloat(product.original_price);
    if (strikethrough > original) return (strikethrough - original).toFixed(2);
    return 0;
  };

  if (loading.products) return <LoadingToast show={true} message="Loading products..." />;

  if (error) {
    return (
      <div className="container-fluid py-4 text-center" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <Alert variant="danger">
          <Alert.Heading>Error Loading Products</Alert.Heading>
          <p>{error}</p>
          <Button variant="danger" onClick={loadProducts}>Try Again</Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Success Toast */}
      {/* <ToastContainer  >
        <Toast show={showSuccessToast} onClose={() => setShowSuccessToast(false)} delay={10000} autohide className="border-success shadow-lg" style={{ minWidth: '600px', maxWidth: '700px' }}>
          <Toast.Header className="bg-success text-white p-4">
            <FaCheckCircle className="me-2" />
            <strong className="me-auto">Order Placed Successfully! 🎉</strong>
          </Toast.Header>
          <Toast.Body className="text-center">
            <div className="mb-3">
              <FaCheckCircle className="text-success mb-2" size={48} />
              <h4 className="mb-2">Order Confirmed!</h4>
            </div>
            <div className="text-start mb-3 p-3 bg-white rounded">
              <div className="mb-2">
                <small className="text-muted">Order ID:</small>
                <div><strong>{purchaseDetails?.orderId}</strong></div>
                {purchaseDetails?.api_order_id && (
                  <div><small className="text-muted">API Order ID: {purchaseDetails.api_order_id}</small></div>
                )}
              </div>
              <div className="mb-2">
                <small className="text-muted">Product:</small>
                <div><strong>{purchaseDetails?.productName}</strong></div>
              </div>
              <div className="mb-2">
                <small className="text-muted">Customer:</small>
                <div><strong>{purchaseDetails?.customerName}</strong></div>
              </div>
              <div className="mb-2">
                <small className="text-muted">Quantity:</small>
                <div><strong>{purchaseDetails?.quantity || 1}</strong></div>
              </div>
              {purchaseDetails?.walletDeduction > 0 && (
                <div className="mb-2">
                  <small className="text-muted">Wallet Used:</small>
                  <div className="text-success fw-bold">₹{purchaseDetails?.walletDeduction?.toLocaleString()}</div>
                </div>
              )} */}
              {/* Show wallet transaction IDs if available */}
              {/* {purchaseDetails?.walletTransactionIds && (
                <div className="mt-2 pt-2 border-top">
                  <small className="text-muted fw-bold">Wallet Transaction IDs:</small>
                  {purchaseDetails.walletTransactionIds.user && (
                    <div className="small mt-1">
                      <span className="text-muted">User Wallet:</span>
                      <strong className="ms-2 text-success">#{purchaseDetails.walletTransactionIds.user}</strong>
                    </div>
                  )}
                  {purchaseDetails.walletTransactionIds.cashback && (
                    <div className="small">
                      <span className="text-muted">Cashback Wallet:</span>
                      <strong className="ms-2 text-success">#{purchaseDetails.walletTransactionIds.cashback}</strong>
                    </div>
                  )}
                  {purchaseDetails.walletTransactionIds.scheme && (
                    <div className="small">
                      <span className="text-muted">Scheme Wallet:</span>
                      <strong className="ms-2 text-success">#{purchaseDetails.walletTransactionIds.scheme}</strong>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-2">
                <small className="text-muted">Payment Method:</small>
                <div><strong>{purchaseDetails?.finalAmount === purchaseDetails?.amount ? 'wallet to paid' : 'Wallet'}</strong></div>
              </div>
            </div>
            <div className="d-flex justify-content-center gap-3">
              <Button variant="outline-secondary" size="sm" onClick={() => navigate('/my-order')}>
                <FaHistory className="me-2" /> View Orders
              </Button>
              <Button variant="warning" size="sm" onClick={() => setShowSuccessToast(false)}>
                <FaShoppingBag className="me-2" /> Continue
              </Button>
            </div>
          </Toast.Body>
        </Toast>
      </ToastContainer> */}
    {showOrderSuccessModal && orderSuccessData && (
  <div
    className="modal show d-block"
    style={{
      backgroundColor: "rgba(0,0,0,0.7)",
      zIndex: 9999
    }}
  >
    <div className="modal-dialog modal-dialog-centered">
      <div
        className="modal-content border-0 shadow-lg"
        style={{ borderRadius: "15px" }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            backgroundColor: "#c42b2b",
            color: "white",
            borderRadius: "15px 15px 0 0",
            padding: "1.5rem"
          }}
        >
          <h5 className="modal-title fw-bold mb-0">
            <FaCheckCircle className="me-2" />
            Order Successful!
          </h5>
          <button
            className="btn-close btn-close-white"
            onClick={() => setShowOrderSuccessModal(false)}
          ></button>
        </div>

        {/* Body */}
        <div className="modal-body p-4 text-center">
          <div className="mb-4">
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3 bg-success"
              style={{
                width: "80px",
                height: "80px",
                color: "white",
                fontSize: "40px"
              }}
            >
              <FaCheckCircle />
            </div>

            <h4 className="fw-bold mb-2">Order Placed Successfully!</h4>
            <p className="text-muted">Your order has been confirmed.</p>
          </div>

          {/* Details */}
          <div className="card border-0 shadow-sm mb-4 text-start">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Order Details</h6>

              <div className="mb-2">
                <div className="text-muted small">Order ID</div>
                <div className="fw-bold">{orderSuccessData.orderId}</div>
              </div>

              <div className="mb-2">
                <div className="text-muted small">Product</div>
                <div className="fw-bold">{orderSuccessData.productName}</div>
              </div>

              <div className="mb-2">
                <div className="text-muted small">Customer</div>
                <div className="fw-bold">{orderSuccessData.customerName}</div>
              </div>

              <div className="mb-2">
                <div className="text-muted small">Quantity</div>
                <div className="fw-bold">{orderSuccessData.quantity}</div>
              </div>

              <div className="mb-2">
                <div className="text-muted small">Amount</div>
                <div className="fw-bold text-success">
                  ₹{orderSuccessData.amount}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="d-grid gap-2">
            <button
              className="btn btn-warning"
              onClick={() => {
                setShowOrderSuccessModal(false);
                navigate('/product'); // or reload
              }}
            >
              Buy Another Product
            </button>

            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate('/my-order')}
            >
              View Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Product Detail Modal */}
      <Modal show={showProductDetail} onHide={() => setShowProductDetail(false)} size="xl" centered>
        <Modal.Header closeButton className='bg-danger text-white fw-bold'><Modal.Title>{selectedProduct?.name}</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <div className="row">
              <div className="col-md-6">
                <div className="sticky-top" style={{ top: '20px' }}>
                  <Carousel activeIndex={selectedImageIndex} onSelect={setSelectedImageIndex} interval={null} className="mb-3">
                    {getProductImages(selectedProduct).map((img, index) => (
                      <Carousel.Item key={index}>
                        <img className="d-block w-100 rounded" src={img} alt={`${selectedProduct.name} ${index + 1}`} style={{ height: '400px', objectFit: 'contain' }} />
                      </Carousel.Item>
                    ))}
                  </Carousel>
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="d-flex flex-wrap gap-2 justify-content-center">
                      {selectedProduct.images.map((img, index) => (
                        <div key={index} className={`border rounded p-1 ${selectedImageIndex === index ? 'border-primary' : 'border-secondary'}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedImageIndex(index)}>
                          <img src={img.image_url} alt={`Thumbnail ${index + 1}`} style={{ width: '80px', height: '80px', objectFit: 'cover' }} className="rounded" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <h2 className="mb-2 fw-bold">{selectedProduct.name}</h2>
                <div className="d-flex align-items-center mb-3">
                  <span className="display-6 text-danger fw-bold">₹{parseFloat(selectedProduct.original_price).toFixed(1)}</span>
                  {parseFloat(selectedProduct.strikethrough_price) > parseFloat(selectedProduct.original_price) && (
                    <span className="text-muted text-decoration-line-through ms-3">₹{parseFloat(selectedProduct.strikethrough_price).toFixed(2)}</span>
                  )}
                </div>
                <Badge bg="secondary" className="mb-3"><FaTag className="me-1" /> {selectedProduct.category}</Badge>
                {parseFloat(selectedProduct.strikethrough_price) > parseFloat(selectedProduct.original_price) && (
                  <Alert variant="success" className="mb-3 py-2"><FaTag className="me-2 text-success" /> Saved ₹{getSavingsAmount(selectedProduct)}</Alert>
                )}
                <div className="mb-5 text-bold"><h5>Description:</h5><p className="text-muted">{selectedProduct.description}</p></div>
                <div className="border-top pt-4">
                  <div className="d-flex gap-3">
                    <Button variant="outline-secondary" size="lg" className="flex-grow-1" onClick={() => addToCart(selectedProduct)} disabled={selectedProduct.remaining_quantity === 0}><FaShoppingCart className="me-2" /> Add to Cart</Button>
                    <Button variant="warning" size="lg" className="flex-grow-1" onClick={() => { setShowProductDetail(false); handleBuyNow(selectedProduct); }} disabled={selectedProduct.remaining_quantity === 0}><FaBox className="me-2" /> Buy Now</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Purchase Modal */}
      <Modal show={showPurchaseModal} onHide={() => { setShowPurchaseModal(false); setPurchaseStep('options'); }} size="lg" centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title className="fw-bold">
            {userType === 'agent' && purchaseStep === 'options' && 'How would you like to purchase?'}
            {userType === 'agent' && purchaseStep === 'customer' && 'Select Customer'}
            {purchaseStep === 'invoice' && 'Invoice & Payment'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Agent Options */}
          {userType === 'agent' && purchaseStep === 'options' && (
            <Row className="g-4 py-3">
              <Col md={6}>
                <Card className="h-100 text-center cursor-pointer border-2 hover-shadow" style={{ cursor: 'pointer' }} onClick={() => handleAgentOptionSelect('customer')}>
                  <Card.Body className="p-4">
                    <FaUsers className="text-danger mb-3" size={48} />
                    <h4>For Customer</h4>
                    <p className="text-muted">Purchase for one of your customers</p>
                    <Button variant="outline-danger" size="sm">Select Customer <FaArrowRight className="ms-2" /></Button>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="h-100 text-center cursor-pointer border-2 hover-shadow" style={{ cursor: 'pointer' }} onClick={() => handleAgentOptionSelect('self')}>
                  <Card.Body className="p-4">
                    <FaUser className="text-warning mb-3" size={48} />
                    <h4>For Self</h4>
                    <p className="text-muted">Purchase for yourself</p>
                    <Button variant="outline-warning" size="sm">Proceed to Payment <FaArrowRight className="ms-2" /></Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Customer Selection */}
          {userType === 'agent' && purchaseStep === 'customer' && (
            <>
              <Button variant="link" className="mb-3 p-0" onClick={() => setPurchaseStep('options')}>← Back to options</Button>
              {!loadingCustomers && customers.length > 0 && (
                <InputGroup className="mb-3"><InputGroup.Text><FaSearch /></InputGroup.Text><Form.Control placeholder="Search your customers by name or phone..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} /></InputGroup>
              )}
              <div className="d-flex justify-content-end mb-2">
                <Button variant="outline-secondary" size="sm" onClick={() => fetchCustomersFromAPI(true)} disabled={loadingCustomers}><FaSync className={`me-2 ${loadingCustomers ? 'fa-spin' : ''}`} /> Refresh</Button>
              </div>
              {loadingCustomers ? <LoadingToast show={loadingCustomers} /> : customers.length === 0 ? (
                <div className="text-center py-4">
                  <FaUsers className="text-muted mb-3" size={48} />
                  <h5 className="text-muted mb-3">No customers found</h5>
                  <Button variant="primary" onClick={() => setShowAddCustomerModal(true)}><FaUserPlus className="me-2" /> Add Customer</Button>
                </div>
              ) : (
                <>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }} className="mb-3 border rounded">
                    {filteredCustomers.map((customer, index) => (
                      <div key={customer.id} className={`p-3 ${index % 2 === 0 ? 'bg-white' : 'bg-light'}`} style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }} onClick={() => handleCustomerSelect(customer)}>
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: '45px', height: '45px', backgroundColor: '#6c757d', color: 'white' }}>{customer.avatar}</div>
                          <div><div className="fw-bold">{customer.name}</div><div className="text-muted small"><FaPhone className="me-1" size={10} /> {customer.phone || 'No phone'}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-3">
                    <Button variant="outline-primary" size="sm" onClick={() => setShowAddCustomerModal(true)}><FaUserPlus className="me-2" /> Add New Customer</Button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Invoice & Wallet Selection */}
{purchaseStep === 'invoice' && (selectedProduct || formData.items.length > 0) && (            <>
              {userType === 'agent' && <Button variant="link" className="mb-3 p-0" onClick={() => setPurchaseStep('customer')}>← Back to Customer Selection</Button>}

              {/* Product Details */}
              <Card className="mb-4 border-info">
                <Card.Header className="bg-light"><h6 className="mb-0 text-info"><FaBox className="me-2" /> Product Details</h6></Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <div><strong>Name:</strong> {selectedProduct.name}</div>
                      <div><strong>Category:</strong> {selectedProduct.category}</div>
                      {/* <div><strong>Available Quantity:</strong> <Badge bg={selectedProduct.remaining_quantity > 0 ? "success" : "danger"}>{selectedProduct.remaining_quantity}</Badge></div> */}
                    </Col>
                    <Col md={4}>
                      <div><strong>Original Price:</strong> ₹{selectedProduct.original_price}</div>
                      <div><strong>Strikethrough Price:</strong> ₹{selectedProduct.strikethrough_price}</div>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label><strong>Quantity</strong></Form.Label>
                        <Form.Control type="number" min="1" max={selectedProduct.remaining_quantity} value={requestedQuantity} onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)} className="w-50" />
                        <Form.Text className="fw-bold">Total: ₹{totalAmount.toFixed(2)}</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Wallet Selection */}
              <Card className="mb-4 border-success">
                <Card.Header className="bg-light d-flex align-items-center">
                  <h6 className="mb-0 text-success me-2"><FaWallet className="me-2" /> Pay from Wallets</h6>
                  {loading.wallets && <Spinner animation="border" size="sm" />}
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <div className="p-3 border rounded h-100 d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div><Form.Check type="checkbox" id="user-wallet-check" label="My Wallet Cash" checked={walletSelections.useUserWallet} onChange={() => handleWalletCheckboxChange('useUserWallet')} disabled={walletBalances.user_wallet_balance <= 0} /></div>
                          <span className={`fw-bold ${walletBalances.user_wallet_balance > 0 ? 'text-success' : 'text-secondary'}`}>₹{walletBalances.user_wallet_balance.toFixed(2)}</span>
                        </div>
                        <div className="mt-auto">
                          <div className="small text-muted">Deducted: <span className="fw-bold text-danger">-₹{formData.userwallet_share}</span></div>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="p-3 border rounded h-100 d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div><Form.Check type="checkbox" id="cashback-wallet-check" label="Cash Back" checked={walletSelections.useCashbackWallet} onChange={() => handleWalletCheckboxChange('useCashbackWallet')} disabled={walletBalances.cashback_wallet_balance <= 0} /></div>
                          <span className={`fw-bold ${walletBalances.cashback_wallet_balance > 0 ? 'text-success' : 'text-secondary'}`}>₹{walletBalances.cashback_wallet_balance.toFixed(2)}</span>
                        </div>
                        <div className="mt-auto">
                          <div className="small text-muted">Deducted: <span className="fw-bold text-danger">-₹{formData.cashbackwallet_share}</span></div>
                          {walletSelections.useCashbackWallet && <div className="small text-muted"><FaInfoCircle className="me-1" size={12} /> Max applicable: ₹{cashbackMaxLimit}</div>}
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="p-3 border rounded h-100 d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div><Form.Check type="checkbox" id="scheme-wallet-check" label="Scheme Wallet" checked={walletSelections.useSchemeWallet} onChange={() => handleWalletCheckboxChange('useSchemeWallet')} disabled={walletBalances.scheme_wallet_balance <= 0} /></div>
                          <span className={`fw-bold ${walletBalances.scheme_wallet_balance > 0 ? 'text-success' : 'text-secondary'}`}>₹{walletBalances.scheme_wallet_balance.toFixed(2)}</span>
                        </div>
                        <div className="mt-auto">
                          <div className="small text-muted">Deducted: <span className="fw-bold text-danger">-₹{formData.schemewallet_share}</span></div>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  {/* Payment Summary */}
                  <div className="mt-4 p-3 bg-light rounded">
                    <Row className="align-items-center">
                      <Col md={6}>
                        <h5 className="mb-2 text-primary fw-600">Payment Summary</h5>
                        <div className="d-flex justify-content-between mb-1">
                          <span>Items :</span>
                          <span className="fw-bold">{requestedQuantity}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span>Total Price:</span>
                          <span className="fw-bold">₹{totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span>Wallet:</span>
                          <span className="fw-bold text-danger">-₹{formData.userwallet_share}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span>Scheme Wallet:</span>
                          <span className="fw-bold text-danger">-₹{formData.schemewallet_share}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span>CashBack:</span>
                          <span className="fw-bold text-danger">-₹{formData.cashbackwallet_share}</span>
                        </div>
                        <div className="d-flex justify-content-between pt-2 border-top mt-2">
                          <span className="fw-bold fs-5">Total Payable:</span>
                          <span className="fw-bold fs-5">₹{totalAmount.toFixed(2)}</span>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Card.Body>
              </Card>

              <div className="d-flex justify-content-end mb-4">
                <Button
                  variant={selectedAddressObject ? "success" : "primary"}
                  size="lg"
                  onClick={handleSelectAddress}
                  // disabled={remainingAmount > 0}
                  className="px-4"
                >
                  <FaMapMarkerAlt className="me-2" />
                  Select Address
                </Button>
              </div>

              {/* Pay Now Button */}
              {selectedAddressObject && remainingAmount === 0 && (
                <Button
                  variant="danger"
                  size="lg"
                  className="w-100 py-3 fw-bold"
                  onClick={handleConfirmOrder}
                  disabled={processingOrder}
                >
                  {processingOrder ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCreditCard className="me-2" /> Pay Now
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Address Selection Modal - Separate from the main purchase modal */}
      <AddressSelection
        show={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressSelect={handleAddressSelected}
        selectedAddressId={selectedAddress}
        userId={userId}
        userData={userData}
        isProcessing={processingOrder}
      />

      {/* Add Customer Modal */}
      <Modal show={showAddCustomerModal} onHide={() => setShowAddCustomerModal(false)} centered>
        <Modal.Header closeButton><Modal.Title><FaUserPlus className="me-2" />Add New Customer</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3"><Form.Label>Name *</Form.Label><Form.Control type="text" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} placeholder="Enter customer name" /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} placeholder="Enter email (optional)" /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Phone *</Form.Label><Form.Control type="tel" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="Enter phone number" /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Address</Form.Label><Form.Control as="textarea" rows={2} value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} placeholder="Enter address (optional)" /></Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddCustomerModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={saveCustomer} disabled={!newCustomer.name || !newCustomer.phone}>Add Customer</Button>
        </Modal.Footer>
      </Modal>

      {/* Cart Modal */}
      <Modal show={showCartModal} onHide={() => setShowCartModal(false)} size="lg" centered>
        <Modal.Header closeButton><Modal.Title><FaShoppingCart className="me-3" />Shopping Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})</Modal.Title></Modal.Header>
        <Modal.Body>
          {cart.length === 0 ? (
            <div className="text-center py-5"><FaShoppingCart className="text-muted mb-3" size={48} /><h5>Your cart is empty</h5></div>
          ) : (
            <>
              {cart.map(item => (
                <Card key={item.cartId} className="mb-3">
                  <Card.Body>
                    <div className="d-flex">
                      <img src={getProductImage(item)} alt={item.name} className="rounded me-3" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between">
                          <div><h6>{item.name}</h6><small>₹{parseFloat(item.original_price).toFixed(1)} × {item.quantity}</small></div>
                          <div className="text-end"><h6>₹{(parseFloat(item.original_price) * item.quantity).toFixed(1)}</h6><Button variant="outline-danger" size="sm" onClick={() => removeFromCart(item.cartId)}>Remove</Button></div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
              <Card className="border-primary"><Card.Body><div className="d-flex justify-content-between"><h5>Total:</h5><h4 className="text-primary">₹{cartTotal.toFixed(1)}</h4></div></Card.Body></Card>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCartModal(false)}>Continue Shopping</Button>
          {cart.length > 0 && <Button variant="success" onClick={proceedToCheckout}>Proceed to Checkout</Button>}
        </Modal.Footer>
      </Modal>

      {/* Header */}
      <Button variant="outline-warning" onClick={() => navigate('/home')} className="me-3 mb-3"><FaArrowLeft /> Back to Dashboard</Button>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-2 text-danger"><FaShoppingBag className="me-3 text-danger" /> Products Store</h1>
        <Button variant="secondary" onClick={() => setShowCartModal(true)}><FaShoppingCart className="me-2" /> Cart {cart.length > 0 && <Badge bg="danger" pill className="ms-1">{cart.reduce((sum, item) => sum + item.quantity, 0)}</Badge>}</Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-4"><Card.Body>
        <div className="row g-3">
          <div className="col-md-6"><InputGroup><Form.Control placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /><Button variant="warning" onClick={() => setSearchQuery('')}><FaSearch /></Button></InputGroup></div>
          <div className="col-md-3"><Form.Select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>{categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}</Form.Select></div>
          <div className="col-md-3"><Form.Select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}><option value="default">Sort By</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="discount">Best Discount</option></Form.Select></div>
        </div>
      </Card.Body></Card>

      {/* Products Grid - Fixed Version */}
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="col">
            <Card className="h-100 shadow-sm d-flex flex-column">
              <div className="position-relative" style={{ height: '250px', overflow: 'hidden' }}>
                <Card.Img
                  variant="top"
                  src={getProductImage(product)}
                  alt={product.name}
                  style={{
                    height: '100%',
                    width: '100%',
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleViewDetails(product)}
                />
                {product.remaining_quantity <= 5 && product.remaining_quantity > 0 && (
                  <Badge bg="warning" className="position-absolute top-0 end-0 m-2">
                    Only {product.remaining_quantity} left
                  </Badge>
                )}
              </div>
              <Card.Body className="flex-grow-1 d-flex flex-column">
                <Card.Title
                  className="h6 cursor-pointer fw-bold"
                  onClick={() => handleViewDetails(product)}
                  style={{ cursor: 'pointer' }}
                >
                  {product.name}
                </Card.Title>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold text-danger">₹{parseFloat(product.original_price).toFixed(1)}</span>
                  {parseFloat(product.strikethrough_price) > parseFloat(product.original_price) && (
                    <small className="text-muted text-decoration-line-through">
                      ₹{parseFloat(product.strikethrough_price).toFixed(2)}
                    </small>
                  )}
                </div>
                {parseFloat(product.strikethrough_price) > parseFloat(product.original_price) && (
                  <Alert variant="success" className="mb-0 py-2 mt-auto">
                    Saved ₹{getSavingsAmount(product)}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-5"><FaSearch className="text-muted mb-3" size={48} /><h4>No products found</h4><Button variant="danger" onClick={clearAllFilters}>Clear Filters</Button></div>
      )}
    </div>
  );
};

export default ProductPage;