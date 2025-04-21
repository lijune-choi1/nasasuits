import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import UIManager from './uiManager.js';

class SpaceEnvironment {
  constructor() {
    this.initializeScene();
    this.setupEnvironment();
    this.setupLighting();
    this.setupUI();
    this.addEventListeners();
    
    // Start animation loop
    this.renderer.setAnimationLoop(this.animate.bind(this));
  }
  
  initializeScene() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
    this.camera.position.set(0, 1.6, 3);
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);
    
    // XR session setup
    document.body.appendChild(VRButton.createButton(this.renderer));
    
    // Controls for non-VR mode
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1.6, 0);
    this.controls.update();
  }
  
  setupUI() {
    // Initialize UI Manager
    this.uiManager = new UIManager(this.scene, this.camera, this.renderer);
  }
  
  setupEnvironment() {
    this.addStars();
    this.addEarth();
    this.addMoonSurface();
    this.addMoonFeatures();
  }
  
  // [Rest of the methods from previous implementation remain the same]
  
  animate() {
    // Earth slow rotation
    if (this.earth) {
      this.earth.rotation.y += 0.0001;
    }
    
    // Update controls (when not in VR)
    if (this.controls) {
      this.controls.update();
    }
    
    // Update UI
    if (this.uiManager) {
      this.uiManager.update();
    }
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SpaceEnvironment();
});