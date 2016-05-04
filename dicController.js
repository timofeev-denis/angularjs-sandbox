angular.module('claim.controllers')
    .controller('dictionaryController',
    [
        '$rootScope', '$scope', '$sce', 'claimServices', 'ngTableParams',
        function($rootScope, $scope, $sce, claimServices, ngTableParams) {
            $scope.newItem = {};
            $scope.showAddItemControls = false;
            $scope.hasServerSideError = false;
            $scope.activeInput = {
                id: 0
            };
            $scope.filter = {
                shortName: '',
                fullName: '',
                pager: {
                    start: 1,
                    count: 10,
                    sortBy: 'shortName',
                    sortOrder: 'asc'
                }
            };

            $scope.updateData = function(newValue, oldValue) {
                if(newValue === oldValue) {
                    return;
                }
                $scope.filter.pager.start = 1;
                $scope.dictionaryTableParams.$params.page = $scope.filter.pager.start;
                $scope.dictionaryTableParams.reload();
            };

            $scope.$watch('filter.shortName', $scope.updateData);
            $scope.$watch('filter.fullName', $scope.updateData);



            $scope.getDeleteDialog = function (id) {
                $scope.deleteDialog = $rootScope.createDeleteDialog({
                    deleteCallback: function (dialogLnk) {
                        claimServices.deleteDictionaryItem(id).then(function(response) {
                            dialogLnk.dialog('close');
                            $scope.dictionaryTableParams.reload();
                        }, function(error) {
                            dialogLnk.dialog('close');
                            $scope.showErrorMessage(error);
                        });
                    },
                    deleteMessage: 'Вы уверены, что хотите удалить запись?'
                });
                return $scope.deleteDialog;
            };

            $scope.deleteItem = function(id) {
                $scope.dismissErrorMessage();
                $scope.getDeleteDialog(id).dialog('open');
            };

            $scope.getErrorMainMessage = function(error) {
                // Список ошибок отсутствует либо пуст
                if(error.errors == undefined || error.errors.length == 0) {
                    $scope.hasErrorDetails = false;
                } else {
                    $scope.hasErrorDetails = true;
                }
                var err = error.errors[0];
                switch (err.code) {
                    case "2292":
                        var result = "Не удалось удалить организацию, поскольку она уже используется";
                        if(err.defaultMessage.indexOf("FK_CP_DCEOR_ERQ") > 0) {
                            result += " в обращении";
                        }
                        result += ".";
                        return result;
                    default:
                        return "При выполнении операции произошла ошибка.";
                }
                return "При выполнении операции произошла ошибка.";
            };

            $scope.getErrorDetails = function(error) {

                var details = "";
                for (var i = 0; i < error.errors.length; i++) {
                    details += error.errors[i].defaultMessage;
                }
                return details;
            };

            $scope.showErrorMessage = function(error) {
                $scope.hasServerSideError = true;
                $scope.hasErrorDetails = false;

                // error - простая строка
                if (typeof error === 'string') {
                    $scope.trustedHtml += "<p>" + error + "</p>";
                    $scope.dictionaryErrorMessage = $sce.trustAsHtml($scope.trustedHtml);
                    return;
                }

                // error содержит список ошибок
                $scope.trustedHtml = $scope.getErrorMainMessage(error);
                $scope.dictionaryErrorMessage = $sce.trustAsHtml($scope.trustedHtml);

                $scope.trustedHtml = $scope.getErrorDetails(error);
                $scope.dictionaryErrorDetails = $sce.trustAsHtml($scope.trustedHtml);
            };

            $scope.saveItem = function() {
                $scope.dismissErrorMessage();
                $scope.activeInput.id = 0;
                if($scope.newItem.shortName == undefined || $scope.newItem.shortName == "" || $scope.newItem.shortName.$invalid) {
                    console.log("Заполните поле 'Краткое наименование'");
                    $scope.showErrorMessage('Заполните поле "Краткое наименование"');
                    return false;
                }
                claimServices.updateDictionaryItem($scope.newItem).then(function (response) {
                    $scope.newItem.shortName = "";
                    $scope.newItem.fullName = "";
                    $scope.newItem.id = undefined;
                    $scope.dictionaryTableParams.reload();
                }, function (error) {
                    //console.log("[CONTROLLER] saveItem error response: ", error);
                    $scope.showErrorMessage(error);
                });

            };

            $scope.cancel = function() {
                $scope.dismissErrorMessage();
                $scope.showAddItemControls = false;
                console.log($scope.showAddItemControls);
                try {
                    $scope.newItem.shortName = "";
                    $scope.newItem.fullName = "";
                } catch(err) {}
            };

            $scope.$on('loadDictionary', function(event, data) {
                $scope.dictionaryTableParams.$params.page = 1;
                $scope.dictionaryTableParams.reload();
            });

            $scope.dismissErrorMessage = function() {
                $scope.hasServerSideError = false;
                $scope.trustedHtml = "";
                $scope.dictionaryErrors = $sce.trustAsHtml($scope.trustedHtml);
            };

            $scope.updateOrder = function ($event) {
                var oldSortBy = $scope.dictionaryTableParams.$params.sorting.sortBy;
                var newSortBy = $event.currentTarget.id;
                if (oldSortBy == newSortBy) {
                    // Изменяем направление сортировки
                    var oldSortOrder = $scope.dictionaryTableParams.$params.sorting.sortOrder.toLowerCase();
                    var newSortOrder = "";
                    if(oldSortOrder == "asc") {
                        newSortOrder = "desc";
                    } else {
                        newSortOrder = "asc";
                    }
                    $scope.dictionaryTableParams.$params.sorting.sortOrder = newSortOrder;
                } else {
                    // Изменяем колонку по которой выполняется сортировка
                    $scope.dictionaryTableParams.$params.sorting.sortBy = newSortBy;
                }
            };

            $scope.showInput = function(item) {
                if($scope.activeInput.id == item.id) {
                    return true;
                }
                $scope.activeInput.id = item.id;
                $scope.newItem = {
                    id: item.id,
                    shortName: item.shortName,
                    fullName: item.fullName
                };
            };

            var count = 10;
            $scope.dictionaryTableParams = new ngTableParams({
                page: $scope.filter.pager.start,
                count: $scope.filter.pager.count,
                sorting: {
                    sortBy: $scope.filter.pager.sortBy,
                    sortOrder: $scope.filter.pager.sortOrder
                },
                filter: 1
            }, {
                counts: [10, 25, 50, 100],
                pageCount: count,
                getData: function ($defer, params) {
                    $scope.dismissErrorMessage();
                    $scope.filter.pager.start = (params.page() - 1) * params.count();
                    $scope.filter.pager.count = params.count();
                    $scope.filter.pager.sortBy = params.sorting().sortBy;
                    $scope.filter.pager.sortOrder = params.sorting().sortOrder;
                    claimServices.getDictionaryItems($scope.filter).then(function (response) {
                        $scope.dictionaryItems = response.content;
                        params.total(response.total);
                        $defer.resolve($scope.dictionaryItems);
                    }, function (error) {
                        $scope.showErrorMessage(error);
                    });
                }
            });
        }
    ]);