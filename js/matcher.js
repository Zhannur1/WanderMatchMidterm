$(function () {
    const $form = $("#matchForm");
    const $resultSection = $("#matchResults");
    const $resultList = $("#matchResultList");
    const $success = $("#formSuccess");

    function setError(fieldId, message) {
        const $field = $("#" + fieldId);
        const $error = $("#" + fieldId + "Error");

        $field.addClass("is-invalid");
        $error.text(message).show();
    }

    function clearError(fieldId) {
        $("#" + fieldId).removeClass("is-invalid");
        $("#" + fieldId + "Error").text("").hide();
    }

    function clearGroupError(errorId) {
        $("#" + errorId).text("").hide();
    }

    function validateForm() {
        let isValid = true;
        const name = $("#full-name").val().trim();
        const email = $("#email").val().trim();
        const phone = $("#phone").val().trim();
        const budget = Number($("#budget").val());
        const days = Number($("#trip-days").val());
        const dream = $("#dream-trip").val().trim();
        const style = $("input[name='travel-style']:checked").val();
        const interests = $("input[name='interests']:checked").length;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phonePattern = /^\+?[0-9\s()-]{10,18}$/;

        ["full-name", "email", "phone", "budget", "trip-days", "dream-trip"].forEach(clearError);
        clearGroupError("styleError");
        clearGroupError("interestsError");

        if (name.split(/\s+/).length < 2) {
            setError("full-name", "Enter your first and last name.");
            isValid = false;
        }

        if (!emailPattern.test(email)) {
            setError("email", "Enter a valid email address.");
            isValid = false;
        }

        if (!phonePattern.test(phone)) {
            setError("phone", "Use 10–18 digits and an optional +, spaces or brackets.");
            isValid = false;
        }

        if (!style) {
            $("#styleError").text("Choose one travel style.").show();
            isValid = false;
        }

        if (interests === 0) {
            $("#interestsError").text("Choose at least one interest.").show();
            isValid = false;
        }

        if (!Number.isFinite(budget) || budget < 300 || budget > 15000) {
            setError("budget", "Budget must be between $300 and $15,000.");
            isValid = false;
        }

        if (!Number.isInteger(days) || days < 2 || days > 30) {
            setError("trip-days", "Trip length must be from 2 to 30 days.");
            isValid = false;
        }

        if (dream.length < 20) {
            setError("dream-trip", "Describe your ideal trip in at least 20 characters.");
            isValid = false;
        }

        return isValid;
    }

    function getBudgetLevel(totalBudget, days) {
        const perDay = totalBudget / days;

        if (perDay < 110) {
            return "low";
        }

        if (perDay < 185) {
            return "medium";
        }

        return "high";
    }

    function scoreDestination(destination, preferences) {
        let score = 0;
        const reasons = [];

        if (destination.style === preferences.style) {
            score += 40;
            reasons.push("matches your " + preferences.style + " travel style");
        }

        const matchingInterests = destination.interests.filter(function (interest) {
            return preferences.interests.includes(interest);
        });

        score += matchingInterests.length * 18;

        if (matchingInterests.length > 0) {
            reasons.push("fits " + matchingInterests.join(" and "));
        }

        if (destination.budget === preferences.budgetLevel) {
            score += 20;
            reasons.push("fits your estimated daily budget");
        } else {
            const budgetOrder = ["low", "medium", "high"];
            const difference = Math.abs(
                budgetOrder.indexOf(destination.budget) - budgetOrder.indexOf(preferences.budgetLevel)
            );

            if (difference === 1) {
                score += 8;
            }
        }

        score += Math.round((destination.rating - 4.5) * 10);

        return {
            destination: destination,
            score: Math.min(score, 100),
            reasons: reasons.length ? reasons : ["offers a different experience worth exploring"]
        };
    }

    function createResultCard(match) {
        const destination = match.destination;

        return $("<article>")
            .addClass("match-card")
            .append(
                $("<img>")
                    .attr("src", destination.image)
                    .attr("alt", destination.name + ", " + destination.country)
            )
            .append(
                $("<div>")
                    .addClass("match-card-body")
                    .append($("<p>").addClass("match-score").text(match.score + "% match"))
                    .append($("<h3>").text(destination.name + ", " + destination.country))
                    .append($("<p>").text(destination.description))
                    .append($("<p>").addClass("match-reason").text("Why: " + match.reasons.join("; ") + "."))
                    .append($("<p>").text("Estimated daily cost: $" + destination.dailyCost))
            );
    }

    function showMatches() {
        const interests = $("input[name='interests']:checked")
            .map(function () {
                return this.value;
            })
            .get();

        const budget = Number($("#budget").val());
        const days = Number($("#trip-days").val());
        const preferences = {
            style: $("input[name='travel-style']:checked").val(),
            interests: interests,
            budgetLevel: getBudgetLevel(budget, days)
        };

        const matches = destinations
            .map(function (destination) {
                return scoreDestination(destination, preferences);
            })
            .sort(function (a, b) {
                return b.score - a.score;
            })
            .slice(0, 3);

        $resultList.empty();
        matches.forEach(function (match) {
            $resultList.append(createResultCard(match));
        });

        $resultSection.prop("hidden", false).stop(true, true).hide().fadeIn(250);
        $("html, body")
            .stop(true, true)
            .animate({ scrollTop: $resultSection.offset().top - 20 }, 550);
    }

    function fieldIsValid(fieldId) {
        const value = $("#" + fieldId).val().trim();

        if (fieldId === "full-name") {
            return value.split(/\s+/).filter(Boolean).length >= 2;
        }

        if (fieldId === "email") {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }

        if (fieldId === "phone") {
            return /^\+?[0-9\s()-]{10,18}$/.test(value);
        }

        if (fieldId === "budget") {
            const budget = Number(value);
            return Number.isFinite(budget) && budget >= 300 && budget <= 15000;
        }

        if (fieldId === "trip-days") {
            const days = Number(value);
            return Number.isInteger(days) && days >= 2 && days <= 30;
        }

        if (fieldId === "dream-trip") {
            return value.length >= 20;
        }

        return true;
    }

    $form.on("submit", function (event) {
        event.preventDefault();

        if (!validateForm()) {
            $success.hide();
            const $firstError = $(".is-invalid").first();
            if ($firstError.length) {
                $firstError.trigger("focus");
            }
            return;
        }

        showMatches();

        $success
            .stop(true, true)
            .hide()
            .text("Your preferences were processed successfully. Here are your best matches.")
            .fadeIn(250);

        this.reset();
        $(".form-control").removeClass("is-invalid");
        $(".field-error").hide().text("");
    });

    $form.on("input change", "input, textarea", function () {
        const id = this.id;

        if (id && fieldIsValid(id)) {
            clearError(id);
        }

        if (this.name === "travel-style" && $("input[name='travel-style']:checked").length) {
            clearGroupError("styleError");
        }

        if (this.name === "interests" && $("input[name='interests']:checked").length) {
            clearGroupError("interestsError");
        }
    });
});
