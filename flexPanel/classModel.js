const ClassModel = Object.defineProperties(
    Object.create(null),
    {
        PanelItem: {
            get: () =>  'panel-item',
            configurable: false,
            enumerable: false,
        },
        OnlyVerticalItem: {
            get: () => 'only-vertical-panel-item',
            configurable: false,
            enumerable: false
        },
        OnlyHorizontalItem: {
            get: () => 'only-horizontal-panel-item',
            configurable: false,
            enumerable: false
        },
    }
);

export {ClassModel}
