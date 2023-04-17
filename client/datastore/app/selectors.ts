import type { IStoreState, ELoadingStatus, ISettings } from "../store.props";

const getLoadingStatus = (storeState: IStoreState): ELoadingStatus => {
	return storeState.app.loadingStatus;
};
const getCurrentScene = (storeState: IStoreState): string => {
	return storeState.app.scene;
};
const getSettings = (storeState: IStoreState): ISettings => {
	return storeState.app.settings;
};

const mapStateToProps = (storeState: IStoreState): object => {
	return {
		app: storeState.app,
		// we don't have to pass entire store state here, we can create method to select specific data from the store, for eg.
		getLoadingStatus,
		getCurrentScene,
		getSettings
	};
};

export {
	getLoadingStatus,
	getCurrentScene,
	getSettings
};
export default mapStateToProps;