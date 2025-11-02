import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  RefreshCw, 
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Info,
  ExternalLink
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [range, setRange] = useState('Sheet1!A:F');
  const [apiKey, setApiKey] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      loadSyncHistory();
    }
  }, [user, navigate]);

  const loadSyncHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('google_sheets_sync')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setSyncHistory(data || []);
    } catch (error) {
      console.error('Error loading sync history:', error);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!spreadsheetId || !range || !apiKey) {
        throw new Error('Please fill in all required fields');
      }

      const { data, error } = await supabase.functions.invoke('import-from-sheets', {
        body: {
          spreadsheetId,
          range,
          apiKey
        }
      });

      if (error) throw error;

      const result = data?.data || data;
      setMessage({
        type: 'success',
        text: `Successfully imported ${result.imported} items${result.errors > 0 ? ` (${result.errors} errors)` : ''}`
      });

      loadSyncHistory();
    } catch (error: any) {
      console.error('Import error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to import from Google Sheets'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!spreadsheetId || !range || !accessToken) {
        throw new Error('Please fill in all required fields including access token');
      }

      const { data, error } = await supabase.functions.invoke('export-to-sheets', {
        body: {
          spreadsheetId,
          range,
          accessToken
        }
      });

      if (error) throw error;

      const result = data?.data || data;
      setMessage({
        type: 'success',
        text: `Successfully exported ${result.exportedRows} items to Google Sheets`
      });

      loadSyncHistory();
    } catch (error: any) {
      console.error('Export error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to export to Google Sheets'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Google Sheets Integration</h1>
          <p className="text-gray-600">Import and export your inventory data with Google Sheets</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Google Sheets API Setup Required</p>
            <ol className="list-decimal list-inside space-y-1 mb-3">
              <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Google Cloud Console</a></li>
              <li>Create a new project or select an existing one</li>
              <li>Enable the Google Sheets API</li>
              <li>Create credentials (API Key for import, OAuth 2.0 for export)</li>
              <li>For OAuth, generate an access token using the OAuth 2.0 Playground</li>
            </ol>
            <p>Your spreadsheet must have columns: Barcode, Product, Colour, Size, Quantity</p>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-6 h-6 flex-shrink-0" /> :
             message.type === 'error' ? <AlertCircle className="w-6 h-6 flex-shrink-0" /> :
             <Info className="w-6 h-6 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Import from Sheets</h2>
                <p className="text-sm text-gray-500">Load existing inventory data</p>
              </div>
            </div>

            <form onSubmit={handleImport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spreadsheet ID
                </label>
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Found in the spreadsheet URL</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Range
                </label>
                <input
                  type="text"
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sheet1!A:F"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="AIzaSyA..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Importing...' : 'Import Data'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Export to Sheets</h2>
                <p className="text-sm text-gray-500">Update your Google Sheet</p>
              </div>
            </div>

            <form onSubmit={handleExport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spreadsheet ID
                </label>
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Range
                </label>
                <input
                  type="text"
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sheet1!A:F"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Token
                </label>
                <input
                  type="text"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ya29.a0..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get from <a href="https://developers.google.com/oauthplayground/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OAuth 2.0 Playground</a>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Exporting...' : 'Export Data'}
              </button>
            </form>
          </div>
        </div>

        {syncHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Sync History</h2>
            <div className="space-y-3">
              {syncHistory.map((sync) => (
                <div key={sync.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sync.sheet_name || 'Google Sheets'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(sync.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    sync.sync_status === 'success' ? 'bg-green-100 text-green-800' :
                    sync.sync_status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sync.sync_status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
