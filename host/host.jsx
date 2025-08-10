// ==============================
// Tính và vẽ trọng tâm CHÍNH XÁC sử dụng DIỆN TÍCH để xác định outer ring
// ==============================

drawCenterOfGravity();

function drawCenterOfGravity() {
    var polygons = getSelectedPolygon();
    var l = polygons.length;
    alert("Số polygon: " + l);

    for (var i = 0; i < l; ++i) {
        var cog = centerOfGravity(polygons[i]);
        if (Math.abs(cog.area) > 1e-10) {
            drawCrossLine(cog.x, cog.y, 50);
        } else {
            alert("Cảnh báo: Hình có diện tích = 0");
        }
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

// ==============================
// TÍNH DIỆN TÍCH TUYỆT ĐỐI ĐỂ XÁC ĐỊNH OUTER RING
// ==============================

function crossProduct(x1, y1, x2, y2) {
    return x1 * y2 - x2 * y1;
}

// Tính diện tích tuyệt đối của một ring
function calculateRingAbsArea(ring) {
    var area = 0;
    var n = ring.length;
    
    for (var i = 0; i < n; i++) {
        var curr = ring[i];
        var next = ring[(i + 1) % n];
        
        var x0 = curr[0], y0 = curr[1];
        var x1 = curr[4], y1 = curr[5];
        var x2 = next[2], y2 = next[3];
        var x3 = next[0], y3 = next[1];
        
        if (isLinearSegment(x0, y0, x1, y1, x2, y2, x3, y3)) {
            area += 0.5 * Math.abs(crossProduct(x0, y0, x3, y3));
        } else {
            // Tính diện tích Bezier segment
            area += Math.abs(bezierSegmentArea(x0, y0, x1, y1, x2, y2, x3, y3));
        }
    }
    
    return area;
}

// Tìm outer ring dựa trên diện tích lớn nhất
function findOuterRingIndex(polygon) {
    var maxArea = 0;
    var outerIndex = 0;
    
    for (var r = 0; r < polygon.length; r++) {
        var area = calculateRingAbsArea(polygon[r]);
        if (area > maxArea) {
            maxArea = area;
            outerIndex = r;
        }
    }
    
    return outerIndex;
}

// Kiểm tra segment có phải đường thẳng không
function isLinearSegment(x0, y0, x1, y1, x2, y2, x3, y3) {
    var tolerance = 1e-6;
    return (Math.abs(x0 - x1) < tolerance && Math.abs(y0 - y1) < tolerance &&
            Math.abs(x3 - x2) < tolerance && Math.abs(y3 - y2) < tolerance);
}

// Tính diện tích segment Bezier (đơn giản)
function bezierSegmentArea(x0, y0, x1, y1, x2, y2, x3, y3) {
    return (
        (6 * crossProduct(x0, y0, x1, y1) +
         3 * crossProduct(x0, y0, x2, y2) +
         1 * crossProduct(x0, y0, x3, y3) +
         3 * crossProduct(x1, y1, x2, y2) +
         3 * crossProduct(x1, y1, x3, y3) +
         6 * crossProduct(x2, y2, x3, y3)) / 20
    );
}

// Tính properties cho segment đường thẳng
function linearSegmentProperties(x0, y0, x3, y3) {
    var cross = crossProduct(x0, y0, x3, y3);
    return {
        area: 0.5 * cross,
        momentX: (1/6) * (x0 + x3) * cross,
        momentY: (1/6) * (y0 + y3) * cross
    };
}

// Gaussian quadrature cho Bezier curves
function bezierIntegral(x0, y0, x1, y1, x2, y2, x3, y3, func) {
    var points = [-0.9602898565, -0.7966664774, -0.5255324099, -0.1834346425,
                   0.1834346425,  0.5255324099,  0.7966664774,  0.9602898565];
    var weights = [0.1012285363, 0.2223810345, 0.3137066459, 0.3626837834,
                   0.3626837834, 0.3137066459, 0.2223810345, 0.1012285363];
    
    var sum = 0;
    for (var i = 0; i < points.length; i++) {
        var t = (points[i] + 1) / 2;
        
        var t2 = t * t, t3 = t2 * t;
        var omt = 1 - t, omt2 = omt * omt, omt3 = omt2 * omt;
        
        var x = omt3*x0 + 3*omt2*t*x1 + 3*omt*t2*x2 + t3*x3;
        var y = omt3*y0 + 3*omt2*t*y1 + 3*omt*t2*y2 + t3*y3;
        
        var dx = 3*omt2*(x1-x0) + 6*omt*t*(x2-x1) + 3*t2*(x3-x2);
        var dy = 3*omt2*(y1-y0) + 6*omt*t*(y2-y1) + 3*t2*(y3-y2);
        
        sum += weights[i] * func(x, y, dx, dy);
    }
    
    return sum / 2;
}

// Tính properties cho segment Bezier
function bezierSegmentProperties(x0, y0, x1, y1, x2, y2, x3, y3) {
    var area = bezierIntegral(x0, y0, x1, y1, x2, y2, x3, y3, 
        function(x, y, dx, dy) { return x * dy; });
    
    var momentX = bezierIntegral(x0, y0, x1, y1, x2, y2, x3, y3,
        function(x, y, dx, dy) { return x * x * dy; });
    
    var momentY = bezierIntegral(x0, y0, x1, y1, x2, y2, x3, y3,
        function(x, y, dx, dy) { return y * x * dy; });
    
    return { area: area, momentX: momentX, momentY: momentY };
}

// ==============================
// THUẬT TOÁN CHÍNH: SỬ DỤNG DIỆN TÍCH ĐỂ XÁC ĐỊNH OUTER RING
// ==============================

function centerOfGravity(polygon) {
    if (polygon.length === 1) {
        // Simple path - không có lỗ
        return calculateSingleRingCentroid(polygon[0]);
    }
    
    // Compound path - có lỗ
    return calculateCompoundPathCentroid(polygon);
}

function calculateSingleRingCentroid(ring) {
    var area = 0, momentX = 0, momentY = 0;
    var n = ring.length;
    
    for (var i = 0; i < n; i++) {
        var curr = ring[i];
        var next = ring[(i + 1) % n];
        
        var x0 = curr[0], y0 = curr[1];
        var x1 = curr[4], y1 = curr[5];
        var x2 = next[2], y2 = next[3];
        var x3 = next[0], y3 = next[1];
        
        var props;
        if (isLinearSegment(x0, y0, x1, y1, x2, y2, x3, y3)) {
            props = linearSegmentProperties(x0, y0, x3, y3);
        } else {
            props = bezierSegmentProperties(x0, y0, x1, y1, x2, y2, x3, y3);
        }
        
        area += props.area;
        momentX += props.momentX;
        momentY += props.momentY;
    }
    
    if (Math.abs(area) < 1e-10) {
        alert("Cảnh báo: Diện tích = 0");
        return { x: 0, y: 0, area: 0 };
    }
    
    var cx = momentX / area;
    var cy = momentY / area;
    
    alert("Simple path:\nDiện tích = " + Math.round(area*100)/100 + 
          "\nTrọng tâm: (" + Math.round(cx*10)/10 + ", " + Math.round(cy*10)/10 + ")");
    
    return { x: cx, y: cy, area: area };
}

function calculateCompoundPathCentroid(polygon) {
    var debugInfo = "=== Compound Path Analysis ===\n";
    var ringInfos = [];
    
    // Bước 1: Tính diện tích tuyệt đối của tất cả rings
    for (var r = 0; r < polygon.length; r++) {
        var ring = polygon[r];
        var absArea = calculateRingAbsArea(ring);
        
        ringInfos.push({
            index: r,
            ring: ring,
            absArea: absArea
        });
        
        debugInfo += "Ring " + r + ": diện tích = " + Math.round(absArea*100)/100 + "\n";
    }
    
    // Bước 2: Sắp xếp theo diện tích giảm dần
    ringInfos.sort(function(a, b) {
        return b.absArea - a.absArea;
    });
    
    var outerRingIndex = ringInfos[0].index;
    debugInfo += "\n🎯 OUTER RING: Ring " + outerRingIndex + " (diện tích lớn nhất)\n";
    
    // Bước 3: Tính toán với outer ring = dương, các ring khác = âm
    var totalArea = 0, totalMomentX = 0, totalMomentY = 0;
    
    for (var i = 0; i < ringInfos.length; i++) {
        var ringInfo = ringInfos[i];
        var ringProps = calculateRingProperties(ringInfo.ring);
        
        var sign;
        if (ringInfo.index === outerRingIndex) {
            sign = 1; // Outer ring - diện tích dương
            debugInfo += "Ring " + ringInfo.index + ": OUTER (+) - ";
        } else {
            sign = -1; // Inner rings (holes) - diện tích âm
            debugInfo += "Ring " + ringInfo.index + ": HOLE (-) - ";
        }
        
        debugInfo += "signed area = " + Math.round( ringProps.area * 100)/100 + "\n";
        
        totalArea +=  ringProps.area;
        totalMomentX +=  ringProps.momentX;
        totalMomentY +=  ringProps.momentY;
    }
    
    debugInfo += "\nTổng diện tích có dấu: " + Math.round(totalArea*100)/100;
    
    // Bước 4: Tính trọng tâm
    if (Math.abs(totalArea) < 1e-10) {
        alert(debugInfo + "\n\n❌ Diện tích tổng = 0!\nHình có thể self-cancel hoặc invalid.");
        return { x: 0, y: 0, area: 0 };
    }
    
    var centroidX = totalMomentX / totalArea;
    var centroidY = totalMomentY / totalArea;
    
    alert(debugInfo + "\n\n✅ Trọng tâm:\n" +
          "X = " + Math.round(centroidX * 10) / 10 + "\n" +
          "Y = " + Math.round(centroidY * 10) / 10);
    
    return { x: centroidX, y: centroidY, area: totalArea };
}

// Tính tất cả properties của một ring
function calculateRingProperties(ring) {
    var area = 0, momentX = 0, momentY = 0;
    var n = ring.length;
    
    for (var i = 0; i < n; i++) {
        var curr = ring[i];
        var next = ring[(i + 1) % n];
        
        var x0 = curr[0], y0 = curr[1];
        var x1 = curr[4], y1 = curr[5];
        var x2 = next[2], y2 = next[3];
        var x3 = next[0], y3 = next[1];
        
        var props;
        if (isLinearSegment(x0, y0, x1, y1, x2, y2, x3, y3)) {
            props = linearSegmentProperties(x0, y0, x3, y3);
        } else {
            props = bezierSegmentProperties(x0, y0, x1, y1, x2, y2, x3, y3);
        }
        
        area += props.area;
        momentX += props.momentX;
        momentY += props.momentY;
    }
    
    return { area: area, momentX: momentX, momentY: momentY };
}

// Tính diện tích tuyệt đối của ring (chỉ để so sánh kích thước)
function calculateRingAbsArea(ring) {
    var area = 0;
    var n = ring.length;
    
    for (var i = 0; i < n; i++) {
        var curr = ring[i];
        var next = ring[(i + 1) % n];
        
        // Sử dụng anchor points để tính diện tích nhanh
        var x1 = curr[0], y1 = curr[1];
        var x2 = next[0], y2 = next[1];
        
        area += 0.5 * Math.abs(crossProduct(x1, y1, x2, y2));
    }
    
    return area;
}

// Kiểm tra segment đường thẳng
function isLinearSegment(x0, y0, x1, y1, x2, y2, x3, y3) {
    var tolerance = 1e-6;
    return (Math.abs(x0 - x1) < tolerance && Math.abs(y0 - y1) < tolerance &&
            Math.abs(x3 - x2) < tolerance && Math.abs(y3 - y2) < tolerance);
}

// Properties cho segment đường thẳng
function linearSegmentProperties(x0, y0, x3, y3) {
    var cross = crossProduct(x0, y0, x3, y3);
    return {
        area: 0.5 * cross,
        momentX: (1/6) * (x0 + x3) * cross,
        momentY: (1/6) * (y0 + y3) * cross
    };
}

// Gaussian quadrature integration
function bezierIntegral(x0, y0, x1, y1, x2, y2, x3, y3, func) {
    var points = [-0.9602898565, -0.7966664774, -0.5255324099, -0.1834346425,
                   0.1834346425,  0.5255324099,  0.7966664774,  0.9602898565];
    var weights = [0.1012285363, 0.2223810345, 0.3137066459, 0.3626837834,
                   0.3626837834, 0.3137066459, 0.2223810345, 0.1012285363];
    
    var sum = 0;
    for (var i = 0; i < points.length; i++) {
        var t = (points[i] + 1) / 2;
        
        var t2 = t * t, t3 = t2 * t;
        var omt = 1 - t, omt2 = omt * omt, omt3 = omt2 * omt;
        
        var x = omt3*x0 + 3*omt2*t*x1 + 3*omt*t2*x2 + t3*x3;
        var y = omt3*y0 + 3*omt2*t*y1 + 3*omt*t2*y2 + t3*y3;
        
        var dx = 3*omt2*(x1-x0) + 6*omt*t*(x2-x1) + 3*t2*(x3-x2);
        var dy = 3*omt2*(y1-y0) + 6*omt*t*(y2-y1) + 3*t2*(y3-y2);
        
        sum += weights[i] * func(x, y, dx, dy);
    }
    
    return sum / 2;
}

// Properties cho segment Bezier
function bezierSegmentProperties(x0, y0, x1, y1, x2, y2, x3, y3) {
    var area = bezierIntegral(x0, y0, x1, y1, x2, y2, x3, y3, 
        function(x, y, dx, dy) { return x * dy; });
    
    var momentX = bezierIntegral(x0, y0, x1, y1, x2, y2, x3, y3,
        function(x, y, dx, dy) { return x * x * dy; });
    
    var momentY = bezierIntegral(x0, y0, x1, y1, x2, y2, x3, y3,
        function(x, y, dx, dy) { return y * x * dy; });
    
    return { area: area, momentX: momentX, momentY: momentY };
}

