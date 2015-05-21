'use strict';

angular.module('nerdproxyApp')
  .factory('Inf', function (BoardInfo) {

    var baseRadius = 1.25;

    function Inf(modelData, gameSnap) {

      var snap = gameSnap.circle(modelData.xCm, modelData.yCm, baseRadius);
      snap.addClass('model inf model-id-' + modelData.id);
      snap.attr('data-model-id', modelData.id);

      this.modelData = modelData;
      this.snap = snap;
      this.id = modelData.id;
      this.xCm = modelData.xCm;
      this.yCm = modelData.yCm;
    }


    Inf.prototype = {

      setPos: function (xCm, yCm) {

        this.modelData.xCm = xCm;
        this.modelData.yCm = yCm;

        this.snap.attr('cx', xCm);
        this.snap.attr('cy', yCm);
      },

      startMove: function (xPx, yPx) {
        var ghostSnap = this.snap.clone();
        ghostSnap.addClass('move-shadow');

        this.moveInProgress = {
          ghostSnap: ghostSnap,
          startXPx: xPx,
          startYPx: yPx
        }
      },

      continueMove: function (xCm, yCm) {

        var move = this.moveInProgress;
        var modelData = this.modelData;

        var changeXPx = move.startXPx - xCm;
        var changeYPx = move.startYPx - yCm;

        var newXCm = modelData.xCm - BoardInfo.pxToCm(changeXPx);
        var newYCm = modelData.yCm - BoardInfo.pxToCm(changeYPx);

        var maxEdgeDist = baseRadius / 2;

        newXCm = Math.max(newXCm, maxEdgeDist);
        newXCm = Math.min(newXCm, BoardInfo.widthCm - maxEdgeDist);

        newYCm = Math.max(newYCm, maxEdgeDist);
        newYCm = Math.min(newYCm, BoardInfo.heightCm - maxEdgeDist);

        move.ghostSnap.attr('cx', newXCm);
        move.ghostSnap.attr('cy', newYCm);

      },

      endMove: function () {
        var ghostSnap = this.moveInProgress.ghostSnap;
        this.setPos(ghostSnap.attr('cx'), ghostSnap.attr('cy'));
        ghostSnap.remove();

        this.moveInProgress = undefined;
      },

      select: function () {
        this.snap.addClass('selected');
      },

      deselect: function () {
        this.snap.removeClass('selected');
      }

    };

    return (Inf);

  }
);
