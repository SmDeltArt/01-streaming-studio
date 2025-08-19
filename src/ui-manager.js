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
        this.initializeAISettingsControls();
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
                'voice': '🎙️',
                'vignette': '📝',
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
    // <-- add this line
    this.loadAISettingsIntoUI?.();

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
    initializeAISettingsControls() {
  // Inputs (create these IDs in your settingsModal HTML if not present)
  const $ = (id) => document.getElementById(id);

  this.imgPref = $('imgPref');
  this.txtPref = $('txtPref');

  this.keyInputs = [
    'OPENAI_API_KEY','XAI_API_KEY','FAL_API_KEY',
    'GROQ_API_KEY','COHERE_API_KEY','TOGETHER_API_KEY'
  ].reduce((m,k)=> (m[k]=$(`${k}`), m), {});

  this.pollinationsCrop = $('POLLINATIONS_CROP');
  this.imgAllowAlpha    = $('IMG_ALLOW_TRANSPARENCY');

  this.settingsSaveBtn   = $('settingsSave');
  this.settingsExportBtn = $('settingsExport');
  this.settingsImportBtn = $('settingsImport');

  // Load current values into the UI
  this.loadAISettingsIntoUI();

  // Bind
  this.settingsSaveBtn?.addEventListener('click', () => this.saveAISettings(true));
  this.settingsExportBtn?.addEventListener('click', () => this.exportAISettings());
  this.settingsImportBtn?.addEventListener('click', () => this.importAISettings());
  this.imgPref?.addEventListener('change', () => this.updateAPIKeyVisibility());
  this.txtPref?.addEventListener('change', () => this.updateAPIKeyVisibility());
  // Reflect changes live (optional)
  this.imgPref?.addEventListener('change', () => this.saveAISettings(false));
  this.txtPref?.addEventListener('change', () => this.saveAISettings(false));
}

loadAISettingsIntoUI() {
  const get = (k, d='') => localStorage.getItem(k) ?? d;

  if (this.imgPref) this.imgPref.value = get('IMG_AI_PREF','auto');
  if (this.txtPref) this.txtPref.value = get('TXT_AI_PREF','auto');

  Object.entries(this.keyInputs || {}).forEach(([k, el]) => {
    if (el) el.value = get(k,'');
  });

  if (this.pollinationsCrop) this.pollinationsCrop.value = get('POLLINATIONS_CROP','24');
  if (this.imgAllowAlpha)   this.imgAllowAlpha.checked = get('IMG_ALLOW_TRANSPARENCY','1') === '1';
  this.updateAPIKeyVisibility?.();
}
updateAPIKeyVisibility() {
  const imgSel = (this.imgPref?.value || 'auto').toLowerCase();
  const txtSel = (this.txtPref?.value || 'auto').toLowerCase();

  const map = {
    OPENAI_API_KEY:  { scope: 'img', prov: 'openai' },
    XAI_API_KEY:     { scope: 'img', prov: 'xai' },
    FAL_API_KEY:     { scope: 'img', prov: 'fal' },
    GROQ_API_KEY:    { scope: 'txt', prov: 'groq' },
    COHERE_API_KEY:  { scope: 'txt', prov: 'cohere' },
    TOGETHER_API_KEY:{ scope: 'txt', prov: 'together' }
  };

  // You already built this.keyInputs = { OPENAI_API_KEY: <el>, ... }
  for (const [id, el] of Object.entries(this.keyInputs || {})) {
    if (!el) continue;
    const info = map[id];
    if (!info) continue;

    const shouldShow =
      (info.scope === 'img' && imgSel === info.prov) ||
      (info.scope === 'txt' && txtSel === info.prov);

    // prefer the wrapper row if present
    const row = document.getElementById(`row-${id}`) || el.closest('.api-key-row') || el;
    row.style.display = shouldShow ? '' : 'none';
  }
}

saveAISettings(showToast) {
  const put = (k,v) => (v && v.length) ? localStorage.setItem(k, v) : localStorage.removeItem(k);

  if (this.imgPref) put('IMG_AI_PREF', this.imgPref.value);
  if (this.txtPref) put('TXT_AI_PREF', this.txtPref.value);

  Object.entries(this.keyInputs || {}).forEach(([k, el]) => {
    if (el) put(k, (el.value || '').trim());
  });

  if (this.pollinationsCrop) put('POLLINATIONS_CROP', String(Math.max(0, parseInt(this.pollinationsCrop.value||'24',10))));
  if (this.imgAllowAlpha)    put('IMG_ALLOW_TRANSPARENCY', this.imgAllowAlpha.checked ? '1' : '0');

  // Let other modules react
  window.dispatchEvent(new CustomEvent('settings:updated', {
    detail: {
      IMG_AI_PREF: localStorage.getItem('IMG_AI_PREF'),
      TXT_AI_PREF: localStorage.getItem('TXT_AI_PREF')
    }
  }));

  if (showToast) alert('Settings saved.');
}

exportAISettings() {
  const keys = [
    'IMG_AI_PREF','TXT_AI_PREF','POLLINATIONS_CROP','IMG_ALLOW_TRANSPARENCY',
    'OPENAI_API_KEY','XAI_API_KEY','FAL_API_KEY','GROQ_API_KEY','COHERE_API_KEY','TOGETHER_API_KEY'
  ];
  const obj = keys.reduce((m,k)=> (m[k]=localStorage.getItem(k)||'', m), {});
  const blob = new Blob([JSON.stringify(obj,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'streaming-studio-settings.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 800);
}

importAISettings() {
  const inp = document.createElement('input');
  inp.type='file'; inp.accept='application/json';
  inp.onchange = async () => {
    const f = inp.files?.[0]; if (!f) return;
    const text = await f.text().catch(()=>null); if (!text) return;
    try {
      const j = JSON.parse(text);
      Object.entries(j).forEach(([k,v]) => { if (typeof v === 'string') localStorage.setItem(k,v); });
      this.loadAISettingsIntoUI();
      window.dispatchEvent(new CustomEvent('settings:updated', { detail: j }));
      alert('Settings imported.');
    } catch { alert('Invalid settings file'); }
  };
  inp.click();
}

    handleResize() {
        if (window.innerWidth <= 768 && !this.panelCollapsed) {
            this.togglePanel();
        } else if (window.innerWidth > 768 && this.panelCollapsed) {
            this.togglePanel();
        }
    }
}