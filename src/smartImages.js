export default class SmartImagesAI {
    constructor(imageDisplayManager) {
        this.imageDisplayManager = imageDisplayManager;
        this.currentGeneratedImage = null;
        this.isGenerating = false;
        this.generationHistory = [];
        this.supportedAnimatedFormats = ['gif', 'webp'];
        this.maxAnimationDuration = 10;
        this.defaultAnimationDuration = 2;
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
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
    }
    
    bindEvents() {
        if (this.aiGenerateBtn) {
            this.aiGenerateBtn.addEventListener('click', () => this.toggleAIGenerator());
        }
        
        document.querySelectorAll('.ai-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const effect = e.target.getAttribute('data-effect');
                if (effect) {
                    this.selectAIPreset(effect);
                }
            });
        });
        
        if (this.aiAnimationType) {
            this.aiAnimationType.addEventListener('change', () => this.updateAnimationSettings());
        }
        
        if (this.aiAnimationDuration && this.animationDurationValue) {
            this.aiAnimationDuration.addEventListener('input', () => {
                this.animationDurationValue.textContent = this.aiAnimationDuration.value + 's';
            });
        }
        
        if (this.generateImageBtn) {
            this.generateImageBtn.addEventListener('click', () => this.generateAIImage());
        }
        if (this.regenerateBtn) {
            this.regenerateBtn.addEventListener('click', () => this.regenerateAIImage());
        }
        if (this.saveGeneratedBtn) {
            this.saveGeneratedBtn.addEventListener('click', () => this.saveGeneratedImage());
        }
    }
    
    toggleAIGenerator() {
        const isVisible = this.aiGeneratorSection.style.display !== 'none';
        if (isVisible) {
            this.aiGeneratorSection.style.display = 'none';
            this.aiGenerateBtn.textContent = '✨ AI Generate';
        } else {
            this.aiGeneratorSection.style.display = 'block';
            this.aiGenerateBtn.textContent = '✨ Hide AI';
            this.updateAnimationSettings();
        }
    }
    
    getSmartEffectSettings(effect) {
        const smartEffects = {
            explosion: {
                colors: ['#FF6B35', '#F7931E', '#FFD23F'],
                glowIntensity: 25,
                transitions: ['burst', 'radial-expand'],
                particles: 15,
                brightness: 1.3,
                contrast: 1.2,
                animationStyle: 'explosive'
            },
            boom: {
                colors: ['#E63946', '#F1FAEE', '#A8DADC'],
                glowIntensity: 30,
                transitions: ['shockwave', 'impact'],
                particles: 8,
                brightness: 1.4,
                contrast: 1.5,
                animationStyle: 'impact'
            },
            sparkle: {
                colors: ['#FFD700', '#FFF8DC', '#FFFACD'],
                glowIntensity: 20,
                transitions: ['twinkle', 'shimmer'],
                particles: 25,
                brightness: 1.2,
                contrast: 1.1,
                animationStyle: 'sparkly'
            },
            fire: {
                colors: ['#FF4500', '#FF6347', '#FF8C00'],
                glowIntensity: 35,
                transitions: ['flame-flicker', 'heat-wave'],
                particles: 12,
                brightness: 1.5,
                contrast: 1.3,
                animationStyle: 'flickering'
            },
            lightning: {
                colors: ['#00BFFF', '#87CEEB', '#E0FFFF'],
                glowIntensity: 40,
                transitions: ['electric-arc', 'energy-pulse'],
                particles: 6,
                brightness: 1.8,
                contrast: 2.0,
                animationStyle: 'electric'
            },
            smoke: {
                colors: ['#708090', '#B0C4DE', '#D3D3D3'],
                glowIntensity: 15,
                transitions: ['drift', 'dissolve'],
                particles: 20,
                brightness: 0.9,
                contrast: 0.8,
                animationStyle: 'flowing'
            },
            confetti: {
                colors: ['#FF69B4', '#00CED1', '#32CD32', '#FFD700'],
                glowIntensity: 22,
                transitions: ['cascade', 'scatter'],
                particles: 30,
                brightness: 1.3,
                contrast: 1.2,
                animationStyle: 'celebratory'
            },
            hearts: {
                colors: ['#FF69B4', '#FFB6C1', '#FFC0CB'],
                glowIntensity: 18,
                transitions: ['float-up', 'gentle-pulse'],
                particles: 12,
                brightness: 1.1,
                contrast: 1.0,
                animationStyle: 'romantic'
            }
        };
        
        return smartEffects[effect] || smartEffects.explosion;
    }
    
    selectAIPreset(effect) {
        document.querySelectorAll('.ai-preset-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        const smartEffects = this.getSmartEffectSettings(effect);
        const effectPrompts = {
            explosion: `Dynamic cartoon explosion with bright flames and energy bursts, ${smartEffects.colors.join(' and ')} colors, explosive radial pattern, transparent background, perfect for streaming overlays`,
            boom: `Bold comic book 'BOOM' text effect with shockwave impact, ${smartEffects.colors.join(' and ')} color scheme, 3D style lettering with dramatic lighting, transparent background`,
            sparkle: `Magical sparkles and glitter particles, ${smartEffects.colors.join(' and ')} twinkling effects, shimmering golden stars, transparent background, streaming overlay ready`,
            fire: `Animated flame effect with flickering tongues, ${smartEffects.colors.join(' and ')} fire colors, realistic heat distortion, transparent background, looping animation suitable for streaming`,
            lightning: `Electric lightning bolt effect with energy arcs, ${smartEffects.colors.join(' and ')} electricity colors, crackling plasma energy, transparent background, dramatic streaming overlay`,
            smoke: `Wispy smoke cloud effect with flowing movement, ${smartEffects.colors.join(' and ')} vapor tones, transparent background, perfect for atmospheric streaming moments`,
            confetti: `Colorful confetti celebration effect with cascading particles, ${smartEffects.colors.join(' and ')} rainbow colors, transparent background, party streaming overlay`,
            hearts: `Floating heart particles with gentle movement, ${smartEffects.colors.join(' and ')} romantic colors, love-themed effect, transparent background, streaming overlay`
        };
        
        this.aiCustomPrompt.value = effectPrompts[effect] || '';
        
        const effectSettings = {
            explosion: { animation: 'animated', style: 'cartoon', duration: '1.5' },
            boom: { animation: 'static', style: 'cartoon', duration: '2' },
            sparkle: { animation: 'animated', style: 'minimal', duration: '3' },
            fire: { animation: 'animated', style: 'realistic', duration: '2' },
            lightning: { animation: 'animated', style: 'realistic', duration: '1' },
            smoke: { animation: 'animated', style: 'realistic', duration: '4' },
            confetti: { animation: 'animated', style: 'cartoon', duration: '2.5' },
            hearts: { animation: 'animated', style: 'minimal', duration: '3' }
        };
        
        const settings = effectSettings[effect];
        if (settings) {
            this.aiAnimationType.value = settings.animation;
            this.aiStyle.value = settings.style;
            this.aiAnimationDuration.value = settings.duration;
            this.animationDurationValue.textContent = settings.duration + 's';
            this.updateAnimationSettings();
            
            const animationMappings = {
                explosion: 'zoom-in',
                boom: 'bounce',
                sparkle: 'pulse',
                fire: 'fade',
                lightning: 'fade',
                smoke: 'slide-up',
                confetti: 'slide-down',
                hearts: 'fade'
            };
            
            const imageAnimation = document.getElementById('imageAnimation');
            if (imageAnimation && animationMappings[effect]) {
                imageAnimation.value = animationMappings[effect];
            }
        }
        
        this.applySmartEffectsToUI(effect, smartEffects);
    }

    applySmartEffectsToUI(effect, smartEffects) {
        const aiSection = document.getElementById('aiGeneratorSection');
        if (!aiSection) return;
        
        const primaryColor = smartEffects.colors[0];
        const secondaryColor = smartEffects.colors[1] || smartEffects.colors[0];
        
        aiSection.style.transition = 'all 0.3s ease';
        aiSection.style.borderLeftColor = primaryColor;
        aiSection.style.boxShadow = `0 0 ${smartEffects.glowIntensity}px ${primaryColor}20`;
        
        const activeBtn = document.querySelector('.ai-preset-btn.active');
        if (activeBtn) {
            activeBtn.style.background = `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}40)`;
            activeBtn.style.borderColor = primaryColor;
            activeBtn.style.boxShadow = `0 0 ${smartEffects.glowIntensity * 0.5}px ${primaryColor}60`;
            activeBtn.style.transform = 'scale(1.05)';
        }
        
        this.currentEffectSettings = smartEffects;
    }
    
    async stripBottomWatermark(dataUrl, cropPx = 24) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const h = Math.max(1, img.height - cropPx);
                const c = document.createElement('canvas');
                c.width = img.width;
                c.height = h;
                const ctx = c.getContext('2d');
                ctx.drawImage(img, 0, 0, img.width, h, 0, 0, c.width, c.height);
                resolve(c.toDataURL('image/png'));
            };
            img.onerror = () => reject(new Error('watermark strip failed'));
            img.src = dataUrl;
        });
    }

    updateAnimationSettings() {
        const isAnimated = this.aiAnimationType.value !== 'static';
        this.animationDurationRow.style.display = isAnimated ? 'flex' : 'none';
        
        if (isAnimated && parseInt(this.aiImageSize.value.split('x')[0]) > 512) {
            this.aiImageSize.value = '512x512';
        }
        
        const animationLabel = this.aiAnimationType.parentElement.querySelector('label');
        if (animationLabel) {
            if (isAnimated) {
                animationLabel.style.color = '#FF9500';
                animationLabel.style.fontWeight = 'bold';
            } else {
                animationLabel.style.color = '';
                animationLabel.style.fontWeight = '';
            }
        }
    }
    
    async generateAIImage() {
        if (this.isGenerating) return;
        
        const prompt = this.aiCustomPrompt.value.trim();
        if (!prompt) {
            alert('Please enter a prompt or select a preset effect');
            return;
        }
        
        this.isGenerating = true;
        this.showGenerationStatus(true);
        this.generateImageBtn.disabled = true;
        
        try {
            const generationParams = {
                prompt: prompt,
                style: this.aiStyle.value,
                size: this.aiImageSize.value,
                animationType: this.aiAnimationType.value,
                duration: parseFloat(this.aiAnimationDuration.value),
                transparency: this.aiTransparency.checked,
                enhanceForStreaming: true,
                qualityLevel: 'high',
                optimizeForOverlay: true,
                removeAllFrames: this.aiTransparency.checked
            };
            
            const generatedImage = await this.callAIGenerationAPI(generationParams);
            
            this.currentGeneratedImage = generatedImage;
            this.generationHistory.push(generatedImage);
            
            this.imageDisplayManager.currentImageData = {
                type: generatedImage.format === 'gif' ? 'image/gif' : 
                      generatedImage.format === 'webp' ? 'image/webp' : 'image/png',
                data: generatedImage.dataUrl,
                name: `ai_${generationParams.style}_${Date.now()}.${generatedImage.format}`,
                size: generatedImage.estimatedSize || 0,
                isAIGenerated: true,
                isAnimated: this.supportedAnimatedFormats.includes(generatedImage.format),
                generationParams: generationParams,
                hasTransparency: this.aiTransparency.checked,
                removeFrames: this.aiTransparency.checked
            };
            
            this.imageDisplayManager.updateImagePreview();
            
            this.regenerateBtn.style.display = 'inline-block';
            this.saveGeneratedBtn.style.display = 'inline-block';
            
        } catch (error) {
            alert('Failed to generate image: ' + error.message);
        } finally {
            this.isGenerating = false;
            this.showGenerationStatus(false);
            this.generateImageBtn.disabled = false;
        }
    }
    
    // REPLACE the whole function
