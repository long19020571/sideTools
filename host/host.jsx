// ==============================
// Tính và vẽ trọng tâm CHÍNH XÁC sử dụng DIỆN TÍCH để xác định outer ring
// ==============================

drawCenterOfGravity();

function drawCenterOfGravity() {
    var polygons = getSelectedPolygon();
    var l = polygons.length;
    alert("Số polygon: " + l);

    for (var i = 0; i < l; ++i) {
        var cog = calculateBezierShapeCenterOfMass(polygons[i]);
        drawCrossLine(cog.x, cog.y, 50);
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

// final
// function calculateBezierArea(P1,P3) {

//     // Lấy tọa độ x, y từ các điểm
//     const [x0, y0] = [P1[0], P1[1]];
//     const [x1, y1] = [P1[4], P1[5]];
//     const [x2, y2] = [P3[2], P3[3]];
//     const [x3, y3] = [P3[0], P3[1]];

//     // Tính các thành phần của biểu thức diện tích
//     const term1 = (x1 - x0) * (y0 + 3 * y1 + y2);
//     const term2 = (x2 - x1) * (y0 + 4 * y1 + 4 * y2 + y3);
//     const term3 = (x3 - x2) * (y1 + 3 * y2 + y3);

//     // Tính diện tích theo công thức
//     const area = (1 / 20) * (term1 + term2 + term3);

//     return area;
// }
function calculateBezierShapeCenterOfMass(shape) {
    if (!shape || shape.length === 0) {
        throw "Cần ít nhất một ring.";
    }

    // Bảng integrals cho moment (integrate B_j B_m C_k dt)
    var integrals = [
        [ // j=0
            [1/9, 1/36, 1/252], 
            [1/24, 1/42, 1/168], 
            [1/84, 1/84, 1/210], 
            [1/504, 1/315, 1/504]
        ],
        [ // j=1
            [1/24, 1/42, 1/168], 
            [1/28, 1/28, 1/70], 
            [1/56, 1/35, 1/56], 
            [1/210, 1/84, 1/84]
        ],
        [ // j=2
            [1/84, 1/84, 1/210], 
            [1/56, 1/35, 1/56], 
            [1/70, 1/28, 1/28], 
            [1/168, 1/42, 1/24]
        ],
        [ // j=3
            [1/504, 1/315, 1/504], 
            [1/210, 1/84, 1/84], 
            [1/168, 1/42, 1/24], 
            [1/252, 1/36, 1/9]
        ]
    ];

    // Bảng area_integrals cho area (integrate B_j C_k dt)
    var areaIntegrals = [
        [1/6, 1/15, 1/60],
        [1/10, 1/10, 1/20],
        [1/20, 3/20, 1/10],
        [1/60, 1/15, 1/6]
    ];

    // Hàm xây dựng segments từ ring
    function buildSegments(ring) {
        var segments = [];
        var len = ring.length;
        for (var i = 0; i < len; i++) {
            var current = ring[i];
            var next = ring[(i + 1) % len];
            var p0 = { x: current[0], y: current[1] };
            var p1 = { x: current[4], y: current[5] };
            var p2 = { x: next[2], y: next[3] };
            var p3 = { x: next[0], y: next[1] };
            segments.push([p0, p1, p2, p3]);
        }
        return segments;
    }

    // Hàm tính area, mx, my cho một ring
    function calculateRingMetrics(ring) {
        var segments = buildSegments(ring);
        var area = 0;
        var mx = 0;
        var my = 0;

        for (var s = 0; s < segments.length; s++) {
            var seg = segments[s];
            var p0 = seg[0], p1 = seg[1], p2 = seg[2], p3 = seg[3];
            var x = [p0.x, p1.x, p2.x, p3.x];
            var y = [p0.y, p1.y, p2.y, p3.y];
            var dx = [x[1] - x[0], x[2] - x[1], x[3] - x[2]];
            var dy = [y[1] - y[0], y[2] - y[1], y[3] - y[2]];

            // Tính area_s
            var area_s = 0;
            for (var j = 0; j < 4; j++) {
                for (var k = 0; k < 3; k++) {
                    area_s += (x[j] * dy[k] - y[j] * dx[k]) * areaIntegrals[j][k];
                }
            }
            area_s *= 3 / 2;
            area += area_s;

            // Tính mx_s
            var mx_s = 0;
            for (var j2 = 0; j2 < 4; j2++) {
                for (var m2 = 0; m2 < 4; m2++) {
                    for (var k2 = 0; k2 < 3; k2++) {
                        mx_s += (x[j2] * x[m2] * dy[k2] - x[j2] * y[m2] * dx[k2]) * integrals[j2][m2][k2];
                    }
                }
            }
            mx_s *= 3 / 2;
            mx += mx_s;

            // Tính my_s
            var my_s = 0;
            for (var j3 = 0; j3 < 4; j3++) {
                for (var m3 = 0; m3 < 4; m3++) {
                    for (var k3 = 0; k3 < 3; k3++) {
                        my_s += (y[j3] * x[m3] * dy[k3] - y[j3] * y[m3] * dx[k3]) * integrals[j3][m3][k3];
                    }
                }
            }
            my_s *= 3 / 2;
            my += my_s;
        }

        return { area: area, mx: mx, my: my };
    }

    // Tính metrics cho tất cả rings
    var metrics = [];
    for (var idx = 0; idx < shape.length; idx++) {
        metrics.push(calculateRingMetrics(shape[idx]));
    }

    // Tìm outer ring: ring có |area| lớn nhất
    var maxAbsArea = 0;
    var outerIndex = 0;
    for (var i = 0; i < metrics.length; i++) {
        var absArea = Math.abs(metrics[i].area);
        if (absArea > maxAbsArea) {
            maxAbsArea = absArea;
            outerIndex = i;
        }
    }

    // Điều chỉnh dấu cho outer: làm area dương
    var totalArea = metrics[outerIndex].area;
    var totalMx = metrics[outerIndex].mx;
    var totalMy = metrics[outerIndex].my;
    if (totalArea < 0) {
        totalArea = -totalArea;
        totalMx = -totalMx;
        totalMy = -totalMy;
    }

    // Cho các holes: làm area âm
    for (var i2 = 0; i2 < metrics.length; i2++) {
        if (i2 === outerIndex) continue;
        var holeArea = metrics[i2].area;
        var holeMx = metrics[i2].mx;
        var holeMy = metrics[i2].my;
        if (holeArea > 0) {
            holeArea = -holeArea;
            holeMx = -holeMx;
            holeMy = -holeMy;
        }
        totalArea += holeArea;
        totalMx += holeMx;
        totalMy += holeMy;
    }

    if (totalArea === 0) {
        throw "Diện tích tổng bằng 0, không thể tính trọng tâm.";
    }

    var xBar = totalMx / totalArea;
    var yBar = totalMy / totalArea;

    return { x: xBar, y: yBar };
}

// ===== Ví dụ sử dụng =====
// shape = [[[0,0,0,0,1,1], [3,0,2,1,2,1]]];
// var center = calculateBezierShapeCenterOfMass(shape);
// $.writeln("Trọng tâm: x=" + center.x + ", y=" + center.y);


