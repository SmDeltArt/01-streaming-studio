import SmartImagesAI from './smartImages.js';

export default class ImageDisplayManager {
    constructor(app) {
        this.app = app;
        this.imagePanel = null;
        this.currentImageElement = null;
        this.defaultDisplayDuration = 5000;
        this.imageFadeTransition = 500;
        this.maxSimultaneousImages = 3;
        this.activeImages = [];
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.currentSettings = this.getDefaultSettings();
        this.currentImageData = null;
        this.currentSoundData = null;
        this.currentAudio = null;
        this.audioProgressInterval = null;
        this.audioMetadata = null;
        this.initializeElements();
        this.bindEvents();
        this.setupDragging();
        this.smartImagesAI = new SmartImagesAI(this);
    }

    initializeElements() {
        this.imageBtn = document.getElementById('imageBtn');
        this.imagePanel = document.getElementById('imageDisplayPanel');
        if (this.imagePanel) this.imagePanel.classList.add('ai-scope');
        this.imagePanelCollapse = document.getElementById('imagePanelCollapse');
        this.imagePanelClose = document.getElementById('imagePanelClose');
        this.imagePanelExpand = document.getElementById('imagePanelExpand');
        this.preserveAspectRatio = document.getElementById('preserveAspectRatio');
        this.imageFileInput = document.getElementById('imageFileInput');
        this.imageFileBrowse = document.getElementById('imageFileBrowse');
        this.imageUrlInput = document.getElementById('imageUrlInput');
        this.imagePreview = document.getElementById('imagePreview');
        this.imageWidth = document.getElementById('imageWidth');
        this.widthValue = document.getElementById('widthValue');
        this.imageHeight = document.getElementById('imageHeight');
        this.heightValue = document.getElementById('heightValue');
        this.imagePosition = document.getElementById('imagePosition');
        this.imageScale = document.getElementById('imageScale');
        this.scaleValue = document.getElementById('scaleValue');
        this.imageRotation = document.getElementById('imageRotation');
        this.rotationValue = document.getElementById('rotationValue');
        this.imageDisplayTime = document.getElementById('imageDisplayTime');
        this.imageDisplayTimeValue = document.getElementById('imageDisplayTimeValue');
        this.imageOpacity = document.getElementById('imageOpacity');
        this.opacityValue = document.getElementById('opacityValue');
        this.imageBorderRadius = document.getElementById('imageBorderRadius');
        this.imageBorderRadiusValue = document.getElementById('imageBorderRadiusValue');
        this.imageShadowBlur = document.getElementById('imageShadowBlur');
        this.imageShadowBlurValue = document.getElementById('imageShadowBlurValue');
        this.imageBorderWidth = document.getElementById('imageBorderWidth');
        this.imageBorderWidthValue = document.getElementById('imageBorderWidthValue');
        this.imageBorderColor = document.getElementById('imageBorderColor');
        this.imageBlur = document.getElementById('imageBlur');
        this.imageBlurValue = document.getElementById('imageBlurValue');
        this.imageBrightness = document.getElementById('imageBrightness');
        this.imageBrightnessValue = document.getElementById('imageBrightnessValue');
        this.imageContrast = document.getElementById('imageContrast');
        this.imageContrastValue = document.getElementById('imageContrastValue');
        this.imageSaturation = document.getElementById('imageSaturation');
        this.imageSaturationValue = document.getElementById('imageSaturationValue');
        this.imageHueRotate = document.getElementById('imageHueRotate');
        this.imageHueRotateValue = document.getElementById('imageHueRotateValue');
        this.imageGrayscale = document.getElementById('imageGrayscale');
        this.imageGrayscaleValue = document.getElementById('imageGrayscaleValue');
        this.imageAnimation = document.getElementById('imageAnimation');
        this.imageSoundInput = document.getElementById('imageSoundInput');
        this.imageSoundBrowse = document.getElementById('imageSoundBrowse');
        this.imageSoundInfo = document.getElementById('imageSoundInfo');
        this.imageSoundVolume = document.getElementById('imageSoundVolume');
        this.imageSoundVolumeValue = document.getElementById('imageSoundVolumeValue');
        this.imageSoundLoop = document.getElementById('imageSoundLoop');
        this.imageSoundProgress = document.getElementById('imageSoundProgress') || null;
        this.imageSoundDuration = document.getElementById('imageSoundDuration') || null;
        this.imageSoundMaxDuration = document.getElementById('imageSoundMaxDuration') || null;
        this.imageSoundMaxDurationValue = document.getElementById('imageSoundMaxDurationValue') || null;
        this.imageSoundStop = document.getElementById('imageSoundStop') || null;
        this.showImageBtn = document.getElementById('showImageBtn');
        this.previewImageBtn = document.getElementById('previewImageBtn');
        this.saveImageBtn = document.getElementById('saveImageBtn');
        this.loadImageBtn = document.getElementById('loadImageBtn');
        this.removeImageBtn = document.getElementById('removeImageBtn');
        this.aiGenerateBtn = document.getElementById('aiGenerateBtn');
        this.aiGeneratorSection = document.getElementById('aiGeneratorSection');
        this.aiCustomPrompt = document.getElementById('aiCustomPrompt');
        this.aiAnimationType = document.getElementById('aiAnimationType');
        this.aiStyle = document.getElementById('aiStyle');
        this.aiImageSize = document.getElementById('aiImageSize');
        this.aiAnimationDuration = document.getElementById('aiAnimationDuration');
        this.animationDurationValue = document.getElementById('animationDurationValue');
        this.animationDurationRow = document.getElementById('animationDurationRow');
        this.aiTransparency = document.getElementById('aiTransparency');
        this.generateImageBtn = document.getElementById('generateImageBtn');
        this.regenerateBtn = document.getElementById('regenerateBtn');
        this.saveGeneratedBtn = document.getElementById('saveGeneratedBtn');
        this.aiGenerationStatus = document.getElementById('aiGenerationStatus');
        this.currentGeneratedImage = null;
        this.isGenerating = false;
        this.generationHistory = [];
    }

