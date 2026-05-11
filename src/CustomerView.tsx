import React, { useState, useEffect } from 'react';
import { useApp } from './store';
import { MenuItem, OrderItem, PaymentMethod, OrderType } from './types';
import { ShoppingCart, Plus, Minus, X, Trash2, CheckCircle2, Clock, ClipboardList, Wallet, Banknote, Utensils, ShoppingBag, AlertTriangle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils/cn';

export const CustomerView: React.FC = () => {
  const { menu, addOrder, tables, paymentConfig, orders } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<MenuItem['category'] | 'All'>('All');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isOrdered, setIsOrdered] = useState(false);
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('beehive_customer_name') || '');
  const [tableNumber, setTableNumber] = useState('');
  const [showMyOrders, setShowMyOrders] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentSender, setPaymentSender] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('Dine-in');

  useEffect(() => {
    localStorage.setItem('beehive_customer_name', customerName);
  }, [customerName]);

  const myOrders = orders.filter(o => o.customerName === customerName && customerName !== '');
  const hasActiveOrders = myOrders.some(o => o.status !== 'Completed' && o.status !== 'Cancelled');

  const categories: (MenuItem['category'] | 'All')[] = ['All', 'Burgers', 'Chicken', 'Rice', 'Drinks', 'Desserts', 'Snacks'];

  const filteredMenu = selectedCategory === 'All' 
    ? menu 
    : menu.filter(item => item.category === selectedCategory);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || cart.length === 0) return;
    if (orderType === 'Dine-in' && !tableNumber) {
      alert("Please select a table.");
      return;
    }
    if (paymentMethod === 'E-Wallet' && (!paymentReference || !paymentSender)) {
      alert("Please fill in e-wallet details (Reference and Sender Name).");
      return;
    }
    
    addOrder({
      items: cart,
      customerName,
      tableNumber: orderType === 'Dine-in' ? tableNumber : undefined,
      paymentMethod,
      paymentReference: paymentMethod === 'E-Wallet' ? paymentReference : undefined,
      paymentSender: paymentMethod === 'E-Wallet' ? paymentSender : undefined,
      orderType
    });

    setCart([]);
    setIsOrdered(true);
    setPaymentReference('');
    setPaymentSender('');
    setTimeout(() => {
      setIsOrdered(false);
    }, 3000);
  };

  useEffect(() => {
    if (orderType === 'Dine-in' && !tableNumber) {
      const available = tables.find(t => !t.isOccupied);
      if (available) setTableNumber(available.id);
    }
  }, [tables, tableNumber, orderType]);

  const isTableOccupied = (id: string) => tables.find(t => t.id === id)?.isOccupied;

  return (
    <div className="min-h-screen bg-orange-50 pb-20 lg:pb-0 lg:flex">
      <div className="flex-grow flex flex-col h-screen overflow-y-auto">
        <header className="bg-yellow-500 text-white p-4 sticky top-0 z-20 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-white p-1 rounded-full">
                <img src="https://cdn-icons-png.flaticon.com/512/3249/3249911.png" alt="logo" className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">BeeHive Restobar</h1>
            </div>
            {hasActiveOrders && (
              <button 
                onClick={() => setShowMyOrders(true)}
                className="relative p-2 bg-yellow-600 rounded-full hover:bg-yellow-700 transition-colors flex items-center gap-2 px-4 shadow-lg animate-bounce"
              >
                <Clock size={20} />
                <span className="hidden sm:inline text-sm font-bold uppercase tracking-widest">Track Status</span>
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-yellow-500">
                  {myOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length}
                </span>
              </button>
            )}
          </div>
        </header>

        <div className="bg-white shadow-sm sticky top-[64px] z-10 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <div className="container mx-auto p-4 flex gap-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-6 py-2 rounded-full font-medium transition-all",
                  selectedCategory === cat 
                    ? "bg-yellow-500 text-white shadow-lg" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <main className="container mx-auto p-4 flex-grow">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMenu.map(item => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-orange-100 flex flex-col"
              >
                <div className="h-48 overflow-hidden relative group">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                  <div className="absolute top-2 right-2 px-3 py-1 rounded-full font-bold shadow-sm bg-white/90 backdrop-blur-sm text-yellow-600" style={item.accentColor ? { backgroundColor: item.accentColor, color: 'white' } : {}}>
                    ₱{item.price}
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-xl mb-1 text-gray-800" style={item.accentColor ? { color: item.accentColor } : {}}>{item.name}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{item.description}</p>
                  <button onClick={() => addToCart(item)} className="mt-auto w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95">
                    <Plus size={20} /> Add to Order
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </div>

      <aside className="hidden lg:flex w-[400px] xl:w-[450px] bg-white border-l h-screen flex-col sticky top-0 shrink-0 shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center bg-yellow-500 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart /> Your Order
          </h2>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <ShoppingCart size={64} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium text-lg">Your hive is empty!</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-4 items-center bg-orange-50 p-3 rounded-xl border border-orange-100">
                <img src={item.image} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-grow">
                  <h4 className="font-bold text-gray-800 leading-tight">{item.name}</h4>
                  <p className="text-yellow-600 font-medium">₱{item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white rounded-lg border shadow-sm">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-yellow-600"><Minus size={16} /></button>
                    <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-yellow-600"><Plus size={16} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={18} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t bg-gray-50">
            <form onSubmit={handleCheckout} className="space-y-4 mb-6">
              <div className="flex bg-white rounded-xl border p-1">
                <button type="button" onClick={() => setOrderType('Dine-in')} className={cn("flex-grow py-2 rounded-lg text-xs font-bold flex flex-col items-center", orderType === 'Dine-in' ? "bg-orange-500 text-white" : "text-gray-400")}>
                  <Utensils size={16} /> Dine-in
                </button>
                <button type="button" onClick={() => setOrderType('Take-out')} className={cn("flex-grow py-2 rounded-lg text-xs font-bold flex flex-col items-center", orderType === 'Take-out' ? "bg-orange-500 text-white" : "text-gray-400")}>
                  <ShoppingBag size={16} /> Take-out
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Name</label>
                  <input required value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:ring-2 ring-yellow-500 outline-none bg-white" placeholder="Enter name" />
                </div>
                {orderType === 'Dine-in' && (
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                      Table
                      {isTableOccupied(tableNumber) && <span className="text-red-500 flex items-center gap-1 animate-pulse"><AlertTriangle size={12} /> ALREADY OCCUPIED</span>}
                    </label>
                    <select value={tableNumber} onChange={e => setTableNumber(e.target.value)} className={cn("w-full px-4 py-3 border rounded-xl focus:ring-2 ring-yellow-500 outline-none bg-white font-bold", isTableOccupied(tableNumber) && "border-red-500 text-red-600")}>
                      {tables.map(t => (
                        <option key={t.id} value={t.id} className={t.isOccupied ? "text-red-400" : ""}>
                          Table {t.id} {t.isOccupied ? '(FULL)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment</label>
                  <div className="flex bg-white rounded-xl border p-1">
                    <button type="button" onClick={() => setPaymentMethod('Cash')} className={cn("flex-grow py-2 rounded-lg text-xs font-bold flex flex-col items-center", paymentMethod === 'Cash' ? "bg-yellow-500 text-white" : "text-gray-400")}>
                      <Banknote size={16} /> Cash
                    </button>
                    <button type="button" onClick={() => setPaymentMethod('E-Wallet')} className={cn("flex-grow py-2 rounded-lg text-xs font-bold flex flex-col items-center", paymentMethod === 'E-Wallet' ? "bg-yellow-500 text-white" : "text-gray-400")}>
                      <Wallet size={16} /> E-Wallet
                    </button>
                  </div>
                </div>
              </div>

              {paymentMethod === 'E-Wallet' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center gap-4">
                    <img src={paymentConfig.qrCodeUrl} className="w-20 h-20 bg-white p-1 rounded-lg border object-contain" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-indigo-400">GCash / Maya</p>
                      <p className="font-bold text-indigo-900">{paymentConfig.eWalletNumber}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-400 uppercase">Sender Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300" size={14} />
                        <input required value={paymentSender} onChange={e => setPaymentSender(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-indigo-100 rounded-lg focus:ring-2 ring-indigo-500 outline-none" placeholder="Account Name" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-400 uppercase">Reference Number</label>
                      <input required value={paymentReference} onChange={e => setPaymentReference(e.target.value)} className="w-full px-4 py-2 border border-indigo-100 rounded-lg focus:ring-2 ring-indigo-500 outline-none font-mono text-sm" placeholder="Ref #" />
                    </div>
                  </div>
                </motion.div>
              )}
            </form>

            <div className="flex justify-between items-center text-2xl font-black mb-4 px-2 text-yellow-600">
              <span className="text-gray-600">Total</span>
              <span>₱{cartTotal.toLocaleString()}</span>
            </div>
            <button disabled={!customerName || (orderType === 'Dine-in' && !tableNumber) || isTableOccupied(tableNumber)} onClick={handleCheckout} className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 text-lg">
              Confirm Order
            </button>
          </div>
        )}
      </aside>

      <AnimatePresence>
        {isOrdered && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full border-t-8 border-yellow-500">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2 text-gray-800">Order Buzzing!</h3>
              <p className="text-gray-500 text-sm">Thank you, {customerName}! We're preparing your order.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      <AnimatePresence>
        {showMyOrders && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMyOrders(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
            <motion.div 
              initial={{ x: '100%', opacity: 0.5 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: '100%', opacity: 0 }} 
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b flex justify-between items-center bg-slate-800 text-white">
                <div className="flex items-center gap-2"><ClipboardList size={24} /><h2 className="text-xl font-bold italic tracking-tighter">THE HIVE TRACKER</h2></div>
                <button onClick={() => setShowMyOrders(false)} className="hover:rotate-90 transition-transform duration-300"><X size={24} /></button>
              </div>
              <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-orange-50/30">
                {myOrders.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <Clock size={32} className="text-gray-300" />
                    </div>
                    <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No orders in the swarm</p>
                  </div>
                ) : myOrders.map(order => (
                  <motion.div 
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    key={order.id} 
                    className="border rounded-[32px] p-6 bg-white shadow-sm hover:shadow-md transition-shadow border-orange-100 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-1 bg-yellow-500 h-full group-hover:w-2 transition-all" />
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-mono text-gray-300"># {order.id}</span>
                        <div className="font-black text-slate-800 text-lg">{order.orderType === 'Dine-in' ? `Table ${order.tableNumber}` : 'Take-out'}</div>
                      </div>
                      
                      <div className="relative h-8 w-28 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <motion.div 
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                          className={cn(
                            "absolute inset-0 flex items-center justify-center whitespace-nowrap text-[9px] font-black uppercase tracking-[0.2em] opacity-30",
                            order.status === 'Pending' ? "text-red-600" :
                            order.status === 'Preparing' ? "text-orange-600" :
                            order.status === 'Ready' ? "text-green-600" :
                            "text-gray-600"
                          )}
                        >
                          {order.status} {order.status} {order.status}
                        </motion.div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <span className={cn(
                             "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white shadow-sm",
                             order.status === 'Pending' ? "text-red-600" :
                             order.status === 'Preparing' ? "text-orange-600" :
                             order.status === 'Ready' ? "text-green-600 animate-pulse" :
                             "text-gray-600"
                           )}>
                             {order.status}
                           </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500 mb-4 bg-slate-50 p-3 rounded-2xl italic">
                      {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Paid via {order.paymentMethod}</span>
                        {order.paymentReference && <span className="text-[10px] text-yellow-600 font-mono font-bold">Ref: {order.paymentReference}</span>}
                      </div>
                      <span className="font-black text-slate-800 text-xl">₱{order.total.toLocaleString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
