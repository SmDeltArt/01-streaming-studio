// Import managers
import CameraManager from './src/camera-manager.js';
import RecordingManager from './src/recording-manager.js';
import UIManager from './src/ui-manager.js';
import AudioManager from './src/audio-manager.js';
import CursorEffectsManager from './src/cursor-effects-manager.js';
import TextDisplayManager from './src/text-display-manager.js';
import ImageDisplayManager from './src/image-display-manager.js';
import SmartRedactorManager from './src/smartRedactor.js';
import VoiceRecorderManager from './src/voice-recorder-manager.js';

class StreamingStudio {
    constructor() {
        this.mediaStream = null;
        this.isRecording = false;
        this.recordingStartTime = null;
        this.recordingTimer = null;
        this.recordingTimerInterval = null;
        this.websimRecordingSession = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.panelCollapsed = false;
        
                this.isInitialized = false;
        this.initializationError = null;
        
        this.initializeApplication();
    }

        async initializeApplication() {
        try {
            this.initializeElements();
            this.initializeManagers();
            this.bindEvents();
            this.bindKeyboardShortcuts();
            await this.initializeWebSimAPI();
            
                        this.isInitialized = true;
            console.log('StreamingStudio initialized successfully');
            
        } catch (error) {
            console.error('StreamingStudio initialization error:', error);
            this.initializationError = error;
            this.showInitializationError(error);
        }
    }

