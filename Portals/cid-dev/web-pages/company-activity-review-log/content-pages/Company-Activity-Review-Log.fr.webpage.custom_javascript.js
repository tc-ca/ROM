//
// Web Page - Company Activity Review Log
//    

$(document).ready(function () {
    debugger;

    var companyName = '{{user.parentcustomerid.name }}';
    var topNav = $('#navbar');

    if (companyName)
        if (topNav) {
            var msg = tdg.error_message.message("CID_PORTAL");
            $("<h2>" + msg + ": " + companyName + "</h2>").insertAfter(topNav);
        }

    var cidCompanyStatus = $('#cid_cidcompanystatus').find(":selected").text();

    $('#cid_cidcompanystatus').hide();
    $('#cid_cidcompanystatus_label').hide();

    var deactivateCompanyWebLink = $('a[href*="deactivate-company"]');

    // TONY : TODO
    if (cidCompanyStatus.indexOf("Inactive") >= 0) {
        deactivateCompanyWebLink.addClass("hidden");
    }
    else {
        deactivateCompanyWebLink.removeClass("hidden");
    }
});