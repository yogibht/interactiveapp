import {
	PerspectiveCamera,
	OrthographicCamera,
	Vector3,
	Vector2,
	MathUtils,
} from "three";
import type { WebGLRenderer, Scene, Camera } from "three";

import { uuidv4, easeOutQuad, toDegree, lerp, isMobile } from "@utilities/general";
import type { IEntityArg } from "@rendering/entity.props";

import { ECameraType } from "./camera.props";
import type { ICameraProps, ICameraLimits } from "./camera.props";

class MainCamera{

	public id: string = uuidv4();
	private scene: Scene;
	private renderer: WebGLRenderer;
	private _camera: PerspectiveCamera | OrthographicCamera = new PerspectiveCamera();
	public _fov: number = 75;

	private mouseDown: boolean;
	private mouseDownPosition?: Vector2 = new Vector2();
	private mouseDownThetaPhi: Vector2 = new Vector2();

	private xy: Vector2 = new Vector2();
	private txy: Vector2 = new Vector2();
	private cxy: Vector2 = new Vector2();

	private dampingEnabled: boolean = true;
	private dampingFactor: number = 0.05;

	public turnRatio: number = 0.5;
	public radius: number = 0;
	public theta: number = 0;
	public phi: number = 0;

	private _limits: ICameraLimits = {
		maxTheta: 360,
		minTheta: -360,
		maxPhi: 180,
		minPhi: -180,
		maxRadius: 10,
		minRadius: 10
	};
	private newRadius: number = 0;

	private _position: Vector3 = new Vector3(0, 1, 0);

	public cameraType: ECameraType;

	public enabled: boolean = true;

	private animating: boolean = false;
	private currentAnimTime: number = 0;
	private totalAnimDuration: number = 0;
	private animateFrom: ICameraProps | undefined;
	private animateTo: ICameraProps | undefined;

	private onAnimationComplete: ()=>void = ()=>({});
	private onPointerMoveCallback: (theta: number, phi: number)=>void = ()=>{};

	private isInertial: boolean = false;
	private isWheelInertial: boolean = false;
	private gyroScope: boolean = false;
	private enableGyroPhi: boolean = true;
	private gyroVelocity: number = 0.0005;
	private isMobile: boolean = false;
	public isFollowing: boolean = false;

	private cameraZoom: number = 1;
	private zoomByFOV: boolean = true;

	constructor({scene, renderer}: IEntityArg){
		this.scene = scene;
		this.renderer = renderer as WebGLRenderer;

		this.mouseDown = false;
		this.cameraType = ECameraType.FPS;

		if(isMobile()){
			this.isMobile = true;
		}
	}

	public get camera(): Camera | PerspectiveCamera | OrthographicCamera{
		return this._camera;
	}

	public get fov(): number{
		return this._fov;
	}

	public set fov(_fov: number){
		this._fov = _fov;
		if(this._camera instanceof PerspectiveCamera) this._camera.fov = this._fov;
	}

	public get position(): Vector3{
		return this._camera.position;
	}

	public set damping(dampingStatus: boolean){
		this.dampingEnabled = dampingStatus;
	}

	public set dampFactor(dampingFactor: number){
		this.dampingFactor = dampingFactor;
	}

	public get props(): ICameraProps{
		return {
			id: this.id,
			type: this.cameraType,
			position: this._position.clone(),
			theta: this.theta,
			phi: this.phi,
			radius: this.radius,
			limits: this._limits
		};
	}

	public async create(cameraProps?: ICameraProps): Promise<PerspectiveCamera | OrthographicCamera | void>{
		this.updateTurnRatio();

		let aspectRatio = this.renderer.domElement.width / this.renderer.domElement.height;
		if(cameraProps?.aspect) aspectRatio = cameraProps?.aspect;

		const frustumSize = 10;
		this._camera = cameraProps?.ortho ?
			new OrthographicCamera(frustumSize * aspectRatio / - 2, frustumSize * aspectRatio / 2, frustumSize / 2, frustumSize / - 2, 1, 1000)
			:
			new PerspectiveCamera(this._fov, aspectRatio, 0.1, 1000);

		// This is useful when loading camera from gltf
		this._camera.userData = {
			type: cameraProps?.ortho ? "ortho" : "prespective"
		};

		this.setupInputListeners();

		let newCameraProps: ICameraProps = {
			type: ECameraType.FPS,
			position: new Vector3(0, 0, 0),
			theta: -180,
			phi: 0,
			radius: 10,
			turnRatio: this.turnRatio
		};
		if(cameraProps){
			newCameraProps = {
				...newCameraProps,
				...cameraProps
			};
		}
		this.switchCamera(newCameraProps);
		this.newRadius = this.radius;

		return Promise.resolve(this._camera);
	}

