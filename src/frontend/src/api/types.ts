// Canonical response shapes matching the backend TransformInterceptor + paginate()
// Backend always wraps: { success: true, data: T, timestamp: string }
// Paginated endpoints return: { items: T[], total, page, limit, totalPages }

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Auth / User ─────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'consultant' | 'factory_admin' | 'platform_admin';
  status: 'active' | 'trial' | 'blocked';
  phone?: string;
  city?: string;
  country?: string;
  avatarUrl?: string;
  createdAt: string;
  consultantProfile?: ConsultantProfile;
}

export interface AuthResult {
  accessToken: string;
  user: User;
}

// ── Categories ───────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  hue: number;
  blurb?: string;
  factoryCount: number;
}

// ── Consultant ────────────────────────────────────────────────────────────────
export interface ConsultantProfile {
  id: string;
  userId: string;
  type: 'specialized' | 'general';
  title?: string;
  bio?: string;
  rating: number;
  reviewsCount: number;
  dealsClosed: number;
  years: number;
  responseTime?: string;
  languages: string[];
  wechat?: string;
  online: boolean;
  trial: boolean;
  verified: boolean;
  trialDealsClosed: number;
  user: { id: string; name: string; email?: string; avatarUrl?: string; city?: string; country?: string };
  categories?: { category: Category }[];
  factories?: { factory: { id: string; name: string; verified: boolean; city?: string } }[];
}

// ── Factory ────────────────────────────────────────────────────────────────
export interface Factory {
  id: string;
  name: string;
  nameCn?: string;
  city?: string;
  province?: string;
  about?: string;
  staff?: string;
  area?: string;
  leadTime?: string;
  established?: number;
  verified: boolean;
  photoUrls: string[];
  createdAt: string;
  categories?: { category: Category }[];
  products?: Product[];
  certs?: Certificate[];
  consultants?: { consultant: ConsultantProfile }[];
  _count?: { orders: number };
}

export interface Product {
  id: string;
  factoryId: string;
  name: string;
  sku?: string;
  priceLo?: number;
  priceHi?: number;
  moq?: number;
  leadTime?: string;
  active: boolean;
}

export interface Certificate {
  id: string;
  factoryId: string;
  name: string;
  org?: string;
  status: string;
  validTill?: string;
  fileUrl?: string;
}

// ── Requests ──────────────────────────────────────────────────────────────────
// Exact statuses from backend Prisma schema
export type RequestStatus = 'draft' | 'work' | 'wait' | 'done' | 'declined';

export interface SourcingRequest {
  id: string;
  clientId: string;
  categoryId: string;
  consultantId?: string;
  product: string;
  qty?: string;
  unit?: string;
  requirements?: string;
  deadline?: string;
  budgetHint?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  client?: { id: string; name: string; avatarUrl?: string };
  consultant?: ConsultantProfile;
  _count?: { offers: number };
}

export interface CreateRequestDto {
  categoryId: string;
  product: string;
  qty?: string;
  unit?: string;
  requirements?: string;
  deadline?: string;
  budgetHint?: string;
  consultantId?: string;
}

// ── Offers ────────────────────────────────────────────────────────────────────
// Exact statuses from backend
export type OfferStatus = 'pending' | 'accepted' | 'revision' | 'expired';

export interface Offer {
  id: string;
  requestId: string;
  consultantId: string;
  product: string;
  qty?: string;
  unitPrice: number;
  total: number;
  leadTime?: string;
  incoterm?: string;
  note?: string;
  validTill?: string;
  status: OfferStatus;
  createdAt: string;
  request?: SourcingRequest;
  consultant?: ConsultantProfile;
  order?: Order;
}

export interface CreateOfferDto {
  requestId: string;
  factoryId?: string;
  product: string;
  qty?: string;
  unitPrice: number;
  total: number;
  leadTime?: string;
  incoterm?: string;
  note?: string;
  validTill?: string;
}

