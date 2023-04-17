import styles from "./loader.scss";

import { LitElement, html, unsafeCSS } from "lit";
import type { CSSResult, TemplateResult } from "lit";

class Loader extends LitElement {

	public param: number = 0;

	public static get styles(): CSSResult{
		return unsafeCSS(styles.toString());
	}

	public static get properties(): Record<string, any> {
		return {
			param: {type: Number}
		};
	}

	constructor(){
		super();
	}

	public connectedCallback(): void{
		super.connectedCallback();
	}

	public render(): TemplateResult{
		return html`
			<div class="splashscreen">
                <div class="lds-dual-ring"></div>
            </div>
        `;
	}
}

export { Loader };

customElements.define("loader-component", Loader);