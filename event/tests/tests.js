import {Tester} from "../../tests/tester.js";
import {TestEventFiring} from "./testEventFiring.js";

let TesterInstance = new Tester();
TesterInstance.addTest(new TestEventFiring())



export {TesterInstance as Tester};
