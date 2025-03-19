function StylesManagerInterface()
{
    this.getId = () => {throw 'Method \'getId\' is not implemented';}
    /**
     * @return this
     */
    this.addStyle = (
        /** @type {string} */ selector,
        /** @type {string} */ value,
        /** @type {string|null} */ afterSelector,
        /** @type {string|null} */ context
    ) => {throw 'Method \'addStyle\' is not implemented';}
    /**
     * @return this
     */
    this.setStyle = (
        /** @type {string} */ selector,
        /** @type {string} */ value,
        /** @type {string|null} */ afterSelector,
        /** @type {string|null} */ context
    ) => {throw 'Method \'setStyle\' is not implemented';}

    this.removeStyle = (/** @type {string} */ selector, /** @type {object|array|null} */ keys) => {throw 'Method \'removeStyle\' is not implemented';}

    this.clear = () => {throw 'Method \'clear\' is not implemented';}

    this.update = () => {throw 'Method \'update\' is not implemented';}
}

export {StylesManagerInterface}
