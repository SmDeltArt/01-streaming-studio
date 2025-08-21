export default class TextDisplayManager {
    constructor(app) {
        this.app = app;
        this.textPanel = null;
        this.currentTextElement = null;
        this.defaultDisplayDuration = 5000;
        this.textFadeTransition = 500;
        this.maxSimultaneousTexts = 3;
        this.activeTexts = [];
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.currentSettings = this.getDefaultSettings();
        this.initializeElements();
        this.bindEvents();
        this.setupDragging();
        this.initializeWebSimTTS();
        this.updateVoiceEffectAvailability();
    }

    initializeElements() {
        this.textBtn = document.getElementById('textBtn');
        this.textPanel = document.getElementById('textDisplayPanel');
        if (this.textPanel) this.textPanel.classList.add('ai-scope');
        this.textPanelCollapse = document.getElementById('textPanelCollapse');
        this.textPanelClose = document.getElementById('textPanelClose');
        this.textPanelExpand = document.getElementById('textPanelExpand');
        this.textContent = document.getElementById('textContent');
        this.textPosition = document.getElementById('textPosition');
        this.textFontSize = document.getElementById('textFontSize');
        this.fontSizeValue = document.getElementById('fontSizeValue');
        this.textDisplayTime = document.getElementById('textDisplayTime');
        this.displayTimeValue = document.getElementById('displayTimeValue');
        this.textAnimation = document.getElementById('textAnimation');
        this.textShadowBlur = document.getElementById('textShadowBlur');
        this.shadowBlurValue = document.getElementById('shadowBlurValue');
        this.textGlowIntensity = document.getElementById('textGlowIntensity');
        this.glowIntensityValue = document.getElementById('glowIntensityValue');
        this.textFontFamily = document.getElementById('textFontFamily');
        this.textFontWeight = document.getElementById('textFontWeight');
        this.textColor = document.getElementById('textColor');
        this.textBackgroundColor = document.getElementById('textBackgroundColor');
        this.textBackgroundOpacity = document.getElementById('textBackgroundOpacity');
        this.bgOpacityValue = document.getElementById('bgOpacityValue');
        this.textBorderRadius = document.getElementById('textBorderRadius');
        this.borderRadiusValue = document.getElementById('borderRadiusValue');
        this.textStrokeWidth = document.getElementById('textStrokeWidth');
        this.strokeWidthValue = document.getElementById('strokeWidthValue');
        this.textStrokeColor = document.getElementById('textStrokeColor');
        this.textVoice = document.getElementById('textVoice');
        this.voiceTypeSelect = this.textVoice;
        this.speechSpeed = document.getElementById('speechSpeed');
        this.speechSpeedValue = document.getElementById('speechSpeedValue');
        this.speechVolume = document.getElementById('speechVolume');
        this.speechVolumeValue = document.getElementById('speechVolumeValue');
        this.speechPitch = document.getElementById('speechPitch');
        this.speechPitchValue = document.getElementById('speechPitchValue');
        this.textAddEcho = document.getElementById('textAddEcho');
        this.textAddReverb = document.getElementById('textAddReverb');
        this.textEnhanceClarity = document.getElementById('textEnhanceClarity');
        this.textSpeakWithDisplay = document.getElementById('textSpeakWithDisplay');
        this.textPreview = document.getElementById('textPreview');
        this.showTextBtn = document.getElementById('showTextBtn');
        this.speakTextBtn = document.getElementById('speakTextBtn');
        this.previewTextBtn = document.getElementById('previewTextBtn');
        this.saveTextBtn = document.getElementById('saveTextBtn');
        this.loadTextBtn = document.getElementById('loadTextBtn');
    }

    bindEvents() {
        if (!this.textBtn || !this.textPanel) {
            return;
        }
        try {
            this.textBtn.addEventListener('click', () => this.togglePanel());
            if (this.textPanelCollapse) {
                this.textPanelCollapse.addEventListener('click', () => this.toggleCollapse());
            }
            if (this.textPanelExpand) {
                this.textPanelExpand.addEventListener('click', () => this.toggleCollapse());
            }
            if (this.textPanelClose) {
                this.textPanelClose.addEventListener('click', () => this.hidePanel());
            }
            this.textContent.addEventListener('input', () => this.updatePreview());
            this.textFontSize.addEventListener('input', () => {
                this.fontSizeValue.textContent = this.textFontSize.value + 'px';
                this.updatePreview();
            });
            this.textDisplayTime.addEventListener('input', () => {
                this.displayTimeValue.textContent = this.textDisplayTime.value + 's';
            });
            this.textShadowBlur.addEventListener('input', () => {
                this.shadowBlurValue.textContent = this.textShadowBlur.value + 'px';
                this.updatePreview();
            });
            this.textGlowIntensity.addEventListener('input', () => {
                this.glowIntensityValue.textContent = this.textGlowIntensity.value + 'px';
                this.updatePreview();
            });
            this.textBackgroundOpacity.addEventListener('input', () => {
                this.bgOpacityValue.textContent = this.textBackgroundOpacity.value + '%';
                this.updatePreview();
            });
            this.textBorderRadius.addEventListener('input', () => {
                this.borderRadiusValue.textContent = this.textBorderRadius.value + 'px';
                this.updatePreview();
            });
            this.textStrokeWidth.addEventListener('input', () => {
                this.strokeWidthValue.textContent = this.textStrokeWidth.value + 'px';
                this.updatePreview();
            });
            this.speechSpeed.addEventListener('input', () => {
                this.speechSpeedValue.textContent = this.speechSpeed.value + 'x';
            });
            this.speechVolume.addEventListener('input', () => {
                this.speechVolumeValue.textContent = this.speechVolume.value + '%';
            });
            if (this.speechPitch) {
                this.speechPitch.addEventListener('input', () => {
                    this.speechPitchValue.textContent = this.speechPitch.value + 'x';
                });
            }
            if (this.textSpeakWithDisplay) {
                this.textSpeakWithDisplay.addEventListener('change', () => {});
            }
            [this.textPosition, this.textAnimation, this.textFontFamily, this.textFontWeight,
                this.textColor, this.textBackgroundColor, this.textStrokeColor].forEach(element => {
                element.addEventListener('change', () => this.updatePreview());
            });
            document.querySelectorAll('.preset-text-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.textContent.value = e.target.getAttribute('data-text');
                    this.updatePreview();
                });
            });
            if (this.showTextBtn) {
                this.showTextBtn.addEventListener('click', () => this.showText());
            }
            if (this.speakTextBtn) {
                this.speakTextBtn.addEventListener('click', () => this.speakText());
            }
            if (this.previewTextBtn) {
                this.previewTextBtn.addEventListener('click', () => this.previewText());
            }
            if (this.saveTextBtn) {
                this.saveTextBtn.addEventListener('click', () => this.saveSettings());
            }
            if (this.loadTextBtn) {
                this.loadTextBtn.addEventListener('click', () => this.loadSettings());
            }
            document.addEventListener('keydown', (e) => {
                const key = (e && e.key ? e.key.toLowerCase() : '');
if (key === 't' && !(e.target && e.target.matches && e.target.matches('input, textarea, select'))) {

                    this.togglePanel();
                    e.preventDefault();
                }
            });
    } catch (error) {}
    }

    setupDragging() {
        if (!this.textPanel) return;

        const dragHandles = this.textPanel.querySelectorAll('.text-panel-header, .text-panel-actions');
        if (!dragHandles.length) return;
        let isDragging = false;
        let startX, startY, initialX, initialY;
        dragHandles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                if (e.target.tagName === 'BUTTON') return;
                isDragging = true;
                this.textPanel.classList.add('dragging');
                startX = e.clientX;
                startY = e.clientY;
                const rect = this.textPanel.getBoundingClientRect();
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
            const panelRect = this.textPanel.getBoundingClientRect();
            const minVisibleArea = Math.min(panelRect.width, panelRect.height) * 0.05;
            newX = Math.max(-panelRect.width + minVisibleArea, Math.min(newX, window.innerWidth - minVisibleArea));
            newY = Math.max(-panelRect.height + minVisibleArea, Math.min(newY, window.innerHeight - minVisibleArea));
            this.textPanel.style.left = `${newX}px`;
            this.textPanel.style.top = `${newY}px`;
            this.textPanel.style.transform = 'none';
        });
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.textPanel.classList.remove('dragging');
            }
        });
    }

    async initializeWebSimTTS() {
        try {
            if (typeof window.websim !== 'undefined' && window.websim.textToSpeech) {
                this.ttsAPI = window.websim.textToSpeech;
            } else {
                this.ttsAPI = this.createFallbackTTS();
            }
        } catch (error) {
            this.ttsAPI = this.createFallbackTTS();
            this.updateVoiceEffectAvailability();
        }
    }

    static TTS_EN_NAME_PREFS = [
        'Microsoft Aria Online (Natural) - English (United States)',
        'Microsoft Guy Online (Natural) - English (United States)',
        'Google US English',
        'Google UK English Female',
        'Google UK English Male',
        'Samantha', 'Alex', 'Daniel', 'Victoria', 'Moira',
    ];

    waitForVoices = () => new Promise((resolve) => {
        const ready = speechSynthesis.getVoices();
        if (ready && ready.length) return resolve(ready);
        const done = () => {
            const list = speechSynthesis.getVoices();
            if (list && list.length) {
                speechSynthesis.onvoiceschanged = null;
                resolve(list);
            }
        };
        speechSynthesis.onvoiceschanged = done;
        setTimeout(done, 1000);
    });

    async pickEnglishVoice(preferredLangs = ['en-US', 'en-GB', 'en']) {
        const voices = await this.waitForVoices();
        for (const L of preferredLangs) {
            const byLang = voices.filter(v => (v.lang || '').toLowerCase().startsWith(L.toLowerCase()));
            if (byLang.length) {
                for (const name of TextDisplayManager.TTS_EN_NAME_PREFS) {
                    const hit = byLang.find(v => v.name === name);
                    if (hit) return hit;
                }
                const local = byLang.find(v => v.localService);
                if (local) return local;
                return byLang[0];
            }
        }
        const anyEn = voices.find(v => (v.lang || '').toLowerCase().startsWith('en'));
        if (anyEn) return anyEn;
        return voices[0] || null;
    }

    cancelSpeaking() {
        try { window.speechSynthesis.cancel(); } catch {}
    }

    async speakEnglish(text, { rate = 1, pitch = 1, volume = 1, lang = 'en-US' } = {}) {
        if (!text || !text.trim()) return;
        const voice = await this.pickEnglishVoice([lang, 'en-US', 'en-GB', 'en']);
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = voice?.lang || lang || 'en-US';
        utter.voice = voice || null;
        utter.rate = Number(rate) || 1;
        utter.pitch = Number(pitch) || 1;
        utter.volume = Number(volume ?? 1);
        this.cancelSpeaking();
        window.speechSynthesis.speak(utter);
        return { voiceUsed: voice?.name || '(default)', langUsed: utter.lang };
    }

    createFallbackTTS() {
        return async (options) => {
            try {
                if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
                    const maxRetryAttempts = 3;
                    const retryDelay = 500;
                    const speechTimeout = 10000;
                    return new Promise((resolve, reject) => {
                        let attempts = 0;
                        const attemptSpeech = () => {
                            attempts++;
                            try {
                                speechSynthesis.cancel();
                                setTimeout(() => speechSynthesis.cancel(), speechTimeout);
                                const utterance = new SpeechSynthesisUtterance(options.text);
                                const voiceMap = {
                                    'en-male': ['male', 'man', 'david', 'alex', 'daniel'],
                                    'en-female': ['female', 'woman', 'samantha', 'victoria', 'karen'],
                                    'es-male': ['spanish', 'jorge', 'carlos'],
                                    'es-female': ['spanish', 'spanish female', 'monica'],
                                    'fr-male': ['french', 'thomas', 'henri'],
                                    'fr-female': ['french', 'aurelie', 'marie']
                                };
                                const voices = speechSynthesis.getVoices();
                                if (voices.length === 0) {
                                    if (attempts < maxRetryAttempts) {
                                        setTimeout(attemptSpeech, retryDelay);
                                        return;
                                    }
                                } else {
                                    const preferredVoices = voiceMap[options.voice] || ['default'];
                                    let selectedVoice = null;
                                    for (const preference of preferredVoices) {
                                        selectedVoice = voices.find(voice =>
                                            voice.name.toLowerCase().includes(preference.toLowerCase()) ||
                                            voice.lang.toLowerCase().includes(preference.split('-')[0]) ||
                                            (preference.includes('male') && voice.name.toLowerCase().includes('male')) ||
                                            (preference.includes('female') && voice.name.toLowerCase().includes('female'))
                                        );
                                        if (selectedVoice) break;
                                    }
                                    if (!selectedVoice) {
                                        selectedVoice = voices.find(voice =>
                                            voice.lang.startsWith('en') && !voice.name.includes('Google')
                                        ) || voices[0];
                                    }
                                    if (selectedVoice) {
                                        utterance.voice = selectedVoice;
                                    }
                                }
                                utterance.rate = Math.max(0.1, Math.min(10, options.speed || 1));
                                utterance.volume = Math.max(0, Math.min(1, (options.volume || 70) / 100));
                                utterance.pitch = 1;
                                let resolved = false;
                                utterance.onend = () => {
                                    if (!resolved) {
                                        resolved = true;
                                        resolve({ success: true, url: null });
                                    }
                                };
                                utterance.onerror = (event) => {
                                    if (!resolved) {
                                        resolved = true;
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
                return { success: false, error: error.message };
            }
        };
    }

    getDefaultSettings() {
        return {
            content: 'Welcome to my stream!',
            position: 'top-center',
            fontSize: 32,
            displayTime: 5,
            animation: 'fade',
            shadowBlur: 4,
            glowIntensity: 10,
            fontFamily: 'Inter',
            fontWeight: '600',
            textColor: '#ffffff',
            backgroundColor: '#000000',
            backgroundOpacity: 50,
            borderRadius: 8,
            strokeWidth: 0,
            strokeColor: '#000000',
            voice: 'narrator',
            speechSpeed: 1.0,
            speechVolume: 70,
            speakWithDisplay: false
        };
    }

    togglePanel() {
        if (this.textPanel.style.display === 'block') {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }

    showPanel() {
        this.textPanel.style.display = 'block';
        this.updatePreview();
    }

    hidePanel() {
        this.textPanel.style.display = 'none';
    }

    toggleCollapse() {
        const isCollapsed = this.textPanel.classList.contains('collapsed');
        if (isCollapsed) {
            this.textPanel.classList.remove('collapsed');
            this.textPanelCollapse.textContent = '−';
        } else {
            this.textPanel.classList.add('collapsed');
            this.textPanelCollapse.textContent = '+';
        }
    }

    updatePreview() {
        const content = this.textContent.value || 'Your text will appear here';
        const settings = this.getCurrentSettings();
        this.textPreview.textContent = content;
        this.textPreview.style.fontSize = settings.fontSize + 'px';
        this.textPreview.style.fontFamily = settings.fontFamily;
        this.textPreview.style.fontWeight = settings.fontWeight;
        this.textPreview.style.color = settings.textColor;
        this.textPreview.style.borderRadius = settings.borderRadius + 'px';
        const bgColor = this.hexToRgba(settings.backgroundColor, settings.backgroundOpacity / 100);
        this.textPreview.style.background = bgColor;
        let textShadow = `0 ${settings.shadowBlur}px ${settings.shadowBlur * 2}px rgba(0, 0, 0, 0.5)`;
        if (settings.glowIntensity > 0) {
            textShadow += `, 0 0 ${settings.glowIntensity}px ${settings.textColor}`;
        }
        if (settings.strokeWidth > 0) {
            textShadow += `, 0 0 0 ${settings.strokeWidth}px ${settings.strokeColor}`;
        }
        this.textPreview.style.textShadow = textShadow;
    }

    getCurrentSettings() {
        return {
            content: this.textContent.value,
            position: this.textPosition.value,
            fontSize: parseInt(this.textFontSize.value),
            displayTime: parseInt(this.textDisplayTime.value),
            animation: this.textAnimation.value,
            shadowBlur: parseInt(this.textShadowBlur.value),
            glowIntensity: parseInt(this.textGlowIntensity.value),
            fontFamily: this.textFontFamily.value,
            fontWeight: this.textFontWeight.value,
            textColor: this.textColor.value,
            backgroundColor: this.textBackgroundColor.value,
            backgroundOpacity: parseInt(this.textBackgroundOpacity.value),
            borderRadius: parseInt(this.textBorderRadius.value),
            strokeWidth: parseInt(this.textStrokeWidth.value),
            strokeColor: this.textStrokeColor.value,
            voice: this.textVoice.value,
            speechSpeed: parseFloat(this.speechSpeed.value),
            speechVolume: parseInt(this.speechVolume.value),
            addEcho: this.textAddEcho ? this.textAddEcho.checked : false,
            addReverb: this.textAddReverb ? this.textAddReverb.checked : false,
            enhanceClarity: this.textEnhanceClarity ? this.textEnhanceClarity.checked : false,
            speakWithDisplay: this.textSpeakWithDisplay ? this.textSpeakWithDisplay.checked : false
        };
    }

    getCurrentVoiceSettings() {
        return {
            voiceType: this.textVoice ? this.textVoice.value : 'en-male',
            speed: this.speechSpeed ? parseFloat(this.speechSpeed.value) : 1.0,
            volume: this.speechVolume ? parseInt(this.speechVolume.value) : 70,
            pitch: this.speechPitch ? parseFloat(this.speechPitch.value) : 1.0,
            addEcho: this.textAddEcho ? this.textAddEcho.checked : false,
            addReverb: this.textAddReverb ? this.textAddReverb.checked : false,
            enhanceClarity: this.textEnhanceClarity ? this.textEnhanceClarity.checked : false
        };
    }

    setTranscribedText(text, voiceSettings = null) {
        if (this.textContent && text) {
            this.textContent.value = text;
            this.updatePreview();
            if (voiceSettings && this.applyVoiceSettings) {
                this.applyVoiceSettings(voiceSettings);
            }
            this.showPanel();
        }
    }

    applyVoiceSettings(voiceSettings) {
        try {
            if (this.textVoice && voiceSettings.voiceType) {
                this.textVoice.value = voiceSettings.voiceType;
            }
            if (this.speechSpeed && voiceSettings.speed) {
                this.speechSpeed.value = voiceSettings.speed;
                this.speechSpeedValue.textContent = voiceSettings.speed + 'x';
            }
            if (this.speechVolume && voiceSettings.volume) {
                this.speechVolume.value = voiceSettings.volume;
                this.speechVolumeValue.textContent = voiceSettings.volume + '%';
            }
            if (this.speechPitch && voiceSettings.pitch) {
                this.speechPitch.value = voiceSettings.pitch;
                this.speechPitchValue.textContent = voiceSettings.pitch + 'x';
            }
            if (this.textAddEcho && voiceSettings.addEcho !== undefined) {
                this.textAddEcho.checked = voiceSettings.addEcho;
            }
            if (this.textAddReverb && voiceSettings.addReverb !== undefined) {
                this.textAddReverb.checked = voiceSettings.addReverb;
            }
            if (this.textEnhanceClarity && voiceSettings.enhanceClarity !== undefined) {
                this.textEnhanceClarity.checked = voiceSettings.enhanceClarity;
            }
        } catch (error) {}
    }

    async speakText() {
        try {
            const text = this.textContent.value.trim();
            if (!text) {
                alert('Please enter some text to speak');
                return;
            }
            const voiceSettings = this.getCurrentVoiceSettings();
            voiceSettings.text = text;
            await this.speakTextWithEffects(text, voiceSettings);
        } catch (error) {
            alert('Could not speak text: ' + error.message);
        }
    }

    async speakTextWithEffects(text, voiceSettings) {
        if (!text || !text.trim()) return;
        const hasEffects =
            !!(voiceSettings?.addEcho || voiceSettings?.addReverb || voiceSettings?.enhanceClarity);
        const effectIntensities = (typeof this.getEffectIntensities === 'function')
            ? this.getEffectIntensities()
            : { echoFeedback: 0.32, reverbGain: 0.22, clarityGain: 0.18 };
        if (hasEffects && window.websim && typeof window.websim.textToSpeech === 'function') {
            try {
                const vType = (voiceSettings.voiceType === 'user-clone') ? 'fr-male' : voiceSettings.voiceType;
                const voiceId = this.mapVoiceTypeToWebSimVoice(vType);
                const ttsOptions = {
                    text: text.trim(),
                    voice: voiceId,
                    speed: voiceSettings.speed,
                    volume: (voiceSettings.volume ?? 80) / 100,
                    effects: {
                        echo: !!voiceSettings.addEcho,
                        reverb: !!voiceSettings.addReverb,
                        clarity: !!voiceSettings.enhanceClarity,
                        echoIntensity: effectIntensities.echoFeedback,
                        reverbIntensity: effectIntensities.reverbGain,
                        clarityBoost: effectIntensities.clarityGain
                    }
                };
                const res = await window.websim.textToSpeech(ttsOptions);
                let audioUrl = '';
                if (typeof res === 'string') {
                    audioUrl = res;
                } else if (res instanceof Blob) {
                    audioUrl = URL.createObjectURL(res);
                } else if (res && (res.url || res.audioUrl)) {
                    audioUrl = res.url || res.audioUrl;
                }
                if (!audioUrl) throw new Error('No audio returned from WebSim TTS');
                await this.playAudioWithEffects(audioUrl, voiceSettings, effectIntensities);
                return;
            } catch (err) {
                this.updateStatus?.('Voice effects need WebSim TTS; speaking without effects.', 'warning');
            }
        }
        await this.speakTextWithBrowserEffects(text, voiceSettings);
    }

    async playAudioWithEffects(audioUrl, voiceSettings, effectIntensities = null) {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            const response = await fetch(audioUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            let currentNode = source;
            if (voiceSettings.addEcho) {
                const delay = this.audioContext.createDelay(0.5);
                const feedback = this.audioContext.createGain();
                const wetGain = this.audioContext.createGain();
                const echoDelay = effectIntensities?.echoDelay || 0.3;
                const echoFeedback = effectIntensities?.echoFeedback || 0.4;
                const echoWet = effectIntensities?.echoWetGain || 0.3;
                delay.delayTime.setValueAtTime(echoDelay, this.audioContext.currentTime);
                feedback.gain.setValueAtTime(echoFeedback, this.audioContext.currentTime);
                wetGain.gain.setValueAtTime(echoWet, this.audioContext.currentTime);
                currentNode.connect(delay);
                delay.connect(feedback);
                feedback.connect(delay);
                delay.connect(wetGain);
                wetGain.connect(this.audioContext.destination);
            }
            if (voiceSettings.addReverb) {
                const convolver = this.audioContext.createConvolver();
                const reverbGain = this.audioContext.createGain();
                const reverbDuration = effectIntensities?.reverbDuration || 2.0;
                const reverbDecay = effectIntensities?.reverbDecay || 2.0;
                const reverbLevel = effectIntensities?.reverbGain || 0.4;
                convolver.buffer = this.createReverbImpulse(reverbDuration, reverbDecay, false);
                reverbGain.gain.setValueAtTime(reverbLevel, this.audioContext.currentTime);
                currentNode.connect(convolver);
                convolver.connect(reverbGain);
                reverbGain.connect(this.audioContext.destination);
            }
            if (voiceSettings.enhanceClarity) {
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'highshelf';
                const clarityFreq = effectIntensities?.clarityFrequency || 3000;
                const clarityGain = effectIntensities?.clarityGain || 6;
                filter.frequency.setValueAtTime(clarityFreq, this.audioContext.currentTime);
                filter.gain.setValueAtTime(clarityGain, this.audioContext.currentTime);
                currentNode.connect(filter);
                currentNode = filter;
            }
            currentNode.connect(this.audioContext.destination);
            return new Promise((resolve) => {
                source.onended = resolve;
                source.start(0);
            });
        } catch (error) {
            throw error;
        }
    }

    async speakTextWithBrowserEffects(text, voiceSettings, effectIntensities = null) {
        if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
            throw new Error('Speech synthesis not supported');
        }
        if (!text || !text.trim()) return;
        const voices = await new Promise((resolve) => {
            const existing = speechSynthesis.getVoices();
            if (existing && existing.length) return resolve(existing);
            const done = () => {
                const list = speechSynthesis.getVoices();
                if (list && list.length) {
                    speechSynthesis.onvoiceschanged = null;
                    resolve(list);
                }
            };
            speechSynthesis.onvoiceschanged = done;
            setTimeout(done, 1200);
        });
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = voiceSettings?.speed ?? 1.0;
        utterance.volume = Math.max(0, Math.min(1, (voiceSettings?.volume ?? 70) / 100));
        utterance.pitch = voiceSettings?.pitch ?? 1.0;
        const selected = this.selectVoiceForType(voices, voiceSettings?.voiceType);
        if (selected) {
            utterance.voice = selected;
            if (selected.lang) utterance.lang = selected.lang;
            const frMaleAsked = (voiceSettings?.voiceType === 'fr-male');
            const looksFemale = /amelie|aurelie|celine|chantal|julie|marie|hortense|victoria|samantha/i.test(selected.name || '');
            if (frMaleAsked && (selected.lang || '').toLowerCase().startsWith('fr') && looksFemale) {
                utterance.pitch = Math.max(0.85, utterance.pitch * 0.92);
            }
        } else {
            utterance.lang = (voiceSettings?.voiceType?.startsWith('en')) ? 'en-US' : 'en-US';
        }
        if (voiceSettings?.addEcho) { utterance.pitch *= 0.9; utterance.rate *= 0.95; }
        if (voiceSettings?.addReverb) { utterance.pitch *= 1.1; utterance.volume *= 0.8; }
        if (voiceSettings?.enhanceClarity) { utterance.pitch *= 1.05; utterance.rate *= 1.05; }
        return new Promise((resolve, reject) => {
            utterance.onend = resolve;
            utterance.onerror = reject;
            speechSynthesis.speak(utterance);
        });
    }

    selectVoiceForType(voices, voiceType) {
        const prefs = {
            'fr-male': { langs: ['fr-FR', 'fr-CA', 'fr'], names: ['Thomas', 'Paul', 'Henri', 'Nicolas', 'Guillaume', 'Remy', 'Michel', 'Antoine', 'Loic', 'Mathieu', 'Thibault'] },
            'fr-female': { langs: ['fr-FR', 'fr-CA', 'fr'], names: ['Amelie', 'Aurelie', 'Celine', 'Chantal', 'Julie', 'Marie', 'Hortense', 'Agnès', 'Ariane'] },
            'es-male': { langs: ['es-ES', 'es-MX', 'es'], names: ['Jorge', 'Carlos', 'Enrique', 'Diego'] },
            'es-female': { langs: ['es-ES', 'es-MX', 'es'], names: ['Monica', 'Maria', 'Lucia', 'Isabella'] },
            'en-male': { langs: ['en-US', 'en-GB', 'en'], names: ['Alex', 'Daniel', 'David', 'Mark', 'Guy'] },
            'en-female': { langs: ['en-US', 'en-GB', 'en'], names: ['Samantha', 'Victoria', 'Aria', 'Zira'] },
            'cool-male': { langs: ['en-US', 'en-GB', 'en'], names: ['Alex', 'Daniel', 'David', 'Mark'] },
            'cool-female': { langs: ['en-US', 'en-GB', 'en'], names: ['Samantha', 'Victoria'] },
            'narrator': { langs: ['en-US', 'en-GB', 'en'], names: ['Daniel', 'Alex', 'Narrator', 'Thomas'] },
            'whisper': { langs: ['en-US', 'en-GB', 'en'], names: ['Samantha', 'Victoria', 'Soft'] },
            'robotic': { langs: ['en-US', 'en-GB', 'en'], names: ['Robot', 'Synth', 'Android'] },
            'echo': { langs: ['en-US', 'en-GB', 'en'], names: ['Deep', 'Echo'] },
            'user-clone': { langs: ['en-US', 'en-GB', 'en'], names: ['Daniel', 'Alex', 'Narrator', 'Thomas'] }
        };
        const pref = prefs[voiceType] || prefs['en-male'];
        for (const L of pref.langs) {
            const bucket = voices.filter(v => (v.lang || '').toLowerCase().startsWith(L.toLowerCase()));
            if (bucket.length) {
                for (const name of pref.names) {
                    const hit = bucket.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
                    if (hit) return hit;
                }
                const local = bucket.find(v => v.localService);
                if (local) return local;
                return bucket[0];
            }
        }
        for (const name of pref.names) {
            const hit = voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
            if (hit) return hit;
        }
        if (voiceType?.startsWith('fr')) {
            const fr = voices.find(v => (v.lang || '').toLowerCase().startsWith('fr'));
            if (fr) return fr;
        }
        if (voiceType?.startsWith('es')) {
            const es = voices.find(v => (v.lang || '').toLowerCase().startsWith('es'));
            if (es) return es;
        }
        return voices.find(v => (v.lang || '').toLowerCase().startsWith('en')) || voices[0];
    }

    mapVoiceTypeToWebSimVoice(voiceType) {
        const voiceMapping = {
            'robotic': 'en-male',
            'cool-male': 'en-male',
            'cool-female': 'en-female',
            'narrator': 'en-male',
            'whisper': 'en-female',
            'echo': 'en-male',
            'en-male': 'en-male',
            'en-female': 'en-female',
            'es-male': 'es-male',
            'es-female': 'es-female',
            'fr-male': 'fr-male',
            'fr-female': 'fr-female'
        };
        if (voiceType === 'user-clone') {
            return 'fr-male';
        }
        return voiceMapping[voiceType] || 'fr-male';
    }

    previewText() {
        const settings = this.getCurrentSettings();
        if (!settings.content.trim()) {
            alert('Please enter some text to preview');
            return;
        }
        const tempSettings = { ...settings, displayTime: 2 };
        this.displayText(tempSettings);
    }

    showText() {
        const settings = this.getCurrentSettings();
        if (!settings.content.trim()) {
            alert('Please enter some text to show');
            return;
        }
        this.displayText(settings);
    }

    saveSettings() {
        const settings = this.getCurrentSettings();
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `text-display-settings-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 100);
    }

    loadSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const settings = JSON.parse(e.target.result);
                    this.applySettings(settings);
                    this.updatePreview();
                    alert('Settings loaded successfully!');
                } catch (error) {
                    alert('Failed to load settings: Invalid JSON file');
                }
            };
            reader.readAsText(file);
        });
        input.click();
    }

    applySettings(settings) {
        this.textContent.value = settings.content || '';
        this.textPosition.value = settings.position || 'top-center';
        this.textFontSize.value = settings.fontSize || 32;
        this.fontSizeValue.textContent = this.textFontSize.value + 'px';
        this.textDisplayTime.value = settings.displayTime || 5;
        this.displayTimeValue.textContent = this.textDisplayTime.value + 's';
        this.textAnimation.value = settings.animation || 'fade';
        this.textShadowBlur.value = settings.shadowBlur || 4;
        this.shadowBlurValue.textContent = this.textShadowBlur.value + 'px';
        this.textGlowIntensity.value = settings.glowIntensity || 10;
        this.glowIntensityValue.textContent = this.textGlowIntensity.value + 'px';
        this.textFontFamily.value = settings.fontFamily || 'Inter';
        this.textFontWeight.value = settings.fontWeight || '600';
        this.textColor.value = settings.textColor || '#ffffff';
        this.textBackgroundColor.value = settings.backgroundColor || '#000000';
        this.textBackgroundOpacity.value = settings.backgroundOpacity || 50;
        this.bgOpacityValue.textContent = this.textBackgroundOpacity.value + '%';
        this.textBorderRadius.value = settings.borderRadius || 8;
        this.borderRadiusValue.textContent = this.textBorderRadius.value + 'px';
        this.textStrokeWidth.value = settings.strokeWidth || 0;
        this.strokeWidthValue.textContent = this.textStrokeWidth.value + 'px';
        this.textStrokeColor.value = settings.strokeColor || '#000000';
        this.textVoice.value = settings.voice || 'en-male';
        this.speechSpeed.value = settings.speechSpeed || 1.0;
        this.speechSpeedValue.textContent = this.speechSpeed.value + 'x';
        this.speechVolume.value = settings.speechVolume || 70;
        this.speechVolumeValue.textContent = this.speechVolume.value + '%';
        if (this.textAddEcho) this.textAddEcho.checked = settings.addEcho || false;
        if (this.textAddReverb) this.textAddReverb.checked = settings.addReverb || false;
        if (this.textEnhanceClarity) this.textEnhanceClarity.checked = settings.enhanceClarity || false;
        if (this.textSpeakWithDisplay) this.textSpeakWithDisplay.checked = settings.speakWithDisplay || false;
    }

    hexToRgba(hex, alpha) {
        // Handle undefined or invalid hex values
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) {
            console.warn('Invalid hex color value:', hex, 'using default black');
            hex = '#000000';
        }
        
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    displayText(settings) {
        if (this.activeTexts.length >= this.maxSimultaneousTexts) {
            const oldestText = this.activeTexts.shift();
            if (oldestText && oldestText.parentNode) {
                oldestText.remove();
            }
        }
        const textElement = document.createElement('div');
        textElement.className = 'text-display-element';
        textElement.textContent = settings.content;
        textElement.style.fontSize = settings.fontSize + 'px';
        textElement.style.fontFamily = settings.fontFamily;
        textElement.style.fontWeight = settings.fontWeight;
        textElement.style.color = settings.textColor;
        textElement.style.borderRadius = settings.borderRadius + 'px';
        const bgColor = this.hexToRgba(settings.backgroundColor, settings.backgroundOpacity / 100);
        textElement.style.background = bgColor;
        let textShadow = `0 ${settings.shadowBlur}px ${settings.shadowBlur * 2}px rgba(0, 0, 0, 0.5)`;
        if (settings.glowIntensity > 0) {
            textShadow += `, 0 0 ${settings.glowIntensity}px ${settings.textColor}`;
        }
        if (settings.strokeWidth > 0) {
            textShadow += `, 0 0 0 ${settings.strokeWidth}px ${settings.strokeColor}`;
        }
        textElement.style.textShadow = textShadow;
        this.positionText(textElement, settings.position);
        if (settings.animation !== 'none') {
            textElement.classList.add(settings.animation);
            textElement.style.setProperty('--display-time', `${settings.displayTime}s`);
            if (settings.animation === 'typewriter') {
                textElement.style.setProperty('--char-count', settings.content.length);
            }
        }
        document.body.appendChild(textElement);
        this.activeTexts.push(textElement);
        if (this.textSpeakWithDisplay && this.textSpeakWithDisplay.checked) {
            const enhancedVoiceSettings = this.getCurrentVoiceSettings();
            enhancedVoiceSettings.voiceType = settings.voice || enhancedVoiceSettings.voiceType;
            this.speakTextWithEffects(settings.content, enhancedVoiceSettings);
        }
        let activeItemId = null;
        if (this.app.uiManager && this.app.uiManager.addActiveItem) {
            const existingItem = this.app.uiManager.activeItems.find(item =>
                item.type === 'text' &&
                item.settings.content === settings.content &&
                !item.element
            );
            if (existingItem) {
                existingItem.element = textElement;
                activeItemId = existingItem.id;
                textElement.dataset.activeItemId = activeItemId;
                this.app.uiManager.updateActiveItemsDisplay();
            } else {
                activeItemId = this.app.uiManager.addActiveItem('text', settings.content, textElement, settings);
            }
        }
        const displayDuration = settings.displayTime * 1000;
        setTimeout(() => {
            this.removeTextElement(textElement);
        }, displayDuration);
    }

    positionText(element, position) {
        element.style.position = 'fixed';
        element.style.zIndex = '15000';
        switch (position) {
            case 'top-left':
                element.style.top = '20px';
                element.style.left = '20px';
                break;
            case 'top-center':
                element.style.top = '20px';
                element.style.left = '50%';
                element.style.transform = 'translateX(-50%)';
                break;
            case 'top-right':
                element.style.top = '20px';
                element.style.right = '20px';
                break;
            case 'center':
                element.style.top = '50%';
                element.style.left = '50%';
                element.style.transform = 'translate(-50%, -50%)';
                break;
            case 'bottom-left':
                element.style.bottom = '20px';
                element.style.left = '20px';
                break;
            case 'bottom-center':
                element.style.bottom = '20px';
                element.style.left = '50%';
                element.style.transform = 'translateX(-50%)';
                break;
            case 'bottom-right':
                element.style.bottom = '20px';
                element.style.right = '20px';
                break;
        }
    }

    removeTextElement(element) {
        if (element && element.parentNode) {
            if (this.app.uiManager && this.app.uiManager.cleanupActiveItem) {
                this.app.uiManager.cleanupActiveItem(element);
            }
            element.style.transition = `opacity ${this.textFadeTransition}ms ease-out`;
            element.style.opacity = '0';
            setTimeout(() => {
                if (element.parentNode) {
                    element.remove();
                }
                const index = this.activeTexts.indexOf(element);
                if (index > -1) {
                    this.activeTexts.splice(index, 1);
                }
            }, this.textFadeTransition);
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

    updateVoiceEffectAvailability() {
        const supported = !!(window.websim && typeof window.websim.textToSpeech === 'function');
        [this.textAddEcho, this.textAddReverb, this.textEnhanceClarity].forEach(el => {
            if (!el) return;
            el.disabled = !supported;
            el.title = supported ? '' : 'Voice effects require WebSim TTS (audio output).';
        });
        }

    cleanup() {
        this.activeTexts.forEach(element => {
            if (element.parentNode) {
                element.remove();
            }
        });
        this.activeTexts = [];
    }
}