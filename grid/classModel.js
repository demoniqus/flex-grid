const ClassModel = Object.defineProperties(
    Object.create(null),
    {
        SelectedRow: {
            get: () => 'selected-row',
            configurable: false,
            enumerable: false,
        }
    }
)

export {ClassModel}
