import { configureStore } from "@reduxjs/toolkit";
import thunk from "redux-thunk";
import AppReducer from "./app/reducers";
import type { IReducer } from "./store.props";

interface IStoreState{
	app: IReducer;
}

interface IComponent{
	state: IStoreState;
	stateChanged: (arg: IStoreState)=>void;
}

const store = configureStore({
	reducer: {
		app: AppReducer
	},
	middleware: [
		thunk
	]
});

const subscribeStore = (store: AppStore, callback: (newState: IReducer)=>void): void => {
	store.subscribe(() => {
		const newStoreState = store.getState();
		callback(newStoreState.app);
	});
};

const connect = (store: AppStore) => (component: IComponent): RootState => {
	store.subscribe(()=>{
		const newStoreState = store.getState();
		if((component.state!==undefined || component.state!==null) && component.state!==newStoreState){
			component.state = newStoreState;
			if((component.stateChanged!==undefined || component.stateChanged!==null) && typeof component.stateChanged==="function"){
				component.stateChanged(newStoreState);
			}
		}
	});
	return store.getState();
};

export default store;

// eslint-disable-next-line @typescript-eslint/no-type-alias
export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;

export {
	subscribeStore,
	connect
};