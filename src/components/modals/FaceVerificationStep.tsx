import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, ScanFace, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { API_BASE } from '../../lib/apiBase';

interface FaceVerificationStepProps {
  handle: string;
  onSuccess: (data: { gender: string; faceVerificationUrl: string }) => void;
  onCancel?: () => void;
}

export const FaceVerificationStep: React.FC<FaceVerificationStepProps> = ({
  handle,
  onSuccess,
  onCancel,
}) => {
  const [faceImageBase64, setFaceImageBase64] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Automatically start camera on mount for immediate facial verification experience
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play().catch((err) => console.error('Video play error:', err));
      };
    }
  }, [stream, isCameraActive]);

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 480, facingMode: 'user' },
      });
      mediaStreamRef.current = mediaStream;
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera stream access error:', err);
      setErrorMessage('Could not access camera. Please allow camera permissions or upload a face photo.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setStream(null);
    setIsCameraActive(false);
  };

  const processVerification = async (base64Data: string) => {
    setErrorMessage(null);
    setIsVerifying(true);

    try {
      // 1. Verify face with AI backend
      const res = await fetch(`${API_BASE}/api/verify-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data }),
      });

      if (!res.ok) {
        throw new Error('Verification request failed');
      }

      const data = await res.json();

      if (!data.isFaceDetected) {
        setIsVerified(false);
        setErrorMessage(data.reason || 'No clear face detected. Please ensure good lighting and look directly at the camera.');
        setIsVerifying(false);
        return;
      }

      const detectedGender = data.gender === 'male' ? 'male' : 'female';

      // 2. Save face image to Supabase Storage
      const uploadRes = await fetch(`${API_BASE}/api/upload-face-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          handle: handle || 'user',
        }),
      });

      const uploadData = uploadRes.ok ? await uploadRes.json() : null;
      const publicUrl = uploadData?.publicUrl || base64Data;

      setIsVerified(true);
      setIsVerifying(false);

      // Trigger success callback after 1 second so user sees "Facial Verification Done!"
      setTimeout(() => {
        onSuccess({
          gender: detectedGender,
          faceVerificationUrl: publicUrl,
        });
      }, 1000);
    } catch (err: any) {
      console.error('Face verification processing error:', err);
      setErrorMessage('Verification failed. Please try again.');
      setIsVerifying(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth || 360;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Data = canvas.toDataURL('image/jpeg', 0.85);

    setFaceImageBase64(base64Data);
    stopCamera();
    processVerification(base64Data);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFaceImageBase64(result);
      stopCamera();
      processVerification(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-2 px-1 text-center animate-fadeIn">
      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="space-y-1">
        <div className="w-12 h-12 bg-pink-500/20 border border-pink-500/40 rounded-full flex items-center justify-center mx-auto text-pink-400 shadow-lg shadow-pink-500/10">
          <ScanFace className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-lg font-black text-white tracking-wide">Facial Verification</h2>
        <p className="text-xs text-slate-400 max-w-xs">
          Position your face in the oval frame to complete identity verification.
        </p>
      </div>

      {/* Camera Box / Live Stream */}
      <div className="relative w-64 h-64 bg-slate-950/90 rounded-3xl overflow-hidden border-2 border-indigo-500/30 shadow-2xl flex items-center justify-center">
        {isCameraActive ? (
          <div className="relative w-full h-full">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {/* Oval Face Frame Guide */}
            <div className="absolute inset-x-8 inset-y-6 border-2 border-dashed border-pink-400/80 rounded-[50%] pointer-events-none animate-pulse shadow-[0_0_15px_rgba(244,114,182,0.3)]" />

            {/* Laser Scan Line overlay */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent shadow-[0_0_10px_#f472b6] animate-[scan_2s_infinite]" />
          </div>
        ) : faceImageBase64 ? (
          <div className="relative w-full h-full">
            <img src={faceImageBase64} alt="Face Snapshot" className="w-full h-full object-cover" />
            {isVerifying && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                <p className="text-xs font-bold text-pink-200">Facial Verification in progress...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center space-y-2">
            <ScanFace className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">Camera preview inactive</p>
          </div>
        )}

        {/* Verification Success Overlay */}
        {isVerified && (
          <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center space-y-2 p-4 animate-scaleUp">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <p className="text-sm font-black text-white">Facial Verification Done!</p>
            <p className="text-[11px] text-emerald-300">Entering VibeLive...</p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="w-full max-w-xs p-2.5 bg-red-950/80 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center space-x-2 text-left">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Actions */}
      {!isVerified && !isVerifying && (
        <div className="w-full max-w-xs space-y-2 pt-1">
          {isCameraActive ? (
            <button
              type="button"
              onClick={capturePhoto}
              className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs rounded-xl shadow-lg shadow-pink-500/25 flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Face</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startCamera}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Turn On Camera & Scan</span>
            </button>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <label className="flex-1 py-2 bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center space-x-1 cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5 text-pink-400" />
              <span>Upload Photo</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="py-2 px-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs rounded-xl transition-all"
              >
                Back
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
