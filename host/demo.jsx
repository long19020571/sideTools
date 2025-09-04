
// ==============================
// Draw Center of Mass 
// ==============================
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
// function calculateRingCenterOfMass(ring) {
//     var n = ring.length;
//     if (n < 3) {
//         return {area: 0, centroid: {x: 0, y: 0}};
//     }
    
//     var area = 0;
//     var cx = 0;
//     var cy = 0;
    
//     // Sử dụng công thức Shoelace để tính diện tích và center of mass
//     // Chỉ sử dụng anchor points để đơn giản hóa
//     for (var i = 0; i < n; i++) {
//         var j = (i + 1) % n;
//         var xi = ring[i][0]; // anchor_x
//         var yi = ring[i][1]; // anchor_y
//         var xj = ring[j][0]; // anchor_x
//         var yj = ring[j][1]; // anchor_y
        
//         var cross = xi * yj - xj * yi;
//         area += cross;
//         cx += (xi + xj) * cross;
//         cy += (yi + yj) * cross;
//     }
    
//     area = area / 2;
    
//     if (Math.abs(area) < 1e-10) {
//         return {area: 0, centroid: {x: 0, y: 0}};
//     }
    
//     cx = cx / (6 * area);
//     cy = cy / (6 * area);
    
//     return {
//         area: Math.abs(area),
//         centroid: {x: cx, y: cy}
//     };
// }
/***********************
 * Analytical centroid for a single Bezier ring
 * ring: array of points [[ax,ay, lx,ly, rx,ry], ...]
 * Returns { area: <positive>, centroid: {x,y}, signedArea: <signed> }
 ***********************/
/***********************
 * Analytical centroid for a single Bezier ring (exact, no sampling)
 * ring: array of points [[ax,ay, lx,ly, rx,ry], ...]
 * Returns { area: <positive>, centroid: {x,y}, signedArea: <signed> }
 ***********************/
function calculateRingCenterOfMass(ring) {
    var n = ring.length;
    if (n < 2) return { area: 0, centroid: {x:0,y:0}, signedArea: 0 };

    var A = 0.0;   // signed area
    var Sx = 0.0;  // = ∬ x dA
    var Sy = 0.0;  // = ∬ y dA

    for (var i = 0; i < n; i++) {
        var j = (i + 1) % n;

        var P0 = [ ring[i][0], ring[i][1] ]; // anchor i
        var P1 = [ ring[i][4], ring[i][5] ]; // rightDirection i
        var P2 = [ ring[j][2], ring[j][3] ]; // leftDirection j
        var P3 = [ ring[j][0], ring[j][1] ]; // anchor j

        var seg = integrateBezierSegment(P0, P1, P2, P3);
        A  += seg.A;    // signed
        Sx += seg.Sx;   // = (1/2) ∫ x^2 y' dt
        Sy += seg.Sy;   // = -(1/2) ∫ y^2 x' dt
    }

    if (Math.abs(A) < 1e-12) {
        return { area: 0, centroid: {x:0,y:0}, signedArea: A };
    }

    var Cx = Sx / A;   // since Sx = ∬ x dA
    var Cy = Sy / A;   // since Sy = ∬ y dA

    return { area: Math.abs(A), centroid: { x: Cx, y: Cy }, signedArea: A };
}

/* -------------------------
   integrateBezierSegment:
   Computes (exact) signed area A and first moments Sx = ∬x dA, Sy = ∬y dA
   for a cubic Bezier segment P0->P3, via closed-form polynomial integrals.
   ------------------------- */
function integrateBezierSegment(P0,P1,P2,P3) {
    // x(t) = ax[0] + ax[1] t + ax[2] t^2 + ax[3] t^3
    // y(t) = ay[0] + ay[1] t + ay[2] t^2 + ay[3] t^3
    var ax = polyCoeff1D(P0[0], P1[0], P2[0], P3[0]);
    var ay = polyCoeff1D(P0[1], P1[1], P2[1], P3[1]);

    // derivatives (degree 2): dx(t), dy(t)
    var dx = [ ax[1], 2*ax[2], 3*ax[3] ];
    var dy = [ ay[1], 2*ay[2], 3*ay[3] ];

    // Area integrand: fA(t) = x(t)*y'(t) - y(t)*x'(t)
    var fA = polySubtract( polyMultiply(ax, dy), polyMultiply(ay, dx) );
    var A  = 0.5 * polyIntegral(fA, 0.0, 1.0);

    // First moments (no xy terms!):
    // ∬ x dA = (1/2) ∮ x^2 dy  -> Sx = (1/2) ∫ x(t)^2 * y'(t) dt
    var x2   = polyMultiply(ax, ax);               // deg 6
    var x2dy = polyMultiply(x2, dy);               // deg 8
    var Sx   = 0.5 * polyIntegral(x2dy, 0.0, 1.0);

    // ∬ y dA = -(1/2) ∮ y^2 dx -> Sy = -(1/2) ∫ y(t)^2 * x'(t) dt
    var y2   = polyMultiply(ay, ay);               // deg 6
    var y2dx = polyMultiply(y2, dx);               // deg 8
    var Sy   = -0.5 * polyIntegral(y2dx, 0.0, 1.0);

    return { A: A, Sx: Sx, Sy: Sy };
}

/* -------------------------
   Polynomial helpers (power basis)
   ------------------------- */
function polyCoeff1D(p0,p1,p2,p3) {
    // Bernstein -> power basis conversion for cubic Bezier
    var a0 = p0;
    var a1 = -3*p0 + 3*p1;
    var a2 =  3*p0 - 6*p1 + 3*p2;
    var a3 = -p0 + 3*p1 - 3*p2 + p3;
    return [a0,a1,a2,a3];
}

function polyMultiply(a,b) {
    var na=a.length, nb=b.length, res=new Array(na+nb-1);
    for (var k=0;k<res.length;k++) res[k]=0.0;
    for (var i=0;i<na;i++) for (var j=0;j<nb;j++) res[i+j]+=a[i]*b[j];
    return res;
}

function polySubtract(a,b) {
    var n=Math.max(a.length,b.length), res=new Array(n);
    for (var i=0;i<n;i++) {
        var ai=(i<a.length)?a[i]:0.0;
        var bi=(i<b.length)?b[i]:0.0;
        res[i]=ai-bi;
    }
    // optional trim
    while (res.length>1 && Math.abs(res[res.length-1])<1e-20) res.pop();
    return res;
}

function polyIntegral(c, t0, t1) {
    var s=0.0;
    for (var i=0;i<c.length;i++) {
        var k=i+1;
        s += (c[i]/k) * (Math.pow(t1,k) - Math.pow(t0,k));
    }
    return s;
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

////////////////////////////////////////////////////////////////////////////////////////////
// Lấy polygon từ selection hiện tại trong Illustrator
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
function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (var i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}
sliceImage();