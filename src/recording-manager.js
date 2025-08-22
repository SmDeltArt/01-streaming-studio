
import { captureIframeStream } from './iframe-capture.js';

import { applyRegionCrop as applyStreamCrop, cropBlobToRegion } from './crop-utils.js';

import { applyRegionCrop, cropBlobToRegion } from './crop-utils.js';

import { applyRegionCrop, cropBlobToRegion } from './crop-utils.js';

import { applyRegionCrop } from './crop-utils.js';



export default class RecordingManager {
    constructor(app) {
        this.app = app;
        this.isRecording = false;
                this.isPaused = false;
        this.recordingStartTime = null;
        this.pausedDuration = 0;
        this.recordingTimerInterval = null;
        this.websimRecordingSession = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.lastRegion = null;
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        this.recordingSize = document.getElementById('recordingSize');
        this.currentSize = document.getElementById('currentSize');
        this.frameRateSelect = document.getElementById('frameRateSelect');
        this.recordingFormat = document.getElementById('recordingFormat');
        this.recordingStatus = document.getElementById('recordingStatus');
        this.recordingIndicator = document.getElementById('recordingIndicator');
        this.recordingStatusText = document.getElementById('recordingStatusText');
        this.recordingTimer = document.getElementById('recordingTimer');
        this.pauseBtn = document.getElementById('pauseBtn');
    }
    
    bindEvents() {
        this.recordingSize.addEventListener('change', () => this.updateRecordingSize());
        this.frameRateSelect.addEventListener('change', () => this.updateRecordingSettings());
        this.recordingFormat.addEventListener('change', () => this.updateRecordingSettings());
    }

    getScaledContentRegion(width, height) {
        const rect = this.app.contentDisplay.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        return {
            x: Math.round(rect.left * dpr),
            y: Math.round(rect.top * dpr),
            width: Math.round((width ?? rect.width) * dpr),
            height: Math.round((height ?? rect.height) * dpr)
        };
    }
    
    updateRecordingSize() {
        const selectedSize = this.recordingSize.value;
        const contentArea = document.querySelector('.content-area');
        
        if (selectedSize === 'auto') {
            contentArea.classList.remove('sized');
            contentArea.style.removeProperty('--recording-width');
            contentArea.style.removeProperty('--recording-height');
            this.currentSize.textContent = 'Auto';
        } else {
            const [width, height] = selectedSize.split('x').map(s => parseInt(s));
            
            contentArea.classList.add('sized');
            contentArea.style.setProperty('--recording-width', `${width}px`);
            contentArea.style.setProperty('--recording-height', `${height}px`);
            
            this.currentSize.textContent = `${width} × ${height}`;
            
            this.app.cameraManager.updateCameraPosition();
        }
        
        this.app.updateStatus(`Recording Size: ${this.currentSize.textContent}`, 'ready');
    }
    
    updateRecordingSettings() {
        const frameRate = this.frameRateSelect.value;
        const format = this.recordingFormat.value;
        console.log(`Recording settings updated: ${frameRate}fps, ${format} format`);
    }
    
        async togglePause() {
        if (!this.isRecording || !this.mediaRecorder) return;
        
        if (this.isPaused) {
            // Resume recording
            this.mediaRecorder.resume();
            this.isPaused = false;
            this.updateRecordingStatus('recording', 'Recording...');
            this.pauseBtn.querySelector('.label').innerHTML = 'Pause <span class="shortcut">(P)</span>';
            this.pauseBtn.querySelector('.icon').textContent = '⏸️';
        } else {
            this.mediaRecorder.pause();
            this.isPaused = true;
            this.updateRecordingStatus('paused', 'Recording paused');
            this.pauseBtn.querySelector('.label').innerHTML = 'Resume <span class="shortcut">(P)</span>';
            this.pauseBtn.querySelector('.icon').textContent = '▶️';
        }
    }
    
    async toggleRecording() {
        if (!this.isRecording) {
            await this.startRecording();
        } else {
            await this.stopRecording();
        }
    }
    
    async startRecording(options = {}) {
        try {
            this.clearError();
            this.updateRecordingStatus('preparing', 'Preparing to record...');
            
                        const videoQuality = 'high'; // 'low', 'medium', 'high'
            const videoBitrate = 5000000; // 5 Mbps default
            const audioBitrate = 128000; // 128 kbps default
            
                        const frameRate = parseInt(this.frameRateSelect.value);
                        const format = this.recordingFormat.value;
            const recordingSize = this.recordingSize.value;
            
            let width, height;
            const contentRect = this.app.contentDisplay.getBoundingClientRect();
            if (recordingSize === 'auto') {
                width = Math.round(contentRect.width);
                height = Math.round(contentRect.height);
            } else {
                [width, height] = recordingSize.split('x').map(s => parseInt(s));

            }

            const region = this.getScaledContentRegion(width, height);
            this.lastRegion = region;

            const captureWidth = region.x + region.width;
            const captureHeight = region.y + region.height;


            }

            const region = this.getScaledContentRegion(width, height);
            this.lastRegion = region;

            const captureWidth = region.x + region.width;
            const captureHeight = region.y + region.height;



                const contentRect = this.app.contentDisplay.getBoundingClientRect();
                region = {
                    x: Math.round(contentRect.left),
                    y: Math.round(contentRect.top),
                    width: width,
                    height: height
                };
            }
            this.lastRegion = region;
            


