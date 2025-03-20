import {Tester} from "../../tests/tester.js";

import {TestReactivate} from "./testReactivate.js";
// import {TestReactivate} from "../tests/testReactivate.js";

let TesterInstance = new Tester();
TesterInstance.addTest(new TestReactivate());



export {TesterInstance as Tester};
