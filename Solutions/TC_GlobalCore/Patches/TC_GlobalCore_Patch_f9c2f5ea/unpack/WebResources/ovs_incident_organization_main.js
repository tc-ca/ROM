///<reference path="../../Utilities/GlobalHelper.js"/>


var TDG_IncidentOrganization_MainForm = (function (window, document) {
    //variables
    var formType;


    //********************private methods*******************

 
    //********************private methods end***************

    //********************public methods***************
    return {

        OnLoad: function (executionContext) {

            var formContext = executionContext.getFormContext();
            formType = glHelper.GetFormType(formContext);

            glHelper.SetRequiredLevel(formContext, "ovs_street_1_txt", true);
            glHelper.SetRequiredLevel(formContext, "ovs_name", true);
            glHelper.SetRequiredLevel(formContext, "ovs_city_txt", true);
            glHelper.SetRequiredLevel(formContext, "ovs_state_province_territory_txt", true);
            glHelper.SetRequiredLevel(formContext, "ovs_country_txt", true);
            glHelper.SetRequiredLevel(formContext, "ovs_zip_postal_code_txt", true);

        },

 
    };
    //********************public methods end***************
})(window, document);
