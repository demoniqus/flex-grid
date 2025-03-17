

let ClassModel = Object.defineProperties(
    Object.create(null),
    {
        RootScrolledContainer: {
            get: () => 'root-scrolled-container',
            configurable: false,
            enumerable: false
        },
        ScrolledDataContainer: {
            get: () => 'scrolled-data-container',
            configurable: false,
            enumerable: false
        },
        NoScrollbar: {
            get: () => 'no-scrollbar',
            configurable: false,
            enumerable: false
        },
        ScrolledItemsContainer: {
            get: () => 'scrolled-items-container',
            configurable: false,
            enumerable: false
        },
        ScrollerWrapper: {
            get: () => 'scroller-wrapper',
            configurable: false,
            enumerable: false
        },
        ScrollerScrollbarContainer: {
            get: () => 'scroller-scrollbar-container',
            configurable: false,
            enumerable: false
        },
        ScrollerScrollbar: {
            get: () => 'scroller-scrollbar',
            configurable: false,
            enumerable: false
        },
        ScrollerDataContainer: {
            get: () => 'scroller-data-container',
            configurable: false,
            enumerable: false
        },
        ModeScroll: {
            get: () => 'mode-scroll',
            configurable: false,
            enumerable: false
        },
        Transparent: {
            get: () => 'transparent',
            configurable: false,
            enumerable: false
        },
    }
);

export {ClassModel}
