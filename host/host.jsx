// ==============================
// Reference Point Functions
// ==============================

function makeReferencePoint(black, inner) {
    var doc = app.activeDocument;
    doc.fitArtboardToSelectedArt(0);

    var d = 5 * 72 / 25.4;
    var abRect = doc.artboards[0].artboardRect;
    var aX0 = abRect[0], aY0 = abRect[1], aX2 = abRect[2], aY2 = abRect[3];
    var pc0 = [], pc1 = [], pc2 = [], pc3 = [];

    if (inner) {
        pc0 = [aX0, aY0];
        pc1 = [aX2 - d, aY0];
        pc2 = [aX2 - d, aY2 + d];
        pc3 = [aX0, aY2 + d];
    } else {
        pc0 = [aX0 - d, aY0 + d];
        pc1 = [aX2, aY0 + d];
        pc2 = [aX2, aY2];
        pc3 = [aX0 - d, aY2];
    }

    var fill = new RGBColor();
    if (black) {
        fill.red = 0; fill.green = 0; fill.blue = 0;
    } else {
        fill.red = 255; fill.green = 255; fill.blue = 255;
    }
    var noColor = new NoColor();

    [pc0, pc1, pc2, pc3].forEach(function(pos) {
        var c = doc.pathItems.ellipse(0, 0, d, d);
        c.position = pos;
        c.fillColor = fill;
        c.strokeColor = noColor;
    });
}

function fitArtboardToSelectedArt() {
    var doc = app.activeDocument;
    doc.fitArtboardToSelectedArt(0);
}

// ==============================
// Center of Mass Functions
// ==============================

/**
 * Tính center of mass của hình kín và vẽ các đường thẳng đi qua trọng tâm
 */
function drawCenterOfMassLines(A, doc) {
    if (!A || A.length === 0) {
        alert("Không có dữ liệu hình để xử lý");
        return;
    }

    var outerRingIndex = findOuterRing(A);
    var outerRing = A[outerRingIndex];
    var holes = [];

    for (var i = 0; i < A.length; i++) {
        if (i !== outerRingIndex) holes.push(A[i]);
    }

    var centerOfMass = calculateCenterOfMass(outerRing, holes);
    drawCrossLines(centerOfMass, doc);

    return centerOfMass;
}

/**
 * Tìm ring có bounding box lớn nhất (ring ngoài cùng)
 */
function findOuterRing(rings) {
    var maxArea = 0, outerRingIndex = 0;
    for (var i = 0; i < rings.length; i++) {
        var bbox = getRingBoundingBox(rings[i]);
        var area = bbox.width * bbox.height;
        if (area > maxArea) {
            maxArea = area;
            outerRingIndex = i;
        }
    }
    return outerRingIndex;
}

/**
 * Tính bounding box của một ring
 */
function getRingBoundingBox(ring) {
    if (ring.length === 0) return null;
    var left = ring[0][0], right = ring[0][0];
    var top = ring[0][1], bottom = ring[0][1];

    for (var i = 0; i < ring.length; i++) {
        var point = ring[i];
        var points = [
            [point[0], point[1]],
            [point[2], point[3]],
            [point[4], point[5]]
        ];
        for (var j = 0; j < points.length; j++) {
            var x = points[j][0], y = points[j][1];
            if (x < left) left = x;
            if (x > right) right = x;
            if (y > top) top = y;
            if (y < bottom) bottom = y;
        }
    }
    return {
        left: left, top: top, right: right, bottom: bottom,
        width: right - left, height: top - bottom
    };
}

/**
 * Tính center of mass của hình kín có lỗ
 */
function calculateCenterOfMass(outerRing, holes) {
    var outerData = calculateRingCenterOfMass(outerRing);
    var totalArea = outerData.area;
    var totalMomentX = outerData.area * outerData.centroid.x;
    var totalMomentY = outerData.area * outerData.centroid.y;

    for (var i = 0; i < holes.length; i++) {
        var holeData = calculateRingCenterOfMass(holes[i]);
        totalArea -= holeData.area;
        totalMomentX -= holeData.area * holeData.centroid.x;
        totalMomentY -= holeData.area * holeData.centroid.y;
    }

    if (Math.abs(totalArea) < 1e-10) {
        alert("Diện tích tổng bằng 0, không thể tính center of mass");
        return { x: 0, y: 0 };
    }

    return {
        x: totalMomentX / totalArea,
        y: totalMomentY / totalArea
    };
}

