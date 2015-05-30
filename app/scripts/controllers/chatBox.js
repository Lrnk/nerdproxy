'use strict';

angular.module('nerdproxyApp')
  .filter('chatDate', function () {
    return function (time) {
      return new moment(time).calendar();
    };
  })
  .controller('ChatBoxCtrl', function ($scope, $timeout, Ref) {

    var firebaseRef = Ref.child('game1/chatter');

    firebaseRef.on("child_added", function (snapshot) {
      $timeout(function() {
        $scope.chats.push(snapshot.val());
      });
    });

    angular.extend($scope, {

      chats: [],

      currentMessage: '',
      numDice: 1,
      diceValue: 6,

      sendCurrentMessage: sendCurrentMessage,
      rollDice: rollDice

    });

    function rollDice() {

      if($scope.numDice === null || $scope.diceValue === null) {
        return;
      }

      var results = [];
      for (var i = 0; i < $scope.numDice; i++) {
        results.push(Math.floor((Math.random() * $scope.diceValue) + 1));
      }

      firebaseRef.push({
        type: 'roll',
        numDice: $scope.numDice,
        diceValue: $scope.diceValue,
        results: results,
        time: new Date()
      });
    }

    function sendCurrentMessage() {
      if ($scope.currentMessage.trim().length) {

        firebaseRef.push({
          body: $scope.currentMessage,
          time: new Date()
        });
        $scope.currentMessage = '';
      }
    }
  });
