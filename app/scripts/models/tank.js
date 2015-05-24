'use strict';

angular.module('nerdproxyApp')
  .factory('Tank', function (BoardInfo, Model) {

    function Tank(modelData) {

      Model.call(this);

      this.id = modelData.id;
      this.xCm = modelData.xCm;
      this.yCm = modelData.yCm;
    }

    Tank.prototype = Object.create(Model.prototype);

    _.extend(Tank.prototype, {

      constructor: Tank,

      w: 8,
      h: 12,

      createSnap: function (gameSnap) {

        var snap = gameSnap.rect(this.xCm, this.yCm, this.w, this.h, 0.5);
        snap.addClass('model tank');
        snap.attr('data-model-id', this.id);

        this.snap = snap;
      },

      setPos: function (xCm, yCm) {

        this.xCm = xCm;
        this.yCm = yCm;

        this.snap.attr('x', xCm);
        this.snap.attr('y', yCm);
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

      continueMove: function (xPx, yPx) {

        var move = this.moveInProgress;

        var changeXPx = move.startXPx - xPx;
        var changeYPx = move.startYPx - yPx;

        var newXCm = this.xCm - BoardInfo.pxToCm(changeXPx);
        var newYCm = this.yCm - BoardInfo.pxToCm(changeYPx);

        var maxEdgeDist = {
          left: 0,
          right: this.w,
          top: 0,
          bottom: this.h
        };

        newXCm = Math.max(newXCm, maxEdgeDist.left);
        newXCm = Math.min(newXCm, BoardInfo.widthCm - maxEdgeDist.right);

        newYCm = Math.max(newYCm, maxEdgeDist.top);
        newYCm = Math.min(newYCm, BoardInfo.heightCm -maxEdgeDist.bottom);

        move.ghostSnap.attr('x', newXCm);
        move.ghostSnap.attr('y', newYCm);

      },

      endMove: function () {
        var ghostSnap = this.moveInProgress.ghostSnap;
        this.setPos(ghostSnap.attr('x'), ghostSnap.attr('y'));
        ghostSnap.remove();

        this.moveInProgress = undefined;
      },

      getSyncData: function () {
        return {
          id: this.id,
          xCm: this.xCm,
          yCm: this.yCm,
          type: 'tank'
        }
      }

    });

    return (Tank);

  }
);
