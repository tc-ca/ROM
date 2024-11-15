///<reference path="../../Utilities/GlobalHelper.js"/>


var QuickCreateHelper = QuickCreateHelper || {};
window.top.QuickCreateHelper = QuickCreateHelper;

var Registration_FDR_main = (function (window, document) {

    //**************** Variables

    var globalFormContext;
    var globalContext;
    var contactsN2N = new Array();

    const FIELD_ORGANIZATION = "ovs_organization_id";
    const FIELD_SITE = "ovs_site_id";
    const FIELD_REGISTRATION_TYPE = "ovs_registration_type_id";
    


    //**************** Private methods

    function getContactsByAccountN2N(formContext, accountid) {


        Xrm.WebApi.online.retrieveMultipleRecords("contact", "?$select=contactid&$expand=ovs_account_contact($filter=(accountid eq " + accountid + "))&$filter=(ovs_account_contact/any(o1:(o1/accountid eq " + accountid + ")))").then(
            function success(results) {
                if (results.entities != undefined
                    && results.entities != null
                    && results.entities.length > 0)
                    for (var i = 0; i < results.entities.length; i++) {

                        contactsN2N.push(results.entities[i]["contactid"]);
                    }

                //get site's primary contact
                Xrm.WebApi.online.retrieveRecord("account", accountid, "?$select=_primarycontactid_value").then(
                    function success(result) {
                        var _primarycontactid_value = result["_primarycontactid_value"];
                        if (_primarycontactid_value != null && _primarycontactid_value != undefined)
                            contactsN2N.push(_primarycontactid_value);
                    },
                    function (error) {
                        console.log("No site's primary contact was found " + error.message);
                        Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: "No site's primary contact was found " + error.message });
                    }
                );
            },
            function (error) {
                console.log("No contacts related to account were found " + error.message);
                Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: "No contacts related to account were found " + error.message });
            }
        );

    }



    //**************** Public methods
    return {

        OnLoad: function (executionContext) {
            //get context
            globalContext = glHelper.getGlobalContext();
            var formContext = executionContext.getFormContext();
            globalFormContext = formContext;

            // 0 = Undefined, 1 = Create, 2 = Update, 3 = Read Only, 4 = Disabled, 6 = Bulk Edit
            let formType = glHelper.GetFormType(formContext);

            // Set Fields Read Only if not create
            if (formType != 1) {

                glHelper.SetControlReadOnly(formContext, FIELD_REGISTRATION_TYPE, true);
                glHelper.SetControlReadOnly(formContext, FIELD_ORGANIZATION, true);
                glHelper.SetControlReadOnly(formContext, FIELD_SITE, true);

            }

            var accountid = glHelper.GetLookupAttrId(formContext, FIELD_SITE);
            if (accountid != null)
                getContactsByAccountN2N(formContext, accountid);
            else {
                Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: "No Site is associated with current registration" });
            }

            if (glHelper.isTopAccessible()) {
                globalObj = window.top.QuickCreateHelper;
                globalObj.formContext = formContext;
            }
        },

    }

})(window, document)