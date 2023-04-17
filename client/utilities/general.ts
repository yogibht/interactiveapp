const uuidv4 = (): string => {
	const _M = randomInt(6, 1);
	const _N = ["8", "9", "a", "b"][randomInt(3)];
	const placeholder = `xxxxxxxx-xxxx-${_M}xxx-${_N ?? ""}xxx-xxxxxxxxxxxx`;
	return placeholder.replace(/[xy]/g, (c)=>{
		const r = Math.random() * 16 | 0;
		const v = c == "x" ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
};

const randomInt = (max: number, min: number = 0, seedString?: string): number => {
	if(seedString){
		const randfunc = mulberry32(seedString);
		const rand = randfunc();
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(rand * (max - min) + min);
	}
	else{
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min) + min);
	}
};

const randomFloat = (max: number = 1.0, min: number = 0.0): number => {
	return Math.random() * (max - min) + min;
};

const generateSeed = (seedString?: string): number => {
	if(!seedString){
		seedString = Math.random().toString(36).replace(/[^a-z]+/g, "").substring(0, 12);
	}
	const newseed = mulberry32(seedString);
	return newseed();
};

const mulberry32 = (_seed: string): ()=>number => {
	let seed: number = Number(_seed.split("").map(a=>a.charCodeAt(0)).join(""));
	return (): number => {
		seed |= 0;
		seed = seed + 0x6D2B79F5 | 0;
		let imul = Math.imul(seed ^ seed >>> 15, 1 | seed);
		imul = imul + Math.imul(imul ^ imul >>> 7, 61 | imul) ^ imul;
		return ((imul ^ imul >>> 14) >>> 0) / 4294967296;
	};
};

const easeOutQuad = (n: number): number => {
	return 1 - (1 - n) * (1 - n);
};

const easeOutBounce = (x: number): number => {
	const n1 = 7.5625;
	const d1 = 2.75;

	if(x < 1 / d1) return n1 * x * x;
	else if(x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
	else if(x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
	else return n1 * (x -= 2.625 / d1) * x + 0.984375;
};

const toRadian = (x: number): number => {
	return x * Math.PI/180;
};

const toDegree = (x: number): number => {
	return x * 180/Math.PI;
};

const lerp = (n1: number, n2: number, alpha: number): number => {
	return (1 - alpha) * n1 + alpha * n2;
	// return a + (b - a) * alpha;
};

const clamp = (a: number, min: number = 0, max: number = 1): number => {
	return Math.min(max, Math.max(min, a));
};

const inverseLerp = (x: number, y: number, a: number): number => {
	return clamp((a - x) / (y - x));
};

const arrayMinMax = (arr: number[]): number[] => {
	return arr.reduce(([min, max], val) => [Math.min(min ?? Number.NEGATIVE_INFINITY, val), Math.max(max ?? Number.POSITIVE_INFINITY, val)], [
		Number.POSITIVE_INFINITY,
		Number.NEGATIVE_INFINITY,
	]);
};

const isMobile = (isSafari?: boolean): boolean => {
	if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
		return true;
	}
	else if((navigator.platform === "MacIntel" && navigator.maxTouchPoints > 0) || navigator.platform === "iPad") {
		return true;
	}
	else {
		return false;
	}
};

const findFPS = (): Promise<number> => {
	return new Promise((resolve, reject)=>{
		const fpslist: number[] = [];
		let count = 250;    // 250 frame sampled
		let then: number = 0;
		const FPSLoop = (now: DOMHighResTimeStamp): void => {
			if(count > 0) requestAnimationFrame(FPSLoop);
			else{
				const avgFPS = fpslist.reduce((a, b) => a + b) / fpslist.length;
				resolve(avgFPS);
			}

			now *= 0.001;
			const deltaTime = now - then;
			then = now;
			const fps = 1 / deltaTime;

			fpslist.push(fps);

			count--;
		};
		requestAnimationFrame(FPSLoop);
	});
};

export {
	uuidv4,
	randomInt,
	randomFloat,
	generateSeed,
	easeOutQuad,
	easeOutBounce,
	toRadian,
	toDegree,
	lerp,
	inverseLerp,
	clamp,
	arrayMinMax,
	isMobile,
	findFPS
};