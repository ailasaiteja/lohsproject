import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Tab, Nav, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaTicketAlt, FaTrophy, FaCalendarAlt, FaRupeeSign,
  FaHistory, FaSpinner, FaCheckCircle,
  FaPlus, FaMinus, FaChevronLeft,
  FaWallet, FaExclamationTriangle, FaSync,
  FaGift, FaUsers, FaMedal, FaEye, FaInfoCircle
} from 'react-icons/fa';
import { fetchUserLuckydraws, fetchUserPurchaseTickets, fetchLuckydrawDetails, fetchWalletBalance } from './myluckydrawApi';
import LoadingToast from '../loading/LoadingToast';
import { useToast } from '../toast/ToastContext';
import { useWallet } from '../../hooks/useWallet';

const MyLuckydraw = ({ user }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { makePurchase, addCommission, walletState } = useWallet();

  // Get user data
  const userId = localStorage.getItem("user_id");
  const userType = localStorage.getItem("user_type")?.toLowerCase();
  const userData = JSON.parse(localStorage.getItem("user_data") || "{}");

  const [entries, setEntries] = useState([]);
  const [currentEntries, setCurrentEntries] = useState([]);
  const [completedEntries, setCompletedEntries] = useState([]);
  const [activeTab, setActiveTab] = useState('current');
  const [showJoinDrawModal, setShowJoinDrawModal] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedCompletedDraw, setSelectedCompletedDraw] = useState(null);
  const [ticketCount, setTicketCount] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [insufficientBalanceError, setInsufficientBalanceError] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [purchaseSuccessData, setPurchaseSuccessData] = useState(null);
  const [apiPurchaseError, setApiPurchaseError] = useState(null);

  // Load entries from API
  useEffect(() => {
    loadEntries();
    loadWalletBalance();
  }, []);

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

  // Filter entries into current and completed
  useEffect(() => {
    if (entries && entries.length > 0) {
      const current = entries.filter(entry => 
        entry.isActive === true && 
        entry.status !== 'Announced' && 
        entry.status !== 'Completed' && 
        entry.status !== 'Ended'
      );
      const completed = entries.filter(entry => 
        entry.isActive === false || 
        entry.status === 'Announced' || 
        entry.status === 'Completed' || 
        entry.status === 'Ended'
      );
      
      setCurrentEntries(current);
      setCompletedEntries(completed);
    } else {
      setCurrentEntries([]);
      setCompletedEntries([]);
    }
  }, [entries]);

  // Load wallet balance from API
  const loadWalletBalance = async (showToastOnLoad = false) => {
    setLoadingBalance(true);
    try {
      const response = await fetchWalletBalance();
      
      let balance = 0;
      
      if (response && response.success && response.data) {
        if (response.data.summary && response.data.summary.current_balance !== undefined) {
          balance = parseFloat(response.data.summary.current_balance);
        }
        else if (response.data.current_balance !== undefined) {
          balance = parseFloat(response.data.current_balance);
        }
        else if (response.data.balance !== undefined) {
          balance = parseFloat(response.data.balance);
        }
        else if (response.data.wallet_balance !== undefined) {
          balance = parseFloat(response.data.wallet_balance);
        }
      } 
      else if (response && response.summary && response.summary.current_balance !== undefined) {
        balance = parseFloat(response.summary.current_balance);
      }
      else if (response && response.current_balance !== undefined) {
        balance = parseFloat(response.current_balance);
      }
      
      console.log('Wallet balance loaded:', balance);
      setWalletBalance(balance);
      
      if (showToastOnLoad) {
        // toast.success('Wallet Updated', `Balance: ₹${balance.toLocaleString('en-IN')}`);
      }
      
      const savedWallets = JSON.parse(localStorage.getItem('flh_wallets') || '{}');
      savedWallets.myWallet = balance;
      localStorage.setItem('flh_wallets', JSON.stringify(savedWallets));
      
    } catch (error) {
      console.error('Error loading wallet balance from API:', error);
      try {
        const savedWallets = JSON.parse(localStorage.getItem('flh_wallets') || '{}');
        if (savedWallets.myWallet !== undefined) {
          setWalletBalance(savedWallets.myWallet);
        } else {
          setWalletBalance(0);
        }
      } catch (fallbackError) {
        console.error('Error loading wallet balance from localStorage:', fallbackError);
        setWalletBalance(0);
      }
    } finally {
      setLoadingBalance(false);
    }
  };

  const loadEntries = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchUserLuckydraws();
      
      let apiData = [];
      
      if (response && response.success && response.lucky_draws && Array.isArray(response.lucky_draws)) {
        apiData = response.lucky_draws;
      } else if (response && response.data && Array.isArray(response.data)) {
        apiData = response.data;
      } else if (response && Array.isArray(response)) {
        apiData = response;
      } else if (response && response.results && Array.isArray(response.results)) {
        apiData = response.results;
      } else if (response && response.draws && Array.isArray(response.draws)) {
        apiData = response.draws;
      }
      
      if (apiData.length > 0) {
        const apiEntries = apiData.map((item, index) => {
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
              purchaseTime: ticket.purchase_time,
              position: winInfo?.position || null,
              prizeAmount: winInfo?.amount || 0,
              prizeType: winInfo?.type || null,
              isWinner: !!winInfo,
              status: winInfo?.status || null
            };
          });
          
          const hasWon = userPrizes.length > 0;
          const prizeAmount = userPrizes.reduce((sum, prize) => {
            return sum + (parseFloat(prize.prize_value) || 0);
          }, 0);
          
          const allWinners = item.prizes || [];
          
          let purchaseDate = item.created_at;
          if (tickets.length > 0 && tickets[0].purchase_time) {
            purchaseDate = tickets[0].purchase_time;
          }
          
          return {
            id: item.id,
            drawId: item.id,
            drawName: item.title || 'Lucky Draw',
            description: item.description || '',
            drawType: getDrawTypeFromName(item.title),
            customerId: user?.id || userId || 298,
            customerName: user?.name || userData?.name || 'Guest User',
            customerPhone: user?.phone || userData?.phone || 'N/A',
            tickets: ticketCount,
            ticketNumbers: enhancedTickets,
            ticketPrice: ticketPrice,
            amount: totalAmount,
            prize: prizeAmount,
            hasWon: hasWon,
            userPrizes: userPrizes,
            allWinners: allWinners,
            date: purchaseDate ? new Date(purchaseDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
            time: purchaseDate ? new Date(purchaseDate).toLocaleTimeString('en-IN') : new Date().toLocaleTimeString('en-IN'),
            purchaseDate: purchaseDate || new Date().toISOString(),
            drawDate: endDate,
            isActive: isActive,
            status: status,
            numberOfWinners: item.number_of_winners || (allWinners.length > 0 ? allWinners.length : 1),
            winnerPrizes: item.winner_prizes || [],
            startDate: item.start_date || '',
            endDate: endDate,
            announcementDate: item.announcement_date,
            category: 'lucky-draw',
            reference: `LD-${item.id}`,
            allPurchases: [item],
            tickets_sold: item.tickets_sold,
            minimum_tickets: item.minimum_tickets
          };
        });
        
        setEntries(apiEntries);
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error('Error loading lucky draw entries:', error);
      setError('Failed to load lucky draw entries. Please try again later.');
      toast.error('Error', 'Failed to load lucky draws');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const getDrawTypeFromName = (drawName) => {
    if (!drawName) return 'special';
    const name = String(drawName).toLowerCase();
    if (name.includes('daily')) return 'daily';
    if (name.includes('weekly')) return 'weekly';
    if (name.includes('monthly')) return 'monthly';
    if (name.includes('festival')) return 'festival';
    if (name.includes('saturday')) return 'weekend';
    if (name.includes('sunday')) return 'weekend';
    return 'special';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }).toUpperCase();
      }
      return dateString;
    } catch (e) {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return dateString;
    } catch (e) {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatCurrencyDisplay = (amount) => {
    if (amount === undefined || amount === null) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const calculateTotalAmount = () => {
    if (!selectedDraw) return 0;
    return (selectedDraw.ticketPrice || 100) * ticketCount;
  };

  const isWalletBalanceSufficient = () => {
    if (!selectedDraw) return false;
    const totalAmount = calculateTotalAmount();
    return totalAmount <= walletBalance && totalAmount > 0;
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
      prizePool: entry.winnerPrizes || [],
      numberOfWinners: entry.numberOfWinners || 1,
      description: entry.description
    });
    setSelectedEntry(entry);
    setTicketCount(1);
    setInsufficientBalanceError(null);
    setApiPurchaseError(null);
    setShowJoinDrawModal(true);
    setLoadingDetails(true);

    await loadWalletBalance(false);

    try {
      const response = await fetchLuckydrawDetails(entry.drawId);
      
      let drawData = null;
      if (response && response.success && response.data) {
        drawData = response.data;
      } else if (response && typeof response === 'object' && response.id) {
        drawData = response;
      }

      if (drawData) {
        const totalWinners = Array.isArray(drawData.prizes) ? drawData.prizes.length : 0;

        setSelectedDraw({
          id: drawData.id,
          Name: drawData.title || entry.drawName,
          StartDate: drawData.start_date || entry.startDate,
          EndDate: drawData.end_date || entry.endDate,
          ticketPrice: parseFloat(drawData.ticket_price) || 100,
          maxTickets: drawData.max_tickets_per_user || 1000,
          prizePool: drawData.prizes || [],
          numberOfWinners: totalWinners,
          description: drawData.description,
          totalTicketsSold: drawData.tickets_sold,
          minimumTickets: drawData.minimum_tickets,
        });
      }
    } catch (error) {
      console.error("Error fetching draw details:", error);
      toast.error('Error', 'Failed to load draw details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewWinners = (entry) => {
    setSelectedCompletedDraw(entry);
    setShowWinnerModal(true);
  };

  const handleIncrementTickets = () => {
    if (!selectedDraw) return;
    setTicketCount(prev => prev + 1);
    setInsufficientBalanceError(null);
  };

  const handleDecrementTickets = () => {
    if (ticketCount > 1) {
      setTicketCount(prev => prev - 1);
      setInsufficientBalanceError(null);
    }
  };

  const handleRefreshWallet = () => {
    loadWalletBalance(true);
  };

  const handlePurchaseTickets = async () => {
    if (!selectedDraw || !selectedEntry) {
      toast.error('Error', 'Invalid draw selection');
      return;
    }
    
    const totalAmount = calculateTotalAmount();
    if (totalAmount > walletBalance) {
      setInsufficientBalanceError({
        message: `Insufficient balance! You need ${formatCurrencyDisplay(totalAmount)} but have only ${formatCurrencyDisplay(walletBalance)}`,
        available_balance: walletBalance,
        required_amount: totalAmount
      });
      toast.error('Insufficient Balance', `Need ${formatCurrencyDisplay(totalAmount)}, Available: ${formatCurrencyDisplay(walletBalance)}`);
      return;
    }
    
    setIsProcessing(true);
    setInsufficientBalanceError(null);
    setApiPurchaseError(null);
    
    try {
      // Prepare purchase data
      const purchaseData = {
        lucky_draw_id: selectedDraw.id,
        tickets_requested: ticketCount,
        customer_id: userId,
        customer_name: userData?.name || 'User',
        customer_phone: userData?.phone || '',
        total_amount: totalAmount,
        payment_method: 'wallet',
        purchase_date: new Date().toISOString()
      };

      console.log('Calling purchase API with data:', purchaseData);
      const response = await fetchUserPurchaseTickets(selectedDraw.id, ticketCount);
      console.log('Purchase API response:', response);
      
      // Handle different response formats
      let isSuccess = false;
      let tickets = [];
      let errorMessage = '';
      
      if (response) {
        if (response.success === true) {
          isSuccess = true;
          tickets = response.tickets || response.data?.tickets || [];
        } else if (response.data && response.data.success === true) {
          isSuccess = true;
          tickets = response.data.tickets || [];
        } else if (response.tickets && Array.isArray(response.tickets) && response.tickets.length > 0) {
          isSuccess = true;
          tickets = response.tickets;
        } else if (response.status === 'success' || response.status === 'SUCCESS') {
          isSuccess = true;
          tickets = response.tickets || [];
        } else if (response.error) {
          errorMessage = response.error;
        } else if (response.message) {
          errorMessage = response.message;
        }
      }
      
      if (!isSuccess) {
        if (response.error_code === 'INSUFFICIENT_WALLET_BALANCE') {
          setInsufficientBalanceError({
            message: errorMessage || 'Insufficient balance',
            available_balance: response.details?.available_balance,
            required_amount: response.details?.required_amount
          });
          toast.error('Insufficient Balance', errorMessage);
          await loadWalletBalance(true);
          setIsProcessing(false);
          return;
        }
        
        throw new Error(errorMessage || response?.message || 'Purchase failed');
      }
      
      // Extract ticket information
      const walletTransactionId = tickets[0]?.wallet_transaction_id;
      const ecbTransactionId = tickets[0]?.ecb_transaction_id;
      const ticketNumbers = tickets.map(t => t.ticket_number || t.ticketNumber).filter(Boolean);
      const customerName = userData?.name || user?.name || 'User';
      
      // Use wallet hook to make purchase
      const purchaseResult = makePurchase(
        totalAmount,
        'luckydraw',
        `${selectedDraw.Name} (${ticketCount} tickets)`,
        customerName
      );
      
      // Calculate and add commission for agents
      const commissionEarned = totalAmount * 0.05;
      if (userType === "agent") {
        addCommission(commissionEarned, selectedDraw.Name, 'Lucky Draw Ticket Commission');
      }
      
      setPurchaseSuccessData({
        transactionId: purchaseResult.transactionId,
        apiPurchaseId: response?.id || response?.data?.id || null,
        walletTransactionId: walletTransactionId,
        ecbTransactionId: ecbTransactionId,
        ticketNumbers: ticketNumbers,
        customerName: customerName,
        offerName: selectedDraw.Name,
        ticketQuantity: ticketCount,
        actualTicketsPurchased: tickets.length,
        ticketPrice: selectedDraw.ticketPrice,
        totalTicketPrice: totalAmount,
        commissionEarned: commissionEarned,
        date: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN'),
        apiMessage: response.message || `Successfully purchased ${tickets.length} ticket(s)`,
        apiTickets: tickets
      });
      
      setShowJoinDrawModal(false);
      setIsProcessing(false);
      
      toast.success('Purchase Successful', `${tickets.length} ticket(s) purchased successfully!`);
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
      
      setApiPurchaseError(errorMessage);
      toast.error('Purchase Failed', errorMessage);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setPurchaseSuccessData(null);
    setSelectedDraw(null);
    setSelectedEntry(null);
    setTicketCount(1);
    loadEntries();
    loadWalletBalance(false);
  };

  const handleBuyAnother = () => {
    setShowSuccessModal(false);
    setPurchaseSuccessData(null);
    setTicketCount(1);
  };

  const getCurrentEntries = () => {
    return activeTab === 'current' ? currentEntries : completedEntries;
  };

  const getOrdinalSuffix = (position) => {
    if (position === 1) return 'st';
    if (position === 2) return 'nd';
    if (position === 3) return 'rd';
    return 'th';
  };

  if (loading) {
    return <LoadingToast show={loading} message="Loading your lucky draws..." />;
  }

  return (
    <Container fluid className="py-4 bg-light min-vh-100">
      <Row className="mb-3">
        <Col>
          <Button
            variant="outline-secondary"
            onClick={() => navigate('/home')}
            className="d-flex align-items-center"
          >
            <FaChevronLeft className="me-2" />
            Back to Home
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
          <div>
            <h1 className="mb-0 text-left fw-bold" style={{color:'#c42b2b'}}>
              My Electronic Lucky Product
            </h1>
          </div>
        </Col>
      </Row>

      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body className="p-0">
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav variant="tabs" className="px-3 pt-3">
              <Nav.Item>
                <Nav.Link eventKey="current" className="fw-bold">
                  <FaSpinner className="me-2" />
                  Current ({currentEntries.length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="completed" className="fw-bold">
                  <FaHistory className="me-2" />
                  Completed ({completedEntries.length})
                </Nav.Link>
              </Nav.Item>
            </Nav>
            
            <Tab.Content className="p-3">
              {getCurrentEntries().length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-4">
                    <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center p-4 mb-3">
                      <FaTrophy className="fs-1 text-muted" />
                    </div>
                    <h4 className="text-muted mb-3">
                      {activeTab === 'current' 
                        ? 'No Current Lucky Products Found' 
                        : 'No Completed Lucky Products Found'}
                    </h4>
                    <p className="text-muted mb-4">
                      {activeTab === 'current'
                        ? "You don't have any current lucky products. Join a new draw to get started!"
                        : "You don't have any completed lucky products yet."}
                    </p>
                    <div className="d-flex justify-content-center gap-3">
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={() => navigate('/lucky-draw')}
                        className="d-flex align-items-center"
                      >
                        <FaTicketAlt className="me-2" />
                        Join Lucky Draw
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
                        <th>Draw name</th>
                        <th>Tickets</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCurrentEntries().map((entry, index) => (
                        <tr key={entry.id || index}>
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
                                    {prize.winning_position}{getOrdinalSuffix(prize.winning_position)}: ₹{prize.prize_value}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="text-left">
                            <div className="fw-bold">{entry.tickets}</div>
                          </td>
                          <td>
                            <div className="fw-bold ">{formatCurrency(entry.amount)}</div>
                            <small className="text-muted d-block">
                              Per ticket: {formatCurrency(entry.ticketPrice)}
                            </small>
                          </td>
                          <td>
                            <div className="fw-bold">
                              <FaCalendarAlt className="me-2" />
                              {formatDate(entry.announcementDate || entry.endDate)}
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="d-flex gap-2">
                              {entry.isActive && entry.status !== 'Announced' ? (
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleJoinAgain(entry)}
                                  className="w-60"
                                >
                                  Join Again
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="info"
                                    size="sm"
                                    onClick={() => handleViewWinners(entry)}
                                    className="w-60"
                                  >
                                    <FaEye className="me-1" /> View Details
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-60"
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

      {/* Details Modal */}
      <Modal 
        show={showWinnerModal} 
        onHide={() => {
          setShowWinnerModal(false);
          setSelectedCompletedDraw(null);
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
                    Lucky Draw Details
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
                        <small className="text-muted d-block">Draw Date</small>
                        <strong className="fs-6">{formatDate(selectedCompletedDraw.endDate)}</strong>
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
            </Modal.Body>
            
            <Modal.Footer className="border-0">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowWinnerModal(false);
                  setSelectedCompletedDraw(null);
                }}
              >
                Close
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* Loading Toast for details fetch */}
      {loadingDetails && <LoadingToast show={loadingDetails} message="Loading draw details..." />}

      {/* Join Draw Modal */}
      <Modal 
        show={showJoinDrawModal} 
        onHide={() => {
          setShowJoinDrawModal(false);
          setSelectedEntry(null);
          setSelectedDraw(null);
          setInsufficientBalanceError(null);
          setApiPurchaseError(null);
        }} 
        size="lg"
        centered
      >
        {selectedDraw && selectedEntry && (
          <>
            <Modal.Header closeButton className="bg-danger text-white">
              <Modal.Title className="d-flex align-items-center">
                <FaTicketAlt className="me-2" />
                LUCKY DRAW OVERVIEW
                {loadingDetails && <FaSpinner className="fa-spin ms-2" />}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {/* Display API Error if any */}
              {apiPurchaseError && (
                <Alert variant="danger" className="mb-4" onClose={() => setApiPurchaseError(null)} dismissible>
                  <FaExclamationTriangle className="me-2" />
                  {apiPurchaseError}
                </Alert>
              )}

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
                      {loadingBalance && <FaSpinner className="fa-spin text-muted" size="14" />}
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 text-muted"
                        onClick={handleRefreshWallet}
                        disabled={loadingBalance}
                        style={{ fontSize: '12px' }}
                        title="Refresh wallet balance"
                      >
                        <FaSync />
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
                        disabled={isProcessing}
                      >
                        <FaPlus />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-light rounded p-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Ticket Price:</span>
                      <span>{formatCurrencyDisplay(selectedDraw.ticketPrice)} × {ticketCount}</span>
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
                        <small>
                          {insufficientBalanceError.message}
                          {insufficientBalanceError.available_balance && (
                            <span> Available: {formatCurrencyDisplay(insufficientBalanceError.available_balance)}, 
                            Required: {formatCurrencyDisplay(insufficientBalanceError.required_amount)}</span>
                          )}
                        </small>
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
                  setApiPurchaseError(null);
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                variant="warning"
                onClick={handlePurchaseTickets}
                disabled={isProcessing || !isWalletBalanceSufficient()}
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

      {/* Success Modal */}
      {showSuccessModal && purchaseSuccessData && (
        <Modal show={showSuccessModal} onHide={handleCloseSuccessModal} size="lg" centered>
          <Modal.Header closeButton style={{ backgroundColor: '#28a745', color: 'white' }}>
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
                  backgroundColor: '#28a745',
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
                      <div className="fw-bold">{purchaseSuccessData.offerName}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Tickets</div>
                      <div className="fw-bold">{purchaseSuccessData.ticketQuantity}</div>
                      {purchaseSuccessData.actualTicketsPurchased !== purchaseSuccessData.ticketQuantity && (
                        <small className="text-warning d-block">
                          (Actually purchased: {purchaseSuccessData.actualTicketsPurchased})
                        </small>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-2">
                      <div className="text-muted small">Total Amount</div>
                      <div className="fw-bold text-success">{formatCurrencyDisplay(purchaseSuccessData.totalTicketPrice)}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Date & Time</div>
                      <div className="fw-bold small">{purchaseSuccessData.date} {purchaseSuccessData.time}</div>
                    </div>
                    {/* {purchaseSuccessData.walletTransactionId && (
                      <div className="mb-2">
                        <div className="text-muted small">Wallet Transaction ID</div>
                        <div className="fw-bold small">{purchaseSuccessData.walletTransactionId}</div>
                      </div>
                    )}
                  </div>
                  <div className="col-12">
                    <div className="mb-2">
                      <div className="text-muted small">Transaction ID</div>
                      <div className="fw-bold small">{purchaseSuccessData.transactionId}</div>
                    </div> */}
                  </div>

                  {/* Show ticket numbers if available */}
                  {purchaseSuccessData.ticketNumbers && purchaseSuccessData.ticketNumbers.length > 0 && (
                    <div className="col-12">
                      <div className="mb-2">
                        <div className="text-muted small">Ticket Numbers</div>
                        <div className="fw-bold small">
                          {purchaseSuccessData.ticketNumbers.join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="d-grid gap-2">
              <Button variant="primary" onClick={handleBuyAnother} style={{ backgroundColor: '#c42b2b', borderColor: '#c42b2b' }}>
                Buy More Tickets
              </Button>
              <Button variant="outline-secondary" onClick={handleCloseSuccessModal}>
                Close
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </Container>
  );
};

export default MyLuckydraw;