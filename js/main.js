// CEP Extension Main JavaScript
(function() {
    'use strict';
    var csInterface = new CSInterface();
    
    // Initialize when DOM is loaded
    function init() {
        setupEventListeners();
        updateTheme();
    }
    
    function setupEventListeners() {
        // Shape creation buttons
        document.getElementById('createCircle').addEventListener('click', function() {
            createShape('circle');
        });
        
        document.getElementById('createSquare').addEventListener('click', function() {
            createShape('square');
        });
        
        
        // Color palette
        var colorBoxes = document.querySelectorAll('.color-box');
        colorBoxes.forEach(function(box) {
            box.addEventListener('click', function() {
                var color = this.getAttribute('data-color');
                applyColor(color);
                
                // Visual feedback
                colorBoxes.forEach(function(b) { b.classList.remove('selected'); });
                this.classList.add('selected');
            });
        });
        
        // Utility functions
        document.getElementById('deleteSelected').addEventListener('click', function() {
            executeExtendScript('deleteSelectedItems()');
        });
        
        document.getElementById('duplicateSelected').addEventListener('click', function() {
            executeExtendScript('duplicateSelectedItems()');
        });
        
        // Document info
        document.getElementById('getDocInfo').addEventListener('click', function() {
            getDocumentInfo();
        });
    }
    function integralCubicBezier(P0, P3) {

    }
    function centerOfGravity(polygons) {
        
    }
    /*
    {

    }
    */

    
})();