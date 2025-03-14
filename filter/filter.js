"use strict";


export {FlexGridDataFilterComponentInterface} from './dataFilterComponentInterface.js'
export * from './components/stringFilterComponent.js'
//TODO поиск не по колонке, а по всем колонкам
// TODO Заточить под Excel
//  DblClick по ячейке - переход в редактирование

//TODO  Поиск может работать по следующим сценариям:
//   - поиск и отображение только элементов, удовлетворяющих условию - для этого нужен отдельный dataSet. Команда может называться "Найти всё"
//   - прокрутка к ближайшему элементу, удовлетворяющему условиям запроса и находящемуся ниже текущего отображаемого элемента - для этого не надо создавать отдельный dataSet
// Второй вариант, скорее всего более предпочтителен как вариант по умолчанию. Но тут для древесного грида нужно учитывать, что все предки искомого узла
// автоматически раскрываются. Команда может называться "Найти ..."




function Filter(privFlexGrid){
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

export {Filter}


