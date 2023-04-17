import { Vector2 } from "three";
import type { Scene, Camera } from "three";

import { Pin } from "./pin";
import type { IPinProps } from "./pin";

import { randomInt } from "@utilities/general";

interface IPinDrawProps {
	from: Vector2;
	to: Vector2;
}

const LINE_WIDTH = 3;

class PinsManager{

	private scene: Scene;
	private canvas: HTMLCanvasElement;
	private camera: Camera;

	private pinCanvas: HTMLCanvasElement;
	private pinCanvasContext: CanvasRenderingContext2D | undefined;

	private pins: Pin[] = [];

	constructor(scene: Scene, camera: Camera, canvas: HTMLCanvasElement){
		this.scene = scene;
		this.camera = camera;
		this.canvas = canvas;

		this.createPinsCanvas();
	}

	public create(pinsData: IPinProps[]): void{
		for(let i=0; i<pinsData.length; i++){
			const newPin = new Pin(this.scene, this.camera, this.canvas, pinsData[i]);
			this.pins.push(newPin);
		}
	}

	private createPinsCanvas(): void{
		this.pinCanvas = document.createElement("CANVAS") as HTMLCanvasElement;
		this.pinCanvas.setAttribute("id", "pincanvas");

		this.pinCanvas.style.cssText = document.defaultView?.getComputedStyle(this.canvas, "").cssText as string;
		this.pinCanvas.style.zIndex = "1";
		// this.pinCanvas.style.border = `2px solid rgb(${randomInt(255, 125)}, ${randomInt(255, 125)}, ${randomInt(255, 125)})`;
		this.pinCanvas.style.position = "absolute";
		this.pinCanvas.style.left = `${this.canvas.getBoundingClientRect().left}px`;
		this.pinCanvas.style.top = `${this.canvas.getBoundingClientRect().top}px`;
		this.pinCanvas.style.pointerEvents = "none";

		this.pinCanvas.width = this.canvas.width;
		this.pinCanvas.height = this.canvas.height;

		this.pinCanvasContext = this.pinCanvas.getContext("2d") as CanvasRenderingContext2D;
		this.pinCanvasContext.lineWidth = LINE_WIDTH;

		document.body.append(this.pinCanvas);
	}

	public update(tpf?: number): void{
		const pinRenderData: IPinDrawProps[] = this.pins
			.filter(pin=>!pin.isOccluded())
			.map(pin=>{
				const pinPosition = pin.getScreenPosition();
				const fromPinPosition = new Vector2(pinPosition.x + LINE_WIDTH, pinPosition.y);
				const toPinPosition = new Vector2(pinPosition.x + LINE_WIDTH, pinPosition.y + 50);
				const pinProp: IPinDrawProps = {
					from: fromPinPosition,
					to: toPinPosition
				};
				return pinProp;
			});
		this.render(pinRenderData);
	}

	public render(pinRenderData: IPinDrawProps[]): void{
		this.pinCanvasContext?.clearRect(0, 0, this.pinCanvasContext.canvas.width, this.pinCanvasContext.canvas.height);

		for(let i=0; i<pinRenderData.length; i++){
			this.pinCanvasContext?.beginPath();
			(this.pinCanvasContext as CanvasRenderingContext2D).strokeStyle = "rgb(255, 0, 0)";
			this.pinCanvasContext?.moveTo(pinRenderData[i]?.from.x as number, pinRenderData[i]?.from.y as number);
			this.pinCanvasContext?.lineTo(pinRenderData[i]?.to.x as number, pinRenderData[i]?.to.y as number);
			this.pinCanvasContext?.stroke();
			this.pinCanvasContext?.closePath();
		}
	}

	public dispose(): void{
		for(let i=0; i<this.pins.length; i++){
			this.pins[i]?.dispose();
		}
		this.pinCanvasContext = undefined;
		this.pinCanvas.remove();
	}

	public getImageData(toURL?: boolean): string | ImageData | undefined{
		if(toURL) return this.pinCanvas.toDataURL();
		return this.pinCanvasContext?.getImageData(0, 0, this.pinCanvasContext.canvas.width, this.pinCanvasContext.canvas.height);
	}
}

export {
	PinsManager
};