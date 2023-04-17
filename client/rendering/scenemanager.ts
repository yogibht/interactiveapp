import {
	WebGLRenderer,
	PCFSoftShadowMap,
	BasicShadowMap,
	Color,
	sRGBEncoding,
	ACESFilmicToneMapping,
	Clock,
	WebGLRenderTarget
} from "three";

import { findFPS } from "@utilities/general";

import Store, { subscribeStore } from "@datastore/store";
import { loadScene, setLoadingStatus } from "@datastore/app/actions";
import type { IReducer } from "@datastore/store.props";
import { ELoadingStatus } from "@datastore/store.props";
import { EEngineStatus } from "./scenemanager.props";
import type { ISceneManagerProps, IScene, IStoreDispatcher } from "./scenemanager.props";
import type { ISceneProps } from "./entity.props";

import { MainScene } from "@scenes/mainscene";
import { OrthoScene } from "@scenes/orthoscene";

const SceneClasses: IScene[] = [
	{
		info: {
			sceneName: "mainscene",
			description: "",
			defaultCamera: 0
		},
		sceneclass: MainScene
	},
	{
		info: {
			sceneName: "orthoscene",
			description: "",
			defaultCamera: 0
		},
		sceneclass: OrthoScene
	}
];

class SceneManager {

	private canvas: HTMLCanvasElement;
	private renderer: WebGLRenderer;

	/** Temporary **/
	private tempCanvas: HTMLCanvasElement;
	/***************/

	private renderTarget: WebGLRenderTarget;

	private props: ISceneManagerProps;
	private storeState: IReducer | ISceneProps;

	/*********************************************/
	// Looping related attribs and methods
	// This could be moved to a separate class? For now it's here
	private then: number = 0;
	private loopId: number = 0;
	/*********************************************/

	private engineStatus: EEngineStatus = EEngineStatus.STOPPED;

	private sceneObject: MainScene | OrthoScene | undefined;

	constructor(canvas: HTMLCanvasElement, smProps?: ISceneManagerProps, tempCanvas?: HTMLCanvasElement){
		this.props = this.setDefaultProps(smProps);

		this.canvas = canvas;
		this.canvas.width = this.canvas.offsetWidth;
		this.canvas.height = this.canvas.offsetHeight;

		/** Temporary **/
		this.tempCanvas = tempCanvas as HTMLCanvasElement;
		/***************/

		this.renderer = new WebGLRenderer({
			canvas: this.canvas,
			alpha: true,
			antialias: true,
			preserveDrawingBuffer: true
		});
		this.renderer.setSize(this.canvas.width, this.canvas.height);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		// this.renderer.shadowMap.enabled = true;
		// this.renderer.toneMapping = ACESFilmicToneMapping;
		// this.renderer.toneMappingExposure = 1;
		// this.renderer.shadowMap.type = PCFSoftShadowMap;
		this.renderer.setClearColor(this.props.render?.clearColor as Color, 1.0);
		this.renderer.outputEncoding = sRGBEncoding;

		if(this.props.fitToScreen){
			document.addEventListener("resize", (event)=>{
			
				this.canvas.width = window.innerWidth;
				this.canvas.height = window.innerHeight;
	
				this.renderer.setSize(window.innerWidth, window.innerHeight);
				// this.renderer.setPixelRatio(window.devicePixelRatio);
	
				if(this.sceneObject){
					// Update camera aspect and projectionmatrix here
					// this.sceneObject.camera.aspect = this.renderer.domElement.width / this.renderer.domElement.height;
					// this.sceneObject.camera.updateProjectionMatrix();
				}
			});
		}

		this.renderTarget = new WebGLRenderTarget(this.renderer.domElement.width, this.renderer.domElement.height);

		this.storeState = Store.getState().app;
		this.props = {
			...this.props,
			...this.storeState
		};

		subscribeStore(Store, this.updateSceneProps.bind(this));
	}

