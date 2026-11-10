$(function () {
    const $grid = $("#destinationGrid");
    const $search = $("#destinationSearch");
    const $style = $("#styleFilter");
    const $sort = $("#sortDestinations");
    const $count = $("#resultCount");
    const $empty = $("#emptyState");

    function createDestinationCard(destination) {
        const interestText = destination.interests
            .map(function (interest) {
                return interest.charAt(0).toUpperCase() + interest.slice(1);
            })
            .join(" · ");

        return $("<article>")
            .addClass("story-card destination-card")
            .attr("data-id", destination.id)
            .append(
                $("<img>")
                    .attr("src", destination.image)
                    .attr("alt", destination.name + ", " + destination.country)
            )
            .append(
                $("<div>")
                    .addClass("story-text")
                    .append($("<p>").addClass("destination-region").text(destination.region))
                    .append($("<h2>").text(destination.name))
                    .append($("<p>").addClass("destination-country").text(destination.country))
                    .append($("<p>").text(destination.description))
                    .append(
                        $("<div>")
                            .addClass("destination-meta")
                            .append($("<span>").text("★ " + destination.rating))
                            .append($("<span>").text("$" + destination.dailyCost + "/day"))
                    )
                    .append($("<p>").addClass("interest-line").text(interestText))
                    .append(
                        $("<button>")
                            .attr("type", "button")
                            .addClass("details-button")
                            .attr("aria-expanded", "false")
                            .text("Why visit?")
                    )
                    .append(
                        $("<div>")
                            .addClass("story-details")
                            .attr("hidden", true)
                            .append($("<strong>").text("Best for: "))
                            .append(document.createTextNode(destination.bestFor))
                    )
            );
    }

    function getVisibleDestinations() {
        const query = $search.val().trim().toLowerCase();
        const selectedStyle = $style.val();

        let filtered = destinations.filter(function (destination) {
            const searchableText = (
                destination.name + " " +
                destination.country + " " +
                destination.region + " " +
                destination.interests.join(" ")
            ).toLowerCase();

            const matchesSearch = searchableText.includes(query);
            const matchesStyle = selectedStyle === "all" || destination.style === selectedStyle;

            return matchesSearch && matchesStyle;
        });

        if ($sort.val() === "rating") {
            filtered.sort(function (a, b) {
                return b.rating - a.rating;
            });
        }

        if ($sort.val() === "cost-low") {
            filtered.sort(function (a, b) {
                return a.dailyCost - b.dailyCost;
            });
        }

        if ($sort.val() === "cost-high") {
            filtered.sort(function (a, b) {
                return b.dailyCost - a.dailyCost;
            });
        }

        return filtered;
    }

    function renderDestinations() {
        const results = getVisibleDestinations();

        $grid.stop(true, true).fadeTo(120, 0.2, function () {
            $grid.empty();

            results.forEach(function (destination) {
                $grid.append(createDestinationCard(destination));
            });

            $count.text(results.length + (results.length === 1 ? " destination" : " destinations"));

            if (results.length === 0) {
                $empty.prop("hidden", false).stop(true, true).hide().fadeIn(180);
            } else {
                $empty.stop(true, true).hide().prop("hidden", true);
            }

            $grid.fadeTo(180, 1);
        });
    }

    $search.on("input", renderDestinations);
    $style.on("change", renderDestinations);
    $sort.on("change", renderDestinations);

    $search.on("keydown", function (event) {
        if (event.key === "Escape") {
            $(this).val("");
            renderDestinations();
        }
    });

    $grid.on("click", ".details-button", function () {
        const $button = $(this);
        const $details = $button.next(".story-details");
        const isOpen = $button.attr("aria-expanded") === "true";

        $button.attr("aria-expanded", String(!isOpen));

        if (isOpen) {
            $details
                .stop(true, true)
                .slideUp(220, function () {
                    $details.prop("hidden", true);
                });
        } else {
            $details
                .prop("hidden", false)
                .hide()
                .stop(true, true)
                .slideDown(220);
        }
    });

    renderDestinations();
});
