// Code starts here
function main() {
  data();
}

// Extract data from github in json format
function data() {
  // Github sources of information
  assignedStore_url = "https://gitlab.com/eduardo-dev/data-table-test/raw/master/assignedStore.json";
  brandDateData_url = "https://gitlab.com/eduardo-dev/data-table-test/raw/master/brandDateData.json";

  // Dictionary to handle all the data
  var info = {};

  var custom_control = d3.select(".custom-control");
  var check = custom_control.selectAll("input");

  check.on("change", checkChange);

  var selection = check.property("checked") ? "avg" : "sum";

  // First level - assignedStore data
  d3.json(assignedStore_url, function(store) {
    // console.log(store.data);
    store_data = store.data;

    // Second level - brandDateData
    d3.json(brandDateData_url, function(data) {

      // Gets each store name
      store_data.forEach(s => {
        info[s.identifier] = {};
        info[s.identifier]["title"] = {"sum" : s.name, "avg" : s.name};
      });

      // Information required for extraction from jsons
      var to_extract = ["peasants", "visitors", "attraction", "cabinet", "tickets", "persuasion",
        "revenue", "averageTicket", "items", "itemperTicket", "permanence", "permanenceCount",
        "averagePermanence", "uptime"
      ];

      data.forEach(d => {
        to_extract.forEach(t => {
          var sum = 0;
          var avg = 0;
          var up_cont = 0;
          try {
            info[d.identifier][t] = {};
            len = Object.keys(d[t]).length;

            Object.entries(d[t]).forEach(([key, value]) => {
              if (t == "uptime") {
                if (+value == 0) {
                  up_cont++;
                }
              } else {
                sum += +value;
              }
            });

            info[d.identifier][t][selection] = selection == "sum" ? sum : (sum / len).toFixed(2);

            if (t == "revenue") {
              info[d.identifier][t][selection] = info[d.identifier][t][selection].toFixed(2);
            }
            if (t == "uptime") {
              info[d.identifier][t][selection] = up_cont + " days";
            }

          } catch(error) {
            if (t == "attraction") {
              info[d.identifier][t][selection] = info[d.identifier]["visitors"][selection] / info[d.identifier]["peasants"][selection];
              info[d.identifier][t][selection] = (info[d.identifier][t][selection] * 100).toFixed(2) + "%";
            }
            if (t == "persuasion") {
              info[d.identifier][t][selection] = info[d.identifier]["tickets"][selection] / info[d.identifier]["visitors"][selection];
              info[d.identifier][t][selection] = (info[d.identifier][t][selection] * 100).toFixed(2) + "%";
            }
            if (t == "averageTicket") {
              info[d.identifier][t][selection] = info[d.identifier]["revenue"][selection] / info[d.identifier]["tickets"][selection];
              info[d.identifier][t][selection] = info[d.identifier][t][selection].toFixed(2);
            }
            if (t == "itemperTicket") {
              info[d.identifier][t][selection] = (info[d.identifier]["items"][selection] / info[d.identifier]["tickets"][selection]);
              info[d.identifier][t][selection] = info[d.identifier][t][selection].toFixed(2);
            }
            if (t == "averagePermanence") {
              info[d.identifier][t][selection] = (((info[d.identifier]["permanence"][selection]) * 100) / info[d.identifier]["permanenceCount"][selection]) / 6000000;
              info[d.identifier][t][selection] = info[d.identifier][t][selection].toFixed(2) + " min";
            }
          }

        });
      });

      tot = getTotals(info, selection);
      console.log(tot);

      update(info, tot, selection);
    });
  });
}

function getTotals(info, selection) {
  table_title = ["title", "peasants", "visitors",
    "attraction", "cabinet", "tickets",
    "persuasion", "revenue", "averageTicket",
    "items", "itemperTicket", "permanence",
    "permanenceCount", "averagePermanence",
    "uptime"
  ];

  var total_info = {}

  table_title.forEach(t => {
    if (t !== "title") {
      if (t == "attraction") {
        total_info[t] = total_info['visitors'] / total_info['peasants'];
        total_info[t] = (total_info[t] * 100).toFixed(2) + " %";
      } else if (t == "persuasion") {
        total_info[t] = total_info['tickets'] / total_info['visitors'];
        total_info[t] = (total_info[t] * 100).toFixed(2) + " %";
      } else if (t == "averageTicket") {
        total_info[t] = total_info['revenue'] / total_info['tickets'];
        total_info[t] = total_info[t].toFixed(2);
      } else if (t == "itemperTicket") {
        total_info[t] = total_info['items'] / total_info['tickets'];
        total_info[t] = total_info[t].toFixed(2);
      } else if (t == "averagePermanence") {
        total_info[t] = ((total_info['permanence'] * 100) / total_info['permanenceCount']) / 6000000;
        total_info[t] = total_info[t].toFixed(2) + " min";
      } else if (t == "uptime") {
        var tot = 0;
        var len = Object.keys(info).length;
        console.log(len);
        Object.entries(info).forEach(([key, value]) => {
          var val = value[t][selection].split(" ");
          console.log(val);
          tot += +val[0] / 30;
        });

        total_info[t] = ((tot / len) * 100).toFixed(2) + " %";
      } else {
        var tot = 0;
        Object.entries(info).forEach(([key, value]) => {
          tot += +value[t][selection];
        });

        total_info[t] = tot.toFixed(2);
      }

    } else {
      total_info['title'] = "Totales";
    }
  });

  return total_info;

}

function update(info, tot, selection) {

  var table = d3.select("#dataTable");
  table.selectAll("#new-row").remove();
  table.selectAll("#new-title").remove();
  table.selectAll("#new-foot").remove();

  table_title = ["title", "peasants", "visitors",
    "attraction", "cabinet", "tickets",
    "persuasion", "revenue", "averageTicket",
    "items", "itemperTicket", "averagePermanence",
    "uptime"
  ];
  // Set table titles
  var head = table.append("thead");
  var rowHead = head.append("tr");
  rowHead.attr("id", "new-title");
  table_title.forEach(title => {
    var cellHead = rowHead.append("th");
    cellHead.attr("id", title);
    cellHead.text(title);

  });

  var body = table.append("tbody");
  Object.entries(info).forEach(([key, value]) => {
    var row = body.append("tr");
    row.attr("id", "new-row");

    Object.entries(value).forEach(([key, value]) => {
      table_title.forEach(title => {
        if (key == title) {
          var cell = row.append("td");
          cell.attr("id", title);
          cell.text(value[selection]);
        }
      });

    });
  });

  var foot = table.append("tfoot");
  var rowFoot = foot.append("tr");
  rowFoot.attr("id", "new-foot");

  var to_erase = [];

  table_title.forEach(title => {
    var cellFoot = rowFoot.append("th");
    cellFoot.attr("id", title);
    cellFoot.text(tot[title]);
    if (tot[title] == 0){
      to_erase.push(title);
    }
  });

  to_erase.forEach(e => {
    table.selectAll(`#${e}`).remove();
  });
}

function checkChange() {
  data();
}

main();
