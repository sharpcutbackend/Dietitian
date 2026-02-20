import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Menu as MenuIcon, 
  X, 
  Calendar, 
  User as UserIcon, 
  MessageCircle, 
  Send,
  Trash2,
  ChevronRight,
  Star,
  Check,
  ArrowRight,
  Loader2,
  Settings,
  LogOut,
  CreditCard,
  MapPin,
  Clock,
  Plus,
  Minus,
  Edit2,
  Award,
  Zap,
  Coffee,
  Globe,
  DollarSign,
  Smartphone,
  Moon,
  Sun,
  ChevronDown,
  Mail,
  Lock,
  Phone,
  LayoutDashboard,
  Utensils,
  Users,
  TrendingUp,
  RotateCw,
  MoreHorizontal,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  MessageSquare,
  ThumbsUp,
  BarChart3,
  PieChart,
  Bell,
  ChevronUp,
  Info,
  Upload,
  UserCircle
} from 'lucide-react';
import { MEALS, SERVICES, EXCHANGE_RATE, TRANSLATIONS, STORIES } from './constants';
import { Meal, CartItem, DietaryType, BookingService, ChatMessage, User, Order, MealCustomization, MealCategory, Language, Currency, Theme, Frequency, Appointment, OrderStatus, AppointmentStatus, Story, AddOn, AppNotification, ActionTrail } from './types';
import { sendMessageToGemini } from './services/geminiService';

// --- Toast Context ---
interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-24 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`
              pointer-events-auto min-w-[300px] p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-slide-in-right backdrop-blur-md
              ${toast.type === 'success' ? 'bg-white/90 dark:bg-slate-800/90 border-emerald-500/50 text-emerald-700 dark:text-emerald-400' : 
                toast.type === 'error' ? 'bg-white/90 dark:bg-slate-800/90 border-red-500/50 text-red-700 dark:text-red-400' : 
                'bg-white/90 dark:bg-slate-800/90 border-blue-500/50 text-blue-700 dark:text-blue-400'}
            `}
          >
            {toast.type === 'success' && <Check className="w-5 h-5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {toast.type === 'info' && <Info className="w-5 h-5" />}
            <p className="font-medium text-sm">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// --- Data Provider (Simulates Backend) ---
interface DataContextType {
  meals: Meal[];
  addMeal: (meal: Meal) => void;
  deleteMeal: (id: string) => void;
  updateMeal: (id: string, meal: Partial<Meal>) => void;
  toggleMealStock: (id: string) => void;
  orders: Order[];
  placeOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  appointments: Appointment[];
  bookAppointment: (apt: Appointment) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  stories: Story[];
  addStory: (story: Story) => void;
  approveStory: (id: string) => void;
  deleteStory: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [meals, setMeals] = useState<Meal[]>(MEALS);
  const [orders, setOrders] = useState<Order[]>([]);
  // Mock appointment tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 'apt_demo_1',
      userId: 'u1',
      userName: 'Kwame Mensah',
      serviceName: 'Initial Consultation',
      date: tomorrowStr,
      time: '10:00',
      status: 'Confirmed',
      notes: 'Demo appointment for reminders',
      history: [
        { status: 'Pending', timestamp: new Date(Date.now() - 86400000).toISOString(), note: 'Booking requested' },
        { status: 'Confirmed', timestamp: new Date().toISOString(), note: 'Confirmed by Admin' }
      ]
    }
  ]);
  const [stories, setStories] = useState<Story[]>(STORIES);

  const addMeal = (meal: Meal) => setMeals(prev => [...prev, meal]);
  const deleteMeal = (id: string) => setMeals(prev => prev.filter(m => m.id !== id));
  const updateMeal = (id: string, updatedMeal: Partial<Meal>) => {
    setMeals(prev => prev.map(m => m.id === id ? { ...m, ...updatedMeal } : m));
  };
  const toggleMealStock = (id: string) => {
    setMeals(prev => prev.map(m => m.id === id ? { ...m, inStock: !m.inStock } : m));
  };
  
  const placeOrder = (order: Order) => {
    // Add initial history log
    const orderWithHistory = {
      ...order,
      history: [{ status: order.status, timestamp: new Date().toISOString(), note: 'Order placed successfully' }]
    };
    setOrders(prev => [orderWithHistory, ...prev]);
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        return {
          ...o,
          status,
          history: [...(o.history || []), { status, timestamp: new Date().toISOString(), note: `Order status updated to ${status}` }]
        };
      }
      return o;
    }));
  };

  const bookAppointment = (apt: Appointment) => {
    // Add initial history log
    const aptWithHistory = {
      ...apt,
      history: [{ status: apt.status, timestamp: new Date().toISOString(), note: 'Appointment requested' }]
    };
    setAppointments(prev => [aptWithHistory, ...prev]);
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status,
          history: [...(a.history || []), { status, timestamp: new Date().toISOString(), note: `Appointment updated to ${status}` }]
        };
      }
      return a;
    }));
  };

  const addStory = (story: Story) => setStories(prev => [story, ...prev]);
  const approveStory = (id: string) => setStories(prev => prev.map(s => s.id === id ? { ...s, approved: true } : s));
  const deleteStory = (id: string) => setStories(prev => prev.filter(s => s.id !== id));

  return (
    <DataContext.Provider value={{ meals, addMeal, deleteMeal, updateMeal, toggleMealStock, orders, placeOrder, updateOrderStatus, appointments, bookAppointment, updateAppointmentStatus, stories, addStory, approveStory, deleteStory }}>
      {children}
    </DataContext.Provider>
  );
};

// --- Settings Context ---
interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  theme: Theme;
  toggleTheme: () => void;
  t: (key: string) => string;
  formatPrice: (priceUSD: number) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};

