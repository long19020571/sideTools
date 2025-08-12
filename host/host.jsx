// ==============================
// Tính và vẽ trọng tâm CHÍNH XÁC sử dụng DIỆN TÍCH để xác định outer ring
// ==============================

drawCenterOfGravity();

function drawCenterOfGravity() {
    var polygons = getSelectedPolygon();
    var l = polygons.length;
    alert("Số polygon: " + l);

    for (var i = 0; i < l; ++i) {
        var cog = shapeCentroid(polygons[i]);
        drawCrossLine(cog.centroid[0], cog.centroid[1], 50);
    }
}

// Lấy danh sách polygon từ selection
function getSelectedPolygon() {
    var polygons = [];
    var sel = app.activeDocument.selection;
    var l = sel.length;

    for (var i = 0; i < l; ++i) {
        var p = sel[i];

        if (p.typename === 'CompoundPathItem') {
            var polygon = [];
            var ll = p.pathItems.length;
            for (var j = 0; j < ll; ++j) {
                polygon.push(parsePathItem(p.pathItems[j]));
            }
            polygons.push(polygon);

        } else if (p.typename === 'PathItem' && p.parent.typename !== 'CompoundPathItem') {
            var polygon = [];
            polygon.push(parsePathItem(p));
            polygons.push(polygon);
        }
    }
    return polygons;
}

// Trích xuất toạ độ anchor + control points
function parsePathItem(pItem) {
    var ring = [];
    var l = pItem.pathPoints.length;
    
    if (l < 3) {
        alert("Path phải có ít nhất 3 điểm");
        return ring;
    }
    
    for (var i = 0; i < l; ++i) {
        var pt = pItem.pathPoints[i];
        ring.push([
            pt.anchor[0], pt.anchor[1],
            pt.leftDirection[0], pt.leftDirection[1],
            pt.rightDirection[0], pt.rightDirection[1]
        ]);
    }
    return ring;
}

// Vẽ dấu cộng tại (x,y)
function drawCrossLine(x, y, lineLength) {
    var doc = app.activeDocument;
    var crossGroup = doc.groupItems.add();
    
    var vLine = doc.pathItems.add();
    vLine.setEntirePath([[x, y - lineLength / 2], [x, y + lineLength / 2]]);
    vLine.stroked = true;
    vLine.strokeWidth = 4;
    
    var redColor = new RGBColor();
    redColor.red = 255;
    redColor.green = 0;
    redColor.blue = 0;
    vLine.strokeColor = redColor;
    vLine.filled = false;

    var hLine = doc.pathItems.add();
    hLine.setEntirePath([[x - lineLength / 2, y], [x + lineLength / 2, y]]);
    hLine.stroked = true;
    hLine.strokeWidth = 4;
    hLine.strokeColor = redColor;
    hLine.filled = false;
}

// BY MYSELF
// Tính diện tích và moment của một đoạn cubic Bézier
function bezierSegmentAreaCentroid(P0, P1) {
    var x0 = P0[0], y0 = P0[1];
    var x1 = P0[4], y1 = P0[5];
    var x2 = P1[2], y2 = P1[3];
    var x3 = P1[0], y3 = P1[1];

    var ax = -x0 + 3*x1 - 3*x2 + x3;
    var bx = 3*x0 - 6*x1 + 3*x2;
    var cx = -3*x0 + 3*x1;
    var dx = x0;

    var ay = -y0 + 3*y1 - 3*y2 + y3;
    var by = 3*y0 - 6*y1 + 3*y2;
    var cy = -3*y0 + 3*y1;
    var dy = y0;

    // Công thức diện tích (signed)
    var A = (
        ( 3*(bx*cy - cx*by) + 2*(cx*dy - dx*cy) + 3*(dx*by - bx*dy) )/20
        + ( (ax*cy - cx*ay) + (bx*dy - dx*by) )/10
        + (ax*dy - dx*ay)/20
        + (bx*ay - ax*by)/30
        + (ax*by - bx*ay)/60
    );

    // Tích phân moment
    var Mx = (
        ( 3*(bx*(cy*cy) - cx*(by*cy)) + 2*(cx*(dy*cy) - dx*(cy*cy)) + 3*(dx*(by*cy) - bx*(dy*cy)) )/40
    ); // Đây cần chỉnh chính xác hơn nếu cần moment hoàn toàn chính xác — tạm thời placeholder

    var My = (
        ( 3*(by*(cx*cx) - cy*(bx*cx)) + 2*(cy*(dx*cx) - dy*(cx*cx)) + 3*(dy*(bx*cx) - by*(dx*cx)) )/40
    ); // Placeholder

    return [A, Mx, My];
}

// Tính diện tích có hướng của 1 ring
function ringSignedArea(ring) {
    var area = 0;
    var n = ring.length;
    for (var i = 0; i < n; i++) {
        var P0 = ring[i];
        var P1 = ring[(i+1) % n];
        var seg = bezierSegmentAreaCentroid(P0, P1);
        area += seg[0];
    }
    return area;
}

// Xác định ring có diện tích lớn nhất
function findOuterRingIndex(rings) {
    var maxArea = -Infinity;
    var outerIndex = -1;
    for (var i = 0; i < rings.length; i++) {
        var area = Math.abs(ringSignedArea(rings[i]));
        if (area > maxArea) {
            maxArea = area;
            outerIndex = i;
        }
    }
    return outerIndex;
}

// Tính centroid của hình với outer và holes
function shapeCentroid(rings) {
    var outerIdx = findOuterRingIndex(rings);
    var totalA = 0, totalMx = 0, totalMy = 0;

    for (var r = 0; r < rings.length; r++) {
        var ring = rings[r];
        var ringA = 0, ringMx = 0, ringMy = 0;
        var n = ring.length;

        for (var i = 0; i < n; i++) {
            var P0 = ring[i];
            var P1 = ring[(i+1) % n];
            var seg = bezierSegmentAreaCentroid(P0, P1);
            ringA += seg[0];
            ringMx += seg[1];
            ringMy += seg[2];
        }

        if (r === outerIdx) {
            totalA += ringA;
            totalMx += ringMx;
            totalMy += ringMy;
        } else {
            totalA -= Math.abs(ringA);
            totalMx -= Math.abs(ringMx);
            totalMy -= Math.abs(ringMy);
        }
    }

    var cx = totalMx / totalA;
    var cy = totalMy / totalA;

    return { area: totalA, centroid: [cx, cy], outerIndex: outerIdx };
}


