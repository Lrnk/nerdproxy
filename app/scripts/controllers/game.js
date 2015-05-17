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
    RANGE: 2,
    MOVE_SELECTION: 3
  })
  .controller('GameCtrl', function ($scope, Ref, Mode) {

    var stuff = {

      // constants
      maxBoardWidth: 1000,
      maxBoardHeight: 666,

      boardWidthCm: 182.88,
      boardHeightCm: 121.92,

      onMobile: (function onMobile() {
        try {
          document.createEvent("TouchEvent");
          return true;
        }
        catch (e) {
          return false;
        }
      })(),

      //fields

      zoomFactor: 1,
      boardWidth: 1000,
      boardHeight: 666,
      mode: Mode.DEFAULT,

      currentMessage: '',
      numDice: 1,
      diceValue: 6

    };

    angular.extend($scope, {

      stuff: stuff,

      saveState: saveState,

      toggleMoveMode: toggleMoveMode,
      toggleRangeCheckMode: toggleRangeCheckMode,
      toggleMoveSelectionMode: toggleMoveSelectionMode,
      zoomIn: zoomIn,
      zoomOut: zoomOut,

      getXSpaceForMenus: getXSpaceForMenus,
      getYSpaceForMenus: getYSpaceForMenus,

      pxToCm: pxToCm,

      Mode: Mode,

      sendCurrentMessage: sendCurrentMessage,
      rollDice: rollDice
    });

    function rollDice() {

      var results = [];
      for (var i = 0; i < stuff.numDice; i++) {
        results.push(Math.floor((Math.random() * stuff.diceValue) + 1));
      }

      if(!$scope.state.chatter) {
        $scope.state.chatter = [];
      }
      $scope.state.chatter.push({
        type: 'roll',
        numDice: stuff.numDice,
        diceValue: stuff.diceValue,
        results: results
      });
      saveState();
    }

    function sendCurrentMessage() {
      if(stuff.currentMessage.trim().length) {
        $scope.state.chatter.push({
          body: stuff.currentMessage
        });
        stuff.currentMessage = '';
        saveState();
      }
    }

    function getXSpaceForMenus() {
      return 0;
    }

    function getYSpaceForMenus() {
      return stuff.selectedModelIds && stuff.selectedModelIds.length ? 250 : 200;
    }

    function pxToCm(px) {
      return px * ((stuff.boardWidthCm / stuff.boardWidth) / stuff.zoomFactor);
    }

    function toggleMoveMode() {
      if (stuff.mode === Mode.MOVE_VIEW) {
        stuff.mode = Mode.DEFAULT;
      } else {
        stuff.mode = Mode.MOVE_VIEW;
      }
    }

    function toggleMoveSelectionMode() {
      if (stuff.mode === Mode.MOVE_SELECTION) {
        stuff.mode = Mode.DEFAULT;
      } else {
        stuff.mode = Mode.MOVE_SELECTION;
      }
    }

    function toggleRangeCheckMode() {
      if (stuff.mode === Mode.RANGE) {
        stuff.mode = Mode.DEFAULT;
      } else {
        stuff.mode = Mode.RANGE;
      }
    }

    function zoomIn() {

      if (stuff.mode === Mode.MOVE_VIEW) {
        stuff.zoomFactor *= 1.5;
      }
    }

    function zoomOut() {
      if (stuff.mode === Mode.MOVE_VIEW) {
        stuff.zoomFactor /= 1.5;
        stuff.zoomFactor = Math.max(stuff.zoomFactor, 1);
      }
    }


    //data yo

    Ref.on('value', function (snapshot) {
      $scope.state = snapshot.val()['game1'];
      $scope.$broadcast('refreshState');
    });

    function saveState() {
      Ref.child('game1').set(angular.fromJson(angular.toJson($scope.state)));
    }

  });
