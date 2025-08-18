export default class AudioManager {
    constructor(app) {
        this.app = app;
        this.audioContext = null;
        this.analyser = null;
        this.audioVisualizer = document.getElementById('audioVisualizer');
    }
    
    setupAudioVisualization(mediaStream) {
        if (!mediaStream || !this.audioContext) {
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
        
        const canvas = this.audioVisualizer;
        const ctx = canvas.getContext('2d');
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        canvas.width = 200;
        canvas.height = 60;
        
        const draw = () => {
            requestAnimationFrame(draw);
            
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
        } else {
            this.audioVisualizer.style.display = 'none';
        }
    }
    
    cleanup() {
        this.audioVisualizer.style.display = 'none';
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}

