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
        
        // Iframe size controls
        this.iframeWidth = document.getElementById('iframeWidth');
        this.iframeHeight = document.getElementById('iframeHeight');
        this.iframeWidthValue = document.getElementById('iframeWidthValue');
        this.iframeHeightValue = document.getElementById('iframeHeightValue');
        
        // Enhanced iframe size controls
        this.lockAspectRatio = document.getElementById('lockAspectRatio');
        this.currentAspectRatio = document.getElementById('currentAspectRatio');
        this.customWidth = document.getElementById('customWidth');
        this.customHeight = document.getElementById('customHeight');
        this.applyCustomSize = document.getElementById('applyCustomSize');
        
        this.baseWidth = 800;
        this.baseHeight = 600;
        this.currentAspectRatioValue = this.baseWidth / this.baseHeight;
        
        this.cameraBtn = document.getElementById('cameraBtn');
        this.micBtn = document.getElementById('micBtn');
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
    }

        validateRequiredElements() {
        const requiredElements = [
            'urlInput', 'loadBtn', 'cameraBtn', 'micBtn', 'recordBtn',
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
            
            // Iframe size controls
            if (this.iframeWidth) {
                this.iframeWidth.addEventListener('input', () => this.updateIframeSize());
            }
            if (this.iframeHeight) {
                this.iframeHeight.addEventListener('input', () => this.updateIframeSize());
            }
            
            // Enhanced iframe size controls
            if (this.lockAspectRatio) {
                this.lockAspectRatio.addEventListener('change', () => this.updateAspectRatioDisplay());
            }
            
            if (this.customWidth) {
                this.customWidth.addEventListener('input', () => this.handleCustomSizeInput('width'));
            }
            
            if (this.customHeight) {
                this.customHeight.addEventListener('input', () => this.handleCustomSizeInput('height'));
            }
            
            if (this.applyCustomSize) {
                this.applyCustomSize.addEventListener('click', () => this.applyCustomSizeInputs());
            }
            
            // Scale buttons
            document.querySelectorAll('.scale-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const scale = parseFloat(e.target.getAttribute('data-scale'));
                    this.scaleIframe(scale);
                });
            });
            
            // Iframe size preset buttons
            document.querySelectorAll('.size-preset-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const width = e.target.getAttribute('data-width');
                    const height = e.target.getAttribute('data-height');
                    this.setIframeSize(parseInt(width), parseInt(height));
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
    
    updateIframeSize() {
        if (!this.contentFrame || !this.iframeWidth || !this.iframeHeight) return;
        
        let width = parseInt(this.iframeWidth.value);
        let height = parseInt(this.iframeHeight.value);
        
        // Handle aspect ratio locking
        if (this.lockAspectRatio && this.lockAspectRatio.checked) {
            const currentRatio = width / height;
            if (Math.abs(currentRatio - this.currentAspectRatioValue) > 0.01) {
                // If user changed width, adjust height
                if (this.lastChangedDimension === 'width') {
                    height = Math.round(width / this.currentAspectRatioValue);
                    this.iframeHeight.value = height;
                } else {
                    // If user changed height, adjust width
                    width = Math.round(height * this.currentAspectRatioValue);
                    this.iframeWidth.value = width;
                }
            }
        } else {
            // Update aspect ratio if not locked
            this.currentAspectRatioValue = width / height;
        }
        
        // Update iframe size
        this.contentFrame.style.width = `${width}px`;
        this.contentFrame.style.height = `${height}px`;
        
        // Update display values
        if (this.iframeWidthValue) {
            this.iframeWidthValue.textContent = `${width}px`;
        }
        if (this.iframeHeightValue) {
            this.iframeHeightValue.textContent = `${height}px`;
        }
        
        // Update aspect ratio display
        this.updateAspectRatioDisplay();
        
        // Update custom inputs to match sliders
        if (this.customWidth) this.customWidth.value = width;
        if (this.customHeight) this.customHeight.value = height;
        
        // Center the iframe in the content area
        this.centerIframe();
        
        // Notify camera manager of iframe size change
        if (this.cameraManager) {
            setTimeout(() => {
                this.cameraManager.handleIframeSizeChange();
            }, 100);
        }
    }
    
    updateAspectRatioDisplay() {
        if (!this.currentAspectRatio) return;
        
        const width = parseInt(this.iframeWidth.value || this.baseWidth);
        const height = parseInt(this.iframeHeight.value || this.baseHeight);
        const ratio = width / height;
        
        // Find closest common aspect ratio
        const commonRatios = [
            { ratio: 16/9, label: '16:9' },
            { ratio: 4/3, label: '4:3' },
            { ratio: 3/2, label: '3:2' },
            { ratio: 1/1, label: '1:1' },
            { ratio: 5/4, label: '5:4' },
            { ratio: 21/9, label: '21:9' }
        ];
        
        let closestRatio = commonRatios[0];
        let smallestDiff = Math.abs(ratio - closestRatio.ratio);
        
        commonRatios.forEach(r => {
            const diff = Math.abs(ratio - r.ratio);
            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestRatio = r;
            }
        });
        
        // Show exact ratio if no close match
        if (smallestDiff > 0.05) {
            const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
            const divisor = gcd(width, height);
            this.currentAspectRatio.textContent = `${width/divisor}:${height/divisor}`;
        } else {
            this.currentAspectRatio.textContent = closestRatio.label;
        }
    }
    
    handleCustomSizeInput(dimension) {
        // Track which dimension was last changed for aspect ratio locking
        this.lastChangedDimension = dimension;
        
        if (this.lockAspectRatio && this.lockAspectRatio.checked) {
            const width = parseInt(this.customWidth.value) || this.baseWidth;
            const height = parseInt(this.customHeight.value) || this.baseHeight;
            
            if (dimension === 'width') {
                const newHeight = Math.round(width / this.currentAspectRatioValue);
                this.customHeight.value = newHeight;
            } else {
                const newWidth = Math.round(height * this.currentAspectRatioValue);
                this.customWidth.value = newWidth;
            }
        }
    }
    
    applyCustomSizeInputs() {
        const width = parseInt(this.customWidth.value);
        const height = parseInt(this.customHeight.value);
        
        if (!width || !height || width < 200 || height < 150) {
            alert('Please enter valid dimensions (minimum 200×150)');
            return;
        }
        
        this.setIframeSize(width, height);
    }
    
    scaleIframe(scale) {
        const currentWidth = parseInt(this.iframeWidth.value);
        const currentHeight = parseInt(this.iframeHeight.value);
        
        const newWidth = Math.round(this.baseWidth * scale);
        const newHeight = Math.round(this.baseHeight * scale);
        
        this.setIframeSize(newWidth, newHeight);
    }
    
    setIframeSize(width, height) {
        if (!this.iframeWidth || !this.iframeHeight) return;
        
        // Update stored base dimensions and aspect ratio
        this.baseWidth = width;
        this.baseHeight = height;
        this.currentAspectRatioValue = width / height;
        
        // Update slider values
        this.iframeWidth.value = width;
        this.iframeHeight.value = height;
        
        // Update the iframe
        this.updateIframeSize();
    }
    
    centerIframe() {
        if (!this.contentFrame) return;
        
        // Center the iframe within the content display area
        this.contentFrame.style.margin = '20px auto';
        this.contentFrame.style.display = 'block';
        this.contentFrame.style.border = '2px solid rgba(102, 126, 234, 0.3)';
        this.contentFrame.style.borderRadius = '8px';
        this.contentFrame.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
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

// Settings Management Functions
function initializeSettingsManagement() {
    const saveBtn = document.getElementById('saveSettingsBtn');
    const loadBtn = document.getElementById('loadSettingsBtn');
    const fileInput = document.getElementById('settingsFileInput');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', saveCurrentSettings);
    }
    
    if (loadBtn) {
        loadBtn.addEventListener('click', () => fileInput?.click());
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', handleSettingsFileLoad);
    }
    
    // Update Kimi and ElevenLabs display when preferences change
    const imgPref = document.getElementById('imgPref');
    const txtPref = document.getElementById('txtPref');
    const ttsPref = document.getElementById('ttsPref');
    const kimiRow = document.getElementById('row-KIMI_API_KEY');
    const elevenlabsRow = document.getElementById('row-ELEVENLABS_API_KEY');
    
    const updateConditionalDisplay = () => {
        // Show Kimi key if selected in img or text preferences
        if (kimiRow) {
            const showKimi = (imgPref?.value === 'kimi') || (txtPref?.value === 'kimi');
            kimiRow.style.display = showKimi ? 'block' : 'none';
        }
        
        // Show ElevenLabs key if selected in TTS preferences
        if (elevenlabsRow) {
            const showElevenLabs = (ttsPref?.value === 'elevenlabs');
            elevenlabsRow.style.display = showElevenLabs ? 'block' : 'none';
        }
    };
    
    if (imgPref) imgPref.addEventListener('change', updateConditionalDisplay);
    if (txtPref) txtPref.addEventListener('change', updateConditionalDisplay);
    if (ttsPref) ttsPref.addEventListener('change', updateConditionalDisplay);
    
    // Initial check
    updateConditionalDisplay();
}

