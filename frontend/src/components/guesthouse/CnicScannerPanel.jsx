import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScanLine, Loader, Usb, RefreshCw, Upload, ImageIcon, Camera, ClipboardPaste,
  CheckCircle2, User, CreditCard, QrCode, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCnic, parseIdCardScan } from '../../utils/cnicScanner';
import { ID_CARD_IMAGE_ACCEPT, parseIdCardImage } from '../../utils/idCardImage';
import { useUsbScannerStatus } from '../../hooks/useUsbScannerStatus';

const SCAN_KEY_GAP_MS = 120;
const MIN_SCAN_LENGTH = 3;

const IMAGE_SCAN_STEPS = [
  { id: 'load', label: 'Load image', icon: ImageIcon, match: /loading/i },
  { id: 'qr', label: 'QR code', icon: QrCode, match: /qr/i },
  { id: 'name', label: 'Name', icon: User, match: /name/i },
  { id: 'text', label: 'Card text', icon: FileText, match: /card text|reading card/i },
];

function getScanStepIndex(hint) {
  const text = String(hint || '');
  if (!text) return 0;
  const idx = IMAGE_SCAN_STEPS.findIndex((s) => s.match?.test(text));
  return idx >= 0 ? idx : IMAGE_SCAN_STEPS.length - 1;
}

function ScanProgressSteps({ hint, active }) {
  const current = getScanStepIndex(hint);
  const progress = ((current + 1) / IMAGE_SCAN_STEPS.length) * 100;

  return (
    <div className="cnic-scanner__progress" aria-live="polite">
      <div className="cnic-scanner__progress-bar">
        <div className="cnic-scanner__progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="cnic-scanner__steps">
        {IMAGE_SCAN_STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = i < current;
          const live = i === current && active;
          return (
            <div
              key={step.id}
              className={`cnic-scanner__step${done ? ' cnic-scanner__step--done' : ''}${live ? ' cnic-scanner__step--active' : ''}`}
            >
              <span className="cnic-scanner__step-icon">
                {done ? <CheckCircle2 size={14} /> : <Icon size={14} />}
              </span>
              <span className="cnic-scanner__step-label">{step.label}</span>
            </div>
          );
        })}
      </div>
      <p className="cnic-scanner__progress-hint">{hint || 'Scanning ID card…'}</p>
    </div>
  );
}

function ScanPreviewFrame({ previewUrl, scanning }) {
  return (
    <div className={`cnic-scanner__preview-frame${scanning ? ' cnic-scanner__preview-frame--active' : ''}`}>
      <span className="cnic-scanner__corner cnic-scanner__corner--tl" aria-hidden />
      <span className="cnic-scanner__corner cnic-scanner__corner--tr" aria-hidden />
      <span className="cnic-scanner__corner cnic-scanner__corner--bl" aria-hidden />
      <span className="cnic-scanner__corner cnic-scanner__corner--br" aria-hidden />

      {previewUrl ? (
        <img
          src={previewUrl}
          alt="ID card preview"
          className={`cnic-scanner__preview${scanning ? ' cnic-scanner__preview--scanning' : ''}`}
        />
      ) : (
        <div className="cnic-scanner__preview-placeholder">
          <ScanLine size={32} />
        </div>
      )}

      {scanning && (
        <>
          <div className="cnic-scanner__scan-beam" aria-hidden />
          <div className="cnic-scanner__preview-overlay">
            <div className="cnic-scanner__scan-ring">
              <Loader size={26} className="spin" />
            </div>
            <p className="cnic-scanner__scan-title">Scanning ID card</p>
          </div>
        </>
      )}
    </div>
  );
}

