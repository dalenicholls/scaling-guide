import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const canvas = document.getElementById('viewer');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 10);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 10, 10);
scene.add(dirLight);

// Raycaster and pointer
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const infoBox = document.getElementById('info');

// Store original positions for explosion
const originalPositions = new Map();

// Load model
const loader = new GLTFLoader();
let rootGroup = new THREE.Group();

loader.load('model.glb', (gltf) => {
  rootGroup = gltf.scene;
  scene.add(rootGroup);

  // Store original positions
  rootGroup.traverse(child => {
    if (child.isMesh) {
      child.userData.originalPos = child.position.clone();
      originalPositions.set(child.uuid, child.position.clone());
    }
  });

}, undefined, (error) => {
  console.error('Error loading model:', error);
});

// Explosion slider
document.getElementById('explodeRange').addEventListener('input', (e) => {
  const t = parseFloat(e.target.value);
  rootGroup.traverse(child => {
    if (child.isMesh) {
      const original = originalPositions.get(child.uuid);
      if (original) {
        const dir = child.position.clone().sub(rootGroup.position).normalize();
        child.position.set(
          original.x + dir.x * t * 2,
          original.y + dir.y * t * 2,
          original.z + dir.z * t * 2
        );
      }
    }
  });
});

// Mouse click interaction
window.addEventListener('click', (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(rootGroup.children, true);

  if (intersects.length > 0) {
    const clicked = intersects[0].object;
    const name = clicked.name || '(Unnamed)';
    const meta = JSON.stringify(clicked.userData, null, 2);
    infoBox.innerText = `Name: ${name}\nMetadata: ${meta}`;
  }
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
