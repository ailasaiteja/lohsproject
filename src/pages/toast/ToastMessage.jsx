import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faExclamationCircle, 
  faExclamationTriangle, 
  faInfoCircle,
  faTimes 
} from '@fortawesome/free-solid-svg-icons';
import './Toast.css';

const ToastMessage = ({ 
  id, 
  type, 
  title, 
  description, 
  onClose,
  duration = 3000 
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch(type) {
      case 'success':
        return <FontAwesomeIcon icon={faCheckCircle} />;
      case 'error':
        return <FontAwesomeIcon icon={faExclamationCircle} />;
      case 'warning':
        return <FontAwesomeIcon icon={faExclamationTriangle} />;
      case 'info':
        return <FontAwesomeIcon icon={faInfoCircle} />;
      default:
        return <FontAwesomeIcon icon={faInfoCircle} />;
    }
  };

  return (
    <div className={`toast-message ${type} ${isExiting ? 'exit' : ''}`}>
      <div className="toast-icon">
        {getIcon()}
      </div>
      <div className="toast-content">
        <div className="toast-title">{title}</div>
        {description && <div className="toast-description">{description}</div>}
      </div>
      <button className="toast-close" onClick={handleClose}>
        <FontAwesomeIcon icon={faTimes} />
      </button>
      <div className="toast-progress">
        <div 
          className="toast-progress-bar" 
          style={{ animation: `progress ${duration}ms linear forwards` }}
        />
      </div>
    </div>
  );
};

export default ToastMessage;