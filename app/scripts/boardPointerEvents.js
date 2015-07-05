'use strict';

angular.module('nerdproxyApp').
  service('BoardPointerEvents', function ($document, BoardInfo) {

    var spaceForThumb = 50;

    return {
      addEvent: addEvent

    };

    /**
     *
     * @param pointerDownAction
     * @param checkThisEvent
     * @param pointerMoveAction
     * @param pointerUpAction
     * @param options: spaceForThumbStart, spaceForThumbMove
     */
    function addEvent(pointerDownAction, checkThisEvent, pointerMoveAction, pointerUpAction, options) {

      options = options ? options : {};

      $document.on('mousedown', pointerDown);
      $document.on('touchstart', pointerDown);

      var startPageXPx;
      var startPageYPx;

      function pointerDown(e) {

        if (checkThisEvent(e)) {

          var pointerPosXPx = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.pageX;
          var pointerPosYPx;

          if (options.spaceForThumbStart) {
            pointerPosYPx = e.originalEvent.touches ? e.originalEvent.touches[0].clientY - spaceForThumb : e.pageY;
          } else {
            pointerPosYPx = e.originalEvent.touches ? e.originalEvent.touches[0].clientY : e.pageY;
          }

          $document.on('mousemove', pointerMove);
          $document.on('mouseup', pointerUp);

          $document.on('touchmove', pointerMove);
          $document.on('touchend', pointerUp);
          $document.on('touchcancel', pointerUp);

          startPageXPx = pointerPosXPx - BoardInfo.getOffsetPx().left;
          startPageYPx = pointerPosYPx - BoardInfo.getOffsetPx().top;

          pointerDownAction(_.extend(e, {

            startPageXPx: startPageXPx,
            startPageYPx: startPageYPx

          }));

        }

      }

      function pointerMove(e) {

        var offsetLeft = BoardInfo.getOffsetPx().left;
        var offsetTop = BoardInfo.getOffsetPx().top;

        var pointerPosXPx = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.pageX;
        var pointerPosYPx;

        if (options.spaceForThumbMove) {
          pointerPosYPx = e.originalEvent.touches ? e.originalEvent.touches[0].clientY - spaceForThumb : e.pageY;
        } else {
          pointerPosYPx = e.originalEvent.touches ? e.originalEvent.touches[0].clientY : e.pageY;
        }

        pointerMoveAction(_.extend(e, {

          posChangeXPx: startPageXPx - (pointerPosXPx - offsetLeft),
          posChangeYPx: startPageYPx - (pointerPosYPx - offsetTop),

          pointerPosXPx: pointerPosXPx - offsetLeft,
          pointerPosYPx: pointerPosYPx - offsetTop

        }));

      }

      function pointerUp(e) {

        $document.off('mousemove', pointerMove);
        $document.off('mouseup', pointerUp);

        $document.off('touchmove', pointerMove);
        $document.off('touchend', pointerUp);
        $document.off('touchcancel', pointerUp);

        pointerUpAction(e);

      }

    }

  }
);
