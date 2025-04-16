// With import maps, we can use bare specifiers
import * as THREE from 'three';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Global variables
let scene, camera, renderer, controls;
let panel, cube;
let isPinchMode = false;
let desktopTestingEnabled = true; // Set to true to enable desktop testing
let debugVisuals = true;
let pinchLine;
let distanceText;
let distanceTextMesh;

// Initialize the scene
init();

// Start the animation loop
animate();

function init() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  // Create camera
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);
  camera.position.set(0, 1.6, 3);

  // Create renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: document.getElementById("xr-canvas"),
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;

  // Add VR button
  document.body.appendChild(VRButton.createButton(renderer));

  // Add OrbitControls for desktop navigation
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.5, -1);
  controls.update();

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  light.position.set(0, 1, 0);
  scene.add(light);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(0, 2, 2);
  scene.add(directionalLight);

  // Grid for orientation
  const grid = new THREE.GridHelper(4, 20, 0x888888, 0x444444);
  grid.position.y = 0;
  scene.add(grid);

  // Create a rotating cube
  cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x00ffcc })
  );
  cube.position.set(0, 1.5, -1);
  scene.add(cube);

  // UI Panel (starts hidden)
  panel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, 0.2),
    new THREE.MeshStandardMaterial({ 
      color: 0xffcc00, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    })
  );
  panel.position.set(0.3, 1.5, -1);
  panel.visible = false;
  scene.add(panel);

  // Add text to the panel
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = 'black';
  context.font = 'Bold 20px Arial';
  context.textAlign = 'center';
  context.fillText('Pinch Detected!', 128, 64);
  
  const texture = new THREE.CanvasTexture(canvas);
  const textMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });
  const textGeometry = new THREE.PlaneGeometry(0.28, 0.18);
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.position.set(0, 0, 0.001); // Slightly in front of the panel
  panel.add(textMesh);

  // Hand tracking setup
  const handFactory = new XRHandModelFactory();

  const hand1 = renderer.xr.getHand(0);
  hand1.add(handFactory.createHandModel(hand1, 'mesh'));
  scene.add(hand1);

  const hand2 = renderer.xr.getHand(1);
  hand2.add(handFactory.createHandModel(hand2, 'mesh'));
  scene.add(hand2);

  // Create mock hands for desktop testing
  if (desktopTestingEnabled) {
    createMockHands();
  }

  // Event listeners
  window.addEventListener('resize', onWindowResize);
  
  // Add event listener for keyboard
  if (desktopTestingEnabled) {
    window.addEventListener('keydown', (event) => {
      if (event.key === 'p' || event.key === 'P') {
        // Toggle pinch mode when pressing 'P'
        isPinchMode = !isPinchMode;
        panel.visible = isPinchMode;
        console.log("Pinch mode:", isPinchMode ? "ON" : "OFF");
        
        if (isPinchMode) {
          bringMockHandsTogether();
        } else {
          moveMockHandsApart();
        }
      }
      
      if (event.key === 'd' || event.key === 'D') {
        // Toggle debug visuals when pressing 'D'
        debugVisuals = !debugVisuals;
        if (pinchLine) {
          pinchLine.visible = debugVisuals;
          distanceTextMesh.visible = debugVisuals;
        }
        console.log("Debug visuals:", debugVisuals ? "ON" : "OFF");
      }
    });
    
    // Add instructions to the page
    const instructions = document.createElement('div');
    instructions.innerHTML = `
      <div style="position: absolute; bottom: 20px; left: 20px; background: rgba(0,0,0,0.7); color: white; padding: 10px; border-radius: 5px;">
        <h3>Desktop Testing Mode</h3>
        <p>Press 'P' to toggle pinch gesture (shows/hides yellow panel)</p>
        <p>Press 'D' to toggle debug visualizations</p>
        <p>Use mouse to rotate camera, scroll to zoom</p>
      </div>
    `;
    document.body.appendChild(instructions);
  }
}

// Mock hand objects for desktop testing
let mockIndexFinger, mockThumb;

function createMockHands() {
  // Create a simple representation of an index finger
  mockIndexFinger = new THREE.Mesh(
    new THREE.SphereGeometry(0.01, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  mockIndexFinger.position.set(0.05, 1.5, -0.8);
  scene.add(mockIndexFinger);
  
  // Create a simple representation of a thumb
  mockThumb = new THREE.Mesh(
    new THREE.SphereGeometry(0.01, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x0000ff })
  );
  mockThumb.position.set(-0.05, 1.5, -0.8);
  scene.add(mockThumb);
  
  // Create line between fingers for visualization
  createDebugVisuals();
}

function bringMockHandsTogether() {
  // Animate the mock fingers coming together
  const duration = 500; // milliseconds
  const startTime = Date.now();
  const startPositions = {
    index: mockIndexFinger.position.clone(),
    thumb: mockThumb.position.clone()
  };
  const targetPositions = {
    index: new THREE.Vector3(0.01, 1.5, -0.8),
    thumb: new THREE.Vector3(-0.01, 1.5, -0.8)
  };
  
  function animateFingers() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    mockIndexFinger.position.lerpVectors(startPositions.index, targetPositions.index, progress);
    mockThumb.position.lerpVectors(startPositions.thumb, targetPositions.thumb, progress);
    
    if (progress < 1) {
      requestAnimationFrame(animateFingers);
    }
  }
  
  animateFingers();
}

