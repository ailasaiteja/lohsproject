import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { fetchActiveLuckyDraws, getLuckyDrawDetails, purchaseLuckyDrawTicket } from './luckydrawApi';
import { customerApi } from '../MyCustomers/customerApi';
import LoadingToast from '../loading/LoadingToast';
import { useToast } from '../toast/ToastContext';
import {
  FaTrophy, FaArrowLeft, FaCheckCircle,
  FaUsers, FaTicketAlt, FaUser, FaSearch,
  FaTimes, FaPlus, FaMinus, FaRupeeSign,
  FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaInfoCircle, FaEye, FaClock, FaCrown, FaMoneyBillWave,
  FaExclamationTriangle, FaChevronDown,
  FaMedal, FaGift, FaAward, FaFilter, FaUserPlus, FaPlusCircle,
  FaCalendarAlt, FaSync,
  FaMobile
} from 'react-icons/fa';
import { Modal, Button, Card, Form, InputGroup, Badge, Alert, Row, Col } from 'react-bootstrap';

const LuckyDrawsPage = ({ user }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { makePurchase, addCommission, walletState } = useWallet();

  // Ref to prevent duplicate toasts
  const toastShownRef = useRef(false);

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
  const authToken = localStorage.getItem("auth_token");

  const [selectedDraw, setSelectedDraw] = useState(null);
  const [selectedDrawDetails, setSelectedDrawDetails] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ticketCount, setTicketCount] = useState(1);
  const [customerSearch, setCustomerSearch] = useState('');
  const [drawSearch, setDrawSearch] = useState('');
  const [activeDrawType, setActiveDrawType] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiPurchaseError, setApiPurchaseError] = useState(null);

  // Customers state - from API
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customersError, setCustomersError] = useState(null);

  // Dropdown states
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Success data
  const [purchaseSuccessData, setPurchaseSuccessData] = useState(null);

  // Active Lucky Draws from API
  const [activeDraws, setActiveDraws] = useState([]);

  // Fetch customers from API
  const fetchCustomersFromAPI = async () => {
    if (userType !== 'agent') return;

    setLoadingCustomers(true);
    setCustomersError(null);

    try {
      console.log('Fetching customers for agent...');
      const response = await customerApi.getCustomers();

      console.log('API Customers response:', response);

      if (response && Array.isArray(response)) {
        const transformedCustomers = response.map(customer => ({
          id: customer.id,
          name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown',
          firstName: customer.first_name || '',
          lastName: customer.last_name || '',
          phone: customer.phone_number || customer.phone || '',
          email: customer.email || '',
          district: customer.city || customer.district || '',
          avatar: (customer.first_name ? customer.first_name.charAt(0).toUpperCase() : 'C') +
            (customer.last_name ? customer.last_name.charAt(0).toUpperCase() : 'U'),
          tagged_agent: customer.tagged_agent,
          creator_info: customer.creator_info,
          lotteryTickets: 0,
          totalLotterySpent: 0,
          totalTickets: 0
        }));

        console.log(`Transformed ${transformedCustomers.length} customers`);
        setCustomers(transformedCustomers);

        if (!toastShownRef.current) {
          // toast.success('Success', `Loaded ${transformedCustomers.length} customers`);
          toastShownRef.current = true;
          setTimeout(() => { toastShownRef.current = false; }, 1000);
        }

        try {
          localStorage.setItem('flh_customers_api', JSON.stringify(transformedCustomers));
        } catch (e) {
          console.error('Error saving to localStorage:', e);
        }
      } else {
        console.log('No customers found from API');
        setCustomers([]);
        toast.info('No Customers', 'No customers found. Please add customers first.');

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
      toast.error('Error', 'Failed to load customers');

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

  // Listen for storage changes (in case user logs in/out)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const updatedUserData = localStorage.getItem('user_data');
        if (updatedUserData) {
          setUserData(JSON.parse(updatedUserData));
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch active lucky draws on component mount
  useEffect(() => {
    const loadActiveDraws = async () => {
      try {
        setLoading(true);
        setError(null);

        const drawsData = await fetchActiveLuckyDraws();
        console.log('API Response:', drawsData);

        const formattedDraws = (Array.isArray(drawsData) ? drawsData : []).map((draw) => {
          const startDate = new Date(draw.start_date);
          const endDate = new Date(draw.end_date);
          const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

          let type = 'special';
          if (diffDays <= 1) type = 'daily';
          else if (diffDays <= 7) type = 'weekly';
          else if (diffDays <= 30) type = 'monthly';

          const getColor = (type) => {
            switch (type) {
              case "daily": return "#FF6B6B";
              case "weekly": return "#06D6A0";
              case "monthly": return "#118AB2";
              case "special": return "#FFD166";
              default: return "#c42b2b";
            }
          };

          const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            return new Date(dateString).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }).toUpperCase();
          };

          const numberOfWinners = draw.prizes_count ? draw.prizes_count : 3;

          return {
            id: draw.id,
            name: draw.title || 'Unnamed Draw',
            type: type,
            shortDescription: draw.description?.substring(0, 100) || '',
            detailedDescription: draw.description || '',
            price: Number(draw.ticket_price) || 0,
            totalTickets: Number(draw.minimum_tickets) || 0,
            ticketsSold: Number(draw.tickets_sold) || 0,
            ticketsRemaining: Number(draw.tickets_remaining) || 0,
            collectedAmount: Number(draw.collected_amount) || 0,
            startDate: draw.start_date,
            endDate: draw.end_date,
            announceDate: draw.announcement_date,
            color: getColor(type),
            numberOfWinners: numberOfWinners,
            prizes: draw.prizes || [],
            progress: draw.minimum_tickets ?
              Math.min(100, Math.round((Number(draw.tickets_sold) / Number(draw.minimum_tickets)) * 100)) : 0,
            status: draw.is_active ? 'active' : 'inactive',
            joined: draw.joined || false,
            tickets: draw.tickets || [],
            displayEndDate: formatDate(draw.end_date),
            displayAnnounceDate: formatDate(draw.announcement_date),
            displayStartDate: formatDate(draw.start_date)
          };
        });

        setActiveDraws(formattedDraws);
        setError(null);
        // toast.success('Success', `Loaded ${formattedDraws.length} active draws`);
      } catch (err) {
        console.error('Error loading lucky draws:', err);
        setError(err.message || 'Failed to load lucky draws. Please try again.');
        setActiveDraws([]);
        toast.error('Error', 'Failed to load lucky draws');
      } finally {
        setLoading(false);
      }
    };

    loadActiveDraws();

    if (userType === 'agent') {
      fetchCustomersFromAPI();
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showFilterDropdown && !e.target.closest('.filter-dropdown-container')) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showFilterDropdown]);

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    if (!customer) return false;
    const searchLower = customerSearch.toLowerCase();
    const name = (customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`).toLowerCase();
    const email = (customer.email || '').toLowerCase();
    const phone = (customer.phone || '').toLowerCase();
    const district = (customer.district || '').toLowerCase();

    return name.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(searchLower) ||
      district.includes(searchLower);
  });

  // Filter draws by type and search
  const getFilteredDraws = () => {
    let filtered = activeDraws.filter(draw => draw.status === 'active');

    if (activeDrawType !== 'all') {
      filtered = filtered.filter(draw => draw.type === activeDrawType);
    }

    if (drawSearch.trim()) {
      const searchLower = drawSearch.toLowerCase();
      filtered = filtered.filter(draw =>
        draw.name.toLowerCase().includes(searchLower) ||
        (draw.shortDescription || '').toLowerCase().includes(searchLower) ||
        draw.type.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  // Draw type counts
  const drawTypeCounts = {
    all: activeDraws.filter(d => d.status === 'active').length,
    daily: activeDraws.filter(d => d.status === 'active' && d.type === 'daily').length,
    weekly: activeDraws.filter(d => d.status === 'active' && d.type === 'weekly').length,
    monthly: activeDraws.filter(d => d.status === 'active' && d.type === 'monthly').length,
    special: activeDraws.filter(d => d.status === 'active' && d.type === 'special').length,
  };

  const handleViewDetails = async (draw) => {
    setSelectedDraw(draw);
    setLoadingDetails(true);
    setShowDetailsModal(true);
    // toast.info('Draw Details', `Viewing details for ${draw.name}`);

    try {
      const details = await getLuckyDrawDetails(draw.id);
      console.log('Draw Details:', details);
      setSelectedDrawDetails(details);
    } catch (error) {
      console.error('Error fetching draw details:', error);
      toast.error('Error', 'Failed to load draw details');
      setSelectedDrawDetails({
        ...draw,
        terms_conditions: draw.terms_conditions || 'Standard terms and conditions apply.',
        how_it_works: draw.how_it_works || [
          'Choose a lucky draw you want to participate in',
          'Purchase your ticket with secure payment',
          'Wait for the draw date (we\'ll notify you)',
          'Check results in the app or via email',
          'Claim your prize if you win!'
        ],
        prize_details: draw.prize_details || 'Prize details will be announced soon.',
        winners_list: draw.winners_list || [],
        prizes: draw.prizes || []
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBuyTickets = (draw) => {
    setSelectedDraw(draw);
    setTicketCount(1);
    setShowDetailsModal(false);
    setApiPurchaseError(null);

    if (userType === 'customer') {
      const loggedCustomer = {
        id: userId,
        name: userData.name || userData.first_name ? `${userData.first_name} ${userData.last_name}` : 'Customer',
        avatar: userData.name?.charAt(0)?.toUpperCase() || userData.first_name?.charAt(0)?.toUpperCase() || 'C',
        phone: userData.phone || userData.phone_number || '',
        email: userData.email || ''
      };
      setSelectedCustomer(loggedCustomer);
      // toast.info('Confirm Purchase', `Please confirm ticket purchase for ${loggedCustomer.name}`);
      setShowConfirmModal(true);
    } else {
      setShowCustomerModal(true);
      // toast.info('Select Customer', 'Please select a customer to purchase tickets');
      if (customers.length === 0 && !loadingCustomers) {
        fetchCustomersFromAPI();
      }
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    // toast.success('Customer Selected', `${customer.name} selected for ticket purchase`);
    setTimeout(() => {
      setShowConfirmModal(true);
    }, 100);
  };

  const handleConfirmPurchase = async () => {
    if( ticketCount >= 100 ) {
      toast.error('Ticket Limit', 'You can\'t purchase more than 100 tickets at a time.');
      setApiPurchaseError('You can purchase more than 100 tickets at a time.');
      return;
    }

    const token = localStorage.getItem("token");  
    if (!token) {
      // User NOT logged in - Redirect to login with intended path
      navigate("/login", {
        state: {
          redirectTo: window.location.pathname, // come back here after login
        },
      });
      return;
    }
    if (!selectedCustomer || !selectedDraw) {
      toast.error('Error', 'Please select a customer and draw first');
      return;
    }

    const totalAmount = selectedDraw.price * ticketCount;
    // if (walletState.balance < totalAmount) {
    //   toast.error('Insufficient Balance', `Need ₹${totalAmount}, Available: ₹${walletState.balance}`);
    //   return;
    // }

    setIsProcessing(true);
    setApiPurchaseError(null);
    // toast.info('Processing', 'Processing your purchase...');

    try {
      // Prepare purchase data for API - Use tickets_requested as per your Swagger
      const purchaseData = {
        lucky_draw_id: selectedDraw.id,
        tickets_requested: ticketCount,
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.name,
        customer_phone: selectedCustomer.phone,
        agent_id: userType === 'agent' ? userId : null,
        total_amount: totalAmount,
        payment_method: 'wallet',
        purchase_date: new Date().toISOString()
      };

      console.log('Calling purchase API with data:', purchaseData);
      const apiResponse = await purchaseLuckyDrawTicket(selectedDraw.id, purchaseData);
      console.log('Purchase API response:', apiResponse);

      // ✅ Step 1: validate response FIRST
      if (!apiResponse || apiResponse.success === false) {
        throw new Error(
          apiResponse?.error ||
          apiResponse?.message ||
          'Insufficient user wallet balance'
        );
      }

      // ✅ Step 2: NOW define purchasedTickets
      let purchasedTickets = [];

      if (apiResponse.tickets && Array.isArray(apiResponse.tickets)) {
        purchasedTickets = apiResponse.tickets;
      } else if (apiResponse.data?.tickets) {
        purchasedTickets = apiResponse.data.tickets;
      } else {
        purchasedTickets = [apiResponse];
      }

      // ✅ Step 3: NOW safe to use
      if (!purchasedTickets.length) {
        throw new Error('No tickets returned from API');
      }

      // Make purchase through wallet hook (local balance update)
      const purchaseResult = makePurchase(
        totalAmount,
        'lottery',
        `${selectedDraw.name} - ${purchasedTickets.length} tickets`,
        selectedCustomer.name
      );

      // Calculate commission (5%) for agent
      if (userType === 'agent') {
        const commissionAmount = totalAmount * 0.05;
        addCommission(commissionAmount, selectedDraw.name, "Ticket Purchase Commission");
      }

      // Extract ticket numbers from API response
      const ticketNumbers = purchasedTickets.map(ticket => ticket.ticket_number);

      // Get transaction ID from first ticket
      const transactionId = purchasedTickets[0]?.lucky_draw_transaction_id
        ? `LD${purchasedTickets[0].lucky_draw_transaction_id}`
        : `LD${Date.now().toString().slice(-8)}`;

      // Update customer data in localStorage
      const updatedCustomers = customers.map(c => {
        if (c.id === selectedCustomer.id) {
          const currentTickets = c.lotteryTickets || 0;
          const currentSpent = c.totalLotterySpent || 0;

          return {
            ...c,
            lotteryTickets: currentTickets + purchasedTickets.length,
            totalLotterySpent: currentSpent + totalAmount,
            totalTickets: (c.totalTickets || 0) + purchasedTickets.length,
            lastPurchase: new Date().toISOString(),
            lotteryHistory: [
              ...(c.lotteryHistory || []),
              {
                transactionId: transactionId,
                drawName: selectedDraw.name,
                tickets: purchasedTickets.length,
                amount: totalAmount,
                date: new Date().toISOString(),
                ticketNumbers: ticketNumbers,
                apiTicketIds: purchasedTickets.map(t => t.id),
                walletTransactionId: purchasedTickets[0]?.wallet_transaction_id
              }
            ]
          };
        }
        return c;
      });

      localStorage.setItem('flh_customers_api', JSON.stringify(updatedCustomers));
      setCustomers(updatedCustomers);

      // Save lottery purchase to localStorage
      const lotteryPurchase = {
        id: Date.now(),
        transactionId: transactionId,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        drawId: selectedDraw.id,
        drawName: selectedDraw.name,
        price: selectedDraw.price,
        tickets: purchasedTickets.length,
        ticketPrice: selectedDraw.price,
        amount: totalAmount,
        date: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: 'active',
        drawDate: selectedDraw.announceDate,
        purchaseDate: new Date().toISOString(),
        ticketNumbers: ticketNumbers,
        walletBalanceBefore: walletState.balance,
        walletBalanceAfter: walletState.balance - totalAmount,
        commission: userType === 'agent' ? totalAmount * 0.05 : 0,
        api_response: apiResponse,
        purchasedTickets: purchasedTickets,
        walletTransactionId: purchasedTickets[0]?.wallet_transaction_id
      };

      const savedLottery = JSON.parse(localStorage.getItem('flh_lottery') || '[]');
      savedLottery.push(lotteryPurchase);
      localStorage.setItem('flh_lottery', JSON.stringify(savedLottery));

      // Update draw tickets sold in state
      const updatedDraws = activeDraws.map(draw => {
        if (draw.id === selectedDraw.id) {
          return {
            ...draw,
            ticketsSold: draw.ticketsSold + purchasedTickets.length,
            ticketsRemaining: draw.ticketsRemaining - purchasedTickets.length,
            progress: Math.min(100, Math.round(((draw.ticketsSold + purchasedTickets.length) / draw.totalTickets) * 100))
          };
        }
        return draw;
      });

      setActiveDraws(updatedDraws);

      // Set success data from API response
      setPurchaseSuccessData({
        transactionId: transactionId,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        drawId: selectedDraw.id,
        drawName: selectedDraw.name,
        tickets: ticketCount,
        actualTicketsPurchased: purchasedTickets.length,
        amount: totalAmount,
        ticketNumbers: ticketNumbers,
        date: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        walletBalanceAfter: walletState.balance - totalAmount,
        drawColor: selectedDraw.color,
        apiMessage: apiResponse.message || `Successfully purchased ${purchasedTickets.length} ticket(s)`,
        apiTickets: purchasedTickets,
        rawResponse: apiResponse,
        walletTransactionId: purchasedTickets[0]?.wallet_transaction_id
      });

      // Close confirmation modal and show success modal
      setShowConfirmModal(false);
      setIsProcessing(false);

      toast.success('Purchase Successful', `${purchasedTickets.length} ticket(s) purchased for ${selectedCustomer.name}`);
      window.dispatchEvent(new Event("wallet-updated"));


      setTimeout(() => {
        setShowSuccessModal(true);
      }, 300);

    } catch (error) {
      console.error('Purchase error:', error);

      // Handle specific error responses
      let errorMessage = 'Error processing purchase. Please try again.';
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        setApiPurchaseError(errorMessage);
        toast.error('Purchase Failed', errorMessage);
      } else if (error.message) {
        errorMessage = error.message;
        setApiPurchaseError(errorMessage);
        toast.error('Purchase Failed', errorMessage);
      } else {
        setApiPurchaseError(errorMessage);
        toast.error('Purchase Failed', errorMessage);
      }

      setIsProcessing(false);
    }
  };

  // Helper function to generate ticket numbers
  const generateTicketNumbers = (count) => {
    const numbers = [];
    const timestamp = Date.now().toString().slice(-6);
    for (let i = 0; i < count; i++) {
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const ticketNum = (i + 1).toString().padStart(2, '0');
      numbers.push(`TKT${timestamp}${randomNum}${ticketNum}`);
    }
    return numbers;
  };

  // Handle ticket count increment - REMOVED LIMIT CHECK
  const handleIncrementTickets = () => {
    if (!selectedDraw) return;
    // No limit check - user can increase tickets indefinitely
      setTicketCount(prev => prev + 1); 
  };

  // Handle ticket count decrement - Prevent going below 1
  const handleDecrementTickets = () => {
    if (ticketCount > 1) {
      setTicketCount(prev => prev - 1);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setPurchaseSuccessData(null);
    setSelectedDraw(null);
    setSelectedCustomer(null);
    setTicketCount(1);
    // toast.info('Success', 'Thank you for your purchase!');
  };

  const handleBuyMore = () => {
    setShowSuccessModal(false);
    setPurchaseSuccessData(null);
    setSelectedDraw(null);
    setSelectedCustomer(null);
    setTicketCount(1);
    // toast.info('New Purchase', 'Ready to buy more tickets');
  };

  // Function to format prize value
  const formatPrizeValue = (prize) => {
    if (prize.prize_type?.toLowerCase() === 'cash') {
      return `₹${prize.prize_value}`;
    }
    return prize.prize_value;
  };

  // Function to get position icon based on index
  const getPositionIcon = (index) => {
    const position = index + 1;
    if (position === 1) return <FaCrown size={24} />;
    if (position === 2) return <FaMedal size={24} />;
    if (position === 3) return <FaMedal size={24} />;
    return <FaAward size={24} />;
  };

  // Reusable Draw Card Component
  const DrawCard = ({ draw }) => {
    return (
      <div className="card h-100 border-0 shadow-sm hover-shadow">
        <div className="card-body d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="d-flex align-items-center">
              <div
                className="rounded p-3 me-3"
                style={{ background: `${draw.color}20`, color: draw.color, fontSize: '24px' }}
              >
                <FaTrophy />
              </div>
              <div>
                <h6 className="fw-bold mb-1">{draw.name}</h6>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-6">
              <small className="text-muted d-block fw-semibold">Joining Fee</small>
              <div className="fw-bold">₹{draw.price.toLocaleString()}</div>
            </div>
            <div className="col-6">
              <small className="text-muted d-block fw-semibold">Announce Date</small>
              <div className="fw-bold">{draw.displayAnnounceDate}</div>
            </div>
            <div className="col-6">
              <small className="text-muted d-block fw-semibold">End Date</small>
              <div className="fw-bold">{draw.displayEndDate}</div>
            </div>
            <div className="col-6">
              <small className="text-muted d-block fw-semibold">WINNERS</small>
              <div className="fw-bold">{draw.numberOfWinners}</div>
            </div>
          </div>

          <button
            className="btn w-100 bg-danger text-white mt-auto"
            onClick={() => handleViewDetails(draw)}
          >
            <FaEye className="me-2" />
            Join Now
          </button>
        </div>
      </div>
    );
  };

  // Get current filter label
  const getFilterLabel = () => {
    if (activeDrawType === 'all') return `All Draws (${drawTypeCounts.all})`;
    if (activeDrawType === 'daily') return `Daily Draws (${drawTypeCounts.daily})`;
    if (activeDrawType === 'weekly') return `Weekly Draws (${drawTypeCounts.weekly})`;
    if (activeDrawType === 'monthly') return `Monthly Draws (${drawTypeCounts.monthly})`;
    if (activeDrawType === 'special') return `Special Draws (${drawTypeCounts.special})`;
    return 'All Draws';
  };

  // Show nothing while loading - just the toast
  if (loading) {
    return <LoadingToast show={loading} message="Loading lucky draws..." />;
  }

  // Show error if API failed
  if (error) {
    return (
      <div className="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <FaExclamationTriangle className="text-danger fs-1 mb-3" />
          <h5 className="text-danger mb-3">Failed to load lucky draws</h5>
          <p className="text-muted mb-4">{error}</p>
          <button
            className="btn btn-danger"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid bg-light min-vh-100 p-3">
      {/* Draw Details Modal */}
      {showDetailsModal && selectedDraw && (
        <Modal show={showDetailsModal} onHide={() => {
          setShowDetailsModal(false);
          // toast.info('Closed', 'Draw details closed');
        }} size="lg" centered scrollable>
          <Modal.Header closeButton>
            <Modal.Title className="d-flex align-items-center">
              <div className="rounded p-2 me-3 bg-warning">
                <FaTrophy />
              </div>
              <div>
                <div className="fw-bold">{selectedDraw.name}</div>
              </div>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {loadingDetails ? (
              <LoadingToast show={loadingDetails} />
            ) : (
              <>
                {/* Draw Stats Cards */}
                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <div className="card h-100 border-0 bg-light">
                      <div className="card-body text-center">
                        <FaMoneyBillWave className="text-primary fs-3 mb-2" />
                        <div className="text-muted small">Joining Fee</div>
                        <div className="fw-bold fs-5" style={{ color: selectedDraw.color }}>
                          ₹{selectedDraw.price}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card h-100 border-0 bg-light">
                      <div className="card-body text-center">
                        <FaCalendarAlt className="text-info fs-3 mb-2" />
                        <div className="text-muted small">Start Date</div>
                        <div className="fw-bold fs-5 text-success">{selectedDraw.displayStartDate}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card h-100 border-0 bg-light">
                      <div className="card-body text-center">
                        <FaClock className="text-danger fs-3 mb-2" />
                        <div className="text-muted small">End Date</div>
                        <div className="fw-bold fs-5">{selectedDraw.displayEndDate}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card h-100 border-0 bg-light">
                      <div className="card-body text-center">
                        <FaTrophy className="text-warning fs-3 mb-2" />
                        <div className="text-muted small">Total Winners</div>
                        <div className="fw-bold fs-4">{selectedDrawDetails?.prizes?.length || selectedDraw.numberOfWinners}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Description */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-3 d-flex align-items-center">
                    <FaInfoCircle className="me-2 text-primary" />
                    Draw Description
                  </h6>
                  <div className="bg-light rounded p-3">
                    <p className="mb-0">{selectedDraw.detailedDescription || 'No description available'}</p>
                  </div>
                </div>

                {/* Winner Prizes Section */}
                {selectedDrawDetails?.prizes && selectedDrawDetails.prizes.length > 0 && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3 d-flex align-items-center">
                      <FaMedal className="me-2 text-warning" />
                      Winner Prizes
                    </h6>
                    <div className="row g-3">
                      {[...selectedDrawDetails.prizes]
                        .sort((a, b) => {
                          const valueA = parseFloat(a.prize_value);
                          const valueB = parseFloat(b.prize_value);
                          return valueB - valueA;
                        })
                        .map((prize, index) => {
                          const position = index + 1;
                          return (
                            <div key={prize.id} className="col-md-6 col-lg-4">
                              <div className="card h-100 border-0 shadow-sm">
                                <div className="card-body text-center">
                                  <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-3 ${position <= 3 ? 'bg-warning' : 'bg-secondary'}`}
                                    style={{ width: '60px', height: '60px', color: 'white' }}>
                                    {position === 1 && <FaCrown size={24} />}
                                    {position === 2 && <FaMedal size={24} />}
                                    {position === 3 && <FaMedal size={24} />}
                                    {position > 3 && <FaAward size={24} />}
                                  </div>
                                  <div className="fw-bold fs-5 mb-1">
                                    {position === 1 ? '1st' :
                                      position === 2 ? '2nd' :
                                        position === 3 ? '3rd' :
                                          `${position}th`} Prize
                                  </div>
                                  <div className={`fw-bold ${prize.prize_type?.toLowerCase() === 'cash' ? 'text-success' : 'text-primary'}`}>
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

                {/* How it works */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">
                    <FaExclamationTriangle className="me-2 text-danger" />
                    How it works
                  </h6>
                  <div className="bg-light rounded p-3">
                    <ol className="mb-0">
                      {selectedDrawDetails?.how_it_works ? (
                        selectedDrawDetails.how_it_works.map((step, index) => (
                          <li key={index} className="mb-2">{step}</li>
                        ))
                      ) : (
                        <>
                          <li className="mb-2">Choose a lucky draw you want to participate in</li>
                          <li className="mb-2">Purchase your ticket with secure payment</li>
                          <li className="mb-2">Wait for the draw date (we'll notify you)</li>
                          <li className="mb-2">Check results in the app or via email</li>
                          <li className="mb-2">Claim your prize if you win!</li>
                        </>
                      )}
                    </ol>
                  </div>
                </div>
              </>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            <Button
              variant="danger"
              className='bg-danger text-white'
              onClick={() => handleBuyTickets(selectedDraw)}
              disabled={loadingDetails}
            >
              <FaTicketAlt className="me-2" />
              Buy Tickets
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Customer Selection Modal */}
      {showCustomerModal && selectedDraw && (
        <Modal show={showCustomerModal} onHide={() => {
          setShowCustomerModal(false);
          setSelectedDraw(null);
          setCustomerSearch('');
          // toast.info('Cancelled', 'Customer selection cancelled');
        }} size="xl" centered>
          <Modal.Header closeButton className='bg-warning rgba(99, 66, 8, 0.2)'>
            <Modal.Title className="fw-bold">
              <FaUsers className="me-2" />
              Select Customer for {selectedDraw.name}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4">
            {/* Draw Summary */}
            <div className="card mb-4" style={{ borderLeft: `4px solid ${selectedDraw.color}` }}>
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="rounded p-2 me-3" style={{ background: selectedDraw.color, color: 'white' }}>
                    <FaTrophy />
                  </div>
                  <div>
                    <div className="fw-bold">{selectedDraw.name}</div>
                    <small className="text-muted">Price: ₹{selectedDraw.price.toLocaleString()} per ticket</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            {!loadingCustomers && customers.length > 0 && (
              <div className="mb-4">
                <InputGroup className="shadow-sm">
                  <InputGroup.Text style={{ backgroundColor: selectedDraw.color, color: 'white', border: 'none' }}>
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
                  fetchCustomersFromAPI();
                  // toast.info('Refreshing', 'Refreshing customer list...');
                }}
                disabled={loadingCustomers}
              >
                <FaSync className={`me-2 ${loadingCustomers ? 'fa-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Content Area */}
            {loadingCustomers ? (
              <LoadingToast show={loadingCustomers} />
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
                    // toast.info('Redirecting', 'Redirecting to add customer page');
                  }}
                  style={{ backgroundColor: selectedDraw.color, borderColor: selectedDraw.color }}
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
                          backgroundColor: selectedCustomer?.id === customer.id ? `${selectedDraw.color}20` : (index % 2 === 0 ? 'white' : '#f8f9fa')
                        }}
                        onClick={() => handleCustomerSelect(customer)}
                        onMouseEnter={(e) => {
                          if (selectedCustomer?.id !== customer.id) {
                            e.currentTarget.style.backgroundColor = '#e9ecef';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedCustomer?.id === customer.id) {
                            e.currentTarget.style.backgroundColor = `${selectedDraw.color}20`;
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
                              backgroundColor: selectedCustomer?.id === customer.id ? selectedDraw.color : '#6c757d',
                              color: 'white',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              flexShrink: 0
                            }}
                          >
                            {customer.avatar}
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-bold">{customer.name}</div>
                            <div className="text-muted small">
                              <FaMobile className="me-1" size={10} />
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
                      // toast.info('Redirecting', 'Redirecting to add customer page');
                    }}
                    style={{ color: selectedDraw.color, borderColor: selectedDraw.color }}
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
              setSelectedDraw(null);
              setCustomerSearch('');
              // toast.info('Cancelled', 'Customer selection cancelled');
            }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                navigate('/customer-signup');
                // toast.info('Redirecting', 'Redirecting to add customer page');
              }}
              disabled={loadingCustomers}
            >
              <FaUserPlus className="me-2" /> Add New Customer
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedDraw && selectedCustomer && (
        <Modal show={showConfirmModal} onHide={() => {
          setShowConfirmModal(false);
          // toast.info('Cancelled', 'Purchase cancelled');
        }} size="lg" centered>
          <Modal.Header closeButton className='bg-warning'>
            <Modal.Title>
              <FaTicketAlt className="me-2" />
              Confirm Ticket Purchase
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4">
            {/* Display API Error if any */}
            {/* {apiPurchaseError && (
              <Alert variant="danger" className="mb-4" onClose={() => setApiPurchaseError(null)} dismissible>
                <FaExclamationTriangle className="me-2" />
                {apiPurchaseError}
              </Alert>
            )} */}

            <div className="d-flex align-items-center mb-4 p-3 bg-light rounded">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#f8f9fa',
                  color: selectedDraw.color,
                  fontSize: '24px',
                  fontWeight: 'bold',
                  border: `3px solid ${selectedDraw.color}`
                }}
              >
                {selectedCustomer.avatar || selectedCustomer.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h5 className="text-bold text-danger">{selectedDraw.name}</h5>
                <div className="fw-bold mb-1">{selectedCustomer.name}</div>
                <small className="text-muted">{selectedCustomer.phone}</small>
              </div>
            </div>

            {/* Purchase Summary */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Ticket Details</h6>

                <div className="text-center mb-4">
                  <h6 className="fw-bold mb-3">Number of Tickets</h6>
                  <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
                    <button
                      className="btn btn-outline-secondary rounded-circle"
                      style={{ width: '40px', height: '40px' }}
                      onClick={handleDecrementTickets}
                      disabled={ticketCount <= 1 || isProcessing}
                    >
                      <FaMinus />
                    </button>

                    <div className="text-center">
                      <div className="fw-bold fs-1" style={{ color: selectedDraw.color }}>
                        {ticketCount}
                      </div>
                      <div className="text-muted">Tickets</div>
                    </div>

                    <button
                      className="btn btn-outline-secondary rounded-circle"
                      style={{ width: '40px', height: '40px' }}
                      onClick={handleIncrementTickets}
                      disabled={isProcessing || ticketCount >= 100}
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>

                <div className="bg-light rounded p-3 mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Ticket Price:</span>
                    <span>₹{selectedDraw.price} × {ticketCount}</span>
                  </div>
                  <div className="d-flex justify-content-between fw-bold fs-5">
                    <span>Total Amount:</span>
                    <span style={{ color: selectedDraw.color }}>₹{selectedDraw.price * ticketCount}</span>
                  </div>
                </div>

                {/* Wallet Balance Warning */}
                {/* {walletState.balance < selectedDraw.price * ticketCount && (
                  <Alert variant="danger" className="mt-3">
                    <FaExclamationTriangle className="me-2" />
                    Insufficient wallet balance! Available: ₹{walletState.balance.toFixed(2)}, Required: ₹{selectedDraw.price * ticketCount}
                  </Alert>
                )} */}
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowConfirmModal(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmPurchase}
              // disabled={walletState.balance < selectedDraw.price * ticketCount || isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Processing...
                </>
              ) : (
                <>
                  <FaCheckCircle className="me-2" />
                  Pay ₹{selectedDraw.price * ticketCount}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Success Modal */}
      {showSuccessModal && purchaseSuccessData && (
        <Modal show={showSuccessModal} onHide={handleCloseSuccessModal} size="lg" centered>
          <Modal.Header closeButton style={{ backgroundColor: purchaseSuccessData.drawColor || '#28a745', color: 'white' }}>
            <Modal.Title>
              <FaCheckCircle className="me-2" />
              {purchaseSuccessData.apiMessage || 'Tickets Purchased Successfully!'}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4 text-center">
            <div className="mb-4">
              <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: purchaseSuccessData.drawColor || '#28a745',
                  color: 'white',
                  fontSize: '40px'
                }}>
                <FaCheckCircle />
              </div>
              <h4 className="fw-bold mb-2">Congratulations!</h4>
              <p className="text-muted">{purchaseSuccessData.apiMessage}</p>
            </div>

            <div className="card border-0 shadow-sm mb-4 text-start">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Purchase Details</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="mb-2">
                      <div className="text-muted small">Customer</div>
                      <div className="fw-bold">{purchaseSuccessData.customerName}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Draw</div>
                      <div className="fw-bold">{purchaseSuccessData.drawName}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Tickets</div>
                      <div className="fw-bold">{purchaseSuccessData.tickets}</div>
                      {purchaseSuccessData.actualTicketsPurchased !== purchaseSuccessData.tickets && (
                        <small className="text-warning d-block">
                          (Actually purchased: {purchaseSuccessData.actualTicketsPurchased})
                        </small>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-2">
                      <div className="text-muted small">Total Amount</div>
                      <div className="fw-bold text-success">₹{purchaseSuccessData.amount}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Date & Time</div>
                      <div className="fw-bold small">{purchaseSuccessData.date} {purchaseSuccessData.time}</div>
                    </div>
                  </div>

                  {/* Show API-specific details if available */}
                  {purchaseSuccessData.apiTickets && purchaseSuccessData.apiTickets.length > 0 && (
                    <>

                    </>
                  )}
                </div>
              </div>
            </div>

            {/* {purchaseSuccessData.ticketNumbers && purchaseSuccessData.ticketNumbers.length > 0 && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">Your Ticket Numbers</h6>
                  <div className="row row-cols-2 row-cols-md-3 g-2">
                    {purchaseSuccessData.ticketNumbers.map((ticketNumber, index) => (
                      <div key={index} className="col">
                        <div className="bg-light rounded p-3 text-center border">
                          <small className="text-muted d-block">Ticket #{index + 1}</small>
                          <div className="fw-bold small">{ticketNumber}</div>
                          {purchaseSuccessData.apiTickets && purchaseSuccessData.apiTickets[index] && (
                            <small className="text-muted d-block mt-1">
                              ID: {purchaseSuccessData.apiTickets[index].id}
                            </small>
                          )}
                        </div>
                      </div>
                    ))} */}
            {/* </div> */}
            {/* </div> */}
            {/* </div> */}
            {/* )} */}

            <div className="d-grid gap-2">
              <Button variant="primary" onClick={handleBuyMore} style={{ backgroundColor: purchaseSuccessData.drawColor, borderColor: purchaseSuccessData.drawColor }}>
                Buy More Tickets
              </Button>

            </div>
          </Modal.Body>
        </Modal>
      )}

      {/* Main Content */}
      <div className="container-fluid">
        {/* Header */}
        <div className="mb-4">
          <div className="d-flex gap-3 mb-4">
            <button className="btn btn-outline-warning" onClick={() => {
              navigate('/home');
              // toast.info('Redirecting', 'Redirecting to dashboard');
            }}>
              <FaArrowLeft className="me-2" />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Header with Search */}
        <div className="card shadow-sm mb-4 border-0">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap">
              <div>
                <h3 className="mb-2 text-danger">
                  <FaTrophy className="me-2 text-warning" />
                  Electronic Lucky Product
                </h3>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-light border-end-0">
                  <FaSearch className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search draws..."
                  value={drawSearch}
                  onChange={(e) => setDrawSearch(e.target.value)}
                />
                {drawSearch && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => {
                      setDrawSearch('');
                      // toast.info('Search Cleared', 'Search filter removed');
                    }}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Draws Grid */}
        {getFilteredDraws().length === 0 ? (
          <div className="text-center py-5">
            <FaTrophy className="text-muted mb-3" size={48} />
            <h5>No draws found</h5>
            <p className="text-muted">
              {drawSearch
                ? `No draws found for "${drawSearch}"`
                : activeDrawType !== 'all'
                  ? `No ${activeDrawType} draws available`
                  : 'No active draws available'}
            </p>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {getFilteredDraws().map(draw => (
              <div key={draw.id} className="col">
                <DrawCard draw={draw} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LuckyDrawsPage;