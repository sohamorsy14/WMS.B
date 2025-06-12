import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Shield, Key, Search, Filter, UserCheck, UserX, ChevronDown, Settings } from 'lucide-react';
import { User } from '../types';
import { authService } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Common/Modal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

interface UserFormData {
  username: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
}

interface CustomRole {
  id: string;
  name: string;
  displayName: string;
  permissions: string[];
  isCustom: boolean;
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    role: 'storekeeper',
    permissions: []
  });
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    displayName: '',
    permissions: [] as string[]
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const defaultRoles = {
    admin: { name: 'admin', displayName: 'Administrator', permissions: ['*'], isCustom: false },
    manager: { name: 'manager', displayName: 'Manager', permissions: ['dashboard.view', 'inventory.*', 'requisitions.*', 'purchase_orders.*', 'users.view'], isCustom: false },
    storekeeper: { name: 'storekeeper', displayName: 'Storekeeper', permissions: ['dashboard.view', 'inventory.view', 'inventory.update', 'requisitions.view', 'requisitions.create'], isCustom: false },
    purchaser: { name: 'purchaser', displayName: 'Purchaser', permissions: ['dashboard.view', 'inventory.view', 'purchase_orders.*', 'requisitions.view'], isCustom: false }
  };

  const getAllRoles = () => {
    const defaultRolesList = Object.values(defaultRoles);
    return [...defaultRolesList, ...customRoles];
  };

  const getRolePermissions = (roleName: string) => {
    if (defaultRoles[roleName as keyof typeof defaultRoles]) {
      return defaultRoles[roleName as keyof typeof defaultRoles].permissions;
    }
    const customRole = customRoles.find(r => r.name === roleName);
    return customRole ? customRole.permissions : [];
  };

  const availablePermissions = [
    { 
      category: 'Dashboard',
      permissions: [
        { key: 'dashboard.view', label: 'View Dashboard' }
      ]
    },
    {
      category: 'Inventory Management',
      permissions: [
        { key: 'inventory.view', label: 'View Inventory' },
        { key: 'inventory.create', label: 'Create Inventory Items' },
        { key: 'inventory.update', label: 'Update Inventory Items' },
        { key: 'inventory.delete', label: 'Delete Inventory Items' },
        { key: 'inventory.import', label: 'Import Inventory' },
        { key: 'inventory.export', label: 'Export Inventory' }
      ]
    },
    {
      category: 'Requisitions',
      permissions: [
        { key: 'requisitions.view', label: 'View Requisitions' },
        { key: 'requisitions.create', label: 'Create Requisitions' },
        { key: 'requisitions.approve', label: 'Approve Requisitions' },
        { key: 'requisitions.delete', label: 'Delete Requisitions' }
      ]
    },
    {
      category: 'Purchase Orders',
      permissions: [
        { key: 'purchase_orders.view', label: 'View Purchase Orders' },
        { key: 'purchase_orders.create', label: 'Create Purchase Orders' },
        { key: 'purchase_orders.approve', label: 'Approve Purchase Orders' },
        { key: 'purchase_orders.delete', label: 'Delete Purchase Orders' }
      ]
    },
    {
      category: 'User Management',
      permissions: [
        { key: 'users.view', label: 'View Users' },
        { key: 'users.create', label: 'Create Users' },
        { key: 'users.update', label: 'Update Users' },
        { key: 'users.delete', label: 'Delete Users' }
      ]
    },
    {
      category: 'Tools',
      permissions: [
        { key: 'cabinet_calc.view', label: 'Use Cabinet Calculator' }
      ]
    }
  ];

  useEffect(() => {
    fetchUsers();
    loadCustomRoles();
  }, []);

  // Update permissions when role changes
  useEffect(() => {
    if (formData.role === 'admin') {
      setFormData(prev => ({ ...prev, permissions: ['*'] }));
    } else {
      const rolePermissions = getRolePermissions(formData.role);
      setFormData(prev => ({ ...prev, permissions: rolePermissions }));
    }
  }, [formData.role, customRoles]);

  const loadCustomRoles = () => {
    // In a real app, this would fetch from the backend
    const savedRoles = localStorage.getItem('customRoles');
    if (savedRoles) {
      setCustomRoles(JSON.parse(savedRoles));
    }
  };

  const saveCustomRoles = (roles: CustomRole[]) => {
    // In a real app, this would save to the backend
    localStorage.setItem('customRoles', JSON.stringify(roles));
    setCustomRoles(roles);
  };

  const fetchUsers = async () => {
    try {
      const data = await authService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handlePermissionChange = (permissionKey: string, checked: boolean, isRoleForm = false) => {
    const targetData = isRoleForm ? roleFormData : formData;
    const setTargetData = isRoleForm ? setRoleFormData : setFormData;

    if (!isRoleForm && formData.role === 'admin') return; // Admin always has all permissions

    setTargetData(prev => {
      const newPermissions = checked
        ? [...prev.permissions, permissionKey]
        : prev.permissions.filter(p => p !== permissionKey);
      
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleCategoryPermissionChange = (categoryPermissions: string[], checked: boolean, isRoleForm = false) => {
    const targetData = isRoleForm ? roleFormData : formData;
    const setTargetData = isRoleForm ? setRoleFormData : setFormData;

    if (!isRoleForm && formData.role === 'admin') return;

    setTargetData(prev => {
      let newPermissions = [...prev.permissions];
      
      if (checked) {
        // Add all permissions from this category
        categoryPermissions.forEach(perm => {
          if (!newPermissions.includes(perm)) {
            newPermissions.push(perm);
          }
        });
      } else {
        // Remove all permissions from this category
        newPermissions = newPermissions.filter(p => !categoryPermissions.includes(p));
      }
      
      return { ...prev, permissions: newPermissions };
    });
  };

  const isCategoryFullySelected = (categoryPermissions: string[], isRoleForm = false) => {
    const targetPermissions = isRoleForm ? roleFormData.permissions : formData.permissions;
    if (!isRoleForm && formData.role === 'admin') return true;
    return categoryPermissions.every(perm => targetPermissions.includes(perm));
  };

  const isCategoryPartiallySelected = (categoryPermissions: string[], isRoleForm = false) => {
    const targetPermissions = isRoleForm ? roleFormData.permissions : formData.permissions;
    if (!isRoleForm && formData.role === 'admin') return false;
    return categoryPermissions.some(perm => targetPermissions.includes(perm)) && 
           !categoryPermissions.every(perm => targetPermissions.includes(perm));
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roleFormData.name || !roleFormData.displayName) {
      toast.error('Role name and display name are required');
      return;
    }

    // Check if role name already exists
    const allRoles = getAllRoles();
    if (allRoles.some(role => role.name === roleFormData.name)) {
      toast.error('Role name already exists');
      return;
    }

    const newRole: CustomRole = {
      id: Date.now().toString(),
      name: roleFormData.name,
      displayName: roleFormData.displayName,
      permissions: roleFormData.permissions,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    const updatedRoles = [...customRoles, newRole];
    saveCustomRoles(updatedRoles);
    
    setIsRoleModalOpen(false);
    setRoleFormData({ name: '', displayName: '', permissions: [] });
    toast.success('Custom role created successfully');
  };

  const handleDeleteCustomRole = (roleId: string) => {
    if (!confirm('Are you sure you want to delete this custom role? Users with this role will need to be reassigned.')) return;

    const updatedRoles = customRoles.filter(role => role.id !== roleId);
    saveCustomRoles(updatedRoles);
    toast.success('Custom role deleted successfully');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUser = await authService.createUser(formData);
      setUsers([...users, newUser]);
      setIsCreateModalOpen(false);
      resetForm();
      toast.success('User created successfully');
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error('Failed to create user');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const userData = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        permissions: formData.permissions
      };
      const updatedUser = await authService.updateUser(selectedUser.id, userData);
      setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetForm();
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await authService.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      console.log('Attempting to change password for user:', selectedUser.username);
      console.log('Current user role:', currentUser?.role);
      console.log('Is admin changing other user:', currentUser?.role === 'admin' && currentUser?.id !== selectedUser.id);
      
      await authService.changePassword(
        selectedUser.id, 
        passwordData.currentPassword, 
        passwordData.newPassword
      );
      
      toast.success(`Password changed successfully for ${selectedUser.username}`);
      setIsPasswordModalOpen(false);
      setSelectedUser(null);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Failed to change password:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to change password');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'storekeeper',
      permissions: getRolePermissions('storekeeper')
    });
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      permissions: user.permissions
    });
    setIsEditModalOpen(true);
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsPasswordModalOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'storekeeper': return 'bg-green-100 text-green-800';
      case 'purchaser': return 'bg-purple-100 text-purple-800';
      default: return 'bg-orange-100 text-orange-800'; // Custom roles
    }
  };

  const getRoleDisplayName = (roleName: string) => {
    const allRoles = getAllRoles();
    const role = allRoles.find(r => r.name === roleName);
    return role ? role.displayName : roleName;
  };

  const PermissionSection = ({ isRoleForm = false }: { isRoleForm?: boolean }) => {
    const targetData = isRoleForm ? roleFormData : formData;
    const isAdmin = !isRoleForm && formData.role === 'admin';

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">Permissions</h4>
          {isAdmin && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Admin has all permissions
            </span>
          )}
        </div>
        
        {!isAdmin && (
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            {availablePermissions.map((category) => {
              const categoryPermissionKeys = category.permissions.map(p => p.key);
              const isFullySelected = isCategoryFullySelected(categoryPermissionKeys, isRoleForm);
              const isPartiallySelected = isCategoryPartiallySelected(categoryPermissionKeys, isRoleForm);
              
              return (
                <div key={category.category} className="border-b border-gray-100 last:border-b-0">
                  <div className="p-3 bg-gray-50">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFullySelected}
                        ref={input => {
                          if (input) input.indeterminate = isPartiallySelected;
                        }}
                        onChange={(e) => handleCategoryPermissionChange(categoryPermissionKeys, e.target.checked, isRoleForm)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-900">{category.category}</span>
                    </label>
                  </div>
                  <div className="p-3 space-y-2">
                    {category.permissions.map((permission) => (
                      <label key={permission.key} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={targetData.permissions.includes(permission.key)}
                          onChange={(e) => handlePermissionChange(permission.key, e.target.checked, isRoleForm)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{permission.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {isAdmin && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800 font-medium">Administrator Access</span>
            </div>
            <p className="text-xs text-red-700 mt-1">
              Administrators have unrestricted access to all system features and cannot have limited permissions.
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!hasPermission('users.view')) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view user management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users, roles, and permissions</p>
        </div>
        <div className="flex space-x-3">
          {hasPermission('users.create') && (
            <>
              <button
                onClick={() => setIsRoleModalOpen(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Create Role</span>
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Custom Roles Section */}
      {customRoles.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Roles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customRoles.map((role) => (
              <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{role.displayName}</h3>
                  <button
                    onClick={() => handleDeleteCustomRole(role.id)}
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                    title="Delete Role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-2">Role: {role.name}</p>
                <p className="text-xs text-gray-500">
                  {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              {getAllRoles().map((role) => (
                <option key={role.name} value={role.name}>
                  {role.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                        <span className="text-sm font-semibold text-white">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500">
                      {user.permissions.includes('*') ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-800">
                          <Shield className="w-3 h-3 mr-1" />
                          All Permissions
                        </span>
                      ) : (
                        <span>{user.permissions.length} permission{user.permissions.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      <UserCheck className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {hasPermission('users.update') && (
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {(hasPermission('users.update') || currentUser?.id === user.id) && (
                        <button
                          onClick={() => openPasswordModal(user)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Change Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('users.delete') && currentUser?.id !== user.id && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Create Role Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setRoleFormData({ name: '', displayName: '', permissions: [] });
        }}
        title="Create Custom Role"
        size="xl"
      >
        <form onSubmit={handleCreateRole} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Name (Internal)
              </label>
              <input
                type="text"
                required
                value={roleFormData.name}
                onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="e.g., supervisor"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Used internally, will be converted to lowercase with underscores</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                required
                value={roleFormData.displayName}
                onChange={(e) => setRoleFormData({ ...roleFormData, displayName: e.target.value })}
                placeholder="e.g., Supervisor"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Shown to users in the interface</p>
            </div>
          </div>
          
          <PermissionSection isRoleForm={true} />
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsRoleModalOpen(false);
                setRoleFormData({ name: '', displayName: '', permissions: [] });
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Create Role
            </button>
          </div>
        </form>
      </Modal>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create New User"
        size="xl"
      >
        <form onSubmit={handleCreateUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {getAllRoles()
                  .filter(role => role.name !== 'admin' || currentUser?.role === 'admin')
                  .map((role) => (
                    <option key={role.name} value={role.name}>
                      {role.displayName}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          
          <PermissionSection />
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create User
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
          resetForm();
        }}
        title="Edit User"
        size="xl"
      >
        <form onSubmit={handleEditUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {getAllRoles()
                .filter(role => role.name !== 'admin' || currentUser?.role === 'admin')
                .map((role) => (
                  <option key={role.name} value={role.name}>
                    {role.displayName}
                  </option>
                ))}
            </select>
          </div>
          
          <PermissionSection />
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedUser(null);
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update User
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setSelectedUser(null);
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }}
        title={`Change Password - ${selectedUser?.username}`}
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Show current password field only if user is changing their own password OR if non-admin is changing password */}
          {currentUser?.role !== 'admin' || currentUser?.id === selectedUser?.id ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter current password"
              />
            </div>
          ) : (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <Shield className="w-4 h-4 inline mr-1" />
                As an administrator, you can change this user's password without providing their current password.
              </p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter new password (min 6 characters)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm new password"
            />
          </div>
          
          {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">Passwords do not match</p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setSelectedUser(null);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={passwordData.newPassword !== passwordData.confirmPassword || passwordData.newPassword.length < 6}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Change Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;