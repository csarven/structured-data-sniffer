
// React when the browser action's icon is clicked.
var icon_active   = 'icon48.png';
var items;
var $ = jQuery;
var gData = null;
var gData_showed = false;

$(document).ready(function() 
{

  jQuery('#ext_ver').text('ver: '+ chrome.runtime.getManifest().version);

  chrome.tabs.query({active:true}, function(tabs) {
      if (tabs.length > 0) {
        //?? Request the microdata items in JSON format from the client (foreground) tab.
        chrome.tabs.sendMessage(tabs[0].id, {
            property: 'items.json'
          }, 
          function(response) {
          });
      }
    });
});


// Trap any link clicks and open them in the current tab.
$('a').live('click', function(e) {
  var href = e.currentTarget.href;

//  chrome.tabs.query({active:true}, function(tabs) {
//      if (tabs.length > 0)
//        chrome.tabs.update(tabs[0].id, {url: href});
//    });
//  window.close(); /* close popup */
  window.open(href);
});


function jsonld_expand_item(item) 
{
   var id = (typeof(item["@id"])!== "undefined") ? item["@id"] : null;
   var type = (typeof(item["@type"])!== "undefined") ? item["@type"] : null;
   var value = (typeof(item["@value"])!== "undefined") ? item["@value"] : null;
   var row = {};
   var props = {};
   var props_count = 0;

   jQuery.each(item, function(key, val) 
   {
     if (key!=="@id" && key!="@type" && key!= "@value")
     {
       if ($.isArray(val)) {
         var out = [];
         for(var i=0; i < val.length; i++) {
           out.push(jsonld_expand_item(val[i]));
         }
         props[key] = out;
       }
       else 
         props[key] = val;

       props_count++;
     }
   });

   if (props_count==0 && id && !type && !value) {
     row = id;
   } else {
     if (id)
       row["id"] = id;
     if (type)
       row["type"] = type;
     if (value)
       row["value"] = value;

     if (props_count > 0)
       row["properties"] = props;
   }

   return row;
}


function selectTab(tab)
{
  var tab_data = $('#micro_items');
  var tab_id = $('#tabs a[href=#micro]');

  if (tab==='#micro') {
    tab_data.show()
    tab_id.addClass('selected');
  } else {
    tab_data.hide()
    tab_id.removeClass('selected');
  }

  tab_data = $('#jsonld_items');
  tab_id = $('#tabs a[href=#jsonld]');

  if (tab==='#jsonld') {
    tab_data.show()
    tab_id.addClass('selected');
  } else {
    tab_data.hide()
    tab_id.removeClass('selected');
  }

  tab_data = $('#rdfa_items');
  tab_id = $('#tabs a[href=#rdfa]');

  if (tab==='#rdfa') {
    tab_data.show()
    tab_id.addClass('selected');
  } else {
    tab_data.hide()
    tab_id.removeClass('selected');
  }
}



function show_Data()
{
//  $('body').prepend("<div id='metadata_viewer' class='alignleft'/>");
//  $('#metadata_viewer').append(gData.micro_expanded);

//  $('.content').prepend("<div id='metadata_viewer' class='alignleft'/>");
/**/


  $('#micro_items').append("<div id='metadata_viewer' class='alignleft'/>");

  if (gData.micro_expanded)
      $('#micro_items #metadata_viewer').append(gData.micro_expanded);
  else
      $('#micro_items #metadata_viewer').append("<div id='metadata'><i>No data found.</i></div>");


  $('#jsonld_items').append("<div id='metadata_viewer' class='alignleft'/>");

  if (gData.jsonld_expanded)
      $('#jsonld_items #metadata_viewer').append(gData.jsonld_expanded);
  else
      $('#jsonld_items #metadata_viewer').append("<div id='metadata'><i>No data found.</i></div>");

  $('#rdfa_items').append("<div id='metadata_viewer' class='alignleft'/>");

  if (gData.rdfa_expanded)
      $('#rdfa_items #metadata_viewer').append(gData.rdfa_expanded);
  else
      $('#rdfa_items #metadata_viewer').append("<div id='metadata'><i>No data found.</i></div>");


  selectTab('#micro');


  if (!gData.micro_expanded)
    $('#tabs a[href=#micro]').hide();
  if (!gData.jsonld_expanded)
    $('#tabs a[href=#jsonld]').hide();
  if (!gData.rdfa_expanded)
    $('#tabs a[href=#rdfa]').hide();


  $('#tabs a[href=#micro]').click(function(){
      selectTab('#micro');
      return false;
  });
  $('#tabs a[href=#jsonld]').click(function(){
      selectTab('#jsonld');
      return false;
  });
  $('#tabs a[href=#rdfa]').click(function(){
      selectTab('#rdfa');
      return false;
  });

}


chrome.extension.onMessage.addListener(function(request, sender, sendResponse) 
{
  if (request.property == "status")
  {
//====================
    var show_action = request.data_exists;
    chrome.tabs.query({active:true}, function(tabs) {
       if (tabs.length>0) {
          if (show_action)
            chrome.pageAction.show(tabs[0].id);
          else
            chrome.pageAction.hide(tabs[0].id);
       }
      });
//======================
  } 
  else if (request.property == "items.json")
  {
    gData = $.parseJSON(request.data);
    gData.micro_expanded = null;
    gData.jsonld_expanded = null;
    gData.rdfa_expanded = null;
    gData.ttl_expanded = null;

    // Load up the template
    gData.micro_expanded = tmpl.converter.load(gData.microdata_jsonText);

    //// JSONLD
    if (gData.jsonld_text && gData.jsonld_text.length > 0)
    { 
      var jsonld_data = $.parseJSON(gData.jsonld_text);

      if (jsonld_data != null)
      {
        jsonld.expand(jsonld_data, function(err, expanded) 
          {
            var out = [];
            for(var i=0; i < expanded.length; i++)
            {
               var item = expanded[i];
               var row = jsonld_expand_item(item);
               out.push(row);

            }
            var ex_json = {"items": out};
            ////ADD Data to View
            gData.jsonld_expanded = tmpl.converter.load(JSON.stringify(ex_json, undefined, 2));
            show_Data();
          });
      }
      else
      {
        show_Data();
      }
    }
    else 
    {
      show_Data();
    }


  }
  else
  {
    sendResponse({}); /* stop */
  }

});