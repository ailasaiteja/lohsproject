// WalletPage.js
import React, { useState } from 'react';
import {
    FaWallet, FaRupeeSign, FaDownload, FaPlus,
    FaArrowUp, FaArrowDown, FaHistory, FaCoins
} from 'react-icons/fa';
import {
    Card, Button, Table, Badge
} from 'react-bootstrap';

const WalletPage = ({ 
    walletType, 
    walletConfig, 
    balance, 
    transactions = [], 
    onAddMoney, 
    onWithdraw, 
    onProcessWithdrawal,
    showAddMoney,
    setShowAddMoney,
    addAmount,
    setAddAmount,
    userRole,
    selectedWallet
}) => {
    const [filter, setFilter] = useState('all');
    const [localAddAmount, setLocalAddAmount] = useState('');

    const filteredTransactions = Array.isArray(transactions) ? transactions.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'credit') return t.type === 'credit';
        if (filter === 'debit') return t.type === 'debit';
        if (filter === 'pending') return t.status === 'pending';
        if (filter === 'completed') return t.status === 'completed';
        return true;
    }) : [];

    const handleQuickWithdraw = (amount) => {
        if (window.confirm(`Withdraw ₹${amount} from ${walletConfig.name}?`)) {
            onWithdraw(amount);
        }
    };

    return (
        <div className="container-fluid">
            {/* Wallet Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <Card className="border-0 shadow">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="d-flex align-items-center mb-2">
                                        <div className="rounded-circle p-3 me-3" style={{ 
                                            backgroundColor: `${walletConfig.color}20`, 
                                            color: walletConfig.color 
                                        }}>
                                            {walletConfig.icon}
                                        </div>
                                        <div>
                                            <h2 className="fw-bold mb-0">{walletConfig.name}</h2>
                                            <p className="text-muted mb-0">{walletConfig.description}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <h1 className="fw-bold display-4">
                                            <FaRupeeSign className="me-2" />
                                            {balance.toLocaleString()}
                                        </h1>
                                        <p className="text-muted">Current Balance</p>
                                    </div>
                                </div>
                                
                                <div className="d-flex gap-3">
                                    {walletConfig.canAdd && (
                                        <Button 
                                            variant="primary" 
                                            size="lg"
                                            onClick={() => setShowAddMoney(true)}
                                        >
                                            <FaPlus className="me-2" /> Add Money
                                        </Button>
                                    )}
                                    
                                    {walletConfig.canWithdraw && (
                                        <Button 
                                            variant="outline-primary" 
                                            size="lg"
                                            onClick={() => {
                                                const amount = prompt(`Enter amount to withdraw from ${walletConfig.name}:`, '100');
                                                if (amount && amount > 0) {
                                                    onWithdraw(amount);
                                                }
                                            }}
                                        >
                                            <FaDownload className="me-2" /> Withdraw
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>

            {/* Quick Actions */}
            {walletConfig.canWithdraw && walletType !== 'withdrawWallet' && (
                <div className="row mb-4">
                    <div className="col-12">
                        <Card className="border-0 shadow">
                            <Card.Body className="p-3">
                                <h5 className="fw-bold mb-3">Quick Withdraw</h5>
                                <div className="d-flex flex-wrap gap-2">
                                    {[100, 500, 1000, 2000, 5000].map(amount => (
                                        <Button
                                            key={amount}
                                            variant="outline-secondary"
                                            className="rounded-pill"
                                            onClick={() => handleQuickWithdraw(amount)}
                                            disabled={balance < amount}
                                        >
                                            ₹{amount}
                                        </Button>
                                    ))}
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            )}

            {/* Transactions */}
            <div className="row">
                <div className="col-12">
                    <Card className="border-0 shadow">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="fw-bold mb-0">Transaction History</h4>
                                
                                <div className="d-flex gap-2">
                                    <Button
                                        variant={filter === 'all' ? "primary" : "outline-primary"}
                                        size="sm"
                                        onClick={() => setFilter('all')}
                                    >
                                        All
                                    </Button>
                                    <Button
                                        variant={filter === 'credit' ? "primary" : "outline-primary"}
                                        size="sm"
                                        onClick={() => setFilter('credit')}
                                    >
                                        <FaArrowUp className="me-1" /> Credit
                                    </Button>
                                    <Button
                                        variant={filter === 'debit' ? "primary" : "outline-primary"}
                                        size="sm"
                                        onClick={() => setFilter('debit')}
                                    >
                                        <FaArrowDown className="me-1" /> Debit
                                    </Button>
                                    {walletType === 'withdrawWallet' && (
                                        <>
                                            <Button
                                                variant={filter === 'pending' ? "primary" : "outline-primary"}
                                                size="sm"
                                                onClick={() => setFilter('pending')}
                                            >
                                                Pending
                                            </Button>
                                            <Button
                                                variant={filter === 'completed' ? "primary" : "outline-primary"}
                                                size="sm"
                                                onClick={() => setFilter('completed')}
                                            >
                                                Completed
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {filteredTransactions.length === 0 ? (
                                <div className="text-center py-5">
                                    <FaHistory className="text-muted mb-3" size={48} />
                                    <h5 className="text-muted">No transactions found</h5>
                                    <p className="text-muted">Start by adding money or making withdrawals</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table hover className="align-middle">
                                        <thead className="bg-light">
                                            <tr>
                                                <th>Date & Time</th>
                                                <th>Description</th>
                                                <th>Type</th>
                                                <th>Amount</th>
                                                <th>Balance</th>
                                                {walletType === 'withdrawWallet' && <th>Status</th>}
                                                {walletType === 'withdrawWallet' && userRole === 'admin' && <th>Action</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTransactions.map((transaction, index) => (
                                                <tr key={transaction.id || index}>
                                                    <td>
                                                        <div>{transaction.date}</div>
                                                        <small className="text-muted">{transaction.time}</small>
                                                    </td>
                                                    <td>{transaction.description}</td>
                                                    <td>
                                                        <Badge 
                                                            bg={transaction.type === 'credit' ? 'success' : 'danger'}
                                                            className="d-flex align-items-center gap-1"
                                                            style={{ width: 'fit-content' }}
                                                        >
                                                            {transaction.type === 'credit' ? <FaArrowUp /> : <FaArrowDown />}
                                                            {transaction.type.toUpperCase()}
                                                        </Badge>
                                                    </td>
                                                    <td className={`fw-bold ${transaction.type === 'credit' ? 'text-success' : 'text-danger'}`}>
                                                        {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount?.toLocaleString() || '0'}
                                                    </td>
                                                    <td className="fw-medium">
                                                        ₹{transaction.balance?.toLocaleString() || '0'}
                                                    </td>
                                                    {walletType === 'withdrawWallet' && (
                                                        <td>
                                                            <Badge 
                                                                bg={transaction.status === 'completed' ? 'success' : 
                                                                    transaction.status === 'pending' ? 'warning' : 'danger'}
                                                            >
                                                                {transaction.status?.toUpperCase() || 'PENDING'}
                                                            </Badge>
                                                        </td>
                                                    )}
                                                    {walletType === 'withdrawWallet' && userRole === 'admin' && transaction.status === 'pending' && (
                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <Button
                                                                    variant="success"
                                                                    size="sm"
                                                                    onClick={() => onProcessWithdrawal(transaction.id, 'completed')}
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    variant="danger"
                                                                    size="sm"
                                                                    onClick={() => onProcessWithdrawal(transaction.id, 'rejected')}
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default WalletPage;