	// Maybe better to return entire status instead of a boolean?
	public get running(): boolean{
		return this.engineStatus === EEngineStatus.RUNNING;
	}

	public get pause(): boolean{
		return this.engineStatus===EEngineStatus.PAUSED;
	}
	public set pause(state: boolean){
		this.engineStatus = state ? EEngineStatus.PAUSED : EEngineStatus.RUNNING;
		if(!this.loopId && this.engineStatus===EEngineStatus.RUNNING) this.animateFrame(performance.now());
		if(this.sceneObject) this.sceneObject.updateProps({
			running: this.engineStatus===EEngineStatus.RUNNING
		});
	}

	private setDefaultProps(props?: ISceneManagerProps): ISceneManagerProps{
		if(!props) props = {};
		if(!props.render) props.render = {};
		if(!props.render.clearColor) props.render.clearColor = new Color(0x201326);

		return props;
	}

	private async setDefaultRenderProps(): Promise<void>{
		try{
			const systemFPS = await findFPS();

			if(!this.props.render) this.props.render = {};
			if(!this.props.render.fps || this.props.render.fps>systemFPS) this.props.render.fps = systemFPS;
			this.props.render.fpsTolerance = 0.1;
			this.props.render.fpsInterval = (1000 / (this.props.render.fps ?? 0)) - this.props.render.fpsTolerance;
			
			this.then = performance.now();
		}
		catch(err){
			console.error(err);
		}
	}

	private animateFrame(now: number): void{
		if(this.engineStatus===EEngineStatus.PAUSED){
			this.loopId = 0;
			return;
		}

		this.loopId = requestAnimationFrame(this.animateFrame.bind(this));

		const delta = now - this.then;

		if(delta < (this.props.render?.fpsInterval as number)) return;

		if(this.props.debug?.fpsDisplayContainer) this.props.debug.fpsDisplayContainer.innerHTML = `${Math.round(1000 / delta)} fps`;

		this.sceneObject?.update(delta);

		this.then = now;
	}

	// Call this if you don't want to run engine
	public renderFrame(renderToTarget?: boolean, useDataURL?: boolean): void{
		if(renderToTarget){
			// Needs heavy modifications to support masking as well as image generation

			let pixels: string | Uint8Array | undefined;
			
			if(useDataURL){
				pixels = this.renderer.domElement.toDataURL();
			}
			else{
				this.renderer.setRenderTarget(this.renderTarget);

				this.renderer.clear();
				this.sceneObject?.render();

				/** Generate pixels from rendertarget **/
				pixels = new Uint8Array(this.renderer.domElement.width * this.renderer.domElement.height * 4);
				this.renderer.readRenderTargetPixels(this.renderTarget, 0, 0, this.renderer.domElement.width, this.renderer.domElement.height, pixels);

				this.renderer.setRenderTarget(null);
			}
			
			const pinsImageData = this.sceneObject?.getPinCanvasImage(useDataURL);
			
			this.generateImageFile(pixels, pinsImageData);
		}
		else this.sceneObject?.render();
	}

