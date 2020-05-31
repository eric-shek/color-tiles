$(document).ready(function () {
  var extraMouseMode = false;
  var canvas = null;
  var mouse = null;
  var zoom = 1;
  var zoomStep = 0.05;
  var isDragMode = false;

  function zoomCanvas(isZoomIn) {
    if (isZoomIn) {
      zoom += zoomStep;
    } else {
      zoom -= zoomStep;
    }
    if (zoom >= 2) {
      zoom = 2;
      $("#plus-btn").addClass("disable");
    } else if (zoom <= 1) {
      zoom = 1;
      $("#minus-btn").addClass("disable");
    } else {
      $("#minus-btn").removeClass("disable");
      $("#plus-btn").removeClass("disable");
    }
    canvas.zoomToPoint(
      new fabric.Point(canvas.width / 2, canvas.height / 2),
      zoom
    );
    var targetWidth = 101 * zoom;
    $(".tool-bar .draggable").css("width", targetWidth.toFixed(0) + "px");
    $(".tool-bar .draggable").css("height", targetWidth.toFixed(0) + "px");
    var toolBar = $(".tool-bar");
    toolBar.width(210 * zoom);
  }

  function exitExtraMouseMode() {
    canvas.remove(mouse);
    mouse = null;
    extraMouseMode = false;
    canvas.defaultCursor = "auto";
    canvas.selection = true;
    canvas.isDrawingMode = false;
    $(".tool.mouse").addClass("disable");
  }

  function changeDragMode(enable) {
    if (enable) {
      $("#move-btn").removeClass("disable");
    } else {
      $("#move-btn").addClass("disable");
    }
    if (enable != isDragMode) {
      canvas.toggleDragMode(enable);
      isDragMode = enable;
    }
  }

  function initToolbar() {
    $("img")
      .not(".draggable")
      .on("dragstart", function (event) {
        event.preventDefault();
      });
    $(".tool.mouse").click(function () {
      changeDragMode(false);
      if (!$(this).hasClass("disable")) {
        exitExtraMouseMode();
        return;
      }
      $(".tool.mouse").addClass("disable");
      $(this).removeClass("disable");
      extraMouseMode = true;
      canvas.discardActiveObject();
      canvas.selection = false;
      canvas.isDrawingMode = false;
      // canvas.defaultCursor = "none";
      if (mouse) {
        canvas.remove(mouse);
        mouse = null;
      }
      mouse = new fabric.Image(this, {
        id: "mouse",
        selectable: false,
        hoverCursor: "none",
        left: -10000,
        top: -10000,
      });
      mouse.scaleToHeight(30);
      mouse.scaleToWidth(30);
      // mouse.moveTo(1);
      canvas.add(mouse);
      if (this.getAttribute("id") == "pencil-btn") {
        canvas.isDrawingMode = true;
      }
    });
    $("#reset-btn").click(function () {
      changeDragMode(false);
      canvas.remove(...canvas.getObjects());
      canvas.clear();
      if (extraMouseMode && mouse) {
        exitExtraMouseMode();
      }
    });
    $("#move-btn").click(function() {
      changeDragMode(!isDragMode);
    });

    $("#plus-btn").click(function() {
      zoomCanvas(true);
    })
    $("#minus-btn").click(function() {
      zoomCanvas(false);
    })
  }
  function initCanvas() {
    var grid = 10;

    var canvasContainer = $("#canvas-container")[0];
    var canvasObject = $("#canvas-container canvas")[0];
    canvas = window._canvas = new fabric.Canvas(canvasObject);
    canvas.freeDrawingCursor = "none";

    canvas.setWidth(canvasContainer.clientWidth);
    canvas.setHeight(canvasContainer.clientHeight);

    var imageOffsetX, imageOffsetY;

    function handleDragStart(e) {
      changeDragMode(false);
      if (extraMouseMode && mouse) {
        exitExtraMouseMode();
      }
      canvas.discardActiveObject();
      [].forEach.call(images, function (img) {
        img.classList.remove("img_dragging");
      });
      this.classList.add("img_dragging");

      var imageOffset = $(this).offset();
      imageOffsetX = (e.clientX - imageOffset.left) / 2;
      imageOffsetY = (e.clientY - imageOffset.top) / 2;
    }

    function handleDragOver(e) {
      if (e.preventDefault) {
        e.preventDefault();
      }
      e.dataTransfer.dropEffect = "copy";
      return false;
    }

    function handleDragEnter(e) {
      this.classList.add("over");
    }

    function handleDragLeave(e) {
      this.classList.remove("over");
    }

    function handleDrop(e) {
      e = e || window.event;
      if (e.preventDefault) {
        e.preventDefault();
      }
      if (e.stopPropagation) {
        e.stopPropagation();
      }
      var img = $(".tool-bar .draggable.img_dragging")[0];

      var offset = $(canvasObject).offset();
      // console.log(e.clientY, offset.top, canvas.viewportTransform);
      var y =
        (e.clientY - (offset.top + imageOffsetY)) / zoom -
        canvas.viewportTransform[5] / zoom;
      var x =
        (e.clientX - (offset.left + imageOffsetX)) / zoom -
        canvas.viewportTransform[4] / zoom;
      // console.log(x, zoom, e, canvas, canvas.viewportTransform);

      var newImage = new fabric.Image(img, {
        left: x,
        top: y,
      });
      newImage.scaleToWidth(101);
      newImage.scaleToHeight(101);
      // newImage.setControlsVisibility({
      //   bl: false,
      //   br: false,
      //   mt: false,
      //   mb: false,
      //   ml: false,
      //   mr: false,
      //   tl: false,
      //   tr: false,
      // });
      newImage.set({
        // cornerStyle: "circle",
        // transparentCorners: false,
        hasControls: false,
        // rotatingPointOffset: 10,
        // snapAngle: 15,
      });
      newImage.left = Math.round(newImage.left / grid) * grid;
      newImage.top = Math.round(newImage.top / grid) * grid;
      // newImage.moveTo(0);
      canvas.add(newImage);
      newImage.bringToFront();
      return false;
    }

    function handleDragEnd(e) {
      [].forEach.call(images, function (img) {
        img.classList.remove("img_dragging");
      });
    }

    var images = $(".tool-bar .draggable");
    [].forEach.call(images, function (img) {
      img.addEventListener("dragstart", handleDragStart, false);
      img.addEventListener("dragend", handleDragEnd, false);
    });
    canvasContainer.addEventListener("dragenter", handleDragEnter, false);
    canvasContainer.addEventListener("dragover", handleDragOver, false);
    canvasContainer.addEventListener("dragleave", handleDragLeave, false);
    canvasContainer.addEventListener("drop", handleDrop, false);

    canvas.on("object:moving", function (e) {
      var obj = e.target;
      var newGrid = grid;
      if (obj.angle % 90 != 0) {
        newGrid = 1;
      }
      obj.left = Math.round(obj.left / newGrid) * newGrid;
      obj.top = Math.round(obj.top / newGrid) * newGrid;
    });
    canvas.on("selection:created", (e) => {
      canvas.bringToFront(e.target);
      if (e.target.type === "activeSelection") {
        e.target.set({
          hasControls: false,
        });
      }
    });

    canvas.on("mouse:move", (opt) => {
      if (extraMouseMode) {
        var offsetX = -15;
        var offsetY = -15;
        if (canvas.isDrawingMode) {
          offsetX = 0;
          offsetY = -30;
        }
        mouse
          .set({
            top: opt.absolutePointer.y + offsetY,
            left: opt.absolutePointer.x + offsetX,
          })
          .setCoords()
          .canvas.renderAll();
      }
    });

    canvas.on("mouse:down", (opt) => {
      if (extraMouseMode && !canvas.isDrawingMode) {
        // console.log("@click", opt, canvas.viewportTransform);
        var removed = false;
        canvas
          .getObjects()
          .reverse()
          .forEach((o) => {
            if (o.id != "mouse" && !removed && o.containsPoint(opt.pointer)) {
              canvas.remove(o);
              removed = true;
            }
          });
      }
    });

    canvas.on("mouse:out", (e) => {
      if (extraMouseMode) {
        // console.log("out");
        mouse
          .set({
            top: -10000,
            left: -10000,
          })
          .setCoords()
          .canvas.renderAll();
      }
    });
    canvas.on("path:created", (e) => {
      // console.log(e);
      e.path.set({
        hasControls: false,
        // selectable: false,
        hoverCursor: "default",
      });
    });

    canvas.on("mouse:wheel", function (opt) {
      var isZoomIn = opt.e.deltaY > 0 ? false : true;
      zoomCanvas(isZoomIn);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });
  }
  initCanvas();
  initToolbar();
});
