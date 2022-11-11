const { VueLoaderPlugin } = require('vue-loader');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require('path');



module.exports = ({ env, is_dev })=>{
    let entry_path  = path.join(__dirname, "..", "web-src", "client");
    let output_path = path.join(__dirname, "..", "client", "web");

    if(is_dev) output_path += "-dev";

    return {
        entry: path.join(entry_path, "main.js"),
        mode: is_dev?'development':'production',
        watch: true, //is_dev,
        output: {
            filename: 'main.js',
            path: output_path,
        },
        resolve: {
            alias: {
                app: entry_path,
                sfc: path.resolve(entry_path, "vue"),
            },
        },
        module: {
            rules: [
                {
                    test: /\.vue$/,
                    loader: 'vue-loader'
                },
                {
                },
                {
                    test: /\.(vue|js)$/,
                    loader: 'ifdef-loader',
                    exclude: /node_modules/,
                    options: {
                        DEV: is_dev,
                    }
                }
            ]
        },
        plugins: [
            new VueLoaderPlugin(),
            new HtmlWebpackPlugin({
                template: path.join(entry_path, "index.html"),
            }),
        ]
    }
}
