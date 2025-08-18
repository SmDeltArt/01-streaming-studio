export default class SmartImagesAI {
    constructor(imageDisplayManager) {
        this.imageDisplayManager = imageDisplayManager;
        /* @tweakable AI generation state management */
        this.currentGeneratedImage = null;
        this.isGenerating = false;
        this.generationHistory = [];
        
        /* @tweakable animated format support configuration */
        this.supportedAnimatedFormats = ['gif', 'webp'];
        this.maxAnimationDuration = 10; // seconds
        this.defaultAnimationDuration = 2; // seconds
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        // AI Generator elements
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
        /* @tweakable enhanced AI menu connectivity with proper event delegation */
        // Ensure AI Generate button is properly connected
        if (this.aiGenerateBtn) {
            this.aiGenerateBtn.addEventListener('click', () => this.toggleAIGenerator());
        }
        
        // Preset buttons with better error handling
        document.querySelectorAll('.ai-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const effect = e.target.getAttribute('data-effect');
                if (effect) {
                    this.selectAIPreset(effect);
                }
            });
        });
        
        // Animation type change with null safety
        if (this.aiAnimationType) {
            this.aiAnimationType.addEventListener('change', () => this.updateAnimationSettings());
        }
        
        // Duration slider with proper value updates
        if (this.aiAnimationDuration && this.animationDurationValue) {
            this.aiAnimationDuration.addEventListener('input', () => {
                this.animationDurationValue.textContent = this.aiAnimationDuration.value + 's';
            });
        }
        
        // Generation controls with enhanced connectivity
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
    
    /* @tweakable AI generator panel toggle functionality */
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
    
    /* @tweakable smart AI effects configuration for streaming presets */
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
    
    /* @tweakable enhanced preset selection with animation application */
    selectAIPreset(effect) {
        // Clear previous selection
        document.querySelectorAll('.ai-preset-btn').forEach(btn => btn.classList.remove('active'));
        
        // Mark current as active
        event.target.classList.add('active');
        
        /* @tweakable get smart effects settings for the selected preset */
        const smartEffects = this.getSmartEffectSettings(effect);
        
        /* @tweakable enhanced effect prompt templates with smart effects integration */
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
        
        /* @tweakable auto-select optimal settings with smart effects for each preset */
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
            
            /* @tweakable apply corresponding display animation to image animation selector */
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
            
            // Update the image animation selector to match the effect
            const imageAnimation = document.getElementById('imageAnimation');
            if (imageAnimation && animationMappings[effect]) {
                imageAnimation.value = animationMappings[effect];
                console.log(`Set image animation to: ${animationMappings[effect]} for effect: ${effect}`);
            }
        }
        
        /* @tweakable apply smart visual effects to the generator interface */
        this.applySmartEffectsToUI(effect, smartEffects);
    }

    /* @tweakable method to apply smart effects to the UI based on selected preset */
    applySmartEffectsToUI(effect, smartEffects) {
        const aiSection = document.getElementById('aiGeneratorSection');
        if (!aiSection) return;
        
        /* @tweakable dynamic UI color theming based on effect colors */
        const primaryColor = smartEffects.colors[0];
        const secondaryColor = smartEffects.colors[1] || smartEffects.colors[0];
        
        // Apply subtle color theme to the AI section
        aiSection.style.transition = 'all 0.3s ease';
        aiSection.style.borderLeftColor = primaryColor;
        aiSection.style.boxShadow = `0 0 ${smartEffects.glowIntensity}px ${primaryColor}20`;
        
        /* @tweakable animate the active preset button with effect-specific styling */
        const activeBtn = document.querySelector('.ai-preset-btn.active');
        if (activeBtn) {
            activeBtn.style.background = `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}40)`;
            activeBtn.style.borderColor = primaryColor;
            activeBtn.style.boxShadow = `0 0 ${smartEffects.glowIntensity * 0.5}px ${primaryColor}60`;
            activeBtn.style.transform = 'scale(1.05)';
        }
        
        /* @tweakable update generation status with effect-specific messaging */
        this.currentEffectSettings = smartEffects;
        
        console.log(`Applied smart effects for ${effect}: ${JSON.stringify(smartEffects)}`);
    }
    async stripBottomWatermark(dataUrl, cropPx = 24) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const h = Math.max(1, img.height - cropPx);
      const c = document.createElement('canvas');
      c.width = img.width; c.height = h;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, h, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('watermark strip failed'));
    img.src = dataUrl;
  });
}

    /* @tweakable enhanced animation settings for smart effects */
    updateAnimationSettings() {
        const isAnimated = this.aiAnimationType.value !== 'static';
        this.animationDurationRow.style.display = isAnimated ? 'flex' : 'none';
        
        // Update size recommendations for animations with smart effects
        if (isAnimated && parseInt(this.aiImageSize.value.split('x')[0]) > 512) {
            this.aiImageSize.value = '512x512';
            console.log('Reduced size for smart animated effects optimization');
        }
        
        /* @tweakable update UI styling based on animation selection */
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
    
    /* @tweakable AI image generation with streaming-optimized parameters */
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
            /* @tweakable AI generation parameters optimized for streaming effects */
            const generationParams = {
                prompt: prompt,
                style: this.aiStyle.value,
                size: this.aiImageSize.value,
                animationType: this.aiAnimationType.value,
                duration: parseFloat(this.aiAnimationDuration.value),
                transparency: this.aiTransparency.checked,
                /* @tweakable streaming-specific enhancement parameters */
                enhanceForStreaming: true,
                qualityLevel: 'high',
                optimizeForOverlay: true,
                /* @tweakable frame removal when transparency is enabled */
                removeAllFrames: this.aiTransparency.checked
            };
            
            // Generate the image/animation
            const generatedImage = await this.callAIGenerationAPI(generationParams);
            
            this.currentGeneratedImage = generatedImage;
            this.generationHistory.push(generatedImage);
            
            // Update current image data with generated result
            this.imageDisplayManager.currentImageData = {
                type: generatedImage.format === 'gif' ? 'image/gif' : 
                      generatedImage.format === 'webp' ? 'image/webp' : 'image/png',
                data: generatedImage.dataUrl,
                name: `ai_${generationParams.style}_${Date.now()}.${generatedImage.format}`,
                size: generatedImage.estimatedSize || 0,
                isAIGenerated: true,
                isAnimated: this.supportedAnimatedFormats.includes(generatedImage.format),
                generationParams: generationParams,
                /* @tweakable transparency flag for frame removal */
                hasTransparency: this.aiTransparency.checked,
                removeFrames: this.aiTransparency.checked
            };
            
            this.imageDisplayManager.updateImagePreview();
            
            // Show additional controls
            this.regenerateBtn.style.display = 'inline-block';
            this.saveGeneratedBtn.style.display = 'inline-block';
            
            console.log('AI image generated successfully');
            
        } catch (error) {
            console.error('AI generation error:', error);
            alert('Failed to generate image: ' + error.message);
        } finally {
            this.isGenerating = false;
            this.showGenerationStatus(false);
            this.generateImageBtn.disabled = false;
        }
    }
    
    /* @tweakable AI API integration with enhanced animated format support */
    async callAIGenerationAPI(params) {
        /* @tweakable API endpoint configuration for AI image generation */
        const aiAPIEndpoint = 'https://api.streaming-ai-generator.com/v1/generate';
        const fallbackToLocalGeneration = true;
        const maxGenerationTime = 30000; // 30 seconds timeout
        
        /* @tweakable external free AI API configuration with multiple fallback options */
        const externalAPIs = [
            {
                name: 'Hugging Face Inference API',
                endpoint: 'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
                apiKey: null, // Free tier available
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                maxRetries: 2
            },
            {
                name: 'Stability AI Free API',
                endpoint: 'https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image',
                apiKey: null, // Free tier available
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                maxRetries: 1
            },
            {
                name: 'Pollinations AI',
                endpoint: 'https://image.pollinations.ai/prompt/',
                method: 'GET',
                maxRetries: 3,
                directUrl: true
            }
        ];
        
        /* @tweakable external API timeout and retry configuration */
        const externalAPITimeout = 15000; // 15 seconds per API attempt
        const enableExternalFallback = true;
        
        try {
            // Try WebSim AI API first if available
            if (typeof window.websim !== 'undefined' && window.websim.imageGen) {
                console.log('Using WebSim AI Image Generator');
                
                /* @tweakable enhanced WebSim API call with animation support */
                const webSimParams = {
                    prompt: params.prompt,
                    width: parseInt(params.size.split('x')[0]),
                    height: parseInt(params.size.split('x')[1]),
                    transparent: params.transparency
                };
                
                // Add animation parameters if supported
                if (params.animationType !== 'static') {
                    webSimParams.animated = true;
                    webSimParams.format = params.animationType;
                    webSimParams.duration = params.duration;
                }
                
                const result = await Promise.race([
                    window.websim.imageGen(webSimParams),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Generation timeout')), maxGenerationTime)
                    )
                ]);
                
                if (result && result.url) {
                    /* @tweakable enhanced result processing for animated formats */
                    const format = params.animationType === 'static' ? 'png' : params.animationType;
                    return {
                        dataUrl: result.url,
                        format: format,
                        estimatedSize: result.size || 0,
                        isAnimated: this.supportedAnimatedFormats.includes(format),
                        duration: params.animationType !== 'static' ? params.duration : 0,
                        metadata: result.metadata || {}
                    };
                }
            }
            
            /* @tweakable external AI API integration with multiple fallback services */
            if (enableExternalFallback) {
                console.log('WebSim AI API unavailable, trying external APIs...');
                
                for (const api of externalAPIs) {
                    try {
                        console.log(`Attempting ${api.name}...`);
                        const externalResult = await this.tryExternalAPI(api, params, externalAPITimeout);
                        
                        if (externalResult) {
                            console.log(`Successfully generated image using ${api.name}`);
                            return externalResult;
                        }
                    } catch (apiError) {
                        console.warn(`${api.name} failed:`, apiError.message);
                        continue; // Try next API
                    }
                }
                
                console.log('All external APIs failed, falling back to local generation');
            }
            
            // Fallback to enhanced generation
            if (fallbackToLocalGeneration) {
                return await this.generateEnhancedFallbackImage(params);
            }
            
            throw new Error('No AI generation service available');
            
        } catch (error) {
            console.warn('AI API failed, using enhanced fallback:', error);
            
            if (fallbackToLocalGeneration) {
                return await this.generateEnhancedFallbackImage(params);
            }
            
            throw error;
        }
    }
    
    /* @tweakable external AI API integration method with proper error handling and format conversion */
    async tryExternalAPI(api, params, timeout) {
        try {
            let response;
            const [width, height] = params.size.split('x').map(Number);
            
            /* @tweakable API-specific parameter formatting and request construction */
            switch (api.name) {
                case 'Hugging Face Inference API':
                    const hfPayload = {
                        inputs: this.enhancePromptForAPI(params.prompt, params.style),
                        parameters: {
                            width: width,
                            height: height,
                            num_inference_steps: params.animationType === 'static' ? 50 : 30,
                            guidance_scale: 7.5
                        }
                    };
                    
                    response = await Promise.race([
                        fetch(api.endpoint, {
                            method: api.method,
                            headers: api.headers,
                            body: JSON.stringify(hfPayload)
                        }),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('API timeout')), timeout)
                        )
                    ]);
                    break;
                    
                case 'Stability AI Free API':
                    const stabilityPayload = {
                        text_prompts: [{
                            text: this.enhancePromptForAPI(params.prompt, params.style),
                            weight: 1
                        }],
                        cfg_scale: 7,
                        height: height,
                        width: width,
                        samples: 1,
                        steps: params.animationType === 'static' ? 50 : 30
                    };
                    
                    response = await Promise.race([
                        fetch(api.endpoint, {
                            method: api.method,
                            headers: api.headers,
                            body: JSON.stringify(stabilityPayload)
                        }),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('API timeout')), timeout)
                        )
                    ]);
                    break;
                    
                case 'Pollinations AI':
                    const pollinationsPrompt = encodeURIComponent(this.enhancePromptForAPI(params.prompt, params.style));
                    const pollinationsUrl = `${api.endpoint}${pollinationsPrompt}?width=${width}&height=${height}&seed=${Math.floor(Math.random() * 10000)}`;
                    
                    response = await Promise.race([
                        fetch(pollinationsUrl, { method: 'GET' }),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('API timeout')), timeout)
                        )
                    ]);
                    break;
                    
                default:
                    throw new Error(`Unknown API: ${api.name}`);
            }
            
            if (!response.ok) {
                throw new Error(`${api.name} API error: ${response.status} ${response.statusText}`);
            }
            
            /* @tweakable response processing for different API response formats */
            return await this.processExternalAPIResponse(response, api, params);
            
        } catch (error) {
            console.error(`Error with ${api.name}:`, error);
            throw error;
        }
    }
    
    /* @tweakable method to process external API responses and convert to standard format */
    async processExternalAPIResponse(response, api, params) {
        try {
            const format = params.animationType === 'static' ? 'png' : 'png'; // External APIs typically return PNG
            
            switch (api.name) {
                case 'Hugging Face Inference API':
                    const hfBlob = await response.blob();
                    const hfDataUrl = await this.blobToDataUrl(hfBlob);
                    
                    return {
                        dataUrl: hfDataUrl,
                        format: format,
                        estimatedSize: hfBlob.size,
                        isAnimated: false, // HF typically returns static images
                        duration: 0,
                        metadata: { source: 'Hugging Face', externalGenerated: true }
                    };
                    
                case 'Stability AI Free API':
                    const stabilityData = await response.json();
                    if (stabilityData.artifacts && stabilityData.artifacts[0]) {
                        const imageData = stabilityData.artifacts[0].base64;
                        const dataUrl = `data:image/png;base64,${imageData}`;
                        
                        return {
                            dataUrl: dataUrl,
                            format: format,
                            estimatedSize: imageData.length * 0.75,
                            isAnimated: false,
                            duration: 0,
                            metadata: { source: 'Stability AI', externalGenerated: true }
                        };
                    }
                    throw new Error('Invalid Stability AI response');
                    
                case 'Pollinations AI':
                    const pollinationsBlob = await response.blob();
const pollinationsDataUrl = await this.blobToDataUrl(pollinationsBlob);
const cropped = await this.stripBottomWatermark(pollinationsDataUrl,  Math.round((params.size.split('x')[1] || 512) * 0.08));

return {
  dataUrl: cropped,
  format: format,
  estimatedSize: pollinationsBlob.size,
  isAnimated: false,
  duration: 0,
  metadata: { source: 'Pollinations AI', externalGenerated: true, watermarkStripped: true }
};

                    
                default:
                    throw new Error(`Unknown API response format: ${api.name}`);
            }
            
        } catch (error) {
            console.error(`Error processing ${api.name} response:`, error);
            throw error;
        }
    }
    
    /* @tweakable utility method to convert blob to data URL */
    async blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
            reader.readAsDataURL(blob);
        });
    }
    
    /* @tweakable prompt enhancement for different AI APIs with style-specific optimizations */
    enhancePromptForAPI(originalPrompt, style) {
        /* @tweakable style-specific prompt enhancements for external APIs */
        const styleEnhancements = {
            cartoon: ', cartoon style, vibrant colors, clean lines, digital art',
            realistic: ', photorealistic, high quality, detailed, professional photography',
            neon: ', neon lighting, cyberpunk style, glowing effects, dark background',
            minimal: ', minimalist design, clean, simple, modern',
            glitch: ', glitch art effect, digital distortion, cyberpunk',
            retro: ', retro style, vintage gaming, pixel art inspired'
        };
        
        const styleEnhancement = styleEnhancements[style] || styleEnhancements.cartoon;
        
        /* @tweakable streaming-specific prompt optimizations */
        const streamingOptimizations = ', perfect for streaming overlay, transparent background compatible, high contrast, eye-catching';
        
        return originalPrompt + styleEnhancement + streamingOptimizations;
    }
    
    /* @tweakable enhanced fallback image generation with animation support */
    async generateEnhancedFallbackImage(params) {
        /* @tweakable fallback generation delay simulation */
        const simulationDelay = 2000;
        
        // Simulate generation time
        await new Promise(resolve => setTimeout(resolve, simulationDelay));
        
        const [width, height] = params.size.split('x').map(Number);
        const isAnimated = params.animationType !== 'static';
        
        if (isAnimated) {
            return await this.createAnimatedFallback(params, width, height);
        } else {
            return await this.createStaticFallback(params, width, height);
        }
    }
    
    /* @tweakable animated fallback creation with GIF/WebP simulation */
    async createAnimatedFallback(params, width, height) {
        /* @tweakable animation frame configuration */
        const frameCount = Math.min(10, Math.max(4, Math.floor(params.duration * 4))); // 4 FPS
        const frameDelay = Math.floor((params.duration * 1000) / frameCount);
        
        // Create multiple frames for animation
        const frames = [];
        for (let i = 0; i < frameCount; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            // Create animated frame
            this.drawAnimatedFrame(ctx, width, height, params, i, frameCount);
            frames.push(canvas.toDataURL('image/png'));
        }
        
        /* @tweakable animated format selection and processing */
        const format = params.animationType === 'webp' ? 'webp' : 'gif';
        
        // For fallback, we'll create a static representation of the first frame
        // In a real implementation, this would use libraries like gif.js or similar
        const firstFrameDataUrl = frames[0];
        
        return {
            dataUrl: firstFrameDataUrl,
            format: format,
            isAnimated: true,
            duration: params.duration,
            frameCount: frameCount,
            frameDelay: frameDelay,
            estimatedSize: firstFrameDataUrl.length * 0.75 * frameCount, // Rough estimate
            metadata: { 
                fallbackGenerated: true,
                animationType: params.animationType,
                frames: frames.length
            }
        };
    }
    
    /* @tweakable static fallback creation */
    async createStaticFallback(params, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Create gradient background
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
        gradient.addColorStop(0, this.getEffectColor(params.style, 0.8));
        gradient.addColorStop(1, this.getEffectColor(params.style, 0.2));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add effect-specific elements
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
    
    /* @tweakable enhanced animated frame drawing with smart effects integration */
    drawAnimatedFrame(ctx, width, height, params, frameIndex, totalFrames) {
        const progress = frameIndex / totalFrames;
        const centerX = width / 2;
        const centerY = height / 2;
        
        /* @tweakable get smart effects for current preset */
        const smartEffects = this.currentEffectSettings || this.getSmartEffectSettings('explosion');
        
        // Apply smart background with effect-specific colors
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width/2);
        const primaryColor = this.hexToRgba(smartEffects.colors[0], 0.8 * (0.5 + 0.5 * Math.sin(progress * Math.PI * 2)));
        const secondaryColor = this.hexToRgba(smartEffects.colors[1] || smartEffects.colors[0], 0.2);
        
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(1, secondaryColor);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        /* @tweakable apply smart effects based on animation style */
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

    /* @tweakable explosive effect with smart color and glow parameters */
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

    /* @tweakable impact effect with smart shockwave animation */
    drawImpactEffect(ctx, x, y, radius, progress, smartEffects) {
        ctx.save();
        const shockwaveRadius = radius * progress * 2;
        
        ctx.strokeStyle = smartEffects.colors[0];
        ctx.lineWidth = 8 * (1 - progress);
        ctx.globalAlpha = 1 - progress;
        ctx.shadowBlur = smartEffects.glowIntensity;
        ctx.shadowColor = smartEffects.colors[0];
        
        // Draw expanding shockwave
        ctx.beginPath();
        ctx.arc(x, y, shockwaveRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw impact center
        ctx.fillStyle = smartEffects.colors[1] || smartEffects.colors[0];
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    /* @tweakable sparkly effect with smart particle distribution */
    drawSparklyEffect(ctx, width, height, progress, smartEffects) {
        ctx.save();
        
        for (let i = 0; i < smartEffects.particles; i++) {
            const angle = (i / smartEffects.particles) * Math.PI * 2 + progress * Math.PI * 2;
            const distance = 30 + 60 * Math.sin(progress * Math.PI * 2 + i * 0.3);
            const x = width/2 + Math.cos(angle) * distance;
            const y = height/2 + Math.sin(angle) * distance;
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

    /* @tweakable flickering flame effect with smart heat distortion */
    drawFlickeringEffect(ctx, x, y, radius, progress, smartEffects) {
        ctx.save();
        const flameHeight = radius * (1.2 + 0.3 * Math.sin(progress * Math.PI * 6));
        
        ctx.fillStyle = smartEffects.colors[0];
        ctx.shadowBlur = smartEffects.glowIntensity;
        ctx.shadowColor = smartEffects.colors[0];
        
        // Draw flame body with flickering
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

    /* @tweakable electric effect with smart arc generation */
    drawElectricEffect(ctx, x, y, radius, progress, smartEffects) {
        ctx.save();
        ctx.strokeStyle = smartEffects.colors[0];
        ctx.lineWidth = 3;
        ctx.shadowBlur = smartEffects.glowIntensity;
        ctx.shadowColor = smartEffects.colors[0];
        
        // Draw electric arcs
        for (let i = 0; i < smartEffects.particles; i++) {
            const startAngle = (i * Math.PI * 2) / smartEffects.particles;
            const endAngle = startAngle + Math.PI + progress * Math.PI * 2;
            
            ctx.globalAlpha = 0.6 + 0.4 * Math.sin(progress * Math.PI * 8 + i);
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(startAngle) * radius * 0.3, y + Math.sin(startAngle) * radius * 0.3);
            
            // Create zigzag lightning pattern
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

    /* @tweakable flowing smoke effect with smart drift animation */
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

    /* @tweakable celebratory confetti effect with smart cascade animation */
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
            ctx.fillRect(-size/2, -size/2, size, size * 2);
            ctx.restore();
        }
        ctx.restore();
    }

    /* @tweakable romantic hearts effect with smart floating animation */
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
            
            // Draw heart shape
            ctx.beginPath();
            ctx.moveTo(x, y + size/4);
            ctx.bezierCurveTo(x, y, x - size/2, y, x - size/2, y + size/4);
            ctx.bezierCurveTo(x - size/2, y + size/2, x, y + size, x, y + size);
            ctx.bezierCurveTo(x, y + size, x + size/2, y + size/2, x + size/2, y + size/4);
            ctx.bezierCurveTo(x + size/2, y, x, y, x, y + size/4);
            ctx.fill();
        }
        ctx.restore();
    }

    /* @tweakable default smart effect with adaptive parameters */
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

    /* @tweakable utility method to convert hex colors to rgba with alpha */
    hexToRgba(hex, alpha) {
        if (!hex.startsWith('#')) return `rgba(255, 149, 0, ${alpha})`;
        
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    /* @tweakable animated effect drawing methods */
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
    
    /* @tweakable color schemes for different effect styles */
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
    
    /* @tweakable regeneration with variation parameters */
    async regenerateAIImage() {
        if (!this.currentGeneratedImage || this.isGenerating) return;
        
        // Add some variation to the prompt for regeneration
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
        
        // Restore original prompt
        setTimeout(() => {
            this.aiCustomPrompt.value = originalPrompt;
        }, 1000);
    }
    
    /* @tweakable save functionality for generated images with format options */
    async saveGeneratedImage() {
        if (!this.currentGeneratedImage || !this.imageDisplayManager.currentImageData) {
            alert('No generated image to save');
            return;
        }
        
        try {
            /* @tweakable save format and naming options */
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const effect = document.querySelector('.ai-preset-btn.active')?.getAttribute('data-effect') || 'custom';
            const style = this.aiStyle.value;
            const format = this.aiAnimationType.value === 'static' ? 'png' : this.aiAnimationType.value;
            
            const filename = `streaming-effect-${effect}-${style}-${timestamp}.${format}`;
            
            // Convert data URL to blob
            const response = await fetch(this.imageDisplayManager.currentImageData.data);
            const blob = await response.blob();
            
            // Create download link
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(link.href), 100);
            
            console.log(`Generated image saved as: ${filename}`);
            
        } catch (error) {
            console.error('Error saving generated image:', error);
            alert('Failed to save image: ' + error.message);
        }
    }
    
    /* @tweakable generation status display management */
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