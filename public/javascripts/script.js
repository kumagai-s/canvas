$(function() {
    var undoStack = [];
    var redoStack = [];

    var isUndoing = false;
    var isRedoing = false;

    var socket = io();

    var roomId = $("#roomId").val();
    socket.emit('join', { roomId: roomId });

    //初期設定
    var svgElm = $("#canvas"), //SVG要素を取得
        movetoX = 0, //開始点(横方向)の初期化
        movetoY = 0, //開始点(縦方向)の初期化
        linetoStr = "", //LineToコマンド値の初期化
        strokeColor = "#666666", //描画色の初期化
        drawType = ""; //塗りつぶしの初期化

    /* ドラッグ開始 */
    svgElm.mousedown(function(event){
        recordUndoAction();

        strokeColor = $(".color").val(); //inputの色の設定を取得

        //PAINT(value: paint)が選択されていたら、塗りつぶし色を設定
        if($("input[name='drawtype']:checked").val() == "paint")
            drawType = strokeColor;
        else
            drawType = "none";

        movetoX = parseInt(event.pageX - svgElm.position().left); //SVG上のマウス座標(横方向)の取得
        movetoY = parseInt(event.pageY - svgElm.position().top); //SVG上のマウス座標(縦方向)の取得
        var pathElm = document.createElementNS("http://www.w3.org/2000/svg", "path"); //SVGのpath要素を作成
        svgElm.append(pathElm); //SVGに作成したpathを追加

        //追加したpathの各属性を設定
        svgElm.find("path:last").attr({
            "d": "", //pathデータ
            "fill": drawType, //塗りつぶし
            "stroke": strokeColor, //線の色
            "stroke-width": "3", //線の太さ
            "stroke-linecap": "round" //線の端を丸める
        });

        var linetoX = [], //描画点の横座標の初期化
            linetoY = [], //描画点の縦座標の初期化
            cntMoveto = 0; //描画点のカウンターを初期化

        linetoStr = 'M ' + movetoX + ' ' + movetoY + ' '; //d要素でpathの開始点を設定

        /* ドラッグ中 */
        svgElm.on("mousemove", function(event){
            event.preventDefault();
            linetoX[cntMoveto] = parseInt(event.pageX - svgElm.position().left); //SVG上のマウス座標(横方向)の取得
            linetoY[cntMoveto] = parseInt(event.pageY - svgElm.position().top); //SVG上のマウス座標(縦方向)の取得
            linetoStr = linetoStr + " L " + linetoX[cntMoveto] + " " + linetoY[cntMoveto]; //動いた後の新たなマウス座標を描画点として追加

            svgElm.find("path:last").attr("d", linetoStr); //pathデータ(d属性)の値を更新
            cntMoveto++; //カウンターをセット
        });

        /* ドラッグ終了 */
    }).mouseup(function(event){
        svgElm.off("mousemove"); //pathの描画を終了
        var data = createPathObject();
        socket.emit('draw server', { roomId: roomId, data: data });
    });

    //CLEARボタンをクリックしたら、SVGを空にする
    $("#clear").click(function () {
        recordUndoAction();
        svgElm.html("");
        socket.emit('clear server', { roomId: roomId });
    });

    $("#save").click(function () {
        var imageName;
        var imageUrl = $('#canvas').css('background-image');
        if (imageUrl !== "none") imageName = imageUrl.match(/\/images\/(.+)"/)[1];
        var pathsData = createPathObject();
        var data = { "pathsData": pathsData, "imageName": imageName };
        console.log(data);
        $.ajax({
            url: '/save/' + roomId,
            type: 'POST',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });

    $("#undo").click(function () {
        undo();
        var data = createPathObject();
        socket.emit('draw server', { roomId: roomId, data: data });
    });

    $("#redo").click(function () {
        redo();
        var data = createPathObject();
        socket.emit('draw server', { roomId: roomId, data: data });
    });

    $("#upload").on("change", function () {
        var formData = new FormData();
        formData.append("file", $("#upload")[0].files[0]);
        $.ajax({
            url: '/upload',
            type: 'POST',
            processData: false,
            contentType: false,
            dataType: 'json',
            data: formData,
            success: function (result) {
                svgElm.css({
                    'background-image': 'url(/images/' + result.result + ')',
                    'background-size': "100% 100%"
                });
                socket.emit('upload server', { roomId: roomId, data: result.result });
            }
        });
    });

    socket.on('draw user', function (msg) {
        draw(msg.data);
    });

    socket.on('clear user', function () {
        svgElm.html("");
    });

    socket.on('upload user', function (msg) {
        svgElm.css({
            'background-image': 'url(/images/' + msg.data + ')',
            'background-size': "100% 100%"
        });
    });

    function recordUndoAction() {
        var undoData = createPathObject();
        undoStack.push(undoData);
    }

    function recordRedoAction() {
        var redoData = createPathObject();
        redoStack.push(redoData);
    }

    function createPathObject() {
        var pathEle = svgElm.find("path");
        var obj = [];
        if (pathEle !== undefined) {
            for (var i = 0; i < pathEle.length; i++) {
                var d = pathEle[i].getAttribute("d");
                var fill = pathEle[i].getAttribute("fill");
                var stroke = pathEle[i].getAttribute("stroke");
                obj.push({d: d, fill: fill, stroke: stroke});
            }
        }
        return obj;
    }

    function undo() {
        if (undoStack.length === 0) return;

        recordRedoAction();

        var data = undoStack.pop();

        isUndoing = true;
        draw(data);
        isUndoing = false;
    }

    function redo() {
        if (redoStack.length === 0) return;

        recordUndoAction();

        var data = redoStack.pop();

        isRedoing = true;
        draw(data);
        isRedoing = false;
    }

    function draw(data) {
        svgElm.html("");
        for (var i = 0; i < data.length; i++) {
            var pathElm = document.createElementNS("http://www.w3.org/2000/svg", "path");
            svgElm.append(pathElm);
            svgElm.find("path:last").attr({
                "d": data[i].d,
                "fill": data[i].fill,
                "stroke": data[i].stroke,
                "stroke-width": "3",
                "stroke-linecap": "round"
            });
        }
    }
});
