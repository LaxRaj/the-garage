import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';

// ============================================
// CINEMATIC 3D SHOWROOM
// Awwwards-winning Creative Development
// ============================================

let scene, camera, renderer, controls;
let carModel = null;

function initShowroom() {
const canvas = document.querySelector('#webgl-canvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    // ============================================
    // SCENE SETUP
    // ============================================
    scene = new THREE.Scene();
    
    // Atmospheric fog - blends floor into darkness
    scene.fog = new THREE.FogExp2(0x050505, 0.02);

    // ============================================
    // CAMERA
    // ============================================
    camera = new THREE.PerspectiveCamera(
        50, // FOV - cinematic wide angle
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(5, 3, 8);
    camera.lookAt(0, 0.5, 0);

    // ============================================
    // RENDERER - High Performance Settings
    // ============================================
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
    });
    
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Realistic color grading
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    // Soft shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Dark background
    renderer.setClearColor(0x050505, 1);

    // ============================================
    // FLOOR - Dark Reflective Asphalt/Concrete
    // ============================================
    const floorGeometry = new THREE.PlaneGeometry(100, 100, 1, 1);
const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x0a0a0a,
        roughness: 0.3, // Slight reflectivity
        metalness: 0.1,
        emissive: 0x000000
});
    
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

    // ============================================
    // DRAMATIC STUDIO LIGHTING
    // ============================================
    
    // Ambient - minimal fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
scene.add(ambientLight);

    // KEY LIGHT - Strong SpotLight casting shadows (main illumination)
    const keyLight = new THREE.SpotLight(0xffffff, 25);
    keyLight.position.set(6, 12, 6);
    keyLight.angle = Math.PI / 5;
    keyLight.penumbra = 0.4;
    keyLight.decay = 2;
    keyLight.distance = 50;
    keyLight.castShadow = true;
    
    // High-quality shadow settings
    keyLight.shadow.mapSize.width = 4096;
    keyLight.shadow.mapSize.height = 4096;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.fov = 30;
    keyLight.shadow.bias = -0.0001;
    keyLight.shadow.radius = 8;
    
    scene.add(keyLight);
    
    // Helper to visualize light (remove in production)
    // const keyLightHelper = new THREE.SpotLightHelper(keyLight);
    // scene.add(keyLightHelper);

    // RIM LIGHT - Cool Blue Backlight (silhouette outline)
    const rimLight = new THREE.SpotLight(0x4a90e2, 15); // Cool blue
    rimLight.position.set(-8, 8, -8);
    rimLight.angle = Math.PI / 4;
    rimLight.penumbra = 0.6;
    rimLight.decay = 2;
    rimLight.distance = 50;
    rimLight.castShadow = false; // Rim light doesn't cast shadows
    scene.add(rimLight);

    // Additional fill light from opposite side (warm)
    const fillLight = new THREE.PointLight(0xffa500, 3);
    fillLight.position.set(-5, 5, 5);
    fillLight.decay = 2;
    fillLight.distance = 30;
    scene.add(fillLight);

    // ============================================
    // CAR MODEL LOADING
    // ============================================
const loader = new GLTFLoader();

loader.load(
        '/assets/porsche_911.glb',
    (gltf) => {
            // SUCCESS: Car model loaded
            carModel = gltf.scene;
            
            // Enable shadows on all meshes
            carModel.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                    
                    // Enhance material properties for cinematic look
                    if (node.material) {
                        node.material.needsUpdate = true;
                    }
            }
        });
            
            // Calculate bounding box and center the car
            const box = new THREE.Box3().setFromObject(carModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            // Scale to fit nicely (approximately 2 units tall)
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            carModel.scale.multiplyScalar(scale);
            
            // Center the car at origin
            carModel.position.sub(center.multiplyScalar(scale));
            carModel.position.y = 0;
            
            scene.add(carModel);
            console.log('✅ Porsche 911 loaded successfully');
            
            // Update controls target to car center
            if (controls) {
                controls.target.set(
                    carModel.position.x,
                    carModel.position.y + 0.5,
                    carModel.position.z
                );
            }
        },
        (progress) => {
            // Progress callback (optional)
            const percent = (progress.loaded / progress.total) * 100;
            console.log(`Loading: ${percent.toFixed(0)}%`);
        },
    (error) => {
            // ERROR: Model failed to load - Create glowing red cube placeholder
            console.warn('⚠️ Car model not found. Creating placeholder:', error);
            createPlaceholder();
        }
    );

    // ============================================
    // PLACEHOLDER - Glowing Red Cube
    // ============================================
    function createPlaceholder() {
        const geometry = new THREE.BoxGeometry(2, 1, 4);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0xff0000,
            emissiveIntensity: 0.3 // Subtle glow
        });
        
        const placeholder = new THREE.Mesh(geometry, material);
        placeholder.position.set(0, 0.5, 0);
        placeholder.castShadow = true;
        placeholder.receiveShadow = true;
        scene.add(placeholder);
        
        // Animate rotation
        function animatePlaceholder() {
            placeholder.rotation.y += 0.005;
            requestAnimationFrame(animatePlaceholder);
    }
        animatePlaceholder();

        carModel = placeholder; // Set reference for controls
    }

    // ============================================
    // ORBIT CONTROLS - Cinematic Camera Movement
    // ============================================
    controls = new OrbitControls(camera, renderer.domElement);
    
    // Smooth damping for cinematic feel
controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Disable zoom to prevent scroll hijacking
controls.enableZoom = false; 

    // Limit polar angle to prevent clipping under floor
    controls.minPolarAngle = Math.PI / 6; // ~30 degrees from top
    controls.maxPolarAngle = Math.PI / 2.2; // ~82 degrees (almost horizontal)
    
    // Limit azimuth (horizontal rotation)
    controls.minAzimuthAngle = -Math.PI / 3; // -60 degrees
    controls.maxAzimuthAngle = Math.PI / 3; // +60 degrees
    
    // Distance limits
    controls.minDistance = 4;
    controls.maxDistance = 15;
    
    // Target the car center
    controls.target.set(0, 0.5, 0);
    controls.update();

    // ============================================
    // ANIMATION LOOP
    // ============================================
    function animate() {
        requestAnimationFrame(animate);
        
        // Update controls (required for damping)
        controls.update();
        
        // Render
    renderer.render(scene, camera);
}
    
animate();

    // ============================================
    // RESPONSIVE HANDLING
    // ============================================
    function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup function (optional, for SPA navigation)
    return () => {
        window.removeEventListener('resize', handleResize);
        if (controls) controls.dispose();
        if (renderer) renderer.dispose();
    };
}

// ============================================
// INITIALIZATION
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShowroom);
} else {
    initShowroom();
}
