///<reference path="../../Utilities/GlobalHelper.js"/>

var Contact_QC_TC= (function (window, document) {


    return {

        OnLoad: function (executionContext) {
            
            var formContext = executionContext.getFormContext();

            var langId = Xrm.Utility.getGlobalContext().userSettings.languageId;
         
            // Set Account as Required field.
            glHelper.SetRequiredLevel(formContext, "firstname", true);
            glHelper.SetRequiredLevel(formContext, "lastname", true);
            glHelper.SetRequiredLevel(formContext, "parentcustomerid", true);
            //Task 165369: Remove mandatory requirement for email field in contact record
            //glHelper.SetRequiredLevel(formContext, "emailaddress1", true);
            glHelper.SetRequiredLevel(formContext, "jobtitle", true);
            glHelper.SetRequiredLevel(formContext, "telephone1", true);
            glHelper.SetRequiredLevel(formContext, "parentcustomerid", true);

            /// PBI# 344522: Set Fields Mandatory on the Quick Create Contact Form for CRS app

            var globalContext = Xrm.Utility.getGlobalContext();
            globalContext.getCurrentAppName().then(function (appName) {
                var isCRS = (langId == 1033 && appName.indexOf("CRS") != -1) || (langId == 1036 && appName.indexOf("SIC") != -1) ;
                    if (formContext.getAttribute("emailaddress1") != null) glHelper.SetRequiredLevel(formContext, "emailaddress1", isCRS);
                    if (formContext.getAttribute("mobilephone") != null) glHelper.SetRequiredLevel(formContext, "mobilephone", isCRS);
            });

            if (window.top.QuickCreateHelper != null && window.top.QuickCreateHelper != undefined
                && window.top.QuickCreateHelper.site != null && window.top.QuickCreateHelper != undefined) {

                try {
                    glHelper.SetLookup(formContext, "parentcustomerid", window.top.QuickCreateHelper.site.et, window.top.QuickCreateHelper.site.id, window.top.QuickCreateHelper.site.name);
                    glHelper.SetDisabled(formContext, "parentcustomerid", true);
                } catch {}
            }
        },
    }

})(window, document)