import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  FaQrcode,
  FaCamera,
  FaKeyboard,
  FaFlash,
  FaSyncAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowLeft,
  FaTimes,
  FaClock
} from 'react-icons/fa';

/**
 * QRCodeScanner Component
 * Camera-based QR code scanner for watchman interface
 */
const QRCodeScanner = ({ onScan, onError }) => {
  // Component state
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualBookingId, setManualBookingId] = useState('');
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [recentScans, setRecentScans] = useState([]);
  const [lastScannedData, setLastScannedData] = useState(null);

  // Refs
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  /**
   * Initialize HTML5 QR Code Scanner
   */
  const initializeScanner = useCallback(async () => {
    try {
      // Check if camera is available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');

      if (videoDevices.length === 0) {
        setCameraError('No camera found on this device');
        return;
      }

      // Request camera permission
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (permError) {
        setCameraError('Camera permission denied. Please enable camera access.');
        if (onError) {
          onError(new Error('Camera permission denied'));
        }
        return;
      }

      // Initialize scanner
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: cameraFacing
          }
        },
        false
      );

      scanner.render(handleScanSuccess, handleScanError);
      html5QrcodeScannerRef.current = scanner;
      setScanning(true);
      setCameraError(null);
    } catch (error) {
      console.error('Scanner initialization error:', error);
      setCameraError('Failed to initialize camera. Please try manual entry.');
      if (onError) {
        onError(error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraFacing]);

  /**
   * Initialize QR code scanner
   */
  useEffect(() => {
    if (!manualEntry && !html5QrcodeScannerRef.current) {
      initializeScanner();
    }

    // Cleanup on unmount
    return () => {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current
          .clear()
          .catch((error) => console.error('Error clearing scanner:', error));
      }
    };
  }, [manualEntry, initializeScanner]);

  /**
   * Handle successful QR scan
   */
  const handleScanSuccess = (decodedText, decodedResult) => {
    // Prevent duplicate scans
    if (decodedText === lastScannedData) {
      return;
    }

    setLastScannedData(decodedText);

    // Haptic feedback (if supported)
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    // Play success sound
    playSuccessSound();

    // Add to recent scans
    addToRecentScans(decodedText);

    // Call parent callback
    if (onScan) {
      onScan(decodedText);
    }

    // Clear scanner
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current
        .clear()
        .then(() => {
          setScanning(false);
          html5QrcodeScannerRef.current = null;
        })
        .catch((error) => console.error('Error clearing scanner:', error));
    }
  };

  /**
   * Handle scan error (continuous scanning errors, not critical)
   */
  const handleScanError = (errorMessage) => {
    // Ignore continuous scan errors (no QR in frame)
    // Only log actual camera errors
    if (
      !errorMessage.includes('NotFoundException') &&
      !errorMessage.includes('No MultiFormat Readers')
    ) {
      console.error('Scan error:', errorMessage);
    }
  };

  /**
   * Play success sound
   */
  const playSuccessSound = () => {
    try {
      const audio = new Audio(
        'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzz3wvBSF1xe/glEILElyx6+ijUhEKSKHf8sJuJAUuhM/z1YU2Bhxqvu7mnEoODlOp5O+3YhoINZPY88p2KwUme8rx3I4+CRZiturqpVIRC0qi4PK8aB8EMYfP89GAMAYeb8Lv5JdKDg5Uq+XvumEaBziU2fLLdSsFKHzL8dmLOQcXY7ro6qRRDwpJouDyvGkcBDCFzvPVgjAGH2/E7+SSRwwOVKrl7rdgGQg0k9nyynUsBS580fHajjwIF2S76OmlUREKSqPh8bplGws'
      );
      audio.play().catch(() => {
        /* Ignore audio errors */
      });
    } catch (error) {
      // Ignore audio errors
    }
  };

  /**
   * Add scan to recent history
   */
  const addToRecentScans = (data) => {
    const newScan = {
      data,
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    setRecentScans((prev) => {
      const updated = [newScan, ...prev.filter((scan) => scan.data !== data)];
      return updated.slice(0, 3); // Keep only last 3
    });
  };

  /**
   * Toggle manual entry mode
   */
  const toggleManualEntry = () => {
    if (!manualEntry) {
      // Switching to manual - clear scanner
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current
          .clear()
          .then(() => {
            setScanning(false);
            html5QrcodeScannerRef.current = null;
          })
          .catch((error) => console.error('Error clearing scanner:', error));
      }
    } else {
      // Switching back to scanner
      setManualBookingId('');
    }
    setManualEntry(!manualEntry);
    setCameraError(null);
  };

  /**
   * Handle manual entry submission
   */
  const handleManualSubmit = (e) => {
    e.preventDefault();

    if (!manualBookingId.trim()) {
      return;
    }

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    // Call parent callback with manual entry
    if (onScan) {
      onScan(manualBookingId.trim());
    }

    // Add to recent scans
    addToRecentScans(manualBookingId.trim());

    // Clear input
    setManualBookingId('');
  };

  /**
   * Handle flashlight toggle (if supported)
   */
  const toggleFlashlight = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();

      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashlightOn }]
        });
        setFlashlightOn(!flashlightOn);
      }
    } catch (error) {
      console.error('Flashlight not supported:', error);
    }
  };

  /**
   * Switch camera (front/back)
   */
  const switchCamera = () => {
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(newFacing);

    // Reinitialize scanner with new camera
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current
        .clear()
        .then(() => {
          html5QrcodeScannerRef.current = null;
          setScanning(false);
          // Reinitialize will happen in useEffect
        })
        .catch((error) => console.error('Error clearing scanner:', error));
    }
  };

  /**
   * Enable camera permissions
   */
  const enableCameraPermissions = () => {
    setCameraError(null);
    initializeScanner();
  };

  /**
   * Quick re-scan from recent history
   */
  const handleQuickRescan = (data) => {
    if (onScan) {
      onScan(data);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      {/* Scanner Container */}
      <div className="max-w-2xl mx-auto p-4">
        {!manualEntry ? (
          <>
            {/* Camera Scanner View */}
            <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
              {/* Scanner Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaQrcode className="text-3xl mr-3" />
                    <div>
                      <h2 className="text-xl font-bold">QR Code Scanner</h2>
                      <p className="text-sm text-indigo-100">
                        {scanning ? 'Scanning...' : 'Position QR code in frame'}
                      </p>
                    </div>
                  </div>
                  <FaCamera className="text-2xl opacity-50" />
                </div>
              </div>

              {/* Scanner Area */}
              <div className="relative bg-black">
                {!cameraError ? (
                  <div className="relative">
                    {/* QR Reader Container */}
                    <div id="qr-reader" ref={scannerRef} className="w-full"></div>

                    {/* Scanning Overlay */}
                    {scanning && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="relative w-64 h-64 border-4 border-green-500 rounded-lg animate-pulse">
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                        </div>
                      </div>
                    )}

                    {/* Instructions */}
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <p className="text-white text-sm bg-black bg-opacity-70 inline-block px-4 py-2 rounded-full">
                        Align QR code within frame
                      </p>
                    </div>
                  </div>
                ) : (
                  // Camera Error View
                  <div className="flex flex-col items-center justify-center py-16 px-4">
                    <FaExclamationTriangle className="text-yellow-500 text-6xl mb-4" />
                    <h3 className="text-xl font-bold mb-2">Camera Access Required</h3>
                    <p className="text-gray-400 text-center mb-6">{cameraError}</p>
                    <button
                      onClick={enableCameraPermissions}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center"
                    >
                      <FaCamera className="mr-2" />
                      Enable Camera
                    </button>
                  </div>
                )}
              </div>

              {/* Scanner Controls */}
              {!cameraError && (
                <div className="bg-gray-800 p-4 border-t border-gray-700">
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={toggleFlashlight}
                      className={`flex-1 max-w-xs py-3 px-4 rounded-lg font-semibold transition-all ${
                        flashlightOn
                          ? 'bg-yellow-500 text-gray-900'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      <FaFlash className="inline mr-2" />
                      {flashlightOn ? 'Flash On' : 'Flash Off'}
                    </button>

                    <button
                      onClick={switchCamera}
                      className="flex-1 max-w-xs bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                    >
                      <FaSyncAlt className="inline mr-2" />
                      Switch Camera
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Toggle to Manual Entry */}
            <button
              onClick={toggleManualEntry}
              className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center text-lg"
            >
              <FaKeyboard className="mr-3 text-2xl" />
              Enter Booking ID Manually
            </button>
          </>
        ) : (
          // Manual Entry View
          <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Manual Entry Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaKeyboard className="text-3xl mr-3" />
                  <div>
                    <h2 className="text-xl font-bold">Manual Entry</h2>
                    <p className="text-sm text-orange-100">Enter booking ID or QR code</p>
                  </div>
                </div>
                <button
                  onClick={toggleManualEntry}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-all"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>

            {/* Manual Entry Form */}
            <form onSubmit={handleManualSubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Booking ID or QR Code Data
                </label>
                <input
                  type="text"
                  value={manualBookingId}
                  onChange={(e) => setManualBookingId(e.target.value)}
                  placeholder="Enter booking ID..."
                  className="w-full px-4 py-4 text-lg bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!manualBookingId.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center text-lg"
              >
                <FaCheckCircle className="mr-3 text-2xl" />
                Verify Booking
              </button>

              <button
                type="button"
                onClick={toggleManualEntry}
                className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center"
              >
                <FaArrowLeft className="mr-2" />
                Back to Scanner
              </button>
            </form>
          </div>
        )}

        {/* Recent Scans Section */}
        {recentScans.length > 0 && (
          <div className="mt-6 bg-gray-800 rounded-xl p-4">
            <h3 className="text-lg font-bold mb-3 flex items-center">
              <FaClock className="mr-2 text-indigo-400" />
              Recent Scans
            </h3>
            <div className="space-y-2">
              {recentScans.map((scan, index) => (
                <div
                  key={index}
                  className="bg-gray-700 rounded-lg p-3 flex items-center justify-between hover:bg-gray-600 transition-all"
                >
                  <div className="flex-1">
                    <p className="font-mono text-sm text-gray-300 truncate">{scan.data}</p>
                    <p className="text-xs text-gray-500 mt-1">{scan.timestamp}</p>
                  </div>
                  <button
                    onClick={() => handleQuickRescan(scan.data)}
                    className="ml-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm"
                  >
                    Re-verify
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-6 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-xl p-4">
          <h3 className="font-bold mb-2 flex items-center text-blue-300">
            <FaQrcode className="mr-2" />
            Scanning Tips
          </h3>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• Hold the camera steady and ensure good lighting</li>
            <li>• Keep QR code within the scanning frame</li>
            <li>• Use flashlight in low-light conditions</li>
            <li>• Try manual entry if camera isn't working</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;
