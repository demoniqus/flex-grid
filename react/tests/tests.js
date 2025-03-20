import {Tester} from "../../tests/tester.js";
import {TestReactivate} from "./testReactivate.js";

let TesterInstance = new Tester();
TesterInstance.addTest(new TestReactivate());



export {TesterInstance as Tester};