/**
 * Tính center of mass của một ring đơn lẻ
 */
function calculateRingCenterOfMass(ring) {
    var n = ring.length;
    if (n < 2) return { area: 0, centroid: { x: 0, y: 0 }, signedArea: 0 };

    var A = 0.0, Sx = 0.0, Sy = 0.0;
    for (var i = 0; i < n; i++) {
        var j = (i + 1) % n;
        var P0 = [ring[i][0], ring[i][1]];
        var P1 = [ring[i][4], ring[i][5]];
        var P2 = [ring[j][2], ring[j][3]];
        var P3 = [ring[j][0], ring[j][1]];
        var seg = integrateBezierSegment(P0, P1, P2, P3);
        A += seg.A;
        Sx += seg.Sx;
        Sy += seg.Sy;
    }

    if (Math.abs(A) < 1e-12) {
        return { area: 0, centroid: { x: 0, y: 0 }, signedArea: A };
    }

    var Cx = Sx / A, Cy = Sy / A;
    return { area: Math.abs(A), centroid: { x: Cx, y: Cy }, signedArea: A };
}

/**
 * Tính diện tích và moment cho một đoạn Bezier
 */
function integrateBezierSegment(P0, P1, P2, P3) {
    var ax = polyCoeff1D(P0[0], P1[0], P2[0], P3[0]);
    var ay = polyCoeff1D(P0[1], P1[1], P2[1], P3[1]);
    var dx = [ax[1], 2 * ax[2], 3 * ax[3]];
    var dy = [ay[1], 2 * ay[2], 3 * ay[3]];

    var fA = polySubtract(polyMultiply(ax, dy), polyMultiply(ay, dx));
    var A = 0.5 * polyIntegral(fA, 0.0, 1.0);

    var x2 = polyMultiply(ax, ax);
    var x2dy = polyMultiply(x2, dy);
    var Sx = 0.5 * polyIntegral(x2dy, 0.0, 1.0);

    var y2 = polyMultiply(ay, ay);
    var y2dx = polyMultiply(y2, dx);
    var Sy = -0.5 * polyIntegral(y2dx, 0.0, 1.0);

    return { A: A, Sx: Sx, Sy: Sy };
}

// Polynomial helpers
function polyCoeff1D(p0, p1, p2, p3) {
    var a0 = p0;
    var a1 = -3 * p0 + 3 * p1;
    var a2 = 3 * p0 - 6 * p1 + 3 * p2;
    var a3 = -p0 + 3 * p1 - 3 * p2 + p3;
    return [a0, a1, a2, a3];
}

function polyMultiply(a, b) {
    var na = a.length, nb = b.length, res = new Array(na + nb - 1);
    for (var k = 0; k < res.length; k++) res[k] = 0.0;
    for (var i = 0; i < na; i++)
        for (var j = 0; j < nb; j++)
            res[i + j] += a[i] * b[j];
    return res;
}

function polySubtract(a, b) {
    var n = Math.max(a.length, b.length), res = new Array(n);
    for (var i = 0; i < n; i++) {
        var ai = (i < a.length) ? a[i] : 0.0;
        var bi = (i < b.length) ? b[i] : 0.0;
        res[i] = ai - bi;
    }
    while (res.length > 1 && Math.abs(res[res.length - 1]) < 1e-20) res.pop();
    return res;
}

function polyIntegral(c, t0, t1) {
    var s = 0.0;
    for (var i = 0; i < c.length; i++) {
        var k = i + 1;
        s += (c[i] / k) * (Math.pow(t1, k) - Math.pow(t0, k));
    }
    return s;
}

/**
 * Vẽ hai đường thẳng đi qua center of mass
 */
