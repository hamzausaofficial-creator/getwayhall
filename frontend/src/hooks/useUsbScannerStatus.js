import { useCallback, useEffect, useRef, useState } from 'react';

const SCANNER_NAME_RE = /barcode|scanner|scan|2d|qr|symbol|honeywell|zebra|datalogic|newland|id\s*card|cnic|pos|reader/i;
const BARCODE_USAGE_PAGE = 0x8c;

function isLikelyScannerDevice(device) {
  if (!device) return false;
  const name = (device.productName || '').toLowerCase();
  if (SCANNER_NAME_RE.test(name)) return true;
  return (device.collections || []).some((c) => c.usagePage === BARCODE_USAGE_PAGE);
}

function deviceLabel(device) {
  return device?.productName || 'USB Scanner';
}

function normalizeDevices(list) {
  const granted = Array.isArray(list) ? list : [];
  const scanners = granted.filter(isLikelyScannerDevice);
  // Paired HID devices that don't match heuristics still count (user linked them).
  return scanners.length > 0 ? scanners : granted;
}

export function useUsbScannerStatus() {
  const [hidSupported] = useState(() => typeof navigator !== 'undefined' && 'hid' in navigator);
  const [devices, setDevices] = useState([]);
  const [pairing, setPairing] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const manualIdsRef = useRef(new Set());

  const syncDevices = useCallback((list) => {
    const normalized = normalizeDevices(list);
    setDevices(normalized);
    if (normalized.length > 0) setSessionActive(false);
  }, []);

  const refreshDevices = useCallback(async () => {
    if (!hidSupported) return 0;
    try {
      const list = await navigator.hid.getDevices();
      const normalized = normalizeDevices(list);
      syncDevices(list);
      return normalized.length;
    } catch {
      return 0;
    }
  }, [hidSupported, syncDevices]);

  const markActiveFromScan = useCallback(() => {
    setSessionActive(true);
  }, []);

  const pairScanner = useCallback(async () => {
    if (!hidSupported) return false;
    setPairing(true);
    try {
      const picked = await navigator.hid.requestDevice({
        filters: [
          { usagePage: BARCODE_USAGE_PAGE },
          { usagePage: 0x01, usage: 0x06 },
          { usagePage: 0xff00 },
        ],
      });
      if (!picked) return false;

      manualIdsRef.current.add(`${picked.vendorId}:${picked.productId}`);
      setDevices((prev) => {
        if (prev.some((d) => d === picked)) return prev;
        return [...prev, picked];
      });
      setSessionActive(false);
      await refreshDevices();
      return true;
    } catch (err) {
      if (err?.name !== 'NotFoundError') {
        console.warn('Scanner pairing failed:', err);
      }
      return false;
    } finally {
      setPairing(false);
    }
  }, [hidSupported, refreshDevices]);

  useEffect(() => {
    if (!hidSupported) return undefined;

    refreshDevices();

    const onConnect = (e) => {
      const device = e.device;
      const key = `${device.vendorId}:${device.productId}`;
      if (!isLikelyScannerDevice(device) && !manualIdsRef.current.has(key)) return;
      setDevices((prev) => {
        if (prev.some((d) => d === device)) return prev;
        return [...prev, device];
      });
      setSessionActive(false);
    };

    const onDisconnect = (e) => {
      const device = e.device;
      setDevices((prev) => {
        const next = prev.filter((d) => d !== device);
        if (next.length === 0) setSessionActive(false);
        return next;
      });
    };

    navigator.hid.addEventListener('connect', onConnect);
    navigator.hid.addEventListener('disconnect', onDisconnect);
    return () => {
      navigator.hid.removeEventListener('connect', onConnect);
      navigator.hid.removeEventListener('disconnect', onDisconnect);
    };
  }, [hidSupported, refreshDevices]);

  const isConnected = devices.length > 0;
  const isReady = isConnected || sessionActive;

  return {
    hidSupported,
    isConnected,
    isReady,
    sessionActive,
    deviceName: isConnected ? deviceLabel(devices[0]) : sessionActive ? 'Scanner (keyboard mode)' : null,
    deviceCount: devices.length,
    pairing,
    pairScanner,
    refreshDevices,
    markActiveFromScan,
  };
}
