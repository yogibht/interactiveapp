import { Vector2, Vector3, Frustum, Raycaster, Object3D, Box3, Matrix4, SphereGeometry, MeshBasicMaterial, Mesh } from "three";
import type { Scene, Camera } from "three";
import { uuidv4 } from "@utilities/general";

interface IPinProps {
	id?: string;
	pinWidth?: number;
	position?: Vector3;
	occludable?: boolean;
	renderMesh?: boolean;
}

class Pin{

	private scene: Scene;
	private canvas: HTMLCanvasElement;
	private camera: Camera;

	private props: IPinProps;

	private threeObject: Object3D;
	private raycaster: Raycaster;
	private frustum: Frustum;

	constructor(scene: Scene, camera: Camera, canvas: HTMLCanvasElement, props?: IPinProps){
		this.scene = scene;
		this.canvas = canvas;
		this.camera = camera;

		this.props = this.setupDefaults(props);

		this.frustum = new Frustum();
		this.raycaster = new Raycaster();

		this.createObject();
	}

	private setupDefaults(props?: IPinProps): IPinProps{
		if(!props) props = {};

		if(!props.id) props.id = uuidv4();
		if(!props.pinWidth) props.pinWidth = 5;
		if(!props.position) props.position = new Vector3(0, 0, 0);
		if(typeof props?.occludable !== "boolean") props.occludable = false;

		return props;
	}

	private createObject(): void{
		if(this.props.renderMesh){
			const geometry = new SphereGeometry(0.25, 8, 8);
			const material = new MeshBasicMaterial({color: 0xffff00});
			this.threeObject = new Mesh(geometry, material);
		}
		else{
			this.threeObject = new Object3D();
		}

		this.threeObject.position.set(this.props.position?.x as number, this.props.position?.y as number, this.props.position?.z as number);

		this.scene.add(this.threeObject);
	}

	public getScreenPosition(normalized: boolean=false): Vector2 {
		let pos = new Vector3(0, 0, 0);
		pos = pos.setFromMatrixPosition(this.threeObject.matrixWorld);
		pos.project(this.camera);

		const screenPosition = new Vector2(pos.x, pos.y);
		if(normalized) return screenPosition;

		screenPosition.x = (screenPosition.x * (this.canvas.width * 0.5)) + (this.canvas.width * 0.5);
		screenPosition.y = (this.canvas.height * 0.5) - (screenPosition.y * (this.canvas.height * 0.5));

		screenPosition.x -= (this.props.pinWidth as number) * 0.5;
		screenPosition.y -= (this.props.pinWidth as number) * 0.5;

		return screenPosition;
	}

	public isInFrustum(): boolean{
		this.frustum.setFromProjectionMatrix(new Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse));
		const arbitrarybox = new Box3();
		const boundinbox = arbitrarybox.setFromPoints([this.threeObject.position]);
		return this.frustum.intersectsBox(boundinbox);
	}

	public isOccluded(): boolean{
		if(this.props.occludable){
			const pinDirection = new Vector3();
			const far = new Vector3();

			far.subVectors(this.threeObject.position, this.camera.position);
			pinDirection.subVectors(this.threeObject.position, this.camera.position).normalize();

			this.raycaster.set(this.camera.position, pinDirection);
			this.raycaster.far = far.length();

			const intersects = this.raycaster.intersectObjects(this.scene.children).filter(intersectedChild=>{
				if(this.props.renderMesh) return intersectedChild.object.uuid!==this.threeObject.uuid;
				else return true;
			});
			return intersects?.length ? true : false;
		}
		return false;
	}

	public dispose(): void{
		this.scene.remove(this.scene.getObjectById(this.threeObject.id) as Object3D);
	}

	public updateProps(newProps: IPinProps): void{
		this.props = {
			...this.props,
			...newProps
		};
	}
}

export {
	Pin,

	IPinProps
};