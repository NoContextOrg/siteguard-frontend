/**
 * Debug utility to monitor all localStorage changes
 * Use only in development mode
 */
export const initStorageDebugger = () => {
  console.log('📊 Initializing Storage Debugger...');
  
  // Log initial state
  console.log('📦 Current localStorage state:', {
    accessToken: localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING',
    userEmail: localStorage.getItem('userEmail') || 'MISSING',
    userRoles: localStorage.getItem('userRoles') || 'MISSING',
    tokenExpiry: localStorage.getItem('tokenExpiry') || 'MISSING',
  });

  // Override localStorage.setItem to log all changes
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key: string, value: string) {
    console.log(`💾 localStorage.setItem('${key}', ...):`, {
      value: value.substring(0, 50) + (value.length > 50 ? '...' : ''),
      valueLength: value.length,
      timestamp: new Date().toLocaleTimeString()
    });
    originalSetItem.call(this, key, value);
  };

  // Override localStorage.removeItem to log all removals
  const originalRemoveItem = localStorage.removeItem;
  localStorage.removeItem = function(key: string) {
    const oldValue = localStorage.getItem(key);
    console.log(`🗑️ localStorage.removeItem('${key}'):`, {
      hadValue: !!oldValue,
      timestamp: new Date().toLocaleTimeString()
    });
    originalRemoveItem.call(this, key);
  };

  console.log('✅ Storage Debugger initialized');
};