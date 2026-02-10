
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentItem } from '../types';

const ScanScreen: React.FC = () => {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [hasCamera, setHasCamera] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('Wird verarbeitet...');
    const [showFallback, setShowFallback] = useState(false);

    useEffect(() => {
        let mounted = true;
        let timeoutId: any;

        const startCamera = async () => {
            setErrorMsg(null);
            setHasCamera(false);
            setShowFallback(false);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                if (mounted) {
                    setErrorMsg("Kamera API nicht verfügbar (evtl. kein HTTPS?).");
                    setShowFallback(true);
                }
                return;
            }

            timeoutId = setTimeout(() => {
                if (mounted && !hasCamera) {
                    console.warn("Camera init timed out");
                    setErrorMsg("Kamera-Start dauert zu lange.");
                    setShowFallback(true);
                }
            }, 5000);

            try {
                let stream: MediaStream | null = null;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { 
                            facingMode: 'environment',
                            width: { ideal: 1920 },
                            height: { ideal: 1080 }
                        } 
                    });
                } catch (err1) {
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ 
                            video: { facingMode: 'environment' } 
                        });
                    } catch (err2) {
                        try {
                            stream = await navigator.mediaDevices.getUserMedia({ video: true });
                        } catch (err3) {
                             throw err3;
                        }
                    }
                }

                if (!mounted) {
                    stream?.getTracks().forEach(track => track.stop());
                    return;
                }

                if (!stream) throw new Error("Kein Video-Stream erhalten");
                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play()
                            .then(() => {
                                if (mounted) {
                                    setHasCamera(true);
                                    setShowFallback(false);
                                }
                            })
                            .catch(e => {
                                if (mounted) {
                                    setHasCamera(true);
                                    setShowFallback(true);
                                }
                            });
                    };
                }
            } catch (err: any) {
                if (!mounted) return;
                setShowFallback(true);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setErrorMsg("Zugriff auf Kamera verweigert.");
                } else {
                    setErrorMsg("Kamerafehler: " + (err.message || "Unbekannt"));
                }
            } finally {
                clearTimeout(timeoutId);
            }
        };

        startCamera();

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, []);

    const processAndSaveImage = async (imgDataUrl: string) => {
        setIsProcessing(true);
        setStatusText("Speichere Scan...");
        
        try {
            const now = new Date();
            let docName = `Scan ${now.getDate()}.${now.getMonth()+1}. ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

            // AI analysis call removed here for manual request on details screen
            const newDoc: DocumentItem = {
                id: Date.now(),
                name: docName,
                date: 'Gerade eben',
                icon: 'image',
                img: imgDataUrl,
                content: imgDataUrl,
                isSecure: false,
                isFavorite: false,
                category: 'Sonstiges',
                format: 'a4',
                rotation: 0
            };

            const savedDocs = localStorage.getItem('docuscan_documents');
            const currentDocs = savedDocs ? JSON.parse(savedDocs) : [];
            const updatedDocs = [newDoc, ...currentDocs];
            
            localStorage.setItem('docuscan_documents', JSON.stringify(updatedDocs));
            window.dispatchEvent(new Event('docuscan-update'));
            navigate('/');
        } catch (e) {
            console.error("Storage error:", e);
            alert("Fehler beim Speichern!");
            setIsProcessing(false);
        }
    };

    const handleCapture = () => {
        if (!videoRef.current || !hasCamera) return;
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 1200;
        let width = video.videoWidth;
        let height = video.videoHeight;
        
        if (width === 0 || height === 0) return;

        if (width > height) {
            if (width > MAX_DIMENSION) {
                height = Math.round(height * (MAX_DIMENSION / width));
                width = MAX_DIMENSION;
            }
        } else {
            if (height > MAX_DIMENSION) {
                width = Math.round(width * (MAX_DIMENSION / height));
                height = MAX_DIMENSION;
            }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, width, height);
        const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
        processAndSaveImage(imageUrl);
    };

    const handleFileFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            if (result) processAndSaveImage(result);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col">
            <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFileFallback} />
            <div className="absolute inset-0 z-0 bg-black">
                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-500 ${hasCamera ? 'opacity-100' : 'opacity-0'}`} />
                {(showFallback || !hasCamera) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-black/40 backdrop-blur-sm">
                        <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-700/50 shadow-2xl max-w-xs">
                            <span className="material-symbols-outlined text-4xl mb-3 text-slate-400">photo_camera</span>
                            <p className="text-white font-semibold mb-4">Scanner nutzen</p>
                            <button onClick={() => fileInputRef.current?.click()} className="bg-primary text-white px-4 py-3 rounded-xl text-sm font-bold w-full flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined">photo_camera</span>
                                System-Kamera öffnen
                            </button>
                        </div>
                    </div>
                )}
                {hasCamera && !isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                        <div className="document-frame w-full max-w-sm aspect-[1/1.414] rounded-lg relative opacity-60">
                            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white"></div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white"></div>
                            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white"></div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white"></div>
                        </div>
                    </div>
                )}
            </div>
            <div className="relative z-20 flex items-center bg-gradient-to-b from-black/60 to-transparent p-4 justify-between">
                <button onClick={() => navigate(-1)} className="text-white p-2 bg-black/20 rounded-full"><span className="material-symbols-outlined">close</span></button>
                <h2 className="text-white text-lg font-bold">Scanner</h2>
                <button onClick={() => fileInputRef.current?.click()} className="bg-white/10 p-2 rounded-full border border-white/20"><span className="material-symbols-outlined text-white">upload_file</span></button>
            </div>
            <div className="flex-grow"></div>
            <div className="relative z-20 bg-gradient-to-t from-black/80 to-transparent pb-12 px-6 flex flex-col items-center">
                {isProcessing && <p className="text-primary font-bold animate-pulse mb-6">{statusText}</p>}
                <button onClick={handleCapture} disabled={!hasCamera || isProcessing} className={`size-20 rounded-full border-[5px] flex items-center justify-center transition-all ${isProcessing ? 'border-primary/50 bg-primary/20' : 'border-white bg-white/20 active:scale-90'}`}>
                    <div className={`size-16 rounded-full shadow-lg ${isProcessing ? 'bg-primary' : 'bg-white'}`}></div>
                </button>
            </div>
        </div>
    );
};

export default ScanScreen;