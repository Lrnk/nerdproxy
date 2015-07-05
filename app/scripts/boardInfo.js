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
      snap: undefined, // set by gameview directive
      gameScroll: undefined, // set by gameview directive

      setGameScroll: setGameScroll,
      pxToCm: pxToCm,
      getOffsetPx: getOffsetPx

    };

    return boardInfo;


    function pxToCm(px) {
      return px * ((boardInfo.widthCm / boardInfo.widthPx) / boardInfo.zoomFactor);
    }

    function setGameScroll(_gameScroll_) {
      boardInfo.gameScroll = _gameScroll_;
    }

    function getOffsetPx() {

      var boardWrapperElem = $('.game-view-wrapper')[0];

      return {
        left: boardWrapperElem.offsetLeft + boardInfo.gameScroll.x,
        top: boardWrapperElem.offsetTop + boardInfo.gameScroll.y
      }
    }

  });