const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>('GHS');
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('thedietitian_theme') as Theme) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('thedietitian_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || key;
  };

  const formatPrice = (priceUSD: number): string => {
    if (currency === 'GHS') {
      return `₵ ${(priceUSD * EXCHANGE_RATE).toFixed(2)}`;
    }
    return `$ ${priceUSD.toFixed(2)}`;
  };

  return (
    <SettingsContext.Provider value={{ language, setLanguage, currency, setCurrency, theme, toggleTheme, t, formatPrice }}>
      {children}
    </SettingsContext.Provider>
  );
};

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, password?: string) => Promise<boolean>;
  checkEmailExists: (email: string) => boolean;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  refreshUserData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // Mock Database
  const [users, setUsers] = useState<User[]>([
    { 
      id: 'u1', 
      role: 'user', 
      name: 'Kwame Mensah', 
      email: 'user@example.com', 
      password: 'user123',
      dietaryPreferences: [], 
      allergies: [], 
      orders: [], 
      appointments: [] 
    },
    { 
      id: 'admin1', 
      role: 'admin', 
      name: 'Admin User', 
      email: 'admin@example.com', 
      password: 'admin123',
      dietaryPreferences: [], 
      allergies: [], 
      orders: [], 
      appointments: [] 
    }
  ]);
  const { orders, appointments } = useData();

  const refreshUserData = () => {
    if (!user) return;
    const userOrders = orders.filter(o => o.userId === user.id);
    const userAppointments = appointments.filter(a => a.userId === user.id);
    setUser({ ...user, orders: userOrders, appointments: userAppointments });
  };

  useEffect(() => {
    if (user) {
        refreshUserData();
    }
  }, [orders, appointments]);

  const checkEmailExists = (email: string) => {
    return users.some(u => u.email.toLowerCase() === email.toLowerCase());
  };

  const login = async (email: string, password?: string): Promise<boolean> => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser) {
      if (password && foundUser.password !== password) {
        return false;
      }
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const register = async (name: string, email: string, password?: string): Promise<boolean> => {
    if (checkEmailExists(email)) return false;

    const newUser: User = {
      id: Date.now().toString(),
      role: 'user',
      name,
      email,
      password: password || '123456', 
      dietaryPreferences: [],
      allergies: [],
      orders: [],
      appointments: []
    };
    
    setUsers(prev => [...prev, newUser]);
    setUser(newUser);
    return true;
  };

  const logout = () => setUser(null);

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, checkEmailExists, logout, updateProfile, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Notification Context ---
interface NotificationContextType {
  notifications: AppNotification[];
  addNotification: (notification: AppNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};

const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { appointments } = useData();
  const { user } = useAuth();
  const { showToast } = useToast();

  const addNotification = (notification: AppNotification) => {
    setNotifications(prev => [notification, ...prev]);
    // Map 'reminder' to 'info' for toast if needed
    const toastType = notification.type === 'reminder' ? 'info' : notification.type;
    showToast(notification.title, toastType);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Automated Reminder Logic
  useEffect(() => {
    if (!user) return;

    const checkUpcomingAppointments = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const userAppointments = appointments.filter(a => a.userId === user.id && a.status === 'Confirmed');

      userAppointments.forEach(apt => {
        const aptDate = new Date(`${apt.date}T${apt.time}`);
        // If appointment is in the future but within 24 hours
        if (aptDate > now && aptDate <= tomorrow) {
          const notificationId = `reminder-${apt.id}`;
          setNotifications(prev => {
            if (prev.some(n => n.id === notificationId)) return prev;
            // Visual toast for the reminder
            showToast(`Reminder: ${apt.serviceName} tomorrow at ${apt.time}`, 'info');
            return [{
              id: notificationId,
              userId: user.id,
              title: 'Appointment Reminder',
              message: `You have a ${apt.serviceName} appointment tomorrow at ${apt.time}.`,
              type: 'reminder',
              read: false,
              timestamp: new Date()
            }, ...prev];
          });
        }
      });
    };

    checkUpcomingAppointments();
  }, [user, appointments, showToast]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

// --- Cart Context ---
interface CartContextType {
  items: CartItem[];
  addToCart: (meal: Meal, customization: MealCustomization) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  clearCart: () => void;
  total: number; // In USD
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { showToast } = useToast();

  const addToCart = (meal: Meal, customization: MealCustomization) => {
    const cartId = `${meal.id}-${JSON.stringify(customization)}`;
    
    // Calculate Base Price
    let basePrice = customization.portion === 'Large' ? meal.price * 1.5 : meal.price;
    
    // Add Add-on Prices
    const addOnsTotal = customization.selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
    basePrice += addOnsTotal;

    // Apply Frequency Discount
    if (customization.frequency !== 'One-time') {
      basePrice = basePrice * 0.9;
    }
    
    setItems(prev => {
       const existing = prev.find(i => i.cartId === cartId);
       if (existing) {
           return prev.map(i => i.cartId === cartId ? { ...i, quantity: i.quantity + 1 } : i);
       }
       return [...prev, {
           ...meal,
           cartId,
           quantity: 1,
           customization,
           finalPrice: basePrice
       }];
    });
    setIsOpen(true);
    showToast(`Added ${meal.name} to cart`, 'success');
  };

  const removeFromCart = (cartId: string) => {
    setItems(prev => prev.filter(i => i.cartId !== cartId));
    showToast('Item removed from cart', 'info');
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setItems(prev => prev.map(item => {
        if (item.cartId === cartId) {
            const newQty = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQty };
        }
        return item;
    }).filter(item => item.quantity > 0));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  );
};

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' }> = ({ 
  className = '', 
  variant = 'primary', 
  children, 
  ...props 
}) => {
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20 dark:shadow-none',
    outline: 'border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30',
    ghost: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20 dark:shadow-none'
  };
  
  return (
    <button 
      className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; icon?: React.ElementType }> = ({ label, icon: Icon, className = '', ...props }) => (
  <div className={className}>
    {label && <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">{label}</label>}
    <div className="relative group">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />}
      <input
        className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 ${Icon ? 'pl-11' : ''} text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm`}
        {...props}
      />
    </div>
  </div>
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className={className}>
    {label && <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">{label}</label>}
    <textarea
      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
      {...props}
    />
  </div>
);

// ... PaymentForm ...
const PaymentForm = ({ 
  amount, 
  onSubmit, 
  isProcessing, 
  backLabel, 
  onBack 
}: { 
  amount: number, 
  onSubmit: (method: string) => void, 
  isProcessing: boolean, 
  backLabel?: string, 
  onBack?: () => void 
}) => {
  const { t, formatPrice } = useSettings();
  const [method, setMethod] = useState<'card' | 'momo'>('momo');
  const [momoNetwork, setMomoNetwork] = useState('MTN');
  const [momoNumber, setMomoNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentDetails = method === 'momo' 
      ? `${momoNetwork} MoMo (${momoNumber})` 
      : `Card ending ${cardNumber.slice(-4)}`;
    onSubmit(paymentDetails);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 animate-fade-in">
       <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-900 dark:text-white">
         <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
            {method === 'momo' ? <Smartphone className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
         </div>
         {t('securePayment')}
       </h2>

       {/* Payment Method Tabs */}
       <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-8">
         <button 
           type="button"
           onClick={() => setMethod('momo')}
           className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${method === 'momo' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
         >
           <Smartphone className="w-4 h-4" /> Mobile Money
         </button>
         <button 
           type="button"
           onClick={() => setMethod('card')}
           className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${method === 'card' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
         >
           <CreditCard className="w-4 h-4" /> Card
         </button>
       </div>

       <form onSubmit={handleSubmit} className="space-y-6">
         {method === 'momo' ? (
           <div className="space-y-6 animate-fade-in">
             <div>
               <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">Network</label>
               <div className="grid grid-cols-3 gap-3">
                 {['MTN', 'Telecel', 'AT'].map(net => (
                   <button
                     key={net}
                     type="button"
                     onClick={() => setMomoNetwork(net)}
                     className={`py-3.5 border-2 rounded-xl font-bold text-sm transition-all ${
                       momoNetwork === net 
                         ? (net === 'MTN' ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-slate-900 dark:text-yellow-400' : net === 'Telecel' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400')
                         : 'border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                     }`}
                   >
                     {net}
                   </button>
                 ))}
               </div>
             </div>
             
             <Input 
                label="Mobile Number" 
                icon={Phone}
                type="tel" 
                value={momoNumber}
                onChange={e => setMomoNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="024 123 4567"
                required
             />
           </div>
         ) : (
           <div className="space-y-6 animate-fade-in">
             <Input 
                label="Name on Card"
                icon={UserIcon}
                type="text"
                value={cardName}
                onChange={e => setCardName(e.target.value)}
                placeholder="Kwame Mensah"
                required
             />
             <Input 
                label="Card Number"
                icon={CreditCard}
                type="text"
                value={cardNumber}
                onChange={e => setCardNumber(e.target.value)}
                maxLength={19}
                placeholder="0000 0000 0000 0000"
                required
             />
             <div className="grid grid-cols-2 gap-4">
               <Input 
                  label="Expiry"
                  icon={Calendar}
                  type="text"
                  value={expiry}
                  onChange={e => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                  required
               />
               <Input 
                  label="CVC"
                  icon={Lock}
                  type="text"
                  value={cvc}
                  onChange={e => setCvc(e.target.value)}
                  maxLength={3}
                  placeholder="123"
                  required
               />
             </div>
           </div>
         )}

         <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span className="font-medium text-slate-600 dark:text-slate-400">{t('total')}</span>
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{formatPrice(amount)}</span>
         </div>

         <div className="flex gap-4 mt-6">
            {onBack && (
              <button 
                type="button" 
                onClick={onBack}
                className="px-6 py-3 rounded-xl font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                {backLabel || 'Back'}
              </button>
            )}
            <Button type="submit" className="flex-1 py-3 text-lg shadow-xl" disabled={isProcessing}>
               {isProcessing ? <><Loader2 className="animate-spin w-5 h-5" /> Processing...</> : `${t('payOrder')} ${formatPrice(amount)}`}
            </Button>
         </div>
       </form>
    </div>
  );
};

