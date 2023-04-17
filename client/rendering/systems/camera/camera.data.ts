import { Vector3 } from "three";
import { ECameraType } from "@systems/camera/camera.props";
import type { ICameraProps } from "@systems/camera/camera.props";

const CameraData: ICameraProps[] = [
	{
		id: "perspcam",
		type: ECameraType.Orbit,
		position: new Vector3(0, 0, 0),
		theta: 0,
		phi: 25,
		radius: 10,
		limits: {
			maxTheta: 360,
			minTheta: -360,
			maxPhi: 90,
			minPhi: 0,
			maxRadius: 20,
			minRadius: 5
		}
	},
	{
		id: "orthocam",
		type: ECameraType.Orbit,
		position: new Vector3(0, 0, 0),
		theta: 0,
		phi: 25,
		radius: 10,
		limits: {
			maxTheta: 360,
			minTheta: -360,
			maxPhi: 90,
			minPhi: 0,
			maxRadius: 20,
			minRadius: 5
		},
		ortho: true
	}
];

export {
	CameraData
};