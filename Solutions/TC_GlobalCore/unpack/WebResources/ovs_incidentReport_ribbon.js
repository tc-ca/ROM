var irRibbon = (function (window, document) {

    //********************private methods***************


    function promptUserCalc(irId, incidentId, LCID, gridControl, formContext, isPrimary) {


        if (formContext.data.entity.getIsDirty()) {

            var confirmStrings = { text: "Form data was modifiied. The form will be saved prior to the calculation begins. Continue?", title: "Confirmation Dialog" };
            var confirmOptions = { height: 200, width: 450 };
            Xrm.Navigation.openConfirmDialog(confirmStrings, confirmOptions).then(
                function (success) {
                    if (success.confirmed) {

                        //async save
                        formContext.data.save().then(function () {

                            if (isPrimary)
                                setPrimary(irId, incidentId, LCID, gridControl, formContext);
                            else clone_merge_AnalystReport(irId, incidentId, LCID, gridControl, formContext);

                        }, function (e) {

                            Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: "Cannot save the form. Error: " + this.statusText });

                        });
                    }
                    else {

                        return;
                    }
                }
            );

        }
        else {

            if (isPrimary)
                setPrimary(irId, incidentId, LCID, gridControl, formContext);
            else clone_merge_AnalystReport(irId, incidentId, LCID, gridControl, formContext);
        }
    }

    function setPrimary(irId, incidentId, LCID, gridControl, formContext) {

        //TO DO: localize
        Xrm.Utility.showProgressIndicator("Setting primary...");

        //call custom action to calculate
        var parameters = {};
        parameters.incidentId = incidentId.replace('{', '').replace('}', '');
        parameters.irId = irId.replace('{', '').replace('}', '');

        var ovs_CalculateIncidentScopeRequest = {
            incidentId: parameters.incidentId,
            irId: parameters.irId,

            getMetadata: function () {
                return {
                    boundParameter: null,
                    parameterTypes: {
                        "incidentId": {
                            "typeName": "Edm.String",
                            "structuralProperty": 1
                        },
                        "irId": {
                            "typeName": "Edm.String",
                            "structuralProperty": 1
                        }
                    },
                    operationType: 0,
                    operationName: "ovs_SetIncidentReportPrimary"
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

                                Xrm.Navigation.openErrorDialog({ message: "Set Primary went wrong. Error: " + data.executionError });
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

    function clone_merge_AnalystReport(irId, incidentId, LCID, gridControl, formContext) {

        //TO DO: localize
        Xrm.Utility.showProgressIndicator("Cloning/merging...");

        //call custom action to calculate
        var parameters = {};
        parameters.incidentId = incidentId.replace('{', '').replace('}', '');
        parameters.irId = irId.replace('{', '').replace('}', '');

        var ovs_CalculateIncidentScopeRequest = {
            incidentId: parameters.incidentId,
            irId: parameters.irId,

            getMetadata: function () {
                return {
                    boundParameter: null,
                    parameterTypes: {
                        "incidentId": {
                            "typeName": "Edm.String",
                            "structuralProperty": 1
                        },
                        "irId": {
                            "typeName": "Edm.String",
                            "structuralProperty": 1
                        }
                    },
                    operationType: 0,
                    operationName: "ovs_CloneIncidentReport"
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

                                Xrm.Navigation.openErrorDialog({ message: "Clone/merge went wrong. Error: " + data.executionError });
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

    function cloneReportFormGrid(irId, incidentId, LCID, gridControl, formContext) {

        promptUserCalc(irId, incidentId, LCID, gridControl, formContext, false);
    }

    function cloneReportForm(irId, LCID, formContext) {

        //get incidentId
        incidentId = formContext.getAttribute("ovs_incident_id").getValue()[0].id;

        promptUserCalc(irId, incidentId, LCID, null, formContext, false);

    }

    function setReportPrimaryGrid(irId, incidentId, LCID, gridControl, formContext) {

        promptUserCalc(irId, incidentId, LCID, gridControl, formContext, true);
    }

    function setReportPrimaryForm(irId, LCID, formContext) {

        //get incidentId
        incidentId = formContext.getAttribute("ovs_incident_id").getValue()[0].id;

        promptUserCalc(irId, incidentId, LCID, null, formContext, true);

    }


    return {

        cloneReportFormGrid: cloneReportFormGrid,
        cloneReportForm: cloneReportForm,
        setReportPrimaryGrid: setReportPrimaryGrid,
        setReportPrimaryForm: setReportPrimaryForm
    };

})(window, document);