const Header = () => {
  const { t, theme, toggleTheme, language, setLanguage } = useSettings();
  const { user, logout } = useAuth();
  const { items, setIsOpen } = useCart();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // Dropdown state

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const isActive = (path: string) => location.pathname === path ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400';

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'tw', label: 'Twi', flag: '🇬🇭' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-600/20 group-hover:scale-105 transition-transform">TD</div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 hidden sm:block">The Dietitian</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className={isActive('/')}>{t('home')}</Link>
            <Link to="/menu" className={isActive('/menu')}>{t('menu')}</Link>
            <Link to="/stories" className={isActive('/stories')}>{t('stories')}</Link>
            <Link to="/booking" className={isActive('/booking')}>{t('consultations')}</Link>
          </nav>

          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative">
                <button 
                    onClick={() => setIsLangOpen(!isLangOpen)}
                    className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <Globe className="w-5 h-5" />
                </button>
                {isLangOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsLangOpen(false)}></div>
                        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-20 animate-fade-in-up overflow-hidden">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code as Language);
                                        setIsLangOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${language === lang.code ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10' : 'text-slate-600 dark:text-slate-300'}`}
                                >
                                    <span className="text-lg">{lang.flag}</span>
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <button onClick={toggleTheme} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <button onClick={() => setIsOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="hidden md:flex items-center gap-4 relative">
                 <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        {user.name.charAt(0)}
                    </div>
                 </button>
                 
                 {isProfileOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-1 z-20 animate-fade-in-up">
                          <Link 
                            to="/profile" 
                            className="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <UserCircle className="w-4 h-4 inline mr-2" />
                            {t('profile')}
                          </Link>
                          {user.role === 'admin' && (
                            <Link 
                              to="/admin" 
                              className="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <LayoutDashboard className="w-4 h-4 inline mr-2" />
                              {t('dashboard')}
                            </Link>
                          )}
                          <button 
                            onClick={() => { logout(); setIsProfileOpen(false); navigate('/'); }} 
                            className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <LogOut className="w-4 h-4 inline mr-2" />
                            {t('signOut')}
                          </button>
                      </div>
                    </>
                 )}
              </div>
            ) : (
              <Link to="/auth" className="hidden md:block px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">
                {t('signIn')}
              </Link>
            )}

            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <MenuIcon className="w-6 h-6 text-slate-700 dark:text-slate-200" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-4 space-y-4 animate-fade-in-down">
            <Link to="/" className="block py-2 text-slate-600 dark:text-slate-300 font-medium" onClick={() => setIsMenuOpen(false)}>{t('home')}</Link>
            <Link to="/menu" className="block py-2 text-slate-600 dark:text-slate-300 font-medium" onClick={() => setIsMenuOpen(false)}>{t('menu')}</Link>
            <Link to="/stories" className="block py-2 text-slate-600 dark:text-slate-300 font-medium" onClick={() => setIsMenuOpen(false)}>{t('stories')}</Link>
            <Link to="/booking" className="block py-2 text-slate-600 dark:text-slate-300 font-medium" onClick={() => setIsMenuOpen(false)}>{t('consultations')}</Link>
            {user ? (
                <>
                    <Link to="/profile" className="block py-2 text-slate-600 dark:text-slate-300 font-medium" onClick={() => setIsMenuOpen(false)}>{t('profile')}</Link>
                    {user.role === 'admin' && (
                        <Link to="/admin" className="block py-2 text-slate-600 dark:text-slate-300 font-medium" onClick={() => setIsMenuOpen(false)}>{t('dashboard')}</Link>
                    )}
                    <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block py-2 text-red-500 font-medium w-full text-left">{t('signOut')}</button>
                </>
            ) : (
                <Link to="/auth" className="block py-2 text-emerald-600 font-bold" onClick={() => setIsMenuOpen(false)}>{t('signIn')}</Link>
            )}
        </div>
      )}
    </header>
  );
};

