'use strict';

/**
 * @ngdoc function
 * @name nerdproxyApp.controller:GameCtrl
 * @description
 * # GameCtrl
 * Controller of the nerdproxyApp
 */
angular.module('nerdproxyApp')
  .controller('GameCtrl', function ($scope, Ref) {

    var stuff = {

      // constants
      maxBoardWidth: 1000,
      maxBoardHeight: 666,

      boardWidthCm: 182.88,
      boardHeightCm: 121.92,

      //fields

      moveModeOn: false,
      zoomFactor: 1,
      boardWidth: 1000,
      boardHeight: 666

    };

    angular.extend($scope, {

      stuff: stuff,

      saveState: saveState,

      toggleMoveMode: toggleMoveMode,
      zoomIn: zoomIn,
      zoomOut: zoomOut,

      pxToCm: pxToCm
    });

    function pxToCm(px){
      return px * ((stuff.boardWidthCm / stuff.boardWidth) / stuff.zoomFactor);
    }

    function toggleMoveMode() {
      stuff.moveModeOn = !stuff.moveModeOn;
    }

    function zoomIn() {

      if(stuff.moveModeOn) {
        stuff.zoomFactor *= 1.5;
      }
    }

    function zoomOut() {
      if(stuff.moveModeOn) {
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
