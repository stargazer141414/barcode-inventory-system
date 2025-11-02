import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Scan, ArrowLeft, Plus, Minus, CheckCircle2, AlertCircle, Package } from 'lucide-react';

export default function Scanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScannedItem, setLastScannedItem] = useState<any>(null);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Keep focus on input for scanner
    if (inputRef.current && !isProcessing) {
      inputRef.current.focus();
    }
  }, [isProcessing, lastScannedItem]);

  const handleBarcodeSubmit = async (barcode: string) => {
    if (!barcode.trim() || isProcessing) return;

    setIsProcessing(true);
    setScanMessage(null);

    try {
      // Call the sync-inventory edge function to increment quantity
      const { data, error } = await supabase.functions.invoke('sync-inventory', {
        body: {
          action: 'increment',
          barcode: barcode.trim(),
          productData: {
            product: `Product-${barcode.trim()}`,
            colour: '',
            size: ''
          }
        }
      });

      if (error) {
        throw error;
      }

      // Handle response structure (may be wrapped in data property)
      const item = data?.data || data;
      setLastScannedItem(item);
      setScanMessage({
        type: 'success',
        text: `Scanned: ${item.product} (Quantity: ${item.quantity})`
      });

      // Auto-clear message after 3 seconds
      setTimeout(() => setScanMessage(null), 3000);

    } catch (error: any) {
      console.error('Scan error:', error);
      setScanMessage({
        type: 'error',
        text: error.message || 'Failed to process barcode'
      });
    } finally {
      setIsProcessing(false);
      setBarcodeInput('');
    }
  };

  const handleInputChange = (value: string) => {
    setBarcodeInput(value);

    // Clear existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    // Auto-submit after 100ms of no input (scanner completes quickly)
    scanTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        handleBarcodeSubmit(value);
      }
    }, 100);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    handleBarcodeSubmit(barcodeInput);
  };

  const handleQuantityChange = async (action: 'increment' | 'decrement') => {
    if (!lastScannedItem || isProcessing) return;

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('sync-inventory', {
        body: {
          action,
          barcode: lastScannedItem.barcode
        }
      });

      if (error) throw error;

      const item = data?.data || data;
      setLastScannedItem(item);
      setScanMessage({
        type: 'success',
        text: `Updated quantity to ${item.quantity}`
      });

      setTimeout(() => setScanMessage(null), 2000);

    } catch (error: any) {
      console.error('Update error:', error);
      setScanMessage({
        type: 'error',
        text: error.message || 'Failed to update quantity'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4">
            <Scan className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quick Scan</h1>
          <p className="text-gray-600">Scan a barcode to add or update inventory</p>
        </div>

        {scanMessage && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            scanMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            scanMessage.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            {scanMessage.type === 'success' ? <CheckCircle2 className="w-6 h-6 flex-shrink-0" /> :
             scanMessage.type === 'error' ? <AlertCircle className="w-6 h-6 flex-shrink-0" /> :
             <Package className="w-6 h-6 flex-shrink-0" />}
            <span className="font-medium">{scanMessage.text}</span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <form onSubmit={handleManualSubmit}>
            <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
              Barcode Input
            </label>
            <div className="flex gap-3">
              <input
                ref={inputRef}
                id="barcode"
                type="text"
                value={barcodeInput}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={isProcessing}
                className="flex-1 px-6 py-4 text-2xl border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 font-mono"
                placeholder="Scan or type barcode..."
                autoComplete="off"
                autoFocus
              />
              <button
                type="submit"
                disabled={isProcessing || !barcodeInput.trim()}
                className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isProcessing ? 'Processing...' : 'Submit'}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Scanner ready. Position the barcode and scan, or type manually and press Enter.
            </p>
          </form>
        </div>

        {lastScannedItem && (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Last Scanned Item</h2>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Barcode</p>
                  <p className="text-lg font-mono font-medium text-gray-900">{lastScannedItem.barcode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Product</p>
                  <p className="text-lg font-medium text-gray-900">{lastScannedItem.product}</p>
                </div>
                {lastScannedItem.colour && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Colour</p>
                    <p className="text-lg font-medium text-gray-900">{lastScannedItem.colour}</p>
                  </div>
                )}
                {lastScannedItem.size && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Size</p>
                    <p className="text-lg font-medium text-gray-900">{lastScannedItem.size}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Current Quantity</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleQuantityChange('decrement')}
                    disabled={isProcessing || lastScannedItem.quantity <= 0}
                    className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-6 h-6" />
                  </button>
                  
                  <div className="flex-1 text-center">
                    <p className="text-4xl font-bold text-gray-900">{lastScannedItem.quantity}</p>
                    <p className="text-sm text-gray-500 mt-1">units in stock</p>
                  </div>
                  
                  <button
                    onClick={() => handleQuantityChange('increment')}
                    disabled={isProcessing}
                    className="p-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {lastScannedItem.quantity <= lastScannedItem.low_stock_threshold && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Low Stock Alert</p>
                    <p className="text-sm text-orange-700">This item is below the low stock threshold</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              View Full Inventory
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