	/** TEMP IMAGE GENERATOR **/
	private generateImageFile(pixels: Uint8Array | string, pinsImageData?: ImageData | string): void{
		this.tempCanvas.width = this.renderer.domElement.width;
		this.tempCanvas.height = this.renderer.domElement.height;
		
		const tempContext = this.tempCanvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D ;

		if(typeof pixels === "string"){
			const renderImage = new Image();
			renderImage.onload = (): void=>{
				// tempContext.globalAlpha = 1;
				tempContext.drawImage(renderImage, 0, 0);
			};
			renderImage.src = pixels;
		}
		else{
			const contextData = tempContext.getImageData(0, 0, this.renderer.domElement.width, this.renderer.domElement.height);

			for(let y = 0; y < this.renderer.domElement.height; y++){
				for(let x = 0; x < this.renderer.domElement.width; x++){
			
					const color = [
						pixels[y * this.renderer.domElement.width * 4 + x * 4 + 0],
						pixels[y * this.renderer.domElement.width * 4 + x * 4 + 1],
						pixels[y * this.renderer.domElement.width * 4 + x * 4 + 2],
						pixels[y * this.renderer.domElement.width * 4 + x * 4 + 3]
					];
				
					contextData.data[(y * this.renderer.domElement.width * 4) + (x * 4) + 0] = color[0] as number;
					contextData.data[(y * this.renderer.domElement.width * 4) + (x * 4) + 1] = color[1] as number;
					contextData.data[(y * this.renderer.domElement.width * 4) + (x * 4) + 2] = color[2] as number;
					contextData.data[(y * this.renderer.domElement.width * 4) + (x * 4) + 3] = color[3] as number;
				}
			}
			
			tempContext.putImageData(contextData, 0, 0);
		}

		if(typeof pinsImageData === "string"){
			const pinsImage = new Image();
			pinsImage.onload = (): void=>{
				// tempContext.globalAlpha = 1;
				tempContext.drawImage(pinsImage, 0, 0);
			};
			pinsImage.src = pinsImageData;
		}
	}
	/**************************/

	public async startEngine(): Promise<void | string>{
		try{
			await this.setDefaultRenderProps();

			this.animateFrame(performance.now());

			// If you don't want to loop render, then call this method from upstream
			const startingScene = SceneClasses[0]?.info?.sceneName ?? "mainscene";
			this.loadScene(startingScene);

			this.engineStatus = EEngineStatus.RUNNING;
		}
		catch(err){
			console.error(err);
		}
	}

	public stopEngine(): void{
		if(this.sceneObject){
			this.sceneObject.dispose();
			this.sceneObject = undefined;
		}
		this.renderer?.renderLists?.dispose();
		window.removeEventListener("resize", ()=>null);

		cancelAnimationFrame(this.loopId);

		this.engineStatus = EEngineStatus.STOPPED;
	}

	public loadScene(sceneName: string): void{
		Store.dispatch(loadScene(sceneName));
	}

	public updateSceneProps(newState: IReducer): void{

		const previousScene = this.storeState.scene;
		this.storeState = {
			...this.storeState,
			...newState
		};
		this.props = {
			...this.props,
			...this.storeState
		};
		if(this.sceneObject) this.sceneObject.updateProps((this.storeState as unknown as ISceneProps));
		if(previousScene !== this.storeState.scene){
			this.changeScene(this.storeState.scene as string)
				.then(_=>this.renderFrame())
				.catch(err=>console.error(err));
		}
	}

	public async changeScene(newSceneName: string): Promise<void>{
		try{
			this.setLoadingStatus(ELoadingStatus.LOADING);

			if(this.sceneObject) this.sceneObject.dispose();

			const SelectedScene = SceneClasses.find(sceneClass=>sceneClass.info.sceneName===newSceneName);
			if(SelectedScene){
				// Might not be a good idea?
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
				this.sceneObject = new SelectedScene.sceneclass(this.renderer, this.canvas, this.props);
				await this.sceneObject?.createScene(this.getAllStoreDispatchers());
			}

			setTimeout(()=>{
				this.setLoadingStatus(ELoadingStatus.LOADED);
			}, 1000);
		}
		catch(err){
			console.error(err);
		}
	}

	public async saveCameraStates(): Promise<void>{
		try{
			await this.sceneObject?.saveCamera();
		}
		catch(err){
			console.error(err);
		}
	}

	private getAllStoreDispatchers(): IStoreDispatcher{
		return {
			setLoadingStatus: this.setLoadingStatus.bind(this)
		};
	}

	private setLoadingStatus(status: ELoadingStatus): void{
		Store.dispatch(setLoadingStatus(status));
	}

}

export {
	SceneManager
};