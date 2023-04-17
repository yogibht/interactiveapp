import { EReducerTypes, ELoadingStatus } from "../store.props";
import type { IActions, IError } from "../store.props";

const logError = (newError: IError = {type: 0, message: ""}): IActions => {
	return {
		type: EReducerTypes.UPDATE_ERROR,
		payload: newError
	};
};

const loadScene = (sceneName: string): IActions => {
	return {
		type: EReducerTypes.UPDATE_CURRENT_SCENE,
		payload: sceneName
	};
};

const setLoadingStatus = (status: ELoadingStatus): IActions => {
	return {
		type: EReducerTypes.SET_LOADING_STATUS,
		payload: status
	};
};

const mapDispatchToProps = (dispatch: (method: IActions) => void, ownProps: Record<string, any>) : object => {
	return {
		logError: (newError: IError)=>dispatch(logError(newError)),
		loadScene: (sceneName: string): void=>{
			dispatch(setLoadingStatus(ELoadingStatus.LOADING));
			dispatch(loadScene(sceneName));
		},
		setLoadingStatus: (status: ELoadingStatus)=>dispatch(setLoadingStatus(status))
	};
};

export {
	logError,
	loadScene,
	setLoadingStatus
};
export default mapDispatchToProps;