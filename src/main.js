import "./style.css";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/* =====================================================
   NAV HELPER
===================================================== */

function makeHitXZ(navMesh) {
  const ray = new THREE.Raycaster();
  ray.far = 20000;

  return (x, z) => {
    ray.set(new THREE.Vector3(x, 10000, z), new THREE.Vector3(0, -1, 0));
    const h = ray.intersectObject(navMesh, true);
    return h.length ? h[0].point : null;
  };
}

const EYE_HEIGHT = 1;

/* =====================================================
   INPUT
===================================================== */

const keys = {};
window.addEventListener("keydown", (e) => (keys[e.code] = true));
window.addEventListener("keyup", (e) => (keys[e.code] = false));

/* =====================================================
   SCENE / CAMERA / RENDERER
===================================================== */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x555555);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  500,
);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

/* =====================================================
   CONTROLS
===================================================== */

const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.object);

/* =====================================================
   UI (FRONT → CONTROLS → PAUSE)
===================================================== */

const ui = document.createElement("div");
ui.style.cssText = `
  position:fixed;
  inset:0;
  background:black;
  color:white;
  display:flex;
  align-items:center;
  justify-content:center;
  font-family:sans-serif;
  z-index:10;
`;
document.body.appendChild(ui);

let uiState = "front";
let paused = true;

function showFront() {
  uiState = "front";
  ui.style.display = "flex";
  ui.innerHTML = `
    <div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:40px;
    ">
      <img src="billede/logo.png" style="max-width:300px"/>

      <button id="continue"
        style="
          padding:14px 40px;
          border:2px solid white;
          background:none;
          color:white;
          font-size:1.2rem;
          cursor:pointer;
        ">
        Fortsæt
      </button>
    </div>
  `;

  document.getElementById("continue").onclick = showControls;
}

function showControls() {
  uiState = "controls";
  ui.innerHTML = `
    <div style="max-width:600px;text-align:center">
      <h2>Controls</h2>
      <p>
        W A S D – Bevægelse<br/>
        Mus – Kig rundt
      </p>
      <p>
        Gå hen til den <b>røde knap på Rådhuspladsen</b><br/>
        for at starte showet
      </p>
      <button id="startGame"
        style="margin-top:30px;padding:14px 32px;border:2px solid white;background:none;color:white;font-size:1.2rem;cursor:pointer">
        Start spil
      </button>
    </div>
  `;
  document.getElementById("startGame").onclick = () => {
    renderer.domElement.requestPointerLock();
  };
}

function showPause() {
  uiState = "pause";
  ui.style.display = "flex";
  ui.innerHTML = `
    <div style="text-align:center">
      <button id="resume"
        style="padding:14px 32px;border:2px solid white;background:none;color:white;font-size:1.2rem;cursor:pointer">
        Resume
      </button>
    </div>
  `;
  document.getElementById("resume").onclick = () => {
    renderer.domElement.requestPointerLock();
  };
}

/* =====================================================
   POINTER LOCK (FIXET)
===================================================== */

document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement === renderer.domElement) {
    paused = false;
    ui.style.display = "none";
  } else {
    paused = true;
    showPause();
  }
});

/* =====================================================
   VIDEO MATERIALS
===================================================== */

function createVideoTexture(src) {
  const video = document.createElement("video");
  video.src = src;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  const tex = new THREE.VideoTexture(video);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  return { video, texture: tex };
}

const videoSources = {
  map1: createVideoTexture("/video/rød1.mp4"),
  map2: createVideoTexture("/video/grøn3.mp4"),
  map3: createVideoTexture("/video/grøn3.mp4"),
  map4: createVideoTexture("/video/blå2.mp4"),
  map5: createVideoTexture("/video/blå2.mp4"),
};

const videoMeshes = {};
let videosStarted = false;

/* =====================================================
   LOAD WORLD (URØRT FUNGERENDE DEL)
===================================================== */

const loader = new GLTFLoader();
let navMesh, hitXZ, knapMesh;
const raycaster = new THREE.Raycaster();

loader.load("public/models/nytår9.gltf", (gltf) => {
  const world = gltf.scene;
  scene.add(world);

  world.traverse((obj) => {
    if (obj.name?.startsWith("Lys")) {
      const pos = new THREE.Vector3();
      obj.getWorldPosition(pos);

      obj.visible = false;

      const light = new THREE.SpotLight(
        0xfff1dc,
        6,
        30,
        Math.PI / 2.8,
        0.95,
        1,
      );

      light.position.copy(pos);
      const target = new THREE.Object3D();
      target.position.set(pos.x, pos.y - 3, pos.z);
      scene.add(target);
      light.target = target;
      scene.add(light);
    }

    if (obj.isMesh && obj.material?.isMeshStandardMaterial) {
      const n = obj.name?.toLowerCase();

      if (n?.startsWith("bloom")) {
        obj.material.emissive.set(0xffb347);
        obj.material.emissiveIntensity = 2;
      }

      if (n === "knap") {
        knapMesh = obj;
        obj.material.emissive.set(0xff3333);
        obj.material.emissiveIntensity = 3;
      }
      if (n === "start") {
        obj.material.emissive.set(0xffffff);
        obj.material.emissiveIntensity = 3.5;
      }
    }

    if (videoSources[obj.name]) {
      videoMeshes[obj.name] = obj;
      obj.material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    }

    if (obj.name === "nav") navMesh = obj;
  });

  navMesh.visible = false;
  hitXZ = makeHitXZ(navMesh);

  const box = new THREE.Box3().setFromObject(navMesh);
  const c = box.getCenter(new THREE.Vector3());
  const h = hitXZ(c.x, c.z);
  if (h) controls.object.position.set(h.x, h.y + EYE_HEIGHT, h.z);
  controls.object.rotation.y = Math.PI / 2;
});

/* =====================================================
   INTERACTION – KNAP
===================================================== */

window.addEventListener("pointerdown", () => {
  if (!knapMesh || videosStarted || paused) return;

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hit = raycaster.intersectObject(knapMesh, true);
  if (!hit.length) return;

  videosStarted = true;

  Object.entries(videoSources).forEach(([name, v]) => {
    const mesh = videoMeshes[name];
    if (!mesh) return;
    mesh.material = new THREE.MeshBasicMaterial({
      map: v.texture,
      toneMapped: false,
    });
    v.video.currentTime = 0;
    v.video.play();
  });
});

/* =====================================================
   MOVEMENT
===================================================== */

const clock = new THREE.Clock();

function update(dt) {
  if (paused || !hitXZ) return;

  let ix = 0,
    iz = 0;
  if (keys.KeyW) iz += 1;
  if (keys.KeyS) iz -= 1;
  if (keys.KeyA) ix -= 1;
  if (keys.KeyD) ix += 1;

  if (ix || iz) {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();

    const right = new THREE.Vector3().crossVectors(
      dir,
      new THREE.Vector3(0, 1, 0),
    );

    const move = new THREE.Vector3()
      .addScaledVector(right, ix)
      .addScaledVector(dir, iz)
      .normalize()
      .multiplyScalar(4 * dt);

    const p = controls.object.position;
    const h = hitXZ(p.x + move.x, p.z + move.z);
    if (h) p.set(p.x + move.x, h.y + EYE_HEIGHT, p.z + move.z);
  }
}

/* =====================================================
   LOOP
===================================================== */

showFront();

function animate() {
  update(clock.getDelta());
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