// ── Orders ────────────────────────────────────────────────────────────────────
// Exact statuses from backend Prisma schema
export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'production'
  | 'qc'
  | 'shipped'
  | 'transit'
  | 'delivered'
  | 'closed'
  | 'cancelled';

export const ORDER_FLOW: OrderStatus[] = [
  'draft', 'pending', 'confirmed', 'production', 'qc',
  'shipped', 'transit', 'delivered', 'closed',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Черновик',
  pending: 'Ожидает',
  confirmed: 'Подтверждён',
  production: 'Производство',
  qc: 'Контроль качества',
  shipped: 'Отгружен',
  transit: 'В пути',
  delivered: 'Доставлен',
  closed: 'Закрыт',
  cancelled: 'Отменён',
};

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  note?: string;
  actorId: string;
  createdAt: string;
  actor?: { id: string; name: string; role: string };
}

export interface Order {
  id: string;
  offerId: string;
  clientId: string;
  consultantId: string;
  factoryId?: string;
  product: string;
  qty?: string;
  unitPrice: number;
  total: number;
  incoterm?: string;
  status: OrderStatus;
  cargoCompany?: string;
  trackingNumber?: string;
  eta?: string;
  createdAt: string;
  updatedAt: string;
  offer?: Offer;
  consultant?: ConsultantProfile;
  factory?: Factory;
  statusHistory?: OrderStatusHistory[];
  threads?: { id: string; kind: string }[];
}

export interface UpdateOrderDto {
  status?: OrderStatus;
  note?: string;
  cargoCompany?: string;
  trackingNumber?: string;
  eta?: string;
  factoryId?: string;
}

// ── Messaging ─────────────────────────────────────────────────────────────────
export type ThreadKind = 'client' | 'factory' | 'support';

export interface Thread {
  id: string;
  kind: ThreadKind;
  clientId?: string;
  consultantId?: string;
  factoryId?: string;
  requestId?: string;
  orderId?: string;
  createdAt: string;
  messages?: Message[];
  _count?: { messages: number };
  // Display-ready counterpart computed by the backend per viewer role
  title?: string;
  subtitle?: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  attachmentUrl?: string;
  readAt?: string;
  createdAt: string;
  sender?: { id: string; name: string; avatarUrl?: string; role: string };
}

export interface SendMessageDto {
  threadId: string;
  body: string;
  attachmentUrl?: string;
}

// ── Reviews ───────────────────────────────────────────────────────────────────
export type ReviewStatus = 'pending' | 'approved' | 'removed';

export interface Review {
  id: string;
  authorId: string;
  consultantId: string;
  orderId?: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  autoFlag?: string;
  createdAt: string;
  author?: { id: string; name: string; avatarUrl?: string };
  consultant?: ConsultantProfile;
}

export interface CreateReviewDto {
  consultantId: string;
  orderId?: string;
  rating: number;
  text: string;
}

// ── Invites ───────────────────────────────────────────────────────────────────
export interface Invite {
  id: string;
  token: string;
  role: 'consultant' | 'factory';
  email: string;
  status: 'pending' | 'used' | 'expired';
  expiresAt: string;
  createdAt: string;
  createdBy?: { id: string; name: string };
  factory?: { id: string; name: string };
}

// ── Admin ──────────────────────────────────────────────────────────────────────
export interface ConsultantApplication {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  years: number;
  languages: string[];
  motivation?: string;
  autoCheck: 'pass' | 'flag' | 'fail';
  status: 'review' | 'trial' | 'approved' | 'rejected';
  createdAt: string;
  categories?: { category: Category }[];
}

export interface PlatformSettings {
  id: number;
  trialOrders: number;
  warnThreshold: number;
  blockThreshold: number;
  autoApprove: boolean;
  autoAssign: boolean;
  assignRule: 'load' | 'round_robin';
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  target?: string;
  ip?: string;
  createdAt: string;
  actor?: { id: string; name: string; email: string; role: string };
}
