'use strict';

angular.module('nerdproxyApp')
  .factory('LargeInf', function (Inf) {

    function LargeInf(modelData) {
      Inf.call(this, modelData);
    }

    LargeInf.prototype = Object.create(Inf.prototype, {
      baseRadius: {
        value: 2
      },

      getSyncData: {
        value: function () {
          return {
            id: this.id,
            xCm: this.xCm,
            yCm: this.yCm,
            type: 'largeInf'
          }
        }
      }
    });

    LargeInf.prototype.constructor = LargeInf;

    return (LargeInf);

  }
);
