//
// Basic Form-In Year Site Details Form.js
//

$(document).ready(function () {
    debugger;

    var CompanyName = '{{user.parentcustomerid.name}}';
    //code used to change titles to include company Name - site name or Company Name  - address (if site name is empty)
    tdg.cid.Setup_site_Profile_Title (CompanyName);
    
    var operationId = sessionStorage.getItem("siteOperationId");
    var urlParams = new URLSearchParams(window.location.search);

    if (operationId != '') {
        var cidSiteStatus = $('#cid_cidsitestatus').find(":selected").text();
        //var requirementLevel = $("#cid_requirementlevel").find(":selected").text();
        //var extendedSite = false;
        var disabled = "";
        var siteId = urlParams.get('id');

        if (cidSiteStatus.indexOf("Inactive") >= 0)
            disabled = "disabled";

        //if (requirementLevel == 'Extended')
        //    extendedSite = true;

        //if ($("#openOperationWizard").length > 0)
         //   $('#openOperationWizard').remove();
        //if ($("#openOperationWizard_Classes").length > 0)
       //     $('#openOperationWizard_Classes').remove();           
       // if ($("#openOperationWizard_UNs").length > 0)
        //    $('#openOperationWizard_UNs').remove();
        //if ($("#openOperationWizard_MOTs").length > 0)
        //    $('#openOperationWizard_MOTs').remove();

        //var msg2 = "Update Further Site Details";//tdg.error_message.message("m000027");
        //var html2 = "&nbsp;&nbsp;<div id='openOperationWizard' role='group' class='btn-group entity-action-button'><a href='~/OperationRegistrationWizard/?id=" + operationId + "&siteid=" + siteId + "&in_year=true" + (extendedSite ? "&isExtended=true" : "&isExtended=false") + "'><input id='furtherDetailsButton' type='button' name='FurtherSiteDetails' value='{0}' class='btn btn-primary button submit-btn' nonactionlinkbutton='true'" + disabled + "></a></div>";
        //html2 = html2.replaceAll("{0}", msg2);
        //var html3 = "&nbsp;&nbsp;<div id='openOperationWizard_Classes' role='group' class='btn-group entity-action-button'><a href='~/OperationRegistrationWizard/?id=" + operationId + "&siteid=" + siteId + "&in_year=true'><input id='furtherDetailsButton_Classes' type='button' name='FurtherSiteDetails_Classes' value='+ Add' class='btn btn-primary button submit-btn' nonactionlinkbutton='true'" + disabled + "></a></div>";
        //var html4 = "&nbsp;&nbsp;<div id='openOperationWizard_UNs' role='group' class='btn-group entity-action-button '><a href='~/OperationRegistrationWizard/?id=" + operationId + "&siteid=" + siteId + "&in_year=true" + (extendedSite ? "&isExtended=true" : "&isExtended=false") + "'><input id='furtherDetailsButton_UNs' type='button' name='FurtherSiteDetails_UNs' value='+ Add' class='btn btn-primary button submit-btn' nonactionlinkbutton='true'" + disabled + "></a></div>";
        //var html5 = "</br><div id='openOperationWizard_MOTs' role='group' class='btn-group entity-action-button '><a href='~/OperationRegistrationWizard/?id=" + operationId + "&siteid=" + siteId + "&in_year=true'><input id='furtherDetailsButton_MOTs' type='button' name='FurtherSiteDetails_MOTs' value='Update Mode(s) of transportation' class='btn btn-primary button submit-btn' nonactionlinkbutton='true'" + disabled + "></a></div></br></br></br>";
        
        //$('.AttestSite').parent().after(html2);
        //$("#classes").find("a:first").parent().after(html3);
        //$("#UN_Numbers").find("a:first").parent().before(html4);
        //$("#siteModesOfTransportation").parent().after(html5);
    }
});