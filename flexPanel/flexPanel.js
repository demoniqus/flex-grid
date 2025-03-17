import {ClassModel} from "./classModel.js";
import {Scroller} from "../scroller/scroller.js";

function FlexPanel(priv) {
    this.setStyle = function(propName, propValue){
        this.DOM.panel.style[propName] = propValue;
    }.bind(priv);

    this.addItem = function (key, item){

        if (key in this.items) {
            this.items[key].parentElement.removeChild(this.items[key]);
        }
        this.items[key] = item;
        this.DOM.panel.appendChild(item);
        item.classList.add(ClassModel.PanelItem);
        this.setPanelItemAsDraggable(item);
    }.bind(priv);

    this.setScrollable = function(){
        let div = document.createElement('div')
        div.classList.add('panel-scroll-wrapper')
        div.classList.add('flex-grid-panel')
        div.classList.add('flex-grid-nowrapped-panel')
        div.classList.add('flex-grid-vertical-panel')
        let options = [];
        while (this.DOM.panel.children.length) {
            let panelItem = this.DOM.panel.children[0]
            div.appendChild(panelItem);
            options.push(panelItem)
        }
        this.DOM.panel.appendChild(div)


        let scroller = new Scroller(
            {
                firstIndex:0,
                itemsCount: options.length,
                DOM: {
                    container: this.DOM.panel,
                    scrolledItemsContainer: div,
                },
                getElement: function (index) {
                    return options[index];
                },
                name: 'Panel'
            }
        );
        // let scroller = new Scroller(
        //     {
        //         firstIndex:0,
        //         itemsCount: () => div.children.length,
        //         DOM: {
        //             container: this.DOM.panel,
        //             scrolledItemsContainer: div,
        //         },
        //         getElement: (index) => div.children[index]
        //     }
        // );

        scroller.reload();

        // scroller.reload();
    }.bind(priv);

    this.addItemAfter = function (key, item, after){
        //TODO Если after - число, то
        if (key in this.items) {
            this.items[key].parentElement.removeChild(this.items[key]);
        }
        this.items[key] = item;
        this.DOM.panel.appendChild(item);
    }.bind(priv)

    this.addItemBefore = function (key, item, before){
        //TODO Можно добавить after, before
        if (key in this.items) {
            this.items[key].parentElement.removeChild(this.items[key]);
        }
        this.items[key] = item;
        this.DOM.panel.appendChild(item);
    }.bind(priv);

    this.addItemBefore = function (key, item, /** @type {number} */ position){
        //TODO Вставка в позицию №position
        if (key in this.items) {
            this.items[key].parentElement.removeChild(this.items[key]);
        }
        this.items[key] = item;
        this.DOM.panel.appendChild(item);
    }.bind(priv);

    this.removeItem = function (key, item){
        if (key in this.items) {
            this.items[key].parentElement.removeChild(this.items[key]);
        }
    }.bind(priv);

    this.draggable = function(/** @type {boolean} */ flag){
        //Можно ли перемещать панель
    };

    this.droppable = function(/** @type {boolean} */ flag){
        //Может ли панель принимать другие панели после себя
    };
}

export {FlexPanel}
