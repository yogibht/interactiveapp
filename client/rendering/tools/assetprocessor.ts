import { Color, Mesh, Object3D, MeshBasicMaterial, Vector3 } from "three";
import type { Texture, VideoTexture, MeshStandardMaterial, Group, Scene } from "three";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader";

import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";

import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import type { GLTFExporterOptions } from "three/examples/jsm/exporters/GLTFExporter";

interface IAsset {
	scene: Group;
};

class AssetProcessor{

	private gltfLoader: GLTFLoader;
	private envMap: Texture | VideoTexture;
	private plyLoader: PLYLoader;

	private gtlfExporter: GLTFExporter;

	constructor(envMap?: Texture | VideoTexture){
		this.gltfLoader = new GLTFLoader();
		if(envMap) this.envMap = envMap;

		this.plyLoader = new PLYLoader();

		this.gtlfExporter = new GLTFExporter();
	}

	public async load(url: string): Promise<IAsset | undefined>{
		try{
			const itemsToRemove: string[] = [];
			const modeldata = await this.gltfLoader.loadAsync(url);
			modeldata.scene.traverse(sceneObject=>{
				if(sceneObject.type==="Mesh" || sceneObject instanceof Mesh){
					sceneObject.receiveShadow = true;
					sceneObject.castShadow = true;

					// if(PAINT_MATERIALS.find(matname=>matname===((sceneObject as Mesh).material as MeshStandardMaterial).name)){
					// 	// ((sceneObject as Mesh).material as MeshStandardMaterial).color = new Color(0x2d9cf7);// new Color(0xad2924);
					// 	((sceneObject as Mesh).material as MeshStandardMaterial).envMap = this.envMap;
					// 	((sceneObject as Mesh).material as MeshStandardMaterial).envMapIntensity = 1;
					// 	((sceneObject as Mesh).material as MeshStandardMaterial).metalness = 0.75;
					// 	((sceneObject as Mesh).material as MeshStandardMaterial).roughness = 0.25;
					// 	((sceneObject as Mesh).material as MeshStandardMaterial).needsUpdate = true;
					// }
				}
				else if(
					(sceneObject.type==="Object3D" || sceneObject instanceof Object3D) &&
					(sceneObject.name.includes("hotspot_") || sceneObject.name.includes("position_"))
				){
					itemsToRemove.push(sceneObject.name);
				}
			});

			const returnObj: IAsset | undefined = {
				scene: modeldata.scene
			};

			return returnObj;
		}
		catch(err){
			console.error(err);
			await Promise.reject(err);
		}

	}

	public async loadPLY(url: string): Promise<Mesh | undefined>{
		try{
			const modelgeometry = await this.plyLoader.loadAsync(url);
			modelgeometry.computeVertexNormals();

			const basicMat = new MeshBasicMaterial({ color: 0x00ff00, wireframe: true });

			const mesh = new Mesh(modelgeometry, basicMat);
			
			// mesh.scale.set(0.01, 0.01, 0.01);
			// mesh.rotateX(-Math.PI / 2);
        
			return mesh;
		}
		catch(err){
			console.error(err);
			await Promise.reject(err);
		}

	}

	public async save(scene: Scene, fileName: string, exportOptions?: GLTFExporterOptions): Promise<void | string>{
		return new Promise((resolve, reject)=>{
			if(!exportOptions) exportOptions = {
				binary: false
			};

			const fileExtension = fileName.split(".");
			if(exportOptions.binary && fileExtension[fileExtension.length-1]!=="glb"){
				fileExtension[fileExtension.length-1] = "glb";
				fileName = fileExtension.join(".");
			}
			else if(!exportOptions.binary && fileExtension[fileExtension.length-1]!=="gltf"){
				fileExtension[fileExtension.length-1] = "gltf";
				fileName = fileExtension.join(".");
			}

			this.gtlfExporter.parse(
				scene,
				(result)=>{
					let fileBlob;
					if(result instanceof ArrayBuffer){
						fileBlob = new Blob([result], {type: "application/octet-stream"});
					}
					else{
						const stringifiedGLTF = JSON.stringify(result, null, 2);
						fileBlob = new Blob([stringifiedGLTF], {type: "text/plain"});
					}
					this.saveFile(fileBlob, fileName);
					resolve("saved");
				},
				(err)=>{
					console.error(err);
					reject(`Error: ${err.toString()}`);
				},
				exportOptions
			);
		});
	}

	private saveFile(blob: Blob, fileName: string): void{
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = fileName;
		link.click();
	}
}

class TextureProcessor{
	// This class will preload textures
}

export {
	AssetProcessor,

	IAsset
};