///<reference path="../../Utilities/GlobalHelper.js"/>
///<reference path="../../Utilities/DGAIS _SpecsMapping.js"/>


var DGAIS_MOC_MainForm = (function (window, document) {

    //variables
    var formType;
    var globalContext;
    var clientUrl;
    var incidentGuid;
    var vehicleConfigurationOptions;
    var regTypeId;

    var mode = new Array();
    mode[0] = []; //none
    mode[1] = [1, 2, 3, 4, 5];//road vehType
    mode[2] = [6, 7];//rail vehType
    mode[3] = [8, 9, 10];//marine vehType
    mode[4] = [11, 12, 13];//air vehType


    var vehType = new Array();
    vehType[0] = vehType[5] = [];//none, car/bus
    vehType[1] = vehType[3] = vehType[4] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 31];//truck, off road, unkhown vehicle
    vehType[2] = [14, 15]; //farm tractor    
    vehType[6] = vehType[7] = [16, 17, 18, 19, 20, 21, 22, 31];//locomotive, unknown train vehicle
    vehType[8] = [23, 24, 25, 26, 27, 31];//ship
    vehType[9] = vehType[10] = [27, 31];//barge, unknown    
    vehType[11] = vehType[12] = vehType[13] = [28, 29, 30, 31];//airplane, helicopter, unknown



    //********************private methods*******************

    function filterVehicleType(executionContext, formContext) {

        Xrm.WebApi.online.retrieveRecord("ovs_incident_report", incidentGuid, "?$select=ovs_mode_cd").then(
            function success(result) {
                if (result != null) {
                    var ovs_mode_cd = result["ovs_mode_cd"];
                    var ovs_mode_cd_formatted = result["ovs_mode_cd@OData.Community.Display.V1.FormattedValue"];
                    if (ovs_mode_cd != null)
                        glHelper.filterOptionSet(formContext, "ovs_vehicle_type_cd", mode[ovs_mode_cd], true);
                    else {

                        glHelper.filterOptionSet(formContext, "ovs_vehicle_type_cd", mode[0], true);
                        Xrm.Navigation.openErrorDialog({ message: "Parent Incident Report is missing the Mode.\n Vehicle Type and Configuration are not accessible!" });
                    }

                    //call vehicle type on change to update vehicle configuration
                    DGAIS_MOC_MainForm.VehicleType_OnChange(executionContext);
                }
            },
            function (error) {
                Xrm.Navigation.openErrorDialog({ message: error.message });
            }
        );
    }

    //********************private methods end***************

    //********************public methods***************
    return {

        OnLoad: function (executionContext) {

            var formContext = executionContext.getFormContext();
            globalContext = glHelper.getGlobalContext();
            clientUrl = globalContext.getClientUrl();


            formType = glHelper.GetFormType(formContext);
            //header_
            incidentGuid = glHelper.GetLookupAttrId(formContext, "ovs_incident_report_id");

            if (incidentGuid == null)
            {
                Xrm.Navigation.openErrorDialog({ message: "Incident Report must be populated" });
                glHelper.SetFieldNotification(formContext, "header_ovs_incident_report_id", "Incident Report must be populated");
                return;
            } else incidentGuid = incidentGuid.replace('{', '').replace('}', '');
            //store original list of options
            vehicleConfigurationOptions = formContext.getAttribute("ovs_vehicle_configuration_cd").getOptions();

            var release = formContext.getAttribute("ovs_release_ind");
            release.removeOnChange(DGAIS_MOC_MainForm.Release_OnChange);
            release.addOnChange(DGAIS_MOC_MainForm.Release_OnChange);
            release.fireOnChange();

            var releaseLocation = formContext.getAttribute("ovs_release_location_mcd");
            releaseLocation.removeOnChange(DGAIS_MOC_MainForm.ReleaseLocation_OnChange);
            releaseLocation.addOnChange(DGAIS_MOC_MainForm.ReleaseLocation_OnChange);

            var damage = formContext.getAttribute("ovs_damage_ind");
            damage.removeOnChange(DGAIS_MOC_MainForm.Damage_OnChange);
            damage.addOnChange(DGAIS_MOC_MainForm.Damage_OnChange);
            damage.fireOnChange();

            var damageType = formContext.getAttribute("ovs_damage_type_cds");
            damageType.removeOnChange(DGAIS_MOC_MainForm.DamageType_OnChange);
            damageType.addOnChange(DGAIS_MOC_MainForm.DamageType_OnChange);

            var damageLocation = formContext.getAttribute("ovs_damage_location_cds");
            damageLocation.removeOnChange(DGAIS_MOC_MainForm.DamageLocation_OnChange);
            damageLocation.addOnChange(DGAIS_MOC_MainForm.DamageLocation_OnChange);

            var vType = formContext.getAttribute("ovs_vehicle_type_cd");
            vType.removeOnChange(DGAIS_MOC_MainForm.VehicleType_OnChange);
            vType.addOnChange(DGAIS_MOC_MainForm.VehicleType_OnChange);

            var isCanadianMOC = formContext.getAttribute("ovs_moc_built_in_canada_ind");
            isCanadianMOC.removeOnChange(DGAIS_MOC_MainForm.WasCanMOC_OnChange);
            isCanadianMOC.addOnChange(DGAIS_MOC_MainForm.WasCanMOC_OnChange);


            
            if (formType == glHelper.FORMTYPE_CREATE) {

                filterVehicleType(executionContext, formContext);
            }
            else {

                releaseLocation.fireOnChange();
                damageType.fireOnChange();
                damageLocation.fireOnChange();
                vType.fireOnChange();
                isCanadianMOC.fireOnChange();
            }
        },

        ReleaseLocation_OnChange: async function (executionContext) {
            try {
                var formContext = executionContext.getFormContext();
                glHelper.openOtherFromChoice_s(formContext, "ovs_release_location_mcd", "918640019", "ovs_release_location_other_txt");

            } catch (error) {
                Xrm.Navigation.openErrorDialog({ message: error })

            } finally {
            }
        },

        Release_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();

            var isRelease = formContext.getAttribute("ovs_release_ind").getValue();

            if (!isRelease)
                formContext.getAttribute("ovs_release_location_mcd").setValue([]);
            glHelper.SetDisabled(formContext, "ovs_release_location_mcd", !isRelease);
            glHelper.SetRequiredLevel(formContext, "ovs_release_location_mcd", isRelease);

        },

        DamageType_OnChange: async function (executionContext) {

            var formContext = executionContext.getFormContext();
                glHelper.openOtherFromChoice_s(formContext, "ovs_damage_type_cds", "12", "ovs_other_damage_txt");
        },

        DamageLocation_OnChange: async function (executionContext) {

            var formContext = executionContext.getFormContext();
            glHelper.openOtherFromChoice_s(formContext, "ovs_damage_location_cds", "22", "ovs_other_damage_location_txt");
        },

        Damage_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();

            var isDamage = formContext.getAttribute("ovs_damage_ind").getValue();

            if (!isDamage) {
                formContext.getAttribute("ovs_damage_type_cds").setValue(null);
                formContext.getAttribute("ovs_damage_location_cds").setValue(null);
            }
            glHelper.SetDisabled(formContext, "ovs_damage_type_cds", !isDamage);
            glHelper.SetRequiredLevel(formContext, "ovs_damage_type_cds", isDamage);
            glHelper.SetDisabled(formContext, "ovs_damage_location_cds", !isDamage);
            glHelper.SetRequiredLevel(formContext, "ovs_damage_location_cds", isDamage);

        },

        VehicleType_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();

            var vType = glHelper.GetOptionsetValue(formContext, "ovs_vehicle_type_cd");
            if (vType != "")
                glHelper.filterOptionSetUsingOrigin(formContext, "ovs_vehicle_configuration_cd", vehicleConfigurationOptions, vehType[vType], true);
            else {
                glHelper.filterOptionSetUsingOrigin(formContext, "ovs_vehicle_configuration_cd", vehicleConfigurationOptions, vehType[0], true);
                glHelper.SetValue(formContext, "ovs_vehicle_configuration_cd", null);
            }
        },

        WasCanMOC_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();

            var isCanadian = glHelper.GetValue(formContext, "ovs_moc_built_in_canada_ind");
            //if not originaly set - set all blocked
            if (isCanadian === "") {

                glHelper.SetDisabled(formContext, "ovs_specification_id", true);
                glHelper.SetDisabled(formContext, "ovs_other_code_txt", true);
                return;
            }
            //update
            glHelper.SetRequiredLevel(formContext, "ovs_specification_id", isCanadian);
            glHelper.SetRequiredLevel(formContext, "ovs_other_code_txt", !isCanadian);
            glHelper.SetDisabled(formContext, "ovs_specification_id", false);
            glHelper.SetDisabled(formContext, "ovs_other_code_txt", isCanadian);

            if (isCanadian) {

                glHelper.SetValue(formContext, "ovs_other_code_txt", null);
                var specs = formContext.getAttribute("ovs_specification_id");
                specs.fireOnChange();
            }
        },

    };
    //********************public methods end***************
})(window, document);
