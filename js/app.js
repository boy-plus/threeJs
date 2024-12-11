import * as T from 'three';
// eslint-disable-next-line import/no-unresolved
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import fragment from './shaders/fragment.glsl';
import vertex from './shaders/vertex.glsl';

import vertexPars from './shaders/vertex_pars.glsl'
import vertexMain from './shaders/vertex_main.glsl'
import fragmentPars from './shaders/fragment_pars.glsl'
import fragmentMain from './shaders/fragment_main.glsl'

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};

export default class Three {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new T.Scene();

    this.camera = new T.PerspectiveCamera(
      75,
      device.width / device.height,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 2);
    this.scene.add(this.camera);

    this.renderer = new T.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
    this.renderer.setClearColor(0x090a0b)


    // shadow
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = T.PCFSoftShadowMap
    const target = new T.WebGLRenderTarget(device.width, device.height, {
      samples: 8,
    })
    this.composer = new EffectComposer(this.renderer, target)
    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)

    this.controls = new OrbitControls(this.camera, this.canvas);

    this.clock = new T.Clock();

    this.setLights();
    this.setGeometry();
    this.render();
    this.setResize();
  }

  setLights() {
     // lighting
    const dirLight = new T.DirectionalLight('#526cff', 0.6)
    dirLight.position.set(2, 2, 2)

    const ambientLight = new T.AmbientLight('#4255ff', 0.5)
    this.scene.add(dirLight, ambientLight)

    // this.ambientLight = new T.AmbientLight(new T.Color(1, 1, 1, 1));
    // this.scene.add(this.ambientLight);
  }

  setGeometry() {
    // meshes
    this.planeGeometry = new T.IcosahedronGeometry(1, 400)
    this.planeMaterial = new T.MeshStandardMaterial({
    onBeforeCompile: (shader) => {
      // storing a reference to the shader object
      this.planeMaterial.userData.shader = shader

      // uniforms
      shader.uniforms.uTime = { value: 0 }
      
      const parsVertexString = /* glsl */ `#include <displacementmap_pars_vertex>`
      shader.vertexShader = shader.vertexShader.replace(
        parsVertexString,
        parsVertexString + '\n' + vertexPars
      )
      
      const mainVertexString = /* glsl */ `#include <displacementmap_vertex>`
      shader.vertexShader = shader.vertexShader.replace(
        mainVertexString,
        mainVertexString + '\n' + vertexMain
      )
      console.log(shader.vertex)
      const mainFragmentString = /* glsl */ `#include <normal_fragment_maps>`
      const parsFragmentString = /* glsl */ `#include <bumpmap_pars_fragment>`
      shader.fragmentShader = shader.fragmentShader.replace(
        parsFragmentString,
        parsFragmentString + '\n' + fragmentPars
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        mainFragmentString,
        mainFragmentString + '\n' + fragmentMain
      )
    },
  })

    // this.planeGeometry = new T.PlaneGeometry(1, 1, 128, 128);
    // this.planeMaterial = new T.ShaderMaterial({
    //   side: T.DoubleSide,
    //   wireframe: true,
    //   fragmentShader: fragment,
    //   vertexShader: vertex,
    //   uniforms: {
    //     progress: { type: 'f', value: 0 }
    //   }
    // });

    this.planeMesh = new T.Mesh(this.planeGeometry, this.planeMaterial);
    this.scene.add(this.planeMesh);
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();

    this.planeMesh.rotation.x = 0.2 * elapsedTime;
    this.planeMesh.rotation.y = 0.1 * elapsedTime;

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }

  setResize() {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    device.width = window.innerWidth;
    device.height = window.innerHeight;

    this.camera.aspect = device.width / device.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
  }
}