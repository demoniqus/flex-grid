import {TestInterface} from "../../tests/testInterface.js";
import {Reactivator} from "../reactivator.js";
import {TestResult} from "../../tests/testResult.js";
import {TestResultInterface} from "../../tests/testResultInterface.js";
import {Metadata} from "../../tests/metadata.js";
import {Storage} from "../../storage/storage.js";

function TestReactivateEntityWithDirectParent()
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

        let parent = {parentPropName: 123};

        let entity = {childPropName: 'propValue', parent};

        let reactivator = new Reactivator({
            entityParentFields: 'parent',
            events: {
                beforeItemChange: {
                    callback: function(eventParams){
                        testResult.setExpected(keys.event.call.beforeItemChange);
                    },
                    evExtParams: null,
                    evConf: null
                },
                beforeChildItemChange: {
                    callback: function(eventParams){
                        testResult.setExpected(keys.event.call.beforeChildItemChange)
                    },
                    evExtParams: null,
                    evConf: null
                },
                itemChanged: {
                    callback: function(eventParams){
                        testResult.setExpected(keys.event.call.itemChanged);


                    },
                    evExtParams: null
                },
                childItemChanged: {
                    callback: function(eventParams){
                        testResult.setExpected(keys.event.call.childItemChanged)
                    },
                    evExtParams: null
                }
            },
            beforeEntityReactivation: function(dataItem){
                Storage.create(dataItem)
            },

        });


        /**
         * Реактивируем оба элемента - сущность и ее родителя - поскольку реактивность предполагает настройку реакции
         * на события конкретной сущности, а не связанных с нею других сущностей. Настраиваемая сущность сама реагирует
         * и может генерировать события для связанных с нею других сущностей, но не обеспечивает их реагирование
         */
        reactivator.reactivate(entity);
        reactivator.reactivate(parent);
        /**
         * Проверяем наличие реакции на изменение значения свойства
         */
        entity.childPropName = 'new propValue';

        return testResult;
    }

    this.setExpected = function(/** @type {TestResultInterface} */ testResult) {

        testResult.expect(keys.event.call.beforeItemChange, 'Ожидался вызов события \'beforeItemChange\'');
        testResult.expect(keys.event.call.itemChanged, 'Ожидался вызов события \'itemChange\'');
        testResult.expect(keys.event.call.beforeChildItemChange, 'Ожидался вызов события \'beforeChildItemChange\'');
        testResult.expect(keys.event.call.childItemChanged, 'Ожидался вызов события \'childItemChange\'');
    }

    this.metadata = new Metadata({name: 'TestReactivateEntityWithDirectParent', file: import.meta.url})
}

TestReactivateEntityWithDirectParent.prototype = new TestInterface();


export {TestReactivateEntityWithDirectParent}