function saveCurrentSettings() {
    try {
        const settings = {
            collectionId: 'SmDeltArt-SmΔrt-Collection',
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            exportedFrom: 'SmΔrt Streaming Studio',
            apiKeys: {},
            preferences: {}
        };
        
        // Save API keys
        const keyMappings = [
            { id: 'OPENAI_API_KEY', key: 'OPENAI_API_KEY' },
            { id: 'XAI_API_KEY', key: 'XAI_API_KEY' },
            { id: 'KIMI_API_KEY', key: 'KIMI_API_KEY' },
            { id: 'FAL_API_KEY', key: 'FAL_API_KEY' },
            { id: 'GROQ_API_KEY', key: 'GROQ_API_KEY' },
            { id: 'COHERE_API_KEY', key: 'COHERE_API_KEY' },
            { id: 'TOGETHER_API_KEY', key: 'TOGETHER_API_KEY' },
            { id: 'ELEVENLABS_API_KEY', key: 'ELEVENLABS_API_KEY' },
            { id: 'HUGGINGFACE_API_KEY', key: 'HUGGINGFACE_API_KEY' },
            { id: 'GEMINI_API_KEY', key: 'GEMINI_API_KEY' },
            { id: 'OLLAMA_ENDPOINT', key: 'OLLAMA_ENDPOINT' },
            { id: 'DEEPSEEK_API_KEY', key: 'DEEPSEEK_API_KEY' }
        ];
        
        keyMappings.forEach(({ id, key }) => {
            const input = document.getElementById(id);
            if (input && input.value.trim()) {
                settings.apiKeys[key] = input.value.trim();
            }
        });
        
        // Save preferences
        const imgPref = document.getElementById('imgPref');
        const txtPref = document.getElementById('txtPref');
        const ttsPref = document.getElementById('ttsPref');
        
        if (imgPref) settings.preferences.IMG_AI_PREF = imgPref.value;
        if (txtPref) settings.preferences.TXT_AI_PREF = txtPref.value;
        if (ttsPref) settings.preferences.TTS_AI_PREF = ttsPref.value;
        
        // Create and download file
        const blob = new Blob([JSON.stringify(settings, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smart-settings-streaming-studio-${Date.now()}.smart`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        // Show success message
        showSettingsMessage('Settings saved successfully! 💾', 'success');
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showSettingsMessage('Error saving settings: ' + error.message, 'error');
    }
}

function handleSettingsFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const settings = JSON.parse(e.target.result);
            loadSettingsFromObject(settings);
            showSettingsMessage('Settings loaded successfully! 📂', 'success');
        } catch (error) {
            console.error('Error loading settings:', error);
            showSettingsMessage('Error loading settings: Invalid file format', 'error');
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

function loadSettingsFromObject(settings) {
    // Load API keys
    if (settings.apiKeys) {
        const keyMappings = [
            { id: 'OPENAI_API_KEY', key: 'OPENAI_API_KEY' },
            { id: 'XAI_API_KEY', key: 'XAI_API_KEY' },
            { id: 'KIMI_API_KEY', key: 'KIMI_API_KEY' },
            { id: 'FAL_API_KEY', key: 'FAL_API_KEY' },
            { id: 'GROQ_API_KEY', key: 'GROQ_API_KEY' },
            { id: 'COHERE_API_KEY', key: 'COHERE_API_KEY' },
            { id: 'TOGETHER_API_KEY', key: 'TOGETHER_API_KEY' },
            { id: 'ELEVENLABS_API_KEY', key: 'ELEVENLABS_API_KEY' },
            { id: 'HUGGINGFACE_API_KEY', key: 'HUGGINGFACE_API_KEY' },
            { id: 'GEMINI_API_KEY', key: 'GEMINI_API_KEY' },
            { id: 'OLLAMA_ENDPOINT', key: 'OLLAMA_ENDPOINT' },
            { id: 'DEEPSEEK_API_KEY', key: 'DEEPSEEK_API_KEY' }
        ];
        
        keyMappings.forEach(({ id, key }) => {
            const input = document.getElementById(id);
            if (input && settings.apiKeys[key]) {
                input.value = settings.apiKeys[key];
                // Also save to localStorage
                localStorage.setItem(key, settings.apiKeys[key]);
            }
        });
    }
    
    // Load preferences
    if (settings.preferences) {
        const imgPref = document.getElementById('imgPref');
        const txtPref = document.getElementById('txtPref');
        const ttsPref = document.getElementById('ttsPref');
        
        if (imgPref && settings.preferences.IMG_AI_PREF) {
            imgPref.value = settings.preferences.IMG_AI_PREF;
            localStorage.setItem('IMG_AI_PREF', settings.preferences.IMG_AI_PREF);
        }
        
        if (txtPref && settings.preferences.TXT_AI_PREF) {
            txtPref.value = settings.preferences.TXT_AI_PREF;
            localStorage.setItem('TXT_AI_PREF', settings.preferences.TXT_AI_PREF);
        }
        
        if (ttsPref && settings.preferences.TTS_AI_PREF) {
            ttsPref.value = settings.preferences.TTS_AI_PREF;
            localStorage.setItem('TTS_AI_PREF', settings.preferences.TTS_AI_PREF);
        }
    }
    
    // Update conditional display after loading
    const imgPrefEl = document.getElementById('imgPref');
    const txtPrefEl = document.getElementById('txtPref');
    const ttsPrefEl = document.getElementById('ttsPref');
    const kimiRow = document.getElementById('row-KIMI_API_KEY');
    const elevenlabsRow = document.getElementById('row-ELEVENLABS_API_KEY');
    
    if (kimiRow) {
        const showKimi = (imgPrefEl?.value === 'kimi') || (txtPrefEl?.value === 'kimi');
        kimiRow.style.display = showKimi ? 'block' : 'none';
    }
    
    if (elevenlabsRow) {
        const showElevenLabs = (ttsPrefEl?.value === 'elevenlabs');
        elevenlabsRow.style.display = showElevenLabs ? 'block' : 'none';
    }
}

function showSettingsMessage(message, type) {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
        ${type === 'success' ? 
            'background: linear-gradient(135deg, #48bb78, #38a169); color: white;' : 
            'background: linear-gradient(135deg, #f56565, #e53e3e); color: white;'}
    `;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    // Animate in
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(0)';
        messageDiv.style.opacity = '1';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(100%)';
        messageDiv.style.opacity = '0';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// Initialize settings management when DOM is ready
document.addEventListener('DOMContentLoaded', initializeSettingsManagement);