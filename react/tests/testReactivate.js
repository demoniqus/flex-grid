import {TestInterface} from "../../tests/testInterface.js";
import {TesterInterface} from "../../tests/testerInterface.js";
import {Reactivator} from "../reactivator.js";
import {TestResult} from "../../tests/testResult.js";
import {TestResultInterface} from "../../tests/testResultInterface.js";
import {Metadata} from "../../tests/metadata.js";
import {Storage} from "../../storage/storage.js";

function TestReactivate()
{
    let keys = {
        event: {
            call: {
                beforeItemChange: 'TestReactivate.event.call.beforeItemChange',
                itemChanged: 'TestReactivate.event.call.itemChanged',
                beforeChildItemChange: 'TestReactivate.event.call.beforeChildItemChange',
                childItemChange: 'TestReactivate.event.call.childItemChange',
            }
        }
    }

    this.run = function(){
        let testResult = new TestResult()
        this.setExpected(testResult);

        let reactivator = new Reactivator({
            entityParentField: null,
            events: {
                beforeItemChange: {
                    callback: function(eventParams){
                        testResult.setExpected(keys.event.call.beforeItemChange);


                    },
                    evExtParams: {grid: this.pub},
                    evConf: {returnResult: true}
                },
                beforeChildItemChange: {
                    callback: function(){},
                    evExtParams: {grid: this.pub},
                    evConf: {returnResult: true}
                },
                itemChanged: {
                    callback: function(){
                        testResult.setExpected(keys.event.call.itemChanged);


                    },
                    evExtParams: {grid: this.pub}
                },
                childItemChange: {
                    callback: function(){},
                    evExtParams: {grid: this.pub}
                }
            },
            beforeEntityReactivation: function(dataItem){
                Storage.create(dataItem)
            },

        });

        let entity = {propName: 'propValue'};

        reactivator.reactivate(entity);

        entity.propName = 'new propValue';

        return testResult;
    }

    this.setExpected = function(/** @type {TestResultInterface} */ testResult) {

        testResult.expect(keys.event.call.beforeItemChange, 'Ожидался вызов события beforeItemChange');
        testResult.expect(keys.event.call.itemChanged, 'Ожидался вызов события itemChange');
        testResult.unexpect(keys.event.call.beforeChildItemChange, 'Вызов события \'beforeChildItemChange\' не ожидался');
        testResult.unexpect(keys.event.call.childItemChange, 'Вызов события \'childItemChange\' не ожидался');
    }

    this.metadata = new Metadata({name: 'TestReactivate', file: import.meta.url})
}

TestReactivate.prototype = new TestInterface();


export {TestReactivate}
