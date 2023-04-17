import { Vector3 } from "three";
import type { IPinProps } from "./pin";
import { uuidv4 } from "@utilities/general";

const PinsData: IPinProps[] = [
	{
		id: uuidv4(),
		position: new Vector3(1, 0, 0),
		renderMesh: true,
		occludable: true
	},
	{
		id: uuidv4(),
		position: new Vector3(0, 3, 0),
		renderMesh: true,
		occludable: true
	}
];

export { PinsData };