
// src/components/Wallet/WalletMain.js
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Tabs, Tab } from 'react-bootstrap';
import { FaWallet, FaRupeeSign, FaDownload, FaCoins } from 'react-icons/fa';
import useWallet from './hooks/useWallet';
import MyWallet from './MyWallet';
import CommissionWallet from './CommissionWallet';
import WithdrawWallet from './WithdrawWallet';

const WalletMain = ({ userRole = 'user' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('myWallet');
  const { wallets } = useWallet();

  // Read tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['myWallet', 'commissionWallet', 'withdrawWallet'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    // Update URL
    searchParams.set('tab', tab);
    setSearchParams(searchParams);
  };

  const tabConfigs = {
    myWallet: {
      title: 'My Wallet',
      icon: <FaWallet />,
      color: '#4CAF50',
      description: 'Main wallet for all transactions',
      balance: wallets.myWallet
    },
    commissionWallet: {
      title: 'Commission',
      icon: <FaCoins />,
      color: '#FF9800',
      description: 'Incentives & referral earnings',
      balance: wallets.commissionWallet
    },
    withdrawWallet: {
      title: 'Withdraw',
      icon: <FaDownload />,
      color: '#2196F3',
      description: 'Amount available for withdrawal',
      balance: wallets.withdrawWallet
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h2 className="fw-bold text-primary">
          <FaWallet className="me-3" />
          My Wallets
        </h2>
        <p className="text-muted">Manage your wallet balances and transactions</p>
      </div>

      {/* Wallet Summary Cards */}
      <div className="row g-4 mb-4">
        {Object.keys(tabConfigs).map(tabKey => (
          <div key={tabKey} className="col-md-4">
            <div 
              className={`card border-0 shadow-sm cursor-pointer ${activeTab === tabKey ? 'border-primary border-2' : ''}`}
              onClick={() => setActiveTab(tabKey)}
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: tabConfigs[tabKey].color
              }}
            >
              <div className="card-body text-white p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="d-flex align-items-center mb-3">
                      <div className="rounded-circle bg-white bg-opacity-20 p-2 me-3">
                        {tabConfigs[tabKey].icon}
                      </div>
                      <div>
                        <h5 className="fw-bold mb-1">{tabConfigs[tabKey].title}</h5>
                        <p className="mb-0 opacity-75 small">{tabConfigs[tabKey].description}</p>
                      </div>
                    </div>
                    
                    <div className="d-flex align-items-center mb-3">
                      <FaRupeeSign className="me-2" size={20} />
                      <h2 className="fw-bold mb-0">{tabConfigs[tabKey].balance.toLocaleString()}</h2>
                    </div>
                  </div>
                  
                  {activeTab === tabKey && (
                    <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px' }}>
                      <div className="rounded-circle bg-primary" style={{ width: '10px', height: '10px' }}></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4 custom-tabs"
        fill
      >
        <Tab eventKey="myWallet" title={
          <div className="d-flex align-items-center">
            <FaWallet className="me-2" /> My Wallet
          </div>
        }>
          <MyWallet />
        </Tab>

        <Tab eventKey="commissionWallet" title={
          <div className="d-flex align-items-center">
            <FaCoins className="me-2" /> Commission
          </div>
        }>
          <CommissionWallet />
        </Tab>

        <Tab eventKey="withdrawWallet" title={
          <div className="d-flex align-items-center">
            <FaDownload className="me-2" /> Withdraw
          </div>
        }>
          <WithdrawWallet userRole={userRole} />
        </Tab>
      </Tabs>

      <style>{`
        .custom-tabs .nav-link {
          color: #6c757d;
          font-weight: 500;
          border: none;
          padding: 0.75rem 1.5rem;
        }
        .custom-tabs .nav-link.active {
          color: #0d6efd;
          border-bottom: 3px solid #0d6efd;
          background-color: transparent;
        }
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </Container>
  );
};

export default WalletMain;