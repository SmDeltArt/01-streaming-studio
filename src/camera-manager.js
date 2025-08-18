export default class CameraManager {
    constructor(app) {
        this.app = app;
        this.mediaStream = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        this.initializeElements();
        this.bindEvents();
        this.setupCameraDragging();
        this.initializeCameraSettings();
    }
    
    initializeElements() {
        this.cameraPosition = document.getElementById('cameraPosition');
        this.cameraSize = document.getElementById('cameraSize');
        this.cameraSizeValue = document.getElementById('cameraSizeValue');
        this.frameShape = document.getElementById('frameShape');
        this.borderStyle = document.getElementById('borderStyle');
        this.visualEffects = document.getElementById('visualEffects');
        this.autoFocus = document.getElementById('autoFocus');
        this.hoverScale = document.getElementById('hoverScale');
        this.shadowIntensity = document.getElementById('shadowIntensity');
        this.shadowValue = document.getElementById('shadowValue');
        
        this.cameraOverlay = document.getElementById('cameraOverlay');
        this.cameraVideo = document.getElementById('cameraVideo');
        this.toggleCamera = document.getElementById('toggleCamera');
        this.toggleMic = document.getElementById('toggleMic');
        this.dragHandle = document.getElementById('dragHandle');
    }
    
    bindEvents() {
        this.cameraPosition.addEventListener('change', () => this.updateCameraPosition());
        this.cameraSize.addEventListener('input', () => this.updateCameraSize());
        this.frameShape.addEventListener('change', () => this.updateFrameShape());
        this.borderStyle.addEventListener('change', () => this.updateBorderStyle());
        this.visualEffects.addEventListener('change', () => this.updateVisualEffects());
        this.autoFocus.addEventListener('change', () => this.updateAutoFocus());
        this.hoverScale.addEventListener('change', () => this.updateHoverScale());
        this.shadowIntensity.addEventListener('input', () => this.updateShadowIntensity());
        
        this.toggleCamera.addEventListener('click', () => this.toggleCameraVisibility());
        this.toggleMic.addEventListener('click', () => this.toggleMicrophone());
    }
    
    setupCameraDragging() {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        this.cameraOverlay.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.camera-controls-mini') || e.target.classList.contains('drag-handle')) {
                isDragging = true;
                this.cameraOverlay.classList.add('dragging');
                
                const currentShape = this.frameShape.value;
                const currentBorder = this.borderStyle.value;
                const currentEffect = this.visualEffects.value;
                const currentAutoFocus = this.autoFocus.checked;
                const currentHoverScale = this.hoverScale.checked;
                const currentShadowIntensity = this.shadowIntensity.value;
                
                this.cameraOverlay.dataset.currentShape = currentShape;
                this.cameraOverlay.dataset.currentBorder = currentBorder;
                this.cameraOverlay.dataset.currentEffect = currentEffect;
                this.cameraOverlay.dataset.currentAutoFocus = currentAutoFocus;
                this.cameraOverlay.dataset.currentHoverScale = currentHoverScale;
                this.cameraOverlay.dataset.currentShadowIntensity = currentShadowIntensity;
                
                this.forceApplyShapeSettings(currentShape, currentBorder, currentEffect);
                
                startX = e.clientX;
                startY = e.clientY;
                
                const rect = this.cameraOverlay.getBoundingClientRect();
                initialX = rect.left;
                initialY = rect.top;
                
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newX = initialX + deltaX;
            let newY = initialY + deltaY;
            
            const contentRect = this.app.contentDisplay.getBoundingClientRect();
            const cameraRect = this.cameraOverlay.getBoundingClientRect();
            
            newX = Math.max(contentRect.left, Math.min(newX, contentRect.right - cameraRect.width));
            newY = Math.max(contentRect.top, Math.min(newY, contentRect.bottom - cameraRect.height));
            
            this.cameraOverlay.style.position = 'fixed';
            this.cameraOverlay.style.left = `${newX}px`;
            this.cameraOverlay.style.top = `${newY}px`;
            this.cameraOverlay.style.right = 'auto';
            this.cameraOverlay.style.bottom = 'auto';
            
            const currentShape = this.cameraOverlay.dataset.currentShape;
            const currentBorder = this.cameraOverlay.dataset.currentBorder;
            const currentEffect = this.cameraOverlay.dataset.currentEffect;
            
            this.forceApplyShapeSettings(currentShape, currentBorder, currentEffect);
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.cameraOverlay.classList.remove('dragging');
                
                const currentShape = this.cameraOverlay.dataset.currentShape;
                const currentBorder = this.cameraOverlay.dataset.currentBorder;
                const currentEffect = this.cameraOverlay.dataset.currentEffect;
                const currentAutoFocus = this.cameraOverlay.dataset.currentAutoFocus === 'true';
                const currentHoverScale = this.cameraOverlay.dataset.currentHoverScale === 'true';
                const currentShadowIntensity = this.cameraOverlay.dataset.currentShadowIntensity;
                
                setTimeout(() => {
                    const contentRect = this.app.contentDisplay.getBoundingClientRect();
                    const cameraRect = this.cameraOverlay.getBoundingClientRect();
                    
                    this.cameraOverlay.style.position = 'absolute';
                    this.cameraOverlay.style.left = `${cameraRect.left - contentRect.left}px`;
                    this.cameraOverlay.style.top = `${cameraRect.top - contentRect.top}px`;
                    
                    this.forceApplyShapeSettings(currentShape, currentBorder, currentEffect);
                    
                    if (currentAutoFocus) {
                        this.cameraOverlay.classList.add('auto-focus');
                    }
                    
                    if (currentHoverScale) {
                        this.cameraOverlay.classList.add('hover-scale-enabled');
                    } else {
                        this.cameraOverlay.classList.add('hover-scale-disabled');
                    }
                    
                    const shadowClass = Math.floor(parseInt(currentShadowIntensity) / 20) * 20;
                    this.cameraOverlay.classList.add(`shadow-${shadowClass}`);
                    
                    this.frameShape.value = currentShape;
                    this.borderStyle.value = currentBorder;
                    this.visualEffects.value = currentEffect;
                    this.autoFocus.checked = currentAutoFocus;
                    this.hoverScale.checked = currentHoverScale;
                    this.shadowIntensity.value = currentShadowIntensity;
                    
                }, 50);
            }
        });
    }
    
    forceApplyShapeSettings(shape, border, effect) {
        this.cameraOverlay.classList.remove(
            'shape-circle', 'shape-rounded', 'shape-hexagon', 'shape-star', 'shape-diamond',
            'border-none', 'border-solid', 'border-glowing', 'border-animated', 'border-neon',
            'effect-none', 'effect-blur-bg', 'effect-vintage', 'effect-sepia', 'effect-grayscale', 'effect-high-contrast'
        );
        
        if (shape && shape !== 'rectangle') {
            this.cameraOverlay.classList.add(`shape-${shape}`);
            
            if (['hexagon', 'star', 'diamond'].includes(shape)) {
                this.cameraOverlay.style.transformOrigin = 'center center';
                if (shape === 'star') {
                    this.cameraOverlay.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
                } else if (shape === 'hexagon') {
                    this.cameraOverlay.style.clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
                } else if (shape === 'diamond') {
                    this.cameraOverlay.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
                }
            } else {
                this.cameraOverlay.style.clipPath = '';
            }
        } else {
            this.cameraOverlay.style.clipPath = '';
        }
        
        if (border && border !== 'none') {
            this.cameraOverlay.classList.add(`border-${border}`);
        }
        
        if (effect && effect !== 'none') {
            this.cameraOverlay.classList.add(`effect-${effect}`);
        }
        
        this.cameraOverlay.offsetHeight;
    }
    
    initializeCameraSettings() {
        this.updateCameraSize();
        this.updateCameraPosition();
        this.updateFrameShape();
        this.updateBorderStyle();
        this.updateVisualEffects();
        this.updateShadowIntensity();
        this.updateAutoFocus();
        this.updateHoverScale();
    }
    
    updateFrameShape() {
        const shape = this.frameShape.value;
        this.forceApplyShapeSettings(shape, this.borderStyle.value, this.visualEffects.value);
        this.updateCameraSize();
    }
    
    updateBorderStyle() {
        const border = this.borderStyle.value;
        this.forceApplyShapeSettings(this.frameShape.value, border, this.visualEffects.value);
    }
    
    updateVisualEffects() {
        const effect = this.visualEffects.value;
        this.forceApplyShapeSettings(this.frameShape.value, this.borderStyle.value, effect);
    }
    
    updateAutoFocus() {
        if (this.autoFocus.checked) {
            this.cameraOverlay.classList.add('auto-focus');
        } else {
            this.cameraOverlay.classList.remove('auto-focus');
        }
    }
    
    updateHoverScale() {
        this.cameraOverlay.classList.remove('hover-scale-enabled', 'hover-scale-disabled');
        if (this.hoverScale.checked) {
            this.cameraOverlay.classList.add('hover-scale-enabled');
        } else {
            this.cameraOverlay.classList.add('hover-scale-disabled');
        }
    }
    
    updateShadowIntensity() {
        const intensity = parseInt(this.shadowIntensity.value);
        this.shadowValue.textContent = `${intensity}%`;
        
        this.cameraOverlay.classList.remove('shadow-0', 'shadow-20', 'shadow-40', 'shadow-60', 'shadow-80', 'shadow-100');
        
        const shadowClass = Math.floor(intensity / 20) * 20;
        this.cameraOverlay.classList.add(`shadow-${shadowClass}`);
    }
    
    updateCameraPosition() {
        const position = this.cameraPosition.value;
        const overlay = this.cameraOverlay;
        
        overlay.style.position = 'absolute';
        overlay.style.left = '';
        overlay.style.right = '';
        overlay.style.top = '';
        overlay.style.bottom = '';
        
        switch (position) {
            case 'top-left':
                overlay.style.top = '20px';
                overlay.style.left = '20px';
                break;
            case 'top-right':
                overlay.style.top = '20px';
                overlay.style.right = '20px';
                break;
            case 'bottom-left':
                overlay.style.bottom = '20px';
                overlay.style.left = '20px';
                break;
            case 'bottom-right':
                overlay.style.bottom = '20px';
                overlay.style.right = '20px';
                break;
            case 'center':
                overlay.style.top = '50%';
                overlay.style.left = '50%';
                overlay.style.transform = 'translate(-50%, -50%)';
                break;
        }
    }
    
    updateCameraSize() {
        const size = parseInt(this.cameraSize.value);
        const shape = this.frameShape.value;
        
        if (shape === 'circle' || shape === 'diamond') {
            this.cameraOverlay.style.width = `${size}px`;
            this.cameraOverlay.style.height = `${size}px`;
        } else {
            const aspectRatio = 4 / 3;
            this.cameraOverlay.style.width = `${size}px`;
            this.cameraOverlay.style.height = `${size / aspectRatio}px`;
        }
        
        this.cameraSizeValue.textContent = `${size}px`;
    }
    
    async toggleCameraStream() {
        if (!this.mediaStream) {
            try {
                this.mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'user'
                    },
                    audio: true
                });
                
                this.cameraVideo.srcObject = this.mediaStream;
                this.cameraOverlay.style.display = 'block';
                this.app.cameraBtn.textContent = '⏹ Stop Camera';
                this.app.cameraBtn.classList.add('active');
                this.app.updateStatus('Camera Active', 'recording');
                
                this.app.audioManager.setupAudioVisualization(this.mediaStream);
                
            } catch (error) {
                console.error('Error accessing camera:', error);
                this.app.updateStatus('Camera Error', 'error');
                alert('Could not access camera. Please check permissions.');
            }
        } else {
            this.stopCameraStream();
        }
    }
    
    stopCameraStream() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
            this.cameraVideo.srcObject = null;
            this.cameraOverlay.style.display = 'none';
            this.app.cameraBtn.textContent = '📹 Start Camera';
            this.app.cameraBtn.classList.remove('active');
            this.app.updateStatus('Ready', 'ready');
        }
        
        this.app.audioManager.cleanup();
    }
    
    toggleCameraVisibility() {
        const isVisible = this.cameraOverlay.style.display !== 'none';
        this.cameraOverlay.style.display = isVisible ? 'none' : 'block';
        this.toggleCamera.innerHTML = isVisible ? 
            '<i class="fas fa-video-slash"></i>' : 
            '<i class="fas fa-video"></i>';
    }
    
    toggleMicrophone() {
        if (this.mediaStream) {
            const audioTrack = this.mediaStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                this.app.micBtn.classList.toggle('active', audioTrack.enabled);
                this.toggleMic.innerHTML = audioTrack.enabled ? 
                    '<i class="fas fa-microphone"></i>' : 
                    '<i class="fas fa-microphone-slash"></i>';
                
                this.app.audioManager.toggleVisualization(audioTrack.enabled);
            }
        }
    }
    
    getCameraOverlayPosition() {
        const rect = this.cameraOverlay.getBoundingClientRect();
        const contentRect = this.app.contentDisplay.getBoundingClientRect();
        
        return {
            x: rect.left - contentRect.left,
            y: rect.top - contentRect.top,
            width: rect.width,
            height: rect.height
        };
    }
    
    getActiveEffects() {
        return {
            shape: this.frameShape.value,
            border: this.borderStyle.value,
            visualEffect: this.visualEffects.value,
            autoFocus: this.autoFocus.checked,
            hoverScale: this.hoverScale.checked,
            shadowIntensity: parseInt(this.shadowIntensity.value)
        };
    }
    
    handleResize() {
        if (this.cameraOverlay.style.position === 'absolute') {
            this.updateCameraPosition();
        }
    }
}