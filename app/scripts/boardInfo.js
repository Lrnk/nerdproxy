'use strict';

angular.module('nerdproxyApp').
  service('BoardInfo', function () {

    var boardInfo = {
      maxWidthPx: 1000,
      maxHeightPx: 666,

      widthPx: 1000,
      heightPx: 666,

      widthCm: 182.88,
      heightCm: 121.92,

      zoomFactor: 1,

      pxToCm: pxToCm

    };

    return boardInfo;



    function pxToCm(px) {
      return px * ((boardInfo.widthCm / boardInfo.widthPx) / boardInfo.zoomFactor);
    }

  });
