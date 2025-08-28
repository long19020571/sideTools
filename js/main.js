// CEP Extension Main JavaScript
(function() {
    'use strict';
    var csInterface = new CSInterface();
    csInterface.evalScript('$.evalFile("' +
    csInterface.getSystemPath(SystemPath.EXTENSION) + '/host/host.jsx")');
    init();
    // Initialize when DOM is loaded
    function init() {
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Shape creation buttons
        document.getElementById('makeRefPoint').addEventListener('click', function() {
            var black = document.getElementById('isBlack').checked,
                inner = document.getElementById('innerArt').checked;
            csInterface.evalScript(`makeReferencePoint(${black}, ${inner})`);

        });
        document.getElementById('fitArtboardToSelectedArt').addEventListener('click', function() {
            csInterface.evalScript(`fitArtboardToSelectedArt()`);
        });
        centerOfMass
        document.getElementById('centerOfMass').addEventListener('click', function() {
            csInterface.evalScript(`drawCenterOfGravity`);
        });

    }
    /*
        Cubic Bezier
        x(t) = (1-t)^3*x_0 + 3 * (1-t)^2*t*x_1 + 3*(1-t)*t^2*x_2 + t^3*x_3
        y(t) = (1-t)^3*y_0 + 3 * (1-t)^2*t*y_1 + 3*(1-t)*t^2*y_2 + t^3*y_3

        Dien tich tao boi cubic bezier vs truc hoanh
    */
        // Cross product 2D
    const C = (xi, yi, xj, yj) => xi * yj - xj * yi;

    // Diện tích có dấu của một đoạn cubic Bézier
    function A_seg(x0, y0, x1, y1, x2, y2, x3, y3) {
        return (
            (6 * C(x0, y0, x1, y1) +
            3 * C(x0, y0, x2, y2) +
            1 * C(x0, y0, x3, y3) +
            3 * C(x1, y1, x2, y2) +
            3 * C(x1, y1, x3, y3) +
            6 * C(x2, y2, x3, y3)) / 20
        );
    }

    // Moment theo trục X
    function Nx_seg(x0, y0, x1, y1, x2, y2, x3, y3) {
        return (
            (6 * ( (x0 + x1) * C(x0, y0, x1, y1) ) +
            3 * ( (x0 + x2) * C(x0, y0, x2, y2) ) +
            1 * ( (x0 + x3) * C(x0, y0, x3, y3) ) +
            3 * ( (x1 + x2) * C(x1, y1, x2, y2) ) +
            3 * ( (x1 + x3) * C(x1, y1, x3, y3) ) +
            6 * ( (x2 + x3) * C(x2, y2, x3, y3) )
            ) / 60
        );
    }

    // Moment theo trục Y
    function Ny_seg(x0, y0, x1, y1, x2, y2, x3, y3) {
        return (
            (6 * ( (y0 + y1) * C(x0, y0, x1, y1) ) +
            3 * ( (y0 + y2) * C(x0, y0, x2, y2) ) +
            1 * ( (y0 + y3) * C(x0, y0, x3, y3) ) +
            3 * ( (y1 + y2) * C(x1, y1, x2, y2) ) +
            3 * ( (y1 + y3) * C(x1, y1, x3, y3) ) +
            6 * ( (y2 + y3) * C(x2, y2, x3, y3) )
            ) / 60
        );
    }
    function centerOfGravity(polygon) {
        let A_total = 0;
        let Nx_total = 0;
        let Ny_total = 0;

        polygon.forEach((ring, ringIndex) => {
            let A_ring = 0, Nx_ring = 0, Ny_ring = 0;
            let n = ring.length;

            for (let i = 0; i < n; i++) {
                let curr = ring[i];
                let next = ring[(i + 1) % n];

                // P0
                let x0 = curr[0], y0 = curr[1];
                // P1 = right control của curr
                let x1 = curr[4], y1 = curr[5];
                // P2 = left control của next
                let x2 = next[2], y2 = next[3];
                // P3 = anchor của next
                let x3 = next[0], y3 = next[1];

                let A = A_seg(x0, y0, x1, y1, x2, y2, x3, y3);
                let Nx = Nx_seg(x0, y0, x1, y1, x2, y2, x3, y3);
                let Ny = Ny_seg(x0, y0, x1, y1, x2, y2, x3, y3);

                A_ring += A;
                Nx_ring += Nx;
                Ny_ring += Ny;
            }

            // Nếu là vòng ngoài: cộng dương, vòng lỗ: trừ
            let sign = (ringIndex === 0) ? 1 : -1;
            A_total += sign * A_ring;
            Nx_total += sign * Nx_ring;
            Ny_total += sign * Ny_ring;
        });

        let Cx = Nx_total / (3 * A_total);
        let Cy = Ny_total / (3 * A_total);
        alert("x :" + Cx + ", y :" + Cy);
        return { x: Cx, y: Cy, area: A_total };
    }


    
})();