'use strict';

angular.module('nerdproxyApp')
  .factory('Tank', function (BoardInfo, Model) {

    function Tank(modelData) {

      Model.call(this);

      this.id = modelData.id;
      this.xCm = window.parseInt(modelData.xCm);
      this.yCm = window.parseInt(modelData.yCm);
      this.rotation = window.parseInt(modelData.rotation);
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
        snap.attr('transform', 'rotate(' + this.rotation + ' ' + (this.xCm + (this.w / 2)) + ' ' + (this.yCm + (this.h / 2)) + ')');

        this.snap = snap;
      },

      setPos: function (xCm, yCm) {

        this.xCm = xCm;
        this.yCm = yCm;

        this.snap.attr('x', xCm);
        this.snap.attr('y', yCm);
        this.snap.attr('transform', 'rotate(' + this.rotation + ' ' + (xCm + (this.w / 2)) + ' ' + (yCm + (this.h / 2)) + ')');

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
        move.ghostSnap.attr('transform', 'rotate(' + this.rotation + ' ' + (newXCm + (this.w / 2)) + ' ' + (newYCm + (this.h / 2)) + ')');


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
          rotation: this.rotation,
          type: 'tank'
        }
      }

    });

    return (Tank);

  }
);
