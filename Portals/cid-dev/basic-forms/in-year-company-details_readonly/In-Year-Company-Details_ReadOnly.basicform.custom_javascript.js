//
// Basic Form-In Year Company Details_ReadOnly.js
//

$(document).ready(function () {
    debugger;

    page_setup();

    if (sessionStorage.getItem("updateOrgCheckList") == "Yes")
    {
        sessionStorage.setItem("updateOrgCheckList", "No");
        window.location.href = "~/my-company/annual-compliance-update";
    }
        
    var companyName = "{{user.parentcustomerid.name}}";
    let url = new URL(window.location.href);
   
    var cid_usercontacttype = '{{user.cid_contacttype.Value}}';
	console.log(cid_usercontacttype);
	//if not primary contact
	if (cid_usercontacttype != 100000000) {
		$("#update_company").attr('disabled','disabled');
		//$("#update_company").css("pointer-events", "none");
    }
    tdg.c.page_instructions("page_my_company", true);

    $("#update_company").click(function () {
        debugger;

        var selected_language = '{{website.selected_language.code}}';
        $('div[data-name="tab_3"]').parent().parent().removeClass("hidden");
        $('div[data-name="company_details"]').parent().parent().addClass("hidden");
        $('#update_company').addClass("hidden");
     
        $('div[data-name="tab_3"]').parent().before("<h2>" + companyName + "</h2><hr>");

        var legend2 = $('fieldset[aria-label="Head Office"] legend').eq(1);
        legend2.text("");
        var ho = tdg.error_message.message("m000156");
        legend2.after("<h2>" + companyName + " - " + ho + "</h2><hr>");
        tdg.cid.phone_init("telephone1", selected_language);
        tdg.cid.phone_init("fax", selected_language);
        $("#cid_iscompanyattested_label").removeAttr("role" , "");

        $("#name").on("blur", function () {
            debugger;

            ovs_legalname_copy();
        });
    });

    $("#cancel_company_update").click(function () {   
        if (sessionStorage.getItem("EditOrg") != "none")
        {
            sessionStorage.setItem("EditOrg" , "none");
            window.location.href = "~/my-company/annual-compliance-update";
        }
        else
        {
            window.location.href = "~/my-company";
        }
    });

    let currentURL = window.location.href;
    
    sessionStorage.setItem("EditOrg", "none");
    if(currentURL.indexOf('EditOrg') > 0 && cid_usercontacttype == 100000000)
    {
        let editOrgValue = url.searchParams.get('EditOrg');
        sessionStorage.setItem("EditOrg", editOrgValue);
                   
        var urlPath = window.location.href;
        urlPath = urlPath.split('?')[0];
        window.history.replaceState({}, document.title, urlPath);

        $("#update_company").click();
    }
});

function ovs_legalname_copy() {
    var name = $("#name").val();
    if (name == "") {
        var legalname = $("#ovs_legalname").val();
        $("#name").val(legalname);
    }
}

function page_setup() {
    var selected_language = '{{website.selected_language.code}}';
    sessionStorage.setItem("selected_language", selected_language);

    const files = ["/tdgcore_common.js", "/tdgcore_message.js"];
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = file;

        $("body").append(script);
    }

    // server error?
    tdg.c.message_panel();
}
