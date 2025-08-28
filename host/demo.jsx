/**
 * Tính center of mass của hình kín và vẽ các đường thẳng đi qua trọng tâm
 * @param {Array} A - Mảng các ring [ring0, ring1, ...]
 * @param {Document} doc - Document Illustrator hiện tại
 */
function drawCenterOfMassLines(A, doc) {
    if (!A || A.length === 0) {
        alert("Không có dữ liệu hình để xử lý");
        return;
    }
    
    // Tìm ring ngoài cùng (bounding box lớn nhất)
    var outerRingIndex = findOuterRing(A);
    var outerRing = A[outerRingIndex];
    var holes = [];
    
    // Tạo danh sách các lỗ (tất cả ring khác)
    for (var i = 0; i < A.length; i++) {
        if (i !== outerRingIndex) {
            holes.push(A[i]);
        }
    }
    
    // Tính center of mass
    var centerOfMass = calculateCenterOfMass(outerRing, holes);
    
    // Vẽ các đường thẳng
    drawCrossLines(centerOfMass, doc);
    
    return centerOfMass;
}

/**
 * Tìm ring có bounding box lớn nhất (ring ngoài cùng)
 * @param {Array} rings - Mảng các ring
 * @return {Number} - Index của ring ngoài cùng
 */
function findOuterRing(rings) {
    var maxArea = 0;
    var outerRingIndex = 0;
    
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
 * @param {Array} ring - Mảng các point
 * @return {Object} - {left, top, right, bottom, width, height}
 */
function getRingBoundingBox(ring) {
    if (ring.length === 0) return null;
    
    var left = ring[0][0];   // anchor_x
    var right = ring[0][0];
    var top = ring[0][1];    // anchor_y (âm trong Illustrator)
    var bottom = ring[0][1];
    
    for (var i = 0; i < ring.length; i++) {
        var point = ring[i];
        var anchor_x = point[0];
        var anchor_y = point[1];
        var left_dir_x = point[2];
        var left_dir_y = point[3];
        var right_dir_x = point[4];
        var right_dir_y = point[5];
        
        // Kiểm tra tất cả các điểm (anchor + control points)
        var points = [
            [anchor_x, anchor_y],
            [left_dir_x, left_dir_y],
            [right_dir_x, right_dir_y]
        ];
        
        for (var j = 0; j < points.length; j++) {
            var x = points[j][0];
            var y = points[j][1];
            
            if (x < left) left = x;
            if (x > right) right = x;
            if (y > top) top = y;      // y âm, giá trị lớn hơn = gần 0 hơn = cao hơn
            if (y < bottom) bottom = y; // y âm, giá trị nhỏ hơn = xa 0 hơn = thấp hơn
        }
    }
    
    return {
        left: left,
        top: top,
        right: right,
        bottom: bottom,
        width: right - left,
        height: top - bottom  // top > bottom vì y âm
    };
}

/**
 * Tính center of mass của hình kín có lỗ
 * @param {Array} outerRing - Ring ngoài cùng
 * @param {Array} holes - Mảng các lỗ
 * @return {Object} - {x, y} tọa độ center of mass
 */
function calculateCenterOfMass(outerRing, holes) {
    // Tính diện tích và center of mass của ring ngoài
    var outerData = calculateRingCenterOfMass(outerRing);
    var totalArea = outerData.area;
    var totalMomentX = outerData.area * outerData.centroid.x;
    var totalMomentY = outerData.area * outerData.centroid.y;
    
    // Trừ đi diện tích và moment của các lỗ
    for (var i = 0; i < holes.length; i++) {
        var holeData = calculateRingCenterOfMass(holes[i]);
        totalArea -= holeData.area;
        totalMomentX -= holeData.area * holeData.centroid.x;
        totalMomentY -= holeData.area * holeData.centroid.y;
    }
    
    if (Math.abs(totalArea) < 1e-10) {
        alert("Diện tích tổng bằng 0, không thể tính center of mass");
        return {x: 0, y: 0};
    }
    
    return {
        x: totalMomentX / totalArea,
        y: totalMomentY / totalArea
    };
}

/**
 * Tính center of mass của một ring đơn lẻ
 * @param {Array} ring - Mảng các point
 * @return {Object} - {area, centroid: {x, y}}
 */
function calculateRingCenterOfMass(ring) {
    var n = ring.length;
    if (n < 3) {
        return {area: 0, centroid: {x: 0, y: 0}};
    }
    
    var area = 0;
    var cx = 0;
    var cy = 0;
    
    // Sử dụng công thức Shoelace để tính diện tích và center of mass
    // Chỉ sử dụng anchor points để đơn giản hóa
    for (var i = 0; i < n; i++) {
        var j = (i + 1) % n;
        var xi = ring[i][0]; // anchor_x
        var yi = ring[i][1]; // anchor_y
        var xj = ring[j][0]; // anchor_x
        var yj = ring[j][1]; // anchor_y
        
        var cross = xi * yj - xj * yi;
        area += cross;
        cx += (xi + xj) * cross;
        cy += (yi + yj) * cross;
    }
    
    area = area / 2;
    
    if (Math.abs(area) < 1e-10) {
        return {area: 0, centroid: {x: 0, y: 0}};
    }
    
    cx = cx / (6 * area);
    cy = cy / (6 * area);
    
    return {
        area: Math.abs(area),
        centroid: {x: cx, y: cy}
    };
}

/**
 * Vẽ hai đường thẳng song song với trục tung và hoành đi qua center of mass
 * @param {Object} centerOfMass - {x, y} tọa độ center of mass
 * @param {Document} doc - Document Illustrator
 */
function drawCrossLines(centerOfMass, doc) {
    if (!doc) {
        doc = app.activeDocument;
    }
    
    var artboard = doc.artboards[0];
    var artboardRect = artboard.artboardRect;
    
    // Lấy kích thước artboard
    var left = artboardRect[0];
    var top = artboardRect[1];
    var right = artboardRect[2];
    var bottom = artboardRect[3];
    
    var cx = centerOfMass.x;
    var cy = centerOfMass.y;
    
    // Tạo layer mới cho các đường line (nếu chưa có)
    var layer;
    try {
        layer = doc.layers.getByName("Center of Mass Lines");
    } catch (e) {
        layer = doc.layers.add();
        layer.name = "Center of Mass Lines";
    }
    
    // Vẽ đường thẳng song song với trục hoành (ngang)
    var horizontalLine = doc.pathItems.add();
    horizontalLine.move(layer, ElementPlacement.PLACEATBEGINNING);
    
    var horizontalPoints = [
        [left, cy],      // Điểm bắt đầu
        [right, cy]      // Điểm kết thúc
    ];
    horizontalLine.setEntirePath(horizontalPoints);
    horizontalLine.filled = false;
    horizontalLine.stroked = true;
    horizontalLine.strokeWidth = 1;
    horizontalLine.strokeColor = createRGBColor(255, 0, 0); // Màu đỏ
    
    // Vẽ đường thẳng song song với trục tung (dọc)
    var verticalLine = doc.pathItems.add();
    verticalLine.move(layer, ElementPlacement.PLACEATBEGINNING);
    
    var verticalPoints = [
        [cx, top],       // Điểm bắt đầu
        [cx, bottom]     // Điểm kết thúc
    ];
    verticalLine.setEntirePath(verticalPoints);
    verticalLine.filled = false;
    verticalLine.stroked = true;
    verticalLine.strokeWidth = 1;
    verticalLine.strokeColor = createRGBColor(0, 0, 255); // Màu xanh dương
    
    // Tạo một điểm nhỏ tại center of mass
    var centerPoint = doc.pathItems.ellipse(cy + 2, cx - 2, 4, 4);
    centerPoint.move(layer, ElementPlacement.PLACEATBEGINNING);
    centerPoint.filled = true;
    centerPoint.fillColor = createRGBColor(0, 255, 0); // Màu xanh lá
    centerPoint.stroked = false;
}

/**
 * Tạo màu RGB
 * @param {Number} r - Red (0-255)
 * @param {Number} g - Green (0-255)
 * @param {Number} b - Blue (0-255)
 * @return {RGBColor} - Màu RGB
 */
function createRGBColor(r, g, b) {
    var color = new RGBColor();
    color.red = r;
    color.green = g;
    color.blue = b;
    return color;
}

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
function drawCenterOfGravity() {
    var polygons = getSelectedPolygon();
    var l = polygons.length;
    alert("Số polygon: " + l);

    for (var i = 0; i < l; ++i) {
        drawCenterOfMassLines(polygons[i], app.activeDocument);
    }
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

drawCenterOfGravity();