function moveMockHandsApart() {
  // Animate the mock fingers moving apart
  const duration = 500; // milliseconds
  const startTime = Date.now();
  const startPositions = {
    index: mockIndexFinger.position.clone(),
    thumb: mockThumb.position.clone()
  };
  const targetPositions = {
    index: new THREE.Vector3(0.05, 1.5, -0.8),
    thumb: new THREE.Vector3(-0.05, 1.5, -0.8)
  };
  
  function animateFingers() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    mockIndexFinger.position.lerpVectors(startPositions.index, targetPositions.index, progress);
    mockThumb.position.lerpVectors(startPositions.thumb, targetPositions.thumb, progress);
    
    if (progress < 1) {
      requestAnimationFrame(animateFingers);
    }
  }
  
  animateFingers();
}

// Debug visuals for pinch distance
function createDebugVisuals() {
  // Create line between index and thumb
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xffff00,
    linewidth: 2
  });
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0)
  ]);
  pinchLine = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(pinchLine);
  
  // Create distance text
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = 'white';
  context.font = '24px Arial';
  context.textAlign = 'center';
  context.fillText('Distance: 0.00 cm', 128, 64);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });
  const geometry = new THREE.PlaneGeometry(0.2, 0.1);
  distanceTextMesh = new THREE.Mesh(geometry, material);
  distanceTextMesh.position.set(0, 1.7, -0.8);
  scene.add(distanceTextMesh);
  
  distanceText = {
    canvas: canvas,
    context: context,
    texture: texture
  };
}

function updatePinchDistanceVisual(indexPos, thumbPos, distance) {
  if (!pinchLine || !debugVisuals) return;
  
  // Update line position
  const points = [
    new THREE.Vector3(indexPos.x, indexPos.y, indexPos.z),
    new THREE.Vector3(thumbPos.x, thumbPos.y, thumbPos.z)
  ];
  pinchLine.geometry.setFromPoints(points);
  
  // Update text
  const distanceInCm = distance * 100; // Convert to cm
  distanceText.context.clearRect(0, 0, distanceText.canvas.width, distanceText.canvas.height);
  distanceText.context.fillStyle = distanceInCm < 2 ? 'green' : 'white';
  distanceText.context.font = '24px Arial';
  distanceText.context.textAlign = 'center';
  distanceText.context.fillText(`Distance: ${distanceInCm.toFixed(2)} cm`, 128, 64);
  distanceText.texture.needsUpdate = true;
  
  // Position text between finger and thumb
  const midpoint = new THREE.Vector3().addVectors(
    new THREE.Vector3(indexPos.x, indexPos.y, indexPos.z),
    new THREE.Vector3(thumbPos.x, thumbPos.y, thumbPos.z)
  ).multiplyScalar(0.5);
  midpoint.y += 0.05; // Position slightly above the fingers
  distanceTextMesh.position.copy(midpoint);
  distanceTextMesh.lookAt(camera.position);
}

// Utility to detect pinch between thumb and index tip
function isPinching(hand, referenceSpace) {
  const indexTip = hand.getJointPose(hand.joints['index-finger-tip'], referenceSpace);
  const thumbTip = hand.getJointPose(hand.joints['thumb-tip'], referenceSpace);

  if (!indexTip || !thumbTip) return false;

  const dx = indexTip.transform.position.x - thumbTip.transform.position.x;
  const dy = indexTip.transform.position.y - thumbTip.transform.position.y;
  const dz = indexTip.transform.position.z - thumbTip.transform.position.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return distance < 0.02; // less than 2cm = pinch
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(() => {
    // Rotate the cube for visual interest
    cube.rotation.y += 0.01;
    
    const session = renderer.xr.getSession();
    const refSpace = renderer.xr.getReferenceSpace();

    // If in VR mode with hand tracking
    if (session && refSpace) {
      const inputSources = session.inputSources;

      for (const source of inputSources) {
        if (source.hand) {
          const hand = source.hand;
          const pinching = isPinching(hand, refSpace);

          if (pinching) {
            panel.visible = true;
          } else {
            panel.visible = false;
          }
        }
      }
    } 
    // Desktop testing mode
    else if (desktopTestingEnabled) {
      panel.visible = isPinchMode;
      
      // Update debug visuals in desktop mode
      if (mockIndexFinger && mockThumb) {
        const indexPos = mockIndexFinger.position;
        const thumbPos = mockThumb.position;
        
        const dx = indexPos.x - thumbPos.x;
        const dy = indexPos.y - thumbPos.y;
        const dz = indexPos.z - thumbPos.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        updatePinchDistanceVisual(indexPos, thumbPos, distance);
      }
    }

    // If using OrbitControls, update them
    if (controls) {
      controls.update();
    }

    renderer.render(scene, camera);
  });
}