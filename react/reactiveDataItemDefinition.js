
function ReactiveDataItemDefinition(/**@type {Object} */dataItem)
{
    let priv = {
        dataItem,
        parentDefinitions: [],
    };

    this.getDataItem = () => priv.dataItem;
    this.getParentDefinitions = () => priv.parentDefinitions;
    this.addParentDefinition = function( /**@type {ReactiveParentDefinition} */parentDefinition){
        let existsDefinition = priv.parentDefinitions.find((/**@type {ReactiveParentDefinition} */ source) => source.getParent() === parentDefinition.getParent());
        existsDefinition ?
            existsDefinition.merge(parentDefinition) :
            priv.parentDefinitions.push(parentDefinition);
        return this; //TODO Может возвращать не this, а merged or pushed?
    }
}

export {ReactiveDataItemDefinition}
