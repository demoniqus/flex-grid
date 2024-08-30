(function(){
    let pluginIds = {};

    window.FlexPanel = Object.defineProperties(
        Object.create(null),
        {
            Panel: {
                get: function(){return Panel;},
                configurable: false,
                enumerable: false,
            }
        }
    );

    function abstractPanel() {
        this.items = {},
        this.config = {};
        this.DOM = {
            panel: undefined,
        };
        this.pub = undefined;

        this.setConfig = function(config){
            let collection;
            let defConfig = this.getDefaultConfig();
            config = Object.assign(defConfig, config);
            this.config = config;

            this.DOM.panel =
                typeof config.panel === typeof 'aaa' ?
                    document.getElementById(config.panel) || ((collection = document.getElementsByClassName(config.panel)) ? collection[0] : null) || document.querySelector(config.panel) :
                    config.panel
            ;

        };

        this.init = function(){
            this.setPanelAsDroppable();
        };

        this.specificConfigValidation = function(){
            return [];
        };

        this.validateConfig = function(config){
            let errors = [];

            if (
                !config ||
                typeof config !== typeof {}
            ) {
                return ['empty config'];
            }

            if (
                !config.container ||
                //Селектор
                typeof config.container !== typeof 'aaa' &&
                //DOM-элемент
                (
                    typeof config.container !== typeof {} ||
                    config.container.nodeType !== Node.ELEMENT_NODE
                )
            ) {

                errors.push('Incorrect panel container');
            }



            errors = errors.splice(0, 0, ...this.specificConfigValidation(config));

            return errors.length ? errors : null;
        };

        this.setPanelAsDroppable = function(){
            window.dragger.initAcceptor(
                {
                    acceptorElement: this.DOM.panel,
                    onDrop: function(drawElement, acceptorElement){
                        if (!drawElement.classList.contains(ClassModel.PanelItem)) {
                            //Не принимаем прочие элементы, которые может сюда перетащить пользователь.
                            // Можно даже выбрасывать сообщение, но проще не реагировать на неверные действия
                            return;
                        }

                        if (
                            drawElement.classList.contains(ClassModel.OnlyVerticalItem) &&
                            this.config.orientation === OrientationModel.Horizontal ||
                            drawElement.classList.contains(ClassModel.OnlyHorizontalItem) &&
                            this.config.orientation === OrientationModel.Vertical
                        ) {
                            alert(
                                'Элемент панели не имеет представления для ' +
                                (
                                    this.config.orientation === OrientationModel.Horizontal ?
                                        'горизонтальной' :
                                        'вертикальной'
                                ) +
                                ' ориентации'
                            );
                            return;
                        }
                        acceptorElement.appendChild(drawElement);
                    }
                }
            );
        };

        this.setPanelItemAsDraggable = function(panelItem)
        {
            window.dragger
                .initDraw(
                    {
                        drawElement: panelItem
                    }
                )
                .initAcceptor(
                    {
                        acceptorElement: panelItem,
                        onDrop: function(drawElement, acceptorElement){
                            if (!drawElement.classList.contains(ClassModel.PanelItem)) {
                                //Не принимаем прочие элементы, которые может сюда перетащить пользователь.
                                // Можно даже выбрасывать сообщение, но проще не реагировать на неверные действия
                                return;
                            }

                            if (
                                drawElement.classList.contains(ClassModel.OnlyVerticalItem) &&
                                priv.config.orientation === OrientationModel.Horizontal ||
                                drawElement.classList.contains(ClassModel.OnlyHorizontalItem) &&
                                priv.config.orientation === OrientationModel.Vertical
                            ) {
                                alert(
                                    'Элемент панели не имеет представления для ' +
                                    (
                                        priv.config.orientation === OrientationModel.Horizontal ?
                                            'горизонтальной' :
                                            'вертикальной'
                                    ) +
                                    ' ориентации'
                                );
                                return;
                            }
                            let acceptorPanel = priv.DOM.panel;
                            acceptorPanel.insertBefore(drawElement, acceptorElement);
                        }
                    }
                )
        };
    }

    function pubPanel(priv) {
        this.setStyle = function(propName, propValue){
            this.DOM.panel.style[propName] = propValue;
        }.bind(priv);

        this.addItem = function (key, item){

            if (key in this.items) {
                this.items[key].parentElement.removeChild(this.items[key]);
            }
            this.items[key] = item;
            this.DOM.panel.appendChild(item);
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
            //TODO Можно доавить after, before
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

    function Panel(config){
        let priv = new abstractPanel();
        let pub = new pubPanel(priv);
        priv.pub = pub;

        if (errors = priv.validateConfig(config)) {
            throw 'Incorrect config: ' + errors.join('; ');
        }

        priv.setConfig(config);
        priv.init();


        return pub;

    };

    abstractPanel.prototype = new (function(){
        this.getDefaultConfig = function(){
            return {
                _panel: 'DOM-элемент.',
                panel: undefined,
            };
        };
    })();
})()