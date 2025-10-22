// FIX: Import `useCallback` from React.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { startLiveConversation, encode, decode, decodeAudioData } from '../services/geminiService';
import { PowerIcon, MicrophoneIcon, MicrophoneSlashIcon } from './icons';
import type { LiveSession, LiveServerMessage, Blob } from '@google/genai';

interface LiveConversationProps {
    onClose: (transcript: { user: string, model: string }[]) => void;
    t: (key: string, fallback?: any) => any;
}

type ConnectionStatus = 'CONNECTING' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR';

// --- NEW: Cognitive Orb Component ---
const CognitiveOrb: React.FC<{ status: ConnectionStatus; userSpeaking: boolean }> = ({ status, userSpeaking }) => {
    const stateClass = `orb-state-${status.toLowerCase()}`;
    const speakingPulseStyle = {
      transform: `scale(${userSpeaking ? 1.1 : 1})`,
      boxShadow: userSpeaking ? '0 0 25px var(--accent1-glow)' : 'none'
    };

    return (
        <div className={`relative w-48 h-48 flex items-center justify-center transition-all duration-300 ${stateClass}`}>
            {/* Outer spinning ring */}
            <div className="live-orb-outer absolute inset-0 border-2 border-primary/20 rounded-full"></div>
             {/* Inner spinning ring */}
            <div className="live-orb-inner absolute inset-4 border-2 border-accent1/20 rounded-full"></div>
            {/* Central core with animated gradient and pulse */}
            <div className="live-orb absolute w-3/4 h-3/4 rounded-full bg-gradient-to-br from-accent1/30 to-primary/30" style={speakingPulseStyle}>
                 {/* Static icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-16 h-16 text-primary/80" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

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

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const thinkingTimeoutRef = useRef<number | null>(null);
    
    const cleanup = useCallback(() => {
        sessionPromiseRef.current?.then(session => session.close()).catch(e => console.error("Error closing session:", e));
        sessionPromiseRef.current = null;

        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
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
        const setup = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaStreamRef.current = stream;

                const sessionPromise = startLiveConversation({
                    onopen: () => {
                        console.log('Live session opened.');
                        setStatus('LISTENING');
                        
                        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        inputAudioContextRef.current = inputAudioContext;

                        const source = inputAudioContext.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

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
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
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
                            
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                            
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContext.destination);
                            
                            source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                                if (sourcesRef.current.size === 0) {
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
                        console.error('Live session error:', e);
                        setErrorMessage(t('live.error'));
                        setStatus('ERROR');
                        cleanup();
                    },
                    onclose: (e: CloseEvent) => {
                        console.log('Live session closed.');
                        onClose(transcriptions);
                    },
                });

                sessionPromiseRef.current = sessionPromise;
            } catch (err) {
                console.error("Failed to get user media:", err);
                setErrorMessage(t('live.micError'));
                setStatus('ERROR');
            }
        };

        setup();
        return () => cleanup();
    }, [cleanup, onClose, t]);

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
            <div className="live-bg-grid" />
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
                    <CognitiveOrb status={status} userSpeaking={isUserSpeaking} />
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
