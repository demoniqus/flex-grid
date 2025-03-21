import {Tester} from "../../tests/tester.js";
import {TestReactivateSimpleEntity} from "./testReactivateSimpleEntity.js";
import {TestReactivateEntityWithParents} from "./testReactivateEntityWithParents.js";

let TesterInstance = new Tester();
TesterInstance.addTest(new TestReactivateSimpleEntity());
TesterInstance.addTest(new TestReactivateEntityWithParents());



export {TesterInstance as Tester};