	public load(camera: PerspectiveCamera | OrthographicCamera): void{
		this._camera = camera;
	}

	private updateTurnRatio(): void{
		const isPortrait = this.renderer.domElement.width < this.renderer.domElement.height;
		if(this.isMobile){
			if(isPortrait){
				this.turnRatio = isMobile() ? 1 : 0.5;	//ios safari
			}
			else{
				this.turnRatio = isMobile() ? 1 : 0.5;	// ios safari
			}
		}
		else{
			this.turnRatio = 0.25;
		}
	}

	private getRotatedPosition(theta: number, phi: number): Vector3{
		const _position = new Vector3(0, 0, 0);
		const _radius = this.radius;
		if(this.cameraType===ECameraType.Orbit || this.cameraType===ECameraType.FPS){
			_position.x = this._position.x + _radius * Math.sin(MathUtils.degToRad(theta)) * Math.cos(MathUtils.degToRad(phi));
			_position.y = this._position.y + _radius * Math.sin(MathUtils.degToRad(phi));
			_position.z = this._position.z + _radius * Math.cos(MathUtils.degToRad(theta)) * Math.cos(MathUtils.degToRad(phi));
		}
		return _position;
	}

	public updateCamera(cameraProps: ICameraProps): void{
		this.id = cameraProps.id || uuidv4();
		this.cameraType = cameraProps.type || ECameraType.FPS;
		this.radius = cameraProps.radius || 10;
		this._position = new Vector3(cameraProps.position.x, cameraProps.position.y, cameraProps.position.z) || new Vector3(0, 0, 0);
		this.theta = cameraProps.theta || 0;
		this.phi = cameraProps.phi || 0;
		this.turnRatio = cameraProps.turnRatio || 0.5;
		this._fov = cameraProps.fov || 75;

		if(cameraProps.limits) this._limits = {...cameraProps.limits};
		else {
			this._limits = {
				maxTheta: 360,
				minTheta: -360,
				maxPhi: 180,
				minPhi: -180,
				maxRadius: 10,
				minRadius: 10
			};
		}

		if(this._camera instanceof PerspectiveCamera) this._camera.fov = this._fov;

		this.newRadius = this.radius;
	}

	public switchCamera(cameraProps: ICameraProps): void{
		this.isWheelInertial = false;
		this.isInertial = false;
		this.animating = false;
		this.mouseDown = false;

		this.mouseDownPosition = new Vector2();
		this.mouseDownThetaPhi = new Vector2();
		this.xy = new Vector2();
		this.txy = new Vector2();
		this.cxy = new Vector2();

		this.updateCamera(cameraProps);

		this.checkLimits();

		this.setCameraLookAt(this.theta, this.phi, this._position);
	}

	private setCameraLookAt(theta: number, phi: number, position: Vector3): void{
		const rotatedPosition = this.getRotatedPosition(theta, phi);
		// Order for setting camera pos/rot matters. I suspect, this is due to threes renderer calling (projection | view)matrix transformation in specific order
		if(this.cameraType===ECameraType.Orbit){
			this._camera.position.set(rotatedPosition.x, rotatedPosition.y, rotatedPosition.z);
			this._camera.lookAt(position);
			this._camera.updateProjectionMatrix();
		}
		else if(this.cameraType===ECameraType.FPS){
			if(!this.zoomByFOV){
				const directionalVector = new Vector3();
				directionalVector.subVectors(rotatedPosition, position);
				const vectorMagnitude = Math.sqrt((directionalVector.x * directionalVector.x) + (directionalVector.y * directionalVector.y) + (directionalVector.z * directionalVector.z));
				const normalizedDirectionalVector = new Vector3(directionalVector.x/vectorMagnitude, directionalVector.y/vectorMagnitude, directionalVector.z/vectorMagnitude);

				const newPositionVector = new Vector3();
				newPositionVector.addVectors(position, normalizedDirectionalVector.multiplyScalar(this.cameraZoom - 1));

				this._camera.position.set(newPositionVector.x, newPositionVector.y, newPositionVector.z);
			}
			else{
				this._camera.position.set(position.x, position.y, position.z);
			}
			this._camera.lookAt(rotatedPosition);
			this._camera.updateProjectionMatrix();
		}
	}

