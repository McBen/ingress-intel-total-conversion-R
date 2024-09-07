import { ConcatSource } from 'webpack-sources';
import { Compilation } from 'webpack';
import fs from 'fs';
import path from 'path';


interface GMAddonBannerPluginoOtions {
    downloadURL?: string;
    updateURL?: string;
    banner?: string;
    [index: string]: string | undefined;
}


export default class GMAddonBannerPlugin {

    options: GMAddonBannerPluginoOtions;

    constructor(options: Partial<GMAddonBannerPluginoOtions>) {
        if (arguments.length > 1)
            throw new Error('GMAddonBannerPlugin only takes one argument (pass an options object)');
        this.options = options || {};
    }


    apply(compiler: any) {

        const plugin = {
            name: this.constructor.name,
            stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE
        };


        compiler.hooks.compilation.tap(plugin, (compilation: Compilation) => {
            compilation.hooks.processAssets.tap(plugin,
                () => {
                    compilation.chunks.forEach(chunk => {
                        chunk.files.forEach((file) => {
                            const filename = file.replace(/\?.*/, "");

                            this.updateDownloadURL(filename);

                            if (this.options.downloadURL) {
                                const metaBlock = this.generateMetaBlock(false);
                                const outname = compilation.outputOptions.path + "/" + filename.replace(".user.", ".meta.");
                                fs.mkdirSync(path.dirname(outname), { recursive: true });
                                fs.writeFileSync(outname, metaBlock);
                            }

                            const banner = this.generateMetaBlock(true);
                            // @ts-ignore
                            return compilation.assets[file] = new ConcatSource(banner, '\n', compilation.assets[file]);
                        });
                    });
                });
        });
    }


    updateDownloadURL(filename: string) {
        if (!this.options.downloadURL) return;

        const regex = new RegExp("/" + filename + "$");
        const path = this.options.downloadURL.replace(regex, "").replace(/\/$/, "");
        this.options.downloadURL = path + "/" + filename;
        this.options.updateURL = path + "/" + filename.replace(".user.", ".meta.");
    }


    generateMetaBlock(fullDetails: boolean) {
        const options = this.options;
        const std_entries = ['name', 'id', 'category', 'version', 'namespace', 'updateURL', 'downloadURL', 'description', 'match', 'include', 'grant', 'run-at'];
        const ignore = ['banner'];
        if (!fullDetails) {
            ignore.push("icon64");
        }

        var entries: string[] = [];
        std_entries.forEach((cat) => {
            if (options[cat]) {
                this.createMetaEntry(entries, cat, options[cat]);
            }
        });

        for (let cat in options) {
            if (std_entries.indexOf(cat) === -1 && ignore.indexOf(cat) === -1) {
                this.createMetaEntry(entries, cat, options[cat]);
            }
        }

        let extraBanner = "";
        if (fullDetails && this.options.banner) {
            extraBanner = this.options.banner + "\n";
        }

        return extraBanner + '// ==UserScript==\n' + entries.join('\n') + '\n// ==/UserScript==';
    }


    createMetaEntry(entries: string[], name: string, value: any) {
        if (typeof (value) == 'function') {
            value = value();
        }
        if (typeof value === "undefined") return;

        let key = ('// @' + name + ' '.repeat(16)).slice(0, 20);

        if (Array.isArray(value)) {
            value.forEach((val) => { entries.push(key + val); });
        } else {
            entries.push(key + value);
        }
    }
}
