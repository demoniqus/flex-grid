"use strict";

let pluginIds = {};
//TODO поиск не по колонке, а по всем колонкам
// TODO Заточить под Excel
//  DblClick по ячейке - переход в редактирование

//TODO  Поиск может работать по следующим сценариям:
//   - поиск и отображение только элементов, удовлетворяющих условию - для этого нужен отдельный dataSet. Команда может называться "Найти всё"
//   - прокрутка к ближайшему элементу, удовлетворяющему условиям запроса и находящемуся ниже текущего отображаемого элемента - для этого не надо создавать отдельный dataSet
// Второй вариант, скорее всего более предпочтителен как вариант по умолчанию. Но тут для древесного грида нужно учитывать, что все предки искомого узла
// автоматически раскрываются. Команда может называться "Найти ..."

let StringFilterModesModel = Object.defineProperties(
    Object.create(null),
    {
        StartWith: {
            get: () =>  'startWith',
            configurable: false,
            enumerable: false,
        },
        EndWith: {
            get: () => 'endWith',
            configurable: false,
            enumerable: false
        },
        Contains: {
            get: () => 'contains',
            configurable: false,
            enumerable: false
        },
        Equals: {
            get: () => 'equals',
            configurable: false,
            enumerable: false
        },
    }
);


export function Filter(privFlexGrid){
    let priv = {
        privFlexGrid: privFlexGrid,
        components: {},
        dataSet: undefined,//Tree || Flat??,
        mode: 'onenter',
        layers: {
            /**
             * Сохраняя в слоях фильтра отфильтрованные наборы данных и подкладывая их в grid.dataset, мы избегаем того,
             * что пользователь нажмет expand и эти раскрытые/свернутые строки испортят отфильтрованный набор данных
             */
            /**
             * @type {FilterLayer[]}
             */
            dict: {},
            /**
             * @type {FilterLayer[]}
             */
            list: []
        },
        filters: [

        ],
        filtersDict: {

        },
        filtrate: function(){
            /**
             * @type {GridElement[]}
             */
            let data =
                priv.privFlexGrid.data.flat.getData(true);

            for (let i = 0; i < this.filters.length; i++) {
                let filter = this.filters[i];
                data = filter.filterComponent.filtrate(
                    filter.fieldName,
                    filter.filterValue,
                    data
                );

            }


            //В grid.dataset устанавливаем копию отфильтрованных данных, т.к. пользователь может разворачивать
            //строки и портить тем самым результат фильтрации
            let copy = [...data];
            priv.privFlexGrid.data.current.setData(copy);
            /**
             * expanded просто так менять нельзя на true.
             * Во-первых, отфильтрованные элементы сами показываются в гриде, но при этом пользователь их еще не раскрывал.
             * Во-вторых, могут отфильтроваться предок и один/несколько (но не все) его потомки. В этом случае
             * по идее флаг дерева должен принять вид "Открыто частично"
             */
            // if (priv.privFlexGrid.data.current instanceof TreeDataSet) {
            //     let i = 0, l = data.length;
            //     while (i < l) {
            //         data[i].expand(true);
            //     }
            // }

            priv.privFlexGrid.updatePreview();
        }
    };
    let pub = {
        addComponent: function(key, component){
            priv.components[key] = component;
        }.bind(priv),
        setFilter: function(
            /** @type {string} */fieldName,
            filterValue,
            /** @type {FlexGridDataFilterComponentInterface} */ filterComponent
        ){
            if (fieldName in this.filtersDict && filterComponent.getId() in this.filtersDict[fieldName]) {
                let filter = this.filtersDict[fieldName][filterComponent.getId()];
                filter.filterValue = filterValue;
            }
            else {
                let filter = {
                    fieldName: fieldName,
                    filterValue: filterValue,
                    filterComponent: filterComponent
                };
                if (!(fieldName in this.filtersDict)) {
                    this.filtersDict[fieldName] = {};
                }
                this.filtersDict[fieldName][filterComponent.getId()] = filter;
                this.filters.push(filter);
            }
            this.filtrate();

        }.bind(priv),
        clearFilter: function(
            /** @type {string} */fieldName,
            /** @type {FlexGridDataFilterComponentInterface} */ filterComponent
        ){
            if (fieldName in this.filtersDict && filterComponent.getId() in this.filtersDict[fieldName]) {
                let filter = this.filtersDict[fieldName][filterComponent.getId()];
                delete this.filtersDict[fieldName];
                let i = this.filters.length;
                while (i--) {
                    if (this.filters[i] === filter) {
                        this.filters.splice(i, 1);
                        this.filtrate();
                        break;
                    }
                }
            }

        }.bind(priv),
    };


    return pub;
}

