import {OrientationModel} from "./orientationModel.js";
import {Dragger} from "../dragger/dragger.js";
import {ClassModel} from "./classModel.js";



let pluginIds = {};
let draggedPanelItem = undefined;
/**
 * TODO Не факт, что панельки допустимо перемещать - тут и вопрос с их возвратом обратно на пустое место, и со сменой ориентации (горизонт- вертикаль) и пр.
 *   Если на панели не осталось кнопок, она автоматически может скрываться. А в отдельном окне настроек ей можно вернуть кнопки и она опять встанет на свое место.
 *   Там же в окне настроек можно придумать, как вернуть ее на дефолтное место.
 *   А можно по типу PhpStorm при начале перемещения панельки открывать визуализацию контейнеров-приёмников
 */
let draggedPanel = undefined;


function AbstractPanel() {
    this.items = {};
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

        if (
            !config.orientation ||
            ! (
                config.orientation === OrientationModel.Horizontal ||
                config.orientation === OrientationModel.Vertical
            )
        ) {
            errors.push('Incorrect panel orientation');
        }

        errors = errors.splice(0, 0, ...this.specificConfigValidation(config));

        return errors.length ? errors : null;
    };

    this.setPanelAsDroppable = function(){
        Dragger.initAcceptor(
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
        Dragger
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


AbstractPanel.prototype = new (function(){
    this.getDefaultConfig = function(){
        return {
            _panel: 'DOM-элемент.',
            panel: undefined,
            _orientation: 'vertical | horizontal',
            orientation: undefined
        };
    };
})();

export {AbstractPanel}
