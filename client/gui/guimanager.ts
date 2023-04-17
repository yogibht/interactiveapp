import styles from "./guimanager.scss";

import { LitElement, html, unsafeCSS } from "lit";
import type { CSSResult, TemplateResult } from "lit";

import store, { connect } from "@datastore/store";
import type { RootState } from "@datastore/store";

import { ELoadingStatus } from "@datastore/store.props";

import { loadScene } from "@datastore/app/actions";

import { SceneManager } from "@rendering/scenemanager";

import "@components/loader";

class GUIManager extends LitElement {

	public state: RootState;

	private renderCanvas: HTMLCanvasElement;
	private sceneManager: SceneManager;

	private fpsDisplayContainer: HTMLElement;

	public static get styles(): CSSResult{
		return unsafeCSS(styles.toString());
	}

	public connectedCallback(): void{
		super.connectedCallback();
		this.state = connect(store)(this);
	}

	public stateChanged(state: RootState): void{
		this.state = state;
		this.requestUpdate();
	}

	constructor(){
		super();
	}

	public firstUpdated(): void{
		if(!this.renderCanvas) this.initializeSceneManager()
			.then()
			.catch(err=>console.error(err));
	}

	private async initializeSceneManager(): Promise<void>{
		this.renderCanvas = this.shadowRoot?.querySelector("#rendercanvas") as HTMLCanvasElement;
		this.fpsDisplayContainer = this.shadowRoot?.querySelector("#fps-display") as HTMLElement;

		/** Temporary **/
		const tempCanvas = this.shadowRoot?.querySelector("#tempcanvas") as HTMLCanvasElement;
		/***************/

		this.sceneManager = new SceneManager(this.renderCanvas, {
			debug: {
				fpsDisplayContainer: this.fpsDisplayContainer
			},
			render: {
				// fps: 60
			}
		}, tempCanvas);

		try{
			await this.sceneManager.startEngine();

			/** This is an example of single frame draw call **/
			// store.dispatch(loadScene("mainscene"));
			// setTimeout(()=>{
			// 	this.sceneManager.renderFrame(false);
			// }, 1000);
			/*********************/

			document.addEventListener("keyup", (event)=>{
				if(event.key==="p"){
					// This is to demo pausing of the animation loop. Should probably set this using redux store.
					this.sceneManager.pause = !this.sceneManager.pause;
					this.requestUpdate();
				}
				else if(event.key==="r"){
					this.sceneManager.renderFrame(true, true);
				}
				else if(event.key==="s"){
					const newSceneName = this.state.app.scene === "orthoscene" ? "mainscene" : "orthoscene";
					store.dispatch(loadScene(newSceneName));
					// this.sceneManager.changeScene(newSceneName)
					// 	.then(_=>this.requestUpdate())
					// 	.catch(err=>console.error(err));
				}
				else if(event.key==="c"){
					this.sceneManager.saveCameraStates()
						.catch(err=>console.error(err));
				}
			});

			return Promise.resolve();
		}
		catch(err){console.error(err);}
	}

	public render(): TemplateResult{

		const {app: {scene, loadingStatus}} = this.state;

		return html`
			<div id="gui-manager">
				${(loadingStatus===ELoadingStatus.LOADING) ? html`<loader-component></loader-component>` : ""}
				<div id="fps-display"></div>
				<div id="scene-info">
					<span>${scene}</span>
					${this.sceneManager?.pause ? html`<span>&#9208;</span>` : ""}
				</div>
				<canvas id="rendercanvas"></canvas>
				<div>
					<div>Input Keys</div>
					<div>s : Change Scene</div> 
					<div>r : Render To Texture</div>
					<div>p : Pause Animation Loop</div>
					<div>c : Save Camera State</div> 
				</div>
				<canvas id="tempcanvas"></canvas>
			</div>
		`;
	}
}

export { GUIManager };

customElements.define("gui-manager", GUIManager);