	public animateCamera(from: ICameraProps, to: ICameraProps, duration?: number, onAnimationComplete?: ()=>void): void{
		if(from.type===this.cameraType){

			// Positive to negative rotation definitely works, negative to positive rotation may need some testing?
			if(360 - Math.abs(from.theta) < 180 || 360 - Math.abs(to.theta) < 180){
				if(to.theta < 0 && from.theta > 0) from.theta = -(360 - from.theta) - 360;
				else if(to.theta > 0 && from.theta < 0) from.theta = 360 + (360 - Math.abs(from.theta));
			}

			// This is a replacement logic to fix rotational bug but it is more verbose
			if(from.theta > 0 && to.theta < 0) {
				const distance = (360 - (to.theta * -1)) + (360 - from.theta);
				if(distance < 180) {
					to.theta = from.theta + distance;
				} else if (distance < 360 && to.theta < -179) {
					to.theta = from.theta + distance;
				}
			} else if(from.theta < 0 && to.theta > 0) {
				const distance = (360 - to.theta) + (360 - (from.theta * -1));
				if(distance < 180) {
					to.theta = from.theta - distance;
				}
			}

			this.cameraType = to.type;
			this.isWheelInertial = false;
			this.isInertial = false;
			this.totalAnimDuration = duration ?? 2;
			this.currentAnimTime = 0;
			this.animateFrom = from;
			this.animateTo = to;
			this.animating = true;
			this.enabled = false;
			this.onAnimationComplete = onAnimationComplete ? onAnimationComplete : ():void=>{};
		}
	}

	private stopAnimation(): void{
		this._limits = {
			maxTheta: this.animateTo?.limits?.maxTheta || 360,
			minTheta: this.animateTo?.limits?.minTheta || -360,
			maxPhi: this.animateTo?.limits?.maxPhi || 180,
			minPhi: this.animateTo?.limits?.minPhi || -180,
			maxRadius: this.animateTo?.limits?.maxRadius || 10,
			minRadius: this.animateTo?.limits?.minRadius || 10
		};

		this.id = this.animateTo?.id as string;
		this.theta = this.animateTo?.theta as number;
		this.phi = this.animateTo?.phi as number;
		this._position = (this.animateTo?.position as Vector3).clone();
		this.radius = this.animateTo?.radius as number;
		this.newRadius = this.radius;
		this.turnRatio = this.animateTo?.turnRatio as number || 0.1;
		this.animating = false;
		this.currentAnimTime = 0;
		this.animateFrom = undefined;
		this.animateTo = undefined;
		this.setCameraLookAt(this.theta, this.phi, this._position);
		this.onAnimationComplete();
		this.enabled = true;
	}

	private lerpCamera(rate: number): void{
		if(this.animateFrom && this.animateTo){
			const lerpedPosition = new Vector3(
				lerp(this.animateFrom.position.x, this.animateTo.position.x, rate),
				lerp(this.animateFrom.position.y, this.animateTo.position.y, rate),
				lerp(this.animateFrom.position.z, this.animateTo.position.z, rate)
			);

			const lerpedTheta = lerp(this.animateFrom.theta, this.animateTo.theta, rate);
			const lerpedPhi = lerp(this.animateFrom.phi, this.animateTo.phi, rate);
			const lerpedRadius = lerp(this.animateFrom.radius, this.animateTo.radius, rate);

			this.setCameraLookAt(lerpedTheta, lerpedPhi, lerpedPosition);

			this.radius = lerpedRadius;
			this.theta = lerpedTheta;
			this.phi = lerpedPhi;
		}
	}

	private getMousePosition(event: PointerEvent | TouchEvent): Vector2{
		const rect = this.renderer.domElement.getBoundingClientRect();
		const scaleX = this.renderer.domElement.width / rect.width;
		const scaleY = this.renderer.domElement.height / rect.height;

		if(this.isMobile && (event as TouchEvent).touches){
			const primaryTouch = (event as TouchEvent).touches[0] as Touch;
			return new Vector2((primaryTouch.clientX - rect.left) * scaleX, (primaryTouch.clientY - rect.top) * scaleY);
		}
		else{
			return new Vector2(((event as PointerEvent).clientX - rect.left) * scaleX, ((event as PointerEvent).clientY - rect.top) * scaleY);
		}
	}

