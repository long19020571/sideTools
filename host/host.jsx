function getSelectedPolygon() {
    var polygons = [];
    var l = app.activeDocument.selection.length;
    for(var i = 0; i < l; ++i) {
        var p = app.activeDocument.selection[i];
        if(p.typename == 'CompoundPathItem') {
            var polygon = [];
            var ll = p.pathItems.length;
            for(var j = 0; j < ll; ++j) {
                polygon.push(parsePathItem(p));
            }
            polygons.push(polygon);
        } else if(p.typename == 'PathItem' && p.parent.typename != 'CompoundPathItem') {
            var polygon = [];
            polygons.push(polygon.push(parsePathItem(p)));
        }
    }
}
function parsePathItem(pItem) {
    var ring = [];
    var l = pItem.pathPoints.length;
    for(var i = 0; i < l; ++i) {
        var p = pItem.pathPoints[i];
        ring.push([p.anchor[0], p.anchor[1], p.leftDirection[0], p.leftDirection[1], p.rightDirection[0], p.rightDirection[1]]);
    }
    return ring;
}