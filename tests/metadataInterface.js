function MetadataInterface ()
{
    /**
     * @returns {string}
     */
    this.name = () => {
        throw 'Method \'name\' not implemented';
    }
    /**
     * @returns {string}
     */
    this.file = () => {
        throw 'Method \'file\' not implemented';
    }


}

export {MetadataInterface}
