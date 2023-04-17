import parentStyles from "./index.scss";

import { LitElement, html, unsafeCSS } from "lit";
import type { CSSResult, TemplateResult } from "lit";

import store, { connect } from "@datastore/store";
import type { RootState } from "@datastore/store";

import "@gui/guimanager";

class App extends LitElement {
    
	public state: RootState;

	constructor(){
		super();
	}

	public static get styles(): CSSResult{
		return unsafeCSS(parentStyles.toString());
	}

	public connectedCallback(): void{
		super.connectedCallback();
		this.state = connect(store)(this);

		console.log("app initiated");
	}

	public stateChanged(state: RootState): void{
		this.state = state;
		console.log(this.state);
		this.requestUpdate();
	}

	public render(): TemplateResult{
		const {app: {error}} = this.state;

		return html`
			<gui-manager></gui-manager>
		`;
	}
}

export { App };

customElements.define("main-app", App);


/** Need this for PWA. There must be a better place to put this and run it? Lots of optimization needed**/
/*
window.addEventListener("load", function(){
	registerSW();
});

async function registerSW(){
	if ("serviceWorker" in navigator) {
		try {
			await navigator.serviceWorker.register("/mainserviceworker.js");
			console.log("ServiceWorker registration successful");
		} catch (e) {
			console.log("ServiceWorker registration failed. Sorry about that.", e);
		}
	} else {
		console.log("Your browser does not support ServiceWorker.");
	}
}
*/
/****** */