                        const screenCaptureOptions = {
                video: {
                    mediaSource: 'screen',
                    width: { ideal: captureWidth, max: captureWidth },
                    height: { ideal: captureHeight, max: captureHeight },
                    frameRate: { ideal: frameRate, max: frameRate }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 48000
                }
            };
            
            // Try to get iframe capture stream first if requested
            let captureStream = null;
            const { source } = options;
            if (source === 'iframe') {
                captureStream = await captureIframeStream(this.app.contentFrame, true);
            }

            // Fallback to screen capture if iframe capture is not available
            if (!captureStream) {
                if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                    captureStream = await navigator.mediaDevices.getDisplayMedia(screenCaptureOptions);
                } else {
                    throw new Error('Screen capture not supported in this browser');
                }
            }



            captureStream = await applyRegionCrop(

                captureStream,
                region,
                this.app.contentDisplay,
                frameRate
            );


            if (region) {
                captureStream = await applyRegionCrop(
                    captureStream,
                    region,
                    this.app.contentDisplay,
                    frameRate
                );
            }



            // Add camera and microphone streams if available
            if (this.app.cameraManager.mediaStream) {
                const videoTrack = this.app.cameraManager.mediaStream.getVideoTracks()[0];
                const audioTrack = this.app.cameraManager.mediaStream.getAudioTracks()[0];
                
                if (videoTrack && videoTrack.enabled) {
                    captureStream.addTrack(videoTrack);
                }
                if (audioTrack && audioTrack.enabled) {
                    captureStream.addTrack(audioTrack);
                }
            }
            
                        const mimeType = format === 'webm' ? 'video/webm;codecs=vp9' : 
                           format === 'mp4' ? 'video/mp4;codecs=h264' : 'video/webm';
            
            const recordingOptions = {
                mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm',
                videoBitsPerSecond: videoBitrate,
                audioBitsPerSecond: audioBitrate
            };
            
            this.mediaRecorder = new MediaRecorder(captureStream, recordingOptions);
            this.recordedChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };
            
            this.mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                this.showError('Recording Error', 'Failed to record video: ' + event.error.message);
            };
            
                        const dataCollectionInterval = 1000; // milliseconds
            this.mediaRecorder.start(dataCollectionInterval);
            
            this.websimRecordingSession = 'local-' + Date.now();
            this.isRecording = true;
            this.isPaused = false;
            this.app.isRecording = true;
            this.recordingStartTime = Date.now();
            this.pausedDuration = 0;
            
            this.updateRecordingStatus('recording', 'Recording...');
            this.app.recordBtn.setAttribute('data-recording', 'true');
            this.app.recordBtn.querySelector('.label').innerHTML = 'Stop Recording <span class="shortcut">(R)</span>';
            this.app.recordBtn.querySelector('.icon').textContent = '⏹️';
            
            // Show and enable pause button
            if (this.pauseBtn) {
                this.pauseBtn.style.display = 'flex';
                this.pauseBtn.disabled = false;
            }
            
            this.app.stopBtn.disabled = false;
            this.recordingTimer.style.display = 'inline';
            
            this.startRecordingTimer();
            
            console.log('Screen recording started successfully');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            this.showError('Recording Error', error.message || 'Failed to start screen recording. Please check permissions.');
            this.updateRecordingStatus('error', 'Recording failed');
        }
    }
    
    async stopRecording() {
        try {
            this.updateRecordingStatus('stopping', 'Stopping recording...');
            
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
            }
            
            // Stop all tracks to free up resources
            if (this.mediaRecorder && this.mediaRecorder.stream) {
                this.mediaRecorder.stream.getTracks().forEach(track => {
                    if (track.kind === 'video' && track.label.includes('screen')) {
                        track.stop();
                    }
                });
            }
            
        } catch (error) {
            console.error('Error stopping recording:', error);
            this.showError('Stop Recording Error', error.message || 'Failed to stop recording properly.');
            this.resetRecordingState();
        }
    }
    
    processRecording() {
        try {
            if (this.recordedChunks.length === 0) {
                throw new Error('No recording data available');
            }
            
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const format = this.recordingFormat.value;
            const filename = `websim-recording-${timestamp}.${format}`;
            
            const blob = new Blob(this.recordedChunks, {
                type: format === 'webm' ? 'video/webm' : 'video/mp4'
            });
            
            const url = URL.createObjectURL(blob);
            
            this.updateRecordingStatus('completed', 'Recording saved');
            this.showRecordingComplete(url, filename, blob);
            this.resetRecordingState();
            
        } catch (error) {
            console.error('Error processing recording:', error);
            this.showError('Processing Error', 'Failed to process recording data');
            this.resetRecordingState();
        }
    }
    
    resetRecordingState() {
        this.isRecording = false;
        this.isPaused = false;
        this.app.isRecording = false;
        this.websimRecordingSession = null;
        this.recordingStartTime = null;
        this.pausedDuration = 0;
        
        if (this.recordingTimerInterval) {
            clearInterval(this.recordingTimerInterval);
            this.recordingTimerInterval = null;
        }
        
        if (this.app.recordBtn) {
            this.app.recordBtn.setAttribute('data-recording', 'false');
            const labelElement = this.app.recordBtn.querySelector('.label');
            const iconElement = this.app.recordBtn.querySelector('.icon');
            if (labelElement) labelElement.innerHTML = 'Start Recording <span class="shortcut">(R)</span>';
            if (iconElement) iconElement.textContent = '⏺️';
        }
        
        // Hide and disable pause button
        if (this.pauseBtn) {
            this.pauseBtn.style.display = 'none';
            this.pauseBtn.disabled = true;
            this.pauseBtn.querySelector('.label').innerHTML = 'Pause <span class="shortcut">(P)</span>';
            this.pauseBtn.querySelector('.icon').textContent = '⏸️';
        }
        
        if (this.app.stopBtn) {
            this.app.stopBtn.disabled = true;
        }
        
        if (this.recordingTimer) {
            this.recordingTimer.style.display = 'none';
        }

        this.lastRegion = null;

        setTimeout(() => {
            this.updateRecordingStatus('ready', 'Ready to Record');
        }, 2000);
    }
    
    startRecordingTimer() {
        this.recordingTimerInterval = setInterval(() => {
            if (this.recordingStartTime) {
                const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
                const seconds = (elapsed % 60).toString().padStart(2, '0');
                this.recordingTimer.textContent = `${minutes}:${seconds}`;
            }
        }, 1000);
    }
    
    updateRecordingStatus(status, message) {
        this.recordingStatusText.textContent = message;
        this.recordingIndicator.className = `status-indicator ${status}`;
    }
    
    showRecordingComplete(recordingUrl, filename, blob) {
        const notification = document.createElement('div');
        notification.className = 'recording-complete-notification';
        
                const notificationDuration = 15000; // milliseconds
        
                const enableAutoCleanup = true;
        
        notification.innerHTML = `
            <div class="notification-content">
                <h4>🎉 Recording Complete!</h4>
                <p>Your screen recording has been saved successfully.</p>
                <div class="recording-actions">
                    <button class="same-frame-btn" data-url="${recordingUrl}">
                        🔲 Same Frame Only
                    </button>
                    <a href="${recordingUrl}" download="${filename}" class="download-btn">
                        📥 Download Video (${(blob.size / (1024*1024)).toFixed(1)} MB)
                    </a>
                    <button class="preview-btn" data-url="${recordingUrl}">
                        👁️ Preview
                    </button>
                    <button class="close-btn" data-url="${recordingUrl}">
                        ✕ Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        const sameFrameBtn = notification.querySelector('.same-frame-btn');
        const previewBtn = notification.querySelector('.preview-btn');
        const closeBtn = notification.querySelector('.close-btn');

        sameFrameBtn.addEventListener('click', async () => {
            try {

                const region = this.lastRegion || this.getScaledContentRegion();


                const region = this.lastRegion || this.getScaledContentRegion();

                const region = this.lastRegion || this.app.contentDisplay?.getBoundingClientRect();


                const cropped = await cropBlobToRegion(blob, region);
                const url = URL.createObjectURL(cropped);
                const link = document.createElement('a');
                const ext = filename.substring(filename.lastIndexOf('.'));
                link.href = url;
                link.download = filename.replace(ext, `-frame${ext}`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error('Failed to crop recording:', err);
            }
        });
        
        previewBtn.addEventListener('click', () => {
            window.open(recordingUrl, '_blank');
        });
        
        closeBtn.addEventListener('click', () => {
            this.cleanupRecordingNotification(notification, recordingUrl);
        });
        if (enableAutoCleanup) {
                        setTimeout(() => {
                if (notification.parentElement) {
                    this.cleanupRecordingNotification(notification, recordingUrl);
                }
            }, notificationDuration);
        }
    }
    
    cleanupRecordingNotification(notification, recordingUrl) {
        try {
            if (notification && notification.parentElement) {
                notification.remove();
            }
            if (recordingUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
                URL.revokeObjectURL(recordingUrl);
            }
        } catch (error) {
            console.warn('Error cleaning up recording notification:', error);
        }
    }
    
    showError(title, message) {
        let errorDiv = document.querySelector('.recording-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'recording-error';
            this.recordingStatus.parentElement.appendChild(errorDiv);
        }
        
        errorDiv.innerHTML = `
            <div class="error-title">${title}</div>
            <div class="error-message">${message}</div>
        `;
        
        errorDiv.classList.add('show');
        
        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 5000);
    }
    
    clearError() {
        const errorDiv = document.querySelector('.recording-error');
        if (errorDiv) {
            errorDiv.classList.remove('show');
        }
    }
}