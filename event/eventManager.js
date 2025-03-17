import {Event} from "./event.js";

const EventManager = new function(){
    //Самоочищающийся справочник прослушиваемых на события объектов - когда обычные ссылки на объект будут уничтожены, то из events пропадет ссылка
    let events = new WeakMap();

    let pub = {
        subscribe: function(
            /**@type {Object} объект-источник события, т.е. объект, на события которого требуется подписаться */ object,
            /**@type {string} наименование события */ eventName,
            /**@type {CallableFunction} функция-обработчик события */ callback,
            /**@type {Object|null} дополнительные параметры для события, передаваемые подписчиком в момент подписки */ eventExtendedParams,
            /**@type {Object|null} конфигурация события */ config
        ){
            (!events.has(object)) && (events.set(object, {}));

            let container = events.get(object);
            !(eventName in container) && (container[eventName] = new Event(object, eventName, config || {}));
            let event = container[eventName];
            event.subscribe(callback, eventExtendedParams);

        },
        fire: function(
            /**@type {Object} объект-источник события */ object,
            /**@type {string} наименование события */ eventName,
            /**@type {Object|null} параметры конкретного экземпляра события */ eventParams
        ){
            if (!events.has(object)) {
                return;
            }

            let container = events.get(object);
            if (!eventName in container) {
                return;
            }

            let event = container[eventName];
            return event.fire(eventParams);
        },
        getEvent: function(
            /**@type {Object} объект-источник события */ object,
            /**@type {string} наименование события */ eventName,
        )
        {
            if (!events.has(object)) {
                return;
            }

            let container = events.get(object);
            if (!eventName in container) {
                return;
            }

            return container[eventName];
        },
        getEventDefaultConfig: function(){
            return {
                _returnResult: 'Возвращать результат обработки события',
                returnResult: true,
            }
        }
    };

    return pub;
}

export {EventManager}
