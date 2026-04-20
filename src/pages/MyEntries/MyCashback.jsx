import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Tab, Nav, Badge, Form, InputGroup, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaTicketAlt, FaCalendarAlt, FaRupeeSign, FaSpinner, FaHistory, FaCheckCircle,
  FaChevronLeft, FaMinus, FaPlus, FaWallet, FaExclamationTriangle, FaSync,
  FaEye, FaInfoCircle, FaTrophy, FaMedal, FaCrown, FaAward, FaGift, FaPercentage,
  FaFileUpload, FaPhone, FaUser, FaShoppingBag, FaCoins, FaMoneyBillWave,
  FaArrowRight, FaUserPlus, FaPlusCircle, FaClock, FaUsers, FaSearch, FaTimes
} from 'react-icons/fa';
import { fetchUserCashbacks, getCashbackDetails, purchaseCashback, fetchWalletBalance } from './mycashbackApi';
import { customerApi } from '../MyCustomers/customerApi';
import LoadingToast from '../loading/LoadingToast';
import { useToast } from '../toast/ToastContext';
import { useWallet } from '../../hooks/useWallet';

const MyCashback = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { makePurchase, addCommission, walletState } = useWallet();

  // Get user data
  const userId = localStorage.getItem("user_id");
  const userType = localStorage.getItem("user_type")?.toLowerCase();
  const userData = JSON.parse(localStorage.getItem("user_data") || "{}");

  // State for entries
  const [entries, setEntries] = useState([]);
  const [currentEntries, setCurrentEntries] = useState([]);
  const [completedEntries, setCompletedEntries] = useState([]);
  const [activeTab, setActiveTab] = useState('current');
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);

  // Modal states
  const [showJoinDrawModal, setShowJoinDrawModal] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedCompletedDraw, setSelectedCompletedDraw] = useState(null);
  const [selectedDrawDetails, setSelectedDrawDetails] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Purchase states
  const [ticketCount, setTicketCount] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [billAmount, setBillAmount] = useState('');
  const [billFile, setBillFile] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [purchaseSuccessData, setPurchaseSuccessData] = useState(null);
  const [insufficientBalanceError, setInsufficientBalanceError] = useState(null);
  
  // Bill range validation states
  const [minBillAmount, setMinBillAmount] = useState(0);
  const [maxBillAmount, setMaxBillAmount] = useState(0);
  const [categoryTitle, setCategoryTitle] = useState('');

  // Customers state
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customersError, setCustomersError] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');

  // Wallet balance state
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);

  // Refs
  const hasShownInitialToast = useRef(false);

  // Helper function to validate bill amount
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

  // Load wallet balance using fetchWalletBalance API
  const loadWalletBalance = async (showToastOnLoad = false) => {
    if (isLoadingWallet) return;
    
    setIsLoadingWallet(true);
    try {
      const response = await fetchWalletBalance();
      console.log('Wallet API Response:', response);
      
      let balance = 0;
      
      if (response && response.success && response.data && response.data.summary) {
        balance = parseFloat(response.data.summary.current_balance);
      } else if (response && response.data && response.data.current_balance !== undefined) {
        balance = parseFloat(response.data.current_balance);
      } else if (response && response.current_balance !== undefined) {
        balance = parseFloat(response.current_balance);
      } else if (response && response.balance !== undefined) {
        balance = parseFloat(response.balance);
      }
      
      if (!isNaN(balance)) {
        setWalletBalance(balance);
        
        // Update localStorage
        const wallets = JSON.parse(localStorage.getItem('flh_wallets') || '{}');
        wallets.myWallet = balance;
        localStorage.setItem('flh_wallets', JSON.stringify(wallets));
        
        if (showToastOnLoad) {
          // toast.success('Wallet Updated', `Current balance: ₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        }
        return balance;
      }
      
      // Fallback to localStorage
      const savedWallets = JSON.parse(localStorage.getItem('flh_wallets') || '{}');
      if (savedWallets.myWallet !== undefined) {
        const savedBalance = parseFloat(savedWallets.myWallet);
        if (!isNaN(savedBalance)) {
          setWalletBalance(savedBalance);
          return savedBalance;
        }
      }
      
      setWalletBalance(0);
      return 0;
    } catch (error) {
      console.error('Error loading wallet balance:', error);
      
      // Fallback to localStorage on error
      const savedWallets = JSON.parse(localStorage.getItem('flh_wallets') || '{}');
      if (savedWallets.myWallet !== undefined) {
        const savedBalance = parseFloat(savedWallets.myWallet);
        if (!isNaN(savedBalance)) {
          setWalletBalance(savedBalance);
          return savedBalance;
        }
      }
      setWalletBalance(0);
      return 0;
    } finally {
      setIsLoadingWallet(false);
    }
  };

  // Refresh wallet from API
  const handleRefreshWallet = async () => {
    await loadWalletBalance(true);
  };

  // Update wallet balance when walletState changes
  useEffect(() => {
    if (walletState && typeof walletState.balance !== 'undefined') {
      const balance = parseFloat(walletState.balance);
      if (!isNaN(balance)) {
        setWalletBalance(balance);
      }
    }
  }, [walletState]);

  // Listen for wallet update events
  useEffect(() => {
    const handleWalletUpdate = () => {
      loadWalletBalance(true);
    };
    
    window.addEventListener('wallet-updated', handleWalletUpdate);
    
    return () => {
      window.removeEventListener('wallet-updated', handleWalletUpdate);
    };
  }, []);

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

  // Load entries on mount
  useEffect(() => {
    loadEntries();
    loadWalletBalance();
    if (userType === 'agent') {
      fetchCustomersFromAPI(false);
    }
  }, []);

  // Filter entries into current and completed
  useEffect(() => {
    if (entries && entries.length > 0) {
      const current = entries.filter(entry => entry.status !== "Announced");
      const completed = entries.filter(entry => entry.status === "Announced");
      setCurrentEntries(current);
      setCompletedEntries(completed);
    } else {
      setCurrentEntries([]);
      setCompletedEntries([]);
    }
  }, [entries]);

  const loadEntries = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchUserCashbacks();

      let apiData = [];

      if (response && response.success && response.ecbs && Array.isArray(response.ecbs)) {
        apiData = response.ecbs;
      } else if (response && response.data && Array.isArray(response.data)) {
        apiData = response.data;
      } else if (response && Array.isArray(response)) {
        apiData = response;
      }

      if (apiData.length > 0) {
        const processedEntries = apiData.map((item) => {
          const tickets = item.tickets || [];
          const ticketCount = tickets.length;
          const ticketPrice = parseFloat(item.ticket_price) || 0;
          const totalAmount = ticketPrice * ticketCount;

          let isActive = true;
          let endDate = item.end_date;
          const status = item.status || '';

          if (status === 'Announced' || status === 'Completed' || status === 'Ended') {
            isActive = false;
          } else if (endDate) {
            try {
              const endDateTime = new Date(endDate);
              const today = new Date();
              isActive = endDateTime > today;
            } catch (e) {}
          }

          const userPrizes = item.user_prizes || [];
          const winningTicketsMap = new Map();
          userPrizes.forEach(prize => {
            winningTicketsMap.set(prize.winner_ticket, {
              position: prize.winning_position,
              amount: prize.prize_value,
              type: prize.prize_type,
              status: prize.status
            });
          });

          const enhancedTickets = tickets.map(ticket => {
            const winInfo = winningTicketsMap.get(ticket.ticket_number);
            return {
              id: ticket.id,
              number: ticket.ticket_number,
              billPrice: ticket.bill_price,
              purchaseTime: ticket.purchase_time,
              position: winInfo?.position || null,
              prizeAmount: winInfo?.amount || 0,
              prizeType: winInfo?.type || null,
              isWinner: !!winInfo,
              status: winInfo?.status || null
            };
          });

          const hasWon = userPrizes.length > 0;
          const totalPrizeAmount = userPrizes.reduce((sum, prize) => sum + (parseFloat(prize.prize_value) || 0), 0);

          return {
            id: item.id,
            drawId: item.id,
            drawName: item.title || 'Cashback Ticket',
            tickets: ticketCount,
            ticketNumbers: enhancedTickets,
            ticketPrice: ticketPrice,
            amount: totalAmount,
            prize: totalPrizeAmount,
            hasWon: hasWon,
            userPrizes: userPrizes,
            allPrizes: item.prizes || [],
            date: tickets.length > 0 && tickets[0].purchase_time ?
              new Date(tickets[0].purchase_time).toLocaleDateString('en-IN') :
              item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
            drawDate: endDate,
            isActive: isActive,
            status: status,
            numberOfWinners: item.prizes?.length || 3,
            startDate: item.start_date,
            endDate: endDate,
            announcement_date: item.announcement_date,
            cashbackPercentage: parseFloat(item.cashback_percentage) || 0,
            maxCashback: parseFloat(item.max_cashback) || 0,
            termAmount: parseFloat(item.minimum_purchase_amount) || 0,
            maxBillAmount: parseFloat(item.max_winning_amount) || 0, // Changed to use max_winning_amount
            description: item.description,
            minimum_tickets: item.minimum_tickets,
            tickets_sold: item.tickets_sold,
            tickets_remaining: item.tickets_remaining,
            category: item.earn_cashback_category || 'General'
          };
        });

        setEntries(processedEntries);
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error('Error loading cashback entries:', error);
      setError('Failed to load cashback entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchCashbackDetails = async (drawId) => {
    setLoadingDetails(true);
    try {
      const response = await getCashbackDetails(drawId);
      
      let details = null;
      if (response && response.success && response.data) {
        details = response.data;
      } else if (response && typeof response === 'object' && response.id) {
        details = response;
      }
      
      if (details) {
        const prizes = details.prizes || [];
        const enhancedPrizes = prizes.map(prize => ({
          id: prize.id,
          position: prize.winning_position,
          amount: prize.prize_value,
          displayValue: prize.prize_value.toString().includes('%') ? prize.prize_value : `₹${prize.prize_value}`,
          isPercentage: prize.prize_value.toString().includes('%'),
          winnerTicket: prize.winner_ticket,
          winnerId: prize.winner_id,
          status: prize.status
        }));
        
        setSelectedDrawDetails({
          id: details.id,
          title: details.title,
          description: details.description,
          ticketPrice: parseFloat(details.ticket_price),
          minimumTickets: details.minimum_tickets,
          ticketsSold: details.tickets_sold,
          ticketsRemaining: details.tickets_remaining,
          startDate: details.start_date,
          endDate: details.end_date,
          maxWinningAmount: details.max_winning_amount,
          announcementDate: details.announcement_date,
          isActive: details.is_active,
          status: details.status,
          cashbackPercentage: parseFloat(details.cashback_percentage) || 0,
          maxCashback: parseFloat(details.max_cashback) || 0,
          termAmount: parseFloat(details.minimum_purchase_amount) || 0,
          maxBillAmount: parseFloat(details.max_winning_amount) || 0, // Changed to use max_winning_amount
          category: details.earn_cashback_category || 'General',
          enhancedPrizes: enhancedPrizes
        });

        // Set bill range validation values - min is minimum_purchase_amount, max is max_winning_amount
        setMinBillAmount(parseFloat(details.minimum_purchase_amount) || 0);
        setMaxBillAmount(parseFloat(details.max_winning_amount) || 0); // Changed to use max_winning_amount
        setCategoryTitle(details.earn_cashback_category || 'General');
      }
      return details;
    } catch (err) {
      console.error('Error fetching cashback details:', err);
      return null;
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchCustomersFromAPI = async (showToast = false) => {
    if (userType !== 'agent') return;
    setLoadingCustomers(true);
    try {
      const response = await customerApi.getCustomers();
      if (response && Array.isArray(response)) {
        const transformedCustomers = response.map(customer => ({
          id: customer.id,
          name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown',
          displayName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer',
          phone: customer.phone_number || customer.phone || '',
          email: customer.email || '',
          avatar: (customer.first_name ? customer.first_name.charAt(0).toUpperCase() : 'C')
        }));
        setCustomers(transformedCustomers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      if (showToast) toast.error('Error', 'Failed to load customers');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleJoinAgain = async (entry) => {
    setSelectedDraw({
      id: entry.drawId,
      Name: entry.drawName,
      StartDate: entry.startDate,
      EndDate: entry.endDate,
      ticketPrice: entry.ticketPrice || 100,
      maxTickets: 1000,
      userPreviousTickets: entry.ticketNumbers || [],
      userPreviousPurchase: entry,
      userPreviousTicketsCount: entry.tickets || 0,
      prizePool: entry.allPrizes || [],
      numberOfWinners: entry.numberOfWinners || 1,
      description: entry.description,
      termAmount: entry.termAmount || 0,
      maxBillAmount: entry.maxBillAmount || 0, // This should be max_winning_amount
      category: entry.category || 'General'
    });
    setSelectedEntry(entry);
    setTicketCount(1);
    setBillAmount('');
    setBillFile(null);
    setInsufficientBalanceError(null);
    setValidationErrors({});
    setShowJoinDrawModal(true);
    setLoadingDetails(true);

    // Set bill range from entry data
    setMinBillAmount(entry.termAmount || 0);
    setMaxBillAmount(entry.maxBillAmount || 0); // This is max_winning_amount
    setCategoryTitle(entry.category || 'General');

    await loadWalletBalance(false);

    try {
      const response = await fetchCashbackDetails(entry.drawId);
      
      if (response) {
        setSelectedDraw(prev => ({
          ...prev,
          prizePool: response.prizes || [],
          numberOfWinners: response.prizes?.length || 1,
          termAmount: parseFloat(response.minimum_purchase_amount) || prev.termAmount,
          maxBillAmount: parseFloat(response.max_winning_amount) || prev.maxBillAmount, // Changed to use max_winning_amount
          category: response.earn_cashback_category || prev.category
        }));
        
        // Update bill range from API response
        setMinBillAmount(parseFloat(response.minimum_purchase_amount) || 0);
        setMaxBillAmount(parseFloat(response.max_winning_amount) || 0); // Changed to use max_winning_amount
        setCategoryTitle(response.earn_cashback_category || 'General');
      }
    } catch (error) {
      console.error("Error fetching draw details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewWinners = (entry) => {
    setSelectedCompletedDraw(entry);
    setShowWinnerModal(true);
    fetchCashbackDetails(entry.drawId);
  };

  const handleBuyNow = () => {
    setShowJoinDrawModal(false);
    if (userType === "customer") {
      const loggedCustomer = {
        id: userId,
        name: userData.name || "Customer",
        displayName: userData.name || "Customer",
        avatar: userData.name?.charAt(0)?.toUpperCase() || "CU",
        phone: userData.phone || "",
        email: userData.email || ""
      };
      setSelectedCustomer(loggedCustomer);
      setTimeout(() => setShowConfirmModal(true), 100);
    } else if (userType === "agent") {
      setShowCustomerModal(true);
      if (customers.length === 0 && !loadingCustomers) fetchCustomersFromAPI(false);
    } else {
      toast.error('Error', 'User type not recognized');
    }
  };

  const handleCustomerSelect = (customer) => {
    const selectedCustomerData = {
      ...customer,
      name: customer.displayName || customer.name || 'Customer',
      displayName: customer.displayName || customer.name || 'Customer'
    };
    setSelectedCustomer(selectedCustomerData);
    setShowCustomerModal(false);
    setTimeout(() => setShowConfirmModal(true), 300);
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
    const currentMinAmount = minBillAmount || selectedDraw?.termAmount || selectedEntry?.termAmount || 0;
    const currentMaxAmount = maxBillAmount || selectedDraw?.maxBillAmount || selectedEntry?.maxBillAmount || 0;
    
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
    
    if (errors.billFile && !errors.billAmount) {
      toast.warning('Validation Error', 'Please upload a bill');
    }
    
    return Object.keys(errors).length === 0;
  };

  const handleIncrementTickets = () => {
    if (ticketCount < 100) setTicketCount(ticketCount + 1);
  };

  const handleDecrementTickets = () => {
    if (ticketCount > 1) setTicketCount(ticketCount - 1);
  };

  const calculateTotalAmount = () => {
    const ticketPrice = selectedDraw?.ticketPrice || selectedEntry?.ticketPrice || 0;
    return ticketPrice * ticketCount;
  };

  const isWalletBalanceSufficient = () => {
    const totalAmount = calculateTotalAmount();
    return totalAmount <= walletBalance && totalAmount > 0;
  };

  const isPayButtonEnabled = () => {
    const billAmountNum = parseFloat(billAmount);
    const currentMinAmount = minBillAmount || selectedDraw?.termAmount || selectedEntry?.termAmount || 0;
    const currentMaxAmount = maxBillAmount || selectedDraw?.maxBillAmount || selectedEntry?.maxBillAmount || 0;
    
    if (!billAmount) return false;
    if (!billFile) return false;
    if (isNaN(billAmountNum)) return false;
    if (billAmountNum < currentMinAmount) return false;
    if (currentMaxAmount > 0 && billAmountNum > currentMaxAmount) return false;
    if (!isWalletBalanceSufficient()) return false;
    if (isProcessing) return false;
    return true;
  };

  const handlePurchaseTickets = async () => {
    if (!selectedDraw || !selectedEntry) {
      toast.error('Error', 'Invalid draw selection');
      return;
    }
    
    if (!validateForm()) return;

    const totalAmount = calculateTotalAmount();
    if (totalAmount > walletBalance) {
      setInsufficientBalanceError({
        message: `Insufficient balance! You need ₹${totalAmount} but have only ₹${walletBalance}`,
        available_balance: walletBalance,
        required_amount: totalAmount
      });
      toast.error('Insufficient Balance', `Need ₹${totalAmount}, Available: ₹${walletBalance}`);
      return;
    }
    
    setIsProcessing(true);
    setInsufficientBalanceError(null);
    
    try {
      let base64Bill = null, fileType = null, fileName = null;
      if (billFile) {
        fileType = billFile.type;
        fileName = billFile.name;
        base64Bill = await convertFileToBase64(billFile);
      }

      const payload = {
        bill_price: parseFloat(billAmount).toString(),
        tickets_requested: ticketCount.toString(),
        earn_cashback_id: selectedDraw.id,
        bill_image: base64Bill,
        bill_image_type: fileType,
        bill_image_name: fileName,
        bill_document: base64Bill,
        purchase_date: new Date().toISOString()
      };

      const purchaseResponse = await purchaseCashback(selectedDraw.id, payload);
      
      console.log('Purchase Response:', purchaseResponse);

      // Handle different response formats
      let isSuccess = false;
      let tickets = [];
      let errorMessage = '';
      
      if (purchaseResponse) {
        if (purchaseResponse.success === true) {
          isSuccess = true;
          tickets = purchaseResponse.tickets || purchaseResponse.data?.tickets || [];
        } else if (purchaseResponse.data && purchaseResponse.data.success === true) {
          isSuccess = true;
          tickets = purchaseResponse.data.tickets || [];
        } else if (purchaseResponse.tickets && Array.isArray(purchaseResponse.tickets) && purchaseResponse.tickets.length > 0) {
          isSuccess = true;
          tickets = purchaseResponse.tickets;
        } else if (purchaseResponse.status === 'success' || purchaseResponse.status === 'SUCCESS') {
          isSuccess = true;
          tickets = purchaseResponse.tickets || [];
        } else if (purchaseResponse.error) {
          errorMessage = purchaseResponse.error;
        } else if (purchaseResponse.message) {
          errorMessage = purchaseResponse.message;
        }
      }

      if (!isSuccess) {
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
        
        throw new Error(errorMessage || purchaseResponse.message || 'Purchase failed');
      }

      const walletTransactionId = tickets[0]?.wallet_transaction_id;
      const ecbTransactionId = tickets[0]?.ecb_transaction_id;
      const ticketNumbers = tickets.map(t => t.ticket_number || t.ticketNumber).filter(Boolean).join(', ');
      const customerName = selectedCustomer?.displayName || selectedCustomer?.name || 'User';

      const purchaseResult = makePurchase(totalAmount, 'cashback', 
        `${selectedDraw.Name} (${ticketCount} tickets) - Bill: ₹${billAmount}`, customerName);

      const commissionEarned = totalAmount * 0.05;
      if (userType === "agent") {
        addCommission(commissionEarned, selectedDraw.Name, 'Cashback Ticket Commission');
      }

      setPurchaseSuccessData({
        transactionId: purchaseResult.transactionId,
        apiPurchaseId: purchaseResponse?.id || purchaseResponse?.data?.id || null,
        walletTransactionId: walletTransactionId,
        ecbTransactionId: ecbTransactionId,
        ticketNumbers: ticketNumbers || 'Tickets added successfully',
        customerName: customerName,
        offerName: selectedDraw.Name,
        ticketQuantity: ticketCount,
        ticketPrice: selectedDraw.ticketPrice,
        totalTicketPrice: totalAmount,
        billAmount: parseFloat(billAmount),
        commissionEarned: commissionEarned,
        date: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN')
      });

      setShowJoinDrawModal(false);
      setIsProcessing(false);
      
      toast.success('Purchase Successful', `Successfully purchased ${ticketCount} ticket(s)!`);
      window.dispatchEvent(new Event("wallet-updated"));

      setTimeout(async () => {
        await loadEntries();
        await loadWalletBalance(true);
        setShowSuccessModal(true);
      }, 500);

    } catch (error) {
      console.error('Purchase error:', error);
      setIsProcessing(false);
      
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

      if (!errorMessage.includes('must be between')) {
        toast.error('Purchase Failed', errorMessage);
      }
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setPurchaseSuccessData(null);
    setSelectedDraw(null);
    setSelectedEntry(null);
    setSelectedCustomer(null);
    setBillAmount('');
    setBillFile(null);
    setTicketCount(1);
    setValidationErrors({});
    loadEntries();
  };

  const handleBuyAnother = () => {
    setShowSuccessModal(false);
    setPurchaseSuccessData(null);
    setBillAmount('');
    setBillFile(null);
    setTicketCount(1);
    setValidationErrors({});
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateString; }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateString; }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);
  };

  const formatCurrencyDisplay = (amount) => {
    if (amount === undefined || amount === null) return '₹0.00';
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getOrdinalSuffix = (position) => {
    if (position === 1) return 'st';
    if (position === 2) return 'nd';
    if (position === 3) return 'rd';
    return 'th';
  };

  const getPositionIcon = (position) => {
    if (position === 1) return <FaCrown size={24} className="text-warning" />;
    if (position === 2) return <FaMedal size={24} className="text-secondary" />;
    if (position === 3) return <FaMedal size={24} className="text-danger" />;
    return <FaAward size={24} className="text-info" />;
  };

  const getCurrentEntries = () => {
    return activeTab === 'current' ? currentEntries : completedEntries;
  };

  if (loading) {
    return <LoadingToast show={loading} message="Loading cashback entries..." />;
  }

  return (
    <Container fluid className="py-4 bg-light min-vh-100">
      <Row className="mb-3">
        <Col>
          <Button variant="outline-secondary" onClick={() => navigate('/home')} className="d-flex align-items-center">
            <FaChevronLeft className="me-2" /> Back to Home
          </Button>
        </Col>
      </Row>

      {error && (
        <Row className="mb-3">
          <Col>
            <div className="alert alert-danger">
              {error}
              <Button variant="outline-danger" size="sm" className="ms-3" onClick={loadEntries}>
                Try Again
              </Button>
            </div>
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col>
          <h1 className="mb-0 fw-bold" style={{ color: '#c42b2b' }}>
            {/* <FaTicketAlt className="me-2" />  */}
            My Cashback 
          </h1>
        </Col>
      </Row>

      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body className="p-0">
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav variant="tabs" className="px-3 pt-3">
              <Nav.Item>
                <Nav.Link eventKey="current" className="fw-bold">
                  <FaSpinner className="me-2" /> Current ({currentEntries.length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="completed" className="fw-bold">
                  <FaHistory className="me-2" /> Completed ({completedEntries.length})
                </Nav.Link>
              </Nav.Item>
            </Nav>
            
            <Tab.Content className="p-3">
              {getCurrentEntries().length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-4">
                    <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center p-4 mb-3">
                      <FaTicketAlt className="fs-1 text-muted" />
                    </div>
                    <h4 className="text-muted mb-3">
                      {activeTab === 'current' 
                        ? 'No Current Cashback Tickets Found' 
                        : 'No Completed Cashback Tickets Found'}
                    </h4>
                    <p className="text-muted mb-4">
                      {activeTab === 'current'
                        ? "You don't have any current cashback tickets. Buy new tickets to get started!"
                        : "You don't have any completed cashback tickets yet."}
                    </p>
                    <div className="d-flex justify-content-center gap-3">
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={() => navigate('/cashback')}
                        className="d-flex align-items-center"
                      >
                        <FaTicketAlt className="me-2" /> Buy Cashback Tickets
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="text-center">S.No</th>
                        <th>Cashback name</th>
                        <th>Tickets</th>
                        <th>Amount</th>
                        <th>Announce Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCurrentEntries().map((entry, index) => (
                        <tr key={entry.id}>
                          <td className="text-center text-muted fw-bold">{index + 1}</td>
                          <td>
                            <div className="fw-bold mb-1">{entry.drawName}</div>
                            {entry.hasWon && entry.prize > 0 && (
                              <Badge bg="success" className="mt-1">
                                <FaTrophy className="me-1" /> Won ₹{entry.prize}
                              </Badge>
                            )}
                            {entry.userPrizes && entry.userPrizes.length > 0 && (
                              <div className="mt-1">
                                {entry.userPrizes.map((prize, idx) => (
                                  <Badge key={idx} bg="info" className="me-1">
                                    {prize.winning_position}{getOrdinalSuffix(prize.winning_position)}: {prize.prize_value.toString().includes('%') ? prize.prize_value : `₹${prize.prize_value}`}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {entry.cashbackPercentage > 0 && (
                              <small className="text-success d-block">{entry.cashbackPercentage}% Cashback</small>
                            )}
                          </td>
                          <td className="text-left">
                            <div className="fw-bold">{entry.tickets}</div>
                          </td>
                          <td>
                            <div className="fw-bold">{formatCurrency(entry.amount)}</div>
                            <small className="text-muted d-block">Per ticket: {formatCurrency(entry.ticketPrice)}</small>
                          </td>
                          <td>
                            <div className="fw-bold">
                              <FaCalendarAlt className="me-2" />
                              {formatDate(entry.announcement_date || entry.endDate)}
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="d-flex gap-2">
                              {entry.isActive && entry.status !== 'Announced' ? (
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleJoinAgain(entry)}
                                  className="w-100"
                                >
                                  Join Again
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="info"
                                    size="sm"
                                    onClick={() => handleViewWinners(entry)}
                                    className="w-100"
                                  >
                                    <FaEye className="me-1" /> View Details
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-100"
                                    disabled
                                  >
                                    Completed
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Tab.Content>
          </Tab.Container>
        </Card.Body>
      </Card>

      {/* Winners Modal for Completed Entries */}
      <Modal 
        show={showWinnerModal} 
        onHide={() => {
          setShowWinnerModal(false);
          setSelectedCompletedDraw(null);
          setSelectedDrawDetails(null);
        }} 
        size="lg"
        centered
      >
        {selectedCompletedDraw && (
          <>
            <Modal.Header closeButton className="bg-white border-0 pb-0">
              <Modal.Title className="w-100">
                <div className="text-center">
                  <h2 className="fw-bold mb-2" style={{ color: '#c42b2b' }}>
                    {selectedCompletedDraw.drawName}
                  </h2>
                  <div className="d-flex justify-content-center gap-3">
                    <Badge bg="light" text="dark" className="px-3 py-2">
                      <FaTicketAlt className="me-1" /> My Ticket Count: {selectedCompletedDraw.tickets}
                    </Badge>
                    <Badge bg="light" text="dark" className="px-3 py-2">
                      <FaCalendarAlt className="me-1" /> Date: {formatDateTime(selectedCompletedDraw.endDate)}
                    </Badge>
                  </div>
                </div>
              </Modal.Title>
            </Modal.Header>
            
            <Modal.Body className="pt-3">
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Body>
                  <h5 className="fw-bold mb-3">
                    <FaInfoCircle className="me-2 text-primary" />
                    Cashback Details
                  </h5>
                  <Row className="g-3">
                    <Col md={3} sm={6}>
                      <div className="bg-light rounded p-3 text-center">
                        <small className="text-muted d-block">Title</small>
                        <strong className="fs-6">{selectedCompletedDraw.drawName}</strong>
                      </div>
                    </Col>
                    <Col md={3} sm={6}>
                      <div className="bg-light rounded p-3 text-center">
                        <small className="text-muted d-block">Ticket Price</small>
                        <strong className="fs-6 text-success">{formatCurrency(selectedCompletedDraw.ticketPrice)}</strong>
                      </div>
                    </Col>
                    <Col md={3} sm={6}>
                      <div className="bg-light rounded p-3 text-center">
                        <small className="text-muted d-block">Announce Date</small>
                        <strong className="fs-6">{formatDate(selectedCompletedDraw.announcement_date || selectedCompletedDraw.endDate)}</strong>
                      </div>
                    </Col>
                    <Col md={3} sm={6}>
                      <div className="bg-light rounded p-3 text-center">
                        <small className="text-muted d-block">Status</small>
                        <Badge bg={selectedCompletedDraw.hasWon ? "success" : "secondary"} className="fs-6">
                          {selectedCompletedDraw.hasWon ? "Won" : "Not Won"}
                        </Badge>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <div>
                <h5 className="fw-bold mb-3">
                  <FaTicketAlt className="me-2 text-primary" />
                  Ticket Details
                </h5>
                <div className="table-responsive">
                  <Table bordered className="align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '50%' }}>Ticket No.</th>
                        <th style={{ width: '25%' }}>Position</th>
                        <th style={{ width: '25%' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCompletedDraw.ticketNumbers && selectedCompletedDraw.ticketNumbers.length > 0 ? (
                        selectedCompletedDraw.ticketNumbers.map((ticket, idx) => (
                          <tr key={idx} className={ticket.isWinner ? 'table-success' : ''}>
                            <td>
                              <code className="bg-light p-1 rounded">{ticket.number}</code>
                              {ticket.isWinner && (
                                <Badge bg="success" className="ms-2">Winner!</Badge>
                              )}
                            </td>
                            <td>
                              {ticket.position ? (
                                <span className="fw-bold">
                                  {ticket.position}
                                  <sup>{getOrdinalSuffix(ticket.position)}</sup>
                                </span>
                              ) : (
                                <span className="text-muted">N/A</span>
                              )}
                            </td>
                            <td>
                              {ticket.prizeAmount > 0 ? (
                                <strong className="text-success">{formatCurrency(ticket.prizeAmount)}</strong>
                              ) : (
                                <span className="text-muted">₹0</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center text-muted">
                            No tickets found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </div>

              {(selectedDrawDetails?.enhancedPrizes?.length > 0 || selectedCompletedDraw.allPrizes?.length > 0) && (
                <div className="mt-4">
                  <h5 className="fw-bold mb-3">
                    <FaTrophy className="me-2 text-warning" />
                    Prize Distribution
                  </h5>
                  <div className="row g-3">
                    {(selectedDrawDetails?.enhancedPrizes || selectedCompletedDraw.allPrizes || []).map((prize, idx) => (
                      <div key={idx} className="col-md-4">
                        <Card className="border-0 shadow-sm text-center">
                          <Card.Body>
                            {getPositionIcon(prize.position)}
                            <div className="fw-bold mt-2">
                              {prize.position}{getOrdinalSuffix(prize.position)} Prize
                            </div>
                            <div className="text-success fw-bold">
                              {prize.displayValue || formatCurrency(prize.amount)}
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Modal.Body>
            
            <Modal.Footer className="border-0">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowWinnerModal(false);
                  setSelectedCompletedDraw(null);
                  setSelectedDrawDetails(null);
                }}
              >
                Close
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* Join Draw Modal */}
      <Modal 
        show={showJoinDrawModal} 
        onHide={() => {
          setShowJoinDrawModal(false);
          setSelectedEntry(null);
          setSelectedDraw(null);
          setInsufficientBalanceError(null);
          setValidationErrors({});
          setBillAmount('');
          setBillFile(null);
        }} 
        size="lg"
        centered
      >
        {selectedDraw && selectedEntry && (
          <>
            <Modal.Header closeButton className="bg-danger text-white">
              <Modal.Title className="d-flex align-items-center">
                <FaTicketAlt className="me-2" />
                CASHBACK OVERVIEW
                {loadingDetails && <FaSpinner className="fa-spin ms-2" />}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Body>
                  <div className="text-center mb-3">
                    <h4 className="fw-bold text-warning">{selectedDraw.Name}</h4>
                  </div>
                  
                  {selectedDraw.description && (
                    <p className="text-muted small mb-3">
                      {selectedDraw.description}
                    </p>
                  )}
                  
                  <Row className="g-3">
                    <Col md={6}>
                      <div className="bg-light rounded p-2 text-center">
                        <small className="text-muted d-block">Total Winners</small>
                        <strong className="fs-5">{selectedDraw.numberOfWinners}</strong>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="bg-light rounded p-2 text-center">
                        <small className="text-muted d-block">Ticket Price</small>
                        <strong className="fs-5 text-success">{formatCurrencyDisplay(selectedDraw.ticketPrice)}</strong>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="bg-light rounded p-2 text-center">
                        <small className="text-muted d-block">Start Date</small>
                        <strong className="fs-6">{formatDate(selectedDraw.StartDate)}</strong>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="bg-light rounded p-2 text-center">
                        <small className="text-muted d-block">End Date</small>
                        <strong className="fs-6">{formatDate(selectedDraw.EndDate)}</strong>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="mb-3 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h6 className="mb-0 fw-bold">Add More Tickets</h6>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3 p-2 bg-success bg-opacity-10 rounded border border-success d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <FaWallet className="text-success me-2" />
                      <span className="fw-bold text-success">Wallet Balance:</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className={`fw-bold ${calculateTotalAmount() > walletBalance ? 'text-danger' : 'text-success'}`}>
                        {formatCurrencyDisplay(walletBalance)}
                      </span>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 text-muted"
                        onClick={handleRefreshWallet}
                        disabled={isLoadingWallet}
                        style={{ fontSize: '12px' }}
                        title="Refresh wallet balance"
                      >
                        {isLoadingWallet ? <FaSpinner className="fa-spin" /> : <FaSync />}
                      </Button>
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <h6 className="fw-bold mb-3">Number of Tickets</h6>
                    <div className="d-flex align-items-center justify-content-center gap-4">
                      <Button
                        variant="outline-primary"
                        className="rounded-circle p-0"
                        style={{ width: '45px', height: '45px' }}
                        onClick={handleDecrementTickets}
                        disabled={ticketCount <= 1 || isProcessing}
                      >
                        <FaMinus />
                      </Button>
                      
                      <div className="text-center">
                        <div className="fw-bold fs-1" style={{ color: '#fd290d' }}>
                          {ticketCount}
                        </div>
                        <small className="text-muted">tickets</small>
                      </div>
                      
                      <Button
                        variant="outline-primary"
                        className="rounded-circle p-0"
                        style={{ width: '45px', height: '45px' }}
                        onClick={handleIncrementTickets}
                        disabled={ticketCount >= 100 || isProcessing}
                      >
                        <FaPlus />
                      </Button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h6 className="fw-bold mb-2">
                      Bill Amount
                    </h6>
                    <InputGroup>
                      <InputGroup.Text>₹</InputGroup.Text>
                      <Form.Control 
                        type="number" 
                        placeholder={`Enter bill amount (₹${(minBillAmount || selectedDraw?.termAmount || 0).toLocaleString()} - ₹${(maxBillAmount || selectedDraw?.maxBillAmount || 0).toLocaleString()})`} 
                        value={billAmount} 
                        onChange={(e) => { 
                          const newValue = e.target.value;
                          setBillAmount(newValue);
                          
                          const error = validateBillAmountValue(
                            newValue,
                            minBillAmount || selectedDraw?.termAmount || 0,
                            maxBillAmount || selectedDraw?.maxBillAmount || 0
                          );
                          setValidationErrors(prev => ({ ...prev, billAmount: error }));
                        }} 
                        min={minBillAmount || selectedDraw?.termAmount || 0}
                        max={maxBillAmount || selectedDraw?.maxBillAmount || 0}
                        isInvalid={!!validationErrors.billAmount}
                        className={validationErrors.billAmount ? 'is-invalid' : ''}
                      />
                    </InputGroup>
                    
                    {validationErrors.billAmount && (
                      <div className="text-danger small mt-2 d-flex align-items-center">
                        <FaExclamationTriangle className="me-1" />
                        {validationErrors.billAmount}
                      </div>
                    )}
                    
                    {billAmount && !validationErrors.billAmount && 
                     parseFloat(billAmount) >= (minBillAmount || selectedDraw?.termAmount || 0) && 
                     (maxBillAmount || selectedDraw?.maxBillAmount || 0) > 0 && 
                     parseFloat(billAmount) <= (maxBillAmount || selectedDraw?.maxBillAmount || 0) && (
                      <div className="text-success small mt-2 d-flex align-items-center">
                        <FaCheckCircle className="me-1" />
                        ✓ Valid bill amount
                      </div>
                    )}
                    
                    {(maxBillAmount || selectedDraw?.maxBillAmount || 0) > 0 && (
                      <div className="text-muted small mt-2">
                        <FaInfoCircle className="me-1" />
                        Maximum allowed amount: ₹{(maxBillAmount || selectedDraw?.maxBillAmount || 0).toLocaleString()}
                      </div>
                    )}
                    
                    {(!maxBillAmount && !selectedDraw?.maxBillAmount) && (
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
                      style={{ cursor: 'pointer', backgroundColor: '#f8f9fa' }}
                    >
                      <FaFileUpload className="mb-2" size={24} color={billFile ? '#28a745' : '#6c757d'} />
                      {billFile ? 
                        <><div className="fw-bold mb-1 text-success">{billFile.name}</div><small className="text-muted">Click to change file</small></> : 
                        <><div className="fw-bold mb-1">Click to upload bill</div><small className="text-muted">PDF, JPG, PNG (Max 5MB)</small></>
                      }
                    </div>
                    {validationErrors.billFile && (
                      <div className="text-danger small mt-1 d-flex align-items-center">
                        <FaExclamationTriangle className="me-1" />{validationErrors.billFile}
                      </div>
                    )}
                    <input id="billUpload" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="d-none" />
                  </div>

                  <div className="bg-light rounded p-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Ticket Price:</span>
                      <span>₹{selectedDraw.ticketPrice} × {ticketCount}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Total Amount:</span>
                      <span className="fw-bold text-success fs-5">
                        {formatCurrency(calculateTotalAmount())}
                      </span>
                    </div>
                    
                    {selectedEntry.tickets > 0 && (
                      <div className="mt-2 pt-2 border-top">
                        <small className="text-muted">
                          You already have {selectedEntry.tickets} ticket(s) for this draw
                        </small>
                      </div>
                    )}
                  </div>

                  {insufficientBalanceError && (
                    <div className="alert alert-danger mt-3 mb-0 d-flex align-items-center">
                      <FaExclamationTriangle className="me-2 fs-5" />
                      <div>
                        <strong>Insufficient Balance!</strong><br />
                        <small>{insufficientBalanceError.message}</small>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Modal.Body>
            <Modal.Footer>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowJoinDrawModal(false);
                  setSelectedEntry(null);
                  setSelectedDraw(null);
                  setInsufficientBalanceError(null);
                  setValidationErrors({});
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                variant="warning"
                onClick={handlePurchaseTickets}
                disabled={!isPayButtonEnabled()}
                className="d-flex align-items-center px-4"
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="me-2" />
                    Add {ticketCount} Ticket{ticketCount > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* Customer Selection Modal */}
      <Modal show={showCustomerModal} onHide={() => setShowCustomerModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-warning">
          <Modal.Title>
            <FaUsers className="me-2" /> Select Customer
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <InputGroup>
              <InputGroup.Text><FaSearch /></InputGroup.Text>
              <Form.Control 
                placeholder="Search customers..." 
                value={customerSearch} 
                onChange={(e) => setCustomerSearch(e.target.value)} 
              />
            </InputGroup>
          </div>
          {loadingCustomers ? 
            <LoadingToast show={loadingCustomers} /> : 
            customers.length === 0 ? (
              <div className="text-center py-4">
                <FaUsers size={48} className="text-muted mb-3" />
                <h5>No customers found</h5>
                <Button variant="primary" onClick={() => navigate('/customer-signup')}>
                  <FaUserPlus className="me-2" /> Add Customer
                </Button>
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {customers
                  .filter(c => 
                    (c.displayName || c.name)?.toLowerCase().includes(customerSearch.toLowerCase()) || 
                    c.phone?.includes(customerSearch)
                  )
                  .map(customer => (
                    <div 
                      key={customer.id} 
                      className="p-3 border-bottom cursor-pointer" 
                      onClick={() => handleCustomerSelect(customer)} 
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3" style={{ width: '45px', height: '45px' }}>
                          {customer.avatar}
                        </div>
                        <div>
                          <div className="fw-bold">{customer.displayName || customer.name}</div>
                          <div className="text-muted small">
                            <FaPhone className="me-1" />
                            {customer.phone || 'No phone'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCustomerModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => { navigate('/customer-signup'); }}>
            Add New Customer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Success Modal */}
      {showSuccessModal && purchaseSuccessData && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1080 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <FaCheckCircle className="me-2" /> Purchase Successful!
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={handleCloseSuccessModal}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center p-3 mb-3">
                  <FaCheckCircle size={48} className="text-success" />
                </div>
                <h4 className="fw-bold mb-2">Congratulations!</h4>
                <p className="text-muted mb-4">Your tickets have been added successfully</p>
                <Card className="border-0 shadow-sm mb-4 text-start">
                  <Card.Body>
                    <h6 className="fw-bold mb-3">Purchase Details</h6>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-2">
                          <div className="text-muted small">Customer</div>
                          <div className="fw-bold">{purchaseSuccessData.customerName}</div>
                        </div>
                        <div className="mb-2">
                          <div className="text-muted small">Offer</div>
                          <div className="fw-bold">{purchaseSuccessData.offerName}</div>
                        </div>
                        <div className="mb-2">
                          <div className="text-muted small">Tickets</div>
                          <div className="fw-bold">{purchaseSuccessData.ticketQuantity}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-2">
                          <div className="text-muted small">Total Amount</div>
                          <div className="fw-bold text-danger">₹{purchaseSuccessData.totalTicketPrice}</div>
                        </div>
                        <div className="mb-2">
                          <div className="text-muted small">Bill Amount</div>
                          <div className="fw-bold">₹{purchaseSuccessData.billAmount}</div>
                        </div>
                        {userType === "agent" && (
                          <div className="mb-2">
                            <div className="text-muted small">Commission Earned</div>
                            <div className="fw-bold text-success">₹{purchaseSuccessData.commissionEarned}</div>
                          </div>
                        )}
                      </div>
                      <div className="col-12">
                        
                        {purchaseSuccessData.ticketNumbers && (
                          <div className="mb-2">
                            <div className="text-muted small">Ticket Numbers</div>
                            <div className="fw-bold small">{purchaseSuccessData.ticketNumbers}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
                <div className="d-grid gap-2">
                  <Button variant="danger" onClick={handleBuyAnother}>
                    Buy Another Cashback
                  </Button>
                  <Button variant="outline-secondary" onClick={handleCloseSuccessModal}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default MyCashback;