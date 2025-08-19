export default class CursorEffectsManager {
    constructor(app) {
        this.app = app;
        this.laserTrailEnabled = true;
        this.clickEffectsEnabled = true;
        this.clickSoundsEnabled = true;
        
                this.baseTrailParticleLifetime = 600;
                this.baseTrailSpawnRate = 16;
                this.maxTrailParticles = 50;
        
        this.clickEffectDuration = 600; 
        this.sparkleRotationSpeed = 360; 
        
        this.baseSoundVolume = 0.3; 
        this.clickSoundFrequencies = [800, 1000, 1200]; 
        this.soundFadeDuration = 200; 
        
        this.lastMousePosition = { x: 0, y: 0 };
        this.trailParticles = [];
        this.lastTrailSpawn = 0;
        this.audioContext = null;
        
        this.initializeElements();
        this.bindEvents();
        this.initializeAudioContext();
        this.startTrailAnimation();
    }
    
    initializeElements() {
        this.enableLaserTrail = document.getElementById('enableLaserTrail');
        this.trailColor = document.getElementById('trailColor');
        this.trailIntensity = document.getElementById('trailIntensity');
        this.trailIntensityValue = document.getElementById('trailIntensityValue');
        this.trailLength = document.getElementById('trailLength');
        this.trailLengthValue = document.getElementById('trailLengthValue');
        
        this.enableClickEffects = document.getElementById('enableClickEffects');
        this.enableClickSounds = document.getElementById('enableClickSounds');
        this.clickEffectStyle = document.getElementById('clickEffectStyle');
        this.soundVolume = document.getElementById('soundVolume');
        this.soundVolumeValue = document.getElementById('soundVolumeValue');
    }
    
    bindEvents() {
        this.enableLaserTrail.addEventListener('change', () => {
            this.laserTrailEnabled = this.enableLaserTrail.checked;
            if (!this.laserTrailEnabled) {
                this.clearTrailParticles();
            }
        });
        
        this.trailIntensity.addEventListener('input', () => {
            this.trailIntensityValue.textContent = this.trailIntensity.value;
        });
        
        this.trailLength.addEventListener('input', () => {
            this.trailLengthValue.textContent = this.trailLength.value;
        });
        
        this.enableClickEffects.addEventListener('change', () => {
            this.clickEffectsEnabled = this.enableClickEffects.checked;
        });
        
        this.enableClickSounds.addEventListener('change', () => {
            this.clickSoundsEnabled = this.enableClickSounds.checked;
        });
        
        this.soundVolume.addEventListener('input', () => {
            this.soundVolumeValue.textContent = `${this.soundVolume.value}%`;
        });
        
        document.addEventListener('mousemove', (e) => {
            this.lastMousePosition.x = e.clientX;
            this.lastMousePosition.y = e.clientY;
        });
        
        document.addEventListener('mousedown', (e) => {
            if (this.clickEffectsEnabled) {
                this.createClickEffect(e.clientX, e.clientY);
            }
            if (this.clickSoundsEnabled) {
                this.playClickSound();
            }
        });
    }
    
    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }
    
    startTrailAnimation() {
        const animate = (currentTime) => {
            if (this.laserTrailEnabled) {
                                const trailLength = parseInt(this.trailLength.value);
                const dynamicSpawnRate = this.baseTrailSpawnRate * (20 / trailLength);
                
                if (currentTime - this.lastTrailSpawn > dynamicSpawnRate) {
                    this.createTrailParticle();
                    this.lastTrailSpawn = currentTime;
                }
            }
            
            this.cleanupTrailParticles();
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
    
    createTrailParticle() {
        const trailLength = parseInt(this.trailLength.value);
        if (this.trailParticles.length >= trailLength) {
            const oldParticle = this.trailParticles.shift();
            if (oldParticle && oldParticle.element.parentNode) {
                oldParticle.element.remove();
            }
        }
        
        const particle = document.createElement('div');
        particle.className = `laser-trail-particle ${this.trailColor.value}`;
        
                const offsetRange = 8;
        const randomOffsetX = (Math.random() - 0.5) * offsetRange;
        const randomOffsetY = (Math.random() - 0.5) * offsetRange;
        
        const intensity = parseInt(this.trailIntensity.value);
        
                const sizeScale = (intensity / 10) * 1.2;
                const opacityMultiplier = Math.min(1, intensity / 8);
                const glowIntensity = intensity * 2;
        
        particle.style.left = `${this.lastMousePosition.x + randomOffsetX}px`;
        particle.style.top = `${this.lastMousePosition.y + randomOffsetY}px`;
        particle.style.transform = `scale(${sizeScale})`;
        particle.style.opacity = opacityMultiplier;
        
        // Enhance glow effect based on intensity
        if (this.trailColor.value !== 'rainbow') {
            const currentColor = this.getTrailColor();
            particle.style.boxShadow = `0 0 ${glowIntensity * 2}px ${currentColor}, 0 0 ${glowIntensity * 4}px ${currentColor}`;
        }
        
        if (this.trailColor.value === 'rainbow') {
            particle.style.setProperty('--rainbow-hue', Math.random() * 360);
        }
        
        document.body.appendChild(particle);
        
                const dynamicLifetime = this.baseTrailParticleLifetime * (trailLength / 20);
        
        const particleData = {
            element: particle,
            createdAt: Date.now(),
            lifetime: dynamicLifetime
        };
        
        this.trailParticles.push(particleData);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.remove();
            }
        }, dynamicLifetime);
    }
    
        getTrailColor() {
        const colorMap = {
            cyan: '#00ffff',
            purple: '#ff00ff', 
            green: '#00ff00',
            red: '#ff0000',
            yellow: '#ffff00'
        };
        return colorMap[this.trailColor.value] || '#00ffff';
    }
    
    createClickEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = `click-effect ${this.clickEffectStyle.value}`;
        
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        
        const effectColors = {
            ripple: '#00ffff',
            explosion: '#ff6b6b', 
            sparkle: '#ffff00',
            pulse: '#667eea'
        };
        
        const selectedColor = effectColors[this.clickEffectStyle.value] || '#00ffff';
        
        if (this.clickEffectStyle.value === 'ripple') {
            effect.style.borderColor = selectedColor;
        } else if (this.clickEffectStyle.value === 'explosion') {
            effect.style.background = `radial-gradient(circle, ${selectedColor} 0%, transparent 70%)`;
        }
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.remove();
            }
        }, this.clickEffectDuration);
    }
    
    playClickSound() {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            const frequency = this.clickSoundFrequencies[Math.floor(Math.random() * this.clickSoundFrequencies.length)];
            const volume = this.baseSoundVolume * (parseInt(this.soundVolume.value) / 100);
            const duration = 0.1; 
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            
        } catch (error) {
            console.warn('Error playing click sound:', error);
        }
    }
    
    cleanupTrailParticles() {
        const now = Date.now();
        this.trailParticles = this.trailParticles.filter(particle => {
            const lifetime = particle.lifetime || this.baseTrailParticleLifetime;
            if (now - particle.createdAt > lifetime) {
                if (particle.element.parentNode) {
                    particle.element.remove();
                }
                return false;
            }
            return true;
        });
    }
    
    clearTrailParticles() {
        this.trailParticles.forEach(particle => {
            if (particle.element.parentNode) {
                particle.element.remove();
            }
        });
        this.trailParticles = [];
    }
    
    cleanup() {
        this.clearTrailParticles();
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
    }
}