const CartDrawer = () => {
  const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, total } = useCart();
  const { t, formatPrice } = useSettings();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 p-6 flex flex-col transform transition-transform duration-300 animate-slide-in-right">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" /> {t('yourOrder')}
          </h2>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {items.length === 0 ? (
            <div className="text-center py-20 opacity-50 flex flex-col items-center">
              <ShoppingBag className="w-16 h-16 mb-4 text-slate-300" />
              <p className="text-lg font-medium">{t('yourOrder')} is empty</p>
              <button onClick={() => setIsOpen(false)} className="mt-4 text-emerald-600 font-bold hover:underline">
                Browse Menu
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartId} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 animate-fade-in">
                <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</h4>
                    <button onClick={() => removeFromCart(item.cartId)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">
                    {item.customization.portion} • {item.customization.frequency}
                    {item.customization.selectedAddOns.length > 0 && ` • +${item.customization.selectedAddOns.length} add-ons`}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-emerald-600">{formatPrice(item.finalPrice)}</p>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1 hover:text-emerald-600 disabled:opacity-30"><Minus className="w-3 h-3" /></button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1 hover:text-emerald-600"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-4 bg-white dark:bg-slate-900">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-medium text-slate-600 dark:text-slate-400">{t('subtotal')}</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatPrice(total)}</span>
          </div>
          <Button 
            className="w-full py-4 text-lg shadow-xl shadow-emerald-500/20" 
            disabled={items.length === 0}
            onClick={() => { setIsOpen(false); navigate('/checkout'); }}
          >
            {t('checkout')} <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </>
  );
};

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hello! I am NutriAI. How can I help you with your diet today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
        const historyForApi = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));
        
        const responseText = await sendMessageToGemini(userMsg.text, historyForApi);
        
        const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() };
        setMessages(prev => [...prev, botMsg]);
    } catch (error) {
        console.error(error);
        const errorMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: "I'm having trouble connecting. Please try again later.", timestamp: new Date() };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className={`fixed bottom-6 right-6 z-40 bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-4 rounded-full shadow-2xl shadow-emerald-500/30 hover:scale-110 transition-transform duration-300 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageCircle className="w-7 h-7" />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[90vw] max-w-[400px] h-[600px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden animate-slide-up">
           <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                      <Zap className="w-5 h-5 text-yellow-300" />
                  </div>
                  <div>
                      <h3 className="font-bold">NutriAI Assistant</h3>
                      <p className="text-xs text-emerald-100 opacity-90">Powered by Gemini</p>
                  </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
              {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user' 
                          ? 'bg-emerald-600 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 rounded-tl-none shadow-sm'
                      }`}>
                          {msg.text}
                      </div>
                  </div>
              ))}
              {isLoading && (
                  <div className="flex justify-start">
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700">
                          <div className="flex gap-1.5">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                      </div>
                  </div>
              )}
              <div ref={messagesEndRef} />
           </div>

           <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                  <input 
                      type="text" 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask about diet, meals..." 
                      className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                  <button 
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                  >
                      <Send className="w-5 h-5" />
                  </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

