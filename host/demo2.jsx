// Adobe Illustrator Script: Tạo Clipping Mask đơn giản
// Sử dụng duplicate để tránh lỗi 9046

if (app.documents.length === 0) {
    alert("Cần mở document!");
} else {
    var doc = app.activeDocument;
    for (var i = 0; i < doc.pathItems.length; i++) {
        var pathItem = doc.pathItems[i];
        alert(pathItem.clipping);
        alert(pathItem.parent.typename);
        alert(pathItem.parent.parent.typename);
    }
}