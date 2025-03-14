"use strict";


function FlexGridDataFilterComponentInterface (){
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
    this.buildConfigurationOption = function(){
        let container = document.createElement('div');
        container.classList.add('flex-grid-filter-option');
        let button = document.createElement('button');
        button.classList.add('filter-configuration-button');
        button.innerHTML = '&#9881;';

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

export {FlexGridDataFilterComponentInterface}
