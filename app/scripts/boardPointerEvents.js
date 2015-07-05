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
     * @param pointerMoveAction
     * @param pointerUpAction
     * @param options: spaceForThumb
     */
    function addEvent(pointerDownAction, pointerMoveAction, pointerUpAction, options) {

      options = options ? options: {};

      $document.on('mousedown', pointerDown);
      $document.on('touchstart', pointerDown);

      function pointerDown(e) {

        var pointerPosXPx = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.pageX;
        var pointerPosYPx = e.originalEvent.touches ? e.originalEvent.touches[0].clientY : e.pageY;

        $document.on('mousemove', pointerMove);
        $document.on('mouseup', pointerUp);

        $document.on('touchmove', pointerMove);
        $document.on('touchend', pointerUp);
        $document.on('touchcancel', pointerUp);


        pointerDownAction(_.extend(e, {

          startPageXPx: pointerPosXPx - BoardInfo.getOffsetPx().left,
          startPageYPx: pointerPosYPx - BoardInfo.getOffsetPx().top

        }));

      }

      function pointerMove(e) {

        var pointerPosXPx = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.pageX;
        var pointerPosYPx;

        if(options.spaceForThumb) {
          pointerPosYPx = e.originalEvent.touches ? e.originalEvent.touches[0].clientY - spaceForThumb : e.pageY;
        } else {
          pointerPosYPx = e.originalEvent.touches ? e.originalEvent.touches[0].clientY : e.pageY;
        }

        pointerMoveAction(_.extend(e, {

          pointerPosXPx: pointerPosXPx - BoardInfo.getOffsetPx().left,
          pointerPosYPx: pointerPosYPx - BoardInfo.getOffsetPx().top

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
