export default class AudioManager {
    constructor(app) {
        this.app = app;
        this.audioContext = null;
        this.analyser = null;
        this.animationFrameId = null;
        this.audioVisualizer = document.getElementById('audioVisualizer');
    }
    
    setupAudioVisualization(mediaStream) {
        // Only initialize when we actually have a media stream and the
        // audio context hasn't been created yet. The previous implementation
        // used a logical OR which attempted to initialize even when the
        // media stream was missing, leading to runtime errors when trying to
        // create a MediaStreamSource with `null`.
        if (mediaStream && !this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = this.audioContext.createMediaStreamSource(mediaStream);
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 256;
                source.connect(this.analyser);

                this.drawAudioVisualization();
                this.audioVisualizer.style.display = 'block';
            } catch (error) {
                console.error('Error setting up audio visualization:', error);
            }
        }
    }
    
    drawAudioVisualization() {
        if (!this.analyser) return;

        // Cancel any existing loop before starting a new one to avoid
        // multiple animation frames running in parallel.
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        const canvas = this.audioVisualizer;
        const ctx = canvas.getContext('2d');
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        canvas.width = 200;
        canvas.height = 60;

        const draw = () => {
            if (!this.analyser) return;
            this.animationFrameId = requestAnimationFrame(draw);

            this.analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * canvas.height;

                const red = barHeight + 25 * (i / bufferLength);
                const green = 250 * (i / bufferLength);
                const blue = 50;

                ctx.fillStyle = `rgb(${red},${green},${blue})`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();
    }

    toggleVisualization(enabled) {
        if (enabled) {
            this.audioVisualizer.style.display = 'block';
            // Restart drawing if the visualizer was previously disabled
            // but the analyser still exists.
            if (this.analyser && !this.animationFrameId) {
                this.drawAudioVisualization();
            }
        } else {
            this.audioVisualizer.style.display = 'none';
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        }
    }

    cleanup() {
        this.toggleVisualization(false);

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.analyser = null;
    }
}

