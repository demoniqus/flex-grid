export const EventManager = new function(){
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

function Event(
	/**@type {Object} объект-источник события, т.е. объект генерирующий событие */ object,
	/**@type {string} наименование события */ eventName,
	/**@type {Object|null} конфигурация события */ config
){
    let priv = {
            sourceObject: object,
            eventName: eventName,
            /**@type WeakMap <CallableFunction, Object> Словарь подписчиков на события */
            dict: new WeakMap(),
            //Список подписчиков на события
            list: [],
            returnResult: config && 'returnResult' in config ? !!config.returnResult : false,
    };

    let t;

    let sync = function(){
            //Периодически выполняем проверку, все ли подписчики еще существуют
            clearTimeout(t);
            let i = 0;

            while (i < priv.list.length) {
                    let subscriber = priv.list[i];
                    if (!priv.dict.has(subscriber.callback)) {
                            priv.list[i] = null;
                    }
                    i++;
            }
            priv.list = priv.list.filter((subscriber) => !!subscriber);
    };

    this.fire = priv.returnResult ?
            function(
                    /**@type {Object|null} параметры конкретного экземпляра события*/ baseEventParams
            ){
                    let i = -1;

                    let eventParams = {
                            _sourceEventParams: 'Параметры текущего экземпляра события',
                            sourceEventParams: baseEventParams,
                            _sourceObject: 'Объект-источник события',
                            sourceObject: priv.sourceObject,
                            _eventName: 'Наименование события',
                            eventName: priv.eventName,
                            _eventExtendedParams: 'Стандартные параметры подписчика на событие'
                    };
                    // Количество подписчиков на событие может быть любым. Поэтому результат реакции на любое событие всегда представляет из себя массив
                    let res = [];

                    while (++i < priv.list.length) {
                            let subscriber = priv.list[i];
                            if (!priv.dict.has(subscriber.callback)) {
                                    continue;
                            }
                            eventParams.eventExtendedParams = subscriber.eventExtendedParams;

                            res.push(subscriber.callback(eventParams));
                    }

                    clearTimeout(t);
                    t = setTimeout(sync, 50);

                    return res;
            } :
            function(
                    /**@type {Object|null} параметры конкретного экземпляра события*/ baseEventParams
            ){
                    let i = -1;

                    let eventParams = {
                            _sourceEventParams: 'Параметры текущего экземпляра события',
                            sourceEventParams: baseEventParams,
                            _sourceObject: 'Объект-источник события',
                            sourceObject: priv.sourceObject,
                            _eventName: 'Наименование события',
                            eventName: priv.eventName,
                            _eventExtendedParams: 'Стандартные параметры подписчика на событие'
                    };

                    while (++i < priv.list.length) {
                            let subscriber = priv.list[i];
                            if (!priv.dict.has(subscriber.callback)) {
                                    continue;
                            }
                            eventParams.eventExtendedParams = subscriber.eventExtendedParams;

                            subscriber.callback(eventParams);
                    }

                    clearTimeout(t);
                    t = setTimeout(sync, 50);
            };

    this.subscribe = function(callback, eventExtendedParams)
    {
            let subscriber = {callback, eventExtendedParams};
            if (!priv.dict.has(callback)) {
                    priv.dict.set(callback, subscriber);
                    priv.list.push(subscriber);
            }
    }
}