function FilterLayer(){
    let priv = {
        data: null,
        prevLayer: null,
        nextLayer: null,
    };

    let pub = {
        setData: (data) => priv.data = data,
        getData: () => priv.data,
    };

    return pub;
}

export function FlexGridDataFilterComponentInterface (){
    this.buildFilterForm = function (
        /** @type {Element}*/DOMContainer,
        /** @type {string}*/fieldName,
        /** @type {object}*/headerData,
    ){
        throw 'Method \'buildReadForm\' is not implemented';
    };

    this.buildBaseForm = function(/** @type {Element}*/DOMContainer,){
        while (DOMContainer.lastChild) {
            DOMContainer.removeChild(DOMContainer.firstChild);
        }
        DOMContainer.classList.add('flex-grid-panel');
        DOMContainer.classList.add('flex-grid-filter-panel');
        DOMContainer.classList.add('flex-grid-nowrapped-panel');
        DOMContainer.classList.add('flex-grid-horizontal-panel');
        let componentContainer = document.createElement('div');
        let componentOptionsContainer = document.createElement('div');
        componentContainer.classList.add('flex-grid-filter-component-container');
        componentOptionsContainer.classList.add('flex-grid-filter-component-options-container');

        return {
            componentContainer: componentContainer,
            componentOptionsContainer: componentOptionsContainer
        }

    };

    this.filtrate = function(
        fieldName,
        filterValue,
        gridElements
    ){
        throw 'Method \'filtrate\' of filter component is not implemented'
    };

    this.getId = function(
    ){
        throw 'Method \'getId\' of filter component is not implemented'
    };



    this.buildResetOption = function(){
        let container = document.createElement('div');
        container.classList.add('flex-grid-filter-option');
        let button = document.createElement('button');
        button.classList.add('filter-reset-button');
        button.innerHTML = 'X';

        container.appendChild(button);
        return {
            container: container,
            button: button
        };
    };

    this.customizeComponents = function(componentsDict){

    };
    // this.buildResetOption = function(){
    //     let option = document.createElement('div');
    //     option.classList.add('flex-grid-filter-option');
    //     option.innerHTML = 'X';
    //     return option;
    // };
    // this.buildEditForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){
    //     throw 'Method \'buildEditForm\' is not implemented';
    // };

    //TODO Для числовых полей и дат в качестве опций можно добавить "Вне диапазона", "В диапазоне", "Точное значение", "Содержит..."
    // Для диапазонов - можно указывать одну из границ - тогда ищем либо больше, либо меньше, либо >=, либо <=

}

function abstractFilterComponent(){
    this.DOM = {};
    this.mode = StringFilterModesModel.StartWith
    this.id = null;
    this.createId = function(){
        let r;
        while ((r = 'filter-component_' + (Math.ceil(Math.random() * 1000000) + 1)) in pluginIds) {}
        this.id = r;
        pluginIds[r] = true;// true instead of this to avoid memory leak
    };
    this.init = function(){
        this.createId();
    };

    this.init();
}

