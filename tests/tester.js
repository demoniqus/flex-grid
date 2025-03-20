import {TesterInterface} from "./testerInterface.js";
import {TestInterface} from "./testInterface.js";

function Tester() {
    /**
     *
     * @type {TestInterface[]}
     */
    let tests = [];

    let result = [];


    this.addTest = (/** @type {object} */ testInstance) => tests.push(testInstance);

    this.runTests = () => {
        result = [];

        tests.forEach(
            (/** @type {TestInterface} */ test) => result.push({
                result: test.run(),
                metadata: test.metadata
            })
        );
    };

    this.result = () => result
}

Tester.prototype = new TesterInterface()


export {Tester}
