"use strict";

import { DefaultVisualizer } from "./visualization/flexGridVisualizer.js";

import * as standardVisualComponents from './visualization/visualComponents.js'
import * as filter from './filter/filter.js'
import {ClassModel} from "./grid/classModel.js";
import {FlexGridDefaultConfig} from "./grid/flexGridDefaultConfig.js";
import {FlexGridInterface, FlatGridInterface, TreeGridInterface} from "./grid/flexGridInterface.js";
import {GridManager} from "./grid/gridManager.js";
import {DataProviderInterface} from "./grid/dataProviderInterface.js";

export { DefaultVisualizer, FlexPanel } from "./visualization/flexGridVisualizer.js";


const FlexGrid = Object.defineProperties(
    Object.create(null),
    {
        GridManager: {
            get: () => GridManager,
            configurable: false,
            enumerable: false,
        },
        getDefaultConfig: {
            get: () => FlexGridDefaultConfig,
            configurable: false,
            enumerable: false,
        },
        FlexGridDataVisualizationComponentInterface: {
            get: () => standardVisualComponents.FlexGridDataVisualizationComponentInterface,
            configurable: false,
            enumerable: false,
        },
        FlexGridDataFilterComponentInterface: {
            get: () => filter.FlexGridDataFilterComponentInterface,
            configurable: false,
            enumerable: false,
        },
        FlexGridInterface: {
            get: () => FlexGridInterface,
            configurable: false,
            enumerable: false,
        },
        TreeGridInterface: {
            get: () => TreeGridInterface,
            configurable: false,
            enumerable: false,
        },
        FlatGridInterface: {
            get: () => FlatGridInterface,
            configurable: false,
            enumerable: false,
        },
        StringVisualizationComponent: {
            get: () => standardVisualComponents.StringVisualizationComponent,
            configurable: false,
            enumerable: false,
        },
        TextVisualizationComponent: {
            get: () => standardVisualComponents.TextVisualizationComponent,
            configurable: false,
            enumerable: false,
        },
        EmptyVisualizationComponent: {
            get: () => standardVisualComponents.EmptyVisualizationComponent,
            configurable: false,
            enumerable: false,
        },
        MoneyVisualizationComponent: {
            get: () => standardVisualComponents.MoneyVisualizationComponent,
            configurable: false,
            enumerable: false,
        },
        TreeVisualizationComponent: {
            get: () => standardVisualComponents.TreeVisualizationComponent,
            configurable: false,
            enumerable: false,
        },
        BooleanVisualizationComponent: {
            get: () => standardVisualComponents.BooleanVisualizationComponent,
            configurable: false,
            enumerable: false,
        },
        StringFilterComponent: {
            get: () => filter.StringFilterComponent,
            configurable: false,
            enumerable: false,
        },
        ClassModel: {
            get: () => ClassModel,
            configurable: false,
            enumerable: false,
        },
        DataProviderInterface: {
            get: () => DataProviderInterface,
            configurable: false,
            enumerable: false,
        }
    }
);



export {FlexGrid}
