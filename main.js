// Import Three.js with full URL and integrity hash for better caching
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { XRHandModelFactory } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/XRHandModelFactory.js';
import { VRButton } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/VRButton.js';

let scene, camera, renderer;
let panel, cube;

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);
  camera.position.set(0, 1.6, 3);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: document.getElementById("xr-canvas"),
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;

  document.body.appendChild(VRButton.createButton(renderer));

  const light = new THREE.HemisphereLight(0xffffff, 0x444444);
  light.position.set(0, 1, 0);
  scene.add(light);

  // Grid for orientation
  const grid = new THREE.GridHelper(4, 20, 0x888888, 0x444444);
  grid.position.y = 0;
  scene.add(grid);

  // Rotating cube
  cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x00ffcc })
  );
  cube.position.set(0, 1.5, -1);
  scene.add(cube);

  // UI Panel (starts hidden)
  panel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xffcc00, side: THREE.DoubleSide })
  );
  panel.position.set(0.3, 1.5, -1);
  panel.visible = false;
  scene.add(panel);

  // Hand tracking
  const handFactory = new XRHandModelFactory();

  const hand1 = renderer.xr.getHand(0);
  hand1.add(handFactory.createHandModel(hand1, 'mesh'));
  scene.add(hand1);

  const hand2 = renderer.xr.getHand(1);
  hand2.add(handFactory.createHandModel(hand2, 'mesh'));
  scene.add(hand2);

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
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

function animate() {
  renderer.setAnimationLoop(() => {
    cube.rotation.y += 0.01;

    const session = renderer.xr.getSession();
    const refSpace = renderer.xr.getReferenceSpace();

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

    renderer.render(scene, camera);
  });
}