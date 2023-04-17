const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
	target: "node",
    mode: "development",
    entry: {
        "modelviewer": [ path.resolve(__dirname, "client", "index.ts") ]
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].[contenthash].js",
    },
    devtool: "inline-source-map",
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                include: /\.min\.js(\?.*)?$/i
            })
        ]
    },
    module: {
        rules: [
            { test: /\.(js|ts|tsx)$/, use:[{ loader: "ts-loader" }], exclude: /node_modules/ },
            { test: /\.css$/, use:[{loader: "css-loader"}] },
            { test: /\.scss$/, use:[{loader: "css-loader"}, {loader: "sass-loader"}] },
            { test: /\.(png|jpg|gif|svg)$/, use:[{loader: "file-loader"}] },
            { test: /\.(ttf|woff|woff2|eot)$/, use:[{loader: "url-loader"}] }
        ]
    },
    resolve: {
        alias: {
			"@assets": path.resolve(__dirname, "client", "assets"),
            "@datastore": path.resolve(__dirname, "client", "datastore"),
            "@utilities": path.resolve(__dirname, "client", "utilities"),
			"@components": path.resolve(__dirname, "client", "gui", "components"),
			"@gui": path.resolve(__dirname, "client", "gui"),
			"@rendering": path.resolve(__dirname, "client", "rendering"),
			"@scenes": path.resolve(__dirname, "client", "rendering", "scenes"),
			"@tools": path.resolve(__dirname, "client", "rendering", "tools"),
			"@systems": path.resolve(__dirname, "client", "rendering", "systems"),
			"@client": path.resolve(__dirname, "client"),
            "@env": path.join(__dirname, "server", "env.ts")
        },
        extensions: [".js", ".ts", ".tsx"],
    }
};