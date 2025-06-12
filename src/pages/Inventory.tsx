import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, Upload, Edit, Trash2, Filter, Settings, User, Phone, Mail, MapPin, Building, Package } from 'lucide-react';
import { InventoryItem, Supplier, Location } from '../types';
import { inventoryService } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Modal from '../components/Common/Modal';
import toast from 'react-hot-toast';

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [formData, setFormData] = useState({
    itemId: '',
    name: '',
    category: '',
    subCategory: '',
    quantity: 0,
    unitCost: 0,
    location: '',
    supplier: '',
    unitMeasurement: '',
    minStockLevel: 0,
    maxStockLevel: 0,
  });

  // Dynamic options state
  const [categoryOptions, setCategoryOptions] = useState([
    {
      name: 'Panels',
      subCategories: ['Cabinet Body', 'Door Panels', 'Drawer Fronts', 'Shelving', 'Back Panels']
    },
    {
      name: 'Hardware',
      subCategories: ['Door Hardware', 'Drawer Hardware', 'Cabinet Hardware', 'Mounting Hardware', 'Specialty Hardware']
    },
    {
      name: 'Finishes',
      subCategories: ['Stains', 'Paints', 'Lacquers', 'Primers', 'Sealers', 'Glazes']
    },
    {
      name: 'Accessories',
      subCategories: ['Lighting', 'Organization', 'Decorative', 'Functional', 'Safety']
    },
    {
      name: 'Tools & Equipment',
      subCategories: ['Hand Tools', 'Power Tools', 'Measuring Tools', 'Safety Equipment', 'Maintenance']
    },
    {
      name: 'Fasteners',
      subCategories: ['Screws', 'Nails', 'Bolts', 'Brackets', 'Adhesives']
    }
  ]);

  const [locations, setLocations] = useState<Location[]>([
    {
      id: '1',
      code: 'A-1-01',
      storeName: 'Main Warehouse',
      rack: 'A1',
      shelf: '01',
      description: 'Primary storage for panels',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      code: 'B-2-05',
      storeName: 'Hardware Storage',
      rack: 'B2',
      shelf: '05',
      description: 'Small hardware items',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      code: 'RECEIVING',
      storeName: 'Receiving Area',
      rack: 'RCV',
      shelf: 'TEMP',
      description: 'Temporary storage for incoming items',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '4',
      code: 'SHIPPING',
      storeName: 'Shipping Area',
      rack: 'SHP',
      shelf: 'OUT',
      description: 'Items ready for shipment',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: '1',
      name: 'Wood Supply Co.',
      contactPerson: 'John Smith',
      phone: '(555) 123-4567',
      email: 'john@woodsupply.com',
      address: '123 Industrial Blvd, Woodville, ST 12345',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Hardware Plus',
      contactPerson: 'Sarah Johnson',
      phone: '(555) 234-5678',
      email: 'sarah@hardwareplus.com',
      address: '456 Commerce St, Hardware City, ST 23456',
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Cabinet Components Inc.',
      contactPerson: 'Mike Wilson',
      phone: '(555) 345-6789',
      email: 'mike@cabinetcomponents.com',
      address: '789 Manufacturing Ave, Component Town, ST 34567',
      createdAt: new Date().toISOString()
    }
  ]);

  const unitMeasurementOptions = [
    'Each (ea)',
    'Pieces (pcs)',
    'Square Feet (sq ft)',
    'Linear Feet (lin ft)',
    'Board Feet (bd ft)',
    'Pounds (lbs)',
    'Kilograms (kg)',
    'Gallons (gal)',
    'Liters (L)',
    'Boxes (box)',
    'Packages (pkg)',
    'Sets (set)',
    'Pairs (pr)',
    'Sheets (sht)',
    'Rolls (roll)',
    'Tubes (tube)',
    'Bottles (btl)'
  ];

  // Management modal states
  const [manageTab, setManageTab] = useState<'categories' | 'locations' | 'suppliers'>('categories');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState('');
  
  // Location form state
  const [locationForm, setLocationForm] = useState({
    code: '',
    storeName: '',
    rack: '',
    shelf: '',
    description: ''
  });
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  
  // Supplier form state
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: ''
  });
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    fetchItems();
    loadStoredOptions();
  }, []);

  const loadStoredOptions = () => {
    const storedCategories = localStorage.getItem('categoryOptions');
    const storedLocations = localStorage.getItem('locations');
    const storedSuppliers = localStorage.getItem('suppliers');

    if (storedCategories) {
      setCategoryOptions(JSON.parse(storedCategories));
    }
    if (storedLocations) {
      setLocations(JSON.parse(storedLocations));
    }
    if (storedSuppliers) {
      setSuppliers(JSON.parse(storedSuppliers));
    }
  };

  const saveOptionsToStorage = () => {
    localStorage.setItem('categoryOptions', JSON.stringify(categoryOptions));
    localStorage.setItem('locations', JSON.stringify(locations));
    localStorage.setItem('suppliers', JSON.stringify(suppliers));
  };

  const fetchItems = async () => {
    try {
      const data = await inventoryService.getAll();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      // Mock data for development
      setItems([
        {
          id: '1',
          itemId: 'CAB-001',
          name: 'Plywood 18mm',
          category: 'Panels',
          subCategory: 'Cabinet Body',
          quantity: 50,
          unitCost: 45.50,
          totalCost: 2275,
          location: 'A-1-01',
          supplier: 'Wood Supply Co.',
          unitMeasurement: 'Sheets (sht)',
          minStockLevel: 10,
          maxStockLevel: 100,
          lastUpdated: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          itemId: 'HW-001',
          name: 'Concealed Hinges',
          category: 'Hardware',
          subCategory: 'Door Hardware',
          quantity: 200,
          unitCost: 2.75,
          totalCost: 550,
          location: 'B-2-05',
          supplier: 'Hardware Plus',
          unitMeasurement: 'Pieces (pcs)',
          minStockLevel: 50,
          maxStockLevel: 500,
          lastUpdated: '2024-01-14T14:20:00Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await inventoryService.update(editingItem.id, formData);
        toast.success('Item updated successfully!');
      } else {
        await inventoryService.create(formData);
        toast.success('Item added successfully!');
      }
      await fetchItems();
      resetForm();
    } catch (error) {
      toast.error('Failed to save item');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await inventoryService.delete(id);
        toast.success('Item deleted successfully!');
        await fetchItems();
      } catch (error) {
        toast.error('Failed to delete item');
      }
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      itemId: item.itemId,
      name: item.name,
      category: item.category,
      subCategory: item.subCategory,
      quantity: item.quantity,
      unitCost: item.unitCost,
      location: item.location,
      supplier: item.supplier,
      unitMeasurement: item.unitMeasurement || 'Each (ea)',
      minStockLevel: item.minStockLevel,
      maxStockLevel: item.maxStockLevel,
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      itemId: '',
      name: '',
      category: '',
      subCategory: '',
      quantity: 0,
      unitCost: 0,
      location: '',
      supplier: '',
      unitMeasurement: '',
      minStockLevel: 0,
      maxStockLevel: 0,
    });
    setEditingItem(null);
    setShowAddModal(false);
  };

  const resetLocationForm = () => {
    setLocationForm({
      code: '',
      storeName: '',
      rack: '',
      shelf: '',
      description: ''
    });
    setEditingLocation(null);
  };

  const resetSupplierForm = () => {
    setSupplierForm({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: ''
    });
    setEditingSupplier(null);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const result = await inventoryService.importFromExcel(file);
        toast.success(`Imported ${result.count} items successfully!`);
        await fetchItems();
      } catch (error) {
        toast.error('Failed to import file');
      }
    }
  };

  const handleExport = async () => {
    try {
      const blob = await inventoryService.exportToPDF();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inventory-report.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Inventory report exported!');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const handleCategoryChange = (category: string) => {
    setFormData({ ...formData, category, subCategory: '' });
  };

  const getSubCategories = () => {
    const selectedCat = categoryOptions.find(cat => cat.name === formData.category);
    return selectedCat ? selectedCat.subCategories : [];
  };

  // Management functions
  const addNewCategory = () => {
    if (newCategoryName.trim() && !categoryOptions.find(cat => cat.name === newCategoryName)) {
      const newCategory = { name: newCategoryName.trim(), subCategories: [] };
      const updatedCategories = [...categoryOptions, newCategory];
      setCategoryOptions(updatedCategories);
      setNewCategoryName('');
      toast.success('Category added successfully!');
      saveOptionsToStorage();
    } else {
      toast.error('Category name is empty or already exists');
    }
  };

  const addNewSubCategory = () => {
    if (newSubCategoryName.trim() && selectedCategoryForSub) {
      const updatedCategories = categoryOptions.map(cat => {
        if (cat.name === selectedCategoryForSub) {
          if (!cat.subCategories.includes(newSubCategoryName.trim())) {
            return { ...cat, subCategories: [...cat.subCategories, newSubCategoryName.trim()] };
          }
        }
        return cat;
      });
      setCategoryOptions(updatedCategories);
      setNewSubCategoryName('');
      toast.success('Sub-category added successfully!');
      saveOptionsToStorage();
    } else {
      toast.error('Please select a category and enter a sub-category name');
    }
  };

  const handleLocationSubmit = () => {
    if (!locationForm.code.trim() || !locationForm.storeName.trim() || !locationForm.rack.trim() || !locationForm.shelf.trim()) {
      toast.error('Code, Store Name, Rack, and Shelf are required');
      return;
    }

    if (editingLocation) {
      // Update existing location
      const updatedLocations = locations.map(location =>
        location.id === editingLocation.id
          ? { 
              ...location, 
              ...locationForm,
              code: locationForm.code.toUpperCase()
            }
          : location
      );
      setLocations(updatedLocations);
      toast.success('Location updated successfully!');
    } else {
      // Add new location
      if (locations.find(l => l.code.toLowerCase() === locationForm.code.toLowerCase())) {
        toast.error('Location code already exists');
        return;
      }

      const newLocation: Location = {
        id: Date.now().toString(),
        ...locationForm,
        code: locationForm.code.toUpperCase(),
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      const updatedLocations = [...locations, newLocation].sort((a, b) => a.code.localeCompare(b.code));
      setLocations(updatedLocations);
      toast.success('Location added successfully!');
    }

    resetLocationForm();
    saveOptionsToStorage();
  };

  const handleSupplierSubmit = () => {
    if (!supplierForm.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    if (editingSupplier) {
      // Update existing supplier
      const updatedSuppliers = suppliers.map(supplier =>
        supplier.id === editingSupplier.id
          ? { ...supplier, ...supplierForm }
          : supplier
      );
      setSuppliers(updatedSuppliers);
      toast.success('Supplier updated successfully!');
    } else {
      // Add new supplier
      if (suppliers.find(s => s.name.toLowerCase() === supplierForm.name.toLowerCase())) {
        toast.error('Supplier with this name already exists');
        return;
      }

      const newSupplier: Supplier = {
        id: Date.now().toString(),
        ...supplierForm,
        createdAt: new Date().toISOString()
      };
      
      const updatedSuppliers = [...suppliers, newSupplier].sort((a, b) => a.name.localeCompare(b.name));
      setSuppliers(updatedSuppliers);
      toast.success('Supplier added successfully!');
    }

    resetSupplierForm();
    saveOptionsToStorage();
  };

  const editLocation = (location: Location) => {
    setEditingLocation(location);
    setLocationForm({
      code: location.code,
      storeName: location.storeName,
      rack: location.rack,
      shelf: location.shelf,
      description: location.description || ''
    });
  };

  const editSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address
    });
  };

  const removeCategory = (categoryName: string) => {
    if (window.confirm(`Are you sure you want to remove the category "${categoryName}"?`)) {
      const updatedCategories = categoryOptions.filter(cat => cat.name !== categoryName);
      setCategoryOptions(updatedCategories);
      toast.success('Category removed successfully!');
      saveOptionsToStorage();
    }
  };

  const removeSubCategory = (categoryName: string, subCategoryName: string) => {
    if (window.confirm(`Are you sure you want to remove the sub-category "${subCategoryName}"?`)) {
      const updatedCategories = categoryOptions.map(cat => {
        if (cat.name === categoryName) {
          return { ...cat, subCategories: cat.subCategories.filter(sub => sub !== subCategoryName) };
        }
        return cat;
      });
      setCategoryOptions(updatedCategories);
      toast.success('Sub-category removed successfully!');
      saveOptionsToStorage();
    }
  };

  const removeLocation = (locationId: string) => {
    const location = locations.find(l => l.id === locationId);
    if (location && window.confirm(`Are you sure you want to remove the location "${location.code}"?`)) {
      const updatedLocations = locations.filter(l => l.id !== locationId);
      setLocations(updatedLocations);
      toast.success('Location removed successfully!');
      saveOptionsToStorage();
    }
  };

  const removeSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier && window.confirm(`Are you sure you want to remove the supplier "${supplier.name}"?`)) {
      const updatedSuppliers = suppliers.filter(s => s.id !== supplierId);
      setSuppliers(updatedSuppliers);
      toast.success('Supplier removed successfully!');
      saveOptionsToStorage();
    }
  };

  const getLocationDisplay = (locationCode: string) => {
    const location = locations.find(l => l.code === locationCode);
    return location ? `${location.code} (${location.storeName})` : locationCode;
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.itemId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(items.map(item => item.category))];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowManageModal(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage Options
          </button>
          <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
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
              {filteredItems.map((item) => {
                const stockStatus = item.quantity <= item.minStockLevel ? 'low' : 
                                  item.quantity >= item.maxStockLevel ? 'high' : 'normal';
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.itemId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.category}</div>
                      <div className="text-sm text-gray-500">{item.subCategory}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.quantity.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">{item.unitMeasurement || 'Each'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.unitCost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.totalCost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getLocationDisplay(item.location)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        stockStatus === 'low' ? 'bg-red-100 text-red-800' :
                        stockStatus === 'high' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {stockStatus === 'low' ? 'Low Stock' : 
                         stockStatus === 'high' ? 'Overstocked' : 'Normal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={resetForm}
        title={editingItem ? 'Edit Item' : 'Add New Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item ID *
              </label>
              <input
                type="text"
                required
                value={formData.itemId}
                onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., CAB-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Plywood 18mm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categoryOptions.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub Category *
              </label>
              <select
                required
                value={formData.subCategory}
                onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!formData.category}
              >
                <option value="">Select Sub Category</option>
                {getSubCategories().map((subCategory) => (
                  <option key={subCategory} value={subCategory}>
                    {subCategory}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Cost ($) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Measurement *
              </label>
              <select
                required
                value={formData.unitMeasurement}
                onChange={(e) => setFormData({ ...formData, unitMeasurement: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Unit</option>
                {unitMeasurementOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <select
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Location</option>
                {locations.filter(l => l.isActive).map((location) => (
                  <option key={location.id} value={location.code}>
                    {location.code} - {location.storeName} ({location.rack}-{location.shelf})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <select
                required
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.name}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Stock Level
              </label>
              <input
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Stock Level
              </label>
              <input
                type="number"
                min="0"
                value={formData.maxStockLevel}
                onChange={(e) => setFormData({ ...formData, maxStockLevel: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingItem ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage Options Modal */}
      <Modal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        title="Manage Options"
        size="xl"
      >
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setManageTab('categories')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                manageTab === 'categories'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setManageTab('locations')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                manageTab === 'locations'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Locations
            </button>
            <button
              onClick={() => setManageTab('suppliers')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                manageTab === 'suppliers'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Suppliers
            </button>
          </div>

          {/* Categories Tab */}
          {manageTab === 'categories' && (
            <div className="space-y-6">
              {/* Add New Category */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Add New Category</h3>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={addNewCategory}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Category
                  </button>
                </div>
              </div>

              {/* Add New Sub-Category */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Add New Sub-Category</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <select
                    value={selectedCategoryForSub}
                    onChange={(e) => setSelectedCategoryForSub(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {categoryOptions.map((category) => (
                      <option key={category.name} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newSubCategoryName}
                    onChange={(e) => setNewSubCategoryName(e.target.value)}
                    placeholder="Enter sub-category name"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={addNewSubCategory}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Sub-Category
                </button>
              </div>

              {/* Existing Categories */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Existing Categories</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {categoryOptions.map((category) => (
                    <div key={category.name} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                        <button
                          onClick={() => removeCategory(category.name)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-1">
                        {category.subCategories.map((subCategory) => (
                          <div key={subCategory} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded">
                            <span>{subCategory}</span>
                            <button
                              onClick={() => removeSubCategory(category.name, subCategory)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Locations Tab */}
          {manageTab === 'locations' && (
            <div className="space-y-6">
              {/* Add/Edit Location Form */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  {editingLocation ? 'Edit Location' : 'Add New Location'}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location Code *
                      </label>
                      <input
                        type="text"
                        value={locationForm.code}
                        onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value })}
                        placeholder="e.g., A-1-01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Store Name *
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={locationForm.storeName}
                          onChange={(e) => setLocationForm({ ...locationForm, storeName: e.target.value })}
                          placeholder="e.g., Main Warehouse"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rack *
                      </label>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={locationForm.rack}
                          onChange={(e) => setLocationForm({ ...locationForm, rack: e.target.value })}
                          placeholder="e.g., A1, B2, RCV"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shelf *
                      </label>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={locationForm.shelf}
                          onChange={(e) => setLocationForm({ ...locationForm, shelf: e.target.value })}
                          placeholder="e.g., 01, 05, TEMP"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={locationForm.description}
                      onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
                      placeholder="Optional description of what's stored here"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleLocationSubmit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingLocation ? 'Update Location' : 'Add Location'}
                    </button>
                    {editingLocation && (
                      <button
                        onClick={resetLocationForm}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Existing Locations */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Existing Locations</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {locations.map((location) => (
                    <div key={location.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h4 className="font-medium text-gray-900 mr-2">{location.code}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              location.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {location.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="space-y-1">
                              <div className="flex items-center">
                                <Building className="h-3 w-3 mr-2" />
                                {location.storeName}
                              </div>
                              <div className="flex items-center">
                                <Package className="h-3 w-3 mr-2" />
                                Rack: {location.rack}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center">
                                <Package className="h-3 w-3 mr-2" />
                                Shelf: {location.shelf}
                              </div>
                              {location.description && (
                                <div className="text-xs text-gray-500">
                                  {location.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => editLocation(location)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => removeLocation(location.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Suppliers Tab */}
          {manageTab === 'suppliers' && (
            <div className="space-y-6">
              {/* Add/Edit Supplier Form */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={supplierForm.name}
                        onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                        placeholder="Enter company name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={supplierForm.contactPerson}
                          onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                          placeholder="Contact person name"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="tel"
                          value={supplierForm.phone}
                          onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                          placeholder="(555) 123-4567"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="email"
                          value={supplierForm.email}
                          onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                          placeholder="contact@supplier.com"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <textarea
                        value={supplierForm.address}
                        onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                        placeholder="Full business address"
                        rows={2}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSupplierSubmit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                    </button>
                    {editingSupplier && (
                      <button
                        onClick={resetSupplierForm}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Existing Suppliers */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Existing Suppliers</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {suppliers.map((supplier) => (
                    <div key={supplier.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">{supplier.name}</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="space-y-1">
                              {supplier.contactPerson && (
                                <div className="flex items-center">
                                  <User className="h-3 w-3 mr-2" />
                                  {supplier.contactPerson}
                                </div>
                              )}
                              {supplier.phone && (
                                <div className="flex items-center">
                                  <Phone className="h-3 w-3 mr-2" />
                                  {supplier.phone}
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              {supplier.email && (
                                <div className="flex items-center">
                                  <Mail className="h-3 w-3 mr-2" />
                                  {supplier.email}
                                </div>
                              )}
                              {supplier.address && (
                                <div className="flex items-start">
                                  <MapPin className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                                  <span className="break-words">{supplier.address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => editSupplier(supplier)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => removeSupplier(supplier.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setShowManageModal(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Inventory;