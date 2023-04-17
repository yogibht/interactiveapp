import { Scene, AmbientLight, Vector3 } from "three";
import type { WebGLRenderer, Object3D } from "three";

import type { IStoreDispatcher } from "@rendering/scenemanager.props";

import { AssetProcessor } from "@tools/assetprocessor";
import type { IAsset } from "@tools/assetprocessor";

import { MainCamera } from "@systems/camera/camera";
import { CameraData } from "@systems/camera/camera.data";

import type { ISceneProps } from "@rendering/entity.props";

import { PinsManager } from "@systems/pins/pinsmanager";
import { PinsData } from "@systems/pins/pins.data";

class OrthoScene{

	private renderer: WebGLRenderer;
	private canvas: HTMLCanvasElement;
	private props: ISceneProps;

	private scene: Scene;
	private orthoCamera: MainCamera;

	private modelProcessor: AssetProcessor;
	private mainObject: Object3D;//GLTF["scene"];

	private pinsManager: PinsManager;

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

			this.orthoCamera = new MainCamera({
				scene: this.scene,
				renderer: this.renderer
			});
			await this.orthoCamera.create(CameraData[1]);

			const modelfileurl = "/gameassets/models/akirabike.glb";

			const bike: IAsset = await this.modelProcessor.load(modelfileurl) as IAsset;

			this.mainObject = bike.scene;

			this.scene.add(this.mainObject);

			this.pinsManager = new PinsManager(this.scene, this.orthoCamera.camera, this.renderer.domElement);
			this.pinsManager.create(PinsData);

			return this.scene;
		}
		catch(err){
			console.error(err);
		}
	}

	public update(tpf?: number): void{
		this.orthoCamera?.update(tpf);
		this.pinsManager?.update(tpf);
		this.render(tpf);
	}

	public dispose(callBack?: ()=>void): void{
		// Need to do graceful disposal
		this.orthoCamera.dispose();
		this.pinsManager?.dispose();

		if(callBack) callBack();
	}

	public updateProps(newProps: ISceneProps): void{
		if(typeof newProps["running"]==="boolean") this.orthoCamera.enabled = newProps["running"];
	}

	public render(tpf?: number): void{
		this.renderer.render(this.scene, this.orthoCamera.camera);
	}

	public getPinCanvasImage(toURL?: boolean): string | ImageData | undefined{
		return this.pinsManager?.getImageData(toURL as boolean);
	}

	public async saveCamera(): Promise<void>{
		// Scene without multicamera setup
		try{
			return Promise.resolve();
		}
		catch(err){
			console.error(err);
		}
	}
}

export {
	OrthoScene
};