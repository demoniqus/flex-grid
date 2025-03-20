import {MetadataInterface} from "./metadataInterface.js";

function Metadata(config) {
    /**
     * @returns {string}
     */
    this.name = () => config.name;
    /**
     * @returns {string}
     */
    this.file = () => config.file.replace(/^\s*[a-z]+\/\/[^\/]+\//, '');
}

export {Metadata}
