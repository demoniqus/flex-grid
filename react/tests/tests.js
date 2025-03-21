import {Tester} from "../../tests/tester.js";
import {TestReactivate} from "./testReactivate.js";
import {TestReactivateSimpleEntity} from "./testReactivateSimpleEntity.js";

let TesterInstance = new Tester();
TesterInstance.addTest(new TestReactivate());
TesterInstance.addTest(new TestReactivateSimpleEntity());



export {TesterInstance as Tester};
