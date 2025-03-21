import {TestInterface} from "../../tests/testInterface.js";
import {Reactivator} from "../reactivator.js";
import {TestResult} from "../../tests/testResult.js";
import {TestResultInterface} from "../../tests/testResultInterface.js";
import {Metadata} from "../../tests/metadata.js";
import {Storage} from "../../storage/storage.js";

function TestReactivateSimpleEntity()
{
    let keys = {
        event: {
            call: {
                beforeItemChange: 'TestReactivate.event.call.beforeItemChange',
                itemChanged: 'TestReactivate.event.call.itemChanged',
                beforeChildItemChange: 'TestReactivate.event.call.beforeChildItemChange',
                childItemChanged: 'TestReactivate.event.call.childItemChanged',
            }
        }
    }

    this.run = function(){
        let testResult = new TestResult()
        this.setExpected(testResult);

        let reactivator = new Reactivator({
            entityParentFields: null,
            events: {
                beforeItemChange: {
                    callback: function(eventParams){
                        testResult.setExpected(keys.event.call.beforeItemChange);


                    },
                    evExtParams: null,
                    evConf: null
                },
                beforeChildItemChange: {
                    callback: function(){},
                    evExtParams: null,
                    evConf: null
                },
                itemChanged: {
                    callback: function(){
                        testResult.setExpected(keys.event.call.itemChanged);


                    },
                    evExtParams: null
                },
                childItemChanged: {
                    callback: function(){},
                    evExtParams: null
                }
            },
            beforeEntityReactivation: function(dataItem){
                Storage.create(dataItem)
            },

        });

        let entity = {propName: 'propValue'};

        reactivator.reactivate(entity);
        /**
         * Проверяем наличие реакции на изменение значения свойства
         */
        entity.propName = 'new propValue';

        return testResult;
    }

    this.setExpected = function(/** @type {TestResultInterface} */ testResult) {

        testResult.expect(keys.event.call.beforeItemChange, 'Ожидался вызов события \'beforeItemChange\'');
        testResult.expect(keys.event.call.itemChanged, 'Ожидался вызов события \'itemChange\'');
        testResult.unexpect(keys.event.call.beforeChildItemChange, 'Вызов события \'beforeChildItemChange\' не ожидался');
        testResult.unexpect(keys.event.call.childItemChanged, 'Вызов события \'childItemChange\' не ожидался');
    }

    this.metadata = new Metadata({name: 'TestReactivate', file: import.meta.url})
}

TestReactivateSimpleEntity.prototype = new TestInterface();


export {TestReactivateSimpleEntity}
