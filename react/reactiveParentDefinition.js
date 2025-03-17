
function ReactiveParentDefinition(/**@type {Object} */parent)
{
    let priv = {
        properties: {
            d: {},
            r: {}
        },
        //В случае с прямыми ссылками значение parent извлекается не из этого поля, а из поля редактируемой сущности.
        //Поэтому тут вполне может быть null
        parent: parent ? new WeakRef(parent) : null,
    };

    this.getParent = () => priv.parent ? priv.parent.deref() : null;
    /**
     * Тип ссылки на родителя:
     * - d - direct - прямая ссылка, т.е. дочерний элемент содержит ссылку на родителя (child.parentField = parent).
     *          При этом родитель может не иметь ссылки на дочерний элемент
     * - r - reverse - обратная ссылка, т.е. родитель содержит ссылку на дочерний элемент, но дочерний элемент не имеет ссылки на родителя (parent.someProp = {childProp1: childVal1, ...})
     */
    this.addField = function(/**@type {string} */ propName, /**@type {string} */type = 'd') {
        priv.properties[type][propName] = true;

        return this;
    }

    this.merge = function(/**@type {ReactiveParentDefinition} */ source){
        for (let propName in source.getDirectProperties()) {
            priv.properties.d[propName] = true;
        }
        for (let propName in source.getReverseProperties()) {
            priv.properties.r[propName] = true;
        }
    }

    this.getDirectProperties = () => priv.properties.d;
    this.getReverseProperties = () => priv.properties.r;
    this.hasDirectProperties = () => {for (let propName in priv.properties.d) {return true;} return false;};
    this.hasReverseProperties = () => {for (let propName in priv.properties.r) {return true;} return false;};
    this.deleteReverseProperty = function (/** @type {string} */ propName)
    {
        delete priv.properties.r[propName];

        return this;
    }
    this.deleteDirectProperty = function (/** @type {string} */ propName)
    {
        delete priv.properties.d[propName];

        return this;
    }


}

export {ReactiveParentDefinition}
