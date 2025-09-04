// CEP Extension Main JavaScript
(function() {
    'use strict';
    var csInterface = new CSInterface();
    csInterface.evalScript('$.evalFile("' +
    csInterface.getSystemPath(SystemPath.EXTENSION) + '/host/host.jsx")');
    init();
    // Initialize when DOM is loaded
    function init() {
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Shape creation buttons
        document.getElementById('makeRefPoint').addEventListener('click', function() {
            var black = document.getElementById('isBlack').checked,
                inner = document.getElementById('innerArt').checked;
            csInterface.evalScript(`makeReferencePoint(${black}, ${inner})`);

        });
        document.getElementById('fitArtboardToSelectedArt').addEventListener('click', function() {
            csInterface.evalScript(`fitArtboardToSelectedArt()`);
        });
        document.getElementById('centerOfMass').addEventListener('click', function() {
            csInterface.evalScript(`drawCenterOfGravity()`);
        });

        document.getElementById('sliceImage').addEventListener('click', function() {
            csInterface.evalScript(`sliceImage()`);
        });

    }
})();