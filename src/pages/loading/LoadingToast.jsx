import React from 'react';
import './LoadingToast.css';


const LoadingToast = ({ show = false }) => {
  if (!show) return null;

  return (
    <>
      <div className="toast-overlay" />
      <div className="loading-toast">
        <div className="loading-content">
          <div className="spinning-circle">
            <div className="circle-border"></div>
            <div className="logo-wrapper">
              <img 
                src={'logo (2).png'} 
                alt="Logo" 
                className="toast-logo"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoadingToast;