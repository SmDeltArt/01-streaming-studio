/**
 * @fileoverview AI Smart Redactor for content analysis and text generation
 * @tweakable AI-powered content generation and analysis for streaming
 */

export default class SmartRedactorManager {
    constructor(app) {
        this.app = app;
        this.redactorPanel = null;
        this.readingVignette = null;
        

        this.primaryAPI = 'websim'; // 'websim' or 'external'
        this.fallbackAPI = 'openai-free'; // fallback when websim fails
        this.maxRetryAttempts = 3;
        this.requestTimeout = 30000; // 30 seconds
        
        /* @tweakable content analysis and generation parameters */
        this.maxAnalysisLength = 50000; // characters
        this.defaultGenerationLength = 500; // words
        this.streamingToolsEnabled = true;
        
        this.isDragging = false;
        this.isVignetteDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.currentContent = '';
        this.analysisResults = null;
        this.vignettePosition = { x: 20, y: 100 };
        this.isPinned = false;
        this.isCollapsed = false;
        
        this.initializeElements();
        this.bindEvents();
        this.setupDragging();
        this.initializeAI();
    }
    
    initializeElements() {
        this.smartRedactorBtn = document.getElementById('smartRedactorBtn');
        this.redactorPanel = document.getElementById('smartRedactorPanel');
        this.redactorPanelCollapse = document.getElementById('redactorPanelCollapse');
        this.redactorPanelClose = document.getElementById('redactorPanelClose');
        this.redactorPanelExpand = document.getElementById('redactorPanelExpand');
        
        // Analysis controls
        this.analyzeContentBtn = document.getElementById('analyzeContentBtn');
        this.analysisStatus = document.getElementById('analysisStatus');
        this.contentSummary = document.getElementById('contentSummary');
        
        /* @tweakable document file upload input configuration - accepts all files with proper initialization */
        this.fileUploadInput = document.createElement('input');
        this.fileUploadInput.type = 'file';
        this.fileUploadInput.accept = '*/*'; // Accept all file types
        this.fileUploadInput.multiple = true;
        this.fileUploadInput.style.display = 'none';
        this.fileUploadInput.title = 'Select any files for document analysis (media files will be filtered out automatically)';
        document.body.appendChild(this.fileUploadInput);
        
        /* @tweakable upload files button element initialization without conflicting onclick handler */
        this.uploadFilesBtn = document.getElementById('uploadFilesBtn');
        
        // Generation controls
        this.contentType = document.getElementById('contentType');
        this.contentTone = document.getElementById('contentTone');
        this.contentLength = document.getElementById('contentLength');
        this.customPrompt = document.getElementById('customPrompt');
        this.generateTextBtn = document.getElementById('generateTextBtn');
        this.generatedContent = document.getElementById('generatedContent');
        
        // Editor tools
        this.improveTextBtn = document.getElementById('improveTextBtn');
        this.shortenTextBtn = document.getElementById('shortenTextBtn');
        this.expandTextBtn = document.getElementById('expandTextBtn');
        this.changeStyleBtn = document.getElementById('changeStyleBtn');
        
        // Streaming tools
        this.keyPointsBtn = document.getElementById('keyPointsBtn');
        this.timestampsBtn = document.getElementById('timestampsBtn');
        this.callToActionBtn = document.getElementById('callToActionBtn');
        this.transitionsBtn = document.getElementById('transitionsBtn');
        
        // Actions
        this.createVignetteBtn = document.getElementById('createVignetteBtn');
        this.saveRedactorBtn = document.getElementById('saveRedactorBtn');
        this.loadRedactorBtn = document.getElementById('loadRedactorBtn');
        /* @tweakable remove button for clearing content and uploaded files */
        this.removeContentBtn = document.getElementById('removeContentBtn');
        
        // Reading vignette
        this.readingVignette = document.getElementById('readingVignette');
        /* @tweakable vignette play button for text-to-speech functionality */
        this.vignettePlay = document.getElementById('vignettePlay');
        /* @tweakable vignette stop button for interrupting text-to-speech playback */
        this.vignetteStop = document.getElementById('vignetteStop');
        this.vignettePin = document.getElementById('vignettePin');
        this.vignetteCollapse = document.getElementById('vignetteCollapse');
        this.vignetteClose = document.getElementById('vignetteClose');
        this.vignetteContent = document.getElementById('vignetteContent');
        this.readingText = document.getElementById('readingText');
        this.progressBar = document.getElementById('progressBar');
        
        /* @tweakable uploaded files tracking for analysis */
        this.uploadedFiles = [];
        this.uploadedContent = '';
    }
    
