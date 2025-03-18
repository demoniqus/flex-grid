import {DataSetManager} from "../dataSet/dataSetManager.js";
import {FlatGridInterface} from "./flexGridInterface.js";
import {AbstractFlexGrid} from "./abstractFlexGrid.js";

function FlatGrid(config) {
    config = config && typeof config === typeof {} ?
        {...config} :
        {}
    ;
    //У плоской таблицы нет понятия parent для сущностей
    config.entityParentField = null;

    let priv = new AbstractFlexGrid(config);
    priv.pub = this;

    priv.prepareData = function(data){
        let {gridElements, objectsDict} = this.createGridElements(data);

        this.data.flat = this.data.current = DataSetManager.createFlatDataSet(priv);
        this.data.flat.initData(gridElements);

    };

    this.build = function(){priv.init();};

    this.addVisualizationComponent = function(/** @type {string} */alias, /** @type {standardVisualComponents.FlexGridDataVisualizationComponentInterface} */component){
        priv.addVisualizationComponent(alias, component);
    };

    this.addFilterComponent = function(/** @type {string} */alias, /** @type {filter.FlexGridDataFilterComponentInterface} */component){
        priv.addFilterComponent(alias, component);
    };

    this.getVisualizationComponent = function(/** @type {string} */alias){
        return priv.getVisualizationComponent(alias);
    };

    this.getFilterComponent = function(/** @type {string} */alias){
        return priv.getFilterComponent(alias)
    };

    this.updatePreview = function(){priv.updatePreview();};

    this.destroy = function(){
        throw 'Method \'destroy\' is not implemented for flexGrid';

    };

    this.getContainer = () => priv.getContainer();

    this.getId = function(){return priv.getId();};

    priv.registerDefaultComponents();
}

FlatGrid.prototype = new FlatGridInterface();

export {FlatGrid}