        showInitializationError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '20px';
        errorDiv.style.left = '20px';
        errorDiv.style.background = 'rgba(231, 76, 60, 0.9)';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '15px';
        errorDiv.style.borderRadius = '8px';
        errorDiv.style.zIndex = '10000';
        errorDiv.style.maxWidth = '400px';
        errorDiv.innerHTML = `
            <h4>🚨 Initialization Error</h4>
            <p>The streaming studio failed to initialize properly.</p>
            <p><strong>Error:</strong> ${error.message}</p>
            <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px; border: none; background: white; color: #e74c3c; border-radius: 4px; cursor: pointer;">Dismiss</button>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 10000);
    }
    
    initializeElements() {
        // Control elements
        this.urlInput = document.getElementById('urlInput');
        this.loadBtn = document.getElementById('loadBtn');
        this.mediaUploadInput = document.getElementById('mediaUploadInput');
        this.browseMediaBtn = document.getElementById('browseMediaBtn');
        this.mediaInfoDisplay = document.getElementById('mediaInfoDisplay');
        this.mediaFileName = document.getElementById('mediaFileName');
        this.mediaFileSize = document.getElementById('mediaFileSize');
        this.maintainAspectRatio = document.getElementById('maintainAspectRatio');
        this.hideMediaControls = document.getElementById('hideMediaControls');
        this.autoplayMedia = document.getElementById('autoplayMedia');
        
        this.cameraBtn = document.getElementById('cameraBtn');
        this.micBtn = document.getElementById('micBtn');
        this.iframeRecordBtn = document.getElementById('iframeRecordBtn');
        this.recordBtn = document.getElementById('recordBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        
        // Content elements
        this.contentDisplay = document.getElementById('contentDisplay');
        this.contentFrame = document.getElementById('contentFrame');
        this.welcomeScreen = document.querySelector('.welcome-screen');
        
        // Status elements
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');
        
        // Info modal elements
        this.infoBtn = document.getElementById('infoBtn');
        this.infoModal = document.getElementById('infoModal');
       this.infoCloseBtn = document.getElementById('infoCloseBtn');

                this.validateRequiredElements();
        this.verifyIframeRecordBtnWithinPanel();
    }

        validateRequiredElements() {
        const requiredElements = [
            'urlInput', 'loadBtn', 'cameraBtn', 'micBtn', 'iframeRecordBtn', 'recordBtn',
            'contentDisplay', 'statusDot', 'statusText'
        ];
        
        const missingElements = requiredElements.filter(elementName => {
            const element = this[elementName];
            return !element;
        });
        
        if (missingElements.length > 0) {
            console.warn('Missing required DOM elements:', missingElements);
            throw new Error(`Required DOM elements not found: ${missingElements.join(', ')}`);
        }
    }

    verifyIframeRecordBtnWithinPanel() {
        const controlPanel = document.querySelector('.control-panel');
        if (!controlPanel || !this.iframeRecordBtn) return;

        const btnRect = this.iframeRecordBtn.getBoundingClientRect();
        const panelRect = controlPanel.getBoundingClientRect();

        const isWithin = btnRect.top >= panelRect.top &&
            btnRect.left >= panelRect.left &&
            btnRect.bottom <= panelRect.bottom &&
            btnRect.right <= panelRect.right;

        if (!isWithin) {
            const message = 'iframeRecordBtn is not fully contained within the control panel';
            console.error(message, { btnRect, panelRect });
            throw new Error(message);
        }
    }
    
    initializeManagers() {
                try {
            this.cameraManager = new CameraManager(this);
            this.recordingManager = new RecordingManager(this);
            this.uiManager = new UIManager(this);
            this.audioManager = new AudioManager(this);
            this.cursorEffectsManager = new CursorEffectsManager(this);
            this.textDisplayManager = new TextDisplayManager(this);
            this.imageDisplayManager = new ImageDisplayManager(this);
            this.voiceRecorderManager = new VoiceRecorderManager(this);
            this.smartRedactorManager = new SmartRedactorManager(this);
            console.log('All managers initialized successfully');
        } catch (error) {
            console.error('Manager initialization error:', error);
            throw new Error(`Failed to initialize managers: ${error.message}`);
        }
    }

        safeManagerCall(managerName, methodName, ...args) {
        try {
            if (!this.isInitialized) {
                console.warn(`Application not initialized, skipping ${managerName}.${methodName} call`);
                return null;
            }
            
            const manager = this[managerName];
            if (!manager) {
                console.warn(`Manager ${managerName} not found`);
                return null;
            }
            
            const method = manager[methodName];
            if (typeof method !== 'function') {
                console.warn(`Method ${methodName} not found on ${managerName}`);
                return null;
            }
            
            return method.apply(manager, args);
        } catch (error) {
            console.error(`Error calling ${managerName}.${methodName}:`, error);
            return null;
        }
    }
    
    bindEvents() {
                try {
            // Load content
            if (this.loadBtn) {
                this.loadBtn.addEventListener('click', () => this.loadContent());
            }
            if (this.urlInput) {
                this.urlInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.loadContent();
                });
            }
            
            if (this.browseMediaBtn && this.mediaUploadInput) {
                this.browseMediaBtn.addEventListener('click', () => this.mediaUploadInput.click());
                this.mediaUploadInput.addEventListener('change', (e) => this.handleMainMediaUpload(e));
            }
            
            // Quick links
            document.querySelectorAll('.quick-link-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const url = e.target.getAttribute('data-url');
                    if (this.urlInput) {
                        this.urlInput.value = url;
                        this.loadContent();
                    }
                });
            });
            
            // Media controls - with safe manager calls
            if (this.cameraBtn) {
                this.cameraBtn.addEventListener('click', () => 
                    this.safeManagerCall('cameraManager', 'toggleCameraStream')
                );
            }
            if (this.micBtn) {
                this.micBtn.addEventListener('click', () => 
                    this.safeManagerCall('cameraManager', 'toggleMicrophone')
                );
            }
            
            // Recording controls - with safe manager calls
            if (this.recordBtn) {
                this.recordBtn.addEventListener('click', () =>
                    this.safeManagerCall('recordingManager', 'toggleRecording')
                );
            }
            if (this.iframeRecordBtn) {
                this.iframeRecordBtn.addEventListener('click', () => {
                    const recording = this.iframeRecordBtn.dataset.recording === 'true';
                    const label = this.iframeRecordBtn.querySelector('.label');
                    const icon = this.iframeRecordBtn.querySelector('.icon');

                    if (!recording) {
                        this.safeManagerCall('recordingManager', 'startRecording', { source: 'iframe' });
                        this.isRecording = true;
                        this.iframeRecordBtn.dataset.recording = 'true';
                        if (label) label.textContent = 'Stop IFrame';
                        if (icon) icon.textContent = '⏹️';
                    } else {
                        this.safeManagerCall('recordingManager', 'stopRecording');
                        this.isRecording = false;
                        this.iframeRecordBtn.dataset.recording = 'false';
                        if (label) label.textContent = 'Record IFrame';
                        if (icon) icon.textContent = '🖼️';
                    }
                });
            }
            if (this.pauseBtn) {
                this.pauseBtn.addEventListener('click', () =>
                    this.safeManagerCall('recordingManager', 'togglePause')
                );
            }
            if (this.stopBtn) {
                this.stopBtn.addEventListener('click', () => 
                    this.safeManagerCall('recordingManager', 'stopRecording')
                );
            }
            
            // Info modal - with safe manager calls
            if (this.infoBtn) {
                this.infoBtn.addEventListener('click', () => 
                    this.safeManagerCall('uiManager', 'showInfoModal')
                );
            }
            if (this.infoCloseBtn) {
                this.infoCloseBtn.addEventListener('click', () => 
                    this.safeManagerCall('uiManager', 'hideInfoModal')
                );
            }
            
            // Handle window resize - with safe manager calls
            window.addEventListener('resize', () => this.handleResize());
            
            // Add fullscreen button event listener - with safe manager call
            const fullscreenBtn = document.getElementById('fullscreenBtn');
            if (fullscreenBtn) {
                fullscreenBtn.addEventListener('click', () => 
                    this.safeManagerCall('uiManager', 'toggleFullscreen')
                );
            }
            
            console.log('Events bound successfully');
        } catch (error) {
            console.error('Event binding error:', error);
            throw new Error(`Failed to bind events: ${error.message}`);
        }
    }
    
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }
            
            switch (e.key.toLowerCase()) {
                case 'c':
                    this.uiManager.togglePanel();
                    e.preventDefault();
                    break;
                case 'l':
                    this.loadContent();
                    e.preventDefault();
                    break;
                case 'v':
                    this.cameraManager.toggleCameraStream();
                    e.preventDefault();
                    break;
                case 'm':
                    this.cameraManager.toggleMicrophone();
                    e.preventDefault();
                    break;
                case 'f':
                    this.uiManager.toggleFullscreen();
                    e.preventDefault();
                    break;
                case 'r':
                    if (!this.isRecording) {
                        if (e.shiftKey) {
                            this.recordingManager.startRecording();
                        } else {
                            this.voiceRecorderManager.togglePanel();
                        }
                    }
                    e.preventDefault();
                    break;
                case 'p':
                    if (this.isRecording) {
                        this.recordingManager.togglePause();
                    } else {
                        this.cameraManager.toggleCameraVisibility();
                    }
                    e.preventDefault();
                    break;
                case 's':
                    if (this.isRecording) {
                        this.recordingManager.stopRecording();
                    }
                    e.preventDefault();
                    break;
                case 'i':
                    this.imageDisplayManager.togglePanel();
                    e.preventDefault();
                    break;
                case 'a':
                    this.smartRedactorManager.togglePanel();
                    e.preventDefault();
                    break;
                case 'escape':
                    if (this.infoModal.style.display === 'block') {
                        this.uiManager.hideInfoModal();
                    }
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                    e.preventDefault();
                    break;
            }
        });
    }
    
    async initializeWebSimAPI() {
        try {
            const apiDetectionTimeout = 2000; // milliseconds
            
            // Check for native browser screen recording capabilities first
            if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                console.log('Native screen recording API available');
                this.websimAPI = {
                    startRecording: async (options) => {
                        // This will be handled by the RecordingManager using MediaRecorder API
                        return { success: true, sessionId: 'native-' + Date.now() };
                    },
                    stopRecording: async (sessionId) => {
                        return { success: true, recordingUrl: null };
                    },
                    getStatus: async (sessionId) => {
                        return { status: 'recording', duration: this.recordingStartTime ? Date.now() - this.recordingStartTime : 0 };
                    }
                };
                return;
            }
            
            // Check for WebSim-specific recording APIs
            if (typeof window.websim !== 'undefined' && window.websim.screenRecorder) {
                console.log('WebSim Screen Recorder API detected');
                this.websimAPI = window.websim.screenRecorder;
            } else if (typeof WebSim !== 'undefined' && WebSim.screenRecorder) {
                console.log('WebSim Screen Recorder API (global) detected');
                this.websimAPI = WebSim.screenRecorder;
            } else if (typeof window.websim !== 'undefined' && window.websim.recording) {
                console.log('WebSim Recording API detected');
                this.websimAPI = window.websim.recording;
            } else {
                console.log('No supported recording API available, using enhanced fallback');
                this.websimAPI = this.createEnhancedFallbackAPI();
            }
        } catch (error) {
            console.error('Error initializing WebSim API:', error);
            this.websimAPI = this.createEnhancedFallbackAPI();
        }
    }
    
    createEnhancedFallbackAPI() {
        return {
            startRecording: async (options) => {
                console.log('Enhanced fallback recording started with options:', options);
                
                const simulationDelay = 500;
                
                // Simulate API processing
                await new Promise(resolve => setTimeout(resolve, simulationDelay));
                
                throw new Error('Screen recording not supported. Please use a browser that supports getDisplayMedia API or enable screen sharing permissions.');
            },
            stopRecording: async (sessionId) => {
                console.log('Enhanced fallback recording stopped for session:', sessionId);
                return { success: false, error: 'Recording not supported' };
            },
            getStatus: async (sessionId) => {
                return { status: 'unsupported', duration: 0 };
            }
        };
    }
    
    createFallbackAPI() {
        // Keep the old fallback for compatibility
        return this.createEnhancedFallbackAPI();
    }
    
    async loadContent() {
        const url = this.urlInput.value.trim();
        if (!url) return;
        
        this.updateStatus('Loading...', 'loading');
        
        try {
            let validUrl = url;
            if (!url.startsWith('http://') && !url.startsWith('https://') && url !== 'about:blank') {
                validUrl = 'https://' + url;
            }
            
            this.contentFrame.src = validUrl;
            this.welcomeScreen.style.display = 'none';
            this.contentFrame.style.display = 'block';
            
            this.contentFrame.onload = () => {
                this.updateStatus('Content Loaded', 'ready');
            };
            
            this.contentFrame.onerror = () => {
                this.updateStatus('Load Failed', 'error');
                this.showWelcomeScreen();
            };
            
        } catch (error) {
            console.error('Error loading content:', error);
            this.updateStatus('Load Error', 'error');
            this.showWelcomeScreen();
        }
    }
    
    async handleMainMediaUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const maxMediaSize = 200 * 1024 * 1024; // 200MB limit for main content media
            const supportedVideoTypes = [
                'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 
                'video/wmv', 'video/flv', 'video/mkv', 'video/3gp', 'video/m4v',
                'video/quicktime', 'video/x-msvideo'
            ];
            const supportedAudioTypes = [
                'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 
                'audio/m4a', 'audio/webm', 'audio/flac', 'audio/wma'
            ];
            
            if (file.size > maxMediaSize) {
                alert('Media file too large. Maximum allowed size is 200MB.');
                return;
            }
            
            const fileType = file.type;
            const isVideo = supportedVideoTypes.includes(fileType) || this.isVideoFileByExtension(file.name);
            const isAudio = supportedAudioTypes.includes(fileType) || this.isAudioFileByExtension(file.name);
            
            if (!isVideo && !isAudio) {
                alert('Unsupported media format. Please select a video or audio file.');
                return;
            }
            
            this.updateStatus('Loading Media...', 'loading');
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                const mediaData = {
                    type: fileType || (isVideo ? 'video/mp4' : 'audio/mpeg'),
                    data: e.target.result,
                    name: file.name,
                    size: file.size,
                    isVideo: isVideo,
                    isAudio: isAudio
                };
                
                // Update media info display
                this.updateMediaInfoDisplay(mediaData);
                
                // Load media into content area
                await this.loadMediaContent(mediaData);
                
                console.log(`Main media loaded: ${file.name} (${isVideo ? 'video' : 'audio'})`);
            };
            
            reader.readAsDataURL(file);
            
        } catch (error) {
            console.error('Error handling main media upload:', error);
            alert('Error loading media file: ' + error.message);
            this.updateStatus('Media Load Error', 'error');
        }
    }
    
    updateMediaInfoDisplay(mediaData) {
        this.mediaFileName.textContent = ` ${mediaData.name}`;
        this.mediaFileSize.textContent = `(${this.formatFileSize(mediaData.size)})`;
        this.mediaInfoDisplay.style.display = 'block';
    }
    
    async loadMediaContent(mediaData) {
        try {
            // Hide welcome screen and clear existing content
            this.welcomeScreen.style.display = 'none';
            this.contentFrame.style.display = 'none';
            
            // Create media element
            let mediaElement;
            const { type, data, isVideo, isAudio, name } = mediaData;
            
            if (isVideo) {
                mediaElement = document.createElement('video');
                mediaElement.src = data;
                
                mediaElement.controls = !this.hideMediaControls.checked;
                mediaElement.controlsList = this.hideMediaControls.checked ? 'nodownload nofullscreen noremoteplayback' : '';
                mediaElement.disablePictureInPicture = this.hideMediaControls.checked;
                mediaElement.disableRemotePlayback = this.hideMediaControls.checked;
                
                if (this.hideMediaControls.checked) {
                    mediaElement.oncontextmenu = (e) => e.preventDefault();
                    mediaElement.style.pointerEvents = 'none';
                    mediaElement.addEventListener('contextmenu', (e) => e.preventDefault());
                    mediaElement.addEventListener('selectstart', (e) => e.preventDefault());
                    mediaElement.style.webkitUserSelect = 'none';
                    mediaElement.style.userSelect = 'none';
                }
                
                mediaElement.autoplay = true; // Always autoplay for better UX
                mediaElement.muted = false; // Allow audio for main content

                if (this.maintainAspectRatio.checked) {
                    try {
                        const dimensions = await this.extractVideoDimensions(data);
                        if (dimensions.width && dimensions.height) {
                            const aspectRatio = dimensions.width / dimensions.height;
                            mediaElement.style.aspectRatio = aspectRatio;
                            mediaElement.style.objectFit = 'contain';
                            console.log(`Video aspect ratio applied: ${aspectRatio}`);
                        }
                    } catch (error) {
                        console.warn('Could not extract video dimensions:', error);
                    }
                }
                
                mediaElement.style.width = '100%';
                mediaElement.style.height = '100%';
                mediaElement.style.maxWidth = '100%';
                mediaElement.style.maxHeight = '100%';
                
            } else if (isAudio) {
                // Create audio player container
                const audioContainer = document.createElement('div');
                audioContainer.style.display = 'flex';
                audioContainer.style.flexDirection = 'column';
                audioContainer.style.alignItems = 'center';
                audioContainer.style.justifyContent = 'center';
                audioContainer.style.height = '100%';
                audioContainer.style.background = 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)';
                audioContainer.style.color = 'white';
                
                audioContainer.innerHTML = `
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="font-size: 64px; margin-bottom: 20px;"></div>
                        <h2 style="margin: 0 0 10px 0; font-size: 24px;">${name}</h2>
                        <p style="margin: 0; opacity: 0.7;">Audio Player</p>
                    </div>
                `;
                
                const audio = document.createElement('audio');
                audio.src = data;
                
                audio.controls = !this.hideMediaControls.checked;
                audio.controlsList = this.hideMediaControls.checked ? 'nodownload noremoteplayback' : '';
                audio.disableRemotePlayback = this.hideMediaControls.checked;
                
                if (this.hideMediaControls.checked) {
                    audio.oncontextmenu = (e) => e.preventDefault();
                    audio.style.pointerEvents = 'none';
                    audio.addEventListener('contextmenu', (e) => e.preventDefault());
                    audio.addEventListener('selectstart', (e) => e.preventDefault());
                    audio.style.webkitUserSelect = 'none';
                    audio.style.userSelect = 'none';
                }
                
                audio.autoplay = true; // Always autoplay for better UX
                audio.style.width = '80%';
                audio.style.maxWidth = '600px';
                
                audioContainer.appendChild(audio);
                mediaElement = audioContainer;
            }
            
            // Clear content display and add media element
            this.contentDisplay.innerHTML = '';
            this.contentDisplay.appendChild(mediaElement);
            
            this.updateStatus('Media Loaded', 'ready');
            
        } catch (error) {
            console.error('Error loading media content:', error);
            this.updateStatus('Media Load Error', 'error');
            this.showWelcomeScreen();
        }
    }
    
    isVideoFileByExtension(filename) {
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.3gp', '.m4v'];
        const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return videoExtensions.includes(extension);
    }
    
    isAudioFileByExtension(filename) {
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.webm', '.flac', '.wma'];
        const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return audioExtensions.includes(extension);
    }
    
    extractVideoDimensions(dataUrl) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.onloadedmetadata = () => {
                resolve({
                    width: video.videoWidth,
                    height: video.videoHeight
                });
            };
            video.onerror = () => {
                reject(new Error('Failed to load video for dimension extraction'));
            };
            setTimeout(() => {
                reject(new Error('Video dimension extraction timeout'));
            }, 5000);
            video.src = dataUrl;
        });
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showWelcomeScreen() {
        this.contentFrame.style.display = 'none';
        const mediaElements = this.contentDisplay.querySelectorAll('video, audio, div');
        mediaElements.forEach(el => {
            if (el !== this.welcomeScreen && el !== this.contentFrame) {
                el.remove();
            }
        });
        this.welcomeScreen.style.display = 'flex';
        if (this.mediaInfoDisplay) {
            this.mediaInfoDisplay.style.display = 'none';
        }
    }

    updateStatus(text, type) {
        this.statusText.textContent = text;
        this.statusDot.className = 'status-dot';
        
        switch (type) {
            case 'ready':
                this.statusDot.style.background = '#48bb78';
                break;
            case 'loading':
                this.statusDot.style.background = '#ed8936';
                break;
            case 'recording':
                this.statusDot.style.background = '#f56565';
                break;
            case 'error':
                this.statusDot.style.background = '#e53e3e';
                break;
        }
    }
    
    handleResize() {
                try {
            this.safeManagerCall('cameraManager', 'handleResize');
            this.safeManagerCall('uiManager', 'handleResize');
        } catch (error) {
            console.error('Resize handling error:', error);
        }
    }
}

// Initialize the application with error handling
document.addEventListener('DOMContentLoaded', () => {
        try {
        console.log('DOM loaded, initializing StreamingStudio...');
        window.streamingStudio = new StreamingStudio();
    } catch (error) {
        console.error('Critical initialization error:', error);
        
        // Show user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(231, 76, 60, 0.95);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            z-index: 10000;
            max-width: 500px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        `;
        
        errorMessage.innerHTML = `
            <h2>🚨 Application Failed to Start</h2>
            <p>The streaming studio encountered a critical error and cannot start properly.</p>
            <p><strong>Technical Details:</strong><br>${error.message}</p>
            <button onclick="window.location.reload()" style="
                margin-top: 20px;
                padding: 10px 20px;
                border: none;
                background: white;
                color: #e74c3c;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
            ">Reload Page</button>
        `;
        
        document.body.appendChild(errorMessage);
    }
});