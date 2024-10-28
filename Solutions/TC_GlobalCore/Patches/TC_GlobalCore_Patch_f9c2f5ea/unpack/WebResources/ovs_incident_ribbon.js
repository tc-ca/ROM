var Incident_Ribbon = (function (window, document) {

    //********************private methods***************

    function calculateAnalystReport(incidentId, LCID, gridControl, formContext) {

        //TO DO: localize
        Xrm.Utility.showProgressIndicator("Calculating...");

        if (!isAnalystReportExist4Incident(incidentId)) {

            Xrm.Utility.closeProgressIndicator();
            Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: "No Analyst Report exists for current incident. Please, create one to be able to calculate scope." });
            return;
        }


        //call custom action to calculate
        var parameters = {};
        parameters.incidentId = incidentId.replace('{', '').replace('}', '');
        parameters.irId = irId.replace('{', '').replace('}', '');

        var ovs_CalculateIncidentScopeRequest = {
            incidentId: parameters.incidentId,

            getMetadata: function () {
                return {
                    boundParameter: null,
                    parameterTypes: {
                        "incidentId": {
                            "typeName": "Edm.String",
                            "structuralProperty": 1
                        }
                    },
                    operationType: 0,
                    operationName: "ovs_CalculateIncidentScope"
                };
            }
        };
        Xrm.WebApi.online.execute(ovs_CalculateIncidentScopeRequest).then(
            function success(result) {

                Xrm.Utility.closeProgressIndicator();

                if (result.ok) {
                    result.text().then(function (i) {
                        var data = JSON.parse(i);
                        if (data != null || typeof data !== 'undefined') {

                            //refresh form or grid
                            if (data.isOK) {

                                //refresh without save
                                formContext.data.refresh(false).then(function (success) {

                                    if (gridControl != null) {

                                        var gridContext = formContext.getControl("Subgrid_reports");
                                        gridContext.refresh();
                                    }
                                }, function (error) {
                                    console.log("Refresh error: " + error.message);
                                    Xrm.Navigation.openErrorDialog({ message: "Something went wrong with form refresh. Error: " + error.message });

                                });
                            }
                            else {

                                Xrm.Navigation.openErrorDialog({ message: "Calculation went wrong. Error: " + data.executionError });
                            }
                        }
                    }, function (error) {

                        Xrm.Utility.closeProgressIndicator();
                        console.log("Regs error: " + error.message);
                        Xrm.Navigation.openErrorDialog({ message: "Something went wrong. Error: " + error.message });
                    });
                }
            },
            function (error) {

                Xrm.Utility.closeProgressIndicator();
                Xrm.Navigation.openErrorDialog({ message: error.message });
            }
        );

    }

    //********************public methods***************


    function isAnalystReportExist4Incident(incidentId) {

        var result = false;

        var req = new XMLHttpRequest();
        req.open("GET", Xrm.Utility.getGlobalContext().getClientUrl() + "/api/data/v9.2/ovs_incident_reports?$select=ovs_incident_reportid&$filter=(ovs_analyst_report_ind eq true and _ovs_incident_id_value eq " + incidentId.replace('{', '').replace('}', '') + ")&$count=true", false);
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("Prefer", "odata.include-annotations=*");
        req.onreadystatechange = function () {
            if (this.readyState === 4) {
                req.onreadystatechange = null;
                if (this.status === 200) {
                    var results = JSON.parse(this.response);
                    console.log(results);
                    var odata_count = results["@odata.count"];

                    result = odata_count > 0;

                } else {
                    console.log(this.responseText);
                    result = false;
                }
            }
        };
        req.send();

        return result;
    }


    function calculateScope_IncidentForm(incidentId, LCID, formContext) {

        calculateAnalystReport(incidentId, LCID, null, formContext);

    }

    function calculateScope_IncidentGrid(incidentId, LCID, gridControl, formContext) {

        calculateAnalystReport(incidentId, LCID, gridControl, formContext);
    }


    return {

        calculateScope_IncidentForm: calculateScope_IncidentForm,
        calculateScope_IncidentGrid: calculateScope_IncidentGrid,
        isAnalystReportExist4Incident: isAnalystReportExist4Incident
    };



})(window, document);