    bindEvents() {
        this.imageBtn.addEventListener('click', () => this.togglePanel());
        this.imagePanelCollapse.addEventListener('click', () => this.toggleCollapse());
        if (this.imagePanelExpand) {
            this.imagePanelExpand.addEventListener('click', () => this.toggleCollapse());
        }
        this.imagePanelClose.addEventListener('click', () => this.hidePanel());
        this.imageFileBrowse.addEventListener('click', () => this.imageFileInput.click());
        this.imageFileInput.addEventListener('change', (e) => this.handleFileSelection(e));
        this.imageUrlInput.addEventListener('input', () => this.handleUrlInput());
        this.imageWidth.addEventListener('input', () => {
            this.widthValue.textContent = this.imageWidth.value + 'px';
            if (this.currentImageData && this.currentImageData.aspectRatio) {
                const newHeight = Math.round(parseInt(this.imageWidth.value) / this.currentImageData.aspectRatio);
                this.imageHeight.value = newHeight;
                this.heightValue.textContent = newHeight + 'px';
            }
            this.updatePreview();
        });
        this.imageHeight.addEventListener('input', () => {
            this.heightValue.textContent = this.imageHeight.value + 'px';
            if (this.currentImageData && this.currentImageData.aspectRatio) {
                const newWidth = Math.round(parseInt(this.imageHeight.value) * this.currentImageData.aspectRatio);
                this.imageWidth.value = newWidth;
                this.widthValue.textContent = newWidth + 'px';
            }
            this.updatePreview();
        });
        this.imageScale.addEventListener('input', () => {
            this.scaleValue.textContent = this.imageScale.value + '%';
            this.updatePreview();
        });
        this.imageRotation.addEventListener('input', () => {
            this.rotationValue.textContent = this.imageRotation.value + '°';
            this.updatePreview();
        });
        this.imageDisplayTime.addEventListener('input', () => {
            this.imageDisplayTimeValue.textContent = this.imageDisplayTime.value + 's';
        });
        this.imageOpacity.addEventListener('input', () => {
            this.opacityValue.textContent = this.imageOpacity.value + '%';
            this.updatePreview();
        });
        this.imageBorderRadius.addEventListener('input', () => {
            this.imageBorderRadiusValue.textContent = this.imageBorderRadius.value + 'px';
            this.updatePreview();
        });
        this.imageShadowBlur.addEventListener('input', () => {
            this.imageShadowBlurValue.textContent = this.imageShadowBlur.value + 'px';
            this.updatePreview();
        });
        this.imageBorderWidth.addEventListener('input', () => {
            this.imageBorderWidthValue.textContent = this.imageBorderWidth.value + 'px';
            this.updatePreview();
        });
        this.imageBlur.addEventListener('input', () => {
            this.imageBlurValue.textContent = this.imageBlur.value + 'px';
            this.updatePreview();
        });
        this.imageBrightness.addEventListener('input', () => {
            this.imageBrightnessValue.textContent = this.imageBrightness.value + '%';
            this.updatePreview();
        });
        this.imageContrast.addEventListener('input', () => {
            this.imageContrastValue.textContent = this.imageContrast.value + '%';
            this.updatePreview();
        });
        this.imageSaturation.addEventListener('input', () => {
            this.imageSaturationValue.textContent = this.imageSaturation.value + '%';
            this.updatePreview();
        });
        this.imageHueRotate.addEventListener('input', () => {
            this.imageHueRotateValue.textContent = this.imageHueRotate.value + '°';
            this.updatePreview();
        });
        this.imageGrayscale.addEventListener('input', () => {
            this.imageGrayscaleValue.textContent = this.imageGrayscale.value + '%';
            this.updatePreview();
        });
        this.imageSoundBrowse.addEventListener('click', () => {
            if (this.currentImageData && (this.currentImageData.type.startsWith('video/') || this.currentImageData.type.startsWith('audio/'))) {
                alert('Media file already contains sound. Remove the current media to add separate audio.');
                return;
            }
            this.imageSoundInput.click();
        });
        if (this.imageSoundInput) {
            this.imageSoundInput.addEventListener('change', (e) => this.handleSoundSelection(e));
        }
        this.imageSoundVolume.addEventListener('input', () => {
            this.imageSoundVolumeValue.textContent = this.imageSoundVolume.value + '%';
            if (this.currentAudio && !this.currentAudio.paused) {
                this.currentAudio.volume = Math.max(0, Math.min(1, parseInt(this.imageSoundVolume.value) / 100));
            }
        });
        if (this.imageSoundProgress) {
            this.imageSoundProgress.addEventListener('input', () => this.seekAudio());
            this.imageSoundProgress.addEventListener('change', () => this.seekAudio());
        }
        if (this.imageSoundMaxDuration && this.imageSoundMaxDurationValue) {
            this.imageSoundMaxDuration.addEventListener('input', () => {
                this.imageSoundMaxDurationValue.textContent = this.imageSoundMaxDuration.value + 's';
            });
        }
        if (this.imageSoundStop) {
            this.imageSoundStop.addEventListener('click', () => this.stopCurrentAudio());
        }
        [this.imagePosition, this.imageAnimation, this.imageBorderColor].forEach(element => {
            element.addEventListener('change', () => this.updatePreview());
        });
        if (this.showImageBtn) {
            this.showImageBtn.addEventListener('click', () => this.showImage());
        }
        if (this.previewImageBtn) {
            this.previewImageBtn.addEventListener('click', () => this.previewImage());
        }
        if (this.saveImageBtn) {
            this.saveImageBtn.addEventListener('click', () => this.saveSettings());
        }
        if (this.loadImageBtn) {
            this.loadImageBtn.addEventListener('click', () => this.loadSettings());
        }
        if (this.removeImageBtn) {
            this.removeImageBtn.addEventListener('click', () => this.removeAllImages());
            this.removeImageBtn.removeEventListener('click', () => this.removeAllImages());
            this.removeImageBtn.addEventListener('click', () => this.removeCurrentMedia());
        }
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'i' && !e.target.matches('input, textarea, select')) {
                this.togglePanel();
                e.preventDefault();
            }
        });
    }

    setupDragging() {
        const header = this.imagePanel.querySelector('.image-panel-header');
        let isDragging = false;
        let startX, startY, initialX, initialY;
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            this.imagePanel.classList.add('dragging');
            startX = e.clientX;
            startY = e.clientY;
            const rect = this.imagePanel.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            let newX = initialX + deltaX;
            let newY = initialY + deltaY;
            const panelRect = this.imagePanel.getBoundingClientRect();
            const minVisibleArea = Math.min(panelRect.width, panelRect.height) * 0.05;
            newX = Math.max(-panelRect.width + minVisibleArea, Math.min(newX, window.innerWidth - minVisibleArea));
            newY = Math.max(-panelRect.height + minVisibleArea, Math.min(newY, window.innerHeight - minVisibleArea));
            this.imagePanel.style.left = `${newX}px`;
            this.imagePanel.style.top = `${newY}px`;
            this.imagePanel.style.transform = 'none';
        });
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.imagePanel.classList.remove('dragging');
            }
        });
    }
              async handleFileSelection(event) {
            const file = event.target.files[0];
            if (!file) return;
            try {
                const maxFileSize = 50 * 1024 * 1024;
                const supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
                const supportedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
                const supportedAudioTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'];
                const animatedFormats = ['image/gif', 'image/webp'];
                if (file.size > maxFileSize) {
                    alert('File size too large. Maximum allowed size is 50MB.');
                    return;
                }
                const fileType = file.type;
                const isImage = supportedImageTypes.includes(fileType);
                const isVideo = supportedVideoTypes.includes(fileType);
                const isAudio = supportedAudioTypes.includes(fileType);
                const isAnimated = animatedFormats.includes(fileType);
                if (!isImage && !isVideo && !isAudio) {
                    alert('Unsupported file type. Please select an image, video, or audio file.');
                    return;
                }
                const reader = new FileReader();
                reader.onload = async (e) => {
                    this.currentImageData = {
                        type: fileType,
                        data: e.target.result,
                        name: file.name,
                        size: file.size,
                        isAnimated: isAnimated,
                        hasTransparency: false,
                        removeFrames: false
                    };
                    if (isImage) {
                        try {
                            const dimensions = await this.extractImageDimensions(e.target.result);
                            if (dimensions.width && dimensions.height) {
                                this.currentImageData.originalWidth = dimensions.width;
                                this.currentImageData.originalHeight = dimensions.height;
                                this.currentImageData.aspectRatio = dimensions.width / dimensions.height;
                                this.adjustImageDimensionsToAspectRatio(dimensions.width, dimensions.height);
                            }
                        } catch (error) {}
                    } else if (isVideo) {
                        try {
                            const dimensions = await this.extractVideoDimensions(e.target.result);
                            if (dimensions.width && dimensions.height) {
                                this.currentImageData.originalWidth = dimensions.width;
                                this.currentImageData.originalHeight = dimensions.height;
                                this.currentImageData.aspectRatio = dimensions.width / dimensions.height;
                                this.adjustImageDimensionsToAspectRatio(dimensions.width, dimensions.height);
                            }
                        } catch (error) {}
                    }
                    this.updateImagePreview();
                };
                reader.readAsDataURL(file);
            } catch (error) {
                alert('Error loading file: ' + error.message);
            }
        }
        
        async handleUrlInput() {
            const url = this.imageUrlInput.value.trim();
            if (!url) {
                this.currentImageData = null;
                this.updateImagePreview();
                return;
            }
            try {
                new URL(url);
                this.currentImageData = {
                    type: 'url',
                    data: url,
                    name: url.split('/').pop() || 'Web Image',
                    size: 0,
                    isAnimated: false,
                    hasTransparency: false,
                    removeFrames: false
                };
                this.updateImagePreview();
                this.updateSoundControlsAvailability();
            } catch (error) {}
        }
        
        updateMediaPreview() {
            if (!this.currentMediaData) {
                this.mediaPreview.innerHTML = 'No media selected';
                return;
            }
            const { type, data, name, isVideo, isAudio } = this.currentMediaData;
            this.mediaPreview.innerHTML = '';
            if (isVideo) {
                const video = document.createElement('video');
                video.src = data;
                video.controls = true;
                video.muted = true;
                video.style.maxWidth = '100%';
                video.style.maxHeight = '100%';
                if (this.preserveAspectRatio.checked && this.currentMediaData && this.currentMediaData.aspectRatio) {
                    video.style.aspectRatio = this.currentMediaData.aspectRatio;
                    video.style.objectFit = 'contain';
                }
                this.mediaPreview.appendChild(video);
                const mediaInfo = document.createElement('div');
                mediaInfo.className = 'media-info';
                mediaInfo.textContent = `📹 ${name} (${this.formatFileSize(this.currentMediaData.size)})`;
                this.mediaPreview.appendChild(mediaInfo);
            } else if (isAudio) {
                const audioContainer = document.createElement('div');
                audioContainer.style.display = 'flex';
                audioContainer.style.flexDirection = 'column';
                audioContainer.style.alignItems = 'center';
                audioContainer.style.justifyContent = 'center';
                audioContainer.style.height = '100%';
                audioContainer.innerHTML = `
                    <div style="font-size: 24px; margin-bottom: 10px;">🎵</div>
                    <audio controls style="width: 90%;">
                        <source src="${data}" type="${type}">
                    </audio>
                `;
                this.mediaPreview.appendChild(audioContainer);
                const mediaInfo = document.createElement('div');
                mediaInfo.className = 'media-info';
                mediaInfo.textContent = `🎵 ${name} (${this.formatFileSize(this.currentMediaData.size)})`;
                this.mediaPreview.appendChild(mediaInfo);
            }
        }
        
        async extractAudioMetadata(audioDataUrl) {
            return new Promise((resolve, reject) => {
                const audio = new Audio();
                audio.onloadedmetadata = () => {
                    const metadata = {
                        duration: audio.duration || 0,
                        sampleRate: audio.sampleRate || null,
                        channels: audio.channels || null
                    };
                    resolve(metadata);
                };
                audio.onerror = () => {
                    reject(new Error('Failed to load audio metadata'));
                };
                setTimeout(() => {
                    reject(new Error('Audio metadata extraction timeout'));
                }, 5000);
                audio.src = audioDataUrl;
            });
        }
        
        updateSoundInfo() {
            if (!this.imageSoundInfo) return;
            if (!this.currentSoundData) {
                this.imageSoundInfo.textContent = 'No sound selected';
                return;
            }
            let infoText = `🔊 ${this.currentSoundData.name} (${this.formatFileSize(this.currentSoundData.size)})`;
            if (this.audioMetadata && this.audioMetadata.duration > 0) {
                const duration = Math.ceil(this.audioMetadata.duration);
                infoText += ` - ${this.formatDuration(duration)}`;
            }
            this.imageSoundInfo.textContent = infoText;
        }
        
        seekAudio() {
            if (this.currentAudio && this.imageSoundProgress && this.currentAudio.duration && !isNaN(this.currentAudio.duration)) {
                const seekPosition = parseFloat(this.imageSoundProgress.value) / 100;
                const newTime = seekPosition * this.currentAudio.duration;
                try {
                    this.currentAudio.currentTime = Math.max(0, Math.min(newTime, this.currentAudio.duration));
                } catch (error) {}
            }
        }
        
        setupProgressTracking(audio) {
            if (!this.imageSoundProgress || !this.imageSoundDuration || !audio) return;
            this.clearProgressTracking();
            const progressUpdateInterval = 200;
            const startTracking = () => {
                if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                    this.audioProgressInterval = setInterval(() => {
                        if (audio.duration > 0 && this.imageSoundProgress && this.imageSoundDuration && !audio.paused) {
                            const progress = (audio.currentTime / audio.duration) * 100;
                            if (!this.imageSoundProgress.matches(':active')) {
                                this.imageSoundProgress.value = Math.min(100, Math.max(0, progress));
                            }
                            const currentTime = Math.floor(audio.currentTime);
                            const totalTime = Math.floor(audio.duration);
                            this.imageSoundDuration.textContent = `${this.formatDuration(currentTime)} / ${this.formatDuration(totalTime)}`;
                        }
                    }, progressUpdateInterval);
                }
            };
            if (audio.readyState >= 1) {
                startTracking();
            } else {
                audio.addEventListener('loadedmetadata', startTracking, { once: true });
            }
            audio.addEventListener('ended', () => {
                this.clearProgressTracking();
                if (this.imageSoundProgress) {
                    this.imageSoundProgress.value = 0;
                }
                if (this.imageSoundDuration && audio.duration) {
                    const totalTime = Math.floor(audio.duration);
                    this.imageSoundDuration.textContent = `0:00 / ${this.formatDuration(totalTime)}`;
                }
            });
            audio.addEventListener('pause', () => {});
            audio.addEventListener('play', () => {
                if (!this.audioProgressInterval) {
                    startTracking();
                }
            });
        }
        
        clearProgressTracking() {
            if (this.audioProgressInterval) {
                clearInterval(this.audioProgressInterval);
                this.audioProgressInterval = null;
            }
        }
        
        updateImagePreview() {
            if (!this.currentImageData) {
                this.imagePreview.innerHTML = 'No image selected';
                return;
            }
            const { type, data, name, isAnimated, hasTransparency, removeFrames } = this.currentImageData;
            const transparencyRequested = !!(this.aiTransparency && this.aiTransparency.checked);
            const isPNG = (type.includes('png') || (typeof data === 'string' && data.startsWith('data:image/png')) || ((name||'').toLowerCase().endsWith('.png')));
            const treatTransparent = hasTransparency || removeFrames || (transparencyRequested && isPNG);
            if (type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = data;
                img.alt = name;
                if (isAnimated || type === 'image/gif' || type === 'image/webp') {
                    img.style.imageRendering = 'auto';
                    img.style.objectFit = 'contain';
                }
                if (hasTransparency || removeFrames) {
                    img.style.border = 'none';
                    img.style.boxShadow = 'none';
                    img.style.borderRadius = '0';
                }
                this.imagePreview.innerHTML = '';
                this.imagePreview.appendChild(img);
            } else if (type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = data;
                video.controls = true;
                video.muted = true;
                video.style.maxWidth = '100%';
                video.style.maxHeight = '100%';
                if (this.preserveAspectRatio.checked && this.currentMediaData && this.currentMediaData.aspectRatio) {
                    video.style.aspectRatio = this.currentMediaData.aspectRatio;
                    video.style.objectFit = 'contain';
                }
                this.imagePreview.innerHTML = '';
                this.imagePreview.appendChild(video);
            } else if (type.startsWith('audio/')) {
                this.imagePreview.innerHTML = `🎵 ${name}<br><small>Audio file loaded</small>`;
            } else if (type === 'url') {
                const img = document.createElement('img');
                img.src = data;
                img.alt = name;
                img.onerror = () => {
                    this.imagePreview.innerHTML = `❌ Failed to load image from URL<br><small>${data}</small>`;
                };
                this.imagePreview.innerHTML = '';
                this.imagePreview.appendChild(img);
            }
            this.updatePreview();
        }
    updatePreview() {
        if (!this.currentImageData) return;
        
        const settings = this.getCurrentSettings();
        const { type, data, name, hasTransparency, removeFrames } = this.currentImageData;
        const transparencyRequested = !!(this.aiTransparency && this.aiTransparency.checked);
        const isPNG = (type.includes('png') || (typeof data === 'string' && data.startsWith('data:image/png')) || ((name||'').toLowerCase().endsWith('.png')));
        const treatTransparent = !!hasTransparency || !!removeFrames || (transparencyRequested && isPNG);

        const preview = this.imagePreview.querySelector('img, video');
        
        if (preview) {
                        preview.style.width = Math.min(parseInt(settings.width), 300) + 'px';
            preview.style.height = Math.min(parseInt(settings.height), 200) + 'px';
            preview.style.opacity = settings.opacity / 100;
            preview.style.borderRadius = settings.borderRadius + 'px';
            preview.style.transform = `scale(${Math.min(settings.scale / 100, 1.5)}) rotate(${settings.rotation}deg)`;
            if (!treatTransparent) {
                preview.style.borderRadius = settings.borderRadius + 'px';
            
            if (settings.borderWidth > 0) {
                preview.style.border = `${settings.borderWidth}px solid ${settings.borderColor}`;
                }
                
                if (settings.shadowBlur > 0) {
                    preview.style.boxShadow = `0 ${settings.shadowBlur}px ${settings.shadowBlur * 2}px rgba(0, 0, 0, 0.3)`;
                }
            } else {
                preview.style.borderRadius = '0';
                preview.style.border = 'none';
                preview.style.boxShadow = 'none';
            }
            const filters = [];
            if (settings.blur > 0) filters.push(`blur(${settings.blur}px)`);
            if (settings.brightness !== 100) filters.push(`brightness(${settings.brightness}%)`);
            if (settings.contrast !== 100) filters.push(`contrast(${settings.contrast}%)`);
            if (settings.saturation !== 100) filters.push(`saturate(${settings.saturation}%)`);
            if (settings.hueRotate > 0) filters.push(`hue-rotate(${settings.hueRotate}deg)`);
            if (settings.grayscale > 0) filters.push(`grayscale(${settings.grayscale}%)`);
            
            preview.style.filter = filters.join(' ');
        }
    }
    
    getDefaultSettings() {
        return {
            source: '',
            position: 'center',
            width: 300,
            height: 200,
            scale: 100,
            rotation: 0,
            displayTime: 5,
            opacity: 100,
            borderRadius: 8,
            shadowBlur: 10,
            borderWidth: 0,
            borderColor: '#ffffff',
            blur: 0,
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hueRotate: 0,
            grayscale: 0,
            animation: 'fade',
            soundVolume: 70,
            soundLoop: false
        };
    }
    
    getCurrentSettings() {
        return {
            source: this.currentImageData,
            position: this.imagePosition.value,
            width: parseInt(this.imageWidth.value),
            height: parseInt(this.imageHeight.value),
            scale: parseInt(this.imageScale.value),
            rotation: parseInt(this.imageRotation.value),
            displayTime: parseInt(this.imageDisplayTime.value),
            opacity: parseInt(this.imageOpacity.value),
            borderRadius: parseInt(this.imageBorderRadius.value),
            shadowBlur: parseInt(this.imageShadowBlur.value),
            borderWidth: parseInt(this.imageBorderWidth.value),
            borderColor: this.imageBorderColor.value,
            blur: parseInt(this.imageBlur.value),
            brightness: parseInt(this.imageBrightness.value),
            contrast: parseInt(this.imageContrast.value),
            saturation: parseInt(this.imageSaturation.value),
            hueRotate: parseInt(this.imageHueRotate.value),
            grayscale: parseInt(this.imageGrayscale.value),
            animation: this.imageAnimation.value,
            soundVolume: parseInt(this.imageSoundVolume.value),
            soundLoop: this.imageSoundLoop.checked,
            sound: this.currentSoundData
        };
    }
    
    togglePanel() {
        if (this.imagePanel.style.display === 'block') {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }
    
    showPanel() {
        this.imagePanel.style.display = 'block';
        this.updatePreview();
    }
    
    hidePanel() {
        this.imagePanel.style.display = 'none';
    }
    
    toggleCollapse() {
        const isCollapsed = this.imagePanel.classList.contains('collapsed');
        if (isCollapsed) {
            this.imagePanel.classList.remove('collapsed');
            this.imagePanelCollapse.textContent = '−';
        } else {
            this.imagePanel.classList.add('collapsed');
            this.imagePanelCollapse.textContent = '+';
        }
    }
    
    showImage() {
        const settings = this.getCurrentSettings();
        if (!settings.source) {
            alert('Please select an image or enter an image URL');
            return;
        }
        
        this.displayImage(settings);
    }
    
        displayImage(settings, opts = { register: true }) {
            if (this.activeImages.length >= this.maxSimultaneousImages) {
                const oldestImage = this.activeImages.shift();
                if (oldestImage && oldestImage.parentNode) {
                    if (oldestImage.associatedAudio) {
                        this.stopAssociatedAudio(oldestImage.associatedAudio);
                    }
                    oldestImage.remove();
                }
            }
        
            const imageElement = document.createElement('div');
            imageElement.className = 'image-display-element';
        
            let mediaElement;
            const sourceData = settings.source;
            let actualDisplayTime = settings.displayTime;
            let audioElement = null;
        
            if (!sourceData) {
                console.warn('No source data available for display');
                return;
            }
        
            const { type, data, isVideo, isAudio, isAnimated, hasTransparency, removeFrames } = sourceData;
            const transparencyRequested = !!(this.aiTransparency && this.aiTransparency.checked);
            const isPNG = (type.includes('png') || (typeof data === 'string' && data.startsWith('data:image/png')) || ((sourceData.name||'').toLowerCase().endsWith('.png')));
            if (type.startsWith('image/') || type === 'url') {
                mediaElement = document.createElement('img');
                mediaElement.src = data;
        
                if (isAnimated || type === 'image/gif' || type === 'image/webp') {
                    mediaElement.style.imageRendering = 'auto';
                    mediaElement.style.objectFit = 'contain';
                    if (type === 'image/gif') {
                        console.log('Displaying animated GIF');
                    } else if (type === 'image/webp') {
                        console.log('Displaying animated WebP');
                    }
                }
            } else if (type.startsWith('video/') || isVideo) {
                mediaElement = document.createElement('video');
                mediaElement.src = data;
                mediaElement.autoplay = true;
                mediaElement.muted = false;
                mediaElement.loop = false;
                mediaElement.volume = Math.max(0, Math.min(1, (settings.soundVolume || 70) / 100));
                if (sourceData.aspectRatio) {
                    mediaElement.style.aspectRatio = sourceData.aspectRatio;
                    mediaElement.style.objectFit = 'contain';
                }
            } else if (type.startsWith('audio/') || isAudio) {
                mediaElement = document.createElement('div');
                mediaElement.innerHTML = `🎵 ${sourceData.name}`;
                mediaElement.style.display = 'flex';
                mediaElement.style.alignItems = 'center';
                mediaElement.style.justifyContent = 'center';
                mediaElement.style.fontSize = '24px';
                mediaElement.style.background = 'rgba(0, 0, 0, 0.8)';
                mediaElement.style.color = 'white';
        
                audioElement = new Audio(data);
                audioElement.volume = settings.soundVolume / 100;
                audioElement.loop = false;
        
                imageElement.associatedAudio = audioElement;
        
                audioElement.play().catch(error => {
                    console.warn('Audio autoplay prevented:', error);
                    document.addEventListener('click', () => {
                        audioElement.play().catch(e => console.warn('Manual audio play failed:', e));
                    }, { once: true });
                });
            }
        
            mediaElement.style.width = settings.width + 'px';
            mediaElement.style.height = settings.height + 'px';
            mediaElement.style.opacity = settings.opacity / 100;
            mediaElement.style.transform = `scale(${settings.scale / 100}) rotate(${settings.rotation}deg)`;
        
            
            const treatTransparent = hasTransparency || removeFrames || (transparencyRequested && isPNG);
            if (!treatTransparent) {
            mediaElement.style.borderRadius = (Number(settings.borderRadius) || 0) + 'px';
            if (Number(settings.borderWidth) > 0) {
           mediaElement.style.border = `${Number(settings.borderWidth)}px solid ${settings.borderColor}`;
           }
  if (Number(settings.shadowBlur) > 0) {
    const b = Number(settings.shadowBlur);
    mediaElement.style.boxShadow = `0 ${b}px ${b * 2}px rgba(0,0,0,.3)`;
  }
} else {
  mediaElement.style.borderRadius = '0';
  mediaElement.style.border = 'none';
  mediaElement.style.boxShadow = 'none';
  mediaElement.style.background = 'transparent';
  if (mediaElement.parentElement) mediaElement.parentElement.style.background = 'transparent';
  console.log('Frame and border styling removed due to transparency setting');
  if (treatTransparent) imageElement.style.background = 'transparent';
}

        
            const filters = [];
            if (settings.blur > 0) filters.push(`blur(${settings.blur}px)`);
            if (settings.brightness !== 100) filters.push(`brightness(${settings.brightness}%)`);
            if (settings.contrast !== 100) filters.push(`contrast(${settings.contrast}%)`);
            if (settings.saturation !== 100) filters.push(`saturate(${settings.saturation}%)`);
            if (settings.hueRotate > 0) filters.push(`hue-rotate(${settings.hueRotate}deg)`);
            if (settings.grayscale > 0) filters.push(`grayscale(${settings.grayscale}%)`);
        
            if (filters.length > 0) {
                mediaElement.style.filter = filters.join(' ');
            }
        
            imageElement.appendChild(mediaElement);
        
            this.positionImage(imageElement, settings.position);
        
            if (settings.animation && settings.animation !== 'none') {
                imageElement.classList.add(settings.animation);
                imageElement.style.setProperty('--display-time', `${actualDisplayTime}s`);
            }
        
            document.body.appendChild(imageElement);
            this.activeImages.push(imageElement);

                let activeItemId = null;
            if (opts.register && this.app.uiManager && this.app.uiManager.addActiveItem) {
            const contentDescription = sourceData.name || 'Image';
            
            const existingItem = this.app.uiManager.activeItems.find(item => 
                item.type === 'image' && 
                item.content === contentDescription && 
                !item.element
            );
            
            if (existingItem) {
                existingItem.element = imageElement;
                activeItemId = existingItem.id;
                imageElement.dataset.activeItemId = activeItemId;
                this.app.uiManager.updateActiveItemsDisplay();
            } else {
                activeItemId = this.app.uiManager.addActiveItem('image', contentDescription, imageElement, settings);
            }
        }
        
            if (settings.sound && !type.startsWith('audio/') && !isAudio && !type.startsWith('video/')) {
                const imageAudio = this.playImageSoundForDuration(settings.sound, settings.soundVolume, actualDisplayTime);
                if (imageAudio) {
                    imageElement.associatedAudio = imageAudio;
                }
            }
        
            const displayDuration = actualDisplayTime * 1000;
            const removalTimeout = setTimeout(() => {
                if (imageElement.associatedAudio) {
                    this.stopAssociatedAudio(imageElement.associatedAudio);
                }
                if (audioElement && !audioElement.ended) {
                    audioElement.pause();
                    audioElement.currentTime = 0;
                }
                if (mediaElement.tagName === 'VIDEO') {
                    mediaElement.pause();
                    mediaElement.currentTime = 0;
                }
                this.removeImageElement(imageElement);
            }, displayDuration);
        
            imageElement.dataset.removalTimeout = removalTimeout;
        
            console.log(`Media displayed for ${actualDisplayTime} seconds`);
        }
        
        playImageSoundForDuration(soundData, volume, displayDuration) {
            try {
                const audio = new Audio(soundData.data);
                audio.crossOrigin = 'anonymous';
                audio.volume = Math.max(0, Math.min(1, volume / 100));
                audio.loop = false;
                const stopTimeout = setTimeout(() => {
                    if (audio && !audio.paused) {
                        audio.pause();
                        audio.currentTime = 0;
                        console.log('Audio stopped after image display duration');
                    }
                }, displayDuration * 1000);
                audio.stopTimeout = stopTimeout;
                audio.onerror = (error) => {
                    console.warn('Image audio playback error:', error);
                    if (audio.stopTimeout) {
                        clearTimeout(audio.stopTimeout);
                    }
                };
                audio.addEventListener('ended', () => {
                    if (audio.stopTimeout) {
                        clearTimeout(audio.stopTimeout);
                    }
                    console.log('Image audio playback completed naturally');
                });
               audio.addEventListener('loadedmetadata', () => this.setupProgressTracking(audio));
               audio.play().catch(err => {
               document.addEventListener('click', () => audio.play().catch(()=>{}), { once: true });
               });
               return audio;           
            } catch (error) {
                console.error('Error playing image sound for duration:', error);
                return null;
            }
        }
        
        stopAssociatedAudio(audio) {
            if (audio) {
                try {
                    audio.pause();
                    audio.currentTime = 0;
                    audio.loop = false;
                    if (audio.stopTimeout) {
                        clearTimeout(audio.stopTimeout);
                        audio.stopTimeout = null;
                    }
                    if (audio.maxDurationTimeout) {
                        clearTimeout(audio.maxDurationTimeout);
                        audio.maxDurationTimeout = null;
                    }
                    audio.onended = null;
                    audio.onerror = null;
                    audio.onloadedmetadata = null;
                    audio.oncanplaythrough = null;
                    audio.src = '';
                    audio.load();
                    console.log('Associated audio stopped and cleaned up');
                } catch (error) {
                    console.warn('Error stopping associated audio:', error);
                }
            }
        }
        
        playImageSound(soundData, volume, loop) {
            try {
                this.stopCurrentAudio();
                const audio = new Audio(soundData.data);
                this.currentAudio = audio;
                audio.volume = Math.max(0, Math.min(1, volume / 100));
                audio.loop = false;
                audio.onerror = (error) => {
                    console.warn('Audio playback error:', error);
                    this.currentAudio = null;
                    this.clearProgressTracking();
                };
                audio.addEventListener('ended', () => {
                    this.currentAudio = null;
                    this.clearProgressTracking();
                    console.log('Audio playback completed - no restart');
                });
                audio.addEventListener('canplaythrough', () => {
                    this.setupProgressTracking(audio);
                    audio.play().catch(error => {
                        console.warn('Audio autoplay prevented:', error);
                        document.addEventListener('click', () => {
                            if (this.currentAudio === audio) {
                                audio.play().then(() => {
                                    this.setupProgressTracking(audio);
                                }).catch(e => console.warn('Manual audio play failed:', e));
                            }
                        }, { once: true });
                    });
                });
                audio.load();
            } catch (error) {
                console.error('Error playing image sound:', error);
        }
    }
    
     positionImage(element, position) {
        element.style.position = 'fixed';
        element.style.zIndex = '15000';
    
        const contentArea = document.querySelector('.content-area');
        const isRecordingSized = contentArea && contentArea.classList.contains('sized');
    
        let containerBounds = {
            left: 0,
            top: 0,
            right: window.innerWidth,
            bottom: window.innerHeight,
            width: window.innerWidth,
            height: window.innerHeight
        };
    
        if (isRecordingSized) {
            const contentRect = contentArea.getBoundingClientRect();
            containerBounds = {
                left: contentRect.left,
                top: contentRect.top,
                right: contentRect.right,
                bottom: contentRect.bottom,
                width: contentRect.width,
                height: contentRect.height
            };
        }
    
        const margin = 20;
    
        switch (position) {
            case 'top-left':
                element.style.top = (containerBounds.top + margin) + 'px';
                element.style.left = (containerBounds.left + margin) + 'px';
                break;
            case 'top-center':
                element.style.top = (containerBounds.top + margin) + 'px';
                element.style.left = (containerBounds.left + containerBounds.width / 2) + 'px';
                element.style.transform += ' translateX(-50%)';
                break;
            case 'top-right':
                element.style.top = (containerBounds.top + margin) + 'px';
                element.style.right = (window.innerWidth - containerBounds.right + margin) + 'px';
                break;
            case 'center':
                element.style.top = (containerBounds.top + containerBounds.height / 2) + 'px';
                element.style.left = (containerBounds.left + containerBounds.width / 2) + 'px';
                element.style.transform += ' translate(-50%, -50%)';
                break;
            case 'bottom-left':
                element.style.bottom = (window.innerHeight - containerBounds.bottom + margin) + 'px';
                element.style.left = (containerBounds.left + margin) + 'px';
                break;
            case 'bottom-center':
                element.style.bottom = (window.innerHeight - containerBounds.bottom + margin) + 'px';
                element.style.left = (containerBounds.left + containerBounds.width / 2) + 'px';
                element.style.transform += ' translateX(-50%)';
                break;
            case 'bottom-right':
                element.style.bottom = (window.innerHeight - containerBounds.bottom + margin) + 'px';
                element.style.right = (window.innerWidth - containerBounds.right + margin) + 'px';
                break;
        }
    }
    canUseTransparency = () => {
  const isStatic = (this.aiAnim?.value || 'Static Image').toLowerCase().includes('static');
  const style = (this.aiStyle?.value || '').toLowerCase();
  return isStatic;
};

    removeImageElement(element) {
        if (element && element.parentNode) {
            if (element.dataset.removalTimeout) {
                clearTimeout(parseInt(element.dataset.removalTimeout));
            }
            
                        if (this.app.uiManager && this.app.uiManager.cleanupActiveItem) {
                this.app.uiManager.cleanupActiveItem(element);
            }
            
            if (element.associatedAudio) {
                this.stopAssociatedAudio(element.associatedAudio);
            }
            element.style.transition = `opacity ${this.imageFadeTransition}ms ease-out`;
            element.style.opacity = '0';
            setTimeout(() => {
                if (element.parentNode) {
                    element.remove();
                }
                const index = this.activeImages.indexOf(element);
                if (index > -1) {
                    this.activeImages.splice(index, 1);
                }
            }, this.imageFadeTransition);
        }
    }
    
    previewImage() {
        const settings = this.getCurrentSettings();
        if (!settings.source) {
            alert('Please select an image or enter an image URL');
            return;
        }
        const tempSettings = { ...settings, displayTime: 2 };
        this.displayImage(tempSettings, { register: false });
    }
    
    removeAllImages() {
        this.activeImages.forEach(element => {
            if (element.parentNode) {
                if (element.dataset.removalTimeout) {
                    clearTimeout(parseInt(element.dataset.removalTimeout));
                }
                if (element.associatedAudio) {
                    this.stopAssociatedAudio(element.associatedAudio);
                }
                element.remove();
            }
        });
        this.activeImages = [];
    }
    
    saveSettings() {
        const settings = this.getCurrentSettings();
        const exportSettings = { ...settings };
        if (exportSettings.source && exportSettings.source.data) {
            if (exportSettings.source.type === 'url') {
                exportSettings.source = {
                    ...exportSettings.source,
                    data: exportSettings.source.data
                };
            } else {
                exportSettings.source = {
                    ...exportSettings.source,
                    data: '[FILE_DATA]'
                };
            }
        }
        if (exportSettings.sound && exportSettings.sound.data) {
            if (exportSettings.sound.isUrl) {
                exportSettings.sound = {
                    ...exportSettings.sound,
                    data: exportSettings.sound.data
                };
            } else {
                exportSettings.sound = {
                    ...exportSettings.sound,
                    data: '[AUDIO_DATA]'
                };
            }
        }
        const dataStr = JSON.stringify(exportSettings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `image-display-settings-${new Date().toISOString().slice(0, 10)}.json`;
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
                    console.error('Error loading settings:', error);
                    alert('Failed to load settings: Invalid JSON file');
                }
            };
            reader.readAsText(file);
        });
        input.click();
    }
    
    applySettings(settings) {
        if (settings.source) {
            if (settings.source.type === 'url' && settings.source.data && settings.source.data !== '[FILE_DATA]') {
                this.imageUrlInput.value = settings.source.data;
                this.handleUrlInput();
            }
        }
        if (settings.sound) {
            if (settings.sound.isUrl && settings.sound.data && settings.sound.data !== '[AUDIO_DATA]') {
                const soundUrlInput = document.getElementById('imageSoundUrlInput');
                if (soundUrlInput) {
                    soundUrlInput.value = settings.sound.data;
                    this.handleSoundUrlInput(settings.sound.data);
                }
            }
        }
        this.imagePosition.value = settings.position || 'center';
        this.imageWidth.value = settings.width || 300;
        this.widthValue.textContent = this.imageWidth.value + 'px';
        this.imageHeight.value = settings.height || 200;
        this.heightValue.textContent = this.imageHeight.value + 'px';
        this.imageScale.value = settings.scale || 100;
        this.scaleValue.textContent = this.imageScale.value + '%';
        this.imageRotation.value = settings.rotation || 0;
        this.rotationValue.textContent = this.imageRotation.value + '°';
        this.imageDisplayTime.value = settings.displayTime || 5;
        this.imageDisplayTimeValue.textContent = this.imageDisplayTime.value + 's';
        this.imageOpacity.value = settings.opacity || 100;
        this.opacityValue.textContent = this.imageOpacity.value + '%';
        this.imageBorderRadius.value = settings.borderRadius || 8;
        this.imageBorderRadiusValue.textContent = this.imageBorderRadius.value + 'px';
        this.imageShadowBlur.value = settings.shadowBlur || 10;
        this.imageShadowBlurValue.textContent = this.imageShadowBlur.value + 'px';
        this.imageBorderWidth.value = settings.borderWidth || 0;
        this.imageBorderWidthValue.textContent = this.imageBorderWidth.value + 'px';
        this.imageBorderColor.value = settings.borderColor || '#ffffff';
        this.imageBlur.value = settings.blur || 0;
        this.imageBlurValue.textContent = this.imageBlur.value + 'px';
        this.imageBrightness.value = settings.brightness || 100;
        this.imageBrightnessValue.textContent = this.imageBrightness.value + '%';
        this.imageContrast.value = settings.contrast || 100;
        this.imageContrastValue.textContent = this.imageContrast.value + '%';
        this.imageSaturation.value = settings.saturation || 100;
        this.imageSaturationValue.textContent = this.imageSaturation.value + '%';
        this.imageHueRotate.value = settings.hueRotate || 0;
        this.imageHueRotateValue.textContent = this.imageHueRotate.value + '°';
        this.imageGrayscale.value = settings.grayscale || 0;
        this.imageGrayscaleValue.textContent = this.imageGrayscale.value + '%';
        this.imageAnimation.value = settings.animation || 'fade';
        this.imageSoundVolume.value = settings.soundVolume || 70;
        this.imageSoundVolumeValue.textContent = this.imageSoundVolume.value + '%';
        this.imageSoundLoop.checked = settings.soundLoop || false;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    formatDuration(seconds) {
        if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        if (minutes > 0) {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        return `0:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    cleanup() {
        this.stopCurrentAudio();
        this.activeImages.forEach(element => {
            if (element.parentNode) {
                if (element.dataset.removalTimeout) {
                    clearTimeout(parseInt(element.dataset.removalTimeout));
                }
                if (element.associatedAudio) {
                    this.stopAssociatedAudio(element.associatedAudio);
                }
                element.remove();
            }
        });
        this.activeImages = [];
        this.currentImageData = null;
        this.currentSoundData = null;
        this.audioMetadata = null;
    }
    
    extractImageDimensions(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.naturalWidth,
                    height: img.naturalHeight
                });
            };
            img.onerror = () => {
                reject(new Error('Failed to load image for dimension extraction'));
            };
            img.src = dataUrl;
        });
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
            video.src = dataUrl;
        });
    }
    
    adjustImageDimensionsToAspectRatio(originalWidth, originalHeight) {
        const aspectRatio = originalWidth / originalHeight;
        const maxDisplayWidth = 800;
        const maxDisplayHeight = 600;
        let newWidth = originalWidth;
        let newHeight = originalHeight;
        if (originalWidth > maxDisplayWidth) {
            newWidth = maxDisplayWidth;
            newHeight = newWidth / aspectRatio;
        }
        if (newHeight > maxDisplayHeight) {
            newHeight = maxDisplayHeight;
            newWidth = newHeight * aspectRatio;
        }
        this.imageWidth.value = Math.round(newWidth);
        this.widthValue.textContent = this.imageWidth.value + 'px';
        this.imageHeight.value = Math.round(newHeight);
        this.heightValue.textContent = this.imageHeight.value + 'px';
        console.log(`Adjusted dimensions: ${newWidth}x${newHeight} (maintaining ratio: ${aspectRatio})`);
    }
    
    adjustMediaDimensionsToAspectRatio(originalWidth, originalHeight) {
        if (!this.preserveAspectRatio.checked) return;
        const aspectRatio = originalWidth / originalHeight;
        const maxIframeWidth = 800;
        const maxIframeHeight = 600;
        let newWidth = originalWidth;
        let newHeight = originalHeight;
        if (originalWidth > maxIframeWidth) {
            newWidth = maxIframeWidth;
            newHeight = newWidth / aspectRatio;
        }
        if (newHeight > maxIframeHeight) {
            newHeight = maxIframeHeight;
            newWidth = newHeight * aspectRatio;
        }
        this.imageWidth.value = Math.round(newWidth);
        this.widthValue.textContent = this.imageWidth.value + 'px';
        this.imageHeight.value = Math.round(newHeight);
        this.heightValue.textContent = this.imageHeight.value + 'px';
        console.log(`Adjusted media dimensions for iframe: ${newWidth}x${newHeight} (ratio: ${aspectRatio})`);
    }
    
      toggleAIGenerator() {
        if (this.smartImagesAI) {
            return this.smartImagesAI.toggleAIGenerator();
        }
    }
    
    selectAIPreset(effect) {
        if (this.smartImagesAI) {
            return this.smartImagesAI.selectAIPreset(effect);
        }
    }
    
    updateAnimationSettings() {
        if (this.smartImagesAI) {
            return this.smartImagesAI.updateAnimationSettings();
        }
    }
    
    async generateAIImage() {
        if (this.smartImagesAI) {
            return await this.smartImagesAI.generateAIImage();
        }
    }
    
    async callAIGenerationAPI(params) {
        const aiAPIEndpoint = 'https://api.streaming-ai-generator.com/v1/generate';
        const fallbackToLocalGeneration = true;
        const maxGenerationTime = 30000;
        const allowAlpha = (params.animationType === 'static');
        if (params.transparency && !allowAlpha) { params.transparency = false; if (this.aiTransparency) this.aiTransparency.checked = false; }
        try {
            if (typeof window.websim !== 'undefined' && window.websim.aiImageGenerator) {
                console.log('Using WebSim AI Image Generator');
                const result = await Promise.race([
                    window.websim.aiImageGenerator.generate({
                        prompt: params.prompt,
                        style: params.style,
                        width: parseInt(params.size.split('x')[0]),
                        height: parseInt(params.size.split('x')[1]),
                        format: params.animationType === 'static' ? 'png' : params.animationType,
                        transparency: params.transparency
                    }),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Generation timeout')), maxGenerationTime)
                    )
                ]);
                if (result && result.url) {
                    return {
                        dataUrl: result.url,
                        format: params.animationType === 'static' ? 'png' : params.animationType,
                        estimatedSize: result.size || 0,
                        metadata: result.metadata || {}
                    };
                }
            }
            if (fallbackToLocalGeneration) {
                return await this.generateFallbackImage(params);
            }
            throw new Error('No AI generation service available');
        } catch (error) {
            console.warn('AI API failed, using fallback:', error);
            if (fallbackToLocalGeneration) {
                return await this.generateFallbackImage(params);
            }
            throw error;
        }
    }
    
    async generateFallbackImage(params) {
        const simulationDelay = 2000;
        await new Promise(resolve => setTimeout(resolve, simulationDelay));
        const canvas = document.createElement('canvas');
        const [width, height] = params.size.split('x').map(Number);
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
        if (!params.transparency) {
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
        gradient.addColorStop(0, this.getEffectColor(params.style, 0.8));
        gradient.addColorStop(1, this.getEffectColor(params.style, 0.2));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
       }
        this.drawEffectElements(ctx, width, height, params);
        const format = params.animationType === 'static' ? 'png' : 'png';
        const dataUrl = canvas.toDataURL(`image/${format}`);
        return {
            dataUrl: dataUrl,
            format: format,
            estimatedSize: dataUrl.length * 0.75,
            metadata: { fallbackGenerated: true }
        };
    }
    
    drawEffectElements(ctx, width, height, params) {
        const centerX = width / 2;
        const centerY = height / 2;
        switch (params.style) {
            case 'cartoon':
                this.drawCartoonBurst(ctx, centerX, centerY, width * 0.4);
                break;
            case 'neon':
                this.drawNeonGlow(ctx, centerX, centerY, width * 0.3);
                break;
            case 'minimal':
                this.drawMinimalParticles(ctx, width, height, 20);
                break;
            default:
                this.drawDefaultEffect(ctx, centerX, centerY, width * 0.35);
                break;
        }
    }
    
    getEffectColor(style, alpha) {
        const colors = {
            cartoon: `rgba(255, 193, 7, ${alpha})`,
            realistic: `rgba(255, 87, 34, ${alpha})`,
            neon: `rgba(0, 255, 255, ${alpha})`,
            minimal: `rgba(255, 255, 255, ${alpha})`,
            glitch: `rgba(255, 0, 128, ${alpha})`,
            retro: `rgba(128, 255, 0, ${alpha})`
        };
        return colors[style] || `rgba(255, 149, 0, ${alpha})`;
    }
    
    drawCartoonBurst(ctx, x, y, radius) {
        ctx.save();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI * 2) / 12;
            const startRadius = radius * 0.3;
            const endRadius = radius * (0.8 + Math.random() * 0.4);
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * startRadius, y + Math.sin(angle) * startRadius);
            ctx.lineTo(x + Math.cos(angle) * endRadius, y + Math.sin(angle) * endRadius);
            ctx.stroke();
        }
        ctx.restore();
    }
    
    drawNeonGlow(ctx, x, y, radius) {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00FFFF';
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    
    drawMinimalParticles(ctx, width, height, count) {
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 4 + 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    
    drawDefaultEffect(ctx, x, y, radius) {
        ctx.save();
        ctx.fillStyle = '#FF9500';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    async regenerateAIImage() {
        if (!this.currentGeneratedImage || this.isGenerating) return;
        const originalPrompt = this.aiCustomPrompt.value;
        const variations = [
            ', with more vibrant colors',
            ', with enhanced effects',
            ', with different lighting',
            ', with improved details',
            ', with alternate composition'
        ];
        const variation = variations[Math.floor(Math.random() * variations.length)];
        this.aiCustomPrompt.value = originalPrompt + variation;
        await this.generateAIImage();
        setTimeout(() => {
            this.aiCustomPrompt.value = originalPrompt;
        }, 1000);
    }
    
    async saveGeneratedImage() {
        if (!this.currentGeneratedImage || !this.currentImageData) {
            alert('No generated image to save');
            return;
        }
        try {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const effect = document.querySelector('.ai-preset-btn.active')?.getAttribute('data-effect') || 'custom';
            const style = this.aiStyle.value;
            const format = this.aiAnimationType.value === 'static' ? 'png' : this.aiAnimationType.value;
            const filename = `streaming-effect-${effect}-${style}-${timestamp}.${format}`;
            const response = await fetch(this.currentImageData.data);
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            setTimeout(() => URL.revokeObjectURL(link.href), 100);
            console.log(`Generated image saved as: ${filename}`);
        } catch (error) {
            console.error('Error saving generated image:', error);
            alert('Failed to save image: ' + error.message);
        }
    }
    
    showGenerationStatus(show) {
        if (this.smartImagesAI) {
            return this.smartImagesAI.showGenerationStatus(show);
        }
    }
    
    async handleSoundSelection(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (this.currentImageData && (this.currentImageData.type.startsWith('video/') || this.currentImageData.type.startsWith('audio/'))) {
            alert('Current media already contains sound. Please remove the media first to add separate audio.');
            event.target.value = '';
            return;
        }
        try {
            const maxAudioSize = 20 * 1024 * 1024;
            const supportedAudioTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a'];
            if (file.size > maxAudioSize) {
                alert('Audio file too large. Maximum allowed size is 20MB.');
                return;
            }
            if (!supportedAudioTypes.includes(file.type)) {
                alert('Unsupported audio format. Please select an MP3, WAV, OGG, or AAC file.');
                return;
            }
            const reader = new FileReader();
            reader.onload = async (e) => {
                this.currentSoundData = {
                    type: file.type,
                    data: e.target.result,
                    name: file.name,
                    size: file.size,
                    isUrl: false
                };
                try {
                    this.audioMetadata = await this.extractAudioMetadata(e.target.result);
                } catch (error) {
                    console.warn('Could not extract audio metadata:', error);
                    this.audioMetadata = { duration: 0 };
                }
                this.updateSoundInfo();
                console.log(`Sound loaded: ${file.name}`);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error handling sound selection:', error);
            alert('Error loading sound file: ' + error.message);
        }
    }
    
    handleSoundUrlInput(url) {
        if (!url.trim()) {
            this.currentSoundData = null;
            this.audioMetadata = null;
            this.updateSoundInfo();
            return;
        }
        if (this.currentImageData && (this.currentImageData.type.startsWith('video/') || this.currentImageData.type.startsWith('audio/'))) {
            alert('Current media already contains sound. Please remove the media first to add separate audio.');
            return;
        }
        try {
            new URL(url);
            this.currentSoundData = {
                type: 'url',
                data: url,
                name: url.split('/').pop() || 'Web Audio',
                size: 0,
                isUrl: true
            };
            this.extractAudioMetadataFromUrl(url).then(metadata => {
                this.audioMetadata = metadata;
                this.updateSoundInfo();
            }).catch(error => {
                console.warn('Could not extract audio metadata from URL:', error);
                this.audioMetadata = { duration: 0 };
                this.updateSoundInfo();
            });
            console.log(`Sound URL loaded: ${url}`);
        } catch (error) {
            console.warn('Invalid sound URL format:', error);
        }
    }
    
    async extractAudioMetadataFromUrl(url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.onloadedmetadata = () => {
                const metadata = {
                    duration: audio.duration || 0,
                    sampleRate: audio.sampleRate || null,
                    channels: audio.channels || null
                };
                resolve(metadata);
            };
            audio.onerror = () => {
                reject(new Error('Failed to load audio from URL'));
            };
            setTimeout(() => {
                reject(new Error('Audio URL metadata extraction timeout'));
            }, 10000);
            audio.crossOrigin = 'anonymous';
            audio.src = url;
        });
    }
    
    removeCurrentMedia() {
        this.currentImageData = null;
        this.currentSoundData = null;
        this.audioMetadata = null;
        this.imageFileInput.value = '';
        this.imageUrlInput.value = '';
        this.imageSoundInput.value = '';
        const soundUrlInput = document.getElementById('imageSoundUrlInput');
        if (soundUrlInput) {
            soundUrlInput.value = '';
        }
        this.stopCurrentAudio();
        this.updateImagePreview();
        this.updateSoundInfo();
        this.removeAllImages();
        console.log('Current media and sound cleared');
    }
}
