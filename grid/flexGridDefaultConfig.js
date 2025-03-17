
function FlexGridDefaultConfig()
{
    return {
        __headerFormat: {
            _id: 'Идентификатор заголовка',
            id: 'string',
            _title: 'Наименование заголовка',
            title: '?string',
            _type: 'Наименование пользовательского или предопределенного типа компонента(-ов)',
            type: 'string|object{entityClass : string}',
            _width: 'Ширина заголовка. Указывается только для листовых заголовков',
            width: 'int',
            _children: 'Дочерние заголовки',
            children: '?array',
            _isVirtual: 'Виртуальный заголовок. Используется для заполнения пустых ячеек в иерархических заголовках',
            isVirtual: '?bool',
            filterable: '?bool',
            sortable: '?bool',
            draggable: '?bool',
        },
        _id: 'Пользовательский идентификатор FlexGrid\'а для организации взаимодействия между таблицами',
        id: null,
        _container: 'Контейнер для размещения flexGrid',
        container: undefined,
        _entityClassField: 'Наименование поля с указанием класса сущности',
        entityClassField: 'entityClass',
        _entityIdField: 'Наименование поля с указанием id сущности',
        entityIdField: 'id',
        _entityParentField: 'Наименование поля с указанием родителя сущности',
        entityParentField: 'parent',
        _entityChildrenField: 'Наименование поля с указанием коллекции дочерних элементов',
        entityChildrenField: 'children',
        _treeMaxVisualDepth: 'Максимальная визуальная глубина дерева. Элементы с бОльшим уровнем вложенности не будут смещаться сильнее',
        treeMaxVisualDepth: 5,
        _treeLvlPadding: 'Отступ в пикселях на каждый уровень вложенности',
        treeLvlPadding: 10,
        _draggableColumns: 'Возможно перетаскивание колонок',
        draggableColumns: false,
        _draggableRows: 'Возможно перетаскивание строк',
        draggableRows: false,
        _numerable: 'Колонка с нумерацией строк',
        numerable: true,
        _filterable: 'Локальный фильтр данных',
        filterable: true,
        _visualizer: 'Пользовательский компонент визуализации данных. Должен реализовывать интерфейс DefaultVisualizer.VisualizerInterface',
        visualizer: null,
        _dataProvider: 'Пользовательский компонент передачи данных. Должен реализовывать интерфейс FlexGrid.DataProviderInterface',
        dataProvider: null,
        _events: {
            moveItem: function(acceptorItem, draggedItem, acceptorFlexGridCustomId, sourceFlexGridCustomId){
                try {
                    console.log(
                        `
                        Событие перетаскивания строки грида. На вход принимает аргументы:
                        acceptorItem - принимающий объект данных,
                        draggedItem - перемещаемый объект данных,
                        acceptorFlexGridCustomId - пользовательский идентификатор принимающего грида,
                        sourceFlexGridCustomId - пользовательский идентификатор грида-источника
                         `
                    )
                } catch (e) {

                }
                if (
                    acceptorFlexGridCustomId.gridClass !== sourceFlexGridCustomId.gridClass ||
                    acceptorFlexGridCustomId.id !== sourceFlexGridCustomId.id
                ) {
                    // Из других grid'ов не принимаем строки
                    return;
                }
                try {
                    console.log('element ' + acceptorItem.id + ' accept element ' + draggedItem.id);
                } catch (e) {

                }

            },
            dataAccepted: function(flexGridCustomId){
                try {
                    console.log(
                        `
                        Событие получения всех необходимых для построения грида данных. На вход принимает аргументы:
                        flexGridCustomId - пользовательский идентификатор грида
                         `
                    )
                } catch (e) {

                }
            },
            headersCompleted: function(flexGridCustomId){
                try {
                    console.log(
                        `
                        Событие отрисовки заголовков грида. На вход принимает аргументы:
                        flexGridCustomId - пользовательский идентификатор грида
                         `
                    )
                } catch (e) {

                }
            },
            completed: function(flexGridCustomId){
                try {
                    console.log(
                        `
                        Событие полной загрузки грида. На вход принимает аргументы:
                        flexGridCustomId - пользовательский идентификатор грида
                         `
                    )
                } catch (e) {

                }
            },
            childItemChanged: function(eventObj){
                try {
                    console.log(
                        `
                        Событие изменения дочернего элемента. На вход принимает аргументы:
                        eventObj - параметры события
                        this - текущий родительский элемент
                        childElement - дочерний элемент - источник события
                        flexGridId - грид, в котором произошло событие
                         `
                    )
                } catch (e) {

                }
            },
            beforeItemChange: function(eventObj){
                try {
                    console.log(
                        `
                        Событие перед изменением элемента данных. На вход принимает аргументы:
                        eventObj - параметры события
                        this - текущий родительский элемент
                        childElement - дочерний элемент - источник события
                        flexGridId - грид, в котором произошло событие
                         `
                    )
                } catch (e) {

                }
            },
            beforeChildItemChange: function(eventObj){
                try {
                    console.log(
                        `
                        Событие перед изменением дочернего элемента данных. На вход принимает аргументы:
                        eventObj - параметры события
                        this - текущий родительский элемент
                        childElement - дочерний элемент - источник события
                        flexGridId - грид, в котором произошло событие
                         `
                    )
                } catch (e) {

                }
            },
            itemChanged: function(eventObj){
                try {
                    console.log(
                        `
                        Событие изменения элемента данных. На вход принимает аргументы:
                        eventObj - параметры события
                        this - текущий родительский элемент
                        childElement - дочерний элемент - источник события
                        flexGridId - грид, в котором произошло событие
                         `
                    )
                } catch (e) {

                }
            },
        },
        events: null
    };
}

export {FlexGridDefaultConfig}
