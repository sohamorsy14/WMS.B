import React, { useEffect, useState } from 'react';
import { Package, AlertTriangle, FileText, ShoppingCart, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import StatsCard from '../components/Dashboard/StatsCard';
import { dashboardService } from '../services/api';
import { DashboardStats } from '../types';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const monthlyData = [
    { month: 'Jan', expenditure: 45000, inventory: 320000 },
    { month: 'Feb', expenditure: 52000, inventory: 315000 },
    { month: 'Mar', expenditure: 48000, inventory: 325000 },
    { month: 'Apr', expenditure: 61000, inventory: 340000 },
    { month: 'May', expenditure: 55000, inventory: 335000 },
    { month: 'Jun', expenditure: 67000, inventory: 350000 },
  ];

  const inventoryTrends = [
    { week: 'Week 1', items: 1250 },
    { week: 'Week 2', items: 1180 },
    { week: 'Week 3', items: 1320 },
    { week: 'Week 4', items: 1290 },
  ];

  const recentActivity = [
    { id: 1, action: 'Product Added', item: 'Kitchen Cabinet Set A', timestamp: new Date().toISOString() },
    { id: 2, action: 'Stock Updated', item: 'Bathroom Vanity B', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, action: 'Order Completed', item: 'Living Room Cabinet C', timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 4, action: 'Requisition Approved', item: 'Hardware Supplies', timestamp: new Date(Date.now() - 10800000).toISOString() },
    { id: 5, action: 'Purchase Order Created', item: 'Plywood 18mm', timestamp: new Date(Date.now() - 14400000).toISOString() },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        // Mock data for development
        setStats({
          totalItems: 1247,
          lowStockItems: 23,
          pendingRequisitions: 8,
          openPurchaseOrders: 12,
          monthlyExpenditure: 67000,
          inventoryValue: 350000,
          recentActivity: recentActivity
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!stats) {
    return <div className="text-center text-gray-500">Failed to load dashboard data</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatsCard
          title="Total Items"
          value={stats.totalItems.toLocaleString()}
          icon={Package}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={AlertTriangle}
          color="red"
          trend={{ value: 8, isPositive: false }}
        />
        <StatsCard
          title="Pending Requisitions"
          value={stats.pendingRequisitions}
          icon={FileText}
          color="yellow"
        />
        <StatsCard
          title="Open Purchase Orders"
          value={stats.openPurchaseOrders}
          icon={ShoppingCart}
          color="purple"
        />
        <StatsCard
          title="Monthly Expenditure"
          value={`$${(stats.monthlyExpenditure / 1000).toFixed(0)}K`}
          icon={DollarSign}
          color="green"
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Inventory Value"
          value={`$${(stats.inventoryValue / 1000).toFixed(0)}K`}
          icon={TrendingUp}
          color="blue"
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Expenditure & Inventory Value</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
              <Bar dataKey="expenditure" fill="#3B82F6" name="Expenditure" />
              <Bar dataKey="inventory" fill="#10B981" name="Inventory Value" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={inventoryTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip formatter={(value) => [value, 'Items']} />
              <Line type="monotone" dataKey="items" stroke="#8B5CF6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <button 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
            onClick={() => handleNavigate('/settings/audit')}
          >
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-sm text-gray-600">{activity.item}</p>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => handleNavigate('/requisitions')}
          >
            New Requisition
          </button>
          <button 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            onClick={() => handleNavigate('/inventory')}
          >
            Add Inventory Item
          </button>
          <button 
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            onClick={() => handleNavigate('/purchase-orders')}
          >
            Create Purchase Order
          </button>
          <button 
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            onClick={() => handleNavigate('/cabinet-calculator')}
          >
            Cabinet Calculator
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;