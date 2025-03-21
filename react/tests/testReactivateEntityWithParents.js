import {TestInterface} from "../../tests/testInterface.js";
import {Reactivator} from "../reactivator.js";
import {TestResult} from "../../tests/testResult.js";
import {TestResultInterface} from "../../tests/testResultInterface.js";
import {Metadata} from "../../tests/metadata.js";
import {Storage} from "../../storage/storage.js";

function TestReactivateEntityWithParents()
{
    let keys = {
        event: {
            call: {
                beforeItemChange: 'TestReactivateEntityWithParents.event.call.beforeItemChange',
                itemChanged: 'TestReactivateEntityWithParents.event.call.itemChanged',
                beforeChildItemChange: 'TestReactivateEntityWithParents.event.call.beforeChildItemChange',
                childItemChanged: 'TestReactivateEntityWithParents.event.call.childItemChanged',
            },
            beforeItemChange: {
                sourceObject: 'TestReactivateEntityWithParents.event.beforeItemChange.sourceObject'
            },
            itemChanged: {
                sourceObject: 'TestReactivateEntityWithParents.event.itemChanged.sourceObject',
                newValue: 'TestReactivateEntityWithParents.event.itemChanged.newValue',

            },
            beforeChildItemChange: {
                child: 'TestReactivateEntityWithParents.event.beforeChildItemChange.child',
                order: 'TestReactivateEntityWithParents.event.beforeChildItemChange.order',

            },
            childItemChanged: {
                child: 'TestReactivateEntityWithParents.event.childItemChanged.child',
                order: 'TestReactivateEntityWithParents.event.childItemChanged.order',

            },
        },
        beforeEntityReactivation:
            {
                call: 'TestReactivateEntityWithParents.beforeEntityReactivation.call',
                order: 'TestReactivateEntityWithParents.beforeEntityReactivation.order',
            }
    }

    this.run = function(){
        let testResult = new TestResult()
        this.setTestAsserts(testResult);
        /**
         * Связь child -> directParent указывается непосредственно в child, а в Reactivator необходимо указать
         * entityParentFields
         *
         */
        let directParent1 = {id: 1};
        let directParent2 = {id: 2};

        let entity = {id: 3, childPropName: 'propValue', parent1: directParent1, parent2: directParent2};

        let reverseParent = {id: 4, parentPropName: 'abc', child: entity};

        let beforeEntityReactivationOrder = [entity, directParent1, directParent2, reverseParent];

        let childEventInitiatorsDict = {};
        childEventInitiatorsDict[directParent1.id] = true;
        childEventInitiatorsDict[directParent2.id] = true;
        childEventInitiatorsDict[reverseParent.id] = true;

        let reactivator = new Reactivator({
            entityParentFields: ['parent1', 'parent2'],
            events: {
                beforeItemChange: {
                    callback: function(eventParams){
                        testResult.setExpected(keys.event.call.beforeItemChange);

                        eventParams.sourceObject === entity &&
                            testResult.setExpected(keys.event.beforeItemChange.sourceObject);
                    },
                    evExtParams: null,
                    evConf: null
                },
                beforeChildItemChange: {
                    callback: function(eventParams){
                        testResult.setExpected(keys.event.call.beforeChildItemChange);

                        eventParams.sourceObject.id in childEventInitiatorsDict &&
                            testResult.setExpected(keys.event.beforeChildItemChange.order);

                        eventParams.sourceEventParams.child.object === entity &&
                            testResult.setExpected(keys.event.beforeChildItemChange.child);

                    },
                    evExtParams: null,
                    evConf: null
                },
                itemChanged: {
                    callback: function(eventParams){
                        testResult.setExpected(keys.event.call.itemChanged);

                        eventParams.sourceObject === entity &&
                            testResult.setExpected(keys.event.itemChanged.sourceObject);

                        eventParams.sourceObject.childPropName === 'new propValue' &&
                            testResult.setExpected(keys.event.itemChanged.newValue);
                    },
                    evExtParams: null
                },
                childItemChanged: {
                    callback: function(eventParams){
                        testResult.setExpected(keys.event.call.childItemChanged);

                        eventParams.sourceObject.id in childEventInitiatorsDict &&
                            testResult.setExpected(keys.event.childItemChanged.order);

                        eventParams.sourceEventParams.child.object === entity &&
                            testResult.setExpected(keys.event.childItemChanged.child);
                    },
                    evExtParams: null
                }
            },
            beforeEntityReactivation: function(dataItem){
                Storage.create(dataItem);
                testResult.setExpected(keys.beforeEntityReactivation.call);
                beforeEntityReactivationOrder.shift() === dataItem &&
                    testResult.setExpected(keys.beforeEntityReactivation.order);
            },

        });


        /**
         * Реактивируем все элементы - сущность и ее родителей - поскольку реактивность предполагает настройку реакции
         * на события конкретной сущности, а не связанных с нею других сущностей. Настраиваемая сущность сама реагирует
         * и может генерировать события для связанных с нею других сущностей, но не обеспечивает их реагирование.
         * При этом reverseParent может отправить своего child на реактивацию, чтобы знать о его изменениях и реагировать
         * на них
         */
        reactivator.reactivate(entity);
        reactivator.reactivate(directParent1);
        reactivator.reactivate(directParent2);
        reactivator.reactivate(reverseParent);
        /**
         * Проверяем наличие реакции на изменение значения свойства
         */
        entity.childPropName = 'new propValue';

        return testResult;
    }

    this.setTestAsserts = function(/** @type {TestResultInterface} */ testResult) {

        testResult.expect(keys.event.call.beforeItemChange, 'Ожидался вызов события \'beforeItemChange\'');
        testResult.expect(keys.event.call.itemChanged, 'Ожидался вызов события \'itemChange\'');
        testResult.expect(keys.event.call.beforeChildItemChange, 'Ожидался вызов события \'beforeChildItemChange\'', 3);
        testResult.expect(keys.event.call.childItemChanged, 'Ожидался вызов события \'childItemChangeв\'', 3);

        testResult.expect(keys.beforeEntityReactivation.call, 'Ожидался вызов события \'beforeEntityReactivation\'', 4);
        testResult.expect(
            keys.beforeEntityReactivation.order,
            'Ожидался указанный в \'beforeEntityReactivationOrder\' порядок вызова события \'beforeEntityReactivation\'',
            4
        );

        testResult.expect(keys.event.beforeChildItemChange.child, 'Для события \'beforeChildItemChange\' ожидался дочерний изменившийся объект entity', 3);
        testResult.expect(
            keys.event.beforeChildItemChange.order,
            'Для события \'beforeChildItemChange\' ожидались указанные в \'childEventInitiatorsDict\' инициаторы события',
            3
        );

        testResult.expect(keys.event.childItemChanged.child, 'Для события \'childItemChanged\' ожидался дочерний изменившийся объект entity', 3);
        testResult.expect(
            keys.event.childItemChanged.order,
            'Для события \'childItemChanged\' ожидались указанные в \'childEventInitiatorsDict\' инициаторы события',
            3
        );

        testResult.expect(keys.event.itemChanged.sourceObject, 'Для события \'itemChanged\' ожидался объект entity', 1);
        testResult.expect(keys.event.itemChanged.newValue, 'Для события \'itemChanged\' ожидался изменившийся объект entity', 1);

        testResult.expect(keys.event.beforeItemChange.sourceObject, 'Для события \'beforeItemChange\' ожидался объект entity', 1);
    }

    this.metadata = new Metadata({name: 'TestReactivateEntityWithParents', file: import.meta.url})
}

TestReactivateEntityWithParents.prototype = new TestInterface();


export {TestReactivateEntityWithParents}
