import type { Vector3 } from "three";

enum ECameraType{
	FPS,
	Orbit
}

interface ICameraLimits {
	minTheta: number;               // Theta should be between -360 -> 360. Keep in mind that -360 === 360, in the current implementation of camera
	maxTheta: number;
	minPhi: number;                 // phi should be between -180 -> 180. For orbit cam it should be between 0 -> 180
	maxPhi: number;
	minRadius: number;              // min radius should be set 10 points above where you want to set it.
	maxRadius: number;              // max radius should be set 10 points below where you want to set it.
}

interface ICameraProps{
	id?: string;
	type: ECameraType;
	position: Vector3;
	theta: number;
	phi: number;
	radius: number;
	ortho?: boolean;
	fov?: number;
	aspect?: number;
	turnRatio?: number;
	dampingFactor?: number;
	limits?: ICameraLimits;
	hotspots?: number[];
}

export {
	ECameraType,
	ICameraLimits,
	ICameraProps
};