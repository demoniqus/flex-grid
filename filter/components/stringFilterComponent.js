"use strict";


import {FlexGridDataFilterComponentInterface} from "../dataFilterComponentInterface.js";
import {abstractFilterComponent} from "./abstractFilterComponent.js";
import {StringFilterModesModel} from "../stringFilterModesModel.js";




 function StringFilterComponent(){
    let priv = new abstractFilterComponent();

    this.buildFilterForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {object}*/headerData){
        let Filter = this.Filter;
        let filterComponent = this;
        let forms = this.buildBaseForm(DOMContainer);

        //events: onchange (minlength >= 0), onenter,


        let div = document.createElement('div');
        let formControlContainer = document.createElement('div');
        let input = document.createElement('input');
        div.classList.add('flex-grid-filter-field');
        formControlContainer.classList.add('form-control-container');


        let resetOption = this.buildResetOption(filterComponent);
        let configurationOption = this.buildConfigurationOption(filterComponent);
        // console.log(this.Filter); //(pubFilter)

        forms.componentContainer.appendChild(div);
        div.appendChild(configurationOption.container);
        div.appendChild(formControlContainer);
        div.appendChild(resetOption.container);
        formControlContainer.appendChild(input);
        // forms.componentContainer.appendChild(resetOption.container);

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

export {StringFilterComponent}
