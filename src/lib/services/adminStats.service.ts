import connectDB from '@/lib/db/mongodb';
import Order from '@/lib/models/order.model';
import Session from '@/lib/models/session.model';
import '@/lib/models/therapist.model';
import User from '@/lib/models/user.model';
import { PAYMENT_STATUS } from '@/lib/constants/enums';
import DriftOffOrder from '@/lib/models/driftOffOrder.model';
import { ROLES } from '@/lib/constants/roles';

const RECENT_ORDERS_LIMIT = 5;
const UPCOMING_DAYS = 7;

export interface RecentOrderRow {
  _id: string;
  userId: string;
  totalAmount: number;
  orderStatus?: string;
  paymentStatus?: string;
  createdAt: string | Date;
}

export interface OrderStats {
  total: number;
  byStatus: Record<string, number>;
  recentOrders: RecentOrderRow[];
}

export interface UpcomingSessionRow {
  _id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: string;
  therapistId?: { name?: string } | string;
}

export interface SessionStats {
  total: number;
  byStatus: Record<string, number>;
  upcomingCount: number;
  upcomingSessions: UpcomingSessionRow[];
}

export interface UserStats {
  total: number;
  customers: number;
}

export interface RevenueStats {
  total: number;
  thisMonth: number;
  lastMonth: number;
  growthPercent: number;
}

export interface DashboardStats {
  orders: OrderStats;
  sessions: SessionStats;
  users: UserStats;
  revenue: RevenueStats;
}

export async function getOrderStats(): Promise<OrderStats> {
  await connectDB();
  const [total, byStatusAgg, recentOrders] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    Order.find()
      .select('_id userId totalAmount orderStatus paymentStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(RECENT_ORDERS_LIMIT)
      .lean(),
  ]);
  const byStatus: Record<string, number> = {};
  byStatusAgg.forEach((row: { _id: string; count: number }) => {
    byStatus[row._id] = row.count;
  });
  const recentOrdersRows: RecentOrderRow[] = recentOrders.map((o) => ({
    _id: String(o._id),
    userId: String(o.userId),
    totalAmount: o.totalAmount,
    orderStatus: o.orderStatus,
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt,
  }));
  return { total, byStatus, recentOrders: recentOrdersRows };
}

export async function getSessionStats(): Promise<SessionStats> {
  await connectDB();
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + UPCOMING_DAYS);
  const futureDateStr = futureDate.toISOString().split('T')[0];
  const [total, byStatusAgg, upcomingSessions] = await Promise.all([
    Session.countDocuments(),
    Session.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Session.find({
      status: { $in: ['pending', 'confirmed'] },
      date: { $gte: today, $lte: futureDateStr },
    })
      .populate('therapistId')
      .sort({ date: 1, startTime: 1 })
      .limit(10)
      .lean(),
  ]);
  const byStatus: Record<string, number> = {};
  byStatusAgg.forEach((row: { _id: string; count: number }) => {
    byStatus[row._id] = row.count;
  });
  const upcomingCount = await Session.countDocuments({
    status: { $in: ['pending', 'confirmed'] },
    date: { $gte: today, $lte: futureDateStr },
  });
  const upcomingSessionsRows: UpcomingSessionRow[] = upcomingSessions.map((s) => ({
    _id: String(s._id),
    userId: String(s.userId),
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    status: s.status,
    therapistId: s.therapistId as UpcomingSessionRow['therapistId'],
  }));
  return {
    total,
    byStatus,
    upcomingCount,
    upcomingSessions: upcomingSessionsRows,
  };
}

export async function getUserStats(): Promise<UserStats> {
  await connectDB();
  const [total, customers] = await Promise.all([User.countDocuments(), User.countDocuments({ role: ROLES.CUSTOMER })]);
  return { total, customers };
}

export async function getRevenueStats(): Promise<RevenueStats> {
  await connectDB();
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const [totalAgg, thisMonthAgg, lastMonthAgg, drTotalAgg, drThisMonthAgg, drLastMonthAgg] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: PAYMENT_STATUS.PAID } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: PAYMENT_STATUS.PAID, createdAt: { $gte: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      {
        $match: {
          paymentStatus: PAYMENT_STATUS.PAID,
          createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    DriftOffOrder.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    DriftOffOrder.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    DriftOffOrder.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);
  const total = (totalAgg[0]?.total ?? 0) + (drTotalAgg[0]?.total ?? 0);
  const thisMonth = (thisMonthAgg[0]?.total ?? 0) + (drThisMonthAgg[0]?.total ?? 0);
  const lastMonth = (lastMonthAgg[0]?.total ?? 0) + (drLastMonthAgg[0]?.total ?? 0);
  const growthPercent =
    lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : thisMonth > 0 ? 100 : 0;
  return { total, thisMonth, lastMonth, growthPercent };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [ordersResult, sessionsResult, usersResult, revenueResult] = await Promise.allSettled([
    getOrderStats(),
    getSessionStats(),
    getUserStats(),
    getRevenueStats(),
  ]);

  const orders =
    ordersResult.status === 'fulfilled' ? ordersResult.value : { total: 0, byStatus: {}, recentOrders: [] };
  const sessions =
    sessionsResult.status === 'fulfilled'
      ? sessionsResult.value
      : { total: 0, byStatus: {}, upcomingCount: 0, upcomingSessions: [] };
  const users = usersResult.status === 'fulfilled' ? usersResult.value : { total: 0, customers: 0 };
  const revenue =
    revenueResult.status === 'fulfilled'
      ? revenueResult.value
      : { total: 0, thisMonth: 0, lastMonth: 0, growthPercent: 0 };

  return { orders, sessions, users, revenue };
}
