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
    MOVE_SELECTION: 3,
    ROTATE: 4
  })
  .filter('chatDate', function () {
    return function (time) {
      return new moment(time).calendar();
    };
  })
  .controller('GameCtrl', function ($scope, Ref, Mode, BoardInfo) {

    var stuff = {

      onMobile: (function onMobile() {
        try {
          document.createEvent("TouchEvent");
          return true;
        }
        catch (e) {
          return false;
        }
      })(),

      mode: Mode.DEFAULT,

      currentMessage: '',
      numDice: 1,
      diceValue: 6,

      models: []

    };

    angular.extend($scope, {

      stuff: stuff,
      BoardInfo: BoardInfo,

      saveState: saveState,

      toggleMoveMode: toggleMoveMode,
      toggleRangeCheckMode: toggleRangeCheckMode,
      toggleMoveSelectionMode: toggleMoveSelectionMode,
      toggleRotateMode: toggleRotateMode,
      zoomIn: zoomIn,
      zoomOut: zoomOut,

      getXSpaceForMenus: getXSpaceForMenus,
      getYSpaceForMenus: getYSpaceForMenus,

      Mode: Mode,

      sendCurrentMessage: sendCurrentMessage,
      rollDice: rollDice
    });

    function rollDice() {

      if(stuff.numDice === null || stuff.diceValue === null) {
        return;
      }

      var results = [];
      for (var i = 0; i < stuff.numDice; i++) {
        results.push(Math.floor((Math.random() * stuff.diceValue) + 1));
      }

      if (!$scope.state.chatter) {
        $scope.state.chatter = [];
      }
      $scope.state.chatter.push({
        type: 'roll',
        numDice: stuff.numDice,
        diceValue: stuff.diceValue,
        results: results,
        time: new Date()
      });
      saveState();
    }

    function sendCurrentMessage() {
      if (stuff.currentMessage.trim().length) {
        $scope.state.chatter.push({
          body: stuff.currentMessage,
          time: new Date()
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

    function toggleRotateMode() {
      if (stuff.mode === Mode.ROTATE) {
        stuff.mode = Mode.DEFAULT;
      } else {
        stuff.mode = Mode.ROTATE;
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
        BoardInfo.zoomFactor *= 1.5;
      }
    }

    function zoomOut() {
      if (stuff.mode === Mode.MOVE_VIEW) {
        BoardInfo.zoomFactor /= 1.5;
        BoardInfo.zoomFactor = Math.max(BoardInfo.zoomFactor, 1);
      }
    }


    //data yo

    Ref.on('value', function (snapshot) {
      $scope.state = snapshot.val()['game1'];
      $scope.$broadcast('refreshState');
    });

    // todo make stuff so it only sends what's changed
    function saveState(models) {

      $scope.state.models = models;

      Ref.child('game1').set(angular.fromJson(angular.toJson($scope.state)));
    }

  });
