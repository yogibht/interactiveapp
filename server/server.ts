import cluster from "cluster";
import os from "os";
import Express from "express";
import fs from "fs";
import https from "https";
import http from "http";
import path from "path";

import "regenerator-runtime/runtime";

import { ENV } from "./env";

import webpack from "webpack";
import type { Configuration } from "webpack";
import webpackDevMiddleware from "webpack-dev-middleware";
import webpackConfig from "../webpack.config.js";

const webpackConfiguration: Configuration = {
	...webpackConfig,
	mode: "development",
	stats: "minimal",
	watch: true,
	watchOptions: {
		aggregateTimeout: 300,
		poll: 1000,
		ignored: /node_modules/
	}
};

//let serverStarted: boolean = false;

const compiler = webpack(
	webpackConfiguration,
	(err, stats)=>{
		if(err || stats?.hasErrors()) console.log(err);

		const minimalStats = stats?.toJson("minimal");
		console.log("Webpack Compiled, ", minimalStats);

		if(fs.existsSync(path.join(__dirname, "../", "dist", "index.html"))){
			fs.unlinkSync(path.join(__dirname, "../", "dist", "index.html"));
		}

		const scriptFilenames = minimalStats?.assetsByChunkName?.["interactiveapp"];
		generateHTMLFromTemplate(scriptFilenames);
	}
);

const generateHTMLFromTemplate = (scriptFilenames: string[] = []): void => {
	const htmlContent = fs.readFileSync(path.join(__dirname, "template.html"), "utf8");
	let htmlInjection = scriptFilenames.length>1 ? "<script>var exports = {};</script>\n" : "";
	for(let i=0; i<scriptFilenames.length; i++){
		htmlInjection += `${i>0?"\t":""}<script type="module" src="${scriptFilenames[i] ?? ""}"></script>\n`;
	}
	const newHTML = htmlContent.replace("%SCRIPTFILES%", htmlInjection);
	if(!fs.existsSync(path.join(__dirname, "../", "dist"))) fs.mkdirSync(path.join(__dirname, "../", "dist"));
	fs.writeFileSync(path.join(__dirname, "../", "dist", "index.html"), newHTML);
};

const setupServer = (): void => {
	const app = Express();
	const port = ENV.serviceport;

	// app.use(Express.json({limit: '500mb'}));
	// app.use(Express.urlencoded({limit: '500mb'}));

	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	app.use(webpackDevMiddleware(compiler));

	app.use("/gameassets/models", Express.static(path.join(__dirname, "../", "gameassets", "models")));
	app.use("/gameassets/cameras", Express.static(path.join(__dirname, "../", "gameassets", "cameras")));
	// app.use("/gameassets/textures", Express.static(path.join(__dirname, "gameassets", "textures")));

	app.use("/dist", Express.static(path.join(__dirname, "../", "dist")));
	app.use((req, res)=>handleRender(req, res));

	const handleRender = (_req: Express.Request, res: Express.Response): void=>{
		try{
			res.sendFile(path.join(__dirname, "../", "dist", "index.html"));
		}catch(err){
			console.log(err);
		}
	};

	let _httpserver: http.Server;

	if(ENV.SSL.enabled && fs.existsSync(ENV.SSL.keyfile) && fs.existsSync(ENV.SSL.certfile)){
		_httpserver = https.createServer({
			key: fs.readFileSync(path.resolve(__dirname, "../", ENV.SSL.keyfile)),
			cert: fs.readFileSync(path.resolve(__dirname, "../", ENV.SSL.certfile))
		}, app);
	}
	else{
		_httpserver = new http.Server(app);
	}

	_httpserver.listen(port, ()=>{
		console.log(`Application started @ port ${port} on Cluster Process: ${process.pid} in ${(ENV.SSL.enabled ? "SSL" : "Normal")} mode.`);
	})
		.on("error", (err: Error)=>{
			console.log("App Server could not start. Error: ", err);
		});
};

if(cluster.isPrimary && !ENV.isDev && ENV.clusterenabled) {
	const numWorkers = os.cpus().length;

	console.log(`Master cluster setting up ${numWorkers} workers...`);

	for(let i = 0; i < numWorkers; i++) {
		cluster.fork();
	}

	cluster.on("online", (worker)=>{
		console.log(`Worker ${worker?.process?.pid ?? 0} is online`);
	});

	cluster.on("exit", (worker, code, signal)=>{
		console.log(`Worker ${worker?.process?.pid ?? 0} died with code: ${code}, and signal: ${signal}`);
		console.log("Starting a new worker");
		cluster.fork();
	});
}

setupServer();