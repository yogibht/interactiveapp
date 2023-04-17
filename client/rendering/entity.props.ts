import type { PerspectiveCamera, Camera, Scene, WebGLRenderer, Object3D, Mesh } from "three";

interface ISceneProps {
	[key: string]: Record<string, any> | boolean | number | string;
}

interface IEntityProps {
	[key: string]: Record<string, any>;
}

interface IEntityArg {
	scene: Scene;
	canvas?: HTMLCanvasElement;
	renderer?: WebGLRenderer;
	camera?: Camera | PerspectiveCamera;
	props?: IEntityProps;
}

/** This class will be extended */
class Entity {
	constructor(props: Record<string, any>) {}
	public create(): Promise<Mesh | Object3D | void | (Mesh | Object3D | null)[]> {return Promise.resolve();}
	public update(timePerFrame: number): void {}
	public dispose(onDisposed?: () => void): void {}
}

export {
	ISceneProps,
	IEntityProps,
	IEntityArg,
	Entity
};