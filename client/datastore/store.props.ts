import mapStateToProps from "./app/selectors";
import mapDispatchToProps from "./app/actions";

enum EReducerTypes {
	RESET = 0,
	UPDATE_ERROR = 1,
	UPDATE_CURRENT_SCENE = 2,
	SET_LOADING_STATUS = 3,
	SET_AUDIO_STATUS = 4
}

enum ELoadingStatus {
	NULL = 0,
	LOADING = 1,
	LOADED = 2
}

interface IReducer {
	error: IError;
	scene: string;
	loadingStatus: ELoadingStatus;
	settings: ISettings;
}

interface IActions {
	type: EReducerTypes;
	payload?: string | number | boolean | Record<string, any> | object | null | undefined | ELoadingStatus;
}

interface IError {
	type: number | null;
	message: string | null;
}

interface ICanvasDimension {
	width: number;
	height: number;
}

interface ISettings {
	canvasDimension: ICanvasDimension;
}

interface IStoreState {
	app: IReducer;
}

interface IStore {
	subscribe: (arg: ()=>void)=>void;
	getState: ()=>IReducer;
}

export {
	mapStateToProps,
	mapDispatchToProps,

	EReducerTypes,
	ELoadingStatus,
	IReducer,
	IActions,
	IError,
	ICanvasDimension,
	ISettings,
	IStoreState,
	IStore
};