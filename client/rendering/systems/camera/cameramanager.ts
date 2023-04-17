import type { WebGLRenderer, PerspectiveCamera, OrthographicCamera, Camera, Object3D } from "three";
import { Scene } from "three";

import type { ICameraProps } from "./camera.props";
import { MainCamera } from "./camera";
import { CameraData } from "./camera.data";

import type { IEntityArg } from "@rendering/entity.props";

import { AssetProcessor } from "@tools/assetprocessor";
import type { GLTFExporterOptions } from "three/examples/jsm/exporters/GLTFExporter";

class CameraManager{

	private scene: Scene;
	private renderer: WebGLRenderer;

	private cameras: MainCamera[] = [];
	public currentCamera: number = 0;

	private assetProcessor: AssetProcessor;

	constructor({scene, renderer}: IEntityArg, defaultCamera?: number, assetProcessor?: AssetProcessor){
		this.scene = scene;
		this.renderer = renderer as WebGLRenderer;

		if(!Number.isNaN(defaultCamera) && (defaultCamera as number) < CameraData.length){
			this.currentCamera = defaultCamera as number;
		}

		if(!(assetProcessor instanceof AssetProcessor)) this.assetProcessor = new AssetProcessor();
		else this.assetProcessor = assetProcessor;
	}

	public get camera(): (Camera | PerspectiveCamera | OrthographicCamera){
		return this.cameras[this.currentCamera]?.camera as (Camera | PerspectiveCamera | OrthographicCamera);
	}

	public set enabled(status: boolean){
		if(this.cameras[this.currentCamera]) (this.cameras[this.currentCamera] as MainCamera).enabled = status;
	}

	public async init(loadFromFile?: boolean): Promise<void>{
		try{
			if(loadFromFile){
				const loadedCameras = await this.loadCameraGLTF();
				if(loadedCameras?.length){
					for(let i=0; i<loadedCameras.length; i++){
						await this.loadCamera(this.scene, this.renderer, loadedCameras[i] as (PerspectiveCamera | OrthographicCamera));
					}
				}
			}
			else{
				for(let i=0; i<CameraData.length; i++){
					await this.createCamera(this.scene, this.renderer, CameraData[i] as ICameraProps);
				}
			}
		}
		catch(err){
			console.error(err);
		}
	}

	private async createCamera(scene: Scene, renderer: WebGLRenderer, cameraProps: ICameraProps): Promise<void>{
		try{
			const newCam = new MainCamera({scene, renderer});
			await newCam.create(cameraProps);

			this.cameras.push(newCam);
		}
		catch(err){
			console.error(err);
		}
	}
	private async loadCamera(scene: Scene, renderer: WebGLRenderer, camera: PerspectiveCamera | OrthographicCamera): Promise<void>{
		try{
			const newCam = new MainCamera({scene, renderer});
			await newCam.create();

			newCam.load(camera);

			this.cameras.push(newCam);
		}
		catch(err){
			console.error(err);
		}
	}

	public update(tpf?: number): void{
		this.cameras[this.currentCamera]?.update(tpf);
	}

	public dispose(callBack?: ()=>void): void{
		for(let i=0; i<this.cameras.length; i++){
			this.cameras[i]?.dispose(callBack);
		}
	}

	public async save(): Promise<void | string>{
		try{
			await this.saveCameraGLTF();
		}
		catch(err){
			console.error(err);
		}
	}

	private async saveCameraGLTF(): Promise<void | string>{
		const camScene: Scene = new Scene();
		for(let i=0; i<this.cameras.length; i++){
			camScene.add(this.cameras[i]?.camera as Camera);
		}

		const exporterOption: GLTFExporterOptions = {
			binary: false
		};

		try{
			await this.assetProcessor.save(camScene, "cameras.gltf", exporterOption);
		}
		catch(err){
			console.error(err);
		}
	}

	private async loadCameraGLTF(): Promise<(Camera | PerspectiveCamera | OrthographicCamera)[] | undefined>{
		try{
			const loadedCameras = await this.assetProcessor.load("/gameassets/cameras/cameras.gltf");
			return loadedCameras?.scene.children[0]?.children as (Camera | PerspectiveCamera | OrthographicCamera)[];
		}
		catch(err){
			console.error(err);
		}
	}
}

export {
	CameraManager
};