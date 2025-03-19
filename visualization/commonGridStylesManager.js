import {StylesManager} from "../styles/stylesManager.js";

let conf = {
    baseId: 'common-flex-grid-styles',
    defaultStyles: []
};

conf.defaultStyles.push({key: '.flex-grid-container', style: 'display: flex; flex-direction: column; overflow-x: hidden; overflow-y: hidden;'});
conf.defaultStyles.push({key: '.flex-grid-panel', style: 'box-sizing: border-box; display: flex; overflow: hidden;'});
conf.defaultStyles.push({key: '.flex-grid-panel.flex-grid-horizontal-panel:empty', style: 'min-height: 10px; height: 10px; max-height: 10px;'});
conf.defaultStyles.push({key: '.flex-grid-panel.flex-grid-horizontal-panel', style: 'flex-direction: row;'});
conf.defaultStyles.push({key: '.flex-grid-panel.flex-grid-vertical-panel:empty', style: 'min-width: 10px; width: 10px; max-width: 10px;'});
conf.defaultStyles.push({key: '.flex-grid-panel.flex-grid-vertical-panel', style: 'flex-direction: column;'});
conf.defaultStyles.push({key: '.flex-grid-panel.flex-grid-nowrapped-panel', style: 'flex-wrap: nowrap; align-items: stretch;'});
conf.defaultStyles.push({key: '.flex-grid-panel.flex-grid-wrapped-panel', style: 'flex-wrap: wrap; '});
conf.defaultStyles.push({key: '.flex-grid-top-panel', style: 'overflow: visible;'});
conf.defaultStyles.push({key: '.flex-grid-middle-panel', style: 'flex-grow: 1;'});
conf.defaultStyles.push({key: '.flex-grid-bottom-panel', style: 'overflow-y: visible;'});
conf.defaultStyles.push({key: '.flex-grid-left-panel', style: ''});
conf.defaultStyles.push({key: '.flex-grid-central-panel', style: 'flex-grow: 1;'});
conf.defaultStyles.push({key: '.flex-grid-right-panel', style: ''});
conf.defaultStyles.push({key: '.flex-grid-content-panel', style: 'flex-grow: 1; overflow-x: visible;'});
conf.defaultStyles.push({key: '.flex-grid-content-right-panel', style: ''});
conf.defaultStyles.push({key: '.flex-grid-header-panel', style: 'flex-grow: 0; overflow: visible; /*padding-right: 16px;*/'});
conf.defaultStyles.push({key: '.flex-grid-filter-panel', style: 'overflow: visible;'});
conf.defaultStyles.push({key: '.flex-grid-data-panel', style: 'flex-grow:1; overflow-y: hidden; overflow-x: visible;'});
conf.defaultStyles.push({key: '.flex-grid-footer-panel', style: 'overflow: visible;'});
conf.defaultStyles.push({key: '.flex-grid-row', style: 'flex-wrap: nowrap; display: flex; align-items: stretch; overflow: visible;'});
conf.defaultStyles.push({key: '.flex-grid-cell', style: 'margin: 0 !important; box-sizing: border-box !important; padding: 0px 5px; border: 1px solid grey; overflow: visible; text-wrap: wrap; word-break: break-all;'});
conf.defaultStyles.push({key: '.flex-grid-header-cell', style: 'text-align: center; font-weight: bold; background-color: rgba(100, 180, 130, .3);'});
conf.defaultStyles.push({key: '.flex-grid-cell.flex-grid-header-cell.virtual-header', style: 'border-bottom-color: transparent;'});
conf.defaultStyles.push({key: '.flex-grid-cell.flex-grid-header-cell.has-virtual-parent', style: 'border-top-color: transparent;'});
conf.defaultStyles.push({key: '.flex-grid-headers-row:not(:first-child) .flex-grid-header-cell.virtual-header', style: 'border-top-color: transparent;'});
conf.defaultStyles.push({key: '.flex-grid-data-cell', style: ''});
conf.defaultStyles.push({key: '.flex-grid-row.flex-grid-data-row', style: 'overflow-x: visible; overflow-y: hidden; flex-grow: 0; flex-shrink: 0;'});
conf.defaultStyles.push({key: '.flex-grid-row.flex-grid-data-row:hover .flex-grid-cell.flex-grid-data-cell', style: '--brd-clr: lime; border-top-color: var(--brd-clr); border-bottom-color: var(--brd-clr);'});
conf.defaultStyles.push({key: '.flex-grid-row.flex-grid-data-row.selected-row', style: 'background-color: rgba(220, 220, 220, .5);'});
conf.defaultStyles.push({key: '.flex-grid-row.flex-grid-filters-row .flex-grid-filter-cell', style: 'text-align: center; padding: 5px 0px; display: flex; flex-direction: column; row-gap: 2px;'});
conf.defaultStyles.push({key: '.flex-grid-filter-panel .flex-grid-filter-component-container', style: 'display: flex; flex-direction: row; flex-wrap: nowrap; box-sizing: border-box;  align-items: center; width: 100%; min-width: 100%; max-width: 100%; position: relative; column-gap: 2px;'});
conf.defaultStyles.push({key: '.flex-grid-filter-panel .flex-grid-filter-component-container .flex-grid-filter-field', style: 'display: flex; flex-direction: row; align-items: stretch; flex-grow: 1; /*padding-right: 16px; width: calc(100% - 4px); min-width: calc(100% - 4px); max-width: calc(100% - 4px);*/'});
conf.defaultStyles.push({key: '.flex-grid-filter-panel .flex-grid-filter-component-container .flex-grid-filter-field .form-control-container', style: 'flex-shrink: 100;'});
conf.defaultStyles.push({key: '.flex-grid-filter-panel .flex-grid-filter-component-container .flex-grid-filter-field .flex-grid-filter-option', style: 'border: 1px solid #ced4da; padding: 0px; flex-grow: 1;'});
conf.defaultStyles.push({key: '.flex-grid-filter-panel .flex-grid-filter-component-container input, .flex-grid-filter-panel .flex-grid-filter-component-container select', style: '/*--w: calc(100% - 20px); max-width: var(--w); min-width: var(--w); var(--w);*/ box-sizing: border-box;'});
conf.defaultStyles.push({key: '.flex-grid-filter-component-options-container', style: 'display: flex; justify-content: center; column-gap: 2px; flex-wrap: wrap;'});
conf.defaultStyles.push({key: '.string-filter-option', style: 'text-wrap: nowrap !important; font-size: .6rem; padding: 2px; '});
conf.defaultStyles.push({key: '.flex-grid-filter-panel .flex-grid-filter-component-container .filter-reset-button', style: 'padding: 3px; line-height: 1;'});
conf.defaultStyles.push({key: '.flex-grid-filter-component-container', style: ''});
conf.defaultStyles.push({key: '.flex-grid-container .flex-grid-header-panel.spinner', style: 'display: block; box-sizing: border-box; border: 1px solid lime; height: 20%; min-height: 40px; border-radius: 20px;'});
conf.defaultStyles.push({key: '.flex-grid-container .flex-grid-data-panel.spinner', style: 'display: block; box-sizing: border-box; border: 1px solid lime; height: 80%; min-height: 40px; border-radius: 20px;'});
conf.defaultStyles.push({key: '.flex-grid-footer-panel .button', style: 'display: inline-block; box-sizing: border-box; width: 75px; min-width: 75px; max-width: 75px; height: 25px; min-height: 25px; max-height: 25px; border: 1px solid grey; border-radius: 5px; margin: 5px; text-align: center;'});
conf.defaultStyles.push({key: '.flex-grid-left-panel .button', style: 'display: inline-block; box-sizing: border-box; width: 75px; min-width: 75px; max-width: 75px; height: 25px; min-height: 25px; max-height: 25px; border: 1px solid grey; border-radius: 5px; margin: 5px; text-align: center;'});
conf.defaultStyles.push({key: '.flex-grid-left-panel .button-wrapper', style: 'display: inline-block; box-sizing: border-box; '});
conf.defaultStyles.push({key: '.flex-grid-right-panel .button', style: 'display: inline-block; box-sizing: border-box; width: 75px; min-width: 75px; max-width: 75px; height: 25px; min-height: 25px; max-height: 25px; border: 1px solid grey; border-radius: 5px; margin: 5px; text-align: center;'});
conf.defaultStyles.push({key: '.flex-grid-content-right-panel .button', style: 'display: inline-block; box-sizing: border-box; width: 75px; min-width: 75px; max-width: 75px; height: 25px; min-height: 25px; max-height: 25px; border: 1px solid grey; border-radius: 5px; margin: 5px; text-align: center;'});
conf.defaultStyles.push({key: '.flex-grid-bottom-panel .button', style: 'display: inline-block; box-sizing: border-box; width: 75px; min-width: 75px; max-width: 75px; height: 25px; min-height: 25px; max-height: 25px; border: 1px solid grey; border-radius: 5px; margin: 5px; text-align: center;'});

conf.defaultStyles.push({key: '.selected-row', style: 'background-color: rgba(200, 0, 200, .3);'});
conf.defaultStyles.push({key: '.filter-reset-button', style: 'border: 1px solid #fcc; color: red; font-weight: bold;'});
conf.defaultStyles.push({key: '.flex-grid-row .flex-grid-cell.flexGrid_numerableHeader', style: 'text-wrap: nowrap !important;'});
conf.defaultStyles.push({key: ',string-filter-option', style: ''});



const CommonGridStylesManager = new StylesManager(conf);

export {CommonGridStylesManager}
