import type { ICanvasDimension, ELoadingStatus } from "@datastore/store.props";
import type { Color } from "three";

enum EEngineStatus {
	RUNNING = "running",
	PAUSED = "paused",
	STOPPED = "stopped"
}

interface IDebugProps {
	fpsDisplayContainer?: HTMLElement;
}

interface IRenderProps {
	fps?: number;
	fpsInterval?: number;
	fpsTolerance?: number;
	threaded?: boolean;
	clearColor?: Color;
}

interface ISceneManagerProps {
	canvasId?: string;
	canvasDimension?: ICanvasDimension;
	fitToScreen?: boolean;
	render?: IRenderProps;
	debug?: IDebugProps;
}

interface ISceneInfo {
	sceneName: string;
	description?: string;
	defaultCamera?: number;
}

interface IScene {
	info: ISceneInfo;
	sceneclass: any;
}

interface IStoreDispatcher {
	setLoadingStatus: (status: ELoadingStatus)=>void;
}

export {
	EEngineStatus,
	IDebugProps,
	IRenderProps,
	ISceneManagerProps,
	ISceneInfo,
	IScene,

	IStoreDispatcher
};