const HomePage = () => {
    const { t } = useSettings();
    const navigate = useNavigate();

    return (
        <div className="animate-fade-in">
            {/* Hero Section */}
            <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=2000" 
                        alt="Healthy Food" 
                        className="w-full h-full object-cover brightness-[0.4]"
                    />
                </div>
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-8">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight">
                        {t('heroTitle')}
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-200 font-light max-w-2xl mx-auto leading-relaxed">
                        {t('heroSubtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                        <Button 
                            onClick={() => navigate('/menu')} 
                            className="px-8 py-4 text-lg rounded-full shadow-emerald-500/40 hover:scale-105"
                        >
                            {t('viewMenu')}
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => navigate('/booking')} 
                            className="px-8 py-4 text-lg rounded-full border-white text-white hover:bg-white/20 hover:border-white shadow-none"
                        >
                            {t('bookConsultation')}
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-white dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            { icon: UserIcon, title: t('expertGuidance'), desc: "Consult directly with certified dietitians." },
                            { icon: PieChart, title: t('tailoredMacros'), desc: "Meals customized to your specific health goals." },
                            { icon: Utensils, title: t('chefPrepared'), desc: "Gourmet Ghanaian dishes prepared fresh daily." }
                        ].map((feature, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-shadow group text-center">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform text-emerald-600 dark:text-emerald-400">
                                    <feature.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

const MenuPage = () => {
  const { meals } = useData();
  const { addToCart } = useCart();
  const { t, formatPrice } = useSettings();
  const [filter, setFilter] = useState<MealCategory | 'All'>('All');
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  
  // Customization State
  const [portion, setPortion] = useState<'Standard' | 'Large'>('Standard');
  const [frequency, setFrequency] = useState<Frequency>('One-time');
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [notes, setNotes] = useState('');

  const filteredMeals = filter === 'All' ? meals : meals.filter(m => m.category === filter);

  const handleAddToCart = () => {
    if (selectedMeal) {
      const customization: MealCustomization = {
        portion,
        frequency,
        selectedAddOns,
        notes,
        omittedIngredients: [] // Simplify for demo
      };
      addToCart(selectedMeal, customization);
      setSelectedMeal(null);
      // Reset state
      setPortion('Standard');
      setFrequency('One-time');
      setSelectedAddOns([]);
      setNotes('');
    }
  };

  const toggleAddOn = (addon: AddOn) => {
      setSelectedAddOns(prev => 
        prev.find(a => a.name === addon.name) 
        ? prev.filter(a => a.name !== addon.name)
        : [...prev, addon]
      );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">{t('menu')}</h1>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
                {['All', 'Regular', 'Bronze', 'Premium'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat as any)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${filter === cat ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        {cat === 'All' ? t('all') : cat}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMeals.map(meal => (
                <div key={meal.id} className="group bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
                    <div className="relative h-64 overflow-hidden">
                        <img src={meal.image} alt={meal.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute top-4 right-4 flex gap-2">
                             {meal.tags.map(tag => (
                                 <span key={tag} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                                     {tag}
                                 </span>
                             ))}
                        </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-2">{meal.name}</h3>
                            <span className="text-lg font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg">
                                {formatPrice(meal.price)}
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-3 flex-1">{meal.description}</p>
                        
                        <div className="grid grid-cols-3 gap-2 mb-6 text-center text-xs text-slate-400 border-t border-b border-slate-100 dark:border-slate-700 py-4">
                             <div><strong className="block text-slate-700 dark:text-slate-300 text-sm">{meal.calories}</strong>Cal</div>
                             <div><strong className="block text-slate-700 dark:text-slate-300 text-sm">{meal.protein}g</strong>Prot</div>
                             <div><strong className="block text-slate-700 dark:text-slate-300 text-sm">{meal.carbs}g</strong>Carb</div>
                        </div>

                        <Button 
                            onClick={() => setSelectedMeal(meal)} 
                            disabled={!meal.inStock}
                            className="w-full"
                        >
                            {meal.inStock ? t('customizeAdd') : 'Out of Stock'}
                        </Button>
                    </div>
                </div>
            ))}
        </div>

        {/* Customization Modal */}
        {selectedMeal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMeal(null)}></div>
                <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-fade-in-up">
                    <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center z-10">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('customizeAdd')}</h2>
                        <button onClick={() => setSelectedMeal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-6 h-6" /></button>
                    </div>
                    
                    <div className="p-6 space-y-8">
                        {/* Portion Size */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">{t('portionSize')}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {['Standard', 'Large'].map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setPortion(opt as any)}
                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${portion === opt ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-slate-100 dark:border-slate-700 hover:border-emerald-200'}`}
                                    >
                                        <span className="font-bold">{opt === 'Standard' ? t('standard') : t('large')}</span>
                                        <span className="text-xs text-slate-500">{opt === 'Large' ? '+50% price' : 'Base price'}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Frequency */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">Frequency</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {['One-time', 'Weekly', 'Monthly'].map(freq => (
                                    <button
                                        key={freq}
                                        onClick={() => setFrequency(freq as any)}
                                        className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${frequency === freq ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-slate-100 dark:border-slate-700'}`}
                                    >
                                        {freq}
                                    </button>
                                ))}
                            </div>
                            {frequency !== 'One-time' && <p className="text-sm text-emerald-600 mt-2 font-medium">✨ 10% Subscription Discount Applied</p>}
                        </div>

                        {/* Add-ons */}
                        {selectedMeal.availableAddOns && selectedMeal.availableAddOns.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold mb-4">{t('addOns')}</h3>
                                <div className="space-y-3">
                                    {selectedMeal.availableAddOns.map(addon => {
                                        const isSelected = selectedAddOns.some(a => a.name === addon.name);
                                        return (
                                            <div 
                                                key={addon.name}
                                                onClick={() => toggleAddOn(addon)}
                                                className={`flex justify-between items-center p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                                                        {isSelected && <Check className="w-3 h-3" />}
                                                    </div>
                                                    <span className="font-medium">{addon.name}</span>
                                                </div>
                                                <span className="text-sm font-bold">{formatPrice(addon.price)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <TextArea 
                            label={t('specialInstructions')} 
                            placeholder="Allergies, omit ingredients..." 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="sticky bottom-0 bg-white dark:bg-slate-900 p-6 border-t border-slate-100 dark:border-slate-700">
                        <Button onClick={handleAddToCart} className="w-full py-4 text-lg shadow-xl">
                            {t('addToOrder')}
                        </Button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

const StoriesPage = () => {
    const { stories, addStory } = useData();
    const { user } = useAuth();
    const { t } = useSettings();
    const { showToast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [newStoryContent, setNewStoryContent] = useState('');
    const [rating, setRating] = useState(5);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!user) return;
        addStory({
            id: Date.now().toString(),
            userId: user.id,
            authorName: user.name,
            content: newStoryContent,
            rating,
            approved: false, // Requires admin approval
            date: new Date().toISOString().split('T')[0],
            role: 'user'
        });
        setNewStoryContent('');
        setIsFormOpen(false);
        showToast('Story submitted for approval!', 'success');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
             <div className="flex justify-between items-center mb-10">
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">{t('successStories')}</h1>
                {user && (
                    <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                        <MessageSquare className="w-5 h-5" /> {t('submitStory')}
                    </Button>
                )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {stories.filter(s => s.approved).map(story => (
                     <div key={story.id} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col">
                         <div className="flex items-center gap-4 mb-6">
                            <img 
                                src={story.image || `https://ui-avatars.com/api/?name=${story.authorName}&background=10b981&color=fff`} 
                                alt={story.authorName} 
                                className="w-12 h-12 rounded-full object-cover shadow-md"
                            />
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">{story.authorName}</h4>
                                <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-4 h-4 ${i < story.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-600'}`} />
                                    ))}
                                </div>
                            </div>
                         </div>
                         <div className="relative flex-1">
                             <span className="absolute -top-2 -left-2 text-6xl text-slate-200 dark:text-slate-700 opacity-50 font-serif">"</span>
                             <p className="text-slate-600 dark:text-slate-400 relative z-10 leading-relaxed italic">{story.content}</p>
                         </div>
                         <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 font-medium uppercase tracking-wider">
                             {story.date}
                         </div>
                     </div>
                 ))}
             </div>

             {isFormOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                     <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
                     <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-fade-in-up">
                         <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">{t('submitStory')}</h2>
                         <form onSubmit={handleSubmit} className="space-y-6">
                             <div>
                                <label className="block text-sm font-bold mb-2">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((r) => (
                                        <button 
                                            key={r} 
                                            type="button" 
                                            onClick={() => setRating(r)}
                                            className={`p-2 rounded-lg transition-colors ${rating >= r ? 'text-yellow-400' : 'text-slate-300'}`}
                                        >
                                            <Star className={`w-8 h-8 ${rating >= r ? 'fill-current' : ''}`} />
                                        </button>
                                    ))}
                                </div>
                             </div>
                             <TextArea 
                                label="Your Experience" 
                                value={newStoryContent} 
                                onChange={e => setNewStoryContent(e.target.value)} 
                                required 
                                placeholder="Tell us how The Dietitian helped you..."
                                rows={5}
                             />
                             <Button type="submit" className="w-full py-3">{t('submitStory')}</Button>
                         </form>
                     </div>
                 </div>
             )}
        </div>
    );
};

const BookingPage = () => {
    const { t, formatPrice } = useSettings();
    const { bookAppointment } = useData();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [selectedService, setSelectedService] = useState<BookingService | null>(null);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const navigate = useNavigate();

    const handleBook = () => {
        if (!user) {
            navigate('/auth');
            return;
        }
        if (selectedService && date && time) {
            const apt: Appointment = {
                id: Date.now().toString(),
                userId: user.id,
                userName: user.name,
                serviceName: selectedService.name,
                date,
                time,
                status: 'Pending',
                history: []
            };
            bookAppointment(apt);
            showToast('Appointment request sent!', 'success');
            navigate('/profile');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
            <h1 className="text-4xl font-extrabold text-center mb-12 text-slate-900 dark:text-white">{t('bookConsultation')}</h1>
            
            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    {SERVICES.map(service => (
                        <div 
                            key={service.id} 
                            onClick={() => setSelectedService(service)}
                            className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${selectedService?.id === service.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg ring-2 ring-emerald-500/20' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-200'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{service.name}</h3>
                                <span className="font-bold text-emerald-600 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                                    {formatPrice(service.price)}
                                </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 mb-4">{service.description}</p>
                            <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                                <Clock className="w-4 h-4" /> {service.durationMin} mins
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-lg h-fit">
                    <h3 className="text-xl font-bold mb-6">Select Date & Time</h3>
                    <div className="space-y-6">
                        <Input 
                            type="date" 
                            label="Date" 
                            value={date} 
                            onChange={e => setDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            required
                        />
                        <div className="grid grid-cols-3 gap-3">
                            {['09:00', '11:00', '14:00', '16:00'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTime(t)}
                                    className={`py-3 rounded-xl text-sm font-bold border transition-all ${time === t ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700 mt-6">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-slate-500">Total</span>
                                <span className="text-2xl font-bold">{selectedService ? formatPrice(selectedService.price) : '-'}</span>
                            </div>
                            <Button 
                                onClick={handleBook} 
                                disabled={!selectedService || !date || !time} 
                                className="w-full py-4 text-lg shadow-xl"
                            >
                                {user ? 'Confirm Booking' : 'Sign In to Book'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLogin) {
            const success = await login(email, password);
            if (success) {
                showToast('Welcome back!', 'success');
                navigate('/profile');
            } else {
                showToast('Invalid credentials', 'error');
            }
        } else {
            const success = await register(name, email, password);
            if (success) {
                showToast('Account created successfully!', 'success');
                navigate('/profile');
            } else {
                showToast('Email already exists', 'error');
            }
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                    <p className="text-slate-500">Access your personalized health dashboard</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl mb-8">
                    <button 
                        onClick={() => setIsLogin(true)} 
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-500'}`}
                    >
                        Sign In
                    </button>
                    <button 
                        onClick={() => setIsLogin(false)} 
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-500'}`}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!isLogin && (
                        <Input 
                            label="Full Name" 
                            icon={UserIcon}
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            required 
                            placeholder="Kwame Mensah"
                        />
                    )}
                    <Input 
                        label="Email Address" 
                        icon={Mail}
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        placeholder="you@example.com"
                    />
                    <Input 
                        label="Password" 
                        icon={Lock}
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        placeholder="••••••••"
                    />
                    
                    <Button type="submit" className="w-full py-3 text-lg shadow-lg">
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm">
                        Demo Account: <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">user@example.com</span> / <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">user123</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const { t, formatPrice } = useSettings();
    const { orders, appointments } = useData();
    const navigate = useNavigate();

    if (!user) return <Navigate to="/auth" />;

    const myOrders = orders.filter(o => o.userId === user.id);
    const myAppointments = appointments.filter(a => a.userId === user.id);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-8 mb-12">
                <div className="md:w-1/3">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm text-center">
                        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-3xl font-bold text-emerald-600 mx-auto mb-6">
                            {user.name.charAt(0)}
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{user.name}</h2>
                        <p className="text-slate-500 mb-6">{user.email}</p>
                        <Button variant="outline" onClick={logout} className="w-full justify-center">
                            <LogOut className="w-4 h-4" /> {t('signOut')}
                        </Button>
                    </div>
                </div>

                <div className="md:w-2/3 space-y-8">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-emerald-500" /> Recent Orders
                        </h3>
                        {myOrders.length === 0 ? (
                            <p className="text-slate-500 italic">No orders yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {myOrders.map(order => (
                                    <div key={order.id} className="flex justify-between items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">Order #{order.id.slice(-6)}</p>
                                            <p className="text-xs text-slate-500">{order.date} • {order.items.length} items</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-emerald-600">{formatPrice(order.total)}</p>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-500" /> Upcoming Appointments
                        </h3>
                        {myAppointments.length === 0 ? (
                            <p className="text-slate-500 italic">No appointments scheduled.</p>
                        ) : (
                            <div className="space-y-4">
                                {myAppointments.map(apt => (
                                    <div key={apt.id} className="flex justify-between items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{apt.serviceName}</p>
                                            <p className="text-xs text-slate-500">{apt.date} at {apt.time}</p>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${apt.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {apt.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CheckoutPage = () => {
    const { items, total, clearCart } = useCart();
    const { placeOrder } = useData();
    const { user } = useAuth();
    const { t, formatPrice, currency } = useSettings();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [address, setAddress] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (items.length === 0) return <Navigate to="/menu" />;
    if (!user) return <Navigate to="/auth" />;

    const handlePayment = async (method: string) => {
        setIsProcessing(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const order: Order = {
            id: Date.now().toString(),
            userId: user.id,
            customerName: user.name,
            date: new Date().toISOString().split('T')[0],
            items: [...items],
            total: total,
            status: 'Processing',
            paymentMethod: method,
            shippingAddress: address,
            currency: currency,
            isSubscription: items.some(i => i.customization.frequency !== 'One-time'),
            history: []
        };
        
        placeOrder(order);
        clearCart();
        setIsProcessing(false);
        showToast('Order placed successfully!', 'success');
        navigate('/profile');
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-12 animate-fade-in">
            <h1 className="text-3xl font-bold mb-8 text-center">{t('checkout')}</h1>
            
            {/* Progress Steps */}
            <div className="flex justify-center mb-12">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step >= s ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {s}
                        </div>
                        {s < 3 && <div className={`w-16 h-1 ${step > s ? 'bg-emerald-600' : 'bg-slate-200'}`} />}
                    </div>
                ))}
            </div>

            {step === 1 && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm animate-fade-in">
                    <h2 className="text-xl font-bold mb-6">{t('yourOrder')}</h2>
                    <div className="space-y-4 mb-8">
                        {items.map(item => (
                            <div key={item.cartId} className="flex justify-between items-start py-4 border-b border-slate-100 dark:border-slate-700">
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{item.name}</h4>
                                    <p className="text-sm text-slate-500">Qty: {item.quantity} • {item.customization.portion}</p>
                                </div>
                                <p className="font-bold">{formatPrice(item.finalPrice * item.quantity)}</p>
                            </div>
                        ))}
                        <div className="flex justify-between items-center pt-4 text-xl font-bold">
                            <span>{t('total')}</span>
                            <span className="text-emerald-600">{formatPrice(total)}</span>
                        </div>
                    </div>
                    <Button onClick={() => setStep(2)} className="w-full py-3">{t('shippingDetails')}</Button>
                </div>
            )}

            {step === 2 && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm animate-fade-in">
                     <h2 className="text-xl font-bold mb-6">{t('shippingDetails')}</h2>
                     <div className="space-y-6 mb-8">
                         <Input label="Full Name" value={user.name} disabled className="opacity-75" />
                         <Input label="Phone" type="tel" placeholder="020 123 4567" required />
                         <TextArea 
                            label="Delivery Address" 
                            value={address} 
                            onChange={e => setAddress(e.target.value)} 
                            placeholder="Street name, House number, Landmark..." 
                            required 
                         />
                     </div>
                     <div className="flex gap-4">
                         <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                         <Button onClick={() => setStep(3)} disabled={!address} className="flex-1">Proceed to Payment</Button>
                     </div>
                </div>
            )}

            {step === 3 && (
                <PaymentForm 
                    amount={total} 
                    onSubmit={handlePayment} 
                    isProcessing={isProcessing}
                    onBack={() => setStep(2)}
                />
            )}
        </div>
    );
};

const AdminDashboard = () => {
  const { orders, appointments, meals, deleteMeal, addMeal, updateMeal, toggleMealStock, updateOrderStatus, updateAppointmentStatus, stories, approveStory, deleteStory } = useData();
  const { formatPrice, t, currency } = useSettings();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'menu' | 'bookings' | 'stories'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [newMeal, setNewMeal] = useState<Partial<Meal>>({
    category: 'Regular',
    tags: [],
    ingredients: [],
    availableAddOns: [],
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    inStock: true
  });
  
  // Temporary state for managing ingredients and addons in the form
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [currentAddOn, setCurrentAddOn] = useState({ name: '', price: '' });

  const { user } = useAuth();
  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewMeal(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (meal: Meal) => {
    setNewMeal(meal);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewMeal({ category: 'Regular', tags: [], ingredients: [], availableAddOns: [], image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c', inStock: true });
  };

  const handleAddIngredient = () => {
    if (currentIngredient.trim()) {
      setNewMeal(prev => ({
        ...prev,
        ingredients: [...(prev.ingredients || []), currentIngredient.trim()]
      }));
      setCurrentIngredient('');
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setNewMeal(prev => ({
      ...prev,
      ingredients: prev.ingredients?.filter((_, i) => i !== index)
    }));
  };

  const handleAddAddOn = () => {
    if (currentAddOn.name.trim() && currentAddOn.price) {
      setNewMeal(prev => ({
        ...prev,
        availableAddOns: [...(prev.availableAddOns || []), { name: currentAddOn.name.trim(), price: parseFloat(currentAddOn.price) }]
      }));
      setCurrentAddOn({ name: '', price: '' });
    }
  };

  const handleRemoveAddOn = (index: number) => {
    setNewMeal(prev => ({
      ...prev,
      availableAddOns: prev.availableAddOns?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMeal.name && newMeal.price) {
        const mealData = {
            ...newMeal,
            ingredients: newMeal.ingredients || [],
            availableAddOns: newMeal.availableAddOns || []
        };

        if (isEditing && newMeal.id) {
            updateMeal(newMeal.id, mealData as Meal);
            showToast('Meal updated successfully', 'success');
            setIsEditing(false);
        } else {
            addMeal({
                ...mealData as Meal,
                id: Date.now().toString(),
                calories: newMeal.calories || 0,
                protein: newMeal.protein || 0,
                carbs: newMeal.carbs || 0,
                fats: newMeal.fats || 0,
                inStock: true
            });
            showToast('Meal added successfully', 'success');
        }
        setNewMeal({ category: 'Regular', tags: [], ingredients: [], availableAddOns: [], image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c', inStock: true });
    }
  };

  const handleDeleteMeal = (id: string) => {
      if (window.confirm('Are you sure you want to remove this meal?')) {
          deleteMeal(id);
          showToast('Meal deleted', 'info');
      }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  
  // Mock Quarterly Data for Charts (since real history is limited in demo)
  const quarterlyData = [
    { quarter: 'Q1', revenue: totalRevenue * 0.2 + 500 },
    { quarter: 'Q2', revenue: totalRevenue * 0.3 + 800 },
    { quarter: 'Q3', revenue: totalRevenue * 0.4 + 1200 },
    { quarter: 'Q4', revenue: totalRevenue * 0.1 + (totalRevenue || 1500) } // Fallback to simulate growth
  ];
  const maxRevenue = Math.max(...quarterlyData.map(d => d.revenue));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('dashboard')}</h1>
        <p className="text-slate-500">Overview of business performance and content management.</p>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
         {['overview', 'orders', 'menu', 'bookings', 'stories'].map(tab => (
             <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)} 
                className={`px-6 py-2 rounded-full font-bold capitalize transition-all whitespace-nowrap ${activeTab === tab ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600'}`}
             >
                 {tab}
             </button>
         ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        
        {activeTab === 'overview' && (
            <div className="p-8 space-y-8 animate-fade-in">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-bold text-slate-500">Total Revenue</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{formatPrice(totalRevenue)}</h3>
                            </div>
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600"><DollarSign className="w-6 h-6" /></div>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-bold text-slate-500">Total Orders</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{orders.length}</h3>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600"><ShoppingBag className="w-6 h-6" /></div>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-bold text-slate-500">Avg. Order Value</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{formatPrice(avgOrderValue)}</h3>
                            </div>
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600"><TrendingUp className="w-6 h-6" /></div>
                        </div>
                    </div>
                </div>

                {/* Sales Performance Chart */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-emerald-500" /> Quarterly Sales Performance
                    </h3>
                    <div className="h-64 flex items-end justify-between gap-4">
                        {quarterlyData.map((data) => {
                            const height = (data.revenue / maxRevenue) * 100;
                            return (
                                <div key={data.quarter} className="w-full flex flex-col items-center gap-2 group">
                                    <div className="relative w-full bg-emerald-100 dark:bg-emerald-900/20 rounded-t-xl overflow-hidden" style={{ height: '100%' }}>
                                        <div 
                                            className="absolute bottom-0 w-full bg-emerald-500 rounded-t-xl transition-all duration-500 group-hover:bg-emerald-600" 
                                            style={{ height: `${height}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-slate-700 dark:text-slate-300">{data.quarter}</p>
                                        <p className="text-xs text-slate-500">{formatPrice(data.revenue)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Order ID</th>
                  <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Customer</th>
                  <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Total</th>
                  <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {orders.map(order => (
                  <tr key={order.id}>
                    <td className="p-6 font-mono text-sm">{order.id.slice(-6)}</td>
                    <td className="p-6">{order.customerName}</td>
                    <td className="p-6 font-bold">{formatPrice(order.total)}</td>
                    <td className="p-6"><span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700">{order.status}</span></td>
                    <td className="p-6">
                      <select 
                        value={order.status}
                        onChange={(e) => {
                            updateOrderStatus(order.id, e.target.value as OrderStatus);
                            showToast(`Order status updated to ${e.target.value}`, 'info');
                        }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 text-sm outline-none"
                      >
                        <option value="Processing">Processing</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'menu' && (
             <div className="p-6 space-y-8 animate-fade-in">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-slate-900 dark:text-white">{isEditing ? 'Edit Meal' : 'Add New Item'}</h3>
                       {isEditing && <button onClick={handleCancelEdit} className="text-sm text-red-500 font-bold hover:underline">Cancel Edit</button>}
                   </div>
                   <form onSubmit={handleSubmitMeal} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 flex flex-col gap-2">
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Meal Image</label>
                          <div className="flex items-center gap-4">
                              {newMeal.image && (
                                  <img src={newMeal.image} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-600" />
                              )}
                              <label className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm">
                                  <Upload className="w-4 h-4" />
                                  Upload Image
                                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                              </label>
                          </div>
                      </div>
                      <Input placeholder="Meal Name" value={newMeal.name || ''} onChange={e => setNewMeal({...newMeal, name: e.target.value})} required />
                      <Input 
                        placeholder={`${t('price')} (${currency === 'GHS' ? 'GH₵' : '$'})`}
                        type="number" 
                        value={newMeal.price || ''} 
                        onChange={e => setNewMeal({...newMeal, price: parseFloat(e.target.value)})} 
                        required 
                      />
                      <div className="md:col-span-2">
                          <TextArea placeholder="Description" value={newMeal.description || ''} onChange={e => setNewMeal({...newMeal, description: e.target.value})} />
                      </div>

                      {/* Ingredients Manager */}
                      <div className="md:col-span-2 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Ingredients (Removable by customer)</label>
                          <div className="flex gap-2 mb-3">
                              <input 
                                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                                  placeholder="Add ingredient (e.g. Onions)"
                                  value={currentIngredient}
                                  onChange={(e) => setCurrentIngredient(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIngredient())}
                              />
                              <button type="button" onClick={handleAddIngredient} className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-bold text-sm hover:bg-emerald-200"><Plus className="w-4 h-4" /></button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                              {newMeal.ingredients?.map((ing, idx) => (
                                  <span key={idx} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                                      {ing}
                                      <button type="button" onClick={() => handleRemoveIngredient(idx)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                  </span>
                              ))}
                          </div>
                      </div>

                      {/* Add-ons Manager */}
                      <div className="md:col-span-2 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Add-ons (Optional extras)</label>
                          <div className="flex gap-2 mb-3">
                              <input 
                                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                                  placeholder="Name (e.g. Extra Chicken)"
                                  value={currentAddOn.name}
                                  onChange={(e) => setCurrentAddOn({...currentAddOn, name: e.target.value})}
                              />
                              <input 
                                  className="w-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                                  placeholder="Price"
                                  type="number"
                                  value={currentAddOn.price}
                                  onChange={(e) => setCurrentAddOn({...currentAddOn, price: e.target.value})}
                              />
                              <button type="button" onClick={handleAddAddOn} className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-bold text-sm hover:bg-emerald-200"><Plus className="w-4 h-4" /></button>
                          </div>
                          <div className="space-y-2">
                              {newMeal.availableAddOns?.map((addon, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                                      <span className="text-sm">{addon.name}</span>
                                      <div className="flex items-center gap-3">
                                          <span className="text-sm font-bold text-emerald-600">{formatPrice(addon.price)}</span>
                                          <button type="button" onClick={() => handleRemoveAddOn(idx)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="md:col-span-2">
                         <Button type="submit">{isEditing ? 'Update Meal' : 'Add Meal to Menu'}</Button>
                      </div>
                   </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {meals.map(meal => (
                      <div key={meal.id} className={`bg-white dark:bg-slate-800 rounded-xl overflow-hidden border transition-all ${meal.inStock ? 'border-slate-100 dark:border-slate-700' : 'border-red-200 dark:border-red-900/50 opacity-80'} shadow-sm relative group`}>
                         <div className="relative h-48 overflow-hidden">
                            <img src={meal.image} alt={meal.name} className={`w-full h-full object-cover ${!meal.inStock && 'grayscale'}`} />
                            <button 
                                onClick={() => handleEditClick(meal)}
                                className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 p-2 rounded-full shadow-lg hover:text-emerald-600 transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                         </div>
                         <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{meal.name}</h3>
                                <p className="text-emerald-600 font-bold">{formatPrice(meal.price)}</p>
                            </div>
                            <div className="flex justify-between items-center mt-4">
                                <button 
                                    onClick={() => toggleMealStock(meal.id)}
                                    className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 ${meal.inStock ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                >
                                    {meal.inStock ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                    {meal.inStock ? 'In Stock' : 'Out of Stock'}
                                </button>
                                <button onClick={() => handleDeleteMeal(meal.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
        )}

        {/* ... Other tabs (Bookings, Stories) remain the same ... */}
        {activeTab === 'bookings' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Date & Time</th>
                  <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Client</th>
                  <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Service</th>
                  <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {appointments.map(apt => (
                  <tr key={apt.id}>
                    <td className="p-6 text-sm">
                      <div className="font-bold text-slate-900 dark:text-white">{apt.date}</div>
                      <div className="text-slate-500">{apt.time}</div>
                    </td>
                    <td className="p-6">{apt.userName}</td>
                    <td className="p-6">{apt.serviceName}</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        apt.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 
                        apt.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="p-6">
                      <select 
                        value={apt.status}
                        onChange={(e) => {
                            updateAppointmentStatus(apt.id, e.target.value as AppointmentStatus);
                            showToast(`Appointment marked as ${e.target.value}`, 'info');
                        }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 text-sm outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'stories' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {stories.map(story => (
              <div key={story.id} className="p-6 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col">
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                          {story.authorName.charAt(0)}
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">{story.authorName}</h4>
                          <div className="flex text-yellow-400 text-xs">
                             {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < story.rating ? 'fill-current' : 'text-slate-300'}`} />
                             ))}
                          </div>
                       </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${story.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                       {story.approved ? 'Approved' : 'Pending'}
                    </span>
                 </div>
                 <p className="text-slate-600 dark:text-slate-400 text-sm italic mb-6 flex-1">"{story.content}"</p>
                 <div className="flex gap-2">
                    {!story.approved && (
                       <Button onClick={() => { approveStory(story.id); showToast('Story approved', 'success'); }} className="flex-1 py-2 text-sm">
                          <Check className="w-4 h-4" /> Approve
                       </Button>
                    )}
                    <Button 
                       variant="danger" 
                       onClick={() => {
                          if(window.confirm('Delete this story?')) {
                             deleteStory(story.id);
                             showToast('Story deleted', 'info');
                          }
                       }} 
                       className="flex-1 py-2 text-sm bg-red-100 text-red-600 hover:bg-red-200 shadow-none"
                    >
                       <Trash2 className="w-4 h-4" /> Delete
                    </Button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <DataProvider>
        <SettingsProvider>
          <ToastProvider>
            <AuthProvider>
                <NotificationProvider>
                <CartProvider>
                    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
                    <Header />
                    <CartDrawer />
                    <AIChat />
                    
                    <main className="flex-1">
                        <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/menu" element={<MenuPage />} />
                        <Route path="/stories" element={<StoriesPage />} />
                        <Route path="/booking" element={<BookingPage />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        </Routes>
                    </main>

                    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-16 border-t border-slate-800 transition-colors">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-12">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-3 mb-6 text-white">
                            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-emerald-900/50">TD</div>
                            <span className="text-2xl font-bold tracking-tight">The Dietitian</span>
                            </div>
                            <p className="max-w-xs mb-8 text-slate-400 leading-relaxed">Empowering healthier lives through personalized nutrition and expert care, delivered right to your door.</p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-6 text-lg">Quick Links</h4>
                            <ul className="space-y-3">
                            <li><Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link></li>
                            <li><Link to="/menu" className="hover:text-emerald-400 transition-colors">Meal Plans</Link></li>
                            <li><Link to="/booking" className="hover:text-emerald-400 transition-colors">Consultations</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-6 text-lg">Contact</h4>
                            <ul className="space-y-3">
                            <li><Mail className="w-4 h-4 inline mr-2" /> support@thedietitian.com.gh</li>
                            <li><Phone className="w-4 h-4 inline mr-2" /> +233 20 123 4567</li>
                            <li><MapPin className="w-4 h-4 inline mr-2" /> 12 Independence Ave, Accra</li>
                            </ul>
                        </div>
                        </div>
                        <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-slate-800 text-sm text-center text-slate-500">
                        © {new Date().getFullYear()} The Dietitian Ghana. All rights reserved.
                        </div>
                    </footer>
                    </div>
                </CartProvider>
                </NotificationProvider>
            </AuthProvider>
          </ToastProvider>
        </SettingsProvider>
      </DataProvider>
    </HashRouter>
  );
};

export default App;