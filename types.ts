
export enum DietaryType {
  VEGAN = 'Vegan',
  KETO = 'Keto',
  PALEO = 'Paleo',
  GLUTEN_FREE = 'Gluten Free',
  BALANCED = 'Balanced',
  PESCATARIAN = 'Pescatarian'
}

export type MealCategory = 'Regular' | 'Bronze' | 'Premium';

export type Currency = 'GHS' | 'USD';
export type Language = 'en' | 'tw' | 'fr' | 'es' | 'zh';
export type Theme = 'light' | 'dark';
export type Frequency = 'One-time' | 'Weekly' | 'Monthly';
export type UserRole = 'user' | 'admin';
export type OrderStatus = 'Processing' | 'Preparing' | 'Delivered' | 'Cancelled';
export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface AddOn {
  name: string;
  price: number; // Stored in USD
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  price: number; // Stored in USD base
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  image: string;
  tags: DietaryType[];
  ingredients: string[];
  category: MealCategory;
  inStock: boolean;
  availableAddOns?: AddOn[];
}

export interface MealCustomization {
  portion: 'Standard' | 'Large';
  omittedIngredients: string[];
  notes: string;
  frequency: Frequency;
  selectedAddOns: AddOn[];
}

export interface CartItem extends Meal {
  cartId: string; // Unique identifier for the cart item (handling customizations)
  quantity: number;
  customization: MealCustomization;
  finalPrice: number;
}

export interface BookingService {
  id: string;
  name: string;
  durationMin: number;
  price: number; // Stored in USD base
  description: string;
}

export interface ActionTrail {
  status: string;
  timestamp: string;
  note?: string;
}

export interface Appointment {
  id: string;
  userId: string;
  userName: string;
  serviceName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  history: ActionTrail[];
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  password?: string; // Added for mock auth
  phone?: string;
  dietaryPreferences: DietaryType[];
  allergies: string[];
  orders: Order[];
  appointments: Appointment[];
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  date: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  shippingAddress: string;
  currency: Currency;
  isSubscription: boolean;
  history: ActionTrail[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Story {
  id: string;
  userId: string;
  authorName: string;
  content: string;
  rating: number; // 1-5
  approved: boolean;
  date: string;
  image?: string;
  role: 'user' | 'admin';
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'reminder' | 'info' | 'success';
  read: boolean;
  timestamp: Date;
}
