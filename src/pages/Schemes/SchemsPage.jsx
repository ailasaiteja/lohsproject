import { getCall } from "../../services/api";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    fetchActiveSchemes,
    joinSchemeByAgent,
    joinScheme
} from "./schemesApi";
import { customerApi } from "../MyCustomers/customerApi";
import { useToast } from "../toast/ToastContext";
import {
    FaGift, FaRupeeSign, FaUsers,
    FaArrowLeft, FaCheckCircle, FaEnvelope,
    FaChartLine, FaUser, FaSearch,
    FaFilter, FaTimes, FaInfoCircle,
    FaWallet, FaCalendarAlt, FaPercentage,
    FaCalendarDay, FaCalendarWeek, FaCalendar,
    FaExclamationTriangle, FaUserPlus,
    FaPhone, FaArrowRight, FaUsers as FaUsersIcon,
    FaTrophy, FaSpinner, FaSync,
    FaMobile, FaCheckDouble, FaPlusCircle
} from "react-icons/fa";
import LoadingToast from "../loading/LoadingToast";

const SchemesPage = ({ user }) => {
    const navigate = useNavigate();
    const toast = useToast();

    // Ref to prevent duplicate toasts
    const toastShownRef = useRef(false);
    const isMountedRef = useRef(true);

    // State for API data
    const [activeSchemes, setActiveSchemes] = useState([]);
    const [loadingSchemes, setLoadingSchemes] = useState(true);
    const [error, setError] = useState("");

    // State to track user's enrolled schemes (all enrollments)
    const [enrolledSchemes, setEnrolledSchemes] = useState([]);

    // UI State
    const [selectedScheme, setSelectedScheme] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [customerSearch, setCustomerSearch] = useState("");
    const [schemeSearch, setSchemeSearch] = useState("");
    const [schemeTypeFilter, setSchemeTypeFilter] = useState("all");
    const [enrolling, setEnrolling] = useState(false);
    const [enrollmentSuccessData, setEnrollmentSuccessData] = useState(null);
    const [apiResponse, setApiResponse] = useState(null);

    // Wallet state
    const [walletBalance, setWalletBalance] = useState(() => {
        try {
            const saved = localStorage.getItem("flh_wallets");
            const parsed = saved ? JSON.parse(saved) : {
                myWallet: 12500,
                commissionWallet: 3200,
                withdrawWallet: 0
            };
            return parsed.myWallet;
        } catch {
            return 12500;
        }
    });

    // Get logged user details from localStorage
    const userId = localStorage.getItem("user_id");
    const userType = localStorage.getItem("user_type")?.toLowerCase();
    const userData = JSON.parse(localStorage.getItem("user_data") || "{}");

    console.log("User ID:", userId);
    console.log("User Type:", userType);
    console.log("User Data:", userData);

    // Customers state - from API
    const [customers, setCustomers] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [customersError, setCustomersError] = useState(null);

    // Load enrolled schemes from localStorage
    const loadEnrolledSchemes = () => {
        try {
            const savedSchemes = localStorage.getItem("flh_schemes");
            if (savedSchemes) {
                const allEnrollments = JSON.parse(savedSchemes);

                // Filter enrollments for current user/customer
                let userEnrollments;

                if (userType === "customer") {
                    // For customer, filter by customer ID
                    userEnrollments = allEnrollments.filter(
                        enrollment => String(enrollment.customerId) === String(userId)
                    );
                } else if (userType === "agent") {
                    // For agent, get all enrollments (will be filtered by customer later)
                    userEnrollments = allEnrollments;
                } else {
                    userEnrollments = [];
                }

                setEnrolledSchemes(userEnrollments);
                return userEnrollments;
            }
        } catch (error) {
            console.error("Error loading enrolled schemes:", error);
        }
        return [];
    };

    // Check if a scheme is already enrolled by the user/customer (returns count)
    const getSchemeEnrollmentCount = (schemeId, customerId = null) => {
        const targetCustomerId = customerId || (userType === "customer" ? userId : null);

        if (!targetCustomerId) return 0;

        return enrolledSchemes.filter(
            enrollment =>
                String(enrollment.schemeId) === String(schemeId) &&
                String(enrollment.customerId) === String(targetCustomerId) &&
                enrollment.status === "active"
        ).length;
    };

    // Get all enrollments for a scheme
    const getSchemeEnrollments = (schemeId, customerId = null) => {
        const targetCustomerId = customerId || (userType === "customer" ? userId : null);

        if (!targetCustomerId) return [];

        return enrolledSchemes.filter(
            enrollment =>
                String(enrollment.schemeId) === String(schemeId) &&
                String(enrollment.customerId) === String(targetCustomerId) &&
                enrollment.status === "active"
        );
    };

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
                const transformedCustomers = response.map(customer => {
                    // Get all enrollments for this customer
                    const customerEnrollments = enrolledSchemes.filter(
                        e => String(e.customerId) === String(customer.id)
                    );

                    // Group enrollments by scheme
                    const enrollmentsByScheme = {};
                    customerEnrollments.forEach(enrollment => {
                        const schemeId = enrollment.schemeId;
                        if (!enrollmentsByScheme[schemeId]) {
                            enrollmentsByScheme[schemeId] = [];
                        }
                        enrollmentsByScheme[schemeId].push(enrollment);
                    });

                    return {
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
                        schemesEnrolled: customerEnrollments.length,
                        totalInvestment: customerEnrollments.reduce((sum, e) => sum + (e.amountPaid || 0), 0),
                        lastActivity: "Today",
                        enrolledSchemes: enrollmentsByScheme
                    };
                });

                console.log(`Transformed ${transformedCustomers.length} customers`);
                setCustomers(transformedCustomers);

                // Show success toast for customers loaded
                if (!toastShownRef.current) {
                    // toast.success('Success', `Loaded ${transformedCustomers.length} customers`);
                }

                try {
                    localStorage.setItem('flh_customers_api', JSON.stringify(transformedCustomers));
                } catch (e) {
                    console.error('Error saving to localStorage:', e);
                }
            } else {
                console.log('No customers found from API');
                setCustomers([]);
                // toast.info('No Customers', 'No customers found. Please add customers first.');

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

    // Fetch active schemes on component mount
    useEffect(() => {
        const loadSchemes = async () => {
            try {
                setLoadingSchemes(true);
                setError("");

                // Load enrolled schemes first
                const enrolled = loadEnrolledSchemes();

                const data = await fetchActiveSchemes();
                console.log("API Response:", data);

                const formattedSchemes = data.map((scheme) => {
                    // Get enrollment count for this scheme
                    const enrollmentCount = getSchemeEnrollmentCount(scheme.id, userType === "customer" ? userId : null);

                    return {
                        id: scheme.id,
                        name: scheme.name,
                        description: scheme.description,
                        type: scheme.type,
                        duration: scheme.duration,
                        end_date: scheme.end_date,
                        status: scheme.status,
                        scheme_term_amount: scheme.scheme_term_amount,
                        scheme_total_amount: scheme.scheme_total_amount,
                        scheme_maturity: scheme.scheme_maturity,
                        created_by: scheme.created_by,
                        updated_by: scheme.updated_by,
                        created_at: scheme.created_at,
                        updated_at: scheme.updated_at,
                        joined: enrollmentCount > 0,
                        enrollmentCount: enrollmentCount,
                        color: getSchemeColor(scheme.type),
                        howItWorks: [
                            `Choose ${scheme.name} scheme`,
                            `Pay ₹${scheme.scheme_term_amount} per ${scheme.type} term`,
                            `Complete ${scheme.duration} terms`,
                            `Receive maturity amount of ₹${scheme.scheme_maturity} on ${new Date(scheme.end_date).toLocaleDateString("en-IN")}`
                        ]
                    };
                });

                console.log("Formatted Schemes:", formattedSchemes);
                setActiveSchemes(formattedSchemes);

                // Show success toast for schemes loaded
                // toast.success('Success', `Loaded ${formattedSchemes.length} active schemes`);
            } catch (err) {
                setError("Failed to load active schemes. Please try again.");
                console.error("Error loading schemes:", err);
                toast.error('Error', 'Failed to load schemes');
            } finally {
                setLoadingSchemes(false);
            }
        };

        loadSchemes();

        if (userType === 'agent') {
            fetchCustomersFromAPI();
        }

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Reload enrolled schemes when a new enrollment is added
    useEffect(() => {
        if (showSuccessModal === false && enrollmentSuccessData) {
            const newEnrollments = loadEnrolledSchemes();

            // Update active schemes with new enrollment count
            setActiveSchemes(prevSchemes =>
                prevSchemes.map(scheme => {
                    if (scheme.id === enrollmentSuccessData.schemeId) {
                        const newCount = getSchemeEnrollmentCount(scheme.id, userType === "customer" ? userId : null);
                        return {
                            ...scheme,
                            joined: newCount > 0,
                            enrollmentCount: newCount
                        };
                    }
                    return scheme;
                })
            );
        }
    }, [showSuccessModal]);

    // Helper function to get scheme color based on type
    const getSchemeColor = (type) => {
        switch (type?.toLowerCase()) {
            case "daily": return "#FF6B6B";
            case "weekly": return "#06D6A0";
            case "monthly": return "#073B4C";
            default: return "#FF6B6B";
        }
    };

    // Helper function to format type for display
    const formatType = (type) => {
        if (!type) return "Scheme";
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    // Filter schemes based on search and type
    const filteredSchemes = activeSchemes.filter(scheme => {
        const matchesSearch = scheme.name?.toLowerCase().includes(schemeSearch.toLowerCase()) ||
            scheme.description?.toLowerCase().includes(schemeSearch.toLowerCase());
        const matchesType = schemeTypeFilter === "all" || scheme.type?.toLowerCase() === schemeTypeFilter.toLowerCase();
        return matchesSearch && matchesType;
    });

    // Filter customers based on search
    const filteredCustomers = customers.filter(customer => {
        if (!customer) return false;
        const searchLower = customerSearch.toLowerCase();
        return (
            customer.name.toLowerCase().includes(searchLower) ||
            (customer.phone || "").includes(customerSearch)
        );
    });

    // Handle join scheme click
    const handleJoinScheme = (scheme) => {
        setSelectedScheme(scheme);
        setShowDetailsModal(true);
        // toast.info('Scheme Details', `Viewing details for ${scheme.name}`);
    };

    // Handle buy now from details modal
    const handleBuyNow = () => {
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
        setShowDetailsModal(false);

        if (userType === "customer") {
            const loggedCustomer = {
                id: userId,
                name: userData.name || "Customer",
                avatar: userData.name?.charAt(0)?.toUpperCase() || "CU",
                phone: userData.phone || "",
                schemesEnrolled: 0,
                totalInvestment: 0,
                lastActivity: "Today"
            };

            setSelectedCustomer(loggedCustomer);
            setShowPurchaseModal(true);
            // toast.info('Enrollment', 'Please confirm enrollment details');
        }
        else if (userType === "agent") {
            setShowCustomerModal(true);
            // toast.info('Select Customer', 'Please select a customer to enroll');
            if (customers.length === 0 && !loadingCustomers) {
                fetchCustomersFromAPI();
            }
        } else {
            toast.error('Error', 'User type not recognized');
        }
    };

    // Handle customer selection
    const handleCustomerSelect = (customer) => {
        setSelectedCustomer(customer);
        setShowCustomerModal(false);
        setShowPurchaseModal(true);

        const existingEnrollments = customer.enrolledSchemes?.[selectedScheme.id]?.length || 0;
        if (existingEnrollments > 0) {
            // toast.info('Additional Enrollment', `${customer.name} has already enrolled ${existingEnrollments} time(s). You can enroll again.`);
        } else {
            // toast.success('Customer Selected', `${customer.name} selected for enrollment`);
        }
    };

    // Handle scheme enrollment
    const handleEnrollScheme = async () => {
        if (!selectedScheme || !selectedCustomer) {
            toast.error('Error', 'Please select a customer and scheme first');
            return;
        }

        // Check wallet balance
        if (walletBalance < selectedScheme.scheme_term_amount) {
            toast.error('Insufficient Balance', `Need ₹${selectedScheme.scheme_term_amount}, Available: ₹${walletBalance}`);
            return;
        }

        // Show confirmation toast first
        const existingCount = getSchemeEnrollmentCount(selectedScheme.id, selectedCustomer.id);
        if (existingCount > 0) {
            // toast.info('Additional Enrollment', `This will be enrollment #${existingCount + 1} for ${selectedCustomer.name} in ${selectedScheme.name}`);
        } else {
            // toast.info('Confirm Enrollment', `Enrolling ${selectedCustomer.name} in ${selectedScheme.name} for ₹${selectedScheme.scheme_term_amount}`);
        }

        setEnrolling(true);

        try {
            // Prepare API request data
            const customerId = parseInt(selectedCustomer.id);
            if (isNaN(customerId)) {
                throw new Error("Invalid customer ID");
            }

            const schemeId = parseInt(selectedScheme.id);
            if (isNaN(schemeId)) {
                throw new Error("Invalid scheme ID");
            }

            const amount = parseFloat(selectedScheme.scheme_term_amount);
            if (isNaN(amount) || amount <= 0) {
                throw new Error("Invalid amount");
            }

            const requestData = {
                scheme_id: schemeId,
                customer_id: customerId,
                amount: amount
            };

            console.log("API Request Data:", requestData);

            // Call appropriate API based on user type
            let apiResponse;
            if (userType === "agent") {
                console.log("Calling joinSchemeByAgent API...");
                apiResponse = await joinSchemeByAgent(requestData);
            } else {
                console.log("Calling joinScheme API...");
                apiResponse = await joinScheme(requestData);
            }

            console.log("API Response:", apiResponse);
            setApiResponse(apiResponse);

            // Check if API response indicates success
            if (!apiResponse || apiResponse.success === false) {
                throw new Error(apiResponse?.message || apiResponse?.error || "API returned an error");
            }

            // Make first term payment from wallet (local)
            const paymentResult = makePurchase(
                selectedScheme.scheme_term_amount,
                "scheme_enrollment",
                `First term payment for ${selectedScheme.name}`,
                selectedCustomer.name
            );

            // Add commission (5% of first payment) - only for agents
            if (userType === "agent") {
                const commissionAmount = selectedScheme.scheme_term_amount * 0.05;
                addCommission(commissionAmount, selectedScheme.name, "Enrollment Commission");
            }

            // Create local enrollment record
            const enrollmentNumber = getSchemeEnrollmentCount(selectedScheme.id, selectedCustomer.id) + 1;
            const schemeEnrollment = {
                id: Date.now(),
                enrollmentNumber: enrollmentNumber,
                api_id: apiResponse?.id || apiResponse?.enrollment_id || null,
                customerId: selectedCustomer.id,
                customerName: selectedCustomer.name,
                customerAvatar: selectedCustomer.avatar,
                schemeId: selectedScheme.id,
                schemeName: selectedScheme.name,
                type: selectedScheme.type,
                duration: selectedScheme.duration,
                perTerm: selectedScheme.scheme_term_amount,
                totalTerms: selectedScheme.duration,
                totalAmount: selectedScheme.scheme_total_amount,
                maturityAmount: selectedScheme.scheme_maturity,
                enrolledDate: new Date().toLocaleDateString("en-IN"),
                endDate: selectedScheme.end_date,
                currentTerm: 2,
                totalPaidTerms: 1,
                amountPaid: selectedScheme.scheme_term_amount,
                remainingTerms: selectedScheme.duration - 1,
                status: "active",
                nextPaymentDate: calculateNextPaymentDate(selectedScheme.type),
                paymentHistory: [{
                    termNumber: 1,
                    amount: selectedScheme.scheme_term_amount,
                    date: new Date().toLocaleDateString("en-IN"),
                    time: new Date().toLocaleTimeString("en-IN"),
                    transactionId: paymentResult.transactionId,
                    apiReference: apiResponse?.id || null
                }]
            };

            // Save to localStorage
            const savedSchemes = JSON.parse(localStorage.getItem("flh_schemes") || "[]");
            savedSchemes.push(schemeEnrollment);
            localStorage.setItem("flh_schemes", JSON.stringify(savedSchemes));

            // Update enrolled schemes state
            setEnrolledSchemes(prev => [...prev, schemeEnrollment]);

            // Create user entry
            const userSchemeEntry = {
                id: Date.now(),
                enrollmentNumber: enrollmentNumber,
                userId: userId,
                customerId: selectedCustomer.id,
                customerName: selectedCustomer.name,
                schemeId: selectedScheme.id,
                schemeName: selectedScheme.name,
                title: `${selectedScheme.name} (Enrollment #${enrollmentNumber})`,
                schemeType: selectedScheme.type,
                amount: selectedScheme.scheme_term_amount,
                totalInvestment: selectedScheme.scheme_total_amount,
                maturityAmount: selectedScheme.scheme_maturity,
                totalTerms: selectedScheme.duration,
                paidTerms: 1,
                termType: selectedScheme.type,
                installmentAmount: selectedScheme.scheme_term_amount,
                date: new Date().toLocaleDateString("en-IN"),
                enrollmentDate: new Date().toLocaleDateString("en-IN"),
                maturityDate: new Date(selectedScheme.end_date).toLocaleDateString("en-IN"),
                status: "Active",
                category: "scheme",
                reference: paymentResult.transactionId,
                apiReference: apiResponse?.id || null,
                progress: Math.round((1 / selectedScheme.duration) * 100),
                expectedReturn: selectedScheme.scheme_maturity - selectedScheme.scheme_total_amount,
                amountPaid: selectedScheme.scheme_term_amount,
                remainingTerms: selectedScheme.duration - 1,
                currentTerm: 2,
                nextPaymentDate: calculateNextPaymentDate(selectedScheme.type)
            };

            const userEntries = JSON.parse(localStorage.getItem("userEntries") || "[]");
            userEntries.push(userSchemeEntry);
            localStorage.setItem("userEntries", JSON.stringify(userEntries));

            // Update customer stats and enrolled schemes list
            const updatedCustomers = customers.map(c => {
                if (c.id === selectedCustomer.id) {
                    const currentEnrollments = c.enrolledSchemes?.[selectedScheme.id]?.length || 0;
                    const updatedEnrollments = {
                        ...c.enrolledSchemes,
                        [selectedScheme.id]: [...(c.enrolledSchemes?.[selectedScheme.id] || []), schemeEnrollment]
                    };

                    return {
                        ...c,
                        schemesEnrolled: (c.schemesEnrolled || 0) + 1,
                        totalInvestment: (c.totalInvestment || 0) + selectedScheme.scheme_term_amount,
                        lastActivity: new Date().toLocaleDateString("en-IN"),
                        enrolledSchemes: updatedEnrollments
                    };
                }
                return c;
            });

            localStorage.setItem("flh_customers_api", JSON.stringify(updatedCustomers));
            setCustomers(updatedCustomers);

            // Update active schemes with new enrollment count
            const updatedSchemes = activeSchemes.map(scheme => {
                if (scheme.id === selectedScheme.id) {
                    const newCount = getSchemeEnrollmentCount(scheme.id, selectedCustomer.id);
                    return {
                        ...scheme,
                        joined: true,
                        enrollmentCount: newCount + 1
                    };
                }
                return scheme;
            });
            setActiveSchemes(updatedSchemes);

            // Show success toast
            toast.success('Enrollment Successful', `${selectedCustomer.name} enrolled in ${selectedScheme.name} `);
            window.dispatchEvent(new Event("wallet-updated"));


            // Set success data for modal
            setEnrollmentSuccessData({
                customerName: selectedCustomer.name,
                schemeName: selectedScheme.name,
                enrollmentNumber: enrollmentNumber,
                amountPaid: selectedScheme.scheme_term_amount,
                newBalance: paymentResult.newBalance,
                schemeColor: selectedScheme.color,
                schemeId: selectedScheme.id,
                transactionId: paymentResult.transactionId,
                apiReference: apiResponse?.id || null,
                date: new Date().toLocaleDateString("en-IN"),
                time: new Date().toLocaleTimeString("en-IN"),
                message: apiResponse?.message || `Enrollment #${enrollmentNumber} successful!`
            });

            setShowSuccessModal(true);
            setShowPurchaseModal(false);

        } catch (error) {
            console.error("Enrollment error:", error);

            // Handle specific API errors
            let errorMessage = "Failed to enroll customer";

            if (error.response) {
                console.error("API Error Response Data:", error.response.data);

                if (error.response.data) {
                    if (error.response.data.error) {
                        errorMessage = error.response.data.error;
                    } else if (error.response.data.message) {
                        errorMessage = error.response.data.message;
                    } else if (typeof error.response.data === 'string') {
                        errorMessage = error.response.data;
                    }
                }

                errorMessage = `Server error (${error.response.status}): ${errorMessage}`;
            } else if (error.request) {
                console.error("No response received:", error.request);
                errorMessage = "No response from server. Please check your internet connection.";
            } else {
                console.error("Request setup error:", error.message);
                errorMessage = `Insufficient wallet balance to join scheme`;
            }

            // Show error toast
            toast.error('Enrollment Failed', errorMessage);

        } finally {
            setEnrolling(false);
        }
    };

    // Wallet functions
    const makePurchase = (amount, category, description, customerName = null) => {
        if (walletBalance < amount) {
            throw new Error(`Insufficient balance. Need ₹${amount}, available ₹${walletBalance}`);
        }

        const currentWallets = JSON.parse(localStorage.getItem("flh_wallets") || JSON.stringify({
            myWallet: walletBalance,
            commissionWallet: 3200,
            withdrawWallet: 0
        }));

        const newBalance = walletBalance - amount;
        const updatedWallets = { ...currentWallets, myWallet: newBalance };

        const transactionId = `SCH-${Date.now()}`;
        const newTransaction = {
            id: Date.now(),
            transactionId: transactionId,
            date: new Date().toLocaleDateString("en-IN"),
            time: new Date().toLocaleTimeString("en-IN"),
            type: "debit",
            amount: amount,
            category: category,
            description: description,
            customer: customerName,
            balance: newBalance,
            status: "completed"
        };

        setWalletBalance(newBalance);
        localStorage.setItem("flh_wallets", JSON.stringify(updatedWallets));

        const savedTransactions = localStorage.getItem("flh_transactions");
        const transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
        transactions.unshift(newTransaction);
        localStorage.setItem("flh_transactions", JSON.stringify(transactions));

        return { success: true, newBalance, transactionId };
    };

    const addCommission = (amount, source, description) => {
        const currentWallets = JSON.parse(localStorage.getItem("flh_wallets") || JSON.stringify({
            myWallet: walletBalance,
            commissionWallet: 3200,
            withdrawWallet: 0
        }));

        const newCommissionBalance = (currentWallets.commissionWallet || 0) + amount;
        const updatedWallets = { ...currentWallets, commissionWallet: newCommissionBalance };

        const newTransaction = {
            id: Date.now(),
            transactionId: `COMM-${Date.now()}`,
            date: new Date().toLocaleDateString("en-IN"),
            time: new Date().toLocaleTimeString("en-IN"),
            type: "credit",
            amount: amount,
            category: "commission",
            description: `${description} - ${source}`,
            balance: newCommissionBalance,
            status: "completed"
        };

        localStorage.setItem("flh_wallets", JSON.stringify(updatedWallets));

        const savedTransactions = localStorage.getItem("flh_transactions");
        const transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
        transactions.unshift(newTransaction);
        localStorage.setItem("flh_transactions", JSON.stringify(transactions));

        return { success: true, newBalance: newCommissionBalance };
    };

    const calculateNextPaymentDate = (schemeType) => {
        const today = new Date();
        const nextDate = new Date(today);

        switch (schemeType?.toLowerCase()) {
            case "daily":
                nextDate.setDate(today.getDate() + 1);
                break;
            case "weekly":
                nextDate.setDate(today.getDate() + 7);
                break;
            case "monthly":
                nextDate.setMonth(today.getMonth() + 1);
                break;
            default:
                nextDate.setDate(today.getDate() + 7);
        }

        return nextDate.toLocaleDateString("en-IN");
    };

    // Modal close handlers
    const closePurchaseModal = () => {
        setShowPurchaseModal(false);
        setSelectedCustomer(null);
        // toast.info('Cancelled', 'Enrollment cancelled');
    };

    const closeSuccessModal = () => {
        setShowSuccessModal(false);
        setEnrollmentSuccessData(null);
        setSelectedScheme(null);
        setSelectedCustomer(null);
        setApiResponse(null);
    };

    const handleBuyAnother = () => {
        setShowSuccessModal(false);
        setEnrollmentSuccessData(null);
        setSelectedScheme(null);
        setSelectedCustomer(null);
        setApiResponse(null);
        // toast.info('New Enrollment', 'Ready to enroll another customer');
    };

    // Loading state
    if (loadingSchemes) {
        return (
            <LoadingToast show={loadingSchemes} message="Loading schemes..." />
        );
    }

    // Error state
    if (error) {
        return (
            <div className="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <FaExclamationTriangle className="text-danger fs-1 mb-3" />
                    <h5 className="text-danger mb-3">Failed to load schemes</h5>
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
            {/* Header */}
            <div className="mb-4">
                <div className="d-flex gap-3 mb-4">
                    <button
                        className="btn btn-outline-warning btn-sm"
                        onClick={() => navigate("/home")}
                    >
                        <FaArrowLeft className="me-2" />
                        Back to Dashboard
                    </button>
                </div>

                <div className="mb-4">
                    <h2 className="fw-bold mb-2 text-danger">
                        <FaChartLine className="me-2 text-warning" />
                        Schemes
                    </h2>
                </div>
            </div>

            {/* Search and Filter Row */}
            <div className="card shadow-sm mb-4 border-0">
                <div className="card-body p-3">
                    <div className="row g-2">
                        <div className="col-md-8">
                            <div className="input-group">
                                <span className="input-group-text bg-warning text-white border-0">
                                    <FaSearch />
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-0 shadow-none"
                                    placeholder="Search schemes by name or description..."
                                    value={schemeSearch}
                                    onChange={(e) => setSchemeSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="input-group">
                                <span className="input-group-text bg-warning text-white border-0">
                                    <FaFilter />
                                </span>
                                <select
                                    className="form-select border-0 shadow-none"
                                    value={schemeTypeFilter}
                                    onChange={(e) => setSchemeTypeFilter(e.target.value)}
                                >
                                    <option value="all">All Schemes</option>
                                    <option value="daily">Daily Schemes</option>
                                    <option value="weekly">Weekly Schemes</option>
                                    <option value="monthly">Monthly Schemes</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schemes Grid */}
            <div className="row">
                {filteredSchemes.length === 0 ? (
                    <div className="col-12 text-center py-5">
                        <FaChartLine className="text-muted fs-1 mb-3 opacity-50" />
                        <h5 className="text-muted mb-3">No schemes found</h5>
                        <p className="text-muted">Try adjusting your search or filter</p>
                    </div>
                ) : (
                    filteredSchemes.map((scheme) => (
                        <div className="col-md-6 col-lg-4 mb-3" key={scheme.id}>
                            <div className="card h-100 shadow-sm border-0">
                                <div className="card-body p-3">
                                    <div className="mb-2">
                                        <h6 className="fw-bold mb-3">
                                            <FaChartLine className="me-2 text-warning" />
                                            {scheme.name}
                                        </h6>
                                    </div>

                                    {/* {scheme.enrollmentCount > 0 && (
                                        <div className="mb-2">
                                            <span className="badge bg-info me-2">
                                                <FaCheckDouble className="me-1" />
                                                {scheme.enrollmentCount} Enrollment{scheme.enrollmentCount !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    )} */}

                                    <div className="mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="text-muted small">Term amount:</span>
                                            <span className="fw-bold">₹{scheme.scheme_term_amount}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="text-muted small">Total Terms:</span>
                                            <span className="fw-bold">{scheme.duration}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="text-muted small">Total amount:</span>
                                            <span className="fw-bold">₹{scheme.scheme_total_amount}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-muted small">Maturity Amount:</span>
                                            <span className="fw-bold text-success">₹{scheme.scheme_maturity}</span>
                                        </div>
                                    </div>

                                    <button
                                        className={`btn w-100 ${scheme.enrollmentCount > 0 ? 'btn-outline-danger' : 'btn-outline-danger'}`}
                                        onClick={() => handleJoinScheme(scheme)}
                                        disabled={walletBalance < scheme.scheme_term_amount}
                                    >
                                        {walletBalance < scheme.scheme_term_amount ? (
                                            <>
                                                {/* <FaRupeeSign className="me-1" />
                                                Need ₹{scheme.scheme_term_amount - walletBalance} more */}
                                            </>
                                        ) : (
                                            <>
                                                <div className="me-2" />
                                                {scheme.enrollmentCount > 0 ? `Join Again ` : "Join Now"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedScheme && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1080 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "15px" }}>
                            <div className="modal-header bg-danger text-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="modal-title fw-bold mb-0">
                                    {selectedScheme.name}
                                </h5>
                                <button
                                    className="btn-close btn-close-white"
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        // toast.info('Closed', 'Scheme details closed');
                                    }}
                                ></button>
                            </div>

                            <div className="modal-body p-4">
                                {selectedScheme.enrollmentCount > 0 && (
                                    <div className="alert alert-info mb-4">
                                        <FaCheckDouble className="me-2" />
                                        You have already enrolled in this scheme {selectedScheme.enrollmentCount} time(s). You can enroll again for additional investment.
                                    </div>
                                )}

                                {/* Scheme Overview */}
                                <div className="card border-0 shadow-sm mb-4">
                                    <div className="card-body p-4">
                                        <h6 className="fw-bold mb-4 text-center">Scheme Overview</h6>
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <div className="text-muted small">Amount per Term</div>
                                                <div className="fw-bold fs-5">₹{selectedScheme.scheme_term_amount}</div>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <div className="text-muted small">Payment Cycle</div>
                                                <div className="fw-bold fs-5">{formatType(selectedScheme.type)}</div>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <div className="text-muted small">Number of Terms</div>
                                                <div className="fw-bold fs-5">{selectedScheme.duration}</div>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <div className="text-muted small">Total amount</div>
                                                <div className="fw-bold fs-5">₹{selectedScheme.scheme_total_amount}</div>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <div className="text-muted small">Maturity Amount</div>
                                                <div className="fw-bold fs-5 text-success">₹{selectedScheme.scheme_maturity}</div>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <div className="text-muted small">End Date</div>
                                                <div className="fw-bold fs-5">{new Date(selectedScheme.end_date).toLocaleDateString("en-IN")}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                {selectedScheme.description && (
                                    <div className="card border-0 shadow-sm mb-4">
                                        <div className="card-body p-4">
                                            <h6 className="fw-bold mb-3">Description</h6>
                                            <p className="text-muted">{selectedScheme.description}</p>
                                        </div>
                                    </div>
                                )}

                                {/* How it works */}
                                <div className="card border-0 shadow-sm mb-4">
                                    <div className="card-body p-4">
                                        <h6 className="fw-bold mb-3 text-center">How it works?</h6>
                                        <div className="d-flex flex-column">
                                            {selectedScheme.howItWorks.map((step, index) => (
                                                <div key={index} className="d-flex align-items-start mb-3">
                                                    <div
                                                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                                        style={{
                                                            width: "32px",
                                                            height: "32px",
                                                            backgroundColor: "#c42b2b",
                                                            color: "white",
                                                            fontSize: "14px",
                                                            fontWeight: "bold",
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-grow-1 p-3 border rounded">
                                                        <p className="mb-0">{step}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer p-4">
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        // toast.info('Cancelled', 'Enrollment cancelled');
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={`btn ${selectedScheme.enrollmentCount > 0 ? 'btn-outline-warning' : 'btn-warning'}`}
                                    onClick={handleBuyNow}
                                    disabled={walletBalance < selectedScheme.scheme_term_amount}
                                >
                                    {/* <FaPlusCircle className="me-2" /> */}
                                    {selectedScheme.enrollmentCount > 0 ? `Enroll Again ` : "Pay & Enroll"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Selection Modal */}
            {showCustomerModal && selectedScheme && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1090 }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "15px" }}>
                            <div className="modal-header bg-warning text-white border-0">
                                <div className="d-flex justify-content-between align-items-center w-100">
                                    <div>
                                        <h5 className="modal-title fw-bold mb-1">
                                            <FaUsersIcon className="me-2" />
                                            Select Customer for {selectedScheme.name}
                                        </h5>
                                    </div>
                                    <button
                                        className="btn-close btn-close-white"
                                        onClick={() => {
                                            setShowCustomerModal(false);
                                            // toast.info('Cancelled', 'Customer selection cancelled');
                                        }}
                                    ></button>
                                </div>
                            </div>

                            <div className="modal-body p-4">
                                {!loadingCustomers && customers.length > 0 && (
                                    <div className="mb-4">
                                        <div className="input-group input-group-lg shadow-sm">
                                            <span className="input-group-text bg-danger">
                                                <FaSearch className="fs-5" />
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg"
                                                placeholder="Search your customers by name or phone..."
                                                value={customerSearch}
                                                onChange={(e) => setCustomerSearch(e.target.value)}
                                                style={{ border: "none" }}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="d-flex justify-content-end mb-3">
                                    <button
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={fetchCustomersFromAPI}
                                        disabled={loadingCustomers}
                                    >
                                        <FaSync className={`me-2 ${loadingCustomers ? 'fa-spin' : ''}`} />
                                        Refresh
                                    </button>
                                </div>

                                {loadingCustomers ? (
                                    <LoadingToast show={loadingCustomers} />
                                ) : customersError ? (
                                    <div className="text-center py-4">
                                        <FaExclamationTriangle className="text-warning fs-1 mb-3" />
                                        <p className="text-danger">{customersError}</p>
                                        <button
                                            className="btn btn-outline-primary mt-3"
                                            onClick={fetchCustomersFromAPI}
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                ) : customers.length === 0 ? (
                                    <div className="text-center py-5">
                                        <FaUsersIcon className="fs-1 text-muted mb-3 opacity-50" />
                                        <h5 className="text-muted mb-3">No customers found</h5>
                                        <p className="text-muted mb-4">You haven't referred any customers yet.</p>
                                        <button
                                            className="btn btn-warning btn-lg px-4"
                                            onClick={() => navigate("/customer-signup")}
                                            style={{ backgroundColor: selectedScheme.color, borderColor: selectedScheme.color }}
                                        >
                                            <FaUserPlus className="me-2" />
                                            Add Your First Customer
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="customer-list-container" style={{
                                            maxHeight: "400px",
                                            overflowY: "auto",
                                            borderRadius: "10px",
                                            border: "1px solid #e0e0e0"
                                        }}>
                                            {filteredCustomers.length > 0 ? (
                                                filteredCustomers.map((customer, index) => {
                                                    const enrollmentCount = customer.enrolledSchemes?.[selectedScheme.id]?.length || 0;
                                                    return (
                                                        <div
                                                            key={customer.id}
                                                            className={`p-3 ${index % 2 === 0 ? "bg-white" : "bg-light"}`}
                                                            style={{
                                                                borderBottom: "1px solid #f0f0f0",
                                                                cursor: walletBalance >= selectedScheme.scheme_term_amount ? "pointer" : "not-allowed",
                                                                opacity: walletBalance < selectedScheme.scheme_term_amount ? 0.6 : 1,
                                                                transition: 'all 0.2s',
                                                                backgroundColor: selectedCustomer?.id === customer.id ? `${selectedScheme.color}20` : (index % 2 === 0 ? 'white' : '#f8f9fa')
                                                            }}
                                                            onClick={() => {
                                                                if (walletBalance >= selectedScheme.scheme_term_amount) {
                                                                    handleCustomerSelect(customer);
                                                                }
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (selectedCustomer?.id !== customer.id && walletBalance >= selectedScheme.scheme_term_amount) {
                                                                    e.currentTarget.style.backgroundColor = '#e9ecef';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (selectedCustomer?.id === customer.id) {
                                                                    e.currentTarget.style.backgroundColor = `${selectedScheme.color}20`;
                                                                } else {
                                                                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f8f9fa';
                                                                }
                                                            }}
                                                        >
                                                            <div className="d-flex align-items-center">
                                                                <div
                                                                    className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm"
                                                                    style={{
                                                                        width: "45px",
                                                                        height: "45px",
                                                                        backgroundColor: selectedCustomer?.id === customer.id ? selectedScheme.color : (walletBalance >= selectedScheme.scheme_term_amount ? "#6c757d" : "#adb5bd"),
                                                                        color: "white",
                                                                        fontSize: "16px",
                                                                        fontWeight: "bold",
                                                                        flexShrink: 0
                                                                    }}
                                                                >
                                                                    {customer.avatar}
                                                                </div>
                                                                <div className="flex-grow-1">
                                                                    <div className="fw-bold">
                                                                        {customer.name}
                                                                        {/* {enrollmentCount > 0 && (
                                                                            <span className="badge bg-info ms-2">
                                                                                {enrollmentCount} Enrollment{enrollmentCount !== 1 ? 's' : ''}
                                                                            </span>
                                                                        )} */}
                                                                    </div>
                                                                    <div className="text-muted small">
                                                                        <FaMobile className="me-1" size={10} />
                                                                        {customer.phone || "No phone"}
                                                                    </div>
                                                                </div>
                                                                {selectedCustomer?.id === customer.id && (
                                                                    <FaCheckCircle className="text-success ms-2" size={20} />
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <p className="text-muted text-center py-4">No customers match your search</p>
                                            )}
                                        </div>

                                        <div className="text-center mt-3">
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => navigate("/customer-signup")}
                                            >
                                                <FaUserPlus className="me-2" />
                                                Add New Customer
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="modal-footer p-4">
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => {
                                        setShowCustomerModal(false);
                                        setCustomerSearch("");
                                        // toast.info('Cancelled', 'Customer selection cancelled');
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => navigate("/customer-signup")}
                                    disabled={loadingCustomers}
                                >
                                    <FaUserPlus className="me-2" />
                                    Add New Customer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Purchase Modal */}
            {showPurchaseModal && selectedScheme && selectedCustomer && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "15px" }}>
                            <div className="modal-header bg-danger text-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="modal-title fw-bold mb-0">
                                    <FaGift className="me-2" />
                                    Confirm Enrollment
                                </h5>
                                <button
                                    className="btn-close btn-close-white"
                                    onClick={closePurchaseModal}
                                    disabled={enrolling}
                                ></button>
                            </div>

                            <div className="modal-body p-4">
                                <div className="d-flex align-items-center mb-4 p-3 bg-light rounded">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                        style={{
                                            width: "60px",
                                            height: "60px",
                                            backgroundColor: "#f8f9fa",
                                            color: selectedScheme.color,
                                            fontSize: "24px",
                                            fontWeight: "bold",
                                            border: `3px solid ${selectedScheme.color}`
                                        }}
                                    >
                                        {selectedCustomer.avatar}
                                    </div>
                                    <div>
                                        <h5 className="text-bold text-danger">{selectedScheme.name}</h5>
                                        <div className="fw-bold mb-1">{selectedCustomer.name}</div>
                                        {selectedCustomer.phone && (
                                            <small className="text-muted">
                                                <FaPhone className="me-1" size={10} />
                                                {selectedCustomer.phone}
                                            </small>
                                        )}
                                    </div>
                                </div>

                                {selectedCustomer.enrolledSchemes?.[selectedScheme.id]?.length > 0 && (
                                    <div className="alert alert-info mb-4">
                                        <FaCheckDouble className="me-2" />
                                        {selectedCustomer.name} has already enrolled {selectedCustomer.enrolledSchemes[selectedScheme.id].length} time(s) in this scheme.
                                        This will be enrollment #{selectedCustomer.enrolledSchemes[selectedScheme.id].length + 1}.
                                    </div>
                                )}

                                <div className="card border-0 shadow-sm mb-4">
                                    <div className="card-body">
                                        <h6 className="fw-bold mb-3">Payment Details</h6>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">First Payment:</span>
                                            <span className="fw-bold">₹{selectedScheme.scheme_term_amount}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">Total Investment:</span>
                                            <span className="fw-bold">₹{selectedScheme.scheme_total_amount}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">Maturity Amount:</span>
                                            <span className="fw-bold text-success">₹{selectedScheme.scheme_maturity}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    className="btn btn-warning w-100 py-3"
                                    onClick={handleEnrollScheme}
                                    disabled={enrolling || walletBalance < selectedScheme.scheme_term_amount}
                                >
                                    {enrolling ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            {/* <FaPlusCircle className="me-2" /> */}
                                            Pay & Enroll
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && enrollmentSuccessData && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1070 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "15px" }}>
                            <div className="modal-header" style={{
                                backgroundColor: "#c42b2b",
                                color: "white",
                                borderRadius: "15px 15px 0 0",
                                padding: "1.5rem"
                            }}>
                                <h5 className="modal-title fw-bold mb-0">
                                    <FaCheckCircle className="me-2" />
                                    Enrollment Successful!
                                </h5>
                                <button
                                    className="btn-close btn-close-white"
                                    onClick={closeSuccessModal}
                                ></button>
                            </div>

                            <div className="modal-body p-4 text-center">
                                <div className="mb-4">
                                    <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3 bg-success"
                                        style={{
                                            width: "80px",
                                            height: "80px",
                                            color: "white",
                                            fontSize: "40px"
                                        }}>
                                        <FaCheckCircle />
                                    </div>
                                    <h4 className="fw-bold mb-2">Congratulations!</h4>
                                    {/* <p className="text-muted">{enrollmentSuccessData.message || "Customer enrolled successfully"}</p> */}
                                    
                                </div>

                                <div className="card border-0 shadow-sm mb-4 text-start">
                                    <div className="card-body">
                                        <h6 className="fw-bold mb-3">Enrollment Details</h6>
                                        <div className="mb-2">
                                            <div className="text-muted small">Customer</div>
                                            <div className="fw-bold">{enrollmentSuccessData.customerName}</div>
                                        </div>
                                        <div className="mb-2">
                                            <div className="text-muted small">Scheme</div>
                                            <div className="fw-bold">{enrollmentSuccessData.schemeName}</div>
                                        </div>
                                        <div className="mb-2">
                                            <div className="text-muted small">Amount Paid</div>
                                            <div className="fw-bold text-success">₹{enrollmentSuccessData.amountPaid}</div>
                                        </div>
                                      
                                    </div>
                                </div>

                                <div className="d-grid gap-2">
                                    <button
                                        className="btn btn-warning"
                                        onClick={handleBuyAnother}
                                    >
                                        Enroll Another scheme
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
export default SchemesPage;