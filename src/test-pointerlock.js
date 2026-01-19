import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

/* ---------- INPUT ---------- */

const keys = {};
window.addEventListener("keydown", (e) => (keys[e.code] = true));
window.addEventListener("keyup", (e) => (keys[e.code] = false));

/* ---------- SCENE ---------- */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

/* ---------- CAMERA ---------- */

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.y = 1.6;

/* ---------- RENDERER ---------- */

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* ---------- CONTROLS ---------- */

const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.object);

/* ---------- START (CLICK) ---------- */

document.body.addEventListener("click", () => {
  renderer.domElement.requestPointerLock();
  controls.lock();
});

/* ---------- TEST OBJECT ---------- */

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshNormalMaterial(),
);
cube.position.z = -3;
scene.add(cube);

/* ---------- MOVEMENT ---------- */

const clock = new THREE.Clock();

function updateMovement(delta) {
  if (!document.pointerLockElement) return;

  const speed = 4;
  const direction = new THREE.Vector3();

  if (keys["KeyW"]) direction.z -= 1;
  if (keys["KeyS"]) direction.z += 1;
  if (keys["KeyA"]) direction.x -= 1;
  if (keys["KeyD"]) direction.x += 1;

  direction.normalize();

  if (direction.length() > 0) {
    direction
      .applyQuaternion(camera.quaternion) // bevæg i look-retning
      .multiplyScalar(speed * delta);

    controls.object.position.add(direction);
  }
}

/* ---------- LOOP ---------- */

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  updateMovement(delta);

  renderer.render(scene, camera);
}

animate();
