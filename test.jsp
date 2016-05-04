<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<style>
    .w100 {
        padding-left: 0;
        padding-right: 0;
        width: 100%;
    }
    .black-text {
        color: #000000;
    }
    .rightControls ul li {
        list-style: none;
        float: left;
        padding-right: 20px;
    }
    .rightControls {
        width: 120px;
        text-align: right;
    }
    #dictionaryTable {
        margin-bottom: 80px;
    }
    #addItemControls {
        top: -110px;
        position: relative;
    }
    #addItemControls td {
        background-color: inherit !important;
    }
    .dicRow input{
        padding-bottom: 3px;
        padding-top: 0px;
        height: 34px;
    }
    .dicRow {
        height: 50px;
    }
    .dicRow span {
        padding-top:5px;
    }
</style>

<div>

    <table id="dictionaryTable" ng-table="dictionaryTableParams" class="table table-striped table-hover fixed-table"
           template-pagination="custom/pager" template-header="custom/pager_dictionaryTable">

        <script type="text/ng-template" id="custom/pager_dictionaryTable">
            <tr>
                <th style="width: 47%"></th>
                <th style="width: 47%"></th>
                <th style="width: 6%"></th>
            </tr>

            <tr class="header-for-paging">
                <th colspan="3" width="100%">
                    <div class="table-footer" ng-if="params.settings().counts.length">
                        <div class="col-xs-6 col-md-4">
                            <div class="dataTables_info">
                                <label>Показывать по
                                    <select ng-model="params.settings().pageCount"
                                            ng-options="count for count in params.settings().counts"
                                            ng-change="params.count(params.settings().pageCount)">
                                    </select>
                                    записей
                                </label>
                            </div>
                        </div>
                        <div class="col-xs-6 col-md-3">
                            <div class="dataTables_info">
                                <label class="dataTables_info">Записи с {{(params.page() - 1) *
                                    params.count() + 1}}
                                    до {{(params.page() * params.count() < params.settings().total) ? params.page() * params.count() : params.settings().total}} из {{params.settings().total}}
                                    записей</label>
                            </div>
                        </div>
                        <div class="col-xs-6 col-md-5 right">
                            <div class="dataTables_paginate paging_simple_numbers">
                                <ul class="pagination">
                                    <li ng-class="{'disabled': !page.active}" ng-repeat="page in pages"
                                        ng-switch="page.type">
                                        <a ng-switch-when="prev" ng-click="params.page(page.number)"
                                           href=""><span></span>Предыдущая</a>
                                        <a ng-switch-when="first" ng-click="params.page(page.number)"
                                           href=""><span
                                                ng-bind="page.number"></span></a>
                                        <a ng-switch-when="page" ng-click="params.page(page.number)"
                                           href=""><span
                                                ng-bind="page.number"></span></a>
                                        <a ng-switch-when="more" ng-click="params.page(page.number)"
                                           href="">
                                            &#8230;</a>
                                        <a ng-switch-when="last" ng-click="params.page(page.number)"
                                           href=""><span
                                                ng-bind="page.number"></span></a>
                                        <a ng-switch-when="next" ng-click="params.page(page.number)"
                                           href="">Следующая<span></span></a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </th>
            </tr>

            <tr>
                <th id="shortName" ng-click="updateOrder($event)" class="pointer" title="Нажмите для сортировки">Краткое наименование организации</th>
                <th id="fullName" ng-click="updateOrder($event)" class="pointer" title="Нажмите для сортировки">Полное наименование организации</th>
                <th class="rightControls"></th>
            </tr>
            <tr>
                <th><input type="text" class="form-control ng-pristine ng-valid" ng-model="filter.shortName"></th>
                <th><input type="text" class="form-control ng-pristine ng-valid" ng-model="filter.fullName"></th>
                <th></th>
            </tr>
        </script>


        <tbody>
        <tr ng-repeat="item in dictionaryItems">
            <td ng-click="showInput(item)" class="dicRow">
                <span ng-hide="activeInput.id==item.id">{{item.shortName}}</span>
                <input ng-show="activeInput.id==item.id" type="text" ng-model="newItem.shortName" class="w100" required />
            </td>
            <td ng-click="showInput(item)" class="dicRow">
                <span ng-hide="activeInput.id==item.id">{{item.fullName}}</span>
                <input ng-show="activeInput.id==item.id" type="text" ng-model="newItem.fullName" class="w100" />
            </td>
            <td class="rightControls" class="dicRow">
                <ul class="w100">
                    <li>
                        <a href="#" ng-click="deleteItem(item.id);">
                            <img class="remove-input" src="/madi-ap-web-ui/resources/images/delete.png" alt="Удалить" title="Удалить" width="15" height="18">
                        </a>

                    </li>
                    <li>
                        <a href="#" ng-click="showInput(item);" ng-hide="activeInput.id==item.id">
                            <img class="save-input" src="/madi-ap-web-ui/resources/images/edit.png" alt="Редактировать" title="Редактировать организацию" width="18" height="18">
                        </a>
                        <a href="#" ng-click="saveItem();" ng-show="activeInput.id==item.id">
                            <img class="save-input" src="/madi-ap-web-ui/resources/images/floppy-disk.png" alt="Сохранить" title="Сохранить изменения" width="18" height="18">
                        </a>
                    </li>
                </ul>
            </td>
        </tr>
        </tbody>
    </table>

    <table id="addItemControls"class="table table-striped table-hover fixed-table ng-scope ng-table">
        <tr ng-show="!showAddItemControls">
            <td style="width: 47%"></td>
            <td style="width: 47%"></td>
            <td style="width: 6%" class="rightControls">
                <ul class="w100">
                    <li>
                        <a href="#" ng-click="showAddItemControls=true">
                            <img class="save-input" src="/madi-ap-web-ui/resources/images/add.png" alt="Добавить" title="Добавить организацию" width="15" height="18">
                        </a>
                    </li>
                </ul>
            </td>
        </tr>
        <tr ng-show="showAddItemControls">
            <td style="width: 47%"><input type="text" ng-model="newItem.shortName" class="w100" required /></td>
            <td style="width: 47%"><input type="text" ng-model="newItem.fullName" class="w100" /></td>
            <td style="width: 6%" class="rightControls">
                <ul class="w100">
                    <li>
                        <a href="#" ng-click="saveItem(newItem);">
                            <img class="save-input" src="/madi-ap-web-ui/resources/images/save.png" alt="Сохранить" title="Сохранить организацию" width="15" height="18">
                        </a>
                    </li>
                    <li>
                        <a href="#" ng-click="cancel();">
                            <img class="save-input" src="/madi-ap-web-ui/resources/images/clear-icon.png" alt="Отменить" title="Отменить ввод организации" width="15" height="18">
                        </a>
                    </li>
                </ul>
            </td>
        </tr>
    </table>
</div>
