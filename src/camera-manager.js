export default class CameraManager {
    constructor(app) {
        this.app = app;
        this.mediaStream = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.isUpdatingPositionBars = false;
        this.recordedPosition = { x: 0, y: 0 }; // Simple recorded position in pixels
        
        this.initializeElements();
        this.bindEvents();
        this.setupCameraDragging();
        this.initializeCameraSettings();
    }
    
    setupIframeResizeDetection() {
        // Monitor iframe size changes and adapt camera position
        const checkIframeSize = () => {
            const iframe = document.querySelector('#contentFrame');
            if (iframe && iframe.style.display !== 'none') {
                const rect = iframe.getBoundingClientRect();
                const currentSize = { width: rect.width, height: rect.height };
                
                // If iframe size changed significantly, update camera position
                if (Math.abs(currentSize.width - this.lastIframeSize.width) > 10 || 
                    Math.abs(currentSize.height - this.lastIframeSize.height) > 10) {
                    
                    // Store current percentage values
                    const currentX = parseInt(this.cameraXPosition.value);
                    const currentY = parseInt(this.cameraYPosition.value);
                    
                    // Reapply position with new iframe dimensions
                    if (currentX !== 0 || currentY !== 0) {
                        setTimeout(() => {
                            this.updatePrecisePosition();
                        }, 100);
                    }
                    
                    this.lastIframeSize = currentSize;
                }
            }
        };
        
        // Check every 500ms for iframe size changes
        setInterval(checkIframeSize, 500);
        
        // Also check on window resize
        window.addEventListener('resize', () => {
            setTimeout(checkIframeSize, 100);
        });
    }
    
    initializeElements() {
        this.cameraPosition = document.getElementById('cameraPosition');
        this.cameraSize = document.getElementById('cameraSize');
        this.cameraSizeValue = document.getElementById('cameraSizeValue');
        this.cameraXPosition = document.getElementById('cameraXPosition');
        this.cameraYPosition = document.getElementById('cameraYPosition');
        this.cameraXValue = document.getElementById('cameraXValue');
        this.cameraYValue = document.getElementById('cameraYValue');
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
        this.cameraXPosition.addEventListener('input', () => this.updatePrecisePosition());
        this.cameraYPosition.addEventListener('input', () => this.updatePrecisePosition());
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
            
            // Simple boundary system: keep minimum 20px of camera visible
            const iframe = document.querySelector('#contentFrame');
            const isIframeMode = iframe && iframe.style.display !== 'none';
            
            let boundaryRect;
            if (isIframeMode) {
                boundaryRect = iframe.getBoundingClientRect();
            } else {
                boundaryRect = this.app.contentDisplay.getBoundingClientRect();
            }
            
            const cameraSize = parseInt(this.cameraSize.value);
            const minVisible = 20; // Minimum 20px must stay visible
            
            // Keep at least 20px of camera visible within frame
            newX = Math.max(boundaryRect.left - cameraSize + minVisible, 
                           Math.min(newX, boundaryRect.right - minVisible));
            newY = Math.max(boundaryRect.top - cameraSize + minVisible, 
                           Math.min(newY, boundaryRect.bottom - minVisible));
            
            this.cameraOverlay.style.position = 'fixed';
            this.cameraOverlay.style.left = `${newX}px`;
            this.cameraOverlay.style.top = `${newY}px`;
            this.cameraOverlay.style.right = 'auto';
            this.cameraOverlay.style.bottom = 'auto';
            
            // Record current position for X/Y bars
            this.recordedPosition.x = newX;
            this.recordedPosition.y = newY;
            this.updatePositionBarsFromRecorded();
            
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
                    
                    // Force reapply all shape settings to ensure they stick after drag
                    this.forceApplyShapeSettings(currentShape, currentBorder, currentEffect);
                    
                    // Ensure transform origin is properly set for complex shapes
                    if (['hexagon', 'star', 'diamond', 'triangle'].includes(currentShape)) {
                        this.cameraOverlay.style.transformOrigin = 'center center';
                    }
                    
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
                    
                    // Update UI controls to match current settings
                    this.frameShape.value = currentShape;
                    this.borderStyle.value = currentBorder;
                    this.visualEffects.value = currentEffect;
                    this.autoFocus.checked = currentAutoFocus;
                    this.hoverScale.checked = currentHoverScale;
                    this.shadowIntensity.value = currentShadowIntensity;
                    
                    // Force a final reapplication to ensure everything sticks
                    setTimeout(() => {
                        this.forceApplyShapeSettings(currentShape, currentBorder, currentEffect);
                        // Record final position after drag complete
                        this.recordCurrentPosition();
                    }, 10);
                    
                }, 50);
            }
        });
    }
    
    forceApplyShapeSettings(shape, border, effect) {
        this.cameraOverlay.classList.remove(
            'shape-circle', 'shape-rounded', 'shape-hexagon', 'shape-star', 'shape-diamond', 'shape-triangle',
            'border-none', 'border-solid', 'border-glowing', 'border-animated', 'border-neon',
            'effect-none', 'effect-blur-bg', 'effect-vintage', 'effect-sepia', 'effect-grayscale', 'effect-high-contrast'
        );
        
        if (shape && shape !== 'rectangle') {
            this.cameraOverlay.classList.add(`shape-${shape}`);
            
            if (['hexagon', 'star', 'diamond', 'triangle'].includes(shape)) {
                this.cameraOverlay.style.transformOrigin = 'center center';
                if (shape === 'star') {
                    // Improved 5-pointed star with better proportions
                    this.cameraOverlay.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
                } else if (shape === 'hexagon') {
                    // Improved hexagon with perfect proportions
                    this.cameraOverlay.style.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
                } else if (shape === 'diamond') {
                    this.cameraOverlay.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
                } else if (shape === 'triangle') {
                    this.cameraOverlay.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
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
        
        // Record initial position
        setTimeout(() => {
            this.recordCurrentPosition();
        }, 100);
    }
    
    updatePrecisePosition() {
        if (this.isUpdatingPositionBars) return;
        
        const xOffset = parseInt(this.cameraXPosition.value); // -100 to +100
        const yOffset = parseInt(this.cameraYPosition.value); // -100 to +100
        
        // Update display values
        this.cameraXValue.textContent = `${xOffset}px`;
        this.cameraYValue.textContent = `${yOffset}px`;
        
        // Apply simple offset to recorded position
        const newX = this.recordedPosition.x + xOffset;
        const newY = this.recordedPosition.y + yOffset;
        
        this.cameraOverlay.style.position = 'fixed';
        this.cameraOverlay.style.left = `${newX}px`;
        this.cameraOverlay.style.top = `${newY}px`;
        this.cameraOverlay.style.right = 'auto';
        this.cameraOverlay.style.bottom = 'auto';
    }
    
    // Simple method to update bars based on recorded position
    updatePositionBarsFromRecorded() {
        if (this.isUpdatingPositionBars) return;
        
        this.isUpdatingPositionBars = true;
        
        // Calculate offset from recorded position
        const currentX = parseFloat(this.cameraOverlay.style.left) || 0;
        const currentY = parseFloat(this.cameraOverlay.style.top) || 0;
        
        const xOffset = Math.round(currentX - this.recordedPosition.x);
        const yOffset = Math.round(currentY - this.recordedPosition.y);
        
        // Clamp to ±100px range
        const clampedX = Math.max(-100, Math.min(100, xOffset));
        const clampedY = Math.max(-100, Math.min(100, yOffset));
        
        this.cameraXPosition.value = clampedX;
        this.cameraYPosition.value = clampedY;
        this.cameraXValue.textContent = `${clampedX}px`;
        this.cameraYValue.textContent = `${clampedY}px`;
        
        this.isUpdatingPositionBars = false;
    }
    
    // Record current camera position as base reference
    recordCurrentPosition() {
        const currentX = parseFloat(this.cameraOverlay.style.left) || 0;
        const currentY = parseFloat(this.cameraOverlay.style.top) || 0;
        
        this.recordedPosition.x = currentX;
        this.recordedPosition.y = currentY;
        
        // Reset bars to 0 when recording new position
        this.cameraXPosition.value = 0;
        this.cameraYPosition.value = 0;
        this.cameraXValue.textContent = '0px';
        this.cameraYValue.textContent = '0px';
    }
    
    // Stronger method to sync position bars with actual camera position
    syncPositionBarsWithCamera() {
        if (this.isUpdatingPositionBars) return; // Prevent circular updates
        
        const iframe = document.querySelector('#contentFrame');
        const isIframeMode = iframe && iframe.style.display !== 'none';
        
        if (isIframeMode && this.cameraOverlay.style.left && this.cameraOverlay.style.top) {
            this.isUpdatingPositionBars = true;
            
            const iframeRect = iframe.getBoundingClientRect();
            const cameraRect = this.cameraOverlay.getBoundingClientRect();
            const cameraSize = parseInt(this.cameraSize.value);
            
            // Calculate iframe center
            const iframeCenterX = iframeRect.left + iframeRect.width * 0.5;
            const iframeCenterY = iframeRect.top + iframeRect.height * 0.5;
            
            // Calculate camera center
            const cameraCenterX = cameraRect.left + cameraSize * 0.5;
            const cameraCenterY = cameraRect.top + cameraSize * 0.5;
            
            // Calculate movement from iframe center
            const moveX = cameraCenterX - iframeCenterX;
            const moveY = cameraCenterY - iframeCenterY;
            
            // Calculate max movement (50% of iframe size)
            const maxMoveX = iframeRect.width * 0.5;
            const maxMoveY = iframeRect.height * 0.5;
            
            // Convert to percentage (-100% to 100% range for stronger control)
            const xPercent = maxMoveX > 0 ? Math.round((moveX / maxMoveX) * 100) : 0;
            const yPercent = maxMoveY > 0 ? Math.round((moveY / maxMoveY) * 100) : 0;
            
            // Clamp values to slider range (-50% to 150%)
            const clampedX = Math.max(-50, Math.min(150, xPercent));
            const clampedY = Math.max(-50, Math.min(150, yPercent));
            
            // Update sliders and display values
            this.cameraXPosition.value = clampedX;
            this.cameraYPosition.value = clampedY;
            this.cameraXValue.textContent = `${clampedX}%`;
            this.cameraYValue.textContent = `${clampedY}%`;
            
            this.isUpdatingPositionBars = false;
        }
    }
    
    // Safety method to disable precise positioning if conflicts occur
    disablePrecisePositioning() {
        console.log('Disabling precise positioning due to conflicts...');
        
        // Hide the position controls
        const preciseControls = document.querySelector('.precise-position-controls');
        if (preciseControls) {
            preciseControls.style.display = 'none';
        }
        
        // Remove event listeners
        if (this.cameraXPosition) {
            this.cameraXPosition.removeEventListener('input', () => this.updatePrecisePosition());
        }
        if (this.cameraYPosition) {
            this.cameraYPosition.removeEventListener('input', () => this.updatePrecisePosition());
        }
        
        // Reset camera to preset positioning only
        this.updateCameraPosition();
        
        console.log('Precise positioning disabled. Using preset positions only.');
    }
    
    // Method to check system health and auto-disable if needed
    checkSystemHealth() {
        try {
            const iframe = document.querySelector('#contentFrame');
            if (!iframe || !this.cameraXPosition || !this.cameraYPosition) {
                this.disablePrecisePositioning();
                return false;
            }
            return true;
        } catch (error) {
            console.error('Position system error:', error);
            this.disablePrecisePositioning();
            return false;
        }
    }
    
    updateFrameShape() {
        // Store current position before shape change
        const currentLeft = this.cameraOverlay.style.left;
        const currentTop = this.cameraOverlay.style.top;
        const currentPosition = this.cameraOverlay.style.position;
        
        const shape = this.frameShape.value;
        this.forceApplyShapeSettings(shape, this.borderStyle.value, this.visualEffects.value);
        this.updateCameraSize();
        
        // Restore position after shape change
        if (currentLeft && currentTop) {
            this.cameraOverlay.style.position = currentPosition;
            this.cameraOverlay.style.left = currentLeft;
            this.cameraOverlay.style.top = currentTop;
        }
    }
    
    updateBorderStyle() {
        // Store current position before border change
        const currentLeft = this.cameraOverlay.style.left;
        const currentTop = this.cameraOverlay.style.top;
        const currentPosition = this.cameraOverlay.style.position;
        
        const border = this.borderStyle.value;
        this.forceApplyShapeSettings(this.frameShape.value, border, this.visualEffects.value);
        
        // Restore position after border change
        if (currentLeft && currentTop) {
            this.cameraOverlay.style.position = currentPosition;
            this.cameraOverlay.style.left = currentLeft;
            this.cameraOverlay.style.top = currentTop;
        }
    }
    
    updateVisualEffects() {
        // Store current position before effect change
        const currentLeft = this.cameraOverlay.style.left;
        const currentTop = this.cameraOverlay.style.top;
        const currentPosition = this.cameraOverlay.style.position;
        
        const effect = this.visualEffects.value;
        this.forceApplyShapeSettings(this.frameShape.value, this.borderStyle.value, effect);
        
        // Restore position after effect change
        if (currentLeft && currentTop) {
            this.cameraOverlay.style.position = currentPosition;
            this.cameraOverlay.style.left = currentLeft;
            this.cameraOverlay.style.top = currentTop;
        }
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
        
        // Reset positioning
        overlay.style.left = '';
        overlay.style.right = '';
        overlay.style.top = '';
        overlay.style.bottom = '';
        overlay.style.transform = '';
        
        // Check if we're in iframe mode (content frame visible)
        const iframe = document.querySelector('#contentFrame');
        const isIframeMode = iframe && iframe.style.display !== 'none';
        
        if (isIframeMode) {
            // Position relative to centered iframe with proper margin calculations
            overlay.style.position = 'fixed';
            const iframeRect = iframe.getBoundingClientRect();
            const overlaySize = parseInt(this.cameraSize.value);
            const margin = 20; // Standard margin from frame edge
            
            switch (position) {
                case 'top-left':
                    overlay.style.top = (iframeRect.top + margin) + 'px';
                    overlay.style.left = (iframeRect.left + margin) + 'px';
                    break;
                case 'top-right':
                    overlay.style.top = (iframeRect.top + margin) + 'px';
                    overlay.style.left = (iframeRect.right - overlaySize - margin) + 'px';
                    break;
                case 'center':
                    overlay.style.top = (iframeRect.top + (iframeRect.height - overlaySize) / 2) + 'px';
                    overlay.style.left = (iframeRect.left + (iframeRect.width - overlaySize) / 2) + 'px';
                    break;
            }
        } else {
            // Normal positioning for full screen mode
            overlay.style.position = 'absolute';
            
            switch (position) {
                case 'top-left':
                    overlay.style.top = '20px';
                    overlay.style.left = '20px';
                    break;
                case 'top-right':
                    overlay.style.top = '20px';
                    overlay.style.right = '20px';
                    break;
                case 'center':
                    overlay.style.top = '50%';
                    overlay.style.left = '50%';
                    overlay.style.transform = 'translate(-50%, -50%)';
                    break;
            }
        }
        
        // Record preset position and reset offset bars
        setTimeout(() => {
            this.recordCurrentPosition();
        }, 50);
    }
    
    updateCameraSize() {
        // Store current position before size change
        const currentLeft = this.cameraOverlay.style.left;
        const currentTop = this.cameraOverlay.style.top;
        const currentPosition = this.cameraOverlay.style.position;
        const hasDraggedPosition = currentLeft && currentTop && (currentLeft !== '' && currentTop !== '');
        
        const size = parseInt(this.cameraSize.value);
        const shape = this.frameShape.value;
        
        if (shape === 'circle' || shape === 'diamond' || shape === 'triangle') {
            this.cameraOverlay.style.width = `${size}px`;
            this.cameraOverlay.style.height = `${size}px`;
        } else {
            const aspectRatio = 4 / 3;
            this.cameraOverlay.style.width = `${size}px`;
            this.cameraOverlay.style.height = `${size / aspectRatio}px`;
        }
        
        this.cameraSizeValue.textContent = `${size}px`;
        
        // Only update position if camera hasn't been manually dragged
        if (!hasDraggedPosition) {
            this.updateCameraPosition();
        } else {
            // Restore the dragged position
            this.cameraOverlay.style.position = currentPosition;
            this.cameraOverlay.style.left = currentLeft;
            this.cameraOverlay.style.top = currentTop;
        }
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