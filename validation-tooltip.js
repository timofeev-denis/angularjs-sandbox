var demoApp = angular.module("demoApp", ['ngMessages']);

demoApp.controller("Controller",
    ['$scope', '$timeout',
        function ($scope, $timeout) {
            $scope.user = {};
            $scope.validation = false;
            $scope.messages = [
                //{type: 'email', text: 'Некорректная информация'},
                {type: 'required', text: 'Поле обязательное для заполнения'}
            ];

            $scope.showTooltip = function (id) {
                $(document.getElementsByClassName("validation-tooltip")).removeClass("hovered");
                angular.element(document.getElementById(id)).addClass("hovered");
            };

            $scope.formSubmit = function () {
                $scope.validation = true;
                $timeout(function () {
                    var x = document.getElementsByClassName("has-error");
                    if (x.length > 0) {
                        $scope.showTooltip(x[0].id);
                    }
                }, 300);
            };

        }
    ]);

demoApp.directive('uiValidationMessages', function ($compile) {
    return {

        scope: {
            messages: '=',
            form: '=',
            validation: '='
        },

        replace: true,
        templateUrl: 'messages-template.html',
        link: function ($scope, $element, $attrs) {
            wrapper = angular.element(document.getElementById($attrs.wrapperId));
            wrapper.attr("ng-mouseleave", "onMouseLeave($event)");
            wrapper.attr("ng-mouseenter", "onMouseEnter($event)");

            $scope.onMouseLeave = function ($event) {
                angular.element(document.getElementById($event.currentTarget.id)).removeClass("hovered");
            };

            $scope.onMouseEnter = function ($event) {
                $(document.getElementsByClassName("validation-tooltip")).removeClass("hovered");
                angular.element(document.getElementById($event.currentTarget.id)).addClass("hovered");
            };

            $compile(wrapper)($scope);
        }
    }
});
demoApp.directive('uiValidationMessage', function () {
    return {
        scope: {
            message: "="
        },
        replace: true,
        require: '^^uiValidationMessages',
        templateUrl: 'message-template.html'
    }
});
