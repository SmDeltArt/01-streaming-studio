// voice-recorder-manager.js
import { transcribeOnce, LiveSTT } from './stt-adapter.js';
export default class VoiceRecorderManager {
    constructor(app) {
        this.app = app;
        this.isRecording = false;
        this.isPreviewing = false;
        this.recordingStartTime = null;
        this.recordingTimer = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.currentAudio = null;
        
                this.recordingQuality = 'high'; // 'low', 'medium', 'high'
                this.audioFormat = 'webm'; // 'webm', 'mp4', 'wav'
        this.sampleRate = 48000; // Hz
                this.maxRecordingDuration = 310; // 5 minutes max
        
        this.voiceToTextAPI = null;
        this.textToSpeechAPI = null;
        this.voiceCloningAPI = null;
        this.userVoiceSample = null;
        
        this.initializeElements();
        this.bindEvents();
        this.initializeAIAPIs();
        this.setupDragging();
    }
    
    initializeElements() {
        this.voiceRecorderBtn = document.getElementById('voiceRecorderBtn');
        this.voicePanel = document.getElementById('voiceRecorderPanel');
        this.voicePanelCollapse = document.getElementById('voicePanelCollapse');
        this.voicePanelClose = document.getElementById('voicePanelClose');
        this.voicePanelExpand = document.getElementById('voicePanelExpand');
        
        // Recording controls
        this.voiceRecordBtn = document.getElementById('voiceRecordBtn');
        this.voiceRecordingStatus = document.getElementById('voiceRecordingStatus');
        this.voiceRecordingTimer = document.getElementById('voiceRecordingTimer');
        
        // Transcription controls
        this.voiceTranscriptionText = document.getElementById('voiceTranscriptionText');
        this.voiceEditTextBtn = document.getElementById('voiceEditTextBtn');
        this.voiceClearTextBtn = document.getElementById('voiceClearTextBtn');
        
        // Preview controls
        this.voicePreviewBtn = document.getElementById('voicePreviewBtn');
        this.voiceStopPreviewBtn = document.getElementById('voiceStopPreviewBtn');
        
        // Effects
        this.voiceAddEcho = document.getElementById('voiceAddEcho');
        this.voiceAddReverb = document.getElementById('voiceAddReverb');
        this.voiceEnhanceClarity = document.getElementById('voiceEnhanceClarity');
        
        this.voiceCloningProgress = document.getElementById('voiceCloningProgress');
        this.voiceCloningProgressBar = document.getElementById('voiceCloningProgressBar');
        this.voiceCloningStatus = document.getElementById('voiceCloningStatus');
        this.voiceCloningQuality = document.getElementById('voiceCloningQuality');
        
        // Actions
        this.voiceSaveToActiveBtn = document.getElementById('voiceSaveToActiveBtn');
        this.voiceExportBtn = document.getElementById('voiceExportBtn');
        this.voiceSettingsBtn = document.getElementById('voiceSettingsBtn');
    }
    // Clean/normalize a voice recording blob for training (48 kHz, mono) — no `function` keyword
normalizeForCloning = async (inputBlob) => {
  const arrayBuf = await inputBlob.arrayBuffer();
  const AC = window.AudioContext || window.webkitAudioContext;
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;

  const decoder = new AC();
  const srcBuf = await decoder.decodeAudioData(arrayBuf);

  const targetRate = 48000;
  const frames = Math.max(1, Math.ceil(srcBuf.duration * targetRate));
  const oc = new OAC(1, frames, targetRate);

  const src = oc.createBufferSource();
  src.buffer = srcBuf; // resampled to oc.sampleRate automatically

  const hp = oc.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 80;
  const comp = oc.createDynamicsCompressor();
  comp.threshold.value = -18; comp.knee.value = 6; comp.ratio.value = 2;
  comp.attack.value = 0.003; comp.release.value = 0.25;

  const outGain = oc.createGain(); outGain.gain.value = 1.2;

  src.connect(hp); hp.connect(comp); comp.connect(outGain); outGain.connect(oc.destination);
  src.start(0);

  const rendered = await oc.startRendering();

  // ---- inline WAV writer (mono, 16-bit) ----
  const ch = rendered.getChannelData(0);
  const wavBuf = new ArrayBuffer(44 + ch.length * 2);
  const view = new DataView(wavBuf);
  let off = 0;
  const wrStr = (s) => { for (let i = 0; i < s.length; i++) view.setUint8(off++, s.charCodeAt(i)); };
  const wrU32 = (v) => { view.setUint32(off, v, true); off += 4; };
  const wrU16 = (v) => { view.setUint16(off, v, true); off += 2; };

  wrStr('RIFF'); wrU32(36 + ch.length * 2); wrStr('WAVEfmt ');
  wrU32(16); wrU16(1); wrU16(1); wrU32(targetRate);
  wrU32(targetRate * 2); wrU16(2); wrU16(16);
  wrStr('data'); wrU32(ch.length * 2);

  for (let i = 0; i < ch.length; i++) {
    let s = Math.max(-1, Math.min(1, ch[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    off += 2;
  }

  await decoder.close();
  return new Blob([view], { type: 'audio/wav' });
};

    bindEvents() {
        if (!this.voiceRecorderBtn || !this.voicePanel) {
            console.warn('VoiceRecorderManager: Required DOM elements not found, skipping initialization');
            return;
        }

        try {
            this.voiceRecorderBtn.addEventListener('click', () => this.togglePanel());
            
            if (this.voicePanelCollapse) {
                this.voicePanelCollapse.addEventListener('click', () => this.toggleCollapse());
            }
            if (this.voicePanelExpand) {
                this.voicePanelExpand.addEventListener('click', () => this.toggleCollapse());
            }
            if (this.voicePanelClose) {
                this.voicePanelClose.addEventListener('click', () => this.hidePanel());
            }
            
            // Recording events
            if (this.voiceRecordBtn) {
                this.voiceRecordBtn.addEventListener('click', () => this.toggleRecording());
            }
            
            // Transcription events
            this.voiceEditTextBtn.addEventListener('click', () => this.enableTextEditing());
            this.voiceClearTextBtn.addEventListener('click', () => this.clearTranscription());
            
            // Preview events
            this.voicePreviewBtn.addEventListener('click', () => this.previewVoice());
            this.voiceStopPreviewBtn.addEventListener('click', () => this.stopPreview());
            
            // Action events - add null checks to prevent loading errors
            if (this.voiceSaveToActiveBtn) {
                this.voiceSaveToActiveBtn.addEventListener('click', () => this.saveToActiveItems());
            }
            if (this.voiceExportBtn) {
                this.voiceExportBtn.addEventListener('click', () => this.exportAudio());
            }
            if (this.voiceSettingsBtn) {
                this.voiceSettingsBtn.addEventListener('click', () => this.openSettings());
            }
            
            console.log('VoiceRecorderManager events bound successfully');
        } catch (error) {
            console.error('VoiceRecorderManager event binding error:', error);
        }
    }
    
    async initializeAIAPIs() {
        try {
            // Check for WebSim AI APIs
            if (typeof window.websim !== 'undefined') {
                if (window.websim.voiceToText) {
                    this.voiceToTextAPI = window.websim.voiceToText;
                    console.log('WebSim Voice-to-Text API available');
                }
                if (window.websim.textToSpeech) {
                    this.textToSpeechAPI = window.websim.textToSpeech;
                    console.log('WebSim Text-to-Speech API available');
                } else {
                    this.textToSpeechAPI = await this.createEnhancedTextToSpeech();
                    console.log('Enhanced Text-to-Speech API initialized');
                }
                if (window.websim.voiceCloning) {
                    this.voiceCloningAPI = window.websim.voiceCloning;
                    console.log('WebSim Voice Cloning API available');
                }
                if (window.websim.speechRecognition) {
                    this.speechRecognitionAPI = window.websim.speechRecognition;
                    console.log('WebSim Speech Recognition API available');
                }
                if (window.websim.voiceAnalysis) {
                    this.voiceAnalysisAPI = window.websim.voiceAnalysis;
                    console.log('WebSim Voice Analysis API available');
                }
            }
            
            // Fallback to standard APIs
            if (!this.voiceToTextAPI && 'webkitSpeechRecognition' in window) {
                this.voiceToTextAPI = this.createFallbackSpeechRecognition();
                console.log('Using Web Speech API fallback');
            }
            
            if (!this.textToSpeechAPI && 'speechSynthesis' in window) {
                this.textToSpeechAPI = await this.createEnhancedTextToSpeech();
                console.log('Using Enhanced Speech Synthesis API');
            }
            
            this.initializeVoiceStorage();
            
        } catch (error) {
            console.error('Error initializing AI APIs:', error);
            this.showError('AI API initialization failed', 'Some voice features may not work properly');
        }
    }

    initializeVoiceStorage() {
        try {
            // Load stored voice characteristics from localStorage
            const storedVoiceData = localStorage.getItem('websim_voice_characteristics');
            if (storedVoiceData) {
                this.voiceCharacteristics = JSON.parse(storedVoiceData);
                console.log('Loaded stored voice characteristics:', Object.keys(this.voiceCharacteristics).length, 'profiles');
            } else {
                this.voiceCharacteristics = {};
            }
            
            this.voiceSamples = JSON.parse(localStorage.getItem('websim_voice_samples') || '[]');
            console.log('Loaded voice samples:', this.voiceSamples.length, 'samples');
            
        } catch (error) {
            console.warn('Error loading voice storage:', error);
            this.voiceCharacteristics = {};
            this.voiceSamples = [];
        }
    }

    async analyzeVoiceCharacteristics(audioBlob) {
        try {
            if (this.voiceAnalysisAPI) {
                const analysis = await this.voiceAnalysisAPI(audioBlob);
                return {
                    pitch: analysis.averagePitch || 0,
                    tempo: analysis.speakingRate || 1.0,
                    tone: analysis.toneProfile || 'neutral',
                    accent: analysis.accentDetection || 'neutral',
                    voicePrint: analysis.voicePrint || null,
                    timestamp: Date.now()
                };
            } else {
                // Fallback analysis using Web Audio API
                return await this.fallbackVoiceAnalysis(audioBlob);
            }
        } catch (error) {
            console.warn('Voice analysis failed:', error);
            return {
                pitch: 0,
                tempo: 1.0, // Default tempo
                tone: 'neutral',
                accent: 'neutral',
                voicePrint: null,
                timestamp: Date.now()
            };
        }
    }

    async fallbackVoiceAnalysis(audioBlob) {
        return new Promise((resolve, reject) => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const fileReader = new FileReader();
                
                fileReader.onload = async (e) => {
                    try {
                        const arrayBuffer = e.target.result;
                        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                        
                        // Basic analysis
                        const channelData = audioBuffer.getChannelData(0);
                        let sum = 0;
                        let peak = 0;
                        
                        for (let i = 0; i < channelData.length; i++) {
                            const sample = Math.abs(channelData[i]);
                            sum += sample;
                            if (sample > peak) peak = sample;
                        }
                        
                        const avgAmplitude = sum / channelData.length;
                        const estimatedPitch = this.estimatePitch(channelData, audioBuffer.sampleRate);
                        
                        resolve({
                            pitch: estimatedPitch,
                            tempo: 1.0, // Default tempo
                            tone: avgAmplitude > 0.1 ? 'strong' : 'soft',
                            accent: 'neutral',
                            amplitude: avgAmplitude,
                            peak: peak,
                            duration: audioBuffer.duration,
                            timestamp: Date.now()
                        });
                    } catch (decodeError) {
                        console.warn('Audio decode error:', decodeError);
                        resolve({
                            pitch: 0,
                            tempo: 1.0,
                            tone: 'neutral',
                            accent: 'neutral',
                            timestamp: Date.now()
                        });
                    }
                };
                
                fileReader.onerror = () => {
                    resolve({
                        pitch: 0,
                        tempo: 1.0,
                        tone: 'neutral',
                        accent: 'neutral',
                        timestamp: Date.now()
                    });
                };
                
                fileReader.readAsArrayBuffer(audioBlob);
                
            } catch (error) {
                resolve({
                    pitch: 0,
                    tempo: 1.0,
                    tone: 'neutral',
                    accent: 'neutral',
                    timestamp: Date.now()
                });
            }
        });
    }

    estimatePitch(audioData, sampleRate) {
        try {
                        const minPeriod = Math.floor(sampleRate / 800); // 800 Hz max
            const maxPeriod = Math.floor(sampleRate / 80);  // 80 Hz min
            
            let bestOffset = -1;
            let bestCorrelation = 0;
            
            for (let offset = minPeriod; offset < maxPeriod; offset++) {
                let correlation = 0;
                let count = 0;
                
                for (let i = 0; i < audioData.length - offset; i++) {
                    correlation += Math.abs(audioData[i] - audioData[i + offset]);
                    count++;
                }
                
                correlation = 1 - (correlation / count);
                
                if (correlation > bestCorrelation) {
                    bestCorrelation = correlation;
                    bestOffset = offset;
                }
            }
            
            if (bestOffset > 0 && bestCorrelation > 0.3) {
                return sampleRate / bestOffset;
            }
            
            return 0; // No pitch detected
        } catch (error) {
            return 0;
        }
    }

    createFallbackSpeechRecognition() {
        return async (audioBlob, voiceProfile = null) => {
            return new Promise((resolve, reject) => {
                try {
                    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                    
                    recognition.continuous = true;
                    recognition.interimResults = true;
                    recognition.lang = 'en-US';
                    recognition.maxAlternatives = 3;
                    
                    if (voiceProfile && voiceProfile.accent !== 'neutral') {
                        const accentMap = {
                            'british': 'en-GB',
                            'australian': 'en-AU',
                            'canadian': 'en-CA',
                            'indian': 'en-IN',
                            'south_african': 'en-ZA'
                        };
                        recognition.lang = accentMap[voiceProfile.accent] || 'en-US';
                    }
                    
                    let finalTranscript = '';
                    let confidenceScores = [];
                    
                    recognition.onresult = (event) => {
                        for (let i = event.resultIndex; i < event.results.length; i++) {
                            const result = event.results[i];
                            if (result.isFinal) {
                                finalTranscript += result[0].transcript + ' ';
                                confidenceScores.push(result[0].confidence || 0.8);
                            }
                        }
                    };
                    
                    recognition.onend = () => {
                        const avgConfidence = confidenceScores.length > 0 
                            ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length 
                            : 0.5;
                            
                        resolve({ 
                            text: finalTranscript.trim() || 'Could not transcribe audio',
                            confidence: avgConfidence,
                            alternatives: []
                        });
                    };
                    
                    recognition.onerror = (event) => {
                        console.warn('Speech recognition error:', event.error);
                        reject(new Error(`Speech recognition error: ${event.error}`));
                    };
                    
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audio = new Audio(audioUrl);
                    
                    audio.onloadeddata = () => {
                        recognition.start();
                        audio.play().catch(error => {
                            console.warn('Audio playback for recognition failed:', error);
                            recognition.start(); // Start anyway
                        });
                    };
                    
                    audio.onended = () => {
                        URL.revokeObjectURL(audioUrl);
                        setTimeout(() => {
                            try {
                                recognition.stop();
                             } catch (e) {
                                // Recognition may already be stopped
                            }
                        }, 1000);
                    };
                    
                } catch (error) {
                    reject(error);
                }
            });
        };
    }

    async createEnhancedTextToSpeech() {
        return async (options) => {
            try {
                if (!options.text || !options.text.trim()) {
                    throw new Error('No text provided for speech synthesis');
                }

                if (typeof window.websim !== 'undefined' && window.websim.textToSpeech) {
                    const ttsOptions = {
                        text: options.text.trim(),
                        voice: options.voice || this.mapVoiceTypeToWebSimVoice(options.voiceType || 'en-male'),
                        speed: options.speed || 1.0,
                        volume: (options.volume || 70) / 100
                    };
                    
                    console.log('Using WebSim TTS with options:', ttsOptions);
                    
                    const result = await window.websim.textToSpeech(ttsOptions);
                    
                    if (result && result.url) {
                        const audio = new Audio(result.url);
                        audio.volume = Math.max(0, Math.min(1, ttsOptions.volume));
                        audio.playbackRate = Math.max(0.25, Math.min(4, ttsOptions.speed));
                        
                        this.currentPreviewAudio = audio;
                        
                        return new Promise((resolve, reject) => {
                            audio.onended = () => resolve({ success: true });
                            audio.onerror = () => reject(new Error('Audio playback failed'));
                            audio.play().catch(reject);
                        });
                    } else if (result && result.success !== false) {
                        return { success: true };
                    } else {
                        throw new Error(result?.error || 'WebSim TTS API returned no audio');
                    }
                }
                
                throw new Error('WebSim TTS API not available');
                
            } catch (error) {
                console.error('Primary TTS error:', error);
                
                return await this.createAdvancedFallbackTTS(options);
            }
        };
    }

    mapVoiceTypeToWebSimVoice(voiceType) {
        const voiceMapping = {
            'user-clone': 'en-male', // Will use user characteristics when cloning is ready
            'robotic': 'en-male',
            'cool-male': 'en-male', 
            'cool-female': 'en-female',
            'narrator': 'en-male',
            'whisper': 'en-female',
            'echo': 'en-male'
        };
        
        return voiceMapping[voiceType] || 'en-male';
    }

    async createAdvancedFallbackTTS(options) {
        try {
            if (!options || typeof options !== 'object') {
                throw new Error('Invalid TTS options provided');
            }
            
            if (!options.text || typeof options.text !== 'string' || !options.text.trim()) {
                throw new Error('No valid text provided for fallback TTS');
            }

            const sanitizedText = options.text.trim();
            if (sanitizedText.length > 32767) {
                throw new Error('Text too long for speech synthesis (max 32767 characters)');
            }

            if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
                                const maxRetryAttempts = 3;
                const retryDelay = 500;
                const speechTimeout = 15000;
                
                return new Promise((resolve, reject) => {
                    let attempts = 0;
                    
                    const attemptSpeech = () => {
                        attempts++;
                        
                        try {
                            speechSynthesis.cancel();
                            
                            setTimeout(() => speechSynthesis.cancel(), speechTimeout);
                            
                            const utterance = new SpeechSynthesisUtterance(sanitizedText);
                            
                            const voiceProfile = this.getBestVoiceProfile();
                            const voiceConfig = this.getVoiceConfigForType(options.voiceType || 'cool-male', voiceProfile);
                            
                            const voices = speechSynthesis.getVoices();
                            
                            if (voices.length === 0) {
                                if (attempts < maxRetryAttempts) {
                                    setTimeout(attemptSpeech, retryDelay);
                                    return;
                                }
                            } else {
                                const selectedVoice = this.selectBestVoice(voices, voiceConfig);
                                if (selectedVoice) {
                                    utterance.voice = selectedVoice;
                                    console.log('Selected fallback voice for', options.voiceType, ':', selectedVoice.name);
                                }
                            }
                            
                            const safeSpeed = options.speed && !isNaN(options.speed) ? 
                                Math.max(0.1, Math.min(10, options.speed)) : 1.0;
                            const safeVolume = options.volume && !isNaN(options.volume) ? 
                                Math.max(0, Math.min(100, options.volume)) / 100 : 0.8;
                            const safePitch = options.pitch && !isNaN(options.pitch) ? 
                                Math.max(0, Math.min(2, options.pitch)) : 1.0;
                            
                            utterance.rate = Math.max(0.1, Math.min(10, voiceConfig.rate * safeSpeed));
                            utterance.volume = Math.max(0, Math.min(1, safeVolume));
                            utterance.pitch = Math.max(0, Math.min(2, voiceConfig.pitch * safePitch));
                            
                            console.log('Fallback TTS settings applied:', {
                                rate: utterance.rate,
                                volume: utterance.volume,
                                pitch: utterance.pitch,
                                voiceType: options.voiceType
                            });
                            
                            let resolved = false;
                            
                            utterance.onend = () => {
                                if (!resolved) {
                                    resolved = true;
                                    console.log('Fallback TTS completed successfully');
                                    resolve({ success: true });
                                }
                            };
                            
                            utterance.onerror = (event) => {
                                if (!resolved) {
                                    resolved = true;
                                    console.error('Speech synthesis error:', event.error);
                                    if (attempts < maxRetryAttempts) {
                                        setTimeout(attemptSpeech, retryDelay);
                                    } else {
                                        reject(new Error(`Speech synthesis failed: ${event.error}`));
                                    }
                                }
                            };
                            
                            const startTimeout = setTimeout(() => {
                                if (!resolved) {
                                    resolved = true;
                                    if (attempts < maxRetryAttempts) {
                                        setTimeout(attemptSpeech, retryDelay);
                                    } else {
                                        reject(new Error('Speech synthesis timeout'));
                                    }
                                }
                            }, speechTimeout);
                            
                            utterance.onstart = () => {
                                clearTimeout(startTimeout);
                                console.log('Fallback TTS started reading text:', sanitizedText.substring(0, 50) + '...');
                            };
                            
                            speechSynthesis.speak(utterance);
                            
                        } catch (error) {
                            if (attempts < maxRetryAttempts) {
                                setTimeout(attemptSpeech, retryDelay);
                            } else {
                                reject(error);
                            }
                        }
                    };
                    
                    attemptSpeech();
                });
                
            } else {
                throw new Error('Speech synthesis not supported in this browser');
            }
        } catch (error) {
            console.error('Advanced fallback TTS error:', error);
            throw new Error(`Text-to-speech failed: ${error.message}`);
        }
    }