function drawCrossLines(centerOfMass, doc) {
    if (!doc) doc = app.activeDocument;
    var artboard = doc.artboards[0];
    var abRect = artboard.artboardRect;
    var left = abRect[0], top = abRect[1], right = abRect[2], bottom = abRect[3];
    var cx = centerOfMass.x, cy = centerOfMass.y;

    var layer;
    try {
        layer = doc.layers.getByName("Center of Mass Lines");
    } catch (e) {
        layer = doc.layers.add();
        layer.name = "Center of Mass Lines";
    }

    // Horizontal line
    var horizontalLine = doc.pathItems.add();
    horizontalLine.move(layer, ElementPlacement.PLACEATBEGINNING);
    horizontalLine.setEntirePath([[left, cy], [right, cy]]);
    horizontalLine.filled = false;
    horizontalLine.stroked = true;
    horizontalLine.strokeWidth = 1;
    horizontalLine.strokeColor = createRGBColor(255, 0, 0);

    // Vertical line
    var verticalLine = doc.pathItems.add();
    verticalLine.move(layer, ElementPlacement.PLACEATBEGINNING);
    verticalLine.setEntirePath([[cx, top], [cx, bottom]]);
    verticalLine.filled = false;
    verticalLine.stroked = true;
    verticalLine.strokeWidth = 1;
    verticalLine.strokeColor = createRGBColor(0, 0, 255);

    // Center point
    var centerPoint = doc.pathItems.ellipse(cy + 2, cx - 2, 4, 4);
    centerPoint.move(layer, ElementPlacement.PLACEATBEGINNING);
    centerPoint.filled = true;
    centerPoint.fillColor = createRGBColor(0, 255, 0);
    centerPoint.stroked = false;
}

/**
 * Tạo màu RGB
 */
function createRGBColor(r, g, b) {
    var color = new RGBColor();
    color.red = r;
    color.green = g;
    color.blue = b;
    return color;
}

// ==============================
// Polygon Selection & Parsing
// ==============================

function getSelectedPolygon() {
    var polygons = [];
    var sel = app.activeDocument.selection;
    var l = sel.length;

    for (var i = 0; i < l; ++i) {
        var p = sel[i];
        if (p.typename === 'CompoundPathItem') {
            var polygon = [];
            for (var j = 0; j < p.pathItems.length; ++j) {
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

function drawCenterOfGravity() {
    var polygons = getSelectedPolygon();
    for (var i = 0; i < polygons.length; ++i) {
        drawCenterOfMassLines(polygons[i], app.activeDocument);
    }
}

/**
 * Trích xuất toạ độ anchor + control points
 */
function parsePathItem(pItem) {
    var ring = [];
    var l = pItem.pathPoints.length;
    if (l < 3) {
        alert("Path contains at least 3 points.");
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

// ==============================
// Slice Image Functions
// ==============================

function sliceImage() {
    var doc = app.activeDocument;
    var rasterItems = doc.rasterItems;
    if (rasterItems.length === 0) {
        alert("No raster image found in the document.");
        return;
    }
    var raster = null;
    for (var i = 0; i < rasterItems.length; i++) {
        if (rasterItems[i].selected) {
            raster = rasterItems[i];
            break;
        }
    }
    if (raster == null) {
        alert("Please select a raster image along with paths.");
        return;
    }

    var paths = doc.selection;
    if (paths.length === 0) {
        alert("No path found in the selection.");
        return;
    }

    var newLayer = doc.layers.add();
    newLayer.name = "Clipped Results";

    for (var i = 0; i < paths.length; i++) {
        var path = paths[i];
        

        if (path.typename === "PathItem" && path.parent.typename !== "CompoundPathItem") {
            var group = newLayer.groupItems.add();

            var dupRaster = raster.duplicate(group, ElementPlacement.PLACEATBEGINNING);
            var dupPath = path.duplicate(group, ElementPlacement.PLACEATBEGINNING);

            dupPath.clipping = true;
            group.clipped = true;
        } else if (path.typename === "CompoundPathItem") {
            var group = newLayer.groupItems.add();

            var dupRaster = raster.duplicate(group, ElementPlacement.PLACEATBEGINNING);
            var dupPath = path.duplicate(group, ElementPlacement.PLACEATBEGINNING);

            var dummy = group.pathItems.add();
            dummy.move(group, ElementPlacement.PLACEATBEGINNING);
            group.clipped = true;
            dummy.remove();
            if (dupPath.pathItems.length > 0) {
                dupPath.pathItems[0].clipping = true;
            }
        }
    }
}
