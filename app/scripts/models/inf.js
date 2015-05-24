'use strict';

angular.module('nerdproxyApp')
  .factory('Inf', function (BoardInfo) {

    function Inf(modelData) {

      this.id = modelData.id;
      this.xCm = modelData.xCm;
      this.yCm = modelData.yCm;
    }


    Inf.prototype = {

      baseRadius: 1.25,

      createSnap: function(gameSnap){
        var snap = gameSnap.circle(this.xCm, this.yCm, this.baseRadius);
        snap.addClass('model inf model-id-' + this.id);
        snap.attr('data-model-id', this.id);

        this.snap = snap;
      },

      setPos: function (xCm, yCm) {

        this.xCm = xCm;
        this.yCm = yCm;

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

        var changeXPx = move.startXPx - xCm;
        var changeYPx = move.startYPx - yCm;

        var newXCm = this.xCm - BoardInfo.pxToCm(changeXPx);
        var newYCm = this.yCm - BoardInfo.pxToCm(changeYPx);

        var maxEdgeDist = this.baseRadius / 2;

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
      },

      getSyncData: function() {
        return {
          id: this.id,
          xCm: this.xCm,
          yCm: this.yCm,
          type: 'inf'
        }
      }

    };

    return (Inf);

  }
);
