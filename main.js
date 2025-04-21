import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import SpaceEnvironment from './spaceEnvironment.js';
import UIManager from './uiManager.js';

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
      
      // Initialize space environment
      this.spaceEnvironment = new SpaceEnvironment();
      
      // Initialize UI manager
      this.uiManager = new UIManager(this.scene, this.camera, this.renderer);
      
      // Setup VR session event listeners
      this.setupVRSessionListeners();
      
      // Set up window resize handler
      window.addEventListener('resize', this.onWindowResize.bind(this));
      
      // Set up animation loop
      this.renderer.setAnimationLoop(this.animate.bind(this));
      
      // Hide loading indicator
      this.hideLoading();

      // Add mouse controls
      this.addMouseControls();
      
      console.log('NASA SUITS Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NASA SUITS Application:', error);
      this.displayError(error);
    }
  }
  
  setupVRSessionListeners() {
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
  
    // Toggle action buttons visibility
    const toggleActionButtons = () => {
      if (actionButtons) {
        actionButtonsVisible = !actionButtonsVisible;
        actionButtons.style.display = actionButtonsVisible ? 'flex' : 'none';
      }
    };
  
       // Keyboard control for desktop testing
      window.addEventListener('keydown', (event) => {
        // Check if not in VR mode
        if (!this.renderer.xr.isPresenting && event.code === 'KeyA') {
          toggleActionButtons();
        }
      });
  
    // VR Pinch gesture detection
    const checkPinchGesture = (hand) => {
      if (!hand || !hand.joints) return false;
      
      const indexTip = hand.joints['index-finger-tip'];
      const middleTip = hand.joints['middle-finger-tip'];
      
      if (!indexTip || !middleTip) return false;
      
      const distance = indexTip.position.distanceTo(middleTip.position);
      return distance < 0.02; // 2cm threshold
    };
  
    // VR Session Start
    this.renderer.xr.addEventListener('sessionstart', () => {
      console.log('VR Session Started');
      lockInterfacePosition();
  
      // Hand tracking for gesture control
      const session = this.renderer.xr.getSession();
      
      const gestureHandler = () => {
        const hands = session.inputSources.filter(source => source.hand);
        
        hands.forEach(hand => {
          const isPinching = checkPinchGesture(hand.hand);
          
          if (isPinching) {
            const now = Date.now();
            if (now - lastPinchTime > 500) { // Prevent rapid firing
              pinchCount++;
              lastPinchTime = now;
              
              if (pinchCount === 2) {
                toggleActionButtons();
                pinchCount = 0;
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
      
      // Reset button visibility
      if (actionButtons) {
        actionButtons.style.display = 'none';
      }
      actionButtonsVisible = false;
      pinchCount = 0;
    });
  
    // Initial lock (for non-VR mode as well)
    lockInterfacePosition();
  }

  // Animation loop
  animate() {
    // Update controls
    if (this.controls) {
      this.controls.update();
    }
    
    // Update UI
    if (this.uiManager) {
      this.uiManager.update();
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
  
  // Handle window resize
  onWindowResize() {
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

  // Add mouse controls for non-VR navigation
  addMouseControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.screenSpacePanning = false;
    this.controls.maxPolarAngle = Math.PI / 2;
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new NASASuitsApp();
});

export default NASASuitsApp;