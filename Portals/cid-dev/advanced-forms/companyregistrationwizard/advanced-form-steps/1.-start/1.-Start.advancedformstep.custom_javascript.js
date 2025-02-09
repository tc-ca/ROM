//
// CompanyRegistrationWizard-Start.js
//
var _account;
var _cra_record = null;
$(document).ready(function () {
    debugger;

    sessionStorage.setItem("step_start", 1);
    sessionStorage.setItem("portaluserID", '{{user.id}}');
    var userFullname = '{{user.fullname}}';
    if (userFullname.length == 0) { window.location.href = '~/profile/'; }
    var selected_language = '{{website.selected_language.code}}';
    sessionStorage.setItem("selected_language", selected_language);
    tdg.c.page_instructions("page_crw_start");
    sessionStorage.setItem("cid_has_invitation", "false");
    sessionStorage.setItem("adx_invitationid", "");
    $("#NextButton").hide();
    var msg = tdg.error_message.message("BTN_NEXT");
    tdg.c.button_create("btn_next", "#NextButton", msg);
    $("#btn_next").bind("click", function () { tdg.cid.crw.start_btn_next_click(); });
    // init var to use in CompanyRegistrationWizard-Site.js
    var k_existing_sites = "already_have_existing_sites";
    sessionStorage.setItem(k_existing_sites, "null");

    tdg.c.section_hide("section_address_1");
    tdg.c.control_hide("cid_contacttype");

    $("#cid_has_cra_bn").val("1");
    tdg.c.control_hide("parentcustomerid", true);
    tdg.c.control_hide("cid_operatingname");
    tdg.c.control_hide("cid_operatingnamefr");
    debugger;
    $("#cid_has_cra_bn").change(function () {
        tdg.cid.crw.start_cid_has_cra_bn_onchange("1");
    });
    tdg.cid.crw.start_cid_has_cra_bn_onchange("1");

    $("#cid_reasonfornobnnumber").change(function () {
        tdg.cid.crw.start_cid_reasonfornobnnumber_onchange(true);
    });
    tdg.cid.crw.start_cid_reasonfornobnnumber_onchange(false);

    $("#cid_crabusinessnumber").attr("autocomplete", "new-password");
    $("#cid_legalname").attr("autocomplete", "new-password");
    $("#cid_reasonfornobnnumber_other").attr("autocomplete", "new-password");

    // user has invitation code?
    sessionStorage.setItem("cid_suppress_error", "");
    sessionStorage.setItem("cid_suppress_error_code", "");

    var cid_contacttype = '{{user.cid_contacttype.Value}}';
    if (cid_contacttype != 100000000)  // not primary
    {
        var account_id = '{{user.parentcustomerid.Id}}';
        if (account_id != "") {
            debugger;
            var contact_id = '{{user.id}}';
            var filter = "adx_invitationcode ne '' and _adx_invitecontact_value eq " + contact_id;
            var inv = tdg.c.WebApi_List("adx_invitations", filter);
            if (inv.length > 0) {
                sessionStorage.setItem("cid_has_invitation", "true");
                sessionStorage.setItem("adx_invitationid", inv[0].adx_invitationid);
                filter = "accountid eq " + account_id;
                _account = tdg.c.WebApi_List("accounts", filter)[0];
                switch (_account.cid_cidcompanystatus) {
                    case 100000004:
                        invitation.invitation_primary(_account, "m000033", contact_id);
                        break;
                    case 100000000:
                        invitation.invitation_secondary(_account, "m000034", contact_id);
                        break;
                    case 100000001:
                        invitation.invitation_secondary(_account, "m000034", contact_id);
                        break;
                    case 100000005:
                        invitation.invitation_secondary(_account, "m000035", contact_id);
                        break;
                    case 100000009:
                        invitation.invitation_secondary(_account, "m000034", contact_id);
                        break;
                    default:
                        invitation.invitation_go_next(_account, false, contact_id);
                        break;
                }
                return;
            }
        }
    }

    $("#cid_legalname").on("change", function () {
        //if ($("#ovs_legalnamefr").val() == "") {
        //    var value = $("#cid_legalname").val();
        //    $("#ovs_legalnamefr").val(value);
        //}
    });
});

