// Preview-host переносимого пакета. Не является частью продуктовой логики шахматки.
(function (window, document) {
    'use strict';

    const DEFAULT_CONTEXT = Object.freeze({
        type: 'project',
        id: 'proj-nova',
        projectId: 'proj-nova',
        name: 'Nova'
    });

    let mounted = false;

    function getConfiguredContext() {
        const configuredContext = window.DigitalChessboardTransferConfig?.context;
        return configuredContext && typeof configuredContext === 'object'
            ? configuredContext
            : DEFAULT_CONTEXT;
    }

    function mount() {
        if (mounted) return;
        const root = document.getElementById('digital-chessboard-root');
        if (!root) throw new Error('Digital chessboard transfer host: mount root is missing.');
        if (!window.SCenterDigitalChessboard) throw new Error('Digital chessboard feature is not loaded.');

        window.SCenterDigitalChessboard.mount(root, { context: getConfiguredContext() });
        mounted = true;
    }

    function setContext(context) {
        if (!mounted) mount();
        window.SCenterDigitalChessboard.setContext(context);
    }

    function destroy() {
        if (!mounted) return;
        window.SCenterDigitalChessboard.destroy();
        mounted = false;
    }

    window.DigitalChessboardTransferHost = Object.freeze({ mount, setContext, destroy });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount, { once: true });
    } else {
        mount();
    }
})(window, document);
