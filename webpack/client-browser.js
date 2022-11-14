const path = require('path');


module.exports = ({ env, is_dev })=>{
    let entry_path  = path.join(__dirname, "..", "client");
    let output_path = path.join(__dirname, "..", "client-browser");

    return {
        entry: path.join(entry_path, "SAMRClient.js"),
        mode: is_dev?'development':'production',
        target: "web",
        watch: true, //is_dev,
        output: {
            filename: 'SAMRClientBrowser' + (is_dev?".dev":"") + '.js',
            path: output_path,
            library: {
                name: "SAMRClient",
                type: "commonjs2"
            },
        },
        resolve: {
            alias: {
                app: entry_path,
            },
            fallback: {
                console: false,
            }
        },
        module: {
            rules: [
                {
                    test: /\.(js)$/,
                    loader: 'ifdef-loader',
                    exclude: /node_modules/,
                    options: {
                        DEV: is_dev,
                        BROWSER: true,
                    }
                }
            ]
        }
    }
}
