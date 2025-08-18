export default class UIManager {
    constructor(app) {
        this.app = app;
        this.panelCollapsed = false;
        
        this.initializePanelToggle();
        this.initializeInfoModal();
    }
    
    initializePanelToggle() {
        const controlPanel = document.querySelector('.control-panel');
        const toggleBtn = document.createElement('div');
        toggleBtn.id = 'controls-toggle';
        toggleBtn.textContent = '>';
        toggleBtn.addEventListener('click', () => this.togglePanel());
        
        controlPanel.appendChild(toggleBtn);
        
        if (window.innerWidth <= 768) {
            this.togglePanel();
        }
    }
    
    togglePanel() {
        const controlPanel = document.querySelector('.control-panel');
        const toggleBtn = document.getElementById('controls-toggle');
        
        this.panelCollapsed = !this.panelCollapsed;
        
        if (this.panelCollapsed) {
            controlPanel.classList.add('collapsed');
            toggleBtn.textContent = '<';
        } else {
            controlPanel.classList.remove('collapsed');
            toggleBtn.textContent = '>';
        }
    }
    
    initializeInfoModal() {
        this.app.infoModal.addEventListener('click', (e) => {
            if (e.target === this.app.infoModal) {
                this.hideInfoModal();
            }
        });

        // Settings modal initialization
        this.settingsModal = document.getElementById('settingsModal');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsCloseBtn = document.getElementById('settingsCloseBtn');

        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => this.showSettingsModal());
        }
        
        if (this.settingsCloseBtn) {
            this.settingsCloseBtn.addEventListener('click', () => this.hideSettingsModal());
        }

        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) {
                    this.hideSettingsModal();
                }
            });
        }

                this.initializeThemeToggle();
        this.initializeActiveItemsManager();
    }

        initializeThemeToggle() {
        this.themeToggleSwitch = document.getElementById('themeToggleSwitch');
        
        if (this.themeToggleSwitch) {
            // Load saved theme preference
            const isDarkTextMode = localStorage.getItem('websim_dark_text_theme') === 'true';
            this.applyTheme(isDarkTextMode);
            
            this.themeToggleSwitch.addEventListener('click', () => {
                const currentlyActive = this.themeToggleSwitch.classList.contains('active');
                const newTheme = !currentlyActive;
                
                this.applyTheme(newTheme);
                localStorage.setItem('websim_dark_text_theme', newTheme.toString());
                
                console.log(`Theme switched to: ${newTheme ? 'Dark Text Mode' : 'Light Text Mode'}`);
            });
            
            console.log('Theme toggle initialized, current mode:', isDarkTextMode ? 'Dark Text' : 'Light Text');
        }
    }

        applyTheme(isDarkTextMode) {
        const body = document.body;
        const toggleSwitch = this.themeToggleSwitch;
        
        // Add transition class for smooth theme switching
        body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        
        if (isDarkTextMode) {
            body.classList.add('dark-text-theme');
            toggleSwitch?.classList.add('active');
        } else {
            body.classList.remove('dark-text-theme');
            toggleSwitch?.classList.remove('active');
        }
        
        // Remove transition after animation completes
        setTimeout(() => {
            body.style.transition = '';
        }, 300);
    }

    initializeActiveItemsManager() {
        this.activeItemsSection = document.getElementById('activeItemsSection');
        this.activeItemsList = document.getElementById('activeItemsList');
        this.activeCount = document.getElementById('activeCount');
        this.activeItems = [];
        this.nextItemId = 1;

        this.updateActiveItemsDisplay();
    }

    addActiveItem(type, content, element, settings) {
        const item = {
            id: this.nextItemId++,
            type: type, // 'text', 'image', or 'voice'
            content: content,
            element: element,
            settings: settings,
            timestamp: Date.now()
        };

        this.activeItems.push(item);
        this.updateActiveItemsDisplay();
        
        // Store reference in the display element for cleanup
        if (element) {
            element.dataset.activeItemId = item.id;
        }

        return item.id;
    }

    removeActiveItem(itemId) {
        const index = this.activeItems.findIndex(item => item.id === itemId);
        if (index > -1) {
            const item = this.activeItems[index];
            
            // Remove the display element
            if (item.element && item.element.parentNode) {
                item.element.remove();
            }
            
            // Remove from active items list
            this.activeItems.splice(index, 1);
            this.updateActiveItemsDisplay();
        }
    }

    updateActiveItemsDisplay() {
        if (!this.activeItemsList || !this.activeCount) return;

        // Update count
        this.activeCount.textContent = this.activeItems.length;

        // Clear existing items
        this.activeItemsList.innerHTML = '';

        // Add each active item
        this.activeItems.forEach((item, index) => {
            const itemElement = document.createElement('div');
            
            const isCurrentlyDisplaying = item.element && item.element.parentNode;
            itemElement.className = `active-item ${item.type}-item ${isCurrentlyDisplaying ? 'currently-displaying' : 'stored-for-replay'}`;
            
            const iconMap = {
                'text': '📝',
                'image': '🖼️',
                'voice': '🎙️'
            };
            const icon = iconMap[item.type] || '❓';
            const displayNumber = index + 1;
            
            const statusIndicator = isCurrentlyDisplaying ? '●' : '▶';
            const statusTitle = isCurrentlyDisplaying ? 'Currently displaying - click to replay' : 'Stored - click to replay';
            
            itemElement.innerHTML = `
                <div class="active-item-icon">${icon}</div>
                <div class="active-item-number">${displayNumber}</div>
                <div class="active-item-status" title="${statusTitle}">${statusIndicator}</div>
                <button class="active-item-remove" data-item-id="${item.id}">×</button>
            `;
            
            itemElement.title = statusTitle;

            /* @tweakable vignette popup content display for active items */
            // Create vignette popup for content preview
            const vignettePopup = document.createElement('div');
            vignettePopup.className = 'active-item-vignette';
            vignettePopup.style.display = 'none';
            
            let vignetteContent = '';
            if (item.type === 'text') {
                vignetteContent = `
                    <div class="vignette-header">📝 Text Content</div>
                    <div class="vignette-content">${item.content.substring(0, 200)}${item.content.length > 200 ? '...' : ''}</div>
                    <div class="vignette-settings">Font: ${item.settings.fontFamily}, Size: ${item.settings.fontSize}px</div>
                `;
            } else if (item.type === 'image') {
                vignetteContent = `
                    <div class="vignette-header">🖼️ Image Display</div>
                    <div class="vignette-content">${item.content}</div>
                    <div class="vignette-settings">Size: ${item.settings.width}x${item.settings.height}px</div>
                `;
            } else if (item.type === 'vignette') {
                /* @tweakable vignette preview popup content for reading vignettes */
                vignetteContent = `
                    <div class="vignette-header">📋 Reading Vignette</div>
                    <div class="vignette-content">${item.settings.content.substring(0, 200)}${item.settings.content.length > 200 ? '...' : ''}</div>
                    <div class="vignette-settings">Position: ${item.settings.position ? `${item.settings.position.x}, ${item.settings.position.y}` : 'Default'}</div>
                `;
            }
            
            vignettePopup.innerHTML = vignetteContent;
            itemElement.appendChild(vignettePopup);

            // Show/hide vignette on hover
            itemElement.addEventListener('mouseenter', () => {
                vignettePopup.style.display = 'block';
            });
            
            itemElement.addEventListener('mouseleave', () => {
                vignettePopup.style.display = 'none';
            });

            // Add click handler to re-display item
            itemElement.addEventListener('click', (e) => {
                if (!e.target.classList.contains('active-item-remove')) {
                    this.reDisplayActiveItem(item);
                }
            });

            // Add remove handler
            const removeBtn = itemElement.querySelector('.active-item-remove');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeActiveItem(item.id);
            });

            this.activeItemsList.appendChild(itemElement);
        });
    }

    reDisplayActiveItem(item) {
        if (item.element && item.element.parentNode) {
            // If the item is currently displaying, remove it first
            item.element.remove();
            item.element = null;
        }
        
        if (item.type === 'text' && this.app.textDisplayManager) {
            // Re-display text with stored settings
            this.app.textDisplayManager.displayText(item.settings);
        } else if (item.type === 'image' && this.app.imageDisplayManager) {
            // Re-display image with stored settings
            this.app.imageDisplayManager.displayImage(item.settings);
        } else if (item.type === 'voice' && this.app.voiceRecorderManager) {
            this.playVoiceMessage(item.settings);
        } else if (item.type === 'vignette' && this.app.smartRedactorManager) {
            /* @tweakable enhanced vignette reopening functionality with proper element reference management */
            // Reopen the reading vignette with full state restoration
            const smartRedactor = this.app.smartRedactorManager;
            
            // Restore content
            if (smartRedactor.readingText && item.settings.content) {
                smartRedactor.readingText.textContent = item.settings.content;
            }
            
            // Show the vignette
            if (smartRedactor.readingVignette) {
                smartRedactor.readingVignette.style.display = 'block';
               if (item.settings.position) {
                    smartRedactor.vignettePosition = item.settings.position;
                          
                    // Ensure position is within screen bounds
                    const validX = Math.max(0, Math.min(item.settings.position.x, window.innerWidth - 200));
                    const validY = Math.max(0, Math.min(item.settings.position.y, window.innerHeight - 100));
                    
                    smartRedactor.readingVignette.style.left = `${validX}px`;
                    smartRedactor.readingVignette.style.top = `${validY}px`;
                    smartRedactor.readingVignette.style.transform = 'none';
                }
                
                /* @tweakable vignette state restoration including pinned and collapsed states */
                // Restore pinned state
                if (item.settings.isPinned) {
                    smartRedactor.isPinned = true;
                    smartRedactor.readingVignette.classList.add('pinned');
                    if (smartRedactor.vignettePin) {
                        smartRedactor.vignettePin.classList.add('active');
                    }
                } else {
                    smartRedactor.isPinned = false;
                    smartRedactor.readingVignette.classList.remove('pinned');
                    if (smartRedactor.vignettePin) {
                        smartRedactor.vignettePin.classList.remove('active');
                    }
                }
                
                // Ensure vignette is not collapsed
                smartRedactor.isCollapsed = false;
                smartRedactor.readingVignette.classList.remove('collapsed');
                if (smartRedactor.vignetteCollapse) {
                    smartRedactor.vignetteCollapse.textContent = '−';
                }
                
                /* @tweakable progress bar reset and tracking setup for reopened vignettes */
                // Reset progress bar
                if (smartRedactor.progressBar) {
                    smartRedactor.progressBar.style.width = '0%';
                }
                
                // Update item element reference to the reopened vignette
                item.element = smartRedactor.readingVignette;
                smartRedactor.readingVignette.dataset.activeItemId = item.id;
                
                // Setup progress tracking
                if (smartRedactor.setupReadingProgress) {
                    smartRedactor.setupReadingProgress();
                }
                
                console.log('Vignette reopened successfully from active display thumbnail');
            }
        }
        
        
        setTimeout(() => this.updateActiveItemsDisplay(), 110);
    }

    async playVoiceMessage(voiceMessage) {
        try {
            if (voiceMessage.audioBlob) {
                console.log('Playing recorded audio from active items:', voiceMessage.isRecordedAudio ? 'Original recording' : 'Generated TTS');
                
                // Play pre-recorded or generated audio
                const audio = new Audio(URL.createObjectURL(voiceMessage.audioBlob));
                
                // Apply voice settings if available
                if (voiceMessage.voiceSettings) {
                    audio.volume = Math.max(0, Math.min(1, (voiceMessage.voiceSettings.volume || 80) / 100));
                    audio.playbackRate = Math.max(0.25, Math.min(4, (voiceMessage.voiceSettings.speed || 1)));
                }
                
                await audio.play();
                
                // Cleanup URL after playback
                audio.addEventListener('ended', () => {
                    URL.revokeObjectURL(audio.src);
                });
                
                const statusMessage = voiceMessage.isRecordedAudio 
                    ? 'Playing recorded voice message'
                    : 'Playing generated voice message';
                console.log(statusMessage);
                
            } else if (voiceMessage.text && this.app.voiceRecorderManager?.textToSpeechAPI) {
                // Fallback: generate and play audio on demand
                console.log('Generating TTS audio for voice message replay');
                const voiceOptions = {
                    ...voiceMessage.voiceSettings,
                    text: voiceMessage.text
                };
                
                await this.app.voiceRecorderManager.textToSpeechAPI(voiceOptions);
                
            } else {
                throw new Error('No audio data or TTS API available');
            }
            
        } catch (error) {
            console.error('Error playing voice message:', error);
            alert('Could not play voice message: ' + error.message);
        }
    }

    cleanupActiveItem(element) {
        if (element && element.dataset.activeItemId) {
            const itemId = parseInt(element.dataset.activeItemId);
            const index = this.activeItems.findIndex(item => item.id === itemId);
            if (index > -1) {
                // Don't remove the item from the list - keep it for replay functionality
                const item = this.activeItems[index];
                if (item.element === element) {
                    // Just clear the element reference but keep the item in the list
                    item.element = null;
                }
                // Update display to reflect the item is no longer actively showing
                this.updateActiveItemsDisplay();
            }
        }
    }

    showSettingsModal() {
        if (this.settingsModal) {
            this.settingsModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    hideSettingsModal() {
        if (this.settingsModal) {
            this.settingsModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    showInfoModal() {
        this.app.infoModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    hideInfoModal() {
        this.app.infoModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    toggleFullscreen() {
        const fullscreenEnabled = document.fullscreenEnabled || 
                                 document.webkitFullscreenEnabled || 
                                 document.mozFullScreenEnabled ||
                                 document.msFullscreenEnabled;
        
        if (!fullscreenEnabled) {
            console.warn('Fullscreen not supported in this browser');
            return;
        }

        if (!document.fullscreenElement && 
            !document.webkitFullscreenElement && 
            !document.mozFullScreenElement &&
            !document.msFullscreenElement) {
            const element = document.documentElement;
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
    
    handleResize() {
        if (window.innerWidth <= 768 && !this.panelCollapsed) {
            this.togglePanel();
        } else if (window.innerWidth > 768 && this.panelCollapsed) {
            this.togglePanel();
        }
    }
}