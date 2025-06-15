import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  ShoppingCart, 
  Calculator,
  LogOut,
  Settings,
  ClipboardList,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', permission: 'dashboard.view' },
    { icon: Package, label: 'Inventory', path: '/inventory', permission: 'inventory.view' },
    { icon: FileText, label: 'Requisitions', path: '/requisitions', permission: 'requisitions.view' },
    { icon: ClipboardList, label: 'Orders', path: '/orders', permission: 'orders.view' },
    { icon: BarChart3, label: 'Reports', path: '/reports', permission: 'inventory.view' },
    { icon: ShoppingCart, label: 'Purchase Orders', path: '/purchase-orders', permission: 'purchase_orders.view' },
    { icon: Calculator, label: 'Cabinet Calculator', path: '/cabinet-calculator', permission: 'cabinet_calc.view' },
    { icon: Settings, label: 'Settings', path: '/settings', permission: 'users.view,requisitions.create' },
  ];

  const hasAnyPermission = (permissions: string) => {
    const permissionList = permissions.split(',');
    return permissionList.some(permission => hasPermission(permission.trim()));
  };

  return (
    <div className="bg-slate-800 text-white w-64 min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold">Cabinet WMS</h1>
        <p className="text-slate-300 text-sm mt-1">Warehouse Management</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            // Handle multiple permissions separated by comma
            const hasRequiredPermission = item.permission.includes(',') 
              ? hasAnyPermission(item.permission)
              : hasPermission(item.permission);

            if (!hasRequiredPermission) return null;
            
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-semibold">{user?.username?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-sm font-medium">{user?.username}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;