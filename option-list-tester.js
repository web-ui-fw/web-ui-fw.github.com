(function($, undefined) {

    function elemName(elem) {
        var str = elem.tagName
            + ($(elem).attr("id") === undefined ? "" : ("#" + $(elem).attr("id")))
            + ($(elem).attr("class") === undefined ? ""
                : ("." + $(elem).attr("class").replace(" ", ".")));

        if (str.length > 40)
            str = str.substring(0, 40) + "...";

        return str;
    }

    $(document).bind("pagecreate", function(e) {
        if ($(e.target).attr("id") === "inspect-page")
            $(e.target).find("[href='#inspect-page']").remove();
        else {
            console.log("Adding button");
            var btn = $("<a href='#inspect-page' class='ui-btn-right' data-iconpos='left' data-icon='grid'>Test Options</a>")
                .appendTo($(":jqmData(role='header')"))
                .buttonMarkup()
                .bind("vclick", function() {
                    var page = $(this).closest(":jqmData(role='page')"),
                        widgetList = $("#widget-list").empty(),
                        optionList = $("#option-list");

                    if (optionList.data("optionlist"))
                        optionList.optionlist("destroy");

                    page.find("*").each(function() {
                        var widgets = $.todons.optionlist.widgetsFromElement(this);
                        if (widgets) {
                            widgetList.append("<li data-role='list-divider'>" + elemName(this) + "</li>");
                            $.each(widgets, function(key, value) {
                                $("<li><a>" + value.namespace + "." + value.widgetName + "</a></li>")
                                    .appendTo(widgetList)
                                    .find("a")
                                    .bind("vclick", function() {
                                        if (optionList.data("optionlist"))
                                            optionList.optionlist("destroy");
                                        optionList.optionlist();
                                        optionList.optionlist("option", "widget", value);
                                    });
                            });
                        }
                    });

                    if (widgetList.data("listview"))
                        widgetList.listview("refresh");
                });
        }
    });
})(jQuery);
