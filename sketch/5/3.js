// Column + Cannon

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

let scene
let groundGeom
let groundMate
let material
let animation
let onWindowResize
let world
// let pieceBody
let pieceGeometry
let controls
let composer
let renderPass
let bloomPass
const pieceMaterials = []

export function sketch() {
    // console.log("Sketch launched")

    const p = {
        // start
        fromSky: true,
        slowBuild: false,
        slowBuildDelay: 1, // sec
        pauseAfterBuild: true,
        pauseAfterBuildTime: 3, // sec
        // columns
        columnsNo: 8,
        columnsRadius: 12 + Math.random() * 2,
        piecesNo: 11, // no of pieces per columns
        piaceMaxSize: 0.9 + Math.random() * .3, // piece Max radius
        // view
        lookAtCenter: new THREE.Vector3(Math.random() * -4, 4, Math.random() * 4),
        cameraPosition: new THREE.Vector3(0, 0.5, 0), // < z will be recalculated based on columnRadius/2
        autoRotate: true,
        autoRotateSpeed: -1 + Math.random() * 2,
        camera: 55,
        // bloom
        exposure: 0.5,
        bloomStrength: 2,
        bloomThreshold: .2,
        bloomRadius: .7,
        // world
        gravity: -5.0,
        floor: -1,
    }

    // other parameters
    let near = 0.2, far = 1000
    let shadowMapWidth = 2048, shadowMapHeight = 2048
    let paused = false

    // CAMERA
    let camera = new THREE.PerspectiveCamera(p.camera, window.innerWidth / window.innerHeight, near, far)
    camera.position.copy(p.cameraPosition)
    camera.position.z = - p.columnsRadius / 2
    camera.lookAt(p.lookAtCenter)

    // WINDOW RESIZE
    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onWindowResize)

    // SCENE
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    scene.fog = new THREE.Fog(scene.background, 15, 100)
    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, p.gravity, 0)
    })

    // POST-PROCESSING
    composer = new EffectComposer(renderer)
    renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)
    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = p.bloomThreshold
    bloomPass.strength = p.bloomStrength
    bloomPass.radius = p.bloomRadius
    composer.addPass(bloomPass)

    // Default material
    const defaultMaterial = new CANNON.Material('default')
    const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
        friction: .9,
        restitution: 0,
        contactEquationStiffness: 1e5,
        contactEquationRelaxation: 2
    })
    world.defaultContactMaterial = defaultContactMaterial

    // COLUMNS
    const columns = []
    const columnsPositions = []
    for (let i = 0; i < p.columnsNo; i++) {
        columnsPositions.push({
            x: p.columnsRadius * Math.cos((2 * Math.PI * i) / p.columnsNo),
            z: p.columnsRadius * Math.sin((2 * Math.PI * i) / p.columnsNo)
        })
    }

    // LAVA MATERIAL
    const uniforms = {
        'fogDensity': { value: 0.0045 },
        'fogColor': { value: new THREE.Vector3(0, 0, 0) },
        'time': { value: 1.0 },
        'uvScale': { value: new THREE.Vector2(3.0, 1.0) },
        'texture1': { value: textures[4].texture },
        'texture2': { value: textures[5].texture }
    }
    uniforms['texture1'].value.wrapS = uniforms['texture1'].value.wrapT = THREE.RepeatWrapping
    uniforms['texture2'].value.wrapS = uniforms['texture2'].value.wrapT = THREE.RepeatWrapping
    material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `uniform vec2 uvScale;
                        varying vec2 vUv;
                        void main() {
                            vUv = uvScale * uv;
                            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                            gl_Position = projectionMatrix * mvPosition;
                        }`,
        fragmentShader: `uniform float time;
                            uniform float fogDensity;
                            uniform vec3 fogColor;
                            uniform sampler2D texture1;
                            uniform sampler2D texture2;
                            varying vec2 vUv;
                            void main( void ) {
                                vec2 position = - 1.0 + 2.0 * vUv;
                                vec4 noise = texture2D( texture1, vUv );
                                vec2 T1 = vUv + vec2( 1.5, - 1.5 ) * time * 0.02;
                                vec2 T2 = vUv + vec2( - 0.5, 2.0 ) * time * 0.01;
                                T1.x += noise.x * 2.0;
                                T1.y += noise.y * 2.0;
                                T2.x -= noise.y * 0.2;
                                T2.y += noise.z * 0.2;
                                float p = texture2D( texture1, T1 * 2.0 ).a;
                                vec4 color = texture2D( texture2, T2 * 2.0 );
                                vec4 temp = color * ( vec4( p, p, p, p ) * 2.0 ) + ( color * color - 0.1 );
                                if( temp.r > 1.0 ) { temp.bg += clamp( temp.r - 2.0, 0.0, 100.0 ); }
                                if( temp.g > 1.0 ) { temp.rb += temp.g - 1.0; }
                                if( temp.b > 1.0 ) { temp.rg += temp.b - 1.0; }
                                gl_FragColor = temp;
                                float depth = gl_FragCoord.z / gl_FragCoord.w;
                                const float LOG2 = 1.442695;
                                float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
                                fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );
                                gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );
                            }`
    })
    material.uniforms['texture1'].value.wrapS = material.uniforms['texture1'].value.wrapT = THREE.RepeatWrapping
    material.uniforms['texture2'].value.wrapS = material.uniforms['texture2'].value.wrapT = THREE.RepeatWrapping



    // COLUMNSMATERIALS
    const pieceColors = [0xff0000, 0x00ff00, 0xff00ff, 0xffff00, 0x0000ff]
    for (let i = 0; i < pieceColors.length; i++) {
        pieceMaterials.push(material)
    }
    // COLUMN
    const addPiece = (idCol, col, id, pos, size) => {
        const radiusBottom = size * 2
        const radiusTop = size * 2
        const height = size + Math.random() * 2
        const res = 32
        const pieceBodyShape = new CANNON.Cylinder(radiusTop, radiusBottom, height, res / 2)
        pieceGeometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, res)
        let yPos
        if (!p.fromSky) {
            yPos = 0
            for (let i = 0; i < col.length; i++) {
                yPos += col[i].pieceHeight
            }
            yPos += 0.5
        } else {
            yPos = 30
        }
        const position = new CANNON.Vec3(
            pos.x, // - 0.05 + Math.random() * .005,
            yPos,
            pos.z // - 0.05 + Math.random() * .005,
        )
        const pieceBody = new CANNON.Body({
            position,
            mass: p.piecesNo - id, // .5 + Math.random() * 2,
            shape: pieceBodyShape,
            allowSleep: true,
        })
        pieceBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / Math.random())

        const piece = new THREE.Mesh(pieceGeometry, pieceMaterials[Math.round(Math.random() * (pieceMaterials.length - 1))])
        col.push({
            pieceBody: pieceBody,
            piece: piece,
            pieceHeight: height
        })
        world.addBody(pieceBody)
        scene.add(piece)
        col[id].piece.castShadow = true
        col[id].piece.receiveShadow = false

        if (p.pauseAfterBuild && (idCol == p.columnsNo - 1) && (id == p.piecesNo - 1)) {
            setTimeout(() => { paused = true }, p.pauseAfterBuildTime * 1000) // < stop simulation once builded
        }
    }

    for (let i = 0; i < p.columnsNo; i++) {
        const column = []
        columns.push(column)
        for (let j = 0; j < p.piecesNo; j++) {
            let size = p.piaceMaxSize - j * 0.03
            if (p.slowBuild) {
                setTimeout(() => {
                    addPiece(i, columns[i], j, columnsPositions[i], size)
                }, j * p.slowBuildDelay * 1000 + Math.random() * p.slowBuildDelay * 1000 / 2)
            } else {
                addPiece(i, columns[i], j, columnsPositions[i], size)
            }
        }
        // console.log(columns[i])
    }


    // Static ground plane
    // let's make a ground
    groundGeom = new THREE.PlaneGeometry(20, 20)
    groundMate = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0 })
    let ground = new THREE.Mesh(groundGeom, groundMate)
    ground.position.set(0, p.floor, 0)
    ground.rotation.x = - Math.PI / 2
    ground.scale.set(100, 100, 100)
    ground.castShadow = false
    ground.receiveShadow = true
    scene.add(ground)
    const groundBody = new CANNON.Body({
        position: new CANNON.Vec3(0, p.floor, 0),
        mass: 0,
        shape: new CANNON.Plane(),
    })
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    world.addBody(groundBody)
    ground.position.copy(groundBody.position)
    ground.quaternion.copy(groundBody.quaternion)

    // LIGHTS
    let lightS = new THREE.SpotLight(0x999999, 1, 0, Math.PI / 5, .1)
    lightS.position.set(0, 50, 0)
    lightS.target.position.set(0, 0, 0)
    lightS.castShadow = true
    lightS.shadow.camera.near = 5
    lightS.shadow.camera.far = 200
    lightS.shadow.bias = 0.0001
    lightS.shadow.mapSize.width = shadowMapWidth
    lightS.shadow.mapSize.height = shadowMapHeight
    scene.add(lightS)

    const light = new THREE.DirectionalLight(0xffffff, .5)
    light.position.set(-4, 4, 0)
    light.target.position.set(0, 10, 10)
    // light.castShadow = true
    scene.add(light)
    // const light2 = new THREE.DirectionalLight(0xffffff, .4)
    // light2.position.set(-10, 3, 0)
    // light2.target.position.set(-5, 0, 0)
    // light2.castShadow = true
    // scene.add(light2)
    // const pointLight = new THREE.PointLight(0xffffff, 1)
    // pointLight.position.set(20, 20, 20)
    // scene.add(pointLight)
    const pointLight2 = new THREE.PointLight(0xffffff, .1)
    pointLight2.position.set(0, 2, 0)
    scene.add(pointLight2)
    // const ambientLight = new THREE.AmbientLight(0xffffff)
    // scene.add(ambientLight)

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

    // ANIMATE
    const timeStep = 1 / 60 // seconds
    let lastCallTime
    const clock = new THREE.Clock()
    const animate = () => {
        if (showStats) stats.begin() // XXX

        // ANIMATION
        const delta = clock.getDelta()
        uniforms['time'].value += 0.7 * delta
        if (!paused) {
            const time = performance.now() / 1000 // seconds
            if (!lastCallTime) {
                world.step(timeStep)
            } else {
                const dt = time - lastCallTime
                world.step(timeStep, dt)
            }
            lastCallTime = time

            // CANNON
            // world.fixedStep()
            for (let i = 0; i < columns.length; i++) {
                for (let j = 0; j < columns[i].length; j++) {
                    columns[i][j].piece.position.copy(columns[i][j].pieceBody.position)
                    columns[i][j].piece.quaternion.copy(columns[i][j].pieceBody.quaternion)
                }
            }
        }
        // ...

        controls.update()
        renderer.render(scene, camera) // RENDER
        composer.render() // POST-PROCESSING
        if (showStats) stats.end() // XXX

        animation = requestAnimationFrame(animate) // CIAK
    }
    animate()
}

export function dispose() {
    cancelAnimationFrame(animation)
    controls?.dispose()
    groundGeom?.dispose()
    groundMate?.dispose()
    pieceGeometry?.dispose()
    material?.dispose()
    for (let i = 0; i < pieceMaterials.length; i++) {
        pieceMaterials[i]?.dispose()
    }
    world = null
    let id = window.setTimeout(function () { }, 0)
    while (id--) {
        window.clearTimeout(id)
    }
    composer?.dispose()
    renderPass?.dispose()
    bloomPass?.dispose()
    window?.removeEventListener('resize', onWindowResize)
}
