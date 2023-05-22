// Rotating cube
import * as THREE from "three";
//import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js' // XXX

let renderer
let geometry
let material
let animation
let onWindowResize
let colonna1 = [];
let colonna2 = [];
let colonna3 = [];
let colonna4 = [];
let colonna5 = [];
let pensatoio = [];

export function sketch() {
    console.log("Sketch launched")
    const stats = new Stats() // XXX
    canvas3D.appendChild(stats.dom)

    // RENDERER
    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    canvas3D.appendChild(renderer.domElement)

    // CAMERA
    let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 20, 0, 0

    // WINDOW RESIZE
    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onWindowResize)

    //SCENE
	const scene = new THREE.Scene();
	scene.userData.camera = camera;
    //scene.add( new THREE.Mesh( geometry, material ) );
    scene.add( new THREE.HemisphereLight( 0xaaaaaa, 0x444444 ) );

    //SOLIDS
    const cubo = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshStandardMaterial({ color: 0x1CFF01 })
    )
    const dodecaedro = new THREE.Mesh(
        new THREE.DodecahedronGeometry(2, 0),
        new THREE.MeshStandardMaterial({ color: 0xFA01E0 })
    )
    const dodecaedro2 = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1, 0),
        new THREE.MeshStandardMaterial({ color: 0x01FFF4 })
    )
    const cubo2 = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshStandardMaterial({ color: 0xEAFF00 })
    )
    
    cubo.position.set(0, 0, 0)
    //scene.add(cubo)
    dodecaedro.position.set(0, 2.9, 0)
    //scene.add(dodecaedro)
    dodecaedro2.position.set(0, 5.65, 0)
    //scene.add(dodecaedro2)
    cubo2.position.set(0, 7.8, 0)
    //scene.add(ottaedro)

    //COLUMNS
    colonna1.push(
        cubo2,
        cubo,
        dodecaedro2,
        dodecaedro
    );
    //scene.add(colonna1);
    scene.add(
        cubo2,
        cubo,
        dodecaedro2,
        dodecaedro
    );
    console.log(colonna1); 

    colonna2.push(
        cubo,
        dodecaedro,
        dodecaedro2,
        cubo2
    );
    //scene.add(colonna2);
    scene.add(
        cubo,
        dodecaedro,
        dodecaedro2,
        cubo2
    );
    console.log(colonna2);

    colonna3.push(
        dodecaedro,
        cubo2,
        dodecaedro2,
        cubo,
    );
    //scene.add(colonna3);
    scene.add(
        dodecaedro,
        cubo2,
        dodecaedro2,
        cubo,
    );
    console.log(colonna3);

    colonna4.push(
        cubo2,
        cubo,
        dodecaedro2,
        dodecaedro,
    );
    //scene.add(colonna4);
    scene.add(
        cubo2,
        cubo,
        dodecaedro2,
        dodecaedro,
    );
    console.log(colonna4);

    colonna5.push(
        cubo,
        dodecaedro2,
        cubo2,
        dodecaedro,
    );
    //scene.add(colonna5);
    scene.add(
        cubo,
        dodecaedro2,
        cubo2,
        dodecaedro,
    );
    console.log(colonna5);

    pensatoio.push(
        colonna1,
        colonna2,
        colonna3,
        colonna4,
        colonna5
    );

    console.log(pensatoio);
    console.log("pensatoio caricato!");

    // CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement,scene.userData.camera, scene.userData.element);
	controls.minDistance = 2;
	controls.maxDistance = 5;
	controls.enablePan = false;
    controls.enableZoom = false;
	scene.userData.controls = controls;

    //LIGHT
    const light = new THREE.DirectionalLight( 0xffffff, 0.5 );
    light.position.set( 1, 1, 1 );
    scene.add( light );

    // ANIMATE
    const animate = () => {
        stats.begin() // XXX

        // ANIMATION


        // ...

        renderer.render(scene, camera) // RENDER
        stats.end() // XXX

        animation = requestAnimationFrame(animate) // CIAK
    }
    animate()
}

function addShadowedLight( x, y, z, color, intensity ) {
    const directionalLight = new THREE.DirectionalLight( color, intensity );
	directionalLight.position.set( x, y, z );
	scene.add( directionalLight );

	directionalLight.castShadow = true;

	const d = 1;
	directionalLight.shadow.camera.left = - d;
	directionalLight.shadow.camera.right = d;
	directionalLight.shadow.camera.top = d;
	directionalLight.shadow.camera.bottom = - d;

	directionalLight.shadow.camera.near = 1;
	directionalLight.shadow.camera.far = 4;

	directionalLight.shadow.bias = - 0.002;

}

export function dispose() {
    cancelAnimationFrame(animation)
    renderer.dispose()
    geometry.dispose()
    material.dispose()
    window.removeEventListener('resize', onWindowResize)
}


//GLTFLoader
    // const loader = new GLTFLoader();
    // loader.load(
    //     // resource URL
    //     '../colonne.gltf',
    //     // called when the resource is loaded
    //     function ( gltf ) {
    
    //         scene.add( gltf.scene );
    //         //gltf.animations; // Array<THREE.AnimationClip>
    //         gltf.scene.scale.set(0.5, 0.5, 0.5); 
    //         gltf.scene; // THREE.Group
    //         gltf.scenes; // Array<THREE.Group>
    //         gltf.asset; // Object
            
    //     },
    //     // called while loading is progressing
    //     function ( xhr ) {
    
    //         console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    
    //     },
    //     // called when loading has errors
    //     function ( error ) {
    
    //         console.log( 'An error happened' );
    
    //     }
    // );
    // console.log("colonna caricata");