    bindEvents() {
        this.smartRedactorBtn.addEventListener('click', () => this.togglePanel());
        this.redactorPanelCollapse.addEventListener('click', () => this.toggleCollapse());
        if (this.redactorPanelExpand) {
            this.redactorPanelExpand.addEventListener('click', () => this.toggleCollapse());
        }
        this.redactorPanelClose.addEventListener('click', () => this.hidePanel());
        
        // Analysis events
        this.analyzeContentBtn.addEventListener('click', () => this.analyzeContent());
        
        /* @tweakable document file upload event handler with improved first-attempt reliability */
        this.fileUploadInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        /* @tweakable upload files button event handler that ensures first click works properly */
        if (this.uploadFilesBtn) {
            this.uploadFilesBtn.addEventListener('click', () => {
                // Reset input to ensure fresh state for reliable file selection
                this.fileUploadInput.value = '';
                // Small delay to ensure input is ready for interaction
                setTimeout(() => {
                    this.fileUploadInput.click();
                }, 10);
            });

            /* @tweakable hover tooltip functionality for showing supported file formats */
            this.uploadFilesBtn.addEventListener('mouseenter', () => {
                this.showFileFormatsTooltip();
            });

            this.uploadFilesBtn.addEventListener('mouseleave', () => {
                this.hideFileFormatsTooltip();
            });
        }
        
        // Generation events
        this.generateTextBtn.addEventListener('click', () => this.generateContent());
        
        // Editor events
        this.improveTextBtn.addEventListener('click', () => this.improveText());
        this.shortenTextBtn.addEventListener('click', () => this.shortenText());
        this.expandTextBtn.addEventListener('click', () => this.expandText());
        this.changeStyleBtn.addEventListener('click', () => this.changeStyle());
        
        // Streaming tools events
        this.keyPointsBtn.addEventListener('click', () => this.extractKeyPoints());
        this.timestampsBtn.addEventListener('click', () => this.createTimestamps());
        this.callToActionBtn.addEventListener('click', () => this.addCallToActions());
        this.transitionsBtn.addEventListener('click', () => this.addTransitions());
        
        // Action events
        this.createVignetteBtn.addEventListener('click', () => this.createReadingVignette());
        this.saveRedactorBtn.addEventListener('click', () => this.saveContent());
        this.loadRedactorBtn.addEventListener('click', () => this.loadContent());
        /* @tweakable remove button event handler */
        if (this.removeContentBtn) {
            this.removeContentBtn.addEventListener('click', () => this.removeAllContent());
        }
        
        // Vignette events
        /* @tweakable vignette play button event handler for TTS functionality */
        if (this.vignettePlay) {
            this.vignettePlay.addEventListener('click', () => this.playVignetteText());
        }
        /* @tweakable vignette stop button event handler for stopping TTS playback */
        if (this.vignetteStop) {
            this.vignetteStop.addEventListener('click', () => this.stopVignetteText());
        }
        this.vignettePin.addEventListener('click', () => this.togglePin());
        this.vignetteCollapse.addEventListener('click', () => this.toggleVignetteCollapse());
        this.vignetteClose.addEventListener('click', () => this.hideVignette());
        
        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'a' && !e.target.matches('input, textarea, select')) {
                this.togglePanel();
                e.preventDefault();
            }
        });
    }

    /* @tweakable method to show tooltip with supported file formats for document upload */
    showFileFormatsTooltip() {
        // Remove existing tooltip if any
        this.hideFileFormatsTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'file-formats-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-header">📄 Supported Document Formats:</div>
            <div class="tooltip-content">
                <div class="format-group">
                    <strong>Text Files:</strong> .txt, .md, .html, .css, .js, .json, .csv
                </div>
                <div class="format-group">
                    <strong>Code Files:</strong> .py, .java, .cpp, .php, .rb, .go, .sql
                </div>
                <div class="format-group">
                    <strong>Documents:</strong> .pdf, .docx, .rtf, .odt
                </div>
                <div class="format-group">
                    <strong>Archives:</strong> .zip, .tar, .gz
                </div>
                <div class="tooltip-note">
                    <em>Media files should be loaded via main content area</em>
                </div>
            </div>
        `;

        document.body.appendChild(tooltip);
        this.currentTooltip = tooltip;

        // Position tooltip relative to button
        const buttonRect = this.uploadFilesBtn.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        /* @tweakable tooltip positioning relative to upload button */
        const tooltipLeft = Math.max(10, Math.min(
            buttonRect.left - tooltipRect.width / 2 + buttonRect.width / 2,
            window.innerWidth - tooltipRect.width - 10
        ));
        
        tooltip.style.left = `${tooltipLeft}px`;
        tooltip.style.top = `${buttonRect.top - tooltipRect.height - 10}px`;

        // Show tooltip with animation
        setTimeout(() => {
            tooltip.classList.add('visible');
        }, 10);
    }

    /* @tweakable method to hide file formats tooltip */
    hideFileFormatsTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }
    
    setupDragging() {
        // Panel dragging
        const header = this.redactorPanel.querySelector('.smart-redactor-header');
        this.setupElementDragging(header, this.redactorPanel);
        
        // Vignette dragging
        const vignetteHeader = this.readingVignette.querySelector('.vignette-header');
        this.setupElementDragging(vignetteHeader, this.readingVignette, true);
    }
    
    setupElementDragging(dragHandle, element, isVignette = false) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        dragHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            element.classList.add('dragging');
            
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = element.getBoundingClientRect();
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
            
            /* @tweakable dragging boundaries for panel and vignette positioning */
            const elementRect = element.getBoundingClientRect();
            const minVisibleArea = Math.min(elementRect.width, elementRect.height) * 0.1;
            
            newX = Math.max(-elementRect.width + minVisibleArea, 
                           Math.min(newX, window.innerWidth - minVisibleArea));
            newY = Math.max(-elementRect.height + minVisibleArea, 
                           Math.min(newY, window.innerHeight - minVisibleArea));
            
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
            element.style.transform = 'none';
            
            if (isVignette) {
                this.vignettePosition = { x: newX, y: newY };
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.classList.remove('dragging');
            }
        });
    }
    
    /* @tweakable AI API initialization with WebSim primary and external fallback */
    async initializeAI() {
        try {
            // Check WebSim AI API availability
            if (typeof window.websim !== 'undefined' && window.websim.chat) {
                this.aiAPI = window.websim.chat;
                this.primaryAPI = 'websim';
                console.log('WebSim AI API initialized');
            } else {
                console.warn('WebSim AI API not available, using external fallback');
                this.aiAPI = await this.createExternalAI();
                this.primaryAPI = 'external';
            }
        } catch (error) {
            console.error('Error initializing AI:', error);
            this.aiAPI = await this.createExternalAI();
            this.primaryAPI = 'external';
        }
    }
    
    /* @tweakable enhanced external AI API integration with verified working free service options */
    // REPLACE the whole method
async createExternalAI() {
  // read user prefs/keys from Settings
  const pref = (localStorage.getItem('TXT_AI_PREF') || 'auto').toLowerCase();
  const keys = {
    GROQ_API_KEY:     localStorage.getItem('GROQ_API_KEY')     || '',
    COHERE_API_KEY:   localStorage.getItem('COHERE_API_KEY')   || '',
    TOGETHER_API_KEY: localStorage.getItem('TOGETHER_API_KEY') || ''
  };

  // Build priority by preference; skip providers with no key
  const base = [
    keys.GROQ_API_KEY     && { name:'Groq',     endpoint:'https://api.groq.com/openai/v1/chat/completions',
      headers:()=>({'Authorization':`Bearer ${keys.GROQ_API_KEY}`,'Content-Type':'application/json'}),
      req:(messages)=>({ model:'llama3-8b-8192', messages, max_tokens:800, temperature:0.7 }),
      ext:(d)=>d?.choices?.[0]?.message?.content || '' },

    keys.COHERE_API_KEY   && { name:'Cohere',   endpoint:'https://api.cohere.ai/v1/chat',
      headers:()=>({'Authorization':`Bearer ${keys.COHERE_API_KEY}`,'Content-Type':'application/json'}),
      req:(messages)=>({
        model:'command-light',
        message: messages[messages.length-1]?.content || '',
        chat_history: messages.slice(0,-1).map(m=>({ role: m.role==='user'?'USER':'CHATBOT', message:m.content })),
        max_tokens:800, temperature:0.7
      }),
      ext:(d)=>d?.text || '' },

    keys.TOGETHER_API_KEY && { name:'Together', endpoint:'https://api.together.xyz/v1/chat/completions',
      headers:()=>({'Authorization':`Bearer ${keys.TOGETHER_API_KEY}`,'Content-Type':'application/json'}),
      req:(messages)=>({ model:'mistralai/Mixtral-8x7B-Instruct-v0.1', messages, max_tokens:800, temperature:0.7 }),
      ext:(d)=>d?.choices?.[0]?.message?.content || '' }
  ].filter(Boolean);

  const orderByPref = {
    groq:     ['Groq','Cohere','Together'],
    cohere:   ['Cohere','Groq','Together'],
    together: ['Together','Groq','Cohere'],
    auto:     ['Groq','Cohere','Together']
  }[pref] || ['Groq','Cohere','Together'];

  // Reorder base according to preference
  const providers = orderByPref
    .map(n => base.find(b => b.name === n))
    .filter(Boolean);

  const apiTimeout = 20000;
  const maxRetries = 1;

  if (!providers.length) {
    console.warn('[Redactor] No text API keys found; using offline fallback.');
    return this.createFallbackAI();
  }

  return {
    completions: {
      create: async ({ messages }) => {
        let lastErr;
        for (const p of providers) {
          for (let attempt=0; attempt<=maxRetries; attempt++) {
            try {
              const controller = new AbortController();
              const to = setTimeout(()=>controller.abort(), apiTimeout);
              const res = await fetch(p.endpoint, {
                method: 'POST',
                headers: p.headers(),
                body: JSON.stringify(p.req(messages)),
                signal: controller.signal
              });
              clearTimeout(to);

              if (!res.ok) {
                const txt = await res.text().catch(()=> '');
                throw new Error(`${p.name} HTTP ${res.status}: ${txt.slice(0,200)}`);
              }
              const data = await res.json();
              const content = (p.ext(data) || '').trim();
              if (content) return { content };
              throw new Error(`${p.name} returned empty content`);
            } catch (e) {
              lastErr = e;
              console.warn(`[Redactor] ${p.name} failed (try ${attempt+1}):`, e.message);
            }
          }
        }
        console.warn('[Redactor] All providers failed; using offline fallback. Last error:', lastErr?.message);
        const fb = await this.createFallbackAI();
        return fb.completions.create({ messages });
      }
    }
  };
}

    
    /* @tweakable enhanced fallback AI implementation for complete offline functionality */
    async createFallbackAI() {
        return {
            completions: {
                create: async (options) => {
                    /* @tweakable enhanced static fallback responses with content analysis */
                    const fallbackResponses = {
                        presentation: "Welcome to this presentation. Today we'll explore the key features and benefits of the content being displayed. Let's begin with an overview of the main points that will be covered. This presentation will guide you through each section systematically, ensuring you understand the core concepts and their practical applications.",
                        tutorial: "In this tutorial, we'll walk through each step of the process methodically. Follow along as we demonstrate the functionality and explain how you can apply these concepts yourself. Each section builds upon the previous one, creating a comprehensive learning experience.",
                        demo: "This demonstration showcases the practical application of the features you're seeing. Pay attention to the workflow and how each component works together seamlessly. We'll highlight the key benefits and show real-world use cases.",
                        review: "Let's examine this content in detail with a critical eye. We'll look at the strengths, identify areas for improvement, and provide an overall assessment of what we're reviewing today. This analysis will be thorough and objective.",
                        stream: "Welcome everyone to today's stream! We have some exciting content to share with you. Don't forget to like and subscribe if you're enjoying the content. Your engagement helps us create even better material for the community.",
                        custom: "Here's a comprehensive content analysis and suggested narrative based on what we're currently viewing. This provides context, talking points, and structured guidance for your presentation or streaming session."
                    };
                    
                    /* @tweakable intelligent content type detection from user prompts */
                    const prompt = options.messages[options.messages.length - 1].content.toLowerCase();
                    let responseType = 'custom';
                    
                    // Enhanced keyword matching for better content categorization
                    const typeKeywords = {
                        presentation: ['present', 'slide', 'business', 'formal', 'audience'],
                        tutorial: ['tutorial', 'learn', 'teach', 'step', 'guide', 'how to'],
                        demo: ['demo', 'demonstrate', 'show', 'example', 'feature'],
                        review: ['review', 'analyze', 'critique', 'evaluate', 'assessment'],
                        stream: ['stream', 'live', 'chat', 'viewers', 'subscribe', 'like']
                    };
                    
                    for (const [type, keywords] of Object.entries(typeKeywords)) {
                        if (keywords.some(keyword => prompt.includes(keyword))) {
                            responseType = type;
                            break;
                        }
                    }
                    
                    console.log(`Using fallback AI response for type: ${responseType}`);
                    return { content: fallbackResponses[responseType] };
                }
            }
        };
    }
    
    togglePanel() {
        if (this.redactorPanel.style.display === 'block') {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }
    
    showPanel() {
        this.redactorPanel.style.display = 'block';
    }
    
    hidePanel() {
        this.redactorPanel.style.display = 'none';
    }
    
    toggleCollapse() {
        const isCollapsed = this.redactorPanel.classList.contains('collapsed');
        if (isCollapsed) {
            this.redactorPanel.classList.remove('collapsed');
            this.redactorPanelCollapse.textContent = '−';
        } else {
            this.redactorPanel.classList.add('collapsed');
            this.redactorPanelCollapse.textContent = '+';
        }
    }
    
    /* @tweakable content analysis method separating document analysis from iframe media analysis */
    async analyzeContent() {
        try {
            this.analysisStatus.textContent = 'Analyzing content...';
            this.analysisStatus.className = 'analysis-status analyzing';
            
            let contentToAnalyze = '';
            let contentType = 'unknown';
            
            // Check for uploaded document files first
            if (this.uploadedContent) {
                contentToAnalyze = this.uploadedContent;
                contentType = 'uploaded_documents';
                console.log('Analyzing uploaded document files...');
            } else {
                // Check if there's iframe content for media analysis
                const contentFrame = document.getElementById('contentFrame');
                if (contentFrame && contentFrame.src && contentFrame.style.display !== 'none') {
                    try {
                        // Try to access iframe content (same-origin only)
                        const iframeDoc = contentFrame.contentDocument || contentFrame.contentWindow.document;
                        if (iframeDoc) {
                            contentToAnalyze = iframeDoc.body.innerText || iframeDoc.body.textContent || '';
                            contentType = 'webpage_content';
                            console.log('Analyzing iframe webpage content...');
                            
                            /* @tweakable content extraction limits for iframe analysis performance */
                            if (contentToAnalyze.length > this.maxAnalysisLength) {
                                contentToAnalyze = contentToAnalyze.substring(0, this.maxAnalysisLength) + '...';
                            }
                        } else {
                            throw new Error('Cross-origin iframe access denied');
                        }
                    } catch (error) {
                        // Fallback: analyze URL and basic page structure for media analysis
                        contentToAnalyze = `URL: ${contentFrame.src}\nNote: Content analysis limited due to cross-origin restrictions.`;
                        contentType = 'external_webpage';
                        console.log('Analyzing external webpage URL...');
                    }
                }
                
                // Check for video/audio media content
                const mediaElements = document.querySelectorAll('video, audio');
                if (mediaElements.length > 0) {
                    const mediaInfo = Array.from(mediaElements).map(media => {
                        const duration = media.duration ? ` (${Math.round(media.duration)}s)` : '';
                        return `${media.tagName}: ${media.src || media.currentSrc || 'Unknown source'}${duration}`;
                    }).join('\n');
                    
                    if (contentToAnalyze) {
                        contentToAnalyze += '\n\nMedia Elements:\n' + mediaInfo;
                    } else {
                        contentToAnalyze = 'Media Elements:\n' + mediaInfo;
                        contentType = 'media_content';
                    }
                    console.log('Analyzing loaded media content...');
                }
            }
            
            if (!contentToAnalyze.trim()) {
                // Prompt for document upload or content loading
                this.analysisStatus.textContent = 'No content to analyze. Upload documents or load webpage content.';
                this.analysisStatus.className = 'analysis-status';
                this.contentSummary.innerHTML = '<em>Please either:<br>1. Click "📁 Upload Files/Docs" to analyze documents<br>2. Load content in the main iframe first, then analyze</em>';
                return;
            }
            
            /* @tweakable AI analysis prompt for content understanding with content type awareness */
            let analysisPrompt;
            if (contentType === 'uploaded_documents') {
                analysisPrompt = `Analyze these uploaded document files for streaming/presentation purposes:

Content: ${contentToAnalyze}

Please provide:
1. Document summary and main topics
2. Key information points for presentation
3. Document structure and organization analysis
4. Recommended presentation approach
5. Suggested talking points and script ideas

Focus on extracting actionable insights for content creation and streaming.`;
            } else {
                analysisPrompt = `Analyze this loaded content for streaming/presentation purposes:

Content Type: ${contentType}
Content: ${contentToAnalyze}

Please provide:
1. Main topic/theme
2. Key points (3-5 bullet points)
3. Target audience
4. Recommended presentation style
5. Suggested talking points

Keep the analysis concise and practical for content creation.`;
            }
            
            const response = await this.callAI([
                { role: 'system', content: 'You are a content analysis assistant helping streamers and presenters understand their material.' },
                { role: 'user', content: analysisPrompt }
            ]);
            
            this.analysisResults = {
                content: contentToAnalyze,
                type: contentType,
                analysis: response.content
            };
            
            this.contentSummary.innerHTML = `
                <strong>Content Type:</strong> ${contentType.replace(/_/g, ' ').toUpperCase()}<br><br>
                ${response.content.replace(/\n/g, '<br>')}
            `;
            
            this.analysisStatus.textContent = 'Analysis complete';
            this.analysisStatus.className = 'analysis-status';
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.analysisStatus.textContent = `Analysis failed: ${error.message}`;
            this.analysisStatus.className = 'analysis-status';
            this.contentSummary.innerHTML = `<em>Unable to analyze content: ${error.message}</em>`;
        }
    }
    
    /* @tweakable AI content generation with customizable parameters */
    async generateContent() {
        try {
            const contentType = this.contentType.value;
            const tone = this.contentTone.value;
            const length = this.contentLength.value;
            const customPrompt = this.customPrompt.value.trim();
            
            this.generateTextBtn.textContent = 'Generating...';
            this.generateTextBtn.disabled = true;
            
            /* @tweakable content generation prompts based on selected parameters */
            let basePrompt = this.buildGenerationPrompt(contentType, tone, length);
            
            if (customPrompt) {
                basePrompt += `\n\nAdditional requirements: ${customPrompt}`;
            }
            
            if (this.analysisResults) {
                basePrompt += `\n\nBase this on the analyzed content: ${this.analysisResults.analysis}`;
            }
            
            const response = await this.callAI([
                { role: 'system', content: 'You are a professional content writer specializing in streaming and presentation scripts.' },
                { role: 'user', content: basePrompt }
            ]);
            
            this.currentContent = response.content;
            this.generatedContent.value = response.content;
            
        } catch (error) {
            console.error('Generation error:', error);
            alert(`Content generation failed: ${error.message}`);
        } finally {
            this.generateTextBtn.textContent = '✨ Generate Content';
            this.generateTextBtn.disabled = false;
        }
    }
    
    /* @tweakable prompt building system for different content types and tones */
    buildGenerationPrompt(contentType, tone, length) {
        const lengthMap = {
            brief: 'Write a concise script (1-2 minutes speaking time, approximately 150-300 words)',
            medium: 'Write a detailed script (3-5 minutes speaking time, approximately 450-750 words)', 
            detailed: 'Write a comprehensive script (5+ minutes speaking time, approximately 750+ words)'
        };
        
        const toneMap = {
            professional: 'Use a professional, authoritative tone suitable for business presentations',
            casual: 'Use a casual, conversational tone like talking to friends',
            friendly: 'Use a warm, friendly tone that makes viewers feel welcome',
            enthusiastic: 'Use an excited, energetic tone that shows passion for the topic',
            educational: 'Use a clear, instructive tone focused on teaching and explaining'
        };
        
        const typeMap = {
            presentation: 'Create a presentation script with clear introduction, main points, and conclusion',
            tutorial: 'Write a step-by-step tutorial script with clear instructions and explanations',
            demo: 'Create a demonstration script that guides viewers through what they\'re seeing',
            review: 'Write a review script that evaluates and discusses the content critically',
            stream: 'Create an engaging stream commentary script with viewer interaction points',
            custom: 'Create content based on the specific requirements provided'
        };
        
        return `${lengthMap[length]}. ${toneMap[tone]}. ${typeMap[contentType]}.
        
        Include natural transitions, engaging hooks, and clear structure. Make it suitable for live streaming or recording.`;
    }
    
    /* @tweakable content improvement functions with selective text editing */
    async improveText() {
        await this.modifyText('Improve this text to be more engaging, clear, and professional while maintaining the original meaning and length:');
    }
    
    async shortenText() {
        await this.modifyText('Make this text more concise while keeping all important information:');
    }
    
    async expandText() {
        await this.modifyText('Expand this text with more detail, examples, and explanations:');
    }
    
    async changeStyle() {
        await this.modifyText('Rewrite this text in a different style while maintaining the same information:');
    }
    
    /* @tweakable text modification with selection support */
    async modifyText(instruction) {
        const textarea = this.generatedContent;
        let textToModify = '';
        let selectionStart = textarea.selectionStart;
        let selectionEnd = textarea.selectionEnd;
        /* @tweakable selection detection with enhanced validation */
        let hasSelection = selectionStart !== selectionEnd && selectionStart >= 0 && selectionEnd > selectionStart;
        
        /* @tweakable selection boundary validation to prevent errors */
        if (hasSelection && (selectionStart >= textarea.value.length || selectionEnd > textarea.value.length)) {
            hasSelection = false;
        }
        
        if (hasSelection) {
            // Use selected text only
            textToModify = textarea.value.substring(selectionStart, selectionEnd);
            console.log(`Modifying selected text: "${textToModify.substring(0, 50)}${textToModify.length > 50 ? '...' : ''}"`);
        } else {
            // Use entire content
            textToModify = textarea.value.trim();
            selectionStart = 0;
            selectionEnd = textToModify.length;
            console.log('Modifying entire content');
        }
        
        if (!textToModify.trim()) {
            alert('Please generate or enter some text first.');
            return;
        }
        
        /* @tweakable minimum text length for modification to prevent errors */
        const minTextLength = 3;
        if (textToModify.trim().length < minTextLength) {
            alert(`Please select at least ${minTextLength} characters to modify.`);
            return;
        }
        
        try {
            /* @tweakable user feedback during text modification process */
            const originalButtonTexts = {
                improve: this.improveTextBtn.textContent,
                shorten: this.shortenTextBtn.textContent,
                expand: this.expandTextBtn.textContent,
                style: this.changeStyleBtn.textContent
            };
            
            // Determine which button was clicked and update its text
            const activeButton = document.activeElement;
            if (activeButton && activeButton.textContent) {
                const statusText = hasSelection ? 'Modifying selection...' : 'Modifying all...';
                activeButton.textContent = statusText;
                activeButton.disabled = true;
            }
            
            const response = await this.callAI([
                { role: 'user', content: `${instruction}\n\n${textToModify}` }
            ]);
            
            /* @tweakable text replacement with preserved formatting and cursor positioning */
            // Replace the selected portion or entire content
            const beforeText = textarea.value.substring(0, selectionStart);
            const afterText = textarea.value.substring(selectionEnd);
            const newContent = beforeText + response.content + afterText;
            
            // Store the original scroll position
            const scrollTop = textarea.scrollTop;
            
            textarea.value = newContent;
            this.currentContent = newContent;
            
            // Restore cursor position after the modified text
            const newCursorPosition = selectionStart + response.content.length;
            textarea.setSelectionRange(newCursorPosition, newCursorPosition);
            textarea.focus();
            
            // Restore scroll position
            textarea.scrollTop = scrollTop;
            
            /* @tweakable success feedback with modification details */
            console.log(`Text modification complete: ${hasSelection ? 'selection' : 'full content'} modified`);
            
            // Restore button text
            if (activeButton && originalButtonTexts[activeButton.id]) {
                activeButton.textContent = originalButtonTexts[activeButton.id] || activeButton.textContent;
                activeButton.disabled = false;
            }
            
        } catch (error) {
            console.error('Text modification error:', error);
            alert(`Failed to modify text: ${error.message}`);
            
            // Restore button states on error
            [this.improveTextBtn, this.shortenTextBtn, this.expandTextBtn, this.changeStyleBtn].forEach(btn => {
                if (btn) {
                    btn.disabled = false;
                    // Restore original text if it was changed
                    if (btn.textContent.includes('...')) {
                        const btnMap = {
                            'improveTextBtn': '📝',
                            'shortenTextBtn': '✂️', 
                            'expandTextBtn': '➕',
                            'changeStyleBtn': '🎭'
                        };
                        btn.textContent = btnMap[btn.id] || btn.textContent;
                    }
                }
            });
        }
    }
    
    /* @tweakable streaming tools for enhanced content creation */
    async extractKeyPoints() {
        await this.applyStreamingTool('Extract the key points from this content and format them as bullet points:');
    }
    
    async createTimestamps() {
        await this.applyStreamingTool('Add timestamp markers and segment this content for video chapters:');
    }
    
    async addCallToActions() {
        await this.applyStreamingTool('Add appropriate call-to-action phrases and engagement hooks to this content:');
    }
    
    async addTransitions() {
        await this.applyStreamingTool('Add smooth transitions and connecting phrases between sections in this content:');
    }
    
    async applyStreamingTool(instruction) {
        const currentText = this.generatedContent.value.trim();
        if (!currentText) {
            alert('Please generate some content first.');
            return;
        }
        
        try {
            const response = await this.callAI([
                { role: 'system', content: 'You are a streaming and video production assistant.' },
                { role: 'user', content: `${instruction}\n\n${currentText}` }
            ]);
            
            this.generatedContent.value = response.content;
            this.currentContent = response.content;
        } catch (error) {
            console.error('Streaming tool error:', error);
            alert(`Failed to apply streaming tool: ${error.message}`);
        }
    }
    
    /* @tweakable AI API call handler with enhanced external API documentation and user guidance */
    async callAI(messages) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetryAttempts; attempt++) {
            try {
                const response = await this.aiAPI.completions.create({
                    messages: messages
                });
                
                if (response && response.content && response.content.trim()) {
                    return response;
                } else {
                    throw new Error('Invalid or empty API response');
                }
                
            } catch (error) {
                lastError = error;
                console.warn(`AI API attempt ${attempt} failed:`, error.message);
                
                if (attempt === this.maxRetryAttempts) {
                    /* @tweakable intelligent API switching with comprehensive external API documentation guidance */
                    if (this.primaryAPI === 'websim') {
                        try {
                            console.log('🔄 WebSim AI API failed, switching to external AI services...');
                            console.log('📚 Setting up external AI APIs with documentation...');
                            this.aiAPI = await this.createExternalAI();
                            this.primaryAPI = 'external';
                            return await this.aiAPI.completions.create({ messages });
                        } catch (externalError) {
                            console.warn('⚠️ External AI APIs also failed, using enhanced fallback');
                            console.log('💡 For better AI functionality, consider setting up free API keys from:');
                            console.log('• Groq Cloud: https://console.groq.com (Free: 30 requests/minute, 6000 requests/day)');
                            console.log('• Together AI: https://api.together.xyz (Free: $5 credit)');
                            console.log('• Perplexity AI: https://docs.perplexity.ai (Free: $5 credit with web search)');
                            console.log('• Cohere AI: https://docs.cohere.ai (Free: 1000 calls/month)');
                            
                            this.aiAPI = await this.createFallbackAI();
                            this.primaryAPI = 'fallback';
                            return await this.aiAPI.completions.create({ messages });
                        }
                    } else if (this.primaryAPI === 'external') {
                        console.warn('🔄 External AI APIs failed, switching to enhanced fallback');
                        this.aiAPI = await this.createFallbackAI();
                        this.primaryAPI = 'fallback';
                        return await this.aiAPI.completions.create({ messages });
                    }
                }
                
                /* @tweakable progressive retry delay for better external API reliability */
                const retryDelay = Math.min(1500 * attempt, 5000);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
        
        throw lastError || new Error('AI API failed after all attempts and fallbacks');
    }
    
    /* @tweakable reading vignette creation with Active Display integration */
    createReadingVignette() {
        const content = this.generatedContent.value.trim();
        if (!content) {
            alert('Please generate some content first.');
            return;
        }
        
        this.readingText.textContent = content;
        this.readingVignette.style.display = 'block';
        this.progressBar.style.width = '0%';
        
        // Add to Active Display system
        if (this.app.uiManager && this.app.uiManager.addActiveItem) {
            /* @tweakable enhanced vignette settings storage for proper callback functionality */
            const vignetteSettings = {
                content: content,
                position: { ...this.vignettePosition }, // Clone position object
                isPinned: this.isPinned,
                isCollapsed: this.isCollapsed,
                type: 'vignette'
            };
            
            /* @tweakable vignette active item creation with proper type classification and element tracking */
            const activeItemId = this.app.uiManager.addActiveItem('vignette', 'Reading Vignette', this.readingVignette, vignetteSettings);
            this.readingVignette.dataset.activeItemId = activeItemId;
            
            // Store reference for callback functionality
            this.currentVignetteItemId = activeItemId;
        }
        
        this.setupReadingProgress();
    }
    
    /* @tweakable reading progress tracking for vignette functionality */
    setupReadingProgress() {
        const content = this.readingText.textContent;
        const wordsPerMinute = 200; // Average reading speed
        const words = content.split(/\s+/).length;
        const readingTimeMs = (words / wordsPerMinute) * 60 * 1000;
        
        let progress = 0;
        const updateInterval = 100; // Update every 100ms
        const increment = (updateInterval / readingTimeMs) * 100;
        
        const progressInterval = setInterval(() => {
            progress += increment;
            this.progressBar.style.width = Math.min(progress, 100) + '%';
            
            if (progress >= 100) {
                clearInterval(progressInterval);
            }
        }, updateInterval);
        
        // Store interval for cleanup
        this.readingVignette.dataset.progressInterval = progressInterval;
    }
    
    togglePin() {
        this.isPinned = !this.isPinned;
        
        if (this.isPinned) {
            this.readingVignette.classList.add('pinned');
            this.vignettePin.classList.add('active');
        } else {
            this.readingVignette.classList.remove('pinned');
            this.vignettePin.classList.remove('active');
        }
    }
    
    toggleVignetteCollapse() {
        this.isCollapsed = !this.isCollapsed;
        
        if (this.isCollapsed) {
            this.readingVignette.classList.add('collapsed');
            this.vignetteCollapse.textContent = '+';
        } else {
            this.readingVignette.classList.remove('collapsed');
            this.vignetteCollapse.textContent = '−';
        }
    }
    
    hideVignette() {
        this.readingVignette.style.display = 'none';
        
        // Cleanup progress interval
        if (this.readingVignette.dataset.progressInterval) {
            clearInterval(parseInt(this.readingVignette.dataset.progressInterval));
        }
        
        /* @tweakable enhanced vignette hiding with proper active item state management for callback functionality */
        // Update active item to show as "stored for replay" while preserving callback capability
        if (this.app.uiManager && this.readingVignette.dataset.activeItemId) {
            const itemId = parseInt(this.readingVignette.dataset.activeItemId);
            const item = this.app.uiManager.activeItems.find(item => item.id === itemId);
            if (item) {
                // Store current state before hiding
                item.settings.position = { ...this.vignettePosition };
                item.settings.isPinned = this.isPinned;
                item.settings.isCollapsed = this.isCollapsed;
                
                // Mark element as null so it shows as "stored for replay" but keep all settings
                item.element = null;
                this.app.uiManager.updateActiveItemsDisplay();
                
                console.log('Vignette hidden and marked for replay callback');
            }
        }
        
        // Clear current item reference
        this.currentVignetteItemId = null;
    }
    
    /* @tweakable method to stop vignette text-to-speech playback */
    stopVignetteText() {
        try {
            // Stop browser speech synthesis
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
                console.log('Browser speech synthesis stopped');
            }
            
            // Stop any WebSim TTS audio if playing
            if (this.currentVignetteAudio && !this.currentVignetteAudio.paused) {
                this.currentVignetteAudio.pause();
                this.currentVignetteAudio.currentTime = 0;
                this.currentVignetteAudio = null;
                console.log('WebSim TTS audio stopped');
            }
            
            // Reset play button state
            if (this.vignettePlay) {
                this.vignettePlay.textContent = '▶️';
                this.vignettePlay.disabled = false;
                this.vignettePlay.title = 'Play Text-to-Speech';
            }
            
            console.log('Vignette text-to-speech stopped');
            
        } catch (error) {
            console.error('Error stopping vignette text-to-speech:', error);
        }
    }
    
    /* @tweakable method to play vignette text using text display manager's TTS settings */
    async playVignetteText() {
        if (!this.readingText || !this.readingText.textContent.trim()) {
            console.warn('No vignette text content to speak');
            return;
        }
        
        const textContent = this.readingText.textContent.trim();
        
        try {
            // Change button to indicate speaking state
            if (this.vignettePlay) {
                const originalContent = this.vignettePlay.textContent;
                this.vignettePlay.textContent = '🔊';
                this.vignettePlay.disabled = true;
                this.vignettePlay.title = 'Speaking...';
                
                /* @tweakable TTS settings from text display manager for vignette speech */
                // Get TTS settings from text display manager if available
                let ttsSettings = {
                    voice: 'en-male',
                    speechSpeed: 1.0,
                    speechVolume: 70
                };
                
                if (this.app.textDisplayManager) {
                    const textManager = this.app.textDisplayManager;
                    if (textManager.textVoice && textManager.speechSpeed && textManager.speechVolume) {
                        ttsSettings = {
                            voice: textManager.textVoice.value || 'en-male',
                            speechSpeed: parseFloat(textManager.speechSpeed.value) || 1.0,
                            speechVolume: parseInt(textManager.speechVolume.value) || 70
                        };
                    }
                }
                
                /* @tweakable vignette TTS implementation using WebSim API or fallback */
                // Use the text display manager's TTS API if available
                if (this.app.textDisplayManager && this.app.textDisplayManager.ttsAPI) {
                    const ttsAPI = this.app.textDisplayManager.ttsAPI;
                    
                    if (typeof ttsAPI === 'function') {
                        // WebSim TTS API
                        const result = await ttsAPI({
                            text: textContent,
                            voice: ttsSettings.voice
                        });
                        
                        if (result && result.url) {
                            const audio = new Audio(result.url);
                            audio.volume = ttsSettings.speechVolume / 100;
                            audio.playbackRate = ttsSettings.speechSpeed;
                            
                            /* @tweakable store reference to current vignette audio for stop functionality */
                            this.currentVignetteAudio = audio;
                            
                            await new Promise((resolve, reject) => {
                                audio.onended = () => {
                                    this.currentVignetteAudio = null;
                                    resolve();
                                };
                                audio.onerror = () => {
                                    this.currentVignetteAudio = null;
                                    reject(new Error('Audio playback failed'));
                                };
                                audio.play().catch(reject);
                            });
                        }
                    } else {
                        throw new Error('TTS API not available');
                    }
                } else {
                    /* @tweakable fallback TTS using browser speech synthesis for vignette */
                    // Fallback to browser speech synthesis
                    await this.speakVignetteFallback(textContent, ttsSettings);
                }
                
                // Reset button state
                this.vignettePlay.textContent = originalContent;
                this.vignettePlay.disabled = false;
                this.vignettePlay.title = 'Play Text-to-Speech';
                /* @tweakable clear vignette audio reference when playback completes */
                this.currentVignetteAudio = null;
                
            }
        } catch (error) {
            console.error('Error playing vignette text:', error);
            
            // Reset button state on error
            if (this.vignettePlay) {
                this.vignettePlay.textContent = '▶️';
                this.vignettePlay.disabled = false;
                this.vignettePlay.title = 'Play Text-to-Speech';
            }
            
            /* @tweakable clear vignette audio reference on error */
            this.currentVignetteAudio = null;
            
            // Show error feedback
            console.warn('Failed to speak vignette text:', error.message);
        }
    }
    
    /* @tweakable fallback speech synthesis method for vignette TTS */
    async speakVignetteFallback(text, settings) {
        if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
            throw new Error('Speech synthesis not supported');
        }
        
        return new Promise((resolve, reject) => {
            try {
                // Cancel any ongoing speech
                speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                
                // Apply settings
                utterance.rate = Math.max(0.1, Math.min(10, settings.speechSpeed || 1));
                utterance.volume = Math.max(0, Math.min(1, (settings.speechVolume || 70) / 100));
                utterance.pitch = 1;
                
                /* @tweakable voice selection for vignette speech synthesis */
                // Try to find matching voice
                const voices = speechSynthesis.getVoices();
                if (voices.length > 0) {
                    const voiceMap = {
                        'en-male': ['male', 'man', 'david', 'alex'],
                        'en-female': ['female', 'woman', 'samantha', 'victoria'],
                        'es-male': ['spanish', 'jorge', 'carlos'],
                        'es-female': ['spanish', 'spanish female', 'monica'],
                        'fr-male': ['french', 'thomas', 'henri'],
                        'fr-female': ['french', 'aurelie', 'marie']
                    };
                    
                    const preferredVoices = voiceMap[settings.voice] || ['default'];
                    let selectedVoice = null;
                    
                    for (const preference of preferredVoices) {
                        selectedVoice = voices.find(voice => 
                            voice.name.toLowerCase().includes(preference.toLowerCase()) ||
                            voice.lang.toLowerCase().includes(preference.split('-')[0])
                        );
                        if (selectedVoice) break;
                    }
                    
                    if (!selectedVoice) {
                        selectedVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
                    }
                    
                    if (selectedVoice) {
                        utterance.voice = selectedVoice;
                    }
                }
                
                utterance.onend = () => resolve();
                utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));
                
                speechSynthesis.speak(utterance);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /* @tweakable save and load functionality for generated content */
    saveContent() {
        const content = this.generatedContent.value.trim();
        if (!content) {
            alert('No content to save.');
            return;
        }
        
        const saveData = {
            content: content,
            contentType: this.contentType.value,
            tone: this.contentTone.value,
            length: this.contentLength.value,
            customPrompt: this.customPrompt.value,
            analysisResults: this.analysisResults,
            timestamp: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(saveData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `ai-content-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        
        setTimeout(() => URL.revokeObjectURL(link.href), 100);
    }
    
    loadContent() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    this.generatedContent.value = data.content || '';
                    this.contentType.value = data.contentType || 'presentation';
                    this.contentTone.value = data.tone || 'professional';
                    this.contentLength.value = data.length || 'medium';
                    this.customPrompt.value = data.customPrompt || '';
                    
                    if (data.analysisResults) {
                        this.analysisResults = data.analysisResults;
                        this.contentSummary.innerHTML = data.analysisResults.analysis.replace(/\n/g, '<br>');
                    }
                    
                    this.currentContent = data.content || '';
                    alert('Content loaded successfully!');
                } catch (error) {
                    console.error('Error loading content:', error);
                    alert('Failed to load content: Invalid JSON file');
                }
            };
            reader.readAsText(file);
        });
        
        input.click();
    }
    
    /* @tweakable method to remove all content and uploaded files */
    removeAllContent() {
        if (confirm('Are you sure you want to remove all content and uploaded files?')) {
            this.generatedContent.value = '';
            this.customPrompt.value = '';
            this.contentSummary.innerHTML = '';
            this.currentContent = '';
            this.analysisResults = null;
            this.uploadedContent = '';
            this.uploadedFiles = [];
            this.analysisStatus.textContent = 'Content cleared';
            this.analysisStatus.className = 'analysis-status';
        }
    }
    
    cleanup() {
        // Hide panels
        this.hidePanel();
        this.hideVignette();
        
        // Clear content
        this.generatedContent.value = '';
        this.customPrompt.value = '';
        this.contentSummary.innerHTML = '';
        this.currentContent = '';
        this.analysisResults = null;
    }
    
    /* @tweakable file upload handler with media file filtering to prevent loading media through document upload */
    async handleFileUpload(event) {
        const files = Array.from(event.target.files);
        if (!files.length) return;
        
        try {
            /* @tweakable media file filtering for document upload - block all media files */
            const documentFiles = files.filter(file => !this.isMediaFile(file));
            const mediaFiles = files.filter(file => this.isMediaFile(file));
            
            if (mediaFiles.length > 0) {
                const mediaFileNames = mediaFiles.map(f => f.name).join(', ');
                alert(`Media files not allowed for document analysis: ${mediaFileNames}\n\nPlease use "📊 Analyze Current Content" for loaded media instead.`);
                
                if (documentFiles.length === 0) {
                    this.analysisStatus.textContent = 'Upload blocked - only document files allowed';
                    this.analysisStatus.className = 'analysis-status';
                    return;
                }
            }
            
            if (documentFiles.length === 0) {
                this.analysisStatus.textContent = 'No document files to process';
                this.analysisStatus.className = 'analysis-status';
                this.contentSummary.innerHTML = '<div style="line-height: 1.5;">📄 Please select document files only. Media files should be loaded in the main content area and analyzed with "📊 Analyze Current Content".</div>';
                return;
            }

            this.analysisStatus.textContent = 'Processing uploaded document files...';
            this.analysisStatus.className = 'analysis-status analyzing';
            
            let combinedContent = '';
            let processedCount = 0;
            
            /* @tweakable process only document files, excluding any media files */
            for (const file of documentFiles) {
                if (file.name.endsWith('.zip') || file.name.endsWith('.tar') || file.name.endsWith('.gz')) {
                    // Handle archive files
                    const archiveContent = await this.extractArchiveContent(file);
                    combinedContent += `\n\n=== ARCHIVE: ${file.name} ===\n${archiveContent}`;
                    processedCount++;
                } else {
                    // Handle all files as documents
                    const fileContent = await this.readDocumentFileContent(file);
                    if (fileContent.trim()) {
                        combinedContent += `\n\n=== DOCUMENT: ${file.name} ===\n${fileContent}`;
                        processedCount++;
                    }
                }
            }

            if (processedCount === 0) {
                this.analysisStatus.textContent = 'No readable document files processed';
                this.analysisStatus.className = 'analysis-status';
                this.contentSummary.innerHTML = '<div style="line-height: 1.5;">📄 No readable document content found. Please select files with extractable text content.</div>';
                return;
            }
            
            this.uploadedContent = combinedContent;
            /* @tweakable store only document files, excluding media files from uploaded files list */
            this.uploadedFiles = documentFiles;
            
            this.analysisStatus.textContent = `Processed ${processedCount} document file(s)`;
            this.analysisStatus.className = 'analysis-status';
            
            // Auto-trigger analysis if document content is available
            if (combinedContent.trim()) {
                await this.analyzeUploadedDocuments();
            }
            
        } catch (error) {
            console.error('File upload error:', error);
            this.analysisStatus.textContent = `File upload failed: ${error.message}`;
            this.analysisStatus.className = 'analysis-status';
            this.contentSummary.innerHTML = '<div style="line-height: 1.5;"><em>📄 Failed to process files. Please try again.</em></div>';
        }
    }
    
    /* @tweakable helper method to detect and exclude media files from document analysis */
    isMediaFile(file) {
        const mediaExtensions = [
            '.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.3gp', '.m4v',
            '.mp3', '.wav', '.m4a', '.aac', '.flac', '.wma', '.ogg',
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico',
            '.mpg', '.mpeg', '.m2v', '.m4v', '.3gpp', '.asf', '.rm', '.rmvb'
        ];
        
        const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        return mediaExtensions.includes(extension) || file.type.startsWith('video/') || file.type.startsWith('audio/') || file.type.startsWith('image/');
    }
    
    /* @tweakable method to read all file types as documents with enhanced format handling */
    async readDocumentFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    let content = e.target.result;
                    
                    // Handle different document formats
                    if (file.type.includes('text') || this.isTextFile(file.name)) {
                        resolve(content);
                    } else if (file.name.toLowerCase().endsWith('.pdf')) {
                        // For PDF, indicate it's a PDF document (full text extraction would require a PDF library)
                        resolve(`[PDF Document: ${file.name} - ${(file.size / 1024).toFixed(1)} KB]\nNote: PDF text extraction requires additional processing.`);
                    } else if (file.name.toLowerCase().match(/\.(docx?|odt|rtf)$/)) {
                        // For Word/OpenOffice documents
                        resolve(`[Document: ${file.name} - ${(file.size / 1024).toFixed(1)} KB]\nNote: Document text extraction requires additional processing.`);
                    } else if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
                        resolve(`[Media File: ${file.name} - ${(file.size / 1024).toFixed(1)} KB - ${file.type}]\nNote: Media file uploaded for content analysis and reference.`);
                    } else {
                        // Try to read as text anyway
                        resolve(content);
                    }
                } catch (error) {
                    reject(new Error(`Failed to read file: ${file.name}`));
                }
            };
            
            reader.onerror = () => reject(new Error(`File read error: ${file.name}`));
            
            if (file.type.startsWith('text') || this.isTextFile(file.name)) {
                reader.readAsText(file);
            } else {
                // For non-text files, return metadata for analysis
                resolve(`[File: ${file.name} - ${(file.size / 1024).toFixed(1)} KB - ${file.type || 'Unknown type'}]`);
            }
        });
    }
    
    /* @tweakable helper method to identify text-based files for document analysis */
    isTextFile(filename) {
        const textExtensions = [
            '.txt', '.md', '.markdown', '.html', '.htm', '.xml', '.json', '.csv',
            '.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.sass', '.less',
            '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.php', '.rb', '.go',
            '.rs', '.kt', '.swift', '.scala', '.clj', '.hs', '.elm', '.ml',
            '.r', '.m', '.pl', '.lua', '.sh', '.bat', '.ps1', '.vbs',
            '.sql', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
            '.log', '.tex', '.latex', '.bib'
        ];
        
        const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return textExtensions.includes(extension);
    }
    
    /* @tweakable archive extraction method for ZIP and other compressed document files */
    async extractArchiveContent(file) {
        try {
            // Simple archive handling - in a real implementation, you'd use JSZip or similar
            const arrayBuffer = await file.arrayBuffer();
            
            // For now, just return metadata about the archive
            return `[Archive File: ${file.name} - ${(file.size / 1024).toFixed(1)} KB - Contents would be extracted and analyzed here]`;
            
        } catch (error) {
            throw new Error(`Failed to extract archive: ${error.message}`);
        }
    }
    
    /* @tweakable method to analyze uploaded document content specifically */
    async analyzeUploadedDocuments() {
        try {
            const analysisPrompt = `Analyze the following uploaded documentation/files for presentation and streaming purposes:

${this.uploadedContent}

Please provide:
1. Document summary and main topics covered
2. Key information points suitable for presentation
3. Document structure and organization analysis
4. Recommendations for streaming/presenting this content
5. Suggested talking points and script structure
6. Important details that should be highlighted

Focus on extracting actionable insights for content creators and streamers.`;
            
            const response = await this.callAI([
                { role: 'system', content: 'You are a document analysis assistant helping content creators understand uploaded materials for streaming and presentation.' },
                { role: 'user', content: analysisPrompt }
            ]);
            
            this.analysisResults = {
                content: this.uploadedContent,
                type: 'uploaded_documents',
                analysis: response.content
            };
            
            this.contentSummary.innerHTML = `
                <strong>Uploaded Documents Analysis:</strong><br><br>
                ${response.content.replace(/\n/g, '<br>')}
            `;
            
            this.analysisStatus.textContent = 'Document analysis complete';
            this.analysisStatus.className = 'analysis-status';
            
        } catch (error) {
            console.error('Document analysis error:', error);
            this.analysisStatus.textContent = `Document analysis failed: ${error.message}`;
            this.analysisStatus.className = 'analysis-status';
        }
    }
}