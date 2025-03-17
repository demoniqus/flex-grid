function FlexGridInterface()
{
    this.build = function(){

        throw 'Method \'build\' is not implemented';
    };

    this.addVisualizationComponent = function(/** @type {string} */alias, /** @type {standardVisualComponents.FlexGridDataVisualizationComponentInterface} */component){
        throw 'Method \'addVisualizationComponent\' is not implemented';
    };

    this.addFilterComponent = function(/** @type {string} */alias, /** @type {filter.FlexGridDataFilterComponentInterface} */component){
        throw 'Method \'addFilterComponent\' is not implemented';
    };

    this.getVisualizationComponent = function(/** @type {string} */alias){
        throw 'Method \'getVisualizationComponent\' is not implemented';
    };

    this.getFilterComponent = function(/** @type {string} */alias){
        throw 'Method \'getFilterComponent\' is not implemented';
    };

    this.updatePreview = function(){
        throw 'Method \'updatePreview\' is not implemented';
    };

    this.destroy = function(){
        throw 'Method \'destroy\' is not implemented';

    };

    this.getId = function(){
        throw 'Method \'getId\' is not implemented';
    };

    this.getContainer = () => {
        throw 'Method \'getContainer\' not implemented'
    };
}

function FlatGridInterface()
{

}


function TreeGridInterface()
{

}

FlatGridInterface.prototype = TreeGridInterface.prototype = new FlexGridInterface();

export {FlexGridInterface, FlatGridInterface, TreeGridInterface}