	private applyInertia(current: number, target: number, amount: number, iswheel?: boolean): number{
		if(amount===1) return target;

		let distToGo = target - current;
		let delta = current + (distToGo * amount);

		if(Math.abs(distToGo) < 0.01){
			distToGo = 0;
			delta = target;

			if(iswheel) this.isWheelInertial = false;
			else this.isInertial = false;
		}

		return delta;
	}

	private setCameraOnSphere(): void{
		if(this.mouseDownPosition){
			this.cxy = this.xy.clone();

			this.xy.x = this.applyInertia(this.cxy.x, this.txy.x, this.dampingFactor);
			this.xy.y = this.applyInertia(this.cxy.y, this.txy.y, this.dampingFactor);

			this.theta = (this.cameraType===ECameraType.Orbit ? -1 : 1) * ((this.xy.x - this.mouseDownPosition.x) * this.turnRatio) + this.mouseDownThetaPhi.x;
			this.phi = ((this.xy.y - this.mouseDownPosition.y) * this.turnRatio) + this.mouseDownThetaPhi.y;

			this.checkLimits();

			this.setCameraLookAt(this.theta, this.phi, this._position);

			this.onPointerMoveCallback(this.theta, this.phi);
		}
	}

	private checkLimits(): void{
		this.phi = Math.min(this._limits.maxPhi, Math.max((this.cameraType===ECameraType.FPS ? this._limits.minPhi : (this._limits.minPhi < 0 ? 0 : this._limits.minPhi)) , this.phi));

		if(this.theta > this._limits.maxTheta && this._limits.maxTheta < 360) this.theta = this._limits.maxTheta;
		else if(this.theta < this._limits.minTheta  && this._limits.minTheta > -360) this.theta = this._limits.minTheta;

		// if zoom is introduced add radius clamping here
	}

	private setupInputListeners(): void{
		if(this.isMobile){
			
			window.addEventListener("devicemotion", this.handleGyroMove.bind(this));

			this.renderer.domElement.addEventListener("touchstart", this.handlePointerDown.bind(this));
			this.renderer.domElement.addEventListener("touchmove", this.handlePointerMove.bind(this));
			this.renderer.domElement.addEventListener("touchend", this.handlePointerUp.bind(this));
			this.renderer.domElement.addEventListener("touchcancel", this.handlePointerUp.bind(this));
		}
		else{
			this.renderer.domElement.addEventListener("wheel", this.handleWheel.bind(this));
			this.renderer.domElement.addEventListener("pointerdown", this.handlePointerDown.bind(this));
			this.renderer.domElement.addEventListener("pointermove", this.handlePointerMove.bind(this));
			window.addEventListener("pointerup", this.handlePointerUp.bind(this));
		}
	}

	private removeInputListeners(): void{
		// Can even set handler function to be null?
		if(this.isMobile){
			this.renderer.domElement.removeEventListener("touchstart", ()=>({}));
			this.renderer.domElement.removeEventListener("touchmove", ()=>({}));
			this.renderer.domElement.removeEventListener("touchend", ()=>({}));
			this.renderer.domElement.removeEventListener("touchcancel", ()=>({}));
		}
		else{
			this.renderer.domElement.removeEventListener("pointerdown", ()=>({}));
			this.renderer.domElement.removeEventListener("pointermove", ()=>({}));
			this.renderer.domElement.removeEventListener("wheel", ()=>({}));
		}
	}

