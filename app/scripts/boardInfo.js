'use strict';

angular.module('nerdproxyApp').
  service('BoardInfo', function () {

    var maxWidthPx = 1000;
    var maxHeightPx = 666;

    var widthPx = 1000;
    var heightPx = 666;

    var widthCm = 182.88;
    var heightCm = 121.92;

    var zoomFactor = 1;


    return {
      maxWidthPx: maxWidthPx,
      maxHeightPx: maxHeightPx,

      widthPx: widthPx,
      heightPx: heightPx,

      widthCm: widthCm,
      heightCm: heightCm,

      zoomFactor: zoomFactor,

      pxToCm: pxToCm
    };


    function pxToCm(px) {
      return px * ((widthCm / widthPx) / zoomFactor);
    }

  });
