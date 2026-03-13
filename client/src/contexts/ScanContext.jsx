import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/api';

const ScanContext = createContext(null);

export function ScanProvider({ children }) {
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(() => {
    try {
      const saved = localStorage.getItem('lastScanResult');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const runScan = async (callback) => {
    setScanning(true);
    
    try {
      const res = await api.scan();
      
      if (res && typeof res === 'object' && res.scan) {
        const scanData = res.scan;
        setLastScan(scanData);
        localStorage.setItem('lastScanResult', JSON.stringify(scanData));
      }
      
      if (callback && typeof callback === 'function') {
        await callback();
      }
    } catch (e) {
      console.error('Scan error:', e);
      alert(e.message);
    } finally {
      setScanning(false);
    }
  };

  const value = {
    scanning,
    lastScan,
    setLastScan,
    runScan,
  };

  return (
    <ScanContext.Provider value={value}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error('useScan must be used within a ScanProvider');
  }
  return context;
}
