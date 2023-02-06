//
// SiteRegistrationWizard-Site.js
//
var _busy = false;
$(document).ready(function ()
{
	debugger;
	var inYear = sessionStorage.getItem('frominyearsites');
	var annualCompliance = sessionStorage.getItem('fromannualcompliance');
	var frominyearsitepage = sessionStorage.getItem('frominyearsitepage');
    
    var addressReadOnly = false;
    
    $("#createdon").closest("tr").hide();
    $("#cid_createdbyregistrant_label").closest("tr").hide();

	if (inYear == 'true' || annualCompliance == 'true' || frominyearsitepage == 'true')
	{
		if ($("#cancelButton").length <= 0)
		{
			var cancelLabel = tdg.error_message.message("BTN_CANCEL");
			$("#NextButton").parent().after("<div role='group' class='btn-group entity-action-button'><input id='cancelButton' type='button' name='CancelButton' value='" + cancelLabel + "' class='btn btn-default button previous previous-btn' nonactionlinkbutton='true'></div>");
		}
		$('#cancelButton').click(function (e)
		{
			if (inYear == 'true') window.location.href = '~/my-sites/';
			else if (annualCompliance == 'true') window.location.href = '~/my-company/annual-compliance-update/';
			else if (frominyearsitepage == 'true')
			{
				var urlParams = new URLSearchParams(window.location.search);
				if (urlParams.has('id'))
				{
					var siteid = urlParams.get('id');
					if (siteid != "") window.location.href = '~/my-sites/in-year-site/?id=' + siteid;
				}
			}
		});
        
        //Control address edit
        var parent_Id = '{{ user.parentcustomerid.id }}';

        var created_On = new Date($("#createdon").val()).getTime();
        if($("#cid_createdbyregistrant").val() != parent_Id  && (Date.now()- created_On ) /1000/60/60/24 < 1)
        {
            $("#cid_same_as_company").attr("disabled", false);
            $("#ovs_address_type").attr("disabled", false);
        }       
        else
        {
            addressReadOnly = true;
        }
	}
  
	document.getElementById("address1_latitude").addEventListener('change', (event) => {
		//get Latitude and set it to nearest 4 digits
		var Lat = $("#address1_latitude").val();
		$("#address1_latitude").val(Number.parseFloat(Lat).toFixed(4));
	});
	document.getElementById("address1_longitude").addEventListener('change', (event) => {
		//get Lontitude and set it to nearest 4 digits
		var Longtitude = $("#address1_longitude").val();
		$("#address1_longitude").val(Number.parseFloat(Longtitude).toFixed(4));
	});
	var selected_language = '{{website.selected_language.code}}';
	sessionStorage.setItem("selected_language", selected_language);
	// address
	tdg.cid.address_init(true);
	var urlParams = new URLSearchParams(window.location.search);
	if (urlParams.has('newsite') && urlParams.get('newsite') == 'true' && !urlParams.has('stepid'))
	{
		$('#redirectInstruction').show();
		$('#instructions').hide();
		$('#EntityFormView').hide();
		$("#NextButton").click();
	}
	else $('#redirectInstruction').hide();
	//Phone number formatting
	tdg.cid.phone_init("telephone1", selected_language);
	tdg.cid.phone_init("fax", selected_language);
	var cid_legalname = "{{user.cid_legalname}}";
	cid_legalname = tdg.c.replace_special_char(cid_legalname);
	$("#ovs_legalname").val(cid_legalname);
	$("#name").val(cid_legalname);
	// hide controls
	tdg.c.control_hide("name");
	tdg.c.control_hide("cid_siteclaim");
	$("#cid_sitename").attr("autocomplete", "new-password");
	$("#telephone1").attr("autocomplete", "new-password");
	$("#fax").attr("autocomplete", "new-password");
	tdg.cid.convert_province_to_code(selected_language);
	$('#loader').hide();
   
	var ovs_address_type = $("#ovs_address_type").val();
	switch (ovs_address_type)
	{
		case "1":
			// legal land description
			tdg.c.section_show("section_legal_land_description");
            if(addressReadOnly)
            {
                cid_input_read_only("section_legal_land_description");
            }
			break;
		case "2":
			// lat/long
			//tdg.c.section_show("section_latitude_longitude");
			//tdg.c.addValidator("address1_latitude");
			//tdg.c.addValidator("address1_longitude");
			//this.address1_default("N/A");
            if(addressReadOnly)
            {
                cid_input_read_only("section_latitude_longitude");
            }
			break;
		default:
			tdg.c.section_show("section_address");
			$("#address1_line1").prop('disabled', true);
			$("#address1_line2").prop('readonly', true);
			$("#address1_line3").prop('readonly', true);
			$("#address1_city").prop('readonly', true);
			$("#ovs_address1_province").prop('disabled', true);
			$("#address1_stateorprovince").prop('readonly', true);
            $("#address1_postalcode").prop('readonly', true);
            if(addressReadOnly)
            {
                $("#address1_line1").prop("disabled", true);
                $("#ovs_address1_province").prop("disabled", true);           
                cid_input_read_only("section_address");
            }
	}

	$("#ovs_address_type").change(function ()
	{
		tdg.cid.address_type_change(true);
	});
	tdg.cid.address_type_change(false);
	// cid_same_as_company
	$("#cid_same_as_company").change(function ()
	{
		cid_same_as_company_change();
	});
	cid_same_as_company_change();
});

function cid_same_as_company_change()
{
	debugger;
	if (_busy) return;
	_busy = true;
	var parent_id = '{{ user.parentcustomerid.id }}';
	tdg.cid.address_same_as_company(parent_id);
	_busy = false;
}
if (window.jQuery)
{
	(function ($)
	{
		webFormClientValidate = function ()
		{
			return true;
		}
	}(window.jQuery));
}

function cid_input_read_only(sectionName)
{
    //Disable Address Fileds
    $("#cid_same_as_company").attr("disabled", true);
    $("#ovs_address_type").attr("disabled", true);
    $(".section[data-name='"+sectionName+"']").find(':input').prop("disabled", true);
    //$(".section[data-name='section_legal_land_description']").find('.picklist').prop("disabled", true);
}