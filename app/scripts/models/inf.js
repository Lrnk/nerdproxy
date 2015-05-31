'use strict';

angular.module('nerdproxyApp')
  .factory('Inf', function (BoardInfo, Model) {

    function Inf(modelId, modelData) {

      Model.call(this, modelId, modelData);

      this.id = modelId;
      this.xCm = modelData.xCm;
      this.yCm = modelData.yCm;

      var snap = BoardInfo.snap.circle(this.xCm, this.yCm, this.baseRadius);
      snap.addClass('model inf model-id-' + this.id);
      snap.attr('data-model-id', this.id);
      snap.attr('fill', this.colour);

      this.snap = snap;

    }

    Inf.prototype = Object.create(Model.prototype);

    _.extend(Inf.prototype, {

      constructor: Inf,

      baseRadius: 1.25,

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
        this.firebaseRef.update({
          xCm: ghostSnap.attr('cx'),
          yCm: ghostSnap.attr('cy')
        });
        ghostSnap.remove();
        this.moveInProgress = undefined;
      }

    });

    return (Inf);

  }
);
