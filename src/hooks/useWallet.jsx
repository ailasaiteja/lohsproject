// hooks/useWallet.js
import { useState, useEffect } from 'react';

export const useWallet = () => {
    const [walletState, setWalletState] = useState(() => {
        try {
            const saved = localStorage.getItem('flh_wallets');
            const parsed = saved ? JSON.parse(saved) : {
                myWallet: 12500,
                commissionWallet: 3200,
                withdrawWallet: 0
            };
            return {
                wallets: parsed,
                balance: parsed.myWallet
            };
        } catch {
            return {
                wallets: {
                    myWallet: 12500,
                    commissionWallet: 3200,
                    withdrawWallet: 0
                },
                balance: 12500
            };
        }
    });

    const makePurchase = (amount, category, description, customerName = null) => {
        console.log('makePurchase called with:', { amount, category, description, customerName });
        
        if (walletState.balance < amount) {
            throw new Error(`Insufficient balance. Need ₹${amount}, available ₹${walletState.balance}`);
        }

        const newBalance = walletState.balance - amount;
        const updatedWallets = { 
            ...walletState.wallets, 
            myWallet: newBalance 
        };

        // Create transaction record
        const newTransaction = {
            id: Date.now(),
            transactionId: `TXN-${Date.now()}`,
            date: new Date().toLocaleDateString('en-IN'),
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            type: 'debit',
            amount: amount,
            category: category,
            description: description,
            customer: customerName,
            balance: newBalance,
            status: 'completed'
        };

        const updatedWalletState = {
            wallets: updatedWallets,
            balance: newBalance
        };

        console.log('Updating wallet state:', updatedWalletState);
        
        setWalletState(updatedWalletState);
        localStorage.setItem('flh_wallets', JSON.stringify(updatedWallets));

        // Save transaction
        const savedTransactions = localStorage.getItem('flh_transactions');
        const transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
        transactions.unshift(newTransaction);
        localStorage.setItem('flh_transactions', JSON.stringify(transactions));

        console.log('Transaction saved:', newTransaction);

        return { success: true, newBalance };
    };

    const addCommission = (amount, source, description) => {
        const newCommissionBalance = walletState.wallets.commissionWallet + amount;
        const updatedWallets = { 
            ...walletState.wallets, 
            commissionWallet: newCommissionBalance 
        };

        const newTransaction = {
            id: Date.now(),
            transactionId: `COMM-${Date.now()}`,
            date: new Date().toLocaleDateString('en-IN'),
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            type: 'credit',
            amount: amount,
            category: 'commission',
            description: `${description} - ${source}`,
            balance: newCommissionBalance,
            status: 'completed'
        };

        const updatedWalletState = {
            ...walletState,
            wallets: updatedWallets
        };

        setWalletState(updatedWalletState);
        localStorage.setItem('flh_wallets', JSON.stringify(updatedWallets));

        const savedTransactions = localStorage.getItem('flh_transactions');
        const transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
        transactions.unshift(newTransaction);
        localStorage.setItem('flh_transactions', JSON.stringify(transactions));

        return { success: true, newBalance: newCommissionBalance };
    };

    return {
        makePurchase,
        addCommission,
        walletState
    };
};
export default useWallet;