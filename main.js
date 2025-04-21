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
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
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
  
  // Create WebXR UI Layer
  createWebXRUILayer() {
    const uiLayer = document.createElement('div');
    uiLayer.id = 'webxr-ui-layer';
    uiLayer.style.position = 'fixed';
    uiLayer.style.top = '0';
    uiLayer.style.left = '0';
    uiLayer.style.width = '100%';
    uiLayer.style.pointerEvents = 'none';
    uiLayer.style.zIndex = '10';
    uiLayer.style.display = 'none'; // Initially hidden
    
    // Create status panels
    const createStatusPanel = (text, color = 'white') => {
      const panel = document.createElement('div');
      panel.style.backgroundColor = 'rgba(26, 26, 26, 0.8)';
      panel.style.color = color;
      panel.style.padding = '10px';
      panel.style.margin = '10px';
      panel.style.borderRadius = '5px';
      panel.style.display = 'inline-block';
      panel.textContent = text;
      return panel;
    };
    
    // Top row status panels
    const batteryPanel = createStatusPanel('Battery: 75%');
    const o2Panel = createStatusPanel('O2: 75%');
    const pressurePanel = createStatusPanel('Pressure: 14.3psi');
    
    // Middle info panels
    const distancePanel = createStatusPanel('100m remaining', '#FFCC00');
    const timePanel = createStatusPanel('15:00 min to Destination', '#00FF66');
    
    // Bottom panels
    const distanceWalkedPanel = createStatusPanel('Walked 500m');
    const pilotPanel = createStatusPanel('Pilot Neil Armstrong');
    const navigationPanel = createStatusPanel('Navigation Mode', '#00FF66');
    
    // Arrange panels
    const topRowContainer = document.createElement('div');
    topRowContainer.style.display = 'flex';
    topRowContainer.style.justifyContent = 'space-between';
    topRowContainer.appendChild(batteryPanel);
    topRowContainer.appendChild(o2Panel);
    topRowContainer.appendChild(pressurePanel);
    
    const middleRowContainer = document.createElement('div');
    middleRowContainer.style.display = 'flex';
    middleRowContainer.style.justifyContent = 'space-between';
    middleRowContainer.appendChild(distancePanel);
    middleRowContainer.appendChild(timePanel);
    
    const bottomRowContainer = document.createElement('div');
    bottomRowContainer.style.display = 'flex';
    bottomRowContainer.style.justifyContent = 'space-between';
    bottomRowContainer.appendChild(distanceWalkedPanel);
    bottomRowContainer.appendChild(pilotPanel);
    bottomRowContainer.appendChild(navigationPanel);
    
    // Add containers to UI layer
    uiLayer.appendChild(topRowContainer);
    uiLayer.appendChild(middleRowContainer);
    uiLayer.appendChild(bottomRowContainer);
    
    // Add to document
    document.body.appendChild(uiLayer);
    
    // In main.js, modify the VR session event listeners
    this.renderer.xr.addEventListener('sessionstart', () => {
      console.log('VR Session Started');
      console.log('WebXR UI Layer:', uiLayer);
      console.log('Display Style Before:', uiLayer.style.display);
      uiLayer.style.display = 'block';
      console.log('Display Style After:', uiLayer.style.display);
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

  createWebXRUILayer() {
    const uiLayer = document.createElement('div');
    uiLayer.id = 'webxr-ui-layer';
    uiLayer.style.position = 'fixed';
    uiLayer.style.top = '0';
    uiLayer.style.left = '0';
    uiLayer.style.width = '100%';
    uiLayer.style.height = '100%'; // Full height
    uiLayer.style.pointerEvents = 'none';
    uiLayer.style.zIndex = '1000'; // High z-index
    uiLayer.style.display = 'none';
    uiLayer.style.backgroundColor = 'transparent'; // Ensure it doesn't block view
    
    // Create a container for panels
    const panelsContainer = document.createElement('div');
    panelsContainer.style.position = 'absolute';
    panelsContainer.style.top = '20px';
    panelsContainer.style.left = '20px';
    panelsContainer.style.display = 'flex';
    panelsContainer.style.flexDirection = 'column';
    
    // Create status panels with more visible debugging
    const createStatusPanel = (text, color = 'white', bgColor = 'rgba(26, 26, 26, 0.8)') => {
      const panel = document.createElement('div');
      panel.style.backgroundColor = bgColor;
      panel.style.color = color;
      panel.style.padding = '10px';
      panel.style.margin = '5px';
      panel.style.borderRadius = '5px';
      panel.style.border = '2px solid white'; // Add border for visibility
      panel.style.minWidth = '200px';
      panel.textContent = text;
      return panel;
    };
    
    // Debug panel to confirm VR session
    const debugPanel = createStatusPanel('VR Session Active', 'green', 'rgba(0, 255, 0, 0.2)');
    panelsContainer.appendChild(debugPanel);
    
    // Add all panels
    const panels = [
      'Battery: 75%',
      'O2: 75%',
      'Pressure: 14.3psi',
      '100m remaining',
      '15:00 min to Destination',
      'Walked 500m',
      'Pilot Neil Armstrong',
      'Navigation Mode'
    ];
    
    panels.forEach(panelText => {
      const panel = createStatusPanel(panelText);
      panelsContainer.appendChild(panel);
    });
    
    uiLayer.appendChild(panelsContainer);
    document.body.appendChild(uiLayer);
    
    // Extensive logging
    console.log('WebXR UI Layer Created:', uiLayer);
    
    // VR Session Event Listeners with Extensive Logging
    this.renderer.xr.addEventListener('sessionstart', () => {
      console.log('VR Session Started');
      console.log('Current UI Layer:', uiLayer);
      
      // Force display
      uiLayer.style.display = 'block';
      console.log('UI Layer Display Style:', uiLayer.style.display);
      
      // Additional visibility check
      setTimeout(() => {
        console.log('UI Layer Computed Style:', window.getComputedStyle(uiLayer).display);
        console.log('UI Layer Visibility:', uiLayer.offsetParent !== null);
      }, 100);
    });
    
    this.renderer.xr.addEventListener('sessionend', () => {
      console.log('VR Session Ended');
      uiLayer.style.display = 'none';
    });
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new NASASuitsApp();
});

export default NASASuitsApp;