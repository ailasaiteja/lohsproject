import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import ToastContainer from './ToastContainer';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toastTimeouts = useRef({});

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, exiting: true } : toast
    ));

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
      delete toastTimeouts.current[id];
    }, 300);
  }, []);

  const showToast = useCallback((type, title, description, duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const existingToast = Object.values(toasts).some(
      toast => toast.title === title && toast.description === description && toast.type === type
    );

    if (existingToast) {
      return null;
    }

    const newToast = {
      id,
      type,
      title,
      description,
      duration
    };

    setToasts(prev => [...prev, newToast]);

    toastTimeouts.current[id] = setTimeout(() => {
      removeToast(id);
    }, duration);

    return id;
  }, [toasts, removeToast]);

  const success = useCallback((title, description, duration) => {
    return showToast('success', title, description, duration);
  }, [showToast]);

  const error = useCallback((title, description, duration) => {
    return showToast('error', title, description, duration);
  }, [showToast]);

  const warning = useCallback((title, description, duration) => {
    return showToast('warning', title, description, duration);
  }, [showToast]);

  const info = useCallback((title, description, duration) => {
    return showToast('info', title, description, duration);
  }, [showToast]);

  const clearAllToasts = useCallback(() => {
    Object.values(toastTimeouts.current).forEach(clearTimeout);
    toastTimeouts.current = {};
    
    setToasts(prev => prev.map(toast => ({ ...toast, exiting: true })));
    
    setTimeout(() => {
      setToasts([]);
    }, 300);
  }, []);

  const value = {
    success,
    error,
    warning,
    info,
    removeToast,
    clearAllToasts
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};