// THREE
import { Scene, WebGLRenderer, PerspectiveCamera, TextureLoader, Mesh, DoubleSide, ShaderMaterial } from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Lib
import { MSDFTextGeometry } from '../../../src/index';
import uniforms from '../../../src/MSDFTextMaterial/uniforms';

// Shaders
import vertex from './shaders/vertex.glsl';
import fragment from './shaders/fragment.glsl';

export default class Stroke {
    constructor() {
        this.canvas = document.querySelector('.js-canvas');
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.controls = null;
    }

    start() {
        this.setupEventListeners();
        this.setup();
        this.setupText();
        this.update();
    }

    setup() {
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.position.z = 1000;

        this.scene = new Scene();

        this.renderer = new WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    setupText() {
        const promises = [
            this.loadFontAtlas('./fonts/roboto/roboto-regular.png'),
            this.loadFont('./fonts/roboto/roboto-regular.fnt'),
        ];

        Promise.all(promises).then(([atlas, font]) => {
            const geometry = new MSDFTextGeometry({
                text: 'Hello World',
                font: font.data,
                width: 1000,
                align: 'center',
            });

            const material = new ShaderMaterial({
                side: DoubleSide,
                transparent: true,
                defines: {
                    IS_SMALL: false,
                },
                extensions: {
                    derivatives: true,
                },
                uniforms: {
                    // Common
                    ...uniforms.common,
                    // Rendering
                    ...uniforms.rendering,
                    // Strokes
                    ...uniforms.strokes,
                },
                vertexShader: vertex,
                fragmentShader: fragment,
            });
            material.uniforms.uMap.value = atlas;
            material.side = DoubleSide;
            material.uniforms.uStrokeColor.value.set('#ffffff');

            const mesh = new Mesh(geometry, material);
            mesh.rotation.x = Math.PI;
            const scale = 3;
            mesh.position.x = -geometry.layout.width / 2 * scale;
            mesh.scale.set(scale, scale, scale);
            this.scene.add(mesh);
        });
    }

    loadFontAtlas(path) {
        const promise = new Promise((resolve, reject) => {
            const loader = new TextureLoader();
            loader.load(path, resolve);
        });

        return promise;
    }

    loadFont(path) {
        const promise = new Promise((resolve, reject) => {
            const loader = new FontLoader();
            loader.load(path, resolve);
        });

        return promise;
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    update() {
        this.render();

        requestAnimationFrame(this.update.bind(this));
    }

    setupEventListeners() {
        window.addEventListener('resize', this.resizeHandler.bind(this));
    }

    resizeHandler() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
