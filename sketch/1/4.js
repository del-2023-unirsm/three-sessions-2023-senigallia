// Planets + DiffisionMap + Noise
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { LoopSubdivision } from 'three-subdivide'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

let scene
let geometry, groundGeom, parentGeometry
let material, material2, groundMate
let reflectionCube, dispMap
let animation
let onWindowResize
let noise3D
let controls

export function sketch() {
    // console.log("Sketch launched")

    const p = {
        // planets 
        parentScale: 2,
        childScale: 3,
        parentPos: new THREE.Vector3(-7, 1.5, 0),
        childPos: new THREE.Vector3(1, 1.5, 0),
        parentSpeed: .5,
        childSpeed: 2,
        parentRotationSpeed: 0.1,
        childLight: true,
        // view
        lookAtCenter: new THREE.Vector3(0, 1, 0),
        cameraPosition: new THREE.Vector3(Math.random() * 30, -5, 20),
        autoRotate: true,
        autoRotateSpeed: 1.5,
        camera: 35,
        // world
        floor: -7
    }

    // other parameters
    let near = 0.2, far = 1000
    let shadowMapWidth = 2048, shadowMapHeight = 2048

    // CAMERA
    let camera = new THREE.PerspectiveCamera(p.camera, window.innerWidth / window.innerHeight, near, far)
    camera.position.copy(p.cameraPosition)
    camera.lookAt(p.lookAtCenter)

    // WINDOW RESIZE
    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onWindowResize)

    // CONTROLS
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 10
    controls.maxDistance = 25
    controls.maxPolarAngle = Math.PI / 2 + 0.2
    controls.minPolarAngle = Math.PI / 2 - 0.4
    controls.autoRotate = p.autoRotate
    controls.autoRotateSpeed = p.autoRotateSpeed
    controls.target = p.lookAtCenter

    // SCENE
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    scene.fog = new THREE.Fog(scene.background, 5, 100)
    geometry = new THREE.SphereGeometry(1, 32, 32)

    // child
    let child
    material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        envMap: cubeTextures[0].texture,
        reflectivity: 1.0,
        transmission: 1.0,
        roughness: 0.0,
        metalness: 0.2,
        clearcoat: 0.2,
        clearcoatRoughness: 0.0,
        ior: 1.5,
        thickness: 4,
        fog: false,
        side: THREE.DoubleSide
    })
    child = new THREE.Mesh(geometry, material)
    child.position.x = 6
    child.position.y = 1
    child.scale.set(p.childScale, p.childScale, p.childScale)
    child.castShadow = true
    child.receiveShadow = false
    scene.add(child)

    // parent
    const iterations = 4
    parentGeometry = LoopSubdivision.modify(geometry, iterations, {
        split: false,
        uvSmooth: false,
        preserveEdges: false,
        flatOnly: false,
        maxTriangles: 5000
    })
    mergeVertices(parentGeometry)
    let parent
    dispMap = textures[1].texture
    material2 = new THREE.MeshPhysicalMaterial({
        color: 0x9c9c9c,
        map: textures[0].texture,
        displacementMap: dispMap,
        displacementScale: 0.2,
        displacementBias: 0.0,
        bumpMap: dispMap,
        bumpScale: 0.3,
        roughness: .6,
        metalness: 0
    })
    dispMap.wrapS = dispMap.wrapT = THREE.RepeatWrapping
    dispMap.repeat.set(1, 1)
    parent = new THREE.Mesh(parentGeometry, material2)
    parent.position.y = 1
    parent.position.x = -3
    parent.scale.set(p.parentScale, p.parentScale, p.parentScale)
    parent.castShadow = true
    parent.receiveShadow = true
    scene.add(parent)

    // LIGHTS
    let lightS = new THREE.SpotLight(0x999999, 1, 0, Math.PI / 5, 0.5)
    lightS.position.set(1, 50, 0)
    lightS.target.position.set(0, 0, 0)
    lightS.castShadow = true
    lightS.shadow.camera.near = 5
    lightS.shadow.camera.far = 200
    lightS.shadow.bias = 0.0001
    lightS.shadow.mapSize.width = shadowMapWidth
    lightS.shadow.mapSize.height = shadowMapHeight
    scene.add(lightS)

    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(-10, 3, 0)
    light.target.position.set(-5, 0, 0)
    // light.castShadow = true
    scene.add(light)
    // const light2 = new THREE.DirectionalLight(0xffffff, .4)
    // light.position.set(-10, 3, 0)
    // light.target.position.set(-5, 0, 0)
    // light.castShadow = true
    // scene.add(light2)
    const pointLight = new THREE.PointLight(0xffffff, 2)
    pointLight.position.set(20, 20, 20)
    scene.add(pointLight)
    const pointLight2 = new THREE.PointLight(0xffffff, .1)
    pointLight2.position.set(-30, 20, -20)
    scene.add(pointLight2)
    // const ambientLight = new THREE.AmbientLight(0xffffff)
    // scene.add(ambientLight)

    // let's make a ground
    groundGeom = new THREE.PlaneGeometry(20, 20)
    groundMate = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 1 })
    let ground = new THREE.Mesh(groundGeom, groundMate)
    ground.position.set(0, p.floor, 0)
    ground.rotation.x = - Math.PI / 2
    ground.scale.set(100, 100, 100)
    ground.castShadow = false
    ground.receiveShadow = true
    scene.add(ground)

    // NOISE
    noise3D = NOISE.createNoise3D()
    const t0 = Math.random() * 10

    // ANIMATE
    const animate = () => {
        if (showStats) stats.begin() // XXX

        const t = t0 + performance.now() * 0.0001

        // ANIMATION
        if (parent) {
            const t1 = t * p.parentSpeed
            parent.position.x = p.parentPos.x + noise3D(0, t1, 0) * .2
            parent.position.y = p.parentPos.y + noise3D(t1 + 4, 0, 0) * .3
            parent.position.z = p.parentPos.z + noise3D(0, 0, t1 + 8) * .1
            parent.rotation.y += noise3D(0, 0, t + 10) * p.parentRotationSpeed
        }
        if (child) {
            const t2 = t * p.childSpeed + 10
            child.position.x = p.childPos.x + noise3D(0, t2, 0) * .5
            child.position.y = p.childPos.y + noise3D(t2 + 4, 0, 0) * 1.5
            child.position.z = p.childPos.z + noise3D(0, 0, t2 + 8) * .4
            if (p.childLight) pointLight.position.copy(child.position)
        }
        // ...
        
        controls.update()
        renderer.render(scene, camera) // RENDER
        if (showStats) stats.end() // XXX

        animation = requestAnimationFrame(animate) // CIAK
    }
    animate()
}

export function dispose() {
    cancelAnimationFrame(animation)
    controls?.dispose()
    geometry?.dispose()
    parentGeometry?.dispose()
    groundGeom?.dispose()
    material?.dispose()
    material2?.dispose()
    groundMate?.dispose()
    reflectionCube?.dispose()
    dispMap?.dispose()
    noise3D = null
    window.removeEventListener('resize', onWindowResize)
}