var demoApp = angular.module("demoApp", ['ngMessages']);

demoApp.controller("Controller",
    ['$scope', '$timeout',
        function ($scope, $timeout) {
            $scope.messages = [
                {code: 'required', message: 'Поле обязательное для заполнения'},
                {code: 'validateInn', message: 'Это не ИНН'},
                {code: 'cyrilic', message: 'Нерусский?'}
            ];

            $scope.showTooltip = function (id) {
                $(document.getElementsByClassName("validation-tooltip")).removeClass("hovered");
                angular.element(document.getElementById(id)).addClass("hovered");
            };

            $scope.formSubmit = function () {
                console.log($scope.userForm.name.$error);
                $scope.config = {
                    messages: $scope.messages
                };
            };

        }
    ]);

demoApp.directive('madiValidator', function ($compile) {
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {errors: '=madiValidator'},
        link: function (scope, elem, attr, modelCtrl) {
            var template = angular.element(
                '<div ng-messages="formValidator.$error">' +
                '   <div ng-message-exp="error.code" ng-repeat="error in errors">{{error.message}}</div>' +
                '</div>');

            var validators = {
                required: requiredValidator,
                cyrilic: cyrilicValidator
            };

            angular.forEach(scope.errors, function (error) {
                var validator = validators[error.code];
                if (validator) {
                    modelCtrl.$validators[error.code] = validator;
                }
            });

            scope.formValidator = modelCtrl;
            elem.after(template);
            $compile(template)(scope);

            function requiredValidator(modelValue, viewValue) {
                return modelValue != undefined && modelValue != "";
            }
            function cyrilicValidator(modelValue, viewValue) {
                return /^[А-ЯЁа-яё]+$/.test(modelValue);
            }
        }
    }
});



