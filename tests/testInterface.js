"use strict"
import {TestResultInterface} from "./testResultInterface.js";
import {MetadataInterface} from "./metadataInterface.js";

function TestInterface() {
    /**
     * @returns {TestResultInterface}
     */
    this.run = () => {
        throw 'Method \'run\' not implemented';
    }

    /**
     * @returns {MetadataInterface}
     */
    this.metadata = () => {
        throw 'Method \'metadata\' not implemented';
    }


}

export {TestInterface}
