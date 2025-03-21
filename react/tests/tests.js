import {Tester} from "../../tests/tester.js";
import {TestReactivateSimpleEntity} from "./testReactivateSimpleEntity.js";
import {TestReactivateEntityWithDirectParent} from "./testReactivateEntityWithDirectParent.js";

let TesterInstance = new Tester();
TesterInstance.addTest(new TestReactivateSimpleEntity());
TesterInstance.addTest(new TestReactivateEntityWithDirectParent());



export {TesterInstance as Tester};