function ScanResultCard({ parsed, success }) {
  if (!parsed?.full_name && !parsed?.cnic) return null;

  return (
    <div className={`cnic-scanner__result${success ? ' cnic-scanner__result--success' : ''}`}>
      <div className="cnic-scanner__result-head">
        <CheckCircle2 size={18} className="cnic-scanner__result-check" />
        <span>Card read successfully</span>
      </div>
      <div className="cnic-scanner__result-rows">
        <div className="cnic-scanner__result-row">
          <span className="cnic-scanner__result-icon"><User size={16} /></span>
          <div>
            <span className="cnic-scanner__result-label">Full name</span>
            <strong>{parsed.full_name || '—'}</strong>
          </div>
        </div>
        <div className="cnic-scanner__result-row">
          <span className="cnic-scanner__result-icon"><CreditCard size={16} /></span>
          <div>
            <span className="cnic-scanner__result-label">CNIC number</span>
            <strong className="cnic-scanner__result-mono">
              {parsed.cnic ? formatCnic(parsed.cnic) : '—'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CnicScannerPanel({ onScan, disabled = false }) {
  const [lastScanAt, setLastScanAt] = useState(null);
  const [lastParsed, setLastParsed] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadHint, setUploadHint] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [usbScanning, setUsbScanning] = useState(false);
  const captureRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const wedgeBufferRef = useRef('');
  const wedgeLastKeyRef = useRef(0);
  const processingRef = useRef(false);
  const previewUrlRef = useRef(null);

  const {
    hidSupported,
    isConnected,
    isReady,
    sessionActive,
    deviceName,
    deviceCount,
    pairing,
    pairScanner,
    refreshDevices,
    markActiveFromScan,
  } = useUsbScannerStatus();

  const prevDeviceCountRef = useRef(null);
  const prevSessionRef = useRef(false);

  const setPreview = useCallback((file) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPreviewUrl(url);
  }, []);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const processScan = useCallback((raw) => {
    if (processingRef.current) return;
    const text = String(raw || '').trim();
    if (!text) return;

    processingRef.current = true;
    setUsbScanning(true);
    setScanSuccess(false);
    const parsed = parseIdCardScan(text);
    if (!parsed?.cnic && !parsed?.full_name) {
      toast.error('Could not read ID card. Scan again.', { id: 'id-scan-error' });
      setUsbScanning(false);
      processingRef.current = false;
      return;
    }
    markActiveFromScan();
    setLastScanAt(Date.now());
    setLastParsed(parsed);
    setScanSuccess(true);
    if (!parsed.full_name && parsed.cnic) {
      toast('CNIC read — upload card photo for name', { id: 'id-scan-partial', icon: 'ℹ️' });
    }
    onScan?.(parsed);
    wedgeBufferRef.current = '';
    if (captureRef.current) captureRef.current.value = '';
    setTimeout(() => {
      setUsbScanning(false);
      processingRef.current = false;
    }, 600);
  }, [onScan, markActiveFromScan]);

  const isUserTypingField = (el) => {
    if (!el?.matches?.('input, textarea, select')) return false;
    return !el.classList?.contains('cnic-scanner__capture');
  };

  const focusCapture = useCallback(() => {
    if (disabled) return;
    const active = document.activeElement;
    if (!isUserTypingField(active)) {
      captureRef.current?.focus({ preventScroll: true });
    }
  }, [disabled]);

  useEffect(() => {
    if (disabled) return undefined;
    focusCapture();
    const onPointerUp = () => setTimeout(focusCapture, 120);
    window.addEventListener('pointerup', onPointerUp);
    return () => window.removeEventListener('pointerup', onPointerUp);
  }, [disabled, focusCapture]);

  const flushWedgeBuffer = useCallback((buf) => {
    const text = String(buf || '').trim();
    if (text.length >= MIN_SCAN_LENGTH) processScan(text);
    wedgeBufferRef.current = '';
  }, [processScan]);

  useEffect(() => {
    if (disabled) return undefined;

    const onKeyDown = (e) => {
      if (processingRef.current) return;

      if (e.key === 'Enter' || e.key === 'Tab') {
        const buf = wedgeBufferRef.current.trim()
          || (e.target?.classList?.contains('cnic-scanner__capture') ? e.target.value : '');
        if (buf.length >= MIN_SCAN_LENGTH) {
          e.preventDefault();
          processScan(buf);
        }
        wedgeBufferRef.current = '';
        return;
      }

      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;

      const now = Date.now();
      const gap = now - wedgeLastKeyRef.current;
      wedgeLastKeyRef.current = now;
      const inUserField = isUserTypingField(e.target);

      if (gap > SCAN_KEY_GAP_MS) {
        wedgeBufferRef.current = e.key;
        return;
      }

      wedgeBufferRef.current += e.key;
      if (inUserField && wedgeBufferRef.current.length > 1) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [disabled, processScan]);

  useEffect(() => {
    const prevCount = prevDeviceCountRef.current;
    prevDeviceCountRef.current = deviceCount;

    if (prevCount === null) return;

    if (deviceCount > 0 && prevCount === 0) {
      toast.success(
        deviceName ? `USB scanner connected - ${deviceName}` : 'USB scanner connected',
        { id: 'scanner-connect' },
      );
    } else if (deviceCount === 0 && prevCount > 0) {
      toast('USB scanner disconnected', { id: 'scanner-disconnect', icon: '🔌' });
    }
  }, [deviceCount, deviceName]);

  useEffect(() => {
    if (sessionActive && !prevSessionRef.current) {
      toast.success('Scanner ready - ID card scan received', { id: 'scanner-wedge' });
    }
    prevSessionRef.current = sessionActive;
  }, [sessionActive]);

  const handlePair = async () => {
    const ok = await pairScanner();
    if (ok) focusCapture();
  };

  const handleRefresh = async () => {
    const count = await refreshDevices();
    if (count > 0) {
      focusCapture();
      return;
    }
    toast('No HID scanner found. Most USB scanners still work - try scanning ID card directly.', {
      id: 'scanner-refresh',
      icon: 'ℹ️',
    });
  };

  const handleCaptureKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      flushWedgeBuffer(e.currentTarget.value);
      e.currentTarget.value = '';
    }
  };

  const handleCaptureInput = (e) => {
    const val = e.target.value;
    wedgeBufferRef.current = val;
    if (val.length >= 13) {
      const parsed = parseIdCardScan(val);
      if (parsed?.cnic || parsed?.full_name) {
        processScan(val);
        e.target.value = '';
        wedgeBufferRef.current = '';
      }
    }
  };

  const processImageFile = useCallback(async (file) => {
    if (!file || disabled || uploading) return;
    if (!String(file.type || '').startsWith('image/')) {
      toast.error('Please choose an image file (JPG, PNG, WebP)');
      return;
    }

    setPreview(file);
    setUploading(true);
    setUploadHint('Loading image…');
    setLastParsed(null);
    setScanSuccess(false);

    try {
      const { parsed, source } = await parseIdCardImage(file, {
        onProgress: setUploadHint,
      });

      if (!parsed?.cnic && !parsed?.full_name) {
        toast.error('Could not read name or CNIC. Use a clear front-side photo.', {
          id: 'id-upload-error',
        });
        return;
      }

      markActiveFromScan();
      setLastScanAt(Date.now());
      setLastParsed(parsed);
      setScanSuccess(true);
      onScan?.(parsed);

      const parts = [
        parsed.full_name,
        parsed.cnic ? formatCnic(parsed.cnic) : '',
      ].filter(Boolean);

      if (!parts.length) {
        toast.success(
          source === 'qr' ? 'ID card read from QR' : 'ID card read from image',
          { id: 'id-upload-success', duration: 4000 },
        );
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to read ID card image', { id: 'id-upload-error' });
    } finally {
      setUploading(false);
      setUploadHint('');
    }
  }, [disabled, uploading, onScan, markActiveFromScan, setPreview]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) processImageFile(file);
  };

  const handleCameraCapture = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) processImageFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !uploading) setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) processImageFile(file);
  };

  useEffect(() => {
    if (disabled) return undefined;

    const onPaste = (e) => {
      if (uploading || processingRef.current) return;
      const items = [...(e.clipboardData?.items || [])];
      const imageItem = items.find((item) => item.type.startsWith('image/'));
      if (!imageItem) return;
      const file = imageItem.getAsFile();
      if (!file) return;
      e.preventDefault();
      processImageFile(file);
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [disabled, uploading, processImageFile]);

  const scannerTitle = isConnected
    ? 'USB scanner active'
    : sessionActive
      ? 'Scanner active'
      : 'Ready to scan';

  const scannerHint = isConnected
    ? `${deviceName || 'Scanner'} connected — scan anytime on this page.`
    : 'Plug in USB scanner and scan ID card. No click needed.';

  return (
    <div className="cnic-scanner">
      <input
        ref={captureRef}
        type="text"
        className="cnic-scanner__capture"
        aria-label="Scanner capture"
        tabIndex={-1}
        autoComplete="off"
        onKeyDown={handleCaptureKeyDown}
        onInput={handleCaptureInput}
        disabled={disabled}
      />

      {/* Image scanner — primary for name + CNIC */}
      <div
        className={`cnic-scanner__card cnic-scanner__card--upload cnic-scanner__card--image-primary${dragOver ? ' cnic-scanner__card--drag' : ''}${uploading ? ' cnic-scanner__card--loading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ID_CARD_IMAGE_ACCEPT}
          className="cnic-scanner__file-input"
          aria-label="Upload ID card image"
          onChange={handleImageUpload}
          disabled={disabled || uploading}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="cnic-scanner__file-input"
          aria-label="Capture ID card photo"
          onChange={handleCameraCapture}
          disabled={disabled || uploading}
        />

        <div className="cnic-scanner__image-head">
          <div className={`cnic-scanner__card-icon cnic-scanner__card-icon--upload${uploading ? ' cnic-scanner__card-icon--pulse' : ''}`}>
            {uploading ? <ScanLine size={22} /> : <ImageIcon size={22} />}
          </div>
          <div className="cnic-scanner__card-meta">
            <p className="cnic-scanner__card-title">
              {uploading ? 'Reading your ID card…' : 'ID card image scanner'}
            </p>
            <p className="cnic-scanner__card-desc">
              {uploading
                ? 'Please wait — extracting name and CNIC from the photo'
                : 'Upload, camera, or paste — auto reads name & CNIC from the card'}
            </p>
          </div>
        </div>

        {(previewUrl || uploading) && (
          <div className="cnic-scanner__preview-wrap">
            <ScanPreviewFrame previewUrl={previewUrl} scanning={uploading} />
            {uploading && <ScanProgressSteps hint={uploadHint} active />}
          </div>
        )}

        <div className="cnic-scanner__image-actions">
          <button
            type="button"
            className="btn-primary cnic-scanner__btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
          >
            <Upload size={15} />
            {uploading ? 'Scanning…' : 'Upload photo'}
          </button>
          <button
            type="button"
            className="btn-secondary cnic-scanner__btn"
            onClick={() => cameraInputRef.current?.click()}
            disabled={disabled || uploading}
          >
            <Camera size={15} />
            Camera
          </button>
        </div>

        <p className="cnic-scanner__note cnic-scanner__note--center">
          Drag &amp; drop · Ctrl+V paste · JPG, PNG, WebP · front side, good light
        </p>
      </div>

      {!uploading && lastParsed && (lastParsed.full_name || lastParsed.cnic) && (
        <ScanResultCard parsed={lastParsed} success={scanSuccess} />
      )}

      <div className="cnic-scanner__divider" role="separator" aria-label="Or use USB scanner">
        <span className="cnic-scanner__divider-line" aria-hidden />
        <span className="cnic-scanner__divider-text">or use USB scanner</span>
        <span className="cnic-scanner__divider-line" aria-hidden />
      </div>

      {/* USB Scanner */}
      <div className={`cnic-scanner__card cnic-scanner__card--scan${isReady ? ' cnic-scanner__card--active' : ''}${usbScanning ? ' cnic-scanner__card--usb-scan' : ''}`}>
        <div className="cnic-scanner__card-head">
          <div className={`cnic-scanner__card-icon cnic-scanner__card-icon--scan${usbScanning ? ' cnic-scanner__card-icon--pulse' : ''}`}>
            {usbScanning ? <Loader size={20} className="spin" /> : <ScanLine size={20} />}
          </div>
          <div className="cnic-scanner__card-meta">
            <p className="cnic-scanner__card-title">
              {usbScanning ? 'Processing scan…' : scannerTitle}
            </p>
            <p className="cnic-scanner__card-desc">
              {usbScanning ? 'Reading data from ID card scanner' : scannerHint}
            </p>
          </div>
          <span
            className={`cnic-scanner__status-dot${isReady ? ' cnic-scanner__status-dot--on' : ''}`}
            title={isReady ? 'Scanner ready' : 'Waiting for scan'}
          />
        </div>

        {!hidSupported && (
          <p className="cnic-scanner__note">
            Use Chrome or Edge. Scanner works as keyboard input.
          </p>
        )}

        {hidSupported && !isConnected && (
          <div className="cnic-scanner__card-actions">
            <button
              type="button"
              className="btn-secondary cnic-scanner__btn"
              onClick={handlePair}
              disabled={disabled || pairing}
            >
              {pairing ? <Loader size={15} className="spin" /> : <Usb size={15} />}
              Link USB scanner
            </button>
            <button
              type="button"
              className="btn-secondary cnic-scanner__btn-icon"
              onClick={handleRefresh}
              disabled={disabled || pairing}
              title="Refresh scanner status"
              aria-label="Refresh scanner"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        )}

        <p className="cnic-scanner__note cnic-scanner__note--center">
          <ClipboardPaste size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          USB scan usually gives CNIC only — use image scanner above for name
        </p>
      </div>

      {lastScanAt && (
        <p className="cnic-scanner__last-scan">
          Last read · {new Date(lastScanAt).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