export function StringFilterComponent(){
    let priv = new abstractFilterComponent();

    this.buildFilterForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {object}*/headerData){
        let Filter = this.Filter;
        let filterComponent = this;
        let forms = this.buildBaseForm(DOMContainer);

        //events: onchange (minlength >= 0), onenter,

        let div = document.createElement('div');
        let input = document.createElement('input');
        div.classList.add('flex-grid-filter-field');
        div.appendChild(input);
        let resetOption = this.buildResetOption(filterComponent);
        // console.log(this.Filter); //(pubFilter)

        forms.componentContainer.appendChild(div);
        forms.componentContainer.appendChild(resetOption.container);

        resetOption.button.addEventListener(
            'click',
            function(e){
                e.cancelBubble = true;
                e.preventDefault();
                input.value = '';
                Filter.clearFilter(fieldName, filterComponent);
            }
        );

        DOMContainer.appendChild(forms.componentContainer);
        DOMContainer.appendChild(forms.componentOptionsContainer);
        input.addEventListener(
            'keyup',
            function(e){
                if (e.keyCode !== 13) {
                    return;
                }
                this.value.trim() ?
                    Filter.setFilter(fieldName, this.value, filterComponent) :
                    Filter.clearFilter(fieldName, filterComponent);
            }
        );

        let btnGroupContainer = document.createElement('div');
        btnGroupContainer.classList.add('btn-group');
        btnGroupContainer.setAttribute('role', 'group');

        let modeComponents = {};
        modeComponents[StringFilterModesModel.StartWith] = {title: 'Начинается с ...', caption: '^*'};
        modeComponents[StringFilterModesModel.EndWith] = {title: 'Заканчивается на ...', caption: '*$'};
        modeComponents[StringFilterModesModel.Contains] = {title: 'Содержит ...', caption: '%%'};
        modeComponents[StringFilterModesModel.Equals] = {title: 'Точное совпадение ...', caption: '**'};

        for (let modeName in modeComponents) {
            let modeParams = modeComponents[modeName];
            let radio = document.createElement('input');
            radio.type = 'radio';
            radio.classList.add('btn-check');
            radio.name = 'string-filter-component-mode-' + fieldName + '-' + priv.id;
            radio.id = 'string-filter-component-mode-' + modeName + '-' + fieldName + '-' + priv.id;
            radio.dataset.mode = modeName;
            radio.autocomplete = 'off';
            let label = document.createElement('label');
            label.classList.add('btn');
            label.classList.add('btn-outline-primary');
            label.classList.add('string-filter-option');
            label.setAttribute('for', radio.id)
            label.textContent = modeParams.caption;
            label.title = modeParams.title;
            btnGroupContainer.appendChild(radio);
            btnGroupContainer.appendChild(label);
            radio.onchange = function(){
                priv.mode = this.dataset.mode;
            };

        }

        //TODO Компонент может также содержать опции учета регистра, а также инверсии результатов поиска
        // Отдельно продумать поиск пустые / непустые и т.п. - возможно, для компонента надо делать отдельное вспылвающее окошко с расширенными настройками

        forms.componentOptionsContainer.appendChild(btnGroupContainer);




        this.customizeComponents(
            {
                inputField: input,
                resetButton: resetOption.button
            }
        );
    };

    this.filtrate = function(
        fieldName,
        filterValue,
        /** @type {GridElement[]} */gridElements
    ){
        let filterCallbacks = {};

        //TODO После поиска следует прокручивать список в начало, а после сброса фильтров по возможности возвращать в исходную прокрутку
        filterCallbacks[StringFilterModesModel.StartWith] = function(gridElement, index){
            return (gridElement.get(fieldName) ?? '').toString().indexOf(filterValue) === 0;
        };
        filterCallbacks[StringFilterModesModel.EndWith] = function(gridElement, index){

            return (gridElement.get(fieldName) ?? '').toString().endsWith(filterValue);
        };

        filterCallbacks[StringFilterModesModel.Contains] = function(gridElement, index){
            return (gridElement.get(fieldName) ?? '').toString().indexOf(filterValue) > -1;
        };
        filterCallbacks[StringFilterModesModel.Equals] = function(gridElement, index){
            return (gridElement.get(fieldName) ?? '').toString() === filterValue;
        };

        return gridElements.filter(
            filterCallbacks[priv.mode ?? StringFilterModesModel.StartWith]
        );
    };

    this.getId = function(){
        return this.id;
    }.bind(priv);

};
StringFilterComponent.prototype = new FlexGridDataFilterComponentInterface();


