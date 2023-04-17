import { EReducerTypes, ELoadingStatus } from "../store.props";
import type { IActions, IError, IReducer } from "../store.props";

const initstate: IReducer = {
	error: {
		type: null,                         // 1: syntax error, 2: network error, 3: content error, 4: misc error
		message: null
	},
	scene: "",
	loadingStatus: ELoadingStatus.LOADING,
	settings: {
		canvasDimension: {
			width: window.innerWidth,//854
			height: window.innerHeight//480
		}
	}
};
  
const AppReducer = (state=initstate, action: IActions): IReducer => {
	switch(action.type){
		case EReducerTypes.RESET:
			state=initstate;
			break;
		case EReducerTypes.UPDATE_ERROR:
			state = {
				...state,
				error: {
					...action.payload as object
				} as IError
			};
			break;
		case EReducerTypes.UPDATE_CURRENT_SCENE:
			state = {
				...state,
				scene: action.payload as string
			};
			break;
		case EReducerTypes.SET_LOADING_STATUS:
			state = {
				...state,
				loadingStatus: action.payload as ELoadingStatus
			};
			break;
		default:
			break;
	}
	return state;
};
  
export default AppReducer;