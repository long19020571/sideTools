// ==============================
// Tính và vẽ trọng tâm của các polygon được chọn (PHIÊN BẢN CHÍNH XÁC)
// ==============================

drawCenterOfGravity();

function drawCenterOfGravity() {
    var polygons = getSelectedPolygon();
    var l = polygons.length;
    alert("Số polygon: " + l);

    for (var i = 0; i < l; ++i) {
        var cog = centerOfGravity(polygons[i]);
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
        alert("Polygon phải có ít nhất 3 điểm");
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

// Vẽ dấu cộng tại (x,y) với màu đỏ nổi bật
function drawCrossLine(x, y, lineLength) {
    var doc = app.activeDocument;
    
    // Tạo group để gom 2 đường
    var crossGroup = doc.groupItems.add();
    
    var vLine = doc.pathItems.add();
    vLine.setEntirePath([[x, y - lineLength / 2], [x, y + lineLength / 2]]);
    vLine.stroked = true;
    vLine.strokeWidth = 4;
    
    // Tạo màu đỏ
    var redColor = new RGBColor();
    redColor.red = 255;
    redColor.green = 0;
    redColor.blue = 0;
    vLine.strokeColor = redColor;
    vLine.filled = false;
    vLine.moveToBeginning(crossGroup);

    var hLine = doc.pathItems.add();
    hLine.setEntirePath([[x - lineLength / 2, y], [x + lineLength / 2, y]]);
    hLine.stroked = true;
    hLine.strokeWidth = 4;
    hLine.strokeColor = redColor;
    hLine.filled = false;
    hLine.moveToBeginning(crossGroup);
    
    crossGroup.name = "Centroid (" + Math.round(x) + ", " + Math.round(y) + ")";
}

// ==============================
// THUẬT TOÁN CHÍNH XÁC DỰA TRÊN GREEN'S THEOREM
// ==============================

// Cross product helper
function crossProduct(x1, y1, x2, y2) {
    return x1 * y2 - x2 * y1;
}

// Kiểm tra xem segment có phải đường thẳng không
function isLinearSegment(x0, y0, x1, y1, x2, y2, x3, y3) {
    var tolerance = 1e-6;
    // Nếu control points trùng với anchor points thì là đường thẳng
    return (Math.abs(x0 - x1) < tolerance && Math.abs(y0 - y1) < tolerance &&
            Math.abs(x3 - x2) < tolerance && Math.abs(y3 - y2) < tolerance);
}

// Tính diện tích, moment x, moment y cho segment đường thẳng
function linearSegmentProperties(x0, y0, x3, y3) {
    var area = 0.5 * crossProduct(x0, y0, x3, y3);
    var momentX = (1/6) * (x0 + x3) * crossProduct(x0, y0, x3, y3);
    var momentY = (1/6) * (y0 + y3) * crossProduct(x0, y0, x3, y3);
    
    return {
        area: area,
        momentX: momentX,
        momentY: momentY
    };
}

// Tích phân Bezier bằng phương pháp Gaussian quadrature (chính xác cao)
function bezierIntegral(x0, y0, x1, y1, x2, y2, x3, y3, func) {
    // Gaussian quadrature points và weights cho n=8 (độ chính xác cao)
    var points = [
        -0.9602898565, -0.7966664774, -0.5255324099, -0.1834346425,
         0.1834346425,  0.5255324099,  0.7966664774,  0.9602898565
    ];
    var weights = [
        0.1012285363, 0.2223810345, 0.3137066459, 0.3626837834,
        0.3626837834, 0.3137066459, 0.2223810345, 0.1012285363
    ];
    
    var sum = 0;
    for (var i = 0; i < points.length; i++) {
        var t = (points[i] + 1) / 2; // Chuyển từ [-1,1] sang [0,1]
        
        // Tính Bezier(t)
        var t2 = t * t;
        var t3 = t2 * t;
        var omt = 1 - t;
        var omt2 = omt * omt;
        var omt3 = omt2 * omt;
        
        var x = omt3 * x0 + 3 * omt2 * t * x1 + 3 * omt * t2 * x2 + t3 * x3;
        var y = omt3 * y0 + 3 * omt2 * t * y1 + 3 * omt * t2 * y2 + t3 * y3;
        
        // Tính đạo hàm Bezier'(t)
        var dx = 3 * omt2 * (x1 - x0) + 6 * omt * t * (x2 - x1) + 3 * t2 * (x3 - x2);
        var dy = 3 * omt2 * (y1 - y0) + 6 * omt * t * (y2 - y1) + 3 * t2 * (y3 - y2);
        
        sum += weights[i] * func(x, y, dx, dy);
    }
    
    return sum / 2; // Jacobian từ việc chuyển đổi [0,1] -> [-1,1]
}

// Tính diện tích, moment x, moment y cho segment Bezier
function bezierSegmentProperties(x0, y0, x1, y1, x2, y2, x3, y3) {
    // Green's theorem: Area = ∮ x dy = ∮ -y dx
    var area = bezierIntegral(x0, y0, x1, y1, x2, y2, x3, y3, 
        function(x, y, dx, dy) {
            return x * dy; // hoặc -y * dx
        });
    
    // Moment X = ∮ x * (x dy) 
    var momentX = bezierIntegral(x0, y0, x1, y1, x2, y2, x3, y3,
        function(x, y, dx, dy) {
            return x * x * dy;
        });
    
    // Moment Y = ∮ y * (x dy)
    var momentY = bezierIntegral(x0, y0, x1, y1, x2, y2, x3, y3,
        function(x, y, dx, dy) {
            return y * x * dy;
        });
    
    return {
        area: area,
        momentX: momentX,
        momentY: momentY
    };
}

// Tính trọng tâm của polygon
function centerOfGravity(polygon) {
    var totalArea = 0;
    var totalMomentX = 0;
    var totalMomentY = 0;

    for (var r = 0; r < polygon.length; r++) {
        var ring = polygon[r];
        var ringArea = 0;
        var ringMomentX = 0;
        var ringMomentY = 0;
        var n = ring.length;

        for (var i = 0; i < n; i++) {
            var curr = ring[i];
            var next = ring[(i + 1) % n];

            // Lấy control points
            var x0 = curr[0], y0 = curr[1];       // anchor hiện tại
            var x1 = curr[4], y1 = curr[5];       // rightDirection hiện tại
            var x2 = next[2], y2 = next[3];       // leftDirection tiếp theo
            var x3 = next[0], y3 = next[1];       // anchor tiếp theo

            var props;
            
            // Kiểm tra xem có phải đường thẳng không
            if (isLinearSegment(x0, y0, x1, y1, x2, y2, x3, y3)) {
                props = linearSegmentProperties(x0, y0, x3, y3);
            } else {
                props = bezierSegmentProperties(x0, y0, x1, y1, x2, y2, x3, y3);
            }

            ringArea += props.area;
            ringMomentX += props.momentX;
            ringMomentY += props.momentY;
        }

        // Vòng ngoài (+), vòng lỗ (-)
        var sign = (r === 0) ? 1 : -1;
        totalArea += sign * ringArea;
        totalMomentX += sign * ringMomentX;
        totalMomentY += sign * ringMomentY;
    }

    // Kiểm tra diện tích
    if (Math.abs(totalArea) < 1e-10) {
        alert("Cảnh báo: Diện tích gần bằng 0!");
        return { x: 0, y: 0, area: totalArea };
    }

    // Tọa độ trọng tâm
    var centroidX = totalMomentX / totalArea;
    var centroidY = totalMomentY / totalArea;

    alert("Trọng tâm chính xác:\n" +
          "X = " + Math.round(centroidX * 100) / 100 + "\n" +
          "Y = " + Math.round(centroidY * 100) / 100 + "\n" +
          "Diện tích = " + Math.round(totalArea * 100) / 100);

    return { 
        x: centroidX, 
        y: centroidY, 
        area: totalArea 
    };
}

// ==============================
// HÀM TEST
// ==============================
function testWithSimpleRectangle() {
    var doc = app.activeDocument;
    
    // Tạo hình chữ nhật 200x100 
    var rect = doc.pathItems.rectangle(-100, 100, 200, 100);
    
    // Chọn và test
    app.activeDocument.selection = null;
    rect.selected = true;
    
    alert("Test với hình chữ nhật 200x100\n" +
          "Vị trí: từ (100,-100) đến (300,-200)\n" + 
          "Trọng tâm lý thuyết: (200, -150)");
    
    drawCenterOfGravity();
}

function testWithCircle() {
    var doc = app.activeDocument;
    
    // Tạo hình tròn bán kính 50
    var circle = doc.pathItems.ellipse(-50, 50, 100, 100);
    
    // Chọn và test  
    app.activeDocument.selection = null;
    circle.selected = true;
    
    alert("Test với hình tròn bán kính 50\n" +
          "Tâm tại (100, -100)\n" +
          "Trọng tâm lý thuyết: (100, -100)");
    
    drawCenterOfGravity();
}