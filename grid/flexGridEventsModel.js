import {Storage} from "../storage/storage.js";
import {EventManager} from "../event/eventManager.js";

function FlexGridEventsModel()
{
    return {

        moveItem: function(acceptorItem, draggedItem, acceptorFlexGridCustomId, sourceFlexGridCustomId){

            typeof this.config.events.moveItem === typeof function (){} &&
            this.config.events.moveItem(...arguments);

        },
        dataAccepted: function(flexGridCustomId){
            typeof this.config.events.dataAccepted === typeof function (){} &&
            this.config.events.dataAccepted(...arguments);
        },
        headersCompleted: function(flexGridCustomId){
            typeof this.config.events.headersCompleted === typeof function (){} &&
            this.config.events.headersCompleted(...arguments);
        },
        completed: function(flexGridCustomId){
            console.log('grid loading completed')
            typeof this.config.events.completed === typeof function (){} &&
            this.config.events.completed(...arguments);
        },
        beforeItemChange: function(eventObj){
            let storage = Storage.get(eventObj.sourceObject);
            eventObj.isGridElement = storage && storage.grids && storage.grids.has(this) && !!storage.grids.get(this).gridElement;
            return typeof this.config.events.beforeItemChange === typeof function (){} ?
                !!this.config.events.beforeItemChange(...arguments):
                true;
        },
        beforeChildItemChange: function(eventObj){
            return typeof this.config.events.beforeItemChange === typeof function (){} ?
                !!this.config.events.beforeItemChange(...arguments):
                true;
        },
        itemChanged: function(eventObj){
            console.log(eventObj)
            let gridElement;
            let sourceEventParams  = eventObj.sourceEventParams;
            let source = eventObj.sourceObject;
            let sourceStorage = Storage.get(source);
            //Если изменился
            if (
                sourceStorage &&
                sourceStorage.grids &&
                sourceStorage.grids.has(this)
            ) {
                gridElement = sourceStorage.grids.get(this).gridElement;
                if (gridElement) {
                    let properties = [sourceEventParams.propertyName];
                    //TODO Выполнить асинхронно?
                    //TODO Выполнить проверку, в каком режиме находится строка и как правильно обновлять ее визуальное представление (и надо ли вообще, чтобы не возникло рекурсии)
                    properties.forEach(propName => gridElement.isVisualized() &&  gridElement.updateCell(propName));
                }
            }

            typeof this.config.events.itemChanged === typeof function (){} &&
            this.config.events.itemChanged(...arguments);
        },
        childItemChanged: function(eventObj){
            console.log(eventObj);
            let gridElement;
            let sourceEventParams  = eventObj.sourceEventParams;
            let source = eventObj.sourceObject;
            let sourceStorage = Storage.get(source);
            //Если изменился
            if (
                sourceStorage &&
                sourceStorage.grids &&
                sourceStorage.grids.has(this)
            ) {
                gridElement = sourceStorage.grids.get(this).gridElement;
                if (gridElement) {
                    let properties = sourceEventParams.properties || [];
                    //TODO Выполнить асинхронно?
                    //TODO Выполнить проверку, в каком режиме находится строка и как правильно обновлять ее визуальное представление (и надо ли вообще, чтобы не возникло рекурсии)
                    properties.forEach(propName => gridElement.isVisualized() &&  gridElement.updateCell(propName));
                }
            }

            typeof this.config.events.childItemChanged === typeof function (){} &&
            this.config.events.childItemChanged(...arguments);

            if (
                !gridElement &&
                sourceStorage.reactive &&
                sourceStorage.reactive.parents instanceof Array
            ) {
                //parent является вложенным элементом. Поэтому событие нужно поднять выше, пока не наткнемся на gridElement
                sourceStorage.reactive.parents.forEach(
                    function(/**@type {ReactiveParentDefinition} */parentDefinition, index){
                        let parent = parentDefinition.getParent();
                        if (!parent) {
                            sourceStorage.reactive.parents[index] = null;
                            return;
                        }
                        let properties = Object.keys(parentDefinition.getReverseProperties());

                        // let properties = Object.keys(parentDefinition.parentPropName);
                        //{childItem: this,  parent, properties}
                        EventManager.fire(parent, 'childItemChanged', {childItem: source, parent, properties/**TODO Нужен ли тут originalEvent, чтобы на уровне gridElement можно было точно понять, какой вложенный объект изменился? */})
                    }
                )
                sourceStorage.reactive.parents = sourceStorage.reactive.parents.filter(definition => !!definition);
            }
        },
    }
}

export {FlexGridEventsModel}
