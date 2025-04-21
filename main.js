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
      
      // Create renderer
      // In your main.js constructor
      // Create renderer
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true  // Make background transparent
      });
      this.renderer.domElement.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        z-index: 1 !important;
      `;
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
      
      // Create WebXR UI Layer
      this.createWebXRUILayer();
      
      // Set up window resize handler
      window.addEventListener('resize', this.onWindowResize.bind(this));
      
      // Set up animation loop
      this.renderer.setAnimationLoop(this.animate.bind(this));
      
      // Hide loading indicator
      this.hideLoading();

      this.addMouseControls();

      
      console.log('NASA SUITS Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NASA SUITS Application:', error);
      this.displayError(error);
    }
  }
  
  // // Create WebXR UI Layer
  // createWebXRUILayer() {
  //   const uiLayer = document.createElement('div');
  //   uiLayer.id = 'webxr-ui-layer';
  //   uiLayer.style.position = 'fixed';
  //   uiLayer.style.top = '0';
  //   uiLayer.style.left = '0';
  //   uiLayer.style.width = '100%';
  //   uiLayer.style.pointerEvents = 'none';
  //   uiLayer.style.zIndex = '10';
  //   uiLayer.style.display = 'none'; // Initially hidden
    
  //   // Create status panels
  //   const createStatusPanel = (text, color = 'white') => {
  //     const panel = document.createElement('div');
  //     panel.style.backgroundColor = 'rgba(26, 26, 26, 0.8)';
  //     panel.style.color = color;
  //     panel.style.padding = '10px';
  //     panel.style.margin = '10px';
  //     panel.style.borderRadius = '5px';
  //     panel.style.display = 'inline-block';
  //     panel.textContent = text;
  //     return panel;
  //   };
    
  //   // Top row status panels
  //   const batteryPanel = createStatusPanel('Battery: 75%');
  //   const o2Panel = createStatusPanel('O2: 75%');
  //   const pressurePanel = createStatusPanel('Pressure: 14.3psi');
    
  //   // Middle info panels
  //   const distancePanel = createStatusPanel('100m remaining', '#FFCC00');
  //   const timePanel = createStatusPanel('15:00 min to Destination', '#00FF66');
    
  //   // Bottom panels
  //   const distanceWalkedPanel = createStatusPanel('Walked 500m');
  //   const pilotPanel = createStatusPanel('Pilot Neil Armstrong');
  //   const navigationPanel = createStatusPanel('Navigation Mode', '#00FF66');
    
  //   // Arrange panels
  //   const topRowContainer = document.createElement('div');
  //   topRowContainer.style.display = 'flex';
  //   topRowContainer.style.justifyContent = 'space-between';
  //   topRowContainer.appendChild(batteryPanel);
  //   topRowContainer.appendChild(o2Panel);
  //   topRowContainer.appendChild(pressurePanel);
    
  //   const middleRowContainer = document.createElement('div');
  //   middleRowContainer.style.display = 'flex';
  //   middleRowContainer.style.justifyContent = 'space-between';
  //   middleRowContainer.appendChild(distancePanel);
  //   middleRowContainer.appendChild(timePanel);
    
  //   const bottomRowContainer = document.createElement('div');
  //   bottomRowContainer.style.display = 'flex';
  //   bottomRowContainer.style.justifyContent = 'space-between';
  //   bottomRowContainer.appendChild(distanceWalkedPanel);
  //   bottomRowContainer.appendChild(pilotPanel);
  //   bottomRowContainer.appendChild(navigationPanel);
    
  //   // Add containers to UI layer
  //   uiLayer.appendChild(topRowContainer);
  //   uiLayer.appendChild(middleRowContainer);
  //   uiLayer.appendChild(bottomRowContainer);
    
  //   // Add to document
  //   document.body.appendChild(uiLayer);
    
  //   // In main.js, modify the VR session event listeners
  //   this.renderer.xr.addEventListener('sessionstart', () => {
  //     console.log('VR Session Started');
  //     console.log('WebXR UI Layer:', uiLayer);
  //     console.log('Display Style Before:', uiLayer.style.display);
  //     uiLayer.style.display = 'block';
  //     console.log('Display Style After:', uiLayer.style.display);
  //   });

  //   this.renderer.xr.addEventListener('sessionend', () => {
  //     console.log('VR Session Ended');
  //     uiLayer.style.display = 'none';
  //   });
  // }
  createWebXRUILayer() {
    // Create a full-screen UI layer
    const uiLayer = document.createElement('div');
    uiLayer.id = 'webxr-ui-layer';
    
    // Ensure the UI layer is on top of the Three.js canvas
    uiLayer.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 9999 !important;  // High z-index to ensure it's on top
      pointer-events: none !important;
      display: none !important;
      background: transparent !important;
      opacity: 1 !important;
      visibility: visible !important;
      overflow: hidden !important;
    `;
    
    // Create a container for panels with absolute positioning
    const panelsContainer = document.createElement('div');
    panelsContainer.style.cssText = `
      position: absolute !important;
      top: 50px !important;  // Distance from top
      left: 50px !important; // Distance from left
      display: flex !important;
      flex-direction: column !important;
      background: rgba(0,0,0,0.7) !important;
      padding: 20px !important;
      border-radius: 10px !important;
      color: white !important;
      z-index: 10000 !important;  // Even higher z-index
    `;
    
    // Create a status panel function
    const createStatusPanel = (text, color = 'white') => {
      const panel = document.createElement('div');
      panel.style.cssText = `
        color: ${color} !important;
        background: rgba(26, 26, 26, 0.8) !important;
        padding: 10px !important;
        margin: 5px !important;
        border-radius: 5px !important;
        min-width: 200px !important;
        text-align: center !important;
      `;
      panel.textContent = text;
      return panel;
    };
    
    // Add debug and status panels
    const panels = [
      createStatusPanel('WebXR UI Layer', 'green'),
      createStatusPanel('VR Mode Active', 'yellow'),
      createStatusPanel('Battery: 75%'),
      createStatusPanel('O2: 75%'),
      createStatusPanel('Pressure: 14.3psi')
    ];
    
    panels.forEach(panel => panelsContainer.appendChild(panel));
    uiLayer.appendChild(panelsContainer);
    
    // Append to document body
    document.body.appendChild(uiLayer);
    
    // VR session event listeners
    this.renderer.xr.addEventListener('sessionstart', () => {
      console.log('VR Session Started');
      uiLayer.style.display = 'block';
    });
  
    this.renderer.xr.addEventListener('sessionend', () => {
      console.log('VR Session Ended');
      uiLayer.style.display = 'none';
    });
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

  addMouseControls() {
    // Create orbit controls that work in both VR and non-VR modes
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
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