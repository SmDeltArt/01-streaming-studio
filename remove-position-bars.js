// Simple script to remove position bars if they cause conflicts
// Run this in browser console if position bars are problematic

function removePrecisePositionBars() {
    console.log('Removing precise position bars...');
    
    // Remove the HTML controls
    const preciseControls = document.querySelector('.precise-position-controls');
    if (preciseControls) {
        preciseControls.remove();
        console.log('✅ Position controls removed from DOM');
    }
    
    // Remove CSS styling
    const style = document.createElement('style');
    style.textContent = `
        .precise-position-controls {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
    
    // Reset camera manager to basic mode
    if (window.app && window.app.cameraManager) {
        const cm = window.app.cameraManager;
        
        // Disable precise positioning
        if (cm.disablePrecisePositioning) {
            cm.disablePrecisePositioning();
        }
        
        // Reset to top-right position
        const positionSelect = document.getElementById('cameraPosition');
        if (positionSelect) {
            positionSelect.value = 'top-right';
            cm.updateCameraPosition();
        }
        
        console.log('✅ Camera reset to basic positioning mode');
    }
    
    console.log('🎯 Position bars successfully removed! Camera now uses preset positions only.');
}

// Auto-run if there are errors
try {
    // Check if position bars are causing issues
    const iframe = document.querySelector('#contentFrame');
    const xPos = document.getElementById('cameraXPosition');
    const yPos = document.getElementById('cameraYPosition');
    
    if (!iframe || !xPos || !yPos) {
        console.log('🚨 Position system incomplete - auto-removing bars');
        removePrecisePositionBars();
    }
} catch (error) {
    console.log('🚨 Position system error detected - auto-removing bars');
    removePrecisePositionBars();
}

// Export function for manual use
window.removePrecisePositionBars = removePrecisePositionBars;
