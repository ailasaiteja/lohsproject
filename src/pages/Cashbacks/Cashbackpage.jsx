import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import {
  FaMoneyBillWave, FaArrowLeft, FaPercentage, FaUserCheck,
  FaShoppingBag, FaCoins, FaSearch, FaFilter,
  FaStar, FaUser, FaUsers, FaFileUpload, FaWallet,
  FaCheckCircle, FaRupeeSign, FaTimes, FaPhone, FaTicketAlt,
  FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaEye,
  FaShoppingCart, FaTag, FaTrophy, FaBullhorn, FaPlusCircle,
  FaExclamationTriangle, FaArrowRight, FaIdCard,
  FaPlus, FaMinus, FaInfoCircle, FaQuestionCircle,
  FaArrowDown, FaArrowUp, FaGasPump, FaUserPlus,
  FaCrown, FaMedal, FaAward, FaGift, FaClock, FaCreditCard,
  FaSync, FaMobile
} from 'react-icons/fa';
import { fetchActiveCashbacks, getCashbackDetails, purchaseCashback } from './cashbakApi';
import { customerApi } from '../MyCustomers/customerApi';
import LoadingToast from "../loading/LoadingToast";
import { useToast } from '../toast/ToastContext';
import { Modal, Button, Card, Form, InputGroup, Badge, Alert } from 'react-bootstrap';