    getVoiceConfigForType(voiceType, voiceProfile = null) {
        const baseConfigs = {
            'user-clone': {
                keywords: ['natural', 'default', 'system'],
                pitch: voiceProfile?.pitch ? Math.max(0.5, Math.min(2, voiceProfile.pitch / 200)) : 1,
                rate: voiceProfile?.tempo || 1
            },
            'robotic': { 
                keywords: ['robot', 'synthetic', 'monotone', 'android'], 
                pitch: 0.5, 
                rate: 0.8 
            },
            'cool-male': { 
                keywords: ['male', 'david', 'alex', 'daniel', 'mark'], 
                pitch: 0.8, 
                rate: 1.1 
            },
            'cool-female': { 
                keywords: ['female', 'samantha', 'victoria', 'karen', 'anna'], 
                pitch: 1.2, 
                rate: 1.0 
            },
            'narrator': { 
                keywords: ['daniel', 'alex', 'narrator', 'thomas'], 
                pitch: 0.9, 
                rate: 0.85 
            },
            'whisper': { 
                keywords: ['soft', 'quiet', 'whisper'], 
                pitch: 0.7, 
                rate: 0.6 
            },
            'echo': { 
                keywords: ['echo', 'reverb', 'deep'], 
                pitch: 0.9, 
                rate: 0.9 
            }
        };
        
        return baseConfigs[voiceType] || baseConfigs['user-clone'];
    }

