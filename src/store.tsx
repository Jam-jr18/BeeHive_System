import React, { createContext, useContext, useState, useEffect } from 'react';
import { MENU_ITEMS } from './data';
import { Order, MenuItem, OrderItem, OrderStatus, PaymentMethod, PaymentConfig, Table, OrderType } from './types';

interface AppContextType {
  orders: Order[];
  addOrder: (params: {
    items: OrderItem[], 
    customerName: string, 
    tableNumber?: string, 
    paymentMethod: PaymentMethod, 
    paymentReference?: string, 
    paymentSender?: string,
    orderType: OrderType
  }) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  menu: MenuItem[];
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (id: string) => void;
  paymentConfig: PaymentConfig;
  updatePaymentConfig: (config: PaymentConfig) => void;
  tables: Table[];
  toggleTableStatus: (tableId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_TABLES: Table[] = Array.from({ length: 20 }, (_, i) => ({
  id: (i + 1).toString(),
  isOccupied: false
}));

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('beehive_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [menu, setMenu] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('beehive_menu');
    return saved ? JSON.parse(saved) : MENU_ITEMS;
  });

  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(() => {
    const saved = localStorage.getItem('beehive_payment');
    return saved ? JSON.parse(saved) : { eWalletNumber: '09123456789', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BeeHiveRestobar' };
  });

  const [tables, setTables] = useState<Table[]>(() => {
    const saved = localStorage.getItem('beehive_tables');
    return saved ? JSON.parse(saved) : INITIAL_TABLES;
  });

  useEffect(() => {
    localStorage.setItem('beehive_orders', JSON.stringify(orders));
    localStorage.setItem('beehive_menu', JSON.stringify(menu));
    localStorage.setItem('beehive_payment', JSON.stringify(paymentConfig));
    localStorage.setItem('beehive_tables', JSON.stringify(tables));
  }, [orders, menu, paymentConfig, tables]);

  const addOrder = (params: {
    items: OrderItem[], 
    customerName: string, 
    tableNumber?: string, 
    paymentMethod: PaymentMethod, 
    paymentReference?: string, 
    paymentSender?: string,
    orderType: OrderType
  }) => {
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      items: params.items,
      total: params.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'Pending',
      orderType: params.orderType,
      paymentMethod: params.paymentMethod,
      paymentReference: params.paymentReference,
      paymentSender: params.paymentSender,
      timestamp: Date.now(),
      customerName: params.customerName,
      tableNumber: params.tableNumber
    };
    setOrders(prev => [newOrder, ...prev]);
    
    if (params.orderType === 'Dine-in' && params.tableNumber) {
      setTables(prev => prev.map(t => t.id === params.tableNumber ? { ...t, isOccupied: true } : t));
    }
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => {
      const order = prev.find(o => o.id === orderId);
      if ((status === 'Completed' || status === 'Cancelled') && order?.tableNumber) {
        setTables(prevTables => prevTables.map(t => t.id === order.tableNumber ? { ...t, isOccupied: false } : t));
      }
      return prev.map(o => o.id === orderId ? { ...o, status } : o);
    });
  };

  const addMenuItem = (item: MenuItem) => setMenu(prev => [...prev, item]);
  const updateMenuItem = (item: MenuItem) => setMenu(prev => prev.map(i => i.id === item.id ? item : i));
  const deleteMenuItem = (id: string) => setMenu(prev => prev.filter(i => i.id !== id));
  const updatePaymentConfig = (config: PaymentConfig) => setPaymentConfig(config);
  const toggleTableStatus = (tableId: string) => setTables(prev => prev.map(t => t.id === tableId ? { ...t, isOccupied: !t.isOccupied } : t));

  return (
    <AppContext.Provider value={{ 
      orders, addOrder, updateOrderStatus, menu, 
      addMenuItem, updateMenuItem, deleteMenuItem,
      paymentConfig, updatePaymentConfig,
      tables, toggleTableStatus
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
