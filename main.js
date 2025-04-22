import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Import SpaceEnvironment and SpaceUI
import SpaceEnvironment from './spaceEnvironment.js';
import SpaceUI from './SpaceUI.js';

class NASASuitsApp {
  constructor() {
    console.log('Initializing NASA SUITS Application');
    
    try {
      // Create scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000000);
      
      // Create camera
      this.camera = new THREE.PerspectiveCamera(
        70, 
        window.innerWidth / window.innerHeight, 
        0.01, 
        1000
      );
      this.camera.position.set(0, 1.6, 3);
      
      // Create renderer with specific styling
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true  // Make background transparent
      });
      
      // Ensure renderer is positioned correctly
      this.renderer.domElement.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 1 !important;
      `;
      
      // Renderer setup
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.xr.enabled = true;
      this.renderer.setPixelRatio(window.devicePixelRatio);
      document.body.appendChild(this.renderer.domElement);
      
      // Add VR button
      document.body.appendChild(VRButton.createButton(this.renderer));
      
      // Create orbit controls for non-VR mode
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.target.set(0, 1.6, 0);
      this.controls.update();
      
      // Initialize UI library
      this.ui = new SpaceUI(this.scene, this.camera, this.renderer);
      
      // Initialize space environment with renderer, camera, and scene
      this.spaceEnvironment = new SpaceEnvironment(this.scene, this.camera, this.renderer);
      
      // Initialize UI components
      this.initializeUI();
      
      // Setup VR session event listeners
      this.setupVRSessionListeners();
      
      // Set up window resize handler
      window.addEventListener('resize', this.onWindowResize.bind(this));
      
      // Set up animation loop
      this.renderer.setAnimationLoop(this.animate.bind(this));
      
      // Hide loading indicator
      this.hideLoading();
      
      console.log('NASA SUITS Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NASA SUITS Application:', error);
      this.displayError(error);
    }
  }
  
  // Initialize UI components using the UI library
  initializeUI() {
    console.log('Initializing UI Components');
    
    // Create status panels at the top
    this.statusPanel = this.ui.createStatusPanels('status-panels', {
      position: new THREE.Vector3(0, 0.3, -0.5),
      panels: [
        { title: 'Battery', value: '75%', position: new THREE.Vector3(-0.5, 0, 0) },
        { title: 'O2', value: '75%', position: new THREE.Vector3(0, 0, 0) },
        { title: 'Pressure', value: '14.3psi', position: new THREE.Vector3(0.5, 0, 0) }
      ]
    });
    
    // Create middle info panels
    this.ui.createPanel('distance-panel', {
      position: new THREE.Vector3(-0.3, 0, -0.5),
      texts: [
        { text: "100m", color: "#FFCC00", yOffset: 0.02 },
        { text: "remaining", color: "#FFFFFF", yOffset: -0.02, fontSize: 0.02 }
      ]
    });
    
    this.ui.createPanel('time-panel', {
      position: new THREE.Vector3(0.3, 0, -0.5),
      texts: [
        { text: "15:00 min", color: "#00FF66", yOffset: 0.02 },
        { text: "to Destination", color: "#FFFFFF", yOffset: -0.02, fontSize: 0.02 }
      ]
    });
    
    // Create bottom panels
    this.ui.createPanel('progress-panel', {
      position: new THREE.Vector3(0, -0.2, -0.5),
      texts: [
        { text: "Walked 500m", color: "#FFFFFF" }
      ]
    });
    
    this.ui.createPanel('user-panel', {
      position: new THREE.Vector3(-0.4, -0.3, -0.5),
      texts: [
        { text: "Pilot Neil Armstrong", color: "#FFFFFF" }
      ]
    });
    
    this.ui.createPanel('mode-panel', {
      position: new THREE.Vector3(0.4, -0.3, -0.5),
      texts: [
        { text: "Navigation Mode", color: "#FFFFFF" }
      ],
      highlighted: true
    });
    
    // Create action buttons (initially hidden)
    this.actionButtons = this.ui.createActionButtons('action-buttons', {
      position: new THREE.Vector3(0, -0.1, -0.4),
      buttons: [
        { icon: "⊞", label: "Maps", id: "maps" },
        { icon: "≡", label: "Procedures", id: "procedures" },
        { icon: "⛶", label: "Pictures", id: "pictures" },
        { icon: "⏺", label: "Recording", id: "recording" }
      ],
      visible: false
    });
    
    // Create map modal (initially hidden)
    this.mapModal = this.ui.createMapModal('map-modal', {
      title: 'Maps',
      visible: false
    });
    
    console.log('UI components initialized');
  }
  
  // Toggle action buttons visibility
  toggleActionButtons() {
    if (this.actionButtons) {
      const isVisible = this.actionButtons.toggle();
      console.log('Action buttons visibility:', isVisible ? 'visible' : 'hidden');
      return isVisible;
    }
    return false;
  }
  
  // Toggle map modal visibility
  toggleMapModal() {
    if (this.mapModal) {
      const isVisible = this.mapModal.toggle();
      console.log('Map modal visibility:', isVisible ? 'visible' : 'hidden');
      return isVisible;
    }
    return false;
  }
  
  // Update stats (example function to demonstrate dynamic updates)
  updateStats() {
    if (this.statusPanel) {
      // Randomly update a stat
      const stats = ['Battery', 'O2', 'Pressure'];
      const stat = stats[Math.floor(Math.random() * stats.length)];
      
      let value;
      if (stat === 'Battery') {
        value = Math.floor(Math.random() * 100) + '%';
      } else if (stat === 'O2') {
        value = Math.floor(Math.random() * 100) + '%';
      } else if (stat === 'Pressure') {
        value = (13 + Math.random() * 2).toFixed(1) + 'psi';
      }
      
      console.log(`Updating ${stat} to ${value}`);
      this.statusPanel.updatePanel(stat, value);
    }
  }
  
  setupVRSessionListeners() {
    console.log('Setting up VR session listeners');
    
    // Keep reference to DOM elements for backward compatibility
    const spaceInterface = document.getElementById('space-interface');
    const actionButtons = document.getElementById('vr-action-buttons');
    let actionButtonsVisible = false;
    let pinchCount = 0;
    let lastPinchTime = 0;

    // Ensure the interface is always visible and positioned correctly
    const lockInterfacePosition = () => {
      if (spaceInterface) {
        spaceInterface.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          z-index: 10000 !important;
          pointer-events: none !important;
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
        `;
      }
    };

    // Toggle DOM-based action buttons (for backward compatibility)
    const toggleDOMActionButtons = () => {
      if (actionButtons) {
        actionButtonsVisible = !actionButtonsVisible;
        actionButtons.style.display = actionButtonsVisible ? 'flex' : 'none';
        console.log('Legacy DOM action buttons toggled:', actionButtonsVisible ? 'visible' : 'hidden');
      }
    };

    // Keyboard control for desktop testing
    window.addEventListener('keydown', (event) => {
      // Action buttons toggle
      if (event.code === 'KeyA') {
        console.log('Key A pressed - toggling action buttons');
        this.toggleActionButtons(); // Use new UI library method
      }
      
      // Map key handler
      if (event.code === 'KeyM') {
        console.log('Map key pressed - toggling map');
        this.toggleMapModal(); // Use new UI library method
      }
      
      // Update stats (for testing)
      if (event.code === 'KeyU') {
        console.log('Key U pressed - updating stats');
        this.updateStats();
      }
      
      // Debug key handler
      if (event.code === 'KeyD') {
        console.log('Debug key pressed');
        // Add debug functionality if needed
      }
    });

    // VR Pinch gesture detection
    const checkPinchGesture = (hand) => {
      if (!hand || !hand.joints) return false;
      
      const indexTip = hand.joints['index-finger-tip'];
      const thumbTip = hand.joints['thumb-tip']; // Changed to thumb for standard pinch gesture
      
      if (!indexTip || !thumbTip) return false;
      
      const distance = indexTip.position.distanceTo(thumbTip.position);
      return distance < 0.02; // 2cm threshold
    };

    // VR Session Start
    this.renderer.xr.addEventListener('sessionstart', () => {
      console.log('VR Session Started');
      lockInterfacePosition(); // For backward compatibility with DOM UI

      // Hand tracking for gesture control
      const session = this.renderer.xr.getSession();
      
      const gestureHandler = () => {
        const hands = session.inputSources.filter(source => source.hand);
        
        hands.forEach((source, index) => {
          const hand = source.hand;
          const isPinching = checkPinchGesture(hand);
          const isLeft = index === 0; // Assuming first hand is left
          
          if (isPinching) {
            const now = Date.now();
            if (now - lastPinchTime > 500) { // Prevent rapid firing
              lastPinchTime = now;
              
              // Left hand pinch toggles action buttons, right hand toggles map
              if (isLeft) {
                this.toggleActionButtons();
              } else {
                this.toggleMapModal();
              }
            }
          }
        });
      };

      // Use animation frame for continuous gesture tracking
      const trackGestures = () => {
        if (this.renderer.xr.isPresenting) {
          gestureHandler();
          this.gestureTrackingFrame = requestAnimationFrame(trackGestures);
        }
      };

      trackGestures();
    });

    // VR Session End
    this.renderer.xr.addEventListener('sessionend', () => {
      console.log('VR Session Ended');
      lockInterfacePosition();
      
      // Cancel gesture tracking
      if (this.gestureTrackingFrame) {
        cancelAnimationFrame(this.gestureTrackingFrame);
      }
      
      // Reset button visibility (DOM-based, for backward compatibility)
      if (actionButtons) {
        actionButtons.style.display = 'none';
      }
      actionButtonsVisible = false;
    });

    // Initial lock (for non-VR mode DOM elements)
    lockInterfacePosition();
    
    // Map button event listener (DOM-based, for backward compatibility)
    const mapButton = document.getElementById('map-button');
    if (mapButton) {
      mapButton.addEventListener('click', () => {
        console.log('Map button clicked');
        this.toggleMapModal();
      });
    }
  }

  // Animation loop
  animate() {
    // Update controls
    if (this.controls) {
      this.controls.update();
    }
    
    // Update UI position to follow camera
    if (this.ui) {
      this.ui.updatePosition(this.renderer.xr.isPresenting);
    }
    
    // Update environment
    if (this.spaceEnvironment) {
      this.spaceEnvironment.update();
    }
    
    // Render the scene - delegated to renderer's animation loop
  }
  
  // Handle window resize
  onWindowResize() {
    // Skip resizing if in VR mode to avoid errors
    if (this.renderer.xr.isPresenting) {
      console.log('Skipping resize during VR session');
      return;
    }
    
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  // Hide loading indicator
  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
  }
  
  // Display error to user
  displayError(error) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
      errorDiv.textContent = `Error: ${error.message}`;
      errorDiv.style.display = 'block';
    }
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new NASASuitsApp();
});

export default NASASuitsApp;