	private handleGyroMove(event: DeviceMotionEvent): void{
		event.preventDefault();
		if(this.enabled && this.gyroScope){
			const portrait: boolean = (event as Record<string, any>)["portrait"] !== undefined  ? (event as Record<string, any>)["portrait"] as boolean : window.matchMedia("(orientation: portrait)").matches;

			let orientation;
			if((event as Record<string, any>)["orientation"] !== undefined) orientation = (event as Record<string, any>)["orientation"] as number;
			else if(window.orientation !== undefined) orientation = window.orientation;
			else orientation = -90;

			const alpha = toDegree(event.rotationRate?.alpha as number);
			const beta = toDegree(event.rotationRate?.beta as number);

			if(portrait){
				this.phi = this.enableGyroPhi ? this.phi + alpha * this.gyroVelocity : this.phi;
				this.theta = this.theta - beta * this.gyroVelocity * -1;
			}
			else{
				if(this.enableGyroPhi) this.phi = orientation === -90 ? this.phi + beta * this.gyroVelocity : this.phi - beta * this.gyroVelocity;
				this.theta = orientation === -90 ? this.theta - alpha * this.gyroVelocity : this.theta + alpha * this.gyroVelocity;
			}

			this.checkLimits();
			this.setCameraLookAt(this.theta, this.phi, this._position);
		}
	}
	private handlePointerDown(event: PointerEvent | TouchEvent): void{
		event.preventDefault();

		if(this.enabled && !this.animating){
			this.renderer.domElement.style.cursor = "grabbing";

			this.isWheelInertial = false;
			this.isInertial = false;
			this.mouseDown = true;

			this.mouseDownThetaPhi = new Vector2(this.theta, this.phi);
			this.mouseDownPosition = this.getMousePosition(event);
			this.xy = this.mouseDownPosition.clone();
		}
	}
	private handlePointerMove(event: PointerEvent | TouchEvent): void{
		event.preventDefault();

		if(this.mouseDown && this.enabled && !this.animating){
			this.isInertial = true;
			this.txy = this.getMousePosition(event);
		}
		else{
			this.renderer.domElement.style.cursor = "grab";
		}
	}
	private handlePointerUp(event: PointerEvent | TouchEvent): void{
		this.mouseDown = false;
	}
	private handleWheel(event: WheelEvent): void{
		if(this.enabled && this.newRadius > this._limits.minRadius && this.newRadius < this._limits.maxRadius){
			this.isWheelInertial = true;
			this.newRadius = event.deltaY<0 ? this.newRadius - 5 : this.newRadius + 5;
			if(this.newRadius > this._limits.maxRadius - 5) this.newRadius = this._limits.maxRadius - 5;
			else if(this.newRadius < this._limits.minRadius + 5) this.newRadius = this._limits.minRadius + 5;
		}
	}

	private lerpRadius(): void{
		this.radius = this.applyInertia(this.radius, this.newRadius, 0.05, true);
		if(this.radius > this._limits.maxRadius - 5) this.radius = this._limits.maxRadius - 5;
		else if(this.radius < this._limits.minRadius + 5) this.radius = this._limits.minRadius + 5;
		this.setCameraLookAt(this.theta, this.phi, this._position);
	}

	private clampTheta(): void{
		// Hack solution. Need revisit sometime in the future
		if(this.theta <= -360)
			this.theta = 360 - (-360 - this.theta);
		else if(this.theta >= 360)
			this.theta = -360 + (this.theta - 360);
	}

	public updatePosition(newPosition: Vector3): void{
		this._position = newPosition.clone();
	}

	public updateCameraZoom(newZoomLevel: number): void{
		this.cameraZoom = newZoomLevel;
		if(this.zoomByFOV){
			this._fov = 85 - this.cameraZoom * 10;
			if(this._camera instanceof PerspectiveCamera) this._camera.fov = this._fov;
			this._camera.updateProjectionMatrix();
		}
		else{
			this.setCameraLookAt(this.theta, this.phi, this._position);
		}
	}

	public update(tpf?: number): void{
		tpf = (tpf ?? 1000) / 1000;

		this.clampTheta();

		if(this.dampingEnabled && this.enabled && !this.animating){
			if(this.isInertial && !this.isWheelInertial) this.setCameraOnSphere();
			else if(this.isWheelInertial) this.lerpRadius();
		}

		if(this.isFollowing) this.setCameraLookAt(this.theta, this.phi, this._position);

		if(this.animating){
			this.currentAnimTime += tpf;
			const transitionPercent = this.currentAnimTime / this.totalAnimDuration;
			if(transitionPercent < 1){
				const easedRate = easeOutQuad(transitionPercent);
				this.lerpCamera(easedRate);
			}
			else{
				this.stopAnimation();
			}
		}
	}

	public dispose(callBack?: ()=>void): void{
		this.removeInputListeners();
		if(callBack) callBack();
	}

	public setOnPointerMoveCallback(onPointerMoveCallback: (theta: number, phi: number)=>void): void{
		this.onPointerMoveCallback = onPointerMoveCallback;
	}
}

export {
	MainCamera
};