if (window.jQuery) {
    (function ($) {
        webFormClientValidate = function () {
            debugger;
            var contact_id = '{{user.id}}';
            let has_invitation = sessionStorage.getItem("cid_has_invitation");
            console.log("has_invitation :" + has_invitation);
            if (has_invitation != "true") {
                tdg.cid.crw.start_clear_contact_address();
            }
            let suppress_error = sessionStorage.getItem("cid_suppress_error");
            suppress_error = (suppress_error != "" ? true : false);
            sessionStorage.setItem("step_start", "1");
            let cid_has_cra_bn = $("#cid_has_cra_bn").val();
            let validation = false;
            let rom_data, filter;
            tdg.c.error_message_clear();
            if (has_invitation != "true") {
                if (cid_has_cra_bn == 0) {
                    let legalname = $("#cid_legalname").val();
                    let legalnamefr = "";// $("#ovs_legalnamefr").val();
                    debugger;
                    //rom_data = tdg.cid.crw.start_account_by_name(legalname, legalnamefr);
                    rom_data = tdg.cid.crw.start_account_by_name(legalname);
                    if (rom_data.length > 0) {
                        //check if claimed company is duplicate
                        if (rom_data.length > 1) {
                            tdg.cid.crw.Create_SupportRequest_For_Duplicate_Organization(rom_data, '{{user.id}}');
                            validation = false;
                        }
                        else {
                            rom_data = rom_data[0];
                            validation = tdg.cid.crw.start_registration(rom_data, suppress_error, contact_id);
                            $("#cid_operatingname").val(rom_data.name);
                        }
                    }
                    else {
                        validation = true;
                    }
                }
                else {
                    debugger;

                    let data = _cra_record;
                    if (data == "" || data == null) {
                        tdg.c.error_message_advanced_form("m000001", true);
                    }
                    else {
                        debugger;

                        legalname = data.LegalName;

                        let cid_crabusinessnumber = $("#cid_crabusinessnumber").val();
                        validation = false;
                        //filter = "cid_crabusinessnumber eq '" + cid_crabusinessnumber + "' and customertypecode eq 948010000 and statecode eq 0";
                        filter = "cid_crabusinessnumber eq '" + cid_crabusinessnumber + "' and customertypecode eq 948010000";
                        rom_data = tdg.c.WebApi_List("accounts", filter);
                        if (rom_data.length == 0 || rom_data == null) {
                            if (legalname != null && legalname != "") {
                                legalname = tdg.c.replace_filter_special_char(legalname);
                                filter = "ovs_legalname eq '" + legalname + "' and customertypecode eq 948010000";
                                rom_data = tdg.c.WebApi_List("accounts", filter);
                            }
                        }

                        if (rom_data.length > 0) {
                            rom_data = rom_data[0];
                            if (rom_data["cid_has_cra_bn"] != 1 || rom_data["cid_crabusinessnumber"] != cid_crabusinessnumber) {
                                var accid = rom_data["accountid"]
                                var BNdata = {
                                    "cid_has_cra_bn": true,
                                    "cid_crabusinessnumber": cid_crabusinessnumber
                                };
                                tdg.webapi.update("accounts", accid, BNdata);
                            }

                            validation = tdg.cid.crw.start_registration(rom_data, suppress_error, contact_id);
                        }
                        else {
                            tdg.cid.contact_update(data);
                            validation = true;
                        }
                    }
                }
            }
            else {
                tdg.cid.crw.start_parentcustomerid_setup(_account.accountid, _account.ovs_legalname);
                validation = true;
            }

            if (validation) {
                debugger;
                if (_account != null) {
                    switch (_account.cid_cidcompanystatus) {
                        case 100000004:
                            $("#cid_contacttype").val(100000000);
                    }
                }
                else if (rom_data.cid_cidcompanystatus == null) {
                    $("#cid_contacttype").val(100000000);
                }
                else if (rom_data.cid_cidcompanystatus == 100000002) {
                    $("#cid_contacttype").val(100000000);
                }
                else if (rom_data == null) {
                    $("#cid_contacttype").val(100000000);
                }
            }
            return validation;
        }
    }(window.jQuery));
}
