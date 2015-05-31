'use strict';

angular.module('nerdproxyApp')
  .factory('LargeInf', function (Inf) {

    function LargeInf(modelId, modelData) {
      Inf.call(this, modelId, modelData);
    }

    LargeInf.prototype = Object.create(Inf.prototype);

    _.extend(LargeInf.prototype, {

      constructor: LargeInf,

      baseRadius: 2

    });

    return (LargeInf);

  }
);
