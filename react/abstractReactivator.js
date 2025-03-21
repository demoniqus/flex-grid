import {ReactiveDataItemDefinition} from "./reactiveDataItemDefinition.js";
import {ReactiveParentDefinition} from "./reactiveParentDefinition.js";
import {Storage} from "../storage/storage.js";
import {EventManager} from "../event/eventManager.js";

function AbstractReactivator(config)
{
    config = config && typeof {} === typeof config ?
        {...config}:
        {};

    let globalStorage

    this.setEntityParentFields = function(/** @type {array|string|null} */ entityParentFields){
        if (!entityParentFields) {
            return;
        }

        !(entityParentFields instanceof Array) && (entityParentFields = [entityParentFields]);

        let map = {}, i = -1;

        while (++i < config.entityParentFields.length) {
            /**
             * @type {string}
             */
            let entityParentField = config.entityParentFields[i];
            entityParentField = entityParentField.replace('/^\s+/', '').replace('/\s+$/', '');
            entityParentField && (map[entityParentField] = true);
        }

        i = -1;

        while (++i < entityParentFields.length) {
            /**
             * @type {string}
             */
            let entityParentField = entityParentFields[i];
            entityParentField = (entityParentField || '').replace('/^\s+/', '').replace('/\s+$/', '');
            entityParentField && (map[entityParentField] = true);
        }

        !(entityParentFields instanceof Array) && (entityParentFields = [entityParentFields + '']);

        config.entityParentFields = entityParentFields;

        if (config.entityParentFields.length) {

            config.reactivateEntity = function(dataItem){
                config.entityParentFields.map(
                    function(/** @type {string} */ entityParentField){
                        this.configureDataItemAsReactive(new ReactiveDataItemDefinition(dataItem).addParentDefinition(
                            new ReactiveParentDefinition(
                                /**
                                 * Для прямых связей исходное значение извлекается в момент генерации событий прямо из значения поля, поэтому
                                 * здесь нет большого смысла передавать это значение. Но пусть будет....
                                 * К тому же, т.к. данные могут состоять из сущностей разных типов, то некоторые типы могут вообще
                                 * не содержать в себе этого значения
                                 */
                                dataItem[entityParentField]
                            ).addField(entityParentField, 'd')
                        ))
                    }.bind(this)
                );
            }.bind(this);
        }
    }

    this.configureDataItemAsReactive = function(/**@type {ReactiveDataItemDefinition} */ reactiveDataItemDefinition){
        let dataItem = reactiveDataItemDefinition.getDataItem();//Объект данных


        config.beforeEntityReactivation(dataItem);

        let key = 'beforeItemChange'
        let eventConf = config.events[key];
        EventManager.subscribe(dataItem, key, eventConf.callback, eventConf.evExtParams, eventConf.evConf);

        key = 'beforeChildItemChange'
        eventConf = config.events[key];
        EventManager.subscribe(dataItem, key, eventConf.callback, eventConf.evExtParams, eventConf.evConf);

        key = 'itemChanged'
        eventConf = config.events[key];
        EventManager.subscribe(dataItem, key, eventConf.callback, eventConf.evExtParams);

        key = 'childItemChanged'
        eventConf = config.events[key];
        EventManager.subscribe(dataItem, key, eventConf.callback, eventConf.evExtParams);

        let storage = Storage.get(dataItem);
        //Параметры реактивности
        //storage.original - Хранилище значений
        //storage.reactive.parents - Список родителей для текущего объекта
        //storage.reactive.directParentFields - Список полей, хранящих прямые ссылки из объекта на его родителя child.parentField = parent
        //storage.reactive.fields - Список сконфигурированных реактивных полей объекта
        !('reactive' in storage) && (
            storage.reactive = {
                parents: [],
                directParentFields: {},
                fields: {}
            },
            storage.original = {}
        );

        let reactiveConfig = {enumerable: true};

        this.configureDirectReferences(dataItem, storage, reactiveConfig);
        this.configureReverseReferences(dataItem, storage, reactiveConfig);
        this.configureParentDefinition(reactiveDataItemDefinition, storage);

    }

    this.configureDirectReferences = function (dataItem, storage, reactiveConfig) {
        if (
            !config.entityParentFields ||
            !config.entityParentFields.length
        ) {
            /**
             * Либо конфигурация вообще не предусматривает прямые ссылки на родителя,
             * либо у данной сущности нет поля, которое следует сконфигурировать
             * TODO Возможно, в случае отсутствия propName в сущности это поле надо принудительно создавать?
             */
            return;
        }

        config.entityParentFields.forEach(function(/** @type {string} */ propName){
            if (
                !propName ||
                !(propName in dataItem)
            ) {
                return
            }
            //TODO Надо сгенерировать единственный объект, т.к. для грида список полей,способных содержать прямые ссылки на родителя, единый
            // но у разных гридов могут быть разные поля
            //Запоминаем, что данное поле является прямой ссылкой на одного из родителей.
            //Если сущность используется в нескольких местах, то у нее может быть и несколько прямых
            //родителей - по одному на каждую точку использования
            storage.reactive.directParentFields[propName] = true

            !(propName in storage.reactive.fields) && (storage.reactive.fields[propName] = {});

            if (
                storage.reactive.fields[propName].type === 1 //1 = direct
            ) {
                //Это свойство уже сконфигурировано должным образом
                return;
            }

            storage.reactive.fields[propName].type = 1;//1 = direct

            //Запоминаем оригинальное значение
            storage.original[propName] = dataItem[propName];

            //По умолчанию родитель не должен извещать потомков о своем изменении, но при необходимости можно это событие сгенерировать
            // Например, смета может передать фрагментам свой номер

            //Здесь уже точно существуют необходимые callback'и для propName, поэтому не проверяем их наличие
            let callbacks = this.getDirectCallbacks(propName);
            reactiveConfig.get = callbacks.g;

            reactiveConfig.set = callbacks.ds;

            Object.defineProperty(dataItem, propName, reactiveConfig);
        }.bind(this));
    }

    this.configureReverseReferences = function (dataItem, storage, reactiveConfig) {

        for (let propName in dataItem) {
            if (propName in storage.reactive.fields ) {
                //Это свойство уже сконфигурировано
                continue;
            }

            let v = dataItem[propName];
            //Запоминаем оригинальное значение
            storage.original[propName] = v;
            storage.reactive.fields[propName] = {
                type: 0// 0 = 'reverse'
            };
            //Если значение является объектом или набором объектов, делаем их также реактивными
            if (v && typeof {} === typeof v) {
                //Все элементы массива находятся в одних и тех же свойствах родителя, что и сам массив.
                //Поэтому им можно единый ReactiveParentDefinition прописать
                let rpd  = new ReactiveParentDefinition(dataItem).addField(propName, 'r')
                //TODO Сделать реактивными массивы. Массивы могут включать как реактивные элементы, так и примитивные значения
                v instanceof Array ?
                    this.reactiveArray(
                        new ReactiveDataItemDefinition(v)
                            .addParentDefinition(rpd)
                    ) :
                    this.configureDataItemAsReactive(
                        new ReactiveDataItemDefinition(v)
                            .addParentDefinition(rpd)
                    );
            }

            let callbacks = this.getReverseCallbacks(propName);

            reactiveConfig.get = callbacks.g;

            reactiveConfig.set = callbacks.rs;
            //Конфигурирование выполняем сразу, не накапливаем. Таким образом нам не надо создавать временное хранилище для набора конфигураций
            Object.defineProperty(dataItem, propName, reactiveConfig);
        }

    }

    this.configureParentDefinition = function(reactiveDataItemDefinition, storage) {
        let parentDefinitions = reactiveDataItemDefinition.getParentDefinitions() //Список всех родительских связей

        for (let i in parentDefinitions) {
            /**
             * @type {ReactiveParentDefinition}
             */
            let sourceParentDefinition = parentDefinitions[i];
            // EventManager.subscribe(sourceParentDefinition.getParent(), 'childItemChanged', priv.events.childItemChanged, {grid: this.pub});

            let reactive = storage.reactive;
            /**
             *
             * @type {ReactiveParentDefinition}
             */
            let targetParentDefinition = reactive.parents.find((/**@type {ReactiveParentDefinition} */parentItem) => parentItem.getParent() === sourceParentDefinition.getParent())
            if (!targetParentDefinition) {
                targetParentDefinition = sourceParentDefinition;
                reactive.parents.push(targetParentDefinition);
            }
            else {
                targetParentDefinition.merge(sourceParentDefinition);
            }
        }

    };

    this.validateConfig = function() {
        //TODO Можно сделать prod и dev версии плагина. В prod версии сокращать число проверок и считать, что разработчик всё верно сконфигурировал
        // if (!('' in config)) {
        //     throw 'Incorrect config for reactivator';
        // }
    }

    this.extendsConfig = function(){
        !config.entityParentFields && (config.entityParentFields = []);
        !(config.entityParentFields instanceof Array) && (config.entityParentFields = [config.entityParentFields + '']);
        /**
         * Здесь в любом случае config.entityParentFields будет массивом, т.к. теоретически сущность может иметь неограниченное
         * количество прямых родителей
         */

        (
            !('events' in config) ||
            (typeof {} !== typeof config.events)
        ) && (config.events = {});

        let events = config.events;

        let enabledEvents = {
            beforeItemChange: true,
            beforeChildItemChange: true,
            itemChanged: true,
            childItemChanged: true
        };
        for (let eventName in enabledEvents) {
            (
                !(eventName in events) ||
                (typeof {} !== typeof events[eventName])
            ) && (events[eventName] = {callback: function(){}, evExtParams: undefined, evConf: undefined});
        }


        config.reactivateEntity = function(dataItem){
            this.configureDataItemAsReactive(new ReactiveDataItemDefinition(dataItem))
        }.bind(this);

        'function' !== typeof config.beforeEntityReactivation && (config.beforeEntityReactivation = function(){});

        this.setEntityParentFields(config.entityParentFields);

    };

    this.reactiveArray = function(/**@type {ReactiveDataItemDefinition} */ reactiveDataItemDefinition){

        let priv = this,
            dataItem = reactiveDataItemDefinition.getDataItem(),//Объект данных
            stackArrays = [dataItem],
            stackArraysCounter = -1,
            rdid
        ;
        /**
         * Массивы могут содержать в себе примитивные значения, объекты, вложенные массивы.
         * Проверяем полученный массив. Примитивные значения не конфигурируем никак.
         * Если пользователь захочет изменить их, ему надо будет воспользоваться методом set, который будет
         * добавлен массиву, вместо доступа по индексу array[] = value.  В этом случае массив сможет
         * сгенерировать событие изменения.
         * Объектные значения отправляем на конфигурацию в configureDataItemAsReactive и конфигурируем
         * таким образом, чтобы если у массива есть родительский объект (не массив, а объект), то события
         * изменения дочерних элементов пробрасывались сразу к ним. Для самого массива состояние элемента
         * не имеет значения - важны лишь порядок, количество.
         * Если вложенные элементы сами являются массивами, мы их также конфигурируем как массивы.
         * Для массива мы конфигурируем методы, которые влияют на состав и порядок элементов. При этом,
         * если у массива есть родительский объект, то его также надо уведомлять об изменениях структуры
         * массива. При этом
         */
        while (++stackArraysCounter < stackArrays.length) {
            let arr = stackArrays[stackArraysCounter];
            arr.forEach(function(item){
                if (!item || !(typeof item === 'object')) return;
                (item instanceof Array) ?
                    stackArrays.push(item) :
                    (
                        rdid = new ReactiveDataItemDefinition(item),
                            reactiveDataItemDefinition.getParentDefinitions().forEach((rpd) => rdid.addParentDefinition(rpd)),
                            priv.configureDataItemAsReactive(rdid)
                    ) ;

            });
        }

        let i = -1;
        while (++stackArraysCounter < stackArrays.length) {
            let arr = stackArrays[stackArraysCounter];
            this.configureArrayAsReactive(arr, reactiveDataItemDefinition.getParentDefinitions() )
        }
    };

    this.configureArrayAsReactive = function(/**@type {array} */ dataItem, /**@type {ReactiveParentDefinition[]} */ parentDefinitions){
        //TODO Может еще быть массив массивов
        let priv = this,
            arrayMethodName
        ;



        config.beforeEntityReactivation(dataItem);

        let storage = Storage.get(dataItem);

        !('reactive' in storage) && (
            storage.reactive = {
                parents: [],
                methods: {}
            }
        );

        let commonHandler = function(storage, sourceObj, origValue, index, item, eventSubtype, specHandler, specHandlerArguments){
            /**
             * Список родителей, всё еще ссылающихся на настоящий момент на текущий обрабатываемый массив
             * @type Map
             */
            let parents = priv.getReverseReferences(storage, sourceObj);

            let eventParams = {
                origValue,
                newValue: item,
                index,
                eventSubtype,
            };

            let stop = false;

            parents.forEach(function(parent){
                if (stop) return;

                if (priv.fire(parent, 'beforeChildItemChange', {child: {...eventParams}, properties: parent.properties}) === false) {
                    stop = true;
                }
            });

            if (stop) return;

            let result = specHandler(...arguments);

            parents.forEach(parent => EventManager.fire(parent, 'childItemChanged', {child: {...eventParams}, properties: parent.properties}));

            storage.reactive.parents = storage.reactive.parents.filter(
                (/**@type ReactiveParentDefinition */parent) =>
                    parent &&
                    !!parent.getParent() &&
                    (
                        parent.hasReverseProperties() ||
                        parent.hasDirectProperties()
                    )
            );

            return result;
        };

        arrayMethodName = 'set';
        !(arrayMethodName in storage.reactive.methods) && (
            dataItem[arrayMethodName] = function(item, index){
                let origValue = this.length > index ? this[index] : undefined;
                let sourceObj = this;

                let specHandler = function(){
                    sourceObj[index] = item;
                };

                commonHandler(storage, sourceObj, origValue, index, item, 'set', specHandler, []);
            },
            storage.reactive.methods[arrayMethodName] = true

        );


        arrayMethodName = 'push';
        !(arrayMethodName in storage.reactive.methods) && (
            dataItem[arrayMethodName] = function(){
                let index = this.length;
                let item = arguments[0];
                let origValue = undefined;
                let sourceObj = this;

                let specHandler = function(){
                    Array.prototype.push.apply(sourceObj, arguments);
                };

                commonHandler(storage, sourceObj, origValue, index, item, 'push', specHandler, arguments);
            },
            storage.reactive.methods[arrayMethodName] = true

        );

        arrayMethodName = 'unshift';
        !(arrayMethodName in storage.reactive.methods) && (
            dataItem[arrayMethodName] = function(){
                let index = 0;
                let item = arguments[0];
                let origValue = undefined;
                let sourceObj = this;

                let specHandler = function(){
                    Array.prototype.unshift.apply(sourceObj, arguments);
                };

                commonHandler(storage, sourceObj, origValue, index, item, 'unshift', specHandler, arguments);
            },
            storage.reactive.methods[arrayMethodName] = true

        );


        arrayMethodName = 'shift';
        !(arrayMethodName in storage.reactive.methods) && (
            dataItem[arrayMethodName] = function(){
                let index = 0;
                let item = undefined;
                let origValue = this[index];
                let sourceObj = this;

                let specHandler = function(){
                    return Array.prototype.shift.apply(sourceObj, arguments);
                };

                return commonHandler(storage, sourceObj, origValue, index, item, 'shift', specHandler, arguments);

            },
            storage.reactive.methods[arrayMethodName] = true

        );


        arrayMethodName = 'pop';
        !(arrayMethodName in storage.reactive.methods) && (
            dataItem[arrayMethodName] = function(){
                let index = this.length ? (this.length - 1) : 0;
                let item = undefined;
                let origValue = this[index];
                let sourceObj = this;

                let specHandler = function(){
                    return Array.prototype.pop.apply(sourceObj, arguments);
                };

                return commonHandler(storage, sourceObj, origValue, index, item, 'pop', specHandler, arguments);

            },
            storage.reactive.methods[arrayMethodName] = true

        );

        arrayMethodName = 'splice';
        !(arrayMethodName in storage.reactive.methods) && (
            dataItem[arrayMethodName] = function(){
                /**
                 * item - добавляемые элементы
                 */
                let item = [...arguments];
                let index = item.splice(0, 2);
                let origValue = [...this];
                let sourceObj = this;

                let specHandler = function(){
                    return Array.prototype.splice.apply(sourceObj, arguments);
                };

                return commonHandler(storage, sourceObj, origValue, index, item, 'splice', specHandler, arguments);

            },
            storage.reactive.methods[arrayMethodName] = true

        );

        arrayMethodName = 'delete';
        !(arrayMethodName in storage.reactive.methods) && (
            dataItem[arrayMethodName] = function(index){
                let item = undefined;
                let origValue = [...this];
                let sourceObj = this;

                let specHandler = function(){
                    return Array.prototype.splice.apply(sourceObj, arguments);
                };

                return commonHandler(storage, sourceObj, origValue, index, item, 'splice', specHandler, arguments);

            },
            storage.reactive.methods[arrayMethodName] = true

        );
        /**
         * TODO
         * splice - change original array
         * push - change original array
         * set - change original array, replace [] of original Array
         * map / forEach - doesn't change original array
         * sort - change original array
         * shift - change original array
         * pop - change original array
         * unshift - change original array
         * reverse - change original array
         * fill???
         * delete (index, collapse = true) - удаление элемента со схлопыванием пустого пространства
         * concat - doesn't change original array
         * .length - change original array
         *
         */

        for (let i in parentDefinitions) {
            /**
             * @type {ReactiveParentDefinition}
             */
            let sourceParentDefinition = parentDefinitions[i];
            // EventManager.subscribe(sourceParentDefinition.getParent(), 'childItemChanged', priv.events.childItemChanged, {grid: this.pub});

            let reactive = storage.reactive;
            /**
             *
             * @type {ReactiveParentDefinition}
             */
            let targetParentDefinition = reactive.parents.find((/**@type {ReactiveParentDefinition} */parentItem) => parentItem.getParent() === sourceParentDefinition.getParent())
            if (!targetParentDefinition) {
                targetParentDefinition = sourceParentDefinition;
                reactive.parents.push(targetParentDefinition);
            }
            else {
                targetParentDefinition.merge(sourceParentDefinition);
            }
        }

    };

    this.getReverseReferences = function(storage, sourceObj){
        /**
         * Список уникальных родителей, всё еще ссылающихся на настоящий момент на текущий обрабатываемый объект,
         * которых надо известить о событиях
         * @type {Map}
         */
        let parents = new Map();
        let i = -1;
        /*
            Получим parent'ов, которых надо известить об изменениях в текущей сущности
         */
        while (++i < storage.reactive.parents.length) {
            /**
             * @type {ReactiveParentDefinition}
             */
            let parentDefinition = storage.reactive.parents[i];
            let parent = parentDefinition.getParent();
            if (!parent) {
                //Этот parent уже почил
                continue;
            }
            if (!parentDefinition.hasReverseProperties()) {
                //В этом definition'е не определены reverse-связи
                continue;
            }
            /**
             * Список свойств, через которые указанный родитель всё еще ссылается на текущий обрабатываемый объект
             * @type {Set}
             */
            let properties = new Set();
            /**
             * Список свойств, по которым связь с предполагаемым родителем уже отсутствует
             * @type {Set}
             */
            let brokenProperties = new Set();
            let stack;
            for (let propName in parentDefinition.getReverseProperties()) {
                (
                    //Наиболее вероятно, что данный объект является непосредственно дочерним для parent,
                    // но также может быть, что является частью набора дочерних элементов
                    //Поэтому сначала проверяем просто на равенство, а лишь потом проверяем, является ли parent[propName] массивом
                    sourceObj === parent[propName] ||
                    (
                        parent[propName] instanceof Array &&
                        (
                            stack = [...parent[propName]],
                                stack.find(function(item){
                                    item instanceof Array &&
                                    item.forEach(subItem => stack.push(subItem));
                                    //TODO По идее достаточно первого совпадения и надо переходить к проверке следующего propName

                                    return item === sourceObj;
                                })
                        )
                        //parent[propName].find(item => item === sourceObj)//TODO Иерархия теоретически может иметь более одного уровня вложенности, но скорее всего позволять иерархию глубиной более 1
                    )
                ) ?
                    properties.add(propName):
                    brokenProperties.add(propName)
            }

            if (properties.size) {
                if (parents.has(parent)) {
                    let o = parents.get(parent);
                    properties.forEach(propName => o.properties.set(propName))
                }
                else {
                    parents.set(parent, {parent, properties}); //Текущий изменяемый объект все еще связан с указанным parent'ом через его поля properties
                }
            }

            /**
             * brokenProperties - список полей, по которым сущность уже фактически не связана с указанными родителями.
             * Убираем эти связи.
             */
            brokenProperties.forEach(propName => parentDefinition.deleteReverseProperty(propName))
        }

        return parents;
    }

    this.reactivateEntity = (dataItem) => config.reactivateEntity(dataItem);

    this.init = function(){
        this.validateConfig();

        globalStorage = Storage.create(this);
        /**
         * ds - Direct Setter
         * rs - Reverse Setter
         * g - Getter
         */
        globalStorage.callbacks = {
            g: {},
            ds: {},
            rs: {}
        };

        this.extendsConfig();
    }

    this.getDirectCallbacks = function(propName){
        !(propName in globalStorage.callbacks.ds) &&
        (
            //Свойство с таким наименованием еще не конфигурировалось как direct
            //При этом высока вероятность, что Getter для него тоже еще не создавался, т.к. вероятность
            // одновременного использования свойства как direct и reverse не очень высока

            //Такой подход позволяет сократить число проверок существования callback'ов для propName
            globalStorage.callbacks.g[propName] = this.createGetterCallback(propName),
            globalStorage.callbacks.ds[propName] = this.createDirectSetterCallback(propName)
        );

        return {
            g: globalStorage.callbacks.g[propName],
            ds: globalStorage.callbacks.ds[propName]
        }
    };

    this.getReverseCallbacks = function(propName){
        !(propName in globalStorage.callbacks.rs) &&
        (
            //Свойство с таким наименованием еще не конфигурировалось как direct
            //При этом высока вероятность, что Getter для него тоже еще не создавался, т.к. вероятность
            // одновременного использования свойства как direct и reverse не очень высока

            //Такой подход позволяет сократить число проверок существования callback'ов для propName
            globalStorage.callbacks.g[propName] = this.createGetterCallback(propName),
            globalStorage.callbacks.rs[propName] = this.createReverseSetterCallback(propName)
        );

        return {
            g: globalStorage.callbacks.g[propName],
            rs: globalStorage.callbacks.rs[propName]
        }
    };

    this.createGetterCallback = function(propName){

        return globalStorage.callbacks.g[propName] ||
            function(){
                //this - это объект данных, а не grid
                return Storage.get(this).original[propName];
            }
    };

    this.createDirectSetterCallback = function(propName){

        let priv = this;
        return function(value){
            //this - это объект данных, а не grid
            priv.directSetter(value, propName, this);
        }
    };

    this.createReverseSetterCallback = function(propName){

        let priv = this;
        return function(value){
            //this - это объект данных, а не grid
            priv.reverseSetter(value, propName, this);
        };
    };

    this.directSetter = function(value, propName, sourceObj){
        // let eventRes;
        let storage = Storage.get(sourceObj);
        let origValue = storage.original[propName];
        let parents = [];
        let i;

        if (origValue === value) {
            //Смены родителя фактически не произошло.
            return;
        }

        if (origValue) {
            //Старый родитель
            parents.push({
                parent: origValue,
                properties: [propName],
                eventSubtype: 'removeParent',
            });
        }

        if (value) {
            //Новый родитель
            parents.push({
                parent: value,
                properties: [propName],
                eventSubtype: 'setParent',
            });
            EventManager.subscribe(
                value,
                'beforeChildItemChange',
                config.events.beforeChildItemChange.callback,
                config.events.beforeChildItemChange.evExtParams,
                config.events.beforeChildItemChange.evConf
            );
            EventManager.subscribe(
                value,
                'childItemChanged',
                config.events.childItemChanged.callback,
                config.events.childItemChanged.evExtParams,
            );
        }


        //TODO Здесь можно вообще реализовать отдельные события типа removeChild и addChild, но есть ли смысл и не усложнит ли это понимание алгоритма?


        let eventParams = {
            origValue,
            newValue: value,
            propertyName: propName,
        };

        //Здесь идет обработка смены родителя.
        //Обработка изменений других полей будет реализована далее.
        // Генерируем событие накануне изменения текущего элемента
        if (this.fire(sourceObj, 'beforeItemChange', eventParams) === false) {
            return;
        }

        eventParams = {
            origValue,
            newValue: value,
            propertyName: propName,
            object: sourceObj
        };
        i = -1;
        while (++i < parents.length) {
            let parent = parents[i].parent;
            //Событие накануне изменения родителя дочерним элементом у старого и нового родителя
            /**
             *Т.к. связь реализована непосредственно от дочернего элемента к родителю, то родитель не имеет
             * прямой ссылки на дочерний элемент, поэтому нет возможности определить свойство родителя, в
             * котором произошло изменение. Ставим properties: null
             */

            eventParams.eventSubtype = parents[i].eventSubtype;

            if (this.fire(parent, 'beforeChildItemChange', {child: {...eventParams}, properties: null}) === false) {
                return;
            }
        }

        //TODO Было бы неплохо придумать способ обновлять сущность не отдельными полями, а сначала обновить, потом выполнить события
        // В этом случае пользователь может внести изменения, которые по отдельности запрещены, а вместе допустимы
        // Возможно, надо создавать в этом случае виртуальные сущности и прогонять их через валидации - в случае успеха уже менять реальные сущности
        // Для этого делать обертку над сущностью, в эту обертку в ее собственные поля ставить значения, блокировать их изменение и отдавать на валидацию.


        //Проверки выполнены. Теперь меняем значение свойства
        //Никакого дополнительного конфигурирования значения тут не требуется, реактивность для родителя настраивается отдельно, как для отдельной строки грида,
        // а не вложенного объекта

        Storage.get(sourceObj).original[propName] = value;
        //eventParams генерируем заново, т.к. предыдущий экземпляр мог быть изменен в предыдущем событии
        // TODO Можно также сделать немодифицируемый экземпляр eventParams
        //Значение изменено. Генерируем события
        eventParams = {
            origValue,
            newValue: value,
            propertyName: propName,
            child: sourceObj
        };
        EventManager.fire(sourceObj, 'itemChanged', eventParams);

        i = -1;
        while (++i < parents.length) {
            let parent = parents[i].parent;
            eventParams.eventSubtype = parents[i].eventSubtype;
            /**
             *Т.к. связь реализована непосредственно от дочернего элемента к родителю, то родитель не имеет
             * прямой ссылки на дочерний элемент, поэтому нет возможности определить свойство родителя, в
             * котором произошло изменение. Ставим properties: null
             */
            EventManager.fire(parent, 'childItemChanged', {child: {...eventParams}, properties: null});
        }

        storage.reactive.parents = storage.reactive.parents.filter(parent => !!parent);

    };

    this.reverseSetter = function(value, propName, sourceObj){
        let storage = Storage.get(sourceObj);
        let origValue = storage.original[propName];
        let priv = this;
        let stop = false;
        /**
         * Список уникальных родителей, всё еще ссылающихся на настоящий момент на текущий обрабатываемый объект,
         * которых надо известить о событиях
         * @type {Map}
         */
        let parents = this.getReverseReferences(storage, sourceObj);

        for (let directParentField in storage.reactive.directParentFields) {
            let parent = sourceObj[directParentField];
            if (
                !parent ||
                parents.has(parent)
            ) {
                continue;
            }
            //parent не имеет полей, ссылающихся на child, поэтому properties = null
            parents.set(parent, {parent, properties: null});
        }
        /*
            При изменении свойства объекта первая проверка должна производиться в рамках самого объекта.
            Далее, если изменяемый объект является частью других (родительских) объектов, то необходимо
            провести также проверки в рамках этих объектов
         */

        let eventParams = {
            origValue,
            newValue: value,
            propertyName: propName,
        };

        if (this.fire(sourceObj, 'beforeItemChange', eventParams) === false) {
            return;
        }

        eventParams = {
            origValue,
            newValue: value,
            propertyName: propName,
            object: sourceObj
        };

        parents.forEach(function(parent){
            if (stop) return;
            if (priv.fire(parent.parent, 'beforeChildItemChange', {child: {...eventParams}, properties: parent.properties}) === false) {
                stop = true;
            }
        })

        if (stop) return;

        //TODO Было бы неплохо придумать способ обновлять сущность не отдельными полями, а сначала обновить, потом выполнить события
        // В этом случае пользователь может внести изменения, которые по отдельности запрещены, а вместе допустимы
        // Возможно, надо создавать в этом случае виртуальные сущности и прогонять их через валидации - в случае успеха уже менять реальные сущности
        // Для этого делать обертку над сущностью, в эту обертку в ее собственные поля ставить значения, блокировать их изменение и отдавать на валидацию.


        //Проверки выполнены. Теперь меняем значение свойства

        if (value && typeof value === typeof {}) {
            let rdid = new ReactiveDataItemDefinition(value)
                .addParentDefinition(new ReactiveParentDefinition(sourceObj).addField(propName, 'r'));

            value instanceof Array ?
                priv.reactiveArray(rdid):
                priv.configureDataItemAsReactive(rdid);

        }
//         if (value && typeof value === typeof {}) {
//            priv.configureDataItemAsReactive(
//                new ReactiveDataItemDefinition(value)
//                    .addParentDefinition(new ReactiveParentDefinition(sourceObj).addField(propName, 'r'))
//
//            );
//
//        }

        Storage.get(sourceObj).original[propName] = value;
        //Значение изменено. Генерируем события
        eventParams = {
            origValue,
            newValue: value,
            propertyName: propName,
        };
        EventManager.fire(sourceObj, 'itemChanged', eventParams);

        eventParams = {
            origValue,
            newValue: value,
            propertyName: propName,
            object: sourceObj
        }

        parents.forEach(parent => EventManager.fire(parent.parent, 'childItemChanged', {child: {...eventParams}, properties: parent.properties}))

        storage.reactive.parents = storage.reactive.parents.filter(
            (/**@type ReactiveParentDefinition */parent) =>
                parent &&
                !!parent.getParent() &&
                (
                    parent.hasReverseProperties() ||
                    parent.hasDirectProperties()
                )
        );

    };

    this.fire = function(
        /**@type {Object} */ sourceObj,
        /**@type {string} */ eventName,
        /**@type {Object|null} */ eventParams
    ){
        let eventRes = EventManager.fire(sourceObj, eventName, eventParams);

        return eventRes instanceof Array ?
            eventRes.reduce((accum, eventResItem) => eventResItem !== false && accum !== false) :
            eventRes;
    }

    this.init();
}

export {AbstractReactivator}
