import React, { useState } from 'react';
import { Settings as SettingsIcon, Users, User, Building, Activity, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserManagement from './UserManagement';
import RequesterManagement from './RequesterManagement';
import DepartmentManagement from './DepartmentManagement';
import CostCenterManagement from './CostCenterManagement';
import AuditTrail from './AuditTrail';

const Settings: React.FC = () => {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      component: UserManagement,
      permission: 'users.view'
    },
    {
      id: 'requesters',
      label: 'Requesters',
      icon: User,
      component: RequesterManagement,
      permission: 'requisitions.create'
    },
    {
      id: 'departments',
      label: 'Departments',
      icon: Building,
      component: DepartmentManagement,
      permission: 'requisitions.create'
    },
    {
      id: 'costcenters',
      label: 'Cost Centers',
      icon: DollarSign,
      component: CostCenterManagement,
      permission: 'users.view'
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: Activity,
      component: AuditTrail,
      permission: 'users.view'
    }
  ];

  const availableTabs = tabs.filter(tab => hasPermission(tab.permission));

  // Set first available tab as active if current active tab is not available
  React.useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(tab => tab.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  if (availableTabs.length === 0) {
    return (
      <div className="text-center py-12">
        <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access any settings.</p>
      </div>
    );
  }

  const ActiveComponent = availableTabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage system configuration and user access</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    </div>
  );
};

export default Settings;