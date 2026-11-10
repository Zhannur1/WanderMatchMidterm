$(function () {

    $(document).on("keydown", function (event) {
        if (event.key === "Escape") {
            $(".temporary-message:visible")
                .stop(true, true)
                .fadeOut(150);
        }
    });
});
