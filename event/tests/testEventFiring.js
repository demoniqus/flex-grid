import {TestInterface} from "../../tests/testInterface.js";

import {TestResult} from "../../tests/testResult.js";
import {TestResultInterface} from "../../tests/testResultInterface.js";
import {Metadata} from "../../tests/metadata.js";
import {EventManager} from "../eventManager.js";


function TestEventFiring()
{

    let keys = {
        event: {
            call: 'TestEventFiring.event.call',
            argument: {
                exists: 'TestEventFiring.event.argument.exists',
                type: 'TestEventFiring.event.argument.type',
                hasEventName: 'TestEventFiring.event.argument.hasEventName',
                hasExtParams: 'TestEventFiring.event.argument.hasExtParams',
                hasEventParams: 'TestEventFiring.event.argument.hasEventParams',
            },
            useEventConfig: 'TestEventFiring.event.useEventConfig',
            result: 'TestEventFiring.event.result',
        }
    }

    this.run = function()
    {
        let testResult = new TestResult()
        this.setExpected(testResult);

        let entity = {
            propName: 'propValue'
        };

        let evName = 'evName';

        let evExtParams = {
            'evExtParam': 123,
        };

        let evConf = {returnResult: true};

        let evParams = {
            'evParam': 234,
        };

        let evResult = {
            'evResult': 345,
        };

        let callback = function(eventParams){
            testResult.register(keys.event.call);
            eventParams && testResult.register(keys.event.argument.exists);

            if (eventParams) {
                typeof {} === typeof eventParams &&  testResult.register(keys.event.argument.type);

                if (typeof {} === typeof eventParams) {
                    (eventParams.eventName || '') === evName && testResult.register(keys.event.argument.hasEventName);
                    (eventParams.eventExtendedParams || null) === evExtParams && testResult.register(keys.event.argument.hasExtParams);
                    (eventParams.sourceEventParams || null) === evParams && testResult.register(keys.event.argument.hasEventParams);
                }
            }

            return evResult;
        };
        let callback2 = function(eventParams){
            testResult.register(keys.event.call);
            eventParams && testResult.register(keys.event.argument.exists);

            if (eventParams) {
                typeof {} === typeof eventParams &&  testResult.register(keys.event.argument.type);

                if (typeof {} === typeof eventParams) {
                    (eventParams.eventName || '') === evName && testResult.register(keys.event.argument.hasEventName);
                    (eventParams.eventExtendedParams || null) === evExtParams && testResult.register(keys.event.argument.hasExtParams);
                    (eventParams.sourceEventParams || null) === evParams && testResult.register(keys.event.argument.hasEventParams);
                }
            }

            return evResult;
        };


        EventManager.subscribe(entity, evName, callback, evExtParams, evConf);
        EventManager.subscribe(entity, evName, callback2, evExtParams, evConf);

        let result = EventManager.fire(entity, evName, evParams);

        result instanceof Array &&
        result.length === 2 &&
        result[0] === evResult &&
        result[1] === evResult &&
        (
            testResult.register(keys.event.useEventConfig),
            testResult.register(keys.event.result)
        )


        return testResult;

    }

    this.setExpected = function(/** @type {TestResultInterface} */ testResult) {
        testResult.expect(keys.event.call, 'Ожидался вызов события', 2);
        testResult.expect(keys.event.argument.exists, 'Ожидался аргумент', 2);
        testResult.expect(keys.event.argument.type, 'Ожидался object-type аргумент', 2);
        testResult.expect(keys.event.argument.hasEventName, 'Ожидалось наименование события', 2);
        testResult.expect(keys.event.argument.hasExtParams, 'Ожидалось наличие расширенных параметров, связанных с событием', 2);
        testResult.expect(keys.event.argument.hasEventParams, 'Ожидалось наличие дополнительных параметров события, передаваемых его источником', 2);
        testResult.expect(keys.event.useEventConfig, 'Ожидалась пользовательская настройка события с помощью evConf');
        testResult.expect(keys.event.result, 'Ожидался возврат результата обработки события');
    }

    this.metadata = new Metadata({name: 'TestEventFiring', file: import.meta.url})

}

TestEventFiring.prototype = new TestInterface();

export {TestEventFiring}
