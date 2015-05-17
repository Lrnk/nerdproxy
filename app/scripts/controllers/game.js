'use strict';

/**
 * @ngdoc function
 * @name nerdproxyApp.controller:GameCtrl
 * @description
 * # GameCtrl
 * Controller of the nerdproxyApp
 */
angular.module('nerdproxyApp')
  .constant('Mode', {
    DEFAULT: 0,
    MOVE_VIEW: 1,
    RANGE: 2
  })
  .controller('GameCtrl', function ($scope, Ref, Mode) {

    var stuff = {

      // constants
      maxBoardWidth: 1000,
      maxBoardHeight: 666,

      boardWidthCm: 182.88,
      boardHeightCm: 121.92,

      //fields

      zoomFactor: 1,
      boardWidth: 1000,
      boardHeight: 666,
      mode: Mode.DEFAULT

    };

    angular.extend($scope, {

      stuff: stuff,

      saveState: saveState,

      toggleMoveMode: toggleMoveMode,
      toggleRangeCheckMode: toggleRangeCheckMode,
      zoomIn: zoomIn,
      zoomOut: zoomOut,

      pxToCm: pxToCm,

      Mode: Mode
    });

    function pxToCm(px){
      return px * ((stuff.boardWidthCm / stuff.boardWidth) / stuff.zoomFactor);
    }

    function toggleMoveMode() {
      if(stuff.mode === Mode.MOVE_VIEW) {
        stuff.mode = Mode.DEFAULT;
      } else {
        stuff.mode = Mode.MOVE_VIEW;
      }
    }

    function toggleRangeCheckMode() {
      if(stuff.mode === Mode.RANGE) {
        stuff.mode = Mode.DEFAULT;
      } else {
        stuff.mode = Mode.RANGE;
      }
    }

    function zoomIn() {

      if(stuff.mode === Mode.MOVE_VIEW) {
        stuff.zoomFactor *= 1.5;
      }
    }

    function zoomOut() {
      if(stuff.mode === Mode.MOVE_VIEW) {
        stuff.zoomFactor /= 1.5;
        stuff.zoomFactor = Math.max(stuff.zoomFactor, 1);
      }
    }


    //data yo

    Ref.on('value', function(snapshot) {
      $scope.state = snapshot.val()['game1'];
      $scope.$broadcast('refreshState');
    });

    function saveState() {
      Ref.child('game1').set($scope.state);
    }

  });