    selectBestVoice(voices, voiceConfig) {
        let bestMatch = null;
        let bestScore = 0;
        
        for (const voice of voices) {
            let score = 0;
            const voiceName = voice.name.toLowerCase();
            const voiceLang = voice.lang.toLowerCase();
            
            // Prefer English voices
            if (voiceLang.startsWith('en')) {
                score += 10;
            }
            
            // Prefer local voices over network voices
            if (voice.localService) {
                score += 5;
            }
            
            // Match keywords
            for (const keyword of voiceConfig.keywords) {
                if (voiceName.includes(keyword.toLowerCase())) {
                    score += 20;
                    break;
                }
            }
            
            // Prefer system voices over Google voices
            if (!voiceName.includes('google')) {
                score += 3;
            }
            
            // Prefer premium/natural sounding voices
            if (voiceName.includes('premium') || voiceName.includes('natural') || voiceName.includes('neural')) {
                score += 8;
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = voice;
            }
        }
        
        return bestMatch;
    }

    setupDragging() {
        const dragHandles = this.voicePanel.querySelectorAll('.voice-panel-header, .voice-panel-actions');
        let isDragging = false;
        let startX, startY, initialX, initialY;

        dragHandles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                if (e.target.tagName === 'BUTTON') return;
                isDragging = true;
                this.voicePanel.classList.add('dragging');

                startX = e.clientX;
                startY = e.clientY;

                const rect = this.voicePanel.getBoundingClientRect();
                initialX = rect.left;
                initialY = rect.top;

                e.preventDefault();
            });
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newX = initialX + deltaX;
            let newY = initialY + deltaY;
            
            const panelRect = this.voicePanel.getBoundingClientRect();
            const minVisibleArea = Math.min(panelRect.width, panelRect.height) * 0.1;
            
            newX = Math.max(-panelRect.width + minVisibleArea, 
                           Math.min(newX, window.innerWidth - minVisibleArea));
            newY = Math.max(-panelRect.height + minVisibleArea, 
                           Math.min(newY, window.innerHeight - minVisibleArea));
            
            this.voicePanel.style.left = `${newX}px`;
            this.voicePanel.style.top = `${newY}px`;
            this.voicePanel.style.transform = 'none';
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.voicePanel.classList.remove('dragging');
            }
        });
    }
    
    togglePanel() {
        if (this.voicePanel.style.display === 'block') {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }
    
    showPanel() {
        this.voicePanel.style.display = 'block';
    }
    
    hidePanel() {
        this.voicePanel.style.display = 'none';
        if (this.isRecording) {
            this.stopRecording();
        }
        if (this.isPreviewing) {
            this.stopPreview();
        }
    }
    
    toggleCollapse() {
        const isCollapsed = this.voicePanel.classList.contains('collapsed');
        if (isCollapsed) {
            this.voicePanel.classList.remove('collapsed');
            this.voicePanelCollapse.textContent = '−';
        } else {
            this.voicePanel.classList.add('collapsed');
            this.voicePanelCollapse.textContent = '+';
        }
    }
    
    async toggleRecording() {
        if (this.isRecording) {
            await this.stopRecording();
        } else {
            await this.startRecording();
        }
    }
    
    async startRecording() {
        try {
            this.updateStatus('Requesting microphone access...', 'loading');
            
            const audioConstraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: this.sampleRate,
                    channelCount: 1,
                    volume: 1.0
                }
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
            
            const mimeType = this.audioFormat === 'webm' ? 'audio/webm;codecs=opus' :
                           this.audioFormat === 'mp4' ? 'audio/mp4' : 'audio/wav';
            
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'audio/webm',
                audioBitsPerSecond: this.recordingQuality === 'high' ? 320000 : 
                                  this.recordingQuality === 'medium' ? 192000 : 96000
            });
            
            this.recordedChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = async () => {
                await this.processRecording();
            };
            
            this.mediaRecorder.start(1000); // Collect data every second
            
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            this.startRecordingTimer();
            
            this.voiceRecordBtn.querySelector('.voice-btn-icon').textContent = '⏹️';
            this.voiceRecordBtn.querySelector('.voice-btn-text').textContent = 'Stop Recording';
            this.voiceRecordBtn.classList.add('recording');
            
            this.updateStatus('Recording... Speak now!', 'recording');
            
            setTimeout(() => {
                if (this.isRecording) {
                    this.stopRecording();
                }
            }, this.maxRecordingDuration * 1000);
            
        } catch (error) {
            console.error('Error starting voice recording:', error);
            this.showError('Recording Error', 'Could not access microphone: ' + error.message);
            this.updateStatus('Recording failed', 'error');
        }
    }
    
    async stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;
        
        try {
            this.updateStatus('Stopping recording...', 'loading');
            
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Stop all tracks
            if (this.mediaRecorder.stream) {
                this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
            
            this.stopRecordingTimer();
            
            this.voiceRecordBtn.querySelector('.voice-btn-icon').textContent = '🎙️';
            this.voiceRecordBtn.querySelector('.voice-btn-text').textContent = 'Start Recording';
            this.voiceRecordBtn.classList.remove('recording');
            
        } catch (error) {
            console.error('Error stopping recording:', error);
            this.showError('Stop Error', 'Failed to stop recording properly');
        }
    }
    
    async processRecording() {
        try {
            if (this.recordedChunks.length === 0) {
                throw new Error('No audio data recorded');
            }
            
            this.updateStatus('Processing audio...', 'loading');
            
            const audioBlob = new Blob(this.recordedChunks, {
                type: this.mediaRecorder.mimeType
            });
            
            // Create URL for playback
            const audioUrl = URL.createObjectURL(audioBlob);
            const audioMetadata = {
                size: audioBlob.size,
                type: audioBlob.type,
                timestamp: Date.now(),
                duration: this.recordingStartTime ? (Date.now() - this.recordingStartTime) / 1000 : 0
            };
            
            this.currentRecordedVoiceMessage = {
                audioBlob: audioBlob,
                audioUrl: audioUrl,
                metadata: audioMetadata,
                timestamp: Date.now(),
                transcriptionText: null,
                transcriptionStatus: 'pending',
                isAvailableForPreview: true,
                effects: {
                    echo: this.voiceAddEcho ? this.voiceAddEcho.checked : false,
                    reverb: this.voiceAddReverb ? this.voiceAddReverb.checked : false,
                    clarity: this.voiceEnhanceClarity ? this.voiceEnhanceClarity.checked : false
                }
            };
            
            console.log('Recorded voice message stored for preview with effects:', audioMetadata);
            
            this.updateStatus('Analyzing voice characteristics...', 'loading');
            const voiceCharacteristics = await this.analyzeVoiceCharacteristics(audioBlob);
            
            // Store voice sample for future use
            const voiceSample = {
                id: Date.now().toString(),
                audioUrl: audioUrl,
                audioBlob: audioBlob,
                characteristics: voiceCharacteristics,
                metadata: audioMetadata,
                timestamp: Date.now()
            };
            
            this.voiceSamples.push(voiceSample);
            
            // Keep only the most recent 10 samples to manage storage
            if (this.voiceSamples.length > 10) {
                const oldSample = this.voiceSamples.shift();
                if (oldSample.audioUrl && oldSample.audioUrl !== audioUrl) {
                    URL.revokeObjectURL(oldSample.audioUrl);
                }
            }
            
            // Update stored voice characteristics (running average)
            this.updateVoiceCharacteristics(voiceCharacteristics);
            
            // Store for voice cloning if this is a good sample
            if (voiceCharacteristics.duration > 2 && !this.userVoiceSample) {
                this.userVoiceSample = voiceSample;
                console.log('High-quality voice sample stored for cloning');
            }
            
             let transcriptionText = 'Manual transcription required';
             let transcriptionSuccess = false;

             this.updateStatus('Transcribing…', 'loading');
             try {
                // 1) Prefer Websim (or your HTTP) via adapter
                const firstTry = await transcribeOnce(audioBlob, { lang: this.lang || 'en' });
                if (firstTry.text && firstTry.text.trim()) {
                    transcriptionText = firstTry.text.trim();
                    transcriptionSuccess = true;
                    this.currentRecordedVoiceMessage.transcriptionSource = firstTry.source; // 'websim' | 'http'
                    this.currentRecordedVoiceMessage.transcriptionConfidence = 0.7;
                } else if (typeof this.speechRecognitionAPI === 'function' || typeof this.voiceToTextAPI === 'function') {
                    // 2) Final fallback: your in-file browser speech recognizer
                    this.updateStatus('Trying browser speech recognition…', 'loading');
                    let res;
                    if (typeof this.speechRecognitionAPI === 'function') {
                        res = await this.speechRecognitionAPI(audioBlob, this.getBestVoiceProfile && this.getBestVoiceProfile());
                    } else {    
                        res = await this.voiceToTextAPI(audioBlob, this.getBestVoiceProfile && this.getBestVoiceProfile());
                    }
                    if (res && res.text && res.text.trim()) {
                        transcriptionText = res.text.trim();
                        transcriptionSuccess = true;
                        this.currentRecordedVoiceMessage.transcriptionSource = 'webspeech';
                        this.currentRecordedVoiceMessage.transcriptionConfidence = res.confidence ?? 0.6;
                    } else {
                        transcriptionText = firstTry.hint || 'Transcription unavailable.';
                        this.currentRecordedVoiceMessage.transcriptionStatus = firstTry.error ? 'failed' : 'api_unavailable';
                        this.currentRecordedVoiceMessage.transcriptionError = firstTry.error || 'NO_STT_AVAILABLE';
                    }
                }
             } catch (e) {
                        console.error('Transcription error (audio preserved):', e);
                        transcriptionText = 'Transcription failed - audio available for replay';
                        this.currentRecordedVoiceMessage.transcriptionStatus = 'failed';
                        this.currentRecordedVoiceMessage.transcriptionError = e.message || String(e);
                    }
                    this.currentRecordedVoiceMessage.transcriptionText = transcriptionText;
                    if (transcriptionSuccess) this.currentRecordedVoiceMessage.transcriptionStatus = 'success';

                    if (this.voiceTranscriptionText) {
                     this.voiceTranscriptionText.value = transcriptionText;
                     this.voiceTranscriptionText.disabled = false;
                    }
                    this.updateStatus(
                      transcriptionSuccess
                      ? 'Recording and transcription completed successfully'
                      : 'Recording completed - audio ready for replay (transcription failed)',
                      'ready'   
                 );
            
            this.saveVoiceData();
            
            this.updatePreviewModeUI();
            
            if (transcriptionSuccess && transcriptionText && transcriptionText.trim()) {
                // Transfer to text display manager with voice settings
                if (this.app.textDisplayManager && this.app.textDisplayManager.setTranscribedText) {
                    const currentVoiceSettings = this.getCurrentVoiceSettings();
                    this.app.textDisplayManager.setTranscribedText(transcriptionText, currentVoiceSettings);
                    
                    console.log('Transcribed text automatically transferred to text display manager');
                    this.updateStatus('Text transferred to Text Display - ready for speech', 'ready');
                } else {
                    console.warn('Text display manager not available for automatic transfer');
                }
            }
            
        } catch (error) {
            console.error('Error processing recording:', error);
            
            if (this.recordedChunks.length > 0) {
                try {
                    // Even on error, try to save the raw audio
                    const emergencyBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
                    const emergencyUrl = URL.createObjectURL(emergencyBlob);
                    
                    this.currentRecordedVoiceMessage = {
                        audioBlob: emergencyBlob,
                        audioUrl: emergencyUrl,
                        metadata: {
                            size: emergencyBlob.size,
                            type: 'audio/webm',
                            timestamp: Date.now(),
                            duration: this.recordingStartTime ? (Date.now() - this.recordingStartTime) / 1000 : 0
                        },
                        transcriptionText: 'Processing failed - audio available for manual playback',
                        transcriptionStatus: 'processing_failed',
                        processingError: error.message,
                        effects: {
                            echo: this.voiceAddEcho ? this.voiceAddEcho.checked : false,
                            reverb: this.voiceAddReverb ? this.voiceAddReverb.checked : false,
                            clarity: this.voiceEnhanceClarity ? this.voiceEnhanceClarity.checked : false
                        }
                    };
                    
                    this.voiceTranscriptionText.value = 'Processing failed - audio available for manual playback';
                    this.updatePreviewModeUI();
                    
                    console.log('Emergency audio preservation successful');
                } catch (emergencyError) {
                    console.error('Emergency audio preservation failed:', emergencyError);
                }
            }
            
            this.showError('Processing Error', 'Failed to process recording fully, but audio may be preserved: ' + error.message);
            this.updateStatus('Processing failed - check for preserved audio', 'error');
        }
    }

    updateVoiceCharacteristics(newCharacteristics) {
        try {
            const userId = 'default';
            
            if (!this.voiceCharacteristics[userId]) {
                this.voiceCharacteristics[userId] = {
                    samples: 0,
                    avgPitch: 0,
                    avgTempo: 0,
                    commonTone: 'neutral',
                    accent: 'neutral',
                    lastUpdated: Date.now(),
                    totalDuration: 0,
                    quality: 'poor'
                };
            }
            
            const profile = this.voiceCharacteristics[userId];
            const sampleCount = profile.samples + 1;
            
            // Update running averages with safety checks
            profile.avgPitch = ((profile.avgPitch * profile.samples) + (newCharacteristics.pitch || 0)) / sampleCount;
            profile.avgTempo = ((profile.avgTempo * profile.samples) + (newCharacteristics.tempo || 1)) / sampleCount;
            
            // Track total duration for cloning progress
            if (newCharacteristics.duration && !isNaN(newCharacteristics.duration)) {
                profile.totalDuration += newCharacteristics.duration;
            }
            
            // Update tone if consistent
            if (newCharacteristics.tone === profile.commonTone || profile.samples < 3) {
                profile.commonTone = newCharacteristics.tone || 'neutral';
            }
            
            // Update accent if detected consistently
            if (newCharacteristics.accent && newCharacteristics.accent !== 'neutral' && profile.samples < 5) {
                profile.accent = newCharacteristics.accent;
            }
            
            profile.samples = sampleCount;
            profile.lastUpdated = Date.now();
            
                        const minDurationForCloning = 30; // 30 seconds minimum
            const minSamplesForCloning = 3; // 3 samples minimum (reduced for better UX)
            const idealDuration = 120; // 2 minutes ideal
            const excellentDuration = 180; // 3 minutes for excellent
            
            let quality = 'poor';
            let progress = 0;
            
            // Base progress calculation with safety checks
            const durationProgress = Math.min(100, (profile.totalDuration / minDurationForCloning) * 50);
            const samplesProgress = Math.min(50, (profile.samples / minSamplesForCloning) * 50);
            
            // Ensure no NaN values
            const safeDurationProgress = isNaN(durationProgress) ? 0 : durationProgress;
            const safeSamplesProgress = isNaN(samplesProgress) ? 0 : samplesProgress;
            
            progress = Math.min(100, safeDurationProgress + safeSamplesProgress);
            
            // Quality assessment with improved thresholds
            if (profile.totalDuration >= minDurationForCloning && profile.samples >= minSamplesForCloning) {
                quality = 'basic';
                
                if (profile.totalDuration >= 60 && profile.samples >= 5) {
                    quality = 'good';
                    progress = Math.min(85, 60 + ((profile.totalDuration - 60) / 60) * 25);
                }
                
                if (profile.totalDuration >= idealDuration && profile.samples >= 8) {
                    quality = 'excellent';
                    progress = Math.min(100, 85 + ((profile.totalDuration - idealDuration) / (excellentDuration - idealDuration)) * 15);
                }
            } else {
                // Early progress for encouraging users
                progress = Math.min(40, safeDurationProgress * 0.6 + safeSamplesProgress * 0.4);
            }
            
            // Ensure progress is never NaN and is within bounds
            progress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
            
            profile.quality = quality;
            profile.cloningProgress = progress;
            
            this.updateCloningProgressUI(progress, quality, profile.totalDuration, profile.samples);
            
            console.log('Updated voice profile:', profile);
            
        } catch (error) {
            console.warn('Error updating voice characteristics:', error);
            // Fallback to prevent UI issues
            this.updateCloningProgressUI(0, 'poor', 0, 0);
        }
    }

    updateCloningProgressUI(progress, quality, totalDuration, sampleCount) {
        if (this.voiceCloningProgressBar) {
            this.voiceCloningProgressBar.style.width = `${Math.max(2, progress)}%`; // Minimum 2% for visibility
            
            // Update progress bar color based on quality with smooth transitions
            const colorMap = {
                poor: '#e74c3c',
                basic: '#f39c12', 
                good: '#f1c40f',
                excellent: '#27ae60'
            };
            this.voiceCloningProgressBar.style.background = colorMap[quality] || '#e74c3c';
            this.voiceCloningProgressBar.style.transition = 'width 0.3s ease, background 0.3s ease';
        }
        
        if (this.voiceCloningStatus) {
            const durationText = totalDuration > 0 ? ` (${Math.floor(totalDuration)}s recorded)` : '';
            const samplesText = sampleCount > 0 ? ` - ${sampleCount} samples` : '';
            this.voiceCloningStatus.textContent = `Voice Cloning: ${Math.floor(progress)}%${durationText}${samplesText}`;
        }
        
        if (this.voiceCloningQuality) {
            const qualityMessages = {
                poor: progress === 0 ? 'Start recording to begin voice analysis' : 
                      progress < 10 ? 'Keep recording - analyzing voice patterns...' :
                      progress < 25 ? `Making progress - ${Math.floor(30 - totalDuration)}s more needed` :
                      'Almost ready - record a few more samples',
                basic: progress < 60 ? 'Basic voice model ready - record more for better quality' : 
                       'Good foundation - continue for enhanced cloning',
                good: progress < 85 ? 'High quality voice model - excellent progress!' : 
                      'Near perfect - just a bit more for excellence',
                excellent: 'Premium voice clone ready - perfect quality achieved!'
            };
            
            this.voiceCloningQuality.textContent = qualityMessages[quality] || 'Analyzing voice patterns...';
            
            // Update CSS class for styling
            this.voiceCloningQuality.className = `cloning-quality voice-quality-${quality}`;
        }
        
        if (this.voiceType && quality !== 'poor') {
            const userCloneOption = this.voiceType.querySelector('option[value="user-clone"]');
            if (userCloneOption) {
                userCloneOption.disabled = false;
                const qualityLabels = {
                    basic: 'Basic Clone',
                    good: 'Good Clone', 
                    excellent: 'Premium Clone'
                };
                userCloneOption.textContent = `Your Voice (${qualityLabels[quality] || 'Ready'}) - ${Math.floor(progress)}%`;
            }
        }
        
        if (progress >= 25 && progress < 26) {
            console.log('🎯 Voice cloning milestone: 25% complete!');
        } else if (progress >= 50 && progress < 51) {
            console.log('🎯 Voice cloning milestone: 50% complete - voice model getting stronger!');
        } else if (progress >= 75 && progress < 76) {
            console.log('🎯 Voice cloning milestone: 75% complete - excellent quality achieved!');
        } else if (progress >= 100 && quality === 'excellent') {
            console.log('🎉 Voice cloning complete: Premium quality voice clone ready!');
        }
    }

    saveVoiceData() {
        try {
            // Save voice characteristics (lightweight data)
            localStorage.setItem('websim_voice_characteristics', JSON.stringify(this.voiceCharacteristics));
            
            const samplesMetadata = this.voiceSamples.map(sample => ({
                id: sample.id,
                characteristics: sample.characteristics,
                metadata: sample.metadata,
                timestamp: sample.timestamp
                // Note: audioUrl and audioBlob are not persisted
            }));
            
            localStorage.setItem('websim_voice_samples', JSON.stringify(samplesMetadata));
            
            console.log('Voice data saved successfully');
            
        } catch (error) {
            console.warn('Error saving voice data:', error);
        }
    }

    getBestVoiceProfile() {
        try {
            const userId = 'default';
            const profile = this.voiceCharacteristics[userId];
            
            if (!profile || profile.samples < 2) {
                return null; // Not enough data
            }
            
            return {
                pitch: profile.avgPitch,
                tempo: profile.avgTempo,
                tone: profile.commonTone,
                accent: profile.accent,
                confidence: Math.min(0.9, profile.samples / 10) // Confidence based on sample count
            };
            
        } catch (error) {
            console.warn('Error getting voice profile:', error);
            return null;
        }
    }
    
    startRecordingTimer() {
        this.voiceRecordingTimer.style.display = 'block';
        this.recordingTimer = setInterval(() => {
            if (this.recordingStartTime) {
                const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
                const seconds = (elapsed % 60).toString().padStart(2, '0');
                this.voiceRecordingTimer.textContent = `${minutes}:${seconds}`;
            }
        }, 1000);
    }
    
    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        this.voiceRecordingTimer.style.display = 'none';
    }
    
    enableTextEditing() {
        this.voiceTranscriptionText.disabled = false;
        this.voiceTranscriptionText.focus();
        this.voiceEditTextBtn.textContent = '✅ Done';
    }
    
    clearTranscription() {
        this.voiceTranscriptionText.value = '';
    }
    
    updatePreviewModeUI() {
        if (!this.voicePreviewBtn) return;
        
        const hasRecordedAudio = this.currentRecordedVoiceMessage && this.currentRecordedVoiceMessage.audioBlob;
        
        if (hasRecordedAudio) {
            this.voicePreviewBtn.innerHTML = '🎙️ Preview Recorded Voice';
            this.voicePreviewBtn.title = 'Play your recorded voice message with effects';
            this.voicePreviewBtn.disabled = false;
        } else {
            this.voicePreviewBtn.innerHTML = '🎙️ No Recording Available';
            this.voicePreviewBtn.title = 'Record a voice message first';
            this.voicePreviewBtn.disabled = true;
        }
        
        console.log(`Preview UI updated: has recorded audio: ${hasRecordedAudio}`);
    }
    
    async previewVoice() {
        try {
            this.isPreviewing = true;
            this.voicePreviewBtn.style.display = 'none';
            this.voiceStopPreviewBtn.style.display = 'inline-block';
            
            const hasRecordedAudio = this.currentRecordedVoiceMessage && this.currentRecordedVoiceMessage.audioBlob;
            
            if (hasRecordedAudio) {
                console.log('Playing recorded voice message with effects');
                await this.previewRecordedVoiceWithEffects();
            } else {
                throw new Error('No recorded voice message available - please record something first');
            }
            
        } catch (error) {
            console.error('Preview error:', error);
            this.showError('Preview Error', 'Could not preview voice: ' + error.message);
            this.stopPreview();
        }
    }

    async previewRecordedVoiceWithEffects() {
        if (!this.currentRecordedVoiceMessage || !this.currentRecordedVoiceMessage.audioBlob) {
            throw new Error('No recorded voice message available');
        }
        
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Resume context if suspended (required by some browsers)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            const arrayBuffer = await this.currentRecordedVoiceMessage.audioBlob.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            let currentNode = source;
            
            const effectSettings = {
                echo: this.voiceAddEcho ? this.voiceAddEcho.checked : false,
                reverb: this.voiceAddReverb ? this.voiceAddReverb.checked : false,
                clarity: this.voiceEnhanceClarity ? this.voiceEnhanceClarity.checked : false
            };
            
            if (effectSettings.echo) {
                const delay = this.audioContext.createDelay(0.5);
                const feedback = this.audioContext.createGain();
                const wetGain = this.audioContext.createGain();
                
                delay.delayTime.setValueAtTime(0.3, this.audioContext.currentTime);
                feedback.gain.setValueAtTime(0.4, this.audioContext.currentTime);
                wetGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                
                currentNode.connect(delay);
                delay.connect(feedback);
                feedback.connect(delay);
                delay.connect(wetGain);
                wetGain.connect(this.audioContext.destination);
                
                console.log('Echo effect applied to recorded voice preview');
            }
            
            if (effectSettings.reverb) {
                const convolver = this.audioContext.createConvolver();
                const reverbGain = this.audioContext.createGain();
                
                // Create impulse response for reverb
                convolver.buffer = this.createReverbImpulse(2, 2, false);
                reverbGain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
                
                currentNode.connect(convolver);
                convolver.connect(reverbGain);
                reverbGain.connect(this.audioContext.destination);
                
                console.log('Reverb effect applied to recorded voice preview');
            }
            
            if (effectSettings.clarity) {
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'highshelf';
                filter.frequency.setValueAtTime(3000, this.audioContext.currentTime);
                filter.gain.setValueAtTime(6, this.audioContext.currentTime);
                
                currentNode.connect(filter);
                currentNode = filter;
                
                console.log('Clarity enhancement applied to recorded voice preview');
            }
            
            // Connect final node to destination
            currentNode.connect(this.audioContext.destination);
            
            // Store source reference for stopping
            this.currentAudioSource = source;
            
            source.onended = () => {
                this.stopPreview();
            };
            
            source.start(0);
            console.log('Recorded voice message preview started with Web Audio API effects');
            
        } catch (error) {
            console.error('Web Audio API effects error, falling back to simple playback:', error);
            
            const audio = new Audio(this.currentRecordedVoiceMessage.audioUrl);
            audio.volume = 0.8;
            audio.playbackRate = 1.0;
            
            this.currentPreviewAudio = audio;
            
            audio.onended = () => {
                this.stopPreview();
            };
            
            audio.onerror = (error) => {
                throw new Error('Failed to play recorded voice message');
            };
            
            await audio.play();
            console.log('Fallback audio playback started (effects not applied)');
        }
    }

    createReverbImpulse(duration, decay, reverse) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const n = reverse ? length - i : i;
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
            }
        }
        
        return impulse;
    }

    async applyEffectsToAudioBlob(audioBlob, effects) {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Create offline context for processing
            const offlineContext = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );
            
            const source = offlineContext.createBufferSource();
            source.buffer = audioBuffer;
            let currentNode = source;
            
            if (effects.addEcho) {
                const delay = offlineContext.createDelay(0.5);
                const feedback = offlineContext.createGain();
                const wetGain = offlineContext.createGain();
                const dryGain = offlineContext.createGain();
                
                delay.delayTime.setValueAtTime(0.3, 0);
                feedback.gain.setValueAtTime(0.4, 0);
                wetGain.gain.setValueAtTime(0.3, 0);
                dryGain.gain.setValueAtTime(0.7, 0);
                
                currentNode.connect(delay);
                delay.connect(feedback);
                feedback.connect(delay);
                delay.connect(wetGain);
                
                const merger = offlineContext.createChannelMerger();
                currentNode.connect(dryGain);
                dryGain.connect(merger);
                wetGain.connect(merger);
                currentNode = merger;
            }
            
            if (effects.addReverb) {
                const convolver = offlineContext.createConvolver();
                const reverbGain = offlineContext.createGain();
                const dryGain = offlineContext.createGain();
                
                convolver.buffer = this.createOfflineReverbImpulse(offlineContext, 2, 2);
                reverbGain.gain.setValueAtTime(0.4, 0);
                dryGain.gain.setValueAtTime(0.6, 0);
                
                const merger = offlineContext.createChannelMerger();
                currentNode.connect(convolver);
                convolver.connect(reverbGain);
                reverbGain.connect(merger);
                
                currentNode.connect(dryGain);
                dryGain.connect(merger);
                currentNode = merger;
            }
            
            if (effects.addClarity) {
                const filter = offlineContext.createBiquadFilter();
                filter.type = 'highshelf';
                filter.frequency.setValueAtTime(3000, 0);
                filter.gain.setValueAtTime(6, 0);
                
                currentNode.connect(filter);
                currentNode = filter;
            }
            
            currentNode.connect(offlineContext.destination);
            source.start(0);
            
            const processedBuffer = await offlineContext.startRendering();
            
            // Convert back to blob
            const processedBlob = await this.audioBufferToBlob(processedBuffer);
            return processedBlob;
            
        } catch (error) {
            console.error('Error applying effects to audio blob:', error);
            // Return original blob if processing fails
            return audioBlob;
        }
    }

    createOfflineReverbImpulse(offlineContext, duration, decay) {
        const sampleRate = offlineContext.sampleRate;
        const length = sampleRate * duration;
        const impulse = offlineContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        
        return impulse;
    }

    async audioBufferToBlob(audioBuffer) {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const format = 'audio/wav';
        
        // Create WAV file
        const length = audioBuffer.length;
        const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * numberOfChannels * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numberOfChannels * 2, true);
        view.setUint16(32, numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * numberOfChannels * 2, true);
        
        // Convert float samples to 16-bit PCM
        const offset = 44;
        let pos = 0;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
                view.setInt16(offset + pos, sample * 0x7FFF, true);
                pos += 2;
            }
        }
        
        return new Blob([arrayBuffer], { type: format });
    }

    async saveToActiveItems() {
        try {
            const text = this.voiceTranscriptionText ? this.voiceTranscriptionText.value.trim() : '';
            
            const currentEffects = {
                addEcho: this.voiceAddEcho ? this.voiceAddEcho.checked : false,
                addReverb: this.voiceAddReverb ? this.voiceAddReverb.checked : false,
                enhanceClarity: this.voiceEnhanceClarity ? this.voiceEnhanceClarity.checked : false
            };
            
            let audioBlob = null;
            let voiceMessageContent = '';
            
            if (this.currentRecordedVoiceMessage && this.currentRecordedVoiceMessage.audioBlob) {
                // Apply effects to recorded audio before saving
                if (currentEffects.addEcho || currentEffects.addReverb || currentEffects.enhanceClarity) {
                    audioBlob = await this.applyEffectsToAudioBlob(this.currentRecordedVoiceMessage.audioBlob, currentEffects);
                } else {
                    audioBlob = this.currentRecordedVoiceMessage.audioBlob;
                }
                voiceMessageContent = this.currentRecordedVoiceMessage.transcriptionText || 'Recorded voice message';
                console.log('Using recorded audio with effects applied for active items');
            } else {
                // Fallback: generate TTS if no recorded audio available
                if (!text) {
                    throw new Error('No recorded audio or text available to save');
                }
                
                voiceMessageContent = text;
                
                if (this.textToSpeechAPI) {
                    this.updateStatus('Generating voice audio for storage...', 'loading');
                    
                    let voiceSettings;
                    try {
                        voiceSettings = this.getCurrentVoiceSettings();
                        voiceSettings.text = text;
                    } catch (settingsError) {
                        console.warn('Error getting voice settings for TTS generation:', settingsError);
                        voiceSettings = {
                            text: text,
                            voiceType: 'cool-male',
                            speed: 1.0,
                            volume: 80,
                            pitch: 1.0
                        };
                    }
                    
                    const audioResult = await this.textToSpeechAPI(voiceSettings);
                    
                    if (audioResult && (audioResult.audioBlob || audioResult.url)) {
                        audioBlob = audioResult.audioBlob || (await fetch(audioResult.url).then(r => r.blob()));
                    }
                }
            }
            
            const voiceMessage = {
                text: voiceMessageContent,
                voiceSettings: (() => {
                    try {
                        const settings = this.getCurrentVoiceSettings();
                        return {
                            ...settings,
                            addEcho: currentEffects.addEcho,
                            addReverb: currentEffects.addReverb,
                            enhanceClarity: currentEffects.enhanceClarity
                        };
                    } catch (error) {
                        console.warn('Using fallback voice settings for active item:', error);
                        return {
                            voiceType: 'cool-male',
                            speed: 1.0,
                            volume: 80,
                            pitch: 1.0,
                            addEcho: currentEffects.addEcho,
                            addReverb: currentEffects.addReverb,
                            enhanceClarity: currentEffects.enhanceClarity
                        };
                    }
                })(),
                audioBlob: audioBlob,
                timestamp: Date.now(),
                type: 'voice-message',
                isRecordedAudio: !!(this.currentRecordedVoiceMessage && this.currentRecordedVoiceMessage.audioBlob),
                recordingMetadata: this.currentRecordedVoiceMessage ? this.currentRecordedVoiceMessage.metadata : null,
                transcriptionStatus: this.currentRecordedVoiceMessage ? this.currentRecordedVoiceMessage.transcriptionStatus : 'generated',
                appliedEffects: {
                    echo: currentEffects.addEcho,
                    reverb: currentEffects.addReverb,
                    clarity: currentEffects.enhanceClarity,
                    timestamp: Date.now()
                }
            };
            
            if (this.app.uiManager && this.app.uiManager.addActiveItem) {
                const shortText = voiceMessageContent.length > 30 ? voiceMessageContent.substring(0, 30) + '...' : voiceMessageContent;
                let effectsLabel = '';
                if (currentEffects.addEcho) effectsLabel += '🔊';
                if (currentEffects.addReverb) effectsLabel += '🎭';
                if (currentEffects.enhanceClarity) effectsLabel += '✨';
                
                const displayText = voiceMessage.isRecordedAudio ? 
                    `🎙️ ${shortText}${effectsLabel ? ' ' + effectsLabel : ''}` : 
                    `🔊 ${shortText}${effectsLabel ? ' ' + effectsLabel : ''}`;
                
                const activeItemId = this.app.uiManager.addActiveItem('voice', displayText, null, voiceMessage);
                
                console.log('Voice message saved to active items with effects:', {
                    id: activeItemId,
                    recordedAudio: voiceMessage.isRecordedAudio,
                    effects: currentEffects
                });
                
                this.updateStatus('Voice message with effects added to Active Items panel', 'ready');
                
                if (text && this.app.textDisplayManager && this.app.textDisplayManager.setTranscribedText) {
                    const currentVoiceSettings = this.getCurrentVoiceSettings();
                    this.app.textDisplayManager.setTranscribedText(text, currentVoiceSettings);
                    console.log('Text also transferred to Text Display Manager for enhanced speech functionality');
                }
                
            } else {
                throw new Error('Active items system not available');
            }
            
        } catch (error) {
            console.error('Error in save to active items:', error);
            this.showError('Save Error', 'Failed to save to active items: ' + error.message);
        }
    }
    
    async exportAudio() {
        try {
            if (this.currentRecordedVoiceMessage && this.currentRecordedVoiceMessage.audioBlob) {
                // Export recorded audio with effects
                this.updateStatus('Applying effects to recorded audio for export...', 'loading');
                
                const currentEffects = {
                    addEcho: this.voiceAddEcho ? this.voiceAddEcho.checked : false,
                    addReverb: this.voiceAddReverb ? this.voiceAddReverb.checked : false,
                    enhanceClarity: this.voiceEnhanceClarity ? this.voiceEnhanceClarity.checked : false
                };
                
                let exportBlob;
                if (currentEffects.addEcho || currentEffects.addReverb || currentEffects.enhanceClarity) {
                    exportBlob = await this.applyEffectsToAudioBlob(this.currentRecordedVoiceMessage.audioBlob, currentEffects);
                } else {
                    exportBlob = this.currentRecordedVoiceMessage.audioBlob;
                }
                
                const link = document.createElement('a');
                link.href = URL.createObjectURL(exportBlob);
                link.download = `recorded-voice-message-${new Date().toISOString().slice(0, 10)}.webm`;
                link.click();
                
                setTimeout(() => URL.revokeObjectURL(link.href), 100);
                this.updateStatus('Recorded audio with effects exported successfully', 'ready');
                return;
            }
            
            // Fallback to TTS export if no recorded audio
            const text = this.voiceTranscriptionText.value.trim();
            if (!text) {
                this.showError('Export Error', 'No recorded audio or text to export.');
                return;
            }
            
            this.updateStatus('Generating audio for export...', 'loading');
            
            const voiceSettings = this.getVoiceSettings();
            voiceSettings.text = text;
            
            if (this.textToSpeechAPI) {
                const audioResult = await this.textToSpeechAPI(voiceSettings);
                
                if (audioResult.audioBlob || audioResult.url) {
                    const blob = audioResult.audioBlob || (await fetch(audioResult.url).then(r => r.blob()));
                    
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `voice-message-${new Date().toISOString().slice(0, 10)}.mp3`;
                    link.click();
                    
                    setTimeout(() => URL.revokeObjectURL(link.href), 100);
                    this.updateStatus('Audio exported successfully', 'ready');
                } else {
                    throw new Error('No audio generated');
                }
            } else {
                throw new Error('Text-to-Speech API not available');
            }
            
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Export Error', 'Failed to export audio: ' + error.message);
        }
    }
    
    getVoiceSettings() {
        // Return basic settings for recorded audio playback
        return {
            volume: 80,
            speed: 1.0,
            addEcho: this.voiceAddEcho ? this.voiceAddEcho.checked : false,
            addReverb: this.voiceAddReverb ? this.voiceAddReverb.checked : false,
            enhanceClarity: this.voiceEnhanceClarity ? this.voiceEnhanceClarity.checked : false
        };
    }

    getCurrentVoiceSettings() {
        const effectSettings = {
            addEcho: this.voiceAddEcho ? this.voiceAddEcho.checked : false,
            addReverb: this.voiceAddReverb ? this.voiceAddReverb.checked : false,
            enhanceClarity: this.voiceEnhanceClarity ? this.voiceEnhanceClarity.checked : false
        };

        return {
            voiceType: 'cool-male', // Default voice type for compatibility
            speed: 1.0,
            volume: 80,
            pitch: 1.0,
            ...effectSettings
        };
    }
    
    openSettings() {
        // TODO: Implement advanced settings modal
        alert('Advanced voice settings coming soon!');
    }
    
    updateStatus(message, type) {
        this.voiceRecordingStatus.textContent = message;
        this.voiceRecordingStatus.className = `voice-recording-status ${type}`;
    }
    
    showError(title, message) {
        console.error(`${title}: ${message}`);
        // Could integrate with app's error display system
        alert(`${title}: ${message}`);
    }
    
    stopPreview() {
        if (this.currentAudioSource) {
            try {
                this.currentAudioSource.stop();
                this.currentAudioSource.disconnect();
                this.currentAudioSource = null;
            } catch (error) {
                console.warn('Error stopping Web Audio API source:', error);
            }
        }
        
        if (this.currentPreviewAudio) {
            this.currentPreviewAudio.pause();
            this.currentPreviewAudio.currentTime = 0;
            this.currentPreviewAudio = null;
        }
        
        if (speechSynthesis && speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        
        this.isPreviewing = false;
        this.voicePreviewBtn.style.display = 'inline-block';
        this.voiceStopPreviewBtn.style.display = 'none';
    }
    
    cleanup() {
        if (this.isRecording) {
            this.stopRecording();
        }
        if (this.isPreviewing) {
            this.stopPreview();
        }
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
        }
        
        if (this.currentRecordedVoiceMessage && this.currentRecordedVoiceMessage.audioUrl) {
            URL.revokeObjectURL(this.currentRecordedVoiceMessage.audioUrl);
        }
        
        if (this.currentPreviewAudio) {
            this.currentPreviewAudio.pause();
            this.currentPreviewAudio = null;
        }
        
        this.voiceSamples.forEach(sample => {
            if (sample.audioUrl) {
                URL.revokeObjectURL(sample.audioUrl);
            }
        });
        this.voiceSamples = [];
        
        if (this.userVoiceSample && this.userVoiceSample.audioUrl) {
            URL.revokeObjectURL(this.userVoiceSample.audioUrl);
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            try {
                this.audioContext.close();
                this.audioContext = null;
            } catch (error) {
                console.warn('Error closing audio context:', error);
            }
        }
    }
}