async callAIGenerationAPI(params) {
  const maxGenerationTime = 30000;

  // 1) User-keyed providers FIRST (respect Settings)
  const pref = (localStorage.getItem('IMG_AI_PREF') || 'auto').toLowerCase();
  const orderMap = {
    kimi: ['kimi', 'openai', 'xai', 'fal'],
    openai: ['openai', 'xai', 'fal', 'kimi'],
    xai: ['xai', 'openai', 'fal', 'kimi'],
    fal: ['fal', 'openai', 'xai', 'kimi'],
    pollinations: [], // Skip user APIs if user specifically wants pollinations
    auto: ['openai', 'xai', 'fal', 'kimi']
  };
  const userAPIOrder = orderMap[pref] || orderMap.auto;

  const keys = {
    OPENAI_API_KEY: localStorage.getItem('OPENAI_API_KEY') || '',
    XAI_API_KEY:    localStorage.getItem('XAI_API_KEY')    || '',
    KIMI_API_KEY:   localStorage.getItem('KIMI_API_KEY')   || '',
    FAL_API_KEY:    localStorage.getItem('FAL_API_KEY')    || ''
  };

  console.log('Available API keys:', {
    hasOpenAI: !!keys.OPENAI_API_KEY,
    hasXAI: !!keys.XAI_API_KEY,
    hasKimi: !!keys.KIMI_API_KEY,
    hasFAL: !!keys.FAL_API_KEY,
    preference: pref
  });

  // Try user APIs first if keys are available
  for (const prov of userAPIOrder) {
    try {
      if (prov === 'kimi' && keys.KIMI_API_KEY) {
        console.log('Trying Kimi 2 with user key...');
        return await this.callKimiImages(params, keys.KIMI_API_KEY);
      }
      if (prov === 'openai' && keys.OPENAI_API_KEY) {
        console.log('Trying OpenAI DALL-E with user key...');
        return await this.callOpenAIImages(params, keys.OPENAI_API_KEY);
      }
      if (prov === 'xai' && keys.XAI_API_KEY) {
        console.log('Trying xAI Grok with user key...');
        return await this.callXAIImages(params, keys.XAI_API_KEY);
      }
      if (prov === 'fal' && keys.FAL_API_KEY) {
        console.log('Trying FAL with user key...');
        return await this.callFalFluxImages(params, keys.FAL_API_KEY);
      }
    } catch (e) {
      console.warn(`[Images] User API ${prov} failed:`, e?.message || e);
      // try next user API
    }
  }

  // 2) WebSim AI as fallback 
  try {
    if (window.websim?.imageGen) {
      console.log('Trying WebSim AI Image Generator...');
      const webSimParams = {
        prompt: params.prompt,
        width: parseInt(params.size.split('x')[0], 10),
        height: parseInt(params.size.split('x')[1], 10),
        transparent: !!params.transparency
      };
      if (params.animationType !== 'static') {
        webSimParams.animated = true;
        webSimParams.format = params.animationType;
        webSimParams.duration = params.duration;
      }
      const result = await Promise.race([
        window.websim.imageGen(webSimParams),
        new Promise((_,rej)=>setTimeout(()=>rej(new Error('Generation timeout')), maxGenerationTime))
      ]);
      if (result?.url) {
        const format = params.animationType === 'static' ? 'png' : params.animationType;
        return {
          dataUrl: result.url,
          format,
          estimatedSize: result.size || 0,
          isAnimated: this.supportedAnimatedFormats.includes(format),
          duration: params.animationType !== 'static' ? params.duration : 0,
          metadata: result.metadata || { source: 'WebSim' }
        };
      }
    }
  } catch (e) {
    console.warn('[Images] WebSim imageGen failed:', e?.message || e);
  }

  // 3) Pollinations as final fallback
  try {
    console.log('Trying Pollinations AI as fallback...');
    return await this.callPollinations(params);
  } catch (e) {
    console.warn('[Images] Pollinations failed:', e?.message || e);
  }

  // 4) Offline canvas fallback
  console.log('All AI services failed, using offline generation...');
  return await this.generateEnhancedFallbackImage(params);
}

  // OpenAI DALL-E API Implementation
  async callOpenAIImages(params, apiKey) {
    if (!apiKey) throw new Error('OpenAI API key not provided');
    
    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
      throw new Error('OpenAI API key must start with "sk-"');
    }
    
    console.log('OpenAI API Key format check: ✓ Valid');
    console.log('Requested size:', params.size);
    
    const [width, height] = params.size.split('x').map(Number);
    
    // DALL-E 3 only supports specific sizes
    let dalleSize = "1024x1024"; // default
    
    if (width > height) {
      dalleSize = "1792x1024"; // landscape
    } else if (height > width) {
      dalleSize = "1024x1792"; // portrait
    } else {
      dalleSize = "1024x1024"; // square
    }
    
    const requestBody = {
      model: "dall-e-3",
      prompt: this.enhancePromptForAPI(params.prompt, params.style),
      size: dalleSize,
      quality: "standard",
      n: 1
    };

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error('OpenAI API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData,
        requestBody: requestBody
      });
      throw new Error(`OpenAI API failed: ${response.status} - ${errorMessage}`);
    }

    const data = await response.json();
    
    if (data.data && data.data[0] && data.data[0].url) {
      try {
        // Try to convert remote URL to data URL for local processing
        const imageResponse = await fetch(data.data[0].url, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'image/*'
          }
        });
        const blob = await imageResponse.blob();
        const dataUrl = await this.blobToDataUrl(blob);
        
        return {
          dataUrl: dataUrl,
          format: 'png',
          estimatedSize: blob.size,
          isAnimated: false,
          duration: 0,
          metadata: { source: 'OpenAI DALL-E', revised_prompt: data.data[0].revised_prompt }
        };
      } catch (corsError) {
        console.log('🚨 CORS issue with OpenAI image, using direct URL approach...');
        // Fallback: return the URL directly for display
        return {
          dataUrl: data.data[0].url,
          format: 'png',
          estimatedSize: 'unknown',
          isAnimated: false,
          duration: 0,
          metadata: { source: 'OpenAI DALL-E', revised_prompt: data.data[0].revised_prompt, directUrl: true }
        };
      }
    }
    
    throw new Error('No image URL received from OpenAI');
  }

  // xAI Grok API Implementation  
  async callXAIImages(params, apiKey) {
    if (!apiKey) throw new Error('xAI API key not provided');
    
    const requestBody = {
      model: "grok-vision-beta", // or whatever xAI's image generation model is called
      prompt: this.enhancePromptForAPI(params.prompt, params.style),
      width: parseInt(params.size.split('x')[0]),
      height: parseInt(params.size.split('x')[1]),
      num_inference_steps: 30,
      guidance_scale: 7.5
    };

    const response = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST', 
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`xAI API failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (data.data && data.data[0] && data.data[0].url) {
      // Convert remote URL to data URL
      const imageResponse = await fetch(data.data[0].url);
      const blob = await imageResponse.blob();
      const dataUrl = await this.blobToDataUrl(blob);
      
      return {
        dataUrl: dataUrl,
        format: 'png',
        estimatedSize: blob.size,
        isAnimated: false, 
        duration: 0,
        metadata: { source: 'xAI Grok' }
      };
    }
    
    throw new Error('No image URL received from xAI');
  }

  // Pollinations AI Implementation (Free fallback)
  async callPollinations(params) {
    console.log('🌸 Calling Pollinations API with params:', params);
    
    const [width, height] = params.size.split('x').map(Number);
    
    // Pollinations uses a simple URL structure
    const enhancedPrompt = this.enhancePromptForAPI(params.prompt, params.style);
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    
    // Construct the Pollinations URL
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&private=true&enhance=true`;
    
    console.log('🌸 Pollinations URL:', pollinationsUrl);
    
    try {
      const response = await fetch(pollinationsUrl);
      
      if (!response.ok) {
        throw new Error(`Pollinations API failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      const dataUrl = await this.blobToDataUrl(blob);
      
      return {
        dataUrl: dataUrl,
        format: 'png',
        estimatedSize: blob.size,
        isAnimated: false,
        duration: 0,
        metadata: { source: 'Pollinations AI' }
      };
    } catch (error) {
      throw new Error(`Pollinations generation failed: ${error.message}`);
    }
  }

  // FAL.ai Flux API Implementation
  async callFalFluxImages(params, apiKey) {
    if (!apiKey) throw new Error('FAL API key not provided');
    
    const [width, height] = params.size.split('x').map(Number);
    
    const requestBody = {
      prompt: this.enhancePromptForAPI(params.prompt, params.style),
      image_size: {
        width: width,
        height: height
      },
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: true
    };

    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`FAL API failed: ${response.status} - ${errorData.detail || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (data.images && data.images[0] && data.images[0].url) {
      // Convert remote URL to data URL
      const imageResponse = await fetch(data.images[0].url);
      const blob = await imageResponse.blob();
      const dataUrl = await this.blobToDataUrl(blob);
      
      return {
        dataUrl: dataUrl,
        format: 'png',
        estimatedSize: blob.size,
        isAnimated: false,
        duration: 0,
        metadata: { source: 'FAL.ai Flux' }
      };
    }
    
    throw new Error('No image URL received from FAL.ai');
  }

  // Kimi 2 by Moonshot AI Implementation (Chinese AI)
  async callKimiImages(params, apiKey) {
    if (!apiKey) throw new Error('Kimi API key not provided');
    
    const [width, height] = params.size.split('x').map(Number);
    
    const requestBody = {
      model: "moonshot-v1-vision",
      prompt: this.enhancePromptForAPI(params.prompt, params.style),
      size: `${width}x${height}`,
      quality: "standard",
      n: 1
    };

    const response = await fetch('https://api.moonshot.cn/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Kimi 2 API failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (data.data && data.data[0] && data.data[0].url) {
      // Convert remote URL to data URL
      const imageResponse = await fetch(data.data[0].url);
      const blob = await imageResponse.blob();
      const dataUrl = await this.blobToDataUrl(blob);
      
      return {
        dataUrl: dataUrl,
        format: 'png',
        estimatedSize: blob.size,
        isAnimated: false,
        duration: 0,
        metadata: { source: 'Kimi 2 by Moonshot AI' }
      };
    }
    
    throw new Error('No image URL received from Kimi 2');
  }

    
  
    
    async blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
            reader.readAsDataURL(blob);
        });
    }
    
    enhancePromptForAPI(originalPrompt, style) {
        const styleEnhancements = {
            cartoon: ', cartoon style, vibrant colors, clean lines, digital art',
            realistic: ', photorealistic, high quality, detailed, professional photography',
            neon: ', neon lighting, cyberpunk style, glowing effects, dark background',
            minimal: ', minimalist design, clean, simple, modern',
            glitch: ', glitch art effect, digital distortion, cyberpunk',
            retro: ', retro style, vintage gaming, pixel art inspired'
        };
        
        const styleEnhancement = styleEnhancements[style] || styleEnhancements.cartoon;
        const streamingOptimizations = ', perfect for streaming overlay, transparent background compatible, high contrast, eye-catching';
        
        return originalPrompt + styleEnhancement + streamingOptimizations;
    }
    
    async generateEnhancedFallbackImage(params) {
        const simulationDelay = 2000;
        await new Promise(resolve => setTimeout(resolve, simulationDelay));
        
        const [width, height] = params.size.split('x').map(Number);
        const isAnimated = params.animationType !== 'static';
        
        if (isAnimated) {
            return await this.createAnimatedFallback(params, width, height);
        } else {
            return await this.createStaticFallback(params, width, height);
        }
    }
    
    async createAnimatedFallback(params, width, height) {
        const frameCount = Math.min(10, Math.max(4, Math.floor(params.duration * 4)));
        const frameDelay = Math.floor((params.duration * 1000) / frameCount);
        const frames = [];
        for (let i = 0; i < frameCount; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            this.drawAnimatedFrame(ctx, width, height, params, i, frameCount);
            frames.push(canvas.toDataURL('image/png'));
        }
        const format = params.animationType === 'webp' ? 'webp' : 'gif';
        const firstFrameDataUrl = frames[0];
        
        return {
            dataUrl: firstFrameDataUrl,
            format: format,
            isAnimated: true,
            duration: params.duration,
            frameCount: frameCount,
            frameDelay: frameDelay,
            estimatedSize: firstFrameDataUrl.length * 0.75 * frameCount,
            metadata: { 
                fallbackGenerated: true,
                animationType: params.animationType,
                frames: frames.length
            }
        };
    }
    
    async createStaticFallback(params, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
        gradient.addColorStop(0, this.getEffectColor(params.style, 0.8));
        gradient.addColorStop(1, this.getEffectColor(params.style, 0.2));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        this.drawEffectElements(ctx, width, height, params);
        const dataUrl = canvas.toDataURL('image/png');
        
        return {
            dataUrl: dataUrl,
            format: 'png',
            isAnimated: false,
            duration: 0,
            estimatedSize: dataUrl.length * 0.75,
            metadata: { fallbackGenerated: true }
        };
    }
    
    drawAnimatedFrame(ctx, width, height, params, frameIndex, totalFrames) {
        const progress = frameIndex / totalFrames;
        const centerX = width / 2;
        const centerY = height / 2;
        const smartEffects = this.currentEffectSettings || this.getSmartEffectSettings('explosion');
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width / 2);
        const primaryColor = this.hexToRgba(smartEffects.colors[0], 0.8 * (0.5 + 0.5 * Math.sin(progress * Math.PI * 2)));
        const secondaryColor = this.hexToRgba(smartEffects.colors[1] || smartEffects.colors[0], 0.2);
        
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(1, secondaryColor);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        switch (smartEffects.animationStyle) {
            case 'explosive':
                this.drawExplosiveEffect(ctx, centerX, centerY, width * 0.4, progress, smartEffects);
                break;
            case 'impact':
                this.drawImpactEffect(ctx, centerX, centerY, width * 0.4, progress, smartEffects);
                break;
            case 'sparkly':
                this.drawSparklyEffect(ctx, width, height, progress, smartEffects);
                break;
            case 'flickering':
                this.drawFlickeringEffect(ctx, centerX, centerY, width * 0.4, progress, smartEffects);
                break;
            case 'electric':
                this.drawElectricEffect(ctx, centerX, centerY, width * 0.4, progress, smartEffects);
                break;
            case 'flowing':
                this.drawFlowingEffect(ctx, width, height, progress, smartEffects);
                break;
            case 'celebratory':
                this.drawCelebratoryEffect(ctx, width, height, progress, smartEffects);
                break;
            case 'romantic':
                this.drawRomanticEffect(ctx, width, height, progress, smartEffects);
                break;
            default:
                this.drawDefaultSmartEffect(ctx, centerX, centerY, width * 0.35, progress, smartEffects);
                break;
        }
    }

    drawExplosiveEffect(ctx, x, y, radius, progress, smartEffects) {
        ctx.save();
        const pulseRadius = radius * (0.6 + 0.8 * Math.sin(progress * Math.PI * 3));
        ctx.strokeStyle = smartEffects.colors[0];
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.shadowBlur = smartEffects.glowIntensity;
        ctx.shadowColor = smartEffects.colors[0];
        
        for (let i = 0; i < smartEffects.particles; i++) {
            const angle = (i * Math.PI * 2) / smartEffects.particles + progress * Math.PI * 0.8;
            const startRadius = pulseRadius * 0.2;
            const endRadius = pulseRadius * (0.9 + Math.random() * 0.6);
            
            ctx.globalAlpha = 0.8 + 0.2 * Math.sin(progress * Math.PI * 4);
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * startRadius, y + Math.sin(angle) * startRadius);
            ctx.lineTo(x + Math.cos(angle) * endRadius, y + Math.sin(angle) * endRadius);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawImpactEffect(ctx, x, y, radius, progress, smartEffects) {
        ctx.save();
        const shockwaveRadius = radius * progress * 2;
        ctx.strokeStyle = smartEffects.colors[0];
        ctx.lineWidth = 8 * (1 - progress);
        ctx.globalAlpha = 1 - progress;
        ctx.shadowBlur = smartEffects.glowIntensity;
        ctx.shadowColor = smartEffects.colors[0];
        
        ctx.beginPath();
        ctx.arc(x, y, shockwaveRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = smartEffects.colors[1] || smartEffects.colors[0];
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    drawSparklyEffect(ctx, width, height, progress, smartEffects) {
        ctx.save();
        
        for (let i = 0; i < smartEffects.particles; i++) {
            const angle = (i / smartEffects.particles) * Math.PI * 2 + progress * Math.PI * 2;
            const distance = 30 + 60 * Math.sin(progress * Math.PI * 2 + i * 0.3);
            const x = width / 2 + Math.cos(angle) * distance;
            const y = height / 2 + Math.sin(angle) * distance;
            const size = 2 + 4 * Math.sin(progress * Math.PI * 4 + i);
            
            ctx.fillStyle = smartEffects.colors[i % smartEffects.colors.length];
            ctx.shadowBlur = smartEffects.glowIntensity * 0.5;
            ctx.shadowColor = smartEffects.colors[i % smartEffects.colors.length];
            ctx.globalAlpha = 0.7 + 0.3 * Math.sin(progress * Math.PI * 2 + i * 0.1);
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawFlickeringEffect(ctx, x, y, radius, progress, smartEffects) {
        ctx.save();
        const flameHeight = radius * (1.2 + 0.3 * Math.sin(progress * Math.PI * 6));
        ctx.fillStyle = smartEffects.colors[0];
        ctx.shadowBlur = smartEffects.glowIntensity;
        ctx.shadowColor = smartEffects.colors[0];
        
        for (let i = 0; i < 3; i++) {
            const offsetX = (Math.random() - 0.5) * 10;
            const flameRadius = radius * (0.8 - i * 0.2);
            const flameY = y - i * 15;
            
            ctx.globalAlpha = 0.8 - i * 0.2;
            ctx.fillStyle = smartEffects.colors[i % smartEffects.colors.length];
            
            ctx.beginPath();
            ctx.ellipse(x + offsetX, flameY, flameRadius, flameHeight * (1 - i * 0.3), 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawElectricEffect(ctx, x, y, radius, progress, smartEffects) {
        ctx.save();
        ctx.strokeStyle = smartEffects.colors[0];
        ctx.lineWidth = 3;
        ctx.shadowBlur = smartEffects.glowIntensity;
        ctx.shadowColor = smartEffects.colors[0];
        
        for (let i = 0; i < smartEffects.particles; i++) {
            const startAngle = (i * Math.PI * 2) / smartEffects.particles;
            const endAngle = startAngle + Math.PI + progress * Math.PI * 2;
            
            ctx.globalAlpha = 0.6 + 0.4 * Math.sin(progress * Math.PI * 8 + i);
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(startAngle) * radius * 0.3, y + Math.sin(startAngle) * radius * 0.3);
            
            const segments = 5;
            for (let j = 1; j <= segments; j++) {
                const t = j / segments;
                const segmentAngle = startAngle + (endAngle - startAngle) * t;
                const zigzag = (Math.random() - 0.5) * 20;
                const segmentRadius = radius * (0.3 + t * 0.5);
                
                ctx.lineTo(
                    x + Math.cos(segmentAngle) * segmentRadius + zigzag,
                    y + Math.sin(segmentAngle) * segmentRadius + zigzag
                );
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    drawFlowingEffect(ctx, width, height, progress, smartEffects) {
        ctx.save();
        
        for (let i = 0; i < smartEffects.particles; i++) {
            const x = (i / smartEffects.particles) * width + progress * 50 - 25;
            const y = height * 0.7 - progress * height * 0.5 + Math.sin(progress * Math.PI * 2 + i) * 30;
            const size = 15 + 10 * Math.sin(progress * Math.PI + i * 0.5);
            
            ctx.fillStyle = smartEffects.colors[i % smartEffects.colors.length];
            ctx.globalAlpha = (0.6 - progress * 0.4) * (1 - i / smartEffects.particles);
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawCelebratoryEffect(ctx, width, height, progress, smartEffects) {
        ctx.save();
        
        for (let i = 0; i < smartEffects.particles; i++) {
            const x = (i / smartEffects.particles) * width + Math.sin(progress * Math.PI + i) * 20;
            const y = progress * height + Math.sin(progress * Math.PI * 2 + i * 0.3) * 30;
            const size = 3 + 2 * Math.sin(progress * Math.PI * 4 + i);
            const rotation = progress * Math.PI * 4 + i;
            
            ctx.fillStyle = smartEffects.colors[i % smartEffects.colors.length];
            ctx.globalAlpha = 0.8;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.fillRect(-size / 2, -size / 2, size, size * 2);
            ctx.restore();
        }
        ctx.restore();
    }

    drawRomanticEffect(ctx, width, height, progress, smartEffects) {
        ctx.save();
        
        for (let i = 0; i < smartEffects.particles; i++) {
            const x = width * 0.2 + (i / smartEffects.particles) * width * 0.6 + Math.sin(progress * Math.PI + i * 0.5) * 30;
            const y = height - progress * height * 0.8 + Math.sin(progress * Math.PI * 2 + i * 0.3) * 20;
            const size = 8 + 4 * Math.sin(progress * Math.PI * 3 + i);
            
            ctx.fillStyle = smartEffects.colors[i % smartEffects.colors.length];
            ctx.shadowBlur = smartEffects.glowIntensity * 0.7;
            ctx.shadowColor = smartEffects.colors[i % smartEffects.colors.length];
            ctx.globalAlpha = 0.7 + 0.3 * Math.sin(progress * Math.PI * 2 + i * 0.2);
            
            ctx.beginPath();
            ctx.moveTo(x, y + size / 4);
            ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
            ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size, x, y + size);
            ctx.bezierCurveTo(x, y + size, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
            ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
            ctx.fill();
        }
        ctx.restore();
    }

    drawDefaultSmartEffect(ctx, x, y, radius, progress, smartEffects) {
        ctx.save();
        const animatedRadius = radius * (0.7 + 0.3 * Math.sin(progress * Math.PI * 2));
        const rotation = progress * Math.PI * 4;
        
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.fillStyle = smartEffects.colors[0];
        ctx.shadowBlur = smartEffects.glowIntensity;
        ctx.shadowColor = smartEffects.colors[0];
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(progress * Math.PI * 3);
        
        ctx.beginPath();
        ctx.arc(0, 0, animatedRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    hexToRgba(hex, alpha) {
        if (!hex.startsWith('#')) return `rgba(255, 149, 0, ${alpha})`;
        
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
        if (!this.currentGeneratedImage || !this.imageDisplayManager.currentImageData) {
            alert('No generated image to save');
            return;
        }
        
        try {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const effect = document.querySelector('.ai-preset-btn.active')?.getAttribute('data-effect') || 'custom';
            const style = this.aiStyle.value;
            const format = this.aiAnimationType.value === 'static' ? 'png' : this.aiAnimationType.value;
            
            const filename = `streaming-effect-${effect}-${style}-${timestamp}.${format}`;
            const response = await fetch(this.imageDisplayManager.currentImageData.data);
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            setTimeout(() => URL.revokeObjectURL(link.href), 100);
        } catch (error) {
            alert('Failed to save image: ' + error.message);
        }
    }
    
    showGenerationStatus(show) {
        this.aiGenerationStatus.style.display = show ? 'block' : 'none';
        
        if (show) {
            const messages = [
                'Creating your streaming effect...',
                'Applying AI magic...',
                'Optimizing for streaming...',
                'Adding final touches...'
            ];
            
            let messageIndex = 0;
            const messageInterval = setInterval(() => {
                if (!this.isGenerating) {
                    clearInterval(messageInterval);
                    return;
                }
                
                const textElement = this.aiGenerationStatus.querySelector('.generation-text');
                if (textElement) {
                    textElement.textContent = messages[messageIndex % messages.length];
                    messageIndex++;
                }
            }, 2000);
        }
    }
}