const CashbackPage = ({ user }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { makePurchase, addCommission, walletState } = useWallet();

  // Get logged user details from localStorage
  const userId = localStorage.getItem("user_id");
  const userType = localStorage.getItem("user_type")?.toLowerCase();
  const userData = JSON.parse(localStorage.getItem("user_data") || "{}");

  // API Data States
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  // UI States
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedOfferDetails, setSelectedOfferDetails] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [billAmount, setBillAmount] = useState('');
  const [billFile, setBillFile] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [offerSearch, setOfferSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [validationErrors, setValidationErrors] = useState({});

  // Bill range validation states (same as MyCashback)
  const [minBillAmount, setMinBillAmount] = useState(0);
  const [maxBillAmount, setMaxBillAmount] = useState(0);
  const [categoryTitle, setCategoryTitle] = useState('');

  // Dropdown states
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);

  // Success data
  const [purchaseSuccessData, setPurchaseSuccessData] = useState(null);

  // Customers state - from API
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customersError, setCustomersError] = useState(null);

  // Refs to prevent duplicate toasts
  const hasShownInitialToast = useRef(false);
  const isInitialMount = useRef(true);

  // Helper function to convert file to base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Helper function to validate bill amount (same as MyCashback)
  const validateBillAmountValue = (amount, minAmount, maxAmount) => {
    if (!amount || amount === '') return null;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) return 'Please enter a valid amount';
    if (amountNum < minAmount) {
      return `Amount must be at least ₹${minAmount?.toLocaleString()}`;
    }
    if (maxAmount > 0 && amountNum > maxAmount) {
      return `Amount cannot exceed ₹${maxAmount?.toLocaleString()}`;
    }
    return null;
  };

  // Fetch customers from API
  const fetchCustomersFromAPI = async (showToast = false) => {
    if (userType !== 'agent') return;

    setLoadingCustomers(true);
    setCustomersError(null);

    try {
      console.log('Fetching customers for agent...');
      const response = await customerApi.getCustomers();
      console.log('API Customers response:', response);

      if (response && Array.isArray(response)) {
        const transformedCustomers = response.map(customer => {
          const firstName = customer.first_name || '';
          const lastName = customer.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim();
          
          return {
            id: customer.id,
            name: fullName || 'Unknown',
            displayName: fullName || 'Customer',
            firstName: firstName,
            lastName: lastName,
            phone: customer.phone_number || customer.phone || '',
            email: customer.email || '',
            district: customer.city || customer.district || '',
            totalELP: customer.total_elp || 0,
            totalECB: customer.total_ecb || 0,
            avatar: (firstName ? firstName.charAt(0).toUpperCase() : 'C') +
              (lastName ? lastName.charAt(0).toUpperCase() : 'U'),
            tagged_agent: customer.tagged_agent,
            creator_info: customer.creator_info,
            is_active: customer.is_active,
            status: customer.status,
            date_of_birth: customer.date_of_birth,
            state: customer.state,
            city: customer.city
          };
        });

        console.log(`Transformed ${transformedCustomers.length} customers`);
        setCustomers(transformedCustomers);

        if (showToast) {
          try {
            localStorage.setItem('flh_customers_api', JSON.stringify(transformedCustomers));
          } catch (e) {
            console.error('Error saving to localStorage:', e);
          }
        }
      } else {
        console.log('No customers found from API');
        setCustomers([]);
        if (showToast) {
          toast.info('No Customers', 'No customers found. Please add customers first.');
        }
        try {
          const saved = localStorage.getItem('flh_customers_api');
          if (saved) {
            const parsed = JSON.parse(saved);
            setCustomers(parsed);
            console.log(`Loaded ${parsed.length} customers from localStorage backup`);
          }
        } catch (e) {
          console.error('Error loading from localStorage:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomersError('Failed to load customers');
      if (showToast) {
        toast.error('Error', 'Failed to load customers');
      }
      try {
        const saved = localStorage.getItem('flh_customers_api');
        if (saved) {
          const parsed = JSON.parse(saved);
          setCustomers(parsed);
          console.log(`Loaded ${parsed.length} customers from localStorage backup`);
        }
      } catch (e) {
        console.error('Error loading from localStorage:', e);
      }
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchData = async (showToast = false) => {
    setLoading(true);
    setError(null);
    try {
      const offersResponse = await fetchActiveCashbacks();
      const transformedOffers = transformOffersData(offersResponse);
      setOffers(transformedOffers);
      const uniqueCategories = [...new Set(transformedOffers.map(offer => offer.category))];
      setCategories(uniqueCategories);

      if (showToast && transformedOffers.length > 0 && !hasShownInitialToast.current) {
        hasShownInitialToast.current = true;
      } else if (showToast && transformedOffers.length === 0) {
        toast.info('No Offers', 'No cashback offers available at the moment');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load cashback offers. Please try again.');
      if (showToast) {
        toast.error('Error', 'Failed to load cashback offers');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOfferDetails = async (offerId) => {
    setLoadingDetails(true);
    try {
      const details = await getCashbackDetails(offerId);
      if (details) {
        // Update bill range validation values from API (same as MyCashback)
        setMinBillAmount(parseFloat(details.minimum_purchase_amount) || 0);
        setMaxBillAmount(parseFloat(details.max_winning_amount) || 0);
        setCategoryTitle(details.earn_cashback_category || 'General');
      }
      return details;
    } catch (err) {
      console.error('Error fetching offer details:', err);
      toast.error('Error', 'Failed to load offer details');
      return null;
    } finally {
      setLoadingDetails(false);
    }
  };

  const transformOffersData = (apiOffers) => {
    if (!Array.isArray(apiOffers)) return [];

    return apiOffers.map(offer => ({
      id: offer.id,
      name: offer.title || offer.name || 'Unnamed Offer',
      category: offer.earn_cashback_category || offer.category || 'General',
      icon: getCategoryIcon(offer.earn_cashback_category || offer.category),
      color: getCategoryColor(offer.earn_cashback_category || offer.category),
      ticketPrice: parseFloat(offer.ticket_price) || 0,
      termAmount: parseFloat(offer.minimum_purchase_amount) || 0,
      maxBillAmount: parseFloat(offer.max_winning_amount) || 0,
      validity: offer.validity_days ? `${offer.validity_days} days` : (offer.validity || '30 days'),
      endDate: formatDate(offer.end_date),
      announceDate: formatDate(offer.announcement_date || offer.start_date),
      winnerCount: offer.prizes_count ? offer.prizes_count : 0,
      description: offer.description || 'No description available',
      howItWorks: offer.how_it_works || [
        'Purchase this cashback ticket',
        'Make the qualifying purchase',
        'Upload your bill within 24 hours',
        'Get cashback credited to your wallet'
      ],
      terms: offer.terms_conditions || 'Terms and conditions apply',
      usage: offer.total_purchases || 0,
      status: offer.status || 'active',
      features: offer.features || ['Instant cashback', 'Quick processing'],
      eligibility: offer.eligibility_criteria || 'All customers',
      cashbackPercentage: parseFloat(offer.cashback_percentage) || 0,
      maxCashback: parseFloat(offer.max_cashback) || 0,
      maxWinningAmount: parseFloat(offer.max_winning_amount) || 0,
      minPurchase: parseFloat(offer.min_purchase) || 0,
      stockAvailable: offer.stock_available || 999,
      isFeatured: offer.is_featured || false,
      prizes: offer.prizes || []
    }));
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'T1': <FaShoppingBag />,
      'T2': <FaCoins />,
      'T3': <FaGasPump />,
      'Shopping': <FaShoppingBag />,
      'Bills': <FaCoins />,
      'Automobile': <FaGasPump />,
      'Travel': <FaMoneyBillWave />,
      'Food': <FaShoppingCart />,
      'Electronics': <FaShoppingBag />,
      'Fashion': <FaTag />,
      'Groceries': <FaShoppingCart />,
      'Fuel': <FaGasPump />,
      'default': <FaMoneyBillWave />
    };
    return icons[category] || icons.default;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'T1': '#f56565',
      'T2': '#4299e1',
      'T3': '#9f7aea',
      'Shopping': '#f56565',
      'Bills': '#4299e1',
      'Automobile': '#9f7aea',
      'Travel': '#48bb78',
      'Food': '#ed8936',
      'Electronics': '#f56565',
      'Fashion': '#f56565',
      'Groceries': '#ed8936',
      'Fuel': '#9f7aea',
      'default': '#c42b2b'
    };
    return colors[category] || colors.default;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatPrizeValue = (prize) => {
    if (prize.prize_value && prize.prize_value.toString().includes('%')) {
      return prize.prize_value;
    }
    return `₹${prize.prize_value}`;
  };

  const getPositionDisplay = (position) => {
    if (position === 1) return '1st';
    if (position === 2) return '2nd';
    if (position === 3) return '3rd';
    return `${position}th`;
  };

  const getPositionIcon = (position) => {
    if (position === 1) return <FaCrown size={24} />;
    if (position === 2) return <FaMedal size={24} />;
    if (position === 3) return <FaMedal size={24} />;
    return <FaAward size={24} />;
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.name.toLowerCase().includes(offerSearch.toLowerCase()) ||
      offer.description.toLowerCase().includes(offerSearch.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || offer.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredCustomers = customers.filter(customer => {
    if (!customer) return false;
    const searchLower = customerSearch.toLowerCase();
    const searchText = [
      customer.displayName || customer.name || '',
      customer.firstName || '',
      customer.lastName || '',
      customer.email || '',
      customer.phone || '',
      customer.district || ''
    ].join(' ').toLowerCase();
    return searchLower === '' || searchText.includes(searchLower);
  });

  const calculateELP = (amount) => Math.max(1, Math.floor(amount / 100));
  const calculateECB = (amount) => Math.floor(amount * 0.01);

  const handleViewDetails = async (offer) => {
    setSelectedOffer(offer);
    setTicketQuantity(1);
    setBillAmount('');
    setBillFile(null);
    setValidationErrors({});
    setShowDetailsModal(true);
    
    // Set bill range from offer data (same as MyCashback)
    setMinBillAmount(offer.termAmount || 0);
    setMaxBillAmount(offer.maxBillAmount || 0);
    setCategoryTitle(offer.category || 'General');
    
    const details = await fetchOfferDetails(offer.id);
    if (details) {
      setSelectedOfferDetails(details);
      // Update bill range from API response (same as MyCashback)
      setMinBillAmount(parseFloat(details.minimum_purchase_amount) || offer.termAmount || 0);
      setMaxBillAmount(parseFloat(details.max_winning_amount) || offer.maxBillAmount || 0);
      setCategoryTitle(details.earn_cashback_category || offer.category || 'General');
    } else {
      setSelectedOfferDetails(offer);
    }
  };

  const handleBuyNow = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        state: {
          redirectTo: window.location.pathname,
        },
      });
      return;
    }

    setShowDetailsModal(false);
    if (userType === "customer") {
      const firstName = userData.first_name || '';
      const lastName = userData.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      const loggedCustomer = {
        id: userId,
        name: fullName || userData.name || 'Customer',
        displayName: fullName || userData.name || 'Customer',
        firstName: firstName,
        lastName: lastName,
        avatar: (firstName ? firstName.charAt(0).toUpperCase() : 'C') +
          (lastName ? lastName.charAt(0).toUpperCase() : 'U'),
        phone: userData.phone || userData.phone_number || '',
        email: userData.email || ''
      };
      setSelectedCustomer(loggedCustomer);
      setTimeout(() => {
        setShowConfirmModal(true);
      }, 100);
    } else if (userType === "agent") {
      setShowCustomerModal(true);
      if (customers.length === 0 && !loadingCustomers) {
        fetchCustomersFromAPI(false);
      }
    } else {
      toast.error('Error', 'User type not recognized');
    }
  };

  const handleCustomerSelect = (customer) => {
    console.log('Customer selected:', customer);
    const selectedCustomerData = {
      ...customer,
      name: customer.displayName || customer.name || 'Customer',
      displayName: customer.displayName || customer.name || 'Customer'
    };
    setSelectedCustomer(selectedCustomerData);
    setShowCustomerModal(false);
    setTimeout(() => {
      setShowConfirmModal(true);
    }, 300);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('File Too Large', 'File size should be less than 5MB');
        return;
      }
      setBillFile(file);
      setValidationErrors(prev => ({ ...prev, billFile: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const billAmountNum = parseFloat(billAmount);
    const currentMinAmount = minBillAmount || selectedOffer?.termAmount || 0;
    const currentMaxAmount = maxBillAmount || selectedOffer?.maxBillAmount || 0;
    
    if (!billAmount) {
      errors.billAmount = 'Bill amount is required';
    } else if (isNaN(billAmountNum)) {
      errors.billAmount = 'Please enter a valid amount';
    } else if (billAmountNum < currentMinAmount) {
      errors.billAmount = `Amount must be at least ₹${currentMinAmount.toLocaleString()}`;
    } else if (currentMaxAmount > 0 && billAmountNum > currentMaxAmount) {
      errors.billAmount = `Amount cannot exceed ₹${currentMaxAmount.toLocaleString()}`;
    }
    
    if (!billFile) {
      errors.billFile = 'Please upload a bill';
    }
    
    setValidationErrors(errors);
    
    // Only show toast for file validation, not for bill amount
    if (errors.billFile && !errors.billAmount) {
      toast.warning('Validation Error', 'Please upload a bill');
    }
    
    return Object.keys(errors).length === 0;
  };

  const handleConfirmAddFunds = () => {
    setShowAddFundsModal(false);
    navigate('/home');
  };

  const handleConfirmPurchase = async () => {
    console.log('Selected Customer:', selectedCustomer);
    console.log('Selected Offer:', selectedOffer);

    if (!selectedCustomer || !selectedOffer) {
      toast.error('Error', 'Please select a customer and offer first');
      return;
    }

    const customerName = selectedCustomer.displayName || selectedCustomer.name || 'Customer';
    const customerPhone = selectedCustomer.phone || '';
    const customerId = selectedCustomer.id;

    if (!validateForm()) {
      return;
    }

    const totalCost = selectedOffer.ticketPrice * ticketQuantity;

    if (walletState.balance < totalCost) {
      toast.warning('Insufficient Balance', `Need ₹${totalCost - walletState.balance} more to complete purchase`);
      setShowAddFundsModal(true);
      return;
    }

    setIsProcessing(true);

    try {
      let base64Bill = null;
      let fileType = null;
      let fileName = null;

      if (billFile) {
        fileType = billFile.type;
        fileName = billFile.name;
        base64Bill = await convertFileToBase64(billFile);
        console.log('File converted to base64, length:', base64Bill.length);
      }

      const payload = {
        bill_price: parseFloat(billAmount).toString(),
        tickets_requested: ticketQuantity.toString(),
        earn_cashback_id: selectedOffer.id,
        bill_image: base64Bill,
        bill_image_type: fileType,
        bill_image_name: fileName,
        bill_document: base64Bill,
        purchase_date: new Date().toISOString()
      };

      console.log('Sending JSON payload:', {
        ...payload,
        bill_image: payload.bill_image ? `Base64 data (${payload.bill_image.length} chars)` : null
      });

      const purchaseResponse = await purchaseCashback(selectedOffer.id, payload);
      console.log('Purchase API Response:', purchaseResponse);

      // Handle API validation error response (same as MyCashback)
      if (purchaseResponse && purchaseResponse.error) {
        if (purchaseResponse.error_code === 'INVALID_BILL_PRICE' && purchaseResponse.details) {
          const { min_price, max_price, category_title } = purchaseResponse.details;
          
          const minPriceFormatted = parseFloat(min_price).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          const maxPriceFormatted = parseFloat(max_price).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          
          setValidationErrors(prev => ({
            ...prev,
            billAmount: `Amount must be between ₹${minPriceFormatted} and ₹${maxPriceFormatted} for category '${category_title}'`
          }));
          
          setIsProcessing(false);
          return;
        }
        
        throw new Error(purchaseResponse.error || purchaseResponse.message || 'Purchase failed');
      }

      let isSuccess = false;
      let tickets = [];
      let responseData = purchaseResponse;

      if (purchaseResponse) {
        if (purchaseResponse.success === true) {
          isSuccess = true;
          tickets = purchaseResponse.tickets || purchaseResponse.data?.tickets || [];
          responseData = purchaseResponse.data || purchaseResponse;
        }
        else if (purchaseResponse.data && purchaseResponse.data.success === true) {
          isSuccess = true;
          tickets = purchaseResponse.data.tickets || [];
          responseData = purchaseResponse.data;
        }
        else if (purchaseResponse.tickets && Array.isArray(purchaseResponse.tickets) && purchaseResponse.tickets.length > 0) {
          isSuccess = true;
          tickets = purchaseResponse.tickets;
        }
        else if (purchaseResponse.status === 'success' || purchaseResponse.status === 'SUCCESS' || purchaseResponse.status === 200) {
          isSuccess = true;
          tickets = purchaseResponse.tickets || purchaseResponse.data?.tickets || [];
        }
        else if (purchaseResponse.id && !purchaseResponse.error) {
          isSuccess = true;
          tickets = purchaseResponse.tickets || [];
        }
      }

      if (!isSuccess) {
        const errorMsg = purchaseResponse?.message || purchaseResponse?.error || 'Insufficient user wallet balance';
        throw new Error(errorMsg);
      }

      const walletTransactionId = tickets[0]?.wallet_transaction_id;
      const ecbTransactionId = tickets[0]?.ecb_transaction_id;
      const ticketNumbers = tickets.map(ticket => ticket.ticket_number || ticket.ticketNumber).filter(Boolean).join(', ');
      const purchaseMessage = purchaseResponse.message || purchaseResponse.data?.message || 'Purchase successful';

      const purchaseResult = makePurchase(
        totalCost,
        'cashback',
        `${selectedOffer.name} (${ticketQuantity} tickets) - Bill: ₹${billAmount}`,
        customerName
      );

      const commissionEarned = totalCost * 0.05;
      if (userType === "agent") {
        addCommission(
          commissionEarned,
          selectedOffer.name,
          'Cashback Ticket Commission'
        );
      }

      const transactionId = purchaseResult.transactionId;
      const cashbackId = `CASHBACK-${Date.now()}`;
      const elpEarned = calculateELP(totalCost);
      const ecbEarned = calculateECB(totalCost);
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const cashbackPurchase = {
        id: cashbackId,
        transactionId: transactionId,
        apiPurchaseId: responseData?.id || purchaseResponse?.id || null,
        apiTickets: tickets,
        walletTransactionId: walletTransactionId,
        ecbTransactionId: ecbTransactionId,
        ticketNumbers: ticketNumbers,
        purchaseMessage: purchaseMessage,
        type: 'cashback',
        customerId: customerId,
        customerName: customerName,
        customerPhone: customerPhone,
        offerId: selectedOffer.id,
        offerName: selectedOffer.name,
        ticketQuantity: ticketQuantity,
        category: selectedOffer.category,
        ticketPrice: selectedOffer.ticketPrice,
        totalTicketPrice: totalCost,
        billAmount: parseFloat(billAmount),
        commissionEarned: commissionEarned,
        billFile: billFile ? billFile.name : null,
        date: new Date().toISOString(),
        purchaseDate: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: 'completed',
        validity: selectedOffer.validity,
        walletBalanceBefore: walletState.balance,
        walletBalanceAfter: walletState.balance - totalCost,
        amount: totalCost,
        description: `${selectedOffer.name} Cashback Ticket`,
        expiryDate: expiryDate,
        daysRemaining: 30,
        isExpired: false,
        elpEarned: elpEarned,
        ecbEarned: ecbEarned
      };

      const savedCashbacks = JSON.parse(localStorage.getItem('flh_cashbacks') || '[]');
      savedCashbacks.push(cashbackPurchase);
      localStorage.setItem('flh_cashbacks', JSON.stringify(savedCashbacks));

      const cashbackTransaction = {
        id: Date.now(),
        transactionId: transactionId,
        apiPurchaseId: responseData?.id || purchaseResponse?.id || null,
        walletTransactionId: walletTransactionId,
        ecbTransactionId: ecbTransactionId,
        ticketNumbers: ticketNumbers,
        type: 'cashback',
        category: 'cashback',
        amount: totalCost,
        customer: customerId,
        customerId: customerId,
        customerName: customerName,
        customerPhone: customerPhone,
        description: `${selectedOffer.name} Cashback Ticket`,
        elpEarned: elpEarned,
        ecbEarned: ecbEarned,
        date: new Date().toISOString(),
        cashbackId: cashbackId,
        status: 'completed',
        purchaseDate: new Date().toLocaleDateString('en-IN'),
        expiryDate: expiryDate,
        ticketQuantity: ticketQuantity,
        billAmount: parseFloat(billAmount),
        offerName: selectedOffer.name
      };

      const savedTransactions = JSON.parse(localStorage.getItem('flh_transactions') || '[]');
      savedTransactions.push(cashbackTransaction);
      localStorage.setItem('flh_transactions', JSON.stringify(savedTransactions));

      const updatedCustomers = customers.map(c => {
        if (c.id === customerId) {
          const cashbackHistory = c.cashbackHistory || [];
          return {
            ...c,
            purchases: (c.purchases || 0) + ticketQuantity,
            totalSpent: (c.totalSpent || 0) + totalCost,
            lastPurchase: new Date().toISOString(),
            cashbackHistory: [
              ...cashbackHistory,
              {
                id: cashbackId,
                transactionId: transactionId,
                apiPurchaseId: responseData?.id || purchaseResponse?.id || null,
                ticketNumbers: ticketNumbers,
                offerName: selectedOffer.name,
                ticketCount: ticketQuantity,
                amount: totalCost,
                date: new Date().toISOString(),
                purchaseDate: new Date().toLocaleDateString('en-IN'),
                expiryDate: expiryDate
              }
            ],
            totalELP: (c.totalELP || 0) + elpEarned,
            totalECB: (c.totalECB || 0) + ecbEarned,
            lastUpdated: new Date().toISOString()
          };
        }
        return c;
      });

      localStorage.setItem('flh_customers', JSON.stringify(updatedCustomers));
      setCustomers(updatedCustomers);

      setPurchaseSuccessData({
        transactionId: transactionId,
        apiPurchaseId: responseData?.id || purchaseResponse?.id || null,
        walletTransactionId: walletTransactionId,
        ecbTransactionId: ecbTransactionId,
        ticketNumbers: ticketNumbers,
        purchaseMessage: purchaseMessage,
        customerName: customerName,
        offerName: selectedOffer.name,
        ticketQuantity: ticketQuantity,
        ticketPrice: selectedOffer.ticketPrice,
        totalTicketPrice: totalCost,
        billAmount: parseFloat(billAmount),
        commissionEarned: commissionEarned,
        date: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        walletBalanceAfter: walletState.balance - totalCost,
        cashbackId: cashbackId,
        elpEarned: elpEarned,
        ecbEarned: ecbEarned,
        offerColor: selectedOffer.color
      });

      setShowConfirmModal(false);
      setIsProcessing(false);

      toast.success('Purchase Successful', purchaseMessage);
      window.dispatchEvent(new Event("wallet-updated"));

      setTimeout(() => {
        setShowSuccessModal(true);
      }, 300);

    } catch (error) {
      setIsProcessing(false);
      console.error('Purchase error:', error);

      let errorMessage = 'Error processing purchase. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      if (!errorMessage.includes('must be between')) {
        toast.error('Purchase Failed', errorMessage);
      }
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setPurchaseSuccessData(null);
    setSelectedOffer(null);
    setSelectedOfferDetails(null);
    setSelectedCustomer(null);
    setBillAmount('');
    setBillFile(null);
    setTicketQuantity(1);
    setValidationErrors({});
    fetchData(false);
  };

  const handleBuyAnother = () => {
    setShowSuccessModal(false);
    setPurchaseSuccessData(null);
    setSelectedOffer(null);
    setSelectedOfferDetails(null);
    setSelectedCustomer(null);
    setBillAmount('');
    setBillFile(null);
    setTicketQuantity(1);
    setValidationErrors({});
  };

  const isPayButtonEnabled = () => {
    const billAmountNum = parseFloat(billAmount);
    const currentMinAmount = minBillAmount || selectedOffer?.termAmount || 0;
    const currentMaxAmount = maxBillAmount || selectedOffer?.maxBillAmount || 0;
    
    if (!billAmount) return false;
    if (!billFile) return false;
    if (isNaN(billAmountNum)) return false;
    if (billAmountNum < currentMinAmount) return false;
    if (currentMaxAmount > 0 && billAmountNum > currentMaxAmount) return false;
    if (walletState.balance < (selectedOffer?.ticketPrice * ticketQuantity)) return false;
    if (isProcessing) return false;
    if (validationErrors.billAmount) return false;
    return true;
  };

  const OfferCard = ({ offer }) => {
    return (
      <div className="card h-100 border-0 shadow-sm hover-shadow" style={{ borderRadius: '12px' }}>
        <div className="card-body d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div className="d-flex align-items-center">
              <div
                className="rounded p-2 me-3"
                style={{ backgroundColor: `${offer.color}20`, color: offer.color, fontSize: '20px' }}
              >
                {offer.icon}
              </div>
              <div>
                <h6 className="fw-bold mb-1" style={{ fontSize: '1.1rem' }}>{offer.name}</h6>
                <div className="d-flex align-items-center gap-2">
                  {offer.cashbackPercentage > 0 && (
                    <span className="badge bg-success bg-opacity-10 text-success">
                      {offer.cashbackPercentage}% Cashback
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row g-1 mb-4">
            <div className="col-6">
              <div className="text-center">
                <div className="text-muted small mb-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                  TICKET PRICE
                </div>
                <div className="fw-bold" style={{
                  fontSize: '1.65rem',
                  color: offer.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaRupeeSign style={{ fontSize: '0.9rem', marginRight: '2px' }} />
                  {offer.ticketPrice}
                </div>
              </div>
            </div>

            <div className="col-6">
              <div className="text-center">
                <div className="text-muted small mb-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                  END DATE
                </div>
                <div className="fw-bold" style={{ fontSize: '0.9rem' }}>
                  <FaCalendarAlt className="me-1" style={{ fontSize: '0.8rem' }} />
                  {offer.endDate}
                </div>
              </div>
            </div>

            <div className="col-6">
              <div className="text-center">
                <div className="text-muted small mb-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                  ANNOUNCE DATE
                </div>
                <div className="fw-bold" style={{ fontSize: '0.9rem' }}>
                  <FaCalendarAlt className="me-1" style={{ fontSize: '0.8rem' }} />
                  {offer.announceDate}
                </div>
              </div>
            </div>

            <div className="col-6">
              <div className="text-center">
                <div className="text-muted small mb-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                  WINNERS
                </div>
                <div className="fw-bold" style={{ fontSize: '0.9rem' }}>
                  <FaTrophy className="me-1" style={{ fontSize: '0.8rem' }} />
                  {offer.winnerCount}
                </div>
              </div>
            </div>
          </div>

          {offer.stockAvailable && offer.stockAvailable < 50 && (
            <div className="mb-3">
              <span className="badge bg-warning text-dark">
                Only {offer.stockAvailable} left!
              </span>
            </div>
          )}

          <div className="mt-auto">
            <button
              className="bg-danger text-white w-100 py-2 rounded shadow-sm border-0 hover-shadow"
              onClick={() => handleViewDetails(offer)}
            >
              <FaEye className="me-2" />
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Fetch data on component mount
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (isMounted) {
        await fetchData(true);
        if (userType === 'agent') {
          await fetchCustomersFromAPI(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <LoadingToast show={loading} message="Loading cashback offers..." />;
  }

  if (error && offers.length === 0) {
    return (
      <div className="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <FaExclamationTriangle className="mb-3 text-danger" size={40} />
          <h5 className="text-danger">Error Loading Offers</h5>
          <p className="text-muted mb-3">{error}</p>
          <button
            className="btn btn-danger"
            onClick={() => fetchData(true)}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid bg-light min-vh-100 p-3">
      <LoadingToast show={loadingDetails} message="Loading details..." />

      <div className="mb-4">
        <div className="d-flex gap-3 mb-4">
          <button className="btn btn-outline-warning btn-sm" onClick={() => {
            navigate("/home");
          }}>
            <FaArrowLeft className="me-2" />
            Dashboard
          </button>
        </div>

        <div className="mb-4">
          <h2 className="fw-bold mb-2 text-danger d-flex align-items-center">
            <FaMoneyBillWave className="me-2 text-danger" />
            Earn Cashback
          </h2>
        </div>
      </div>

      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body p-3">
          <div className="row g-2">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-danger text-white border-0">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control border-0 shadow-none"
                  placeholder="Search cashbacks by name or description..."
                  value={offerSearch}
                  onChange={(e) => setOfferSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-danger text-white border-0">
                  <FaFilter />
                </span>
                <select
                  className="form-select border-0 shadow-none"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {filteredOffers.length === 0 ? (
          <div className="col-12 text-center py-5">
            <FaMoneyBillWave className="text-muted fs-1 mb-3 opacity-50" />
            <h5 className="text-muted mb-3">No offers found</h5>
            <p className="text-muted">Try adjusting your search or filter</p>
          </div>
        ) : (
          filteredOffers.map(offer => (
            <div className="col-md-6 col-lg-4 mb-3" key={offer.id}>
              <OfferCard offer={offer} />
            </div>
          ))
        )}
      </div>

      {/* Offer Details Modal */}
      {showDetailsModal && selectedOffer && (
        <Modal show={showDetailsModal} onHide={() => {
          setShowDetailsModal(false);
          setValidationErrors({});
          setBillAmount('');
          setBillFile(null);
        }} size="lg" centered scrollable>
          <Modal.Header closeButton>
            <Modal.Title className="d-flex align-items-center">
              <div
                className="rounded p-2 me-3"
                style={{ background: selectedOffer.color, color: 'white', fontSize: '20px' }}
              >
                {selectedOffer.icon}
              </div>
              <div>
                <div className="fw-bold">{selectedOffer.name}</div>
              </div>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {loadingDetails ? (
              <LoadingToast show={loadingDetails} />
            ) : (
              <>
                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <div className="card h-100 border-0 bg-light">
                      <div className="card-body text-center">
                        <FaMoneyBillWave className="text-primary fs-3 mb-2" />
                        <div className="text-muted small">Ticket Price</div>
                        <div className="fw-bold fs-5" style={{ color: selectedOffer.color }}>
                          ₹{selectedOffer.ticketPrice}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card h-100 border-0 bg-light">
                      <div className="card-body text-center">
                        <FaCalendarAlt className="text-info fs-3 mb-2" />
                        <div className="text-muted small">Start Date</div>
                        <div className="fw-bold fs-5 text-success">{selectedOffer.announceDate}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card h-100 border-0 bg-light">
                      <div className="card-body text-center">
                        <FaClock className="text-danger fs-3 mb-2" />
                        <div className="text-muted small">End Date</div>
                        <div className="fw-bold fs-5">{selectedOffer.endDate}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card h-100 border-0 bg-light">
                      <div className="card-body text-center">
                        <FaTrophy className="text-warning fs-3 mb-2" />
                        <div className="text-muted small">Total Winners</div>
                        <div className="fw-bold fs-4">{selectedOfferDetails?.prizes?.length || selectedOffer.winnerCount}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {(selectedOffer.cashbackPercentage > 0 || selectedOffer.maxWinningAmount > 0) && (
                  <div className="row g-4 mb-4">
                    {selectedOffer.cashbackPercentage > 0 && (
                      <div className="col-md-6">
                        <div className="card h-100 border-0 bg-light">
                          <div className="card-body text-center">
                            <FaPercentage className="text-success fs-3 mb-2" />
                            <div className="text-muted small">Cashback Rate</div>
                            <div className="fw-bold fs-5 text-success">{selectedOffer.cashbackPercentage}%</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedOffer.maxWinningAmount > 0 && (
                      <div className={selectedOffer.cashbackPercentage > 0 ? "col-md-6" : "col-md-12"}>
                        <div className="card h-100 border-0 bg-success bg-opacity-10">
                          <div className="card-body text-center">
                            <FaTrophy className="text-warning fs-3 mb-2" />
                            <div className="text-muted small">Max Winning Amount</div>
                            <div className="fw-bold fs-4 text-success">
                              ₹{selectedOffer.maxWinningAmount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-4">
                  <h6 className="fw-bold mb-3 d-flex align-items-center">
                    <FaInfoCircle className="me-2 text-primary" />
                    Description
                  </h6>
                  <div className="bg-light rounded p-3">
                    <p className="mb-0">{selectedOffer.description}</p>
                  </div>
                </div>

                {selectedOfferDetails?.prizes && selectedOfferDetails.prizes.length > 0 && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3 d-flex align-items-center">
                      <FaMedal className="me-2 text-warning" />
                      Prize Details
                    </h6>
                    <div className="row g-3">
                      {selectedOfferDetails.prizes.map((prize, index) => {
                        const position = prize.winning_position || index + 1;
                        return (
                          <div key={prize.id || index} className="col-md-6 col-lg-4">
                            <div className="card h-100 border-0 shadow-sm">
                              <div className="card-body text-center">
                                <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-3 ${position <= 3 ? 'bg-warning' : 'bg-secondary'}`}
                                  style={{ width: '60px', height: '60px', color: 'white' }}>
                                  {getPositionIcon(position)}
                                </div>
                                <div className="fw-bold fs-5 mb-1">
                                  {getPositionDisplay(position)} Prize
                                </div>
                                <div className="fw-bold text-success">
                                  {formatPrizeValue(prize)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <h6 className="fw-bold mb-3">
                    <FaExclamationTriangle className="me-2 text-danger" />
                    How It Works
                  </h6>
                  <div className="bg-light rounded p-3">
                    <ol className="mb-0">
                      {selectedOffer.howItWorks.map((step, index) => (
                        <li key={index} className="mb-2">{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline-primary" onClick={() => {
              setShowDetailsModal(false);
              setValidationErrors({});
              setBillAmount('');
              setBillFile(null);
            }}>
              Close
            </Button>
            <Button
              variant="danger"
              className='bg-danger'
              onClick={handleBuyNow}
              disabled={selectedOffer.stockAvailable <= 0 || loadingDetails}
            >
              <FaTicketAlt className="me-2" />
              {userType === "customer" ? "Buy Now" : "Buy now"}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Customer Selection Modal */}
      {showCustomerModal && selectedOffer && (
        <Modal show={showCustomerModal} onHide={() => {
          setShowCustomerModal(false);
          setCustomerSearch('');
        }} size="xl" centered>
          <Modal.Header closeButton className='bg-warning'>
            <Modal.Title className="fw-bold">
              <FaUsers className="me-2" />
              Select Customer for {selectedOffer.name}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4">
            <div className="card mb-4" style={{ borderLeft: `4px solid ${selectedOffer.color}` }}>
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="rounded p-2 me-3" style={{ background: selectedOffer.color, color: 'white' }}>
                    {selectedOffer.icon}
                  </div>
                  <div>
                    <div className="fw-bold">{selectedOffer.name}</div>
                    <small className="text-muted">Price: ₹{selectedOffer.ticketPrice.toLocaleString()} per ticket</small>
                  </div>
                </div>
              </div>
            </div>

            {!loadingCustomers && customers.length > 0 && (
              <div className="mb-4">
                <InputGroup className="shadow-sm">
                  <InputGroup.Text style={{ backgroundColor: selectedOffer.color, color: 'white', border: 'none' }}>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    size="lg"
                    placeholder="Search your customers by name or phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    style={{ border: 'none' }}
                  />
                </InputGroup>
              </div>
            )}

            <div className="d-flex justify-content-end mb-3">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  fetchCustomersFromAPI(true);
                }}
                disabled={loadingCustomers}
              >
                <FaSync className={`me-2 ${loadingCustomers ? 'fa-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {loadingCustomers ? (
              <LoadingToast show={loadingCustomers} />
            ) : customersError ? (
              <Alert variant="danger" className="text-center">
                <p>{customersError}</p>
                <Button variant="outline-primary" size="sm" onClick={() => fetchCustomersFromAPI(true)}>
                  Try Again
                </Button>
              </Alert>
            ) : customers.length === 0 ? (
              <div className="text-center py-5">
                <FaUsers className="text-muted mb-3" size={48} />
                <h5 className="text-muted mb-3">No customers found</h5>
                <p className="text-muted mb-4">You haven't referred any customers yet.</p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    navigate('/customer-signup');
                  }}
                  style={{ backgroundColor: selectedOffer.color, borderColor: selectedOffer.color }}
                >
                  <FaUserPlus className="me-2" /> Add Your First Customer
                </Button>
              </div>
            ) : (
              <>
                <div className="customer-list-container" style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  borderRadius: '10px',
                  border: '1px solid #e0e0e0'
                }}>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer, index) => (
                      <div
                        key={customer.id}
                        className={`p-3 ${index % 2 === 0 ? 'bg-white' : 'bg-light'}`}
                        style={{
                          borderBottom: '1px solid #f0f0f0',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          backgroundColor: selectedCustomer?.id === customer.id ? `${selectedOffer.color}20` : (index % 2 === 0 ? 'white' : '#f8f9fa')
                        }}
                        onClick={() => handleCustomerSelect(customer)}
                        onMouseEnter={(e) => {
                          if (selectedCustomer?.id !== customer.id) {
                            e.currentTarget.style.backgroundColor = '#e9ecef';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedCustomer?.id === customer.id) {
                            e.currentTarget.style.backgroundColor = `${selectedOffer.color}20`;
                          } else {
                            e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f8f9fa';
                          }
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm"
                            style={{
                              width: '45px',
                              height: '45px',
                              backgroundColor: selectedCustomer?.id === customer.id ? selectedOffer.color : '#6c757d',
                              color: 'white',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              flexShrink: 0
                            }}
                          >
                            {customer.avatar || (customer.name ? customer.name.charAt(0).toUpperCase() : 'C')}
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-bold">{customer.displayName || customer.name || 'Customer'}</div>
                            <div className="text-muted small">
                              <FaPhone className="me-1" size={10} />
                              {customer.phone || 'No phone'}
                            </div>
                          </div>
                          {selectedCustomer?.id === customer.id && (
                            <FaCheckCircle className="text-success ms-2" size={20} />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted text-center py-4">No customers match your search</p>
                  )}
                </div>

                <div className="text-center mt-3">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      navigate('/customer-signup');
                    }}
                    style={{ color: selectedOffer.color, borderColor: selectedOffer.color }}
                  >
                    <FaPlusCircle className="me-2" /> Add New Customer
                  </Button>
                </div>
              </>
            )}
          </Modal.Body>

          <Modal.Footer className="p-4">
            <Button variant="secondary" onClick={() => {
              setShowCustomerModal(false);
              setCustomerSearch('');
            }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                navigate('/customer-signup');
              }}
              disabled={loadingCustomers}
            >
              <FaUserPlus className="me-2" /> Add New Customer
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Confirmation Modal with Bill Price Validation (Same as MyCashback) */}
      {showConfirmModal && selectedOffer && selectedCustomer && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1070 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning">
                <h5 className="modal-title">
                  <FaCheckCircle className="me-2" />
                  Confirm Purchase
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedCustomer(null);
                    setValidationErrors({});
                    setBillAmount('');
                    setBillFile(null);
                  }}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="d-flex align-items-center mb-4 p-3 bg-light rounded">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: selectedOffer.color,
                      color: 'white',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }}
                  >
                    {selectedCustomer.avatar || (selectedCustomer.name ? selectedCustomer.name.charAt(0).toUpperCase() : 'C')}
                  </div>
                  <div>
                    <h5 className="text-bold" style={{ color: selectedOffer.color }}>{selectedOffer.name}</h5>
                    <div className="fw-bold mb-1">{selectedCustomer.displayName || selectedCustomer.name || 'Customer'}</div>
                    {selectedCustomer.phone && (
                      <small className="text-muted">
                        <FaPhone className="me-1" size={10} />
                        {selectedCustomer.phone}
                      </small>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Number of Tickets</h6>
                  <div className="card border-0 bg-light">
                    <div className="card-body text-center">
                      <div className="fw-bold fs-1 mb-3" style={{ color: selectedOffer.color }}>
                        {ticketQuantity}
                      </div>

                      <div className="d-flex justify-content-center align-items-center mb-3">
                        <button
                          className="btn btn-outline-secondary rounded-circle"
                          style={{ width: '50px', height: '50px', marginRight: '5px' }}
                          onClick={() => {
                            setTicketQuantity(prev => Math.max(1, prev - 1));
                          }}
                          disabled={ticketQuantity <= 1}
                        >
                          <FaMinus />
                        </button>

                        <div className="mx-4 text-muted">Tickets</div>

                        <button
                          className="btn btn-outline-secondary rounded-circle"
                          style={{ width: '50px', height: '50px' }}
                          onClick={() => {
                            setTicketQuantity(prev => prev + 1);
                          }}
                          disabled={ticketQuantity >= (selectedOffer.stockAvailable || 999)}
                        >
                          <FaPlus />
                        </button>
                      </div>

                      <div className="mt-4">
                        <div className="text-muted">Total Price</div>
                        <div className="fw-bold fs-4" style={{ color: selectedOffer.color }}>
                          ₹{(selectedOffer.ticketPrice * ticketQuantity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bill Amount Input with Validation - Same as MyCashback */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">
                    Bill Amount
                  </h6>
                  <InputGroup>
                    <InputGroup.Text>₹</InputGroup.Text>
                    <Form.Control 
                      type="number" 
                      placeholder={`Enter bill amount (₹${(minBillAmount || selectedOffer?.termAmount || 0).toLocaleString()} - ₹${(maxBillAmount || selectedOffer?.maxBillAmount || 0).toLocaleString()})`} 
                      value={billAmount} 
                      onChange={(e) => { 
                        const newValue = e.target.value;
                        setBillAmount(newValue);
                        
                        // Real-time validation (same as MyCashback)
                        const error = validateBillAmountValue(
                          newValue,
                          minBillAmount || selectedOffer?.termAmount || 0,
                          maxBillAmount || selectedOffer?.maxBillAmount || 0
                        );
                        setValidationErrors(prev => ({ ...prev, billAmount: error }));
                      }} 
                      min={minBillAmount || selectedOffer?.termAmount || 0}
                      max={maxBillAmount || selectedOffer?.maxBillAmount || 0}
                      isInvalid={!!validationErrors.billAmount}
                      className={validationErrors.billAmount ? 'is-invalid' : ''}
                    />
                  </InputGroup>
                  
                  {/* Error message for validation */}
                  {validationErrors.billAmount && (
                    <div className="text-danger small mt-2 d-flex align-items-center">
                      <FaExclamationTriangle className="me-1" />
                      {validationErrors.billAmount}
                    </div>
                  )}
                  
                  {/* Success message for valid amount */}
                  {billAmount && !validationErrors.billAmount && 
                   parseFloat(billAmount) >= (minBillAmount || selectedOffer?.termAmount || 0) && 
                   (maxBillAmount || selectedOffer?.maxBillAmount || 0) > 0 && 
                   parseFloat(billAmount) <= (maxBillAmount || selectedOffer?.maxBillAmount || 0) && (
                    <div className="text-success small mt-2 d-flex align-items-center">
                      <FaCheckCircle className="me-1" />
                      ✓ Valid bill amount
                    </div>
                  )}
                  
                  {/* Show the max limit info */}
                  {(maxBillAmount || selectedOffer?.maxBillAmount || 0) > 0 && (
                    <div className="text-muted small mt-2">
                      <FaInfoCircle className="me-1" />
                      Maximum allowed amount: ₹{(maxBillAmount || selectedOffer?.maxBillAmount || 0).toLocaleString()}
                    </div>
                  )}
                  
                  {/* Show when no max limit */}
                  {(!maxBillAmount && !selectedOffer?.maxBillAmount) && (
                    <div className="text-muted small mt-2">
                      <FaInfoCircle className="me-1" />
                      No maximum limit set for this category
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold mb-2">Upload Bill Proof</h6>
                  <div
                    className={`border-2 border-dashed rounded p-4 text-center cursor-pointer ${validationErrors.billFile ? 'border-danger' : billFile ? 'border-success' : 'border-secondary'}`}
                    onClick={() => document.getElementById('billUpload').click()}
                    style={{
                      borderColor: validationErrors.billFile ? '#dc3545' : (billFile ? '#48bb78' : '#dee2e6'),
                      backgroundColor: validationErrors.billFile ? '#dc354510' : (billFile ? '#48bb7810' : '#f8f9fa'),
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <FaFileUpload className="mb-2" size={24} color={validationErrors.billFile ? '#dc3545' : (billFile ? '#48bb78' : '#6c757d')} />
                    {billFile ? (
                      <>
                        <div className="fw-bold mb-1 text-success">{billFile.name}</div>
                        <small className="text-muted">Click to change file</small>
                      </>
                    ) : (
                      <>
                        <div className="fw-bold mb-1">Click to upload bill</div>
                        <small className="text-muted">PDF, JPG, PNG (Max 5MB)</small>
                      </>
                    )}
                  </div>
                  {validationErrors.billFile && (
                    <div className="text-danger small mt-2 d-flex align-items-center">
                      <FaExclamationTriangle className="me-1" />
                      {validationErrors.billFile}
                    </div>
                  )}
                  <input
                    id="billUpload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="d-none"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedCustomer(null);
                    setValidationErrors({});
                    setBillAmount('');
                    setBillFile(null);
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleConfirmPurchase}
                  disabled={!isPayButtonEnabled()}
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="me-2" />
                      Pay ₹{(selectedOffer.ticketPrice * ticketQuantity).toLocaleString()}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && purchaseSuccessData && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1080 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{
                backgroundColor: purchaseSuccessData.offerColor || '#28a745',
                color: 'white'
              }}>
                <h5 className="modal-title">
                  <FaCheckCircle className="me-2" />
                  Purchase Successful!
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCloseSuccessModal}
                ></button>
              </div>

              <div className="modal-body p-4 text-center">
                <div className="mb-4">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: purchaseSuccessData.offerColor || '#28a745',
                      color: 'white',
                      fontSize: '40px'
                    }}>
                    <FaCheckCircle />
                  </div>
                  <h4 className="fw-bold mb-2">Congratulations!</h4>
                  <p className="text-muted">{purchaseSuccessData.purchaseMessage || 'Cashback purchase completed successfully'}</p>
                </div>

                <div className="card border-0 shadow-sm mb-4 text-start">
                  <div className="card-body">
                    <h6 className="fw-bold mb-3">Purchase Details</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="mb-2">
                          <div className="text-muted small">Customer</div>
                          <div className="fw-bold">{purchaseSuccessData.customerName || 'Customer'}</div>
                        </div>
                        <div className="mb-2">
                          <div className="text-muted small">Offer</div>
                          <div className="fw-bold">{purchaseSuccessData.offerName}</div>
                        </div>
                        <div className="mb-2">
                          <div className="text-muted small">Tickets</div>
                          <div className="fw-bold">{purchaseSuccessData.ticketQuantity}</div>
                        </div>
                        {purchaseSuccessData.ticketNumbers && (
                          <div className="mb-2">
                            <div className="text-muted small">Ticket Numbers</div>
                            <div className="fw-bold small">{purchaseSuccessData.ticketNumbers}</div>
                          </div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <div className="mb-2">
                          <div className="text-muted small">Total Amount</div>
                          <div className="fw-bold">₹{purchaseSuccessData.totalTicketPrice}</div>
                        </div>
                        <div className="mb-2">
                          <div className="text-muted small">Bill Amount</div>
                          <div className="fw-bold">₹{purchaseSuccessData.billAmount}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <button
                    className="btn btn-danger"
                    onClick={handleBuyAnother}
                  >
                    Buy Another Cashback
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashbackPage;