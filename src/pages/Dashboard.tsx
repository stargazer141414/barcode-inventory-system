import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, InventoryItem } from '@/lib/supabase';
import { 
  Package, 
  Scan, 
  Settings, 
  LogOut, 
  Search, 
  Download,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      loadInventory();
      
      // Subscribe to real-time changes
      const subscription = supabase
        .channel('inventory_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'inventory_items',
          filter: `user_id=eq.${user.id}`
        }, () => {
          loadInventory();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, navigate]);

  useEffect(() => {
    const filtered = inventory.filter(item => 
      item.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.colour?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.size?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredInventory(filtered);
  }, [searchQuery, inventory]);

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handleUpdate = async (item: InventoryItem) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({
          product: item.product,
          colour: item.colour,
          size: item.size,
          quantity: item.quantity,
          low_stock_threshold: item.low_stock_threshold,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;
      setEditingItem(null);
      loadInventory();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item');
    }
  };

  const totalItems = inventory.length;
  const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = inventory.filter(item => item.quantity <= item.low_stock_threshold).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Package className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Barcode Inventory</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/scanner')}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Scan className="w-5 h-5" />
                <span>Quick Scan</span>
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-6 h-6" />
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalItems}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Quantity</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalQuantity}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Low Stock Alerts</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{lowStockItems}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Inventory Items</h2>
              <button
                onClick={() => navigate('/scanner')}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Item</span>
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by barcode, product, colour, or size..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colour</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      {searchQuery ? 'No items found matching your search' : 'No items in inventory. Start by scanning a barcode!'}
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {editingItem?.id === item.id ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.barcode}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={editingItem.product}
                              onChange={(e) => setEditingItem({ ...editingItem, product: e.target.value })}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={editingItem.colour || ''}
                              onChange={(e) => setEditingItem({ ...editingItem, colour: e.target.value })}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={editingItem.size || ''}
                              onChange={(e) => setEditingItem({ ...editingItem, size: e.target.value })}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={editingItem.quantity}
                              onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) || 0 })}
                              className="w-20 px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleUpdate(editingItem)}
                              className="text-green-600 hover:text-green-700 mr-2"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap"></td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.barcode}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.product}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.colour || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.size || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.quantity <= item.low_stock_threshold ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                <AlertTriangle className="w-3 h-3" />
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="text-blue-600 hover:text-blue-700 mr-3"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
