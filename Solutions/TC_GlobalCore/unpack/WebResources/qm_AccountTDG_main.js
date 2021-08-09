﻿///<reference path="../../Utilities/GlobalHelper.js"/>
///<reference path="../../Utilities/questionnaireFunctions.js"/>

var AccountTDGmain = (function (window, document) {

     //variables
    var formType;
     //optionset value: form name
    var formMapping = {
        "948010001": "TDG Site Profile",
        "948010000": "TDG Organizations",
    };

    const FIELD_LEGAL_NAME = "ovs_legalname";
    const FIELD_OPERATING_NAME = "name";
    const STREET1 = "address1_line1";
    const CITY = "address1_city";
    const STATE_PROVINCE = "address1_stateorprovince";
    const ZIP_POSTALCODE = "address1_postalcode";
    const COUNTRY = "address1_country";


    //********************private methods*******************

    function getViolationHistory(formContext) {

        var parameters = {};
        parameters.accountid = formContext.data.entity.getId().replace("{", "").replace("}", "");

        var ovs_ViolationsHistoryPostRequest = {
            accountid: parameters.accountid,

            getMetadata: function () {
                return {
                    boundParameter: null,
                    parameterTypes: {
                        "accountid": {
                            "typeName": "Edm.String",
                            "structuralProperty": 1
                        }
                    },
                    operationType: 0,
                    operationName: "ovs_ViolationsHistoryPost"
                };
            }
        };

        Xrm.WebApi.online.execute(ovs_ViolationsHistoryPostRequest).then(
            function success(result) {
                if (result.ok) {
                    //var results = JSON.parse(result.responseText);

                    result.text().then(function (i) {
                        var data = JSON.parse(i);
                        if (data != null || typeof data !== 'undefined') {

                            if (data.violationsHistory != null && typeof data.violationsHistory !== 'undefined' && data.violationsHistory != "") {
                                window.top.localStorage.setItem('_violationsHistory', data.violationsHistory);
                            }
                        }
                    }, function (error) {
                            console.log("getViolationHistory error: " + error.message);
                    });

                    //result.json().then(function (i) {
                    //    var data = i;
                    //    if (data != null || typeof data !== 'undefined') {

                    //        if (data.violationsHistory != null && typeof data.violationsHistory !== 'undefined' && data.violationsHistory != "") {
                    //            window.top.localStorage.setItem('_violationsHistory', data.violationsHistory);
                    //        }
                    //    }
                    //}, function (error) {
                    //        console.log("getViolationHistory error: " + error.message);
                    //});
                    
                }
            },
            function (error) {
                console.log("getViolationHistory error: " + error.message);
            }
        );

    }

    function hideAllActionTypeSections(formContext) {
        
        glHelper.SetRequiredLevel(formContext, FIELD_OPERATING_NAME, true);
        glHelper.SetRequiredLevel(formContext, FIELD_LEGAL_NAME, true);

        glHelper.SetRequiredLevel(formContext, STREET1, true);
        glHelper.SetRequiredLevel(formContext, CITY, true);
        glHelper.SetRequiredLevel(formContext, STATE_PROVINCE, true);
        glHelper.SetRequiredLevel(formContext, ZIP_POSTALCODE, true);
        glHelper.SetRequiredLevel(formContext, COUNTRY, true);

    }

    //********************private methods end***************

    //********************public methods***************
    return {


        OnLoad: function (executionContext) {

            var formContext = executionContext.getFormContext();

            // 0 = Undefined, 1 = Create, 2 = Update, 3 = Read Only, 4 = Disabled, 6 = Bulk Edit
            formType = glHelper.GetFormType(formContext);
            
            var rTypeCode = formContext.getAttribute("customertypecode");
            rTypeCode.removeOnChange(AccountTDGmain.relationShip_OnChange); // avoid binding multiple event handlers
            rTypeCode.addOnChange(AccountTDGmain.relationShip_OnChange);

            if (formType > 1) {

                rTypeCode.fireOnChange();

                //prepare data for Violations History grid
                getViolationHistory(formContext);
            }

            var formContext = executionContext.getFormContext();
            hideAllActionTypeSections(formContext);

            // This info needed for Contact-Quick create form i.e. Contact_QuickCreate.js
            try {
                window.top.QuickCreateHelper = {};
                window.top.QuickCreateHelper.site = {};
                window.top.QuickCreateHelper.site.id = formContext.entityReference.id;
                window.top.QuickCreateHelper.site.et = formContext.entityReference.entityType;
                window.top.QuickCreateHelper.site.name = formContext.getAttribute("ovs_legalname").getValue();

            } catch (e) {
                console.log("Site_OnChange failed - lookup is empty");
            }
        }, 

        relationShip_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();

            var rType = glHelper.GetValue(formContext, "customertypecode");
                  glHelper.SwitchFormByName(formContext, formMapping[rType.toString()]);

        },
    }
    //********************public methods end***************

})(window, document);