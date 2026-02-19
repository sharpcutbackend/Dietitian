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
  PieChart
} from 'lucide-react';
import { MEALS, SERVICES, EXCHANGE_RATE, TRANSLATIONS, STORIES } from './constants';
import { Meal, CartItem, DietaryType, BookingService, ChatMessage, User, Order, MealCustomization, MealCategory, Language, Currency, Theme, Frequency, Appointment, OrderStatus, AppointmentStatus, Story, AddOn } from './types';
import { sendMessageToGemini } from './services/geminiService';

// --- Data Provider (Simulates Backend) ---
interface DataContextType {
  meals: Meal[];
  addMeal: (meal: Meal) => void;
  deleteMeal: (id: string) => void;
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stories, setStories] = useState<Story[]>(STORIES);

  const addMeal = (meal: Meal) => setMeals(prev => [...prev, meal]);
  const deleteMeal = (id: string) => setMeals(prev => prev.filter(m => m.id !== id));
  const toggleMealStock = (id: string) => {
    setMeals(prev => prev.map(m => m.id === id ? { ...m, inStock: !m.inStock } : m));
  };
  
  const placeOrder = (order: Order) => setOrders(prev => [order, ...prev]);
  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const bookAppointment = (apt: Appointment) => setAppointments(prev => [apt, ...prev]);
  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const addStory = (story: Story) => setStories(prev => [story, ...prev]);
  const approveStory = (id: string) => setStories(prev => prev.map(s => s.id === id ? { ...s, approved: true } : s));
  const deleteStory = (id: string) => setStories(prev => prev.filter(s => s.id !== id));

  return (
    <DataContext.Provider value={{ meals, addMeal, deleteMeal, toggleMealStock, orders, placeOrder, updateOrderStatus, appointments, bookAppointment, updateAppointmentStatus, stories, addStory, approveStory, deleteStory }}>
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
    // If password provided, verify it. If not (for demo buttons), skip check.
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
      password: password || '123456', // Default if not provided
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
  };

  const removeFromCart = (cartId: string) => {
    setItems(prev => prev.filter(i => i.cartId !== cartId));
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
    danger: 'bg-red-500 text-white hover:bg-red-600'
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

// Payment Form Component
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

// --- Admin Dashboard Components ---

const AdminDashboard = () => {
  const { orders, appointments, meals, deleteMeal, addMeal, toggleMealStock, updateOrderStatus, updateAppointmentStatus, stories, approveStory, deleteStory } = useData();
  const { formatPrice, t, currency } = useSettings();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'menu' | 'bookings' | 'stories'>('overview');
  const [newMeal, setNewMeal] = useState<Partial<Meal>>({
    category: 'Regular',
    tags: [],
    ingredients: [],
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    inStock: true
  });

  const { user } = useAuth();
  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMeal.name && newMeal.price) {
        addMeal({
            ...newMeal as Meal,
            id: Date.now().toString(),
            calories: newMeal.calories || 0,
            protein: newMeal.protein || 0,
            carbs: newMeal.carbs || 0,
            fats: newMeal.fats || 0,
            ingredients: typeof newMeal.ingredients === 'string' ? (newMeal.ingredients as string).split(',') : [],
            inStock: true
        });
        setNewMeal({ category: 'Regular', tags: [], ingredients: [], image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c', inStock: true });
        alert('Meal added!');
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'Processing').length;
  const pendingAppointments = appointments.filter(a => a.status === 'Pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('dashboard')}</h1>
        <p className="text-slate-500">Manage orders, menu, stories and appointments.</p>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
         <button onClick={() => setActiveTab('overview')} className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600'}`}>Overview</button>
         <button onClick={() => setActiveTab('orders')} className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600'}`}>Orders</button>
         <button onClick={() => setActiveTab('menu')} className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'menu' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600'}`}>Menu</button>
         <button onClick={() => setActiveTab('bookings')} className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'bookings' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600'}`}>Appointments</button>
         <button onClick={() => setActiveTab('stories')} className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'stories' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600'}`}>Stories</button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        
        {activeTab === 'overview' && (
            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-bold text-slate-500">Total Users</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">1,204</h3>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600"><Users className="w-6 h-6" /></div>
                        </div>
                    </div>
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
                                <p className="text-sm font-bold text-slate-500">Pending Actions</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{pendingOrders + pendingAppointments}</h3>
                            </div>
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600"><AlertCircle className="w-6 h-6" /></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 h-64 flex flex-col justify-center items-center">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 self-start">Weekly Orders</h4>
                        <div className="flex items-end gap-3 h-full w-full px-4">
                            {[40, 65, 30, 80, 55, 90, 70].map((h, i) => (
                                <div key={i} className="flex-1 bg-emerald-500 rounded-t-lg hover:bg-emerald-600 transition-colors" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                        <div className="flex justify-between w-full mt-2 text-xs text-slate-400">
                            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4">Recent Activity</h4>
                        <div className="space-y-4">
                            {orders.slice(0, 3).map(o => (
                                <div key={o.id} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">New order from <strong>{o.customerName}</strong></span>
                                    <span className="text-xs text-slate-400">{new Date(o.date).toLocaleDateString()}</span>
                                </div>
                            ))}
                            {appointments.slice(0, 2).map(a => (
                                <div key={a.id} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Appointment booked by <strong>{a.userName}</strong></span>
                                    <span className="text-xs text-slate-400">{a.date}</span>
                                </div>
                            ))}
                        </div>
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
                    <td className="p-6 font-mono text-sm">{order.id}</td>
                    <td className="p-6">{order.customerName}</td>
                    <td className="p-6 font-bold">{formatPrice(order.total)}</td>
                    <td className="p-6"><span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700">{order.status}</span></td>
                    <td className="p-6">
                      <select 
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
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
                {/* Add Meal Form */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                   <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Add New Item</h3>
                   <form onSubmit={handleAddMeal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input placeholder="Meal Name" value={newMeal.name || ''} onChange={e => setNewMeal({...newMeal, name: e.target.value})} required />
                      <Input 
                        placeholder={`Price (${currency === 'GHS' ? 'GH₵' : 'USD'})`} 
                        type="number" 
                        value={newMeal.price || ''} 
                        onChange={e => setNewMeal({...newMeal, price: parseFloat(e.target.value)})} 
                        required 
                      />
                      <Input placeholder="Calories" type="number" value={newMeal.calories || ''} onChange={e => setNewMeal({...newMeal, calories: parseInt(e.target.value)})} />
                      <Input placeholder="Image URL" value={newMeal.image || ''} onChange={e => setNewMeal({...newMeal, image: e.target.value})} />
                      <TextArea placeholder="Description" className="md:col-span-2" value={newMeal.description || ''} onChange={e => setNewMeal({...newMeal, description: e.target.value})} />
                      <div className="md:col-span-2">
                         <Button type="submit">Add Meal to Menu</Button>
                      </div>
                   </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {meals.map(meal => (
                      <div key={meal.id} className={`bg-white dark:bg-slate-800 rounded-xl overflow-hidden border transition-all ${meal.inStock ? 'border-slate-100 dark:border-slate-700' : 'border-red-200 dark:border-red-900/50 opacity-80'} shadow-sm relative group`}>
                         <div className="relative h-48 overflow-hidden">
                            <img src={meal.image} alt={meal.name} className={`w-full h-full object-cover ${!meal.inStock && 'grayscale'}`} />
                            {!meal.inStock && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="text-white font-bold text-lg bg-red-600 px-4 py-1 rounded-full">Out of Stock</span>
                                </div>
                            )}
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
                                <button onClick={() => deleteMeal(meal.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
        )}

        {activeTab === 'bookings' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Client</th>
                  <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Service</th>
                  <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Date/Time</th>
                  <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {appointments.map(apt => (
                  <tr key={apt.id}>
                    <td className="p-6">{apt.userName}</td>
                    <td className="p-6">{apt.serviceName}</td>
                    <td className="p-6 text-sm">{apt.date} {apt.time}</td>
                    <td className="p-6"><span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700">{apt.status}</span></td>
                    <td className="p-6">
                      <select 
                        value={apt.status}
                        onChange={(e) => updateAppointmentStatus(apt.id, e.target.value as AppointmentStatus)}
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
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Author</th>
                            <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Content</th>
                            <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Date</th>
                            <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Status</th>
                            <th className="p-6 font-bold text-slate-700 dark:text-slate-300">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {stories.map(story => (
                            <tr key={story.id}>
                                <td className="p-6">
                                    <div className="font-bold">{story.authorName}</div>
                                    <div className="text-xs text-slate-500">{story.role}</div>
                                </td>
                                <td className="p-6">
                                    <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300 max-w-xs">{story.content}</p>
                                </td>
                                <td className="p-6 text-sm">{story.date}</td>
                                <td className="p-6">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${story.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {story.approved ? 'Live' : 'Pending'}
                                    </span>
                                </td>
                                <td className="p-6 flex gap-2">
                                    {!story.approved && (
                                        <button onClick={() => approveStory(story.id)} className="p-2 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200">
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button onClick={() => deleteStory(story.id)} className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

const StoriesPage = () => {
  const { stories, addStory } = useData();
  const { user } = useAuth();
  const { t } = useSettings();
  const [newStoryContent, setNewStoryContent] = useState('');
  const [rating, setRating] = useState(5);
  const [showForm, setShowForm] = useState(false);

  const approvedStories = stories.filter(s => s.approved);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const story: Story = {
        id: Date.now().toString(),
        userId: user.id,
        authorName: user.name,
        content: newStoryContent,
        rating,
        approved: user.role === 'admin', // Admins approve automatically
        date: new Date().toISOString().split('T')[0],
        role: user.role,
        image: `https://ui-avatars.com/api/?name=${user.name}&background=random`
    };
    
    addStory(story);
    setNewStoryContent('');
    setShowForm(false);
    alert(user.role === 'admin' ? 'Story added!' : 'Story submitted for review!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{t('successStories')}</h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Hear from our community about their journey to better health.</p>
            <div className="mt-6">
                <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : t('submitStory')}</Button>
            </div>
        </div>

        {showForm && (
            <div className="max-w-xl mx-auto mb-16 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 animate-fade-in-down">
                {user ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Share your experience</h3>
                        <TextArea 
                            placeholder="Tell us about your meal or consultation experience..." 
                            value={newStoryContent}
                            onChange={e => setNewStoryContent(e.target.value)}
                            required
                            rows={4}
                        />
                        <div>
                            <label className="block text-sm font-semibold mb-2">Rating</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(r => (
                                    <button 
                                        key={r} 
                                        type="button" 
                                        onClick={() => setRating(r)}
                                        className={`p-2 rounded-full transition-colors ${rating >= r ? 'text-yellow-400' : 'text-slate-300'}`}
                                    >
                                        <Star className="w-6 h-6 fill-current" />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Button type="submit" className="w-full">Submit</Button>
                    </form>
                ) : (
                    <div className="text-center">
                        <p className="mb-4">Please sign in to share your story.</p>
                        <Link to="/auth"><Button>Sign In</Button></Link>
                    </div>
                )}
            </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {approvedStories.map(story => (
                <div key={story.id} className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-4">
                        <img src={story.image || `https://ui-avatars.com/api/?name=${story.authorName}&background=random`} alt={story.authorName} className="w-12 h-12 rounded-full object-cover" />
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">{story.authorName}</h4>
                            <div className="flex text-yellow-400 text-xs">
                                {[...Array(story.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                            </div>
                        </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 italic mb-6 flex-grow">"{story.content}"</p>
                    <div className="text-xs text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <span>{story.date}</span>
                        {story.role === 'admin' && <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">Admin Post</span>}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

const MenuPage = () => {
  const { meals } = useData();
  const { addToCart } = useCart();
  const { formatPrice, t } = useSettings();
  const [category, setCategory] = useState<string>('All');
  
  // Customization Modal State
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [portion, setPortion] = useState<'Standard' | 'Large'>('Standard');
  const [frequency, setFrequency] = useState<Frequency>('One-time');
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);

  const categories = [
    { id: 'All', label: t('all') },
    { id: 'Regular', label: t('regular') },
    { id: 'Bronze', label: t('bronze') },
    { id: 'Premium', label: t('premium') }
  ];
  
  const filteredMeals = category === 'All' ? meals : meals.filter(m => m.category === category);

  const toggleAddOn = (addon: AddOn) => {
    setSelectedAddOns(prev => 
        prev.some(a => a.name === addon.name) 
        ? prev.filter(a => a.name !== addon.name) 
        : [...prev, addon]
    );
  };

  const handleAddToCart = () => {
    if (selectedMeal) {
        addToCart(selectedMeal, {
            portion,
            frequency,
            omittedIngredients: [],
            notes: '',
            selectedAddOns
        });
        setSelectedMeal(null);
        setPortion('Standard');
        setFrequency('One-time');
        setSelectedAddOns([]);
    }
  };

  // Calculate current total for modal display
  const currentTotal = selectedMeal ? 
    ((portion === 'Large' ? selectedMeal.price * 1.5 : selectedMeal.price) + 
    selectedAddOns.reduce((sum, a) => sum + a.price, 0)) * (frequency !== 'One-time' ? 0.9 : 1) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('menu')}</h1>
           <p className="text-slate-500 dark:text-slate-400">Curated meals for every lifestyle.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full font-medium whitespace-nowrap transition-all ${
                category === cat.id 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredMeals.map(meal => (
          <div key={meal.id} className={`bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group ${!meal.inStock ? 'opacity-80 grayscale-[0.5]' : ''}`}>
            <div className="relative h-56 overflow-hidden">
               <img src={meal.image} alt={meal.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
               <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-900 dark:text-white shadow-sm">
                 {meal.calories} kcal
               </div>
               {!meal.inStock && (
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                       <span className="bg-red-600 text-white px-4 py-1.5 rounded-full font-bold transform -rotate-6 shadow-lg border-2 border-white">Out of Stock</span>
                   </div>
               )}
            </div>
            <div className="p-6">
               <div className="flex justify-between items-start mb-3">
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{meal.name}</h3>
                 <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(meal.price)}</span>
               </div>
               <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">{meal.description}</p>
               
               <div className="flex flex-wrap gap-2 mb-6">
                 {meal.tags.map(tag => (
                   <span key={tag} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold">
                     {tag}
                   </span>
                 ))}
               </div>
               
               <Button onClick={() => { setSelectedMeal(meal); setSelectedAddOns([]); }} disabled={!meal.inStock} className="w-full">
                 {meal.inStock ? t('addToOrder') : 'Unavailable'}
               </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Customization Modal */}
      {selectedMeal && selectedMeal.inStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMeal(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
             <button onClick={() => setSelectedMeal(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full">
               <X className="w-5 h-5" />
             </button>
             
             <div className="flex gap-4 mb-6">
               <img src={selectedMeal.image} className="w-20 h-20 rounded-xl object-cover" />
               <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">{selectedMeal.name}</h3>
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold">{formatPrice(selectedMeal.price)}</p>
               </div>
             </div>

             <div className="space-y-6 mb-8">
               <div>
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{t('portionSize')}</label>
                 <div className="grid grid-cols-2 gap-3">
                   {['Standard', 'Large'].map((p) => (
                     <button 
                        key={p}
                        onClick={() => setPortion(p as any)}
                        className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${portion === p ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-slate-100 dark:border-slate-700 text-slate-500'}`}
                     >
                       {p === 'Standard' ? t('standard') : t('large')} {p === 'Large' && '(+50%)'}
                     </button>
                   ))}
                 </div>
               </div>

               {selectedMeal.availableAddOns && selectedMeal.availableAddOns.length > 0 && (
                   <div>
                       <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{t('addOns')}</label>
                       <div className="space-y-2">
                           {selectedMeal.availableAddOns.map(addon => (
                               <button 
                                key={addon.name}
                                onClick={() => toggleAddOn(addon)}
                                className={`w-full flex justify-between items-center p-3 rounded-xl border-2 transition-all ${selectedAddOns.some(a => a.name === addon.name) ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-100 dark:border-slate-700'}`}
                               >
                                   <span className="text-sm font-medium">{addon.name}</span>
                                   <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">+{formatPrice(addon.price)}</span>
                               </button>
                           ))}
                       </div>
                   </div>
               )}
               
               <div>
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Frequency</label>
                 <select 
                   value={frequency}
                   onChange={(e) => setFrequency(e.target.value as Frequency)}
                   className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20"
                 >
                   <option value="One-time">One-time Order</option>
                   <option value="Weekly">Weekly Subscription (10% off)</option>
                   <option value="Monthly">Monthly Subscription (15% off)</option>
                 </select>
               </div>
             </div>
             
             <Button onClick={handleAddToCart} className="w-full py-3 text-lg">
               {t('addToOrder')} - {formatPrice(currentTotal)}
             </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- New/Missing Components ---

const CartDrawer = () => {
  const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, total } = useCart();
  const { formatPrice, t } = useSettings();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl p-6 flex flex-col animate-slide-in-right">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
               <ShoppingBag className="w-6 h-6 text-emerald-600" /> {t('yourOrder')}
           </h2>
           <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
               <X className="w-6 h-6" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
           {items.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                   <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                   <p>Your cart is empty.</p>
                   <Button variant="outline" onClick={() => setIsOpen(false)} className="mt-4">Browse Menu</Button>
               </div>
           ) : (
               items.map(item => (
                   <div key={item.cartId} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                       <div className="flex-1">
                           <div className="flex justify-between items-start">
                               <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</h4>
                               <button onClick={() => removeFromCart(item.cartId)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                           </div>
                           <p className="text-xs text-slate-500 mb-2">
                               {item.customization.portion} • {item.customization.frequency}
                               {item.customization.selectedAddOns.length > 0 && ` • +${item.customization.selectedAddOns.length} Add-ons`}
                           </p>
                           <div className="flex justify-between items-center mt-2">
                               <p className="font-bold text-emerald-600">{formatPrice(item.finalPrice * item.quantity)}</p>
                               <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-700">
                                   <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1 hover:text-emerald-600"><Minus className="w-3 h-3" /></button>
                                   <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                   <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1 hover:text-emerald-600"><Plus className="w-3 h-3" /></button>
                               </div>
                           </div>
                       </div>
                   </div>
               ))
           )}
        </div>

        {items.length > 0 && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-4">
                <div className="flex justify-between items-center mb-6">
                    <span className="font-bold text-slate-500">{t('subtotal')}</span>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatPrice(total)}</span>
                </div>
                <Button onClick={() => { setIsOpen(false); navigate('/checkout'); }} className="w-full py-4 text-lg shadow-xl shadow-emerald-500/20">
                    {t('checkout')} <ArrowRight className="w-5 h-5" />
                </Button>
            </div>
        )}
      </div>
    </div>
  );
};

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
        // Prepare history for Gemini
        const history = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));
        
        const responseText = await sendMessageToGemini(userMsg.text, history);
        
        const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() };
        setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 transition-all hover:scale-110"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 h-[500px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-fade-in-up">
          <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
            <h3 className="font-bold flex items-center gap-2"><MessageSquare className="w-5 h-5"/> NutriAI Assistant</h3>
            <button onClick={() => setIsOpen(false)}><X className="w-5 h-5" /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
             {messages.length === 0 && (
                 <div className="text-center text-slate-500 mt-8">
                     <p>Hi! I can help you choose meals or answer nutrition questions.</p>
                 </div>
             )}
             {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm'}`}>
                      {msg.text}
                   </div>
                </div>
             ))}
             {isLoading && (
                 <div className="flex justify-start">
                     <div className="bg-white dark:bg-slate-700 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                         <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                         <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                         <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                     </div>
                 </div>
             )}
             <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about our menu..."
              className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50">
               <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const BookingPage = () => {
    const { t, formatPrice } = useSettings();
    const { user } = useAuth();
    const { bookAppointment } = useData();
    const navigate = useNavigate();
    
    const [selectedService, setSelectedService] = useState<BookingService | null>(null);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [step, setStep] = useState(1);

    const handleBook = () => {
        if (!user) {
            navigate('/auth');
            return;
        }
        if (selectedService && date && time) {
            const appointment: Appointment = {
                id: Date.now().toString(),
                userId: user.id,
                userName: user.name,
                serviceName: selectedService.name,
                date,
                time,
                status: 'Pending'
            };
            bookAppointment(appointment);
            setStep(3); // Success
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{t('bookConsultation')}</h1>
                <p className="text-slate-500 dark:text-slate-400">Expert nutrition advice tailored to your lifestyle.</p>
            </div>

            {step === 1 && (
                <div className="grid md:grid-cols-3 gap-8">
                    {SERVICES.map(service => (
                        <div key={service.id} className={`bg-white dark:bg-slate-800 p-8 rounded-3xl border-2 transition-all cursor-pointer hover:border-emerald-500 hover:shadow-xl ${selectedService?.id === service.id ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-100 dark:border-slate-700'}`} onClick={() => setSelectedService(service)}>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-xl text-slate-900 dark:text-white">{service.name}</h3>
                                <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full text-sm">{formatPrice(service.price)}</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">{service.description}</p>
                            <div className="flex items-center text-sm text-slate-400">
                                <Clock className="w-4 h-4 mr-2" /> {service.durationMin} mins
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {step === 2 && selectedService && (
                <div className="max-w-md mx-auto bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-xl mb-6 text-slate-900 dark:text-white">Select Time</h3>
                    <div className="space-y-4">
                        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
                        <Input label="Time" type="time" value={time} onChange={e => setTime(e.target.value)} required />
                    </div>
                    <div className="flex gap-4 mt-8">
                        <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">Back</Button>
                        <Button onClick={handleBook} disabled={!date || !time} className="flex-1">Confirm Booking</Button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="text-center py-12 animate-fade-in-up">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Booking Confirmed!</h2>
                    <p className="text-slate-500 mb-8">We have sent a confirmation to your email.</p>
                    <Button onClick={() => navigate('/profile')}>View Appointments</Button>
                </div>
            )}

            {step === 1 && selectedService && (
                <div className="text-center mt-12">
                    <Button onClick={() => setStep(2)} className="px-12 py-3 text-lg">Continue <ArrowRight className="ml-2 w-5 h-5"/></Button>
                </div>
            )}
        </div>
    );
};

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const { t } = useSettings();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let success = false;
        if (isLogin) {
            success = await login(email, password);
        } else {
            success = await register(name, email, password);
        }

        if (success) {
            navigate('/profile');
        } else {
            alert('Authentication failed. Check credentials or email availability.');
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 animate-fade-in-up">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">{isLogin ? t('signIn') : 'Create Account'}</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-emerald-600 hover:text-emerald-500">
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <Input label="Full Name" type="text" value={name} onChange={e => setName(e.target.value)} required icon={UserIcon} />
                    )}
                    <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required icon={Mail} />
                    <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required icon={Lock} />
                    
                    <Button type="submit" className="w-full py-3 text-lg shadow-lg">
                        {isLogin ? t('signIn') : 'Sign Up'}
                    </Button>
                </form>
                <div className="text-center">
                     <p className="text-xs text-slate-400">Demo: user@example.com / user123</p>
                     <p className="text-xs text-slate-400">Admin: admin@example.com / admin123</p>
                </div>
            </div>
        </div>
    );
};

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const { t, formatPrice } = useSettings();
    const navigate = useNavigate();

    if (!user) return <Navigate to="/auth" />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-1/4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 text-center">
                        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-3xl font-bold text-emerald-600 mx-auto mb-4">
                            {user.name.charAt(0)}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
                        <p className="text-slate-500 text-sm mb-6">{user.email}</p>
                        <Button variant="outline" onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center justify-center gap-2">
                            <LogOut className="w-4 h-4" /> {t('signOut')}
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-8">
                    {/* Appointments */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2"><Calendar className="w-5 h-5" /> Appointments</h3>
                        {user.appointments.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">No upcoming appointments. <Link to="/booking" className="text-emerald-600 font-bold">Book now</Link></div>
                        ) : (
                            <div className="space-y-4">
                                {user.appointments.map(apt => (
                                    <div key={apt.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{apt.serviceName}</p>
                                            <p className="text-sm text-slate-500">{apt.date} at {apt.time}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${apt.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{apt.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Orders */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> Order History</h3>
                        {user.orders.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">No past orders. <Link to="/menu" className="text-emerald-600 font-bold">Order a meal</Link></div>
                        ) : (
                            <div className="space-y-4">
                                {user.orders.map(order => (
                                    <div key={order.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">Order #{order.id.slice(-6)}</p>
                                                <p className="text-xs text-slate-500">{new Date(order.date).toLocaleDateString()}</p>
                                            </div>
                                            <p className="font-bold text-emerald-600">{formatPrice(order.total)}</p>
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                            {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300`}>{order.status}</span>
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
    const { t, formatPrice } = useSettings();
    const navigate = useNavigate();
    
    const [step, setStep] = useState(1);
    const [address, setAddress] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (items.length === 0 && step === 1) return <Navigate to="/menu" />;

    const handlePayment = async (paymentDetails: string) => {
        setIsProcessing(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const order: Order = {
            id: Date.now().toString(),
            userId: user?.id || 'guest',
            customerName: user?.name || 'Guest',
            date: new Date().toISOString(),
            items: [...items],
            total: total,
            status: 'Processing',
            paymentMethod: paymentDetails,
            shippingAddress: address,
            currency: 'GHS', // Default to GHS for now
            isSubscription: items.some(i => i.customization.frequency !== 'One-time')
        };

        placeOrder(order);
        clearCart();
        setIsProcessing(false);
        setStep(3); // Success
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">{t('checkout')}</h1>

            {step === 1 && (
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                             <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">{t('shippingDetails')}</h3>
                             <TextArea 
                                label="Delivery Address" 
                                value={address} 
                                onChange={e => setAddress(e.target.value)} 
                                placeholder="Enter your delivery location..."
                                required
                                rows={3}
                             />
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                             <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Order Summary</h3>
                             <div className="space-y-3 max-h-60 overflow-y-auto">
                                 {items.map(item => (
                                     <div key={item.cartId} className="flex justify-between text-sm">
                                         <span className="text-slate-600 dark:text-slate-400">{item.quantity}x {item.name}</span>
                                         <span className="font-bold text-slate-900 dark:text-white">{formatPrice(item.finalPrice * item.quantity)}</span>
                                     </div>
                                 ))}
                             </div>
                             <div className="border-t border-slate-100 dark:border-slate-700 mt-4 pt-4 flex justify-between font-bold text-lg">
                                 <span>{t('total')}</span>
                                 <span className="text-emerald-600">{formatPrice(total)}</span>
                             </div>
                        </div>
                    </div>
                    <div>
                         <PaymentForm 
                            amount={total} 
                            onSubmit={handlePayment} 
                            isProcessing={isProcessing}
                            // disabled={!address} 
                         />
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="max-w-md mx-auto text-center py-12 animate-fade-in-up">
                    <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{t('orderConfirmed')}</h2>
                    <p className="text-slate-500 mb-8">Thank you for your order! We are preparing your healthy meal.</p>
                    <div className="flex justify-center gap-4">
                        <Button onClick={() => navigate('/')}>{t('returnHome')}</Button>
                        <Button variant="outline" onClick={() => navigate('/profile')}>Track Order</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Layout Components ---

const Header = () => {
  const { t, theme, toggleTheme, language, setLanguage } = useSettings();
  const { user, logout } = useAuth();
  const { items, setIsOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

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
              <div className="hidden md:flex items-center gap-4">
                 <Link to={user.role === 'admin' ? '/admin' : '/profile'} className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        {user.name.charAt(0)}
                    </div>
                 </Link>
                 <button onClick={() => { logout(); navigate('/'); }} className="text-slate-400 hover:text-red-500">
                    <LogOut className="w-5 h-5" />
                 </button>
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
                    <Link to={user.role === 'admin' ? '/admin' : '/profile'} className="block py-2 text-slate-600 dark:text-slate-300 font-medium" onClick={() => setIsMenuOpen(false)}>{t('profile')}</Link>
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

const HomePage = () => {
  const { t } = useSettings();
  const { stories } = useData();
  const navigate = useNavigate();

  // Top 3 Stories
  const topStories = stories
    .filter(s => s.approved)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  return (
    <div className="animate-fade-in">
        <section className="relative min-h-[600px] flex items-center">
            <div className="absolute inset-0 z-0">
                <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/30" />
            </div>
            
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
                <div className="max-w-2xl">
                    <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold text-sm mb-6 backdrop-blur-sm">
                        #1 Healthy Meal Delivery in Ghana
                    </span>
                    <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight">
                        {t('heroTitle')}
                    </h1>
                    <p className="text-xl text-slate-200 mb-8 leading-relaxed max-w-lg">
                        {t('heroSubtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={() => navigate('/menu')} className="py-4 px-8 text-lg">{t('viewMenu')}</Button>
                        <Button variant="outline" onClick={() => navigate('/booking')} className="py-4 px-8 text-lg border-white text-white hover:bg-white hover:text-emerald-900">{t('bookConsultation')}</Button>
                    </div>
                </div>
            </div>
        </section>

        <section className="py-20 bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Why The Dietitian?</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">We don't just deliver food; we deliver health, convenience, and culture in every bite.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    {[
                        { icon: Award, title: t('expertGuidance'), desc: "Meal plans crafted by certified dietitians tailored to your metabolic needs." },
                        { icon: Utensils, title: t('chefPrepared'), desc: "Gourmet quality meals cooked daily using fresh, local organic ingredients." },
                        { icon: Zap, title: t('tailoredMacros'), desc: "Whether it's weight loss, muscle gain, or management, we have a plan for you." }
                    ].map((feature, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                                <feature.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{t('successStories')}</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {topStories.map(story => (
                        <div key={story.id} className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-4 mb-4">
                                <img src={story.image || `https://ui-avatars.com/api/?name=${story.authorName}`} alt={story.authorName} className="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{story.authorName}</h4>
                                    <div className="flex text-yellow-400 text-xs">
                                        {[...Array(story.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                                    </div>
                                </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 italic">"{story.content}"</p>
                        </div>
                    ))}
                </div>
                <div className="text-center mt-12">
                    <Button variant="outline" onClick={() => navigate('/stories')}>{t('stories')}</Button>
                </div>
            </div>
        </section>
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <DataProvider>
        <SettingsProvider>
          <AuthProvider>
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
                        <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> support@thedietitian.com.gh</li>
                        <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +233 20 123 4567</li>
                        <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> 12 Independence Ave, Accra</li>
                      </ul>
                    </div>
                  </div>
                  <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-slate-800 text-sm text-center text-slate-500">
                    © {new Date().getFullYear()} The Dietitian Ghana. All rights reserved.
                  </div>
                </footer>
              </div>
            </CartProvider>
          </AuthProvider>
        </SettingsProvider>
      </DataProvider>
    </HashRouter>
  );
};

export default App;