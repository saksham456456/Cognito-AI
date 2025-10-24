// FIX: Import `useCallback` from React.
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { startLiveConversation, encode, decode, decodeAudioData } from '../services/geminiService';
import { PowerIcon, MicrophoneIcon, MicrophoneSlashIcon } from './icons';
// FIX: Removed unexported 'LiveSession' type.
import type { LiveServerMessage, Blob } from '@google/genai';

interface LiveConversationProps {
    onClose: (transcript: { user: string, model: string }[]) => void;
    t: (key: string, fallback?: any) => any;
}

type ConnectionStatus = 'CONNECTING' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR';

// --- NEW: Expert AI Voice Orb ---
const ExpertOrb: React.FC<{
    status: ConnectionStatus;
    analyser: AnalyserNode | null;
}> = ({ status, analyser }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const coreColor = useMemo(() => ({
        LISTENING: 'hsl(220, 100%, 65%)', // blue
        THINKING: 'hsl(310, 100%, 65%)', // purple
        SPEAKING: 'hsl(48, 100%, 55%)',  // amber
        CONNECTING: 'hsl(0, 0%, 50%)',   // grey
        ERROR: 'hsl(0, 80%, 60%)',      // red
    }[status] || 'hsl(0, 0%, 50%)'), [status]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !analyser) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        let animationFrameId: number;

        const draw = () => {
            animationFrameId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);
            
            const centerX = width / 2;
            const centerY = height / 2;

            const overallLoudness = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

            // Draw flowing data streams
            const radius = width * 0.35 + overallLoudness * 0.1;
            const barCount = 64; // Use a subset for clearer visuals

            for (let i = 0; i < barCount; i++) {
                const index = Math.floor(i * (bufferLength / barCount));
                const barHeight = dataArray[index] / 2.0;
                
                if (barHeight < 1) continue;

                const angle = (i / barCount) * Math.PI * 2;

                const x1 = centerX + Math.cos(angle) * (radius - barHeight * 0.2);
                const y1 = centerY + Math.sin(angle) * (radius - barHeight * 0.2);
                const x2 = centerX + Math.cos(angle) * (radius + barHeight * 0.4);
                const y2 = centerY + Math.sin(angle) * (radius + barHeight * 0.4);

                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                const hue = 200 + (dataArray[index] / 255) * 120;
                gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0)`);
                gradient.addColorStop(0.5, `hsla(${hue}, 100%, 70%, ${Math.min(1, dataArray[index] / 150)})`);
                gradient.addColorStop(1, `hsla(${hue}, 100%, 70%, 0)`);

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineWidth = 2;
                ctx.strokeStyle = gradient;
                ctx.stroke();
            }
        };

        draw();

        return () => cancelAnimationFrame(animationFrameId);

    }, [analyser]);

    return (
        <div className="expert-orb-container">
            <div className="expert-orb-base"></div>
            <div className="expert-orb-wrapper">
                <div className="expert-orb-surface"></div>
                <div className="expert-orb-core" style={{ backgroundColor: coreColor, boxShadow: `0 0 60px 10px ${coreColor}` }}></div>
                <div className="expert-orb-ring ring-1"></div>
                <div className="expert-orb-ring ring-2"></div>
                <div className="expert-orb-ring ring-3"></div>
                <canvas ref={canvasRef} width="180" height="180" className="expert-orb-canvas"></canvas>
            </div>
        </div>
    );
};

// --- NEW: Subtle Background Particles ---
const BackgroundParticles = React.memo(() => {
    const particles = useMemo(() => {
        const particleArray = [];
        for (let i = 0; i < 30; i++) {
            const style = {
                '--x-start': `${Math.random() * 100}vw`,
                '--x-end': `${Math.random() * 100}vw`,
                '--scale': `${Math.random() * 0.5 + 0.2}`,
                '--opacity': `${Math.random() * 0.3 + 0.1}`,
                animationDuration: `${Math.random() * 15 + 15}s`,
                animationDelay: `${Math.random() * 20}s`,
                backgroundColor: ['var(--primary-glow)', 'var(--accent1-glow)', 'var(--accent2-glow)'][Math.floor(Math.random() * 3)],
            };
            particleArray.push(
                <div key={i} className="particle" style={style as React.CSSProperties} />
            );
        }
        return particleArray;
    }, []);

    return <div className="live-particles">{particles}</div>;
});


const LiveConversation: React.FC<LiveConversationProps> = ({ onClose, t }) => {
    const [status, setStatus] = useState<ConnectionStatus>('CONNECTING');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [transcriptions, setTranscriptions] = useState<{ user: string, model: string }[]>([]);
    const [currentUserTranscription, setCurrentUserTranscription] = useState('');
    const [currentModelTranscription, setCurrentModelTranscription] = useState('');
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    
    // Refs for state values to be used in callbacks, preventing stale closures.
    const isMutedRef = useRef(isMuted);
    isMutedRef.current = isMuted;
    const currentUserTranscriptionRef = useRef(currentUserTranscription);
    currentUserTranscriptionRef.current = currentUserTranscription;
    const currentModelTranscriptionRef = useRef(currentModelTranscription);
    currentModelTranscriptionRef.current = currentModelTranscription;
    const retryCountRef = useRef(0);
    const maxRetries = 3;


    // FIX: Using ReturnType to infer the type of the session promise as LiveSession is not exported.
    const sessionPromiseRef = useRef<ReturnType<typeof startLiveConversation> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    // NEW: Refs for audio visualization
    const inputAnalyserRef = useRef<AnalyserNode | null>(null);
    const outputAnalyserRef = useRef<AnalyserNode | null>(null);
    const activeAnalyser = isUserSpeaking ? inputAnalyserRef.current : (status === 'SPEAKING' ? outputAnalyserRef.current : null);

    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const thinkingTimeoutRef = useRef<number | null>(null);
    
    const cleanup = useCallback(() => {
        sessionPromiseRef.current?.then(session => session.close()).catch(e => console.error("Error closing session:", e));
        sessionPromiseRef.current = null;

        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        inputAnalyserRef.current?.disconnect();
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close().catch(e => console.error("Error closing input context:", e));
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(e => console.error("Error closing output context:", e));
        }

        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();

        if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);
    }, []);

    const handleClose = useCallback(() => {
        cleanup();
        onClose(transcriptions);
    }, [cleanup, onClose, transcriptions]);

    useEffect(() => {
        let isMounted = true;
    
        const attemptConnection = async () => {
            if (!isMounted) return;
    
            // Get microphone stream only if we don't have it.
            if (!mediaStreamRef.current) {
                try {
                    mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                } catch (err) {
                    console.error("Failed to get user media:", err);
                    if (isMounted) {
                        setErrorMessage(t('live.micError'));
                        setStatus('ERROR');
                    }
                    return; // Stop if we can't get the mic
                }
            }
            const stream = mediaStreamRef.current;
            
            setStatus('CONNECTING');
    
            // Clean up previous processor if it exists from a failed attempt
            if (scriptProcessorRef.current) {
                scriptProcessorRef.current.disconnect();
                scriptProcessorRef.current = null;
            }
            if (mediaStreamSourceRef.current) {
                mediaStreamSourceRef.current.disconnect();
                mediaStreamSourceRef.current = null;
            }
    
            const sessionPromise = startLiveConversation({
                onopen: () => {
                    if (!isMounted) return;
                    console.log('Live session opened.');
                    retryCountRef.current = 0; // Reset retries on successful connection
                    setStatus('LISTENING');
                    
                    const inputAudioContext = inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed'
                        ? inputAudioContextRef.current
                        : new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    inputAudioContextRef.current = inputAudioContext;
    
                    const source = inputAudioContext.createMediaStreamSource(stream);
                    mediaStreamSourceRef.current = source;
                    
                    const scriptProcessor = inputAudioContext.createScriptProcessor(1024, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;

                    inputAnalyserRef.current = inputAudioContext.createAnalyser();
    
                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        let sum = 0;
                        for (let i = 0; i < inputData.length; i++) {
                            sum += inputData[i] * inputData[i];
                        }
                        const rms = Math.sqrt(sum / inputData.length);
                        setIsUserSpeaking(rms > 0.01 && !isMutedRef.current);
    
                        if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);
                        thinkingTimeoutRef.current = window.setTimeout(() => {
                            if (currentUserTranscriptionRef.current) setStatus('THINKING');
                        }, 800);
    
                        if (isMutedRef.current) return;
    
                        const pcmBlob: Blob = { data: encode(inputData), mimeType: 'audio/pcm;rate=16000' };
                        sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    
                    // NEW: Connect audio chain with analyser
                    source.connect(inputAnalyserRef.current);
                    inputAnalyserRef.current.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContext.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (!isMounted) return;
                    if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);

                    if (message.serverContent?.outputTranscription) {
                        setCurrentModelTranscription(prev => prev + message.serverContent.outputTranscription.text);
                    } 
                    if (message.serverContent?.inputTranscription) {
                        setCurrentUserTranscription(prev => prev + message.serverContent.inputTranscription.text);
                    }

                    if (message.serverContent?.turnComplete) {
                        const finalUser = currentUserTranscriptionRef.current;
                        const finalModel = currentModelTranscriptionRef.current;
                        if (finalUser.trim() || finalModel.trim()) {
                            setTranscriptions(prev => [...prev, { user: finalUser.trim(), model: finalModel.trim() }]);
                        }
                        setCurrentUserTranscription('');
                        setCurrentModelTranscription('');
                        if (status === 'THINKING' || status === 'SPEAKING') {
                            setStatus('LISTENING');
                        }
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio) {
                        setStatus('SPEAKING');
                        if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
                            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                        }
                        const outputAudioContext = outputAudioContextRef.current;
                        
                        // Create analyser for output if it doesn't exist
                        if (!outputAnalyserRef.current) {
                            outputAnalyserRef.current = outputAudioContext.createAnalyser();
                        }
                        
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                        
                        const source = outputAudioContext.createBufferSource();
                        source.buffer = audioBuffer;
                        
                        // NEW: Connect output chain with analyser
                        source.connect(outputAnalyserRef.current);
                        outputAnalyserRef.current.connect(outputAudioContext.destination);
                        
                        source.addEventListener('ended', () => {
                            sourcesRef.current.delete(source);
                            if (sourcesRef.current.size === 0 && isMounted) {
                                setStatus('LISTENING');
                            }
                        });

                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sourcesRef.current.add(source);
                    }

                    if (message.serverContent?.interrupted) {
                        sourcesRef.current.forEach(s => { s.stop(); sourcesRef.current.delete(s); });
                        nextStartTimeRef.current = 0;
                        setStatus('LISTENING');
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error(`Live session error (attempt ${retryCountRef.current + 1}):`, e);
                    sessionPromiseRef.current?.then(s => s.close()).catch(err => console.error("Error closing failed session:", err));

                    if (retryCountRef.current < maxRetries) {
                        retryCountRef.current++;
                        const delay = Math.pow(2, retryCountRef.current) * 1000; // 2s, 4s, 8s
                        if (isMounted) {
                            setStatus('ERROR');
                            const retryMessage = t('live.retrying', 'Connection error. Retrying in {{delay}}s... ({{current}}/{{max}})')
                                .replace('{{delay}}', (delay / 1000).toString())
                                .replace('{{current}}', retryCountRef.current.toString())
                                .replace('{{max}}', maxRetries.toString());
                            setErrorMessage(retryMessage);
                        }
                        setTimeout(attemptConnection, delay);
                    } else {
                        if (isMounted) {
                            setErrorMessage(t('live.retryFailed', 'Connection failed after multiple retries.'));
                            setStatus('ERROR');
                        }
                    }
                },
                onclose: (e: CloseEvent) => {
                    console.log('Live session closed.', e);
                    // Let the user-initiated disconnection or retry logic handle the UI state.
                },
            });

            sessionPromiseRef.current = sessionPromise;
        };

        attemptConnection();
    
        return () => {
            isMounted = false;
            cleanup();
        };
    }, [cleanup, t]);


    const statusText = isMuted
        ? t('live.muted')
        : {
            'CONNECTING': t('live.connecting'),
            'LISTENING': t('live.speakNow'),
            'THINKING': t('live.processing'),
            'SPEAKING': t('live.processing'),
            'ERROR': errorMessage,
        }[status];

    return (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl z-30 flex flex-col items-center justify-center p-4 fade-in-up crt-effect">
            <BackgroundParticles />
            <div className="w-full max-w-4xl h-full flex flex-col items-center justify-between py-8 z-10">
                
                <div className="text-center">
                    <h1 className="font-heading text-3xl font-bold text-primary tracking-widest uppercase text-glow-primary">
                        {t('chatInput.liveConversation')}
                    </h1>
                    <p className="font-code text-text-medium mt-2 h-6 transition-opacity duration-300">{statusText}</p>
                </div>
                
                <div className="w-full flex-1 my-4 overflow-y-auto custom-scrollbar p-4 flex flex-col justify-end">
                  <div className="w-full max-w-2xl mx-auto space-y-4 glassmorphism p-4 rounded-lg">
                    {transcriptions.map((turn, i) => (
                        <div key={i} className="transcription-line" style={{animationDelay: `${i*50}ms`}}>
                            <p className="text-green-400 font-heading text-lg">You: <span className="text-green-400 font-sans text-base font-medium">{turn.user}</span></p>
                            <p className="text-accent2 font-heading text-lg">Cognito: <span className="text-accent2 font-sans text-base font-medium">{turn.model}</span></p>
                        </div>
                    ))}
                    {currentUserTranscription && <p className="text-green-400 font-heading text-lg">You: <span className="text-text-medium italic font-sans text-base">{currentUserTranscription}</span><span className="inline-block w-0.5 h-4 bg-green-400 ml-1 animate-cursor-blink" /></p>}
                    {currentModelTranscription && <p className="text-accent2 font-heading text-lg">Cognito: <span className="text-text-medium italic font-sans text-base">{currentModelTranscription}</span><span className="inline-block w-0.5 h-4 bg-accent2 ml-1 animate-cursor-blink" /></p>}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-8">
                    <ExpertOrb status={status} analyser={activeAnalyser} />
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setIsMuted(prev => !prev)}
                            disabled={status === 'CONNECTING' || status === 'ERROR'}
                            className="p-4 rounded-full bg-input/50 text-text-medium border border-input-border hover:border-primary hover:text-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? <MicrophoneSlashIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-6 h-6" />}
                        </button>
                        <button onClick={handleClose} className="flex items-center gap-3 px-6 py-3 rounded-full text-lg font-bold bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/40 transition-all duration-300 neon-glow-button active">
                            <PowerIcon className="w-6 h-6" />
                            {t('live.disconnect')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveConversation;