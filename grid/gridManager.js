import {FlatGrid} from "./flatGrid.js";
import {TreeGrid} from "./treeGrid.js";

const GridManager = {
    createFlatGrid: (config) => new FlatGrid(config),
    createTreeGrid: (config) => new TreeGrid(config),
};

export {GridManager}
