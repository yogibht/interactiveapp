import { Scene, Vector3, AmbientLight } from "three";
import type { WebGLRenderer, Object3D } from "three";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { MaskPass } from "three/examples/jsm/postprocessing/MaskPass.js";

import type { IStoreDispatcher } from "@rendering/scenemanager.props";

import { AssetProcessor } from "@tools/assetprocessor";
import type { IAsset } from "@tools/assetprocessor";

import { CameraManager } from "@systems/camera/cameramanager";

import type { ISceneProps } from "@rendering/entity.props";

import { PinsManager } from "@systems/pins/pinsmanager";
import { PinsData } from "@systems/pins/pins.data";

class MainScene{

	private renderer: WebGLRenderer;
	private canvas: HTMLCanvasElement;
	private props: ISceneProps;	// This should be scene props instead of entity props

	private scene: Scene;
	// private mainCamera: MainCamera;
	private cameraManager: CameraManager;

	private modelProcessor: AssetProcessor;
	private mainObject: Object3D;//GLTF["scene"];

	private pinsManager: PinsManager;

	private maskComposer: EffectComposer;

	constructor(renderer: WebGLRenderer, canvas: HTMLCanvasElement, props: ISceneProps){
		this.renderer = renderer;
		this.canvas = canvas;
		this.props = props;

		this.modelProcessor = new AssetProcessor();
	}

	public async createScene(storeDispatcher: IStoreDispatcher): Promise<Scene | undefined>{
		try{
			this.scene = new Scene();

			const ambientLight = new AmbientLight(0xffffff, 0.5);
			this.scene.add(ambientLight);

			const modelfileurl = "/gameassets/models/akirabike.glb";

			const bike: IAsset = await this.modelProcessor.load(modelfileurl) as IAsset;

			this.mainObject = bike.scene;

			this.scene.add(this.mainObject);

			this.cameraManager = new CameraManager({scene: this.scene, renderer: this.renderer});
			await this.cameraManager.init(false);

			this.pinsManager = new PinsManager(this.scene, this.cameraManager.camera, this.renderer.domElement);
			this.pinsManager.create(PinsData);

			// this.setupPostProcessing();

			return this.scene;
		}
		catch(err){
			console.error(err);
		}
	}

	private setupPostProcessing(): void{
		// Maybe use depth texture instead? Could also go the longer route with, 1. replacing textured material with empty unlit material, 2. render to texture, 3. revert material swap
		
		const renderPass = new RenderPass(this.scene, this.cameraManager.camera);
		// Probably need a shaderpass before mask pass?
		const maskPass = new MaskPass(this.scene, this.cameraManager.camera);

		this.maskComposer = new EffectComposer(this.renderer);
		this.maskComposer.setSize(this.renderer.domElement.width, this.renderer.domElement.height);
		// this.maskComposer.renderToScreen = false;
		this.maskComposer.addPass(renderPass);
		// this.maskComposer.addPass(maskPass);
	}


	public update(tpf?: number): void{
		this.cameraManager?.update(tpf);
		this.pinsManager?.update(tpf);
		this.render(tpf);
	}

	public dispose(callBack?: ()=>void): void{
		// Need to do bunch of graceful disposal
		this.cameraManager?.dispose();
		this.pinsManager?.dispose();

		if(callBack) callBack();
	}

	public updateProps(newProps: ISceneProps): void{
		if(typeof newProps["running"]==="boolean") this.cameraManager.enabled = newProps["running"];
	}

	public render(tpf?: number): void{
		if(this.maskComposer) this.maskComposer?.render(tpf);
		else if(this.cameraManager?.camera) this.renderer.render(this.scene, this.cameraManager.camera);
	}

	public getPinCanvasImage(toURL?: boolean): string | ImageData | undefined{
		return this.pinsManager?.getImageData(toURL as boolean);
	}

	public async saveCamera(): Promise<void>{
		try{
			await this.cameraManager.save();
		}
		catch(err){
			console.error(err);
		}
	}
}

export {
	MainScene
};