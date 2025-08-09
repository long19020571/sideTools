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
function drawCrossLine(x, y, lineLength) {
    var doc = app.activeDocument;
    var verticalLine = doc.pathItems.add();
    verticalLine.setEntirePath([[x, y - lineLength/2], [x, y + lineLength/2]]);
    verticalLine.stroked = true;
    verticalLine.strokeWidth = 1;
    verticalLine.filled = false;

    // Đường ngang song song trục hoành (qua y)
    var horizontalLine = doc.pathItems.add();
    horizontalLine.setEntirePath([[x - lineLength/2, y], [x + lineLength/2, y]]);
    horizontalLine.stroked = true;
    horizontalLine.strokeWidth = 1;
    horizontalLine.filled = false;
}